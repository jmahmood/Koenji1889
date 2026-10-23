import {escapeHtml as esc, actionBlockReason} from '../ui/presentation.js';
import {renderTrainNewspaper} from './TrainNewspaper.js';
import {renderCharacter} from '../scene/Character.js';

const money = n => `¥${Number(n || 0).toLocaleString()}`;
const attr = value => esc(JSON.stringify(value));
const PHASE_NOTES = {
  '2': 'Runs 2 stops · Rusts when the first 4-Train is bought',
  '3': 'Phase 3 · Green track & private purchases · Rusts at Phase 6',
  '4': 'Phase 4 · Rusts all 2-Trains · Train limit becomes 3',
  '5': 'Phase 5 · Brown track · Train limit becomes 2 · Permanent',
  '6': 'Phase 6 · Rusts all 3-Trains · Permanent',
  'D': 'Phase D · Rusts all 4-Trains · Permanent',
};
const PHASE_ORDER = ['2', '3', '4', '5', '6', 'D'];
const PHASE_LIMITS = {'2': 4, '3': 4, '4': 3, '5': 2, '6': 2, 'D': 2};
const PHASE_RUSTS = {'4': '2', '6': '3', 'D': '4'};

export const trainStageKey = (app, view) => `${app.roomCode}:${view.state.revision}:${view.state.current_corporation}`;

export function isValidInterCompanyTrainPurchase(action, view) {
  if (!action || action.type !== 'buy_train' || action.trade_in || action.price === undefined) return false;
  const s = view?.state;
  if (!s || s.finished || s.pending_special || s.pending_discards?.length || s.round !== 'operating' || s.operating_turn?.step !== 'train') return false;
  if (view.is_historical || view.viewer?.player_id !== s.corporations?.[s.current_corporation]?.president) return false;
  if (!(view.legal_actions?.types || []).includes('buy_train')) return false;
  if (s.operating_turn?.emergency_sales?.length) return false;
  const cid = s.current_corporation;
  const corp = s.corporations?.[cid];
  const train = s.trains?.[action.train];
  if (!corp || !train || train.rusted) return false;
  const seller = train.owner;
  if (!seller || seller === 'depot' || seller === cid || !s.corporations?.[seller]) return false;
  const limit = view.train_limit || PHASE_LIMITS[String(s.phase)] || 4;
  if ((corp.trains?.length || 0) >= limit) return false;
  const price = action.price;
  if (!Number.isInteger(price) || price < 1 || price > (corp.cash || 0)) return false;
  const sellerPres = s.corporations[seller]?.president;
  const buyerPres = corp.president;
  if (sellerPres && sellerPres === buyerPres) return true;
  return (s.offers || []).some(
    o =>
      o.kind === 'train' &&
      o.item === action.train &&
      o.seller === seller &&
      o.buyer === cid &&
      o.price === price &&
      o.offered_by === sellerPres
  );
}

function emergencyDepotPreview(view) {
  if (!view.train_financing?.mandatory || !view.train_financing.shortfall) return null;
  const train = (view.available_depot_trains || []).find(id => view.state.trains[id]?.price === view.train_financing.cheapest);
  return train ? {type:'buy_train', train} : null;
}

export function stagedDepotAction(app, view) {
  const legal = (view.action_options || []).filter(a => a.type === 'buy_train');
  if (app.trainStageKey === trainStageKey(app, view)) {
    if (!app.trainStage) return null;
    const match = legal.find(a => JSON.stringify(a) === JSON.stringify(app.trainStage));
    if (match) return match;
    if (JSON.stringify(app.trainStage) === JSON.stringify(emergencyDepotPreview(view))) return app.trainStage;
    if (isValidInterCompanyTrainPurchase(app.trainStage, view)) return app.trainStage;
    return null;
  }
  return emergencyDepotPreview(view);
}

export function currentWizardStep(app, view) {
  const key = trainStageKey(app, view);
  if (app.trainWizardKey === key && Number.isInteger(app.trainWizardStep) && app.trainWizardStep >= 1 && app.trainWizardStep <= 5) {
    return app.trainWizardStep;
  }
  return 1;
}

export function setWizardStep(app, view, step) {
  app.trainWizardKey = trainStageKey(app, view);
  app.trainWizardStep = Math.max(1, Math.min(5, Math.trunc(Number(step)) || 1));
}

export function currentWizardSource(app, view) {
  const key = trainStageKey(app, view);
  if (app.trainWizardKey === key && (app.trainWizardSource === 'depot' || app.trainWizardSource === 'market')) {
    return app.trainWizardSource;
  }
  return 'depot';
}

// Count physical engines, but select only an exact action accepted by the server.
export function depotTiers(view) {
  const groups = new Map();
  const available = new Set(view.available_depot_trains || []);
  for (const [id, train] of Object.entries(view.state.trains || {})) {
    if (train.owner !== 'depot' || train.rusted) continue;
    const key = `${train.type}:${train.price}:${train.used ? 'returned' : 'new'}`;
    if (!groups.has(key)) groups.set(key, {type: train.type, price: train.price, used: Boolean(train.used), ids: [], available: false, actions: []});
    const tier = groups.get(key);
    tier.ids.push(id);
    tier.available ||= available.has(id);
  }
  for (const tier of groups.values()) {
    const actions = (view.action_options || []).filter(a => a.type === 'buy_train' && tier.ids.includes(a.train));
    // Trade-ins are distinct deals, not duplicate serial-number engines.
    tier.actions = actions.filter((a, i) => actions.findIndex(b => (b.trade_in || '') === (a.trade_in || '')) === i);
  }
  return [...groups.values()];
}

export const TRAIN_ART = {
  '2': {name: 'Iyo Railway No. 1', file: 'iyo-no1'},
  '3': {name: 'Class 8620 · No. 58685', file: '8620-58685'},
  '4': {name: 'Class C58 · No. C58 333', file: 'c58-333'},
  '5': {name: 'Class C11', file: 'c11'},
  '6': {name: 'Class D51', file: 'd51'},
  'D': {name: 'Class DF50 · Diesel', file: 'df50'},
};
export function locomotiveArt(type = '2') {
  const art = TRAIN_ART[type];
  const fallback = neutralLocomotiveArt(type);
  return art ? `<span class="historical-train-art has-illustration" aria-hidden="true">${fallback}<img data-train-art src="/assets/trains/${art.file}-640.webp" srcset="/assets/trains/${art.file}-640.webp 640w, /assets/trains/${art.file}-1280.webp 1280w" sizes="(max-width: 600px) 85vw, 380px" width="1280" height="720" alt="" decoding="async"></span>` : fallback;
}
function historicalName(type) {
  return TRAIN_ART[type] ? `<span class="historical-train-name" data-no-translate>${esc(TRAIN_ART[type].name)}</span>` : '';
}
function neutralLocomotiveArt(type) {
  if(type === 'D') return `<svg class="locomotive-engraving diesel-fallback" viewBox="0 0 180 82" aria-hidden="true"><g stroke="currentColor" stroke-width="2"><path d="M12 57V29l12-13h130l13 13v28Z" fill="#964335"/><path d="M17 32h145V22H24Z" fill="#eee0ba"/><path d="M20 25h19v14H20Zm124 0h14v14h-14Z" fill="#263b3c"/><path d="M49 26h81v24H49Z" fill="#48443b"/><path d="M54 30h70m-70 6h70m-70 6h70"/><path d="M9 57h160v6H9Z" fill="#2c2924"/>${[27,47,80,100,133,153].map(x=>`<circle cx="${x}" cy="66" r="7" fill="#302e29"/>`).join('')}</g></svg>`;
  return `<svg class="locomotive-engraving" viewBox="0 0 180 82" aria-hidden="true"><path d="M8 68Q60 10 118 24T174 14L174 73H8Z" fill="#af9261" opacity=".26"/><path d="M25 25Q59 4 91 23Q62 12 25 25" fill="#fff8d4"/><g stroke="currentColor" stroke-width="2"><path d="M22 54h24V35h23v19h13V29h30v25h18V40h11v17l13 12H22Z" fill="#252d29"/><path d="M49 38h15v13H49Zm37-5h18v18H86Z" fill="#d8ac50"/><path d="m113 18 9 1-3 23h-5Z" fill="#27251e"/><path d="M78 55h53v10H78Z" fill="#444b3a"/><path d="m139 58 18 13h-18Z" fill="#a62720"/>${[36,66,94,124].map((x,i)=>`<circle cx="${x}" cy="65" r="${i===1||i===2?10:7}" fill="#292924"/><circle cx="${x}" cy="65" r="2" fill="#d6a84f"/>`).join('')}<path d="M66 65h28" stroke-width="3"/><circle cx="137" cy="42" r="4" fill="#ffe1a0"/></g><text x="165" y="18" text-anchor="end" font-size="13" font-family="Georgia" fill="currentColor">${esc(type)}</text></svg>`;
}

export function projectedFleetDetails(view, action) {
  const s=view.state, corp=s.corporations[s.current_corporation];
  const train=s.trains[action?.train];
  let phase=String(s.phase), rusts=null;
  if (action?.type==='buy_train' && train?.owner==='depot' && PHASE_ORDER.indexOf(train.type)>PHASE_ORDER.indexOf(phase)) {
    phase=train.type;rusts=PHASE_RUSTS[phase];
  }
  const trains=(corp?.trains || []).filter(id=>id!==action?.trade_in && (!rusts || s.trains[id]?.type!==rusts));
  if (action?.type==='buy_train' && !trains.includes(action.train)) trains.push(action.train);
  return {trains,limit:PHASE_LIMITS[phase] || view.train_limit || 4, phase, rusts};
}

export function projectedFleet(view, action) {
  const {trains, limit} = projectedFleetDetails(view, action);
  return {trains, limit};
}

export function renderRoundhouse(view, action) {
  const s = view.state, corp = s.corporations[s.current_corporation];
  if (!corp) return '<p>No operating fleet.</p>';
  const owned = corp.trains || [];
  const {trains:fleet,limit}=projectedFleet(view,action);
  const currentLimit = view.train_limit || limit;
  const stalls = Array.from({length: Math.max(currentLimit, owned.length)}, (_, idx) => {
    const id = owned[idx];
    if (id) {
      const t = s.trains[id];
      const willRust = action?.type === 'buy_train' && !fleet.includes(id) && id !== action.trade_in;
      const isTraded = action?.trade_in === id;
      return `<div class="wizard-stall is-occupied ${willRust ? 'is-rusted' : ''} ${isTraded ? 'is-traded' : ''}">
        ${locomotiveArt(t?.type)}
        <span class="stall-badge" data-owned-train="${esc(id)}">${esc(t?.type || '?')}-Train (#${esc(id)})</span>
        ${historicalName(t?.type)}<small>${willRust ? '⚠️ Rusts on purchase' : isTraded ? '⇄ Traded in (−¥300)' : `${t?.type === 'D' ? 'Unlimited' : (t?.distance || t?.type)} stops · Active`}</small>
      </div>`;
    }
    const isStagedSlot = action?.type === 'buy_train' && idx === owned.length && idx < limit;
    if (isStagedSlot) {
      const st = s.trains[action.train];
      return `<div class="wizard-stall is-staged">
        ${locomotiveArt(st?.type)}<span class="stall-badge">+ ${esc(st?.type || '?')}-Train (#${esc(action.train)})</span>
        <small>Staged Acquisition · ${money(trainCost(view, action))}</small>
      </div>`;
    }
    return `<div class="wizard-stall is-empty"><div class="empty-stall-track" aria-hidden="true">${neutralLocomotiveArt('')}</div><span class="stall-badge">Empty Stall #${idx + 1}</span><small>Available Capacity</small></div>`;
  }).join('');

  return `<section class="roundhouse ${!owned.length ? 'fleet-empty' : ''}" aria-label="Roundhouse fleet"><div class="roundhouse-plaque"><small>ROUNDHOUSE FLEET</small> · Owned now: ${owned.length} · Train limit: ${currentLimit}</div>${!owned.length ? '<p class="empty-fleet-note">No trains owned</p>' : ''}<div class="wizard-roundhouse-stalls" aria-label="Roundhouse stall breakdown">${stalls}</div>${action?.type==='buy_train' ? `<div class="fleet-after-purchase"><b>After purchase: ${fleet.length} / ${limit}</b><span>${fleet.map(id=>esc(id)).join(' · ') || 'No trains'}${action.trade_in ? ` · Trade in ${esc(action.trade_in)}` : ''}</span><small>Preview only · Purchase not yet confirmed</small></div>` : ''}</section>`;
}

export function renderDepotTray(app, view, {inline = false, compact = inline, action = null, enabled = true} = {}) {
  const tiers=depotTiers(view);
  const active=tiers.filter(t=>t.available);
  const locked=tiers.filter(t=>!t.available);
  const visible=[...active,...locked.slice(0,compact ? 1 : 2)];
  const later=locked.slice(compact ? 1 : 2);
  const renderTier=tier=>{
    const selected = tier.ids.includes(action?.train) && action?.price === undefined;
    const mandatory=Boolean(view.train_financing && tier.available && tier.price===view.train_financing.cheapest);
    const purchase = tier.actions.find(a=>!a.trade_in) || (tier.ids.includes(emergencyDepotPreview(view)?.train) ? emergencyDepotPreview(view) : null);
    const buttonAttr = inline ? `data-buy-train="${esc(purchase?.train)}" data-testid="depot-buy-${esc(tier.type)}"` : `data-review-action="${attr(purchase)}" data-testid="depot-review-${esc(tier.type)}"`;
    return `<article class="locomotive-certificate ${selected ? 'is-staged' : ''} ${mandatory ? 'is-mandatory' : ''} ${!tier.available ? 'is-locked' : ''}"><button type="button" class="depot-tier-button" ${purchase && enabled ? buttonAttr : 'disabled'} aria-pressed="${selected}"><span class="locomotive-title"><b>${mandatory ? 'MANDATORY · ' : tier.used ? 'RETURNED · ' : ''}${esc(tier.type)}-Train</b><strong>${money(tier.price)}</strong></span><span class="locomotive-picture">${locomotiveArt(tier.type)}${!tier.available ? '<span class="depot-chain">🔒</span>' : ''}</span>${historicalName(tier.type)}${tier.type==='D' ? '<small class="diesel-capacity">Unlimited stops</small>' : ''}<span class="depot-stock">${tier.ids.length} in depot <span class="brass-supply" aria-hidden="true">${tier.ids.map(()=>'<i></i>').join('')}</span></span><small>${esc(PHASE_NOTES[tier.type] || '')}</small><span class="locomotive-ribbon">${selected ? `★ STAGED · #${esc(action.train)}` : !tier.available ? tier.type==='D' ? 'LOCKED · Available from Phase 6' : 'LOCKED · Earlier tier must sell out' : !purchase ? 'Financing / train limit prevents purchase' : 'Click certificate to stage'}</span></button>${enabled ? tier.actions.filter(a=>a.trade_in).map(a=>`<button type="button" class="trade-in-option ${JSON.stringify(action)===JSON.stringify(a)?'is-staged':''}" ${inline ? `data-stage-trade-in="${attr(a)}"` : `data-review-action="${attr(a)}"`}>Trade in ${esc(a.trade_in)} · Pay ${money(tier.price-300)}</button>`).join('') : ''}</article>`;
  };
  return `<section class="depot-card-tray" aria-label="Depot locomotive certificates"><h4>LOCOMOTIVE WORKS · DEPOT TRAY</h4>${visible.map(renderTier).join('') || '<p>No depot engines remain.</p>'}${!compact && later.length ? `<details class="future-train-phases"><summary>Later train phases · ${later.map(t=>esc(t.type)).join(' / ')}</summary>${later.map(renderTier).join('')}</details>` : ''}</section>`;
}

export function renderMemberPortrait(view, playerId) {
  const player = view.state.players[playerId];
  return `<div class="desk-member-portrait">${renderCharacter(view.members?.[playerId]?.appearance, {name:player?.name || 'Member',surface:'portrait'})}<b>${esc(player?.name || 'No president')}</b></div>`;
}

export function trainCost(view, action) {
  return action?.type === 'buy_train' ? action.price ?? Math.max(0, (view.state.trains[action.train]?.price || 0) - (action.trade_in ? 300 : 0)) : view.train_financing?.cheapest || 0;
}

export function renderCountingHouse(view, action) {
  const s=view.state, corp=s.corporations[s.current_corporation];
  if (!corp) return '<p>No corporate treasury in this round.</p>';
  const personal=s.players[corp.president]?.cash || 0, cost=trainCost(view,action);
  const isInterCompany = action?.type === 'buy_train' && action.price !== undefined;
  const sellerCid = isInterCompany ? s.trains[action.train]?.owner : null;
  const sellerCorp = sellerCid ? s.corporations?.[sellerCid] : null;
  const contribution= isInterCompany ? 0 : Math.max(0,cost-corp.cash);
  const gap=Math.max(0,contribution-personal);
  const staged=action?.type==='buy_train' || Boolean(view.train_financing?.shortfall);
  const coverage=cost ? Math.min(100,Math.round(corp.cash/cost*100)) : 100;
  return `<section class="counting-house ${contribution ? 'has-shortfall' : ''}" aria-label="Corporate and presidential financing"><h4>COUNTING HOUSE · VAULT vs. PURSE</h4><div class="counting-objects"><div class="vault-object"><div class="iron-safe"><span class="safe-handle">●</span><div class="banknote-bundles">${corp.cash ? Array.from({length:Math.min(6,Math.ceil(corp.cash/100))},()=>'<i>¥100</i>').join('') : '<small>EMPTY</small>'}</div></div><strong>${money(corp.cash)} Safe</strong><small>${esc(corp.id || s.current_corporation)} Safe (Buyer): ${money(corp.cash)}${staged ? ` → ${money(Math.max(0,corp.cash-cost))} (−${money(cost)})` : ''}</small>${sellerCorp ? `<small class="seller-safe-credit">${esc(sellerCid)} Safe (Seller): ${money(sellerCorp.cash)} → ${money(sellerCorp.cash + cost)} (+${money(cost)})</small>` : ''}</div><div class="brass-balance"><svg viewBox="0 0 110 70" role="img" aria-label="Vault covers ${coverage}%"><path d="M10 60a45 45 0 0 1 90 0Z" fill="#762e22" stroke="#d4ab4e" stroke-width="3"/><path d="M10 60a45 45 0 0 1 45-45v45Z" fill="#285a3a"/><path d="M55 60 55 24" stroke="#ffe49c" stroke-width="3" transform="rotate(${contribution ? 40 : -40} 55 60)"/><circle cx="55" cy="60" r="5" fill="#d4ab4e"/></svg><strong>${contribution ? `President due ${money(contribution)}` : `VAULT COVERS ${coverage}%`}</strong><span>${gap ? `Unfunded shortfall: −${money(gap)}` : 'Shortfall: ¥0'}</span></div><div class="purse-object">${renderMemberPortrait(view,corp.president)}<span class="leather-purse" aria-hidden="true">● ● ●</span><strong>${money(personal)} Purse</strong><small>${staged && contribution ? `→ ${money(Math.max(0,personal-contribution))} after purchase` : `${esc(s.players[corp.president]?.name || 'President')} · President Purses: ¥0 (Untouched)`}</small></div></div></section>`;
}

// Corporate treasury is the payer; personal funds appear only when required.
export function renderFinancingStep(view, action) {
  const s = view.state, cid = s.current_corporation, corp = s.corporations[cid];
  if (!corp) return '';
  const cost = trainCost(view, action), personal = s.players[corp.president]?.cash || 0;
  const interCompany = action?.price !== undefined;
  const debit = Math.min(corp.cash, cost), contribution = interCompany ? 0 : Math.max(0, cost - corp.cash);
  const seller = interCompany ? s.corporations[s.trains[action.train]?.owner] : null;
  return `<section class="wizard-financing" aria-label="Train purchase payment">
    <div class="wizard-money-grid">
      <article class="wizard-money-card"><small>CORPORATE SAFE · ${esc(cid)}</small><h3>Safe (Buyer)</h3><strong>${money(corp.cash)} → ${money(corp.cash - debit)}</strong><p>Corporate payment: −${money(debit)}</p><b>${contribution ? `President must supply ${money(contribution)}` : '✓ Treasury covers 100%'}</b></article>
      ${seller ? `<article class="wizard-money-card"><small>CORPORATE SAFE · ${esc(seller.id)}</small><h3>Safe (Seller)</h3><strong>${money(seller.cash)} → ${money(seller.cash + cost)}</strong><p>Receives: +${money(cost)}</p><b>Corporate treasury transfer · Personal funds untouched</b></article>` : ''}
    </div>
    ${contribution > 0
      ? `<aside class="wizard-emergency-contribution" aria-label="Required emergency contribution"><h3>Required emergency contribution · ${money(contribution)}</h3><p>${esc(s.players[corp.president]?.name || 'The president')} must cover the remaining cost of this mandatory depot purchase.</p><p>Personal cash: ${money(personal)} → ${money(Math.max(0, personal - contribution))}</p><b>${contribution > personal ? `Still unfunded: ${money(contribution - personal)}` : 'Covered by personal cash'}</b></aside>`
      : '<p class="wizard-personal-note">✓ No personal contribution required.</p>'}
    ${!action ? '<p role="status">Choose a train in Selection. These figures show the cheapest mandatory depot alternative.</p>' : ''}
  </section>`;
}

export function renderVoucherSummaryStep(view, action) {
  if (action?.type !== 'buy_train') return '';
  const s = view.state, cid = s.current_corporation, corp = s.corporations[cid];
  const cost = trainCost(view, action), {trains, limit, phase, rusts} = projectedFleetDetails(view, action);
  const seller = s.trains[action.train]?.owner, contribution = action.price !== undefined ? 0 : Math.max(0, cost - corp.cash);
  const rows = [
    ['Operating Railway', `${cid} (${corp.name})`],
    ['Locomotive Acquired', `${s.trains[action.train]?.type}-Train (#${action.train})`],
    ['Purchase Source', seller === 'depot' ? 'Bank Depot' : `${seller} · Inter-Company Transfer`],
    ['Total Price Paid', `${money(cost)}${action.trade_in ? ` · Trade in #${action.trade_in}` : ''}`],
    ['Corporate Safe', `${money(corp.cash)} → ${money(Math.max(0, corp.cash - cost))}`],
    ...(seller !== 'depot' ? [['Seller Safe', `${seller}: ${money(s.corporations[seller]?.cash)} → ${money((s.corporations[seller]?.cash || 0) + cost)}`]] : []),
    ...(contribution > 0 ? [['Required Presidential Contribution', `${money(contribution)} contributed`]] : []),
    ['Fleet After', `${trains.join(', ')} · ${trains.length} of ${limit} stalls`],
    ['Phase & Rust Impact', `Phase ${s.phase} → ${phase}${rusts ? ` · ALL ${rusts}-TRAINS WILL RUST` : ' · No rust'}`],
  ];
  return `<div class="dispatch-train-portrait">${locomotiveArt(s.trains[action.train]?.type)}${historicalName(s.trains[action.train]?.type)}</div><dl class="wizard-voucher-summary-grid">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${contribution ? '' : '<p class="wizard-personal-note">✓ No personal contribution required.</p>'}`;
}

export function renderLiquidationMat(view, enabled, labelAction, stagedAction=null) {
  const s=view.state, sales=(view.action_options || []).filter(a=>a.type==='emergency_sell');
  const president=s.corporations[s.current_corporation]?.president;
  const gap=Math.max(0,(view.train_financing?.shortfall || 0)-(view.train_financing?.personal_cash || 0));
  const certificates=sales.length ? sales : Object.entries(s.corporations).filter(([,c])=>c.holdings?.[president]).map(([id])=>({corporation:id,percent:10}));
  return `<section class="liquidation-mat ${sales.length ? 'is-active' : ''}" aria-label="Emergency stock liquidation"><h4>EMERGENCY STOCK LIQUIDATION MAT ${sales.length ? '· ACTIVE' : '· STANDBY'}</h4><p>${sales.length ? `Raise ${money(gap)} · Select a certificate to review its sale.` : 'Certificates unlock only when emergency share sales are legal.'}</p><div class="engraved-certificates">${certificates.map(a=>{
    const corp=s.corporations[a.corporation], proceeds=(view.prices[a.corporation] || 0)*a.percent/10;
    const preview=view.action_previews?.find(p=>JSON.stringify(p.action)===JSON.stringify(a));
    const presidencyTransfers=preview && preview.president !== corp?.president;
    return `<button type="button" class="engraved-certificate ${JSON.stringify(a)===JSON.stringify(stagedAction) ? 'is-selected' : ''}" aria-pressed="${JSON.stringify(a)===JSON.stringify(stagedAction)}" ${a.type && enabled ? `data-review-action="${attr(a)}"` : 'disabled'}><b>${esc(a.corporation)} · ${esc(corp?.name)} · ${a.percent}%</b><small>ENGRAVED SHARE CERTIFICATE</small><strong>+${money(proceeds)} Cash</strong>${preview ? `<span>Market ${money(view.prices[a.corporation])} → ${money(preview.price_after)}<br>Purse ${money(s.players[president]?.cash)} → ${money(preview.cash_after)}<br>Holdings → ${preview.holdings_after}%${presidencyTransfers ? ' · Presidency transfers' : ''}</span>` : '<span>🔒 No legal emergency sale</span>'}${a.type ? `<em>${esc(labelAction(a,view))}</em>` : ''}</button>`;
  }).join('') || '<p>No share certificates held.</p>'}</div></section>`;
}

export function renderTrainVoucher(app, view, action, {inline=false, enabled=true, label=''}={}) {
  if (!action) return `<section class="dispatch-voucher"><small>DISPATCH VOUCHER · REVISION ${view.state.revision}</small><p>Select a locomotive or deal to prepare an order.</p></section>`;
  const s=view.state, corp=s.corporations[s.current_corporation], cost=trainCost(view,action);
  const sale=action.type==='emergency_sell';
  const afterFleet=projectedFleet(view,action);
  const preview=view.action_previews?.find(p=>JSON.stringify(p.action)===JSON.stringify(action));
  const controls=inline ? `data-stamp-train="${attr(action)}" data-stamp-revision="${s.revision}"` : 'data-confirm-reviewed';
  return `<section class="dispatch-voucher ${inline ? 'inline-voucher' : 'action-review'}" aria-label="Staged dispatch order"><div class="voucher-emblem">${action.type==='buy_train' ? locomotiveArt(s.trains[action.train]?.type) : '<span class="hanko-mark">承認</span>'}</div><div class="voucher-copy"><small>${sale ? 'STAGED EMERGENCY LIQUIDATION · STEP 1' : 'STAGED DISPATCH ORDER'} · REVISION ${s.revision}</small><strong>${esc(label || `${s.current_corporation} buys ${s.trains[action.train]?.type}-Train (#${action.train}) for ${money(cost)}`)}</strong>${action.type==='buy_train' ? `<span>${esc(s.current_corporation)} Safe: ${money(corp.cash)} → ${money(Math.max(0,corp.cash-cost))} · Fleet ${corp.trains.length}/${view.train_limit} → ${afterFleet.trains.length}/${afterFleet.limit}${cost>corp.cash ? ` · President contributes ${money(cost-corp.cash)}` : ''}${action.price !== undefined ? ` · Inter-company transfer from ${esc(s.trains[action.train]?.owner)}` : ''}</span>` : sale ? `<span>Purse → ${money(preview?.cash_after)} · Market → ${money(preview?.price_after)} · Review train purchase after sale</span>` : `<span>${action.type==='bankrupt' ? 'This ends the match immediately.' : 'Review this order before stamping.'}</span>`}</div><div class="voucher-actions"><button type="button" class="secondary-btn" ${inline ? 'data-cancel-train' : 'data-cancel-reviewed'}>Cancel</button><button type="button" class="hanko-button confirm-button" ${controls} ${enabled ? '' : 'disabled'}><span aria-hidden="true">承認</span>${sale ? `Stamp Share Sale (+${money((view.prices[action.corporation]||0)*action.percent/10)})` : action.type==='buy_train' ? `Stamp &amp; ${inline ? 'Buy' : 'Confirm'} ${esc(s.trains[action.train]?.type)}-Train (${money(cost)})` : 'Stamp &amp; Confirm'}</button></div></section>`;
}

export function renderInterCompanyMarket(app, view, {action = null, enabled = true} = {}) {
  const s = view.state;
  const cid = s.current_corporation;
  const corp = s.corporations?.[cid];
  if (!corp) return '<p>No active operating corporation.</p>';
  const limit = view.train_limit || PHASE_LIMITS[String(s.phase)] || 4;
  const atLimit = (corp.trains?.length || 0) >= limit;
  const hasEmergencySales = Boolean(s.operating_turn?.emergency_sales?.length);
  const canBuyTrain = enabled && (view.legal_actions?.types || []).includes('buy_train') && corp.cash >= 1 && !atLimit && !hasEmergencySales;
  const canOffer = enabled && (view.legal_actions?.types || []).includes('offer');
  const rejectedMap = app?.rejectedTrainOffers || {};

  // 1. Incoming Offers from other presidents where Seller Seal (売主印) is already affixed
  const allIncomingOffers = (s.offers || []).filter(
    o =>
      o.kind === 'train' &&
      o.buyer === cid &&
      s.trains?.[o.item]?.owner === o.seller &&
      !s.trains?.[o.item]?.rusted &&
      o.offered_by === s.corporations?.[o.seller]?.president
  );
  const incomingOffers = allIncomingOffers.filter(o => !rejectedMap[`${o.seller}:${o.item}:${o.price}`]);
  const rejectedCount = allIncomingOffers.length - incomingOffers.length;

  // 2. Common President trains (same player presides over both seller and buyer)
  const commonTrains = [];
  // 3. Other corporations' trains available to solicit
  const otherCorpTrains = [];

  for (const [otherCid, otherCorp] of Object.entries(s.corporations || {})) {
    if (otherCid === cid || !otherCorp.trains?.length) continue;
    for (const tid of otherCorp.trains) {
      const t = s.trains?.[tid];
      if (!t || t.rusted) continue;
      if (otherCorp.president === corp.president) {
        commonTrains.push({tid, train: t, seller: otherCid, sellerCorp: otherCorp});
      } else {
        otherCorpTrains.push({tid, train: t, seller: otherCid, sellerCorp: otherCorp});
      }
    }
  }

  const incomingHtml = incomingOffers.length
    ? incomingOffers.map(o => {
        const t = s.trains[o.item];
        const sellerCorp = s.corporations[o.seller];
        const sellerName = s.players?.[sellerCorp?.president]?.name || o.seller;
        const affordable = (corp.cash || 0) >= o.price;
        const buyAction = {type: 'buy_train', train: o.item, price: o.price};
        const isStaged = JSON.stringify(action) === JSON.stringify(buyAction);
        const offerKey = `${o.seller}:${o.item}:${o.price}`;
        const showCounter = app?.counterOfferTrainId === o.item;
        const maxPrice = Math.max(1, corp.cash || 1);
        const counterDefault = Math.min(maxPrice, Math.max(1, o.price - 10));
        return `<article class="wizard-deal-card is-incoming-offer ${isStaged ? 'is-staged' : ''}" data-testid="incoming-train-deal-${esc(o.item)}">
          <div class="deal-train-portrait">${locomotiveArt(t?.type)}${historicalName(t?.type)}</div><div class="deal-card-header">
            <span class="deal-badge is-ready">🤝 INCOMING DEAL · 売主印 SELLER SIGNED</span>
            <strong>${esc(t?.type)}-Train (#${esc(o.item)}) · ${money(o.price)}</strong>
          </div>
          <p class="deal-card-meta">Seller: <b>${esc(o.seller)}</b> (${esc(sellerCorp?.name || o.seller)} · Pres: ${esc(sellerName)})</p>
          <div class="deal-hanko-row">
            <span class="hanko-pill is-signed">売主印 ${esc(sellerName)} Signed ✓</span>
            <span class="hanko-pill ${isStaged ? 'is-signed' : 'is-pending'}">買主印 ${isStaged ? 'Buyer Seal Stamped (Staged) ✓' : 'Awaiting Your Agreement'}</span>
          </div>
          <p class="deal-treasury-impact">Current Treasury Impact: <b>${esc(cid)} Safe ${money(corp.cash)} ➔ ${money(Math.max(0, corp.cash - o.price))} (−${money(o.price)})</b> · <b>${esc(o.seller)} Safe ${money(sellerCorp?.cash || 0)} ➔ ${money((sellerCorp?.cash || 0) + o.price)} (+${money(o.price)})</b></p>
          ${!affordable ? `<p class="deal-warning">⚠️ ${esc(cid)} treasury (${money(corp.cash)}) is below asking price (${money(o.price)}). President cannot subsidize a used train.</p>` : ''}
          <div class="deal-card-actions">
            <button type="button" class="confirm-button" data-stage-used-train="${attr(buyAction)}" ${canBuyTrain && affordable && isValidInterCompanyTrainPurchase(buyAction,view) ? '' : 'disabled'}>
              ${isStaged ? '★ Buyer Seal Stamped (Review Steps 3–5)' : `買主印 Accept &amp; Sign ${money(o.price)}`}
            </button>
            <button type="button" class="secondary-btn" data-counter-offer-train="${esc(o.item)}" ${canOffer && corp.cash >= 1 ? '' : 'disabled'}>
              Counter-Offer
            </button>
            <button type="button" class="secondary-btn" data-reject-train-offer="${esc(offerKey)}" ${enabled ? '' : 'disabled'}>
              Dismiss
            </button>
          </div>
          ${
            showCounter
              ? `<form class="wizard-transfer-form is-counter-offer-form" data-negotiation="${attr({kind: 'train', item: o.item, seller: o.seller, buyer: cid})}">
                  <label>Counter-Offer Price (¥1 – ${money(maxPrice)}):
                    <input type="number" name="price" min="1" max="${maxPrice}" value="${counterDefault}" ${canOffer && corp.cash >= 1 ? '' : 'disabled'}>
                  </label>
                  <button type="submit" name="intent" value="offer" class="confirm-button" ${canOffer && corp.cash >= 1 ? '' : 'disabled'}>
                    買主印 Send Counter-Offer to ${esc(sellerName)}
                  </button>
                </form>`
              : ''
          }
        </article>`;
      }).join('')
    : '';

  const commonHtml = commonTrains.length
    ? commonTrains.map(({tid, train, seller, sellerCorp}) => {
        const defaultPrice = action?.train === tid && action?.price ? action.price : 1;
        const maxPrice = Math.max(1, corp.cash || 1);
        const isStaged = action?.type === 'buy_train' && action?.train === tid && action?.price !== undefined;
        return `<article class="wizard-deal-card is-common-president ${isStaged ? 'is-staged' : ''}" data-testid="common-train-deal-${esc(tid)}">
          <div class="deal-train-portrait">${locomotiveArt(train.type)}${historicalName(train.type)}</div><div class="deal-card-header">
            <span class="deal-badge is-common">★ COMMON PRESIDENT · SELF-TRANSFER</span>
            <strong>${esc(train.type)}-Train (#${esc(tid)}) from ${esc(seller)}</strong>
          </div>
          <p class="deal-card-meta">You preside over both <b>${esc(seller)}</b> (Safe: ${money(sellerCorp.cash)}) and <b>${esc(cid)}</b> (Safe: ${money(corp.cash)}). Negotiation scroll is skipped — set transfer price with the slider below.</p>
          <form class="wizard-transfer-form" data-common-transfer-form="${esc(tid)}">
            <div class="wizard-slider-row">
              <label>Transfer Price Slider (¥1 – ${money(maxPrice)}): <strong data-common-slider-readout>${money(defaultPrice)}</strong></label>
              <input type="range" class="wizard-price-slider" name="price_slider" min="1" max="${maxPrice}" value="${defaultPrice}" data-common-price-slider="${esc(tid)}" aria-label="Self-transfer price slider for ${esc(tid)}" ${canBuyTrain && corp.cash >= 1 ? '' : 'disabled'}>
            </div>
            <label>Exact Transfer Amount (¥1 – ${money(maxPrice)}):
              <input type="number" name="price" min="1" max="${maxPrice}" value="${defaultPrice}" ${canBuyTrain && corp.cash >= 1 ? '' : 'disabled'}>
            </label>
            <div class="yen-chip-stack">
              ${[1, 20, 50, 100, maxPrice].filter((v, i, a) => v <= maxPrice && a.indexOf(v) === i).map(v => `<button type="button" data-set-transfer-price="${v}" ${canBuyTrain ? '' : 'disabled'}>${v === maxPrice && v > 1 ? `Max Safe (${money(v)})` : money(v)}</button>`).join('')}
            </div>
            <p class="deal-treasury-impact">${esc(cid)} Safe: <b>${money(corp.cash)} ➔ ${money(Math.max(0, corp.cash - defaultPrice))}</b> (−${money(defaultPrice)}) · ${esc(seller)} Safe: <b>${money(sellerCorp.cash)} ➔ ${money(sellerCorp.cash + defaultPrice)}</b> (+${money(defaultPrice)}) · President Purses: <b>¥0 (Untouched)</b></p>
            <div class="deal-card-actions">
              <button type="submit" name="mode" value="stage" class="confirm-button" ${canBuyTrain && corp.cash >= 1 ? '' : 'disabled'}>
                ${isStaged ? `★ Staged at ${money(action.price)} (Review Steps 3–5)` : `Stage Transfer to ${esc(cid)} (${money(defaultPrice)})`}
              </button>

            </div>
          </form>
        </article>`;
      }).join('')
    : '';

  const solicitHtml = otherCorpTrains.length
    ? `<div class="solicit-railways-section">
        <h5>SOLICIT OTHER RAILWAYS</h5>
        <p class="solicit-intro">Want an engine not yet offered? Send a purchase request scroll at your chosen price from ${esc(cid)}'s corporate safe (${money(corp.cash)}).</p>
        ${otherCorpTrains.map(({tid, train, seller, sellerCorp}) => {
          const sellerPres = sellerCorp.president;
          const sellerName = s.players?.[sellerPres]?.name || sellerPres;
          const buyerOffer = (s.offers || []).find(
            o => o.kind === 'train' && o.item === tid && o.seller === seller && o.buyer === cid && o.offered_by === corp.president
          );
          const maxPrice = Math.max(1, corp.cash || 1);
          const defaultPrice = buyerOffer?.price || Math.min(50, maxPrice);
          return `<article class="wizard-deal-card is-solicit-card" data-testid="solicit-train-${esc(tid)}">
            <div class="deal-train-portrait">${locomotiveArt(train.type)}${historicalName(train.type)}</div><div class="deal-card-header">
              <span class="deal-badge">SOLICIT ENGINE FROM ${esc(seller)}</span>
              <strong>${esc(train.type)}-Train (#${esc(tid)}) · Owned by ${esc(seller)} (Pres: ${esc(sellerName)})</strong>
            </div>
            ${buyerOffer ? `<p class="deal-recorded-note">📜 <b>Your Buyer Seal (買主印) Recorded at ${money(buyerOffer.price)}</b> · Awaiting ${esc(sellerName)} (${esc(seller)}) to affix Seller Seal (売主印).</p>` : `<p class="deal-card-meta">Propose a purchase price from ${esc(cid)}'s safe (${money(corp.cash)}). Once ${esc(sellerName)} consents, you can complete the purchase here.</p>`}
            <form class="wizard-transfer-form" data-negotiation="${attr({kind: 'train', item: tid, seller, buyer: cid})}">
              <label>Offer Price (¥1 – ${money(maxPrice)}):
                <input type="number" name="price" min="1" max="${maxPrice}" value="${defaultPrice}" ${canOffer && corp.cash >= 1 ? '' : 'disabled'}>
              </label>
              <div class="yen-chip-stack">
                ${[20, 50, 80, 120, maxPrice].filter((v, i, a) => v <= maxPrice && a.indexOf(v) === i).map(v => `<button type="button" data-set-transfer-price="${v}" ${canOffer ? '' : 'disabled'}>${v === maxPrice && v > 1 ? `Max Safe (${money(v)})` : money(v)}</button>`).join('')}
              </div>
              <button type="submit" name="intent" value="offer" class="secondary-btn" ${canOffer && corp.cash >= 1 ? '' : 'disabled'}>
                買主印 Send Purchase Offer to ${esc(sellerName)} (${esc(seller)})
              </button>
            </form>
          </article>`;
        }).join('')}
      </div>`
    : '';

  if (!incomingHtml && !commonHtml && !solicitHtml && !rejectedCount) {
    return `<section class="inter-company-market" aria-label="Inter-company locomotive market">
      <h4>INTER-COMPANY LOCOMOTIVE MARKET · 会社間譲渡</h4>
      <p class="empty-market-note">No other railway corporations currently own active trains to transfer. Select an engine from the Bank Depot above.</p>
    </section>`;
  }

  return `<section class="inter-company-market" aria-label="Inter-company locomotive market">
    <h4>INCOMING OFFERS &amp; USED ENGINES · 会社間譲渡</h4>
    ${atLimit ? `<p class="deal-warning">🔒 ${esc(cid)} is at the Phase ${esc(s.phase)} train limit (${limit}). Inter-company purchases are unavailable.</p>` : ''}
    ${hasEmergencySales ? `<p class="deal-warning">🔒 Emergency share sales were used this turn; 1889 rules require purchasing from the Bank Depot.</p>` : ''}
    ${incomingHtml}
    ${rejectedCount > 0 ? `<p class="dismissed-offers-note">${rejectedCount} incoming offer(s) dismissed for this view. <button type="button" class="secondary-btn" data-restore-train-offers>Restore Offer(s)</button></p>` : ''}
    ${commonHtml}
    ${solicitHtml}
  </section>`;
}

export function renderRustImpactStep(view, action) {
  const s = view.state;
  const cid = s.current_corporation;
  const train = s.trains?.[action?.train];
  const {phase: nextPhase, rusts: rustedType, limit: nextLimit} = projectedFleetDetails(view, action);
  const phaseChanged = nextPhase !== String(s.phase);

  const affectedRows = Object.values(s.corporations || {})
    .filter(c => c.floated || (c.trains && c.trains.length > 0) || c.id === cid)
    .map(c => {
      const beforeTrains = c.trains || [];
      let afterTrains = beforeTrains.filter(tid => {
        if (c.id === cid && action?.trade_in === tid) return false;
        if (action?.type === 'buy_train' && train?.owner === c.id && c.id !== cid) return tid !== action.train;
        if (rustedType && s.trains?.[tid]?.type === rustedType) return false;
        return true;
      });
      if (c.id === cid && action?.type === 'buy_train' && !afterTrains.includes(action.train)) {
        afterTrains = [...afterTrains, action.train];
      }
      const rustedCount = rustedType ? beforeTrains.filter(tid => s.trains?.[tid]?.type === rustedType).length : 0;
      const overLimit = afterTrains.length > nextLimit;
      let statusBadge = '<span class="wizard-status-badge is-ok">Unchanged</span>';
      if (rustedCount > 0 && afterTrains.length === 0) {
        statusBadge = `<span class="wizard-status-badge is-danger">⚠️ ${rustedCount} Will rust (0 trains after purchase)</span>`;
      } else if (rustedCount > 0) {
        statusBadge = `<span class="wizard-status-badge is-warn">⚠️ ${rustedCount} Will rust (${rustedType}-Train)</span>`;
      } else if (overLimit) {
        statusBadge = `<span class="wizard-status-badge is-warn">⚠️ Exceeds Limit (${afterTrains.length}/${nextLimit})</span>`;
      } else if (c.id === cid && action?.type === 'buy_train') {
        statusBadge = `<span class="wizard-status-badge is-ok">+1 Acquired (${afterTrains.length}/${nextLimit})</span>`;
      } else if (train?.owner === c.id && c.id !== cid) {
        statusBadge = `<span class="wizard-status-badge is-warn">−1 Transferred to ${esc(cid)}</span>`;
      }
      return `<tr>
        <td><b>${esc(c.id)}</b> <small>${esc(c.name)}</small></td>
        <td>${beforeTrains.length ? beforeTrains.map(t => esc(t)).join(', ') : '0 Trains'}</td>
        <td><b>${afterTrains.length ? afterTrains.map(t => esc(t)).join(', ') : '0 Trains'}</b> <small>(Max ${nextLimit})</small></td>
        <td>${statusBadge}</td>
      </tr>`;
    }).join('');

  return `<section class="wizard-rust-impact" aria-label="Phase and rust impact preview">
    ${rustedType ? renderTrainNewspaper(view,action,{phase:nextPhase,rusts:rustedType,limit:nextLimit},locomotiveArt) : `    <div class="rust-impact-banner ${rustedType ? 'is-cataclysm' : phaseChanged ? 'is-phase-shift' : 'is-safe'}">
      ${
        !action || action.type !== 'buy_train'
          ? `<strong>Select a locomotive in Step 2 to preview phase &amp; rust consequences.</strong><p>Phase ${esc(s.phase)} is currently active (Train limit: ${view.train_limit || 4}).</p>`
          : phaseChanged
              ? `<strong>PHASE ${esc(nextPhase)} TRANSITION PREVIEW</strong><p>Purchasing this <b>${esc(train?.type)}-Train (#${esc(action.train)})</b> advances the match from Phase ${esc(s.phase)} to <b>Phase ${esc(nextPhase)}</b>. Corporate train limit becomes <b>${nextLimit}</b>. No trains rust on this transition.</p>`
              : `<strong>✓ No Phase Change or Rust Triggered</strong><p>Acquiring <b>${esc(train?.type)}-Train (#${esc(action.train)})</b> keeps the match in <b>Phase ${esc(s.phase)}</b> (Train limit: ${nextLimit}). All existing locomotives remain active.</p>`
      }
    </div>
`}
    <table class="wizard-comparison-table">
      <thead>
        <tr>
          <th>Railway</th>
          <th>Current Fleet</th>
          <th>After Purchase</th>
          <th>Consequence</th>
        </tr>
      </thead>
      <tbody>${affectedRows}</tbody>
    </table>
  </section>`;
}

export function renderSellerOfferDesk(app, view) {
  const s = view?.state;
  const viewerId = view?.viewer?.player_id;
  if (!s || s.round !== 'operating' || s.pending_discards?.length || s.pending_special || !viewerId || !s.players?.[viewerId]) return '';
  const isHistorical = Boolean(view.is_historical || (app?.viewRevision !== undefined && app?.liveRevision !== undefined && app.viewRevision !== app.liveRevision));
  if (isHistorical) return '';
  const enabled = !actionBlockReason(app || {}, view) && (view.legal_actions?.types || []).includes('offer');
  const viewerName = s.players[viewerId]?.name || viewerId;

  // Find all trains owned by corporations where viewerId is President
  const mySellerTrains = [];
  for (const [cid, corp] of Object.entries(s.corporations || {})) {
    if (corp.president === viewerId && corp.trains?.length) {
      for (const tid of corp.trains) {
        const t = s.trains?.[tid];
        if (t && !t.rusted) {
          mySellerTrains.push({tid, type: t.type, distance: t.distance, seller: cid, sellerName: corp.name});
        }
      }
    }
  }

  // Also check if any buyer has sent an offer to one of viewer's corporations
  const buyerOffersToMe = (s.offers || []).filter(
    o =>
      o.kind === 'train' &&
      s.corporations?.[o.seller]?.president === viewerId &&
      o.offered_by !== viewerId &&
      s.trains?.[o.item]?.owner === o.seller &&
      !s.trains?.[o.item]?.rusted
  );

  // Also show offers viewer has already posted as Seller (Match Offer Ledger)
  const myPostedOffers = (s.offers || []).filter(
    o =>
      o.kind === 'train' &&
      s.corporations?.[o.seller]?.president === viewerId &&
      o.offered_by === viewerId &&
      s.trains?.[o.item]?.owner === o.seller &&
      !s.trains?.[o.item]?.rusted
  );

  if (!mySellerTrains.length && !buyerOffersToMe.length) return '';

  const preferredCorp = app?.sellerDefaultCorp;
  const defaultSellerTrain =
    (preferredCorp && mySellerTrains.find(t => t.seller === preferredCorp)) ||
    mySellerTrains.find(t => t.seller !== s.current_corporation) ||
    mySellerTrains[0];
  const candidateBuyers = Object.values(s.corporations || {}).filter(
    c => c.president
  );
  const defaultBuyer =
    candidateBuyers.find(c => c.id === s.current_corporation && c.id !== defaultSellerTrain?.seller) || candidateBuyers.find(c => c.id !== defaultSellerTrain?.seller);

  if (!candidateBuyers.length && !buyerOffersToMe.length) return '';
  const maxSafe = defaultBuyer?.cash || 0;
  const initialPrice = Math.min(50, maxSafe);
  if (!defaultBuyer) return '';

  return `<section class="seller-offer-desk" aria-label="Offer a train for sale" data-testid="seller-offer-desk">
    <div class="seller-desk-header">
      <div>
        <small>CLUB TRANSFER SCROLL · PROPOSE ENGINE SALE · 売主提案</small>
        <h4>🤝 ${defaultSellerTrain && defaultBuyer ? `${esc(defaultSellerTrain.seller)} (${esc(defaultSellerTrain.sellerName)}) ➔ ${esc(defaultBuyer.id)} (${esc(defaultBuyer.name)})` : 'Offer Your Train for Sale to Another Railway'}</h4>
      </div>
      <span class="deal-badge">Seller's Desk (${esc(viewerName)})</span>
    </div>
    <p class="seller-desk-hint">A player doesn't have to wait for the buyer's turn to propose a deal. Post an official asking price with your <b>Seller Seal (売主印)</b> at any time — when the buyer railway reaches Step 5 (Train Purchase), your offer appears in Step 2 of their Wizard for 1-click acceptance.</p>

    ${
      buyerOffersToMe.length
        ? `<div class="incoming-buyer-requests">
            ${buyerOffersToMe.map(o => {
              const buyerCorp = s.corporations[o.buyer];
              const buyerPresName = s.players?.[buyerCorp?.president]?.name || o.buyer;
              return `<div class="buyer-request-card" data-testid="buyer-offer-request-${esc(o.item)}">
                <span><b>Incoming Buyer Request:</b> ${esc(o.buyer)} (${esc(buyerPresName)}) offers <b>${money(o.price)}</b> for ${esc(o.seller)}'s <b>${esc(o.item)}</b></span>
                <button type="button" class="confirm-button" ${enabled ? `data-review-action="${attr({type: 'offer', kind: 'train', item: o.item, seller: o.seller, buyer: o.buyer, price: o.price})}"` : 'disabled'}>
                  売主印 Affix Seller Seal &amp; Consent (${money(o.price)})
                </button>
              </div>`;
            }).join('')}
          </div>`
        : ''
    }

    ${
      myPostedOffers.length
        ? `<div class="posted-seller-offers" data-testid="posted-seller-offers">
            <small class="ledger-kicker">MATCH OFFER LEDGER</small>
            ${myPostedOffers.map(o => {
              const buyerCorp = s.corporations?.[o.buyer];
              const buyerPresName = s.players?.[buyerCorp?.president]?.name || o.buyer;
              return `<div class="posted-offer-pill">
                <span><b>${esc(o.seller)} ➔ ${esc(o.buyer)} · ${esc(o.item)} Train for ${money(o.price)}</b></span>
                <span class="deal-hanko-row"><em class="hanko-pill is-signed">[売主印 ${esc(viewerName)} ✓]</em> <em class="hanko-pill is-pending">[買主印 Awaiting ${esc(buyerPresName)}]</em></span>
              </div>`;
            }).join('')}
          </div>`
        : ''
    }

    ${
      defaultSellerTrain && defaultBuyer
        ? `<form class="seller-offer-form" data-seller-offer-form>
            <div class="seller-form-grid">
              <label>1. Train to Sell
                <select name="seller_train" data-seller-train-select ${enabled ? '' : 'disabled'}>
                  ${mySellerTrains.map(t => `<option value="${esc(t.seller)}:${esc(t.tid)}" ${t.tid === defaultSellerTrain.tid && t.seller === defaultSellerTrain.seller ? 'selected' : ''}>🚂 ${esc(t.type)}-Train (#${esc(t.tid)}) · ${t.type === 'D' ? 'Unlimited' : (t.distance || t.type)} stops · Active (${esc(t.seller)})</option>`).join('')}
                </select>
              </label>
              <label>2. Target Operating Railway (Buyer)
                <select name="buyer_corp" data-seller-buyer-select ${enabled ? '' : 'disabled'}>
                  ${candidateBuyers.map(c => `<option value="${esc(c.id)}" ${c.id === defaultSellerTrain.seller ? 'disabled' : ''} ${c.id === defaultBuyer.id ? 'selected' : ''}>${esc(c.id)} · ${esc(c.name)} (Pres: ${esc(s.players[c.president]?.name || c.president)} · Safe: ${money(c.cash)})</option>`).join('')}
                </select>
              </label>
              <label>3. Asking Price (Min ¥1, Max <span data-seller-max-label>${money(maxSafe)}</span>)
                <input type="number" name="price" min="1" max="${maxSafe}" value="${initialPrice}" required ${enabled ? '' : 'disabled'}>
              </label>
            </div>
            <div class="seller-hanko-consent-row">
              <div class="seller-hanko-consent-box">
                <span class="hanko-stamp-box" aria-hidden="true">売主印</span>
                <div>
                  <strong>4. Seller Hanko Consent: ${esc(viewerName)} Seal Affixed</strong>
                  <small>Posting records your consent in the match ledger. The buyer completes the purchase during its train step.</small>
                </div>
              </div>
              <div class="yen-chip-stack" aria-label="Quick asking prices">
                <small>Quick Chips:</small>
                <button type="button" data-seller-add-chip="10" ${enabled ? '' : 'disabled'}>+¥10</button>
                <button type="button" data-seller-add-chip="50" ${enabled ? '' : 'disabled'}>+¥50</button>
                <button type="button" data-seller-max-chip="true" ${enabled ? '' : 'disabled'}>Max Safe</button>
                ${[20, 50, 100].filter(v => v <= maxSafe).map(v => `<button type="button" data-seller-price-chip="${v}" ${enabled ? '' : 'disabled'}>${money(v)}</button>`).join('')}
              </div>
            </div>
            <div class="seller-form-actions">
              <button type="submit" class="hanko-button confirm-button" data-testid="post-seller-offer-btn" ${enabled ? '' : 'disabled'}>
                <span aria-hidden="true">売主印</span> 📜 Post Offer to Match Ledger
              </button>
            </div>
          </form>`
        : ''
    }
  </section>`;
}

export function renderTrainWizardBody(app, view) {
  const s = view.state;
  const cid = s.current_corporation;
  const corp = s.corporations?.[cid];
  const enabled = !actionBlockReason(app, view) && view.viewer?.player_id === corp?.president;
  const action = stagedDepotAction(app, view);
  const activeStep = currentWizardStep(app, view);
  const sourceTab = currentWizardSource(app, view);
  const limit = view.train_limit || PHASE_LIMITS[String(s.phase)] || 4;
  const owned = corp?.trains || [];
  const mandatory = Boolean(view.train_financing?.mandatory);
  const purchaseComplete = !mandatory && Boolean(s.operating_turn?.new_trains?.length);
  const showingCompletion = purchaseComplete && activeStep === 1;
  const shortfall = view.train_financing?.shortfall || 0;
  const cost = trainCost(view, action);
  const {phase: nextPhase, rusts: rustedType} = projectedFleetDetails(view, action);
  const isInterCompany = action?.type === 'buy_train' && action.price !== undefined;
  const contribution = isInterCompany ? 0 : Math.max(0, cost - (corp?.cash || 0));

  // Count incoming deals & available inter-company engines for badge
  const incomingDealsCount = (s.offers || []).filter(
    o => o.kind === 'train' && o.buyer === cid && s.trains?.[o.item]?.owner === o.seller && !s.trains?.[o.item]?.rusted
  ).length;
  const otherEnginesCount = Object.entries(s.corporations || {})
    .filter(([id]) => id !== cid)
    .reduce((acc, [, c]) => acc + (c.trains?.length || 0), 0);

  const steps = [
    {num: 1, title: 'Fleet', sub: `${owned.length}/${limit} Owned`},
    {num: 2, title: 'Selection', sub: action?.type === 'buy_train' ? `#${action.train} (${money(cost)})` : 'Choose Engine'},
    {num: 3, title: 'Rust & Impact', sub: rustedType ? `Rusts ${rustedType}s!` : nextPhase !== String(s.phase) ? `Phase ${nextPhase}` : 'Phase Check'},
    {num: 4, title: 'Financing', sub: contribution > 0 ? 'Emergency funding' : 'Corporate payment'},
    {num: 5, title: 'Dispatch', sub: 'Hanko Seal'},
  ];

  return `<div class="train-wizard-shell" data-inline-train-desk data-active-wizard-step="${activeStep}" data-scroll-key="${esc(`${trainStageKey(app,view)}:${view.viewer?.player_id}:${activeStep}:${JSON.stringify(action)}`)}">
    <header class="train-wizard-header">
      <div>
        <small><span data-no-translate>${esc(corp?.name || cid)}</span> · OPERATING ROUND · ${showingCompletion ? 'COMPLETE' : `STEP ${activeStep} OF 5`}</small>
        <h2 id="train-wizard-title">${esc(cid)} · ${showingCompletion ? 'Train Purchase Complete' : mandatory ? '⚠️ Mandatory Train Acquisition' : 'Train purchase'}</h2>
      </div>
      <div class="wizard-header-actions"><span class="wizard-phase-pill">Phase ${esc(s.phase)} · Limit ${limit}</span><button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close train purchase wizard">×</button></div>
    </header>

    <nav class="train-wizard-stepper" aria-label="Train Purchase Wizard Steps">
      ${steps.map(st => {
        const isCurrent = st.num === activeStep;
        const isDone = st.num < activeStep;
        return `<button type="button" class="wizard-step-btn ${isCurrent ? 'is-active' : ''} ${isDone ? 'is-complete' : ''}" data-wizard-step="${st.num}" ${st.num > 2 && !action ? 'disabled' : ''} aria-current="${isCurrent ? 'step' : 'false'}">
          <span class="wizard-step-num">${isDone ? '✓' : st.num}</span>
          <span class="wizard-step-label">
            <b>${esc(st.title)}</b>
            <small>${esc(st.sub)}</small>
          </span>
        </button>`;
      }).join('')}
    </nav>

    ${actionBlockReason(app, view) ? `<p class="inspection-only" role="status">${esc(actionBlockReason(app, view))}</p>` : ''}
    <div class="wizard-page-body">
    <!-- STEP 1: OBLIGATION & ROUNDHOUSE CAPACITY -->
    <article class="train-wizard-step ${activeStep === 1 ? 'is-visible' : ''}" data-wizard-panel="1" ${activeStep === 1 ? '' : 'hidden'} tabindex="-1">
      <div class="wizard-step-intro">
        <b>${showingCompletion ? 'Locomotive acquired' : 'Your roundhouse'}</b>
        <small>${showingCompletion ? `Your purchase is complete. Finish ${esc(cid)}’s turn when you’re ready.` : `${owned.length} trains owned · ${Math.max(0,limit-owned.length)} spaces available`}</small>
      </div>
      ${renderRoundhouse(view, action)}
      <div class="wizard-obligation-callout ${mandatory ? 'is-mandatory-alert' : owned.length >= limit ? 'is-limit-alert' : 'is-optional-alert'}">
        ${
          purchaseComplete
            ? `<strong>✓ Purchase complete:</strong> ${esc(cid)} now operates ${owned.length} train(s) (${esc(owned.join(', '))}). You’re ready to finish this operating turn.`
            : mandatory
            ? `<strong>⚠️ Mandatory Purchase Required:</strong> ${esc(cid)} owns 0 trains and has a connected route. You must acquire at least one locomotive before ending your turn.`
            : owned.length >= limit
              ? `<strong>🔒 At Train Limit (${owned.length}/${limit}):</strong> ${esc(cid)} has filled all Roundhouse stalls for Phase ${esc(s.phase)}. You may still inspect any available Diesel trade-in.`
              : `<strong>✓ Purchase optional</strong> · ${owned.length ? 'Your railway can operate with its current fleet.' : 'No connected route requires a train.'}`
        }
      </div>
    </article>

    <!-- STEP 2: CHOOSE LOCOMOTIVE & SOURCE (BANK DEPOT OR INTER-COMPANY DEAL) -->
    <article class="train-wizard-step ${activeStep === 2 ? 'is-visible' : ''}" data-wizard-panel="2" ${activeStep === 2 ? '' : 'hidden'} tabindex="-1">
      <div class="wizard-step-intro">
        <b>Choose your locomotive</b>
        <small>Select a new or returned engine from the Bank Depot, or acquire a used train from another railway.</small>
      </div>
      <div class="wizard-source-tabs" role="tablist" aria-label="Locomotive acquisition source">
        <button type="button" class="wizard-source-tab ${sourceTab === 'depot' ? 'is-active' : ''}" data-wizard-source="depot" role="tab" aria-selected="${sourceTab === 'depot'}">
          🚂 Bank Depot
        </button>
        <button type="button" class="wizard-source-tab ${sourceTab === 'market' ? 'is-active' : ''} ${incomingDealsCount > 0 ? 'has-incoming' : ''}" data-wizard-source="market" role="tab" aria-selected="${sourceTab === 'market'}">
          🤝 Inter-Company Deals ${incomingDealsCount > 0 ? `<span class="incoming-deal-pill">${incomingDealsCount} Offer!</span>` : `(${otherEnginesCount})`}
        </button>
      </div>
      <div class="wizard-source-pane ${sourceTab === 'depot' ? 'is-visible' : ''}" data-source-pane="depot">
        ${renderDepotTray(app, view, {inline: true, compact: false, action, enabled})}
      </div>
      <div class="wizard-source-pane ${sourceTab === 'market' ? 'is-visible' : ''}" data-source-pane="market">
        ${renderInterCompanyMarket(app, view, {action, enabled})}
      </div>
      <button type="button" class="secondary-btn" data-open-train-planning>Private companies &amp; Seller’s Desk →</button>
    </article>

    <!-- STEP 3: RUST & PHASE IMPACT -->
    <article class="train-wizard-step ${activeStep === 3 ? 'is-visible' : ''}" data-wizard-panel="3" ${activeStep === 3 ? '' : 'hidden'} tabindex="-1">
      <div class="wizard-step-intro">
        <b>Rust &amp; phase impact</b>
        <small>Preview how this acquisition affects game phase, train limits, and older locomotives across Shikoku.</small>
      </div>
      ${renderRustImpactStep(view, action)}
    </article>

    <!-- STEP 4: FINANCING & COUNTING HOUSE -->
    <article class="train-wizard-step ${activeStep === 4 ? 'is-visible' : ''}" data-wizard-panel="4" ${activeStep === 4 ? '' : 'hidden'} tabindex="-1">
      <div class="wizard-step-intro">
        <b>${contribution > 0 ? 'Corporate Payment &amp; Emergency Funding' : 'Corporate Payment'}</b>
        <small>${contribution > 0 ? 'Review the treasury payment and the emergency funds required to cover the remaining cost.' : `Review the payment from ${esc(cid)}’s corporate treasury.`}</small>
      </div>
      ${renderFinancingStep(view, action)}
      ${!isInterCompany && shortfall > 0 ? renderLiquidationMat(view, enabled, (a) => `Sell ${a.percent}% ${a.corporation}`, action) : ''}
      ${app.reviewAction?.type === 'emergency_sell' ? renderTrainVoucher(app, view, app.reviewAction, {enabled, label: 'Confirm emergency share sale'}) : ''}
      ${!isInterCompany && (view.action_options || []).some(a => a.type === 'bankrupt') ? `<section class="bankruptcy-gate"><h4>Presidential solvency</h4><p>The available funds cannot cover the mandatory train. Review bankruptcy to end the match.</p><button type="button" data-review-action="${attr({type:'bankrupt'})}" ${enabled ? '' : 'disabled'}>Review bankruptcy</button></section>` : ''}
    </article>

    <!-- STEP 5: EXECUTIVE DISPATCH VOUCHER & HANKO STAMP -->
    <article class="train-wizard-step ${activeStep === 5 ? 'is-visible' : ''}" data-wizard-panel="5" ${activeStep === 5 ? '' : 'hidden'} tabindex="-1">
      <div class="wizard-step-intro">
        <b>Review &amp; Dispatch</b>
        <small>Check your order, then stamp to confirm the purchase.</small>
      </div>
      ${renderVoucherSummaryStep(view, action)}
      ${!action ? '<p>Select a locomotive in Selection to prepare your order.</p>' : ''}
    </article>

    </div>
    <!-- WIZARD NAVIGATION FOOTER -->
    <footer class="train-wizard-footer">
      <button type="button" class="secondary-btn wizard-nav-btn" data-wizard-prev ${activeStep <= 1 ? 'disabled' : ''}>
        ${activeStep === 5 ? '⟵ Revise Order' : '⟵ Back'}
      </button>
      <span class="wizard-progress-caption">${showingCompletion ? 'Purchase complete' : `Step ${activeStep} of 5 · ${esc(steps[activeStep - 1].title)}`}</span>
      <div class="wizard-footer-right">
        ${activeStep === 5 && action?.type === 'buy_train' ? `<button type="button" class="secondary-btn" data-cancel-train>Cancel Order</button><button type="button" class="hanko-button confirm-button" data-stamp-train="${attr(action)}" data-stamp-revision="${s.revision}" ${enabled && ((view.action_options || []).some(a=>JSON.stringify(a)===JSON.stringify(action)) || isValidInterCompanyTrainPurchase(action, view)) ? '' : 'disabled'}><span aria-hidden="true">承認</span>Stamp &amp; Buy ${esc(s.trains[action.train]?.type)}-Train · ${money(cost)}</button>` : ''}
        ${showingCompletion ? '<button type="button" class="secondary-btn wizard-nav-btn" data-wizard-next>Buy Another Train</button>' : ''}
        ${activeStep === 1 && !mandatory && (view.legal_actions?.types || []).includes('end_turn') ? `<button type="button" class="secondary-btn wizard-finish-turn" data-wizard-pass ${enabled ? '' : 'disabled'}>End ${esc(corp?.name || cid)} Turn</button>` : ''}
        ${
          activeStep < 5 && !showingCompletion
            ? `<button type="button" class="confirm-button wizard-nav-btn" data-wizard-next ${activeStep >= 2 && !action ? 'disabled' : ''}>
                Next: ${esc(steps[activeStep]?.title || 'Review')} ⟶
              </button>`
            : ''
        }
      </div>
    </footer>

  </div>`;
}

export function trainWizardAvailable(view) {
  const s = view?.state;
  return Boolean(s && s.round === 'operating' && s.operating_turn?.step === 'train' &&
    s.current_corporation && !s.pending_special && !s.pending_discards?.length && !s.finished);
}

export function renderInlineTrainDesk(app, view) {
  const s = view.state, corp = s.corporations[s.current_corporation];
  return `<section class="train-wizard-launcher" aria-label="Train purchase">
    <div class="train-launch-heading">
      <div class="train-launch-art" aria-hidden="true">${locomotiveArt('')}</div>
      <div class="train-launch-copy"><div class="train-launch-title"><h3>Train purchase</h3><span class="train-launch-status ${view.train_financing?.mandatory ? 'is-required' : ''}">${view.train_financing?.mandatory ? 'Required' : 'Optional'}</span></div>
      <p>${view.train_financing?.mandatory ? 'Train purchase required · ' : ''}${esc(s.current_corporation)} · ${corp?.trains?.length || 0}/${view.train_limit} engines · Safe ${money(corp?.cash)}</p></div>
    </div>
    <button type="button" class="confirm-button train-launch-button" data-open-train-wizard><span class="train-launch-ticket" aria-hidden="true">▥</span><span>Open Train Purchase Wizard</span><span aria-hidden="true">→</span></button>
    <ol class="train-launch-stations" aria-label="Purchase steps">${['Fleet','Selection','Rust','Financing','Dispatch'].map(step=>`<li>${step}</li>`).join('')}</ol>
  </section>`;
}

export function renderTrainPurchaseModal(app, view) {
  if (app.activeModal !== 'train' || !trainWizardAvailable(view)) return '';
  return `<div class="modal-backdrop train-wizard-backdrop"><section class="modal-card train-purchase-modal" role="dialog" aria-modal="true" aria-labelledby="train-wizard-title">${renderTrainWizardBody(app, view)}</section></div>`;
}

export function syncTrainPurchaseWizard(app, view) {
  // Opening the wizard is a player choice; only close it when no longer applicable.
  if (!trainWizardAvailable(view) && app.activeModal === 'train') app.activeModal = null;
}

// Compatibility for callers of the original emergency-only desk hook.
export const syncEmergencyDesk = syncTrainPurchaseWizard;
