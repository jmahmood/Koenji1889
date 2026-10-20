// Presentation only: held frames never write to the game or its journal.
export class CharacterPlayback {
  constructor({now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),onChange=()=>{},maxQueued=3}={}) {
    Object.assign(this,{now,schedule,cancel,onChange,maxQueued});
    this.lanes=new Map(); this.seen=new Set(); this.motion=true; this.room=null;
  }
  setRoom(room) {
    if(this.room===room) return;
    this.clear(); this.seen.clear(); this.room=room;
  }
  remember(id) {
    if(this.seen.has(id)) return false;
    this.seen.add(id);
    if(this.seen.size>600) this.seen.delete(this.seen.values().next().value);
    return true;
  }
  enqueue(sequence,{id,lane='game',speed=1,hold=false}={}) {
    if(!sequence?.frames?.length || !id || !this.remember(`${this.room}:${id}`)) return false;
    const job={...sequence,id,speed:Math.max(.1,Number(speed)||1)};
    let entry=this.lanes.get(lane);
    if(!entry) {entry={active:null,queue:[],timer:null};this.lanes.set(lane,entry);}
    if(!this.motion || hold) {
      this.cancel(entry.timer); entry.timer=null; entry.queue=[]; entry.active={...job,static:true};
      this.onChange(); return true;
    }
    if(entry.active) {
      entry.queue.push(job);
      if(entry.queue.length>this.maxQueued) entry.queue.shift();
    } else this.start(lane,job);
    return true;
  }
  start(lane,job) {
    const entry=this.lanes.get(lane);
    entry.active={...job,startedAt:this.now()}; this.tick(lane);
  }
  sample(job) {
    if(job.static) return {frame:job.staticFallback || job.frames.at(-1),index:-1};
    let elapsed=Math.max(0,(this.now()-job.startedAt)*job.speed);
    for(let i=0;i<job.frames.length;i++) {
      const ms=Math.max(1,job.frames[i].ms || 550);
      if(elapsed<ms) return {frame:job.frames[i],index:i,remaining:(ms-elapsed)/job.speed};
      elapsed-=ms;
    }
    return null;
  }
  tick(lane) {
    const entry=this.lanes.get(lane); if(!entry?.active) return;
    this.cancel(entry.timer); entry.timer=null;
    const sampled=this.sample(entry.active);
    if(!sampled) {
      entry.active=null;
      if(entry.queue.length) {this.start(lane,entry.queue.shift());return;}
    } else if(!entry.active.static) {
      entry.timer=this.schedule(()=>this.tick(lane),Math.max(1,Math.ceil(sampled.remaining)));
    }
    this.onChange();
  }
  poseFor(memberId) {
    for(const lane of ['arrival','game','social']) {
      const job=this.lanes.get(lane)?.active;
      if(!job) continue;
      const sampled=this.sample(job);
      const pose=sampled?.frame?.actors?.[memberId];
      if(pose) return {...pose,key:`${job.id}:${sampled.index}`};
    }
    return null;
  }
  notice() {
    const job=this.lanes.get('game')?.active || this.lanes.get('social')?.active;
    return job && {id:job.id,label:job.label,detail:job.detail};
  }
  clear(lane=null) {
    for(const [name,entry] of this.lanes) {
      if(lane && name!==lane) continue;
      this.cancel(entry.timer); this.lanes.delete(name);
    }
    this.onChange();
  }
  setMotionEnabled(enabled) {
    enabled=Boolean(enabled); if(enabled===this.motion) return;
    this.motion=enabled;
    for(const entry of this.lanes.values()) {
      this.cancel(entry.timer);entry.timer=null;entry.queue=[];
      if(entry.active) entry.active=enabled ? null : {...entry.active,static:true};
    }
    this.onChange();
  }
}
