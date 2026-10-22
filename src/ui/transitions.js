import { escapeHtml, roundName } from './presentation.js';

export function createHandoffExpiry({fade,expire,schedule=(fn,ms)=>globalThis.setTimeout(fn,ms),cancel=id=>globalThis.clearTimeout(id),holdMs=8000,fadeMs=350}) {
  let current=null,holdTimer=null,fadeTimer=null;
  const clear=()=>{cancel(holdTimer);cancel(fadeTimer);holdTimer=fadeTimer=null;current=null;};
  return {clear,start(notice){
    clear();if(!notice)return;current=notice;
    holdTimer=schedule(()=>{
      if(current!==notice)return;
      fade(notice);
      fadeTimer=schedule(()=>{if(current===notice){clear();expire(notice);}},fadeMs);
    },holdMs);
  }};
}

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
  if (!previous || next.revision <= previous.revision) return null;
  // A replay reaching the live endpoint is still an inspection, not live following.
  if (appState.viewRevision !== appState.liveRevision || appState.isPlayingReplay || appState.isLoadingRevision) return null;
  const rounds=phase=>appState.catalog?.phases?.[phase]?.[2] || ({2:1,3:2,4:2,5:3,6:3,D:3})[phase];
  if(previous.phase!=null && next.phase!==previous.phase && rounds(next.phase)>rounds(previous.phase)) {
    const count=rounds(next.phase),current=next.or_total;
    return {kind:'phase',revision:next.revision,from:`Phase ${previous.phase}`,
      title:`Phase ${next.phase} · ${count} Operating Rounds`,
      detail:`Each stock round will now be followed by ${count} operating rounds.${next.round==='operating' && current<count ? ` The current set still has ${current}; the new schedule begins after the next stock round.` : ''}`,
      destination:'map',destinationLabel:'Map & Operations',autoNavigate:false};
  }
  if(roundKey(previous)===roundKey(next))return null;
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
  return `<aside class="round-handoff${notice.fading ? ' is-fading' : ''}" aria-label="${notice.kind==='phase'?'Phase':'Round'} change announcement">
    <div class="round-handoff-copy" role="status" aria-live="polite" aria-atomic="true">
      <small>${escapeHtml(notice.from)} concluded · Rev ${notice.revision}</small>
      <strong>${escapeHtml(notice.title)}</strong>
      <p>${escapeHtml(notice.detail)}</p>
    </div>
    ${view !== notice.destination ? `<button type="button" data-handoff-open="${notice.destination}">Open ${escapeHtml(notice.destinationLabel)} →</button>` : ''}
    <button type="button" class="round-handoff-dismiss" data-dismiss-handoff aria-label="Dismiss round change announcement">×</button>
  </aside>`;
}
