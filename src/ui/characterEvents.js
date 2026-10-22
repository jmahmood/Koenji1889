import {SEQUENCE_RECIPES} from './characterPlayback.js';
import {CORP_META} from '../constants1889.js';
import {moneyCeremony} from './kemonito.js';
import {setbackCameo} from './kemalito.js';
import {victoryCelebration} from './victoryCelebration.js';
import {dividendMilestone} from './dividendMilestones.js';

export const memberKey=(view,pid)=>view?.members?.[pid]?.member_id || pid;
const cash=n=>Number.isFinite(n)?`¥${n.toLocaleString('en-US')}`:'';
const prop=(kind,label='',sublabel='',extra={})=>({kind,label:String(label),sublabel:String(sublabel),...extra});

// Workbench examples deliberately contain mock labels. Production binds only
// accepted facts and explicitly empties every unbound prop slot.
export function bindCharacterRecipe(key,memberId,{label='',detail='',props={},primary=null}={}) {
  const recipe=SEQUENCE_RECIPES[key];
  if(!recipe || !memberId) return null;
  const bind=frame=>({pose:frame.pose,expression:frame.expr,
    props:frame.prop ? (props[frame.prop.kind] || {empty:true})
      : ['certificate','token','offer','receive','place','count'].includes(frame.pose) ? (primary || {empty:true}) : null});
  return {recipeKey:key,label:label || recipe.title,detail,
    frames:recipe.frames.map(frame=>({ms:frame.ms || 550,actors:{[memberId]:bind(frame)}})),
    staticFallback:{actors:{[memberId]:bind(recipe.staticFallback)}}};
}

export function buildEventSequence(ev,view,{revision=view?.state?.revision,celebrate=true}={}) {
  if(!ev) return null;
  // The final result gets its own ceremony immediately. No last-move teasing or
  // cash backlog should precede the shared celebration; money is already settled.
  const victory=victoryCelebration(ev,view);
  if(victory)return victory;
  const actor=memberKey(view,ev.actor_id);
  const color=CORP_META[ev.corporation]?.color;
  const company=ev.corporation || '';
  let key=null, primary=null, props={};
  const awards=ev.private_awards || [];
  let recipient=actor;
  if(awards.length) {
    const award=awards[0]; recipient=memberKey(view,award.player_id);
    key='private_awarded'; primary=prop('private_cert',award.company,cash(award.price));
  } else if(ev.type==='buy_shares' || ev.animation==='certificate_purchase') {
    key='share_purchase'; primary=prop('share_cert',`${company}${Number.isFinite(ev.percent)?` · ${ev.percent}%`:''}`,
      ev.par_set?`PAR ${cash(ev.par_set)}`:ev.source || '',{color});
  } else if(['sell_shares','emergency_sell'].includes(ev.type)) {
    key=ev.type==='emergency_sell'?'emergency_funding':'share_sale';
    primary=prop('share_cert',`${company}${Number.isFinite(ev.percent)?` · ${ev.percent}%`:''}`,'BANK POOL',{color});
    props.cash_envelope=prop('cash_envelope',cash(ev.proceeds),ev.type==='emergency_sell'?'PERSONAL FUNDS':'SALE PROCEEDS');
  } else if(ev.negotiated) {
    key='negotiated_purchase'; primary=prop('private_cert',ev.company || '',company);
    props.cash_envelope=prop('cash_envelope',cash(ev.price),'SETTLEMENT');
  } else if(ev.animation==='private_acquired' && (ev.type!=='pass' || ev.awarded_player)) {
    key='private_awarded'; recipient=memberKey(view,ev.awarded_player || ev.actor_id);
    primary=prop('private_cert',ev.company || '',cash(ev.price));
  } else if(ev.type==='bid') {
    key='bid_submitted'; primary=prop('cash_envelope',cash(ev.price),ev.company || 'BID');
  } else if(ev.type==='lay_tile') {
    key='track_laid'; primary=prop('track_hex',ev.tile!=null?`#${ev.tile}`:'',ev.hex || '',
      {color:({yellow:'#d4a942',green:'#5da667',brown:'#986442',gray:'#8d9298'})[ev.tile_color] || '#b5a17b'});
  } else if(ev.type==='place_token') {
    key='station_placed'; primary=prop('station_token',company,ev.hex || '',{color});
  } else if(['run_routes','run_best_routes'].includes(ev.type)) {
    key='routes_committed';
  } else if(ev.type==='dividend') {
    key=ev.payout?'dividend_paid':'revenue_withheld';
    primary=prop('cash_envelope',cash(ev.revenue),company,{color});
  } else if(ev.type==='buy_train') {
    key=ev.seller && ev.seller!=='depot'?'negotiated_purchase':'train_bought'; primary=prop('train_card',ev.train_type?`${ev.train_type}-TRAIN`:ev.train || '',company,{color});
    props.cash_envelope=prop('cash_envelope',cash(ev.price),'TRAIN PAYMENT');
    if(key==='negotiated_purchase') props.private_cert=primary;
  } else if(ev.type==='exchange_private') {
    key='private_exchange_dr'; primary=prop('share_cert',`${company}${Number.isFinite(ev.percent)?` · ${ev.percent}%`:''}`,'PRIVATE EXCHANGE',{color});
    props.private_cert=prop('private_cert',ev.company || '','EXCHANGED');
  } else if(ev.type==='offer') {
    key='bid_submitted'; primary=prop('cash_envelope',cash(ev.price),ev.item || 'OFFER');
  } else if(['accept_offer','accept_train_offer','accept_private_offer'].includes(ev.type)) {
    key='negotiated_purchase'; primary=ev.train?prop('train_card',ev.train_type || ev.train,company)
      : prop('private_cert',ev.company || '',company);
    props.cash_envelope=prop('cash_envelope',cash(ev.price),'SETTLEMENT');
  } else if(ev.type==='bankrupt') {
    key='bankruptcy';
  } else if(ev.type==='discard_train') {
    key='train_bought'; primary=prop('train_card',ev.train_type || ev.train || '','RETURNED',{overlay:'returned'});
  }
  if(primary) props[primary.kind]=primary;
  let sequence=bindCharacterRecipe(key,recipient,{label:ev.label,detail:ev.detail,primary,props});
  const append=(next)=>{
    if(!next) return;
    if(!sequence) sequence=next;
    else {sequence.frames.push(...next.frames);sequence.staticFallback=next.staticFallback;}
  };
  for(const award of awards.slice(1)) {
    const card=prop('private_cert',award.company,cash(award.price));
    append(bindCharacterRecipe('private_awarded',memberKey(view,award.player_id),
      {label:ev.label,detail:ev.detail,primary:card,props:{private_cert:card}}));
  }
  if(ev.floated) {
    const funding=prop('cash_envelope',cash(ev.float_funding),`${company} TREASURY`,{color});
    append(bindCharacterRecipe('corporation_floats',actor,{label:ev.label,primary:funding,props:{cash_envelope:funding}}));
  }
  for(const change of ev.presidency_changes || []) {
    const card=prop('share_cert',change.corporation,'PRESIDENT',{color:CORP_META[change.corporation]?.color});
    const actors={};
    if(change.from) actors[memberKey(view,change.from)]={pose:'offer',expression:'neutral',props:card};
    if(change.to) actors[memberKey(view,change.to)]={pose:'receive',expression:'smile',props:card};
    if(Object.keys(actors).length) append({label:ev.label,frames:[{ms:750,actors}],staticFallback:{actors}});
  }
  if(ev.phase_before!=null && ev.phase_after!=null && ev.phase_before!==ev.phase_after && actor) {
    const card=prop('phase_card',`PHASE ${ev.phase_after}`);
    const actors={[actor]:{pose:'certificate',expression:'declare',props:card}};
    append({label:ev.label,frames:[{ms:700,actors}],staticFallback:{actors}});
  }
  for(const train of ev.rusted_trains || []) {
    const person=memberKey(view,train.president); if(!person) continue;
    const card=prop('train_card',train.type?`${train.type}-TRAIN`:train.train,train.corporation || '',{overlay:'rusted'});
    const actors={[person]:{pose:'certificate',expression:'concerned',props:card}};
    append({label:ev.label,frames:[{ms:700,actors}],staticFallback:{actors}});
  }
  for(const pid of ev.outbid_players || []) {
    append(bindCharacterRecipe('outbid_reaction',memberKey(view,pid),{label:ev.label}));
  }
  if(ev.bank_end_pending && actor) {
    const card=prop('bank_end_pending','','FINISH OPERATING SET');
    append(bindCharacterRecipe('bank_exhaustion',actor,{label:ev.label,props:{bank_end_pending:card}}));
  }
  if(ev.finished) {
    const winners=ev.winners || [];
    for(const pid of winners) append(bindCharacterRecipe('final_results',memberKey(view,pid),{label:ev.label}));
  }
  if(sequence) {
    sequence.label=ev.label || sequence.label;sequence.detail=ev.detail || '';
    // Keep a burst responsive even when a single transition has many effects.
    if(sequence.frames.length>12) sequence.frames=sequence.frames.slice(0,5).concat(sequence.frames.slice(-7));
  }
  const setback=setbackCameo(ev,view);
  if(setback)append({label:ev.label,detail:ev.detail,...setback});
  const ceremony=moneyCeremony(ev.cash_receipts,view);
  if(ceremony) {
    const milestone=celebrate ? dividendMilestone(ev,view,revision) : null;
    if(milestone)append({frames:[{ms:1800,dividendMilestone:milestone,actors:{}}]});
    append({label:ev.label,detail:ev.detail,frames:ceremony.frames,staticFallback:{actors:{},receipts:ceremony.receipts,dividendMilestone:milestone}});
  }
  return sequence;
}
