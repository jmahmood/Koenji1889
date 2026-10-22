import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {tilePlacementNotice,renderDetailedMapView,getCityValuationProfile} from '../src/components/HexMap1889.js';
import {translate} from '../src/ui/i18n.js';
const {catalog,views}=JSON.parse(execFileSync('python3',['tests/tile_discovery_fixtures.py'],{encoding:'utf8'}));
const app=v=>({roomCode:'tile-discovery',view:'map',viewRevision:v.state.revision,liveRevision:v.state.revision,selectedCompanyId:v.state.current_corporation,selectedHex:'J3',inspectedHex:'J3',mapWindows:{}});

test('offboards emphasize the revenue for the viewed phase and station placement is explicitly optional',()=>{
  for(const [phase,index] of [['2',0],['3',0],['5',1],['6',1],['D',2]]) {
    const v=structuredClone(views.used);v.state.phase=phase;
    const html=renderDetailedMapView(app(v),v,catalog);
    assert.equal((html.match(/offboard-value is-current/g) || []).length,3);
    const profile=getCityValuationProfile('F1',v.state.board.F1,v.state,catalog);
    assert.equal(profile.currentRev,v.state.board.F1.nodes[0].revenue[index]);
    assert.match(html,/Station placement is optional/);
    assert.match(html,/Skip Station Placement/);
  }
});

test('J3 can be built by SR during track, but its next normal lay waits after I4 construction',()=>{
  const v=views.available;
  assert.ok(v.legal_tile_lays.J3.some(p=>p.tile==='9'));
  assert.match(tilePlacementNotice(app(v),v,catalog,'J3'),/SR has \d+ legal tile orientations at J3/);
  const used=views.used;
  assert.equal(used.state.board.I4.tile,'438');
  assert.match(tilePlacementNotice(app(used),used,catalog,'J3'),/SR has already laid its normal tile this turn/);
});

test('a blocked hex explains connection, supply, phase and read-only restrictions',()=>{
  let v=views.unconnected;
  assert.match(tilePlacementNotice(app(v),v,catalog,'J3'),/IR has no connected railhead reaching J3/);
  // Exercise the UI's empty-stock response without persisting a synthetic save.
  v=structuredClone(views.available);v.legal_tile_lays={};
  for(const id of ['7','8','9'])v.state.tiles[id]=0;
  assert.match(tilePlacementNotice(app(v),v,catalog,'J3'),/All compatible yellow tiles.*out of supply/);
  v=views.available;
  assert.match(tilePlacementNotice(app(v),v,catalog,'I2'),/needs a green upgrade, available from Phase 3/);
  assert.match(tilePlacementNotice({...app(v),viewRevision:-1},v,catalog,'J3'),/Historical position/);
  assert.match(tilePlacementNotice(app(v),{...v,viewer:{player_id:null}},catalog,'J3'),/only seated players/);
});

test('the reported SR tile-limit explanation is readable in Japanese too',()=>{
  const v=views.used;
  const text=translate(tilePlacementNotice(app(v),v,catalog,'J3'),'ja');
  assert.match(text,/SRはこの手番の通常の線路敷設を終えています/);
  assert.equal(translate('Next legal option','ja'),'次の合法候補');
});

test('the construction picker exposes every legal option, including choices after the first six',()=>{
  const v=views.many_choices;
  const [hex,options]=Object.entries(v.legal_tile_lays).find(([,choices])=>choices.length>6);
  assert.ok(options.length>6);
  const a={...app(v),selectedHex:hex,inspectedHex:hex,selectedTileId:options[0].tile,selectedTileRotation:options[0].rotation};
  const html=renderDetailedMapView(a,v,catalog);
  const offered=[...html.matchAll(/data-select-legal-placement="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(offered,options.map(p=>`${hex}:${p.tile}:${p.rotation}`));
  assert.doesNotMatch(html,/Next legal option|Staged:/);
  assert.doesNotMatch(html,/Rotate 60°/);
});
