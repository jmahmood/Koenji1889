import {EventEmitter} from 'node:events';
import {emitKeypressEvents} from 'node:readline';
import {performance} from 'node:perf_hooks';

// One keyboard listener for the whole run; pausing never starts another prompt.
export class PlaybackControls extends EventEmitter {
  constructor({input=process.stdin, paused=false, onChange=()=>{}, onQuit=()=>{}, onRestart=()=>{}}={}) {
    super();
    Object.assign(this,{input,paused,onChange,onQuit,onRestart,credits:0,finished:false,closed:false});
    this.keypress=(_text,key={})=>{
      if (key.name==='q' || (key.ctrl && key.name==='c')) return this.onQuit(key.ctrl ? 130 : 0);
      if (key.name==='r') return this.onRestart();
      if (this.finished) {
        if (key.name==='return' || key.name==='enter') this.emit('finish');
        return;
      }
      if (key.name==='p' || key.name==='space') {
        this.paused=!this.paused;this.credits=0;this.changed();
      } else if (key.name==='n' || key.name==='return' || key.name==='enter') {
        this.paused=true;this.credits++;this.changed();
      }
    };
    if (input?.isTTY) {
      this.attached=true;this.wasRaw=!!input.isRaw;this.wasFlowing=input.readableFlowing===true;
      emitKeypressEvents(input);
      input.setRawMode(true);input.resume();input.on('keypress',this.keypress);
    }
  }
  changed() {this.emit('change');this.onChange(this);}
  async untilActive() {
    while (!this.closed && this.paused && !this.credits) await this.changeOrDelay();
    if (this.closed) throw new Error('Playback stopped');
  }
  changeOrDelay(ms) {
    return new Promise(resolve=>{
      let timer;
      const done=()=>{clearTimeout(timer);this.off('change',done);resolve();};
      this.once('change',done);
      if (ms!==undefined) timer=setTimeout(done,ms);
    });
  }
  async beforeClick(ms) {
    let remaining=ms;
    for (;;) {
      await this.untilActive();
      if (this.paused && this.credits) {this.credits--;return;}
      if (remaining<=0) return;
      const started=performance.now();
      await this.changeOrDelay(remaining);
      remaining=Math.max(0,remaining-(performance.now()-started));
    }
  }
  waitForFinish() {
    if (this.closed) return Promise.resolve();
    this.finished=true;
    return new Promise(resolve=>this.once('finish',resolve));
  }
  close() {
    if (this.closed) return;
    this.closed=true;this.emit('change');this.emit('finish');
    if (this.attached) {
      this.input.off('keypress',this.keypress);
      this.input.setRawMode(this.wasRaw);
      if (!this.wasFlowing) this.input.pause();
    }
  }
}
