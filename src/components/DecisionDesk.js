import {syncRoutePlan,routeQuote,currentRouteEditor,bindRoutePlanning,stopName} from '../ui/routePlanning.js';
import {renderVintagePrivateCard} from './PrivateCompanyCards.js';
import {renderRoundhouse, renderDepotTray, renderCountingHouse, renderLiquidationMat, renderMemberPortrait, renderTrainVoucher, stagedDepotAction, trainStageKey, trainCost} from './TrainDesk.js';
import {TRAIN_ROUTE_COLORS} from '../constants1889.js';
import {renderGatheringSetup,bindGatheringSetup} from './GatheringSetup.js';
import { actionBlockReason, escapeHtml as esc, shortcutDescription } from '../ui/presentation.js';
const money = n => `¥${Number(n || 0).toLocaleString()}`;
const attr = value => esc(JSON.stringify(value));
const commit = (action, label) => `<button type="button" class="confirm-button" data-review-action="${attr(action)}">${esc(label)}</button>`;

export function actionLabel(action, view) {
  const s = view.state, cid = action.corporation || s.current_corporation;
  const train = s.trains?.[action.train];
  if (action.type === 'discard_train') return `${cid}: discard ${action.train} to the depot`;
  if (action.type === 'emergency_sell') return `Sell ${action.percent}% ${cid} for ${money(view.prices[cid] * action.percent / 10)} emergency funds`;
  const trainPrice=action.price ?? (train?.price - (action.trade_in ? 300 : 0));
  if (action.type === 'buy_train') {
    const contribution=Math.max(0,trainPrice-s.corporations[s.current_corporation].cash);
    return `${s.current_corporation}: buy ${action.train} for ${money(trainPrice)}${action.trade_in ? `; trade in ${action.trade_in}` : ''}${contribution ? `; president contributes ${money(contribution)}` : ''}`;
  }
  if (action.type === 'buy_private') return `${action.buyer}: buy ${action.company} for ${money(action.price)}`;
  if (action.type === 'exchange_private') return 'Exchange DR for 10% IR from IPO';
  if (action.type === 'bankrupt') return 'Declare bankruptcy and end the match';
  if (action.type === 'offer') return `Offer ${money(action.price)} for ${action.item}: ${action.seller} → ${action.buyer}`;
  if (action.type === 'pass') return 'Decline the optional ER lay and resume operation';
  if (action.type === 'lay_tile') return `ER: lay #${action.tile} on C4 at ${action.rotation * 60}°`;
  if (action.type === 'run_routes') return `Commit ${action.routes.length} reviewed route(s)`;
  return action.type.replaceAll('_', ' ');
}

export function renderResults(state, prices = {}) {
  if (!state.finished || !state.result) return '';
  const scores = Object.entries(state.result).sort((a,b) => b[1]-a[1]);
  return `<section class="match-results" aria-label="Final results"><h2>Final results</h2><p>${state.end_reason === 'bank' ? 'Bank exhaustion · required operating set completed' : 'Presidential bankruptcy · immediate ending'} · Personal cash + stock value + open privates. Corporate treasury is excluded.</p><table><thead><tr><th>Place</th><th>Member</th><th>Cash</th><th>Public portfolio</th><th>Open privates</th><th>Net worth</th></tr></thead><tbody>${scores.map(([p,n],i) => {
    const privates=Object.values(state.privates).filter(c=>c.owner===p && !c.closed);
    const privateValue=privates.reduce((sum,c)=>sum+c.value,0);
    const stockValue=n-state.players[p].cash-privateValue;
    const items=Object.values(state.corporations).filter(c=>c.holdings[p]).map(c=>`${c.id} ${c.holdings[p]}%: ${money(c.holdings[p]/10*(prices[c.id] ?? 0))}`).join('; ');
    return `<tr><td>${scores.findIndex(([,v])=>v===n)+1}</td><td>${n===scores[0][1] ? '🏮 ' : ''}${esc(state.players[p].name)}${state.players[p].bankrupt ? ' · bankrupt' : ''}</td><td>${money(state.players[p].cash)}</td><td>${money(stockValue)}<small>${esc(items)}</small></td><td>${money(privateValue)}<small>${esc(privates.map(c=>`${c.id}: ${money(c.value)}`).join('; '))}</small></td><td>${money(n)}</td></tr>`;}).join('')}</tbody></table><button class="secondary-btn" data-next-gathering>Host Next Gathering</button></section>`;
}

export function isLiveOffer(o, view) {
  const s = view?.state;
  if (!s || s.round !== 'operating' || !o || o.buyer !== s.current_corporation) return false;
  const buyerCorp = s.corporations?.[o.buyer];
  if (!buyerCorp) return false;
  if (o.kind === 'private') {
    const priv = s.privates?.[o.item];
    if (!priv || priv.closed || priv.owner !== o.seller || !s.players?.[o.seller]) return false;
    if (!['3', '4'].includes(String(s.phase))) return false;
  } else if (o.kind === 'train') {
    const train = s.trains?.[o.item];
    if (!train || train.rusted || train.owner !== o.seller || o.seller === o.buyer) return false;
    const limit = view.train_limit || ({ '2': 4, '3': 4, '4': 3, '5': 2, '6': 2, 'D': 2 }[String(s.phase)] ?? 4);
    if ((buyerCorp.trains?.length || 0) >= limit) return false;
  } else {
    return false;
  }
  const legalOffers = view.legal_actions?.choices?.offers;
  if (Array.isArray(legalOffers) && legalOffers.length > 0) {
    const sellerPid = s.players?.[o.seller] ? o.seller : s.corporations?.[o.seller]?.president;
    const buyerPid = buyerCorp.president;
    if (view.viewer?.player_id === sellerPid || view.viewer?.player_id === buyerPid) {
      const matchesChoice = legalOffers.some(
        c => c.kind === o.kind && c.item === o.item && c.seller === o.seller && c.buyer === o.buyer
      );
      if (!matchesChoice) return false;
    }
  }
  return true;
}

export function activeLiveOffers(view) {
  const s = view?.state;
  const raw = (s?.offers || []).filter(o => isLiveOffer(o, view));
  const byDeal = new Map();
  for (const o of raw) {
    const key = `${o.kind}:${o.item}:${o.seller}:${o.buyer}:${o.price}`;
    const existing = byDeal.get(key);
    if (!existing || existing.offered_by === view.viewer?.player_id) {
      byDeal.set(key, o);
    }
  }
  return [...byDeal.values()];
}

export function renderDecisionNotice(app, view) {
  const s = view.state;
  const pending = s.pending_special ? 'ER special lay or decline is pending' : s.pending_discards?.length ? `Excess trains: ${s.pending_discards.join(', ')}` : '';
  const enabled = !actionBlockReason(app, view);
  const types = view.legal_actions?.types || [];
  const activeOffers = activeLiveOffers(view);
  const offerActions = activeOffers.map(o => {
    const sellerPid = s.players?.[o.seller] ? o.seller : s.corporations?.[o.seller]?.president;
    const buyerPid = s.corporations?.[o.buyer]?.president;
    if (enabled && o.offered_by !== view.viewer?.player_id) {
      if (view.viewer?.player_id === buyerPid && types.includes(o.kind === 'private' ? 'buy_private' : 'buy_train')) {
        return `<span class="counterparty-offer-alert" role="status" data-testid="counterparty-offer-banner"><strong>Offer Ready:</strong> ${esc(o.seller)} offered ${esc(o.item)} to ${esc(o.buyer)} for ${money(o.price)} ${commit(o.kind === 'private' ? {type:'buy_private',company:o.item,buyer:o.buyer,price:o.price} : {type:'buy_train',train:o.item,price:o.price}, `Accept & purchase ${o.item} for ${money(o.price)}`)}</span>`;
      }
      if (view.viewer?.player_id === sellerPid && types.includes('offer')) {
        return `<span class="counterparty-offer-alert" role="status" data-testid="counterparty-offer-banner"><strong>Counterparty Offer:</strong> ${esc(o.buyer)} offers ${money(o.price)} for ${esc(o.item)} ${commit({type:'offer',kind:o.kind,item:o.item,seller:o.seller,buyer:o.buyer,price:o.price}, `Consent to ${o.item} offer at ${money(o.price)}`)}</span>`;
      }
    }
    return `<span class="counterparty-offer-status" role="status" data-testid="counterparty-offer-status">Pending offer: ${esc(o.item)} (${esc(o.seller)} → ${esc(o.buyer)} at ${money(o.price)})</span>`;
  }).join('');
  return `<div class="decision-navigation"><button class="secondary-btn" data-open-desk data-testid="nav-decisions-btn">Decisions & Planning</button><button class="secondary-btn" data-open-gathering data-testid="nav-gathering-btn">Gathering & Invitations</button>${types.includes('exchange_private') && enabled ? commit({type:'exchange_private',source:'ipo'},'DR power · Exchange for 10% IR') : ''}${offerActions}${pending ? `<strong role="status">${esc(pending)} — open Decisions</strong>` : ''}${s.finished ? '<button class="secondary-btn" data-open-desk>View results</button>' : ''}</div>`;
}

export function routePlanner(app, view, enabled, {inline = false} = {}) {
  const s=view.state,cid=s.current_corporation,corp=s.corporations[cid];
  if(!corp)return '<p>No corporation is operating.</p>';
  const synced=app.routeDraftKey===`${app.roomCode}:${s.revision}:${cid}`;
  const draft=(synced || app.routeDraft ? app.routeDraft : s.operating_turn?.step==='routes' ? view.route_quote?.routes : []) || [];
  const quote=routeQuote(app,view),editor=currentRouteEditor(app,view);
  const owned=corp.trains.filter(t=>!s.operating_turn?.new_trains?.includes(t));
  const selected=editor?.connections?.[editor.connection || 0];
  const chain=vertices=>(vertices || []).filter(v=>/:n\d+$/.test(v)).map(v=>`<span class="route-stop-chip">${esc(stopName(v))}</span>`).join('<span class="route-stop-arrow" aria-hidden="true">→</span>');
  return `<div class="visual-route-planner ${editor ? 'is-editing-route' : ''} ${inline ? 'is-inline-planner' : ''}" ${inline ? 'data-inline-route-planner' : ''}>
    ${inline ? `<div class="op-workspace-banner is-route-banner"><div><small>${owned.length} Train${owned.length===1?'':'s'} · ${app.routeQuoting ? 'Updating revenue…' : 'All trains · total revenue'}</small><strong>${editor ? `Editing ${esc(editor.train)} Stops` : 'Recommended Route Plan'}</strong></div><strong class="op-banner-figure route-total-figure">${quote ? money(quote.revenue) : '—'}</strong></div>` : `<header class="route-planner-header"><h3>${editor ? `Choose stops · ${esc(editor.train)}` : `Run ${esc(cid)} trains`}</h3><p>${editor ? 'Click a highlighted stop on the map, or choose it below. Other trains keep their routes.' : 'Change a train’s stops, or run this plan.'} ${esc(shortcutDescription(s.operating_turn?.step,'routes'))}</p></header>`}
    ${editor ? `<section class="route-stop-editor" aria-label="Choose route stops">
      <div class="route-edit-sequence">${editor.stops.length ? chain(editor.stops) : '<p>Choose the first stop.</p>'}</div>
      <p class="route-edit-status" role="status">${editor.loading ? 'Finding connected stops…' : editor.error ? esc(editor.error) : editor.next_stops?.length ? `Choose ${editor.stops.length ? 'the next' : 'a starting'} stop. Highlighted stops have a legal connection.` : selected ? 'Route complete. Use this route or undo a stop to change it.' : 'No route fits these stops with the other trains. Undo a stop, or cancel and free another train’s route.'}</p>
      ${editor.error ? '<button data-route-retry-stops>Try again</button>' : ''}
      <div class="route-stop-options">${(editor.next_stops || []).map(v=>`<button type="button" data-route-stop="${esc(v)}">${esc(stopName(v))}</button>`).join('')}</div>
      ${editor.connections?.length > 1 ? `<p>Choose the connection to preview on the map:</p><div class="route-connections">${editor.connections.map((c,i)=>`<button type="button" aria-pressed="${(editor.connection || 0)===i}" data-route-connection="${i}">Connection ${i+1} · ${money(c.revenue)}</button>`).join('')}</div>` : ''}
      ${selected ? `<div class="route-edit-revenue">This train <strong>${money(selected.revenue)}</strong><small>All trains: ${money(selected.total)}</small></div>` : ''}
    </section>` : `<div class="route-suggested-cards">${owned.map((tid,index)=>{
      const r=draft.find(r=>r.train===tid),col=TRAIN_ROUTE_COLORS[index%TRAIN_ROUTE_COLORS.length],train=s.trains[tid];
      const revenue=r ? quote?.route_revenues?.[tid] : 0;
      return `<article class="route-train-card" style="--train-color:${col}"><div class="route-train-top"><span class="train-color-dot" style="background:${col}"></span><b>${esc(train.type)} train · ${esc(tid)}</b><small>${train.type==='D' ? 'No stop limit' : `Up to ${train.distance} stops`}</small><strong class="route-train-revenue" aria-label="Route revenue for train ${esc(tid)}">${revenue===undefined ? 'Updating…' : money(revenue)}</strong></div><div class="route-stop-chain">${r ? chain(r.vertices) : '<span>Not running</span>'}</div>${enabled ? `<div class="route-card-controls"><button type="button" data-edit-route="${esc(tid)}">${r ? 'Change stops' : 'Choose stops'}</button>${r ? `<button type="button" data-route-idle="${esc(tid)}">Don’t run</button>` : ''}</div>` : ''}</article>`;
    }).join('') || `<p>${corp.trains.length ? 'New trains can run next operating turn.' : `${esc(cid)} has no trains yet.`}</p>`}</div>`}
    <footer class="route-plan-footer">
      ${editor ? `<div class="route-edit-controls"><button type="button" data-route-undo-stop ${!editor.stops.length ? 'disabled' : ''}>Undo stop</button><button type="button" data-route-cancel>Cancel edit</button></div><button type="button" class="confirm-button" data-route-use ${!selected || editor.loading || !enabled ? 'disabled' : ''}>${selected ? `Use this route · ${money(selected.revenue)}` : 'Choose stops on the map'}</button>` : `${inline ? '' : `<div class="route-revenue-counter" aria-label="Total route revenue"><span>${app.routeQuoting ? 'Updating revenue…' : 'All trains · total revenue'}</span><strong class="route-total-figure">${quote ? money(quote.revenue) : '—'}</strong></div>`}${app.routeError ? `<p role="alert">${esc(app.routeError)}</p><button data-route-retry-quote>Try again</button>` : ''}${enabled && draft.length ? `<button type="button" class="confirm-button" data-run-route-plan ${!quote || app.routeQuoting ? 'disabled' : ''}>${quote ? `Run ${draft.length} train${draft.length===1 ? '' : 's'} · ${money(quote.revenue)}` : 'Updating revenue…'}</button>` : ''}
      ${enabled && !view.route_quote?.routes?.length ? '<button type="button" class="confirm-button" data-quick-skip-routes>Continue to train purchase · ¥0</button>' : ''}
      ${enabled && owned.length ? '<button type="button" class="secondary-btn" data-copy-route-plan>Restore recommended routes</button>' : ''}${inline ? '' : '<p class="route-next-step">Next: pay shareholders or keep the revenue.</p>'}`}
    </footer>
  </div>`;
}

function negotiations(view, enabled) {
  const s = view.state, types = view.legal_actions.types, cid = s.current_corporation;
  const choices = (view.legal_actions.choices.offers || []).filter(o => s.round === 'operating' && o.buyer === cid && (o.kind === 'train' || ['3','4'].includes(s.phase)));
  const liveOffers = activeLiveOffers(view);
  const offerForm = (o, index) => {
    const seller=s.players[o.seller] ? o.seller : s.corporations[o.seller]?.president;
    const buyer=s.corporations[o.buyer]?.president;
    const recorded=liveOffers.find(r=>r.kind===o.kind && r.item===o.item && r.seller===o.seller && r.buyer===o.buyer);
    const price=recorded?.price ?? (o.kind==='private' ? s.privates[o.item].value : 1);
    const common=seller===buyer;
    const consent=pid=>common ? 'Common president' : recorded?.offered_by===pid ? `Recorded at ${money(recorded.price)}` : 'Awaiting matching offer';
    return `<article class="club-deal"><div class="mahogany-deal-table">${renderMemberPortrait(view,seller)}<div class="deal-scroll"><small>${esc(o.seller)} → ${esc(o.buyer)}</small><b>${esc(o.item)}</b><span>CLUB TRANSFER SCROLL</span></div>${renderMemberPortrait(view,buyer)}</div>
    ${o.kind==='private' ? `<div class="deal-private-card">${renderVintagePrivateCard(s.privates[o.item],{interactive:false,compact:true})}</div>` : `<div class="used-train-scroll">Used ${esc(s.trains[o.item]?.type)}-Train · #${esc(o.item)}<small>Paid from ${esc(o.buyer)}'s corporate safe.</small></div>`}
    <form data-negotiation="${attr(o)}"><label>Agreed price<input type="number" name="price" required min="${o.kind === 'private' ? Math.ceil(s.privates[o.item].value/2) : 1}" ${o.kind === 'private' ? `max="${s.privates[o.item].value*2}"` : ''} value="${price}" aria-label="${esc(o.item)} price ${index}"></label><div class="yen-chip-stack" aria-label="Add to agreed price">${[10,50,100].map(n=>`<button type="button" data-deal-chip="${n}" ${enabled ? '' : 'disabled'}>+¥${n}</button>`).join('')}</div>
    <div class="hanko-consent-ledger"><div><small>SELLER SEAL · 売主印</small><b class="${common || recorded?.offered_by===seller ? 'seal-recorded' : ''}">${esc(consent(seller))}</b></div><div><small>BUYER SEAL · 買主印</small><b class="${common || recorded?.offered_by===buyer ? 'seal-recorded' : ''}">${esc(consent(buyer))}</b></div></div>
    <button name="intent" value="offer" ${types.includes('offer') && enabled ? '' : 'disabled'}>Review offer / consent</button>${s.corporations[cid]?.president === view.viewer.player_id && enabled ? `<button name="intent" value="buy" ${types.includes(o.kind === 'train' ? 'buy_train' : 'buy_private') ? '' : 'disabled'}>Review purchase</button>` : ''}</form></article>`;
  };
  return `<p>Both presidents submit matching terms. A common president needs no separate consent. Purchases use the operating corporation's treasury.</p>
    <section class="recorded-offers"><h4>RECORDED OFFERS · CONSENT LEDGER</h4>${liveOffers.map(o=>`<p>${esc(o.item)}: ${esc(o.seller)} → ${esc(o.buyer)}, ${money(o.price)} · offered by ${esc(s.players[o.offered_by]?.name || o.offered_by)}</p>${enabled && o.buyer===cid && o.offered_by!==view.viewer.player_id ? (s.corporations[cid]?.president===view.viewer.player_id && types.includes(o.kind==='private'?'buy_private':'buy_train') ? commit(o.kind==='private'?{type:'buy_private',company:o.item,buyer:o.buyer,price:o.price}:{type:'buy_train',train:o.item,price:o.price},`Accept & purchase ${o.item} for ${money(o.price)}`) : types.includes('offer') ? commit({type:'offer',kind:o.kind,item:o.item,seller:o.seller,buyer:o.buyer,price:o.price},`Consent to ${o.item} offer at ${money(o.price)}`) : '') : ''}`).join('') || '<p>No offers recorded.</p>'}</section>
    ${choices.map((o,i)=>`<details class="club-deal-choice" ${i===0 ? 'open' : ''}><summary>${esc(o.item)} · ${esc(o.seller)} → ${esc(o.buyer)}</summary>${offerForm(o,i)}</details>`).join('') || `<div class="mahogany-deal-table">${renderMemberPortrait(view,s.corporations[cid]?.president)}<div class="deal-scroll"><b>CLUB DEAL TABLE</b><span>${['2'].includes(s.phase) ? 'Private purchases open in Phase 3' : 'No counterpart available'}</span></div><div class="empty-counterparty">売主印<br><small>Awaiting party</small></div></div><p>No negotiations available for this seat and operating corporation.</p>`}`;
}

export function renderDecisionDesk(app, view) {
  if (app.activeModal !== 'decisions') return '';
  const s=view.state, types=view.legal_actions.types, blocked=actionBlockReason(app,view), enabled=!blocked;
  if (s.finished) return `<div class="modal-backdrop"><section class="modal-card decision-desk" role="dialog" aria-modal="true" aria-label="Final results"><header class="modal-header"><h2>Match complete</h2><button class="close-modal-btn" data-close-modal="true" aria-label="Close results">×</button></header>${renderResults(s,view.prices)}</section></div>`;
  const options=view.action_options || [];
  const choices = options.filter(a=>['discard_train','emergency_sell','buy_train','bankrupt','exchange_private'].includes(a.type));
  const special=s.pending_special;
  syncRoutePlan(app,view);
  if (s.round==='operating' && s.current_corporation && !special && !s.pending_discards?.length && s.operating_turn?.step!=='routes' && !app.routeDraft?.length) {
    const staged=app.reviewAction || stagedDepotAction(app,view);
    const emergency=Boolean(view.train_financing?.shortfall);
    const cost=trainCost(view,staged), corp=s.corporations[s.current_corporation];
    const due=Math.max(0,cost-corp.cash), gap=Math.max(0,due-(s.players[corp.president]?.cash || 0));
    return `<div class="modal-backdrop boardroom-backdrop"><section class="modal-card decision-desk tactile-boardroom ${emergency ? 'emergency-boardroom' : ''}" role="dialog" aria-modal="true" aria-label="Decisions and planning"><header class="modal-header"><div><small>KOENJI RAILWAY CLUB 1889 · ${esc(s.current_corporation)} BOARDROOM</small><h2>${emergency ? '⚠ Mandatory Train Shortfall · Presidential Bailout' : 'Decisions & Planning'} · Rev ${s.revision}</h2></div><button class="close-modal-btn" data-close-modal="true" aria-label="Close decisions">×</button></header>${blocked ? `<p class="inspection-only">🔒 ${esc(blocked)}</p>` : ''}
      <div class="boardroom-columns"><section class="boardroom-column"><h3>I. THE ROUNDHOUSE &amp; DEPOT</h3>${renderRoundhouse(view,staged)}${emergency ? `<p class="empty-fleet-warning" role="status">Fleet empty · ${view.train_limit} stalls. Mandatory depot financing: ${money(view.train_financing.cheapest)}.</p>` : ''}${renderDepotTray(app,view,{action:staged,enabled})}</section>
      <section class="boardroom-column"><h3>II. THE COUNTING HOUSE &amp; VAULT</h3>${renderCountingHouse(view,staged)}<div class="funding-note">${staged?.type==='buy_train' && staged.price!==undefined && cost<=corp.cash ? '✓ Treasury covers this used train. No presidential cash or share sales needed.' : emergency ? `${staged?.type==='buy_train' ? 'Staged train order' : 'Cheapest depot alternative'}: Safe pays ${money(Math.min(cost,corp.cash))} · President due ${money(due)} · Unfunded ${money(gap)}.` : '✓ Corporate cash and personal cash are separate. Only a mandatory purchase can call on the president.'}</div>${renderLiquidationMat(view,enabled,actionLabel,staged)}</section>
      <section class="boardroom-column"><h3>III. CLUB DEAL TABLE &amp; TRANSFERS</h3>${negotiations(view,enabled)}<section class="bankruptcy-gate"><h4>PRESIDENTIAL SOLVENCY</h4>${enabled && choices.some(a=>a.type==='bankrupt') ? choices.filter(a=>a.type==='bankrupt').map(a=>commit(a,actionLabel(a,view))).join('') : '<button type="button" disabled>🔒 Bankruptcy unavailable in this position</button>'}</section>${enabled ? choices.filter(a=>a.type==='exchange_private').map(a=>commit(a,actionLabel(a,view))).join('') : ''}</section></div>
      ${renderTrainVoucher(app,view,staged,{enabled,label:staged ? actionLabel(staged,view) : ''})}
      <details><summary>Train routes</summary>${routePlanner(app,view,enabled && types.includes('run_routes'))}</details></section></div>`;
  }
  if (!special && !s.pending_discards?.length && (s.operating_turn?.step === 'routes' || app.routeDraft?.length)) {
    return `<div class="modal-backdrop route-focus-backdrop"><section class="modal-card decision-desk route-focus-desk" role="region" aria-label="Run train routes"><header class="modal-header"><div><small>OPERATING TURN · 3 OF 5</small><h2>Train routes</h2></div><button class="close-modal-btn" data-close-modal="true" aria-label="Close routes">×</button></header>${blocked ? `<p class="inspection-only">${esc(blocked)}</p>` : ''}${app.reviewAction ? `<section class="action-review"><p>${esc(actionLabel(app.reviewAction,view))}</p><button class="confirm-button" data-confirm-reviewed ${enabled ? '' : 'disabled'}>Confirm routes</button><button data-cancel-reviewed>Cancel</button></section>` : ''}${routePlanner(app,view,enabled && types.includes('run_routes'))}</section></div>`;
  }
  const isMapDocked = app.view === 'map' && (s.operating_turn?.step === 'routes' || app.routeDraft?.length);
  return `<div class="modal-backdrop ${isMapDocked ? 'is-map-docked-backdrop' : ''}"><section class="modal-card decision-desk ${isMapDocked ? 'is-map-docked-desk' : ''}" role="dialog" aria-modal="true" aria-label="Decisions and planning"><header class="modal-header"><h2>Decisions & Planning · Rev ${s.revision}</h2><button class="close-modal-btn" data-close-modal="true" aria-label="Close decisions">×</button></header>
    ${blocked ? `<p class="inspection-only">🔒 ${esc(blocked)}</p>` : ''}
    ${renderResults(s,view.prices)}
    ${app.reviewAction ? `<section class="action-review"><h3>Confirm decision</h3><p>${esc(actionLabel(app.reviewAction, view))}</p><p>${app.reviewAction.type === 'run_routes' ? esc(shortcutDescription(s.operating_turn?.step, 'routes')) : ''} ${app.selectedTileId ? 'An uncommitted tile preview will be cleared after this decision.' : ''}</p><p>This records one game action at revision ${s.revision}. ${app.reviewAction.type === 'bankrupt' ? 'This ends the game immediately.' : 'The server validates the decision before it is accepted.'}</p><button class="confirm-button" data-confirm-reviewed ${enabled ? '' : 'disabled'}>Confirm decision</button><button class="secondary-btn" data-cancel-reviewed>Cancel</button></section>` : ''}
    ${s.pending_discards?.length ? `<h3>Resolve excess trains</h3><p>Each affected president chooses which train to return. Normal operation resumes after all required discards.</p>` : ''}
    ${special ? `<h3>Ehime seller's optional C4 lay</h3><p>Choose an available green tile or decline. The interrupted operating step will resume.</p>${enabled && types.includes('pass') ? commit({type:'pass'}, 'Decline ER lay') : ''}<div class="decision-options">${enabled ? (view.legal_tile_lays.C4 || []).map(t=>commit({type:'lay_tile',hex:'C4',tile:t.tile,rotation:t.rotation}, `Lay #${t.tile} at ${t.rotation*60}° · ${money(t.cost)}`)).join('') : ''}</div>` : ''}
    ${view.train_financing ? `<section class="train-financing-bar"><h3>Mandatory train financing</h3><div class="financing-chips"><span>Cheapest depot train: <b>${money(view.train_financing.cheapest)}</b></span><span>Corporate treasury: <b>${money(view.train_financing.treasury)}</b></span><span class="is-shortfall">Shortfall: <b>${money(view.train_financing.shortfall)}</b></span><span>President's personal cash: <b>${money(view.train_financing.personal_cash)}</b></span></div></section>` : ''}
    <h3>Trains, emergency funding &amp; private exchange</h3><p>Only server-validated choices are listed. Emergency funds come from personal share sales; train purchases use corporate cash and, when mandatory, the president's contribution. Discards return trains to the depot.</p>
    <div class="decision-options">${enabled ? choices.map(a=>commit(a,actionLabel(a,view))).join('') || '<p>No additional decisions available.</p>' : '<p>🔒 Read-only for this seat or revision.</p>'}</div>
    <details ${s.operating_turn?.step === 'routes' || app.routeDraft?.length ? 'open' : ''}><summary>Train routes</summary>${routePlanner(app,view,enabled && types.includes('run_routes'))}</details>
    <details><summary>Private companies &amp; corporate train transfers</summary>${negotiations(view,enabled)}</details>
  </section></div>`;
}

export const renderGathering=renderGatheringSetup;

export function bindDecisionDesk({app, api, render, execute, toast, enterRoom}) {
  const on = (selector, event, fn) => document.querySelectorAll(selector).forEach(el=>el.addEventListener(event,fn));
  bindGatheringSetup({app,render});
  const review = action => { app.reviewAction=action; app.reviewRevision=app.viewRevision; app.activeModal='decisions'; app.focusReview=true; render(); document.querySelector('.action-review')?.scrollIntoView?.({block:'nearest'}); document.querySelector('[data-confirm-reviewed]')?.focus?.({preventScroll:true}); };
  on('[data-open-desk]','click',()=>{if(app.displayedViewData.state.operating_turn?.step==='routes') app.view='map';app.activeModal='decisions';app.reviewAction=null;render();});
  on('[data-next-gathering]','click',()=>{app.nextNames=Object.values(app.displayedViewData.state.players).map(p=>p.name).join('\n');app.gatheringTab='host';app.activeModal='gathering';render();});
  on('[data-open-gathering]','click',()=>{app.gatheringTab='host';app.activeModal='gathering';render();});
  on('[data-stock-quantity]','change',e=>{app[e.target.dataset.stockQuantity]=Number(e.target.value);render();});
  on('[data-review-action]','click',e=>review(JSON.parse(e.currentTarget.dataset.reviewAction)));
  on('[data-cancel-reviewed]','click',()=>{app.reviewAction=null;app.trainStageKey=trainStageKey(app,app.displayedViewData);app.trainStage=null;render();});
  on('[data-confirm-reviewed]','click',async()=>{
    if ((app.reviewAction ? app.reviewRevision : app.displayedViewData.state.revision) !== app.liveRevision) { app.reviewAction=null;toast('Position changed. Review the decision again.',true);return; }
    const view=app.displayedViewData;
    const action=app.reviewAction || stagedDepotAction(app,view);
    if (!action || actionBlockReason(app,view)) return;
    app.reviewAction=null;if(action.type==='run_routes'){app.activeModal=null;app.routeEditor=null;}await execute(action);
  });
  on('[data-buy-train]','click',e=>{
    const view=app.displayedViewData;
    const action=(view.action_options || []).find(a=>a.type==='buy_train' && a.train===e.currentTarget.dataset.buyTrain && !a.trade_in);
    if (!action || actionBlockReason(app,view)) return;
    if (e.currentTarget.closest('[data-inline-train-desk]')) {
      app.trainStageKey=trainStageKey(app,view);app.trainStage=action;render();
    } else review(action);
  });
  on('[data-cancel-train]','click',()=>{app.trainStageKey=trainStageKey(app,app.displayedViewData);app.trainStage=null;render();});
  on('[data-stamp-train]','click',async e=>{
    const view=app.displayedViewData, action=JSON.parse(e.currentTarget.dataset.stampTrain);
    if (Number(e.currentTarget.dataset.stampRevision)!==app.liveRevision || actionBlockReason(app,view)) {toast('Position changed. Review the decision again.',true);return;}
    if (!(view.action_options || []).some(a=>JSON.stringify(a)===JSON.stringify(action))) {toast('This purchase is no longer available.',true);return;}
    await execute(action);
  });
  on('[data-deal-chip]','click',e=>{
    const input=e.currentTarget.closest('form').elements.price;
    input.value=Math.min(Number(input.max || Infinity),Math.max(Number(input.min),Number(input.value || 0)+Number(e.currentTarget.dataset.dealChip)));
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  on('[data-negotiation]','submit',e=>{
    e.preventDefault(); const f=e.currentTarget, deal=JSON.parse(f.dataset.negotiation), price=Number(new FormData(f).get('price'));
    if (e.submitter?.value === 'buy') review(deal.kind === 'private' ? {type:'buy_private',company:deal.item,buyer:deal.buyer,price} : {type:'buy_train',train:deal.item,price});
    else review({type:'offer',...deal,price});
  });
  bindRoutePlanning({app,api,render,execute,toast});
  on('[data-quick-skip-routes]','click',async()=>{app.activeModal=null;app.reviewAction=null;await execute({type:'dividend',payout:false});});
  on('[data-create-gathering]','submit',async e=>{
    e.preventDefault();
    if(app.creatingGathering) return;
    const formData=new FormData(e.currentTarget);
    const names=[...formData].filter(([key])=>/^player_\d+$/.test(key)).map(([,name])=>String(name).trim());
    if(names.length<2 || names.length>6 || names.some(n=>!n || n.length>60)) {toast('Enter a name for each of the 2–6 seats, up to 60 characters each.',true);return;}
    if(new Set(names).size!==names.length) {toast('Give each player a different name so their invitations are easy to identify.',true);return;}
    app.creatingGathering=true;render();
    try {
      const room=await api.createWaitingRoom(names,String(formData.get('title')).trim(),formData.has('playing'),formData.get('host_name'),formData.get('host_route'));
      app.lobbyTab='invitations';
      await enterRoom(room.room_code,room.seat_key,room.token);
    } catch(err){toast(err.message,true);}
    finally {app.creatingGathering=false;render();}
  });
  on('[data-join-gathering]','submit',async e=>{
    e.preventDefault();try{
      const input=String(new FormData(e.currentTarget).get('invitation')).trim();
      if(/^[A-Z0-9]{6}$/i.test(input)){app.publicLobby=await api.request(`/api/1889/games/${input.toUpperCase()}/lobby`);render();return;}
      const url=new URL(input);
      if(url.origin!==location.origin) throw new Error('Use an invitation for this server.');
      const hash=new URLSearchParams(url.hash.slice(1));
      const room=hash.get('room') || url.searchParams.get('room'), seat=hash.get('role') || url.searchParams.get('seat'), token=hash.get('token') || url.searchParams.get('token');
      if(!room || !token) throw new Error('The invitation must include its room and seat credential.');
      api.setTabSession(room,seat || 'custom',token,hash.get('face') || url.searchParams.get('face'));
      await enterRoom(room,seat || 'custom',token);
    }catch(err){toast(err.message,true);}
  });
  on('[data-claim-seat]','submit',async e=>{
    e.preventDefault();try{const room=app.publicLobby.room_code;const seat=await api.request(`/api/1889/games/${room}/claim`,{method:'POST',body:{seat_index:Number(e.currentTarget.dataset.claimSeat),player_name:new FormData(e.currentTarget).get('player_name')}});await enterRoom(room,seat.player_id,seat.player_token);}catch(err){toast(err.message,true);}
  });
  on('[data-open-sandbox]','click',async e=>{
    try{const room=await api.createFixtureRoom(e.currentTarget.dataset.openSandbox);await enterRoom(room.room_code,'p1',room.player_tokens[0]);}catch(err){toast(err.message,true);}
  });
  on('[data-rejoin-room]' ,'click',async e=>{
    const r=api.getRoomDirectory()[e.currentTarget.dataset.rejoinRoom], own=r.own_session;
    if(!own) {toast('Use your invitation or Demo Tools to reopen this test room.',true);return;}
    try {await enterRoom(r.room_code,own.seat_key,own.token);}catch(err){toast(err.message,true);}
  });
}
