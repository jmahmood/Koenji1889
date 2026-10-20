import { escapeHtml, roundName } from './presentation.js';

export function createRoomTransition({ show, hide, schedule = setTimeout, cancel = clearTimeout }) {
  let commitTimer = null, endTimer = null, pendingCommit = null, active = false;
  const commit = () => {
    const next = pendingCommit;
    pendingCommit = null;
    next?.();
  };
  const finish = () => {
    cancel(commitTimer); cancel(endTimer);
    commitTimer = endTimer = null;
    active = false;
    // Reveal only after the destination has rendered, including when skipped.
    commit();
    hide();
  };
  return {
    get active() { return active; },
    get pending() { return Boolean(pendingCommit); },
    finish,
    start(title, isRoundChange, next) {
      finish();
      active = true;
      pendingCommit = next;
      const duration = isRoundChange ? 750 : 450;
      show(title, isRoundChange, duration);
      commitTimer = schedule(commit, duration / 2);
      endTimer = schedule(finish, duration);
    },
  };
}

export function roundKey(state) {
  if (!state) return null;
  if (state.round === 'operating') return `operating:${state.stock_round}:${state.or_number}`;
  if (state.round === 'stock') return `stock:${state.stock_round}`;
  return state.round;
}

export function roundDestination(state) {
  if (state.round === 'auction' || state.round === 'stock') return 'market';
  return state.round === 'operating' ? 'map' : 'table';
}

export function roomName(view, state) {
  if (view === 'market') return state.round === 'auction' ? 'Private Company Auction' : 'Stock Exchange';
  return { table: 'Club Table', map: 'Map & Operations', history: 'Journal' }[view] || 'Club Table';
}

export function planRoundHandoff(appState, previous, next) {
  if (!previous || next.revision <= previous.revision || roundKey(previous) === roundKey(next)) return null;
  // A replay reaching the live endpoint is still an inspection, not live following.
  if (appState.viewRevision !== appState.liveRevision || appState.isPlayingReplay || appState.isLoadingRevision) return null;
  const destination = roundDestination(next);
  const source = roundDestination(previous);
  const autoNavigate = appState.view === source && source !== 'table' &&
    !appState.activeModal && appState.journalReturn == null;
  const corporation = next.corporations?.[next.current_corporation];
  const actor = next.players?.[next.current_player]?.name;
  let detail = 'The gathering continues at the exchange. Compare holdings before trading.';
  if (next.round === 'operating') {
    detail = corporation
      ? `${corporation.name || next.current_corporation} is now operating${actor ? `, led by ${actor}` : ''}. Track, stations, and routes are on the map.`
      : 'Railway operations begin on the map: track, stations, and routes.';
  } else if (next.round === 'finished') {
    detail = 'The match is complete. Return to the table to review the final position and Journal.';
  }
  return {
    revision: next.revision,
    from: roundName(previous),
    title: next.round === 'finished' ? 'The match is complete' : `${roundName(next)} begins`,
    detail, destination, destinationLabel: roomName(destination, next), autoNavigate,
  };
}

export function renderRoundHandoff(notice, view) {
  if (!notice) return '';
  return `<aside class="round-handoff" aria-label="Round change announcement">
    <div class="round-handoff-copy" role="status" aria-live="polite" aria-atomic="true">
      <small>${escapeHtml(notice.from)} concluded · Rev ${notice.revision}</small>
      <strong>${escapeHtml(notice.title)}</strong>
      <p>${escapeHtml(notice.detail)}</p>
    </div>
    ${view !== notice.destination ? `<button type="button" data-handoff-open="${notice.destination}">Open ${escapeHtml(notice.destinationLabel)} →</button>` : ''}
    <button type="button" class="round-handoff-dismiss" data-dismiss-handoff aria-label="Dismiss round change announcement">×</button>
  </aside>`;
}
