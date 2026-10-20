import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomTransition } from '../src/ui/transitions.js';

function fixture() {
  let now = 0, nextId = 0;
  const timers = new Map(), events = [];
  const transition = createRoomTransition({
    show: title => events.push(['show', title, now]),
    hide: () => events.push(['hide', now]),
    schedule(callback, delay) { const id = ++nextId; timers.set(id, { callback, at: now + delay }); return id; },
    cancel: id => timers.delete(id),
  });
  const advance = target => {
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].callback();
    }
    now = target;
  };
  return { transition, events, advance, render: () => events.push(['render', now]) };
}

test('location wipe starts immediately and destination renders while covered before reveal', () => {
  const f = fixture();
  f.transition.start('Map & Operations', false, f.render);
  assert.deepEqual(f.events.at(-1), ['show', 'Map & Operations', 0]);
  assert.equal(f.transition.pending, true);
  f.advance(224);
  assert.equal(f.events.some(([event]) => event === 'render'), false);
  f.advance(225);
  assert.deepEqual(f.events.at(-1), ['render', 225]);
  assert.equal(f.transition.pending, false);
  assert.equal(f.transition.active, true);
  f.advance(450);
  assert.deepEqual(f.events.at(-1), ['hide', 450]);
  assert.equal(f.transition.active, false);
});

test('round-change interstitial also brackets the render', () => {
  const f = fixture();
  f.transition.start('Operating Round begins', true, f.render);
  f.advance(374);
  assert.equal(f.transition.pending, true);
  f.advance(375);
  assert.deepEqual(f.events.at(-1), ['render', 375]);
  f.advance(750);
  assert.deepEqual(f.events.at(-1), ['hide', 750]);
});

test('skipping a card or disabling motion renders the pending destination once before removing cover', () => {
  const f = fixture();
  f.transition.start('Club Table', false, f.render);
  f.transition.finish();
  assert.deepEqual(f.events.slice(-2), [['render', 0], ['hide', 0]]);
  f.advance(1000);
  assert.equal(f.events.filter(([event]) => event === 'render').length, 1);
  assert.equal(f.transition.active, false);
  assert.equal(f.transition.pending, false);
});

test('finishing after the scene cut does not render the destination twice', () => {
  const f = fixture();
  f.transition.start('Stock Exchange', false, f.render);
  f.advance(225);
  f.transition.finish();
  f.advance(1000);
  assert.equal(f.events.filter(([event]) => event === 'render').length, 1);
});
