import {buildEventSequence} from '../ui/characterEvents.js';

export function replayDuration(event,view,speed=0) {
  const base=[1300,550,160][speed] || 1300;
  if(speed!==0)return base;
  const sequence=buildEventSequence(event,view);
  if(!sequence?.frames.some(f=>f.kemonito||f.kemalito||f.victory))return base;
  return Math.max(base,sequence.frames.reduce((n,f)=>n+(f.ms || 550),0));
}

// A slow snapshot fetch must never overlap the next fetch or consume a mascot's
// screen time. Epochs prevent a paused/restarted request from restarting playback.
export class ReplayClock {
  // Browser timers must run with the window receiver, not this clock instance.
  constructor({step,delay,finished,schedule=(fn,ms)=>globalThis.setTimeout(fn,ms),cancel=timer=>globalThis.clearTimeout(timer)}){
    Object.assign(this,{step,delay,finished,schedule,cancel});this.epoch=0;this.timer=null;
  }
  stop(){this.epoch++;this.cancel(this.timer);this.timer=null;}
  start(prepare=()=>{}){
    this.stop();const epoch=this.epoch;
    const tick=async()=>{
      if(epoch!==this.epoch)return;
      let advanced;
      try{advanced=await this.step();}catch{if(epoch===this.epoch){this.stop();this.finished();}return;}
      if(epoch!==this.epoch)return;
      if(!advanced){this.stop();this.finished();return;}
      this.timer=this.schedule(tick,this.delay());
    };
    Promise.resolve().then(()=>epoch===this.epoch?prepare():undefined).then(()=>{if(epoch===this.epoch)this.timer=this.schedule(tick,0);})
      .catch(()=>{if(epoch===this.epoch){this.stop();this.finished();}});
  }
}
