export const MIN_MAP_ZOOM = 0.5;
export const MAX_MAP_ZOOM = 6;

export function mapTransform(state) {
  return `translate(${state.mapPanX || 0}px, ${state.mapPanY || 0}px) scale(${state.mapZoom || 1})`;
}

export function resetMapView(state) {
  Object.assign(state, { mapZoom: 1, mapPanX: 0, mapPanY: 0 });
}

// Anchors are CSS pixels relative to the viewport center. Preserve the world
// point under the cursor (or pinch midpoint), including at the zoom limits.
export function zoomMapAt(state, requestedZoom, x = 0, y = 0) {
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, requestedZoom));
  const ratio = zoom / (state.mapZoom || 1);
  state.mapPanX = x - (x - (state.mapPanX || 0)) * ratio;
  state.mapPanY = y - (y - (state.mapPanY || 0)) * ratio;
  state.mapZoom = zoom;
}

export function bindMapNavigation(root, state) {
  const viewport = root.querySelector('[data-map-viewport]');
  const svg = viewport?.querySelector('svg');
  if (!svg) return () => {};

  const controller = new AbortController();
  const pointers = new Map();
  let origin = null;
  let gesturing = false;
  let suppressClick = false;
  const on = (element, type, handler, options = {}) =>
    element.addEventListener(type, handler, { ...options, signal: controller.signal });
  const paint = () => { svg.style.transform = mapTransform(state); };
  const point = (event) => {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
  };
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  };
  const start = () => {
    origin = { ...pointers.values().next().value, panX: state.mapPanX || 0, panY: state.mapPanY || 0 };
  };
  const capture = () => {
    gesturing = true;
    suppressClick = true;
    viewport.classList.add('is-panning');
    for (const id of pointers.keys()) {
      if (!viewport.hasPointerCapture(id)) viewport.setPointerCapture(id);
    }
  };

  on(viewport, 'wheel', (event) => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const delta = Math.max(-200, Math.min(200, event.deltaY * unit));
    const anchor = point(event);
    zoomMapAt(state, (state.mapZoom || 1) * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)), anchor.x, anchor.y);
    paint();
  }, { passive: false });

  on(viewport, 'pointerdown', (event) => {
    // Leave right-click and macOS Control-click inspection to the existing UI.
    if (event.button !== 0 || (event.pointerType === 'mouse' && event.ctrlKey)) return;
    if (!pointers.size) { suppressClick = false; gesturing = false; }
    pointers.set(event.pointerId, point(event));
    start();
    if (pointers.size > 1) {
      event.preventDefault();
      capture();
    }
  });

  on(viewport.ownerDocument, 'pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    const previous = pointers.size > 1 ? pair() : null;
    const current = point(event);
    pointers.set(event.pointerId, current);
    if (previous) {
      const next = pair();
      zoomMapAt(state, (state.mapZoom || 1) * next.distance / Math.max(1, previous.distance), previous.x, previous.y);
      state.mapPanX += next.x - previous.x;
      state.mapPanY += next.y - previous.y;
    } else {
      const dx = current.x - origin.x;
      const dy = current.y - origin.y;
      if (!gesturing && Math.hypot(dx, dy) < 5) return;
      capture();
      state.mapPanX = origin.panX + dx;
      state.mapPanY = origin.panY + dy;
    }
    event.preventDefault();
    paint();
  });

  const finish = (event) => {
    if (!pointers.delete(event.pointerId)) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (pointers.size) start();
    else {
      origin = null;
      gesturing = false;
      viewport.classList.remove('is-panning');
    }
  };
  on(viewport.ownerDocument, 'pointerup', finish);
  on(viewport.ownerDocument, 'pointercancel', finish);
  on(viewport, 'lostpointercapture', (event) => {
    // Touch starts with implicit capture on the tapped hex. Its bubbling
    // capture-loss event is expected when a drag transfers capture here.
    if (event.target === viewport) finish(event);
  });
  on(viewport, 'click', (event) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, { capture: true });
  on(viewport, 'dragstart', (event) => event.preventDefault());

  root.querySelectorAll('[data-map-zoom]').forEach((button) => {
    on(button, 'click', () => {
      if (button.dataset.mapZoom === 'reset') resetMapView(state);
      else zoomMapAt(state, (state.mapZoom || 1) * (Number(button.dataset.mapZoom) > 0 ? 1.25 : 0.8));
      paint();
    });
  });
  paint();
  return () => {
    controller.abort();
    for (const id of pointers.keys()) {
      if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
    }
    viewport.classList.remove('is-panning');
  };
}
