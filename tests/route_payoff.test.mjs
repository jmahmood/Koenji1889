import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {routeGeometry,pointOnRoute,trackSegment,endpointCoord} from '../src/ui/trackGeometry.js';
import {makeRouteTimeline,sampleRouteTimeline,recordedRouteRun} from '../src/ui/routePlayback.js';
import {ActionPresentation,actionCue} from '../src/ui/actionPresentation.js';
import {renderRouteResult,renderAcceptedFeedback,renderRouteOverlay} from '../src/components/RoutePlaybackOverlay.js';
import {GameEffects} from '../src/ui/gameAudio.js';
import {effectSamples,EFFECT_CUES} from '../src/ui/effectSounds.js';
const fixtures=JSON.parse(execFileSync('python3',['-c',`
import json,tempfile
from pathlib import Path
from server_bridge import KoenjiDatabase,create_fixture_room,apply_action,summarize_transition
out=[]
with tempfile.TemporaryDirectory() as tmp:
 db=KoenjiDatabase(Path(tmp)/'payoff.sqlite3')
 for preset in ('route_planning','route_network_3','route_network_4'):
  v=create_fixture_room(db,preset)['view']; before=v['state']
  action=dict(type='run_routes',player=before['current_player'],routes=v['route_quote']['routes'])
  after=apply_action(before,action); event=summarize_transition(before,after,action)
  v['state']=after;v['last_event']=event;out.append(v)
print(json.dumps(out))
`],{encoding:'utf8'}));
const view=fixtures[0],event=view.last_event;
function controller(){
 let now=0,next=0;const frames=new Map(),cues=[],stopped=[];
 const presentation=new ActionPresentation({now:()=>now,request:fn=>{frames.set(++next,fn);return next;},cancel:id=>frames.delete(id),effects:{play(kind,id){cues.push({kind,id});return {stop(){stopped.push(kind);}};}}});
 presentation.sync({room:'test',view:fixtures[0],mapVisible:true});
 return {presentation,frames,cues,stopped,advance(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());}};
}
test('accepted 2/3/4-train networks stitch continuously along drawn track, not hex centers',()=>{
 for(const v of fixtures)for(const route of v.last_event.route_run.routes) {
  const g=routeGeometry(v.state.board,route.vertices);assert.ok(g,route.train);assert.ok(g.length>0);
  assert.equal(g.stops.length,route.scored_stops.length);
  assert.deepEqual(g.stops.map(s=>s.vertex),route.scored_stops);
  assert.deepEqual(pointOnRoute(g,0).x,g.points[0].x);
  assert.ok(Math.abs(pointOnRoute(g,1).y-g.points.at(-1).y)<.001);
  const reverse=routeGeometry(v.state.board,[...route.vertices].reverse());assert.ok(Math.abs(reverse.length-g.length)<.001);
 }
});
test('curve geometry shares the renderer path and respects separate city nodes; disconnected routes fall back',()=>{
 const board={A1:{nodes:[],paths:[['e0','e1']]}};
 const g=routeGeometry(board,['A1:e0','A1:e1']);assert.ok(g.d.includes('Q'));
 const middle=pointOnRoute(g,.5),start=g.points[0],end=g.points.at(-1);
 assert.ok(Math.hypot(middle.x-(start.x+end.x)/2,middle.y-(start.y+end.y)/2)>1);
 assert.notDeepEqual(endpointCoord(10,10,'n0',2,34),endpointCoord(10,10,'n1',2,34));
 assert.equal(routeGeometry(board,['A1:e0','A1:e2']),null);
 assert.equal(routeGeometry({...board,L7:board.A1},['A1:e0','L7:e1']),null);
 assert.match(trackSegment(10,10,'e0','n0',1,34).d,/ L /);
});
test('all trains share one bounded journey, settle exactly, and retain exact accepted totals',()=>{
 for(const v of fixtures){
  const timeline=makeRouteTimeline(v.last_event.route_run,v.state.board);
  assert.equal(timeline.duration,2900);assert.ok(timeline.routes.at(-1).start+timeline.routes.at(-1).duration<2900);
  assert.equal(sampleRouteTimeline(timeline,0).done,false);
  assert.ok(sampleRouteTimeline(timeline,2900).routes.every(r=>r.done&&r.progress===1));
 }
});
test('duplicate response/poll never restarts; rerender sync preserves progress; skip cancels the travel loop',()=>{
 const c=controller(),p=c.presentation;
 assert.equal(p.receive(event,view.state.revision,view),true);c.advance(700);const progress=p.sample().routes[0].progress;
 assert.equal(p.receive(event,view.state.revision,view),false);
 p.sync({room:'test',view,mapVisible:true});assert.equal(p.sample().routes[0].progress,progress);
 assert.equal(c.cues.filter(c=>c.kind==='departure').length,1);
 p.settle();assert.equal(c.frames.size,0);assert.ok(p.sample().done);assert.ok(c.stopped.includes('wheels'));
 p.replay();c.advance(700);assert.equal(c.cues.filter(c=>c.kind==='departure').length,2);
});
test('completion stops wheels and schedules no more frames; history stays silent and motion-off settles',()=>{
 const c=controller(),p=c.presentation;p.receive(event,view.state.revision,view);c.advance(400);c.advance(3000);
 assert.equal(c.frames.size,0);assert.ok(c.stopped.includes('wheels'));assert.ok(p.sample().done);
 const count=c.cues.length;p.history(event,view.state.revision,view,{animate:true});c.advance(500);assert.equal(c.cues.length,count);
 p.sync({room:'test',view,live:false,mapVisible:true,motion:false});assert.ok(p.sample().done);assert.equal(c.frames.size,0);
});
test('newer revision, hidden page and room change cancel travel without delaying the next accepted action',()=>{
 const c=controller(),p=c.presentation;p.receive(event,view.state.revision,view);c.advance(400);
 const next=structuredClone(view);next.state.revision++;next.state.operating_turn.dividend=true;
 const dividend={type:'dividend',revenue:90,payout:true,corporation:'IR'};
 p.receive(dividend,next.state.revision,next);p.sync({room:'test',view:next,mapVisible:true});
 assert.equal(c.frames.size,0);assert.equal(p.feedback.event.type,'dividend');assert.equal(c.cues.at(-1).kind,'cash');
 p.hidden();assert.equal(c.frames.size,0);p.setRoom('other');assert.equal(p.job,null);assert.equal(p.seen.size,0);
});
test('catch-up is static and silent; old journals cannot borrow per-train recommendations',()=>{
 const c=controller(),p=c.presentation;p.receive(event,view.state.revision,view,{animate:false});assert.equal(c.cues.length,0);assert.ok(p.sample().done);
 const old=structuredClone(view);old.history_events=[];delete old.last_event;
 const run=recordedRouteRun(old);assert.equal(run.revenue,90);assert.ok(run.routes.every(r=>r.revenue===undefined));
 const html=renderRouteResult(p.job,p.sample(),view);assert.match(html,/¥90/);assert.match(html,/Awaiting dividend decision/);assert.doesNotMatch(html,/Personal purse/);
 assert.match(renderRouteOverlay(p.job),/data-journey-engine/);
});
test('changed track disables traversal and a newer unrecorded claim never borrows an older receipt',()=>{
 const changed=structuredClone(view),run=structuredClone(event.route_run);
 const hex=run.routes[0].vertices[0].split(':')[0];changed.state.board[hex].paths=[];
 const timeline=makeRouteTimeline(run,changed.state.board);assert.equal(timeline.routes[0].geometry,null);
 const c=controller();c.presentation.setRun(run,changed,{animate:true,identity:'changed'});assert.ok(c.presentation.sample().done);
 assert.doesNotMatch(renderRouteResult(c.presentation.job,c.presentation.sample(),changed),/Watch again/);
 const old=structuredClone(view);delete old.last_event.route_run;old.history_events=[{revision:0,event}];
 assert.ok(recordedRouteRun(old).routes.every(r=>r.revenue===undefined));
});
test('distinct cues reflect actual consequences and financial receipts use accepted account destinations',()=>{
 assert.equal(renderAcceptedFeedback({event:{type:'lay_tile',corporation:'IR'}}),'');
 assert.equal(actionCue({type:'lay_tile'}),'track');assert.equal(actionCue({type:'place_token'}),'station');
 assert.equal(actionCue({type:'dividend',payout:true,revenue:90}),'cash');assert.equal(actionCue({type:'dividend',payout:false,revenue:90}),'safe');
 assert.equal(actionCue({type:'dividend',payout:true,revenue:0}),'ledger');assert.equal(actionCue({type:'buy_train',rusted_trains:[{}]}),'warning');
 const html=renderAcceptedFeedback({event:{type:'dividend',revenue:90,payout:true,account_deltas:[{name:'IR',recipient:'IR',destination:'treasury',before:100,after:118,amount:18}],dividend_allocation:{treasury:18,ipo_retained_by_bank:27},revenue_revision:{before:80,after:90}}});
 assert.match(html,/Company treasury/);assert.match(html,/\+¥18/);assert.match(html,/¥100 → ¥118/);assert.match(html,/Revenue revised: ¥80 → ¥90/);assert.match(html,/IPO retained by bank: ¥27/);
});
function audio(){
 const sources=[],ducks=[];const c={state:'running',currentTime:0,destination:{},resume:()=>Promise.resolve(),
  createBuffer:(_n,length)=>{const pcm=new Float32Array(length);return {getChannelData:()=>pcm};},
  createGain:()=>({connect(){},disconnect(){},gain:{value:0,setValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}}}),
  createBufferSource:()=>{const source={connect(){},disconnect(){},start(){},stop(){}};sources.push(source);return source;}};
 const effects=new GameEffects({contextFactory:()=>c,onDuck:(id,active)=>ducks.push({id,active})});effects.enabled=true;
 return {effects,c,sources,ducks};
}
test('effects bound voices, deduplicate, apply mute/volume immediately, and release music ducking',()=>{
 const f=audio();f.effects.play('departure','one');f.effects.play('departure','one');assert.equal(f.sources.length,1);
 assert.deepEqual(f.ducks,[{id:'one',active:true}]);
 const wheel=f.effects.play('wheels','wheel');wheel.stop();assert.equal(f.effects.voices.has('wheel'),false);
 for(let i=0;i<12;i++)f.effects.play('station',String(i));assert.ok(f.effects.voices.size<=5);
 assert.ok(f.ducks.some(d=>d.id==='one'&&!d.active));f.effects.setVolume(.3);f.effects.toggle();assert.equal(f.effects.voices.size,0);
 f.effects.play('departure','muted');assert.equal(f.effects.voices.size,0);assert.ok(f.effects.seen.has('muted'));
});
test('all original sound assets are finite, bounded PCM with silent ends',()=>{
 for(const kind of Object.keys(EFFECT_CUES)){const pcm=effectSamples(kind);assert.ok(pcm.length>0);assert.ok(pcm.every(v=>Number.isFinite(v)&&Math.abs(v)<=.95));assert.equal(Math.abs(pcm[0]),0);assert.ok(Math.abs(pcm.at(-1))<.00001);}
});

test('dividend receipt keeps balances and bank allocation in collapsed details',()=>{
 const html=renderAcceptedFeedback({event:{type:'dividend',corporation:'IR',payout:true,revenue:90,account_deltas:[{name:'<Daisuke>',destination:'purse',amount:27,before:140,after:167}],dividend_allocation:{treasury:0,ipo_retained_by_bank:45},market_movements:[{corporation:'IR',price_before:75,price_after:80,before:1,after:2}]}});
 const [summary,details]=html.split('<details class="dividend-receipt-details">');
 assert.match(summary,/&lt;Daisuke&gt;/);assert.match(summary,/\+¥27/);assert.match(summary,/Share price ¥75 → ¥80/);
 assert.doesNotMatch(summary,/Personal purse|¥140|IPO retained/);
 assert.match(details,/Personal purse: ¥140 → ¥167/);assert.match(details,/IPO retained by bank: ¥45/);
 assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|>)/);
 assert.match(html,/data-dismiss-payoff-receipt/);
});
