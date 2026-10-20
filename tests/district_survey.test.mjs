import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {districtSurveyModel,renderDistrictSurvey} from '../src/components/DistrictSurvey.js';
import {getCityValuationProfile,parseCatalogTile,renderDetailedMapView} from '../src/components/HexMap1889.js';
import artwork from '../src/data/districtArtwork.json' with {type:'json'};

const views=JSON.parse(execFileSync('python3',['tests/decision_fixtures.py'],{encoding:'utf8'}));
const catalog=JSON.parse(execFileSync('python3',['-c','import json; from server_bridge import KoenjiAppService; print(json.dumps(KoenjiAppService().handle("GET","/api/1889/catalog")[1]))'],{encoding:'utf8'}));
const fresh=()=>structuredClone(views.train_normal);
const profile=(v,c)=>getCityValuationProfile(c,v.state.board[c],v.state,catalog);
const model=(v,c='I2',legal=[])=>districtSurveyModel(v,catalog,c,profile(v,c),parseCatalogTile,legal);
const app=v=>({roomCode:'survey-test',view:'map',viewRevision:v.state.revision,liveRevision:v.state.revision,selectedHex:'E2',inspectedHex:'I2',selectedCompanyId:'IR',mapWindows:{hex:{open:true,z:5}}});
const survey=(v,c='I2',a=app(v))=>renderDistrictSurvey({app:a,view:v,catalog,coord:c,profile:profile(v,c),parseTile:parseCatalogTile,hexArt:'<svg aria-hidden="true"></svg>',tileArt:id=>`<svg data-specimen="${id}" aria-hidden="true"></svg>`});
function setTile(v,coord,id){const tile=catalog.tiles[id];Object.assign(v.state.board[coord],parseCatalogTile(tile.code,tile.color),{tile:id});}

test('every live hex renders its own historical portrait and research link without changing game state',()=>{
 const v=fresh(),before=JSON.stringify(v.state);
 for(const coord of Object.keys(v.state.board)){
  const html=survey(v,coord),art=artwork[coord];
  assert.ok(art,coord);
  assert.ok(html.includes(`src="${art.file}"`),coord);
  assert.ok(html.includes(`href="${art.researchUrl}"`),coord);
  assert.match(html,/Illustration · c\.18\d\d/);
  assert.doesNotMatch(html,/Period image|Concept art|survey-generic-art/);
  if(art.mappingStatus==='inferred-region')assert.match(html,/approximate regional match/);
 }
 assert.equal(JSON.stringify(v.state),before);
 setTile(v,'I2','57');assert.ok(survey(v).includes(`src="${artwork.I2.file}"`));
});

test('a late phase never lets White skip Yellow',()=>{
 const v=fresh();v.state.phase='5';const m=model(v);
 assert.equal(m.stages.find(s=>s.color==='yellow').status,'next');
 for(const color of ['green','brown']) assert.equal(m.stages.find(s=>s.color===color).status,'locked');
 assert.deepEqual(new Set(m.stock.map(t=>t.color)),new Set(['yellow']));
 const html=survey(v);assert.match(html,/After Yellow · Phase 3\+/);assert.match(html,/After Green · Phase 5\+/);
 assert.doesNotMatch(html,/revenue|income|connected|per train/i);
});

test('next color and phase are independent gates, with live stock including exhausted tiles',()=>{
 const v=fresh();setTile(v,'I2','57');v.state.phase='2';v.state.tiles['14']=0;
 let m=model(v);assert.equal(m.nextColor,'green');assert.equal(m.phaseOpen,false);
 assert.equal(m.stock.find(t=>t.id==='14').remaining,0);
 assert.match(survey(v),/Phase 3\+ required/);
 const buttons=survey(v).match(/<button[^>]*data-survey-inspect-tile[^>]*>/g);
 assert.ok(buttons.length);assert.ok(buttons.every(button=>button.includes('disabled')));
 v.state.phase='3';m=model(v);assert.equal(m.stages.find(s=>s.color==='green').status,'next');
 assert.equal(m.stages.find(s=>s.color==='brown').status,'locked');
 assert.match(survey(v),/data-survey-inspect-tile="14" aria-pressed="false" disabled/);
 setTile(v,'I2','14');v.state.phase='5';assert.equal(model(v).stages.find(s=>s.color==='brown').status,'next');
});

test('home reservation becomes a placed station; capacities include all city nodes',()=>{
 const v=fresh(),corp=v.state.corporations.SR;
 assert.equal(model(v).capacity,1);assert.equal(model(v).reservations.length,1);
 assert.match(survey(v),/SR home space reserved/);
 corp.home_placed=true;v.state.board.I2.tokens=[['SR']];
 assert.equal(model(v).reservations.length,0);assert.deepEqual(model(v).occupied,['SR']);
 assert.match(survey(v),/SR station placed/);assert.doesNotMatch(survey(v),/home space reserved/);
 v.state.board.I2.nodes=[{kind:'city',slots:1},{kind:'city',slots:2}];v.state.board.I2.tokens=[['SR'],['IR']];
 assert.equal(model(v).capacity,3);assert.deepEqual(model(v).occupied,['SR','IR']);
});

test('permanent locations, town limits and H/T/K chains retain their actual rules',()=>{
 const v=fresh();
 for(const coord of ['B7','J1']){assert.equal(model(v,coord).fixed,true);assert.equal(model(v,coord).stock.length,0);}
 assert.equal(model(v,'B11').nextColor,'yellow');
 setTile(v,'B11','3');assert.equal(model(v,'B11').stock.length,0);
 assert.deepEqual(model(v,'I4').stock.map(t=>t.id),['438']);
 assert.deepEqual(model(v,'K4').stock.map(t=>t.id),['440']);
 assert.deepEqual(model(v,'F9').stock.map(t=>t.id),['465']);
 Object.assign(v.state.board.B11,{port:true});assert.equal(model(v,'B11').fixed,true);
 for(const coord of Object.keys(v.state.board)) assert.doesNotThrow(()=>survey(v,coord),coord);
});

test('terrain quotes and player-owned private blocks are exposed without constructing',()=>{
 const v=fresh();assert.equal(model(v,'I4').printedCost,80);
 assert.equal(model(v,'I4',[{tile:'438',cost:0}]).cost,0);
 const blocker=Object.values(v.state.privates).find(p=>p.hexes?.length && v.state.players[p.owner]);
 assert.ok(blocker);const coord=blocker.hexes[0];
 assert.ok(model(v,coord).blockers.length);assert.match(survey(v,coord),/Blocked by/);
 blocker.closed=true;assert.equal(model(v,coord).blockers.length,0);
});

test('survey inspection is separate from staged construction and works for spectators and history',()=>{
 const v=fresh(),a=app(v);a.selectedTileId='57';a.selectedTileRotation=2;a.surveyInspection={room:a.roomCode,hex:'I2',tile:'5'};
 for(const change of [{},{viewer:{player_id:null},is_historical:true}]){
  const view={...v,...change},before=JSON.stringify(a);
  const html=survey(view,'I2',a);
  assert.match(html,/Inspecting #5/);
  assert.doesNotMatch(html,/data-select-legal-placement|data-op-action|data-review-action/);
  assert.equal(JSON.stringify(a),before);
 }
 const html=renderDetailedMapView(a,v,catalog);
 assert.match(html,/aria-label="District Survey"/);assert.match(html,/data-district-survey="I2"/);
 assert.match(html,/width:min\(760px, 94%\)/);
});
