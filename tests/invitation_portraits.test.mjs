import test from 'node:test';
import assert from 'node:assert/strict';
import {APPEARANCE_CATALOG,normalizeAppearance,renderCharacter} from '../src/scene/Character.js';
import {renderCharacterSetup} from '../src/components/CharacterSetup.js';
import {KoenjiApiClient} from '../src/api/client.js';
import {invitationUrl,renderInvitationList} from '../src/ui/invitations.js';

const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
function environment(url='http://localhost/') {
  globalThis.localStorage=memory();globalThis.sessionStorage=memory();
  let current=new URL(url);
  globalThis.window={get location(){return current;},history:{replaceState(_state,_title,value){current=new URL(value);}}};
  globalThis.location={origin:'http://localhost',pathname:'/'};
}
function client(){const api=new KoenjiApiClient();api.channel?.close();return api;}
const view=(id,face,arrived=false)=>({viewer:{role:'player',player_id:'p1'},members:{p1:{member_id:id,
  appearance:{face,clothes:'plum-kimono'},appearance_configured:true,has_arrived:arrived}}});

test('only the seventeen reference portraits can be selected or rendered by the app',()=>{
  assert.equal(APPEARANCE_CATALOG.faces.length,17);
  assert.ok(APPEARANCE_CATALOG.faces.every(f=>f.headAtlas && f.id.startsWith('reference-')));
  for(const old of ['member-1','member-5','face-01','face-08','unknown']) {
    assert.equal(normalizeAppearance({face:old}).face,'reference-01');
    assert.doesNotMatch(renderCharacter({face:old}),/member-\d-.*photoreal\.png/);
  }
  const html=renderCharacterSetup({face:'member-1'});
  assert.doesNotMatch(html,/option value="(?:member-|face-)/);
  assert.match(html,/option value="reference-17"/);
});
test('person-specific invitation UI exposes a portrait preview and a token-scoped fragment',()=>{
  environment();
  const url=new URL(invitationUrl('http://localhost/?old=1','ROOM','seat-secret','player','reference-15'));
  assert.equal(url.search,'');const hash=new URLSearchParams(url.hash.slice(1));
  assert.equal(hash.get('face'),'reference-15');assert.equal(hash.get('token'),'seat-secret');
  assert.equal(new URLSearchParams(new URL(invitationUrl('http://localhost/','ROOM','observer','spectator','reference-15')).hash.slice(1)).has('face'),false);
  const html=renderInvitationList('ROOM',{player_tokens:['seat-secret',null],seats:[
    {name:'Alice <Guest>',member_id:'player:7',appearance:{face:'reference-15'}},{name:'Bob',member_id:'player:8'}],spectator_token:'watch'});
  assert.match(html,/Portrait for Alice &lt;Guest&gt;/);assert.match(html,/face=reference-15/);
  assert.match(html,/data-face="reference-15"/);assert.match(html,/this member controls their look/);
  assert.equal((html.match(/data-invitation-face=/g)||[]).length,1);
});
test('an invitation overrides a browser default once, strips its URL, and respects later personal choices',()=>{
  environment(invitationUrl('http://localhost/','ROOM','token-a','player','reference-15'));
  const api=client();api.saveAppearance({face:'reference-02',clothes:'charcoal-suit'});
  const session=api.getTabSession();
  assert.equal(api.getAppearance().face,'reference-15');assert.equal(window.location.hash,'');
  assert.ok(!window.location.href.includes('token-a') && !window.location.href.includes('reference-15'));
  api.activateAppearance('ROOM',session.token,view('person-a','reference-15'));
  assert.deepEqual(api.getAppearance(),{face:'reference-15',clothes:'charcoal-suit'});
  api.saveAppearance({face:'reference-03',clothes:'moss-hakama'});
  api.activateAppearance('ROOM',session.token,view('person-a','reference-15'));
  assert.equal(api.getAppearance().face,'reference-03');
  assert.ok(!sessionStorage.getItem('koenji_1889_tab_session_v1').includes('invite_face'));
});
test('the authenticated server preset wins over a changed URL and two tabs keep independent member looks',()=>{
  environment(invitationUrl('http://localhost/','ROOM','token-a','player','reference-02'));
  const first=client();first.getTabSession();first.activateAppearance('ROOM','token-a',view('person-a','reference-15'));
  const second=client();second.activateAppearance('ROOM','token-b',view('person-b','reference-08'));
  second.saveAppearance({face:'reference-09',clothes:'charcoal-suit'});
  assert.equal(first.getAppearance().face,'reference-15');assert.equal(second.getAppearance().face,'reference-09');
  const reload=client();reload.activateAppearance('ROOM','token-a',view('person-a','reference-15',true));
  assert.deepEqual(reload.getAppearance(),{face:'reference-15',clothes:'plum-kimono'});
  first.saveAppearance({face:'reference-12',clothes:'moss-hakama'});
  assert.equal(reload.getAppearance().face,'reference-12','Tabs for the same member share edits');
  assert.equal(second.getAppearance().face,'reference-09','Another member stays independent');
});
