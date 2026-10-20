import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { actionBlockReason, clearTilePreview, escapeContext, formatTime, mapActionAuthority, renderActionFeedback, shortcutDescription, syncFinancialLayout } from '../src/ui/presentation.js';
import { getAuctionContext, renderStockExchangeView } from '../src/components/StockExchange.js';
import { renderHistoryJournalView, renderTimelineFooter } from '../src/replay/TimelineBar.js';
import { renderDetailedMapView } from '../src/components/HexMap1889.js';
import { renderCharacterSetup } from '../src/components/CharacterSetup.js';
import { renderWaitingTable } from '../src/components/GatheringLobby.js';

const actor = () => ({
  viewer: { player_id: 'p1', player_name: 'Daisuke' },
  legal_actions: { player: 'p1', types: ['buy_shares', 'end_turn'] },
  state: { revision: 8, round: 'stock', stock_round: 1, phase: '2', current_player: 'p1',
    players: { p1: { name: 'Daisuke', cash: 340 } }, player_order: ['p1'],
    corporations: { IR: { name: 'Iyo Railway', home: 'E2', par: null, holdings: { p1: 0 }, ipo: 100, pool: 0, token_supply: 2 } },
    privates: {}, stock_turn: { bought: false } },
  certificates: { p1: 2 }, history_events: [], prices: {},
});
const state = () => ({ liveRevision: 8, viewRevision: 8, selectedCompanyId: 'IR', selectedParPrice: 80,
  view: 'market', stockWindows: {}, mapWindows: {}, selectedTileId: '57', selectedTileRotation: 1 });

test('feedback uses a reserved status area, escapes messages, and prioritizes errors', () => {
  assert.match(renderActionFeedback({}), /class="action-feedback-slot"/);
  const success = renderActionFeedback({ notice: 'IR lays <tile> & advances' });
  assert.match(success, /role="status"/); assert.match(success, /&lt;tile&gt; &amp;/);
  assert.match(success, /data-dismiss-feedback/); assert.doesNotMatch(success, /class="toast/);
  const error = renderActionFeedback({ notice: 'Earlier success', errorBanner: 'Move not accepted' });
  assert.match(error, /role="alert"/); assert.doesNotMatch(error, /Earlier success/);
});

test('only the actor in the loaded live state can submit, including replay at the live endpoint', () => {
  const s = state(), view = actor();
  assert.equal(actionBlockReason(s, view), null);
  for (const change of [{ viewRevision: 7 }, { isPlayingReplay: true }, { isSubmitting: true }, { isLoadingRevision: true }]) {
    assert.ok(actionBlockReason({ ...s, ...change }, view));
  }
  assert.ok(actionBlockReason(s, { ...view, state: { ...view.state, revision: 7 } }));
  assert.ok(actionBlockReason(s, { ...view, viewer: { player_id: null } }));
  assert.ok(actionBlockReason(s, { ...view, viewer: { player_id: 'p2' } }));
});

test('financial workspace starts usefully and preserves intentionally closed windows across historical rounds', () => {
  const defaults = () => ({ corporations: { open: true, z: 5 }, privates: { open: false, z: 4 } });
  const s = { stockWindows: defaults(), lastSyncedRound: null };
  syncFinancialLayout(s, 'auction', defaults); s.lastSyncedRound = 'auction';
  assert.equal(s.stockWindows.privates.open, true);
  syncFinancialLayout(s, 'stock', defaults); s.lastSyncedRound = 'stock';
  assert.equal(s.stockWindows.corporations.open, true);
  s.stockWindows.corporations.open = false;
  syncFinancialLayout(s, 'stock', defaults);
  assert.equal(s.stockWindows.corporations.open, false);
  syncFinancialLayout(s, 'auction', defaults); s.lastSyncedRound = 'auction';
  syncFinancialLayout(s, 'stock', defaults);
  assert.equal(s.stockWindows.corporations.open, false);
});

test('Escape closes only one context and preserves historical revision and room', () => {
  const s = { ...state(), activeModal: 'stamp', viewRevision: 4, isPlayingReplay: true };
  assert.equal(escapeContext(s), 'modal');
  assert.equal(s.view, 'market'); assert.equal(s.viewRevision, 4); assert.equal(s.selectedTileId, '57');
  assert.equal(escapeContext(s), 'preview'); assert.equal(s.selectedTileId, null);
  assert.equal(s.isPlayingReplay, true);
  s.stockWindows.ledger = { open: true };
  assert.equal(escapeContext(s, 'ledger'), 'window');
  assert.equal(escapeContext(s), 'replay');
  assert.equal(escapeContext(s), 'table'); assert.equal(s.viewRevision, 4);
});

test('Escape closes Hex & Tile Lay before returning to the social table on a second press', () => {
  const s = { ...state(), view: 'map', mapWindows: { hex: { open: true, maximized: true, z: 5 } } };
  assert.equal(escapeContext(s), 'window');
  assert.equal(s.mapWindows.hex.open, false);
  assert.equal(s.mapWindows.hex.maximized, false);
  assert.equal(s.selectedTileId, null);
  assert.equal(s.selectedTileRotation, 0);
  assert.equal(s.view, 'map');
  assert.equal(s.liveRevision, 8);
  assert.equal(escapeContext(s), 'table');
  assert.equal(s.view, 'table');
  assert.equal(escapeContext(s), null);
});

test('Escape closes the frontmost window when focus is elsewhere, one window per press', () => {
  for (const [view, key] of [['map', 'mapWindows'], ['market', 'stockWindows']]) {
    const s = { ...state(), view, selectedTileId: null, [key]: {
      corporations: { open: true, z: 2 },
      privates: { open: true, z: 7 },
      activity: { open: false, z: 10 },
    } };
    assert.equal(escapeContext(s, 'activity'), 'window');
    assert.equal(s[key].privates.open, false);
    assert.equal(s[key].corporations.open, true);
    assert.equal(s.view, view);
    assert.equal(escapeContext(s), 'window');
    assert.equal(s.view, view);
    assert.equal(escapeContext(s), 'table');
  }
});

test('Escape prioritizes dialogs and focused windows over other open windows', () => {
  const s = { ...state(), view: 'map', activeModal: 'stamp', mapWindows: {
    hex: { open: true, z: 5 }, corporations: { open: true, z: 8 },
  } };
  assert.equal(escapeContext(s, 'hex'), 'modal');
  assert.equal(s.mapWindows.hex.open, true);
  assert.equal(escapeContext(s, 'hex'), 'window');
  assert.equal(s.mapWindows.corporations.open, true);
  assert.equal(s.view, 'map');
});

test('shortcut descriptions preserve optional-step advancement and clearing preview is presentation-only', () => {
  assert.match(shortcutDescription('track', 'routes'), /track \/ token/);
  assert.equal(shortcutDescription('routes', 'routes'), '');
  const s = state(); clearTilePreview(s);
  assert.equal(s.selectedTileId, null); assert.equal(s.selectedTileRotation, 0); assert.equal(s.liveRevision, 8);
});

test('timestamps require an actual instant rather than a fictional or timezone-free clock', () => {
  for (const value of [null, '20:00', '2026-10-16 18:00:00', 'nonsense']) assert.equal(formatTime(value), 'Time unavailable');
  assert.notEqual(formatTime('2026-10-16T18:00:00Z'), 'Time unavailable');
});

test('observer ticket names its perspective and hides purchase/sell controls when not active player', () => {
  const view = actor(); view.viewer = { player_id: null, player_name: 'Guest Observer' };
  const html = renderStockExchangeView(state(), view, {});
  assert.match(html, /Daisuke.*position/); assert.doesNotMatch(html, /Personal cash → after purchase/);
  assert.doesNotMatch(html, /data-switch-seat=/);
  assert.match(html, /Current Player: Daisuke/);
  assert.doesNotMatch(html, /CHOOSE AN ACTION|data-action="(?:buy_shares|sell_shares|exchange_dr|end_stock_turn)"|data-select-par=|data-select-source=/);
});

test('president purchase is one certificate and hides action controls while replaying or waiting for another player', () => {
  const view = actor(), s = state();
  const html = renderStockExchangeView(s, view, {});
  assert.match(html, /One President's \(20%\)/); assert.match(html, /2 \/ 14 limit → 3/);
  assert.match(html, /data-action="buy_shares"/);
  s.isPlayingReplay = true;
  const replayHtml = renderStockExchangeView(s, view, {});
  assert.match(replayHtml, /HISTORICAL SNAPSHOT/);
  assert.doesNotMatch(replayHtml, /CHOOSE AN ACTION|data-action="(?:buy_shares|sell_shares|exchange_dr|end_stock_turn)"/);

  const waitingView = actor();
  waitingView.state.players.p2 = { name: 'Haruka', cash: 185 };
  waitingView.state.player_order = ['p1', 'p2'];
  waitingView.viewer = { player_id: 'p2', player_name: 'Haruka' };
  waitingView.legal_actions = { player: 'p2', types: ['exchange_private'] };
  const waitingHtml = renderStockExchangeView(state(), waitingView, {});
  assert.match(waitingHtml, /Current Player: Daisuke \(P1\)/);
  assert.match(waitingHtml, /Haruka&#39;s position/);
  assert.doesNotMatch(waitingHtml, /CHOOSE AN ACTION|data-action="(?:buy_shares|sell_shares|exchange_dr|end_stock_turn)"|data-select-par=|data-select-source=/);
});

test('auction history keeps selection separate from bidding permission', () => {
  const view = actor(); view.state.round = 'auction'; view.state.auction = { bids: {} };
  view.state.privates = { TR: { id: 'TR', value: 20, owner: null }, MF: { id: 'MF', value: 30, owner: null } };
  const s = { ...state(), viewRevision: 0, selectedPrivateId: 'MF', bidPrice: 35 };
  const context = getAuctionContext(s, view);
  assert.equal(context.selectedPriv.id, 'MF'); assert.equal(context.canBidSelected, false);
  assert.equal(context.canBuyOffered, false);
});

test('journal selection and inspecting a resulting position are separate controls', () => {
  const view = actor(); view.history_events = [{ revision: 8, label: 'Auction concludes', detail: 'Stock Round 1', actor_name: 'Alex', occurred_at: '2026-10-16T18:00:00Z' }];
  const html = renderHistoryJournalView(state(), view);
  assert.match(html, /data-revision="8"/); assert.match(html, /data-inspect-revision="8"/);
  assert.doesNotMatch(html, /SQLite|Command ID:/);
});

function operatingFixture() {
  return JSON.parse(execFileSync('python3', ['-c', [
    'import json, tempfile',
    'from pathlib import Path',
    'from server_bridge import KoenjiAppService, KoenjiDatabase',
    'with tempfile.TemporaryDirectory() as d:',
    ' s = KoenjiAppService(KoenjiDatabase(Path(d) / "test.sqlite3"))',
    ' _, f = s.handle("POST", "/api/1889/dev/fixture", {"preset": "operating_round_1"})',
    ' _, v = s.handle("GET", "/api/1889/games/" + f["room_code"], None, "Bearer " + f["player_tokens"][0])',
    ' _, waiting = s.handle("GET", "/api/1889/games/" + f["room_code"], None, "Bearer " + f["player_tokens"][1])',
    ' _, observer = s.handle("GET", "/api/1889/games/" + f["room_code"], None, "Bearer " + f["spectator_token"])',
    ' _, c = s.handle("GET", "/api/1889/catalog")',
    ' print(json.dumps({"view": v, "waiting": waiting, "observer": observer, "catalog": c}))',
  ].join('\n')], { encoding: 'utf8' }));
}

test('real operating fixture preserves shortcuts while historical map only inspects', () => {
  const fixture = operatingFixture();
  const s = { ...state(), liveRevision: 22, viewRevision: 22, selectedHex: 'E2', inspectedHex: 'E2', selectedTileId: null };
  const html = renderDetailedMapView(s, fixture.view, fixture.catalog);
  assert.match(html, /Route resolution shortcut/);
  assert.match(html, /skips remaining track \/ token opportunities/);
  assert.match(html, /ACTING AS CORPORATION · CORPORATE FUNDS/);
  assert.match(html, /role="button" tabindex="0" aria-label="Matsuyama E2 · Preview track"/);
  const historical = renderDetailedMapView({ ...s, liveRevision: 23 }, fixture.view, fixture.catalog);
  assert.match(historical, /No tile staged · Inspection/);
  assert.doesNotMatch(historical, /aria-label="Matsuyama E2 · Preview track"/);
  assert.doesNotMatch(historical, /data-op-action="lay_tile" >|data-op-action="run_best_routes" >/);
});

test('waiting players and observers see observation, not president instructions, at every operating step', () => {
  const fixture = operatingFixture();
  const s = { ...state(), liveRevision: 22, viewRevision: 22, selectedHex: 'E2', inspectedHex: 'E2' };
  for (const view of [fixture.waiting, fixture.observer]) {
    assert.equal(mapActionAuthority(s, view).isOperatingPresident, false);
    for (const step of ['track', 'token', 'routes', 'dividend', 'train']) {
      const snapshot = structuredClone(view); snapshot.state.operating_turn.step = step;
      const html = renderDetailedMapView(s, snapshot, fixture.catalog);
      assert.match(html, /OBSERVING \(STEP/);
      assert.match(html, /Daisuke is operating Iyo Railway \(IR\)/);
      assert.doesNotMatch(html, /WHAT TO DO NOW|Acting for IR|YOU ARE ACTING AS PRESIDENT|Lay 1 track tile/);
      assert.doesNotMatch(html, /data-op-action="(?:lay_tile|run_best_routes|place_token|skip|end_turn)"/);
      assert.doesNotMatch(html, /#57 \(60°|Staged tile placement controls/);
    }
  }
  const president = renderDetailedMapView(s, fixture.view, fixture.catalog);
  assert.match(president, /WHAT TO DO NOW/); assert.match(president, /Acting for IR/);
});

test('private-company permission does not grant normal operating authority', () => {
  const fixture = operatingFixture();
  const s = { ...state(), liveRevision: 22, viewRevision: 22, selectedHex: 'B11', inspectedHex: 'B11', selectedTileId: null };
  assert.equal(fixture.waiting.legal_actions.player, 'p2');
  const authority = mapActionAuthority(s, fixture.waiting);
  assert.equal(authority.isOperatingPresident, false); assert.equal(authority.canLayTrack, false);
  assert.equal(authority.canLayMfPort, true);
  const html = renderDetailedMapView(s, fixture.waiting, fixture.catalog);
  assert.match(html, /Use your MF power/); assert.doesNotMatch(html, /Acting for IR/);
  const special = structuredClone(fixture.waiting);
  special.state.pending_special = { player: 'p2', company: 'ER' }; special.state.current_player = 'p2';
  special.legal_actions = { player: 'p2', types: ['lay_tile', 'pass'], choices: {} };
  assert.equal(mapActionAuthority(s, special).canLayTrack, true);
  assert.equal(mapActionAuthority(s, special).isOperatingPresident, false);
  assert.match(renderDetailedMapView(s, special, fixture.catalog), /ER special action/);
});

test('map financial-round callout opens its financial room without leaving the viewed revision', () => {
  const fixture = operatingFixture();
  const s = { ...state(), view: 'map', liveRevision: 22, viewRevision: 22, selectedHex: 'E2', selectedTileId: null };
  for (const [round, destination] of [['stock', 'Stock Exchange'], ['auction', 'Private Company Auction']]) {
    const view = structuredClone(fixture.view); view.state.round = round;
    for (const viewRevision of [22, 8]) {
      const snapshot = structuredClone(view); snapshot.state.revision = viewRevision;
      const ui = { ...s, viewRevision };
      const before = JSON.stringify({ ui, snapshot });
      const html = renderDetailedMapView(ui, snapshot, fixture.catalog);
      assert.match(html, new RegExp(`<button class="stock-turn-callout[^>]*data-view="market"[^>]*aria-label="Open ${destination}"`));
      assert.match(html, /class="callout-open"/);
      assert.equal(JSON.stringify({ ui, snapshot }), before);
    }
  }
  assert.doesNotMatch(renderDetailedMapView(s, fixture.view, fixture.catalog), /<button class="stock-turn-callout/);
});

test('stock-screen operating-round callout opens the map for presidents, waiting players, and observers', () => {
  const fixture = operatingFixture();
  for (const view of [fixture.view, fixture.waiting, fixture.observer]) {
    for (const liveRevision of [22, 23]) {
      const ui = { ...state(), view: 'market', liveRevision, viewRevision: 22, selectedTileId: null };
      const before = JSON.stringify({ ui, view });
      const html = renderStockExchangeView(ui, view, fixture.catalog);
      assert.match(html, /<button class="stock-turn-callout[^>]*data-view="map"[^>]*aria-label="Open Map &amp; Operations"/);
      assert.match(html, /Open Operations →/);
      assert.doesNotMatch(html, /YOUR DECISION/);
      assert.equal(JSON.stringify({ ui, view }), before);
    }
  }
  assert.doesNotMatch(renderStockExchangeView(state(), actor(), {}), /<button class="stock-turn-callout/);
});

test('cross-screen consistency: Journal renders unified player strip, Auction anchors viewer cash, and Map port button binds inspected hex', () => {
  const fixture = operatingFixture();
  const journalHtml = renderHistoryJournalView(state(), fixture.view);
  assert.match(journalHtml, /stock-player-strip/);
  assert.match(journalHtml, /Back to Table · テーブルへ戻る/);
  assert.match(journalHtml, /Map & Operations 🗺️/);

  const auctionView = structuredClone(fixture.waiting);
  auctionView.state.round = 'auction';
  auctionView.state.auction = { bids: {} };
  const auctionApp = {
    ...state(),
    liveRevision: 22,
    viewRevision: 22,
    stockWindows: { privates: { open: true, z: 5 } },
  };
  const auctionHtml = renderStockExchangeView(auctionApp, auctionView, fixture.catalog);
  assert.match(auctionHtml, /Your Position · 自分の資金/);
  assert.match(auctionHtml, /market-top-deck/);
  assert.doesNotMatch(auctionHtml, /meiji-bottom-tabs/);
  assert.doesNotMatch(auctionHtml, /dot-crimson/);

  const portApp = {
    ...state(),
    liveRevision: 22,
    viewRevision: 22,
    selectedHex: 'E2',
    inspectedHex: 'B11',
    selectedTileId: null,
    mapWindows: { hex: { open: true, z: 5 }, activity: { open: true, z: 4 } },
  };
  const mapHtml = renderDetailedMapView(portApp, fixture.waiting, fixture.catalog);
  assert.match(mapHtml, /data-op-action="lay_mf_port" data-port-hex="B11"/);
  assert.match(mapHtml, /Latest \d+ moves \(up to Rev/);
});

test('visual state controls surface swatches, chair readiness, board overlays, consequence strips, and snapshot pins', () => {
  const setupHtml = renderCharacterSetup({ face: 'reference-01', clothes: 'indigo-haori' }, true);
  assert.match(setupHtml, /data-pick-face="reference-01"/);
  assert.match(setupHtml, /data-pick-clothes="indigo-haori"/);
  assert.match(setupHtml, /data-preview-expr="smile"/);

  const api = { getRoomDirectory: () => ({ ROOM: { creator_token: 'host' } }), getHostInvitations: () => null };
  const lobbyHtml = renderWaitingTable({ roomCode: 'ROOM' }, {
    room_code: 'ROOM', max_players: 2, gathering_title: 'Club', can_start: false,
    host: { name: 'Daisuke', member_id: 'player:1' }, viewer: { player_id: 'p1', player_name: 'Daisuke' },
    club: { notes: [], stamps: { p1: true } },
    seats: [
      { seat_index: 0, player_id: 'p1', member_id: 'player:1', name: 'Daisuke', claimed: true, online: true, is_host: true },
      { seat_index: 1, member_id: 'player:2', name: 'Yumiko', claimed: false },
    ],
  }, api);
  assert.match(lobbyHtml, /lobby-readiness-bar/);
  assert.match(lobbyHtml, /chair-stamp-seal/);
  assert.match(lobbyHtml, /empty-chair-visual/);

  const stockHtml = renderStockExchangeView(state(), actor(), {});
  assert.match(stockHtml, /consequence-preview-grid/);
  assert.match(stockHtml, /ownership-mini-bar/);

  const timelineHtml = renderTimelineFooter({ liveRevision: 8, viewRevision: 4 }, {
    history_events: [{ revision: 4, label: 'Daisuke buys 20% IR', occurred_at: '2026-10-16T18:00:00Z' }],
  });
  assert.match(timelineHtml, /is-pinned-snapshot/);
  assert.match(timelineHtml, /Return to Live \(Rev 8/);
});

test('operating ticket enables 1-click skip at routes step when corporation has no trains or no legal routes', () => {
  const fixture = operatingFixture();
  const s = { ...state(), liveRevision: 22, viewRevision: 22, selectedHex: 'E2', inspectedHex: 'E2', selectedTileId: null };

  // Case 1: Corporation has 0 trains at step === 'routes'
  const noTrainView = structuredClone(fixture.view);
  noTrainView.state.operating_turn.step = 'routes';
  noTrainView.state.corporations.IR.trains = [];
  noTrainView.route_quote = { routes: [], revenue: 0 };
  noTrainView.legal_actions.types = ['run_routes', 'dividend', 'buy_private', 'run_best_routes', 'skip'];
  const noTrainHtml = renderDetailedMapView(s, noTrainView, fixture.catalog);
  assert.match(noTrainHtml, /IR has no trains yet — skip route calculation\./);
  assert.match(noTrainHtml, /No trains — Skip to Train Step \(¥0\)/);
  assert.match(noTrainHtml, /data-op-action="skip"\s*>\s*Skip Routes/);

  // Case 2: Corporation owns a train (2-0) but has no connected route (nowhere to send the train)
  const noRouteView = structuredClone(noTrainView);
  noRouteView.state.corporations.IR.trains = ['2-0'];
  noRouteView.route_quote = { routes: [], revenue: 0 };
  const noRouteHtml = renderDetailedMapView(s, noRouteView, fixture.catalog);
  assert.match(noRouteHtml, /IR's train \(2-0\) has no connected route — skip route calculation\./);
  assert.match(noRouteHtml, /No legal route — Skip to Train Step \(¥0\)/);
  assert.match(noRouteHtml, /data-op-action="skip"\s*>\s*Skip Routes/);
  assert.match(noRouteHtml, /data-op-action="dividend_withhold"/);
});

test('unified 5-step operating panel renders help toggle, step workspaces, inline route planner, and stock step track', () => {
  const fixture = operatingFixture();
  const baseUi = { ...state(), liveRevision: 22, viewRevision: 22, selectedHex: 'E2', inspectedHex: 'E2', selectedTileId: '57', selectedTileRotation: 0 };

  // Step 1: Track — SVG tile swatches, rotation bar, collapsed help drawer by default, open when toggled
  const trackHtml = renderDetailedMapView(baseUi, fixture.view, fixture.catalog);
  assert.match(trackHtml, /data-toggle-op-help/);
  assert.match(trackHtml, /op-help-drawer[^>]*is-collapsed/);
  assert.match(trackHtml, /tile-swatch-btn/);
  assert.match(trackHtml, /tile-rotation-bar/);
  assert.match(trackHtml, /ticket-compact-footer/);

  const helpOpenHtml = renderDetailedMapView({ ...baseUi, opHelpOpen: true }, fixture.view, fixture.catalog);
  assert.match(helpOpenHtml, /op-help-drawer[^>]*is-open/);

  // Step 2: Token — Charter rack and consequence strip
  const tokenView = structuredClone(fixture.view);
  tokenView.state.operating_turn.step = 'token';
  const tokenHtml = renderDetailedMapView(baseUi, tokenView, fixture.catalog);
  assert.match(tokenHtml, /token-charter-rack/);
  assert.match(tokenHtml, /Station Charter Rack/);

  // Step 3: Routes — Inline stop-based route planner embedded directly in panel when routes are runnable
  const routeView = structuredClone(fixture.view);
  routeView.state.operating_turn.step = 'routes';
  routeView.state.corporations.IR.trains = ['2-0'];
  routeView.route_quote = { routes: [{ train: '2-0', vertices: ['E2:n0', 'F1:n0'] }], revenue: 50, route_revenues: { '2-0': 50 } };
  routeView.legal_actions.types = ['run_routes', 'run_best_routes', 'skip'];
  const routeHtml = renderDetailedMapView(baseUi, routeView, fixture.catalog);
  assert.match(routeHtml, /data-inline-route-planner/);
  assert.match(routeHtml, /data-run-route-plan/);

  // Step 4: Dividend — 3-cell stock step track, safe preview, and no stale Step 3 route shortcut
  const divView = structuredClone(fixture.view);
  divView.state.operating_turn.step = 'dividend';
  divView.state.operating_turn.revenue = 90;
  divView.state.operating_turn.routes = [{ train: '2-0', vertices: ['E2:n0', 'F1:n0'] }];
  divView.legal_actions.types = ['dividend'];
  const divHtml = renderDetailedMapView(baseUi, divView, fixture.catalog);
  assert.match(divHtml, /stock-step-track/);
  assert.match(divHtml, /iron-safe-mini/);
  assert.match(divHtml, /is-dividend-step-row/);
  assert.doesNotMatch(divHtml, /Route resolution shortcut/);
});

