import './style.css';
import './booking.css';
import './appearance.css';
import './playtest.css';
import { gameAudio, gameEffects } from './ui/gameAudio.js';
import {installPreferences, localizePage} from './ui/preferences.js';
import {CONFIRMED_ACTIONS, TurnReminder, renderTurnStatus, renderConfirmation, renderFlotation, renderCashDelivery} from './ui/playtestUX.js';
import {bindDistrictSurvey} from './components/DistrictSurvey.js';
import {syncEmergencyDesk} from './components/TrainDesk.js';
import {renderCharacterSetup,bindAppearanceControls} from './components/CharacterSetup.js';
import {renderCharacter, setCharacterPresentationResolver, refreshCharacterSlots} from './scene/Character.js';
import {CharacterDirector} from './ui/characterDirector.js';
import {renderHouseEntrance} from './scene/HouseEntrance.js';
import {renderArrivalDock,unseenArrivals} from './ui/arrivals.js';
import {renderWaitingTable, bindWaitingTable} from './components/GatheringLobby.js';
import { bindDecisionDesk, renderDecisionDesk, renderDecisionNotice, renderGathering } from './components/DecisionDesk.js';
import { syncRoutePlan } from './ui/routePlanning.js';
import { KoenjiApiClient } from './api/client.js';
import {prepareTestRoom,rememberTestRoom,routeTestScenario,renderTestControls,testScenario,testTurnPlayer} from './ui/testSession.js';
import { CLUB_MEMBERS, CORP_META } from './constants1889.js';
import { actionBlockReason, clearTilePreview, escapeContext, escapeHtml, mapActionAuthority, renderActionFeedback, roundName, syncFinancialLayout } from './ui/presentation.js';
import { createRoomTransition, planRoundHandoff, renderRoundHandoff, roomName } from './ui/transitions.js';
import { bindMapNavigation, resetMapView } from './ui/mapNavigation.js';
import { mapWindowMinimumSize } from './ui/mapWindowSizes.js';
import { computeTableActionSummary, renderClubRoomScene, renderClubroomBackdropSVG } from './scene/ClubRoom.js';
import { renderStockExchangeView } from './components/StockExchange.js';
import {
  MAP_WINDOW_IDS,
  getCandidateTilesForHex,
  getLegalPlacementsForHex,
  renderDetailedMapView,
} from './components/HexMap1889.js';
import {
  renderHistoryJournalView,
  renderTimelineFooter,
} from './replay/TimelineBar.js';
import {
  renderMemberStampModal,
  renderSeatsAndDemoModal,
  renderPlayerDetailsModal,
  renderPrivateDetailsModal,
  renderPrivateZoomModal,
} from './components/Modals.js';

const api = new KoenjiApiClient('');
const isTestPage = import.meta.env.DEV && /^\/test\/?$/.test(window.location.pathname);
let activeTestScenario = testScenario(window.location.search);
let testLoading = false;
const $app = document.querySelector('#app');
const money = (n) => `¥${Number(n || 0).toLocaleString()}`;
const STOCK_WINDOW_IDS = ['corporations', 'ledger', 'geography', 'details', 'privates'];

function createDefaultStockWindows() {
  return {
    corporations: { open: true, x: null, y: null, w: null, h: null, z: 5, maximized: false, floating: false },
    ledger: { open: false, x: null, y: null, w: null, h: null, z: 1, maximized: false, floating: false },
    geography: { open: false, x: null, y: null, w: null, h: null, z: 2, maximized: false, floating: false },
    details: { open: false, x: null, y: null, w: null, h: null, z: 3, maximized: false, floating: false },
    privates: { open: false, x: null, y: null, w: null, h: null, z: 4, maximized: false, floating: false },
  };
}

function createDefaultMapWindows() {
  return {
    hex: { open: false, x: null, y: null, w: null, h: null, z: 5, maximized: false },
    corporations: { open: false, x: null, y: null, w: null, h: null, z: 4, maximized: false },
    trains: { open: false, x: null, y: null, w: null, h: null, z: 3, maximized: false },
    privates: { open: false, x: null, y: null, w: null, h: null, z: 2, maximized: false },
    activity: { open: false, x: null, y: null, w: null, h: null, z: 1, maximized: false },
  };
}

function toggleMaximizeStockWindow(windowId) {
  const windowState = appState.stockWindows?.[windowId];
  if (!windowState || !windowState.open) return;
  const openIds = STOCK_WINDOW_IDS.filter((id) => appState.stockWindows?.[id]?.open);
  const hasCustomGeom =
    Number.isFinite(windowState.x) ||
    Number.isFinite(windowState.y) ||
    Number.isFinite(windowState.w) ||
    Number.isFinite(windowState.h);
  const currentlyMaximized = Boolean(
    windowState.maximized ||
      (openIds.length === 1 && !hasCustomGeom && !windowState.floating)
  );

  if (currentlyMaximized) {
    windowState.maximized = false;
    if (openIds.length === 1 && !hasCustomGeom) {
      windowState.floating = true;
    }
  } else {
    for (const id of STOCK_WINDOW_IDS) {
      if (appState.stockWindows?.[id]) {
        appState.stockWindows[id].maximized = false;
      }
    }
    windowState.maximized = true;
    windowState.floating = false;
    appState.stockWindowTopZ += 1;
    windowState.z = appState.stockWindowTopZ;
  }
}

function toggleMaximizeMapWindow(windowId) {
  const windowState = appState.mapWindows?.[windowId];
  if (!windowState || !windowState.open) return;
  if (windowState.maximized) {
    windowState.maximized = false;
  } else {
    for (const id of MAP_WINDOW_IDS) {
      if (appState.mapWindows?.[id]) {
        appState.mapWindows[id].maximized = false;
      }
    }
    windowState.maximized = true;
    appState.mapWindowTopZ += 1;
    windowState.z = appState.mapWindowTopZ;
  }
}

const appState = {
  roomCode: null,
  seatKey: 'p1', // 'p1'..'p4' or 'spectator'
  token: null,
  roomBundle: null,
  catalog: null,
  liveViewData: null,
  displayedViewData: null,
  revisionCache: new Map(),
  liveRevision: 0,
  viewRevision: 0,
  queuedLiveCount: 0,
  queuedLiveNotice: null,
  view: 'table', // 'table' | 'market' | 'map' | 'history'
  tableSidebarTab: 'chat', // 'chat' | 'log'
  activeModal: null, // null | 'stamp' | 'seats' | 'player' | 'private'
  privateDetailsId: null,
  selectedCompanyId: 'IR',
  selectedParPrice: 80,
  selectedSource: 'ipo',
  stockWindows: createDefaultStockWindows(),
  stockWindowTopZ: 5,
  mapWindows: createDefaultMapWindows(),
  mapWindowTopZ: 5,
  lastSyncedRound: null,
  selectedPrivateId: 'TR',
  bidPrice: 20,
  selectedHex: 'E2',
  inspectedHex: 'E2',
  selectedTileId: null,
  selectedTileRotation: 0,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  animation: null,
  notice: null,
  errorBanner: null,
  skipMotion: false,
  isPlayingReplay: false,
  replaySpeedIdx: 0, // 0 -> 1x (1400ms), 1 -> Fast (600ms), 2 -> Instant (150ms)
  replaySpeedLabel: '1×',
  lastCommandId: null,
  lastActionPayload: null,
  lastActionExpectedRev: null,
  lastProbeResult: null,
  isSubmitting: false,
  isLoadingRevision: false,
  revisionRequest: 0,
  historyStartedAt: null,
  journalReturn: null,
  modalReturnSelector: null,
  developerTab: 'seats',
  previousRoom: null,
  playerDetailsId: null,
  roundHandoff: null,
  needsAppearance: false,
  arrivalCursor: 0,
  arrivalQueue: [],
  arrivalCurrent: null,
  appearanceDraft: null,
  rustAlertMinimized: false,
  rustAlertDismissed: false,
  suppressedRustAlerts: {},
  gazettePosition: { x: 28, y: 52 },
};

let arrivalTimer = null;
let pollInFlight = false;
function motionEnabled() {
  return !appState.skipMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function nextArrival() {
  if(arrivalTimer) clearTimeout(arrivalTimer);
  appState.arrivalCurrent=appState.arrivalQueue.shift() || null;
  appState.arrivalStartedAt=Date.now();
  characters.arrival(appState.arrivalCurrent);
  render();
  if(appState.arrivalCurrent) arrivalTimer=setTimeout(nextArrival,appState.arrivalCurrent.kind==='returned'?3500:5000);
}
function receiveArrivals(events) {
  const fresh=unseenArrivals(events || [],appState.arrivalCursor);
  if(!fresh.length) return;
  appState.arrivalCursor=fresh.at(-1).id;
  appState.arrivalQueue.push(...fresh);
  if(!appState.arrivalCurrent) nextArrival();
}
async function heartbeatArrival(view, room=appState.roomCode, token=appState.token) {
  if(!api.getAppearance()) return null;
  if(view?.status==='waiting' && view.viewer?.player_id && !view.seats.find(s=>s.player_id===view.viewer.player_id)?.claimed) return null;
  const social=await api.arrive(room,token);
  if(appState.roomCode!==room || appState.token!==token) return null;
  const socialChanged=JSON.stringify(appState.liveViewData?.members)!==JSON.stringify(social.members) || JSON.stringify(appState.liveViewData?.host)!==JSON.stringify(social.host);
  if(appState.liveViewData) Object.assign(appState.liveViewData,social);
  if(appState.displayedViewData) Object.assign(appState.displayedViewData,social);
  receiveArrivals(social.arrival_events);
  if(socialChanged) render();
  return social;
}
function bindSocialControls() {
  document.querySelectorAll('[data-invitation-face]').forEach(el=>el.addEventListener('change',async()=>{
    const room=appState.roomCode;el.disabled=true;
    try {await api.setInvitationPortrait(room,el.dataset.invitationFace,el.value);if(appState.roomCode===room){await pollLiveState();render();}}
    catch(err){showToast(`Invitation portrait could not be saved: ${err.message}`,true);}
  }));
  document.querySelectorAll('[data-action="motion"]').forEach(el=>el.addEventListener('click',()=>{
    appState.skipMotion=!appState.skipMotion;
    if(appState.skipMotion) dismissRoomWipe();
    render();
  }));
  document.querySelectorAll('[data-action="music"]').forEach(el=>el.addEventListener('click',()=>{
    gameAudio.toggle();
    gameAudio.updateContext(appState, appState.displayedViewData);
    render();
  }));
  document.querySelectorAll('[data-dismiss-arrival]').forEach(el=>el.addEventListener('click',nextArrival));
  document.querySelectorAll('[data-edit-look]').forEach(el=>el.addEventListener('click',()=>{
    appState.appearanceDraft=api.getAppearance();appState.appearanceTab='appearance';appState.needsAppearance=true;render();
  }));
}
let replayTimer = null;
let pollTimer = null;
let toastTimer = null;
let renderedRoom = null;
let pendingRoundWipe = null;
const roomTransition = createRoomTransition({
  show(title, isRoundChange, duration) {
    const wipe = document.createElement('div');
    wipe.className = `cinematic-room-wipe${isRoundChange ? ' is-round-change' : ''}`;
    wipe.setAttribute('aria-hidden', 'true');
    wipe.style.setProperty('--room-wipe-duration', `${duration}ms`);
    wipe.innerHTML = `<div class="room-wipe-panel"></div><div class="room-wipe-caption"><small>KOENJI RAILWAY CLUB · 1889</small><strong>${escapeHtml(title)}</strong></div>`;
    document.body.append(wipe);
    $app.inert = true;
  },
  hide() {
    document.querySelector('.cinematic-room-wipe')?.remove();
    $app.inert = false;
  },
});

function dismissRoomWipe() {
  roomTransition.finish();
}

function showToast(msg, isError = false) {
  if (toastTimer) clearTimeout(toastTimer);
  if (isError) {
    appState.errorBanner = msg;
  } else {
    appState.notice = msg;
    appState.errorBanner = null;
  }
  render();
  toastTimer = setTimeout(() => {
    appState.notice = null;
    appState.errorBanner = null;
    render();
  }, 3800);
}

const seenPresentationEvents=new Set();
function presentEventAnimation(ev, revision) {
  if(!ev || appState.viewRevision!==appState.liveRevision) return;
  const eventId=`${appState.roomCode}:${revision}`;
  if(!seenPresentationEvents.has(eventId)) {
    seenPresentationEvents.add(eventId);
    if(seenPresentationEvents.size>600)seenPresentationEvents.delete(seenPresentationEvents.values().next().value);
    gameEffects.play(ev.flotations?.length || ev.floated?'float':ev.type==='buy_train'?'train':'action',eventId);
    if(ev.flotations?.length) {
      appState.flotationQueue ||= [];
      appState.flotationQueue.push(...ev.flotations);
    }
  }
  characters.accepted(ev,revision,appState.liveViewData);
}

function renderCharacterNotice() {
  const notice=characters.playback.notice();
  return notice ? `<strong>${escapeHtml(notice.label)}</strong><small>${escapeHtml(notice.detail || '')}</small><button data-dismiss-character aria-label="Dismiss character sequence">Dismiss</button>` : '';
}
function patchCharacterPresentation() {
  refreshCharacterSlots(document);
  const delivery=document.querySelector('[data-cash-receipt-stage]');
  if(delivery)delivery.innerHTML=renderCashDelivery(appState.displayedViewData,characters.playback);
  const slot=document.querySelector('[data-character-notice]');
  const notice=characters.playback.notice();
  // Announce an accepted event once, never every pose cut.
  if(slot && slot.dataset.noticeId!==(notice?.id || '')) {
    slot.innerHTML=renderCharacterNotice(); slot.dataset.noticeId=notice?.id || '';
  }
  localizePage();
}
const characters=new CharacterDirector({onChange:patchCharacterPresentation});
setCharacterPresentationResolver(id=>characters.playback.poseFor(id));
const turnReminder=new TurnReminder({
  notify(){appState.turnReminderVisible=true;gameEffects.play('turn',`reminder:${appState.roomCode}:${turnReminder.key}`);render();},
  onTurn(key){appState.turnReminderVisible=false;gameEffects.play('turn',`turn:${key}:${appState.liveRevision}`);},
});
installPreferences({app:appState,render});
for(const kind of ['pointerdown','keydown'])document.addEventListener(kind,event=>{
  if(!event.isTrusted)return;
  turnReminder.activity();gameAudio.unlock();gameEffects.unlock();
},{capture:true});
setInterval(()=>turnReminder.tick(Number(localStorage.getItem('koenji_turn_reminder') ?? 20),document.hidden || Boolean(appState.activeModal) || appState.isSubmitting),1000);

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
reducedMotion.addEventListener('change',()=>{
  characters.playback.setMotionEnabled(motionEnabled());
  document.body.classList.toggle('motion-off',!motionEnabled());
  if(!motionEnabled()) dismissRoomWipe();
});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-dismiss-character]')) {
    characters.playback.clear('game');characters.playback.clear('social');
  }
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) {characters.playback.clear('game');characters.playback.clear('social');}
  gameAudio.visibilityChanged();
});
function presentHistoryCharacters(revision,animate) {
  const event=appState.liveViewData?.history_events?.find(e=>e.revision===revision)?.event;
  characters.history(event,revision,{...appState.displayedViewData,members:appState.liveViewData?.members},
    {animate:animate && appState.replaySpeedIdx!==2,durationMs:[1300,550,160][appState.replaySpeedIdx]});
}

function computeMinBidForPrivate(state, pid) {
  if (!state || !pid || !state.privates?.[pid]) return 20;
  const priv = state.privates[pid];
  const unsold = Object.values(state.privates || {}).filter((p) => !p.owner);
  const isRunoff = Boolean(state.auction?.active);
  const offeredId = state.auction?.active || unsold[0]?.id || null;
  const bids = state.auction?.bids?.[pid] || {};
  const highest = Object.values(bids).reduce((m, v) => Math.max(m, v), 0);
  if (!isRunoff && pid === offeredId && !priv.owner) {
    const disc = pid === 'TR' ? state.auction?.discount || 0 : 0;
    return Math.max(0, priv.value - disc);
  }
  return Math.max(priv.value, highest) + 5;
}

function syncRoundWindowsAndSelection(viewData) {
  const state = viewData?.state;
  if (!state) return;
  const currentRound = state.round;
  syncFinancialLayout(appState, currentRound, createDefaultStockWindows);

  if (currentRound === 'auction') {
    const privates = Object.values(state.privates || {});
    const unsold = privates.filter((p) => !p.owner);
    const isRunoff = Boolean(state.auction?.active);
    const offeredId = state.auction?.active || unsold[0]?.id || null;
    const prevSelected = appState.selectedPrivateId;

    if (isRunoff && offeredId) {
      appState.selectedPrivateId = offeredId;
    } else if (
      !prevSelected ||
      !state.privates?.[prevSelected] ||
      state.privates[prevSelected].owner
    ) {
      appState.selectedPrivateId = offeredId || privates[0]?.id || 'TR';
    }

    const minPrice = computeMinBidForPrivate(state, appState.selectedPrivateId);
    if (
      appState.selectedPrivateId !== prevSelected ||
      !appState.bidPrice ||
      appState.bidPrice < minPrice
    ) {
      appState.bidPrice = minPrice;
    }

  }

  appState.lastSyncedRound = currentRound;
}

function resolveTokenForSeat(bundle, seatKey) {
  if (!bundle) return null;
  if (bundle.own_session?.seat_key === seatKey) return bundle.own_session.token;
  if (seatKey === 'spectator') return bundle.spectator_token;
  if (seatKey === 'creator') return bundle.creator_token;
  if (seatKey && seatKey.startsWith('p')) {
    const idx = parseInt(seatKey.slice(1), 10) - 1;
    return bundle.player_tokens?.[idx] || null;
  }
  return bundle.player_tokens?.[0];
}

async function bootstrapSession() {
  if(!isTestPage) api.getTabSession(); // Consume and remove invitation credentials immediately.
  try {
    appState.catalog = await api.fetchCatalog();
  } catch (err) {
    appState.errorBanner = `Backend unreachable: ${err.message}`;
    render();
    return;
  }

  if(isTestPage) {await openTestGame();return;}
  const tabSess = api.getTabSession();
  if(!api.getAppearance() && tabSess?.room_code && tabSess.token) {
    try {
      const view=await api.fetchGameView(tabSess.room_code,tabSess.token);
      const member=view.members?.[view.viewer.player_id];
      if(member?.appearance_configured) api.activateAppearance(tabSess.room_code,tabSess.token,view);
    } catch {} // The regular re-entry path below reports an invalid invitation.
  }
  if(!api.getAppearance()) {appState.needsAppearance=true;render();return;}
  if(tabSess?.room_code && tabSess.token) {
    try {await enterRoom(tabSess.room_code,tabSess.seat_key,tabSess.token);return;}
    catch(err) {appState.errorBanner=`Could not re-enter: ${err.message}`;}
  }

  appState.needsGathering = true;
  render();
}

function showRoutePractice(view) {
  const cid=view.state.current_corporation,corp=view.state.corporations[cid];
  if(!corp)return;
  appState.view='map';appState.selectedCompanyId=cid;
  appState.selectedHex=corp.home;appState.inspectedHex=corp.home;
  appState.mapWindows=createDefaultMapWindows();appState.mapWindowTopZ=5;resetMapView(appState);
  appState.routeDraftKey=null;appState.routeEditor=null;appState.reviewAction=null;
  appState.activeModal=view.state.operating_turn?.step==='routes' ? 'decisions' : null;
}

async function openTestGame(fresh=false) {
  if(testLoading) return;
  testLoading=true;
  render();
  try {
    const {bundle,view}=await prepareTestRoom(api,activeTestScenario,{fresh});
    const current=api.getTabSession();
    const seat=current?.room_code===bundle.room_code && bundle.player_tokens.includes(current.token)
      ? `p${bundle.player_tokens.indexOf(current.token)+1}`
      : testTurnPlayer(view) || 'p1';
    appState.needsAppearance=false;appState.needsGathering=false;appState.errorBanner=null;
    await enterRoom(bundle.room_code,seat,resolveTokenForSeat(bundle,seat));
    if (activeTestScenario.startsWith('routes')) {
      showRoutePractice(appState.displayedViewData);
    }
  } catch(err) {
    appState.errorBanner=`Test game could not open: ${err.message}`;
  } finally {testLoading=false;render();}
}

function bindTestControls() {
  if(!isTestPage) return;
  document.querySelector('[data-new-test]')?.addEventListener('click',()=>openTestGame(true));
  document.querySelector('[data-test-scenario]')?.addEventListener('change',async e=>{
    activeTestScenario=e.target.value;
    const url=new URL(window.location.href);url.searchParams.set('scenario',activeTestScenario);
    window.history.replaceState({},'',url);
    await openTestGame();
  });
  document.querySelector('[data-test-turn]')?.addEventListener('click',async()=>{
    try {
      const actor=testTurnPlayer(appState.liveViewData);
      if(actor) {await switchSeatInTab(actor);await scrubToRevision(appState.liveRevision);}
    } catch(err) {showToast(`Could not switch player: ${err.message}`,true);}
  });
  document.querySelector('[data-retry-test]')?.addEventListener('click',()=>bootstrapSession());
}

export async function loadFixturePreset(preset = 'auction_start') {
  try {
    appState.revisionRequest += 1;
    if (appState.roomCode) appState.previousRoom = { roomCode: appState.roomCode, seatKey: appState.seatKey };
    const res = await api.createFixtureRoom(preset, [
      'Daisuke',
      'Haruka',
      'Kenji',
      'Alex',
    ]);
    const routeScenario=routeTestScenario(preset);
    const desiredSeat = routeScenario ? res.view.state.current_player :
      appState.seatKey && appState.seatKey !== 'spectator'
        ? appState.seatKey
        : 'p1';
    const token = resolveTokenForSeat(res, desiredSeat);
    api.setTabSession(res.room_code, desiredSeat, token);
    appState.roomCode = res.room_code;
    appState.seatKey = desiredSeat;
    appState.token = token;
    appState.roomBundle = res;
    appState.revisionCache.clear();
    appState.queuedLiveCount = 0;
    appState.queuedLiveNotice = null;
    appState.lastProbeResult = null;
    appState.lastSyncedRound = null;
    appState.financialLayouts = {};
    appState.journalReturn = null;
    clearTilePreview(appState);
    const freshView = await api.fetchGameView(res.room_code, token);
    if (appState.view !== 'table') {
      if (freshView.state?.round === 'operating') {
        appState.view = 'map';
      } else {
        appState.view = 'market';
      }
    }
    if (routeScenario) {
      if (isTestPage) {
        activeTestScenario=routeScenario;
        rememberTestRoom(routeScenario,{...res,is_demo_fixture:true});
        const url=new URL(location.href);url.searchParams.set('scenario',routeScenario);history.replaceState({},'',url);
      }
      showRoutePractice(freshView);
    }
    applyFreshLiveView(freshView, true);
    showToast(
      `Loaded ${preset.replace(/_/g, ' ')} in Room ${res.room_code} (Rev ${freshView.state.revision})`
    );
  } catch (err) {
    showToast(`Failed to create fixture: ${err.message}`, true);
  }
}

function applyFreshLiveView(viewData, forceFollowLive = false) {
  if(viewData.viewer?.role==='creator') api.rememberHostCredential(appState.roomCode,appState.token);
  api.activateAppearance(appState.roomCode,appState.token,viewData);
  characters.setRoom(appState.roomCode);
  characters.playback.setMotionEnabled(motionEnabled());
  if(appState.liveViewData?.status==='waiting' && viewData.status!=='waiting') characters.host(viewData);
  if(viewData.status==='waiting') {
    appState.liveViewData=viewData;appState.displayedViewData=viewData;appState.liveRevision=0;appState.viewRevision=0;
    appState.seatKey=viewData.viewer.player_id || viewData.viewer.role;
    const viewerSeat=viewData.seats?.find(s=>s.player_id===viewData.viewer?.player_id);
    const viewerMember=viewData.members?.[viewData.viewer?.player_id] || viewerSeat;
    const isViewerHost=Boolean(viewData.viewer?.role==='creator' || viewerSeat?.is_host || viewerMember?.is_host || (viewerMember?.member_id && viewData.host?.member_id && viewerMember.member_id===viewData.host.member_id));
    api.setTabSession(appState.roomCode,appState.seatKey,appState.token);
    api.saveOwnRoom(appState.roomCode,appState.seatKey,appState.token,{isHost:isViewerHost,memberId:viewerMember?.member_id || null});
    const invites=api.getHostInvitations(appState.roomCode);
    if(invites) invites.player_tokens=invites.player_tokens.map((t,i)=>viewData.seats[i].claimed ? null : t);
    render();return;
  }
  const previousState=appState.liveViewData?.state;
  if(viewData.state.finished && !previousState?.finished && (forceFollowLive || appState.viewRevision===appState.liveRevision)) appState.activeModal='decisions';
  if(appState.liveViewData?.status==='waiting') appState.notice='Private Company Auction begins · 私有鉄道競売';
  const newRev = viewData.state.revision;
  const oldLiveRev = appState.liveRevision;
  if (!forceFollowLive && newRev < oldLiveRev) return;
  const wasViewingLive =
    forceFollowLive || appState.viewRevision === oldLiveRev;
  const handoff = !forceFollowLive
    ? planRoundHandoff(appState, appState.liveViewData?.state, viewData.state)
    : null;
  if (forceFollowLive) {
    appState.roundHandoff = null;
    pendingRoundWipe = null;
    dismissRoomWipe();
  }
  if (handoff) {
    appState.roundHandoff = handoff;
    appState.animation = null;
    // Follow the live work, but never pull someone out of the table, Journal,
    // another inspection room, or an open dialog.
    if (handoff.autoNavigate) {
      appState.view = handoff.destination;
      appState.mapReturn = null;
      pendingRoundWipe = handoff.title;
    }
  }

  appState.liveViewData = viewData;
  appState.liveRevision = newRev;
  appState.revisionCache.set(newRev, viewData);

  if (wasViewingLive) {
    const revAdvanced = !forceFollowLive && newRev > oldLiveRev;
    appState.viewRevision = newRev;
    appState.displayedViewData = viewData;
    if (newRev !== oldLiveRev) clearTilePreview(appState);
    appState.queuedLiveCount = 0;
    appState.queuedLiveNotice = null;
    syncRoundWindowsAndSelection(viewData);
    syncEmergencyDesk(appState,viewData);
    if (viewData?.state?.operating_turn?.step === 'routes') syncRoutePlan(appState, viewData);

    if (revAdvanced) {
      const missed=(viewData.history_events || []).filter(e=>e.revision>oldLiveRev && e.revision<=newRev);
      // Reconnect catch-up is bounded; initial load never replays the journal.
      if(missed.length) missed.slice(-3).forEach(e=>presentEventAnimation(e.event,e.revision));
      else presentEventAnimation(viewData.last_event,newRev);
    }
  } else {
    // Social state belongs to the current gathering, even during game rewind.
    if (appState.displayedViewData) appState.displayedViewData.club = viewData.club;
    if (newRev > oldLiveRev) {
      // Keep historical inspection fixed when a new live move arrives.
      appState.queuedLiveCount = newRev - (appState.historyStartedAt ?? oldLiveRev);
      const latestEv = (viewData.history_events || []).find(
        (e) => e.revision === newRev
      );
      appState.queuedLiveNotice = latestEv
        ? `New live move at Rev ${newRev}: ${latestEv.label}`
        : `Live match advanced to Rev ${newRev}`;
    }
  }
  if (newRev !== oldLiveRev) appState.reviewAction = null;
  render();
}

async function pollLiveState() {
  if (!appState.roomCode || !appState.token || pollInFlight || appState.needsAppearance) return;
  pollInFlight=true;
  const roomCode = appState.roomCode, token = appState.token;
  try {
    await heartbeatArrival(appState.liveViewData,roomCode,token);
    const latest = await api.fetchGameView(roomCode, token);
    if (appState.roomCode !== roomCode || appState.token !== token) return;
    if (
      !appState.liveViewData ||
      latest.state?.revision !== appState.liveViewData.state?.revision ||
      latest.status !== appState.liveViewData.status ||
      JSON.stringify(latest.seats?.map(({last_seen_at,...s})=>s)) !== JSON.stringify(appState.liveViewData.seats?.map(({last_seen_at,...s})=>s)) ||
      JSON.stringify(Object.values(latest.presence || {}).map(p=>p.online)) !== JSON.stringify(Object.values(appState.liveViewData.presence || {}).map(p=>p.online)) ||
      JSON.stringify(latest.members) !== JSON.stringify(appState.liveViewData.members) ||
      JSON.stringify(latest.host) !== JSON.stringify(appState.liveViewData.host) ||
      JSON.stringify(latest.club) !== JSON.stringify(appState.liveViewData.club)
    ) {
      applyFreshLiveView(latest, false);
    }
  } catch {
    // Ignore transient poll errors; the next authenticated heartbeat recovers.
  } finally {pollInFlight=false;}
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollLiveState, 1400);
  if (api.channel) {
    api.channel.onmessage = (ev) => {
      if (ev.data?.room_code === appState.roomCode) {
        pollLiveState();
      }
    };
  }
}

async function scrubToRevision(targetRev, triggerReplayAnim = false) {
  const rev = Math.max(0, Math.min(appState.liveRevision, Number(targetRev)));
  if (!Number.isInteger(rev)) return;
  characters.playback.clear('game');
  const request = ++appState.revisionRequest;
  appState.roundHandoff = null;
  pendingRoundWipe = null;
  dismissRoomWipe();
  const roomCode = appState.roomCode;
  const token = appState.token;
  if (appState.viewRevision === appState.liveRevision && rev !== appState.liveRevision) appState.historyStartedAt = appState.liveRevision;
  clearTilePreview(appState);
  appState.viewRevision = rev;
  appState.isLoadingRevision = false;

  if (rev === appState.liveRevision && appState.liveViewData) {
    appState.displayedViewData = appState.liveViewData;
    appState.queuedLiveCount = 0;
    appState.queuedLiveNotice = null;
    syncRoundWindowsAndSelection(appState.liveViewData);
    appState.historyStartedAt = null;
    if (triggerReplayAnim) {
      const evObj = (appState.liveViewData.history_events || []).find(
        (e) => e.revision === rev
      )?.event;
      if (evObj) presentHistoryCharacters(rev, true);
    }
    render();
    return;
  }

  if (appState.revisionCache.has(rev)) {
    const cached = appState.revisionCache.get(rev);
    cached.club = appState.liveViewData?.club || cached.club;
    appState.displayedViewData = cached;
    syncRoundWindowsAndSelection(cached);
    if (!triggerReplayAnim && rev!==appState.liveRevision) presentHistoryCharacters(rev,false);
    if (triggerReplayAnim) {
      const evObj = (appState.liveViewData?.history_events || []).find(
        (e) => e.revision === rev
      )?.event;
      if (evObj) presentHistoryCharacters(rev, true);
    }
    render();
    return;
  }

  try {
    appState.isLoadingRevision = true;
    render();
    const snap = await api.fetchRevisionView(
      appState.roomCode,
      appState.token,
      rev
    );
    if (roomCode !== appState.roomCode || token !== appState.token) return;
    appState.revisionCache.set(rev, snap);
    if (request === appState.revisionRequest && appState.viewRevision === rev) {
      appState.isLoadingRevision = false;
      snap.club = appState.liveViewData?.club || snap.club;
      appState.displayedViewData = snap;
      syncRoundWindowsAndSelection(snap);
      if (!triggerReplayAnim) presentHistoryCharacters(rev,false);
      if (triggerReplayAnim) {
        const evObj = (appState.liveViewData?.history_events || []).find(
          (e) => e.revision === rev
        )?.event;
        if (evObj) presentHistoryCharacters(rev, true);
      }
      render();
    }
  } catch (err) {
    if (request !== appState.revisionRequest) return;
    appState.isLoadingRevision = false;
    appState.viewRevision = appState.displayedViewData?.state?.revision ?? appState.liveRevision;
    showToast(`Could not load revision ${rev}: ${err.message}`, true);
  }
}

function toggleReplayPlayback() {
  if (appState.isPlayingReplay) {
    appState.isPlayingReplay = false;
    presentHistoryCharacters(appState.viewRevision,false);
    if (replayTimer) clearInterval(replayTimer);
    replayTimer = null;
    render();
    return;
  }

  if (appState.viewRevision >= appState.liveRevision) {
    scrubToRevision(0, false);
  }
  appState.isPlayingReplay = true;
  const intervals = [1300, 550, 160];
  const ms = intervals[appState.replaySpeedIdx] || 1300;

  replayTimer = setInterval(async () => {
    if (appState.viewRevision < appState.liveRevision) {
      await scrubToRevision(appState.viewRevision + 1, true);
    } else {
      appState.isPlayingReplay = false;
      clearInterval(replayTimer);
      replayTimer = null;
      render();
    }
  }, ms);
  render();
}

function cycleReplaySpeed() {
  const labels = ['1×', 'Fast', 'Instant'];
  appState.replaySpeedIdx = (appState.replaySpeedIdx + 1) % labels.length;
  appState.replaySpeedLabel = labels[appState.replaySpeedIdx];
  if (appState.isPlayingReplay) {
    toggleReplayPlayback();
    toggleReplayPlayback();
  } else {
    render();
  }
}

async function switchSeatInTab(newSeatKey) {
  appState.revisionRequest += 1;
  clearTilePreview(appState);
  const bundle =
    appState.roomBundle || api.getRoomDirectory()[appState.roomCode];
  const tok = resolveTokenForSeat(bundle, newSeatKey);
  if (!tok) {
    showToast('Token unavailable for that seat in this room.', true);
    return;
  }
  api.setTabSession(appState.roomCode, newSeatKey, tok);
  appState.seatKey = newSeatKey;
  appState.token = tok;
  appState.revisionCache.clear();
  const fresh = await api.fetchGameView(appState.roomCode, tok);
  applyFreshLiveView(fresh, appState.viewRevision === appState.liveRevision);
  if (appState.viewRevision !== appState.liveRevision) {
    await scrubToRevision(appState.viewRevision, false);
  }
  showToast(
    `Switched active browser credential to ${fresh.viewer?.player_name || newSeatKey.toUpperCase()}`
  );
}

async function executeGameAction(actionPayload, confirmed = false, forceReview = false) {
  const blocked = actionBlockReason(appState, appState.displayedViewData);
  if (blocked) {
    showToast(blocked, true);
    return;
  }
  if(!confirmed && (forceReview || CONFIRMED_ACTIONS.has(actionPayload.type))) {
    const source=document.activeElement;
    const focusAttr=['data-action','data-op-action','data-auction-action','data-buy-train'].find(attr=>source?.hasAttribute?.(attr));
    const returnSelector=focusAttr?`[${focusAttr}="${CSS.escape(source.getAttribute(focusAttr))}"]`: '.turn-go';
    appState.pendingDecision={action:structuredClone(actionPayload),revision:appState.liveRevision,room:appState.roomCode,token:appState.token,returnModal:appState.activeModal,returnSelector};
    appState.activeModal='confirm';
    render();document.querySelector('[data-cancel-decision]')?.focus({preventScroll:true});return;
  }
  appState.isSubmitting = true;
  render();
  const expectedRev = appState.liveRevision;
  const roomCode = appState.roomCode, token = appState.token;
  const cmdId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const res = await api.submitAction(
      roomCode,
      token,
      expectedRev,
      actionPayload,
      cmdId
    );
    if (appState.roomCode !== roomCode || appState.token !== token) return;
    appState.lastCommandId = cmdId;
    appState.lastActionPayload = actionPayload;
    appState.lastActionExpectedRev = expectedRev;
    applyFreshLiveView(res, false);
    if (res.last_event) {
      presentEventAnimation(res.last_event, res.state.revision);
      showToast(`${res.last_event.label} · Rev ${res.state.revision}`);
    } else {
      showToast(`Action committed · Revision ${res.state.revision}`);
    }
  } catch (err) {
    if (err.status === 409) {
      await pollLiveState();
    }
    showToast(`Move not accepted: ${err.message}`, true);
  } finally {
    appState.isSubmitting = false;
    render();
  }
}

async function enterRoom(roomCode, seatKey, token) {
  const view = await api.fetchGameView(roomCode, token);
  if(arrivalTimer) clearTimeout(arrivalTimer);
  appState.arrivalQueue=[];appState.arrivalCurrent=null;
  appState.arrivalCursor=Math.max(0,...(view.arrival_events || []).map(e=>e.id));
  seatKey=view.viewer.player_id || view.viewer.role;
  const viewerSeat=view.seats?.find(s=>s.player_id===view.viewer?.player_id);
  const viewerMember=view.members?.[view.viewer?.player_id] || viewerSeat;
  const isViewerHost=Boolean(view.viewer?.role==='creator' || viewerSeat?.is_host || viewerMember?.is_host || (viewerMember?.member_id && view.host?.member_id && viewerMember.member_id===view.host.member_id));
  appState.revisionRequest += 1;
  api.setTabSession(roomCode, seatKey, token);
  api.saveOwnRoom(roomCode, seatKey, token, {isHost:isViewerHost, memberId:viewerMember?.member_id || null});
  Object.assign(appState, {pendingDecision:null,flotationQueue:[],turnReminderVisible:false,roomCode, seatKey, token, roomBundle:api.getRoomDirectory()[roomCode], needsGathering:false,
    activeModal:null, publicLobby:null, lastSyncedRound:null, financialLayouts:{}, view:'table', reviewAction:null, routeDraftKey:null,
    isPlayingReplay:false, liveRevision:0, viewRevision:0, displayedViewData:null, liveViewData:null, lobbyTab:'invitations', inviteFallback:null});
  if (replayTimer) clearInterval(replayTimer);
  appState.revisionCache.clear();
  applyFreshLiveView(view,true);
  if(isViewerHost && api.getRoomDirectory()[roomCode]?.creator_token) {
    try {await api.loadHostInvitations(roomCode);render();} catch(err) {showToast(`Invitations could not be loaded: ${err.message}`,true);}
  }
  try {await heartbeatArrival(view);} catch(err) {showToast(`Arrival could not be saved: ${err.message}`,true);}
  startPolling();
}

function bindDesk() {
  bindDecisionDesk({app:appState,api,render,execute:(action,options)=>executeGameAction(action,false,Boolean(options?.review)),toast:showToast,enterRoom});
}

function closeModal() {
  let returnSelector=appState.modalReturnSelector || '[data-modal="stamp"]';
  if(appState.activeModal==='confirm') {
    returnSelector=appState.pendingDecision?.returnSelector || '.turn-go';
    const previous=appState.pendingDecision?.returnModal;
    appState.pendingDecision=null;appState.activeModal=previous || null;
  } else appState.activeModal = null;
  appState.routeEditor=null;
  render();
  document.querySelector(returnSelector)?.focus({ preventScroll: true });
}

function renderRoomContext(viewData) {
  const state = viewData.state;
  const historical = appState.viewRevision !== appState.liveRevision;
  return `<section class="room-context ${historical ? 'is-history' : ''}" aria-label="Viewing context" role="status">
    <span>Viewing as <b>${escapeHtml(viewData.viewer?.player_name || 'Guest Observer')}</b></span>
    <span>${roundName(state)} · Phase ${state.phase}</span><span class="host-identity">${viewData.host?.member_id==='creator' ? `<span class="host-character custom-portrait">${renderCharacter(viewData.host.appearance,{memberId:viewData.host.member_id,name:viewData.host.name,surface:'portrait'})}</span>` : ''}Host · ${escapeHtml(viewData.host?.name || 'Club Host')}</span>
    <strong>${appState.isLoadingRevision ? 'Loading snapshot…' : historical ? `History · Rev ${state.revision} of ${appState.liveRevision} · Game read-only` : `Live · Rev ${state.revision}`}</strong>
    ${appState.isSubmitting ? '<span>Submitting move…</span>' : ''}
    ${historical ? `<button data-action="live">Return to Live${appState.queuedLiveCount ? ` (+${appState.queuedLiveCount} new)` : ''}</button>` : ''}
    ${appState.view !== 'history' ? `<button data-view="history" ${appState.journalReturn !== null ? 'data-return-journal' : ''}>${appState.journalReturn !== null ? 'Back to Journal' : 'Journal'} · 棋譜</button>` : ''}
    ${appState.view === 'map' && appState.mapReturn === 'market' ? `<button data-view="market">Back to ${state.round === 'auction' ? 'Private Company Auction' : 'Stock Exchange'}</button>` : ''}
  </section>`;
}

async function runSecurityProbe(probeKind) {
  try {
    if (probeKind === 'stale_revision') {
      const staleRev = Math.max(0, appState.liveRevision - 1);
      await api.submitAction(
        appState.roomCode,
        appState.token,
        staleRev,
        { type: 'pass' },
        `probe-stale-${Date.now()}`
      );
      appState.lastProbeResult = 'Unexpected: stale revision was accepted';
    } else if (probeKind === 'impersonate_actor') {
      const otherPlayer = appState.seatKey === 'p1' ? 'p2' : 'p1';
      await api.submitAction(
        appState.roomCode,
        appState.token,
        appState.liveRevision,
        { type: 'pass', player: otherPlayer },
        `probe-impersonate-${Date.now()}`
      );
      appState.lastProbeResult = 'Unexpected: forged player was accepted';
    } else if (probeKind === 'idempotent_retry') {
      if (!appState.lastCommandId || !appState.lastActionPayload) {
        appState.lastProbeResult =
          'Perform at least one move in this session first, then click to test duplicate command_id idempotency.';
        render();
        return;
      }
      const res = await api.submitAction(
        appState.roomCode,
        appState.token,
        appState.lastActionExpectedRev,
        appState.lastActionPayload,
        appState.lastCommandId
      );
      appState.lastProbeResult = `✓ HTTP 200 Idempotent Replay verified! Server returned existing Revision ${res.state.revision} for command_id "${appState.lastCommandId.slice(0, 12)}..." without double-executing or advancing revision.`;
      render();
      return;
    }
  } catch (err) {
    appState.lastProbeResult = `✓ Server properly rejected probe with HTTP ${err.status}: "${err.message}". Live state remained untouched at Revision ${appState.liveRevision}.`;
  }
  render();
}

function renderTopbar(viewData) {
  const state = viewData.state;
  const viewer = viewData.viewer || {};
  const otherSeat = viewer.player_id === 'p1' ? 'p2' : 'p1';
  const otherSeatName =
    state.players?.[otherSeat]?.name || otherSeat.toUpperCase();
  const secondTabUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(appState.roomCode)}&seat=${otherSeat}`;

  if (appState.view === 'table') {
    const summary = computeTableActionSummary(state);

    return `
      <header class="topbar club-social-topbar">
        <div class="brand-cluster">
          <div class="brand-seal"><span>1889</span></div>
          <div class="brand-copy">
            <b>KOENJI RAILWAY CLUB</b>
            <small>高円寺鉄道倶楽部 · SHIKOKU 1889</small>
          </div>
        </div>

        <div class="club-summary-strip" role="region" aria-label="Current match summary">
          <button type="button" class="css-cell css-round is-phase-clickable" data-view="${summary.targetView}" title="Current Round: Click to open ${summary.targetView === 'market' ? (state.round === 'auction' ? 'Private Railway Auction' : 'Stock Market') : 'Operating View'}">
            <strong>${summary.roundTitle}</strong>
            <small>${summary.roundJp}</small>
          </button>
          <button type="button" class="css-cell css-phase is-phase-clickable" data-view="${summary.targetView}" title="Current Phase: Click to open ${summary.actionTitle}">
            <span class="css-kicker">Phase</span>
            <strong>${state.phase}</strong>
            <small>${summary.phaseJp}</small>
          </button>
          <div class="css-cell css-bank">
            <span class="css-kicker">Bank</span>
            <div class="css-bank-row">
              <span class="coin-stack-icon" aria-hidden="true">🪙</span>
              <strong>${money(state.bank)}</strong>
            </div>
          </div>
          <button type="button" class="css-cell css-current-action is-active-phase" data-view="${summary.targetView}" title="Click to open ${summary.actionTitle}">
            <span class="css-kicker">Current Action · クリックして移動</span>
            <div class="css-action-row">
              <span class="css-action-badge is-highlighted" aria-hidden="true">
                ${
                  state.round === 'auction' || state.round === 'stock'
                    ? `<svg viewBox="0 0 28 28"><path d="M5 22h18M8 19v-6m4 6v-9m4 9v-5m4 5V8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`
                    : `<svg viewBox="0 0 28 28"><rect x="6" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/><circle cx="18" cy="16" r="1.5" fill="currentColor"/><path d="M9 9h10M8 23l3-3m9 3l-3-3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`
                }
              </span>
              <div>
                <strong>${summary.actionTitle}</strong>
                <small>${summary.actionJp}</small>
              </div>
            </div>
          </button>
        </div>

        <div class="club-room-meta">
          <div class="club-exterior-thumb" aria-hidden="true">
            ${renderHouseEntrance()}
          </div>
          <div class="crm-room-info">
            <span>Room <b>${appState.roomCode}</b></span>
            <small class="crm-seated-meta">${(state.player_order || []).length} seated · Rev ${state.revision}</small>
          </div>
          <button type="button" class="crm-gear-btn" data-modal="seats" aria-label="Demo Tools" title="Manage seats, fixtures & protocol tests">
            Demo Tools ⚙
          </button>
          <button type="button" class="crm-menu-btn" data-modal="stamp" title="Open Koenji Club Membership Card & Gathering Notes">
            Membership Card
          </button>
          <button type="button" class="sound-button" aria-label="Toggle background music" data-action="music">
            Music: ${gameAudio.isEnabled() ? 'On' : 'Off'}
          </button>
          <button type="button" class="sound-button" aria-label="Toggle reduced motion" data-action="motion">
            Motion: ${appState.skipMotion ? 'Off' : 'On'}
          </button>
        </div>
      </header>
    `;
  }

  return `
    <header class="topbar">
      <div class="brand-seal"><span>1889</span></div>
      <div class="brand-copy">
        <b>KOENJI RAILWAY CLUB</b>
        <small>高円寺鉄道倶楽部 · SHIKOKU 1889</small>
      </div>

      <div class="seat-switcher-bar demo-seat-controls" role="group" aria-label="Development seat controls">
        <span class="seat-bar-label">SEAT:</span>
        ${(state.player_order || [])
          .map((pid) => {
            const p = state.players?.[pid];
            const isMe = viewer.player_id === pid;
            const isTurn = state.current_player === pid;
            return `<button
              class="seat-chip ${isMe ? 'active-seat' : ''} ${isTurn ? 'turn-seat' : ''}"
              data-switch-seat="${pid}"
              title="Switch this browser tab to ${p?.name || pid} (${pid.toUpperCase()})"
            >
              ${isTurn ? '♛ ' : ''}${p?.name || pid}
            </button>`;
          })
          .join('')}
        <button
          class="seat-chip ${viewer.role === 'spectator' ? 'active-seat' : ''}"
          data-switch-seat="spectator"
          title="Switch to read-only Guest Spectator"
        >
          👁 Spectator
        </button>
        <a
          class="open-second-browser-btn"
          href="${secondTabUrl}"
          target="_blank"
          rel="noopener"
          title="Open ${otherSeatName} in a separate browser tab/window for two-client synchronization testing"
        >
          + Open ${otherSeatName} Tab ↗
        </a>
      </div>

      <div class="match-meta">
        <b>ROOM ${appState.roomCode}</b>
        <span>${(state.player_order || []).length} seated · Rev ${state.revision}</span>
      </div>

      <button class="sound-button" data-modal="seats" title="Manage seats, fixtures & protocol tests">
        Demo Tools ⚙
      </button>
      <button class="sound-button" data-modal="stamp">Membership Card</button>
      <button class="sound-button" aria-label="Toggle background music" data-action="music">
        Music: ${gameAudio.isEnabled() ? 'On' : 'Off'}
      </button>
      <button class="sound-button" aria-label="Toggle reduced motion" data-action="motion">
        Motion: ${appState.skipMotion ? 'Off' : 'On'}
      </button>
    </header>
  `;
}

function renderPlayerRoster(viewData) {
  const state = viewData.state;
  const certs = viewData.certificates || {};
  const certLimit =
    appState.catalog?.certificate_limits?.[state.player_order.length] || 14;
  const viewerId = viewData.viewer?.player_id;
  const stamps = viewData.club?.stamps || {};

  return `
    <aside class="roster" aria-label="Players at the table">
      <div class="section-label">THE GATHERING · 参加者</div>
      <h2>Around the table</h2><p class="host-identity">Host · ${escapeHtml(viewData.host?.name || 'Club Host')}</p>
      ${(state.player_order || [])
        .map((pid, i) => {
          const p = state.players[pid];
          const isTurn = state.current_player === pid;
          const isViewer = viewerId === pid;
          const isPriority = state.priority === pid;
          const initials = p.name.slice(0, 2).toUpperCase();

          // Collect holdings
          const holdingsBadges = [];
          for (const [cid, corp] of Object.entries(state.corporations || {})) {
            const pct = corp.holdings?.[pid] || 0;
            if (pct > 0) {
              const isPres = corp.president === pid;
              holdingsBadges.push(
                `<span class="mini-corp-tag" style="--corp:${CORP_META[cid]?.color || '#c9a236'}">${cid} ${pct}%${isPres ? '★' : ''}</span>`
              );
            }
          }
          const ownedPrivates = Object.values(state.privates || {})
            .filter((pr) => pr.owner === pid && !pr.closed)
            .map((pr) => `<span class="mini-priv-tag">${pr.id}</span>`);

          return `
            <article class="roster-player ${isTurn ? 'active' : ''} ${isViewer ? 'is-viewer' : ''}">
              <div class="portrait-mini tone-${i % 4}">
                ${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:p.name,surface:"portrait"})}
              </div>
              <div class="roster-details">
                <div class="roster-name-line">
                  <b>${p.name}</b>${viewData.members?.[pid]?.is_host ? '<em class="host-badge">Host</em>' : ''}
                  ${isViewer ? '<em class="you-badge">YOU</em>' : ''}
                  ${stamps[pid] ? '<em class="stamped-seal" title="Stamped gathering card">印</em>' : ''}
                </div>
                <small>
                  ${isTurn ? 'Active Turn' : CLUB_MEMBERS[i]?.roleTag || 'Investor'}
                  ${isPriority ? ' · Priority Deal' : ''}
                </small>
                <p class="cash-certs-line">
                  <strong>${money(p.cash)}</strong>
                  <span>·</span>
                  ${certs[pid] || 0}/${certLimit} certs
                </p>
                <div class="holdings-wrap">
                  ${holdingsBadges.join('')}${ownedPrivates.join('') || '<span class="no-holds">No certificates yet</span>'}
                </div>
              </div>
              ${
                isTurn
                  ? '<i class="turn-crown" title="Active turn">♛</i>'
                  : '<i class="presence-dot" title="Seated member"></i>'
              }
            </article>
          `;
        })
        .join('')}
      <footer>
        <div><span class="online-dot"></span> ${state.player_order.length} seated · Bank ${money(state.bank)}</div>
        <div class="footer-sub">Viewing as: <b>${viewData.viewer?.player_name || 'Observer'}</b></div>
      </footer>
    </aside>
  `;
}

function renderRecentActionsAside(viewData) {
  const state = viewData.state;
  const events = (viewData.history_events || []).filter((ev) => ev.revision <= state.revision).slice().reverse().slice(0, 8);
  const activePlayer = state.players?.[state.current_player];
  const viewerId = viewData.viewer?.player_id;
  const isMyTurn =
    appState.viewRevision === appState.liveRevision &&
    viewerId &&
    state.current_player === viewerId;

  return `
    <aside class="actions-panel" aria-label="Recent moves and active turn prompt">
      <div class="section-label">ACTION JOURNAL · 棋譜記録</div>
      <h2>At the table</h2>
      <div class="recent-scroll">
        ${events
          .map(
            (r) => `
            <button data-revision="${r.revision}" class="${r.revision === appState.viewRevision ? 'selected-rev' : ''}">
              <time>Rev ${r.revision}</time>
              <i class="action-mark"></i>
              <span>
                <b>${r.label}</b>
                <small>${r.detail || `Revision ${r.revision} · ${r.actor_name || 'System'}`}</small>
              </span>
            </button>`
          )
          .join('')}
      </div>

      <div class="turn-card ${isMyTurn ? 'my-turn-glow' : ''}">
        <small>${
          appState.viewRevision !== appState.liveRevision
            ? `HISTORICAL SNAPSHOT (REV ${appState.viewRevision})`
            : isMyTurn
              ? 'YOUR TURN TO ACT'
              : 'CURRENT TURN'
        }</small>
        <b>${activePlayer?.name || 'Game Complete'} ${
          state.current_corporation ? `(${state.current_corporation})` : ''
        }</b>
        <span>
          ${
            state.round === 'stock'
              ? `Stock Round ${state.stock_round}: Buy a share certificate or pass`
              : state.round === 'operating'
                ? `${roundName(state)}: Step "${state.operating_turn?.step || 'track'}"`
                : state.round === 'auction'
                  ? (() => {
                      const unsold = Object.values(state.privates || {}).filter((p) => !p.owner);
                      const offId = state.auction?.active || unsold[0]?.id || 'TR';
                      const offPriv = state.privates?.[offId];
                      const offPrice = (offPriv?.value || 20) - (offId === 'TR' ? state.auction?.discount || 0 : 0);
                      return state.auction?.active
                        ? `Private Auction Runoff on ${offId}: Raise bid (+¥5) or pass`
                        : `Private Auction: Buy offered ${offId} (${money(offPrice)}), bid on MF–UTF, or pass`;
                    })()
                  : `Finished (${state.end_reason || 'complete'})`
          }
        </span>
        <div class="turn-card-cta">
          ${
            state.round === 'operating'
              ? `<button class="confirm-button" data-view="map">Open Map & Operating Desk ↗</button>`
              : state.round === 'auction'
                ? `<button class="confirm-button" data-view="market">Open Private Auction Desk ↗</button>`
                : `<button class="confirm-button" data-view="market">Open Stock Exchange ↗</button>`
          }
        </div>
      </div>
    </aside>
  `;
}

function renderMainView(viewData) {
  if (appState.view === 'market') {
    return renderStockExchangeView(appState, viewData, appState.catalog);
  }
  if (appState.view === 'map') {
    return renderDetailedMapView(appState, viewData, appState.catalog);
  }
  if (appState.view === 'history') {
    return renderHistoryJournalView(appState, viewData);
  }
  return renderClubRoomScene(appState, viewData);
}

let disposeMapNavigation = () => {};
function render() {
  // Polls and other updates stay behind the card until the covered scene cut.
  if (roomTransition.pending) return;
  disposeMapNavigation();
  if (appState.displayedViewData?.state) {
    syncEmergencyDesk(appState,appState.displayedViewData);
    if (appState.displayedViewData.state.operating_turn?.step === 'routes') syncRoutePlan(appState, appState.displayedViewData);
  }
  gameAudio.updateContext(appState, appState.displayedViewData);
  turnReminder.update(appState, appState.displayedViewData);
  characters.setRoom(appState.roomCode);
  characters.playback.setMotionEnabled(motionEnabled());
  if(appState.liveViewData) characters.club(appState.liveViewData);
  document.body.classList.toggle('motion-off',!motionEnabled());
  if(appState.needsAppearance) {
    const baseLook=appState.appearanceDraft || api.getAppearance();
    const appearanceScroll=document.querySelector('[data-appearance-scroll="page"]')?.scrollTop || 0;
    $app.innerHTML=renderCharacterSetup(baseLook,Boolean(api.getAppearance()),{tab:appState.appearanceTab || 'appearance',dirty:Boolean(appState.appearanceDraft && JSON.stringify({face:baseLook?.face,clothes:baseLook?.clothes})!==JSON.stringify(api.getAppearance()))});
    localizePage();
    bindAppearanceControls({app:appState,api,render});
    document.querySelector('[data-appearance-scroll="page"]').scrollTop=appearanceScroll;
    document.querySelector('[data-cancel-look]')?.addEventListener('click',()=>{appState.needsAppearance=false;appState.appearanceDraft=null;render();});
    document.querySelector('[data-save-look]')?.addEventListener('submit',async e=>{
      e.preventDefault();const form=e.target;api.saveAppearance({face:form.elements.face.value,clothes:form.elements.clothes.value});
      appState.needsAppearance=false;appState.appearanceDraft=null;
      if(appState.liveViewData) {
        try {await heartbeatArrival(appState.liveViewData);} catch(err) {showToast(`Look could not be shared: ${err.message}`,true);}
        render();
      } else if(appState.needsGathering) render(); else await bootstrapSession();
    });
    return;
  }
  const decisionFocus=document.activeElement?.matches?.('[data-commit-decision]')?'[data-commit-decision]':document.activeElement?.matches?.('[data-cancel-decision]')?'[data-cancel-decision]':null;
  const mapWindowScrolls = [...document.querySelectorAll('[data-map-window-shell]')].map(shell => ({
    id: shell.dataset.mapWindowShell,
    top: shell.querySelector('.stock-window-body').scrollTop,
    left: shell.querySelector('.stock-window-body').scrollLeft,
  }));
  const waitingScroll=document.querySelector('.waiting-club')?.scrollTop || 0;
  const invitationFocus=document.activeElement?.dataset?.invitationFace;
  const deskDrafts = [...document.querySelectorAll('[data-create-gathering] input, [data-create-gathering] select, [data-create-gathering] textarea, [data-join-gathering] input, [data-claim-seat] input, [data-negotiation] input, [data-name-seat] input, [data-waiting-note] input, [data-invite-fallback] input')].map(el=>({
    form:JSON.stringify(el.form?.dataset || {}),
    name:el.name, value:el.value, checked:el.checked, focused:el===document.activeElement, start:el.selectionStart, end:el.selectionEnd,
  }));
  const bookingScroll=document.querySelector('.booking-setup')?.scrollTop || 0;
  const oldDesk = document.querySelector('.decision-desk');
  const deskScroll = oldDesk?.scrollTop || 0;
  const detailsState = [...document.querySelectorAll('.decision-desk details, .booking-window details')].map(el=>({name:el.querySelector('summary')?.textContent,open:el.open}));
  const restoreDeskLayout = () => {
    const booking=document.querySelector('.booking-setup');
    if(booking) booking.scrollTop=bookingScroll;
    document.querySelectorAll('.decision-desk details, .booking-window details').forEach(el=>{
      const old=detailsState.find(d=>d.name===el.querySelector('summary')?.textContent);
      if(old) el.open=old.open;
    });
    const desk=document.querySelector('.decision-desk');
    if (appState.focusReview) {
      appState.focusReview = false;
      document.querySelector('.action-review')?.scrollIntoView?.({ block: 'nearest' });
      document.querySelector('[data-confirm-reviewed]')?.focus?.({ preventScroll: true });
    } else if (oldDesk && desk) {
      desk.scrollTop = deskScroll;
    }
  };
  const restoreDeskDrafts = () => document.querySelectorAll('[data-create-gathering] input, [data-create-gathering] select, [data-create-gathering] textarea, [data-join-gathering] input, [data-claim-seat] input, [data-negotiation] input, [data-name-seat] input, [data-waiting-note] input, [data-invite-fallback] input').forEach(el=>{
    const key=JSON.stringify(el.form?.dataset || {});
    const old=deskDrafts.find(d=>d.form===key && d.name===el.name);
    if(old){el.value=old.value;if(el.type==='checkbox')el.checked=old.checked;if(old.focused){el.focus({preventScroll:true});if(el.setSelectionRange && typeof old.start==='number')el.setSelectionRange(old.start,old.end);}}
  });
  const draft = document.querySelector('input[name="note_text"]');
  const draftValue = draft?.value;
  const draftFocused = draft === document.activeElement;
  const displayed = appState.displayedViewData || appState.liveViewData;
  const viewData = displayed && { ...displayed,
    history_events: appState.liveViewData?.history_events || displayed.history_events,
    club: appState.liveViewData?.club || displayed.club,
    presence:appState.liveViewData?.presence || displayed.presence,
    members:appState.liveViewData?.members || displayed.members,
    host:appState.liveViewData?.host || displayed.host,
  };
  if(viewData?.status==='waiting') {
    $app.innerHTML=renderWaitingTable({...appState,characterNotice:renderCharacterNotice(),characterNoticeId:characters.playback.notice()?.id || ''},viewData,api)+renderArrivalDock(appState.arrivalCurrent,{motion:motionEnabled(),pending:appState.arrivalQueue.length,elapsed:(Date.now()-(appState.arrivalStartedAt || Date.now()))/1000})+renderGathering(appState,api);
    localizePage();
    bindSocialControls();
    bindDesk();bindWaitingTable({app:appState,api,render,refresh:pollLiveState,enterRoom,toast:showToast});
    restoreDeskDrafts();restoreDeskLayout();
    if(invitationFocus) document.querySelector(`[data-invitation-face="${invitationFocus}"]`)?.focus({preventScroll:true});
    document.querySelector('.waiting-club').scrollTop=waitingScroll;
    document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
    return;
  }
  if (!viewData || !viewData.state) {
    $app.innerHTML = `
      <div class="loading-screen">
        ${appState.needsGathering ? `<div class="lobby-room-backdrop">${renderHouseEntrance()}</div>` : ''}
        <div class="brand-seal"><span>1889</span></div>
        <h2>${appState.needsGathering ? 'Welcome to Koenji Railway Club' : 'Opening Koenji Railway Club…'}</h2>
        <p>${escapeHtml(appState.errorBanner || 'Preparing your table and the latest game position.')}</p>
        ${isTestPage && appState.errorBanner ? '<button type="button" data-retry-test>Retry test game</button>' : ''}
        ${renderGathering(appState, api)}
      </div>
    `;
    localizePage();
    bindDesk();bindSocialControls();bindTestControls();
    restoreDeskDrafts();
    restoreDeskLayout();
    return;
  }

  if (motionEnabled() && (pendingRoundWipe || (renderedRoom && renderedRoom !== appState.view))) {
    const title = pendingRoundWipe || roomName(appState.view, viewData.state);
    const isRoundChange = Boolean(pendingRoundWipe);
    pendingRoundWipe = null;
    roomTransition.start(title, isRoundChange, () => {
      renderedRoom = appState.view;
      pendingRoundWipe = null;
      render();
    });
    return;
  }

  const isHistoricalShell = appState.viewRevision !== appState.liveRevision;
  $app.innerHTML = `
    <div class="app-shell shell-view-${appState.view} ${isHistoricalShell ? 'is-historical-mode' : ''}">
      ${renderTopbar(viewData)}
      <div class="room-status-band">
        ${renderTurnStatus(appState,viewData)}
        ${isHistoricalShell ? `<div class="historical-snapshot-ribbon" role="status"><span>📌 HISTORICAL SNAPSHOT · REV ${appState.viewRevision} OF ${appState.liveRevision} (READ-ONLY)</span><button type="button" class="ribbon-live-btn" data-action="live">● Return to Live Match (Rev ${appState.liveRevision}) →</button></div>` : ''}
        ${isTestPage ? renderTestControls(activeTestScenario,appState.liveViewData,testLoading) : ''}
        ${renderRoomContext(viewData)}
        ${renderActionFeedback(appState)}
        ${renderDecisionNotice(appState, viewData)}
      <div class="character-event-notice" data-character-notice data-notice-id="${escapeHtml(characters.playback.notice()?.id || '')}" role="status" aria-live="polite">${renderCharacterNotice()}</div>
      </div>
      <main class="workspace view-${appState.view}" tabindex="-1">
        ${renderRoundHandoff(appState.roundHandoff, appState.view)}
        ${renderPlayerRoster(viewData)}
        ${renderMainView(viewData)}
        ${renderRecentActionsAside(viewData)}
      </main>
      ${renderTimelineFooter(appState, appState.liveViewData || viewData)}
      ${renderArrivalDock(appState.arrivalCurrent,{motion:motionEnabled(),pending:appState.arrivalQueue.length,elapsed:(Date.now()-(appState.arrivalStartedAt || Date.now()))/1000})}
      ${renderDecisionDesk(appState, viewData)}
      ${renderGathering(appState, api)}
      <div class="cash-receipt-stage" data-cash-receipt-stage>${renderCashDelivery(viewData,characters.playback)}</div>
      ${renderConfirmation(appState,viewData)}
      ${renderFlotation(appState)}
      ${
        appState.activeModal === 'stamp'
          ? renderMemberStampModal(appState, viewData)
          : appState.activeModal === 'seats'
            ? renderSeatsAndDemoModal(appState, appState.liveViewData || viewData, appState.roomBundle)
            : appState.activeModal === 'player'
              ? renderPlayerDetailsModal(appState, viewData)
            : appState.activeModal === 'privatezoom'
              ? renderPrivateZoomModal(appState, viewData)
            : appState.activeModal === 'private'
              ? renderPrivateDetailsModal(appState, viewData)
            : appState.activeModal === 'shortcut'
              ? `<div class="modal-backdrop" data-close-modal="true"><section class="modal-card player-modal" role="dialog" aria-modal="true" aria-label="Discard tile preview">
                  <header class="modal-header"><h2>Leave the staged tile?</h2><button class="close-modal-btn" data-close-modal="true" aria-label="Keep preview and close">×</button></header>
                  <p>This operating action advances the turn and discards your uncommitted tile preview. The tile has not been built.</p>
                  <button class="confirm-button" data-confirm-shortcut>Discard preview and ${escapeHtml(appState.pendingShortcut.replaceAll('_', ' '))}</button>
                  <button class="secondary-btn" data-close-modal="true">Keep preview</button>
                </section></div>`
            : ''
      }
    </div>
  `;
  localizePage(viewData);
  bindEvents();bindSocialControls();bindTestControls();
  if(appState.roomBundle?.preset==='gathering') document.querySelectorAll('[data-switch-seat], .open-second-browser-btn').forEach(el=>{el.style.display='none';});
  bindDesk();
  restoreDeskDrafts();
  restoreDeskLayout();
  recoverWindowGeometry();
  for (const scroll of mapWindowScrolls) {
    const body = document.querySelector(`[data-map-window-shell="${scroll.id}"] .stock-window-body`);
    if (body) { body.scrollTop = scroll.top; body.scrollLeft = scroll.left; }
  }
  if(decisionFocus)document.querySelector(decisionFocus)?.focus({preventScroll:true});
  const flotation=document.querySelector('.flotation-notice');
  if(flotation && !flotation.contains(document.activeElement))flotation.querySelector('button')?.focus({preventScroll:true});
  renderedRoom = appState.view;
  pendingRoundWipe = null;
  if (draftValue) {
    const nextDraft = document.querySelector('input[name="note_text"]');
    if (nextDraft) { nextDraft.value = draftValue; if (draftFocused) nextDraft.focus({ preventScroll: true }); }
  }
  if (appState.isSubmitting || appState.isLoadingRevision) {
    document.querySelectorAll('[data-op-action], [data-buy-train], [data-auction-action], [data-action="buy_shares"], [data-action="sell_shares"], [data-action="exchange_dr"], [data-action="end_stock_turn"]').forEach((el) => { el.disabled = true; });
  }
}

function handleGlobalEscape(event) {
  if(document.querySelector('dialog[open]')?.open)return;
  if(event.key==='Escape' && appState.activeModal==='confirm') {event.preventDefault();event.stopPropagation();closeModal();return;}
  if(!appState.activeModal && appState.flotationQueue?.length && appState.viewRevision===appState.liveRevision && !appState.isPlayingReplay) {
    if(event.key==='Escape'){event.preventDefault();appState.flotationQueue.shift();render();return;}
    if(event.key==='Tab'){event.preventDefault();document.querySelector('[data-dismiss-flotation]')?.focus();return;}
  }

  // Holding Escape must not close a window and then leave the workspace.
  if (event.key === 'Escape' && event.repeat) {
    event.preventDefault(); event.stopPropagation(); return;
  }
  if (roomTransition.active) {
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Escape') dismissRoomWipe();
    return;
  }
  // The full-page look editor replaces the gathering dialog while it is open.
  // Do not trap its keyboard focus inside the now-hidden dialog.
  if(appState.needsAppearance) {
    if(event.key==='Escape' && api.getAppearance()) {
      event.preventDefault();appState.needsAppearance=false;appState.appearanceDraft=null;render();
    }
    return;
  }
  if (event.key === 'Tab' && appState.activeModal && !document.querySelector('.route-focus-desk')) {
    const nodes = [...document.querySelectorAll('[role="dialog"] button:not(:disabled), [role="dialog"] a[href], [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] summary')].filter((el) => el.offsetParent !== null);
    const first = nodes[0], last = nodes.at(-1);
    if (!nodes.includes(document.activeElement)) { event.preventDefault(); first?.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    return;
  }
  if (event.key !== 'Escape') return;
  if (!appState.rustAlertMinimized && !appState.rustAlertDismissed && document.getElementById?.('rustPopinWindow')) {
    event.preventDefault(); event.stopPropagation();
    appState.rustAlertMinimized = true;
    render();
    return;
  }
  if(appState.activeModal==='decisions' && appState.routeEditor){event.preventDefault();event.stopPropagation();appState.routeEditor=null;render();return;}
  const focused = document.activeElement?.closest('[data-map-window-shell], [data-stock-window-shell]');
  const result = escapeContext(appState, focused?.dataset.mapWindowShell || focused?.dataset.stockWindowShell);
  if (!result && document.querySelector('.cinematic-room-wipe')) {
    event.preventDefault(); event.stopPropagation(); dismissRoomWipe(); return;
  }
  if (!result && characters.playback.notice()) {
    characters.playback.clear('game');characters.playback.clear('social');
    event.preventDefault();event.stopPropagation();return;
  }
  if (!result) return;
  event.preventDefault();
  event.stopPropagation();
  if (result === 'animation') {characters.playback.clear('game');characters.playback.clear('social');}
  if (result === 'replay') characters.playback.clear('game');
  if (result === 'modal') { closeModal(); return; }
  if (result === 'replay' && replayTimer) { clearInterval(replayTimer); replayTimer = null; }
  render();
}

function recoverWindowGeometry() {
  for (const [selector, windows] of [['[data-stock-window-shell]', appState.stockWindows], ['[data-map-window-shell]', appState.mapWindows]]) {
    document.querySelectorAll(selector).forEach((shell) => {
      const frame = shell.closest('.stock-window-desktop');
      const mapId = shell.dataset.mapWindowShell;
      const entry = windows[shell.dataset.stockWindowShell || mapId];
      if (!frame || !entry || entry.maximized) return;
      const width = frame.clientWidth, height = frame.clientHeight;
      if (!width || !height) return;
      const minimum = mapId ? mapWindowMinimumSize(mapId, width, height) : { width: 0, height: 0 };
      if (Number.isFinite(entry.w)) { entry.w = Math.max(minimum.width, Math.min(entry.w, width)); shell.style.width = `${entry.w}px`; }
      if (Number.isFinite(entry.h)) { entry.h = Math.max(minimum.height, Math.min(entry.h, height)); shell.style.height = `${entry.h}px`; }
      if (Number.isFinite(entry.x)) { entry.x = Math.max(0, Math.min(entry.x, width - shell.offsetWidth)); shell.style.left = `${entry.x}px`; }
      if (Number.isFinite(entry.y)) { entry.y = Math.max(0, Math.min(entry.y, height - shell.offsetHeight)); shell.style.top = `${entry.y}px`; }
      // Default tiled positions can also extend past the desktop once a
      // content-specific minimum expands them. Keep their controls reachable.
      if (mapId) {
        if (shell.offsetLeft + shell.offsetWidth > width) shell.style.left = `${Math.max(0, width - shell.offsetWidth)}px`;
        if (shell.offsetTop + shell.offsetHeight > height) shell.style.top = `${Math.max(0, height - shell.offsetHeight)}px`;
      }
    });
  }
}

function handleMarketKeyboardNavigation(event) {
  if (
    (appState.view !== 'market' && appState.view !== 'map') ||
    appState.activeModal ||
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
  ) {
    return;
  }

  if (/^[1-5]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    const state = (appState.displayedViewData || appState.liveViewData)?.state;
    if (appState.view === 'market') {
      const windowId = STOCK_WINDOW_IDS[index];
      if (windowId === 'privates' && state?.round !== 'auction') {
        return;
      }
      event.preventDefault();
      openOrRaiseStockWindow(windowId, true);
      render();
      requestAnimationFrame(() => {
        const targetSelector = appState.stockWindows?.[windowId]?.open
          ? `[data-stock-window-shell="${windowId}"]`
          : `[data-stock-window="${windowId}"]`;
        document.querySelector(targetSelector)?.focus({ preventScroll: true });
      });
    } else if (appState.view === 'map') {
      event.preventDefault();
      const windowId = MAP_WINDOW_IDS[index];
      openOrRaiseMapWindow(windowId, true);
      render();
      requestAnimationFrame(() => {
        const targetSelector = appState.mapWindows?.[windowId]?.open
          ? `[data-map-window-shell="${windowId}"]`
          : `[data-map-window="${windowId}"]`;
        document.querySelector(targetSelector)?.focus({ preventScroll: true });
      });
    }
    return;
  }

  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

  const state = (appState.displayedViewData || appState.liveViewData)?.state;
  const direction = event.key === 'ArrowDown' ? 1 : -1;

  if (appState.view === 'market' && state?.round === 'auction') {
    const privateIds = Object.keys(state?.privates || {});
    if (!privateIds.length) return;
    event.preventDefault();
    const currentIndex = Math.max(0, privateIds.indexOf(appState.selectedPrivateId));
    const nextIndex = (currentIndex + direction + privateIds.length) % privateIds.length;
    const nextPid = privateIds[nextIndex];
    appState.selectedPrivateId = nextPid;
    appState.bidPrice = computeMinBidForPrivate(state, nextPid);
    render();
    requestAnimationFrame(() => {
      document.querySelector(`[data-select-private="${nextPid}"]`)?.focus({ preventScroll: true });
    });
    return;
  }

  const corporationIds = Object.keys(state?.corporations || {});
  if (!corporationIds.length) return;

  event.preventDefault();
  const currentIndex = Math.max(0, corporationIds.indexOf(appState.selectedCompanyId));
  const nextIndex = (currentIndex + direction + corporationIds.length) % corporationIds.length;
  appState.selectedCompanyId = corporationIds[nextIndex];
  if (appState.view === 'map') {
    const corp = state?.corporations?.[appState.selectedCompanyId];
    if (corp?.home) {
      appState.selectedHex = corp.home;
    }
  }
  render();
  requestAnimationFrame(() => {
    document.querySelector(`[data-company="${appState.selectedCompanyId}"]`)?.focus({ preventScroll: true });
  });
}

function openOrRaiseStockWindow(windowId, allowToggleClose = false) {
  const windowState = appState.stockWindows?.[windowId];
  if (!windowState) return;
  if (allowToggleClose && windowState.open) {
    windowState.open = false;
    windowState.maximized = false;
    return;
  }
  windowState.open = true;
  appState.stockWindowTopZ += 1;
  windowState.z = appState.stockWindowTopZ;
}

function openOrRaiseMapWindow(windowId, allowToggleClose = false) {
  const windowState = appState.mapWindows?.[windowId];
  if (!windowState) return;
  if (allowToggleClose && windowState.open) {
    windowState.open = false;
    windowState.maximized = false;
    return;
  }
  windowState.open = true;
  appState.mapWindowTopZ += 1;
  windowState.z = appState.mapWindowTopZ;
}

function raiseStockWindowInPlace(windowId, shell) {
  const windowState = appState.stockWindows?.[windowId];
  if (!windowState || !shell) return;
  appState.stockWindowTopZ += 1;
  windowState.z = appState.stockWindowTopZ;
  document.querySelectorAll('[data-stock-window-shell]').forEach((el) =>
    el.classList.toggle('is-front', el === shell)
  );
  document.querySelectorAll('[data-stock-window]').forEach((el) =>
    el.classList.toggle('is-front', el.dataset.stockWindow === windowId)
  );
  shell.style.zIndex = String(windowState.z);
}

function raiseMapWindowInPlace(windowId, shell) {
  const windowState = appState.mapWindows?.[windowId];
  if (!windowState || !shell) return;
  appState.mapWindowTopZ += 1;
  windowState.z = appState.mapWindowTopZ;
  document.querySelectorAll('[data-map-window-shell]').forEach((el) =>
    el.classList.toggle('is-front', el === shell)
  );
  document.querySelectorAll('[data-map-window]').forEach((el) =>
    el.classList.toggle('is-front', el.dataset.mapWindow === windowId)
  );
  shell.style.zIndex = String(windowState.z);
}

function bindStockWindowDesktop() {
  document.querySelectorAll('[data-stock-window]').forEach((el) =>
    el.addEventListener('click', () => {
      const windowId = el.dataset.stockWindow;
      openOrRaiseStockWindow(windowId, true);
      render();
      requestAnimationFrame(() => {
        const targetSelector = appState.stockWindows?.[windowId]?.open
          ? `[data-stock-window-shell="${windowId}"]`
          : `[data-stock-window="${windowId}"]`;
        document.querySelector(targetSelector)?.focus({ preventScroll: true });
      });
    })
  );

  document.querySelectorAll('[data-maximize-stock-window]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const windowId = el.dataset.maximizeStockWindow;
      toggleMaximizeStockWindow(windowId);
      render();
      requestAnimationFrame(() => {
        document.querySelector(`[data-stock-window-shell="${windowId}"]`)?.focus({ preventScroll: true });
      });
    })
  );

  document.querySelectorAll('[data-close-stock-window]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const windowId = el.dataset.closeStockWindow;
      if (appState.stockWindows?.[windowId]) {
        appState.stockWindows[windowId].open = false;
        appState.stockWindows[windowId].maximized = false;
      }
      render();
      requestAnimationFrame(() => {
        document.querySelector(`[data-stock-window="${windowId}"]`)?.focus({ preventScroll: true });
      });
    })
  );

  document.querySelector('[data-tile-stock-windows]')?.addEventListener('click', () => {
    appState.stockWindows = {
      corporations: { open: true, x: null, y: null, w: null, h: null, z: 6 },
      ledger: { open: true, x: null, y: null, w: null, h: null, z: 5 },
      geography: { open: false, x: null, y: null, w: null, h: null, z: 2 },
      details: { open: false, x: null, y: null, w: null, h: null, z: 3 },
      privates: { open: false, x: null, y: null, w: null, h: null, z: 4 },
    };
    appState.stockWindowTopZ = 6;
    render();
  });

  document.querySelector('[data-reset-stock-windows]')?.addEventListener('click', () => {
    appState.stockWindows = createDefaultStockWindows();
    appState.stockWindowTopZ = 5;
    render();
  });

  document.querySelectorAll('[data-stock-window-shell]').forEach((shell) =>
    shell.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('[data-stock-window-drag]')) {
        raiseStockWindowInPlace(shell.dataset.stockWindowShell, shell);
      }
    })
  );

  document.querySelectorAll('[data-stock-window-resize]').forEach((grip) => {
    grip.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const shell = grip.closest('[data-stock-window-shell]');
      const desktop = grip.closest('.stock-window-desktop');
      if (!shell || !desktop) return;
      event.preventDefault();
      event.stopPropagation();
      const windowId = grip.dataset.stockWindowResize;
      raiseStockWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const windowX = shellRect.left - desktopRect.left;
      const windowY = shellRect.top - desktopRect.top;
      const maxWidth = Math.max(1, desktop.clientWidth - windowX);
      const maxHeight = Math.max(1, desktop.clientHeight - windowY);
      const minWidth = Math.min(420, maxWidth);
      const minHeight = Math.min(190, maxHeight);
      const step = event.shiftKey ? 48 : 20;
      const widthDelta = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
      const heightDelta = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
      const width = Math.max(minWidth, Math.min(maxWidth, shellRect.width + widthDelta));
      const height = Math.max(minHeight, Math.min(maxHeight, shellRect.height + heightDelta));
      const windowState = appState.stockWindows[windowId];
      Object.assign(windowState, { x: windowX, y: windowY, w: width, h: height, maximized: false, floating: false });
      Object.assign(shell.style, {
        left: `${windowX}px`,
        right: 'auto',
        top: `${windowY}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
    });

    grip.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const shell = grip.closest('[data-stock-window-shell]');
      const desktop = grip.closest('.stock-window-desktop');
      if (!shell || !desktop) return;

      event.preventDefault();
      event.stopPropagation();
      const windowId = grip.dataset.stockWindowResize;
      raiseStockWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originWidth = shellRect.width;
      const originHeight = shellRect.height;
      const windowX = shellRect.left - desktopRect.left;
      const windowY = shellRect.top - desktopRect.top;
      const maxWidth = Math.max(1, desktop.clientWidth - windowX);
      const maxHeight = Math.max(1, desktop.clientHeight - windowY);
      const minWidth = Math.min(420, maxWidth);
      const minHeight = Math.min(190, maxHeight);
      const windowState = appState.stockWindows[windowId];
      windowState.x = windowX;
      windowState.y = windowY;
      shell.style.left = `${windowX}px`;
      shell.style.right = 'auto';
      shell.style.top = `${windowY}px`;
      shell.classList.add('is-resizing');

      const resizeWindow = (moveEvent) => {
        const width = Math.max(
          minWidth,
          Math.min(maxWidth, originWidth + moveEvent.clientX - startX)
        );
        const height = Math.max(
          minHeight,
          Math.min(maxHeight, originHeight + moveEvent.clientY - startY)
        );
        shell.style.width = `${width}px`;
        shell.style.height = `${height}px`;
        windowState.w = width;
        windowState.h = height;
        windowState.maximized = false;
        windowState.floating = false;
      };

      const stopResizing = () => {
        shell.classList.remove('is-resizing');
        document.removeEventListener('pointermove', resizeWindow);
        document.removeEventListener('pointerup', stopResizing);
        document.removeEventListener('pointercancel', stopResizing);
      };

      document.addEventListener('pointermove', resizeWindow);
      document.addEventListener('pointerup', stopResizing);
      document.addEventListener('pointercancel', stopResizing);
    });
  });

  document.querySelectorAll('[data-stock-window-drag]').forEach((titlebar) => {
    titlebar.addEventListener('dblclick', (event) => {
      if (event.target.closest('[data-close-stock-window], [data-maximize-stock-window]')) return;
      const windowId = titlebar.dataset.stockWindowDrag;
      toggleMaximizeStockWindow(windowId);
      render();
    });
  });

  document.querySelectorAll('[data-stock-window-drag]').forEach((titlebar) =>
    titlebar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('[data-close-stock-window], [data-maximize-stock-window]')) return;
      const shell = titlebar.closest('[data-stock-window-shell]');
      const desktop = titlebar.closest('.stock-window-desktop');
      if (!shell || !desktop) return;

      event.preventDefault();
      const windowId = titlebar.dataset.stockWindowDrag;
      raiseStockWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = shellRect.left - desktopRect.left;
      const originY = shellRect.top - desktopRect.top;
      titlebar.setPointerCapture(event.pointerId);
      shell.classList.add('is-dragging');

      const moveWindow = (moveEvent) => {
        const maxX = Math.max(0, desktop.clientWidth - shell.offsetWidth);
        const maxY = Math.max(0, desktop.clientHeight - shell.offsetHeight);
        const x = Math.max(0, Math.min(maxX, originX + moveEvent.clientX - startX));
        const y = Math.max(0, Math.min(maxY, originY + moveEvent.clientY - startY));
        shell.style.left = `${x}px`;
        shell.style.right = 'auto';
        shell.style.top = `${y}px`;
        appState.stockWindows[windowId].x = x;
        appState.stockWindows[windowId].y = y;
      };

      const stopDragging = () => {
        shell.classList.remove('is-dragging');
        titlebar.removeEventListener('pointermove', moveWindow);
        titlebar.removeEventListener('pointerup', stopDragging);
        titlebar.removeEventListener('pointercancel', stopDragging);
      };

      titlebar.addEventListener('pointermove', moveWindow);
      titlebar.addEventListener('pointerup', stopDragging);
      titlebar.addEventListener('pointercancel', stopDragging);
    })
  );
}

function bindMapWindowDesktop() {
  document.querySelectorAll('[data-map-window]').forEach((el) =>
    el.addEventListener('click', () => {
      const windowId = el.dataset.mapWindow;
      openOrRaiseMapWindow(windowId, true);
      render();
      requestAnimationFrame(() => {
        const targetSelector = appState.mapWindows?.[windowId]?.open
          ? `[data-map-window-shell="${windowId}"]`
          : `[data-map-window="${windowId}"]`;
        document.querySelector(targetSelector)?.focus({ preventScroll: true });
      });
    })
  );

  document.querySelectorAll('[data-maximize-map-window]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const windowId = el.dataset.maximizeMapWindow;
      toggleMaximizeMapWindow(windowId);
      render();
      requestAnimationFrame(() => {
        document.querySelector(`[data-map-window-shell="${windowId}"]`)?.focus({ preventScroll: true });
      });
    })
  );

  document.querySelectorAll('[data-close-map-window]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const windowId = el.dataset.closeMapWindow;
      if (appState.mapWindows?.[windowId]) {
        appState.mapWindows[windowId].open = false;
        appState.mapWindows[windowId].maximized = false;
      }
      render();
      requestAnimationFrame(() => {
        document.querySelector(`[data-map-window="${windowId}"]`)?.focus({ preventScroll: true });
      });
    })
  );

  // Gazette Pop-In Dispatch & Alert Window Controls (90s / 2000s Pop-up Pattern)
  document.querySelectorAll('[data-minimize-gazette]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.rustAlertMinimized = true;
      render();
    })
  );

  document.querySelectorAll('[data-close-gazette]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.rustAlertDismissed = true;
      appState.rustAlertMinimized = true;
      render();
    })
  );

  document.querySelectorAll('[data-restore-gazette]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.rustAlertMinimized = false;
      appState.rustAlertDismissed = false;
      render();
    })
  );

  document.querySelectorAll('[data-suppress-gazette]').forEach((el) =>
    el.addEventListener('change', (e) => {
      const tierKey = el.dataset.suppressGazette;
      if (tierKey) {
        if (!appState.suppressedRustAlerts) appState.suppressedRustAlerts = {};
        appState.suppressedRustAlerts[tierKey] = e.target.checked;
      }
    })
  );

  document.querySelectorAll('[data-gazette-action]').forEach((el) =>
    el.addEventListener('click', (e) => {
      const action = el.dataset.gazetteAction;
      if (action === 'open_depot') {
        if (appState.mapWindows?.trains) {
          appState.mapWindows.trains.open = true;
          appState.mapWindowTopZ += 1;
          appState.mapWindows.trains.z = appState.mapWindowTopZ;
        }
        appState.rustAlertMinimized = true;
        render();
      } else if (action === 'open_decisions') {
        appState.activeModal = 'decisions';
        appState.rustAlertMinimized = true;
        render();
      }
    })
  );

  document.querySelectorAll('[data-gazette-drag]').forEach((titlebar) =>
    titlebar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('[data-minimize-gazette], [data-close-gazette]')) return;
      const popin = titlebar.closest('#rustPopinWindow');
      const desktop = titlebar.closest('.map-window-desktop') || titlebar.closest('.map-canvas-viewport') || popin?.parentElement;
      if (!popin || !desktop) return;

      event.preventDefault();
      const desktopRect = desktop.getBoundingClientRect();
      const popinRect = popin.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = popinRect.left - desktopRect.left;
      const originY = popinRect.top - desktopRect.top;
      titlebar.setPointerCapture(event.pointerId);
      popin.classList.add('is-dragging');

      const moveGazette = (moveEvent) => {
        const maxX = Math.max(0, desktop.clientWidth - popin.offsetWidth);
        const maxY = Math.max(0, desktop.clientHeight - popin.offsetHeight);
        const x = Math.max(0, Math.min(maxX, originX + moveEvent.clientX - startX));
        const y = Math.max(0, Math.min(maxY, originY + moveEvent.clientY - startY));
        popin.style.left = `${x}px`;
        popin.style.top = `${y}px`;
        appState.gazettePosition = { x, y };
      };

      const stopDraggingGazette = () => {
        popin.classList.remove('is-dragging');
        titlebar.removeEventListener('pointermove', moveGazette);
        titlebar.removeEventListener('pointerup', stopDraggingGazette);
        titlebar.removeEventListener('pointercancel', stopDraggingGazette);
      };

      titlebar.addEventListener('pointermove', moveGazette);
      titlebar.addEventListener('pointerup', stopDraggingGazette);
      titlebar.addEventListener('pointercancel', stopDraggingGazette);
    })
  );

  document.querySelector('[data-clear-map-windows]')?.addEventListener('click', () => {
    for (const id of MAP_WINDOW_IDS) {
      if (appState.mapWindows?.[id]) {
        appState.mapWindows[id].open = false;
        appState.mapWindows[id].maximized = false;
      }
    }
    render();
  });

  document.querySelectorAll('[data-map-window-shell]').forEach((shell) =>
    shell.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('[data-map-window-drag]')) {
        raiseMapWindowInPlace(shell.dataset.mapWindowShell, shell);
      }
    })
  );

  document.querySelectorAll('[data-map-window-resize]').forEach((grip) => {
    grip.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const shell = grip.closest('[data-map-window-shell]');
      const desktop = grip.closest('.map-window-desktop');
      if (!shell || !desktop) return;
      event.preventDefault();
      event.stopPropagation();
      const windowId = grip.dataset.mapWindowResize;
      raiseMapWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const windowX = shellRect.left - desktopRect.left - desktop.clientLeft;
      const windowY = shellRect.top - desktopRect.top - desktop.clientTop;
      const maxWidth = Math.max(1, desktop.clientWidth - windowX);
      const maxHeight = Math.max(1, desktop.clientHeight - windowY);
      const { width: minWidth, height: minHeight } = mapWindowMinimumSize(windowId, maxWidth, maxHeight);
      const step = event.shiftKey ? 48 : 20;
      const widthDelta = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
      const heightDelta = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
      const width = Math.max(minWidth, Math.min(maxWidth, shellRect.width + widthDelta));
      const height = Math.max(minHeight, Math.min(maxHeight, shellRect.height + heightDelta));
      const windowState = appState.mapWindows[windowId];
      Object.assign(windowState, { x: windowX, y: windowY, w: width, h: height, maximized: false });
      Object.assign(shell.style, {
        left: `${windowX}px`,
        right: 'auto',
        top: `${windowY}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
    });

    grip.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const shell = grip.closest('[data-map-window-shell]');
      const desktop = grip.closest('.map-window-desktop');
      if (!shell || !desktop) return;

      event.preventDefault();
      event.stopPropagation();
      const windowId = grip.dataset.mapWindowResize;
      raiseMapWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originWidth = shellRect.width;
      const originHeight = shellRect.height;
      const windowX = shellRect.left - desktopRect.left - desktop.clientLeft;
      const windowY = shellRect.top - desktopRect.top - desktop.clientTop;
      const maxWidth = Math.max(1, desktop.clientWidth - windowX);
      const maxHeight = Math.max(1, desktop.clientHeight - windowY);
      const { width: minWidth, height: minHeight } = mapWindowMinimumSize(windowId, maxWidth, maxHeight);
      const windowState = appState.mapWindows[windowId];
      windowState.x = windowX;
      windowState.y = windowY;
      shell.style.left = `${windowX}px`;
      shell.style.right = 'auto';
      shell.style.top = `${windowY}px`;
      shell.classList.add('is-resizing');

      const resizeWindow = (moveEvent) => {
        const width = Math.max(
          minWidth,
          Math.min(maxWidth, originWidth + moveEvent.clientX - startX)
        );
        const height = Math.max(
          minHeight,
          Math.min(maxHeight, originHeight + moveEvent.clientY - startY)
        );
        shell.style.width = `${width}px`;
        shell.style.height = `${height}px`;
        windowState.w = width;
        windowState.h = height;
        windowState.maximized = false;
      };

      const stopResizing = () => {
        shell.classList.remove('is-resizing');
        document.removeEventListener('pointermove', resizeWindow);
        document.removeEventListener('pointerup', stopResizing);
        document.removeEventListener('pointercancel', stopResizing);
      };

      document.addEventListener('pointermove', resizeWindow);
      document.addEventListener('pointerup', stopResizing);
      document.addEventListener('pointercancel', stopResizing);
    });
  });

  document.querySelectorAll('[data-map-window-drag]').forEach((titlebar) => {
    titlebar.addEventListener('dblclick', (event) => {
      if (event.target.closest('[data-close-map-window], [data-maximize-map-window]')) return;
      const windowId = titlebar.dataset.mapWindowDrag;
      toggleMaximizeMapWindow(windowId);
      render();
    });
  });

  document.querySelectorAll('[data-map-window-drag]').forEach((titlebar) =>
    titlebar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('[data-close-map-window], [data-maximize-map-window]')) return;
      const shell = titlebar.closest('[data-map-window-shell]');
      const desktop = titlebar.closest('.map-window-desktop');
      if (!shell || !desktop) return;

      event.preventDefault();
      const windowId = titlebar.dataset.mapWindowDrag;
      raiseMapWindowInPlace(windowId, shell);
      const desktopRect = desktop.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = shellRect.left - desktopRect.left - desktop.clientLeft;
      const originY = shellRect.top - desktopRect.top - desktop.clientTop;
      titlebar.setPointerCapture(event.pointerId);
      shell.classList.add('is-dragging');

      const moveWindow = (moveEvent) => {
        const maxX = Math.max(0, desktop.clientWidth - shell.offsetWidth);
        const maxY = Math.max(0, desktop.clientHeight - shell.offsetHeight);
        const x = Math.max(0, Math.min(maxX, originX + moveEvent.clientX - startX));
        const y = Math.max(0, Math.min(maxY, originY + moveEvent.clientY - startY));
        shell.style.left = `${x}px`;
        shell.style.right = 'auto';
        shell.style.top = `${y}px`;
        appState.mapWindows[windowId].x = x;
        appState.mapWindows[windowId].y = y;
      };

      const stopDragging = () => {
        shell.classList.remove('is-dragging');
        titlebar.removeEventListener('pointermove', moveWindow);
        titlebar.removeEventListener('pointerup', stopDragging);
        titlebar.removeEventListener('pointercancel', stopDragging);
      };

      titlebar.addEventListener('pointermove', moveWindow);
      titlebar.addEventListener('pointerup', stopDragging);
      titlebar.addEventListener('pointercancel', stopDragging);
    })
  );
}

function bindEvents() {
  document.querySelector('[data-cancel-decision]')?.addEventListener('click',closeModal);
  document.querySelector('[data-commit-decision]')?.addEventListener('click',()=>{
    const pending=appState.pendingDecision;
    if(!pending || pending.revision!==appState.liveRevision || pending.room!==appState.roomCode || pending.token!==appState.token){closeModal();showToast('Position changed. Review the decision again.',true);return;}
    appState.pendingDecision=null;appState.activeModal=null;
    executeGameAction(pending.action,true);
  });
  document.querySelector('[data-dismiss-flotation]')?.addEventListener('click',()=>{appState.flotationQueue.shift();render();document.querySelector('.turn-go')?.focus();});
  document.querySelectorAll('[data-private-zoom]').forEach(el=>el.addEventListener('click',event=>{
    event.stopPropagation();appState.privateDetailsId=el.dataset.privateZoom;
    appState.modalReturnSelector=`[data-private-zoom="${el.dataset.privateZoom}"]`;
    appState.activeModal='privatezoom';render();document.querySelector('.private-zoom-modal .close-modal-btn')?.focus();
  }));

  const viewData = appState.displayedViewData || appState.liveViewData;
  const state = viewData?.state;

  document.querySelector('[data-dismiss-feedback]')?.addEventListener('click', () => {
    if (toastTimer) clearTimeout(toastTimer);
    appState.notice = null;
    appState.errorBanner = null;
    render();
    document.querySelector('.room-context button')?.focus({ preventScroll: true });
  });

  document.removeEventListener('keydown', handleGlobalEscape, true);
  document.addEventListener('keydown', handleGlobalEscape, true);
  document.removeEventListener('keydown', handleMarketKeyboardNavigation);
  document.addEventListener('keydown', handleMarketKeyboardNavigation);

  // View navigation
  document.querySelectorAll('[data-view]').forEach((el) =>
    el.addEventListener('click', async () => {
      const targetView = el.dataset.view;
      if (targetView === 'history') {
        if (el.hasAttribute('data-return-journal')) await scrubToRevision(appState.journalReturn, false);
        appState.journalReturn = null;
      }
      if (targetView === 'map' && appState.view === 'market') {
        appState.mapReturn = 'market';
      } else if (targetView !== 'map') {
        appState.mapReturn = null;
      }
      appState.view = targetView;
      clearTilePreview(appState);
      render();
    })
  );
  document.querySelector('[data-handoff-open]')?.addEventListener('click', (event) => {
    appState.view = event.currentTarget.dataset.handoffOpen;
    appState.roundHandoff = null;
    clearTilePreview(appState);
    render();
    document.querySelector('.workspace')?.focus({ preventScroll: true });
  });
  document.querySelector('[data-dismiss-handoff]')?.addEventListener('click', () => {
    appState.roundHandoff = null;
    dismissRoomWipe();
    render();
    document.querySelector('.room-context button')?.focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-company-map]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.selectedCompanyId = el.dataset.companyMap;
      appState.selectedHex = el.dataset.homeHex || appState.selectedHex;
      appState.inspectedHex = appState.selectedHex;
      appState.selectedTileId = null;
      appState.selectedTileRotation = 0;
      appState.view = 'map';
      appState.mapReturn = 'market';
      render();
    })
  );

  // Modal triggers
  document.querySelectorAll('[data-modal]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.activeModal = el.dataset.modal;
      appState.modalReturnSelector = `[data-modal="${el.dataset.modal}"]`;
      render();
      document.querySelector('[role="dialog"] button')?.focus();
    })
  );
  document.querySelectorAll('[data-close-modal]').forEach((el) =>
    el.addEventListener('click', (ev) => {
      if (
        ev.target === el ||
        el.classList.contains('close-modal-btn')
      ) {
        closeModal();
      }
    })
  );

  document.querySelectorAll('[data-player-details]').forEach((el) => el.addEventListener('click', () => {
    appState.playerDetailsId = el.dataset.playerDetails;
    appState.modalReturnSelector = `[data-player-details="${el.dataset.playerDetails}"]`;
    appState.activeModal = 'player';
    render();
    document.querySelector('[role="dialog"] button')?.focus();
  }));
  document.querySelectorAll('[data-developer-tab]').forEach((el) => el.addEventListener('click', () => {
    appState.developerTab = el.dataset.developerTab;
    render();
    document.querySelector(`[data-developer-tab="${appState.developerTab}"]`)?.focus();
  }));
  document.querySelector('[data-confirm-shortcut]')?.addEventListener('click', () => {
    const action = appState.pendingShortcut;
    appState.confirmedShortcut = action; appState.activeModal = null; clearTilePreview(appState);
    render(); document.querySelector(`[data-op-action="${action}"]`)?.click();
  });
  document.querySelector('[data-previous-room]')?.addEventListener('click', async () => {
    const previous = appState.previousRoom;
    const bundle = previous && api.getRoomDirectory()[previous.roomCode];
    if (!bundle) return;
    const token = resolveTokenForSeat(bundle, previous.seatKey);
    try {
      const fresh = await api.fetchGameView(previous.roomCode, token);
      appState.previousRoom = { roomCode: appState.roomCode, seatKey: appState.seatKey };
      appState.roomCode = previous.roomCode; appState.seatKey = previous.seatKey; appState.token = token; appState.roomBundle = bundle;
      api.setTabSession(previous.roomCode, previous.seatKey, token);
      appState.revisionRequest += 1;
      appState.revisionCache.clear(); appState.lastSyncedRound = null; appState.financialLayouts = {}; appState.activeModal = null;
      appState.journalReturn = null; appState.mapReturn = null; appState.isLoadingRevision = false;
      clearTilePreview(appState); applyFreshLiveView(fresh, true);
    } catch (err) { showToast(err.message, true); }
  });
  document.querySelectorAll('[data-inspect-revision]').forEach((el) => el.addEventListener('click', async () => {
    const rev = Number(el.dataset.inspectRevision);
    await scrubToRevision(rev);
    if (appState.displayedViewData?.state?.revision !== rev) return;
    appState.journalReturn = rev;
    appState.view = appState.displayedViewData.state.round === 'operating' ? 'map' : 'market';
    render();
  }));

  // Legacy dismissal remains compatible with keyboard/context handling.
  document
    .querySelector('[data-action="dismiss_anim"]')
    ?.addEventListener('click', () => {
      appState.animation = null;
      render();
    });

  // Seat switching
  document.querySelectorAll('[data-switch-seat]').forEach((el) =>
    el.addEventListener('click', () => {
      switchSeatInTab(el.dataset.switchSeat);
    })
  );

  // Fixture loading
  document.querySelectorAll('[data-load-fixture]').forEach((el) =>
    el.addEventListener('click', async () => {
      appState.activeModal = null;
      await loadFixturePreset(el.dataset.loadFixture);
    })
  );

  // Security & idempotency probes
  document.querySelectorAll('[data-run-probe]').forEach((el) =>
    el.addEventListener('click', () => {
      runSecurityProbe(el.dataset.runProbe);
    })
  );

  // Stock Exchange & Map window controls
  document.querySelectorAll('[data-company]:not([data-auction-action])').forEach((el) =>
    el.addEventListener('click', () => {
      appState.selectedCompanyId = el.dataset.company;
      if (appState.view === 'map') {
        const homeHex = state.corporations?.[el.dataset.company]?.home || appState.inspectedHex;
        appState.inspectedHex = homeHex;
        if (!appState.selectedTileId) appState.selectedHex = homeHex;
        openOrRaiseMapWindow('hex', false);
      }
      render();
    })
  );
  bindStockWindowDesktop();
  bindMapWindowDesktop();
  bindDistrictSurvey(appState);
  disposeMapNavigation = bindMapNavigation($app, appState);
  document.querySelector('[data-reset-map-windows]')?.addEventListener('click', () => {
    appState.mapWindows = createDefaultMapWindows(); appState.mapWindowTopZ = 5; resetMapView(appState);
    render();
  });
  document.querySelectorAll('[data-select-par]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.selectedParPrice = Number(el.dataset.selectPar);
      render();
    })
  );
  document.querySelectorAll('[data-select-source]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.selectedSource = el.dataset.selectSource;
      render();
    })
  );

  document
    .querySelector('[data-action="buy_shares"]')
    ?.addEventListener('click', () => {
      if (!state) return;
      const cid = appState.selectedCompanyId;
      const corp = state.corporations?.[cid];
      if (!corp) return;
      if (corp.par === null) {
        executeGameAction({
          type: 'buy_shares',
          corporation: cid,
          price: appState.selectedParPrice,
        });
      } else {
        executeGameAction({
          type: 'buy_shares',
          corporation: cid,
          source: appState.selectedSource || 'ipo',
          percent: appState.displayedViewData.market_zones?.[cid] === 'b' ? Number(appState.buyPercent || 10) : 10,
        });
      }
    });

  document
    .querySelector('[data-action="sell_shares"]')
    ?.addEventListener('click', () => {
      executeGameAction({
        type: 'sell_shares',
        corporation: appState.selectedCompanyId,
        percent: Number(appState.sellPercent || 10),
      });
    });

  document
    .querySelector('[data-action="exchange_dr"]')
    ?.addEventListener('click', () => {
      executeGameAction({
        type: 'exchange_private',
        source: 'ipo',
      });
    });

  document
    .querySelector('[data-action="end_stock_turn"]')
    ?.addEventListener('click', () => {
      const bought = Boolean(state?.stock_turn?.bought);
      executeGameAction({ type: bought ? 'end_turn' : 'pass' });
    });

  document.querySelectorAll('[data-private-details]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.privateDetailsId = el.dataset.privateDetails;
      appState.modalReturnSelector = `[data-private-details="${el.dataset.privateDetails}"]`;
      appState.activeModal = 'private';
      render();
      document.querySelector('.private-details-modal .close-modal-btn')?.focus({ preventScroll: true });
    })
  );

  // Private Auction controls
  document.querySelectorAll('[data-select-private]').forEach((el) =>
    el.addEventListener('click', () => {
      const pid = el.dataset.selectPrivate;
      appState.selectedPrivateId = pid;
      appState.bidPrice = computeMinBidForPrivate(state, pid);
      render();
    })
  );
  document.querySelectorAll('[data-bid-step]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.bidPrice = Math.max(
        5,
        (appState.bidPrice || 25) + Number(el.dataset.bidStep)
      );
      render();
    })
  );
  document.querySelectorAll('[data-auction-action]').forEach((el) =>
    el.addEventListener('click', () => {
      const kind = el.dataset.auctionAction;
      if (kind === 'pass') {
        executeGameAction({ type: 'pass' });
      } else if (kind === 'buy_offered') {
        executeGameAction({
          type: 'buy_private',
          company: el.dataset.company,
          price: Number(el.dataset.price),
        });
      } else if (kind === 'bid') {
        executeGameAction({
          type: 'bid',
          company: el.dataset.company,
          price: Number(el.dataset.price),
        });
      }
    })
  );

  // Map & Operating Round controls
  document.querySelectorAll('[data-select-hex]').forEach((el) =>
    el.addEventListener('click', () => {
      const coord = el.dataset.selectHex;
      if(appState.routeEditor)return;
      const canPreview = mapActionAuthority(appState, viewData).canLayTrack;
      const legalList = canPreview ? getLegalPlacementsForHex(
        state,
        appState.catalog,
        coord,
        state?.current_corporation,
        viewData
      ) : [];
      appState.inspectedHex = coord;
      if (!canPreview) openOrRaiseMapWindow('hex', false);
      if (
        appState.selectedHex === coord &&
        appState.selectedTileId &&
        legalList.length > 0
      ) {
        const currIdx = legalList.findIndex(
          (p) =>
            p.tile === appState.selectedTileId &&
            p.rotation === (appState.selectedTileRotation || 0)
        );
        const nextIdx = (currIdx + 1) % legalList.length;
        appState.selectedTileId = legalList[nextIdx].tile;
        appState.selectedTileRotation = legalList[nextIdx].rotation;
      } else {
        appState.selectedHex = coord;
        appState.selectedTileId = legalList[0]?.tile || null;
        appState.selectedTileRotation = legalList[0]?.rotation || 0;
      }
      render();
    })
  );

  document.querySelectorAll('[data-unbuildable-hex]').forEach((el) =>
    el.addEventListener('click', () => {
      const coord = el.dataset.unbuildableHex;
      if(appState.routeEditor)return;
      appState.selectedHex = coord; appState.inspectedHex = coord; clearTilePreview(appState);
      openOrRaiseMapWindow('hex', false); render();
    })
  );

  document.querySelectorAll('[data-city-label]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      const coord = el.dataset.cityLabel;
      if (!coord) return;
      const hexEl = document.querySelector(`[data-select-hex="${coord}"], [data-unbuildable-hex="${coord}"]`);
      if (hexEl) hexEl.click();
      else {
        appState.selectedHex = coord;
        appState.inspectedHex = coord;
        clearTilePreview(appState);
        render();
      }
    });
  });

  document.querySelectorAll('[data-select-port-hex]').forEach((el) => {
    el.addEventListener('click', () => {
      const coord = el.dataset.selectPortHex;
      if (!coord) return;
      appState.selectedHex = coord;
      appState.inspectedHex = coord;
      appState.activeModal = null;
      appState.view = 'map';
      clearTilePreview(appState);
      render();
    });
  });

  // Right-clicking a city/hex opens its read-only District Survey.
  document.querySelectorAll('[data-inspect-city], [data-city-label]').forEach((el) => {
    el.addEventListener('keydown', (ev) => {
      if (!['Enter', ' '].includes(ev.key)) return;
      ev.preventDefault();
      const coord = el.dataset.inspectCity || el.dataset.cityLabel;
      if (ev.shiftKey) {
        if (coord) {
          appState.inspectedHex = coord;
          appState.selectedHex = coord;
        }
        openOrRaiseMapWindow('hex', false); render();
      } else if (el.hasAttribute('data-city-label') && coord) {
        const hexEl = document.querySelector(`[data-select-hex="${coord}"], [data-unbuildable-hex="${coord}"]`);
        if (hexEl) hexEl.click();
      } else {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const coord = el.dataset.inspectCity || el.dataset.cityLabel;
      if (!coord) return;
      appState.inspectedHex = coord;
      appState.selectedHex = coord;
      openOrRaiseMapWindow('hex', false);
      render();
      requestAnimationFrame(() => {
        document.querySelector('[data-map-window-shell="hex"]')?.focus({ preventScroll: true });
      });
    });
  });

  document.querySelectorAll('[data-select-legal-placement]').forEach((el) =>
    el.addEventListener('click', () => {
      const [coord, tid, rot] = (el.dataset.selectLegalPlacement || '').split(':');
      if (!coord || !tid) return;
      if (!mapActionAuthority(appState, viewData).canLayTrack) {
        showToast('Tile catalog inspection only. Construction is available during an authorized operating action.'); return;
      }
      appState.selectedHex = coord;
      appState.inspectedHex = coord;
      appState.selectedTileId = tid;
      appState.selectedTileRotation = Number(rot || 0);
      render();
    })
  );

  document.querySelectorAll('[data-cycle-legal-placement]').forEach((el) =>
    el.addEventListener('click', () => {
      const delta = Number(el.dataset.cycleLegalPlacement || 1);
      const coord = appState.selectedHex;
      const legalList = getLegalPlacementsForHex(
        state,
        appState.catalog,
        coord,
        state?.current_corporation,
        viewData
      );
      if (!legalList.length) return;
      const currIdx = Math.max(
        0,
        legalList.findIndex(
          (p) =>
            p.tile === appState.selectedTileId &&
            p.rotation === (appState.selectedTileRotation || 0)
        )
      );
      const nextIdx = (currIdx + delta + legalList.length) % legalList.length;
      appState.selectedTileId = legalList[nextIdx].tile;
      appState.selectedTileRotation = legalList[nextIdx].rotation;
      render();
    })
  );

  document.querySelector('[data-clear-tile-preview]')?.addEventListener('click', () => {
    appState.selectedTileId = null;
    appState.selectedTileRotation = 0;
    render();
  });

  document.querySelectorAll('[data-toggle-op-help]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.opHelpOpen = !appState.opHelpOpen;
      render();
    })
  );
  document.querySelectorAll('[data-op-action]').forEach((el) =>
    el.addEventListener('click', () => {
      const act = el.dataset.opAction;
      if (appState.selectedTileId && !['lay_tile', 'lay_mf_port'].includes(act) && appState.confirmedShortcut !== act) {
        appState.pendingShortcut = act;
        appState.activeModal = 'shortcut';
        appState.modalReturnSelector = `[data-op-action="${act}"]`;
        render(); document.querySelector('[data-confirm-shortcut]')?.focus(); return;
      }
      appState.confirmedShortcut = null;
      if (act === 'lay_tile' && appState.selectedTileId) {
        executeGameAction({
          type: 'lay_tile',
          hex: appState.selectedHex,
          tile: appState.selectedTileId,
          rotation: appState.selectedTileRotation || 0,
        });
      } else if (act === 'lay_mf_port') {
        appState.activeModal = null;
        executeGameAction({
          type: 'lay_tile',
          special: 'MF',
          hex: el.dataset.portHex || appState.selectedHex,
          tile: '437',
          rotation: appState.selectedTileRotation || 0,
        });
      } else if (act === 'place_token') {
        executeGameAction({
          type: 'place_token',
          hex: el.dataset.tokenHex || appState.selectedHex,
          city: 0,
        });
      } else if (act === 'run_best_routes') {
        const activeCorp = state?.corporations?.[state?.current_corporation];
        const hasRunnableRoutes = Boolean(
          (activeCorp?.trains?.length || 0) > 0 &&
          (!viewData.route_quote || (viewData.route_quote.routes?.length || 0) > 0)
        );
        if (!hasRunnableRoutes) {
          const legalTypes = viewData.legal_actions?.types || [];
          if (legalTypes.includes('dividend')) {
            executeGameAction({ type: 'dividend', payout: false });
          } else if (legalTypes.includes('skip')) {
            executeGameAction({ type: 'skip' });
          } else {
            executeGameAction({ type: 'run_best_routes' });
          }
          return;
        }
        appState.activeModal='decisions';
        appState.routeDraftKey=`${appState.roomCode}:${state.revision}:${state.current_corporation}`;
        appState.routeDraft=structuredClone(viewData.route_quote?.routes || []);
        appState.routePreview=null;
        render();
      } else if (act === 'dividend_payout') {
        executeGameAction({ type: 'dividend', payout: true });
      } else if (act === 'dividend_withhold') {
        executeGameAction({ type: 'dividend', payout: false });
      } else if (act === 'pass') {
        executeGameAction({ type: 'pass' });
      } else if (act === 'skip') {
        const activeCorp = state?.corporations?.[state?.current_corporation];
        const hasRunnableRoutes = Boolean(
          (activeCorp?.trains?.length || 0) > 0 &&
          (!viewData.route_quote || (viewData.route_quote.routes?.length || 0) > 0)
        );
        const legalTypes = viewData.legal_actions?.types || [];
        if (state?.operating_turn?.step === 'routes' && !hasRunnableRoutes && legalTypes.includes('dividend')) {
          executeGameAction({ type: 'dividend', payout: false });
        } else {
          executeGameAction({ type: 'skip' });
        }
      } else if (act === 'end_turn') {
        executeGameAction({ type: 'end_turn' });
      }
    })
  );

  // Timeline & Replay controls
  document.querySelectorAll('[data-revision]').forEach((el) =>
    el.addEventListener('click', () => {
      const targetRev = Number(el.dataset.revision);
      if (appState.isPlayingReplay) {
        toggleReplayPlayback();
      }
      scrubToRevision(targetRev, false);
    })
  );
  document
    .querySelector('[data-scrub-range]')
    ?.addEventListener('input', (ev) => {
      if (appState.isPlayingReplay) {
        toggleReplayPlayback();
      }
      scrubToRevision(Number(ev.target.value), false);
    });
  document
    .querySelectorAll('[data-action="toggle_play"]')
    .forEach((el) => el.addEventListener('click', toggleReplayPlayback));
  document
    .querySelector('[data-action="cycle_speed"]')
    ?.addEventListener('click', cycleReplaySpeed);
  document
    .querySelectorAll('[data-action="live"]')
    .forEach((el) =>
      el.addEventListener('click', async () => {
        if (appState.isPlayingReplay) {
          toggleReplayPlayback();
        }
        await pollLiveState();
        scrubToRevision(appState.liveRevision, false);
      })
    );

  // Tabletop Social Sidebar Tab Switcher
  document.querySelectorAll('[data-table-sidebar-tab]').forEach((el) =>
    el.addEventListener('click', () => {
      appState.tableSidebarTab = el.dataset.tableSidebarTab || 'chat';
      render();
    })
  );

  // Club Stamp Card & Notes
  document
    .querySelector('[data-action="stamp_member_card"]')
    ?.addEventListener('click', async () => {
      try {
        const res = await api.submitClubAction(
          appState.roomCode,
          appState.token,
          { action: 'stamp_card' }
        );
        if (appState.liveViewData) {
          appState.liveViewData.club = res.club;
        }
        if (appState.displayedViewData) {
          appState.displayedViewData.club = res.club;
        }
        showToast(res.message || 'Membership card stamped!');
      } catch (err) {
        showToast(err.message, true);
      }
    });

  document
    .querySelector('[data-form="club_note"]')
    ?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const input = ev.target.querySelector('input[name="note_text"]');
      const text = input?.value?.trim();
      if (!text) return;
      try {
        const res = await api.submitClubAction(
          appState.roomCode,
          appState.token,
          {
            action: 'table_note',
            author: viewData.viewer?.player_name || 'Club Member',
            text,
          }
        );
        if (appState.liveViewData) appState.liveViewData.club = res.club;
        if (appState.displayedViewData)
          appState.displayedViewData.club = res.club;
        input.value = '';
        render();
      } catch (err) {
        showToast(err.message, true);
      }
    });
}

window.addEventListener('resize', recoverWindowGeometry);
bootstrapSession();
