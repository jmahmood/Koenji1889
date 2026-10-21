// Buffered stems share the Web Audio clock: loops and fades keep working when
// animation frames are throttled. Saved preference is separate from playback.
const STEM_FILES = [
  './music/1_Across_the_Shoji_Screens.mp3', './music/2_Through_the_Paper_Screen.mp3',
  './music/3_Silk_and_Soroban.mp3', './music/4_The_Ledger_on_the_Line.mp3',
];
const PRESETS = {
  lounge:[1,0,0,0], auction:[.3,0,.85,0], stock:[.22,0,.95,0],
  operations:[.28,.95,0,0], crisis:[.15,.2,.15,1], finished:[.35,.5,.7,0],
};
const preference = (key, fallback) => globalThis.localStorage?.getItem(key) ?? fallback;
const save = (key, value) => globalThis.localStorage?.setItem(key, String(value));
// Crossfade the tail into the loop's head, then continue after the head. This
// removes a waveform discontinuity without relying on a foreground JS timer.
export function makeSeamlessLoop(buffer, end=Math.min(58.5,buffer.duration), fade=.12){
  if(!buffer.getChannelData || !buffer.sampleRate)return buffer;
  const endFrame=Math.min(buffer.length,Math.floor(end*buffer.sampleRate));
  const frames=Math.min(Math.floor(fade*buffer.sampleRate),Math.floor(endFrame/4));
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const samples=buffer.getChannelData(channel);
    for(let i=0;i<frames;i++){
      const weight=.5-.5*Math.cos(Math.PI*i/Math.max(1,frames-1));
      const tail=endFrame-frames+i;
      samples[tail]=samples[tail]*(1-weight)+samples[i]*weight;
    }
  }
  return buffer;
}
export class GameAudioManager {
  constructor({contextFactory=()=>new (globalThis.AudioContext || globalThis.webkitAudioContext)(),fetchAudio=url=>fetch(url)}={}) {
    this.contextFactory=contextFactory;this.fetchAudio=fetchAudio;
    this.enabled=preference('koenji_1889_bgm_enabled','false')==='true';
    this.masterVolume=.2;this.currentPresetKey='lounge';this.isPlaying=false;
    this.initialized=false;this.sources=[];this.gains=[];this.buffers=null;this.pending=null;
    this.generation=0;this.status='idle';this.startRequested=false;
  }
  get status(){return this._status;}
  set status(value){this._status=value;this.onChange?.();}
  isEnabled(){return this.enabled;}
  toggle(){
    this.enabled=!this.enabled;save('koenji_1889_bgm_enabled',this.enabled);
    if(this.enabled) void this.playAll();else this.pauseAll();
    return this.enabled;
  }
  init(){
    if(!this.context){
      this.context=this.contextFactory();
      this.context.onstatechange=()=>{this.isPlaying=Boolean(this.enabled && this.sources.length && this.context.state==='running');this.status=this.isPlaying?'playing':this.enabled?'waiting':'idle';};
    }
    this.initialized=true;return this.context;
  }
  async playAll(){
    if(!this.enabled || globalThis.document?.hidden) return;
    let context;
    try {
      context=this.init();
      // Call resume directly in the gesture, even if decoding is already pending.
      const resume=context.resume();
      resume?.catch(()=>{this.status='waiting';});
    } catch {this.status='unavailable';return;}
    if(this.pending) return this.pending;
    if(this.sources.length){this.isPlaying=context.state==='running';this.status=this.isPlaying?'playing':'waiting';return;}
    const generation=this.generation;
    this.status='loading';
    this.pending=(async()=>{
      try {
        this.buffers ||= await Promise.all(STEM_FILES.map(async url=>{
          const response=await this.fetchAudio(url);
          if(!response.ok) throw new Error('Audio unavailable');
          return makeSeamlessLoop(await context.decodeAudioData(await response.arrayBuffer()));
        }));
        if(generation!==this.generation || !this.enabled || globalThis.document?.hidden)return;
        const start=context.currentTime+.06;
        const loopEnd=Math.min(58.5,...this.buffers.map(buffer=>buffer.duration));
        const targets=PRESETS[this.currentPresetKey];
        this.buffers.forEach((buffer,index)=>{
          const source=context.createBufferSource(),gain=context.createGain();
          source.buffer=buffer;source.loop=true;source.loopStart=.12;source.loopEnd=loopEnd;
          source.connect(gain);gain.connect(context.destination);
          gain.gain.setValueAtTime(0,context.currentTime);
          gain.gain.setTargetAtTime(targets[index]*this.masterVolume,start,.25);
          source.onended=()=>{source.disconnect?.();gain.disconnect?.();};
          source.start(start);this.sources.push(source);this.gains.push(gain);
        });
        this.isPlaying=context.state==='running';this.status=this.isPlaying?'playing':'waiting';
      } catch {this.status='waiting';this.isPlaying=false;}
      finally {
        this.pending=null;
        if(generation!==this.generation && this.enabled && !globalThis.document?.hidden)queueMicrotask(()=>this.playAll());
      }
    })();
    return this.pending;
  }
  pauseAll(){
    this.generation++;this.isPlaying=false;this.status='idle';
    const context=this.context;
    this.gains.forEach(gain=>{
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(0,context.currentTime,.025);
    });
    // Audio-clock stop avoids a timer-driven hard cut, including background tabs.
    this.sources.forEach(source=>{try{source.stop(context.currentTime+.15);}catch{}});
    this.sources=[];this.gains=[];
  }
  setPreset(key,duration=1.5){
    key=PRESETS[key]?key:'lounge';if(this.currentPresetKey===key)return;
    this.currentPresetKey=key;
    if(!this.context)return;
    this.gains.forEach((gain,index)=>{
      gain.gain.cancelScheduledValues(this.context.currentTime);
      gain.gain.setTargetAtTime(PRESETS[key][index]*this.masterVolume,this.context.currentTime,Math.max(.02,duration/4));
    });
  }
  updateContext(app,view){
    const state=view?.state || app?.displayedViewData?.state || app?.liveViewData?.state;
    if(state){
      const crisis=Object.keys(state.pending_discards || {}).length || view?.legal_actions?.types?.some(t=>['emergency_sell','bankrupt'].includes(t));
      this.setPreset(state.finished?'finished':crisis?'crisis':state.round==='auction'?'auction':app?.view==='map'||state.round==='operating'?'operations':app?.view==='market'||state.round==='stock'?'stock':'lounge');
    }
    if(this.enabled&&!this.startRequested){this.startRequested=true;void this.playAll();}
  }
  unlock(){if(this.enabled)void this.playAll();}
  visibilityChanged(){
    // Deliberate policy: music pauses while hidden and fades in on return.
    if(globalThis.document?.hidden)this.pauseAll();else this.unlock();
  }
}
export class GameEffects {
  constructor({contextFactory=()=>new (globalThis.AudioContext || globalThis.webkitAudioContext)()}={}) {
    this.contextFactory=contextFactory;this.enabled=preference('koenji_1889_sfx_enabled','true')==='true';
    this.volume=Number(preference('koenji_1889_sfx_volume','.15'));this.seen=new Set();
  }
  toggle(){this.enabled=!this.enabled;save('koenji_1889_sfx_enabled',this.enabled);return this.enabled;}
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));save('koenji_1889_sfx_volume',this.volume);}
  unlock(){
    if(!this.enabled)return;
    try{this.context ||= this.contextFactory();this.context.resume()?.catch(()=>{});}catch{}
  }
  play(kind,id){
    if(this.seen.has(id))return;this.seen.add(id);
    if(this.seen.size>600)this.seen.delete(this.seen.values().next().value);
    if(!this.enabled || globalThis.document?.hidden)return;
    this.unlock();const c=this.context;if(!c || c.state!=='running')return;
    const tones=({turn:[523,659],float:[392,494,587],train:[220,330],action:[440]})[kind] || [440];
    tones.forEach((frequency,index)=>{
      const osc=c.createOscillator(),gain=c.createGain(),start=c.currentTime+index*.11;
      osc.type='sine';osc.frequency.value=frequency;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(this.volume*.25,start+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,start+.15);
      osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(start+.16);
    });
  }
}
export const gameAudio=new GameAudioManager();
export const gameEffects=new GameEffects();
