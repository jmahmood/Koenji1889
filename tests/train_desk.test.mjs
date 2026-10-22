import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
  projectedFleet,
  projectedFleetDetails,
  depotTiers,
  renderInlineTrainDesk,
  renderTrainPurchaseModal,
  renderLiquidationMat,
  stagedDepotAction,
  syncEmergencyDesk,
  trainStageKey,
  currentWizardStep,
  setWizardStep,
  currentWizardSource,
  isValidInterCompanyTrainPurchase,
  renderInterCompanyMarket,
  renderRustImpactStep,
  renderFinancingStep,
  renderVoucherSummaryStep,
  renderSellerOfferDesk
} from '../src/components/TrainDesk.js';
import {renderDecisionDesk, actionLabel, bindDecisionDesk} from '../src/components/DecisionDesk.js';

const views=JSON.parse(execFileSync('python3',['tests/decision_fixtures.py'],{encoding:'utf8'}));
const app=v=>({roomCode:'test',activeModal:null,view:'map',viewRevision:v.state.revision,liveRevision:v.state.revision,displayedViewData:v});

test('map dock launches a full-page wizard with grouped depot stock and one visible step',()=>{
 const v=views.train_normal,s=app(v), tier=depotTiers(v).find(t=>t.type==='2');
 assert.equal(tier.ids.length,6);assert.equal(tier.actions.length,1);
 const dock=renderInlineTrainDesk(s,v);
 assert.match(dock,/data-open-train-wizard/);assert.doesNotMatch(dock,/data-buy-train|data-stamp-train|train-wizard-stepper/);
 assert.equal(renderTrainPurchaseModal(s,v),'');
 s.activeModal='train';const html=renderTrainPurchaseModal(s,v);
 assert.match(html,/role="dialog" aria-modal="true"/);assert.match(html,/train-purchase-modal/);
 assert.equal((html.match(/data-buy-train=/g)||[]).length,1);
 assert.equal((html.match(/data-wizard-panel="\d" hidden/g)||[]).length,4);
 assert.match(html,/data-wizard-panel="1"  tabindex/);
 assert.equal(stagedDepotAction(s,v),null,'a routine purchase requires explicit selection');
 s.trainStageKey=trainStageKey(s,v);s.trainStage={type:'buy_train',train:'invalid'};
 assert.equal(stagedDepotAction(s,v),null);
});

test('dispatch uses one summary and keeps its purchase action in the persistent footer',()=>{
 const v=views.train_normal,s={...app(v),activeModal:'train'};
 s.trainStageKey=trainStageKey(s,v);s.trainStage=v.action_options.find(a=>a.type==='buy_train');
 setWizardStep(s,v,5);
 const html=renderTrainPurchaseModal(s,v),footer=html.slice(html.indexOf('<footer class="train-wizard-footer">'));
 assert.equal((html.match(/data-stamp-train=/g)||[]).length,1);
 assert.match(footer,/data-stamp-train=/);
 assert.doesNotMatch(html,/class="dispatch-voucher/);
 assert.match(html,/wizard-voucher-summary-grid/);
});

test('inline stamp submits one exact legal action and rejects stale or historical clicks',async()=>{
 const v=views.train_normal,s=app(v), action=v.action_options.find(a=>a.type==='buy_train'), events=new Map();
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

test('train purchase wizard opens only by player choice, including mandatory and emergency purchases',()=>{
 const v=views.train_purse,s=app(v);
 assert.ok(v.train_financing.shortfall>0);assert.ok(v.train_financing.personal_cash>=v.train_financing.shortfall);
 syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 s.activeModal=null;syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 s.isSubmitting=true;syncEmergencyDesk(s,v);s.isSubmitting=false;syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 syncEmergencyDesk(s,views.routes);syncEmergencyDesk(s,v);assert.equal(s.activeModal,null);
 for(const name of ['train_normal','train_used','emergency']) {
  const purchase=views[name],state=app(purchase);
  syncEmergencyDesk(state,purchase);assert.equal(state.activeModal,null);
  assert.match(renderInlineTrainDesk(state,purchase),/data-open-train-wizard/);
  state.activeModal='train';syncEmergencyDesk(state,purchase);assert.equal(state.activeModal,'train');
  syncEmergencyDesk(state,views.routes);assert.equal(state.activeModal,null);
 }
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
 const action={...preview.action,type:'emergency_sell'};
 v.state.current_corporation='IR';v.state.corporations.IR.president='p2';
 v.action_options=[action];v.action_previews=[{...preview,action}];
 const html=renderLiquidationMat(v,true,actionLabel);
 assert.match(html,/Holdings → 20% · Presidency transfers/);
});

test('fleet previews account for phase limits, rust and Diesel trade-ins',()=>{
 const v=structuredClone(views.train_normal), corp=v.state.corporations.IR;
 corp.trains=['2-0'];v.state.trains['2-0'].owner='IR';
 assert.deepEqual(projectedFleet(v,{type:'buy_train',train:'4-0'}),{trains:['4-0'],limit:3});
 v.state.phase='6';corp.trains=['4-0','6-0'];v.state.trains['4-0'].owner='IR';v.state.trains['6-0'].owner='IR';
 assert.deepEqual(projectedFleet(v,{type:'buy_train',train:'D-0',trade_in:'6-0'}),{trains:['D-0'],limit:2});
});

test('train wizard state management step clamping and source switching',()=>{
 const v=views.train_normal, s=app(v);
 assert.equal(currentWizardStep(s,v), 1);
 setWizardStep(s, v, 3);
 assert.equal(currentWizardStep(s,v), 3);
 setWizardStep(s, v, 99);
 assert.equal(currentWizardStep(s,v), 5);
 setWizardStep(s, v, -5);
 assert.equal(currentWizardStep(s,v), 1);
 assert.equal(currentWizardSource(s,v), 'depot');
 s.trainWizardSource = 'market';
 assert.equal(currentWizardSource(s,v), 'market');
});

test('isValidInterCompanyTrainPurchase strictly enforces rules for self-deal and cross-player handshake',()=>{
 const v=structuredClone(views.train_normal);
 const s=v.state;
 s.current_corporation = 'IR';
 s.corporations.IR.cash = 150;
 s.corporations.IR.trains = [];
 s.corporations.AR = {id: 'AR', name: 'Awa Railroad', cash: 80, president: s.corporations.IR.president, trains: ['2-0']};
 s.trains['2-0'] = {type: '2', owner: 'AR', price: 80, rusted: false};
 s.round = 'operating';
 s.operating_turn = {step: 'train'};
 v.legal_actions = {types: ['buy_train']};

 // 1. Common President: Price between ¥1 and corporate cash
 assert.ok(isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 50}, v));
 assert.ok(isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 1}, v));
 assert.ok(isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 150}, v));
 // Out of bounds
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 0}, v));
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 151}, v));
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 20.5}, v));

 // 2. Capacity limit check
 s.corporations.IR.trains = ['2-1', '2-2', '2-3', '2-4'];
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 50}, v));
 s.corporations.IR.trains = [];

 // 3. Emergency sales lock out inter-company buys
 s.operating_turn.emergency_sales = [{type: 'emergency_sell'}];
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 50}, v));
 s.operating_turn.emergency_sales = [];

 // 4. Cross-Player deal (different presidents) requires signed seller offer in state.offers
 s.corporations.AR.president = 'other_player';
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 50}, v));
 s.offers = [{
   kind: 'train',
   item: '2-0',
   seller: 'AR',
   buyer: 'IR',
   price: 50,
   offered_by: 'other_player'
 }];
 assert.ok(isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 50}, v));
 // Offer price mismatch
 assert.ok(!isValidInterCompanyTrainPurchase({type: 'buy_train', train: '2-0', price: 60}, v));
});

test('renderInterCompanyMarket renders incoming offers with seals and common president sliders',()=>{
 const v=structuredClone(views.train_normal);
 const s=v.state;
 s.current_corporation = 'IR';
 s.corporations.IR.cash = 200;
 s.corporations.AR = {id: 'AR', name: 'Awa Railroad', cash: 100, president: s.corporations.IR.president, trains: ['2-1']};
 s.corporations.KO = {id: 'KO', name: 'Kotohira Express', cash: 90, president: 'p2', trains: ['2-2']};
 s.trains['2-1'] = {type: '2', owner: 'AR', price: 80, rusted: false};
 s.trains['2-2'] = {type: '2', owner: 'KO', price: 80, rusted: false};
 s.offers = [{
   kind: 'train',
   item: '2-2',
   seller: 'KO',
   buyer: 'IR',
   price: 75,
   offered_by: 'p2'
 }];
 const a=app(v);

 const marketHtml = renderInterCompanyMarket(a, v);
 // Incoming offer card
 assert.match(marketHtml, /INCOMING DEAL · 売主印 SELLER SIGNED/);
 assert.match(marketHtml, /買主印 Accept &amp; Sign ¥75/);
 assert.match(marketHtml, /data-counter-offer-train="2-2"/);
 assert.match(marketHtml, /data-reject-train-offer="KO:2-2:75"/);

 // Common president self-transfer
 assert.match(marketHtml, /COMMON PRESIDENT · SELF-TRANSFER/);
 assert.match(marketHtml, /data-common-price-slider="2-1"/);
 assert.match(marketHtml, /President Purses: <b>¥0 \(Untouched\)<\/b>/);

 // Solicit other railways
 assert.match(marketHtml, /SOLICIT OTHER RAILWAYS/);
 assert.match(marketHtml, /SOLICIT ENGINE FROM KO/);
});

test('renderRustImpactStep and renderFinancingStep render full impact details',()=>{
 const v=structuredClone(views.train_normal);
 const s=v.state;
 s.phase = '3';
 s.current_corporation = 'IR';
 s.corporations.IR.cash = 400;
 s.corporations.IR.trains = ['2-0'];
 s.corporations.AR = {id: 'AR', name: 'Awa Railroad', cash: 120, president: 'p1', trains: ['2-1', '3-0']};
 s.trains['4-0'] = {type: '4', owner: 'depot', price: 300};

 const action = {type: 'buy_train', train: '4-0'};
 const rustHtml = renderRustImpactStep(v, action);
 assert.match(rustHtml, /PHASE 4 TRANSITION PREVIEW/);
 assert.match(rustHtml, /ALL 2-TRAINS WILL RUST/);
 assert.match(rustHtml, /Awa Railroad/);

 const finHtml = renderFinancingStep(v, action);
 assert.match(rustHtml, /Awa Railroad/);
 assert.match(finHtml, /Safe \(Buyer\)/);
 assert.match(finHtml, /No personal contribution required/);
 assert.doesNotMatch(finHtml, /President’s Personal Purse|wizard-emergency-contribution/);
});

test('renderSellerOfferDesk renders scroll and ledger for out-of-turn offers',()=>{
 const v=structuredClone(views.train_normal);
 const s=v.state;
 v.viewer = {player_id: 'p1'};
 s.current_corporation = 'IR';
 s.corporations.IR.president = 'p1';
 s.corporations.IR.trains = ['2-0'];
 s.corporations.AR = {id: 'AR', name: 'Awa Railroad', cash: 180, president: 'p2', trains: []};
 s.trains['2-0'] = {type: '2', owner: 'IR', price: 80, rusted: false};
 s.offers = [{
   kind: 'train',
   item: '2-0',
   seller: 'IR',
   buyer: 'AR',
   price: 60,
   offered_by: 'p1'
 }];
 const a=app(v);
 const sellerHtml = renderSellerOfferDesk(a, v);

 assert.match(sellerHtml, /CLUB TRANSFER SCROLL · PROPOSE ENGINE SALE/);
 assert.match(sellerHtml, /data-seller-offer-form/);
 assert.match(sellerHtml, /data-seller-add-chip="10"/);
 assert.match(sellerHtml, /data-seller-add-chip="50"/);
 assert.match(sellerHtml, /MATCH OFFER LEDGER/);
 assert.match(sellerHtml, /posted-seller-offers/);
 assert.match(sellerHtml, /IR ➔ AR/);
});

test('financing previews never authorize an unfunded purchase, and used deals hide depot liquidation',()=>{
 const v=views.emergency,s={...app(v),activeModal:'train'};
 setWizardStep(s,v,5);
 const preview=stagedDepotAction(s,v);
 assert.ok(preview,'cheapest depot engine remains previewable before liquidation');
 assert.ok(!v.action_options.some(a=>JSON.stringify(a)===JSON.stringify(preview)));
 const html=renderTrainPurchaseModal(s,v);
 assert.match(html,/data-stamp-train=[^>]+disabled/);
 assert.match(html,/EMERGENCY STOCK LIQUIDATION MAT/);
 const used=structuredClone(views.train_used), us={...app(used),activeModal:'train'};
 used.state.corporations.IR.cash=20;used.state.offers[0].price=10;
 used.train_financing={mandatory:true,shortfall:60,cheapest:80,personal_cash:370};
 us.trainStageKey=trainStageKey(us,used);us.trainStage={type:'buy_train',train:'3-0',price:10};
 setWizardStep(us,used,4);
 const usedHtml=renderTrainPurchaseModal(us,used);
 assert.doesNotMatch(usedHtml,/EMERGENCY STOCK LIQUIDATION MAT/);
 assert.match(usedHtml,/Safe \(Seller\)/);
 assert.match(usedHtml,/No personal contribution required/);
 assert.doesNotMatch(usedHtml,/wizard-emergency-contribution/);
});

test('new revisions invalidate staged consent; interrupted turns never open a train wizard',()=>{
 const v=structuredClone(views.train_used),s={...app(v),activeModal:'train'};
 s.trainStageKey=trainStageKey(s,v);s.trainStage={type:'buy_train',train:'3-0',price:100};
 setWizardStep(s,v,5);assert.ok(stagedDepotAction(s,v));
 v.state.revision++;assert.equal(currentWizardStep(s,v),1);assert.equal(stagedDepotAction(s,v),null);
 for(const name of ['er_train','discard','finished'])assert.equal(renderTrainPurchaseModal({...app(views[name]),activeModal:'train'},views[name]),'');
 const action={type:'buy_train',train:'3-0',price:100};
 const foreign=structuredClone(views.train_used);foreign.viewer.player_id='p2';
 assert.equal(isValidInterCompanyTrainPurchase(action,foreign),false);
 assert.equal(isValidInterCompanyTrainPurchase({...action,price:'100'},views.train_used),false);
 assert.equal(isValidInterCompanyTrainPurchase({...action,trade_in:'2-0'},views.train_used),false);
});

test('wizard navigation waits for a selection; buyer opens wizard while an out-of-turn seller opens planning',()=>{
 const previous=globalThis.document;
 const handlers=new Map();
 const button=selector=>({dataset:{},addEventListener:(event,fn)=>handlers.set(selector,fn)});
 const selectors=['[data-open-desk]','[data-wizard-next]','[data-stage-used-train]'];
 const buttons=new Map(selectors.map(selector=>[selector,button(selector)]));
 globalThis.document={querySelectorAll:selector=>buttons.has(selector)?[buttons.get(selector)]:[]};
 try {
  const v=views.train_used,s=app(v),executed=[],messages=[];
  bindDecisionDesk({app:s,render:()=>{},execute:a=>executed.push(a),toast:m=>messages.push(m)});
  handlers.get('[data-open-desk]')();assert.equal(s.activeModal,'train');
  handlers.get('[data-wizard-next]')();assert.equal(currentWizardStep(s,v),2);
  handlers.get('[data-wizard-next]')();assert.equal(currentWizardStep(s,v),2);
  const invalid={type:'buy_train',train:'3-0',price:99};
  handlers.get('[data-stage-used-train]')({currentTarget:{dataset:{stageUsedTrain:JSON.stringify(invalid)}}});
  assert.equal(stagedDepotAction(s,v),null);assert.deepEqual(executed,[]);
  const valid={...invalid,price:100};handlers.get('[data-stage-used-train]')({currentTarget:{dataset:{stageUsedTrain:JSON.stringify(valid)}}});
  assert.equal(currentWizardStep(s,v),3);assert.deepEqual(stagedDepotAction(s,v),valid);assert.deepEqual(executed,[]);
  const seller=structuredClone(v);seller.viewer.player_id='p2';s.displayedViewData=seller;s.activeModal=null;
  handlers.get('[data-open-desk]')();assert.equal(s.activeModal,'decisions');
 } finally {globalThis.document=previous;}
});

test('canceling an emergency share sale keeps the chosen locomotive staged',()=>{
 const v=views.emergency,s={...app(v),activeModal:'train'},handlers=new Map();
 const previous=globalThis.document;
 globalThis.document={querySelectorAll:selector=>selector==='[data-cancel-reviewed]'?[{addEventListener:(_event,fn)=>handlers.set('cancel',fn)}]:[]};
 try {
  const train=stagedDepotAction(s,v);s.trainStageKey=trainStageKey(s,v);s.trainStage=train;
  s.reviewAction=v.action_options.find(a=>a.type==='emergency_sell');assert.ok(s.reviewAction);
  bindDecisionDesk({app:s,render:()=>{},execute:()=>{},toast:()=>{}});
  handlers.get('cancel')();assert.equal(s.reviewAction,null);assert.deepEqual(stagedDepotAction(s,v),train);
 } finally {globalThis.document=previous;}
});
