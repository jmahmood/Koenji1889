import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareTestRoom,rememberTestRoom,rememberNewspaperTestView,restoreNewspaperTestView,routeTestScenario,stageNewspaperTestPreview,testScenario,testTurnPlayer,renderTestControls} from '../src/ui/testSession.js';
import {currentWizardStep, stagedDepotAction} from '../src/components/TrainDesk.js';

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

test('J3 practice scenarios create separate resumable SR positions',async()=>{
  const {api,created}=setup();
  for(const [scenario,preset] of [['j3','tile_j3'],['j3used','tile_j3_used']]) {
    assert.equal(testScenario(`?scenario=${scenario}`),scenario);
    const first=await prepareTestRoom(api,scenario);
    assert.equal(first.bundle.preset,preset);
    assert.equal((await prepareTestRoom(api,scenario)).bundle.room_code,first.bundle.room_code);
  }
  assert.equal(created(),2);
  assert.match(renderTestControls('j3',{}),/Straight tile #9 is available/);
  assert.match(renderTestControls('j3used',{}),/already built at I4/);
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
 assert.match(html,/data-load-fixture="train_newspaper"/);
});

test('newspaper fixture resumes separately and exposes the retirement start position',async()=>{
 const {api,created}=setup();
 assert.equal(testScenario('?scenario=newspaper'),'newspaper');
 const first=await prepareTestRoom(api,'newspaper');
 assert.equal(first.bundle.preset,'train_newspaper');
 assert.equal((await prepareTestRoom(api,'newspaper')).bundle.room_code,first.bundle.room_code);
 assert.equal(created(),1);
 assert.notEqual((await prepareTestRoom(api,'newspaper',{fresh:true})).bundle.room_code,first.bundle.room_code);
 const html=renderTestControls('newspaper',{});
 assert.match(html,/value="newspaper" selected/);
 assert.match(html,/2-train retirement/);
 assert.match(html,/Purchase only takes effect after stamping/);
});

test('newspaper start stages an exact legal depot action without changing the game',()=>{
 const view={state:{phase:'3',revision:178,current_corporation:'TR',operating_turn:{step:'train'},
   trains:{'4-0':{type:'4',owner:'depot',rusted:false}}},action_options:[{type:'buy_train',train:'4-0'}]};
 const original=JSON.stringify(view);
 const app={roomCode:'PAPER'};
 assert.equal(stageNewspaperTestPreview(app,view),true);
 assert.equal(app.activeModal,'train');
 assert.equal(currentWizardStep(app,view),3);
 assert.deepEqual(stagedDepotAction(app,view),view.action_options[0]);
 assert.equal(JSON.stringify(view),original);
 for(const changes of [{state:{...view.state,phase:'4'}},{state:{...view.state,operating_turn:{step:'track'}}},
   {action_options:[]},{action_options:[{type:'buy_train',train:'4-0',price:300}]},{is_historical:true}]) {
  const resumed={roomCode:'PAPER',activeModal:null};
  assert.equal(stageNewspaperTestPreview(resumed,{...view,...changes}),false);
  assert.deepEqual(resumed,{roomCode:'PAPER',activeModal:null});
 }
});

test('refresh follows the room in this tab even after another tab starts a new fixture',async()=>{
 const {api,directory,created}=setup();
 const first=await prepareTestRoom(api,'newspaper');
 const second=await prepareTestRoom(api,'newspaper',{fresh:true});
 assert.notEqual(first.bundle.room_code,second.bundle.room_code);
 assert.equal((await prepareTestRoom(api,'newspaper',{roomCode:first.bundle.room_code})).bundle.room_code,first.bundle.room_code);
 assert.equal(created(),2);
 assert.equal((await prepareTestRoom(api,'newspaper',{roomCode:'REAL'})).bundle.room_code,second.bundle.room_code,'An ordinary room is never treated as a fixture');
 const restarted=await prepareTestRoom(api,'newspaper',{fresh:true,roomCode:first.bundle.room_code});
 assert.notEqual(restarted.bundle.room_code,first.bundle.room_code);
 assert.notEqual(restarted.bundle.room_code,second.bundle.room_code);
 assert.ok(directory[first.bundle.room_code]);
});

test('newspaper refresh restores this tab’s step, selected order, open state and scroll only at the same position',()=>{
 const values=new Map();
 globalThis.sessionStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const view={viewer:{player_id:'p3'},state:{phase:'3',revision:178,current_corporation:'TR',operating_turn:{step:'train'},
   trains:{'4-0':{type:'4',owner:'depot',rusted:false}}},action_options:[{type:'buy_train',train:'4-0'}]};
 const app={roomCode:'PAPER',view:'map',viewRevision:178,liveRevision:178};
 stageNewspaperTestPreview(app,view);
 app.trainWizardStep=4;
 rememberNewspaperTestView(app,view,{top:217,left:0});
 const resumed={roomCode:'PAPER'};
 assert.deepEqual(restoreNewspaperTestView(resumed,view),{top:217,left:0});
 assert.equal(currentWizardStep(resumed,view),4);
 assert.equal(resumed.activeModal,'train');
 assert.deepEqual(stagedDepotAction(resumed,view),view.action_options[0]);
 app.activeModal=null;
 rememberNewspaperTestView(app,view);
 restoreNewspaperTestView(resumed,view);
 assert.equal(resumed.activeModal,null,'A deliberately closed wizard stays closed');
 for(const [target,current] of [[{roomCode:'OTHER'},view],[{roomCode:'PAPER'},{...view,state:{...view.state,revision:179}}],
   [{roomCode:'PAPER'},{...view,viewer:{player_id:'p1'}}],[{roomCode:'PAPER'},{...view,action_options:[]}]]) {
  const before=JSON.stringify(target);
  assert.equal(restoreNewspaperTestView(target,current),null);
  assert.equal(JSON.stringify(target),before);
 }
});
