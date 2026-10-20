import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {projectedFleet, depotTiers, renderInlineTrainDesk, renderLiquidationMat, stagedDepotAction, syncEmergencyDesk, trainStageKey} from '../src/components/TrainDesk.js';
import {renderDecisionDesk, actionLabel, bindDecisionDesk} from '../src/components/DecisionDesk.js';
const views=JSON.parse(execFileSync('python3',['tests/decision_fixtures.py'],{encoding:'utf8'}));
const app=v=>({roomCode:'test',activeModal:null,view:'map',viewRevision:v.state.revision,liveRevision:v.state.revision,displayedViewData:v});

test('identical serials share one depot card; stage and stamp keep the map uncovered',()=>{
 const v=views.train_normal,s=app(v), tier=depotTiers(v).find(t=>t.type==='2');
 assert.equal(tier.ids.length,6);assert.equal(tier.actions.length,1);
 const html=renderInlineTrainDesk(s,v);
 assert.equal((html.match(/data-buy-train=/g)||[]).length,1);
 assert.match(html,/data-stamp-train=/);assert.doesNotMatch(html,/modal-backdrop/);
 assert.match(html,/ROUNDHOUSE FLEET/);assert.match(html,/Safe/);assert.match(html,/Purse/);
 assert.equal(s.activeModal,null);
 s.trainStageKey=trainStageKey(s,v);s.trainStage=null;
 assert.equal(stagedDepotAction(s,v),null);
 s.trainStage={type:'buy_train',train:'invalid'};assert.equal(stagedDepotAction(s,v),null);
});

test('inline stamp submits one exact legal action and rejects stale or historical clicks',async()=>{
 const v=views.train_normal,s=app(v), action=stagedDepotAction(s,v), events=new Map();
 const element={dataset:{stampTrain:JSON.stringify(action),stampRevision:String(v.state.revision)},addEventListener:(_event,fn)=>events.set('stamp',fn)};
 const previous=globalThis.document;
 globalThis.document={querySelectorAll:selector=>selector==='[data-stamp-train]'?[element]:[]};
 const executed=[], messages=[];
 try {
  bindDecisionDesk({app:s,render:()=>{},execute:async a=>executed.push(a),toast:m=>messages.push(m)});
  await events.get('stamp')({currentTarget:element});assert.deepEqual(executed,[action]);
  s.liveRevision++;await events.get('stamp')({currentTarget:element});assert.equal(executed.length,1);assert.match(messages.at(-1),/Position changed/);
  s.liveRevision--;s.isPlayingReplay=true;await events.get('stamp')({currentTarget:element});assert.equal(executed.length,1);
 } finally {globalThis.document=previous;}
});

test('emergency opens for a corporate shortfall even with enough personal cash, once per episode',()=>{
 const v=views.train_purse,s=app(v);
 assert.ok(v.train_financing.shortfall>0);assert.ok(v.train_financing.personal_cash>=v.train_financing.shortfall);
 syncEmergencyDesk(s,v);assert.equal(s.activeModal,'decisions');
 s.activeModal=null;syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 s.isSubmitting=true;syncEmergencyDesk(s,v);s.isSubmitting=false;syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 syncEmergencyDesk(s,views.train_normal);syncEmergencyDesk(s,v);assert.equal(s.activeModal,'decisions');
 for (const change of [{viewRevision:-1},{isPlayingReplay:true},{isSubmitting:true}]) {
  const blocked={...app(v),...change};syncEmergencyDesk(blocked,v);assert.equal(blocked.activeModal,null);
 }
 const observer=structuredClone(v);observer.viewer.player_id=null;
 const os=app(observer);syncEmergencyDesk(os,observer);assert.equal(os.activeModal,null);
});

test('three-column boardroom exposes real used-train terms and server-backed sale previews',()=>{
 const v=views.train_used,s={...app(v),activeModal:'decisions'};
 const html=renderDecisionDesk(s,v);
 assert.match(html,/boardroom-columns/);assert.match(html,/SELLER SEAL/);assert.match(html,/BUYER SEAL/);
 assert.match(html,/Accept &amp; purchase 3-0 for ¥100/);assert.match(html,/data-negotiation=/);
 const e=views.emergency, preview=e.action_previews.find(p=>p.action.type==='emergency_sell');
 const mat=renderLiquidationMat(e,true,actionLabel);
 assert.match(mat,new RegExp(`Market ¥${e.prices.IR} → ¥${preview.price_after}`));
 assert.match(mat,new RegExp(`Holdings → ${preview.holdings_after}%`));
 const history={...s,liveRevision:s.liveRevision+1};
 assert.doesNotMatch(renderDecisionDesk(history,v),/data-review-action=/);
});

test('ordinary emergency sale in another corporation does not announce a presidency transfer',()=>{
 const v=views.emergency_other_corporation;
 const action=v.action_options.find(a=>a.type==='emergency_sell' && a.corporation==='AR' && a.percent===10);
 assert.ok(action);
 const preview=v.action_previews.find(p=>JSON.stringify(p.action)===JSON.stringify(action));
 assert.equal(v.state.current_corporation,'IR');
 assert.equal(v.state.corporations.IR.president,'p1');
 assert.equal(v.state.corporations.AR.president,'p2');
 assert.equal(preview.president,'p2');assert.equal(preview.holdings_after,0);
 const html=renderLiquidationMat({...v,action_options:[action]},true,actionLabel);
 assert.match(html,/Holdings → 0%/);assert.doesNotMatch(html,/Presidency transfers/);
});

test('liquidation renderer retains a warning for an actual projected presidency change',()=>{
 const v=structuredClone(views.presidency_sale);
 const preview=v.action_previews.find(p=>p.action.type==='sell_shares' && p.action.corporation==='AR' && p.action.percent===10);
 assert.ok(preview);
 assert.equal(v.state.corporations.AR.president,'p1');assert.equal(preview.president,'p2');
 // Exercise the rendering contract with a genuine engine stock-sale projection.
 // The emergency validator prohibits this transfer; no legality rule is changed.
 const action={...preview.action,type:'emergency_sell'};
 v.state.current_corporation='IR';v.state.corporations.IR.president='p2';
 v.action_options=[action];v.action_previews=[{...preview,action}];
 const html=renderLiquidationMat(v,true,actionLabel);
 assert.match(html,/Holdings → 20% · Presidency transfers/);
});

// Phase changes and trade-ins change the number of physical bays as well as cash.
test('fleet previews account for phase limits, rust and Diesel trade-ins',()=>{
 const v=structuredClone(views.train_normal), corp=v.state.corporations.IR;
 corp.trains=['2-0'];v.state.trains['2-0'].owner='IR';
 assert.deepEqual(projectedFleet(v,{type:'buy_train',train:'4-0'}),{trains:['4-0'],limit:3});
 v.state.phase='6';corp.trains=['4-0','6-0'];v.state.trains['4-0'].owner='IR';v.state.trains['6-0'].owner='IR';
 assert.deepEqual(projectedFleet(v,{type:'buy_train',train:'D-0',trade_in:'6-0'}),{trains:['D-0'],limit:2});
});
