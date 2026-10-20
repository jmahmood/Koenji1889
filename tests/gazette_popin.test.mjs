import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRustAlert,
  renderGazettePopin,
  RUST_MILESTONES,
} from '../src/components/GazettePopin.js';
import { renderDetailedMapView } from '../src/components/HexMap1889.js';

function createMockState({
  phase = '3',
  depot3Count = 5,
  depot4Count = 4,
  irTrains = ['2-0', '2-1'],
  irCash = 140,
  lastEvent = null,
  round = 'operating',
  step = 'track',
} = {}) {
  const trains = {};
  for (let i = 0; i < depot3Count; i++) {
    trains[`3-${i}`] = { type: '3', price: 180, owner: 'depot', rusted: false };
  }
  for (let i = 0; i < depot4Count; i++) {
    trains[`4-${i}`] = { type: '4', price: 300, owner: 'depot', rusted: false };
  }
  (irTrains || []).forEach((tId) => {
    trains[tId] = { type: tId.split('-')[0], price: 80, owner: 'IR', rusted: false };
  });

  return {
    state: {
      phase,
      round,
      player_order: ['p1', 'p2'],
      operating_turn: { step, current_corporation: 'IR' },
      current_corporation: 'IR',
      revision: 12,
      trains,
      corporations: {
        IR: {
          id: 'IR',
          name: 'Iyo Railway',
          president: 'p1',
          cash: irCash,
          trains: irTrains,
          home: 'E2',
        },
        AR: {
          id: 'AR',
          name: 'Awa Electric',
          president: 'p2',
          cash: 400,
          trains: ['3-99'],
          home: 'K8',
        },
      },
      players: {
        p1: { name: 'Daisuke', cash: 80 },
        p2: { name: 'Alex', cash: 150 },
      },
      board: {
        E2: { color: 'yellow', cost: 0, nodes: [{ kind: 'city', revenue: [20, 20, 20], slots: 1 }], paths: [] },
      },
    },
    viewer: { player_id: 'p1' },
    last_event: lastEvent,
  };
}

test('computeRustAlert returns null when depot has ample precursor trains (normal conditions)', () => {
  const view = createMockState({ phase: '3', depot3Count: 4 });
  const app = { suppressedRustAlerts: {}, rustAlertMinimized: false };
  const alert = computeRustAlert(app, view);
  assert.equal(alert, null);
});

test('computeRustAlert detects 2-left advisory tier', () => {
  const view = createMockState({ phase: '3', depot3Count: 2 });
  const app = { suppressedRustAlerts: {}, rustAlertMinimized: false };
  const alert = computeRustAlert(app, view);
  assert.ok(alert);
  assert.equal(alert.severity, 'advisory');
  assert.match(alert.headline, /2x 3-Trains Remain/);
  assert.match(alert.buoyLabel, /2x 3T Left/);
});

test('computeRustAlert detects 1-left threat tier and flags vulnerable corporations', () => {
  const view = createMockState({ phase: '3', depot3Count: 1, irTrains: ['2-0', '2-1'] });
  const app = { suppressedRustAlerts: {}, rustAlertMinimized: false };
  const alert = computeRustAlert(app, view);
  assert.ok(alert);
  assert.equal(alert.severity, 'threat');
  assert.match(alert.headline, /Only 1x 3-Train Left/);
  assert.equal(alert.hazardGauge.danger, true);

  const irRisk = alert.corps.find((c) => c.corporationId === 'IR');
  assert.ok(irRisk);
  assert.equal(irRisk.willEmpty, true);
  assert.equal(irRisk.rustingCount, 2);
  assert.equal(irRisk.shortfall, 160); // 300 - 140

  const arRisk = alert.corps.find((c) => c.corporationId === 'AR');
  assert.ok(arRisk);
  assert.equal(arRisk.willEmpty, false);
});

test('computeRustAlert detects breaking rust cataclysm when engines are scrapped', () => {
  const view = createMockState({
    phase: '4',
    depot3Count: 0,
    depot4Count: 3,
    lastEvent: {
      rusted_trains: [
        { train: '2-0', type: '2', corporation: 'IR', president: 'p1' },
        { train: '2-1', type: '2', corporation: 'IR', president: 'p1' },
      ],
    },
  });
  const app = { suppressedRustAlerts: {}, rustAlertMinimized: false };
  const alert = computeRustAlert(app, view);
  assert.ok(alert);
  assert.equal(alert.severity, 'cataclysm');
  assert.match(alert.stamp, /EXTRA/);
  assert.match(alert.headline, /First 4-Train Purchased/);
  assert.match(alert.detail, /permanently removed/);
  assert.equal(alert.hazardGauge.danger, true);
});

test('computeRustAlert detects Step 5 mandatory train financing shortfall', () => {
  const view = createMockState({
    phase: '4',
    depot3Count: 0,
    depot4Count: 3,
    irTrains: [], // 0 trains owned
    irCash: 120, // safe has 120 vs 300 cheapest train
    step: 'train',
    round: 'operating',
  });
  const app = { suppressedRustAlerts: {}, rustAlertMinimized: false };
  const alert = computeRustAlert(app, view);
  assert.ok(alert);
  assert.equal(alert.severity, 'emergency');
  assert.match(alert.stamp, /EMERGENCY/);
  assert.match(alert.headline, /Treasury Shortfall/);
  assert.equal(alert.hazardGauge.danger, true);
});

test('renderGazettePopin outputs retro 90s window and handles minimization', () => {
  const view = createMockState({ phase: '3', depot3Count: 1 });
  const app = {
    suppressedRustAlerts: {},
    rustAlertMinimized: false,
    gazettePosition: { x: 40, y: 60 },
  };

  // Expanded window state
  const htmlExpanded = renderGazettePopin(app, view);
  assert.match(htmlExpanded, /data-testid="rust-popin-window"/);
  assert.match(htmlExpanded, /retro-titlebar/);
  assert.match(htmlExpanded, /号外 GAZETTE/);
  assert.match(htmlExpanded, /data-minimize-gazette/);
  assert.match(htmlExpanded, /data-close-gazette/);
  assert.match(htmlExpanded, /data-gazette-drag/);
  assert.match(htmlExpanded, /style="left: 40px; top: 60px;"/);
  assert.match(htmlExpanded, /minimized-rust-buoy is-hidden/);

  // Minimized state
  const appMinimized = { ...app, rustAlertMinimized: true };
  const htmlMinimized = renderGazettePopin(appMinimized, view);
  assert.match(htmlMinimized, /is-minimized/);
  assert.match(htmlMinimized, /minimized-rust-buoy/);
  assert.doesNotMatch(htmlMinimized, /minimized-rust-buoy is-hidden/);
  assert.match(htmlMinimized, /data-restore-gazette/);

  // Suppressed state
  const appSuppressed = {
    ...app,
    suppressedRustAlerts: { 'threat-3-4': true },
  };
  const htmlSuppressed = renderGazettePopin(appSuppressed, view);
  assert.match(htmlSuppressed, /is-minimized/);
  assert.match(htmlSuppressed, /minimized-rust-buoy/);
});

test('renderDetailedMapView mounts Gazette Pop-In inside map desktop without crashing', () => {
  const view = createMockState({ phase: '3', depot3Count: 1 });
  const app = {
    suppressedRustAlerts: {},
    rustAlertMinimized: false,
    mapWindows: { hex: {}, corporations: {}, trains: {}, privates: {}, activity: {} },
    selectedHex: 'E2',
    inspectedHex: 'E2',
    mapZoom: 1,
    mapPanX: 0,
    mapPanY: 0,
  };
  const catalog = { tiles: {}, phases: { '3': [null, ['yellow', 'green']] } };

  const mapHtml = renderDetailedMapView(app, view, catalog);
  assert.match(mapHtml, /data-testid="rust-popin-window"/);
  assert.match(mapHtml, /retro-titlebar/);
  assert.match(mapHtml, /minimized-rust-buoy/);
});
