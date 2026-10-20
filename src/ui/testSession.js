import {escapeHtml} from './presentation.js';

export const TEST_SCENARIOS = {
  stock: {label:'Stock round', preset:'stock_round_1'},
  auction: {label:'Private auction', preset:'auction_start'},
  operating: {label:'Operating round', preset:'operating_round_1'},
  routes: {label:'Train routes · two trains', preset:'route_planning'},
  routes3: {label:'Three trains · 3 / 3 / 4 stops', preset:'route_network_3'},
  routes4: {label:'Four trains · branching network', preset:'route_network_4'},
};
export function routeTestScenario(preset) {
  return Object.entries(TEST_SCENARIOS).find(([id,item])=>id.startsWith('routes') && item.preset===preset)?.[0] || null;
}
const TEST_ROOMS_KEY = 'koenji_1889_test_rooms_v1';
const TEST_LOOKS = ['reference-01','reference-02','reference-08','reference-15'];

export function testScenario(search='') {
  const value=new URLSearchParams(search).get('scenario');
  return Object.hasOwn(TEST_SCENARIOS,value) ? value : 'stock';
}

export function testTurnPlayer(view) {
  return view?.legal_actions?.active_player || view?.state?.current_player;
}

export function rememberTestRoom(scenario,bundle) {
  if (!Object.hasOwn(TEST_SCENARIOS,scenario) || !bundle?.is_demo_fixture || bundle.preset !== TEST_SCENARIOS[scenario].preset) return;
  let saved={};
  try {saved=JSON.parse(localStorage.getItem(TEST_ROOMS_KEY) || '{}') || {};} catch {}
  saved[scenario]=bundle.room_code;
  localStorage.setItem(TEST_ROOMS_KEY,JSON.stringify(saved));
}

// Only reuse rooms explicitly created by this shortcut, never an ordinary gathering.
export async function prepareTestRoom(api,scenario='stock',{fresh=false}={}) {
  if(!Object.hasOwn(TEST_SCENARIOS,scenario)) scenario='stock';
  let saved={};
  try {saved=JSON.parse(localStorage.getItem(TEST_ROOMS_KEY) || '{}') || {};} catch {}
  const previous=api.getRoomDirectory()[saved[scenario]];
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
  </nav>`;
}
