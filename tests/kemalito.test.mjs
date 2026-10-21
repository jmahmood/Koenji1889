import test from 'node:test';
import assert from 'node:assert/strict';
import {setbackCameo,renderKemalito,KemalitoGiggle} from '../src/ui/kemalito.js';
import {buildEventSequence} from '../src/ui/characterEvents.js';
import {CharacterPlayback} from '../src/ui/characterController.js';
import {effectSamples} from '../src/ui/effectSounds.js';

const view={state:{player_order:['p1','p2'],players:{p1:{name:'Buyer'},p2:{name:'Owner <B>'}},corporations:{}},members:{p1:{member_id:'a'},p2:{member_id:'b'}}};
const rust={type:'buy_train',actor_id:'p1',train_type:'4',rusted_trains:[{corporation:'IR',type:'2',president:'p2'}]};
test('rust reaction targets the previous train owner, not the train buyer; compound setbacks share one cameo',()=>{
 const before=structuredClone(view);
 const c=setbackCameo({...rust,rusted_trains:[...rust.rusted_trains,...rust.rusted_trains],outbid_players:['p2'],presidency_changes:[{corporation:'IR',from:'p2',to:'p1'}]},view);
 assert.deepEqual(c.frames[0].kemalito.targets,['p2']);
 assert.equal(c.frames.length,9);assert.equal(c.frames.filter(f=>f.kemalito.giggle).length,1);
 assert.equal(c.frames.reduce((n,f)=>n+f.ms,0),2640);
 assert.equal(c.frames[0].kemalito.reasons.length,3);
 assert.deepEqual(view,before);
});
test('only explicit setbacks trigger Kemalito; ordinary sales, dividends and unknown identities do not',()=>{
 for(const type of ['sell_shares','buy_train','buy_shares','dividend','pass','run_routes'])assert.equal(setbackCameo({type,actor_id:'p1'},view),null);
 assert.equal(setbackCameo({outbid_players:['missing']},view),null);
 for(const event of [{outbid_players:['p2']},{presidency_changes:[{from:'p2',to:'p1',corporation:'IR'}]},{type:'bankrupt',actor_id:'p2'},{type:'emergency_sell',actor_id:'p2'}])assert.deepEqual(setbackCameo(event,view).frames[0].kemalito.targets,['p2']);
});
test('Kemonito money and Kemalito setbacks remain separate; static history never giggles',()=>{
 const sequence=buildEventSequence({...rust,cash_receipts:[{recipient:'p1',destination:'purse',amount:30}]},view);
 assert.ok(sequence.frames.some(f=>f.kemonito));assert.ok(sequence.frames.some(f=>f.kemalito));
 assert.ok(sequence.frames.every(f=>!(f.kemonito&&f.kemalito)));
 const playback=new CharacterPlayback({now:()=>0,schedule:()=>1,cancel:()=>{}});
 playback.setMotionEnabled(false);playback.enqueue(buildEventSequence(rust,view),{id:'history:1',hold:true});
 const html=renderKemalito(view,playback,{atTable:true});assert.match(html,/is-summary/);assert.match(html,/Owner &lt;B&gt;/);assert.doesNotMatch(html,/class="kemalito-sprite"/);
});
test('mascot placement is clamped at both edges and escapes participant names',()=>{
 const frame=setbackCameo(rust,view).frames[3];
 const html=renderKemalito(view,{lanes:new Map([['game',{active:{}}]]),sample:()=>({frame})},{atTable:true});
 assert.match(html,/data-kemalito-target="p2"/);assert.match(html,/giggles beside Owner &lt;B&gt;/);assert.match(html,/--kemalito-left:59.5%/);
});
test('giggle synchronizes once to the laugh pose and stops on skip, motion-off, hiding or history',()=>{
 const calls=[],stops=[];const sound=new KemalitoGiggle({play:(kind,id)=>{calls.push({kind,id});return{stop:()=>stops.push(id)};}});
 const frames=setbackCameo(rust,view).frames;let frame=frames[0];let job={id:'revision:8'};
 const playback={motion:true,lanes:new Map([['game',{active:job}]]),sample:()=>({frame})};
 sound.sync(playback,{room:'one'});assert.equal(calls.length,0);
 frame=frames[3];sound.sync(playback,{room:'one'});sound.sync(playback,{room:'one'});assert.equal(calls.length,1);assert.equal(calls[0].kind,'giggle');
 frame=frames[4];sound.sync(playback,{room:'one'});assert.equal(stops.length,0);
 playback.motion=false;sound.sync(playback,{room:'one'});assert.equal(stops.length,1);
 playback.motion=true;job.id='history:1';sound.sync(playback,{room:'one'});assert.equal(calls.length,1);
 job.id='revision:9';frame=frames[3];sound.sync(playback,{room:'one'});assert.equal(calls.length,2);
 sound.sync(playback,{room:'one',hidden:true});assert.equal(stops.length,2);
 job.id='revision:10';sound.sync(playback,{room:'one'});playback.lanes.clear();sound.sync(playback,{room:'one'});assert.equal(stops.length,3);
});
test('procedural giggle has three audible bursts, finite samples and silent boundaries',()=>{
 const pcm=effectSamples('giggle');assert.equal(pcm.length,Math.ceil(.78*22050));
 assert.ok(pcm.every(n=>Number.isFinite(n)&&Math.abs(n)<=.95));assert.equal(Math.abs(pcm[0]),0);assert.equal(Math.abs(pcm.at(-1)),0);
 for(const start of [0,.23,.46])assert.ok(pcm.slice(Math.floor((start+.02)*22050),Math.floor((start+.14)*22050)).some(n=>Math.abs(n)>.05));
 assert.ok(pcm.slice(Math.floor(.17*22050),Math.floor(.22*22050)).every(n=>n===0));
});
