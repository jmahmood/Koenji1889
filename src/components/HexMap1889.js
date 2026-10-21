import { renderGazettePopin } from './GazettePopin.js';
import {currentRouteEditor,displayedRoutes,routeQuote,stopName,syncRoutePlan} from '../ui/routePlanning.js';
import {renderCharacter} from '../scene/Character.js';
import {renderInlineTrainDesk, renderDepotTray} from './TrainDesk.js';
import {renderDistrictSurvey} from './DistrictSurvey.js';
import {routePlanner} from './DecisionDesk.js';
/**
 * Accurate Flat-Topped 1889 Shikoku Hex Map & Operating Round Desk.
 *
 * Uses the authoritative 52-hex board geometry (`state.board`) and 63-tile
 * catalog (`catalog.tiles`) from `daemon18xx/app/engine1889`.
 *
 * Symmetrical with the Stock Exchange view:
 * - Full-bleed interactive Shikoku SVG map as the main desktop background
 * - Modeless, draggable, resizable, maximizable inspection windows (keys 1–5)
 * - Unified 4-player Meiji portrait strip + Corporate Operating Turn callout
 * - Right-hand Corporate Operating Order Ticket explaining corporate agency
 *   and guiding the player step-by-step through Track → Token → Routes →
 *   Dividend → Train.
 */

import {
  CORP_META,
  HEX_NAMES,
  PRIVATE_META,
  TILE_FILL,
  TRAIN_ROUTE_COLORS,
  flatHexPolygon,
  hexCenter,
  hexEdgePoint,
} from '../constants1889.js';
import { renderVintagePrivateCard } from './PrivateCompanyCards.js';
import { mapActionAuthority, operatingRoundNumber, shortcutDescription } from '../ui/presentation.js';
import { mapTransform } from '../ui/mapNavigation.js';
import { MAP_WINDOW_MIN_SIZES } from '../ui/mapWindowSizes.js';

const money = (n) => `¥${Number(n || 0).toLocaleString()}`;

export const MAP_WINDOW_IDS = [
  'hex',
  'corporations',
  'trains',
  'privates',
  'activity',
];

const MAP_WINDOW_DEFS = [
  ['hex', 'District Survey', '地域案内'],
  ['corporations', 'Operating Order', '運行会社一覧'],
  ['trains', 'Trains & Routes', '列車・路線庫'],
  ['privates', 'Private Powers', '私有鉄道'],
  ['activity', 'Operating Log', '運行棋譜'],
];

const OP_STEPS = [
  { id: 'track', num: 1, label: 'Track', jp: '線路' },
  { id: 'token', num: 2, label: 'Token', jp: '駅設置' },
  { id: 'routes', num: 3, label: 'Routes', jp: '運行' },
  { id: 'dividend', num: 4, label: 'Dividend', jp: '配当' },
  { id: 'train', num: 5, label: 'Train', jp: '列車' },
];

// City names are cartographic annotations, not tile content. Keep them away
// from the center-to-edge corridors used by track and from revenue markers.
// Values are relative to the hex radius so the same anchors work in the full
// map and the corporation preview.
const CITY_LABEL_LAYOUT = {
  F1: { dx: -0.78, dy: -0.06, anchor: 'end', lines: ['Imabari', 'Onomichi Ferry'] },
  J1: { dx: 0.78, dy: -0.06, anchor: 'start', lines: ['Sakaide', 'Okayama Ferry'] },
  L7: { dx: 0.8, dy: -0.12, anchor: 'start', lines: ['Naruto', 'Osaka Ferry'] },
  E2: { dx: -0.54, dy: -0.42, anchor: 'end' },
  I2: { dx: -0.5, dy: -0.42, anchor: 'end' },
  B3: { dx: -0.64, dy: 0.02, anchor: 'end' },
  F3: { dx: 0.5, dy: 0.5, anchor: 'start' },
  C4: { dx: -0.48, dy: 0.48, anchor: 'end' },
  G4: { dx: 0.5, dy: 0.48, anchor: 'start' },
  I4: { dx: -0.5, dy: 0.5, anchor: 'end' },
  K4: { dx: 0.62, dy: 0.08, anchor: 'start' },
  J5: { dx: 0.5, dy: 0.48, anchor: 'start' },
  B7: { dx: -0.64, dy: 0.02, anchor: 'end' },
  H7: { dx: -0.5, dy: -0.46, anchor: 'end' },
  K8: { dx: 0.64, dy: 0.12, anchor: 'start' },
  F9: { dx: -0.56, dy: 0.48, anchor: 'end' },
  J9: { dx: 0.58, dy: 0.42, anchor: 'start' },
  A10: { dx: -0.58, dy: 0.46, anchor: 'end', lines: ['Sukumo', 'West'] },
  C10: { dx: -0.56, dy: 0.5, anchor: 'end' },
  G10: { dx: 0.5, dy: -0.46, anchor: 'start' },
  B11: { dx: -0.58, dy: 0.48, anchor: 'end' },
  J11: { dx: 0.56, dy: 0.48, anchor: 'start' },
  G12: { dx: -0.52, dy: 0.48, anchor: 'end' },
  I12: { dx: 0.54, dy: 0.48, anchor: 'start' },
  G14: { dx: 0, dy: 0.86, anchor: 'middle' },
};

const COMPACT_CITY_LABEL_LAYOUT = {
  F1: { dx: 0, dy: -0.86, anchor: 'middle' },
  J1: { dx: 0, dy: -0.86, anchor: 'middle' },
  G4: { dx: -0.5, dy: 0.48, anchor: 'end' },
  I4: { dx: 0.5, dy: 0.5, anchor: 'start' },
};

function renderCityLabel(coord, cityName, cx, cy, radius, compact = false) {
  if (!cityName) return '';
  const baseLayout = CITY_LABEL_LAYOUT[coord] || {
    dx: 0,
    dy: -0.62,
    anchor: 'middle',
  };
  const layout = compact
    ? { ...baseLayout, ...(COMPACT_CITY_LABEL_LAYOUT[coord] || {}) }
    : baseLayout;
  const lines = layout.lines || [cityName];
  const x = cx + layout.dx * radius;
  const y = cy + layout.dy * radius;
  const lineHeight = compact ? 6.5 : 8;
  const firstLineOffset = lines.length > 1 ? -lineHeight * 0.45 : 0;
  const lineMarkup = lines
    .map(
      (line, index) =>
        `<tspan x="${x.toFixed(1)}" dy="${index === 0 ? firstLineOffset : lineHeight}">${line}</tspan>`
    )
    .join('');
  const edgeClass = ['F1', 'J1', 'L7'].includes(coord) ? ' is-offboard' : '';

  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${layout.anchor}" class="${compact ? 'preview-city-label' : 'hex-city-caption'} map-city-label${edgeClass}" data-city-label="${coord}">${lineMarkup}</text>`;
}

export function parseCatalogTile(code, color, rotation = 0) {
  const nodes = [];
  const paths = [];
  let label = null;
  let port = false;
  for (const part of (code || '').split(';')) {
    if (!part) continue;
    const eqIdx = part.indexOf('=');
    const kind = eqIdx >= 0 ? part.slice(0, eqIdx) : part;
    const raw = eqIdx >= 0 ? part.slice(eqIdx + 1) : '';
    const params = {};
    for (const p of raw.split(',')) {
      const colonIdx = p.indexOf(':');
      if (colonIdx >= 0) {
        params[p.slice(0, colonIdx)] = p.slice(colonIdx + 1);
      }
    }
    if (kind === 'city' || kind === 'town' || kind === 'offboard') {
      const revRaw = params.revenue || '0';
      let rev = 0;
      if (revRaw.includes('|')) {
        const firstPart = revRaw.split('|')[0];
        rev = parseInt(firstPart.split('_')[1] || '0', 10);
      } else {
        rev = parseInt(revRaw, 10) || 0;
      }
      nodes.push({
        kind,
        revenue: [rev, rev, rev],
        slots: parseInt(params.slots || '1', 10),
      });
    } else if (kind === 'path') {
      const ep = (v) =>
        v.startsWith('_')
          ? `n${v.slice(1)}`
          : `e${(parseInt(v, 10) + rotation) % 6}`;
      if (params.a !== undefined && params.b !== undefined) {
        paths.push([ep(params.a), ep(params.b)]);
      }
    } else if (kind === 'label') {
      label = raw;
    } else if (kind === 'icon' && params.image === 'port') {
      port = true;
    }
  }
  return { color, nodes, paths, label, port, rotation };
}

function nextTileColor(currentColor) {
  const order = ['white', 'yellow', 'green', 'brown'];
  const idx = order.indexOf(currentColor);
  return idx >= 0 && idx + 1 < order.length ? order[idx + 1] : null;
}

const HEX_DELTAS = [
  [0, 2],
  [-1, 1],
  [-1, -1],
  [0, -2],
  [1, -1],
  [1, 1],
];

const TILE_UPGRADE_ALLOWLIST = {
  3: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  5: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  6: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  7: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  8: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  9: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  57: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  58: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  438: ['12', '13', '14', '15', '16', '19', '20', '23', '24', '25', '26', '27', '28', '29', '205', '206', '439', '440'],
  12: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  13: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  14: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  15: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  16: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  19: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  20: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  23: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  24: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  25: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  26: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  27: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  28: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  29: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  205: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  206: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  439: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
  440: ['39', '40', '41', '42', '45', '46', '47', '448', '465', '466', '492', '611'],
};

function neighborCoord(coord, edge) {
  const [dc, dr] = HEX_DELTAS[((edge % 6) + 6) % 6];
  const colChar = String.fromCharCode(coord.charCodeAt(0) + dc);
  const rowNum = parseInt(coord.slice(1), 10) + dr;
  return `${colChar}${rowNum}`;
}

function normalizePathPair(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function tilePathSignature(parsed) {
  return (parsed.paths || [])
    .map(([a, b]) => normalizePathPair(a, b))
    .sort()
    .join('|');
}

function preservesOldTrackAndTokens(oldHex, newParsed) {
  const oldNodes = oldHex.nodes || [];
  const newNodes = newParsed.nodes || [];
  if (oldNodes.length !== newNodes.length) return false;
  for (let i = 0; i < oldNodes.length; i++) {
    if (oldNodes[i].kind !== newNodes[i].kind) return false;
    const tokCount = (oldHex.tokens?.[i] || []).length;
    if (tokCount > (newNodes[i].slots || 1)) return false;
  }
  const newPathSet = new Set(
    (newParsed.paths || []).map(([a, b]) => normalizePathPair(a, b))
  );
  for (const [a, b] of oldHex.paths || []) {
    if (!newPathSet.has(normalizePathPair(a, b))) {
      return false;
    }
  }
  return true;
}

function computeReachableVerticesClient(board, corporationId) {
  if (!board || !corporationId) return new Set();
  const adj = new Map();
  const addEdge = (u, v) => {
    if (!adj.has(u)) adj.set(u, new Set());
    if (!adj.has(v)) adj.set(v, new Set());
    adj.get(u).add(v);
    adj.get(v).add(u);
  };

  for (const [coord, tile] of Object.entries(board)) {
    for (const [a, b] of tile.paths || []) {
      addEdge(`${coord}:${a}`, `${coord}:${b}`);
    }
    const exits = new Set();
    for (const [a, b] of tile.paths || []) {
      if (a.startsWith('e')) exits.add(a);
      if (b.startsWith('e')) exits.add(b);
    }
    for (const ep of exits) {
      const edge = parseInt(ep.slice(1), 10);
      const other = neighborCoord(coord, edge);
      const opp = `e${(edge + 3) % 6}`;
      if (
        board[other] &&
        (board[other].paths || []).some((p) => p.includes(opp))
      ) {
        addEdge(`${coord}:${ep}`, `${other}:${opp}`);
      }
    }
  }

  const starts = [];
  for (const [coord, tile] of Object.entries(board)) {
    (tile.tokens || []).forEach((slots, idx) => {
      if ((slots || []).includes(corporationId)) {
        starts.push(`${coord}:n${idx}`);
      }
    });
  }

  const seen = new Set(starts);
  const queue = [...starts];
  while (queue.length) {
    const curr = queue.shift();
    const [coord, part] = curr.split(':');
    if (!starts.includes(curr) && part.startsWith('n')) {
      const nIdx = parseInt(part.slice(1), 10);
      const node = board[coord]?.nodes?.[nIdx];
      const toks = board[coord]?.tokens?.[nIdx] || [];
      if (node?.kind === 'offboard') continue;
      if (
        node?.kind === 'city' &&
        !toks.includes(corporationId) &&
        toks.length >= (node.slots || 1)
      ) {
        continue;
      }
    }
    for (const nxt of adj.get(curr) || []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return seen;
}

export function getLegalPlacementsForHex(
  state,
  catalog,
  coord,
  corporationId = null,
  viewData = null
) {
  if (!state || !catalog || !coord || !state.board?.[coord]) return [];

  if (viewData?.legal_tile_lays) {
    return (viewData.legal_tile_lays[coord] || []).map((entry) => {
      const spec = catalog.tiles?.[entry.tile] || {};
      return {
        tile: entry.tile,
        rotation: entry.rotation,
        color: entry.color || spec.color,
        cost: entry.cost ?? (state.board[coord]?.cost || 0),
        special: entry.special || null,
        remaining: state.tiles?.[entry.tile] ?? spec.count ?? 1,
        code: spec.code || '',
        parsed: parseCatalogTile(
          spec.code || '',
          entry.color || spec.color,
          entry.rotation
        ),
      };
    });
  }

  const hexObj = state.board[coord];
  if (hexObj.color === 'red' || hexObj.color === 'gray' || hexObj.port) {
    return [];
  }
  const targetColor = nextTileColor(hexObj.color);
  if (!targetColor) return [];
  const phaseColors = catalog.phases?.[state.phase]?.[1] || ['yellow'];
  if (!phaseColors.includes(targetColor)) return [];

  for (const priv of Object.values(state.privates || {})) {
    if (
      !priv.closed &&
      (state.player_order || []).includes(priv.owner) &&
      (priv.hexes || []).includes(coord)
    ) {
      return [];
    }
  }

  const activeCid = corporationId || state.current_corporation;
  const corp = activeCid ? state.corporations?.[activeCid] : null;
  let terrainCost = hexObj.cost || 0;
  const smr = state.privates?.SMR;
  if (
    smr &&
    smr.owner === activeCid &&
    !smr.closed &&
    (hexObj.terrain || []).length === 1 &&
    hexObj.terrain[0] === 'mountain'
  ) {
    terrainCost = 0;
  }
  if (corp && corp.cash < terrainCost) {
    return [];
  }

  const canReach = activeCid
    ? computeReachableVerticesClient(state.board, activeCid)
    : null;

  const oldKinds = (hexObj.nodes || []).map((n) => n.kind).join(',');
  const tileSortOrder = {
    9: 1,
    8: 2,
    7: 3,
    57: 4,
    6: 5,
    5: 6,
    58: 7,
    3: 8,
    438: 9,
    14: 10,
    15: 11,
    611: 12,
    448: 13,
  };
  const sortedTileEntries = Object.entries(catalog.tiles || {}).sort(
    ([a], [b]) =>
      (tileSortOrder[a] || 50) - (tileSortOrder[b] || 50) ||
      parseInt(a, 10) - parseInt(b, 10)
  );

  const placements = [];
  for (const [tid, spec] of sortedTileEntries) {
    if (tid === '437') continue;
    if (spec.color !== targetColor) continue;
    const remaining = state.tiles?.[tid] ?? spec.count ?? 0;
    if (remaining <= 0) continue;
    if (
      hexObj.tile &&
      TILE_UPGRADE_ALLOWLIST[hexObj.tile] &&
      !TILE_UPGRADE_ALLOWLIST[hexObj.tile].includes(tid)
    ) {
      continue;
    }

    const baseParsed = parseCatalogTile(spec.code, spec.color, 0);
    if ((baseParsed.label || null) !== (hexObj.label || null)) continue;
    const newKinds = (baseParsed.nodes || []).map((n) => n.kind).join(',');
    if (oldKinds !== newKinds) continue;

    const seenSigs = new Set();
    for (let rot = 0; rot < 6; rot++) {
      const parsed = parseCatalogTile(spec.code, spec.color, rot);
      const sig = tilePathSignature(parsed);
      if (seenSigs.has(sig)) continue;

      if (!preservesOldTrackAndTokens(hexObj, parsed)) continue;

      const exits = new Set();
      for (const [a, b] of parsed.paths || []) {
        if (a.startsWith('e')) exits.add(parseInt(a.slice(1), 10));
        if (b.startsWith('e')) exits.add(parseInt(b.slice(1), 10));
      }

      let edgesValid = true;
      for (const edge of exits) {
        const otherCoord = neighborCoord(coord, edge);
        const otherHex = state.board[otherCoord];
        if (!otherHex) {
          edgesValid = false;
          break;
        }
        const oppEdge = (edge + 3) % 6;
        if (
          (hexObj.borders || []).includes(edge) ||
          (otherHex.borders || []).includes(oppEdge)
        ) {
          edgesValid = false;
          break;
        }
        if (
          otherHex.color === 'gray' &&
          !(otherHex.paths || []).some((p) => p.includes(`e${oppEdge}`))
        ) {
          edgesValid = false;
          break;
        }
      }
      if (!edgesValid) continue;

      if (canReach && canReach.size > 0) {
        const nodeConnected = (hexObj.nodes || []).some((_, idx) =>
          canReach.has(`${coord}:n${idx}`)
        );
        const edgeConnected = [...exits].some((edge) => {
          const otherCoord = neighborCoord(coord, edge);
          const oppEdge = (edge + 3) % 6;
          return canReach.has(`${otherCoord}:e${oppEdge}`);
        });
        if (!nodeConnected && !edgeConnected) continue;
      }

      seenSigs.add(sig);
      placements.push({
        tile: tid,
        rotation: rot,
        color: spec.color,
        cost: terrainCost,
        special: null,
        remaining,
        code: spec.code,
        parsed,
      });
    }
  }
  return placements;
}

export function getCandidateTilesForHex(state, catalog, coord, viewData = null) {
  const legal = getLegalPlacementsForHex(state, catalog, coord, null, viewData);
  const byTile = new Map();
  for (const item of legal) {
    if (!byTile.has(item.tile)) {
      byTile.set(item.tile, {
        id: item.tile,
        color: item.color,
        remaining: item.remaining,
        code: item.code,
        parsed: item.parsed,
        rotations: [item.rotation],
      });
    } else {
      byTile.get(item.tile).rotations.push(item.rotation);
    }
  }
  return [...byTile.values()];
}

export function getCityValuationProfile(coord, hexObj, state, catalog) {
  const name = HEX_NAMES[coord] || `Shikoku Sector ${coord}`;
  const nodes = hexObj?.nodes || [];
  const primaryNode = nodes[0] || null;
  const kind = primaryNode?.kind || 'countryside';
  const label = hexObj?.label || null;
  const homeCorp = Object.values(CORP_META).find((c) => c.home === coord);
  const placedTokens = (hexObj?.tokens?.[0] || []).slice();

  let currentRev = 0;
  if (primaryNode) {
    if (Array.isArray(primaryNode.revenue)) {
      const phaseIdx =
        state.phase === 'D'
          ? 2
          : ['5', '6'].includes(String(state.phase))
            ? 1
            : 0;
      currentRev = primaryNode.revenue[phaseIdx] ?? primaryNode.revenue[0] ?? 0;
    } else {
      currentRev = primaryNode.revenue || 0;
    }
  }

  let categoryTitle = 'Countryside & Mountain Pass';
  let summaryNote =
    'Plain track hex — connects cities, towns, and ports across Shikoku.';
  let stages = [];
  let candidateTileIds = [];

  if (kind === 'offboard') {
    const revArr = primaryNode.revenue || [20, 40, 80];
    categoryTitle = 'Mainland Ferry / Offboard Terminal (連絡船・本州連絡)';
    summaryNote =
      'Permanent red offboard destination. Cannot be upgraded with tiles, but its revenue jumps automatically in Phase 5 (Brown) and Phase D (Diesel).';
    stages = [
      {
        stage: 'Phase 2–4 (Yellow / Green)',
        color: 'yellow',
        revenue: `¥${revArr[0]}`,
        slots: 'Offboard',
        detail: 'Early-to-mid game ferry terminal yield',
        active: ['2', '3', '4'].includes(String(state.phase)),
      },
      {
        stage: 'Phase 5–6 (Brown)',
        color: 'brown',
        revenue: `¥${revArr[1]}`,
        slots: 'Offboard',
        detail: 'Mid-to-late game mainland traffic boost',
        active: ['5', '6'].includes(String(state.phase)),
      },
      {
        stage: 'Phase D (Diesel)',
        color: 'red',
        revenue: `¥${revArr[2]}`,
        slots: 'Offboard',
        detail: 'Maximum Diesel-era mainland corridor yield',
        active: String(state.phase) === 'D',
      },
    ];
  } else if (coord === 'I4' || label === 'H') {
    categoryTitle = 'Special Pilgrimage Hub · Kotohira (H-Label Special City)';
    summaryNote =
      'Kotohira (琴平) has its own exclusive H-tile upgrade chain (#438 → #439 → #492) and grows into the highest-value city on Shikoku (¥80 with 3 station slots!).';
    stages = [
      {
        stage: 'Start (White)',
        color: 'white',
        revenue: '¥0',
        slots: '1 slot',
        detail: 'Unbuilt mountain shrine town (¥80 terrain cost)',
        active: hexObj.color === 'white',
      },
      {
        stage: 'Phase 2+ · Yellow (#438)',
        color: 'yellow',
        revenue: '¥40',
        slots: '1 slot · 2 exits',
        detail: 'Doubles normal yellow city revenue (¥40 vs ¥20)',
        active: hexObj.color === 'yellow',
      },
      {
        stage: 'Phase 3+ · Green (#439)',
        color: 'green',
        revenue: '¥60',
        slots: '2 slots · 3 exits',
        detail: 'Opens 2nd station slot and jumps to ¥60',
        active: hexObj.color === 'green',
      },
      {
        stage: 'Phase 5+ · Brown (#492)',
        color: 'brown',
        revenue: '¥80',
        slots: '3 slots · 6 exits',
        detail: 'Richest single city on Shikoku (¥80, radial 6-exit hub)',
        active: hexObj.color === 'brown',
      },
    ];
    candidateTileIds = ['438', '439', '492'];
  } else if (coord === 'K4' || label === 'T') {
    categoryTitle = 'Special Harbour Metropolis · Takamatsu (T-Label City)';
    summaryNote =
      'Home of Takamatsu & Kotohira Electric (KO). Blocked while Takamatsu E-Railroad (TR private) is player-owned. Upgrades via exclusive T-tiles (#440 → #466) up to ¥60.';
    stages = [
      {
        stage: 'Start · Pre-printed Yellow',
        color: 'yellow',
        revenue: '¥30',
        slots: '1 slot (KO Home)',
        detail: 'Starts at ¥30 with 3 pre-printed track exits',
        active: hexObj.color === 'yellow',
      },
      {
        stage: 'Phase 3+ · Green (#440)',
        color: 'green',
        revenue: '¥40',
        slots: '2 slots · 3 exits',
        detail: 'Unlocks 2nd station slot and rises to ¥40',
        active: hexObj.color === 'green',
      },
      {
        stage: 'Phase 5+ · Brown (#466)',
        color: 'brown',
        revenue: '¥60',
        slots: '2 slots · 3 exits',
        detail: 'High-value eastern anchor worth ¥60 per train',
        active: hexObj.color === 'brown',
      },
    ];
    candidateTileIds = ['440', '466'];
  } else if (coord === 'F9' || label === 'K') {
    categoryTitle = 'Special Southern Capital · Kōchi (K-Label City)';
    summaryNote =
      'Home of Tosa Electric Railway (TR). Starts as a pre-printed Green city (¥30, 2 slots) and upgrades in Phase 5+ to Brown #465 (¥60, 3 slots).';
    stages = [
      {
        stage: 'Start · Pre-printed Green',
        color: 'green',
        revenue: '¥30',
        slots: '2 slots (TR Home)',
        detail: 'Pre-built 4-exit southern hub (¥80 upgrade terrain)',
        active: hexObj.color === 'green',
      },
      {
        stage: 'Phase 5+ · Brown (#465)',
        color: 'brown',
        revenue: '¥60',
        slots: '3 slots · 4 exits',
        detail: 'Doubles revenue to ¥60 and adds a 3rd station slot',
        active: hexObj.color === 'brown',
      },
    ];
    candidateTileIds = ['465'];
  } else if (coord === 'B7' && hexObj.color === 'gray') {
    categoryTitle = 'Permanent Western Citadel · Uwajima (Fixed Gray City)';
    summaryNote =
      'Home of Uwajima Railway (UR). Pre-printed Gray city that starts at a strong ¥40 with 2 station slots from Turn 1, but cannot be upgraded further.';
    stages = [
      {
        stage: 'All Phases · Fixed Gray',
        color: 'gray',
        revenue: '¥40',
        slots: '2 slots (UR Home) · 3 exits',
        detail: 'Immediate ¥40 revenue from Phase 2 through Endgame',
        active: true,
      },
    ];
  } else if (kind === 'city') {
    categoryTitle = `Standard Shikoku City${homeCorp ? ` (${homeCorp.short} Home)` : ''}`;
    summaryNote =
      'Upgrades from White (¥0) → Yellow (¥20, 1 slot) → Green (¥30, 1–2 slots) → Brown (¥40, 2 slots). Choose #14 or #15 in Green to unlock a 2nd station slot.';
    stages = [
      {
        stage: 'Start (White)',
        color: 'white',
        revenue: hexObj.color === 'white' ? `¥${currentRev}` : '¥0',
        slots: '1 slot',
        detail: hexObj.cost
          ? `Unbuilt city · Terrain cost ¥${hexObj.cost}`
          : 'Unbuilt city · Free terrain (¥0)',
        active: hexObj.color === 'white',
      },
      {
        stage: 'Phase 2+ · Yellow (#5, #6, #57)',
        color: 'yellow',
        revenue: '¥20',
        slots: '1 slot · 2 exits',
        detail: 'Initial track connection (straight #57, gentle #6, sharp #5)',
        active: hexObj.color === 'yellow',
      },
      {
        stage: 'Phase 3+ · Green (#14, #15, #12, #13, #205, #206)',
        color: 'green',
        revenue: '¥30',
        slots: '1–2 slots · 3–4 exits',
        detail: 'Tiles #14 & #15 add a 2nd station slot (4 exits)',
        active: hexObj.color === 'green',
      },
      {
        stage: 'Phase 5+ · Brown (#448, #611)',
        color: 'brown',
        revenue: '¥40',
        slots: '2 slots · 4–5 exits',
        detail: 'Mature regional hub worth ¥40 per train',
        active: hexObj.color === 'brown',
      },
    ];
    candidateTileIds = ['57', '6', '5', '14', '15', '12', '13', '205', '206', '448', '611'];
  } else if (kind === 'town') {
    if (hexObj.color === 'gray') {
      categoryTitle = 'Pre-printed Coastal Town (Fixed Gray Town)';
      summaryNote =
        'Permanent ¥20 gray town with pre-built track. Counts as 1 stop for trains and requires no tile lay.';
      stages = [
        {
          stage: 'All Phases · Fixed Gray',
          color: 'gray',
          revenue: '¥20',
          slots: 'No token slot (Town)',
          detail: 'Permanent ¥20 stop along coastal corridor',
          active: true,
        },
      ];
    } else if (['B11', 'G10', 'I12', 'J9'].includes(coord) || hexObj.port) {
      categoryTitle = 'Coastal Port Town · 港町 (Mitsubishi Ferry Eligible)';
      summaryNote =
        'Standard yellow town tiles (#3, #58) make this worth ¥10 permanently. However, the owner of Mitsubishi Ferry (MF) can lay Port Tile #437 here for a permanent ¥30 town!';
      stages = [
        {
          stage: 'Start (White)',
          color: 'white',
          revenue: '¥0',
          slots: 'Town (⚓ Port eligible)',
          detail: 'Unbuilt coastal harbour town',
          active: hexObj.color === 'white',
        },
        {
          stage: 'Phase 2+ · Standard Yellow (#3, #58)',
          color: 'yellow',
          revenue: '¥10',
          slots: 'Town · 2 exits',
          detail: 'Standard town track (cannot be upgraded further)',
          active: hexObj.color === 'yellow' && !hexObj.port,
        },
        {
          stage: 'Special MF Power · Port Tile (#437)',
          color: 'yellow',
          revenue: '¥30',
          slots: 'Permanent Port Town · 2 exits',
          detail: 'Triples town value to ¥30 permanently via Mitsubishi Ferry!',
          active: Boolean(hexObj.port && hexObj.tile === '437'),
        },
      ];
      candidateTileIds = ['58', '3', '437'];
    } else {
      categoryTitle = 'Inland Town · 町';
      summaryNote =
        'Upgrades once to a Yellow town tile (#3 or #58) worth ¥10 for the rest of the game.';
      stages = [
        {
          stage: 'Start (White)',
          color: 'white',
          revenue: '¥0',
          slots: 'Town',
          detail: 'Unbuilt town',
          active: hexObj.color === 'white',
        },
        {
          stage: 'Phase 2+ · Yellow (#3, #58)',
          color: 'yellow',
          revenue: '¥10',
          slots: 'Town · 2 exits',
          detail: 'Permanent ¥10 stop',
          active: hexObj.color === 'yellow',
        },
      ];
      candidateTileIds = ['58', '3'];
    }
  } else {
    stages = [
      {
        stage: 'Phase 2+ · Yellow (#9, #8, #7)',
        color: 'yellow',
        revenue: '¥0 (Track)',
        slots: 'Single track',
        detail: hexObj?.cost
          ? `Terrain fee ¥${hexObj.cost} (${(hexObj.terrain || []).join(', ')})`
          : 'Clear countryside (¥0)',
        active: hexObj?.color === 'yellow',
      },
      {
        stage: 'Phase 3+ · Green (#16–#29)',
        color: 'green',
        revenue: '¥0 (Track)',
        slots: '2 track paths',
        detail: 'Allows junctions, crossings, and parallel routes',
        active: hexObj?.color === 'green',
      },
      {
        stage: 'Phase 5+ · Brown (#39–#47)',
        color: 'brown',
        revenue: '¥0 (Track)',
        slots: '3–4 track paths',
        detail: 'High-density multi-route interchanges',
        active: hexObj?.color === 'brown',
      },
    ];
    candidateTileIds = ['9', '8', '7', '19', '23', '24', '39', '40'];
  }

  const upgradeTiles = candidateTileIds
    .filter((tid) => catalog?.tiles?.[tid])
    .map((tid) => {
      const spec = catalog.tiles[tid];
      const parsed = parseCatalogTile(spec.code, spec.color, 0);
      const rev = parsed.nodes?.[0]?.revenue?.[0] || 0;
      const slots = parsed.nodes?.[0]?.slots || 0;
      return {
        id: tid,
        color: spec.color,
        code: spec.code,
        remaining: state.tiles?.[tid] ?? spec.count ?? 0,
        totalCount: spec.count ?? 1,
        revenue: rev,
        slots,
      };
    });

  return {
    coord,
    name,
    kind,
    categoryTitle,
    summaryNote,
    currentRev,
    currentSlots: primaryNode?.slots || 0,
    placedTokens,
    homeCorp,
    stages,
    upgradeTiles,
  };
}

function endpointCoord(cx, cy, ep, nodesCount, radius) {
  if (ep.startsWith('e')) {
    const edgeIdx = parseInt(ep.slice(1), 10);
    return hexEdgePoint(cx, cy, edgeIdx, radius);
  }
  if (ep.startsWith('n')) {
    const nIdx = parseInt(ep.slice(1), 10);
    if (nodesCount <= 1 || nIdx === 0) {
      return { x: cx, y: cy };
    }
    return { x: cx + (nIdx === 1 ? 10 : -10), y: cy + (nIdx === 1 ? -8 : 8) };
  }
  return { x: cx, y: cy };
}

function renderHexTrackAndNodes(
  coord,
  hexObj,
  cx,
  cy,
  radius,
  highlightedSegments = new Set(),
  compact = false
) {
  const paths = hexObj.paths || [];
  const nodes = hexObj.nodes || [];
  const tokens = hexObj.tokens || [];
  const parts = [];

  // Render track paths
  for (const [a, b] of paths) {
    const p1 = endpointCoord(cx, cy, a, nodes.length, radius);
    const p2 = endpointCoord(cx, cy, b, nodes.length, radius);
    const segKey1 = `${coord}:${a}-${coord}:${b}`;
    const segKey2 = `${coord}:${b}-${coord}:${a}`;
    const isRoute =
      highlightedSegments.has(segKey1) || highlightedSegments.has(segKey2);

    let d = '';
    if (a.startsWith('e') && b.startsWith('e')) {
      const qx = cx;
      const qy = cy;
      d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    } else {
      d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="#1e1712" stroke-width="${compact ? 4.2 : 6.2}" stroke-linecap="round" />`
    );
    parts.push(
      `<path d="${d}" fill="none" stroke="${isRoute ? '#ffcf56' : '#f1e4c3'}" stroke-width="${compact ? 1.8 : 2.6}" stroke-linecap="round" ${isRoute ? 'stroke-dasharray="4 2"' : ''} />`
    );
  }

  // Render terrain/upgrade cost badge if unbuilt or costly
  if (!compact && hexObj.cost > 0) {
    const terrainIcon = (hexObj.terrain || []).includes('mountain')
      ? '▲'
      : (hexObj.terrain || []).includes('water')
        ? '≈'
        : '¥';
    parts.push(
      `<g class="hex-terrain-badge" transform="translate(${cx.toFixed(1)}, ${(cy + radius * 0.56).toFixed(1)})">
        <rect x="-18" y="-7" width="36" height="13" rx="3" fill="#2c1c12dd" stroke="#b68a46" stroke-width="0.8"/>
        <text x="0" y="2.5" text-anchor="middle" fill="#f3d285" font-size="7.5" font-family="DM Mono">${terrainIcon}${hexObj.cost}</text>
      </g>`
    );
  }

  // Render port icon if coastal town
  if (!compact && hexObj.port && !hexObj.tile) {
    parts.push(
      `<text x="${(cx - radius * 0.45).toFixed(1)}" y="${(cy - radius * 0.32).toFixed(1)}" text-anchor="middle" fill="#21536b" font-size="9" title="Port eligible (MF)">⚓</text>`
    );
  }

  // Render revenue nodes (cities, towns, offboards)
  nodes.forEach((node, idx) => {
    const pt = endpointCoord(cx, cy, `n${idx}`, nodes.length, radius);
    const nodeTokens = tokens[idx] || [];
    const revVal = Array.isArray(node.revenue) ? node.revenue[0] : node.revenue;

    if (node.kind === 'town') {
      parts.push(
        `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${compact ? 3.5 : 5.5}" fill="#231914" stroke="#f5e7c4" stroke-width="1.5" />`
      );
    } else if (node.kind === 'offboard') {
      const low = node.revenue?.[0] ?? 20;
      const high = node.revenue?.[1] ?? 40;
      const diesel = node.revenue?.[2] ?? 80;
      if (!compact) {
        parts.push(
          `<g transform="translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})">
            <rect x="-22" y="-9" width="44" height="18" rx="3" fill="#231411" stroke="#f2c879" stroke-width="1.2"/>
            <text x="0" y="3" text-anchor="middle" fill="#ffdf9a" font-size="7.5" font-family="DM Mono">${low}/${high}/${diesel}</text>
          </g>`
        );
      }
    } else {
      // City with slots
      const slots = node.slots || 1;
      const slotRadius = compact ? 5.5 : 9.5;
      for (let s = 0; s < slots; s++) {
        const offsetX =
          slots === 1 ? 0 : (s - (slots - 1) / 2) * (slotRadius * 1.95);
        const sx = pt.x + offsetX;
        const sy = pt.y;
        const tokCorp = nodeTokens[s];
        const corpMeta = tokCorp ? CORP_META[tokCorp] : null;
        parts.push(
          `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${slotRadius}" fill="${corpMeta ? corpMeta.color : '#f8efda'}" stroke="#231710" stroke-width="${compact ? 1.2 : 1.8}" />`
        );
        if (tokCorp) {
          parts.push(
            `<text x="${sx.toFixed(1)}" y="${(sy + (compact ? 2 : 3)).toFixed(1)}" text-anchor="middle" fill="${corpMeta ? corpMeta.text : '#111'}" font-size="${compact ? 5.2 : 7.5}" font-weight="700" font-family="DM Mono">${tokCorp}</text>`
          );
        } else if (!compact) {
          // Check if home reservation
          const homeCorp = Object.values(CORP_META).find(
            (c) => c.home === coord && s === 0
          );
          if (homeCorp) {
            parts.push(
              `<text x="${sx.toFixed(1)}" y="${(sy + 2.8).toFixed(1)}" text-anchor="middle" fill="#7d6a52" font-size="6.8" font-family="DM Mono">${homeCorp.short}</text>`
            );
          }
        }
      }
    }

    if (!compact && revVal > 0 && node.kind !== 'offboard') {
      parts.push(
        `<g transform="translate(${(pt.x + radius * 0.42).toFixed(1)}, ${(pt.y - radius * 0.36).toFixed(1)})">
          <circle cx="0" cy="0" r="7.5" fill="#1b130e" stroke="#d8ae5e" stroke-width="1"/>
          <text x="0" y="2.6" text-anchor="middle" fill="#f7deb0" font-size="6.8" font-family="DM Mono">${revVal}</text>
        </g>`
      );
    }
  });

  return parts.join('');
}

function renderMiniTileSVG(specCode, color, rotation = 0) {
  const parsed = parseCatalogTile(specCode, color, rotation);
  const cx = 24;
  const cy = 22;
  const radius = 19;
  const poly = flatHexPolygon(cx, cy, radius);
  const fill = TILE_FILL[color] || '#e7cf73';
  return `<svg viewBox="0 0 48 44" class="mini-tile-svg" aria-hidden="true">
    <polygon points="${poly}" fill="${fill}" stroke="#3e2d1a" stroke-width="1.3" />
    ${renderHexTrackAndNodes('PREVIEW', parsed, cx, cy, radius, new Set(), true)}
  </svg>`;
}

export function renderBoardMiniatureSVG(state) {
  const board = state?.board || {};
  const radius = 15.2;
  const originX = 44;
  const originY = 20;
  const hexElements = [];

  for (const [coord, hexObj] of Object.entries(board)) {
    const { cx, cy } = hexCenter(coord, radius, originX, originY);
    const poly = flatHexPolygon(cx, cy, radius - 0.5);
    const fill = TILE_FILL[hexObj.color] || '#e5dbb4';
    hexElements.push(
      `<g data-table-hex="${coord}">
        <polygon points="${poly}" fill="${fill}" stroke="#523d24" stroke-width="1.05" />
        ${renderHexTrackAndNodes(coord, hexObj, cx, cy, radius, new Set(), true)}
      </g>`
    );
  }

  return `<svg viewBox="0 0 348 228" role="img" aria-label="Live 1889 Shikoku Board on Table" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="table-board-sea" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#285c6e" />
        <stop offset="55%" stop-color="#1f4c5c" />
        <stop offset="100%" stop-color="#173c4a" />
      </linearGradient>
    </defs>
    <rect width="348" height="228" rx="3" fill="url(#table-board-sea)" stroke="#cbb482" stroke-width="3" />
    <rect x="4.5" y="4.5" width="339" height="219" rx="2" fill="none" stroke="#85693c" stroke-width="1" />
    <!-- Subtle maritime wave lines -->
    <g stroke="#4e8396" stroke-width="0.7" opacity="0.45" fill="none">
      <path d="M16 56c8-3 16-3 24 0s16 3 24 0" />
      <path d="M276 34c8-3 16-3 24 0s16 3 24 0" />
      <path d="M24 196c10-3 20-3 30 0s20 3 30 0" />
    </g>
    <text x="16" y="24" fill="#f3e5c2" font-size="13" font-weight="700" font-family="Libre Baskerville" letter-spacing="1.2">SHIKOKU</text>
    <text x="17" y="38" fill="#d9c598" font-size="9.5" font-family="Libre Baskerville">四国</text>
    ${hexElements.join('')}
    <!-- Compass Rose (Bottom-Right) -->
    <g transform="translate(316, 196)" stroke="#dfd0ab" fill="none" opacity="0.85">
      <circle cx="0" cy="0" r="11" stroke-width="0.9" />
      <circle cx="0" cy="0" r="2" fill="#dfd0ab" />
      <path d="M0 -14 L0 14 M-14 0 L14 0 M-8 -8 L8 8 M-8 8 L8 -8" stroke-width="0.8" />
      <text x="0" y="-16" text-anchor="middle" fill="#f3e5c2" stroke="none" font-size="6.5" font-weight="700" font-family="Libre Baskerville">N</text>
    </g>
  </svg>`;
}

/**
 * Read-only geographic context for a corporation on the stock screen.
 * Uses the same board state and rendering primitives as the full map, but
 * computes a viewport around the corporation's home and placed tokens.
 */
export function renderCorporationMapPreview(state, corporationId) {
  const board = state?.board || {};
  const corporation = state?.corporations?.[corporationId];
  if (!corporation || !Object.keys(board).length) return '';

  const radius = 25;
  const originX = 48;
  const originY = 30;
  const home = corporation.home;
  const stationHexes = [];

  for (const [coord, hexObj] of Object.entries(board)) {
    const hasToken = (hexObj.tokens || []).some((slots) =>
      (slots || []).includes(corporationId)
    );
    if (hasToken) stationHexes.push(coord);
  }

  const focusCoords = [...new Set([home, ...stationHexes].filter(Boolean))];
  const focusCenters = focusCoords
    .filter((coord) => board[coord])
    .map((coord) => hexCenter(coord, radius, originX, originY));
  const fallback =
    home && board[home]
      ? hexCenter(home, radius, originX, originY)
      : { cx: 255, cy: 185 };
  const minX = focusCenters.length
    ? Math.min(...focusCenters.map((p) => p.cx))
    : fallback.cx;
  const maxX = focusCenters.length
    ? Math.max(...focusCenters.map((p) => p.cx))
    : fallback.cx;
  const minY = focusCenters.length
    ? Math.min(...focusCenters.map((p) => p.cy))
    : fallback.cy;
  const maxY = focusCenters.length
    ? Math.max(...focusCenters.map((p) => p.cy))
    : fallback.cy;
  const width = Math.max(330, maxX - minX + 190);
  const height = Math.max(215, maxY - minY + 140);
  const viewX = (minX + maxX) / 2 - width / 2;
  const viewY = (minY + maxY) / 2 - height / 2;
  const hexElements = [];
  const cityLabels = [];
  const tokenOverlays = [];
  const homeOverlays = [];

  for (const [coord, hexObj] of Object.entries(board)) {
    const { cx, cy } = hexCenter(coord, radius, originX, originY);
    const poly = flatHexPolygon(cx, cy, radius - 0.7);
    const fill = TILE_FILL[hexObj.color] || '#dfd5a7';
    const isHome = coord === home;
    if(isHome) homeOverlays.push(`<g class="company-home-beacon" role="img" aria-label="${corporationId} home ${home}"><path d="M${cx} ${cy-10}v-17" stroke="#fff2b2" stroke-width="2"/><rect x="${cx-39}" y="${cy-39}" width="78" height="13" rx="3" fill="${CORP_META[corporationId]?.color || '#663322'}" stroke="#fff2b2"/><text x="${cx}" y="${cy-30}" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="8">HOME · ${corporationId} · ${home}</text></g>`);
    const hasSelectedToken = stationHexes.includes(coord);
    const relevant = isHome || hasSelectedToken;
    hexElements.push(
      `<g opacity="${relevant ? '1' : '0.82'}">
        <polygon points="${poly}" fill="${fill}" stroke="${relevant ? '#e2ad48' : '#59452b'}" stroke-width="${relevant ? '2.2' : '1'}" />
        ${renderHexTrackAndNodes(coord, hexObj, cx, cy, radius, new Set(), true)}
      </g>`
    );
    cityLabels.push(
      renderCityLabel(coord, HEX_NAMES[coord], cx, cy, radius, true)
    );

    (hexObj.nodes || []).forEach((node, nodeIdx) => {
      const nodeTokens = (hexObj.tokens || [])[nodeIdx] || [];
      nodeTokens.forEach((tokenCorp, slotIdx) => {
        if (tokenCorp !== corporationId) return;
        const pt = endpointCoord(
          cx,
          cy,
          `n${nodeIdx}`,
          (hexObj.nodes || []).length,
          radius
        );
        const slots = node.slots || 1;
        const sx = pt.x + (slots === 1 ? 0 : (slotIdx - (slots - 1) / 2) * 11);
        tokenOverlays.push(
          `<circle cx="${sx.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="8.5" fill="none" stroke="#fff2b2" stroke-width="2.2" />`
        );
      });
    });
  }

  const homeName = HEX_NAMES[home] || home || 'Unknown';
  return `<svg viewBox="${viewX.toFixed(1)} ${viewY.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}" role="img" aria-label="${corporation.name} geographic preview centered on ${homeName}">
    <defs>
      <radialGradient id="corpPreviewSea" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="#477682" />
        <stop offset="100%" stop-color="#294852" />
      </radialGradient>
    </defs>
    <rect x="${viewX.toFixed(1)}" y="${viewY.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" fill="url(#corpPreviewSea)" />
    ${hexElements.join('')}
    ${cityLabels.join('')}
    ${tokenOverlays.join('')}
    ${homeOverlays.join('')}
  </svg>`;
}

function renderMapWindowIcon(id) {
  const paths = {
    hex: '<polygon points="10,2 17,6 17,14 10,18 3,14 3,6" fill="#e7cf73" stroke="#5b3d1d" stroke-width="1.4"/><path d="M10 2v16M3 10h14" stroke="#2d2015" stroke-width="1.6"/>',
    corporations:
      '<rect x="3" y="7" width="14" height="11" fill="#d9b35e"/><rect x="6" y="3" width="8" height="4" fill="#eee0aa"/><path d="M6 10h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM6 14h2v2H6zm4 0h2v4h-2zm4 0h2v2h-2z" fill="#315174"/>',
    trains:
      '<rect x="3" y="5" width="14" height="9" rx="2" fill="#396684"/><rect x="6" y="7" width="8" height="4" fill="#f3dfb1"/><circle cx="6.5" cy="15.5" r="2" fill="#d9a441"/><circle cx="13.5" cy="15.5" r="2" fill="#d9a441"/><path d="M2 18h16" stroke="#7d582c" stroke-width="1.5"/>',
    privates:
      '<path d="M2 7h16v10H2z" fill="#b77b37"/><path d="M6 4h8v3H6z" fill="#e1b96a"/><path d="M2 10h16" stroke="#5d351b" stroke-width="2"/><rect x="9" y="9" width="3" height="3" fill="#f3d98b"/>',
    activity:
      '<rect x="3" y="2" width="14" height="16" fill="#eee2b9"/><rect x="5" y="5" width="4" height="4" fill="#b8623d"/><path d="M11 5h4M11 8h4M5 12h10M5 15h8" stroke="#38546d" stroke-width="1.5"/>',
  };
  return `<svg viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges">${paths[id] || paths.hex}</svg>`;
}

function computeMapWindowDefaultStyle(id, slotIndex, totalOpen) {
  // Unlike Stock Exchange (where the background is an empty grid), on the Map page
  // the Shikoku map IS the background! So a single open window docks cleanly as a
  // floating inspection card on the left, leaving the map visible and clickable.
  if (totalOpen <= 1) {
    if (id === 'hex') return 'left:12px;top:12px;width:min(760px, 94%);height:min(510px, 94%)';
    if (id === 'privates') return 'left:12px;top:12px;width:min(660px, 94%);height:min(560px, 94%)';
    if (id === 'corporations' || id === 'trains') {
      return 'left:12px;top:12px;width:min(490px, 52%);height:min(410px, 84%)';
    }
    return 'left:12px;top:12px;width:min(415px, 45%);height:min(420px, 86%)';
  }
  if (totalOpen === 2) {
    return slotIndex === 0
      ? 'left:10px;top:10px;width:44%;height:88%'
      : 'left:46%;top:10px;width:44%;height:88%';
  }
  if (totalOpen === 3) {
    if (slotIndex === 0) return 'left:10px;top:10px;width:44%;height:88%';
    if (slotIndex === 1) return 'left:46%;top:10px;width:46%;height:43%';
    return 'left:46%;top:46%;width:46%;height:43%';
  }
  const col = slotIndex % 2;
  const row = Math.floor(slotIndex / 2) % 2;
  const left = col === 0 ? '10px' : '48%';
  const top = row === 0 ? '10px' : '49%';
  return `left:${left};top:${top};width:46%;height:45%`;
}

function renderMapDesktopWindow(
  id,
  title,
  jp,
  content,
  appState,
  topZ,
  slotIndex,
  totalOpen
) {
  const windowState = appState.mapWindows?.[id];
  if (!windowState?.open) return '';
  const hasCustomGeom =
    Number.isFinite(windowState.x) ||
    Number.isFinite(windowState.y) ||
    Number.isFinite(windowState.w) ||
    Number.isFinite(windowState.h);
  const isMaximized = Boolean(windowState.maximized);

  const minimum = MAP_WINDOW_MIN_SIZES[id];
  const styles = [
    `z-index:${windowState.z || 1}`,
    `--map-window-min-width:${minimum.width}px`,
    `--map-window-min-height:${minimum.height}px`,
  ];
  if (isMaximized) {
    styles.push('left:0.4%;top:0.8%;width:99.2%;height:98.4%');
  } else if (hasCustomGeom) {
    if (Number.isFinite(windowState.x))
      styles.push(`left:${windowState.x}px`, 'right:auto');
    if (Number.isFinite(windowState.y)) styles.push(`top:${windowState.y}px`);
    if (Number.isFinite(windowState.w)) styles.push(`width:${windowState.w}px`);
    if (Number.isFinite(windowState.h)) styles.push(`height:${windowState.h}px`);
  } else {
    styles.push(computeMapWindowDefaultStyle(id, slotIndex, totalOpen));
  }

  const maxIcon = isMaximized ? '❐' : '□';
  const maxLabel = isMaximized ? `Restore ${title} size` : `Maximize ${title}`;

  return `
    <section class="stock-pop-window map-pop-window window-${id} ${windowState.z === topZ ? 'is-front' : ''} ${isMaximized ? 'is-maximized' : ''}" data-map-window-shell="${id}" style="${styles.join(';')}" role="region" aria-label="${title}" tabindex="-1">
      <header class="stock-window-titlebar" data-map-window-drag="${id}" title="Drag to move over the map · Double-click to ${isMaximized ? 'restore' : 'maximize'}">
        <span class="stock-window-title-icon">${renderMapWindowIcon(id)}</span>
        <strong>${title}</strong>
        <small>${jp}</small>
        <div class="stock-window-controls">
          <button type="button" class="win-ctrl-btn win-max-btn" data-maximize-map-window="${id}" aria-label="${maxLabel}" title="${maxLabel}">${maxIcon}</button>
          <button type="button" class="win-ctrl-btn win-close-btn" data-close-map-window="${id}" aria-label="Close ${title}" title="Close ${title}">×</button>
        </div>
      </header>
      <div class="stock-window-body">${content}</div>
      <button type="button" class="stock-window-resize-grip" data-map-window-resize="${id}" aria-label="Resize ${title}" title="Drag to resize ${title}; arrow keys resize when focused"></button>
    </section>`;
}

function hasRunnableTrainRoutes(viewData, activeCorp) {
  if (!activeCorp?.trains?.length) return false;
  if (viewData?.route_quote && Array.isArray(viewData.route_quote.routes)) {
    return viewData.route_quote.routes.length > 0;
  }
  if (Array.isArray(viewData?.best_routes_hint)) {
    return viewData.best_routes_hint.length > 0;
  }
  return true;
}

function getStepInstructionSummary(
  state,
  activeCorpId,
  activeCorp,
  isViewerActiveTurn,
  isHistorical,
  canResolveSpecial = false,
  hasRunnableRoutes = false
) {
  if (isHistorical) {
    return {
      badge: `REPLAY REV ${state.revision}`,
      headline: 'Historical snapshot — read-only board inspection.',
      detail: 'Use the timeline bar below to return to Live before acting.',
    };
  }
  const activePlayerName =
    state.players?.[state.current_player]?.name || state.current_player || 'Player';

  if (state.pending_discards?.length) {
    return {badge:'EXCESS TRAINS', headline:`Resolve excess trains: ${state.pending_discards.join(', ')}`,
      detail:'Open Decisions & Planning. Each affected president must choose trains to return before normal operation resumes.'};
  }
  if (state.pending_special) {
    return {
      badge: `${canResolveSpecial ? 'YOUR SPECIAL ACTION' : `${activePlayerName.toUpperCase()}'S SPECIAL ACTION`}`,
      headline: canResolveSpecial ? 'Resolve the ER special tile action on C4.' : `${activePlayerName} is resolving the ER special tile action.`,
      detail: canResolveSpecial
        ? 'Preview an available special tile on C4 and confirm it separately. This is not the normal corporation track step.'
        : 'The operating turn is paused for this private-company action. You can inspect the map; the designated player resolves it.',
    };
  }

  if (state.round !== 'operating' || !activeCorp) {
    return {
      badge: `${state.round.toUpperCase()} ROUND`,
      headline: isViewerActiveTurn
        ? `Your turn as ${activePlayerName} in ${state.round.toUpperCase()} Round.`
        : `Waiting for ${activePlayerName} in ${state.round.toUpperCase()} Round.`,
      detail:
        'Inspect city values, geography, and private-company powers here. Open the financial desk for the current auction or stock decision.',
    };
  }

  const step = state.operating_turn?.step || 'track';
  if (!isViewerActiveTurn) {
    const president = state.players?.[activeCorp.president]?.name || activeCorp.president || activePlayerName;
    const stepNames = { track: 'track', token: 'station token', routes: 'routes', dividend: 'dividend', train: 'train purchase' };
    return {
      badge: `${president.toUpperCase()} IS OPERATING ${activeCorpId}`,
      headline: `${president} is operating ${activeCorp.name} (${activeCorpId}) — ${stepNames[step] || step} step.`,
      detail: `Only the acting president can make this operating decision. You can inspect hexes, routes, and company information without changing the game.`,
    };
  }
  const rolePrefix = isViewerActiveTurn
    ? `YOU ARE ACTING AS PRESIDENT OF ${activeCorpId}`
    : `${activePlayerName.toUpperCase()} IS OPERATING ${activeCorpId}`;

  const stepMap = {
    track: {
      badge: `${rolePrefix} · STEP 1/5: TRACK`,
      headline: `Lay 1 track tile for ${activeCorp.name} (${activeCorpId}) or skip.`,
      detail: `Click a connected hex on the map to preview legal tile upgrades using ${activeCorpId}'s treasury (${money(activeCorp.cash)}), or click Skip Step.`,
    },
    token: {
      badge: `${rolePrefix} · STEP 2/5: STATION TOKEN`,
      headline: `Place a ${activeCorpId} station token (¥40) or skip.`,
      detail: `Select a connected city hex with an open slot to place one of ${activeCorpId}'s ${activeCorp.token_supply} tokens, or click Skip Step.`,
    },
    routes: {
      badge: `${rolePrefix} · STEP 3/5: RUN TRAINS`,
      headline: activeCorp.trains?.length
        ? hasRunnableRoutes
          ? `Run ${activeCorpId}'s trains (${activeCorp.trains.join(', ')}) for optimal revenue.`
          : `${activeCorpId}'s train (${activeCorp.trains.join(', ')}) has no connected route — skip route calculation.`
        : `${activeCorpId} has no trains yet — skip route calculation.`,
      detail: hasRunnableRoutes
        ? 'Click Choose train routes on the ticket to highlight the best path and calculate revenue.'
        : 'Click the primary Skip to Train Step button (or Skip Routes) on the ticket to advance in one click.',
    },
    dividend: {
      badge: `${rolePrefix} · STEP 4/5: DIVIDENDS`,
      headline: `Distribute ${money(state.operating_turn?.revenue || 0)} earned by ${activeCorpId}.`,
      detail: `Choose payout to distribute ${money(state.operating_turn?.revenue || 0)} among shareholders, or withhold to retain it in ${activeCorpId}'s treasury. Revenue and stock-price effects follow the game rules; a zero-revenue payout does not promise a price rise.`,
    },
    train: {
      badge: `${rolePrefix} · STEP 5/5: BUY TRAINS`,
      headline:
        activeCorp.trains?.length === 0
          ? `Mandatory: Buy a train for ${activeCorpId} (${money(activeCorp.cash)} treasury).`
          : `Optional: Buy an additional train for ${activeCorpId} or finish turn.`,
      detail:
        activeCorp.trains?.length === 0
          ? `Purchases use corporate treasury funds. Mandatory train obligation locks End ${activeCorpId} Turn until a train is acquired.`
          : 'Purchases use corporate treasury funds. When finished, click End Operating Turn.',
    },
  };

  return (
    stepMap[step] || {
      badge: `${rolePrefix} · OPERATING`,
      headline: `Complete ${activeCorp.name} (${activeCorpId}) operating turn.`,
      detail: 'Use the Corporate Operating Ticket on the right to continue.',
    }
  );
}

function renderMapPlayerAndTurnStrip(
  appState,
  viewData,
  certCounts,
  certLimit,
  isViewerActiveTurn
) {
  const state = viewData.state;
  const viewerId = viewData.viewer?.player_id;
  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const activeCorpId = state.current_corporation;
  const activeCorp = activeCorpId ? state.corporations?.[activeCorpId] : null;
  const latest = (viewData.history_events || []).filter((ev) => ev.revision <= state.revision).at(-1);
  const guide = getStepInstructionSummary(
    state,
    activeCorpId,
    activeCorp,
    isViewerActiveTurn,
    isHistorical,
    mapActionAuthority(appState, viewData).canResolveSpecial,
    hasRunnableTrainRoutes(viewData, activeCorp)
  );
  const financialRoom = state.round === 'stock' ? 'Stock Exchange' : state.round === 'auction' ? 'Private Company Auction' : null;
  const calloutTag = financialRoom ? 'button' : 'aside';

  return `
    <section class="stock-player-strip map-player-strip" aria-label="Seated club members and operating corporation status">
      <div class="stock-player-cards">
        ${state.player_order
          .map((pid, index) => {
            const player = state.players[pid];
            const isActive = state.current_player === pid;
            const isViewer = viewerId === pid;
            const isPriority = state.priority === pid;
            const isOperatingPres =
              state.round === 'operating' &&
              activeCorp &&
              activeCorp.president === pid;
            const holdings = Object.entries(state.corporations || {})
              .filter(([, corp]) => (corp.holdings?.[pid] || 0) > 0)
              .map(
                ([cid, corp]) =>
                  `<span class="${cid === activeCorpId ? 'active-op-holding' : ''}" style="--corp:${CORP_META[cid]?.color || '#8e7650'}" title="${cid}: ${corp.holdings[pid]}%${corp.president === pid ? ' (President)' : ''}"><b>${cid}</b> ${corp.holdings[pid]}%${corp.president === pid ? '★' : ''}</span>`
              )
              .join('');
            const ownedPrivs = Object.values(state.privates || {}).filter(
              (pr) => pr.owner === pid && !pr.closed
            );
            const privCount = ownedPrivs.length;
            const privHoldings = ownedPrivs
              .map(
                (pr) =>
                  `<span style="--corp:#7c562b" title="Private ${pr.id}: ${pr.name} (Revenue ¥${pr.revenue}/OR)"><b>P·${pr.id}</b>¥${pr.revenue}</span>`
              )
              .join('');
            const activeBids = Object.entries(state.auction?.bids || {})
              .filter(([, bmap]) => (bmap?.[pid] || 0) > 0)
              .map(
                ([privId, bmap]) =>
                  `<span style="--corp:#3c6478" title="Escrowed bid on ${privId}: ¥${bmap[pid]}"><b>Bid:${privId}</b>¥${bmap[pid]}</span>`
              )
              .join('');
            const combinedBadges = holdings + privHoldings + activeBids;

            return `
              <button type="button" class="stock-player-card ${isActive ? 'active' : ''} ${isViewer ? 'is-viewer' : ''}" data-player-details="${pid}" title="Inspect ${player.name}'s position (${pid.toUpperCase()})">
                <div class="stock-player-portrait custom-portrait portrait-${index}">${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:player.name,surface:"portrait"})}</div>
                <div class="stock-player-data">
                  <div class="sp-top-row">
                    <strong>${player.name}</strong>
                    <b>${money(player.cash)}</b>
                  </div>
                  <div class="sp-meta-row">
                    <small>${certCounts[pid] || 0}/${certLimit} certs${privCount ? ` · ${privCount} priv` : ''}${isPriority ? ' · PD' : ''}</small>
                    ${
                      isOperatingPres
                        ? `<em class="sp-turn-pill">${isViewer ? `PRES OF ${activeCorpId}` : `OPERATING ${activeCorpId}`}</em>`
                        : isActive
                          ? `<em class="sp-turn-pill">${isViewer ? 'YOUR TURN' : 'TURN'}</em>`
                          : isViewer
                            ? '<em class="sp-you-pill">YOU</em>'
                            : ''
                    }
                  </div>
                  <div class="stock-player-holdings">${combinedBadges || '<small class="no-sh-label">No certificates or bids yet</small>'}</div>
                </div>
                <i class="stock-presence" title="Seated member"></i>
              </button>
            `;
          })
          .join('')}
      </div>

      <${calloutTag} class="stock-turn-callout ${financialRoom ? 'is-room-link' : ''} ${isViewerActiveTurn ? 'is-my-turn' : ''} ${isHistorical ? 'is-history' : ''}" ${financialRoom ? `type="button" data-view="market" aria-label="Open ${financialRoom}" title="Open ${financialRoom} at the currently viewed revision"` : ''}>
        <span class="callout-top">
          <span class="callout-badge">${guide.badge}</span>
          <span class="callout-bank">Phase <b>${state.phase}</b> · Bank <b>${money(state.bank)}</b></span>
        </span>
        <strong class="callout-instruction">${guide.headline}</strong>
        <span class="callout-latest" title="${latest?.label || guide.detail}">
          <small>REV ${state.revision}:</small>
          <span>${latest?.label || guide.detail}</span>
          ${financialRoom ? `<span class="callout-open" aria-hidden="true">Open ${financialRoom === 'Stock Exchange' ? 'Exchange' : 'Auction'} →</span>` : ''}
        </span>
      </${calloutTag}>
    </section>
  `;
}

function renderHexAndTileWindow(appState, viewData, catalog, inspectedHex, hexObj, legalPlacements) {
  const profile=getCityValuationProfile(inspectedHex,hexObj,viewData.state,catalog);
  const hexArt=`<svg viewBox="0 0 48 44" class="mini-tile-svg" aria-hidden="true"><polygon points="${flatHexPolygon(24,22,19)}" fill="${TILE_FILL[hexObj.color]}" stroke="#49371f" stroke-width="1.3"/>${renderHexTrackAndNodes(inspectedHex,hexObj,24,22,19,new Set(),true)}</svg>`;
  return renderDistrictSurvey({app:appState,view:viewData,catalog,coord:inspectedHex,profile,parseTile:parseCatalogTile,
    hexArt,legalPlacements,tileArt:id=>renderMiniTileSVG(catalog.tiles[id].code,catalog.tiles[id].color)});
}

function renderOperatingCorporationsWindow(appState, viewData) {
  const state = viewData.state;
  const prices = viewData.prices || {};
  const opOrder = state.operating_order || [];
  const activeCorpId = state.current_corporation;
  const selectedCid = appState.selectedCompanyId || activeCorpId || "IR";

  const orderedCids = [
    ...opOrder,
    ...Object.keys(state.corporations || {}).filter(
      (cid) => !opOrder.includes(cid)
    ),
  ];

  return `
    <div class="market-board corporation-primary-table map-corp-table">
      <header>
        <span>Corporation / Order</span>
        <span>President</span>
        <span>Treasury / Market</span>
        <span>Trains & Tokens</span>
        <span>OR Status</span>
      </header>
      ${orderedCids
        .map((cid) => {
          const c = state.corporations[cid];
          if (!c) return "";
          const m = CORP_META[cid] || {
            short: cid,
            name: c.name,
            color: "#c9a236",
            home: c.home,
            homeName: c.home,
          };
          const presName = c.president
            ? state.players?.[c.president]?.name || c.president
            : "Unparred";
          const opIdx = opOrder.indexOf(cid);
          const isCurrentOp =
            state.round === "operating" && activeCorpId === cid;
          const isSelected = selectedCid === cid;

          let statusLabel = "Unparred";
          let statusClass = "unfloated-tag";
          if (isCurrentOp) {
            statusLabel = `● OPERATING (${(state.operating_turn?.step || "track").toUpperCase()})`;
            statusClass = "floated-tag op-now-badge";
          } else if (c.floated && opIdx >= 0) {
            if (
              state.round === "operating" &&
              typeof state.or_index === "number"
            ) {
              statusLabel =
                opIdx < state.or_index
                  ? `✓ Done (#${opIdx + 1})`
                  : `Order #${opIdx + 1}`;
            } else {
              statusLabel = `Floated (#${opIdx + 1})`;
            }
            statusClass = "floated-tag";
          } else if (c.floated) {
            statusLabel = `Floated (${money(prices[cid] || c.par || 0)})`;
            statusClass = "floated-tag";
          } else if (c.par !== null && c.par !== undefined) {
            statusLabel = `Par ${money(c.par)} (${100 - (c.ipo ?? 100)}% sold)`;
            statusClass = "unfloated-tag parred-tag";
          }

          return `
            <button type="button" class="market-company ${isSelected ? "selected" : ""} ${isCurrentOp ? "recently-changed" : ""}" data-company="${cid}" data-inspect-city="${c.home}" title="Select ${c.name} (${cid}) and inspect home city ${c.home} (${m.homeName})">
              <span class="corp-identity">
                <i style="--company:${m.color}"></i>
                <b>${cid}</b>
                <span>
                  <strong>${c.name}</strong>
                  <small>Home ${c.home} (${m.homeName || c.home})</small>
                </span>
              </span>
              <span class="corp-pricing">
                <strong>${presName}</strong>
                <small>${c.par ? `Par ${money(c.par)}` : "Unparred"}</small>
              </span>
              <span class="corp-supply">
                <em>${money(c.cash)}</em>
                <small>Mkt: ${prices[cid] ? money(prices[cid]) : "—"}</small>
              </span>
              <span class="corp-status">
                <em>Trains: ${c.trains?.length ? c.trains.join(", ") : "None"}</em>
                <small>${c.token_supply} tokens left</small>
              </span>
              <span class="corp-holding">
                <em class="${statusClass}">${statusLabel}</em>
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTrainsAndRoutesWindow(
  appState,
  viewData,
  catalog,
  activeCorpId,
  activeCorp,
  canRunRoutes,
  canBuyTrain
) {
  const state = viewData.state;
  const editing=state.operating_turn?.routes == null;
  const activeRoutes=editing ? displayedRoutes(appState,viewData) : state.operating_turn.routes;
  const totalRouteRev=editing ? (routeQuote(appState,viewData) || (!appState.routeDraftKey ? viewData.route_quote : null))?.revenue : state.operating_turn.revenue;

  const depotTrains = viewData.available_depot_trains || [];
  const trainSpecs = [
    { type: "2", price: 80, rusts: "Phase 4", unlocks: "Phase 2 (Yellow)" },
    { type: "3", price: 180, rusts: "Phase 6", unlocks: "Phase 3 (Green)" },
    { type: "4", price: 300, rusts: "Phase D", unlocks: "Phase 4 (2-Trains rust)" },
    { type: "5", price: 450, rusts: "Permanent", unlocks: "Phase 5 (Brown)" },
    { type: "6", price: 630, rusts: "Permanent", unlocks: "Phase 6 (3-Trains rust)" },
    { type: "D", price: 1100, rusts: "Permanent", unlocks: "Phase D (4-Trains rust)" },
  ];

  const depotCounts = {};
  for (const tr of Object.values(state.trains || {})) {
    if (tr.owner === "depot" && !tr.rusted) {
      depotCounts[tr.type] = (depotCounts[tr.type] || 0) + 1;
    }
  }

  return `
    <div class="map-window-panel trains-routes-window">
      <div class="route-summary-card">
        <div class="section-label">ACTIVE ROUTE & REVENUE CALCULATOR · 路線計算</div>
        ${
          activeCorp
            ? `<h3>${activeCorp.name} (${activeCorpId}) · Owned Trains: ${activeCorp.trains?.length ? activeCorp.trains.join(", ") : "None"}</h3>
               ${
                 activeRoutes.length
                   ? `<div class="route-list">
                        ${activeRoutes
                          .map(
                            (rt, i) => `
                            <div class="route-item">
                              <b>Train #${i + 1} (${rt.train || activeCorp.trains?.[i] || "Train"})</b>
                              <span>${(rt.vertices || []).filter(v=>/:n\d+$/.test(v)).map(v=>stopName(v)).join(" → ")}</span>
                              <strong>${rt.revenue === undefined ? 'Included in total' : money(rt.revenue)}</strong>
                            </div>`
                          )
                          .join("")}
                        <div class="route-total-line">
                          <span>Total Operating Revenue</span>
                          <strong>${totalRouteRev === undefined ? 'Updating…' : money(totalRouteRev)}</strong>
                        </div>
                      </div>`
                   : `<p class="muted-note">${
                       activeCorp.trains?.length
                         ? "Click \"Choose train routes\" during Step 3 (Routes) to calculate and highlight best train paths on the map."
                         : `${activeCorpId} does not own a train yet. Purchase a train in Step 5 to run routes next Operating Round.`
                     }</p>`
               }
               ${
                 canRunRoutes
                   ? `<button type="button" class="confirm-button" data-op-action="run_best_routes">Choose train routes</button>`
                   : ""
               }`
            : "<p class=\"muted-note\">No corporation is currently operating. Inspect the Train Depot and Phase Rust schedule below.</p>"
        }
      </div>

      <div class="depot-schedule-card">
        <div class="section-label">SHIKOKU TRAIN DEPOT & PHASE RUST SCHEDULE · 列車庫 (CURRENT PHASE ${state.phase})</div>
        <div class="depot-table">
          <div class="depot-row depot-head">
            <span>Train</span>
            <span>Price</span>
            <span>In Depot</span>
            <span>Phase & Rust Event</span>
          </div>
          ${trainSpecs
            .map(
              (ts) => `
              <div class="depot-row ${String(state.phase) === ts.type ? "current-phase-row" : ""}">
                <b>${ts.type}-Train</b>
                <span>${money(ts.price)}</span>
                <span>${depotCounts[ts.type] || 0} avail</span>
                <small>${ts.unlocks} · Rusts: ${ts.rusts}</small>
              </div>`
            )
            .join("")}
        </div>
        ${
          canBuyTrain && depotTrains.length
            ? `<div class="train-buy-box">
                <small>Purchase Train for ${activeCorpId} (Treasury: ${money(activeCorp?.cash || 0)})</small>
                ${renderDepotTray({},viewData,{inline:true,compact:false,enabled:canBuyTrain})}
              </div>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderMapPrivatesWindow(viewData) {
  const state = viewData.state;
  const privates = Object.values(state.privates || {});
  return `
    <div class="map-window-panel map-privates-window">
      <div class="section-label">PRIVATE RAILWAYS & FERRIES · 私有鉄道と特殊能力</div>
      <div class="meiji-privates-card-grid privates-grid">
        ${privates
          .map((p, idx) => {
            const ownerName = p.owner
              ? state.players?.[p.owner]?.name ||
                state.corporations?.[p.owner]?.name ||
                p.owner
              : null;
            return renderVintagePrivateCard(p, {
              index: idx,
              isSelected: false,
              isOffered: false,
              isRunoff: false,
              offerPrice: p.value,
              ownerName,
              highBid: 0,
              minNextBid: p.value + 5,
              bidSummary: '',
              inAuction: false,
              interactive: false,
              inspectable: true,
            });
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderMapActivityWindow(viewData, selectedHex) {
  const events = (viewData.history_events || []).filter((ev) => ev.revision <= viewData.state.revision).slice().reverse().slice(0, 12);
  return `
    <section class="focused-activity-card map-activity-card">
      <header>
        <div>
          <div class="section-label">OPERATING & TABLE JOURNAL · 運行棋譜</div>
          <h3>Recent moves at the table</h3>
        </div>
        <span>Latest ${events.length} moves (up to Rev ${viewData.state.revision})</span>
      </header>
      <div class="focused-activity-list">
        ${events
          .map(
            (event) => `<article>
              <i>${event.actor_name?.slice(0, 1) || "•"}</i>
              <div>
                <b>${event.actor_name || "System"} <small>Rev ${event.revision}</small></b>
                <p>${event.label}</p>
              </div>
            </article>`
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderDetailedMapView(appState, viewData, catalog) {
  const state = viewData.state;
  const board = state.board || {};
  const radius = 34;
  const originX = 68;
  const originY = 38;

  const certCounts = viewData.certificates || {};
  const certLimit =
    catalog?.certificate_limits?.[state.player_order.length] || 14;

  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const authority = mapActionAuthority(appState, viewData);
  const isActiveActor = authority.isOperatingPresident;

  const opTurn = state.operating_turn;
  const activeCorpId = state.current_corporation;
  const activeCorp = activeCorpId ? state.corporations?.[activeCorpId] : null;
  const legalTypes = viewData.legal_actions?.types || [];
  const currentStep = opTurn?.step || "track";
  const canLayTrack = authority.canLayTrack;

  const legalPlacementsByHex = {};
  for (const coord of Object.keys(board)) {
    const list = getLegalPlacementsForHex(
      state,
      catalog,
      coord,
      activeCorpId,
      viewData
    );
    if (list.length > 0) {
      legalPlacementsByHex[coord] = list;
    }
  }
  const portHexes = viewData.legal_actions?.choices?.port_hexes || [];
  const buildableHexIds = Object.keys(legalPlacementsByHex);

  const selectedHex = appState.selectedHex || activeCorp?.home || "E2";
  const inspectedHex = appState.inspectedHex || selectedHex;
  const hexObj = board[selectedHex] || board.E2;
  const inspectedHexObj = board[inspectedHex] || hexObj;
  const selectedHexLegalList = legalPlacementsByHex[selectedHex] || [];
  const inspectedHexLegalList = legalPlacementsByHex[inspectedHex] || [];

  // Build highlighted route segments and per-train colored SVG overlays
  const highlightedSegments = new Set();
  if(appState.activeModal==='decisions') syncRoutePlan(appState,viewData);
  const routeEditor=currentRouteEditor(appState,viewData);
  const activeRoutes=displayedRoutes(appState,viewData);
  for (const rt of activeRoutes) {
    const verts = rt.vertices || [];
    for (let i = 0; i + 1 < verts.length; i++) {
      highlightedSegments.add(`${verts[i]}-${verts[i + 1]}`);
    }
  }

  const reachableForTokens =
    isActiveActor && legalTypes.includes("place_token") && activeCorpId
      ? computeReachableVerticesClient(board, activeCorpId)
      : new Set();
  const legalTokenHexSet = new Set();
  if (
    isActiveActor &&
    legalTypes.includes("place_token") &&
    activeCorp?.cash >= 40 &&
    activeCorp?.token_supply > 0
  ) {
    for (const [cKey, cHex] of Object.entries(board)) {
      const hasCorpTok = (cHex.tokens || []).some((t) => (t || []).includes(activeCorpId));
      const hasOpenSlot = (cHex.nodes || []).some(
        (n, idx) => n.kind === "city" && (cHex.tokens?.[idx]?.length || 0) < (n.slots || 1)
      );
      const isReachable =
        reachableForTokens.size === 0 ||
        (cHex.nodes || []).some((_, idx) => reachableForTokens.has(`${cKey}:n${idx}`)) ||
        (cHex.paths || []).some(([a, b]) => reachableForTokens.has(`${cKey}:${a}`) || reachableForTokens.has(`${cKey}:${b}`));
      if (!hasCorpTok && hasOpenSlot && isReachable) {
        legalTokenHexSet.add(cKey);
      }
    }
  }

  const routeOverlayElements = [];
  activeRoutes.forEach((rt, rIdx) => {
    const colorIndex=Math.max(0,activeCorp?.trains.indexOf(rt.train) ?? rIdx);
    const trainColor = TRAIN_ROUTE_COLORS[colorIndex % TRAIN_ROUTE_COLORS.length];
    const offset = (rIdx - (activeRoutes.length - 1) / 2) * 3.5;
    const stopCoords = [];
    if (rt.vertices?.length) {
      for (const v of rt.vertices) {
        const [cKey, part] = String(v).split(':');
        if (board[cKey] && (stopCoords.at(-1)?.coord !== cKey)) {
          let rev = 0;
          if (part?.startsWith('n')) {
            const nIdx = parseInt(part.slice(1), 10) || 0;
            const node = board[cKey]?.nodes?.[nIdx];
            if (node) {
              if (Array.isArray(node.revenue)) {
                const pIdx = state.phase === 'D' ? 2 : ['5', '6'].includes(String(state.phase)) ? 1 : 0;
                rev = node.revenue[pIdx] ?? node.revenue[0] ?? 0;
              } else {
                rev = node.revenue || 0;
              }
            }
          }
          stopCoords.push({ coord: cKey, rev, isNode: Boolean(part?.startsWith('n')) });
        }
      }
    } else if (rt.paths?.length) {
      for (const [cKey] of rt.paths) {
        if (board[cKey] && stopCoords.at(-1)?.coord !== cKey) {
          stopCoords.push({ coord: cKey, rev: 0, isNode: true });
        }
      }
    }
    if (stopCoords.length >= 2) {
      const pts = stopCoords.map((sc) => {
        const { cx, cy } = hexCenter(sc.coord, radius, originX, originY);
        return `${(cx + offset).toFixed(1)},${(cy + offset).toFixed(1)}`;
      }).join(' ');
      routeOverlayElements.push(
        `<g class="map-train-route-ribbon" data-train-route="${rt.train || rIdx}">
          <polyline points="${pts}" fill="none" stroke="#1a110b" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
          <polyline points="${pts}" fill="none" stroke="${trainColor}" stroke-width="3.6" stroke-dasharray="7 3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>`
      );
      stopCoords.forEach((sc) => {
        if (!sc.rev) return;
        const { cx, cy } = hexCenter(sc.coord, radius, originX, originY);
        const bx = cx + offset;
        const by = cy - radius * 0.42 + rIdx * 10;
        routeOverlayElements.push(
          `<g class="map-route-stop-pill" transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)})">
            <rect x="-18" y="-6.5" width="36" height="12" rx="6" fill="${trainColor}" stroke="#fff6d6" stroke-width="0.9"/>
            <text x="0" y="2.2" text-anchor="middle" fill="#ffffff" font-size="6.8" font-weight="bold" font-family="DM Mono">+¥${sc.rev}</text>
          </g>`
        );
      });
    }
  });

  const routeStopTargets=[];
  if(routeEditor) {
    const selected=new Set(routeEditor.stops),next=new Set(routeEditor.next_stops || []);
    for(const vertex of new Set([...selected,...next])) {
      const [coord,node]=vertex.split(':');
      if(!board[coord])continue;
      const {cx,cy}=hexCenter(coord,radius,originX,originY);
      const pt=endpointCoord(cx,cy,node,board[coord].nodes.length,radius);
      const available=next.has(vertex) && !routeEditor.loading;
      const order=routeEditor.stops.indexOf(vertex)+1;
      routeStopTargets.push(`<g class="route-map-stop ${available ? 'is-available' : 'is-chosen'}" ${available ? `role="button" tabindex="0" data-route-stop="${vertex}" aria-label="Choose ${stopName(vertex)}"` : 'aria-hidden="true"'} transform="translate(${pt.x},${pt.y})"><circle r="17" fill="${available ? '#0c5147' : '#d2aa4b'}" fill-opacity=".92" stroke="${available ? '#87ffe4' : '#fff3b1'}" stroke-width="2.2"/><text y="4" text-anchor="middle" fill="${available ? '#fff' : '#1b170c'}" font-size="13" font-weight="bold">${available ? '+' : order}</text>${available ? `<title>Choose ${stopName(vertex)}</title>` : ''}</g>`);
    }
  }

  const hexPolygons = [];
  const cityLabels = [];
  for (const [coord, h] of Object.entries(board)) {
    const { cx, cy } = hexCenter(coord, radius, originX, originY);
    const poly = flatHexPolygon(cx, cy, radius - 1);
    const fill = TILE_FILL[h.color] || "#dfd5a7";
    const isSelected = coord === selectedHex;
    const isInspected = coord === inspectedHex;
    const cityName = HEX_NAMES[coord] || "";
    const legalForHex = legalPlacementsByHex[coord] || [];
    const isPortEligible = authority.canLayMfPort && portHexes.includes(coord);
    const isBuildable =
      (canLayTrack && legalForHex.length > 0) ||
      isPortEligible;
    const isTokenLegalHex = legalTokenHexSet.has(coord);

    const tilePreview =
      isSelected &&
      canLayTrack && appState.selectedTileId &&
      catalog?.tiles?.[appState.selectedTileId]
        ? parseCatalogTile(
            catalog.tiles[appState.selectedTileId].code,
            catalog.tiles[appState.selectedTileId].color,
            appState.selectedTileRotation || 0
          )
        : null;

    const renderObj = tilePreview
      ? {
          ...h,
          color: tilePreview.color,
          paths: tilePreview.paths,
          nodes: tilePreview.nodes,
          tile: appState.selectedTileId,
        }
      : h;

    // During Track Lay step, only legal buildable hexes respond to left-click tile cycling!
    // Right-clicking or clicking an unbuildable hex inspects its city valuation & selects it.
    const allowLeftClick =
      state.round !== "operating" ||
      currentStep !== "track" ||
      isBuildable;

    const strokeColor = isSelected
      ? "#ffd46b"
      : isTokenLegalHex && currentStep === "token"
        ? "#00e5ff"
        : isPortEligible
          ? "#5ce1e6"
          : isBuildable && currentStep === "track"
            ? "#f3c65f"
            : isInspected
              ? "#8ad6e6"
              : "#4a3822";
    const strokeWidth = isSelected
      ? 3.2
      : (isBuildable && currentStep === "track") || (isTokenLegalHex && currentStep === "token") || isPortEligible
        ? 2.4
        : 1.3;

    const tokenRingOverlay = isTokenLegalHex
      ? `<g class="token-target-overlay" aria-hidden="true">
          <circle class="token-slot-target-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="15.5" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 2"/>
          ${isSelected ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9.5" fill="${CORP_META[activeCorpId]?.color || '#c9a236'}" fill-opacity="0.78" stroke="#ffd46b" stroke-width="1.8" stroke-dasharray="3 1.5"/><text x="${cx.toFixed(1)}" y="${(cy + 2.5).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="6.2" font-weight="bold">${activeCorpId}</text>` : ''}
        </g>`
      : isPortEligible
        ? `<g class="mf-port-eligible-overlay" aria-hidden="true"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="16" fill="none" stroke="#5ce1e6" stroke-width="1.8" stroke-dasharray="3 2"/></g>`
        : '';

    hexPolygons.push(
      `<g class="map-hex ${isSelected ? "selected" : ""} ${isBuildable ? "is-buildable" : "is-unbuildable"} ${isTokenLegalHex ? "is-token-legal" : ""} ${isPortEligible ? "is-port-eligible" : ""}" role="button" tabindex="0" aria-label="${cityName || 'Sector'} ${coord} · ${isBuildable ? 'Preview track' : 'Inspect location'}" data-testid="hex-cell-${coord}"
          ${allowLeftClick ? `data-select-hex="${coord}"` : `data-unbuildable-hex="${coord}"`}
          data-inspect-city="${coord}"
          style="cursor:pointer;opacity:${state.round === "operating" && currentStep === "track" && !isBuildable && !isSelected ? "0.78" : "1"}">
        <title>${cityName ? `${cityName} (${coord})` : `Sector ${coord}`}${
          canLayTrack && legalForHex.length > 0
            ? ` · Click to preview/rotate a tile (${legalForHex.length} candidates); confirm separately`
            : isPortEligible
              ? ` · ⚓ Eligible for Mitsubishi Ferry Port (#437) — click to select`
              : isTokenLegalHex
                ? ` · Legal station token location for ${activeCorpId} (¥40)`
                : state.round === "operating" && currentStep === "track"
                  ? ` · No legal tile placement for ${activeCorpId || "company"} here`
                  : ""
        } · Shift+Enter or right-click to inspect city value & upgrades</title>
        <polygon points="${poly}" fill="${TILE_FILL[renderObj.color] || fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${(isBuildable && currentStep === "track" && !isSelected) || (isTokenLegalHex && currentStep === "token" && !isSelected) ? "stroke-dasharray=\"4 2\"" : ""} />
        ${renderHexTrackAndNodes(coord, renderObj, cx, cy, radius, highlightedSegments, false)}
        ${tokenRingOverlay}
        <text x="${cx.toFixed(1)}" y="${(cy - radius * 0.58).toFixed(1)}" text-anchor="middle" fill="#2c1d11" font-size="7.2" font-weight="600" font-family="DM Mono">${coord}${h.label ? ` (${h.label})` : ""}</text>
      </g>`
    );
    cityLabels.push(renderCityLabel(coord, cityName, cx, cy, radius));
  }

  const displayCorpId = activeCorpId || appState.selectedCompanyId || "IR";
  const displayCorp = state.corporations?.[displayCorpId];
  const displayMeta = CORP_META[displayCorpId] || {
    short: displayCorpId,
    name: displayCorp?.name || displayCorpId,
    color: "#c9a236",
    home: displayCorp?.home || "E2",
    homeName: HEX_NAMES[displayCorp?.home || "E2"] || "",
  };

  const canPlaceToken =
    isActiveActor &&
    legalTypes.includes("place_token") &&
    activeCorp?.cash >= 40 && activeCorp?.token_supply > 0 &&
    !(hexObj?.tokens || []).some((tokens) => tokens.includes(activeCorpId)) &&
    (hexObj?.nodes || []).some((n, idx) => n.kind === "city" && (hexObj.tokens?.[idx]?.length || 0) < (n.slots || 1));
  const hasRunnableRoutes = hasRunnableTrainRoutes(viewData, activeCorp);
  const canRunRoutes =
    isActiveActor &&
    (legalTypes.includes("run_best_routes") ||
      legalTypes.includes("run_routes"));
  const canDividend = isActiveActor && legalTypes.includes("dividend") &&
    (!hasRunnableRoutes || opTurn?.routes !== null);
  const canBuyTrain = isActiveActor && legalTypes.includes("buy_train");
  const canSkipStep = (isActiveActor && legalTypes.includes("skip")) || (authority.canResolveSpecial && legalTypes.includes("pass"));
  const mandatoryTrain = Boolean(
    state.round === "operating" &&
      currentStep === "train" &&
      !state.pending_special &&
      (viewData.train_financing || viewData.legal_actions?.choices?.mandatory_train)
  );
  const canEndTurn =
    isActiveActor &&
    !mandatoryTrain &&
    (legalTypes.includes("end_turn") || legalTypes.includes("pass"));

  const canLayMfPort = authority.canLayMfPort && portHexes.includes(selectedHex);
  const canLayMfPortOnInspected = authority.canLayMfPort && portHexes.includes(inspectedHex);
  const mfPortTarget=canLayMfPort ? selectedHex : canLayMfPortOnInspected ? inspectedHex : null;

  const mapWindowContent = {
    hex: renderHexAndTileWindow(
      appState,
      viewData,
      catalog,
      inspectedHex,
      inspectedHexObj,
      inspectedHexLegalList
    ),
    corporations: renderOperatingCorporationsWindow(appState, viewData),
    trains: renderTrainsAndRoutesWindow(
      appState,
      viewData,
      catalog,
      activeCorpId,
      activeCorp,
      canRunRoutes,
      canBuyTrain
    ),
    privates: renderMapPrivatesWindow(viewData),
    activity: renderMapActivityWindow(viewData, selectedHex),
  };

  const openMapWindows = MAP_WINDOW_DEFS.filter(
    ([id]) => appState.mapWindows?.[id]?.open
  );
  const topWindowZ = Math.max(
    0,
    ...openMapWindows.map(([id]) => appState.mapWindows[id].z || 0)
  );

  const currentStepIdx = Math.max(
    0,
    OP_STEPS.findIndex((s) => s.id === currentStep)
  );
  const stepGuide = getStepInstructionSummary(
    state,
    activeCorpId,
    activeCorp,
    isActiveActor,
    isHistorical,
    authority.canResolveSpecial,
    hasRunnableRoutes
  );
  const presPlayerName = activeCorp?.president
    ? state.players?.[activeCorp.president]?.name || activeCorp.president
    : state.players?.[state.current_player]?.name || "Unparred";

  const activePlacementIdx = selectedHexLegalList.findIndex(
    (p) =>
      p.tile === appState.selectedTileId &&
      p.rotation === (appState.selectedTileRotation || 0)
  );

  return `
    <section class="detail-view map-view">
      <div class="market-top-deck map-top-deck">
        <div class="exchange-title-cluster">
          <div class="section-label">SHIKOKU SURVEY & OPERATIONS · PHASE ${state.phase} · ${
            state.round === "operating"
              ? `OR ${operatingRoundNumber(state)}`
              : state.round.toUpperCase()
          } · REV ${state.revision}</div>
          <h2>Map & Operations <small>四国鉄道運行局</small></h2>
        </div>

        <nav class="stock-window-launcher map-window-launcher" aria-label="Map inspection windows">
          ${MAP_WINDOW_DEFS.map(([id, label, jp], index) => {
            const isOpen = Boolean(appState.mapWindows?.[id]?.open);
            const isFront = isOpen && appState.mapWindows[id].z === topWindowZ;
            return `<button type="button" class="${isOpen ? "is-open" : ""} ${isFront ? "is-front" : ""}" data-map-window="${id}" aria-pressed="${isOpen}" title="Press ${index + 1} to open, raise, or toggle ${label}">
              <span>${renderMapWindowIcon(id)}</span><kbd>${index + 1}</kbd><b>${label}</b><small>${jp}</small>
            </button>`;
          }).join("")}
          <button type="button" class="stock-tile-windows" data-clear-map-windows title="Close floating windows to view the full unobstructed Shikoku map"><span>🗺️</span><b>Map Only</b></button>
          <button type="button" class="stock-tile-windows" data-reset-map-windows title="Restore map-only layout and reset map view"><b>Restore Layout</b></button>
        </nav>

        <div class="heading-actions">
          <button type="button" class="secondary-btn" data-view="market">${state.round === "auction" ? "Private Auction ⇄" : "Stock Exchange ⇄"}</button>
          <button type="button" class="back-table-btn" data-view="table" title="Return directly to the Tabletop">Back to Table · テーブルへ戻る</button>
        </div>
      </div>

      ${renderMapPlayerAndTurnStrip(appState, viewData, certCounts, certLimit, isActiveActor)}

      <div class="stock-dashboard map-dashboard">
        <main class="stock-window-desktop map-window-desktop open-count-${renderGazettePopin(appState, viewData)}
          ${openMapWindows.length}" aria-label="Interactive Shikoku map background with floating inspection windows">
          <div class="map-background-stage">
            <div class="map-toolbar">
              <button type="button" data-map-zoom="0.18" aria-label="Zoom in" title="Zoom in">+</button>
              <button type="button" data-map-zoom="-0.18" aria-label="Zoom out" title="Zoom out">−</button>
              <button type="button" data-map-zoom="reset" aria-label="Reset map view" title="Reset zoom and position">⌂</button>
              <button type="button" class="map-hex-badge-btn" data-map-window="hex" title="Right-click any city on the map or click here to inspect ${HEX_NAMES[inspectedHex] || inspectedHex}">
                <span>Inspect <b>${inspectedHex}</b> · ${HEX_NAMES[inspectedHex] || inspectedHexObj?.color?.toUpperCase() || "Sector"}</span>
                <small>Inspect · Shift+Enter on a hex</small>
              </button>
            </div>
            <div class="svg-viewport" data-map-viewport title="Drag to pan · Scroll or pinch to zoom · Click a hex to select · Right-click to inspect">
              <svg viewBox="0 0 680 510" style="transform: ${mapTransform(appState)}; transform-origin: center center;" role="group" aria-label="Interactive 52-hex map of Shikoku">
                <defs>
                  <radialGradient id="seaGrad" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stop-color="#477682" />
                    <stop offset="100%" stop-color="#294852" />
                  </radialGradient>
                </defs>
                <rect width="680" height="510" fill="url(#seaGrad)" />
                <text x="24" y="28" fill="#d9cca7" font-size="11" font-family="Libre Baskerville" opacity="0.75">IYO SEA · 伊予灘</text>
                <text x="470" y="34" fill="#d9cca7" font-size="11" font-family="Libre Baskerville" opacity="0.75">HARIMA SEA · 播磨灘</text>
                <text x="455" y="485" fill="#d9cca7" font-size="11" font-family="Libre Baskerville" opacity="0.75">PACIFIC OCEAN · 太平洋</text>
                ${hexPolygons.join("")}
                <g class="map-route-overlay-layer" aria-hidden="true">${routeOverlayElements.join("")}</g>
                <g class="map-city-label-layer" aria-hidden="true">${cityLabels.join("")}</g>
                <g class="map-route-stop-targets">${routeStopTargets.join("")}</g>
              </svg>
            </div>

            ${
              canLayTrack && appState.selectedTileId && selectedHexLegalList.length
                ? `<div class="map-floating-lay-bar" role="region" aria-label="Staged tile placement controls">
                    <div class="floating-lay-info">
                      <b>Hex ${selectedHex} (${HEX_NAMES[selectedHex] || "Track"}) · Tile #${appState.selectedTileId} (${((appState.selectedTileRotation || 0) * 60) % 360}°)</b>
                      <small>Preview only · ${money(hexObj.cost || 0)} terrain · ${activeCorpId || 'Company'} treasury ${money(activeCorp?.cash || 0)} → ${money(Math.max(0, (activeCorp?.cash || 0) - (hexObj.cost || 0)))} · Option ${activePlacementIdx >= 0 ? activePlacementIdx + 1 : 1}/${selectedHexLegalList.length}</small>
                    </div>
                    <div class="floating-lay-actions">
                      <button type="button" class="secondary-btn" data-cycle-legal-placement="1" title="Next legal tile/rotation on ${selectedHex}">↻ Rotate / Next (${selectedHexLegalList.length})</button>
                      <button type="button" class="confirm-button" data-op-action="lay_tile" ${canLayTrack ? "" : "disabled"}>✓ Confirm Lay Tile #${appState.selectedTileId}</button>
                      <button type="button" class="secondary-btn" data-clear-tile-preview aria-label="Cancel tile preview">Cancel</button>
                    </div>
                  </div>`
                : currentStep === "token" && canPlaceToken
                  ? `<div class="map-floating-lay-bar token-lay-bar" role="region" aria-label="Staged station token controls">
                      <div class="floating-lay-info">
                        <b>Station Token Preview · ${selectedHex} (${HEX_NAMES[selectedHex] || "City"})</b>
                        <small>${activeCorpId} Treasury: ${money(activeCorp?.cash || 0)} → ${money((activeCorp?.cash || 0) - 40)} (−¥40) · Tokens left: ${activeCorp?.token_supply || 0} → ${Math.max(0, (activeCorp?.token_supply || 0) - 1)}</small>
                      </div>
                      <div class="floating-lay-actions">
                        <button type="button" class="confirm-button" data-op-action="place_token">✓ Place ${activeCorpId} Token on ${selectedHex} (¥40)</button>
                      </div>
                    </div>`
                  : ""
            }
          </div>

          ${appState.selectedCompanyId && appState.selectedCompanyId !== activeCorpId ? `<p class="inspection-only corporation-inspection">Inspecting ${appState.selectedCompanyId} · ${state.corporations[appState.selectedCompanyId]?.name || ''}${activeCorpId ? `. Actions on the ticket still operate ${activeCorpId}.` : ''}</p>` : ''}

          ${renderGazettePopin(appState, viewData)}

          ${openMapWindows
            .map(([id, label, jp], idx) =>
              renderMapDesktopWindow(
                id,
                label,
                jp,
                mapWindowContent[id],
                appState,
                topWindowZ,
                idx,
                openMapWindows.length
              )
            )
            .join("")}
        </main>

        <aside class="order-ticket stock-action-panel map-action-panel is-step-${currentStep} ${currentStep === 'train' ? 'is-train-step' : ''} ${state.round === 'operating' && activeCorp && (isActiveActor || authority.canResolveSpecial) ? 'is-active-operating' : ''}" aria-label="Corporate Operating Order Ticket and turn guidance">
          <div class="ticket-cut"></div>
          <div class="map-ticket-reference">
          <div class="ticket-corp-banner" style="--corp:${displayMeta.color}">
            <span class="ticket-corp-badge">${displayCorpId}</span>
            <div class="ticket-corp-heading">
              <small class="ticket-kicker">${
                state.round === "operating" && activeCorp
                  ? isActiveActor
                  ? `ACTING AS CORPORATION · CORPORATE FUNDS`
                    : `ACTIVE OPERATING CORPORATION`
                  : `INSPECTING CORPORATION · 会社情報`
              }</small>
              <h3>${displayCorp?.name || displayCorpId}</h3>
              <small>${
                state.round === "operating" && activeCorp
                  ? `President: ${presPlayerName} · Safe: ${money(activeCorp.cash)}`
                  : `${displayMeta.jp || ""} · Home: ${displayMeta.home} (${displayMeta.homeName})`
              }</small>
            </div>
            <button type="button" class="op-help-btn ${appState.opHelpOpen ? 'is-open' : ''}" data-toggle-op-help aria-expanded="${Boolean(appState.opHelpOpen)}" aria-label="Toggle step rules and help" title="Rules &amp; Help for this step">?</button>
          </div>

          <div class="op-guidance-box op-help-drawer ${isActiveActor ? 'is-active-actor' : ''} ${appState.opHelpOpen ? 'is-open' : 'is-collapsed'}">
            <div class="op-guidance-kicker">
              <span>${
                state.round === "operating" && activeCorp
                  ? `${isHistorical ? 'HISTORICAL' : isActiveActor ? 'WHAT TO DO NOW' : authority.canResolveSpecial ? 'SPECIAL ACTION' : 'OBSERVING'} (STEP ${currentStepIdx + 1}: ${currentStep.toUpperCase()})`
                  : isHistorical ? 'HISTORICAL INSPECTION' : 'MAP INSPECTION'
              }</span>
              ${
                state.round === "operating" && activeCorp
                  ? `<em>${isHistorical ? 'Read-only' : isActiveActor ? `Acting for ${activeCorpId}` : authority.canResolveSpecial ? 'ER special action' : `President: ${presPlayerName}`}</em>`
                  : ""
              }
            </div>
            <strong>${stepGuide.headline}</strong>
            <p>${stepGuide.detail}</p>
          </div>

          ${
            state.round === "operating" && activeCorp
              ? `
                <div class="op-step-stepper" role="list" aria-label="Operating turn steps">
                  ${OP_STEPS.map((s, idx) => {
                    const stateClass =
                      idx < currentStepIdx
                        ? "is-done"
                        : idx === currentStepIdx
                          ? "is-current"
                          : "is-upcoming";
                    return `<div class="op-step-pill ${stateClass}" role="listitem" title="Step ${s.num}: ${s.label} (${s.jp})">
                      <span>${idx < currentStepIdx ? "✓" : s.num}</span>
                      <b>${s.label}</b>
                    </div>`;
                  }).join("")}
                </div>
              `
              : ""
          }

          <div class="ticket-breakdown map-ticket-breakdown">
            <div>
              <span>Selected Hex</span>
              <b>${selectedHex} · ${HEX_NAMES[selectedHex] || hexObj?.color?.toUpperCase() || "Sector"}</b>
            </div>
            <div>
              <span>Staged Tile</span>
              <b>${
                canLayTrack && appState.selectedTileId
                  ? `#${appState.selectedTileId} (${((appState.selectedTileRotation || 0) * 60) % 360}° · ${activePlacementIdx >= 0 ? `${activePlacementIdx + 1}/${selectedHexLegalList.length}` : "Legal"})`
                  : canLayTrack && selectedHexLegalList.length
                    ? `Click ${selectedHex} (${selectedHexLegalList.length} legal)`
                    : "No tile staged · Inspection"
              }</b>
            </div>
            ${
              activeCorp
                ? `
                  <div>
                    <span>${activeCorpId} Treasury</span>
                    <b>${money(activeCorp.cash)}</b>
                  </div>
                  <div>
                    <span>${activeCorpId} Trains & Tokens</span>
                    <b>${activeCorp.trains?.length ? activeCorp.trains.join(", ") : "0 trains"} · ${activeCorp.token_supply} tok</b>
                  </div>
                `
                : `
                  <div>
                    <span>Current Round</span>
                    <b>${state.round.toUpperCase()}</b>
                  </div>
                `
            }
          </div>

          ${
            state.round === "operating" && activeCorp && (isActiveActor || authority.canResolveSpecial)
              ? `
                <div class="op-step-workspace is-workspace-${currentStep}">
                  ${
                    currentStep === "track" || authority.canResolveSpecial
                      ? (() => {
                          const stagedPlacement = selectedHexLegalList[activePlacementIdx] || selectedHexLegalList[0] || null;
                          const tileCost = stagedPlacement?.cost ?? hexObj?.cost ?? 0;
                          const nextCol = nextTileColor(hexObj?.color || 'white');
                          return `
                            <div class="op-workspace-banner is-track-banner">
                              <div>
                                <small>Selected Hex · ${(hexObj?.color || 'white').toUpperCase()} → ${(nextCol || 'MAX').toUpperCase()}</small>
                                <strong>${selectedHex} · ${HEX_NAMES[selectedHex] || 'Sector'}</strong>
                              </div>
                              <div class="op-banner-right">
                                <small>Terrain Fee</small>
                                <strong>${tileCost ? money(tileCost) : 'Free (¥0)'}</strong>
                              </div>
                            </div>
                            ${
                              canLayTrack && selectedHexLegalList.length
                                ? `<div class="ticket-inline-tile-bar">
                                    <div class="tile-swatch-grid inline-tile-chips">
                                      ${selectedHexLegalList
                                        .slice(0, 6)
                                        .map(
                                          (p, idx) =>
                                            `<button type="button" class="tile-swatch-btn par-btn ${appState.selectedTileId === p.tile && (appState.selectedTileRotation || 0) === p.rotation ? 'selected' : ''}" data-select-legal-placement="${selectedHex}:${p.tile}:${p.rotation}" title="Preview legal option ${idx + 1}: Tile #${p.tile} at ${p.rotation * 60}°">
                                              <span class="swatch-svg-wrap">${renderMiniTileSVG(p.code, p.color, p.rotation)}</span>
                                              <span class="swatch-label">#${p.tile} (${p.rotation * 60}°)</span>
                                              <small class="swatch-supply">${p.remaining} left</small>
                                            </button>`
                                        )
                                        .join("")}
                                    </div>
                                    ${
                                      appState.selectedTileId
                                        ? `<div class="tile-rotation-bar">
                                            <span>Staged: <b>#${appState.selectedTileId} at ${((appState.selectedTileRotation || 0) * 60) % 360}°</b></span>
                                            <div class="tile-rot-controls">
                                              <button type="button" class="rot-btn" data-cycle-legal-placement="1">⟳ Rotate 60°</button>
                                              <button type="button" class="rot-btn is-clear" data-clear-tile-preview>Clear</button>
                                            </div>
                                          </div>`
                                        : ""
                                    }
                                  </div>`
                                : `<div class="op-empty-state-card">Click a highlighted hex on the map to preview legal track tiles for ${activeCorpId}.</div>`
                            }
                            <div class="op-consequence-strip">
                              <div><span>${activeCorpId} Safe After</span><b>${money(activeCorp.cash)} → ${money(Math.max(0, activeCorp.cash - (appState.selectedTileId ? tileCost : 0)))}</b></div>
                              <div><span>Build Status</span><b>${appState.selectedTileId ? `Tile #${appState.selectedTileId} Ready` : `${buildableHexIds.length} Legal Hexes`}</b></div>
                            </div>
                          `;
                        })()
                      : ""
                  }
                  ${
                    currentStep === "token" && !authority.canResolveSpecial
                      ? (() => {
                          const legalTokenCities = [...legalTokenHexSet];
                          const placedCount = Object.values(board).reduce(
                            (acc, h) => acc + ((h.tokens || []).some((t) => (t || []).includes(activeCorpId)) ? 1 : 0),
                            0
                          );
                          const totalCharter = placedCount + (activeCorp.token_supply || 0);
                          return `
                            <div class="op-workspace-banner is-token-banner">
                              <div>
                                <small>Station Charter Rack</small>
                                <strong>${activeCorp.token_supply} Token${activeCorp.token_supply === 1 ? '' : 's'} Remaining</strong>
                              </div>
                              <strong class="op-banner-figure">¥40</strong>
                            </div>
                            <div class="token-charter-rack" aria-label="Charter token supply">
                              ${Array.from({ length: Math.max(1, totalCharter) }, (_, idx) => {
                                const isPlaced = idx < placedCount;
                                const isNext = idx === placedCount && activeCorp.token_supply > 0;
                                return `<div class="token-rack-slot ${isPlaced ? 'is-placed' : ''} ${isNext ? 'is-next' : ''}">
                                  <span class="token-disc" style="--corp:${displayMeta.color}">${activeCorpId}</span>
                                  <small>${isPlaced ? (idx === 0 ? `Home ${displayMeta.home} ✓` : 'Placed ✓') : isNext ? 'Next: ¥40' : 'Charter'}</small>
                                </div>`;
                              }).join("")}
                            </div>
                            ${
                              legalTokenCities.length
                                ? `<div class="token-city-list" role="list" aria-label="Reachable cities with open token slots">
                                    ${legalTokenCities
                                      .map((cKey) => {
                                        const cHex = board[cKey];
                                        const node = cHex?.nodes?.[0] || { slots: 1 };
                                        const used = (cHex?.tokens?.[0] || []).length;
                                        const isSel = selectedHex === cKey;
                                        return `<button type="button" class="token-city-card ${isSel ? 'is-selected' : ''}" data-select-hex="${cKey}">
                                          <div>
                                            <b>${cKey} · ${HEX_NAMES[cKey] || 'City'}</b>
                                            <small>${used}/${node.slots || 1} Slots Occupied · Connected</small>
                                          </div>
                                          <span class="token-fee-pill">${isSel ? '★ Selected · ¥40' : 'Select · ¥40'}</span>
                                        </button>`;
                                      })
                                      .join("")}
                                  </div>`
                                : `<div class="op-empty-state-card">No reachable connected city has an open station slot (${activeCorp.token_supply} token${activeCorp.token_supply === 1 ? '' : 's'} left). Skip Token to proceed to Routes.</div>`
                            }
                            <div class="op-consequence-strip">
                              <div><span>${activeCorpId} Safe After</span><b>${money(activeCorp.cash)} → ${money(canPlaceToken ? activeCorp.cash - 40 : activeCorp.cash)}</b></div>
                              <div><span>Charter Supply</span><b>${activeCorp.token_supply} → ${canPlaceToken ? Math.max(0, activeCorp.token_supply - 1) : activeCorp.token_supply} Left</b></div>
                            </div>
                          `;
                        })()
                      : ""
                  }
                  ${
                    currentStep === "routes" && !authority.canResolveSpecial
                      ? hasRunnableRoutes
                        ? routePlanner(appState, viewData, canRunRoutes, { inline: true })
                        : `<div class="op-workspace-banner is-route-banner">
                            <div>
                              <small>${activeCorp?.trains?.length ? `Trains: ${activeCorp.trains.join(', ')}` : '0 Trains Owned'}</small>
                              <strong>${activeCorp?.trains?.length ? 'No Connected Route' : 'Empty Fleet'}</strong>
                            </div>
                            <strong class="op-banner-figure">¥0</strong>
                          </div>
                          <div class="op-empty-state-card">${activeCorp?.trains?.length ? `Train (${activeCorp.trains.join(', ')}) has no connected route` : `Corporation owns 0 trains`} · Advance directly to Train Purchase.</div>`
                      : ""
                  }
                </div>
                </div>
                <div class="ticket-primary-actions map-ticket-actions">
                  ${
                    (currentStep === "track" || authority.canResolveSpecial)
                      ? `<button type="button" class="confirm-button" data-op-action="lay_tile" ${canLayTrack && appState.selectedTileId ? "" : "disabled"}>
                          ${
                            appState.selectedTileId
                              ? `✓ Confirm Lay Tile #${appState.selectedTileId} on ${selectedHex}`
                              : `Select a highlighted hex to preview track`
                          }
                        </button>`
                      : ""
                  }
                  ${
                    mfPortTarget
                      ? `<button type="button" class="confirm-button mf-port-btn" data-op-action="lay_mf_port" data-port-hex="${mfPortTarget}">
                          ⚓ Lay MF Port (#437) on ${mfPortTarget}
                        </button>`
                      : ""
                  }
                  ${
                    currentStep === "token" || (currentStepIdx < 1 && canPlaceToken)
                      ? `${currentStep !== 'token' ? '<details class="op-shortcut"><summary>Station token shortcut</summary>' : ''}<button type="button" class="confirm-button" data-op-action="place_token" data-token-hex="${selectedHex}" ${canPlaceToken ? "" : "disabled"}>
                          Place ${activeCorpId} Token on ${selectedHex} (¥40)
                        </button><small class="shortcut-note">${shortcutDescription(currentStep, 'token') || 'Uses corporate treasury. Final connection and slot checks occur on submission.'}</small>${currentStep !== 'token' ? '</details>' : ''}`
                      : ""
                  }
                  ${
                    (currentStep === "routes" && !hasRunnableRoutes) || (currentStepIdx < 2 && canRunRoutes)
                      ? `${currentStep !== 'routes' ? '<details class="op-shortcut"><summary>Route resolution shortcut</summary>' : ''}<button type="button" class="confirm-button" data-op-action="run_best_routes" ${canRunRoutes ? "" : "disabled"}>
                          ${
                            hasRunnableRoutes
                              ? `Choose train routes (${money(viewData.route_quote?.revenue || 0)})`
                              : activeCorp?.trains?.length
                                ? 'No legal route — Skip to Train Step (¥0)'
                                : 'No trains — Skip to Train Step (¥0)'
                          }
                        </button><small class="shortcut-note">${
                          hasRunnableRoutes
                            ? shortcutDescription(currentStep, 'routes') || 'Shows the recommended stops and total revenue. Run the plan when ready.'
                            : `${activeCorp?.trains?.length ? 'Train has no connected route' : 'Corporation owns 0 trains'} · ${shortcutDescription(currentStep, 'routes') || 'Advances directly past ¥0 route & revenue steps to Train step in one click.'}`
                        }</small>${currentStep !== 'routes' ? '</details>' : ''}`
                      : ""
                  }
                  ${
                    canDividend && currentStepIdx <= 3
                      ? (() => {
                          const rev = opTurn?.revenue || 0;
                          const curPrice = viewData.prices?.[activeCorpId] || activeCorp?.par || 0;
                          const bankShare = Math.floor((rev * (activeCorp?.ipo || 0)) / 100);
                          const poolShare = Math.floor((rev * (activeCorp?.pool || 0)) / 100);
                          const payouts = (state.player_order || [])
                            .filter((pid) => (activeCorp?.holdings?.[pid] || 0) > 0)
                            .map((pid) => {
                              const pct = activeCorp.holdings[pid];
                              const amt = Math.floor((rev * pct) / 100);
                              return `<span class="div-shareholder-chip"><span class="div-holder-name"><b>${state.players?.[pid]?.name || pid}</b> (${pct}%):</span> <strong class="div-holder-amt">+${money(amt)}</strong></span>`;
                            })
                            .join('');
                          const runTrains = (opTurn?.routes || []).map((r) => `<span class="div-train-pill">🚂 ${r.train}</span>`).join('');
                          return `${currentStep !== 'dividend' ? '<details class="op-shortcut"><summary>Revenue resolution shortcut</summary>' : `
                            <div class="op-workspace-banner is-dividend-banner">
                              <div>
                                <small>Operating Revenue Earned</small>
                                <div class="div-train-pills">${runTrains || `<small>${activeCorp?.trains?.length || 0} train(s)</small>`}</div>
                              </div>
                              <strong class="op-banner-figure">${money(rev)}</strong>
                            </div>
                            <div class="stock-step-track" aria-label="Stock price movement preview">
                              <div class="track-cell is-left"><span>← -1 Step</span><small>If Withheld</small></div>
                              <div class="track-cell is-center"><span>${activeCorpId} ● ${money(curPrice)}</span><small>Current Market</small></div>
                              <div class="track-cell is-right"><span>${rev > 0 ? '+1 Step →' : '← -1 Step'}</span><small>${rev > 0 ? 'If Paid Out' : '¥0 Revenue'}</small></div>
                            </div>
                          `}<div class="dividend-split visual-dividend-split">
                            <div class="dividend-option-card is-payout-card">
                              <div class="div-card-head">
                                <strong>Pay Dividend</strong>
                                <span class="div-stock-step is-up">${rev > 0 ? `Mkt ${money(curPrice)} · +1 Step →` : '← -1 Step (¥0)'}</span>
                              </div>
                              <div class="div-card-flow">
                                ${payouts || '<small>No player shares held</small>'}
                                ${activeCorp?.pool > 0 ? `<span class="div-shareholder-chip"><small>Market pool (${activeCorp.pool}%): <b>${money(poolShare)} to Company treasury</b></small></span>` : ''}
                                ${activeCorp?.ipo > 0 ? `<span class="div-shareholder-chip is-unclaimed"><small>IPO (${activeCorp.ipo}%): ${money(bankShare)} retained by Bank</small></span>` : ''}
                              </div>
                              <button type="button" class="confirm-button" data-op-action="dividend_payout">
                                Pay Dividend (${money(rev)})
                              </button>
                            </div>
                            <div class="dividend-option-card is-withhold-card">
                              <div class="div-card-head">
                                <strong>Withhold</strong>
                                <span class="div-stock-step is-down">Mkt ${money(curPrice)} · ← -1 Step</span>
                              </div>
                              <div class="div-card-flow is-safe-flow">
                                <div class="iron-safe-mini" aria-hidden="true">SAFE</div>
                                <span class="div-treasury-chip">${activeCorpId} Treasury: <b>${money(activeCorp?.cash || 0)} → ${money((activeCorp?.cash || 0) + rev)}</b></span>
                              </div>
                              <button type="button" class="secondary-btn" data-op-action="dividend_withhold">
                                Withhold (${money(rev)})
                              </button>
                            </div>
                          </div><small class="shortcut-note">${shortcutDescription(currentStep, 'dividend') || 'Resolve this operating revenue.'}</small>${currentStep !== 'dividend' ? '</details>' : ''}`;
                        })()
                      : ""
                  }
                  ${state.round === 'operating' && currentStep === 'train' && activeCorp && !state.pending_special && !state.pending_discards?.length ? renderInlineTrainDesk(appState,viewData) : ''}
                  ${isActiveActor && mandatoryTrain ? `<p class="mandatory-train-guard" role="status" data-testid="mandatory-train-guard">⚠️ <b>Mandatory train purchase:</b> ${activeCorpId} has a connected route and owns no train. Acquire a train above to unlock End ${activeCorpId} Turn.</p>` : ''}
                  <div class="op-step-row ${currentStep === 'dividend' ? 'is-dividend-step-row' : ''}">
                    <button type="button" class="secondary-btn" data-testid="op-btn-skip" data-op-action="${authority.canResolveSpecial ? 'pass' : 'skip'}" ${canSkipStep ? "" : "disabled"}>
                      ${authority.canResolveSpecial ? 'Decline ER special lay' : `Skip ${currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}`}
                    </button>
                    <button type="button" class="confirm-button finish-turn-highlight" data-testid="op-btn-end-turn" data-op-action="end_turn" ${canEndTurn ? "" : "disabled"} title="${mandatoryTrain ? `Disabled: ${activeCorpId} has a route and must buy a train before ending its turn` : `Finish ${activeCorpId} operating turn`}">
                      End ${activeCorpId} Turn
                    </button>
                  </div>
                  <div class="ticket-compact-footer">
                    <span>Fleet: <b>${activeCorp.trains?.length ? activeCorp.trains.join(", ") : "0 trains"}</b> · Tok: <b>${activeCorp.token_supply}</b></span>
                    <span>Hex: <b>${selectedHex} ${HEX_NAMES[selectedHex] || ""}</b></span>
                  </div>
                </div>
              `
              : `
                </div>
                <div class="ticket-primary-actions map-ticket-actions">
                  ${state.round === 'operating' && activeCorp ? `<p class="inspection-only">${isHistorical ? 'Historical position · game actions are read-only.' : `Observing ${activeCorpId} · ${presPlayerName} makes the operating decisions.`}</p>` : ''}
                  ${mfPortTarget ? `<button type="button" class="confirm-button mf-port-btn" data-op-action="lay_mf_port" data-port-hex="${mfPortTarget}">⚓ Use your MF power on ${mfPortTarget} (not an ${activeCorpId} operating action)</button>` : ''}
                  <button type="button" class="confirm-button" data-view="market">
                    ${state.round === 'auction' ? 'Open Private Company Auction' : 'Open Stock Exchange'} ⇄
                  </button>
                  <button type="button" class="secondary-btn" data-map-window="hex">
                    Inspect ${HEX_NAMES[inspectedHex] || inspectedHex} Valuation
                  </button>
                </div>
              `
          }
        </aside>
      </div>
    </section>
  `;
}
