import test from 'node:test';
import assert from 'node:assert/strict';
import {gatheringDraft,renderGatheringSetup,bindGatheringSetup} from '../src/components/GatheringSetup.js';
import {bindDecisionDesk} from '../src/components/DecisionDesk.js';
import {renderWaitingTable,bindWaitingTable} from '../src/components/GatheringLobby.js';

const view=()=>({room_code:'ROOM',gathering_title:'Friends',max_players:2,can_start:false,
  viewer:{player_id:'p1',player_name:'Alice',role:'player'},host:{name:'Alice',member_id:'member-a'},club:{notes:[],stamps:{}},
  seats:[{seat_index:0,player_id:'p1',member_id:'member-a',name:'Alice',claimed:true,is_host:true,online:false},
    {seat_index:1,player_id:'p2',member_id:'member-b',name:'Bob',claimed:false,online:false}]});
const api={getAppearance:()=>null,getRoomDirectory:()=>({ROOM:{creator_token:'creator-secret',own_session:{}}}),
  getHostInvitations:()=>({player_tokens:[null,'bob-private-token'],seats:view().seats,spectator_token:'observer-secret'})};
globalThis.location={origin:'http://localhost',pathname:'/'};

function listenable(extra={}) {return {...extra,listeners:{},addEventListener(event,fn){this.listeners[event]=fn;},focus(){this.focused=true;}};}
function documentFor(elements) {
  return {querySelectorAll:selector=>elements[selector] || [],querySelector:selector=>elements[selector]?.[0] || null};
}

test('changing player count and setup tabs retains hidden names without submitting those seats',()=>{
  const app={needsGathering:true,nextNames:'Alice\nBob\nCarol\nDana\nEve'};
  const two=listenable({dataset:{playerCount:'2'}}),five=listenable({dataset:{playerCount:'5'}});
  const advanced=listenable({dataset:{gatheringTab:'advanced'}});
  globalThis.document=documentFor({'[data-player-count]':[two,five],'[data-gathering-tab]':[advanced]});
  bindGatheringSetup({app,render(){}});
  two.listeners.click({currentTarget:two});
  let html=renderGatheringSetup(app,api);
  assert.equal((html.match(/data-player-name=/g)||[]).length,2);
  advanced.listeners.click({currentTarget:advanced});
  assert.equal(app.gatheringTab,'advanced');
  assert.match(renderGatheringSetup(app,api),/booking-body booking-advanced" >/);
  five.listeners.click({currentTarget:five});
  html=renderGatheringSetup(app,api);
  assert.equal((html.match(/data-player-name=/g)||[]).length,5);
  assert.match(html,/value="Eve"/);
  assert.equal(gatheringDraft(app).names[2],'Carol');
});

test('a guest sharing the host browser never receives private invitations in either setup screen',()=>{
  const guest=view();guest.viewer={role:'player',player_id:'p2',player_name:'Bob'};
  const app={roomCode:'ROOM',activeModal:'gathering',liveViewData:guest,lobbyTab:'advanced',gatheringTab:'advanced'};
  for(const html of [renderGatheringSetup(app,api),renderWaitingTable(app,guest,api)]) {
    assert.doesNotMatch(html,/bob-private-token|observer-secret|creator-secret|data-start-gathering|data-copy-invite/);
  }
  assert.match(renderWaitingTable({...app,showSharedHostControls:true},guest,api),/data-start-gathering disabled/);
});

test('a non-playing host keeps their own identity rather than the first invited player’s name',()=>{
  const app={needsGathering:true,nextNames:'Alice\nBob'};
  const draft=gatheringDraft(app);draft.playing=false;draft.hostName='Club Host';
  const html=renderGatheringSetup(app,api);
  const identity=html.slice(html.indexOf('class="booking-identity"'),html.indexOf('id="booking-heading"'));
  assert.match(identity,/<strong>Club Host<\/strong>/);
  assert.doesNotMatch(identity,/<strong>Alice<\/strong>/);
  assert.match(html,/name="player_0"[^>]*value="Alice"/);
});

test('offline claimed seats remain ready, while only the creator receives the server-gated start action',()=>{
  const v=view();v.seats[1].claimed=true;v.can_start=true;
  assert.match(renderWaitingTable({roomCode:'ROOM'},v,api),/data-start-gathering >Open/);
  assert.match(renderWaitingTable({roomCode:'ROOM'},{...v,can_start:false},api),/data-start-gathering disabled/);
  const guestApi={...api,getRoomDirectory:()=>({})};
  assert.doesNotMatch(renderWaitingTable({roomCode:'ROOM'},v,guestApi),/data-start-gathering|bob-private-token/);
});

test('the portrait shortcut follows the viewer identity after seating changes and never edits another player',()=>{
  const v=view();v.viewer={player_id:'p2',player_name:'Bob',role:'player'};v.seats[1].claimed=true;
  const html=renderWaitingTable({roomCode:'ROOM'},v,api);
  const rows=html.match(/<article class="booking-roster-row[\s\S]*?<\/article>/g);
  assert.doesNotMatch(rows[0],/data-edit-look/);
  assert.match(rows[1],/<button type="button" class="booking-portrait booking-portrait-button" data-edit-look aria-label="Change your appearance"/);
  const spectator=renderWaitingTable({roomCode:'ROOM'},{...v,viewer:{role:'spectator'}},api);
  assert.doesNotMatch(spectator,/booking-portrait-button/);
});

test('creation submits exactly the selected seats and preserves the non-playing host preferences once',async()=>{
  const submit=listenable(),app={};let submissions=0,entered;
  const oldFormData=globalThis.FormData;
  const entries=[['title','Evening game'],['player_0',' Alice '],['player_1',' Bob '],['host_name','Club Host'],['host_route','kitchen']];
  globalThis.FormData=class {get(key){return entries.find(([k])=>k===key)?.[1] ?? null;}has(key){return entries.some(([k])=>k===key);}[Symbol.iterator](){return entries[Symbol.iterator]();}};
  globalThis.document=documentFor({'[data-create-gathering]':[submit]});
  try {
    bindDecisionDesk({app,api:{async createWaitingRoom(...args){submissions++;assert.deepEqual(args,[['Alice','Bob'],'Evening game',false,'Club Host','kitchen']);return {room_code:'NEW',seat_key:'creator',token:'own-token'};}},render(){},toast(message){assert.fail(message);},async enterRoom(...args){entered=args;}});
    const event={preventDefault(){},currentTarget:{}};
    await Promise.all([submit.listeners.submit(event),submit.listeners.submit(event)]);
    assert.equal(submissions,1);assert.deepEqual(entered,['NEW','creator','own-token']);assert.equal(app.creatingGathering,false);
  } finally {globalThis.FormData=oldFormData;}
});

test('HTTP clipboard fallback remains visible after rendering and selects the private link',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
  const href='http://localhost/#room=ROOM&token=bob-private-token&role=player';
  const input={focus(){this.focused=true;},select(){this.selected=true;}};
  const button=listenable({dataset:{copyInvite:href},parentElement:{querySelector:()=>input}});
  globalThis.document=documentFor({'[data-copy-invite]':[button]});
  const app={roomCode:'ROOM'};let message;
  try {
    bindWaitingTable({app,api,render(){},refresh(){},toast(text){message=text;}});
    await button.listeners.click({currentTarget:button});
    assert.equal(app.inviteFallback,href);assert.ok(input.focused && input.selected);
    assert.match(message,/Copy the private invitation/);
    const html=renderWaitingTable(app,view(),api);
    assert.match(html,/data-invite-fallback >Copy this private invitation/);
    assert.match(html,/name="invite_1"/);
  } finally {if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator;}
});
