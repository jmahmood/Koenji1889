import {renderCharacter} from './Character.js';
/**
 * Illustrated Koenji Railway Club Tabletop / Social View (`src/scene/ClubRoom.js`).
 *
 * Built as a true multi-layered 2D scene (inspired by 1990s strategy games &
 * visual novels) rather than a flat static image:
 * - Layer 1: Architectural wood-paneled Koenji clubroom backdrop SVG (bookcases,
 *   warm brass sconces, framed SHIKOKU poster, calligraphy scroll, and twilight
 *   Tokyo window with crescent moon).
 * - Layer 2: Shared customizable paper dolls for the actual 2–6 seated members.
 *   Held poses and expressions are driven by accepted game/gathering events.
 * - Layer 3: Foreground curved mahogany & green-felt gaming table with physical
 *   props (green banker's lamp, mugs, dice tray, token tray, pocket watch) and
 *   live interactive hotspots for the real 1889 Shikoku board, corporate share
 *   stack, current train/concession card, and membership stamp card plaque.
 * - Layer 4: Seated player plaques and speech bubbles driven strictly by live
 *   game state (`state.players`, `viewData.club.notes`, `viewData.history_events`).
 */

import { CORP_META, PRIVATE_META } from '../constants1889.js';
import { escapeHtml, formatTime, operatingRoundNumber } from '../ui/presentation.js';
import { renderBoardMiniatureSVG } from '../components/HexMap1889.js';

const money = (n) => `¥${Number(n || 0).toLocaleString()}`;

/**
 * Layer 1: Architectural Wood-Paneled Koenji Clubroom Backdrop SVG
 */
export function renderClubroomBackdropSVG() {
  return `
    <svg viewBox="0 0 1340 520" class="clubroom-backdrop-svg" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <linearGradient id="wall-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#24150c"/>
          <stop offset="45%" stop-color="#382214"/>
          <stop offset="100%" stop-color="#1b1009"/>
        </linearGradient>
        <radialGradient id="lamp-glow-left" cx="0.12" cy="0.24" r="0.32">
          <stop offset="0%" stop-color="#ffcc68" stop-opacity="0.45"/>
          <stop offset="55%" stop-color="#d88b28" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="lamp-glow-center" cx="0.46" cy="0.22" r="0.38">
          <stop offset="0%" stop-color="#ffe29a" stop-opacity="0.5"/>
          <stop offset="50%" stop-color="#d99432" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="lamp-glow-right" cx="0.69" cy="0.46" r="0.26">
          <stop offset="0%" stop-color="#ffd278" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d1b33"/>
          <stop offset="60%" stop-color="#183052"/>
          <stop offset="100%" stop-color="#2a4361"/>
        </linearGradient>
      </defs>

      <!-- Wood-paneled rear wall -->
      <rect width="1340" height="520" fill="url(#wall-wood)"/>

      <!-- Vertical wainscoting timber lines -->
      <g stroke="#160c07" stroke-width="2" opacity="0.55">
        <line x1="190" y1="0" x2="190" y2="520"/>
        <line x1="250" y1="0" x2="250" y2="520"/>
        <line x1="450" y1="0" x2="450" y2="520"/>
        <line x1="510" y1="0" x2="510" y2="520"/>
        <line x1="590" y1="0" x2="590" y2="520"/>
        <line x1="760" y1="0" x2="760" y2="520"/>
        <line x1="940" y1="0" x2="940" y2="520"/>
      </g>
      <rect x="0" y="0" width="1340" height="14" fill="#180e08"/>
      <rect x="0" y="340" width="1340" height="10" fill="#21130b"/>

      <!-- Left Library Bookcase -->
      <g transform="translate(8, 16)">
        <rect x="0" y="0" width="174" height="390" fill="#1e110a" stroke="#4d311c" stroke-width="3"/>
        <rect x="8" y="10" width="158" height="82" fill="#140b07"/>
        <rect x="8" y="102" width="158" height="84" fill="#140b07"/>
        <rect x="8" y="196" width="158" height="84" fill="#140b07"/>
        <rect x="8" y="290" width="158" height="84" fill="#140b07"/>
        <!-- Books on shelves -->
        <g stroke="#120a06" stroke-width="1">
          <rect x="14" y="26" width="14" height="66" fill="#7c2d23"/>
          <rect x="29" y="20" width="16" height="72" fill="#2d5742"/>
          <rect x="46" y="30" width="12" height="62" fill="#8f6829"/>
          <rect x="59" y="22" width="18" height="70" fill="#324966"/>
          <rect x="78" y="28" width="14" height="64" fill="#6b3b59"/>
          <rect x="93" y="18" width="17" height="74" fill="#8a4428"/>
          <rect x="112" y="25" width="15" height="67" fill="#3d5e3a"/>
          <rect x="128" y="32" width="14" height="60" fill="#9c7533"/>
          <rect x="143" y="22" width="16" height="70" fill="#5e2a24"/>

          <rect x="14" y="118" width="18" height="68" fill="#3b566e"/>
          <rect x="33" y="112" width="15" height="74" fill="#823329"/>
          <rect x="49" y="122" width="14" height="64" fill="#6e5528"/>
          <rect x="64" y="115" width="19" height="71" fill="#2f5c48"/>
          <rect x="84" y="120" width="15" height="66" fill="#7a4928"/>
          <rect x="100" y="110" width="16" height="76" fill="#4f375e"/>
          <rect x="117" y="124" width="14" height="62" fill="#946c2c"/>
          <rect x="132" y="116" width="26" height="70" fill="#6e2920"/>

          <rect x="16" y="214" width="20" height="66" fill="#7c4e29"/>
          <rect x="38" y="208" width="16" height="72" fill="#2d4c5e"/>
          <rect x="56" y="218" width="15" height="62" fill="#822f25"/>
          <rect x="72" y="210" width="18" height="70" fill="#466341"/>
          <rect x="92" y="215" width="22" height="65" fill="#8f6a2d"/>
          <rect x="116" y="206" width="18" height="74" fill="#3b3554"/>
        </g>
      </g>

      <!-- Framed Vintage SHIKOKU Railway Poster (Left-Center Wall) -->
      <g transform="translate(274, 34)">
        <rect x="-8" y="-8" width="158" height="232" rx="2" fill="#26150c" stroke="#694624" stroke-width="2.5"/>
        <rect x="0" y="0" width="142" height="216" fill="#dfd1b0" stroke="#8c6f46" stroke-width="1.5"/>
        <!-- Sky & Sea inside poster -->
        <rect x="8" y="10" width="126" height="145" fill="#799aa8"/>
        <path d="M8 102 L48 64 L92 86 L134 52 L134 128 L8 128 Z" fill="#4a6b65" opacity="0.75"/>
        <rect x="8" y="118" width="126" height="37" fill="#9e8767"/>
        <!-- Vintage Tram in poster -->
        <g transform="translate(34, 86)">
          <polygon points="0,18 68,8 68,32 0,38" fill="#8f2920" stroke="#23140c" stroke-width="1"/>
          <polygon points="2,8 66,0 68,10 0,18" fill="#ebd9b5" stroke="#23140c" stroke-width="1"/>
          <line x1="-20" y1="42" x2="88" y2="28" stroke="#2b1e16" stroke-width="2"/>
        </g>
        <text x="71" y="28" text-anchor="middle" fill="#2b1d12" font-size="12" font-family="Libre Baskerville" font-weight="700" letter-spacing="2">四国</text>
        <text x="71" y="178" text-anchor="middle" fill="#2b1d12" font-size="16" font-family="Libre Baskerville" font-weight="700" letter-spacing="1.5">SHIKOKU</text>
        <text x="71" y="194" text-anchor="middle" fill="#59432b" font-size="7.5" font-family="DM Mono" letter-spacing="1">IMPERIAL RAILWAYS · 1889</text>
      </g>

      <!-- Center Framed Engraving & Wall Sconces -->
      <g transform="translate(604, 108)">
        <rect x="0" y="0" width="108" height="128" fill="#24140b" stroke="#634222" stroke-width="2.5"/>
        <rect x="8" y="8" width="92" height="112" fill="#cbb892"/>
        <path d="M18 96 L42 52 L64 78 L82 44 L92 96 Z" fill="#54634c" opacity="0.7"/>
      </g>

      <!-- Hanging Calligraphy Scroll (Right-Center Wall: 鉄道倶楽部) -->
      <g transform="translate(772, 18)">
        <rect x="-6" y="0" width="116" height="6" rx="3" fill="#4a2e18" stroke="#8c6432" stroke-width="1"/>
        <rect x="0" y="6" width="104" height="270" fill="#d8c398" stroke="#5e4324" stroke-width="2"/>
        <rect x="6" y="12" width="92" height="258" fill="#e5d3ad" stroke="#8f7248" stroke-width="1"/>
        <g fill="#23170e" font-family="Libre Baskerville, serif" font-weight="700" font-size="34" text-anchor="middle">
          <text x="52" y="58">鉄</text>
          <text x="52" y="106">道</text>
          <text x="52" y="154">倶</text>
          <text x="52" y="202">楽</text>
          <text x="52" y="250">部</text>
        </g>
        <rect x="-8" y="276" width="120" height="7" rx="3.5" fill="#4a2e18" stroke="#8c6432" stroke-width="1"/>
      </g>

      <!-- Right Mullioned Night Window with Tokyo Skyline & Crescent Moon -->
      <g transform="translate(948, 22)">
        <rect x="0" y="0" width="256" height="278" fill="#1a0f09" stroke="#4d3119" stroke-width="4"/>
        <rect x="10" y="10" width="236" height="258" fill="url(#night-sky)"/>
        <!-- Crescent Moon & Stars -->
        <circle cx="204" cy="48" r="16" fill="#ffdf8e" opacity="0.92"/>
        <circle cx="198" cy="44" r="14" fill="#11223d"/>
        <circle cx="64" cy="38" r="1.3" fill="#fff4d2" opacity="0.8"/>
        <circle cx="128" cy="28" r="1.5" fill="#fff4d2" opacity="0.7"/>
        <circle cx="156" cy="58" r="1.2" fill="#fff4d2" opacity="0.6"/>
        <!-- Distant Tokyo Evening Skyline -->
        <g fill="#0c1626">
          <rect x="18" y="168" width="34" height="100"/>
          <rect x="56" y="142" width="42" height="126"/>
          <rect x="104" y="118" width="38" height="150"/>
          <rect x="148" y="152" width="44" height="116"/>
          <rect x="196" y="136" width="46" height="132"/>
        </g>
        <!-- Warm Lit Apartment Windows -->
        <g fill="#f5c665" opacity="0.78">
          <rect x="64" y="154" width="5" height="7"/><rect x="74" y="154" width="5" height="7"/>
          <rect x="64" y="168" width="5" height="7"/><rect x="84" y="168" width="5" height="7"/>
          <rect x="112" y="132" width="5" height="7"/><rect x="124" y="132" width="5" height="7"/>
          <rect x="112" y="148" width="5" height="7"/><rect x="124" y="164" width="5" height="7"/>
          <rect x="160" y="166" width="6" height="7"/><rect x="174" y="180" width="6" height="7"/>
          <rect x="208" y="150" width="6" height="7"/><rect x="222" y="164" width="6" height="7"/>
        </g>
        <!-- Wooden Window Mullions -->
        <line x1="128" y1="10" x2="128" y2="268" stroke="#1c100a" stroke-width="7"/>
        <line x1="10" y1="138" x2="246" y2="138" stroke="#1c100a" stroke-width="7"/>
      </g>

      <!-- Warm Brass Pendant Lamps & Table Lamps -->
      <!-- Left Hanging Lantern -->
      <g transform="translate(115, 0)">
        <line x1="20" y1="0" x2="20" y2="28" stroke="#140b06" stroke-width="3"/>
        <polygon points="4,28 36,28 42,68 -2,68" fill="#ffcf70" stroke="#5e3a18" stroke-width="2"/>
      </g>
      <!-- Center Brass Shade Lamp -->
      <g transform="translate(518, 0)">
        <line x1="36" y1="0" x2="36" y2="34" stroke="#8a6229" stroke-width="3"/>
        <path d="M4 58 L22 34 L50 34 L68 58 Z" fill="#e5b254" stroke="#5e3d16" stroke-width="2"/>
        <ellipse cx="36" cy="59" rx="32" ry="6" fill="#fff0b8"/>
      </g>
      <!-- Warm Table Lamp Behind Center-Left -->
      <g transform="translate(432, 168)">
        <polygon points="8,0 44,0 54,36 -2,36" fill="#ffd885" stroke="#8c5e24" stroke-width="1.5"/>
        <rect x="22" y="36" width="8" height="28" fill="#754d22"/>
      </g>
      <!-- Warm Table Lamp Behind Right -->
      <g transform="translate(866, 224)">
        <polygon points="6,0 38,0 46,32 -2,32" fill="#ffd885" stroke="#8c5e24" stroke-width="1.5"/>
        <rect x="18" y="32" width="8" height="26" fill="#754d22"/>
      </g>

      <!-- Ambient Warm Lamp Glow Overlays -->
      <rect width="1340" height="520" fill="url(#lamp-glow-left)"/>
      <rect width="1340" height="520" fill="url(#lamp-glow-center)"/>
      <rect width="1340" height="520" fill="url(#lamp-glow-right)"/>
    </svg>
  `;
}

/**
 * Layer 2: Independent, Pose-Swappable Seated Character Sprites
 * Supports stiff "no-in-betweens" (`steps(1, end)`) keyframe switching between:
 * - `idle` (seated relaxed / sipping mug / resting chin)
 * - Turn context: thinking; table notes: tea; accepted moves: temporary shared poses.
 */
export function renderSeatedMemberSprite(persona, player, isTurn, isSpeaking, skipMotion) {
  return renderCharacter(player.appearance,{memberId:player.memberId,name:player.name,
    pose:isTurn?'thinking':isSpeaking?'tea':'idle',expression:isTurn?'calculating':isSpeaking?'smile':'neutral'});
}

function renderTabletopPropsSVG() {
  return `
    <svg viewBox="0 0 1340 340" class="tabletop-props-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="felt-grad" cx="0.5" cy="0.45" r="0.58">
          <stop offset="0%" stop-color="#295948"/>
          <stop offset="65%" stop-color="#1b3f32"/>
          <stop offset="100%" stop-color="#102920"/>
        </radialGradient>
        <linearGradient id="wood-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#2b170d"/>
          <stop offset="25%" stop-color="#59331c"/>
          <stop offset="50%" stop-color="#754527"/>
          <stop offset="75%" stop-color="#59331c"/>
          <stop offset="100%" stop-color="#2b170d"/>
        </linearGradient>
      </defs>

      <!-- Outer Curved Mahogany Table Rim -->
      <path d="M-40 92 Q670 -28 1380 92 L1380 340 L-40 340 Z" fill="url(#wood-rim)" stroke="#9e6d36" stroke-width="3"/>
      <!-- Inner Green Billiard Felt Surface -->
      <path d="M-10 112 Q670 -4 1350 112 L1350 324 Q670 342 -10 324 Z" fill="url(#felt-grad)" stroke="#b58546" stroke-width="2.5"/>

      <!-- Left Brass Banker's Lamp with Emerald Glass Shade -->
      <g transform="translate(8, 22)">
        <ellipse cx="52" cy="168" rx="34" ry="11" fill="#b88938" stroke="#472e10" stroke-width="2"/>
        <rect x="46" y="76" width="12" height="90" fill="#d4a448" stroke="#472e10" stroke-width="1.5"/>
        <path d="M4 78 C12 36, 92 36, 100 78 Z" fill="#1e5c3a" stroke="#d4a448" stroke-width="2.5"/>
        <ellipse cx="52" cy="82" rx="46" ry="9" fill="#ffe699" opacity="0.65"/>
      </g>

      <!-- Left Ceramic "1889 KOENJI" Coffee Mug -->
      <g transform="translate(110, 102)">
        <path d="M46 12 C58 12, 58 36, 46 36" fill="none" stroke="#dfd0b4" stroke-width="4.5"/>
        <rect x="6" y="4" width="40" height="44" rx="5" fill="#e8dac0" stroke="#4a3623" stroke-width="1.5"/>
        <ellipse cx="26" cy="6" rx="18" ry="4" fill="#4f2d18"/>
        <text x="26" y="26" text-anchor="middle" fill="#2c1d11" font-size="9" font-family="Libre Baskerville" font-weight="700">1889</text>
        <text x="26" y="36" text-anchor="middle" fill="#5c4328" font-size="5.5" font-family="DM Mono">KOENJI</text>
      </g>

      <!-- Left Wooden Dice Tray -->
      <g transform="translate(46, 198) rotate(-14)">
        <rect x="0" y="0" width="76" height="52" rx="4" fill="#3b2213" stroke="#7c522b" stroke-width="2"/>
        <rect x="6" y="6" width="64" height="40" fill="#26150b"/>
        <rect x="18" y="14" width="14" height="14" rx="2" fill="#efe2c6" stroke="#3b2616" stroke-width="1"/>
        <rect x="40" y="20" width="14" height="14" rx="2" fill="#efe2c6" stroke="#3b2616" stroke-width="1"/>
      </g>

      <!-- Right Wooden Token Tray & Certificate Deck -->
      <g transform="translate(792, 114) rotate(12)">
        <rect x="0" y="0" width="66" height="84" rx="4" fill="#3b2213" stroke="#7c522b" stroke-width="2"/>
        <rect x="6" y="6" width="54" height="72" fill="#26150b"/>
        <circle cx="22" cy="24" r="6" fill="#4e6b8c"/>
        <circle cx="42" cy="28" r="6" fill="#c9a236"/>
        <circle cx="24" cy="54" r="6" fill="#dfd0b2"/>
        <circle cx="44" cy="58" r="6" fill="#a83b2b"/>
      </g>

      <!-- Right Brass Pocket Watch -->
      <g transform="translate(838, 232)">
        <circle cx="22" cy="22" r="18" fill="#d4a448" stroke="#4d3314" stroke-width="2"/>
        <circle cx="22" cy="22" r="13" fill="#f3e5c4" stroke="#6e4e24" stroke-width="1"/>
        <path d="M22 22 L22 13 M22 22 L29 24" stroke="#23160c" stroke-width="1.6" stroke-linecap="round"/>
      </g>

      <!-- Right Ceramic "鉄道" Tea Cup -->
      <g transform="translate(996, 114)">
        <rect x="0" y="0" width="42" height="48" rx="6" fill="#e5d5b5" stroke="#4a3623" stroke-width="1.5"/>
        <ellipse cx="21" cy="5" rx="18" ry="4" fill="#4f2d18"/>
        <text x="21" y="24" text-anchor="middle" fill="#2c1d11" font-size="11" font-family="Libre Baskerville" font-weight="700">鉄</text>
        <text x="21" y="38" text-anchor="middle" fill="#2c1d11" font-size="11" font-family="Libre Baskerville" font-weight="700">道</text>
      </g>
    </svg>
  `;
}


export function getPlayerHoldingsTags(state, pid, maxTags = 4) {
  const tags = [];

  for (const [cid, corp] of Object.entries(state.corporations || {})) {
    const pct = corp.holdings?.[pid] || 0;
    if (pct > 0) {
      const isPres = corp.president === pid;
      tags.push({
        label: `${cid} ${pct}%${isPres ? '★' : ''}`,
        shortLabel: `${cid} ${pct}%${isPres ? '★' : ''}`,
        color: CORP_META[cid]?.color || '#c9a236',
        text: CORP_META[cid]?.text || '#fff',
        title: `${corp.name} (${cid}): ${pct}%${isPres ? ' · President' : ''}`,
      });
    }
  }

  for (const priv of Object.values(state.privates || {})) {
    if (priv.owner === pid && !priv.closed) {
      const meta = PRIVATE_META[priv.id] || {};
      tags.push({
        label: `Private ${priv.id}`,
        shortLabel: `P·${priv.id}`,
        color: meta.color || '#6e4726',
        text: '#fff5e4',
        title: `Private ${priv.id}: ${priv.name} (Pays ${money(priv.revenue)}/OR)`,
      });
    }
  }

  if (state.round === 'auction') {
    for (const [privId, bmap] of Object.entries(state.auction?.bids || {})) {
      const amt = bmap?.[pid] || 0;
      if (amt > 0) {
        tags.push({
          label: `Bid:${privId}`,
          shortLabel: `Bid:${privId} ${money(amt)}`,
          color: '#295573',
          text: '#e8f5ff',
          title: `Escrowed bid on ${privId}: ${money(amt)}`,
        });
      }
    }
  }

  return tags.slice(0, maxTags);
}

export function computeTableActionSummary(state) {
  if (!state) {
    return {
      roundTitle: 'Round 1',
      roundJp: '第1ラウンド',
      phaseTitle: 'Phase 2',
      phaseJp: '初期フェーズ',
      actionTitle: 'Awaiting Turn',
      actionJp: '手番待機中',
      targetView: 'market',
    };
  }

  if (state.round === 'auction') {
    const unsold = Object.values(state.privates || {}).filter((p) => !p.owner);
    const offeredId = state.auction?.active || unsold[0]?.id || 'TR';
    const offeredPriv = state.privates?.[offeredId];
    const disc = offeredId === 'TR' ? state.auction?.discount || 0 : 0;
    const price = Math.max(0, (offeredPriv?.value || 20) - disc);
    const isRunoff = Boolean(state.auction?.active);
    return {
      roundTitle: 'Auction',
      roundJp: '私有鉄道入札',
      phaseTitle: `Phase ${state.phase}`,
      phaseJp: '私鉄競売',
      actionTitle: isRunoff
        ? `Runoff on ${offeredId}`
        : `Offer: ${offeredId} (${money(price)})`,
      actionJp: isRunoff ? `${offeredId} 競り合い中` : `${offeredId} 入札・購入`,
      targetView: 'market',
    };
  }

  if (state.round === 'stock') {
    const bought = Boolean(state.stock_turn?.bought);
    return {
      roundTitle: `Stock Round ${state.stock_round}`,
      roundJp: `第${state.stock_round}株式R`,
      phaseTitle: `Phase ${state.phase}`,
      phaseJp: '株式発行',
      actionTitle: bought ? 'Finish Stock Turn' : 'Buy Share or Pass',
      actionJp: bought ? '手番終了' : '株式購入・パス',
      targetView: 'market',
    };
  }

  if (state.round === 'operating') {
    const step = state.operating_turn?.step || 'track';
    const cid = state.current_corporation || 'Corp';
    const stepLabels = {
      track: [`${cid}: Lay Track`, 'タイル敷設'],
      token: [`${cid}: Place Token`, '駅トークン設置'],
      routes: [`${cid}: Run Trains`, '列車運行'],
      dividend: [`${cid}: Dividend`, '配当分配'],
      train: [`${cid}: Buy Train`, '列車の購入'],
    };
    const [en, jp] = stepLabels[step] || [`${cid}: Operate`, '運営手番'];
    return {
      roundTitle: `OR ${operatingRoundNumber(state)}`,
      roundJp: `第${operatingRoundNumber(state)}運営R`,
      phaseTitle: `Phase ${state.phase}`,
      phaseJp: '運営フェーズ',
      actionTitle: en,
      actionJp: jp,
      targetView: 'map',
    };
  }

  return {
    roundTitle: 'Complete',
    roundJp: '対局終了',
    phaseTitle: `Phase ${state.phase}`,
    phaseJp: '精算完了',
    actionTitle: state.end_reason || 'Match Finished',
    actionJp: '結果確認',
    targetView: 'history',
  };
}

function buildSeatSpeechMap(state, viewData) {
  const speechMap = {};
  const order = state.player_order || ['p1', 'p2', 'p3', 'p4'];
  const notes = viewData.club?.notes || [];
  const events = (viewData.history_events || []).filter(
    (e) => e.revision <= state.revision && e.revision > 0
  );

  for (const ev of events) {
    if (ev.actor_id && order.includes(ev.actor_id)) {
      speechMap[ev.actor_id] = {
        text: ev.label,
        sub: `Rev ${ev.revision} · ${formatTime(ev.occurred_at)}`,
        isNote: false,
      };
    }
  }

  for (const note of notes) {
    const matchedPid = order.includes(note.actor_id) ? note.actor_id : null;
    if (matchedPid) {
      speechMap[matchedPid] = {
        text: note.text,
        sub: note.time || 'Table note',
        isNote: true,
      };
    }
  }

  const activePid = state.current_player;
  if (activePid && !speechMap[activePid]) {
    const summary = computeTableActionSummary(state);
    speechMap[activePid] = {
      text: `${summary.actionTitle} (${summary.roundTitle})`,
      sub: `Rev ${state.revision} · Active Turn`,
      isNote: false,
    };
  }

  return speechMap;
}

function renderTabletopTrainOrAuctionCard(state, catalog) {
  if (state.round === 'auction') {
    const unsold = Object.values(state.privates || {}).filter((p) => !p.owner);
    const offeredId = state.auction?.active || unsold[0]?.id || 'TR';
    const priv = state.privates?.[offeredId] || { id: 'TR', value: 20, revenue: 5 };
    const disc = offeredId === 'TR' ? state.auction?.discount || 0 : 0;
    const price = Math.max(0, priv.value - disc);
    return `
      <button type="button" class="tabletop-train-card is-phase-target" data-view="market" title="Current Phase: Open Private Railway Auction (${offeredId} on block for ${money(price)})">
        <div class="tt-card-top">
          <b>${offeredId}</b>
          <small>Rev ${money(priv.revenue)}/OR</small>
        </div>
        <div class="tt-train-silhouette" aria-hidden="true">
          <svg viewBox="0 0 88 28">
            <path d="M8 22h72M14 14h26v8H14zM42 10h16v12H42zM60 13h14v9H60zM20 7h5v7h-5z" fill="#231811"/>
            <circle cx="22" cy="23" r="3" fill="#231811"/><circle cx="33" cy="23" r="3" fill="#231811"/>
            <circle cx="49" cy="23" r="3" fill="#231811"/><circle cx="67" cy="23" r="3" fill="#231811"/>
          </svg>
        </div>
        <strong class="tt-card-price">${money(price)}</strong>
      </button>
    `;
  }

  const depot = state.depot || {};
  const trainOrder = ['2', '3', '4', '5', '6', 'D'];
  const nextTrain =
    trainOrder.find((t) => (depot[t] || 0) > 0) || String(state.phase || '2');
  const trainSpec = (catalog?.trains || []).find((t) => t.id === nextTrain);
  const trainPrice =
    trainSpec?.cost ||
    { 2: 80, 3: 180, 4: 300, 5: 450, 6: 630, D: 1100 }[nextTrain] ||
    80;
  const remaining = depot[nextTrain] ?? '';
  const isTrainStep =
    state.round === 'operating' && state.operating_turn?.step === 'train';

  return `
    <button type="button" class="tabletop-train-card ${isTrainStep ? 'is-phase-target' : ''}" data-view="map" title="Phase ${state.phase} · Next Train: ${nextTrain}-Train (${money(trainPrice)}${remaining !== '' ? `, ${remaining} left` : ''})">
      <div class="tt-card-top">
        <b>${nextTrain}-0</b>
        <small>${remaining !== '' ? `${remaining} left` : `Ph ${state.phase}`}</small>
      </div>
      <div class="tt-train-silhouette" aria-hidden="true">
        <svg viewBox="0 0 88 28">
          <path d="M8 22h72M14 14h26v8H14zM42 10h16v12H42zM60 13h14v9H60zM20 7h5v7h-5z" fill="#231811"/>
          <circle cx="22" cy="23" r="3" fill="#231811"/><circle cx="33" cy="23" r="3" fill="#231811"/>
          <circle cx="49" cy="23" r="3" fill="#231811"/><circle cx="67" cy="23" r="3" fill="#231811"/>
        </svg>
      </div>
      <strong class="tt-card-price">${money(trainPrice)}</strong>
    </button>
  `;
}

function renderSocialAndLogSidebar(appState, viewData) {
  const state = viewData.state;
  const order = state.player_order || ['p1', 'p2', 'p3', 'p4'];
  const activePlayerId = state.current_player;
  const sidebarTab = appState.tableSidebarTab || 'chat';
  const notes = viewData.club?.notes || [];
  const historyEvents = viewData.history_events || [];

  const noteItems = notes.map((n, idx) => {
    const matchedPid = order.includes(n.actor_id) ? n.actor_id : null;
    const seatIdx = Math.max(0, order.indexOf(matchedPid));
    return {
      key: `note-${n.id || idx}`,
      pid: matchedPid,
      seatIdx,
      author: n.author || 'Club Member',
      time: formatTime(n.recorded_at),
      instant: n.recorded_at,
      text: n.text,
      revision: null,
      isNote: true,
    };
  });

  const actionItems = historyEvents
    .filter((ev) => ev.revision <= state.revision)
    .slice()
    .reverse()
    .slice(0, 14)
    .map((ev) => {
      const pid = ev.actor_id && order.includes(ev.actor_id) ? ev.actor_id : null;
      const seatIdx = Math.max(0, order.indexOf(pid));
      const actorName =
        ev.actor_name || state.players?.[pid]?.name || 'Koenji Table';
      return {
        key: `rev-${ev.revision}`,
        pid,
        seatIdx,
        author: actorName,
        time: formatTime(ev.occurred_at),
        instant: ev.occurred_at,
        text: ev.label,
        detail: ev.detail,
        revision: ev.revision,
        isNote: false,
      };
    });

  const combinedFeed = [...noteItems, ...actionItems].sort((a, b) =>
    (Date.parse(b.instant) || 0) - (Date.parse(a.instant) || 0) || (b.revision ?? 0) - (a.revision ?? 0)
  ).slice(0, 14);

  return `
    <aside class="club-social-sidebar" aria-label="At the Table conversation and Game Log">
      <div class="social-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected="${sidebarTab !== 'log'}"
          class="social-tab-btn ${sidebarTab !== 'log' ? 'is-active' : ''}"
          data-table-sidebar-tab="chat"
        >
          At the Table
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="${sidebarTab === 'log'}"
          class="social-tab-btn ${sidebarTab === 'log' ? 'is-active' : ''}"
          data-table-sidebar-tab="log"
        >
          Game Log (${historyEvents.length})
        </button>
      </div>

      ${
        sidebarTab === 'log'
          ? `
          <div class="social-feed-scroll game-log-mode">
            ${historyEvents
              .slice()
              .reverse()
              .map(
                (r) => `
                <article class="social-log-entry ${r.revision === appState.viewRevision ? 'selected-rev' : ''}">
                  <button
                    type="button"
                    data-revision="${r.revision}"
                    class="social-log-select-btn"
                  >
                    <span class="log-rev-badge">Rev ${r.revision}</span>
                    <div class="log-entry-body">
                      <div class="log-entry-head">
                        <b>${escapeHtml(r.actor_name || 'Table')}</b>
                        <time>${formatTime(r.occurred_at)}</time>
                      </div>
                      <p>${escapeHtml(r.label)}</p>
                      ${r.detail ? `<small>${escapeHtml(r.detail)}</small>` : ''}
                    </div>
                  </button>
                  <button type="button" class="feed-inspect" data-inspect-revision="${r.revision}">Inspect position →</button>
                </article>`
              )
              .join('')}
          </div>
        `
          : `
          <div class="social-feed-scroll">
            ${combinedFeed
              .map((item) => {
                const isTurn = item.pid === activePlayerId;
                const revAttr =
                  item.revision !== null ? `data-event-revision="${item.revision}"` : '';
                return `
                  <article class="social-chat-item ${item.isNote ? 'is-table-note' : ''}" ${revAttr}>
                    <div class="club-avatar-circle ${item.pid?'custom-portrait':'club-note-seal'}" aria-hidden="true">${item.pid ? renderCharacter(viewData.members?.[item.pid]?.appearance,{name:item.author,surface:'portrait'}) : '茶'}</div>
                    <div class="social-chat-copy">
                      <div class="social-chat-head">
                        <b>${escapeHtml(item.author)} ${isTurn ? '<span class="crown-inline" title="Active turn">👑</span>' : ''}</b>
                        <time>${item.time}</time>
                      </div>
                      <small class="feed-kind">${item.isNote ? 'Current gathering · Note' : `Game move · Rev ${item.revision}`}</small>
                      <p ${item.isNote?'data-no-translate':''}>${escapeHtml(item.text)}</p>
                      ${item.revision !== null ? `<button class="feed-inspect" data-inspect-revision="${item.revision}">Inspect position →</button>` : ''}
                    </div>
                  </article>
                `;
              })
              .join('')}
          </div>
        `
      }

      <form class="social-chat-input-bar" data-form="club_note" aria-label="Current gathering conversation">
        <button
          type="button"
          class="chat-stamp-trigger"
          data-modal="stamp"
          title="Open Koenji Membership Stamp Card & Table Notes"
          aria-label="Open Membership Card"
        >☺</button>
        <input
          type="text"
          name="note_text"
          placeholder="Say something..."
          maxlength="140"
          aria-label="Say something to the table"
          required
        />
        <button type="submit" class="chat-send-btn" aria-label="Send table message" title="Post message to the table">
          ➤
        </button>
      </form>
    </aside>
  `;
}

function renderClubBottomDeck(appState, viewData) {
  const state = viewData.state;
  const order = state.player_order || ['p1', 'p2', 'p3', 'p4'];
  const viewerId = viewData.viewer?.player_id;
  const activePlayerId = state.current_player;
  const liveRev = appState.liveRevision || 0;
  const viewRev = appState.viewRevision || 0;
  const isHistorical = viewRev !== liveRev;
  const currentEv = (viewData.history_events || []).find((e) => e.revision === viewRev);

  return `
    <section class="club-bottom-deck" aria-label="Seated players, primary views, and replay controls">
      <div class="club-bottom-players">
        <div class="cbp-header">
          <strong>Players</strong>
          <span>|</span>
          <small>参加者 (${order.length}/${order.length})</small>
        </div>
        <div class="cbp-cards-row">
          ${order
            .map((pid, idx) => {
              const p = state.players?.[pid];
              if (!p) return '';
              const isTurn = activePlayerId === pid;
              const isViewer = viewerId === pid;
              const tags = getPlayerHoldingsTags(state, pid, 4);

              return `
                <button
                  type="button"
                  class="cbp-player-card ${isTurn ? 'is-turn' : ''} ${isViewer ? 'is-viewer' : ''}"
                  data-player-details="${pid}"
                  title="Inspect ${escapeHtml(p.name)}'s position (${pid.toUpperCase()})"
                >
                  <div class="cbp-top">
                    <div class="cbp-avatar-wrap">
                      ${isTurn ? '<i class="cbp-crown" title="Active turn">👑</i>' : ''}
                      <span class="club-avatar-circle custom-portrait">${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:p.name,surface:"portrait"})}</span>
                    </div>
                    <div class="cbp-identity">
                      <b>${escapeHtml(p.name)}${viewData.members?.[pid]?.is_host ? ' <span class="host-badge">Host</span>' : ''}</b>
                      <strong>${money(p.cash)}</strong>
                    </div>
                    <i class="cbp-online-dot ${viewData.presence?.[pid]?.online ? 'is-active' : 'is-away'}" title="${viewData.presence?.[pid]?.online ? 'Seated & online now' : 'Seated · away'}"></i>
                  </div>
                  <div class="cbp-badges">
                    ${
                      tags.length
                        ? tags
                            .map(
                              (t) =>
                                `<span class="cbp-tag" style="background:${t.color};color:${t.text}" title="${t.title}">${t.shortLabel}</span>`
                            )
                            .join('')
                        : `<span class="cbp-tag cbp-tag-empty">${isViewer ? 'YOU · ' : ''}0 certs</span>`
                    }
                  </div>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <div class="club-bottom-nav-and-timeline">
        <nav class="club-nav-cards" aria-label="Primary game views">
          <button
            type="button"
            data-view="table"
            class="club-nav-card ${appState.view === 'table' ? 'is-current-view' : ''} ${state.round === 'finished' || state.round === 'complete' ? 'selected is-active-phase' : ''}"
            title="Current screen: Koenji Railway Club Tabletop"
          >
            <span class="cnc-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28"><rect x="6" y="6" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="3" r="2" fill="currentColor"/><circle cx="14" cy="25" r="2" fill="currentColor"/><circle cx="3" cy="14" r="2" fill="currentColor"/><circle cx="25" cy="14" r="2" fill="currentColor"/></svg>
            </span>
            <strong>Game Table</strong>
            <small>ゲームテーブル</small>
          </button>

          <button
            type="button"
            data-view="market"
            class="club-nav-card ${state.round === 'auction' || state.round === 'stock' ? 'selected is-active-phase has-round-focus' : ''}"
            title="${state.round === 'auction' ? 'Current Phase: Click to open Private Railway Auction' : state.round === 'stock' ? `Current Phase (Stock Round ${state.stock_round}): Click to open Stock Market` : 'Inspect Stock Market & Charters'}"
          >
            ${
              state.round === 'auction' || state.round === 'stock'
                ? `<span class="cnc-phase-pill">${state.round === 'auction' ? 'AUCTION · 入札中' : `SR ${state.stock_round} · 進行中`}</span>`
                : ''
            }
            <span class="cnc-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28"><path d="M5 22h18M8 19v-6m4 6v-9m4 9v-5m4 5V8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
            </span>
            <strong>${state.round === 'auction' ? 'Private Auction' : 'Stock Exchange'}</strong>
            <small>${state.round === 'auction' ? '私有鉄道入札' : '株式市場'}</small>
          </button>

          <button
            type="button"
            data-view="map"
            class="club-nav-card ${state.round === 'operating' && ['track', 'token'].includes(state.operating_turn?.step || 'track') ? 'selected is-active-phase has-round-focus' : state.round === 'operating' ? 'has-round-focus' : ''}"
            title="${state.round === 'operating' ? `Current Phase (OR ${operatingRoundNumber(state)}): Click to lay track or place station tokens on the Shikoku Map` : 'Inspect 1889 Shikoku Map'}"
          >
            ${
              state.round === 'operating' &&
              ['track', 'token'].includes(state.operating_turn?.step || 'track')
                ? `<span class="cnc-phase-pill">MAP · 敷設中</span>`
                : ''
            }
            <span class="cnc-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28"><path d="M5 16l5-6 6 2 7-5 2 5-5 6-5-1-6 4z" fill="currentColor"/></svg>
            </span>
            <strong>Map & Operations</strong>
            <small>四国マップ</small>
          </button>

          <button
            type="button"
            data-view="history"
            class="club-nav-card"
            title="Open the Action Journal"
          >
            <span class="cnc-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28"><rect x="6" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/><circle cx="18" cy="16" r="1.5" fill="currentColor"/><path d="M9 9h10M8 23l3-3m9 3l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </span>
            <strong>Journal</strong>
            <small>棋譜 · Rev ${state.revision}</small>
          </button>
        </nav>

        <div class="club-inline-timeline" aria-label="Historical replay controls">
          <div class="playback">
            <button type="button" data-revision="0" aria-label="First revision (Rev 0)" title="Jump to Revision 0" ${viewRev === 0 ? 'disabled' : ''}>|‹</button>
            <button type="button" data-revision="${Math.max(0, viewRev - 1)}" aria-label="Previous revision" title="Step backward" ${viewRev === 0 ? 'disabled' : ''}>‹</button>
            <button type="button" data-action="toggle_play" aria-label="${appState.isPlayingReplay ? 'Pause replay' : 'Play replay'}" title="Play / Pause replay">
              ${appState.isPlayingReplay ? '⏸' : '▶'}
            </button>
            <button type="button" data-revision="${Math.min(liveRev, viewRev + 1)}" aria-label="Next revision" title="Step forward" ${viewRev >= liveRev ? 'disabled' : ''}>›</button>
            <button type="button" data-action="cycle_speed" class="speed-btn" title="Replay playback speed">
              ${appState.replaySpeedLabel || '1×'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="${liveRev}"
            value="${viewRev}"
            class="timeline-range"
            aria-label="Scrub revision history"
            data-scrub-range="true"
          />
          <span class="cit-rev-label" title="${escapeHtml(currentEv?.label || '')}">Rev <b>${viewRev}</b>/${liveRev}${currentEv?.label ? ` · ${escapeHtml(currentEv.label)}` : ''}</span>
          ${
            isHistorical
              ? `<button type="button" class="cit-live-btn" data-action="live">Return to Live${appState.queuedLiveCount ? ` (+${appState.queuedLiveCount} new)` : ''} →</button>`
              : ''
          }
        </div>
      </div>
    </section>
  `;
}

export function renderClubRoomScene(appState, viewData) {
  const state = viewData.state;
  const prices = viewData.prices || {};
  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const order = state.player_order || ['p1', 'p2', 'p3', 'p4'];
  const players = order.map((pid) => state.players?.[pid]).filter(Boolean);
  const viewerId = viewData.viewer?.player_id;
  const activePlayerId = state.current_player;

  const privatesList = Object.values(state.privates || {});
  const unsoldPrivates = privatesList.filter((p) => !p.owner);
  const offeredPrivId =
    state.auction?.active || unsoldPrivates[0]?.id || null;
  const offeredDiscount =
    offeredPrivId === 'TR' ? state.auction?.discount || 0 : 0;

  const seatedLayout=state.player_order.map((pid,i)=>({pid,persona:'daisuke',
    slotClass:'table-seat-doll',left:100*i/state.player_order.length,width:100/state.player_order.length}));
  const speechMap = buildSeatSpeechMap(state, viewData);
  const stampedCount = Object.keys(viewData.club?.stamps || {}).length;
  const viewerStamped = Boolean(
    viewerId && viewData.club?.stamps?.[viewerId]
  );

  // Determine the latest speaker from history or notes
  const events = viewData.history_events || [];
  const currentEvent =
    events.find((e) => e.revision === state.revision) ||
    events[events.length - 1];
  const latestSpeakerId = currentEvent?.actor_id || activePlayerId || 'p1';

  return `
    <section class="clubroom-social-layout" style="--seated-count:${order.length}" aria-label="Koenji Railway Club Tabletop">
      <div class="clubroom-upper-grid">
        <div class="clubroom-stage">
          <!-- Layer 1: Architectural Wood-Paneled Clubroom Backdrop -->
          <div class="clubroom-backdrop-layer">
            ${renderClubroomBackdropSVG()}
          </div>

          ${
            isHistorical
              ? `<div class="historical-banner" role="status">
                  <span>⏪ HISTORICAL SNAPSHOT · REV ${appState.viewRevision} OF ${appState.liveRevision} (READ-ONLY)</span>
                  ${
                    appState.queuedLiveNotice
                      ? `<b>· ${appState.queuedLiveNotice}</b>`
                      : ''
                  }
                  <button type="button" data-action="live">Return to Live (Rev ${appState.liveRevision}) →</button>
                </div>`
              : ''
          }

          <!-- Layer 2: Independent, Pose-Swappable Seated Character Sprites -->
          <div class="clubroom-sprites-layer">
            ${seatedLayout.map(({ pid, slotClass, persona, left, width }) => {
              const player = state.players?.[pid];
              if (!player) return '';
              const isTurn = activePlayerId === pid;
              const isSpeaking =
                latestSpeakerId === pid || Boolean(speechMap[pid]?.isNote);
              return `
                <div class="seated-sprite-slot ${slotClass}" style="--seat-left:${left}%;--seat-width:${width}%">
                  ${renderSeatedMemberSprite(
                    persona,
                    {...player,appearance:viewData.members?.[pid]?.appearance,memberId:viewData.members?.[pid]?.member_id || pid},
                    isTurn,
                    isSpeaking,
                    appState.skipMotion
                  )}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Layer 3: Foreground Curved Mahogany & Green-Felt Table + Props -->
          <div class="clubroom-table-layer">
            ${renderTabletopPropsSVG()}
          </div>

          <!-- Layer 4: Seated Friends Speech Bubbles & Plaques -->
          ${seatedLayout.map(({ pid, slotClass, avatarIdx, left, width }) => {
            const player = state.players?.[pid];
            if (!player) return '';
            const isTurn = activePlayerId === pid;
            const isViewer = viewerId === pid;
            const speech = speechMap[pid];
            const tags = getPlayerHoldingsTags(state, pid, 4);

            return `
              <div class="seated-friend-overlay ${slotClass} ${isTurn ? 'is-active-turn' : ''}" style="--seat-left:${left}%;--seat-width:${width}%">
                ${
                  speech
                    ? `
                    <div class="seated-speech-bubble ${isTurn ? 'bubble-active' : ''}">
                      <span class="club-avatar-circle custom-portrait" aria-hidden="true">${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:player.name,surface:"portrait"})}</span>
                      <div class="speech-copy">
                        <b>${escapeHtml(player.name)} ${isTurn ? '👑' : ''}</b>
                        <p ${speech.isNote?'data-no-translate':''}>${escapeHtml(speech.text)}</p>
                      </div>
                    </div>
                  `
                    : ''
                }

                <button
                  type="button"
                  class="seated-player-plaque ${isTurn ? 'is-turn' : ''} ${isViewer ? 'is-viewer' : ''}"
                  data-player-details="${pid}"
                  title="Inspect ${escapeHtml(player.name)}'s position (${pid.toUpperCase()})"
                >
                  <div class="plaque-top-row">
                    <i class="plaque-dot ${isTurn ? 'dot-turn' : ''}"></i>
                    <strong class="plaque-name">${escapeHtml(player.name)} ${viewData.members?.[pid]?.is_host ? '<span class="host-badge">Host</span>' : ''} ${isTurn ? '👑' : ''}</strong>
                    <b class="plaque-cash">${money(player.cash)}</b>
                  </div>
                  <div class="plaque-badges-row">
                    ${
                      tags.length
                        ? tags
                            .map(
                              (t) =>
                                `<span class="plaque-badge" style="background:${t.color};color:${t.text}" title="${t.title}">${t.shortLabel}</span>`
                            )
                            .join('')
                        : `<span class="plaque-badge plaque-badge-empty">${isViewer ? 'YOU · ' : ''}0 certs</span>`
                    }
                  </div>
                </button>
              </div>
            `;
          }).join('')}

          <!-- Layer 5: Interactive Tabletop Hotspots (Charters, Live 1889 Board, Train Card, Stamp Card) -->
          <button
            type="button"
            class="certificate-bank tabletop-charter-stack ${state.round === 'auction' || state.round === 'stock' ? 'is-phase-target' : ''}"
            data-view="market"
            aria-label="${state.round === 'auction' ? 'Open Private Company Auction Desk' : 'Open Stock Exchange'}"
            title="${state.round === 'auction' ? 'Current Phase: Open Private Railway Auction' : state.round === 'stock' ? 'Current Phase: Open Stock Exchange' : 'Open Stock Exchange'}"
          >
            <strong class="tt-exchange-label"><svg viewBox="0 0 32 24" aria-hidden="true"><rect x="2" y="2" width="28" height="20" rx="2"/><path d="M7 7h18M7 11h12M7 15h9"/><circle cx="25" cy="17" r="3"/></svg>${state.round==='auction'?'Private Auction':'Stock Exchange'}</strong>
            ${
              state.round === 'auction'
                ? privatesList
                    .slice(0, 5)
                    .map((p) => {
                      const pMeta = PRIVATE_META[p.id] || {};
                      const isOff = p.id === offeredPrivId;
                      const pPrice =
                        p.value - (p.id === 'TR' ? offeredDiscount : 0);
                      return `
                        <span class="tt-charter-row" style="--company:${pMeta.color || '#8d5b34'}">
                          <b>${p.id}</b>
                          <small>${p.owner ? state.players?.[p.owner]?.name || p.owner : isOff ? `★${money(pPrice)}` : money(p.value)}</small>
                        </span>
                      `;
                    })
                    .join('')
                : ['AR', 'IR', 'SR', 'KO', 'TR']
                    .filter((cid) => state.corporations?.[cid])
                    .map((cid) => {
                      const c = state.corporations[cid];
                      const m = CORP_META[cid] || { color: '#b84f3d' };
                      const priceVal = prices[cid] || c.par || 0;
                      return `
                        <span class="tt-charter-row" style="--company:${m.color}">
                          <b>${cid}</b>
                          <small>${priceVal ? money(priceVal) : `${c.ipo}%`}</small>
                        </span>
                      `;
                    })
                    .join('')
            }
          </button>

          <button
            type="button"
            class="board-preview tabletop-board-hotspot ${state.round === 'operating' ? 'is-phase-target' : ''}"
            data-view="map"
            aria-label="Inspect interactive 1889 Shikoku Map"
            title="${state.round === 'operating' ? `Current Phase (OR ${operatingRoundNumber(state)}): Click to open interactive 1889 Shikoku Map & Operating View` : 'Click to zoom into the interactive 1889 Shikoku Map & Operating View'}"
          >
            ${renderBoardMiniatureSVG(state)}
          </button>

          ${renderTabletopTrainOrAuctionCard(state, appState.catalog)}

          <button
            type="button"
            class="stamp-card-hotspot tabletop-stamp-plaque"
            data-modal="stamp"
            aria-label="Open Koenji Club Membership Stamp Card"
            title="Open Koenji Railway Club Membership Stamp Card (${stampedCount}/${players.length} stamped tonight)"
          >
            <div class="tsp-header">
              <b>高円寺鉄道倶楽部</b>
              <small>KOENJI RAILWAY CLUB</small>
            </div>
            <div class="tsp-body">
              <div class="tsp-sketch" aria-hidden="true">⛩️</div>
              <div class="tsp-motto">
                <em>Good friends</em>
                <em>Good trains</em>
                <em>A greater Shikoku</em>
              </div>
              <span class="hanko-seal ${viewerStamped ? 'stamped' : ''}">鉄道<br>倶楽部</span>
            </div>
            <span class="tsp-count">${stampedCount}/${players.length} stamped tonight</span>
          </button>


        </div>

        ${renderSocialAndLogSidebar(appState, viewData)}
      </div>

      ${renderClubBottomDeck(appState, viewData)}
    </section>
  `;
}
