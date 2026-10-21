import {TRAIN_ROUTE_COLORS} from '../constants1889.js';
import {escapeHtml as esc} from '../ui/presentation.js';
import {translate as t} from '../ui/i18n.js';
const money=n=>`¥${Number(n||0).toLocaleString('en-US')}`;
const colorFor=(job,route)=>{
  const trains=job.view.state.corporations?.[job.corporation]?.trains||[];
  return TRAIN_ROUTE_COLORS[Math.max(0,trains.indexOf(route.train))%TRAIN_ROUTE_COLORS.length];
};
export function renderRouteOverlay(job) {
  if(!job)return '';
  return job.timeline.routes.filter(r=>r.geometry).map(route=>{
    const color=colorFor(job,route),g=route.geometry;
    return `<g data-journey="${esc(route.train)}" style="--journey-color:${color}">
      <path class="journey-rail-shadow" d="${g.d}"/><path data-journey-trace d="${g.d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
      ${g.stops.filter(s=>!route.scored_stops||route.scored_stops.includes(s.vertex)).map(s=>`<circle data-journey-stop="${esc(s.vertex)}" cx="${s.x}" cy="${s.y}" r="9"/>`).join('')}
      <g data-journey-engine><g data-engine-heading>
        <path d="M-10 4H11L9 0H6V-5H0V-3H-6V0H-10Z" fill="#283d3b" stroke="#fff2c8" stroke-width="1.2"/>
        <path d="M-6-3V-7H-2V-3M4-5V-9H7V-5" fill="#cda75b" stroke="#231b15" stroke-width=".8"/>
        <circle cx="-5" cy="5" r="2.5" fill="#d5ae60" stroke="#231b15"/><circle cx="4" cy="5" r="2.5" fill="#d5ae60" stroke="#231b15"/>
      </g><text y="-14" text-anchor="middle" class="journey-engine-label">${esc(route.train)}</text></g>
    </g>`;
  }).join('');
}
export function patchRouteOverlay(root,job,sample) {
  if(!root)return;
  if(root.dataset.playbackId!==(job?.identity||'')) {
    root.innerHTML=renderRouteOverlay(job);root.dataset.playbackId=job?.identity||'';
  }
  if(!job||!sample)return;
  const groups=[...root.querySelectorAll('[data-journey]')];
  for(const route of sample.routes) {
    const group=groups.find(g=>g.dataset.journey===route.train);if(!group||!route.geometry)continue;
    group.querySelector('[data-journey-trace]').setAttribute('stroke-dashoffset',String(1-route.progress));
    const engine=group.querySelector('[data-journey-engine]');
    engine.style.display=route.departed&&!route.done?'':'none';
    engine.setAttribute('transform',`translate(${route.point.x.toFixed(2)} ${route.point.y.toFixed(2)})`);
    // Only the engine rotates; its train ID stays upright.
    group.querySelector('[data-engine-heading]').setAttribute('transform',`rotate(${route.point.angle.toFixed(2)})`);
    group.querySelectorAll('[data-journey-stop]').forEach(el=>{
      const stop=route.geometry.stops.find(s=>s.vertex===el.dataset.journeyStop);
      el.classList.toggle('is-visited',route.departed&&stop.distance<=route.progress*route.geometry.length+.01);
    });
  }
}
export function renderRouteResult(job,sample,view,{motion=true,speed='normal',now=performance.now()}={}) {
  if(!job)return '';
  const paid=Boolean(view.state.operating_turn?.dividend),playing=!sample.done,run=job.timeline.run;
  const body=`<section class="route-payoff-result ${playing?'is-running':'is-complete'}" aria-label="${t('Route result')}">
    <div class="route-dispatch-heading"><span>${t(playing?'RAILWAY DISPATCH':'OPERATING RECEIPT')}</span><b data-no-translate>${esc(run.corporation)}</b></div>
    <div class="route-payoff-trains">${sample.routes.map(r=>`<span style="--journey-color:${colorFor(job,r)}" class="${r.done?'is-arrived':''}"><i aria-hidden="true">${r.done?'✓':'▸'}</i><b data-no-translate>${esc(r.train)}</b>${Number.isFinite(r.revenue)?`<strong>${money(r.revenue)}</strong>`:''}</span>`).join('')}
    ${(run.idle_trains||[]).map(train=>`<span class="is-idle"><b data-no-translate>${esc(train)}</b> ${t('Idle')}</span>`).join('')}</div>
    <div class="route-payoff-total ${job.completedAt!=null?'is-new-result':''}" style="animation-delay:-${Math.max(0,now-(job.completedAt||0))}ms"><span>${t('Route revenue')}</span><strong>${money(run.revenue)}</strong></div>
    <p>${t(paid?'Dividend decision recorded':'Awaiting dividend decision')}</p>
    ${playing?`<button type="button" data-skip-journey>${t('Skip animation')}</button>`:motion&&speed!=='instant'&&job.timeline.routes.length>0&&job.timeline.routes.every(r=>r.geometry)?`<button type="button" data-replay-journey>${t('Watch again')}</button>`:''}
  </section>`;
  return paid?`<details class="settled-route-receipt"><summary><span data-no-translate>${esc(run.corporation)}</span> · ${t('Route revenue')} <b>${money(run.revenue)}</b></summary>${body}</details>`:body;
}
export function renderAcceptedFeedback(feedback) {
  if(!feedback)return '';
  const e=feedback.event;
  const labels={lay_tile:'Track laid',place_token:'Station established',buy_train:'Train delivered',dividend:e.payout&&e.revenue>0?'Dividend paid':'Revenue withheld',buy_shares:'Certificate purchased',sell_shares:'Certificate sold',bid:'Bid recorded',buy_private:'Private company acquired'};
  const title=labels[e.type];if(!title&&!e.account_deltas?.length&&!e.market_movements?.length)return '';
  const allocation=e.dividend_allocation;
  return `<section class="accepted-action-receipt" aria-label="${t('Accepted action')}"><button type="button" class="dismiss-payoff-receipt" data-dismiss-payoff-receipt aria-label="${t('Dismiss receipt')}">×</button>
    ${title?`<b>${t(title)}</b>${e.corporation?` <span data-no-translate>${esc(e.corporation)}</span>`:''}`:''}
    ${e.revenue_revision?`<p>${t('Revenue revised')}: ${money(e.revenue_revision.before)} → ${money(e.revenue_revision.after)}</p>`:''}
    ${(e.account_deltas||[]).map(delta=>`<div><span><span data-no-translate>${esc(delta.name||delta.recipient)}</span> · ${t(delta.destination==='treasury'?'Company treasury':'Personal purse')}</span><strong class="${delta.amount>0?'is-credit':'is-debit'}">${delta.amount>0?'+':'−'}${money(Math.abs(delta.amount))}</strong><small>${money(delta.before)} → ${money(delta.after)}</small></div>`).join('')}
    ${allocation&&e.payout?`<p>${t('Market pool → company')}: ${money(allocation.treasury)} · ${t('IPO retained by bank')}: ${money(allocation.ipo_retained_by_bank)}</p>`:''}
    ${(e.market_movements||[]).map(move=>`<p><span data-no-translate>${esc(move.corporation)}</span> · ${t('Share price')}: ${money(move.price_before)} → ${money(move.price_after)}${JSON.stringify(move.before)===JSON.stringify(move.after)?` · ${t('Position unchanged')}`:''}</p>`).join('')}
  </section>`;
}
