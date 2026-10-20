/**
 * Timeline Rewind Scrubber & Action Journal (`src/replay/TimelineBar.js`).
 *
 * Separates `liveRevision` from `viewRevision`. Scrubbing inspects real
 * historical snapshots from the backend without mutating live server state.
 */

import { escapeHtml, formatTime } from '../ui/presentation.js';
import { renderUnifiedPlayerAndTurnStrip } from '../components/StockExchange.js';

function eventRoundKind(ev) {
  const label = String(ev?.label || '').toLowerCase();
  const detail = String(ev?.detail || '').toLowerCase();
  if (label.includes('auction') || label.includes('private') || detail.includes('auction')) return 'auction';
  if (label.includes('tile') || label.includes('token') || label.includes('route') || label.includes('dividend') || label.includes('train') || detail.includes('operating')) return 'operating';
  return 'stock';
}

export function renderTimelineFooter(appState, viewData) {
  const liveRev = appState.liveRevision || 0;
  const viewRev = appState.viewRevision || 0;
  const isHistorical = viewRev !== liveRev;
  const pct = liveRev > 0 ? Math.min(100, (viewRev / liveRev) * 100) : 0;
  const events = viewData.history_events || [];
  const currentEv =
    events.find((e) => e.revision === viewRev);
  const firstEv = events[0];
  const latestEv = events[events.length - 1];
  const behindCount = Math.max(0, liveRev - viewRev);

  return `
    <footer class="timeline ${isHistorical ? 'is-historical-scrubber' : 'is-live-scrubber'}" aria-label="Historical replay timeline">
      <div class="playback">
        <button data-revision="0" aria-label="First revision (Rev 0)" title="Jump to Revision 0" ${viewRev === 0 ? 'disabled' : ''}>|‹</button>
        <button data-revision="${Math.max(0, viewRev - 1)}" aria-label="Previous revision" title="Step backward" ${viewRev === 0 ? 'disabled' : ''}>‹</button>
        <button data-action="toggle_play" aria-label="${appState.isPlayingReplay ? 'Pause replay' : 'Play replay from current position'}" title="Play / Pause replay">
          ${appState.isPlayingReplay ? '⏸' : '▶'}
        </button>
        <button data-revision="${Math.min(liveRev, viewRev + 1)}" aria-label="Next revision" title="Step forward" ${viewRev >= liveRev ? 'disabled' : ''}>›</button>
        <button data-action="cycle_speed" class="speed-btn" title="Replay playback speed">
          ${appState.replaySpeedLabel || '1×'}
        </button>
      </div>

      <div class="timeline-main">
        <div class="timeline-slider-row">
          <input
            type="range"
            min="0"
            max="${liveRev}"
            value="${viewRev}"
            class="timeline-range"
            aria-label="Scrub revision history"
            data-scrub-range="true"
          />
          <div class="timeline-line">
            <i style="width:${pct}%"></i>
            ${events
              .map((r) => {
                const leftPct = liveRev > 0 ? (r.revision / liveRev) * 100 : 0;
                const isSel = r.revision === viewRev;
                const kind = eventRoundKind(r);
                return `<button
                  data-revision="${r.revision}"
                  style="left:${leftPct}%"
                  class="timeline-node kind-${kind} ${isSel ? 'selected' : ''} ${isSel && isHistorical ? 'is-pinned-snapshot' : ''}"
                  title="Rev ${r.revision}: ${escapeHtml(r.label)}"
                  aria-label="View revision ${r.revision}"
                >${isSel && isHistorical ? `<span class="snapshot-pin-tag" aria-hidden="true">📌 Rev ${r.revision}</span>` : ''}</button>`;
              })
              .join('')}
          </div>
        </div>
        <div class="timeline-labels">
          <span>${formatTime(firstEv?.occurred_at)} · <b>Rev 0</b></span>
          <span class="timeline-active-caption ${isHistorical ? 'is-snapshot-caption' : ''}">
            ${isHistorical ? '<em class="snapshot-chip">📌 SNAPSHOT</em> ' : ''}<b>Rev ${viewRev}:</b> ${escapeHtml(currentEv?.label || 'Loading snapshot…')}
          </span>
          <span>${formatTime(latestEv?.occurred_at)} · <b>Latest Rev ${liveRev}</b></span>
        </div>
      </div>

      <div class="revision-state ${isHistorical ? 'is-hist' : 'is-live'}">
        <span>${isHistorical ? '🔒 HISTORY (READ-ONLY)' : '● LIVE TABLE'}</span>
        <b>Revision ${viewRev} / ${liveRev}</b>
      </div>

      <button class="live-button ${isHistorical ? 'is-pulsing-live' : ''}" data-action="live" ${!isHistorical ? 'disabled' : ''}>
        ${isHistorical ? `● Return to Live (Rev ${liveRev}${appState.queuedLiveCount ? ` · +${appState.queuedLiveCount} new` : behindCount ? ` · +${behindCount} ahead` : ''}) →` : '● Live Match Active'}
      </button>
    </footer>
  `;
}

export function renderHistoryJournalView(appState, viewData) {
  const events = (viewData.history_events || []).slice().reverse();
  const viewRev = appState.viewRevision;
  const liveRev = appState.liveRevision;
  const isHistorical = viewRev !== liveRev;
  const state = viewData.state;
  const certCounts = viewData.certificates || {};
  const certLimit =
    appState.catalog?.certificate_limits?.[state?.player_order?.length] || 14;
  const isViewerActiveTurn =
    viewRev === liveRev &&
    !appState.isPlayingReplay &&
    Boolean(viewData.viewer?.player_id && state?.current_player === viewData.viewer.player_id);

  return `
    <section class="detail-view history-view ${isHistorical ? 'is-historical-snapshot-view' : ''}">
      <div class="detail-heading market-top-deck">
        <div>
          <div class="section-label">ACTION JOURNAL · 棋譜 · REV ${state?.revision ?? viewRev}</div>
          <h2>The Evening So Far (${events.length} Recorded Snapshots)</h2>
        </div>
        <div class="heading-actions">
          <button class="secondary-btn" data-action="live" ${viewRev === liveRev ? 'disabled' : ''}>
            Return to Live (Rev ${liveRev})
          </button>
          <button class="secondary-btn" data-view="${state?.round === 'operating' ? 'map' : 'market'}">
            ${state?.round === 'operating' ? 'Map & Operations 🗺️' : state?.round === 'auction' ? 'Private Auction ⇄' : 'Stock Exchange ⇄'}
          </button>
          <button class="back-table-btn" data-view="table" title="Return directly to the Tabletop">Back to Table · テーブルへ戻る</button>
        </div>
      </div>

      ${state?.player_order?.length ? renderUnifiedPlayerAndTurnStrip(appState, viewData, certCounts, certLimit, isViewerActiveTurn) : ''}

      <div class="journal-visual-legend" role="region" aria-label="Snapshot inspection controls">
        <span class="journal-legend-chip"><i class="chip-dot is-pin"></i><b>📌 Pinned Snapshot:</b> Rev ${viewRev} of ${liveRev}</span>
        <span class="journal-legend-chip"><i class="chip-dot is-board"></i><b>Inspect resulting position →</b> Opens board/desk at selected move</span>
        <span class="journal-legend-chip ${isHistorical ? 'is-readonly-chip' : 'is-live-chip'}">
          ${isHistorical ? `🔒 Read-only snapshot · ● Live match continues at Rev ${liveRev}` : `● Viewing live match at Rev ${liveRev}`}
        </span>
      </div>

      <div class="history-list">
        ${events
          .map(
            (r) => {
              const isSel = r.revision === viewRev;
              const kind = eventRoundKind(r);
              return `
            <article class="journal-entry kind-${kind} ${isSel ? 'selected' : ''}">
            <button data-revision="${r.revision}" aria-pressed="${isSel}">
              <span class="rev-pill kind-${kind}">REV ${r.revision}</span>
              <div class="rev-main">
                <b>${escapeHtml(r.label)}</b>
                <small>${escapeHtml(r.detail || (r.revision === 0 ? 'Initial 1889 setup state' : 'Accepted game move'))}</small>
              </div>
              <span class="rev-meta">${formatTime(r.occurred_at)} · ${escapeHtml(r.actor_name || 'System')}</span>
              <em class="rev-pin-badge">${isSel ? '📌 Pinned Snapshot' : 'Select snapshot'}</em>
            </button>
            <button class="inspect-position-btn" data-inspect-revision="${r.revision}">Inspect resulting position · Rev ${r.revision} →</button>
            </article>`;
            }
          )
          .join('')}
      </div>
    </section>
  `;
}
