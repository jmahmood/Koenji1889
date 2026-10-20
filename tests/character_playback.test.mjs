import test from 'node:test';
import assert from 'node:assert/strict';
import {CharacterPlayback} from '../src/ui/characterController.js';
import {CharacterDirector} from '../src/ui/characterDirector.js';
import {buildEventSequence} from '../src/ui/characterEvents.js';
import {renderCharacter, setCharacterPresentationResolver, refreshCharacterSlots} from '../src/scene/Character.js';
import {renderClubRoomScene} from '../src/scene/ClubRoom.js';

function clock() {
  let time=0,serial=0;
  const tasks=new Map();
  return {now:()=>time,schedule:(fn,ms)=>{const id=++serial;tasks.set(id,{fn,at:time+ms});return id;},
    cancel:id=>tasks.delete(id),pending:()=>tasks.size,
    advance(ms){const end=time+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next || next[1].at>end)break;time=next[1].at;tasks.delete(next[0]);next[1].fn();}time=end;}};
}
const sequence={label:'Accepted',frames:[{ms:600,actors:{a:{pose:'wave'}}},{ms:700,actors:{a:{pose:'bow'}}}],
  staticFallback:{actors:{a:{pose:'idle'}}}};
const view={members:{p1:{member_id:'a'},p2:{member_id:'b'}},club:{notes:[],stamps:{}}};

test('held cuts advance once at boundaries, duplicate response/poll does not restart, then return to idle',()=>{
  const c=clock(),p=new CharacterPlayback(c);p.setRoom('one');
  assert.ok(p.enqueue(sequence,{id:'revision:1'}));c.advance(599);assert.equal(p.poseFor('a').pose,'wave');
  assert.equal(p.enqueue(sequence,{id:'revision:1'}),false);
  c.advance(1);assert.equal(p.poseFor('a').pose,'bow');c.advance(700);assert.equal(p.poseFor('a'),null);
  assert.equal(c.pending(),0);
});
test('queues are bounded, arrival wins only for its member, room change cancels all work',()=>{
  const c=clock(),p=new CharacterPlayback({...c,maxQueued:2});p.setRoom('one');
  for(let i=1;i<=5;i++)p.enqueue(sequence,{id:`revision:${i}`});
  assert.deepEqual(p.lanes.get('game').queue.map(j=>j.id),['revision:4','revision:5']);
  p.enqueue({...sequence,frames:[{ms:1000,actors:{b:{pose:'tea'}}}]},{id:'arrival:1',lane:'arrival'});
  assert.equal(p.poseFor('a').pose,'wave');assert.equal(p.poseFor('b').pose,'tea');
  p.setRoom('two');assert.equal(c.pending(),0);assert.equal(p.poseFor('a'),null);
  assert.ok(p.enqueue(sequence,{id:'revision:1'}));
});
test('Motion Off cancels timers and pending work, keeps a static fallback, On never replays backlog',()=>{
  const c=clock(),p=new CharacterPlayback(c);p.enqueue(sequence,{id:'1'});p.enqueue(sequence,{id:'2'});
  p.setMotionEnabled(false);assert.equal(c.pending(),0);assert.equal(p.poseFor('a').pose,'idle');
  p.enqueue(sequence,{id:'3'});c.advance(100000);assert.equal(p.poseFor('a').pose,'idle');
  p.setMotionEnabled(true);assert.equal(p.poseFor('a'),null);assert.equal(c.pending(),0);
  assert.equal(p.enqueue(sequence,{id:'3'}),false);
});
test('production props bind accepted facts, retain zero and never inherit example IR/80/tile values',()=>{
  for(const event of [
    {type:'buy_shares',actor_id:'p1',corporation:'AR',percent:20,par_set:65,label:'AR purchase'},
    {type:'lay_tile',actor_id:'p1',tile:'7',hex:'E2',label:'Track laid'},
    {type:'dividend',actor_id:'p1',corporation:'AR',revenue:0,payout:true},
  ]){
    const text=JSON.stringify(buildEventSequence(event,view));
    assert.doesNotMatch(text,/IR|#439|¥450|¥80|TR \/ ER/);
  }
  assert.match(JSON.stringify(buildEventSequence({type:'dividend',actor_id:'p1',revenue:0,payout:true},view)),/¥0/);
});
test('auction pass targets actual winners; presidency, phase, rust and results use explicit facts',()=>{
  const award=buildEventSequence({type:'pass',actor_id:'p1',private_awards:[{company:'ER',player_id:'p2',price:40}]},view);
  assert.equal(award.frames[0].actors.b.pose,'receive');assert.equal(award.frames[0].actors.a,undefined);
  assert.equal(buildEventSequence({type:'pass',actor_id:'p1',animation:'private_acquired'},view),null);
  const phase=buildEventSequence({type:'buy_train',actor_id:'p1',train_type:'3',phase_before:'2',phase_after:'3'},view);
  assert.doesNotMatch(JSON.stringify(phase),/rusted|2-TRAIN|UTF/);
  const change=buildEventSequence({actor_id:'p1',presidency_changes:[{corporation:'AR',from:'p1',to:'p2'}]},view);
  assert.equal(change.frames[0].actors.a.pose,'offer');assert.equal(change.frames[0].actors.b.pose,'receive');
  const rust=buildEventSequence({actor_id:'p1',rusted_trains:[{train:'2-0',type:'2',corporation:'AR',president:'p2'}]},view);
  assert.equal(rust.staticFallback.actors.b.expression,'concerned');
  const finish=buildEventSequence({actor_id:'p1',finished:true,winners:['p2']},view);
  assert.equal(finish.frames[0].actors.b.pose,'triumphant');
});
test('social baseline is quiet; new authenticated activity deduplicates; rewind and replay are independent of live dedup',()=>{
  const c=clock(),d=new CharacterDirector(c);d.setRoom('room');d.club(view);
  const updated={...view,club:{...view.club,notes:[{id:'note',actor_id:'p2',author:'Same name'}]}};
  d.club(updated);assert.equal(d.playback.poseFor('b').pose,'tea');d.club(updated);
  assert.equal(d.playback.lanes.get('social').queue.length,0);
  const event={type:'buy_shares',actor_id:'p1',corporation:'AR',percent:20};
  d.accepted(event,1,view);d.history(event,1,view);assert.equal(d.playback.poseFor('a').pose,'certificate');
  d.history(event,1,view,{animate:true});assert.notEqual(d.playback.poseFor('a').key,'revision:1:0');
  d.playback.clear('game');assert.equal(d.accepted(event,1,view),false);
  d.arrival({kind:'returned',member_id:'a',id:1});assert.equal(d.playback.lanes.has('arrival'),false);
});
test('renderer uses stable member IDs, preserves base pose and patches only opted-in slots',()=>{
  setCharacterPresentationResolver(id=>id==='b'?{pose:'shock',expression:'shock',key:'rev:1:0'}:null);
  assert.match(renderCharacter({face:'reference-08'},{memberId:'b',name:'A <B>',surface:'portrait'}),/data-pose="shock"/);
  assert.match(renderCharacter({face:'reference-08'},{memberId:'a',pose:'thinking'}),/data-pose="thinking"/);
  const slot={dataset:{characterBase:JSON.stringify({memberId:'b',name:'A <B>',surface:'portrait'}),
    face:'reference-08',clothes:'indigo-haori',characterFrame:''},outerHTML:''};
  const root={querySelectorAll(selector){assert.equal(selector,'[data-character-member]');return [slot];}};
  refreshCharacterSlots(root);assert.match(slot.outerHTML,/data-character-frame="rev:1:0"/);
  assert.match(slot.outerHTML,/A &lt;B&gt;/);assert.doesNotMatch(slot.outerHTML,/undefined|NaN/);
  slot.dataset.characterFrame='rev:1:0';
  setCharacterPresentationResolver(()=>null);refreshCharacterSlots(root);assert.match(slot.outerHTML,/data-pose="idle"/);
});

test('table renders every actual seat for 2, 5 and 6 players, retaining distinct member identities',()=>{
  for(const count of [2,5,6]) {
    const order=Array.from({length:count},(_,i)=>`p${i+1}`);
    const players=Object.fromEntries(order.map(pid=>[pid,{id:pid,name:`Member <${pid}>`,cash:420}]));
    const members=Object.fromEntries(order.map(pid=>[pid,{member_id:`person:${pid}`,appearance:{face:'reference-03',clothes:'plum-kimono'}}]));
    const state={players,player_order:order,round:'auction',phase:'2',revision:0,current_player:'p1',corporations:{},privates:{},board:{},auction:{}};
    const html=renderClubRoomScene({viewRevision:0,liveRevision:0},{state,members,viewer:{player_id:'p1'},club:{notes:[],stamps:{}}});
    assert.equal((html.match(/class="seated-sprite-slot /g) || []).length,count);
    assert.equal((html.match(/class="seated-friend-overlay /g) || []).length,count);
    for(const pid of order) assert.ok(html.includes(`data-character-member="person:${pid}"`));
    assert.match(html,new RegExp(`--seated-count:${count}`));
    assert.doesNotMatch(html,/Member <p[1-6]>/);
  }
});
