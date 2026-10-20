/**
 * Shared 3-Layer Inverted Paper-Doll + Semi-Photorealistic Head Artwork & Prop Vocabulary
 * Implements `docs/koenji/animation_asset_checklist.md` & `docs/koenji/paper_doll_integration_plan.md`.
 *
 * Layer 1 (Back):   `renderTorso(outfitId, pose)` — Meiji outfit torso & open collar at (100, 92)
 * Layer 2 (Middle): `renderHead(faceSpec, expression, options)` — Semi-photorealistic raster PNG head `<image>` + vector fallback
 * Layer 3 (Front):  `renderForeground(faceSpec, outfitId, pose, propSpec)` — Poseable sleeves, skin-matched hands, and separable props
 */

import { escapeHtml as esc } from '../ui/presentation.js';

export const SURFACE_CROPS = {
  table: '0 0 200 240',
  setup: '0 0 200 240',
  portrait: '24 8 152 145',
  arrival: '10 0 180 215',
};

export const VALID_EXPRESSIONS = [
  'neutral',
  'smile',
  'calculating',
  'declare',
  'shock',
  'concerned',
  'disappointed',
  'laugh',
  'blink',
];

export const VALID_POSES = [
  'idle',
  'tea',
  'thinking',
  'ledger',
  'point',
  'certificate',
  'token',
  'shock',
  'wave',
  'bow',
  'triumphant',
  'offer',
  'receive',
  'place',
  'count',
  'close_ledger',
];

export const OUTFIT_STYLES = {
  'indigo-haori': { name: 'Indigo Haori', main: '#263e57', mid: '#314f6e', dark: '#172636', inner: '#e8d8b5', cord: '#c9a66b', cuff: '#172636', kind: 'kimono' },
  'charcoal-suit': { name: 'Charcoal Suit', main: '#33383e', mid: '#434952', dark: '#1e2126', inner: '#f2e5c7', vest: '#784e2d', cravat: '#7c242b', cuff: '#1e2126', kind: 'suit' },
  'plum-kimono': { name: 'Plum Kimono', main: '#5e314a', mid: '#753f5d', dark: '#3b1d2e', inner: '#f0dec0', cord: '#d6b065', cuff: '#3b1d2e', kind: 'kimono' },
  'moss-hakama': { name: 'Moss Hakama', main: '#43543d', mid: '#55694e', dark: '#293425', inner: '#e6d6b5', cord: '#9c8654', cuff: '#293425', kind: 'kimono' },
  'imperial-railway-uniform': { name: 'Imperial Railway Uniform', main: '#1b2838', mid: '#26384f', dark: '#0f1722', inner: '#f2e5c7', accent: '#d4a843', cuff: '#9e2a2b', kind: 'uniform' },
  'crimson-furisode': { name: 'Crimson Brocade Kimono', main: '#7a2026', mid: '#962a31', dark: '#4a1115', inner: '#f7ebd2', accent: '#e0b458', cuff: '#e0b458', kind: 'brocade' },
  'inverness-cape': { name: 'Meiji Inverness Cape-Coat', main: '#6e5239', mid: '#856447', dark: '#3d2c1e', inner: '#f0e2c6', vest: '#8c6d4e', cravat: '#255c45', cuff: '#3d2c1e', kind: 'inverness' },
  'merchant-hanten': { name: 'Shikoku Merchant Hanten', main: '#233447', mid: '#2e445c', dark: '#131d29', inner: '#e6d4b3', accent: '#b85d2e', cuff: '#131d29', kind: 'merchant' },
  'ivory-summer-suit': { name: 'Yokohama Ivory Linen Suit', main: '#dfd3bc', mid: '#ece2ce', dark: '#8c7d65', inner: '#ffffff', vest: '#4a607a', cravat: '#1e334d', cuff: '#ffffff', kind: 'summer-suit' },
  'amber-jinbaori': { name: 'Amber Crested Jinbaori', main: '#8f5b22', mid: '#ab6f2c', dark: '#472c0e', sleeve: '#2c1d14', inner: '#e8d7b4', accent: '#e3b963', cuff: '#e3b963', kind: 'jinbaori' },
  'teal-frock-coat': { name: 'Velvet-Lapel Teal Frock Coat', main: '#1f4745', mid: '#295c59', dark: '#102625', inner: '#f5ebd6', vest: '#5e2129', cravat: '#9aa3ad', cuff: '#152423', kind: 'frock' },
  'slate-montsuki': { name: 'Slate Five-Crest Montsuki', main: '#3d434d', mid: '#4e5663', dark: '#22262c', inner: '#f0ead8', accent: '#f2ebd9', cuff: '#22262c', kind: 'montsuki' },
};

/**
 * Normalize legacy app pose names (`acting`, `speaking`, `arriving`) to checklist vocabulary
 */
export function resolvePoseAndExpression(rawPose = 'idle', rawExpression = null) {
  let pose = rawPose;
  let expr = rawExpression;
  if (rawPose === 'acting') {
    pose = 'point';
    expr = expr || 'declare';
  } else if (rawPose === 'speaking') {
    pose = 'tea';
    expr = expr || 'declare';
  } else if (rawPose === 'arriving') {
    pose = 'wave';
    expr = expr || 'smile';
  }
  if (!VALID_POSES.includes(pose)) pose = 'idle';
  if (!VALID_EXPRESSIONS.includes(expr)) expr = 'neutral';
  return { pose, expression: expr };
}

// Keep the head attachment and outfit collar together when a held pose leans.
const POSE_BODY_Y = { bow: 6, point: 4, place: 4, shock: -3, triumphant: -3 };
function bodyPoseTransform(pose) {
  const y = POSE_BODY_Y[pose] || 0;
  return y ? `transform="translate(0, ${y})"` : '';
}

/**
 * Layer 1 (Back): Outfit Torso & Open Collar at (100, 92)
 */
export function renderTorso(outfitId = 'indigo-haori', rawPose = 'idle') {
  const c = OUTFIT_STYLES[outfitId] || OUTFIT_STYLES['indigo-haori'];
  const { pose } = resolvePoseAndExpression(rawPose);
  const lean = bodyPoseTransform(pose);
  const chair = `<path d="M26 118 Q100 98 174 118 L182 235 L18 235 Z" fill="#382012" stroke="#6e4423" stroke-width="2.5"/>`;

  if (c.kind === 'suit') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M28 235 L38 132 Q54 108 78 104 L122 104 Q146 108 162 132 L172 235 Z" fill="${c.main}" stroke="#17191c" stroke-width="2.5"/>
      <path d="M78 96 L100 138 L122 96 L116 88 L84 88 Z" fill="${c.inner}" stroke="#3b2c1e" stroke-width="1.8"/>
      <polygon points="78,108 100,152 122,108 118,225 82,225" fill="${c.vest}" stroke="#29190e" stroke-width="1.8"/>
      <path d="M92 108 L108 108 L112 142 L100 154 L88 142 Z" fill="${c.cravat}" stroke="#381014" stroke-width="1.5"/>
      <path d="M76 104 L58 148 L84 176 L88 136 Z M124 104 L142 148 L116 176 L112 136 Z" fill="#272b30" stroke="#17191c" stroke-width="1.8"/>
      <path d="M98 175 Q114 196 122 178" fill="none" stroke="#e0b458" stroke-width="2.2"/>
    </g>`;
  }
  if (c.kind === 'uniform') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M26 235 L36 130 Q52 108 78 104 L122 104 Q148 108 164 130 L174 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M78 96 L100 132 L122 96 L116 88 L84 88 Z" fill="${c.inner}" stroke="#3b2c1e" stroke-width="1.8"/>
      <path d="M76 98 L88 122 L112 122 L124 98 L118 92 L82 92 Z" fill="#131c29" stroke="${c.accent}" stroke-width="2.2"/>
      <path d="M38 122 L68 106 L72 115 L42 131 Z M162 122 L132 106 L128 115 L158 131 Z" fill="${c.accent}" stroke="#5c4214" stroke-width="1.6"/>
      <line x1="100" y1="122" x2="100" y2="232" stroke="${c.cuff}" stroke-width="3"/>
      <g fill="#f0c862" stroke="#5c4214" stroke-width="1.2">
        <circle cx="82" cy="138" r="3.8"/><circle cx="118" cy="138" r="3.8"/>
        <circle cx="84" cy="160" r="3.8"/><circle cx="116" cy="160" r="3.8"/>
        <circle cx="86" cy="182" r="3.8"/><circle cx="114" cy="182" r="3.8"/>
      </g>
    </g>`;
  }
  if (c.kind === 'brocade') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M20 235 L32 132 Q50 108 78 104 L122 104 Q150 108 168 132 L180 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M74 98 L100 164 L126 98 L116 90 L84 90 Z" fill="${c.inner}" stroke="#5c3d1e" stroke-width="2"/>
      <path d="M78 100 L105 156 M122 100 L95 144" stroke="${c.accent}" stroke-width="3"/>
      <g fill="none" stroke="${c.accent}" stroke-width="1.8"><circle cx="58" cy="142" r="8"/><circle cx="142" cy="142" r="8"/></g>
      <rect x="56" y="172" width="88" height="30" rx="2" fill="#241a16" stroke="${c.accent}" stroke-width="2.2"/>
      <line x1="56" y1="187" x2="144" y2="187" stroke="#d94e34" stroke-width="3.5"/>
      <ellipse cx="100" cy="187" rx="7" ry="4.5" fill="${c.accent}" stroke="#4a1115" stroke-width="1.5"/>
    </g>`;
  }
  if (c.kind === 'inverness') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M24 235 L34 130 Q52 108 78 104 L122 104 Q148 108 166 130 L176 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M78 96 L100 138 L122 96 L116 88 L84 88 Z" fill="${c.inner}" stroke="#3b2c1e" stroke-width="1.8"/>
      <polygon points="78,108 100,152 122,108 118,225 82,225" fill="${c.vest}" stroke="#29190e" stroke-width="1.8"/>
      <path d="M92 108 L108 108 L112 142 L100 154 L88 142 Z" fill="${c.cravat}" stroke="#122e22" stroke-width="1.5"/>
      <circle cx="100" cy="128" r="3" fill="#f7f2e6"/>
      <path d="M22 182 L34 126 Q54 106 78 104 L68 188 Z M178 182 L166 126 Q146 106 122 104 L132 188 Z" fill="${c.mid}" stroke="${c.dark}" stroke-width="2.2"/>
      <path d="M76 104 L56 148 L84 176 L88 136 Z M124 104 L144 148 L116 176 L112 136 Z" fill="#2e1f14" stroke="#1a110b" stroke-width="1.8"/>
    </g>`;
  }
  if (c.kind === 'merchant') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M22 235 L34 132 Q52 108 78 104 L122 104 Q148 108 166 132 L178 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <g stroke="${c.accent}" stroke-width="2.4"><line x1="48" y1="120" x2="42" y2="232"/><line x1="62" y1="112" x2="58" y2="232"/><line x1="138" y1="112" x2="142" y2="232"/><line x1="152" y1="120" x2="158" y2="232"/></g>
      <path d="M76 98 L100 162 L124 98 L115 90 L85 90 Z" fill="${c.inner}" stroke="#473623" stroke-width="2"/>
      <path d="M74 102 L98 168 L86 174 L64 114 Z M126 102 L102 168 L114 174 L136 114 Z" fill="#131d29"/>
      <rect x="56" y="176" width="88" height="22" fill="#162230" stroke="#c9a66b" stroke-width="1.8"/>
      <rect x="90" y="180" width="20" height="14" rx="2" fill="#d4a843" stroke="#3b2814" stroke-width="1.5"/>
    </g>`;
  }
  if (c.kind === 'summer-suit') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M28 235 L38 132 Q54 108 78 104 L122 104 Q146 108 162 132 L172 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M78 96 L100 138 L122 96 L116 88 L84 88 Z" fill="${c.inner}" stroke="#8c7d65" stroke-width="1.8"/>
      <polygon points="78,110 100,154 122,110 118,225 82,225" fill="${c.vest}" stroke="#263342" stroke-width="1.8"/>
      <polygon points="86,110 100,116 86,122" fill="${c.cravat}"/><polygon points="114,110 100,116 114,122" fill="${c.cravat}"/>
      <path d="M76 104 L56 146 L84 176 L88 136 Z M124 104 L144 146 L116 176 L112 136 Z" fill="#c4b293" stroke="${c.dark}" stroke-width="1.8"/>
      <circle cx="70" cy="142" r="5" fill="#b82921" stroke="#5e110d" stroke-width="1.2"/>
    </g>`;
  }
  if (c.kind === 'jinbaori') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M22 235 L34 132 Q52 108 78 104 L122 104 Q148 108 166 132 L178 235 Z" fill="${c.sleeve}" stroke="#170f0a" stroke-width="2.5"/>
      <path d="M76 98 L100 162 L124 98 L115 90 L85 90 Z" fill="${c.inner}" stroke="#473623" stroke-width="2"/>
      <path d="M48 235 L54 110 Q68 104 80 104 L94 235 Z M152 235 L146 110 Q132 104 120 104 L106 235 Z" fill="${c.main}" stroke="${c.accent}" stroke-width="2.2"/>
      <path d="M78 104 L62 156 L88 178 L92 140 Z M122 104 L138 156 L112 178 L108 140 Z" fill="${c.mid}" stroke="${c.accent}" stroke-width="2"/>
      <circle cx="68" cy="134" r="6" fill="none" stroke="#f5d77f" stroke-width="1.8"/><circle cx="132" cy="134" r="6" fill="none" stroke="#f5d77f" stroke-width="1.8"/>
      <path d="M74 168 Q100 180 126 168" fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="173" r="5.5" fill="${c.accent}" stroke="#472c0e" stroke-width="1.5"/>
    </g>`;
  }
  if (c.kind === 'frock') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M26 235 L36 132 Q54 108 78 104 L122 104 Q146 108 164 132 L174 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M78 96 L100 138 L122 96 L116 88 L84 88 Z" fill="${c.inner}" stroke="#3b2c1e" stroke-width="1.8"/>
      <polygon points="78,108 100,154 122,108 118,225 82,225" fill="${c.vest}" stroke="#2e0d12" stroke-width="1.8"/>
      <path d="M92 108 L108 108 L112 142 L100 154 L88 142 Z" fill="${c.cravat}" stroke="#495057" stroke-width="1.5"/>
      <polygon points="100,122 104,127 100,132 96,127" fill="#ffffff"/>
      <path d="M76 104 L56 148 L84 178 L88 136 Z M124 104 L144 148 L116 178 L112 136 Z" fill="#152423" stroke="#091211" stroke-width="2"/>
      <path d="M84 180 Q92 196 100 182 Q108 196 116 180" fill="none" stroke="#e5be5c" stroke-width="2.2"/>
    </g>`;
  }
  if (c.kind === 'montsuki') {
    return `<g class="paper-doll-layer1" ${lean}>${chair}
      <path d="M22 235 L34 132 Q52 108 78 104 L122 104 Q148 108 166 132 L178 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
      <path d="M76 98 L100 162 L124 98 L115 90 L85 90 Z" fill="${c.inner}" stroke="#473623" stroke-width="2"/>
      <g fill="none" stroke="${c.accent}" stroke-width="2">
        <circle cx="62" cy="144" r="7.5"/><circle cx="62" cy="144" r="3" fill="${c.accent}"/>
        <circle cx="138" cy="144" r="7.5"/><circle cx="138" cy="144" r="3" fill="${c.accent}"/>
      </g>
      <path d="M74 166 Q100 176 126 166" fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="170" r="5.5" fill="${c.accent}" stroke="#22262c" stroke-width="1.5"/>
    </g>`;
  }
  return `<g class="paper-doll-layer1" ${lean}>${chair}
    <path d="M22 235 L34 132 Q52 108 78 104 L122 104 Q148 108 166 132 L178 235 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>
    <path d="M76 98 L100 162 L124 98 L115 90 L85 90 Z" fill="${c.inner}" stroke="#473623" stroke-width="2"/>
    <path d="M80 100 L106 154 M120 100 L94 142" stroke="#bfa87e" stroke-width="2"/>
    <path d="M74 166 Q100 176 126 166" fill="none" stroke="${c.cord}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="100" cy="170" r="5" fill="${c.cord}" stroke="#3b2814" stroke-width="1.5"/>
  </g>`;
}

/**
 * Layer 2 (Middle): Semi-Photorealistic Raster PNG Head Layer (`<image>`)
 */
export function renderHead(faceSpec, rawExpression = 'neutral', { rawPose = 'idle', assetBase = '/assets/koma-sprites/photoreal-heads', mode = 'photoreal' } = {}) {
  const { pose, expression } = resolvePoseAndExpression(rawPose, rawExpression);
  const photorealId = faceSpec?.photorealId || 'member-1';
  const headOffset = bodyPoseTransform(pose);

  if (mode === 'photoreal' && faceSpec?.headAtlas) {
    const atlas = faceSpec.headAtlas;
    const frame = atlas.frames[expression] || atlas.frames.neutral;
    const [x, y, width, height] = atlas.placement || [56, 8, 88, 110];
    const scale = Math.min(width / frame[2], height / frame[3]);
    const frameWidth = frame[2] * scale;
    const frameHeight = frame[3] * scale;
    const neck = atlas.neckAnchors?.[expression] || [frame[0] + frame[2] / 2, frame[1] + frame[3]];
    const frameX = x + width / 2 - (neck[0] - frame[0]) * scale;
    const frameY = y + height - (neck[1] - frame[1]) * scale;
    // Clip a registered expression directly from the original transparent atlas.
    // Register the neck, rather than the hair/face silhouette, to the collar.
    // Each expression retains its own exact source rectangle for clipping.
    // SVG `meet` letterboxing leaves room for adjacent atlas rows to bleed into
    // the viewport even with overflow hidden. An exact fit clips all four edges.
    return `<g class="paper-doll-layer2" data-expression="${esc(expression)}" data-head-atlas="${esc(photorealId)}" ${headOffset}>
      <svg class="paper-doll-head-frame" x="${frameX}" y="${frameY}" width="${frameWidth}" height="${frameHeight}" viewBox="${frame.join(' ')}" preserveAspectRatio="none" overflow="hidden">
        <image href="${esc(`${assetBase}/${atlas.file}`)}" x="0" y="0" width="${atlas.width}" height="${atlas.height}"/>
      </svg>
    </g>`;
  }

  if (mode === 'photoreal') {
    const pngUrl = `${assetBase}/${photorealId}-${expression}-photoreal.png`;
    return `<g class="paper-doll-layer2" data-expression="${esc(expression)}" ${headOffset}>
      <image href="${esc(pngUrl)}" x="0" y="0" width="200" height="240" preserveAspectRatio="xMidYMid meet"/>
    </g>`;
  }

  // Vector fallback if explicitly requested
  const skin = faceSpec?.skin || '#cf8f5a';
  const stroke = faceSpec?.stroke || '#452815';
  return `<g class="paper-doll-layer2" data-expression="${esc(expression)}" ${headOffset}>
    <path d="M84 88 L84 114 Q100 124 116 114 L116 88 Z" fill="${skin}" stroke="${stroke}" stroke-width="2"/>
    <ellipse cx="100" cy="64" rx="31" ry="40" fill="${skin}" stroke="${stroke}" stroke-width="2.2"/>
  </g>`;
}

/**
 * Separable & Replaceable Prop Renderer (Checklist Section 2 & Section 6)
 */
export function renderReplaceableProp(propSpec = null) {
  if (!propSpec || propSpec.empty) return '';
  const kind = typeof propSpec === 'string' ? propSpec : propSpec.kind;
  const label = esc(propSpec.label || '');
  const sublabel = esc(propSpec.sublabel || '');
  const color = esc(propSpec.color || '#2c4c6e');
  const overlay = propSpec.overlay || null; // 'rusted' | 'returned' | 'closed' | 'ability_used' | 'utf_open'

  let overlaySvg = '';
  if (overlay === 'rusted') {
    overlaySvg = `<g transform="translate(4, 24)"><rect x="0" y="0" width="58" height="16" rx="2" fill="#7c241e" stroke="#ffdfd6" stroke-width="1.2"/><text x="29" y="11" text-anchor="middle" fill="#fff" font-size="6.5" font-family="monospace" font-weight="bold">RUSTED · 廃車</text></g>`;
  } else if (overlay === 'returned') {
    overlaySvg = `<g transform="translate(4, 24)"><rect x="0" y="0" width="58" height="16" rx="2" fill="#1e3c58" stroke="#90caf9" stroke-width="1.2"/><text x="29" y="11" text-anchor="middle" fill="#fff" font-size="6.5" font-family="monospace" font-weight="bold">TO DEPOT</text></g>`;
  } else if (overlay === 'closed') {
    overlaySvg = `<g transform="translate(6, 22)"><rect x="0" y="0" width="54" height="16" rx="2" fill="#3b1714" stroke="#f58278" stroke-width="1.2"/><text x="27" y="11" text-anchor="middle" fill="#ffd6d1" font-size="6.5" font-family="monospace" font-weight="bold">CLOSED 閉鎖</text></g>`;
  } else if (overlay === 'utf_open') {
    overlaySvg = `<g transform="translate(4, 22)"><rect x="0" y="0" width="58" height="16" rx="2" fill="#1e4631" stroke="#f5ca70" stroke-width="1.2"/><text x="29" y="11" text-anchor="middle" fill="#fff4d6" font-size="6.5" font-family="monospace" font-weight="bold">UTF ¥50/OR</text></g>`;
  } else if (overlay === 'ability_used') {
    overlaySvg = `<g transform="translate(4, 22)"><rect x="0" y="0" width="58" height="16" rx="2" fill="#2b3d22" stroke="#a5d6a7" stroke-width="1.2"/><text x="29" y="11" text-anchor="middle" fill="#e8f5e9" font-size="6.2" font-family="monospace" font-weight="bold">USED · 行使済</text></g>`;
  }

  switch (kind) {
    case 'share_cert':
      return `<g class="separable-prop prop-share-cert">
        <rect x="0" y="0" width="66" height="46" rx="2.5" fill="#f5e6c4" stroke="#b88636" stroke-width="2.4"/>
        <rect x="3" y="3" width="60" height="11" fill="${color}"/>
        <text x="33" y="11" text-anchor="middle" fill="#fff4d8" font-size="7.5" font-weight="bold" font-family="Georgia, serif">${label || 'SHARE'}</text>
        <text x="33" y="27" text-anchor="middle" fill="#2b190d" font-size="8" font-family="monospace" font-weight="bold">${sublabel || '10% CERT'}</text>
        <circle cx="52" cy="34" r="4.5" fill="#b82921"/>
        ${overlaySvg}
      </g>`;
    case 'private_cert':
      return `<g class="separable-prop prop-private-cert">
        <rect x="0" y="0" width="66" height="46" rx="2.5" fill="#f2e2c4" stroke="#6e4b26" stroke-width="2.4"/>
        <rect x="3" y="3" width="60" height="11" fill="#5e391c"/>
        <text x="33" y="11" text-anchor="middle" fill="#f7e6c4" font-size="7" font-weight="bold" font-family="monospace">${label || 'PRIVATE'}</text>
        <text x="33" y="27" text-anchor="middle" fill="#2b190d" font-size="7.5" font-family="monospace" font-weight="bold">${sublabel || 'CONCESSION'}</text>
        ${overlaySvg}
      </g>`;
    case 'train_card':
      return `<g class="separable-prop prop-train-card">
        <rect x="0" y="0" width="66" height="46" rx="3" fill="#f4e6c8" stroke="#3b2b1d" stroke-width="2.4"/>
        <rect x="3" y="3" width="60" height="11" fill="#23382e"/>
        <text x="33" y="11" text-anchor="middle" fill="#e8f7ee" font-size="7.5" font-weight="bold" font-family="monospace">${label || 'TRAIN'}</text>
        <path d="M14 34 H52 L49 24 H39 V19 H29 V24 H18 Z" fill="#2b2623"/>
        <text x="33" y="42" text-anchor="middle" fill="#5c3d1e" font-size="6.5" font-family="monospace">${sublabel || 'DEPOT'}</text>
        ${overlaySvg}
      </g>`;
    case 'track_hex':
      return `<g class="separable-prop prop-track-hex">
        <polygon points="18,0 36,10 36,30 18,40 0,30 0,10" fill="${esc(propSpec.color || '#5da667')}" stroke="#26190f" stroke-width="2"/>
        <path d="M0 20 H36 M18 0 V40" stroke="#1e1712" stroke-width="3.5"/>
        <circle cx="18" cy="20" r="6" fill="#f7ebd2" stroke="#1e1712" stroke-width="1.5"/>
        ${label ? `<text x="18" y="49" text-anchor="middle" fill="#f5ca70" font-size="7" font-family="monospace" font-weight="bold">${label}</text>` : ''}
      </g>`;
    case 'station_token':
      return `<g class="separable-prop prop-station-token">
        <circle cx="18" cy="18" r="14" fill="${color}" stroke="#f7ebd2" stroke-width="2.2"/>
        <text x="18" y="21" text-anchor="middle" fill="#fff4d8" font-size="8" font-weight="bold" font-family="monospace">${label || 'STA'}</text>
        ${sublabel ? `<text x="18" y="40" text-anchor="middle" fill="#f5ca70" font-size="6.8" font-family="monospace" font-weight="bold">${sublabel}</text>` : ''}
      </g>`;
    case 'cash_envelope':
      return `<g class="separable-prop prop-cash-envelope">
        <rect x="0" y="4" width="52" height="32" rx="2.5" fill="#e6d3a7" stroke="#5c4222" stroke-width="2"/>
        <polygon points="0,4 26,20 52,4" fill="#d6be89" stroke="#5c4222" stroke-width="1.5"/>
        <rect x="20" y="2" width="12" height="36" fill="#b83b2b" opacity="0.9"/>
        <text x="26" y="23" text-anchor="middle" fill="#fff4d8" font-size="8" font-weight="bold" font-family="Georgia, serif">${label || '¥'}</text>
        ${sublabel ? `<text x="26" y="45" text-anchor="middle" fill="#f5ca70" font-size="6.8" font-family="monospace" font-weight="bold">${sublabel}</text>` : ''}
      </g>`;
    case 'hanko_stamp':
      return `<g class="separable-prop prop-hanko-stamp">
        <rect x="0" y="8" width="44" height="30" rx="2" fill="#f5e6c4" stroke="#6e4e2a" stroke-width="1.8"/>
        <circle cx="22" cy="23" r="8.5" fill="none" stroke="#b82921" stroke-width="2"/>
        <text x="22" y="26" text-anchor="middle" fill="#b82921" font-size="7" font-family="serif" font-weight="bold">${label || '高円寺'}</text>
        <rect x="34" y="-8" width="10" height="26" rx="2" fill="#3b2112" stroke="#1a0d06" stroke-width="1.5"/>
      </g>`;
    case 'priority_deal':
      return `<g class="separable-prop prop-priority-deal">
        <rect x="0" y="0" width="54" height="38" rx="3" fill="#2b1d12" stroke="#e0b054" stroke-width="2.2"/>
        <circle cx="27" cy="16" r="9" fill="#e0b054"/>
        <text x="27" y="20" text-anchor="middle" fill="#24140a" font-size="9" font-weight="bold">先</text>
        <text x="27" y="33" text-anchor="middle" fill="#f5d78e" font-size="6.5" font-family="monospace">PRIORITY</text>
      </g>`;
    case 'phase_card':
      return `<g class="separable-prop prop-phase-card">
        <rect x="0" y="0" width="66" height="44" rx="3" fill="#1e1610" stroke="#e0b054" stroke-width="2.2"/>
        <rect x="3" y="3" width="60" height="11" fill="#8c5d23"/>
        <text x="33" y="11" text-anchor="middle" fill="#fff4d6" font-size="7" font-family="monospace" font-weight="bold">${label || 'PHASE CHANGE'}</text>
        <text x="33" y="28" text-anchor="middle" fill="#f2e3c2" font-size="7.5" font-family="monospace" font-weight="bold">${sublabel || 'LIMIT / RUST'}</text>
        ${overlaySvg}
      </g>`;
    case 'bank_end_pending':
      return `<g class="separable-prop prop-bank-end">
        <rect x="0" y="0" width="66" height="44" rx="3" fill="#2e1412" stroke="#e07a5f" stroke-width="2.2"/>
        <rect x="3" y="3" width="60" height="11" fill="#7c241e"/>
        <text x="33" y="11" text-anchor="middle" fill="#fff0eb" font-size="6.8" font-family="monospace" font-weight="bold">BANK EXHAUSTED</text>
        <text x="33" y="28" text-anchor="middle" fill="#f5ca70" font-size="7" font-family="monospace" font-weight="bold">${sublabel || 'END PENDING'}</text>
      </g>`;
    default:
      return '';
  }
}

/**
 * Layer 3 (Front): Foreground Arms, Sleeves & Separable Props (P1–P16)
 */
export function renderForeground(faceSpec, outfitId = 'indigo-haori', rawPose = 'idle', propSpec = null) {
  const c = OUTFIT_STYLES[outfitId] || OUTFIT_STYLES['indigo-haori'];
  const sleeveFill = c.sleeve || c.main;
  const skin = faceSpec?.skin || '#cf8f5a';
  const stroke = faceSpec?.stroke || '#452815';
  const { pose } = resolvePoseAndExpression(rawPose);

  if (pose === 'idle') {
    return `<g class="paper-doll-layer3" data-pose="idle">
      <path d="M36 170 L78 206 L72 224 L26 198 Z M164 170 L122 206 L128 224 L174 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="84" cy="212" rx="14" ry="9" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <ellipse cx="116" cy="212" rx="14" ry="9" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'tea') {
    return `<g class="paper-doll-layer3" data-pose="tea">
      <path d="M40 165 L86 142 L94 166 L46 196 Z M160 165 L114 142 L106 166 L154 196 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="86" y="122" width="28" height="34" rx="4" fill="#e6d7b8" stroke="#473320" stroke-width="2"/>
      <path d="M86 130 H114 M86 148 H114" stroke="#3b5e4c" stroke-width="2"/>
      <ellipse cx="85" cy="142" rx="10" ry="7" fill="${skin}" stroke="${stroke}" stroke-width="1.6"/>
      <ellipse cx="115" cy="142" rx="10" ry="7" fill="${skin}" stroke="${stroke}" stroke-width="1.6"/>
    </g>`;
  }
  if (pose === 'thinking') {
    return `<g class="paper-doll-layer3" data-pose="thinking">
      <path d="M44 176 L118 172 L118 194 L42 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M148 182 L114 118 L98 124 L122 190 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M92 108 Q106 102 114 112 L112 126 L96 124 Z" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'ledger') {
    return `<g class="paper-doll-layer3" data-pose="ledger">
      <path d="M38 168 L78 142 L88 164 L46 194 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="64" y="118" width="54" height="40" rx="3" fill="#5e3219" stroke="#2b1508" stroke-width="2"/>
      <rect x="68" y="122" width="46" height="32" fill="#f2e4c4"/>
      <line x1="91" y1="122" x2="91" y2="154" stroke="#8c6d46" stroke-width="1.5"/>
      <ellipse cx="114" cy="138" rx="11" ry="7" fill="${skin}" stroke="${stroke}" stroke-width="1.6"/>
    </g>`;
  }
  if (pose === 'point') {
    return `<g class="paper-doll-layer3" data-pose="point">
      <path d="M36 146 L86 126 L94 156 L42 182 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2.2"/>
      <circle cx="88" cy="134" r="15" fill="${skin}" stroke="${stroke}" stroke-width="2"/>
      <rect x="86" y="122" width="26" height="9" rx="4" fill="${skin}" stroke="${stroke}" stroke-width="2"/>
    </g>`;
  }
  if (pose === 'certificate') {
    const certMarkup = renderReplaceableProp(propSpec || { kind: 'share_cert', label: '1889 · SHARE', sublabel: 'CERTIFICATE' });
    return `<g class="paper-doll-layer3" data-pose="certificate">
      <path d="M158 166 L142 106 L122 114 L134 176 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <g transform="translate(116, 46) rotate(8)">${certMarkup}</g>
      <ellipse cx="136" cy="96" rx="11" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'token') {
    const tokenMarkup = renderReplaceableProp(propSpec || { kind: 'track_hex', color: '#5da667' });
    return `<g class="paper-doll-layer3" data-pose="token">
      <path d="M156 168 L138 112 L118 118 L132 176 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <g transform="translate(120, 64)">${tokenMarkup}</g>
      <ellipse cx="134" cy="106" rx="11" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'wave') {
    return `<g class="paper-doll-layer3" data-pose="wave">
      <path d="M36 170 L78 206 L72 224 L26 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="82" cy="212" rx="13" ry="8.5" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <g class="waving-hand" transform="translate(139, 51) scale(.85 1)">
        <path class="open-palm" d="M13 73 L13 67 C13 61 10 57 7 53
          L0 39 C-1 36 0 34 2 33 C4 32 6 34 7 36 L13 45
          L8 19 C7 15 8 12 10 12 C13 11 14 14 14 17 L17 35
          L16 6 C16 2 17 0 20 0 C23 0 24 2 24 6 L24 33
          L26 8 C26 5 28 3 30 4 C33 4 34 6 33 10 L31 35
          L35 20 C36 17 38 16 40 17 C42 18 42 20 41 23 L36 46
          C34 54 29 58 27 63 L27 73 Z"
          fill="${skin}" stroke="${stroke}" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M14 45 Q19 50 17 59 M18 42 Q24 40 30 43 M24 54 Q29 50 31 46"
          fill="none" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round" opacity=".38"/>
      </g>
      <path d="M158 183 L145 121 L165 116 L181 170 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M147 125 L166 120" fill="none" stroke="${c.dark}" stroke-width="1.2"/>
    </g>`;
  }
  if (pose === 'bow') {
    return `<g class="paper-doll-layer3" data-pose="bow" transform="translate(0, 6)">
      <path d="M34 166 L86 202 L82 222 L26 192 Z M166 166 L114 202 L118 222 L174 192 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="93" cy="208" rx="13" ry="8" transform="rotate(12 93 208)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <ellipse cx="107" cy="208" rx="13" ry="8" transform="rotate(-12 107 208)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'triumphant') {
    return `<g class="paper-doll-layer3" data-pose="triumphant">
      <path d="M38 172 L80 206 L74 222 L28 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="84" cy="212" rx="13" ry="8.5" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M160 172 L132 122 L114 132 L134 184 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="112" y="108" width="22" height="20" rx="7" fill="${skin}" stroke="${stroke}" stroke-width="2"/>
      <path d="M116 115 H130 M116 121 H130" stroke="${stroke}" stroke-width="1.6"/>
    </g>`;
  }
  if (pose === 'offer') {
    const held = propSpec?.empty ? '' : renderReplaceableProp(propSpec || { kind: 'share_cert', label: 'OFFER', sublabel: 'TRANSFER' });
    return `<g class="paper-doll-layer3" data-pose="offer">
      <path d="M38 172 L78 206 L72 222 L28 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="82" cy="212" rx="12" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M162 164 L112 148 L106 170 L152 190 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      ${held ? `<g transform="translate(68, 114) rotate(-6)">${held}</g>` : ''}
      <ellipse cx="108" cy="154" rx="14" ry="8.5" transform="rotate(-10 108 154)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'receive') {
    const held = propSpec?.empty ? '' : renderReplaceableProp(propSpec || { kind: 'share_cert', label: 'RECEIVED', sublabel: 'ACCEPTED' });
    return `<g class="paper-doll-layer3" data-pose="receive">
      <path d="M38 166 L84 148 L92 168 L44 192 Z M162 166 L116 148 L108 168 L156 192 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      ${held ? `<g transform="translate(68, 108)">${held}</g>` : ''}
      <ellipse cx="88" cy="152" rx="12" ry="7.5" transform="rotate(14 88 152)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <ellipse cx="112" cy="152" rx="12" ry="7.5" transform="rotate(-14 112 152)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'place') {
    const held = propSpec?.empty ? '' : renderReplaceableProp(propSpec || { kind: 'track_hex', color: '#5da667' });
    return `<g class="paper-doll-layer3" data-pose="place">
      <path d="M36 172 L76 206 L70 222 L28 198 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <ellipse cx="78" cy="212" rx="12" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M160 156 L114 188 L102 172 L144 138 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      ${held ? `<g transform="translate(84, 180)">${held}</g>` : ''}
      <ellipse cx="108" cy="184" rx="13" ry="8.5" transform="rotate(22 108 184)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'count') {
    const held = renderReplaceableProp(propSpec || { kind: 'cash_envelope', label: '¥', sublabel: 'CASH' });
    return `<g class="paper-doll-layer3" data-pose="count">
      <path d="M38 166 L82 152 L90 172 L44 192 Z M162 166 L118 146 L110 166 L156 190 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <g transform="translate(72, 126) rotate(-6)">${held}</g>
      <ellipse cx="82" cy="158" rx="11" ry="7.5" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <ellipse cx="116" cy="148" rx="12" ry="7.5" transform="rotate(-18 116 148)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  if (pose === 'close_ledger') {
    return `<g class="paper-doll-layer3" data-pose="close_ledger">
      <path d="M36 168 L80 188 L74 208 L28 192 Z M164 168 L120 188 L126 208 L172 192 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
      <rect x="64" y="182" width="72" height="28" rx="3" fill="#4f2914" stroke="#241107" stroke-width="2"/>
      <rect x="68" y="204" width="64" height="4" fill="#f0e2c4"/>
      <rect x="90" y="188" width="20" height="10" fill="#d4a843" stroke="#3b2610" stroke-width="1"/>
      <ellipse cx="84" cy="188" rx="13" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
      <ellipse cx="116" cy="188" rx="13" ry="8" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    </g>`;
  }
  // shock (P8)
  return `<g class="paper-doll-layer3" data-pose="shock">
    <path d="M32 168 L52 108 L68 114 L52 176 Z M168 168 L148 108 L132 114 L148 176 Z" fill="${sleeveFill}" stroke="${c.dark}" stroke-width="2"/>
    <ellipse cx="56" cy="96" rx="9" ry="15" transform="rotate(-15 56 96)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
    <ellipse cx="144" cy="96" rx="9" ry="15" transform="rotate(15 144 96)" fill="${skin}" stroke="${stroke}" stroke-width="1.8"/>
  </g>`;
}
