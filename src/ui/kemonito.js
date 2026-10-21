import {escapeHtml as esc} from './presentation.js';

export const KEMONITO_SPRITES='/assets/kemonito/purse-poses.webp';

// Only confirmed positive receipts reach this ceremony. It never writes money.
export function moneyCeremony(receipts,view) {
  const paid=(receipts || []).filter(r=>Number.isFinite(r.amount)&&r.amount>0);
  if(!paid.length)return null;
  const frames=[];
  const add=(pose,receipt,ms,actors={})=>frames.push({ms,receipt,kemonito:{pose},actors});
  add(0,paid[0],400);
  // Keep a six-player distribution short enough to remain a passing ritual.
  const beat=Math.min(450,Math.max(160,Math.floor(10000/(paid.length*5))));
  for(const receipt of paid) {
    const pid=receipt.destination==='purse'?receipt.recipient:view?.state?.corporations?.[receipt.recipient]?.president;
    const member=view?.members?.[pid]?.member_id || pid;
    const props={kind:'cash_envelope',label:`¥${receipt.amount.toLocaleString('en-US')}`,
      sublabel:receipt.destination==='treasury'?`${receipt.recipient} TREASURY`:'PERSONAL PURSE'};
    add(1,receipt,beat);add(2,receipt,beat);add(3,receipt,beat);
    add(4,receipt,beat,member?{[member]:{pose:'receive',expression:'smile',props}}:{});
    add(5,receipt,beat,member?{[member]:{pose:'count',expression:'smile',props}}:{});
  }
  add(6,paid.at(-1),400);add(7,paid.at(-1),600);
  return {frames,receipts:paid};
}

export function renderKemonitoDelivery(view,playback,{atTable=false}={}) {
  const job=playback.lanes.get('game')?.active;
  const frame=job&&playback.sample(job)?.frame;
  const receipts=frame?.receipts || (frame?.receipt?[frame.receipt]:[]);
  if(!receipts.length)return '';
  const receipt=receipts[0];
  const pid=receipt.destination==='purse'?receipt.recipient:view?.state?.corporations?.[receipt.recipient]?.president;
  const order=view?.state?.player_order || Object.keys(view?.state?.players || {});
  const seat=order.indexOf(pid);
  const center=seat<0?50:5+(seat+.5)*90/Math.max(1,order.length);
  // The right hand faces the recipient; clamp the sprite inside either edge.
  const left=Math.max(0,Math.min(74,center-15));
  const pose=frame?.kemonito?.pose;
  const moving=!job.static&&Number.isInteger(pose);
  const name=esc(receipt.name || view?.state?.players?.[pid]?.name || receipt.recipient);
  const caption=receipts.map(r=>`<span data-no-translate>${esc(r.name || r.recipient)}</span> <strong>+¥${Number(r.amount).toLocaleString('en-US')}</strong>${r.destination==='treasury'?' · Company treasury':''}`).join('<br>');
  return `<div class="kemonito-ceremony ${atTable?'at-table':'off-table'} ${moving?'is-animated':'is-summary'}" style="--kemonito-left:${left}%" data-kemonito-recipient="${esc(pid || '')}" data-kemonito-pose="${moving?pose:'still'}">
    ${moving?`<div class="kemonito-sprite" role="img" aria-label="Kemonito ${['brings her purse','opens her purse','takes out banknotes','offers the money','hands over the money','finishes the handoff','closes her purse','waves'][pose]}${pose>=3&&pose<=5?` to ${name}`:''}" style="background-position:${(pose%4)*100/3}% ${Math.floor(pose/4)*100}%"></div>`:''}
    <div class="kemonito-caption"><small>${moving?'Kemonito · Assistant Treasurer':'Money received'}</small><div>${caption}</div></div>
  </div>`;
}
