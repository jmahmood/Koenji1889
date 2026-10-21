import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyCeremony,renderKemonitoDelivery} from '../src/ui/kemonito.js';
import {buildEventSequence} from '../src/ui/characterEvents.js';
import {CharacterPlayback} from '../src/ui/characterController.js';

const view={state:{player_order:['p1','p2'],players:{p1:{name:'A',cash:90},p2:{name:'B',cash:100}},corporations:{IR:{president:'p2',cash:200}}},members:{p1:{member_id:'member:a'},p2:{member_id:'member:b'}}};
const receipts=[{recipient:'p1',name:'A <friend>',destination:'purse',amount:60},{recipient:'IR',name:'Iyo Railway',destination:'treasury',amount:30}];
const event={type:'dividend',actor_id:'p1',payout:true,revenue:120,cash_receipts:receipts};

test('money goes to the actual member or company president; ceremony visits every recipient once',()=>{
 const before=structuredClone(view),ceremony=moneyCeremony(receipts,view);
 assert.deepEqual(ceremony.frames.map(f=>f.kemonito.pose),[0,1,2,3,4,5,1,2,3,4,5,6,7]);
 const handoffs=ceremony.frames.filter(f=>f.kemonito.pose===4);
 assert.equal(handoffs[0].actors['member:a'].props.label,'¥60');
 assert.equal(handoffs[1].actors['member:b'].props.label,'¥30');
 assert.equal(handoffs[1].actors['member:b'].props.sublabel,'IR TREASURY');
 assert.deepEqual(view,before);
 assert.equal(moneyCeremony([{amount:0},{amount:-5},{amount:NaN}],view),null);
 assert.ok(moneyCeremony(Array.from({length:7},()=>receipts[0]),view).frames.reduce((n,f)=>n+f.ms,0)<=11400);
});
test('duplicate accepted event does not repeat Kemonito; dismiss and room changes cancel her',()=>{
 const playback=new CharacterPlayback({now:()=>0,schedule:()=>1,cancel:()=>{}});
 playback.setRoom('one');const sequence=buildEventSequence(event,view);
 assert.equal(playback.enqueue(sequence,{id:'revision:1'}),true);
 assert.equal(playback.enqueue(sequence,{id:'revision:1'}),false);
 playback.clear('game');assert.equal(renderKemonitoDelivery(view,playback),'');
 playback.setRoom('two');assert.equal(playback.enqueue(sequence,{id:'revision:1'}),true);
 playback.setRoom('three');assert.equal(renderKemonitoDelivery(view,playback),'');
});
test('Motion Off and held history show all real payments without an animated mascot',()=>{
 const playback=new CharacterPlayback({now:()=>0,schedule:()=>1,cancel:()=>{}});
 playback.setMotionEnabled(false);playback.enqueue(buildEventSequence(event,view),{id:'revision:1'});
 const html=renderKemonitoDelivery(view,playback,{atTable:true});
 assert.match(html,/is-summary/);assert.doesNotMatch(html,/class="kemonito-sprite"/);
 assert.match(html,/¥60/);assert.match(html,/¥30/);assert.match(html,/A &lt;friend&gt;/);
 assert.match(html,/Company treasury/);
});
test('table renderer follows the recipient seat and no-receipt share actions stay unchanged',()=>{
 const ceremony=moneyCeremony(receipts,view);
 const html=renderKemonitoDelivery(view,{lanes:new Map([['game',{active:{}}]]),sample:()=>({frame:ceremony.frames[4]})},{atTable:true});
 assert.match(html,/at-table/);assert.match(html,/data-kemonito-recipient="p1"/);assert.match(html,/data-kemonito-pose="4"/);
 assert.match(html,/Kemonito hands over the money to A &lt;friend&gt;/);
 const shares=buildEventSequence({type:'buy_shares',actor_id:'p1',corporation:'IR',percent:10},view);
 assert.equal(shares.recipeKey,'share_purchase');assert.ok(shares.frames.every(f=>!f.kemonito));
});
