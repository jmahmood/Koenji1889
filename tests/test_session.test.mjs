import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTestRoom,rememberTestRoom,routeTestScenario,testScenario,testTurnPlayer,renderTestControls} from '../src/ui/testSession.js';

function setup() {
  const storage=new Map();
  globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
  const directory={REAL:{room_code:'REAL',preset:'gathering',own_session:{token:'private'}}};
  let created=0;const arrivals=[];
  const api={getRoomDirectory:()=>directory,
    async createFixtureRoom(preset) {
      const room_code=`TEST${++created}`;
      return directory[room_code]={room_code,is_demo_fixture:true,preset,player_tokens:['one','two','three','four']};
    },
    async request(path,options) {arrivals.push({path,...options});},
    async fetchGameView(room,token) {return {room,token,state:{revision:8,current_player:'p1'}};},
  };
  return {api,directory,arrivals,created:()=>created};
}

test('test shortcut defaults safely and renders direct testing controls',()=>{
  assert.equal(testScenario(''),'stock');assert.equal(testScenario('?scenario=operating'),'operating');
  for(const bad of ['unknown','__proto__','constructor','<script>']) assert.equal(testScenario(`?scenario=${bad}`),'stock');
  const view={legal_actions:{player:'p1',active_player:'p2'},state:{current_player:'p1',players:{p2:{name:'Alice <Test>'}}}};
  assert.equal(testTurnPlayer(view),'p2','Use the active actor, not the authenticated viewer');
  const html=renderTestControls('stock',view);
  assert.match(html,/Play current turn · Alice &lt;Test&gt;/);
  assert.match(html,/data-new-test/);assert.match(html,/data-edit-look/);
  assert.match(html,/value="stock" selected/);
  assert.match(renderTestControls('stock',{state:{finished:true}}),/data-test-turn disabled/);
});

test('quick test seeds all four portraits, resumes instead of duplicating, and isolates scenarios and real rooms',async()=>{
  const {api,directory,arrivals,created}=setup();
  const real=JSON.stringify(directory.REAL);
  const first=await prepareTestRoom(api);
  assert.equal(first.bundle.preset,'stock_round_1');assert.equal(arrivals.length,4);
  assert.deepEqual(arrivals.map(a=>a.body.appearance.face),['reference-01','reference-02','reference-08','reference-15']);
  assert.equal((await prepareTestRoom(api)).bundle.room_code,first.bundle.room_code);assert.equal(created(),1);
  const operating=await prepareTestRoom(api,'operating');assert.equal(operating.bundle.preset,'operating_round_1');
  assert.equal((await prepareTestRoom(api)).bundle.room_code,first.bundle.room_code);
  assert.notEqual((await prepareTestRoom(api,'stock',{fresh:true})).bundle.room_code,first.bundle.room_code);
  assert.ok(directory[first.bundle.room_code],'Starting fresh preserves the earlier game');
  assert.equal(JSON.stringify(directory.REAL),real);
});

test('a deleted test room is replaced, while network failures keep the saved game',async()=>{
  const {api,created}=setup();await prepareTestRoom(api);
  const fetch=api.fetchGameView;
  api.fetchGameView=async()=>{throw Object.assign(new Error('offline'),{status:503});};
  await assert.rejects(prepareTestRoom(api),/offline/);assert.equal(created(),1);
  api.fetchGameView=async(room,token)=>{if(room==='TEST1') throw Object.assign(new Error('gone'),{status:404});return fetch(room,token);};
  assert.equal((await prepareTestRoom(api)).bundle.room_code,'TEST2');assert.equal(created(),2);
});

test('route scenario creates and resumes the playable two-train fixture',async()=>{
  const {api,created}=setup();
  assert.equal(testScenario('?scenario=routes'),'routes');
  const first=await prepareTestRoom(api,'routes');
  assert.equal(first.bundle.preset,'route_planning');
  assert.equal((await prepareTestRoom(api,'routes')).bundle.room_code,first.bundle.room_code);
  assert.equal(created(),1);
  assert.match(renderTestControls('routes',{state:{}}),/value="routes" selected/);
});

test('a fixture loaded through Demo Tools can become the resumable route scenario',async()=>{
  const {api,created}=setup();
  const bundle=await api.createFixtureRoom('route_planning');
  rememberTestRoom('routes',bundle);
  assert.equal((await prepareTestRoom(api,'routes')).bundle.room_code,bundle.room_code);
  assert.equal(created(),1);
});

test('expanded route scenarios create, isolate and resume three- and four-train games',async()=>{
 const {api,created}=setup();
 for(const [scenario,preset] of [['routes3','route_network_3'],['routes4','route_network_4']]) {
  assert.equal(testScenario(`?scenario=${scenario}`),scenario);
  assert.equal(routeTestScenario(preset),scenario);
  const first=await prepareTestRoom(api,scenario);
  assert.equal(first.bundle.preset,preset);
  assert.equal((await prepareTestRoom(api,scenario)).bundle.room_code,first.bundle.room_code);
  assert.match(renderTestControls(scenario,{state:{}}),new RegExp(`value="${scenario}" selected`));
 }
 assert.equal(created(),2);
 assert.equal(routeTestScenario('operating_round_1'),null);
});

test('Demo Tools exposes distinct fleet sizes and longer train types',async()=>{
 const {renderSeatsAndDemoModal}=await import('../src/components/Modals.js');
 globalThis.window={location:new URL('http://localhost/')};
 const html=renderSeatsAndDemoModal({developerTab:'fixtures'},{room_code:'TEST',viewer:{player_id:'p1'},state:{player_order:['p1'],players:{p1:{name:'Alice',cash:300}}}},{room_code:'TEST',player_tokens:['seat']});
 assert.match(html,/data-load-fixture="route_network_3"/);
 assert.match(html,/data-load-fixture="route_network_4"/);
 assert.match(html,/3 \/ 3 \/ 4 stops/);
 assert.match(html,/18 laid hexes/);assert.match(html,/16 laid hexes/);
});
