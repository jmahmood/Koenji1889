import {escapeHtml as esc} from './presentation.js';

export const KEMALITO_SPRITES='/assets/kemalito/giggle-poses.webp';

// Use the recorded victim, not the actor who bought the rust-triggering train.
// Ordinary spending, voluntary sales and market fluctuations are not setbacks.
export function setbackCameo(event,view) {
  if(!event)return null;
  const setbacks=[];
  const add=(pid,reason)=>{
    if(pid&&view?.state?.players?.[pid])setbacks.push({player:pid,reason});
  };
  for(const train of event.rusted_trains || [])add(train.president,`${train.corporation || 'Company'}: ${train.type || ''}-Train rusted`);
  for(const change of event.presidency_changes || [])if(change.from!==change.to)add(change.from,`${change.corporation}: presidency changed`);
  for(const pid of event.outbid_players || [])add(pid,'Outbid at auction');
  if(event.type==='bankrupt')add(event.actor_id,'Bankruptcy');
  if(event.type==='emergency_sell')add(event.actor_id,'Emergency share sale');
  if(!setbacks.length)return null;
  const targets=[...new Set(setbacks.map(s=>s.player))];
  const reasons=[...new Set(setbacks.map(s=>s.reason))];
  const frames=[0,1,2,3,4,5,3,6,7].map((pose,index)=>({
    ms:[240,280,300,300,320,320,260,280,340][index],
    kemalito:{pose,targets,reasons,giggle:index===3},actors:{},
  }));
  return {frames,staticFallback:{actors:{},setback:{targets,reasons}}};
}

export function renderKemalito(view,playback,{atTable=false}={}) {
  const job=playback.lanes.get('game')?.active;
  if(!job)return '';
  const frame=playback.sample(job)?.frame;
  const cameo=frame?.kemalito || (job.static?frame?.setback:null);
  if(!cameo)return '';
  const targets=cameo.targets || [],order=view?.state?.player_order || [];
  const seat=order.indexOf(targets[0]);
  const center=seat<0?50:5+(seat+.5)*90/Math.max(1,order.length);
  const left=Math.max(0,Math.min(76,center-13));
  const names=targets.map(pid=>view?.state?.players?.[pid]?.name || pid).join(', ');
  const moving=!job.static&&Number.isInteger(cameo.pose);
  return `<div class="kemalito-cameo ${atTable?'at-table':'off-table'} ${moving?'is-animated':'is-summary'}" style="--kemalito-left:${left}%" data-kemalito-target="${esc(targets[0] || '')}" data-kemalito-pose="${moving?cameo.pose:'still'}">
    ${moving?`<div class="kemalito-sprite" role="img" aria-label="Kemalito ${cameo.pose>=3&&cameo.pose<=5?'giggles':cameo.pose===7?'waves goodbye':'grins'} beside ${esc(names)}" style="background-position:${cameo.pose%4*100/3}% ${Math.floor(cameo.pose/4)*100}%"></div>`:''}
    <div class="kemalito-caption"><small>${moving?'Kemalito':'Setback'}</small><span data-no-translate>${esc(names)}</span><span>${esc(cameo.reasons.join(' · '))}</span></div>
  </div>`;
}

// Sound is part of the held laugh pose, not polling or rendering. The caller
// supplies the existing mute-aware effects player; history is always silent.
export class KemalitoGiggle {
  constructor(effects){this.effects=effects;this.identity=null;this.voice=null;}
  sync(playback,{room='',hidden=false}={}) {
    const job=playback.lanes.get('game')?.active;
    const sampled=job&&playback.sample(job);
    if(hidden||!playback.motion||!job||job.static||job.id.startsWith('history:')){this.stop();return;}
    if(!sampled?.frame?.kemalito){this.stop();return;}
    if(this.identity&&!this.identity.startsWith(`${room}:${job.id}:`))this.stop();
    if(!sampled.frame.kemalito.giggle)return;
    const id=`${room}:${job.id}:kemalito-giggle`;
    if(id===this.identity)return;
    this.stop();this.identity=id;this.voice=this.effects.play('giggle',id);
  }
  stop(){this.voice?.stop?.();this.voice=null;this.identity=null;}
}
