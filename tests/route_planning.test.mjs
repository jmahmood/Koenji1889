import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {bindRoutePlanning,routeQuote,routeSignature,syncRoutePlan,displayedRoutes} from '../src/ui/routePlanning.js';
import {renderDetailedMapView} from '../src/components/HexMap1889.js';
import {renderDecisionDesk} from '../src/components/DecisionDesk.js';
const view=JSON.parse(execFileSync('python3',['-c',`import json,tempfile
from pathlib import Path
from server_bridge import KoenjiDatabase,create_fixture_room
with tempfile.TemporaryDirectory() as t:
 print(json.dumps(create_fixture_room(KoenjiDatabase(Path(t)/'r.sqlite3'),'route_planning')['view']))`],{encoding:'utf8'}));
const makeApp=()=>{const app={roomCode:'R',token:'seat',activeModal:'decisions',view:'map',displayedViewData:structuredClone(view),viewRevision:view.state.revision,liveRevision:view.state.revision};syncRoutePlan(app,app.displayedViewData);return app;};
function bind(app,request) {
 const handlers={};let executed;
 globalThis.document={querySelectorAll:s=>[{addEventListener:(event,fn)=>handlers[`${s}:${event}`]=fn}]};
 bindRoutePlanning({app,api:{request},render(){},toast(){},execute:async action=>executed=action});
 return {click:(selector,dataset={})=>handlers[`${selector}:click`]({currentTarget:{dataset},preventDefault(){},stopPropagation(){}}),executed:()=>executed};
}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('choose stops, use route, quote automatically and run exactly that plan',async()=>{
 const app=makeApp(),original=structuredClone(app.routeDraft),reversed={train:'2-0',vertices:[...app.routeDraft[0].vertices].reverse()};
 const calls=[];
 const ui=bind(app,async(path,{body})=>{calls.push(body);
  if(path.endsWith('route-preview'))return {revenue:90,route_revenues:{'2-0':50,'2-1':40},revision:app.viewRevision};
  return body.stops.length===0 ? {next_stops:['F1:n0'],connections:[]} : body.stops.length===1 ? {next_stops:['E2:n0'],connections:[]} : {next_stops:[],connections:[{route:reversed,revenue:50,total:90}]};
 });
 await ui.click('[data-edit-route]',{editRoute:'2-0'});
 assert.deepEqual(app.routeDraft,original,'editing does not change the plan');
 await ui.click('[data-route-stop]',{routeStop:'F1:n0'});
 await ui.click('[data-route-stop]',{routeStop:'E2:n0'});
 assert.equal(app.routeEditor.connections[0].total,90);
 await ui.click('[data-route-use]');
 assert.deepEqual(app.routeDraft.find(r=>r.train==='2-1'),original[1]);
 assert.equal(routeQuote(app,app.displayedViewData).revenue,90);
 assert.match(renderDecisionDesk(app,view),/aria-label="Route revenue for train 2-0">¥50<\/strong>/);
 await ui.click('[data-run-route-plan]');
 assert.deepEqual(ui.executed().routes,app.routeDraft);assert.equal(app.activeModal,null);
 assert.equal(calls.at(-1).routes.length,2);
});
test('a delayed quote cannot validate a draft restored or edited while it was pending',async()=>{
 const app=makeApp(),pending=deferred();const ui=bind(app,()=>pending.promise);
 const request=ui.click('[data-route-idle]',{routeIdle:'2-0'});
 assert.equal(routeQuote(app,app.displayedViewData),null);
 await ui.click('[data-copy-route-plan]');
 pending.resolve({revenue:40,revision:app.viewRevision});await request;
 assert.equal(app.routePreview,null);assert.equal(routeQuote(app,app.displayedViewData).revenue,90);
});
test('cancel discards pending stop choices and never changes another train',async()=>{
 const app=makeApp(),original=structuredClone(app.routeDraft),pending=deferred();const ui=bind(app,()=>pending.promise);
 const request=ui.click('[data-edit-route]',{editRoute:'2-0'});
 await ui.click('[data-route-cancel]');pending.resolve({next_stops:['F1:n0'],connections:[]});await request;
 assert.equal(app.routeEditor,null);assert.deepEqual(app.routeDraft,original);
});
test('old revisions and observers cannot start edits or run a plan',async()=>{
 for(const mode of ['history','observer']) {
  const app=makeApp();if(mode==='history')app.viewRevision--;else app.displayedViewData.viewer.player_id=null;
  let calls=0;const ui=bind(app,async()=>{calls++;});
  await ui.click('[data-edit-route]',{editRoute:'2-0'});await ui.click('[data-run-route-plan]');
  assert.equal(calls,0);assert.equal(ui.executed(),undefined);
 }
});
test('new game revision discards old custom routes, preview and in-flight editing state',()=>{
 const app=makeApp();app.routeEditor={train:'2-0'};app.routePreview={revenue:10};
 const next=structuredClone(view);next.state.revision++;syncRoutePlan(app,next);
 assert.equal(app.routeEditor,null);assert.equal(app.routePreview,null);assert.deepEqual(app.routeDraft,next.route_quote.routes);
});
test('a custom quote is valid only for the exact draft contents and revision',()=>{
 const app=makeApp();app.routeDraft.pop();app.routePreview={revision:app.viewRevision,revenue:50,signature:routeSignature(app.routeDraft)};
 assert.equal(routeQuote(app,view).revenue,50);app.routeDraft[0].vertices.reverse();assert.equal(routeQuote(app,view),null);
 assert.match(renderDecisionDesk(app,view),/data-run-route-plan disabled/);
});

test('editing previews only the chosen connection and preserves the other train color identity',()=>{
 const app=makeApp(),other=app.routeDraft[1];
 app.routeEditor={train:'2-0',revision:app.viewRevision,signature:routeSignature(app.routeDraft),stops:[],connections:[]};
 assert.deepEqual(displayedRoutes(app,view),[other]);
 app.routeEditor.connections=[{route:app.routeDraft[0]}];
 assert.deepEqual(displayedRoutes(app,view),[other,app.routeDraft[0]]);
});
test('a stale draft from another revision cannot be submitted under a fresh quote',async()=>{
 const app=makeApp();app.routeDraftKey='another-room:0:IR';
 const ui=bind(app,async()=>{});await ui.click('[data-run-route-plan]');
 assert.equal(ui.executed(),undefined);
});

test('map exposes named stop targets and shares the current plan revenue',()=>{
 const app=makeApp();app.mapWindows={trains:{open:true,x:20,y:20,width:500,height:400,z:5}};
 app.routeEditor={train:'2-0',revision:app.viewRevision,signature:routeSignature(app.routeDraft),stops:[],next_stops:['F1:n0'],connections:[]};
 const html=renderDetailedMapView(app,view,{});
 assert.match(html,/data-route-stop="F1:n0" aria-label="Choose Imabari \/ Onomichi Ferry \(F1\)"/);
 assert.match(html,/Total Operating Revenue<\/span>\s*<strong>¥90<\/strong>/);
 assert.doesNotMatch(html,/Connected corridor/);
});

test('large stop lists keep undo and cancel beside the fixed use-route action',()=>{
 const app=makeApp();
 app.routeEditor={train:'2-0',revision:app.viewRevision,signature:routeSignature(app.routeDraft),stops:[],next_stops:['E2:n0','F1:n0'],connections:[]};
 const html=renderDecisionDesk(app,view);
 assert.ok(html.indexOf('data-route-cancel') > html.indexOf('route-plan-footer'));
 assert.ok(html.indexOf('data-route-undo-stop') > html.indexOf('route-plan-footer'));
});

test('each train card shows its engine quote and never a stale amount for a changed plan',async()=>{
 const app=makeApp();
 assert.deepEqual(view.route_quote.route_revenues,{'2-0':50,'2-1':40});
 let html=renderDecisionDesk(app,view);
 assert.match(html,/aria-label="Route revenue for train 2-0">¥50<\/strong>/);
 assert.match(html,/aria-label="Route revenue for train 2-1">¥40<\/strong>/);
 const pending=deferred(),ui=bind(app,()=>pending.promise);
 const request=ui.click('[data-route-idle]',{routeIdle:'2-0'});
 html=renderDecisionDesk(app,view);
 assert.match(html,/aria-label="Route revenue for train 2-0">¥0<\/strong>/);
 assert.match(html,/aria-label="Route revenue for train 2-1">Updating…<\/strong>/);
 pending.resolve({revision:app.viewRevision,revenue:40,route_revenues:{'2-1':40}});await request;
 html=renderDecisionDesk(app,view);
 assert.match(html,/aria-label="Route revenue for train 2-1">¥40<\/strong>/);
 await ui.click('[data-copy-route-plan]');
 assert.match(renderDecisionDesk(app,view),/aria-label="Route revenue for train 2-0">¥50<\/strong>/);
});
