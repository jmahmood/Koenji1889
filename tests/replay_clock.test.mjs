import test from 'node:test';
import assert from 'node:assert/strict';
import {ReplayClock,replayDuration} from '../src/replay/ReplayClock.js';
const view={state:{players:{p1:{name:'A'}},corporations:{},player_order:['p1']},members:{}};
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};

test('default timers preserve the browser receiver during room entry and replay',async t=>{
 const originalSchedule=globalThis.setTimeout,originalCancel=globalThis.clearTimeout;
 t.after(()=>{globalThis.setTimeout=originalSchedule;globalThis.clearTimeout=originalCancel;});
 let pending,cancelled=0;
 globalThis.setTimeout=function(fn,ms){assert.equal(this,globalThis);pending={fn,ms};return 7;};
 globalThis.clearTimeout=function(timer){assert.equal(this,globalThis);cancelled++;pending=null;};
 const clock=new ReplayClock({step:async()=>true,delay:()=>1300,finished:()=>{}});
 clock.stop(); // enterRoom stops replay before displaying the gathering.
 clock.start();await flush();assert.equal(pending.ms,0);
 pending.fn();await flush();assert.equal(pending.ms,1300);
 clock.stop();assert.equal(pending,null);assert.equal(cancelled,3);
});

test('normal replay gives all three mascot sequences enough time; Fast and Instant remain explicit',()=>{
 for(const event of [{type:'dividend',actor_id:'p1',payout:true,cash_receipts:[{recipient:'p1',destination:'purse',amount:50}]},{type:'bid',actor_id:'p1',outbid_players:['p1']},{finished:true,winners:['p1']}]){
  assert.ok(replayDuration(event,view,0)>1300);
  assert.equal(replayDuration(event,view,1),550);assert.equal(replayDuration(event,view,2),160);
 }
 assert.equal(replayDuration({type:'pass'},view,0),1300);
});
test('clock waits for snapshot fetch, then the full ceremony; stop cancels an in-flight restart',async()=>{
 let pending,serial=0,resolve,steps=0,finished=0;
 const clock=new ReplayClock({schedule:(fn,ms)=>{pending={fn,ms};return ++serial;},cancel:()=>{pending=null;},
  step:()=>{steps++;return new Promise(r=>{resolve=r;});},delay:()=>4350,finished:()=>finished++});
 clock.start();await flush();assert.equal(pending.ms,0);
 pending.fn();pending=null;await flush();assert.equal(steps,1);assert.equal(pending,null);
 resolve(true);await flush();assert.equal(pending.ms,4350);
 pending.fn();pending=null;clock.stop();resolve(true);await flush();assert.equal(pending,null);assert.equal(finished,0);
 let prepared=0;clock.start(()=>prepared++);clock.stop();await flush();assert.equal(prepared,0);
});
