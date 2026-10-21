import {makeRouteTimeline,sampleRouteTimeline,recordedRouteRun} from './routePlayback.js';

export const actionCue=event=>{
  if(event.rusted_trains?.length||event.bank_end_pending||event.type==='bankrupt')return 'warning';
  if(event.flotations?.length||event.floated)return 'float';
  if(['run_routes','run_best_routes'].includes(event.type))return null;
  if(event.type==='dividend')return event.revenue>0?(event.payout?'cash':'safe'):'ledger';
  return ({lay_tile:'track',place_token:'station',buy_train:event.train_type==='D'?'delivery':'train',buy_shares:'paper',sell_shares:'cash',emergency_sell:'cash',bid:'paper',buy_private:'paper',offer:'paper',discard_train:'ledger',exchange_private:'paper'})[event.type]||null;
};

// All clocks and side effects are injected. This class never writes game state.
export class ActionPresentation {
  constructor({now=()=>performance.now(),request=fn=>requestAnimationFrame(fn),cancel=id=>cancelAnimationFrame(id),effects,onChange=()=>{}}={}) {
    Object.assign(this,{now,request,cancel,effects,onChange});this.seen=new Set();this.room=null;this.serial=0;this.frame=null;this.job=null;this.feedback=null;this.motion=true;this.mapVisible=false;this.speed='normal';
  }
  stopSounds(){for(const voice of this.voices||[])voice?.stop?.();this.voices=[];}
  unschedule(){if(this.frame!==null)this.cancel(this.frame);this.frame=null;}
  clear(){this.unschedule();this.stopSounds();this.actionVoice?.stop?.();this.actionVoice=null;this.job=null;this.feedback=null;}
  setRoom(room){if(room===this.room)return;this.clear();this.room=room;this.seen.clear();}
  sync({room,view,live=true,mapVisible=false,motion=true,speed='normal'}) {
    this.setRoom(room);this.motion=motion;this.mapVisible=mapVisible;this.speed=speed;
    const state=view?.state;
    if(!state){this.clear();return;}
    if(this.job && (this.job.corporation!==state.current_corporation || state.operating_turn?.routes==null || this.job.historical===live)){this.settle(false);this.job=null;}
    if(this.job && this.job.revision!==state.revision) {
      this.settle(false);
      // Rebind only the static accepted claim. A later board/phase cannot be
      // used for an old animated journey or stale per-train earnings.
      this.job=null;
    }
    if(!this.job) {
      const run=recordedRouteRun(view);
      if(run)this.setRun(run,view,{animate:false,historical:!live,identity:`static:${room}:${state.revision}`});
    }
    if(this.job&&(!motion||!mapVisible||speed==='instant'))this.settle(false);
    if(this.feedback?.revision!==state.revision)this.feedback=null;
    if(!mapVisible)this.stopSounds();
  }
  setRun(run,view,{animate=false,historical=false,identity,durationMs=null}={}) {
    this.unschedule();this.stopSounds();
    const timeline=makeRouteTimeline(run,view.state.board,{speed:this.speed,durationMs});
    const canAnimate=animate&&this.motion&&this.mapVisible&&timeline.duration>0&&timeline.routes.length>0&&timeline.routes.every(r=>r.geometry);
    this.job={timeline,corporation:run.corporation,revision:view.state.revision,identity,historical,startedAt:this.now(),settled:!canAnimate,cues:new Set(),view};
    if(canAnimate){this.tick();}else this.onChange();
  }
  receive(event,revision,view,{animate=true}={}) {
    const identity=`${this.room}:${revision}`;
    if(!event||this.seen.has(identity))return false;
    this.seen.add(identity);if(this.seen.size>600)this.seen.delete(this.seen.values().next().value);
    this.settle(false);this.stopSounds();this.actionVoice?.stop?.();this.actionVoice=null;
    this.feedback={event,revision,identity,startedAt:this.now(),animated:animate&&this.motion};
    const run=['run_routes','run_best_routes'].includes(event.type)?(event.route_run||recordedRouteRun(view,event)):null;
    if(run && revision===view?.state?.revision) {
      this.setRun(run,view,{animate,historical:false,identity});
      if(animate&&this.job.settled)this.actionVoice=this.effects?.play('ledger',identity);
    } else if(animate) {
      const kind=actionCue(event);if(kind)this.actionVoice=this.effects?.play(kind,identity);
    }
    this.onChange();return true;
  }
  sample(){return this.job?sampleRouteTimeline(this.job.timeline,this.now()-this.job.startedAt,this.job.settled):null;}
  settle(notify=true){
    this.unschedule();this.stopSounds();if(this.job){if(notify&&!this.job.settled)this.job.completedAt=this.now();this.job.settled=true;}
    if(notify)this.onChange();
  }
  tick(){
    this.frame=null;const job=this.job;if(!job||job.settled)return;
    const state=this.sample();
    const cue=(key,kind)=>{if(job.cues.has(key))return;job.cues.add(key);if(!job.silent){const voice=this.effects?.play(kind,`${job.identity}:${key}`);this.voices.push(voice);if(kind==='wheels')this.wheels=voice;}};
    this.voices ||= [];
    if(state.routes.some(r=>r.departed)) {
      cue('depart',job.timeline.routes.every(r=>r.train_type==='D')?'delivery':'departure');
      cue('wheels','wheels');
    }
    for(const route of state.routes)if(route.done)cue(`train:${route.train}`,'ledger');
    if(state.done){cue('total','ledger');job.settled=true;job.completedAt=this.now();this.wheels?.stop?.();this.wheels=null;}
    this.onChange();
    if(!job.settled)this.frame=this.request(()=>this.tick());
  }
  replay({silent=false,durationMs=null}={}) {
    const old=this.job;if(!old)return;
    this.setRun(old.timeline.run,old.view,{animate:true,historical:old.historical,identity:`replay:${this.room}:${++this.serial}`,durationMs});
    if(this.job)this.job.silent=silent;
  }
  history(event,revision,view,{animate=false,durationMs=null,historical=true}={}) {
    this.clear();const run=recordedRouteRun(view,event);if(!run)return;
    this.setRun(run,view,{animate:false,historical,identity:`history:${revision}`});
    if(animate)this.replay({silent:true,durationMs});
  }
  hidden(){this.settle();this.feedback=null;this.effects?.stopAll?.();}
}
