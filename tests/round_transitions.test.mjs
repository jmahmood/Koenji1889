import test from 'node:test';
import assert from 'node:assert/strict';
import { roundName } from '../src/ui/presentation.js';
import { planRoundHandoff, renderRoundHandoff, roundKey, roomName } from '../src/ui/transitions.js';

const following = (view = 'market') => ({ view, viewRevision: 20, liveRevision: 20 });
const stock = (extra = {}) => ({ round: 'stock', stock_round: 2, revision: 20, ...extra });
const operating = (extra = {}) => ({ round: 'operating', stock_round: 2, or_number: 1, or_index: 0,
  revision: 21, current_corporation: 'IR', current_player: 'p1',
  players: { p1: { name: 'Daisuke' } }, corporations: { IR: { name: 'Iyo Railway' } }, ...extra });

test('live stock workspace hands off to the map with the new operating context', () => {
  const notice = planRoundHandoff(following(), stock(), operating());
  assert.equal(notice.autoNavigate, true);
  assert.equal(notice.destination, 'map');
  assert.equal(notice.title, 'Operating Round 2.1 begins');
  assert.match(notice.detail, /Iyo Railway.*Daisuke/);
});

test('social table and unrelated inspection rooms announce without being relocated', () => {
  for (const view of ['table', 'map', 'history']) {
    const notice = planRoundHandoff(following(view), stock(), operating());
    assert.equal(notice.autoNavigate, false);
    assert.match(renderRoundHandoff(notice, view), /Operating Round 2.1 begins/);
  }
  assert.match(renderRoundHandoff(planRoundHandoff(following('table'), stock(), operating()), 'table'), /Open Map &amp; Operations/);
});

test('rewind, playback, and pending snapshot loads never start a live handoff', () => {
  for (const change of [{ viewRevision: 10 }, { isPlayingReplay: true }, { isLoadingRevision: true }]) {
    assert.equal(planRoundHandoff({ ...following(), ...change }, stock(), operating()), null);
  }
});

test('open dialogs and explicit Journal inspection suppress automatic navigation', () => {
  for (const change of [{ activeModal: 'stamp' }, { journalReturn: 20 }]) {
    const notice = planRoundHandoff({ ...following(), ...change }, stock(), operating());
    assert.equal(notice.autoNavigate, false);
  }
});

test('auction completion, operating-set completion, and match end have destinations', () => {
  const auction = { round: 'auction', revision: 20 };
  assert.equal(planRoundHandoff(following(), auction, stock({ revision: 21 })).destination, 'market');
  const nextStock = planRoundHandoff(following('map'), operating({ revision: 20 }), stock({ stock_round: 3, revision: 21 }));
  assert.equal(nextStock.destination, 'market'); assert.equal(nextStock.autoNavigate, true);
  const ended = planRoundHandoff(following('map'), operating({ revision: 20 }), { round: 'finished', revision: 21 });
  assert.equal(ended.destination, 'table'); assert.match(ended.title, /complete/);
});

test('operating rounds use set and round numbers, never the corporation turn index', () => {
  const first = operating({ revision: 20 });
  const nextCompany = operating({ revision: 21, or_index: 1, current_corporation: 'AR' });
  assert.equal(roundName(first), roundName(nextCompany));
  assert.equal(roundKey(first), roundKey(nextCompany));
  assert.equal(planRoundHandoff(following('map'), first, nextCompany), null);
  const nextRound = operating({ revision: 21, or_number: 2 });
  assert.equal(planRoundHandoff(following('map'), first, nextRound).title, 'Operating Round 2.2 begins');
});

test('initial connection, duplicate polls, and ordinary moves do not announce rounds', () => {
  assert.equal(planRoundHandoff(following(), null, stock()), null);
  assert.equal(planRoundHandoff(following(), stock(), stock()), null);
  assert.equal(planRoundHandoff(following(), stock(), stock({ revision: 21 })), null);
  assert.equal(planRoundHandoff(following(), stock(), operating({ revision: 19 })), null);
});

test('announcements escape names, offer explicit destinations, and are dismissible', () => {
  const notice = planRoundHandoff(following('table'), stock(), operating({ corporations: { IR: { name: '<Railway>' } } }));
  const html = renderRoundHandoff(notice, 'table');
  assert.match(html, /&lt;Railway&gt;/); assert.doesNotMatch(html, /<Railway>/);
  assert.match(html, /role="status"/); assert.match(html, /data-dismiss-handoff/);
  assert.doesNotMatch(renderRoundHandoff(notice, 'map'), /data-handoff-open/);
  assert.equal(roomName('market', { round: 'auction' }), 'Private Company Auction');
  assert.equal(renderRoundHandoff(null, 'table'), '');
});
