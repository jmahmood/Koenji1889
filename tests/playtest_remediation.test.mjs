import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { renderDetailedMapView } from '../src/components/HexMap1889.js';
import { renderInlineTrainDesk } from '../src/components/TrainDesk.js';
import { renderWaitingTable } from '../src/components/GatheringLobby.js';
import { renderPrivateDetailsModal } from '../src/components/Modals.js';
import { renderDecisionDesk, renderDecisionNotice } from '../src/components/DecisionDesk.js';
import { KoenjiApiClient } from '../src/api/client.js';

const views = JSON.parse(execFileSync('python3', ['tests/decision_fixtures.py'], { encoding: 'utf8' }));
const catalog = JSON.parse(
  execFileSync(
    'python3',
    ['-c', 'import json; from server_bridge import KoenjiAppService; print(json.dumps(KoenjiAppService().handle("GET","/api/1889/catalog")[1]))'],
    { encoding: 'utf8' }
  )
);

const baseApp = (v) => ({
  roomCode: 'TEST',
  activeModal: null,
  view: 'map',
  viewRevision: v.state.revision,
  liveRevision: v.state.revision,
  displayedViewData: v,
  selectedHex: 'E2',
  inspectedHex: 'E2',
  selectedCompanyId: 'IR',
  selectedParPrice: 65,
  stockWindows: {},
  mapWindows: { corporations: { open: true, z: 5 } },
});

test('UI-002: mandatory train obligation disables End Turn even with sufficient corporate treasury', () => {
  const v = views.train_normal;
  assert.ok(v.train_financing, 'train_financing must be present when trainless corp has a route');
  assert.equal(v.train_financing.shortfall, 0, 'treasury covers the train in train_normal');
  assert.equal(v.train_financing.mandatory, true);
  assert.ok(!v.legal_actions.types.includes('end_turn'), 'server legal_actions must omit end_turn when train is mandatory');
  assert.equal(v.legal_actions.choices.mandatory_train, true);

  const s = baseApp(v);
  const mapHtml = renderDetailedMapView(s, v, catalog);
  assert.match(mapHtml, /data-testid="mandatory-train-guard"/);
  assert.match(mapHtml, /Mandatory train purchase:/);
  assert.match(mapHtml, /data-testid="op-btn-end-turn"[^>]*disabled/);

  const trainDeskHtml = renderInlineTrainDesk(s, v);
  assert.match(trainDeskHtml, /MANDATORY · 2-Train/);
  assert.match(trainDeskHtml, /is-mandatory/);
});

test('UI-001: shared-profile guest tab hides host controls, discloses shared profile, and preserves host session even after seating reorder to p3', () => {
  const mem = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  };
  globalThis.localStorage = mem();
  globalThis.sessionStorage = mem();
  let href = 'http://localhost/?room=GJDQCD&seat=p1';
  globalThis.window = {
    location: new URL(href),
    history: {
      replaceState: (_a, _b, url) => {
        href = url;
        globalThis.window.location = new URL(url);
      },
    },
  };
  globalThis.location = { origin: 'http://localhost', pathname: '/', href };

  const client = new KoenjiApiClient();
  client.channel?.close();
  client.channel = null;

  // 1. Host creates room in Tab 1 (initially p1)
  client.saveOwnRoom('GJDQCD', 'p1', 'host-seat-token');
  client.rememberHostCredential('GJDQCD', 'creator-secret-token');

  // 2. Host reorders seating so host moves from p1 to p3 (same host-seat-token!)
  client.saveOwnRoom('GJDQCD', 'p3', 'host-seat-token');
  assert.equal(client.getRoomDirectory().GJDQCD.own_session.seat_key, 'p3');
  assert.equal(client.getRoomDirectory().GJDQCD.own_session.token, 'host-seat-token');

  // 3. Guest opens Seat 1 (p1) invitation in Tab 2 within the same browser profile
  globalThis.sessionStorage = mem();
  href = 'http://localhost/?room=GJDQCD&seat=p1#token=guest-seat1-token';
  globalThis.window.location = new URL(href);
  const guestTabSession = client.getTabSession();
  assert.equal(guestTabSession.token, 'guest-seat1-token');
  client.saveOwnRoom('GJDQCD', 'p1', 'guest-seat1-token');

  // Host's own_session in localStorage must remain p3 (host-seat-token), while guest p1 is stored in guest_sessions
  const dir = client.getRoomDirectory().GJDQCD;
  assert.equal(dir.own_session.seat_key, 'p3');
  assert.equal(dir.own_session.token, 'host-seat-token');
  assert.equal(dir.guest_sessions.p1, 'guest-seat1-token');

  const guestView = {
    room_code: 'GJDQCD',
    max_players: 4,
    gathering_title: 'Four-player validation',
    can_start: false,
    host: { name: 'Akira Aggressive', member_id: 'player:1' },
    viewer: { role: 'player', player_id: 'p1', player_name: 'Chiyo Conservative' },
    club: { notes: [], stamps: {} },
    seats: [
      { seat_index: 0, player_id: 'p1', member_id: 'player:2', name: 'Chiyo Conservative', claimed: true, online: true, is_host: false },
      { seat_index: 2, player_id: 'p3', member_id: 'player:1', name: 'Akira Aggressive', claimed: true, online: true, is_host: true },
    ],
  };

  const guestHtml = renderWaitingTable({ roomCode: 'GJDQCD' }, guestView, client);
  assert.match(guestHtml, /data-testid="shared-profile-notice"/);
  assert.match(guestHtml, /Shared Browser Profile · Viewing as Chiyo Conservative \(Seat 1\)/);
  assert.doesNotMatch(guestHtml, /Host gathering controls/);
  assert.doesNotMatch(guestHtml, /data-start-gathering/);

  // Explicit opt-in toggle reveals host controls if desired
  const toggledHtml = renderWaitingTable({ roomCode: 'GJDQCD', showSharedHostControls: true }, guestView, client);
  assert.match(toggledHtml, /Host gathering controls/);
});

test('Operating Order badges distinguish Unparred, Parred, and Floated corporations without false Unfloated labels', () => {
  const v = structuredClone(views.train_normal);
  v.state.round = 'stock';
  v.state.or_order = [];
  v.state.corporations.IR.floated = true;
  v.state.corporations.IR.par = 65;
  v.state.corporations.AR.floated = false;
  v.state.corporations.AR.par = 65;
  v.state.corporations.AR.ipo = 80;
  v.state.corporations.SR.floated = false;
  v.state.corporations.SR.par = null;

  const s = baseApp(v);
  const html = renderDetailedMapView(s, v, catalog);
  assert.match(html, /Floated \(¥\d+\)/);
  assert.match(html, /Par ¥65 \(20% sold\)/);
  assert.match(html, /Unparred/);
  assert.doesNotMatch(html, />Unfloated</);
});

test('MF Private Details modal surfaces direct port-lay buttons, live Counterparty Offers appear, and completed offers (e.g. rev 108 ER) are filtered out', () => {
  const v = structuredClone(views.train_normal);
  v.state.privates.MF.owner = 'p1';
  v.state.privates.MF.closed = false;
  v.legal_actions.types.push('lay_tile');
  v.legal_actions.choices.port_hexes = ['B11', 'G10', 'I12', 'J9'];

  const s = { ...baseApp(v), activeModal: 'private', privateDetailsId: 'MF' };
  const modalHtml = renderPrivateDetailsModal(s, v);
  assert.match(modalHtml, /data-testid="mf-modal-actions"/);
  assert.match(modalHtml, /data-testid="mf-lay-G10"/);
  assert.match(modalHtml, /⚓ Lay Port #437 on G10 \(Susaki\)/);

  // Live counterparty offer banner in renderDecisionNotice
  const offerView = structuredClone(views.negotiation);
  offerView.state.offers = [
    { kind: 'private', item: 'ER', seller: 'p3', buyer: 'IR', price: 40, offered_by: 'p1' },
  ];
  const sellerNotice = renderDecisionNotice(baseApp(offerView), offerView);
  assert.match(sellerNotice, /data-testid="counterparty-offer-banner"/);
  assert.match(sellerNotice, /Consent to ER offer at ¥40/);

  // Completed offer (as in CYEU10 rev 108 where ER already belongs to AR, not p1) must not show as pending
  const completedOfferView = structuredClone(views.negotiation);
  completedOfferView.state.current_corporation = 'AR';
  completedOfferView.state.privates.ER.owner = 'AR';
  completedOfferView.state.offers = [
    { kind: 'private', item: 'ER', seller: 'p1', buyer: 'AR', price: 40, offered_by: 'p3' },
  ];
  const afterSaleNotice = renderDecisionNotice(baseApp(completedOfferView), completedOfferView);
  assert.doesNotMatch(afterSaleNotice, /counterparty-offer-banner/);
  assert.doesNotMatch(afterSaleNotice, /counterparty-offer-status/);
  assert.doesNotMatch(afterSaleNotice, /Pending offer/);

  const afterSaleDesk = renderDecisionDesk({ ...baseApp(completedOfferView), activeModal: 'decisions' }, completedOfferView);
  assert.match(afterSaleDesk, /No offers recorded\./);
});
