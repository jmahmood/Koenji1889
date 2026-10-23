import {escapeHtml} from './presentation.js';
import {currentWizardStep, setWizardStep, stagedDepotAction, trainStageKey} from '../components/TrainDesk.js';

export const TEST_SCENARIOS = {
  stock: {label:'Stock round', preset:'stock_round_1'},
  auction: {label:'Private auction', preset:'auction_start'},
  operating: {label:'Operating round', preset:'operating_round_1'},
  cycle: {label:'Full operating cycle · trains ready', preset:'operating_cycle'},
  newspaper: {label:'Newspaper · 2-train retirement', preset:'train_newspaper'},
  j3: {label:'SR · build at J3', preset:'tile_j3'},
  j3used: {label:'SR · normal track lay used', preset:'tile_j3_used'},
  routes: {label:'Train routes · two trains', preset:'route_planning'},
  routes3: {label:'Three trains · 3 / 3 / 4 stops', preset:'route_network_3'},
  routes4: {label:'Four trains · branching network', preset:'route_network_4'},
};
export function routeTestScenario(preset) {
  return Object.entries(TEST_SCENARIOS).find(([id,item])=>id.startsWith('routes') && item.preset===preset)?.[0] || null;
}
const TEST_ROOMS_KEY = 'koenji_1889_test_rooms_v1';
const NEWSPAPER_VIEW_KEY = 'koenji_1889_newspaper_view_v1';
const TEST_LOOKS = ['reference-01','reference-02','reference-08','reference-15'];

export function testScenario(search='') {
  const value=new URLSearchParams(search).get('scenario');
  return Object.hasOwn(TEST_SCENARIOS,value) ? value : 'stock';
}

export function testTurnPlayer(view) {
  return view?.legal_actions?.active_player || view?.state?.current_player;
}

// Stage a legal purchase locally; nothing is submitted until the player stamps
// it in Dispatch. A resumed game that has moved on keeps its current position.
export function stageNewspaperTestPreview(app,view) {
  const state=view?.state;
  if(state?.phase!=='3' || state.operating_turn?.step!=='train' || view.is_historical) return false;
  const action=view.action_options?.find(a=>a.type==='buy_train' && a.price===undefined && !a.trade_in &&
    state.trains[a.train]?.type==='4' && state.trains[a.train]?.owner==='depot' && !state.trains[a.train]?.rusted);
  if(!action) return false;
  app.trainStageKey=trainStageKey(app,view);
  app.trainStage=action;
  setWizardStep(app,view,3);
  app.trainWizardSource='depot';
  app.activeModal='train';
  return true;
}

// Presentation belongs to this tab and exact position, never to another tab's
// latest fixture. Store no credentials and revalidate the staged order on load.
export function rememberNewspaperTestView(app,view,scroll={top:0,left:0}) {
  if(!view?.state || app.viewRevision!==app.liveRevision) return;
  try {
    sessionStorage.setItem(NEWSPAPER_VIEW_KEY,JSON.stringify({
      room:app.roomCode,revision:view.state.revision,player:view.viewer?.player_id,
      view:app.view,open:app.activeModal==='train',step:currentWizardStep(app,view),
      source:app.trainWizardSource,action:stagedDepotAction(app,view),scroll,
    }));
  } catch {} // Storage may be unavailable; the legal preview still works.
}

export function restoreNewspaperTestView(app,view) {
  let saved;
  try {saved=JSON.parse(sessionStorage.getItem(NEWSPAPER_VIEW_KEY));} catch {return null;}
  if(!saved || saved.room!==app.roomCode || saved.revision!==view.state.revision || saved.player!==view.viewer?.player_id) return null;
  const action=(view.action_options || []).find(a=>JSON.stringify(a)===JSON.stringify(saved.action));
  if(saved.action && !action) return null;
  app.view=['map','table','market','history'].includes(saved.view) ? saved.view : 'map';
  app.trainStageKey=trainStageKey(app,view);app.trainStage=action || null;
  setWizardStep(app,view,action || saved.step<=2 ? saved.step : 2);
  app.trainWizardSource=saved.source==='market' ? 'market' : 'depot';
  app.activeModal=saved.open ? 'train' : null;
  return {top:Math.max(0,Number(saved.scroll?.top)||0),left:Math.max(0,Number(saved.scroll?.left)||0)};
}

export function rememberTestRoom(scenario,bundle) {
  if (!Object.hasOwn(TEST_SCENARIOS,scenario) || !bundle?.is_demo_fixture || bundle.preset !== TEST_SCENARIOS[scenario].preset) return;
  let saved={};
  try {saved=JSON.parse(localStorage.getItem(TEST_ROOMS_KEY) || '{}') || {};} catch {}
  saved[scenario]=bundle.room_code;
  localStorage.setItem(TEST_ROOMS_KEY,JSON.stringify(saved));
}

// Only reuse rooms explicitly created by this shortcut, never an ordinary gathering.
export async function prepareTestRoom(api,scenario='stock',{fresh=false,roomCode=null}={}) {
  if(!Object.hasOwn(TEST_SCENARIOS,scenario)) scenario='stock';
  let saved={};
  try {saved=JSON.parse(localStorage.getItem(TEST_ROOMS_KEY) || '{}') || {};} catch {}
  const directory=api.getRoomDirectory();
  const pinned=directory[roomCode];
  const previous=pinned?.is_demo_fixture && pinned.preset===TEST_SCENARIOS[scenario].preset
    ? pinned : directory[saved[scenario]];
  if(!fresh && previous?.is_demo_fixture && previous.preset===TEST_SCENARIOS[scenario].preset) {
    try {
      const view=await api.fetchGameView(previous.room_code,previous.player_tokens[0]);
      return {bundle:previous,view};
    } catch(err) {
      if(![401,403,404].includes(err.status)) throw err;
    }
  }
  const bundle=await api.createFixtureRoom(TEST_SCENARIOS[scenario].preset);
  for(let i=0;i<bundle.player_tokens.length;i++) {
    await api.request(`/api/1889/games/${encodeURIComponent(bundle.room_code)}/arrival`,{
      method:'POST',token:bundle.player_tokens[i],
      body:{appearance:{face:TEST_LOOKS[i%TEST_LOOKS.length],clothes:'indigo-haori'}},
    });
  }
  rememberTestRoom(scenario,{...bundle,is_demo_fixture:true});
  return {bundle,view:await api.fetchGameView(bundle.room_code,bundle.player_tokens[0])};
}

export function renderTestControls(scenario,view,busy=false) {
  const actor=testTurnPlayer(view);
  const name=view?.state?.players?.[actor]?.name;
  return `<nav class="test-controls" aria-label="Local testing controls">
    <strong>Test game</strong>
    <label>Start position <select data-test-scenario ${busy?'disabled':''}>
      ${Object.entries(TEST_SCENARIOS).map(([id,item])=>`<option value="${id}" ${id===scenario?'selected':''}>${item.label}</option>`).join('')}
    </select></label>
    <button type="button" data-new-test ${busy?'disabled':''}>New test game</button>
    <button type="button" data-test-turn ${busy || !name || view?.state?.finished?'disabled':''}>Play current turn${name?` · ${escapeHtml(name)}`:''}</button>
    <button type="button" data-edit-look>Change your look</button>
    <a href="/" target="_blank" rel="noopener">Regular app ↗</a>
    <small>All four seats available · refresh resumes this game</small>
    ${scenario==='j3' ? '<small>SR track practice: select J3, choose a legal tile and confirm placement. Straight tile #9 is available.</small>' : ''}
    ${scenario==='j3used' ? '<small>SR has already built at I4 this turn. Select J3 to see why another normal track lay must wait.</small>' : ''}
    ${scenario==='newspaper' ? '<small>Retirement preview · switch English / 日本語 above. Purchase only takes effect after stamping in Dispatch.</small>' : ''}
  </nav>`;
}
