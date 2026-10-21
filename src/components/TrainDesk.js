import {escapeHtml as esc, actionBlockReason} from '../ui/presentation.js';
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
export const trainStageKey = (app, view) => `${app.roomCode}:${view.state.revision}:${view.state.current_corporation}`;
export function stagedDepotAction(app, view) {
  const legal = (view.action_options || []).filter(a => a.type === 'buy_train');
  if (app.trainStageKey === trainStageKey(app, view)) {
    return legal.find(a => JSON.stringify(a) === JSON.stringify(app.trainStage)) || null;
  }
  return legal.find(a => !a.trade_in) || null;
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

export function locomotiveArt(type = '2') {
  return `<svg class="locomotive-engraving" viewBox="0 0 180 82" aria-hidden="true"><path d="M8 68Q60 10 118 24T174 14L174 73H8Z" fill="#af9261" opacity=".26"/><path d="M25 25Q59 4 91 23Q62 12 25 25" fill="#fff8d4"/><g stroke="currentColor" stroke-width="2"><path d="M22 54h24V35h23v19h13V29h30v25h18V40h11v17l13 12H22Z" fill="#252d29"/><path d="M49 38h15v13H49Zm37-5h18v18H86Z" fill="#d8ac50"/><path d="m113 18 9 1-3 23h-5Z" fill="#27251e"/><path d="M78 55h53v10H78Z" fill="#444b3a"/><path d="m139 58 18 13h-18Z" fill="#a62720"/>${[36,66,94,124].map((x,i)=>`<circle cx="${x}" cy="65" r="${i===1||i===2?10:7}" fill="#292924"/><circle cx="${x}" cy="65" r="2" fill="#d6a84f"/>`).join('')}<path d="M66 65h28" stroke-width="3"/><circle cx="137" cy="42" r="4" fill="#ffe1a0"/></g><text x="165" y="18" text-anchor="end" font-size="13" font-family="Georgia" fill="currentColor">${esc(type)}</text></svg>`;
}

export function projectedFleet(view, action) {
  const s=view.state, corp=s.corporations[s.current_corporation];
  const train=s.trains[action?.train];
  let phase=String(s.phase), rusts=null;
  const phases=['2','3','4','5','6','D'];
  if (action?.type==='buy_train' && train?.owner==='depot' && phases.indexOf(train.type)>phases.indexOf(phase)) {
    phase=train.type;rusts=({'4':'2','6':'3','D':'4'})[phase];
  }
  const trains=(corp?.trains || []).filter(id=>id!==action?.trade_in && (!rusts || s.trains[id]?.type!==rusts));
  if (action?.type==='buy_train' && !trains.includes(action.train)) trains.push(action.train);
  return {trains,limit:({'2':4,'3':4,'4':3,'5':2,'6':2,'D':2})[phase] || view.train_limit || 4};
}

export function renderRoundhouse(view, action) {
  const s = view.state, corp = s.corporations[s.current_corporation];
  if (!corp) return '<p>No operating fleet.</p>';
  const owned = corp.trains || [];
  const {trains:fleet,limit}=projectedFleet(view,action);
  return `<section class="roundhouse ${!owned.length ? 'fleet-empty' : ''}" aria-label="Roundhouse fleet"><div class="roundhouse-plaque"><small>ROUNDHOUSE FLEET</small> · Owned now: ${owned.length} · Train limit: ${view.train_limit || limit}</div><div class="owned-fleet">${owned.length ? owned.map(id=>`<div class="owned-engine" data-owned-train="${esc(id)}">${locomotiveArt(s.trains[id]?.type)}<strong>${esc(id)}</strong></div>`).join('') : '<p>No trains owned</p>'}</div>${action?.type==='buy_train' ? `<div class="fleet-after-purchase"><b>After purchase: ${fleet.length} / ${limit}</b><span>${fleet.map(id=>esc(id)).join(' · ') || 'No trains'}${action.trade_in ? ` · Trade in ${esc(action.trade_in)}` : ''}</span><small>Preview only · Purchase not yet confirmed</small></div>` : ''}</section>`;
}

export function renderDepotTray(app, view, {inline = false, compact = inline, action = null, enabled = true} = {}) {
  const tiers=depotTiers(view);
  const active=tiers.filter(t=>t.available);
  const locked=tiers.filter(t=>!t.available);
  const visible=[...active,...locked.slice(0,compact ? 1 : 2)];
  const later=locked.slice(compact ? 1 : 2);
  const renderTier=tier=>{
    const selected = tier.ids.includes(action?.train);
    const mandatory=Boolean(view.train_financing && tier.available && tier.price===view.train_financing.cheapest);
    const purchase = tier.actions.find(a=>!a.trade_in);
    const buttonAttr = inline ? `data-buy-train="${esc(purchase?.train)}" data-testid="depot-buy-${esc(tier.type)}"` : `data-review-action="${attr(purchase)}" data-testid="depot-review-${esc(tier.type)}"`;
    return `<article class="locomotive-certificate ${selected ? 'is-staged' : ''} ${mandatory ? 'is-mandatory' : ''} ${!tier.available ? 'is-locked' : ''}"><button type="button" class="depot-tier-button" ${purchase && enabled ? buttonAttr : 'disabled'} aria-pressed="${selected}"><span class="locomotive-title"><b>${mandatory ? 'MANDATORY · ' : tier.used ? 'RETURNED · ' : ''}${esc(tier.type)}-Train</b><strong>${money(tier.price)}</strong></span><span class="locomotive-picture">${locomotiveArt(tier.type)}${!tier.available ? '<span class="depot-chain">🔒</span>' : ''}</span><span class="depot-stock">${tier.ids.length} in depot <span class="brass-supply" aria-hidden="true">${tier.ids.map(()=>'<i></i>').join('')}</span></span><small>${esc(PHASE_NOTES[tier.type] || '')}</small><span class="locomotive-ribbon">${selected ? `★ STAGED · #${esc(action.train)}` : !tier.available ? tier.type==='D' ? 'LOCKED · Available from Phase 6' : 'LOCKED · Earlier tier must sell out' : !purchase ? 'Financing / train limit prevents purchase' : 'Click certificate to stage'}</span></button>${enabled ? tier.actions.filter(a=>a.trade_in).map(a=>`<button type="button" class="trade-in-option" data-review-action="${attr(a)}">Trade in ${esc(a.trade_in)} · Pay ${money(tier.price-300)}</button>`).join('') : ''}</article>`;
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
  const contribution=Math.max(0,cost-corp.cash), gap=Math.max(0,contribution-personal);
  const staged=action?.type==='buy_train' || Boolean(view.train_financing?.shortfall);
  const coverage=cost ? Math.min(100,Math.round(corp.cash/cost*100)) : 100;
  return `<section class="counting-house ${contribution ? 'has-shortfall' : ''}" aria-label="Corporate and presidential financing"><h4>COUNTING HOUSE · VAULT vs. PURSE</h4><div class="counting-objects"><div class="vault-object"><div class="iron-safe"><span class="safe-handle">●</span><div class="banknote-bundles">${corp.cash ? Array.from({length:Math.min(6,Math.ceil(corp.cash/100))},()=>'<i>¥100</i>').join('') : '<small>EMPTY</small>'}</div></div><strong>${money(corp.cash)} Safe</strong><small>${esc(corp.id || s.current_corporation)} corporate treasury${staged ? ` → ${money(Math.max(0,corp.cash-cost))}` : ''}</small></div><div class="brass-balance"><svg viewBox="0 0 110 70" role="img" aria-label="Vault covers ${coverage}%"><path d="M10 60a45 45 0 0 1 90 0Z" fill="#762e22" stroke="#d4ab4e" stroke-width="3"/><path d="M10 60a45 45 0 0 1 45-45v45Z" fill="#285a3a"/><path d="M55 60 55 24" stroke="#ffe49c" stroke-width="3" transform="rotate(${contribution ? 40 : -40} 55 60)"/><circle cx="55" cy="60" r="5" fill="#d4ab4e"/></svg><strong>${contribution ? `President due ${money(contribution)}` : `VAULT COVERS ${coverage}%`}</strong><span>${gap ? `Unfunded shortfall: −${money(gap)}` : 'Shortfall: ¥0'}</span></div><div class="purse-object">${renderMemberPortrait(view,corp.president)}<span class="leather-purse" aria-hidden="true">● ● ●</span><strong>${money(personal)} Purse</strong><small>${staged && contribution ? `→ ${money(Math.max(0,personal-contribution))} after purchase` : `${esc(s.players[corp.president]?.name || 'President')} · untouched`}</small></div></div></section>`;
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
  return `<section class="dispatch-voucher ${inline ? 'inline-voucher' : 'action-review'}" aria-label="Staged dispatch order"><div class="voucher-emblem">${action.type==='buy_train' ? locomotiveArt(s.trains[action.train]?.type) : '<span class="hanko-mark">承認</span>'}</div><div class="voucher-copy"><small>${sale ? 'STAGED EMERGENCY LIQUIDATION · STEP 1' : 'STAGED DISPATCH ORDER'} · REVISION ${s.revision}</small><strong>${esc(label || `${s.current_corporation} buys ${s.trains[action.train]?.type}-Train (#${action.train}) for ${money(cost)}`)}</strong>${action.type==='buy_train' ? `<span>${esc(s.current_corporation)} Safe: ${money(corp.cash)} → ${money(Math.max(0,corp.cash-cost))} · Fleet ${corp.trains.length}/${view.train_limit} → ${afterFleet.trains.length}/${afterFleet.limit}${cost>corp.cash ? ` · President contributes ${money(cost-corp.cash)}` : ''}${action.price !== undefined ? ' · Inter-company transfer' : ''}</span>` : sale ? `<span>Purse → ${money(preview?.cash_after)} · Market → ${money(preview?.price_after)} · Review train purchase after sale</span>` : `<span>${action.type==='bankrupt' ? 'This ends the match immediately.' : 'Review this order before stamping.'}</span>`}</div><div class="voucher-actions"><button type="button" class="secondary-btn" ${inline ? 'data-cancel-train' : 'data-cancel-reviewed'}>Cancel</button><button type="button" class="hanko-button confirm-button" ${controls} ${enabled ? '' : 'disabled'}><span aria-hidden="true">承認</span>${sale ? `Stamp Share Sale (+${money((view.prices[action.corporation]||0)*action.percent/10)})` : action.type==='buy_train' ? `Stamp &amp; ${inline ? 'Buy' : 'Confirm'} ${esc(s.trains[action.train]?.type)}-Train (${money(cost)})` : 'Stamp &amp; Confirm'}</button></div></section>`;
}

export function renderInlineTrainDesk(app, view) {
  const enabled=!actionBlockReason(app,view), action=stagedDepotAction(app,view);
  return `<div class="tactile-train-desk" data-inline-train-desk>${renderRoundhouse(view,action)}${renderCountingHouse(view,action)}${renderDepotTray(app,view,{inline:true,action,enabled})}${renderTrainVoucher(app,view,action,{inline:true,enabled})}<button type="button" class="boardroom-switch secondary-btn" data-open-desk>↔ Open Full Boardroom Deal &amp; Emergency Room…<small>Inter-company trains · Private deals · Emergency financing</small></button></div>`;
}

export function syncEmergencyDesk(app, view) {
  const s=view.state;
  const eligible=s.round==='operating' && s.operating_turn?.step==='train' &&
    !s.pending_special && !s.pending_discards?.length && !s.finished &&
    !s.corporations[s.current_corporation]?.trains?.length && view.train_financing?.shortfall>0;
  if (!eligible) { if (!view.is_historical && app.viewRevision===app.liveRevision) app.emergencyDeskKey=null; return; }
  if (view.viewer?.player_id!==s.corporations[s.current_corporation]?.president || actionBlockReason(app,view)) return;
  // One opening per shortfall episode; polling and subsequent sales don't reopen a dismissed desk.
  const key=`${app.roomCode}:${s.stock_round}:${s.or_number}:${s.or_index}:${s.current_corporation}`;
  if (app.emergencyDeskKey!==key) {app.emergencyDeskKey=key;app.activeModal='decisions';}
}
