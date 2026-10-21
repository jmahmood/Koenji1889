import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {victoryCelebration,renderVictoryCelebration} from '../src/ui/victoryCelebration.js';
import {buildEventSequence} from '../src/ui/characterEvents.js';
import {CharacterDirector} from '../src/ui/characterDirector.js';

const view={state:{player_order:['p1','p2'],players:{p1:{name:'Alice <A>'},p2:{name:'Bob'}},corporations:{}},members:{p1:{member_id:'a'},p2:{member_id:'b'}},viewer:{player_id:'p1'}};
const event={type:'dividend',actor_id:'p2',finished:true,winners:['p1'],label:'Game complete'};
function playback(){let now=0,scheduled;const director=new CharacterDirector({now:()=>now,schedule:fn=>{scheduled=fn;return 1;},cancel:()=>{}});director.setRoom('club');return {director,advance(ms){now+=ms;scheduled?.();}};}

test('both mascots celebrate only confirmed winners; bank exhaustion is not a completed game',()=>{
 for(const e of [{bank_end_pending:true,winners:['p1']},{finished:false,winners:['p1']},{finished:true,winners:[]},{finished:true,winners:['missing']}])assert.equal(victoryCelebration(e,view),null);
 const sequence=victoryCelebration(event,view);assert.equal(sequence.frames.reduce((n,f)=>n+f.ms,0),4350);
 assert.deepEqual(sequence.frames.map(f=>f.victory.pose),[0,1,2,3,4,1,2,5]);
 assert.equal(sequence.frames[0].actors.a.pose,'triumphant');assert.equal(sequence.frames[0].actors.b,undefined);
});
test('ties honor every winning member and identify the current viewer without inventing a win',()=>{
 const sequence=victoryCelebration({...event,winners:['p1','p2','p1']},view);
 assert.deepEqual(sequence.frames[0].victory.winners,['p1','p2']);assert.equal(sequence.frames[0].actors.b.pose,'triumphant');
 const p={lanes:new Map([['game',{active:{}}]]),sample:()=>({frame:sequence.frames[3]})};
 const html=renderVictoryCelebration(view,p,{atTable:true});assert.match(html,/You share the win!/);assert.match(html,/Alice &lt;A&gt; &amp; Bob/);assert.match(html,/high-five/);
 const other=renderVictoryCelebration({...view,viewer:{player_id:'observer'}},p);assert.doesNotMatch(other,/You win|You share/);assert.match(other,/share the win!/);
 const single=renderVictoryCelebration(view,{...p,sample:()=>({frame:victoryCelebration(event,view).frames[0]})});assert.match(single,/You win!/);
});
test('final celebration replaces money or setback animation and cannot be delayed by an old queue',()=>{
 const sequence=buildEventSequence({...event,type:'bankrupt',cash_receipts:[{recipient:'p1',amount:90,destination:'purse'}]},view);
 assert.ok(sequence.frames.every(f=>f.victory&&!f.kemonito&&!f.kemalito));
 const {director,advance}=playback();
 director.accepted({type:'buy_shares',actor_id:'p2',corporation:'IR',percent:10},1,view);
 director.accepted({type:'buy_shares',actor_id:'p2',corporation:'IR',percent:10},2,view);
 assert.equal(director.playback.lanes.get('game').queue.length,1);
 director.accepted(event,3,view);assert.equal(director.playback.lanes.get('game').active.id,'revision:3');assert.equal(director.playback.lanes.get('game').queue.length,0);
 advance(600);const before=director.playback.lanes.get('game').active;
 assert.equal(director.accepted(event,3,view),false);assert.equal(director.playback.lanes.get('game').active,before);
 advance(5000);assert.equal(renderVictoryCelebration(view,director.playback),'');
});
test('Motion Off and historical inspection show the shared high-five still; skip and room change remove it',()=>{
 const before=structuredClone(view),{director}=playback();
 director.playback.setMotionEnabled(false);director.accepted(event,1,view);
 const html=renderVictoryCelebration(view,director.playback,{atTable:true});assert.match(html,/is-still/);assert.match(html,/data-victory-pose="3"/);assert.match(html,/You win!/);
 director.playback.clear('game');assert.equal(renderVictoryCelebration(view,director.playback),'');
 director.history(event,1,view);assert.match(renderVictoryCelebration(view,director.playback),/is-still/);
 director.setRoom('other');assert.equal(renderVictoryCelebration(view,director.playback),'');assert.deepEqual(view,before);
});

test('every celebration pose uses an isolated image so neighboring hands and shoes cannot tile into it',async()=>{
 const frames=victoryCelebration(event,view).frames;
 const sources=new Set();
 for(const frame of frames){
  const html=renderVictoryCelebration(view,{lanes:new Map([['game',{active:{}}]]),sample:()=>({frame})});
  const src=html.match(/<img class="mascot-victory-sprites" src="([^"]+)"/)[1];
  sources.add(src);
  assert.doesNotMatch(html,/background-position|victory-pair\.webp/);
  assert.ok((await stat(new URL('../public'+src,import.meta.url))).size>0);
 }
 assert.equal(sources.size,6);
});
