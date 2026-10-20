/**
 * Authentic Shikoku 1889 metadata: hex city names, corporation colors,
 * Meiji club member personas, and flat-top hex geometry helpers.
 */

export const CORP_META = {
  AR: {
    id: 'AR',
    short: 'AR',
    name: 'Awa Railroad',
    jp: '阿波鉄道',
    home: 'K8',
    homeName: 'Tokushima',
    color: '#c85a32',
    accent: '#f4b183',
    text: '#fff5eb',
  },
  IR: {
    id: 'IR',
    short: 'IR',
    name: 'Iyo Railway',
    jp: '伊予鉄道',
    home: 'E2',
    homeName: 'Matsuyama',
    color: '#d4822a',
    accent: '#f7cb8b',
    text: '#1f1209',
  },
  SR: {
    id: 'SR',
    short: 'SR',
    name: 'Sanuki Railway',
    jp: '讃岐鉄道',
    home: 'I2',
    homeName: 'Marugame',
    color: '#468966',
    accent: '#9fd8b6',
    text: '#f2fff7',
  },
  KO: {
    id: 'KO',
    short: 'KO',
    name: 'Takamatsu & Kotohira Electric',
    jp: '高松琴平電気鉄道',
    home: 'K4',
    homeName: 'Takamatsu',
    color: '#c9a236',
    accent: '#f5df91',
    text: '#1d1507',
  },
  TR: {
    id: 'TR',
    short: 'TR',
    name: 'Tosa Electric Railway',
    jp: '土佐電気鉄道',
    home: 'F9',
    homeName: 'Kochi',
    color: '#3c7899',
    accent: '#9ad0ec',
    text: '#f0faff',
  },
  KU: {
    id: 'KU',
    short: 'KU',
    name: 'Tosa Kuroshio Railway',
    jp: '土佐くろしお鉄道',
    home: 'C10',
    homeName: 'Sukumo',
    color: '#2e5d7d',
    accent: '#88b8d6',
    text: '#f0f8ff',
  },
  UR: {
    id: 'UR',
    short: 'UR',
    name: 'Uwajima Railway',
    jp: '宇和島鉄道',
    home: 'B7',
    homeName: 'Uwajima',
    color: '#884c70',
    accent: '#dfa6c8',
    text: '#fff2fa',
  },
};

export const PRIVATE_META = {
  TR: {
    id: 'TR',
    name: 'Takamatsu E-Railroad',
    jp: '高松電気軌道',
    face: 20,
    revenue: 5,
    blocks: 'K4',
    benefitTag: 'Blocks K4 · Buyout ¥10–¥40',
    power: 'Pays ¥5/OR. Blocks K4 (Takamatsu) while player-owned; may be sold to a corporation in Phase 3+ for ¥10–¥40.',
    powerJp: '毎OR ¥5収入 · 高松(K4)を他社からブロック',
    color: '#9e2a22',
    border: '#87211a',
    accent: '#c95548',
  },
  MF: {
    id: 'MF',
    name: 'Mitsubishi Ferry',
    jp: '三菱連絡船',
    face: 30,
    revenue: 5,
    blocks: 'B11, G10, I12, J9',
    benefitTag: 'Port Tile #437 (¥30 Town)',
    power: 'Pays ¥5/OR. Owning player may lay permanent ¥30 port tile #437 on coastal towns B11, G10, I12, or J9.',
    powerJp: '毎OR ¥5収入 · 指定の港に¥30の恒久港(#437)を敷設',
    color: '#1e4d6b',
    border: '#173e57',
    accent: '#3b7ca3',
  },
  ER: {
    id: 'ER',
    name: 'Ehime Railway',
    jp: '愛媛鉄道',
    face: 40,
    revenue: 10,
    blocks: 'C4',
    benefitTag: 'Blocks C4 · Free Green Tile',
    power: 'Pays ¥10/OR. Blocks C4 while player-owned; when sold to a corporation, seller may lay a free green tile on C4.',
    powerJp: '毎OR ¥10収入 · C4をブロック（売却時に緑タイル敷設）',
    color: '#215739',
    border: '#19452c',
    accent: '#3e855c',
  },
  SMR: {
    id: 'SMR',
    name: 'Sumitomo Mines Railway',
    jp: '鉱山鉄道 · 住友別子',
    face: 50,
    revenue: 15,
    blocks: 'None',
    benefitTag: 'Ignores ¥80 Mountain Cost',
    power: 'Pays ¥15/OR. Owning corporation ignores pure mountain terrain costs (saves ¥80 per mountain hex).',
    powerJp: '毎OR ¥15収入 · 山岳地形の建設費（¥80）を無視',
    color: '#4a3267',
    border: '#3a2552',
    accent: '#735499',
  },
  DR: {
    id: 'DR',
    name: 'Dougo Railway',
    jp: '道後鉄道',
    face: 60,
    revenue: 15,
    blocks: 'None',
    benefitTag: 'Exchange → 10% IR Share',
    power: 'Pays ¥15/OR. Owning player may close DR to exchange for a 10% IPO share of Iyo Railway (IR).',
    powerJp: '毎OR ¥15収入 · 閉鎖して伊予鉄(IR)の10% IPO株と交換可能',
    color: '#7c431e',
    border: '#633415',
    accent: '#b06735',
  },
  SIR: {
    id: 'SIR',
    name: 'South Iyo Railway',
    jp: '南予鉄道',
    face: 80,
    revenue: 20,
    blocks: 'None',
    benefitTag: 'High Yield · Buyout ¥40–¥160',
    power: 'Pays ¥20/OR. High-yield Meiji feeder line; may be sold to a corporation in Phase 3+ for up to ¥160.',
    powerJp: '毎OR ¥20収入 · 伊予南部の高収益支線（最大¥160で会社売却可）',
    color: '#1f5c63',
    border: '#17464c',
    accent: '#3b8992',
  },
  UTF: {
    id: 'UTF',
    name: 'Uno-Takamatsu Ferry',
    jp: '宇高連絡船',
    face: 150,
    revenue: 30,
    blocks: 'None',
    benefitTag: 'Phase 5+: Stays Open @ ¥50/OR',
    power: 'Pays ¥30/OR. If still player-owned at Phase 5, stays open permanently and increases revenue to ¥50/OR!',
    powerJp: '毎OR ¥30収入 · フェーズ5でも存続し収入¥50/ORに増加',
    color: '#434575',
    border: '#34365e',
    accent: '#686b9e',
  },
};

export const HEX_NAMES = {
  F1: 'Imabari / Onomichi Ferry',
  J1: 'Sakaide / Okayama Ferry',
  L7: 'Naruto / Osaka Ferry',
  E2: 'Matsuyama',
  I2: 'Marugame',
  B3: 'Yawatahama',
  F3: 'Saijo',
  C4: 'Ozu',
  G4: 'Niihama',
  I4: 'Kotohira',
  K4: 'Takamatsu',
  J5: 'Ritsurin',
  B7: 'Uwajima',
  H7: 'Ikeda',
  K8: 'Tokushima',
  F9: 'Kochi',
  J9: 'Komatsushima',
  A10: 'Sukumo West',
  C10: 'Nakamura',
  G10: 'Susaki',
  B11: 'Shimizu',
  J11: 'Anan',
  G12: 'Nankoku',
  I12: 'Mugi',
  G14: 'Muroto',
};

export const CLUB_MEMBERS = [
  {
    seatId: 'p1',
    defaultName: 'Daisuke',
    jpTitle: '大輔 · 鉄道投資家',
    roleTag: 'Chair & Archivist',
    coatColor: '#3f2e24',
    vestColor: '#8d5b34',
    accent: '#e0ad53',
    avatarTone: 0,
    quoteIdle: '“Check the Kotohira mountain passes before committing par.”',
    quoteAct: '“Let us examine the ledger carefully.”',
  },
  {
    seatId: 'p2',
    defaultName: 'Haruka',
    jpTitle: '遥 · 海運株主',
    roleTag: 'Seto Inland Strategist',
    coatColor: '#283d34',
    vestColor: '#567c68',
    accent: '#7ec49b',
    avatarTone: 1,
    quoteIdle: '“Takamatsu harbour will anchor the eastern line.”',
    quoteAct: '“I have my eye on that certificate.”',
  },
  {
    seatId: 'p3',
    defaultName: 'Kenji',
    jpTitle: '健二 · 鉱山技師',
    roleTag: 'Besshi Route Planner',
    coatColor: '#263849',
    vestColor: '#4c6d8c',
    accent: '#7db5de',
    avatarTone: 2,
    quoteIdle: '“Two 2-trains on the coast beat an empty mountain line.”',
    quoteAct: '“Watch the train limit as Phase 4 approaches.”',
  },
  {
    seatId: 'p4',
    defaultName: 'Alex',
    jpTitle: 'アレックス · 顧問',
    roleTag: 'Koenji Regular',
    coatColor: '#412a3b',
    vestColor: '#784e6d',
    accent: '#c98bb9',
    avatarTone: 3,
    quoteIdle: '“The Uno-Takamatsu Ferry always pays for tonight’s tea.”',
    quoteAct: '“A bold valuation on the exchange!”',
  },
  {
    seatId: 'p5',
    defaultName: 'Sora',
    jpTitle: '空 · 監査役',
    roleTag: 'Visiting Investor',
    coatColor: '#3d3522',
    vestColor: '#7a693d',
    accent: '#d9c27e',
    avatarTone: 0,
    quoteIdle: '“Never underestimate Uwajima in the late game.”',
    quoteAct: '“Counting certificates before the bell.”',
  },
  {
    seatId: 'p6',
    defaultName: 'Mina',
    jpTitle: '美奈 · 会計補佐',
    roleTag: 'Treasury Clerk',
    coatColor: '#472926',
    vestColor: '#874942',
    accent: '#e3968d',
    avatarTone: 1,
    quoteIdle: '“The bank still holds plenty of yen—for now.”',
    quoteAct: '“Recording the transaction in the club journal.”',
  },
];

export const TILE_FILL = {
  white: '#dfd5a7',
  yellow: '#e6c84f',
  green: '#62ac6c',
  brown: '#a96e44',
  gray: '#8d9499',
  red: '#b5463a',
};

export const TRAIN_ROUTE_COLORS = [
  '#e0533c',
  '#3b7dd8',
  '#2ca568',
  '#d49b27',
  '#9b59b6',
  '#16a085',
];

/**
 * Compute pixel center (cx, cy) for a flat-top 1889 hex coordinate (e.g. "E2").
 * Letter A..L is the horizontal column; Number 1..14 is the vertical staggered row.
 */
export function hexCenter(coord, radius = 34, originX = 62, originY = 36) {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10);
  const dx = 1.5 * radius;
  const dy = (Math.sqrt(3) / 2) * radius;
  return {
    cx: originX + col * dx,
    cy: originY + row * dy,
    col,
    row,
  };
}

/**
 * SVG polygon points for a flat-topped hexagon centered at (cx, cy).
 */
export function flatHexPolygon(cx, cy, radius = 34) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/**
 * Midpoint of edge 0..5 on a flat-topped hex in 1889's coordinate convention:
 * Edge 0: South (0, +2)
 * Edge 1: South-West (-1, +1)
 * Edge 2: North-West (-1, -1)
 * Edge 3: North (0, -2)
 * Edge 4: North-East (+1, -1)
 * Edge 5: South-East (+1, +1)
 */
export function hexEdgePoint(cx, cy, edgeIndex, radius = 34) {
  const anglesDeg = [90, 150, 210, 270, 330, 30];
  const deg = anglesDeg[((edgeIndex % 6) + 6) % 6];
  const rad = (deg * Math.PI) / 180;
  const dist = (Math.sqrt(3) / 2) * radius;
  return {
    x: cx + dist * Math.cos(rad),
    y: cy + dist * Math.sin(rad),
  };
}
