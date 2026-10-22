import {getLocale} from './i18n.js';
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export function renderActionFeedback({ notice, errorBanner }) {
  const message = errorBanner || notice;
  // Rendered in the overlay rack; notices never consume workspace height.
  return `<div class="action-feedback-slot" data-empty="${message ? 'false' : 'true'}" aria-label="Action feedback">
    ${message ? `<div class="action-feedback ${errorBanner ? 'is-error' : ''}" role="${errorBanner ? 'alert' : 'status'}">
      <span class="feedback-label">${errorBanner ? 'Attention' : 'Latest update'}</span>
      <span class="feedback-message">${escapeHtml(message)}</span>
      <button type="button" data-dismiss-feedback aria-label="Dismiss message">×</button>
    </div>` : ''}
  </div>`;
}

export function formatTime(instant) {
  if (!instant || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(instant)) return 'Time unavailable';
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat(getLocale()==='ja'?'ja-JP':'en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}

export function roundName(state) {
  if (state.round === 'auction') return 'Private Company Auction';
  if (state.round === 'stock') return `Stock Round ${state.stock_round}`;
  if (state.round === 'operating') return `Operating Round ${operatingRoundNumber(state)}`;
  return 'Match complete';
}

export function operatingRoundNumber(state) {
  // or_index identifies the corporation's turn, not the operating round.
  return `${state.stock_round}.${state.or_number}`;
}

export const operatingStepLabel=step=>({track:'Track Lay',token:'Station Placement',routes:'Train Routes',dividend:'Dividend',train:'Train Purchase'})[step] || 'Step';

export function clearTilePreview(state) {
  state.selectedTileId = null;
  state.selectedTileRotation = 0;
}

export function syncFinancialLayout(state, nextRound, makeDefault) {
  const previous = state.lastSyncedRound;
  if (previous === nextRound) return;
  state.financialLayouts ||= {};
  if (['auction', 'stock'].includes(previous)) state.financialLayouts[previous] = structuredClone(state.stockWindows);
  if (!['auction', 'stock'].includes(nextRound)) return;
  state.stockWindows = state.financialLayouts[nextRound] ? structuredClone(state.financialLayouts[nextRound]) : makeDefault();
  if (nextRound === 'auction' && !state.financialLayouts.auction) {
    state.stockWindows.corporations.open = false;
    Object.assign(state.stockWindows.privates, { open: true, maximized: true, z: 6 });
  }
  state.stockWindowTopZ = Math.max(6, ...Object.values(state.stockWindows).map((w) => w.z || 0));
}

export function actionBlockReason(appState, viewData) {
  if (appState.isSubmitting) return 'A move is being submitted. Please wait.';
  if (appState.isPlayingReplay || appState.viewRevision !== appState.liveRevision ||
      viewData?.state?.revision !== appState.liveRevision || appState.isLoadingRevision) {
    return 'Historical game state is read-only. Return to Live before acting.';
  }
  if (!viewData?.viewer?.player_id) return 'Observers can inspect the game; only seated players can submit moves.';
  const actor = viewData.legal_actions?.player || viewData.state.current_player;
  if (viewData.viewer.player_id !== actor) return `Waiting for ${viewData.state.players?.[actor]?.name || 'the active player'}.`;
  return null;
}

export function mapActionAuthority(appState, viewData) {
  const state = viewData.state;
  const viewer = viewData.viewer?.player_id;
  const types = viewData.legal_actions?.types || [];
  const canSubmit = !actionBlockReason(appState, viewData);
  const corporation = state.corporations?.[state.current_corporation];
  const isOperatingPresident = canSubmit && state.round === 'operating' &&
    viewer === corporation?.president && viewer === state.current_player &&
    !state.pending_special && !Object.keys(state.pending_discards || {}).length;
  const canResolveSpecial = canSubmit && state.pending_special?.player === viewer;
  return {
    isOperatingPresident,
    canResolveSpecial,
    canLayTrack: types.includes('lay_tile') && (isOperatingPresident || canResolveSpecial),
    canLayMfPort: canSubmit && types.includes('lay_tile') && Boolean(viewData.legal_actions?.choices?.port_hexes?.length),
  };
}

export function shortcutDescription(step, target) {
  const stages = ['track', 'token', 'routes', 'dividend', 'train'];
  const skipped = stages.slice(stages.indexOf(step), stages.indexOf(target));
  if (!skipped.length) return '';
  return `Advances to ${target}; skips remaining ${skipped.join(' / ')} opportunities.`;
}

// A single Escape dismisses just the most immediate context.
export function escapeContext(state, focusedWindow = null) {
  if (state.activeModal) { state.activeModal = null; return 'modal'; }
  const windows = state.view === 'map' ? state.mapWindows : state.view === 'market' ? state.stockWindows : null;
  const openWindows = Object.keys(windows || {}).filter((id) => windows[id].open);
  const windowId = openWindows.includes(focusedWindow) ? focusedWindow :
    openWindows.sort((a, b) => (windows[b].z || 0) - (windows[a].z || 0))[0];
  if (windowId) {
    windows[windowId].open = false;
    windows[windowId].maximized = false;
    if (state.view === 'map' && windowId === 'hex') clearTilePreview(state);
    return 'window';
  }
  if (state.selectedTileId) { clearTilePreview(state); return 'preview'; }
  if (state.isPlayingReplay) { state.isPlayingReplay = false; return 'replay'; }
  if (state.animation) { state.animation = null; return 'animation'; }
  if (state.view !== 'table') { state.view = 'table'; return 'table'; }
  return null;
}
