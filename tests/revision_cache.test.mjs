import test from 'node:test';
import assert from 'node:assert/strict';
import {RevisionCache} from '../src/api/revisionCache.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};

test('snapshot requests coalesce, survive reload, isolate seats and return independent values',async()=>{
  const storage=memory(),cache=new RevisionCache({storage});let calls=0,resolve;
  const load=()=>{calls++;return new Promise(r=>resolve=r);};
  const a=cache.read('room','p1',10,load),b=cache.read('room','p1',10,load);
  await Promise.resolve();assert.equal(calls,1);resolve({state:{revision:10},viewer:{player_id:'p1'}});
  const [first,second]=await Promise.all([a,b]);first.viewer.player_id='changed';
  assert.equal(second.viewer.player_id,'p1');
  const reload=new RevisionCache({storage});
  const saved=await reload.read('room','p1',10,()=>assert.fail('cached snapshot refetched'));
  assert.equal(saved.viewer.player_id,'p1');
  await reload.read('room','p2',10,async()=>{calls++;return {state:{revision:10},viewer:{player_id:'p2'}};});
  await reload.read('other','p1',10,async()=>{calls++;return {state:{revision:10}};});
  assert.equal(calls,3);
});

test('failed loads can retry; cache evicts oldest reads and tolerates unavailable storage',async()=>{
  const cache=new RevisionCache({limit:2,storage:{getItem(){throw Error('blocked')},setItem(){throw Error('quota')}}});
  await assert.rejects(cache.read('r','p',1,async()=>{throw Error('offline')}),/offline/);
  let calls=0;const load=async()=>({state:{revision:++calls}});
  for(const revision of [1,2,3])await cache.read('r','p',revision,load);
  assert.equal(cache.values.size,2);
  await cache.read('r','p',2,()=>assert.fail('recent entry evicted'));
  await cache.read('r','p',1,load);assert.equal(calls,4);
  const small=new RevisionCache({maxChars:100});
  await small.read('r','p',1,async()=>({state:{big:'x'.repeat(200)}}));
  assert.equal(small.values.size,0);
});
