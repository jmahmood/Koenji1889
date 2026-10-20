import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {KoenjiApiClient} from '../src/api/client.js';

const storage=()=>{
  const entries=new Map();
  return {getItem:key=>entries.get(key) ?? null,setItem:(key,value)=>entries.set(key,String(value))};
};

// HTTP LAN origins expose getRandomValues, but not the secure-context-only randomUUID.
test('HTTP appearance saves reach the server and retain a stable browser identity', async t=>{
  const cryptoDescriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const originalLocal=globalThis.localStorage;
  const originalFetch=globalThis.fetch;
  t.after(()=>{
    if(cryptoDescriptor) Object.defineProperty(globalThis,'crypto',cryptoDescriptor);
    else delete globalThis.crypto;
    globalThis.localStorage=originalLocal;
    globalThis.fetch=originalFetch;
  });
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{
    getRandomValues:values=>webcrypto.getRandomValues(values),
  }});
  globalThis.localStorage=storage();
  const calls=[];
  globalThis.fetch=async (path,options)=>{
    const body=JSON.parse(options.body);
    calls.push({path,options,body});
    return {ok:true,json:async()=>({members:{p1:{appearance:body.appearance}}})};
  };
  const api=new KoenjiApiClient(); api.channel?.close();
  const look={face:'reference-05',clothes:'charcoal-suit'};
  api.saveAppearance(look);
  const social=await api.arrive('HTTPROOM','seat-token');
  assert.deepEqual(social.members.p1.appearance,look);
  assert.equal(calls[0].path,'/api/1889/games/HTTPROOM/arrival');
  assert.equal(calls[0].options.headers.Authorization,'Bearer seat-token');
  const browserId=calls[0].body.browser_id;
  assert.match(browserId,/^[a-zA-Z0-9-]{12,64}$/,'Observer ID also satisfies the backend contract');
  assert.equal(api.getBrowserId(),browserId);
  const reload=new KoenjiApiClient(); reload.channel?.close();
  assert.equal(reload.getBrowserId(),browserId,'Reloading retains this browser identity');
  api.saveAppearance({face:'reference-10',clothes:'plum-kimono'});
  await api.arrive('HTTPROOM','seat-token');
  assert.deepEqual(calls[1].body.appearance,{face:'reference-10',clothes:'plum-kimono'});
  assert.equal(calls[1].body.browser_id,browserId);
  const secondBrowser=new KoenjiApiClient(); secondBrowser.channel?.close();
  globalThis.localStorage=storage();
  assert.notEqual(secondBrowser.getBrowserId(),browserId,'Separate browsers get independent IDs');
});
