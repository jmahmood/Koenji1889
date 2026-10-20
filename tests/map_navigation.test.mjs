import test from 'node:test';
import assert from 'node:assert/strict';
import { bindMapNavigation, mapTransform, resetMapView, zoomMapAt } from '../src/ui/mapNavigation.js';

// Small DOM fixture that supports capture, cancellation and listener disposal.
class Element {
  listeners = [];
  captured = new Set();
  style = {};
  classes = new Set();
  classList = { add: (name) => this.classes.add(name), remove: (name) => this.classes.delete(name) };
  clientHeight = 600;
  addEventListener(type, handler, options) { this.listeners.push({ type, handler, options }); }
  getBoundingClientRect() { return { left: 20, top: 40, width: 800, height: 600 }; }
  hasPointerCapture(id) { return this.captured.has(id); }
  setPointerCapture(id) { this.captured.add(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  fire(type, properties = {}) {
    const event = { button: 0, pointerId: 1, pointerType: 'mouse', clientX: 420, clientY: 340,
      detail: 1, deltaMode: 0, deltaY: 0, defaultPrevented: false, stopped: false,
      preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...properties };
    for (const listener of this.listeners.filter(item => item.type === type)) {
      if (!listener.options.signal.aborted) listener.handler(event);
      if (event.stopped) break;
    }
    return event;
  }
}

function fixture(state = {}) {
  const doc = new Element(), viewport = new Element(), svg = new Element();
  viewport.ownerDocument = doc;
  viewport.querySelector = () => svg;
  const buttons = ['0.18', '-0.18', 'reset'].map(mapZoom => Object.assign(new Element(), { dataset: { mapZoom } }));
  const root = { querySelector: () => viewport, querySelectorAll: () => buttons };
  const dispose = bindMapNavigation(root, state);
  return { state, doc, viewport, svg, buttons, dispose };
}

test('zoom keeps the same world point under an off-center cursor after panning and at limits', () => {
  const state = { mapZoom: 2, mapPanX: 45, mapPanY: -70 };
  const world = () => [(170 - state.mapPanX) / state.mapZoom, (-120 - state.mapPanY) / state.mapZoom];
  const before = world();
  for (const zoom of [3.5, 20, 0.01]) {
    zoomMapAt(state, zoom, 170, -120);
    assert.deepEqual(world(), before);
  }
  assert.equal(state.mapZoom, 0.5);
  resetMapView(state);
  assert.equal(mapTransform(state), 'translate(0px, 0px) scale(1)');
});

test('wheel and trackpad pinch zoom without scrolling the page; controls preserve pan and reset', () => {
  const f = fixture();
  assert.equal(f.viewport.fire('wheel', { deltaY: -60, clientX: 600 }).defaultPrevented, true);
  assert.ok(f.state.mapZoom > 1);
  assert.ok(f.state.mapPanX < 0);
  const zoom = f.state.mapZoom;
  f.viewport.fire('wheel', { deltaY: -10, ctrlKey: true });
  assert.ok(f.state.mapZoom > zoom);
  f.buttons[0].fire('click');
  f.buttons[1].fire('click');
  assert.equal(f.svg.style.transform, mapTransform(f.state));
  f.buttons[2].fire('click');
  assert.deepEqual(f.state, { mapZoom: 1, mapPanX: 0, mapPanY: 0 });
});

test('normal clicks, keyboard activation and right-click inspection are not intercepted', () => {
  const f = fixture();
  f.viewport.fire('pointerdown');
  f.doc.fire('pointermove', { clientX: 422 });
  f.doc.fire('pointerup');
  assert.equal(f.viewport.fire('click').stopped, false);
  f.viewport.fire('pointerdown', { button: 2 });
  f.doc.fire('pointermove', { clientX: 600 });
  assert.equal(f.viewport.fire('contextmenu').defaultPrevented, false);
  assert.equal(f.viewport.fire('click', { detail: 0 }).stopped, false);
  assert.deepEqual(f.state, {});
});

test('dragging over hexes pans at any zoom without firing a hex click, including outside the map', () => {
  const f = fixture({ mapZoom: 3 });
  f.viewport.fire('pointerdown');
  f.doc.fire('pointermove', { clientX: 510, clientY: 310 });
  assert.equal(f.viewport.hasPointerCapture(1), true);
  assert.equal(f.state.mapPanX, 90);
  assert.equal(f.state.mapPanY, -30);
  f.doc.fire('pointerup', { clientX: 1000 });
  assert.equal(f.viewport.classes.has('is-panning'), false);
  assert.equal(f.viewport.fire('click').stopped, true);
  f.viewport.fire('pointerdown');
  f.doc.fire('pointerup');
  assert.equal(f.viewport.fire('click').stopped, false);
});

test('two-finger pinch follows its moving midpoint and transitions back to one-finger pan', () => {
  const f = fixture();
  f.viewport.fire('pointerdown', { pointerType: 'touch', clientX: 370 });
  f.viewport.fire('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 470 });
  f.viewport.fire('lostpointercapture', { pointerType: 'touch', target: {} });
  f.doc.fire('pointermove', { pointerType: 'touch', pointerId: 2, clientX: 570 });
  assert.equal(f.state.mapZoom, 2);
  assert.equal(f.state.mapPanX, 50);
  f.doc.fire('pointerup', { pointerType: 'touch', pointerId: 2 });
  f.doc.fire('pointermove', { pointerType: 'touch', clientX: 390 });
  assert.equal(f.state.mapPanX, 70);
  f.doc.fire('pointerup', { pointerType: 'touch' });
  assert.equal(f.viewport.fire('click').stopped, true);
});

test('cancelled gestures and rerenders release capture and dispose old listeners while retaining the view', () => {
  const f = fixture();
  f.viewport.fire('pointerdown');
  f.doc.fire('pointermove', { clientX: 460 });
  f.doc.fire('pointercancel');
  assert.equal(f.viewport.captured.size, 0);
  f.dispose();
  f.viewport.fire('wheel', { deltaY: -100 });
  assert.equal(f.state.mapPanX, 40);
  assert.equal(f.state.mapZoom, undefined);
  const next = fixture(f.state);
  assert.equal(next.svg.style.transform, 'translate(40px, 0px) scale(1)');
  next.viewport.fire('pointerdown');
  next.doc.fire('pointermove', { clientX: 470 });
  next.dispose();
  assert.equal(next.viewport.captured.size, 0);
  assert.equal(next.viewport.classes.has('is-panning'), false);
});
