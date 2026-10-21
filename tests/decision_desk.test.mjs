import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {renderDecisionDesk,renderResults} from '../src/components/DecisionDesk.js';
import {renderDetailedMapView,getLegalPlacementsForHex,getCandidateTilesForHex} from '../src/components/HexMap1889.js';
import {renderStockExchangeView} from '../src/components/StockExchange.js';
import {KoenjiApiClient} from '../src/api/client.js';
const views=JSON.parse(execFileSync('python3',['tests/decision_fixtures.py'],{encoding:'utf8'}));
const catalog=JSON.parse(execFileSync('python3',['-c','import json; from server_bridge import KoenjiAppService; print(json.dumps(KoenjiAppService().handle("GET","/api/1889/catalog")[1]))'],{encoding:'utf8'}));
const app=v=>({roomCode:'test',activeModal:'decisions',viewRevision:v.state.revision,liveRevision:v.state.revision,selectedHex:'C4',inspectedHex:'C4',selectedCompanyId:'IR',selectedParPrice:80,stockWindows:{},mapWindows:{}});

test('discard decisions are usable by the affected president, never waiting players, spectators or history',()=>{
 const v=views.discard;
 assert.match(renderDecisionDesk(app(v),v),/discard 3-0 to the depot/);
 for(const name of ['discard_waiting','discard_observer']) assert.doesNotMatch(renderDecisionDesk(app(views[name]),views[name]),/data-review-action=/);
 assert.doesNotMatch(renderDecisionDesk({...app(v),liveRevision:1},v),/data-review-action=/);
});
test('ER can decline or confirm a tile while the interrupted corporation is at train purchase',()=>{
 const v=views.er_train,s={...app(v),selectedTileId:'14',selectedTileRotation:1};
 assert.equal(v.state.operating_turn.step,'train');
 const map=renderDetailedMapView(s,v,catalog);
 assert.match(map,/data-op-action="pass" >/);
 assert.match(map,/Confirm Lay Tile #14 on C4/);
 const desk=renderDecisionDesk(s,v);assert.match(desk,/Decline ER lay/);assert.match(desk,/Lay #14 at 60°/);
});
test('emergency blocks and out-of-turn DR have explicit reviewed controls',()=>{
 assert.match(renderDecisionDesk(app(views.emergency),views.emergency),/Sell 10% IR/);
 assert.match(renderDecisionDesk(app(views.dr),views.dr),/Exchange DR for 10% IR/);
});
test('routes expose a non-mutating plan with per-train stop editing',()=>{
 const v=views.routes,s=app(v);s.routeDraftKey=`test:${v.state.revision}:${v.state.current_corporation}`;s.routeDraft=v.route_quote.routes;
 const html=renderDecisionDesk(s,v);
 assert.match(html,/data-edit-route/);assert.match(html,/data-run-route-plan/);
 assert.doesNotMatch(html,/data-route-segment/);assert.match(html,/All trains · total revenue/);
 assert.equal(v.state.operating_turn.routes,null);
});
test('stock sales use a selectable block and actual market exemptions permit legal purchases',()=>{
 for(const key of ['y','o']){
  const v=views[key],s={...app(v),sellPercent:30};v.certificates.p1=14;
  const html=renderStockExchangeView(s,v,catalog);
  assert.match(html,/Sell 30% IR to Pool/);assert.match(html,/data-action="buy_shares" >/);
  assert.match(html,/selected stock exempt/);
 }
 const v=structuredClone(views.o),s={...app(v),buyPercent:20};
 // Defensive support for brown zones: this standard map has no brown cells.
 v.market_zones.IR='b';v.state.stock_turn.bought=true;v.state.stock_turn.brown_company='IR';
 v.action_options.push({type:'buy_shares',corporation:'IR',source:'ipo',percent:20});
 const html=renderStockExchangeView(s,v,catalog);
 assert.match(html,/Buy 20% IR/);assert.match(html,/data-action="buy_shares" >/);
});
test('empty authoritative tile results never fall back to geometric candidates',()=>{
 const v=views.routes;
 assert.deepEqual(getLegalPlacementsForHex(v.state,catalog,'E2',null,{legal_tile_lays:{}}),[]);
 assert.deepEqual(getCandidateTilesForHex(v.state,catalog,'E2',{legal_tile_lays:{}}),[]);
});
test('negotiations use named assets, matching consent and actual price inputs; results rank by score',()=>{
 const html=renderDecisionDesk(app(views.negotiation),views.negotiation);
 assert.match(html,/Review offer \/ consent/);assert.match(html,/data-negotiation=/);
 const result=renderResults(views.finished.state);
 assert.match(result,/Final results/);assert.match(result,/bankrupt/);assert.match(result,/Corporate treasury is excluded/);
});
test('ordinary invitations store only one seat locally and strip credentials from the address',async()=>{
 const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
 globalThis.localStorage=mem();globalThis.sessionStorage=mem();
 let href='http://localhost/?room=ROOM&seat=p2#token=seat-two';
 globalThis.window={location:new URL(href),history:{replaceState:(_a,_b,url)=>{href=url;window.location=new URL(url)}}};
 const client=new KoenjiApiClient();client.channel?.close();client.channel=null;
 const session=client.getTabSession();assert.equal(session.token,'seat-two');assert.doesNotMatch(href,/token/);
 const room=client.getRoomDirectory().ROOM;assert.equal(room.own_session.seat_key,'p2');assert.equal(room.player_tokens,undefined);
 let call=0;client.request=async()=>++call===1?{room_code:'NEW',creator_token:'host',spectator_token:'observer',player_tokens:['one','two']}:{state:{revision:0}};
 await client.createAndStartRoom(['Alice','Bob']);
 assert.equal(client.getRoomDirectory().NEW.player_tokens,undefined);
 assert.deepEqual(client.getHostInvitations('NEW').player_tokens,['one','two']);
});

test('recommended routes are selected automatically without mutating the game',()=>{
 const v=structuredClone(views.routes);v.state.operating_turn.step='routes';const s=app(v);
 const html=renderDecisionDesk(s,v);
 assert.deepEqual(s.routeDraft,v.route_quote.routes);
 assert.match(html,/data-run-route-plan/);
 assert.match(html,/route-plan-footer/);assert.doesNotMatch(html,/data-route-segment/);
 assert.equal(v.state.operating_turn.routes,null);
});
test('custom routes need a revenue check before running',()=>{
 const v=views.routes,s=app(v);
 s.routeDraftKey=`test:${v.state.revision}:${v.state.current_corporation}`;
 s.routeDraft=[{train:'2-0',paths:[['C4',0]]}];
 const html=renderDecisionDesk(s,v);
 assert.match(html,/data-run-route-plan disabled/);
 assert.doesNotMatch(html,/Review &amp; commit draft routes/);
});

test('route decision focuses on routes rather than the financing boardroom',()=>{
 const v=structuredClone(views.routes);v.state.operating_turn.step='routes';
 const html=renderDecisionDesk({...app(v),view:'map'},v);
 assert.match(html,/aria-label="Run train routes"/);
 assert.match(html,/route-focus-desk/);
 assert.doesNotMatch(html,/Trains, emergency funding &amp; private exchange/);
 assert.doesNotMatch(html,/THE ROUNDHOUSE/);
 assert.match(html,/Next: pay shareholders/);
});
