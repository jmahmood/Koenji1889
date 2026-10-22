import test from 'node:test';
import assert from 'node:assert/strict';
import {dividendMilestone,renderDividendMilestone} from '../src/ui/dividendMilestones.js';
import {buildEventSequence} from '../src/ui/characterEvents.js';
import {CharacterDirector} from '../src/ui/characterDirector.js';
const event=(revenue,corporation='IR')=>({type:'dividend',payout:true,revenue,corporation,actor_id:'p1',cash_receipts:[{recipient:'p1',destination:'purse',amount:revenue/2}]});
const view={state:{revision:50,players:{p1:{name:'Alice'}},corporations:{IR:{president:'p1'}}},history_events:[{revision:10,event:event(20)},{revision:30,event:event(150)}]};

test('thresholds use company totals and prior confirmed payouts, once for each company',()=>{
  assert.deepEqual(dividendMilestone(event(250),view).thresholds,[200]);
  assert.equal(dividendMilestone(event(150),view),null);
  assert.deepEqual(dividendMilestone(event(125,'SR'),view).thresholds,[20,100]);
  assert.deepEqual(dividendMilestone(event(100),view,20).thresholds,[100],'later history does not erase an earlier first crossing');
  assert.equal(dividendMilestone({...event(300),payout:false},view),null);
  assert.equal(dividendMilestone({...event(300),cash_receipts:[]},view),null);
  assert.equal(dividendMilestone(event(19),{...view,history_events:[]}),null);
});

test('live celebration is deduplicated, held history never rains, and Motion Off keeps a static milestone',()=>{
  const director=new CharacterDirector({now:()=>0,schedule:()=>1,cancel:()=>{}});
  director.setRoom('practice');
  assert.equal(director.accepted(event(250),50,view),true);
  assert.equal(director.accepted(event(250),50,view),false);
  const sequence=buildEventSequence(event(250),view);
  const frame=sequence.frames.find(f=>f.dividendMilestone);
  assert.ok(frame);assert.deepEqual(frame.dividendMilestone.thresholds,[200]);
  const mock={lanes:new Map([['game',{active:{speed:1}}]]),sample:()=>({frame,remaining:frame.ms})};
  assert.match(renderDividendMilestone(mock),/is-raining/);
  director.history(event(250),50,view,{animate:true});
  assert.ok(director.playback.lanes.get('game').active.frames.every(f=>!f.dividendMilestone));
  director.playback.setMotionEnabled(false);director.playback.clear('game');
  director.accepted(event(250),51,{...view,state:{...view.state,revision:51}});
  const html=renderDividendMilestone(director.playback);
  assert.match(html,/is-still/);assert.match(html,/¥250 paid/);assert.doesNotMatch(html,/class="dividend-rain"/);
});
