/**
 * Club Culture & Multi-Seat Demo Modals (`src/components/Modals.js`):
 *  1. Koenji Railway Club Membership Stamp Card (manual one-stamp-per-gathering + table notes)
 *  2. Multi-Seat Switcher, Two-Browser Window Launcher, Fixture Selector & Protocol Verification Suite
 */

import { CLUB_MEMBERS, HEX_NAMES, PRIVATE_META } from '../constants1889.js';
import { renderPrivateIllustrationSVG } from './PrivateCompanyCards.js';
import { escapeHtml, formatTime, mapActionAuthority } from '../ui/presentation.js';

export function renderPrivateDetailsModal(appState, viewData) {
  const state = viewData.state;
  const priv = state.privates?.[appState.privateDetailsId];
  if (!priv) return '';
  const meta = PRIVATE_META[priv.id] || {};
  const name = priv.name || meta.name || priv.id;
  const owner = priv.owner
    ? state.players?.[priv.owner]?.name || state.corporations?.[priv.owner]?.name || priv.owner
    : 'Bank · Unowned';
  const historical = appState.viewRevision !== appState.liveRevision;
  const money = value => `¥${Number(value || 0).toLocaleString()}`;
  const authority = mapActionAuthority(appState, viewData);
  const portHexes = viewData.legal_actions?.choices?.port_hexes || [];
  const canExchangeDr = Boolean(
    priv.id === 'DR' &&
    !priv.closed &&
    !historical &&
    viewData.legal_actions?.types?.includes('exchange_private')
  );
  const canOfferPrivate = Boolean(
    !priv.closed &&
    !historical &&
    viewData.legal_actions?.types?.includes('offer') &&
    (viewData.legal_actions?.choices?.offers || []).some(o => o.kind === 'private' && o.item === priv.id)
  );
  return `<div class="modal-backdrop" data-close-modal="true">
    <section class="modal-card private-details-modal" role="dialog" aria-modal="true" aria-labelledby="private-details-title" aria-describedby="private-details-context">
      <header class="modal-header">
        <div><div class="private-details-kicker">PRIVATE COMPANY · ${escapeHtml(priv.id)}</div>
          <h2 id="private-details-title">${escapeHtml(name)}</h2>
          <p lang="ja">${escapeHtml(meta.jp || '')}</p>
        </div>
        <button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close private company details">×</button>
      </header>
      <p id="private-details-context" class="private-details-context">${historical ? 'Historical position' : 'Live position'} · Rev ${state.revision}${priv.closed ? ' · Closed concession' : ''}</p>
      <div class="private-details-art" aria-hidden="true">${renderPrivateIllustrationSVG(priv.id)}</div>
      <dl class="private-details-facts">
        <div><dt>Face value</dt><dd>${money(priv.value)}</dd></div>
        <div><dt>Income per operating round</dt><dd>${priv.closed ? 'Closed · No income' : money(priv.revenue)}</dd></div>
        <div><dt>Owner</dt><dd>${escapeHtml(owner)}</dd></div>
      </dl>
      <section class="private-details-powers" aria-labelledby="private-details-powers-title">
        <h3 id="private-details-powers-title">Company powers</h3>
        ${priv.closed ? '<p class="private-details-closed">This concession is closed. Its powers and income are no longer active.</p>' : ''}
        <p>${escapeHtml(meta.power || 'No special powers.')}</p>
        ${meta.powerJp ? `<p class="private-details-jp" lang="ja">${escapeHtml(meta.powerJp)}</p>` : ''}
        ${priv.id === 'MF' && !priv.closed ? `<div class="private-power-actions" data-testid="mf-modal-actions">
          <h4>Coastal Port Towns (#437 · Permanent ¥30)</h4>
          <div class="private-power-btn-row">
            ${['B11', 'G10', 'I12', 'J9'].map(hex => {
              const eligible = authority.canLayMfPort && portHexes.includes(hex);
              const built = Boolean(state.board?.[hex]?.tile);
              return eligible
                ? `<button type="button" class="confirm-button mf-port-btn" data-op-action="lay_mf_port" data-port-hex="${hex}" data-testid="mf-lay-${hex}">⚓ Lay Port #437 on ${hex} (${escapeHtml(HEX_NAMES[hex] || hex)})</button>`
                : `<button type="button" class="secondary-btn" data-select-port-hex="${hex}" data-testid="mf-inspect-${hex}">${hex} (${escapeHtml(HEX_NAMES[hex] || hex)}) · ${built ? `Built (#${escapeHtml(state.board[hex].tile)})` : 'Inspect on Map'}</button>`;
            }).join('')}
          </div>
        </div>` : ''}
        ${canExchangeDr ? `<div class="private-power-actions" data-testid="dr-modal-actions"><button type="button" class="confirm-button" data-action="exchange_dr" data-testid="dr-exchange-btn">⇄ Exchange DR for 10% IR Share from IPO</button></div>` : ''}
        ${canOfferPrivate ? `<div class="private-power-actions" data-testid="private-offer-actions"><button type="button" class="secondary-btn" data-open-desk data-testid="private-open-deals-btn">Open Boardroom Deal Table to Offer / Transfer ${escapeHtml(priv.id)}</button></div>` : ''}
      </section>
    </section>
  </div>`;
}

export function renderPlayerDetailsModal(appState, viewData) {
  const pid = appState.playerDetailsId;
  const state = viewData.state;
  const player = state.players[pid];
  if (!player) return '';
  const holdings = Object.entries(state.corporations).filter(([, c]) => c.holdings?.[pid] > 0);
  const privates = Object.values(state.privates).filter((p) => p.owner === pid && !p.closed);
  return `<div class="modal-backdrop" data-close-modal="true"><section class="modal-card player-modal" role="dialog" aria-modal="true" aria-label="Player details">
    <header class="modal-header"><h2>${escapeHtml(player.name)}</h2><button class="close-modal-btn" data-close-modal="true" aria-label="Close player details">×</button></header>
    <p>${appState.viewRevision !== appState.liveRevision ? 'Historical position' : 'Live position'} · Rev ${state.revision} · Seated member${viewData.viewer?.player_id === pid ? ' · You' : ''}</p>
    <p>Personal cash <b>¥${player.cash.toLocaleString()}</b> · ${viewData.certificates?.[pid] || 0} certificates</p>
    ${holdings.map(([cid, c]) => `<p>Public ${cid} · ${escapeHtml(c.name)}: <b>${c.holdings[pid]}%</b>${c.president === pid ? ' · President' : ''}</p>`).join('') || '<p>No public shares</p>'}
    ${privates.map((p) => `<p>Private ${p.id} · ${escapeHtml(p.name)} · ¥${p.revenue}/OR</p>`).join('')}
    ${state.current_player === pid ? '<p>Current actor at this revision</p>' : ''}
    ${state.priority === pid ? '<p>Holds Priority Deal</p>' : ''}
  </section></div>`;
}

export function renderMemberStampModal(appState, viewData) {
  const state = viewData.state;
  const club = viewData.club || {};
  const stamps = club.stamps || {};
  const notes = club.notes || [];
  const viewerId = viewData.viewer?.player_id;
  const viewerName = viewData.viewer?.player_name || 'Guest Observer';
  const hasStamped = Boolean(viewerId && stamps[viewerId]);

  return `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-card stamp-modal" role="dialog" aria-modal="true" aria-label="Koenji Railway Club Membership Card">
        <header class="modal-header">
          <div>
            <div class="section-label">CURRENT GATHERING · 今夜の集まり</div>
            <h2>Koenji Railway Club Membership Card <small>高円寺鉄道倶楽部 会員証</small></h2>
          </div>
          <button class="close-modal-btn" data-close-modal="true" aria-label="Close membership card">×</button>
        </header>

        <p class="gathering-notice">Notes and stamps belong to the current gathering${appState.viewRevision !== appState.liveRevision ? `, while the game is at historical Rev ${appState.viewRevision}` : ''}.</p>
        <button class="secondary-btn" data-action="motion" aria-label="Toggle reduced motion" aria-pressed="${!appState.skipMotion}">Motion: ${appState.skipMotion ? 'Off' : 'On'}</button>
        <div class="stamp-card-layout">
          <div class="physical-member-card">
            <div class="card-border">
              <div class="card-header-seal">
                <span>高円寺鉄道倶楽部</span>
                <small>EST. KOENJI, TOKYO · SHIKOKU 1889</small>
              </div>
              <div class="card-member-info">
                <div>
                  <small>MEMBER SEAT</small>
                  <b>${viewerName} ${viewerId ? `(${viewerId.toUpperCase()})` : '(Observer)'}</b>
                </div>
                <div>
                  <small>GATHERING</small>
                  <b>${club.gathering_title || 'Autumn Koenji Session'}</b>
                </div>
              </div>

              <div class="stamp-slots-grid">
                ${(state.player_order || ['p1', 'p2', 'p3', 'p4'])
                  .map((pid, idx) => {
                    const pName = state.players?.[pid]?.name || pid;
                    const st = stamps[pid];
                    const memberMeta = CLUB_MEMBERS[idx] || CLUB_MEMBERS[0];
                    return `
                      <div class="stamp-box ${st ? 'is-stamped' : ''}">
                        <small>${pName} · ${memberMeta.roleTag}</small>
                        <div class="hanko-circle">
                          ${
                            st
                              ? `<div class="red-hanko">
                                  <span>${st.seal || '高円寺'}</span>
                                  <em>${formatTime(st.recorded_at)}</em>
                                </div>`
                              : '<span class="unstamped-placeholder">未押印</span>'
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>

              <div class="card-actions-row">
                <button
                  class="confirm-button"
                  data-action="stamp_member_card"
                  ${!viewerId || hasStamped ? 'disabled' : ''}
                >
                  ${
                    !viewerId
                      ? 'Seated members can stamp their card'
                      : hasStamped
                        ? '✓ Stamped for this gathering'
                        : '🏮 Stamp My Membership Card for Tonight’s Gathering'
                  }
                </button>
              </div>
            </div>
          </div>

          <div class="club-notes-column">
            <div class="section-label">TABLE TEA, SNACKS & ARRIVAL NOTES</div>
            <div class="notes-feed">
              ${notes
                .map(
                  (n) => `
                  <div class="club-note-item">
                    <b>${escapeHtml(n.author)}</b> <time>${formatTime(n.recorded_at)}</time>
                    <p>${escapeHtml(n.text)}</p>
                  </div>`
                )
                .join('')}
            </div>
            <form class="club-note-form" data-form="club_note">
              <input
                type="text"
                name="note_text"
                placeholder="Share a table note, snack arrival, or remark..."
                aria-label="Current gathering note"
                maxlength="140"
                required
              />
              <button type="submit" class="secondary-btn">Post Note</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSeatsAndDemoModal(appState, viewData, roomBundle) {
  const state = viewData.state;
  const viewerId = viewData.viewer?.player_id;
  const viewerRole = viewData.viewer?.role;
  const roomCode = viewData.room_code || roomBundle?.room_code || '—';

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const seats = (state.player_order || []).map((pid, idx) => ({
    player_id: pid,
    name: state.players?.[pid]?.name || `Player ${idx + 1}`,
    cash: state.players?.[pid]?.cash || 0,
    token: roomBundle?.player_tokens?.[idx] || '',
    url: `${baseUrl}?room=${encodeURIComponent(roomCode)}&seat=${pid}`,
  }));
  const spectatorUrl = `${baseUrl}?room=${encodeURIComponent(roomCode)}&seat=spectator`;

  return `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-card seats-modal" role="dialog" aria-modal="true" aria-label="Seats, Multi-Browser Demo, and Fixtures">
        <header class="modal-header">
          <div>
            <div class="section-label">DEVELOPMENT TOOLS · ROOM ${roomCode}</div>
            <h2>Demo seats, fixtures & protocol checks</h2>
          </div>
          <button class="close-modal-btn" data-close-modal="true" aria-label="Close demo tools">×</button>
        </header>

        <nav class="developer-tabs" aria-label="Demo tool sections">
          ${[['seats', 'Demo Seats'], ['fixtures', 'Fixtures'], ['protocol', 'Protocol Checks']].map(([id, label]) => `<button data-developer-tab="${id}" aria-pressed="${appState.developerTab === id}">${label}</button>`).join('')}
        </nav>
        <div class="seats-modal-grid">
          <div class="seats-column" ${appState.developerTab !== 'seats' ? 'hidden' : ''}>
            <div class="section-label">1. AUTHENTICATED TABLE SEATS (ROOM ${roomCode})</div>
            <p class="muted-note">
              Development-only identity switching for testing this match. Ordinary play uses your own seat. Open a second tab to compare two clients; switching here does not change whose turn it is.
            </p>
            <div class="seat-switch-list">
              ${seats
                .map((s) => {
                  const isCurrentTab = viewerId === s.player_id;
                  const isActiveTurn = state.current_player === s.player_id;
                  return `
                    <div class="seat-row-card ${isCurrentTab ? 'current-seat' : ''}">
                      <div>
                        <b>${s.name} (${s.player_id.toUpperCase()})</b>
                        ${isActiveTurn ? '<span class="turn-pill">Active Turn</span>' : ''}
                        ${isCurrentTab ? '<span class="you-pill">This Tab</span>' : ''}
                        <small>¥${s.cash.toLocaleString()} cash</small>
                      </div>
                      <div class="seat-row-actions">
                        <button class="secondary-btn" data-switch-seat="${s.player_id}" ${isCurrentTab ? 'disabled' : ''}>
                          Use in This Tab
                        </button>
                        <a class="open-tab-link" href="${s.url}" target="_blank" rel="noopener">
                          Open in New Tab ↗
                        </a>
                      </div>
                    </div>
                  `;
                })
                .join('')}

              <div class="seat-row-card ${viewerRole === 'spectator' ? 'current-seat' : ''}">
                <div>
                  <b>Guest Observer (Spectator)</b>
                  ${viewerRole === 'spectator' ? '<span class="you-pill">This Tab</span>' : ''}
                  <small>Read-only inspection & historical rewind; cannot submit moves (HTTP 403)</small>
                </div>
                <div class="seat-row-actions">
                  <button class="secondary-btn" data-switch-seat="spectator" ${viewerRole === 'spectator' ? 'disabled' : ''}>
                    Observe in This Tab
                  </button>
                  <a class="open-tab-link" href="${spectatorUrl}" target="_blank" rel="noopener">
                    Open Spectator Tab ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="fixtures-column" ${appState.developerTab === 'seats' ? 'hidden' : ''}>
            <section ${appState.developerTab !== 'fixtures' ? 'hidden' : ''}>
            <div class="section-label">2. DETERMINISTIC 1889 FIXTURES (REAL ENGINE REPLAYS)</div>
            <p class="muted-note">
              Each fixture creates and opens a separate demonstration match from legal engine moves. The current match is saved and is not erased.
            </p>
            ${appState.previousRoom ? `<button class="secondary-btn" data-previous-room>Return to previous match · ${appState.previousRoom.roomCode}</button>` : ''}
            <div class="fixture-btn-stack">
              <button class="confirm-button" data-load-fixture="auction_start">
                <b>Fresh Match — Private Company Auction (Rev 0 · Opening Round)</b>
                <small>Begin at Revision 0 with ¥420 each and Private TR offered for ¥20. Enter through the table or open the auction desk.</small>
              </button>
              <button class="secondary-btn" data-load-fixture="stock_round_1">
                <b>Stock Round 1 — Opening Bell (Rev 8 · Post-Auction)</b>
                <small>Private auction completed; Daisuke (p1, ¥340) holds Priority Deal to par Iyo Railway (IR) or any corporation.</small>
              </button>
              <button class="secondary-btn" data-load-fixture="stock_round_active">
                <b>Stock Round 1 — Active Exchange (Rev 16)</b>
                <small>IR (Par ¥80) and KO (Par ¥75) are parred; Daisuke (p1) can immediately buy a 10% IPO share of IR (¥80) to float IR!</small>
              </button>
              <button class="confirm-button" data-load-fixture="route_planning">
                <b>Train Routes — Two Trains Ready to Run (¥90)</b>
                <small>Play as Daisuke, president of Iyo Railway. Two 2-trains connect Matsuyama to Imabari / Onomichi Ferry and Saijo. Opens the route planner at Step 3, with track and trains already in place.</small>
              </button>
              <button class="confirm-button" data-load-fixture="route_network_3">
                <b>Three Trains — Western Network (3 / 3 / 4 stops)</b>
                <small>18 laid hexes, two company stations, and up to nine reachable stops. Uwajima Railway has two 3-trains and a 4-train; all three run for ¥320. Explore the western triangle, inland corridor, and southern port. Opens as Haruka, the operating president.</small>
              </button>
              <button class="confirm-button" data-load-fixture="route_network_4">
                <b>Four Trains — Branching Network (2 / 2 / 2 / 3 stops)</b>
                <small>16 laid hexes, three company stations, and up to ten reachable stops. Tosa Electric Railway runs four trains for ¥290. Northern junctions and the southern corridor leave alternate stops available while other trains keep their routes. Opens as Kenji, the operating president.</small>
              </button>
              <button class="secondary-btn" data-load-fixture="operating_round_1">
                <b>Operating Round 1.1 — First Track & Train Purchase (Rev 22)</b>
                <small>Iyo Railway (IR) is floated with ¥800 treasury at E2 (Matsuyama); no trains yet. Lay the first track and buy trains for the next operating round.</small>
              </button>
            </div>
            </section>
            <section ${appState.developerTab !== 'protocol' ? 'hidden' : ''}>
            <div class="section-label" style="margin-top:16px">3. LIVE SERVER SECURITY & IDEMPOTENCY VERIFICATION</div>
            <p class="muted-note">
              Probe the backend’s guards directly from this browser session (rejected probes never mutate state or add a revision):
            </p>
            <div class="probe-btn-row">
              <button class="probe-btn" data-run-probe="stale_revision">
                Test Stale Revision (409)
              </button>
              <button class="probe-btn" data-run-probe="impersonate_actor">
                Test Forged Player ID (403)
              </button>
              <button class="probe-btn" data-run-probe="idempotent_retry">
                Test Duplicate command_id
              </button>
            </div>
            ${
              appState.lastProbeResult
                ? `<div class="probe-result-box">${escapeHtml(appState.lastProbeResult)}</div>`
                : ''
            }
            </section>
          </div>
        </div>
      </div>
    </div>
  `;
}
