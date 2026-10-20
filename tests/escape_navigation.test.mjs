import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { escapeContext } from '../src/ui/presentation.js';

// Exercise the installed keyboard handler with focus lost during a render.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('function handleGlobalEscape('), source.indexOf('\nfunction recoverWindowGeometry('));

test('separate Escape presses close the window then return to the table despite ambient effects', () => {
  const appState = {
    view: 'map', mapWindows: { hex: { open: true, z: 5 } },
    selectedTileId: '57', selectedTileRotation: 2,
  };
  let renders = 0;
  const context = {
    appState, escapeContext, roomTransition: { active: false },
    document: { activeElement: null, querySelector: () => ({}) },
    characters: { playback: { notice: () => ({ label: 'Track laid' }), clear() {} } },
    render() { renders++; },
  };
  const escape = runInNewContext(`${handler}\nhandleGlobalEscape`, context);
  const press = (repeat = false) => {
    const event = { key: 'Escape', repeat, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    escape(event);
    assert.equal(event.prevented, true);
    assert.equal(event.stopped, true);
  };

  press();
  assert.equal(appState.mapWindows.hex.open, false);
  assert.equal(appState.selectedTileId, null);
  assert.equal(appState.view, 'map');
  assert.equal(renders, 1);

  press(true);
  assert.equal(appState.view, 'map');
  assert.equal(renders, 1);

  press();
  assert.equal(appState.view, 'table');
  assert.equal(renders, 2);
});
