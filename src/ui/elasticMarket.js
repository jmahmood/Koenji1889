// Presentation geometry only. Coordinates and prices always come from the catalog.
export function layoutMarket(market, corporations = {}) {
  const occupied = new Map(), near = new Set();
  for (const [id, corp] of Object.entries(corporations)) {
    const [r, c] = corp.position || [];
    if (!Number.isInteger(r) || !Number.isInteger(c) || !market[r]?.[c]) continue;
    const key = `${r},${c}`;
    if (!occupied.has(key)) occupied.set(key, []);
    occupied.get(key).push(id);
  }
  for (const ids of occupied.values()) ids.sort((a, b) =>
    (corporations[a].market_order || 0) - (corporations[b].market_order || 0) || a.localeCompare(b));
  for (const key of occupied.keys()) {
    const [r, c] = key.split(',').map(Number);
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if (market[r+dr]?.[c+dc]) near.add(`${r+dr},${c+dc}`);
    }
  }
  const sizes = new Map();
  const widths = Array(Math.max(0, ...market.map(row => row.length))).fill(54);
  const heights = market.map(() => 36);
  market.forEach((row, r) => row.forEach((cell, c) => {
    const key = `${r},${c}`, count = occupied.get(key)?.length || 0;
    const w = count ? 156 : cell.par ? 72 : near.has(key) ? 64 : 54;
    const h = count ? 60 + Math.ceil(count / 3) * 30 : near.has(key) ? 44 : 36;
    sizes.set(key, {w, h});
    widths[c] = Math.max(widths[c], w); heights[r] = Math.max(heights[r], h);
  }));
  const offsets = values => { let n = 8; return values.map(v => { const start=n; n+=v+8; return start; }); };
  const xs = offsets(widths), ys = offsets(heights), cells = new Map(), tokens = new Map();
  market.forEach((row, r) => row.forEach((cell, c) => {
    const key = `${r},${c}`, size = sizes.get(key);
    const p = {...size, x:xs[c]+(widths[c]-size.w)/2, y:ys[r]+(heights[r]-size.h)/2};
    cells.set(key, {...p, occupied:occupied.has(key), near:near.has(key)});
    (occupied.get(key) || []).forEach((id, i) => tokens.set(id, {
      x:p.x+10+(i%3)*46, y:p.y+49+Math.floor(i/3)*30, w:42, h:24,
    }));
  }));
  return {cells, tokens, width:widths.reduce((n,v)=>n+v+8,8), height:heights.reduce((n,v)=>n+v+8,8)};
}

const selector = '[data-market-position], [data-market-corporation], [data-market-link]';
const elementKey = el => el.hasAttribute('data-market-link') ? `link:${el.dataset.marketLink}` : el.hasAttribute('data-market-position')
  ? `cell:${el.dataset.marketPosition}` : `corp:${el.dataset.marketCorporation}`;
const bounds = (el, base) => {
  const r=el.getBoundingClientRect();
  return {x:r.left-base.left,y:r.top-base.top,w:r.width,h:r.height};
};

// Capture the currently visible geometry, including any interrupted animation.
export function captureMarket(root, identity) {
  const board=root.querySelector('[data-elastic-market]');
  if (!board) return null;
  const base=board.getBoundingClientRect(), scroll=board.closest('.market-grid-scroll');
  return {identity:board.dataset.marketRoom ?? identity, signature:board.dataset.elasticMarket, deadline:Number(board.dataset.motionDeadline)||0,
    left:scroll.scrollLeft, top:scroll.scrollTop,
    boxes:new Map([...board.querySelectorAll(selector)].map(el=>[elementKey(el),bounds(el,base)]))};
}

export function animateMarket(root, previous, {identity, motion=true}={}) {
  const board=root.querySelector('[data-elastic-market]');
  if (!board) return;
  board.dataset.marketRoom=identity ?? '';
  if (!previous || previous.identity!==identity) return;
  const scroll=board.closest('.market-grid-scroll');
  scroll.scrollLeft=previous.left; scroll.scrollTop=previous.top;
  if (!motion || document.hidden) return;
  const now=performance.now();
  const changed=previous.signature!==board.dataset.elasticMarket;
  const duration=changed ? 620 : Math.max(0,previous.deadline-now);
  if (!duration) return;
  board.dataset.motionDeadline=String(now+duration);
  const base=board.getBoundingClientRect();
  for (const el of board.querySelectorAll(selector)) {
    const from=previous.boxes.get(elementKey(el)), to=bounds(el,base);
    if (!from || !el.animate) continue;
    el.animate([
      {transform:`translate(${from.x-to.x}px,${from.y-to.y}px)`,width:`${from.w}px`,height:`${from.h}px`},
      {transform:'translate(0,0)',width:`${to.w}px`,height:`${to.h}px`},
    ], {duration,easing:changed?'cubic-bezier(.22,.78,.22,1)':'ease-out'});
  }
}
