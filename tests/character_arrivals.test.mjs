import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAppearance,renderCharacter,APPEARANCE_CATALOG} from '../src/scene/Character.js';
import {renderCharacterSetup} from '../src/components/CharacterSetup.js';
import {renderWaitingTable} from '../src/components/GatheringLobby.js';
import {renderArrivalDock,unseenArrivals} from '../src/ui/arrivals.js';
import {KoenjiApiClient} from '../src/api/client.js';
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};

test('appearance persists across client instances with independent face/outfit layers and legacy defaults',()=>{
  globalThis.localStorage=mem();const a=new KoenjiApiClient();a.channel?.close();
  assert.equal(a.getAppearance(),null);
  const look={face:'reference-06',clothes:'charcoal-suit'};a.saveAppearance(look);
  const b=new KoenjiApiClient();b.channel?.close();assert.deepEqual(b.getAppearance(),look);
  assert.deepEqual(normalizeAppearance({}),{face:'reference-01',clothes:'indigo-haori'});
  for(const f of APPEARANCE_CATALOG.faces) for(const c of APPEARANCE_CATALOG.clothes) {
    const html=renderCharacter({face:f.id,clothes:c.id},{name:'<Member>'});
    assert.match(html,new RegExp(`data-face="${f.id}"`));assert.match(html,new RegExp(`data-clothes="${c.id}"`));
    assert.match(html,/&lt;Member&gt;/);
  }
  assert.match(renderCharacterSetup(look),/Charcoal suit<\/option>/);
});
test('arrival cursor orders/deduplicates delivery; returned and reduced-motion presentations never animate',()=>{
  const events=[{id:3,kind:'arrived',name:'Yumiko',arrival_route:'kitchen'},{id:2,kind:'returned',name:'Alice'}];
  assert.deepEqual(unseenArrivals(events,2).map(e=>e.id),[3]);assert.deepEqual(unseenArrivals(events,3),[]);
  assert.match(renderArrivalDock(events[0]),/arrival-animated/);
  assert.match(renderArrivalDock(events[0]),/From the kitchen/);
  assert.doesNotMatch(renderArrivalDock(events[0],{motion:false}),/arrival-animated/);
  assert.doesNotMatch(renderArrivalDock(events[1]),/arrival-stage|arrival-animated/);
  assert.match(renderArrivalDock(events[1]),/Alice returned/);
});
test('waiting-table start follows authoritative readiness and host labels stay independent of seat number',()=>{
  globalThis.location={origin:'http://localhost',pathname:'/'};
  const api={getRoomDirectory:()=>({ROOM:{creator_token:'host'}}),getHostInvitations:()=>null};
  const view={room_code:'ROOM',max_players:2,gathering_title:'Friends',can_start:false,
    host:{name:'Alice',member_id:'player:7'},viewer:{},club:{notes:[],stamps:{}},
    seats:[{seat_index:0,member_id:'player:8',name:'Yumiko',claimed:false},{seat_index:1,member_id:'player:7',name:'Alice',claimed:true,is_host:true}]};
  const html=renderWaitingTable({roomCode:'ROOM'},view,api);
  assert.match(html,/data-start-gathering disabled/);assert.match(html,/Alice <span class="host-badge">Host/);
  assert.match(renderWaitingTable({roomCode:'ROOM'},{...view,can_start:true},api),/data-start-gathering >Open/);
});
test('motion rules disable interpolation and reserve a separate arrival footer lane',()=>{
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/transition:\s*(?!none)[a-z-]+\s+[\d.]+s/);
  assert.match(css,/animation:koma-arrival 2.4s steps\(1,end\)/);
  assert.match(css,/\.motion-off \*/);assert.match(css,/\.arrival-dock \{height:100px/);
});
