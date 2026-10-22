import {escapeHtml as esc, actionBlockReason, roundName,operatingStepLabel} from './presentation.js';
import {CORP_META} from '../constants1889.js';
import {renderKemonitoDelivery} from './kemonito.js';
const money=value=>`¥${Number(value || 0).toLocaleString()}`;
export const CONFIRMED_ACTIONS=new Set(['buy_shares','sell_shares','buy_private','buy_train','exchange_private','bankrupt','emergency_sell','discard_train','offer','accept_offer','accept_train_offer','accept_private_offer']);
export function turnIdentity(app,view){
  const s=view?.state;
  if(!s || s.finished || app.viewRevision!==app.liveRevision || app.isPlayingReplay || app.isLoadingRevision)return null;
  // `player` may be authorized for an out-of-turn private ability; it does
  // not identify whose normal stock/operating turn is in progress.
  const actor=view.legal_actions?.active_player || s.current_player;
  if(!actor || view.viewer?.player_id!==actor)return null;
  return `${app.roomCode}:${view.viewer.player_id}:${s.round}:${s.stock_round}:${s.or_number}:${s.current_corporation || ''}:${actor}`;
}
export class TurnReminder {
  constructor({now=()=>Date.now(),notify=()=>{},onTurn=()=>{}}={}){Object.assign(this,{now,notify,onTurn});this.key=null;this.lastInput=now();this.reminded=false;}
  update(app,view){
    const key=turnIdentity(app,view);
    if(key!==this.key){this.key=key;this.lastInput=this.now();this.reminded=false;if(key)this.onTurn(key);}
  }
  activity(){this.lastInput=this.now();}
  tick(delay,blocked=false){
    if(!this.key || !delay || this.reminded || blocked || this.now()-this.lastInput<delay*1000)return false;
    this.reminded=true;this.notify();return true;
  }
}
export function renderTurnStatus(app,view){
  const s=view.state,actor=view.legal_actions?.active_player || s.current_player;
  const historical=app.viewRevision!==app.liveRevision;
  const mine=Boolean(turnIdentity(app,view));
  const corp=s.corporations?.[s.current_corporation];
  return `<section class="shared-turn-status ${mine?'is-your-turn':''} ${app.turnReminderVisible&&mine?'is-reminding':''}" aria-label="Current turn">
    <div class="turn-person"><span class="turn-lantern" aria-hidden="true">${mine?'◆':'◇'}</span><div><small>${historical?'Historical turn':s.finished?'Match complete':mine?'Your turn':'Current turn'}</small><strong data-no-translate>${esc(s.finished?'—':s.players?.[actor]?.name || actor || '—')}</strong></div></div>
    <div class="turn-phase"><span>${esc(roundName(s))}</span><b>${corp?`${esc(corp.id)} · `:''}${esc(s.operating_turn?.step && s.round==='operating'?({train:'Train purchase',token:'Station placement',track:'Track lay',routes:'Train routes',dividend:'Dividend'})[s.operating_turn.step] || s.operating_turn.step:s.round==='auction'?'Choose a private company':s.round==='stock'?'Buy, sell or pass':'')}</b><span class="turn-bank">Bank ${money(s.bank)} · Phase ${esc(s.phase)}</span></div>
    ${corp&&s.round==='operating'?`<div class="prominent-treasury"><small>${esc(corp.id)} · Company treasury</small><strong data-account="treasury:${esc(corp.id)}">${money(corp.cash)}</strong></div>`:''}
    ${mine?`<button class="turn-go" data-view="${s.round==='operating'?'map':'market'}">${app.turnReminderVisible?'It is your turn — open your desk':'Open your desk'} →</button>`:''}
  </section>`;
}
export function decisionDescription(action,view){
  const s=view.state,cid=action.corporation || s.current_corporation,c=s.corporations?.[cid];
  const player=s.players?.[view.viewer?.player_id];
  if(action.type==='buy_shares'){
    const percent=c.par==null?20:action.percent || 10;
    const price=c.par==null?action.price:action.source==='pool'?view.prices?.[cid]:c.par;
    const cost=percent/10*price;
    return [`Buy ${percent}% ${cid} from ${action.source==='pool'?'Market pool':'IPO'}`,`Personal cash: ${money(player?.cash)} → ${money((player?.cash || 0)-cost)}`];
  }
  if(['sell_shares','emergency_sell'].includes(action.type))return [`Sell ${action.percent || 10}% ${cid}`,`Proceeds: ${money((view.prices?.[cid] || 0)*(action.percent || 10)/10)} · Market pool`];
  if(action.type==='buy_train'){
    const train=s.trains[action.train],cost=action.price ?? Math.max(0,train.price-(action.trade_in?300:0));
    const corp=s.corporations[s.current_corporation],contribution=Math.max(0,cost-corp.cash);
    return [`Buy ${train.type}-Train · ${money(cost)}`,`${corp.id} treasury: ${money(corp.cash)} → ${money(Math.max(0,corp.cash-cost))}${contribution?` · President contributes ${money(contribution)}`:''}${action.trade_in?` · Trade in ${action.trade_in}`:''}`];
  }
  if(action.type==='dividend'){
    const revenue=s.operating_turn?.revenue || 0;
    return [action.payout?`Pay dividend · ${money(revenue)}`:`Withhold · ${money(revenue)}`,action.payout?`Market pool → company: ${money(revenue*(c?.pool || 0)/100)} · IPO retained by bank: ${money(revenue*(c?.ipo || 0)/100)}`:`${cid} treasury: ${money(c?.cash)} → ${money((c?.cash || 0)+revenue)}`];
  }
  if(action.type==='end_turn')return ['Finish this turn?',`${cid || player?.name || ''} · The next player or company will act.`];
  if(action.type==='pass')return ['Pass this opportunity?',s.stock_turn?.bought?'Finish this stock turn.':'Continue to the next action.'];
  if(action.type==='skip'){
    const step=s.operating_turn?.step;
    const effects={track:'No track will be laid. Continue to station placement.',token:'No station will be placed. Continue to train routes.',routes:'No trains will run. Continue to dividend resolution with ¥0 revenue.'};
    return [`Skip ${operatingStepLabel(step)}?`,effects[step] || 'Continue to the next available operating step.'];
  }
  if(action.type==='buy_private'){
    if(s.round==='auction'){
      const price=action.price ?? (s.privates?.[action.company]?.value || 0)-(action.company==='TR' ? s.auction?.discount || 0 : 0);
      return [`Buy ${action.company} · ${money(price)}`,`Personal cash: ${money(player?.cash)} → ${money((player?.cash || 0)-price)}`];
    }
    return [`Buy ${action.company} · ${money(action.price)}`,`${action.buyer || cid} · Company treasury`];
  }
  if(action.type==='bankrupt')return ['Declare bankruptcy?','This ends the match immediately.'];
  if(action.type==='exchange_private')return ['Exchange DR for 10% IR from IPO','DR will close.'];
  return [action.type.replaceAll('_',' '),[action.train,action.company,action.item,action.price!=null?money(action.price):''].filter(Boolean).join(' · ')];
}
export function confirmationLabel(action,view){
  const train=view.state.trains?.[action.train];
  return ({buy_shares:'Buy Shares',sell_shares:'Sell Shares',buy_private:'Buy Private Company',
    buy_train:`Buy ${train?.type || ''}-Train`,end_turn:'Finish Turn',pass:'Pass Turn',
    skip:`Skip ${operatingStepLabel(view.state.operating_turn?.step)}`,
    dividend:action.payout?'Pay Dividend':'Withhold Revenue',exchange_private:'Exchange Private Company',
    bankrupt:'Declare Bankruptcy',emergency_sell:'Sell Shares',discard_train:'Discard Train',
    offer:'Send Offer',accept_offer:'Accept Offer',accept_train_offer:'Accept Train Offer',accept_private_offer:'Accept Private Offer'})[action.type] || 'Record Decision';
}
function renderSharePurchase(action, view) {
  const cid=action.corporation || view.state.current_corporation;
  const corp=view.state.corporations?.[cid],meta=CORP_META[cid] || {};
  const percent=corp?.par==null?20:action.percent || 10;
  const price=corp?.par==null?action.price:action.source==='pool'?view.prices?.[cid]:corp.par;
  const cost=percent/10*price,cash=view.state.players?.[view.viewer?.player_id]?.cash || 0;
  return `<div class="purchase-order">
    <div class="purchase-art purchase-hero-art"><img src="/assets/exchange/railway-investor.png" alt="A proud investor receives a railway share certificate beside a steam locomotive in the morning sun"></div>
    <div class="purchase-certificate"><div class="purchase-monogram" style="background:${esc(meta.color || '#795526')};color:${esc(meta.text || '#fff')}">${esc(cid)}</div><div class="purchase-company"><small>SHARE CERTIFICATE</small><strong>${esc(meta.name || corp?.name || cid)}</strong><span>${action.source==='pool'?'Market pool':'Initial public offering'}</span></div><div class="purchase-percent"><strong>${percent}%</strong><small>OWNERSHIP</small></div></div>
    <dl class="purchase-settlement"><div><dt>Cash on hand</dt><dd>${money(cash)}</dd></div><div><dt>Purchase cost</dt><dd>−${money(cost)}</dd></div><div class="purchase-balance"><dt>Cash remaining</dt><dd>${money(cash-cost)}</dd></div></dl>
    <div class="purchase-order-note"><span aria-hidden="true">◆</span> Certificate transferred when you confirm</div>
  </div>`;
}
function renderShareSale(action, view) {
  const cid=action.corporation || view.state.current_corporation;
  const corp=view.state.corporations?.[cid],meta=CORP_META[cid] || {};
  const percent=action.percent || 10,price=view.prices?.[cid] || 0;
  const proceeds=price*percent/10,cash=view.state.players?.[view.viewer?.player_id]?.cash || 0;
  return `<div class="sale-order">
    <div class="sale-quote-board"><div class="sale-exchange-label"><span aria-hidden="true">▥</span> KOENJI STOCK EXCHANGE <span>1889</span></div>
      <img class="sale-trading-floor" src="/assets/exchange/meiji-trading-floor.png" alt="Kimono-clad brokers exchanging share certificates on a busy wooden trading floor"><div class="sale-market-display">
      <div class="sale-quote"><small>${esc(cid)} · MARKET PRICE / 10%</small><strong>${money(price)}</strong><span>Sale to market pool</span></div><div class="sale-lot"><small>SELL ORDER</small><strong>${percent}%</strong><span>${percent/10} × 10% shares</span></div></div></div>
    <div class="purchase-certificate"><div class="purchase-monogram" style="background:${esc(meta.color || '#795526')};color:${esc(meta.text || '#fff')}">${esc(cid)}</div><div class="purchase-company"><small>SHARES TO MARKET POOL</small><strong>${esc(meta.name || corp?.name || cid)}</strong><span>${percent}% holding offered for sale</span></div><span class="sale-order-stamp">SELL</span></div>
    <dl class="purchase-settlement"><div><dt>Cash on hand</dt><dd>${money(cash)}</dd></div><div class="sale-proceeds"><dt>Sale proceeds</dt><dd>+${money(proceeds)}</dd></div><div class="purchase-balance"><dt>Cash after sale</dt><dd>${money(cash+proceeds)}</dd></div></dl>
    <div class="purchase-order-note"><span aria-hidden="true">◆</span> Shares enter the market pool when you confirm</div>
  </div>`;
}
export function renderConfirmation(app,view){
  const pending=app.pendingDecision;if(!pending)return '';
  const [title,detail]=decisionDescription(pending.action,view);
  const isSale=['sell_shares','emergency_sell'].includes(pending.action.type);
  const isShareOrder=pending.action.type==='buy_shares' || isSale;
  const stale=pending.revision!==app.liveRevision || pending.room!==app.roomCode || pending.token!==app.token;
  // The engine accepts an auction buy_private as a bid at the offered price.
  const legalType=view.state.round==='auction' && pending.action.type==='buy_private' ? 'bid'
    : view.state.round==='stock' && pending.action.type==='pass' ? 'end_turn' : pending.action.type;
  const unavailable=Array.isArray(view.legal_actions?.types) && !view.legal_actions.types.includes(legalType);
  const blocked=stale?'Position changed. Review the decision again.':actionBlockReason(app,view) || (unavailable?'This action is unavailable for this seat.':null);
  return `<div class="modal-backdrop decision-confirm-backdrop"><section class="modal-card decision-confirm ${isShareOrder?'share-purchase-confirm':''} ${isSale?'share-sale-confirm':''}" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-detail">
    <div class="purchase-window-title" aria-hidden="true"><span>1889 · ${isSale?'Share sale':'Share purchase'}</span><span>▪</span></div><small>REVIEW YOUR DECISION</small><h2 id="confirm-title">${esc(title)}</h2><p id="confirm-detail" ${isShareOrder?'class="purchase-accessible-detail"':''}>${esc(detail)}</p>
    ${isSale?renderShareSale(pending.action,view):pending.action.type==='buy_shares'?renderSharePurchase(pending.action,view):''}
    ${blocked?`<p role="alert">${esc(blocked)}</p>`:''}<div class="confirm-dialog-actions"><button type="button" data-cancel-decision>Cancel</button><button type="button" class="confirm-button" data-commit-decision ${blocked?'disabled':''}>${esc(confirmationLabel(pending.action,view))}</button></div>
  </section></div>`;
}
export function renderFlotation(app){
  const event=app.flotationQueue?.[0];if(!event || app.activeModal || app.viewRevision!==app.liveRevision || app.isPlayingReplay)return '';
  return `<div class="flotation-backdrop"><section class="flotation-notice" role="dialog" aria-modal="true" aria-labelledby="flotation-title"><div class="charter-emblem" aria-hidden="true">✦ 🚂 ✦</div><small>KOENJI RAILWAY GAZETTE · EXTRA</small><h2 id="flotation-title">${esc(event.corporation)} is ready to run!</h2><p data-no-translate>${esc(event.name)}</p><div class="flotation-capital"><small>Company treasury funded</small><strong>${money(event.funding)}</strong></div><p>50% sold · The bank provides 10× par capital.</p><p>This railway joins the next operating round.</p><button type="button" class="confirm-button" data-dismiss-flotation>Continue</button></section></div>`;
}
export function renderCashDelivery(view,playback,options){
  return renderKemonitoDelivery(view,playback,options);
}
