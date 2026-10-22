import {CharacterPlayback} from './characterController.js';
import {bindCharacterRecipe, buildEventSequence, memberKey} from './characterEvents.js';

// Coordinates authoritative game events and independent gathering activity.
export class CharacterDirector {
  constructor(options={}) {
    this.playback=new CharacterPlayback(options);
    this.room=null; this.clubReady=false; this.socialSeen=new Set(); this.historySerial=0;
  }
  setRoom(room) {
    if(this.room===room) return;
    this.room=room; this.playback.setRoom(room); this.clubReady=false; this.socialSeen.clear();
  }
  accepted(event,revision,view) {
    // A duplicate response/poll must not clear a celebration already in progress.
    if(event?.finished&&!this.playback.seen.has(`${this.room}:revision:${revision}`))this.playback.clear('game');
    return this.playback.enqueue(buildEventSequence(event,view,{revision}),{id:`revision:${revision}`});
  }
  history(event,revision,view,{animate=false,speed=1,durationMs=null}={}) {
    this.playback.clear('game');
    const sequence=buildEventSequence(event,view,{revision,celebrate:false});
    if(durationMs && sequence) speed=sequence.frames.reduce((n,f)=>n+f.ms,0)/durationMs;
    this.playback.enqueue(sequence,{
      id:`history:${++this.historySerial}:${revision}`,hold:!animate,speed,
    });
  }
  arrival(event) {
    this.playback.clear('arrival');
    if(event?.kind!=='arrived') return;
    const key=({kitchen:'yumiko_kitchen',bedroom:'owner_bedroom'})[event.arrival_route] || 'guest_arrival';
    this.playback.enqueue(bindCharacterRecipe(key,event.member_id),{id:`arrival:${event.id}`,lane:'arrival'});
  }
  club(view) {
    const entries=[
      ...Object.entries(view?.club?.stamps || {}).map(([pid,stamp])=>({
        id:`stamp:${memberKey(view,pid)}:${stamp.recorded_at}`,props:{hanko_stamp:{kind:'hanko_stamp',label:stamp.seal || '高円寺'}},pid,key:'membership_stamp',label:'Membership card stamped',
      })),
      ...(view?.club?.notes || []).map(note=>({
        id:`note:${note.id}`,pid:note.actor_id,key:'tea_toast',label:`${note.author} left a table note`,
      })),
    ];
    for(const entry of entries) {
      if(this.clubReady && !this.socialSeen.has(entry.id) && entry.pid) {
        this.playback.enqueue(bindCharacterRecipe(entry.key,memberKey(view,entry.pid),{label:entry.label,props:entry.props}),
          {id:entry.id,lane:'social'});
      }
      this.socialSeen.add(entry.id);
    }
    while(this.socialSeen.size>200) this.socialSeen.delete(this.socialSeen.values().next().value);
    this.clubReady=true;
  }
  host(view) {
    this.playback.enqueue(bindCharacterRecipe('host_opens_game',view.host?.member_id,
      {label:'The host opens the Shikoku ledger'}),{id:'host:opens',lane:'social'});
  }
}
