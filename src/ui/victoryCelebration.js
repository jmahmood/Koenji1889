import {escapeHtml as esc} from './presentation.js';

export const VICTORY_FRAMES=Array.from({length:6},(_,pose)=>`/assets/club-mascots/victory-frames/pose-${pose}.webp`);
// Keep each pose isolated: the original atlas high-five crossed a cell boundary.
// Preload once so switching individual images does not flash between held poses.
const preloadedFrames=typeof Image==='undefined'?[]:VICTORY_FRAMES.map(src=>{const image=new Image();image.src=src;return image;});

export function victoryCelebration(event,view) {
  if(!event?.finished)return null;
  const winners=[...new Set(event.winners || [])].filter(pid=>view?.state?.players?.[pid]);
  if(!winners.length)return null;
  const actors=Object.fromEntries(winners.map(pid=>[view.members?.[pid]?.member_id || pid,
    {pose:'triumphant',expression:'laugh',props:{empty:true}}]));
  const frames=[0,1,2,3,4,1,2,5].map((pose,i)=>({ms:[500,450,600,650,450,450,600,650][i],victory:{pose,winners},actors}));
  return {label:event.label || 'Final results confirmed',detail:'Kemonito and Kemalito celebrate the winners',
    frames,staticFallback:{victory:{pose:3,winners},actors}};
}

export function renderVictoryCelebration(view,playback,{atTable=false}={}) {
  const job=playback.lanes.get('game')?.active;
  const victory=job&&playback.sample(job)?.frame?.victory;
  if(!victory)return '';
  const names=victory.winners.map(pid=>view?.state?.players?.[pid]?.name || pid).join(' & ');
  const mine=victory.winners.includes(view?.viewer?.player_id);
  const heading=mine?(victory.winners.length>1?'You share the win!':'You win!'):
    `${names} ${victory.winners.length>1?'share the win!':'wins!'}`;
  const pose=victory.pose;
  return `<div class="mascot-victory ${atTable?'at-table':'off-table'} ${job.static?'is-still':'is-animated'}" data-victory-pose="${pose}" data-victory-winners="${esc(victory.winners.join(','))}">
    <img class="mascot-victory-sprites" src="${VICTORY_FRAMES[pose]}" width="512" height="512" draggable="false" alt="Kemonito and Kemalito ${pose===3?'high-five':pose===2?'cheer with their arms raised':pose===5?'wave':'clap and smile'} to celebrate ${esc(names)}">
    <div class="mascot-victory-caption"><small>Kemonito &amp; Kemalito</small><strong data-no-translate>${esc(heading)}</strong>${mine?`<span data-no-translate>${esc(names)}</span>`:''}<span>Congratulations from the club!</span></div>
  </div>`;
}
