import test from 'node:test';
import assert from 'node:assert/strict';
import {TurnReminder,turnIdentity,renderConfirmation,decisionDescription,renderTurnStatus} from '../src/ui/playtestUX.js';
import {translate,translations} from '../src/ui/i18n.js';
import {renderVintagePrivateCard} from '../src/components/PrivateCompanyCards.js';
import {renderPrivateZoomModal} from '../src/components/Modals.js';
import {GameAudioManager,GameEffects,makeSeamlessLoop} from '../src/ui/gameAudio.js';
const view={viewer:{player_id:'p1'},prices:{IR:100},legal_actions:{player:'p1'},state:{revision:4,round:'operating',stock_round:1,or_number:1,current_player:'p1',current_corporation:'IR',players:{p1:{name:'Daisuke',cash:200}},corporations:{IR:{id:'IR',president:'p1',cash:600,par:100,ipo:30,pool:20,holdings:{p1:50}}},operating_turn:{step:'dividend',revenue:100}}};
const app=()=>({roomCode:'one',token:'private',liveRevision:4,viewRevision:4});
test('only the active live seat receives a once-per-turn idle reminder, independent of polls',()=>{
 let now=0,reminders=0,turns=0;
 const reminder=new TurnReminder({now:()=>now,notify:()=>reminders++,onTurn:()=>turns++});
 const a=app();reminder.update(a,view);assert.equal(turns,1);
 now=19000;reminder.update(a,view);assert.equal(reminder.tick(20),false);
 reminder.activity();now=38000;assert.equal(reminder.tick(20),false);
 now=40000;assert.equal(reminder.tick(20,true),false);assert.equal(reminder.tick(20),true);
 now=100000;reminder.tick(20);assert.equal(reminders,1);
 assert.equal(turnIdentity({...a,viewRevision:3},view),null);
 assert.equal(turnIdentity(a,{...view,viewer:{player_id:'p2'}}),null);
 assert.equal(turnIdentity({...a,isPlayingReplay:true},view),null);
 reminder.update({...a,viewRevision:3},view);assert.equal(reminder.tick(20),false);
 assert.match(renderTurnStatus(a,view),/Company treasury[\s\S]*¥600/);
});
test('confirmation shows exact allocations and stale revisions disable submission',()=>{
 const a=app();a.pendingDecision={action:{type:'dividend',payout:true},room:a.roomCode,token:a.token,revision:4};
 assert.match(renderConfirmation(a,view),/Market pool → company: ¥20 · IPO retained by bank: ¥30/);
 assert.match(renderConfirmation({...a,liveRevision:5},view),/data-commit-decision disabled/);
 assert.match(renderConfirmation({...a,token:'other'},view),/data-commit-decision disabled/);
 const [title,cash]=decisionDescription({type:'buy_shares',corporation:'IR',source:'ipo',percent:10},view);
 assert.match(title,/10% IR/);assert.match(cash,/¥200 → ¥100/);
});
test('card zoom is a sibling button and enlarged card retains artwork and rules without auction actions',()=>{
 const priv={id:'TR',name:'Takamatsu',value:20,revenue:5};
 const html=renderVintagePrivateCard(priv,{interactive:true});
 assert.match(html,/<\/button>\s*<button[^>]+data-private-zoom="TR"/);
 const zoom=renderPrivateZoomModal({privateDetailsId:'TR'}, {state:{round:'auction',privates:{TR:priv}}});
 assert.match(zoom,/private-zoom-modal/);assert.match(zoom,/vintage-private-card/);assert.match(zoom,/<svg/);
 assert.doesNotMatch(zoom,/data-select-private|data-auction-action|data-private-zoom/);
});
test('locale translates core decisions and preserves IDs, cash and the English original',()=>{
 assert.ok(translations.size>300);
 assert.equal(translate('Company treasury','ja'),'会社資金');
 assert.equal(translate('Stock Round 2','ja'),'株式ラウンド 2');
 assert.equal(translate('End IR Turn','ja'),'IRの手番を終了');
 assert.equal(translate('¥100 · IR · E2','ja'),'¥100 · IR · E2');
 assert.equal(translate('Your turn','en'),'Your turn');
});
function fakeAudio(){
 const starts=[],stops=[],fades=[];
 const context={state:'suspended',currentTime:10,destination:{},resume(){this.state='running';return Promise.resolve();},decodeAudioData:async()=>({duration:58.67}),
 createBufferSource(){return {connect(){},start(time){starts.push(time);},stop(time){stops.push(time);}};},
 createGain(){return {connect(){},gain:{setValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(...args){fades.push(args);}}};}};
 return {context,starts,stops,fades};
}
test('audio uses one shared loop clock and smooth scheduled stops; disabling never loses saved intent',async()=>{
 const f=fakeAudio(),manager=new GameAudioManager({contextFactory:()=>f.context,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
 manager.enabled=true;manager.setPreset('stock');await manager.playAll();
 assert.equal(manager.sources.length,4);assert.equal(new Set(f.starts).size,1);
 assert.ok(manager.sources.every(source=>source.loop&&source.loopEnd===58.5));assert.equal(manager.isPlaying,true);
 manager.setPreset('operations');assert.ok(f.fades.length>=8);
 manager.pauseAll();assert.equal(manager.sources.length,0);assert.ok(f.stops.every(time=>time>f.context.currentTime));assert.equal(manager.enabled,true);
 await manager.playAll();assert.equal(manager.sources.length,4);
});
test('failed audio loading is retried on interaction; disabling while loading creates no sources',async()=>{
 const f=fakeAudio();let fail=true;
 const manager=new GameAudioManager({contextFactory:()=>f.context,fetchAudio:async()=>({ok:!fail,arrayBuffer:async()=>new ArrayBuffer(1)})});manager.enabled=true;
 await manager.playAll();assert.equal(manager.isPlaying,false);assert.equal(manager.sources.length,0);
 fail=false;await manager.playAll();assert.equal(manager.sources.length,4);
 manager.pauseAll();manager.buffers=null;
 const releases=[];manager.fetchAudio=()=>new Promise(resolve=>releases.push(resolve));
 const pending=manager.playAll();manager.enabled=false;manager.pauseAll();
 assert.equal(releases.length,4);
 for(const release of releases)release({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
 await pending;assert.equal(manager.sources.length,0);assert.equal(manager.isPlaying,false);
 // A future gesture can restart cleanly without changing the remembered preset.
 manager.enabled=true;await manager.playAll();assert.equal(manager.sources.length,4);
});
test('effects deduplicate accepted events even while muted',()=>{
 const effects=new GameEffects({contextFactory:()=>{throw Error('No audio in test');}});effects.enabled=false;
 effects.play('action','revision:1');effects.play('action','revision:1');assert.equal(effects.seen.size,1);
 effects.setVolume(2);assert.equal(effects.volume,1);
});

test('loop seam blends into the exact head continuation without altering the head',()=>{
 const samples=Float32Array.from({length:1000},(_,index)=>index/1000);
 const originalHead=samples.slice(0,120);
 const buffer={duration:1,length:1000,sampleRate:1000,numberOfChannels:1,getChannelData:()=>samples};
 makeSeamlessLoop(buffer,1,.12);
 assert.deepEqual(samples.slice(0,120),originalHead);
 assert.equal(samples[999],originalHead[119]);
 assert.ok(Math.abs(samples[999]-samples[120])<.002);
});
test('autoplay rejection stays pending and the first permitted gesture resumes the same four stems',async()=>{
 const f=fakeAudio();let blocked=true;
 f.context.resume=function(){if(blocked)return Promise.reject(Error('NotAllowedError'));this.state='running';return Promise.resolve();};
 const manager=new GameAudioManager({contextFactory:()=>f.context,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});manager.enabled=true;
 await manager.playAll();assert.equal(manager.isPlaying,false);assert.equal(manager.status,'waiting');assert.equal(manager.sources.length,4);
 blocked=false;await manager.playAll();assert.equal(manager.isPlaying,true);assert.equal(f.starts.length,4);
});
test('background policy fades and stops music, then resumes without changing enabled preference',async()=>{
 const previous=globalThis.document,f=fakeAudio();
 globalThis.document={hidden:false};
 try{
  const manager=new GameAudioManager({contextFactory:()=>f.context,fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});manager.enabled=true;
  await manager.playAll();globalThis.document.hidden=true;manager.visibilityChanged();
  assert.equal(manager.sources.length,0);assert.equal(manager.enabled,true);
  await manager.playAll();assert.equal(manager.sources.length,0);
  globalThis.document.hidden=false;await manager.playAll();assert.equal(manager.sources.length,4);
 }finally{globalThis.document=previous;}
});
test('helper handoffs use exact receipts, and held history retains every recipient without mutating balances',async()=>{
 const {buildEventSequence}=await import('../src/ui/characterEvents.js');
 const receipts=[{recipient:'p1',destination:'purse',amount:50,name:'Daisuke'},{recipient:'IR',destination:'treasury',amount:20,name:'Iyo Railway'}];
 const event={type:'dividend',actor_id:'p1',corporation:'IR',payout:true,revenue:100,cash_receipts:receipts};
 const before=structuredClone(view.state),sequence=buildEventSequence(event,view);
 assert.deepEqual(sequence.staticFallback.receipts,receipts);
 const deliveries=sequence.frames.filter(frame=>frame.receipt);
 assert.equal(deliveries.length,13);assert.equal(deliveries[0].kemonito.pose,0);
 const handoffs=deliveries.filter(frame=>frame.kemonito.pose===4);
 assert.equal(handoffs[0].actors.p1.props.label,'¥50');assert.equal(handoffs[1].actors.p1.props.label,'¥20');
 assert.deepEqual(view.state,before);
});

test('out-of-turn private-action authority does not impersonate the active turn or allow end-turn confirmation',()=>{
 const observerView={...view,viewer:{player_id:'p2'},legal_actions:{player:'p2',active_player:'p1',types:['lay_tile']}};
 const a=app();assert.equal(turnIdentity(a,observerView),null);
 const html=renderTurnStatus(a,observerView);assert.doesNotMatch(html,/Your turn|turn-go/);assert.match(html,/Daisuke/);
 a.pendingDecision={action:{type:'end_turn'},revision:4,room:a.roomCode,token:a.token};
 assert.match(renderConfirmation(a,observerView),/This action is unavailable for this seat/);
 assert.match(renderConfirmation(a,observerView),/data-commit-decision disabled/);
});
test('staged trains never appear as owned engines when the company owns zero or one',async()=>{
 const {renderRoundhouse}=await import('../src/components/TrainDesk.js');
 const v=structuredClone(view);v.state.phase='2';v.train_limit=4;
 v.state.corporations.IR.trains=[];
 v.state.trains={'2-0':{type:'2',price:80,owner:'depot'},'2-1':{type:'2',price:80,owner:'depot'}};
 let html=renderRoundhouse(v,{type:'buy_train',train:'2-0'});
 assert.match(html,/Owned now: 0/);assert.match(html,/No trains owned/);assert.match(html,/After purchase: 1 \/ 4/);
 assert.equal((html.match(/class="owned-engine"/g)||[]).length,0);
 v.state.corporations.IR.trains=['2-0'];v.state.trains['2-0'].owner='IR';
 html=renderRoundhouse(v,{type:'buy_train',train:'2-1'});
 assert.match(html,/Owned now: 1/);assert.match(html,/After purchase: 2 \/ 4/);
 assert.equal((html.match(/class="owned-engine"/g)||[]).length,1);
});
