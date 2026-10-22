import {escapeHtml as esc} from './presentation.js';

// Derive first crossings from confirmed history, so reconnects and different
// players agree without writing celebration flags into the rules state.
export function dividendMilestone(event,view,revision=view?.state?.revision) {
  if(event?.type!=='dividend' || !event.payout || !event.corporation || !Array.isArray(view?.history_events))return null;
  if(!event.cash_receipts?.some(r=>Number.isFinite(r.amount)&&r.amount>0))return null;
  const prior=view.history_events.filter(item=>item.revision<revision && item.event?.type==='dividend' && item.event.payout && item.event.corporation===event.corporation);
  const highest=Math.max(0,...prior.map(item=>Number(item.event.revenue)||0));
  const thresholds=[20,100,200].filter(value=>highest<value && value<=event.revenue);
  return thresholds.length ? {corporation:event.corporation,amount:event.revenue,thresholds} : null;
}

export function renderDividendMilestone(playback) {
  const job=playback.lanes.get('game')?.active;
  const sample=job&&playback.sample(job),milestone=sample?.frame?.dividendMilestone;
  if(!milestone)return '';
  const moving=!job.static;
  const elapsed=moving ? (sample.frame.ms-sample.remaining*job.speed)/1000 : 0;
  return `<section class="dividend-milestone ${moving?'is-raining':'is-still'}" role="status" aria-label="Dividend milestone">
    ${moving?`<div class="dividend-rain" aria-hidden="true">${Array.from({length:24},(_,i)=>`<span style="--rain-x:${(i*37)%100}%;--rain-delay:${((i%6)*.08-elapsed).toFixed(3)}s;--rain-tilt:${(i%2?1:-1)*(12+i%5*7)}deg">¥</span>`).join('')}</div>`:''}
    <div class="dividend-milestone-card"><small>${esc(milestone.corporation)} · DIVIDEND MILESTONE</small><strong>¥${Number(milestone.amount).toLocaleString('en-US')} paid</strong><span>First ${milestone.thresholds.map(value=>`¥${value}`).join(' / ')} dividend</span></div>
  </section>`;
}
