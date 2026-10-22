/**
 * Club Culture & Multi-Seat Demo Modals (`src/components/Modals.js`):
 *  1. Koenji Railway Club Membership Stamp Card (manual one-stamp-per-gathering + table notes)
 *  2. Multi-Seat Switcher, Two-Browser Window Launcher, Fixture Selector & Protocol Verification Suite
 */

import { CLUB_MEMBERS, CORP_META, HEX_NAMES, PRIVATE_META } from '../constants1889.js';
import { renderPrivateIllustrationSVG, renderVintagePrivateCard } from './PrivateCompanyCards.js';
import { renderCharacter } from '../scene/Character.js';
import { escapeHtml, formatTime, mapActionAuthority } from '../ui/presentation.js';

export function renderPrivateZoomModal(appState, viewData) {
  const priv=viewData.state.privates?.[appState.privateDetailsId];
  if(!priv)return '';
  const offered=viewData.state.auction?.active || Object.values(viewData.state.privates).find(p=>!p.owner)?.id;
  const owner=priv.owner && (viewData.state.players?.[priv.owner]?.name || viewData.state.corporations?.[priv.owner]?.name || priv.owner);
  return `<div class="modal-backdrop" data-close-modal="true"><section class="modal-card private-zoom-modal" role="dialog" aria-modal="true" aria-labelledby="zoom-title"><header class="modal-header"><h2 id="zoom-title">Enlarged certificate · ${escapeHtml(priv.id)}</h2><button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close enlarged card">×</button></header>${renderVintagePrivateCard(priv,{interactive:false,inspectable:false,ownerName:owner,inAuction:viewData.state.round==='auction',isSelected:appState.selectedPrivateId===priv.id,isOffered:offered===priv.id,isRunoff:Boolean(viewData.state.auction?.active),offerPrice:priv.value-(priv.id==='TR'?(viewData.state.auction?.discount || 0):0)})}</section></div>`;
}

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
  const parentPid = appState.modalParentPlayerId;
  const parentPlayer = parentPid ? state.players?.[parentPid] : null;
  return `<div class="modal-backdrop" data-close-modal="true">
    <section class="modal-card private-details-modal" role="dialog" aria-modal="true" aria-labelledby="private-details-title" aria-describedby="private-details-context">
      <header class="modal-header">
        <div>
          <div class="private-details-kicker">PRIVATE COMPANY · ${escapeHtml(priv.id)}</div>
          <h2 id="private-details-title">${escapeHtml(name)}</h2>
          <p lang="ja">${escapeHtml(meta.jp || '')}</p>
        </div>
        <div class="washi-modal-header-actions">
          ${parentPlayer ? `<button type="button" class="washi-back-btn" data-player-details="${escapeHtml(parentPid)}">← Back to ${escapeHtml(parentPlayer.name)}</button>` : ''}
          <button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close private company details">×</button>
        </div>
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

export function renderCorporationDetailsModal(appState, viewData) {
  const state = viewData.state;
  const cid = appState.corporationDetailsId || appState.selectedCompanyId || 'IR';
  const corp = state.corporations?.[cid];
  if (!corp) return '';
  const meta = CORP_META[cid] || {
    id: cid,
    short: cid,
    name: corp.name || cid,
    jp: '',
    home: corp.home || '—',
    homeName: HEX_NAMES[corp.home] || corp.home || '—',
    color: '#9c6b2b',
    text: '#fff8eb',
  };
  const historical = appState.viewRevision !== appState.liveRevision;
  const money = (value) => `¥${Number(value || 0).toLocaleString()}`;
  const mktPrice = viewData.prices?.[cid] || 0;
  const presidentName = corp.president
    ? state.players?.[corp.president]?.name || corp.president
    : 'Unparred';
  const parentPid = appState.modalParentPlayerId;
  const parentPlayer = parentPid ? state.players?.[parentPid] : null;
  const shareholders = Object.entries(corp.holdings || {})
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1]);
  const corpPrivates = Object.values(state.privates || {}).filter(
    (p) => p.owner === cid && !p.closed
  );

  return `<div class="modal-backdrop" data-close-modal="true">
    <section class="modal-card private-details-modal corporation-details-modal" style="--corp:${meta.color}; --corp-text:${meta.text || '#fff'}" role="dialog" aria-modal="true" aria-labelledby="corp-details-title" aria-describedby="corp-details-context">
      <header class="modal-header">
        <div class="corp-modal-title-group">
          <span class="corp-modal-emblem">${escapeHtml(cid)}</span>
          <div>
            <div class="private-details-kicker">PUBLIC RAILWAY CORPORATION · HOME ${escapeHtml(corp.home)} (${escapeHtml(meta.homeName || corp.home)})</div>
            <h2 id="corp-details-title">${escapeHtml(corp.name)}</h2>
            <p lang="ja">${escapeHtml(meta.jp || '')}</p>
          </div>
        </div>
        <div class="washi-modal-header-actions">
          ${parentPlayer ? `<button type="button" class="washi-back-btn" data-player-details="${escapeHtml(parentPid)}">← Back to ${escapeHtml(parentPlayer.name)}</button>` : ''}
          <button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close corporation details">×</button>
        </div>
      </header>
      <p id="corp-details-context" class="private-details-context">${historical ? 'Historical position' : 'Live position'} · Rev ${state.revision} · ${corp.floated ? `Floated · Operating Safe ${money(corp.cash)}` : `Unfloated · Needs ${Math.max(0, 50 - (100 - corp.ipo))}% more from IPO`}</p>
      <dl class="private-details-facts corp-details-facts">
        <div><dt>Current Market Price</dt><dd>${mktPrice ? money(mktPrice) : 'Unparred'}</dd></div>
        <div><dt>Par Price</dt><dd>${corp.par ? money(corp.par) : 'Not set (¥65–¥100)'}</dd></div>
        <div><dt>Corporate Treasury</dt><dd>${corp.floated ? money(corp.cash) : 'Awaiting float'}</dd></div>
        <div><dt>President</dt><dd>${escapeHtml(presidentName)}</dd></div>
        <div><dt>IPO / Bank Pool</dt><dd>${corp.ipo}% IPO · ${corp.pool}% Pool</dd></div>
        <div><dt>Trains &amp; Stations</dt><dd>${corp.trains?.length ? corp.trains.join(', ') : 'No trains'} · ${corp.token_supply} stations</dd></div>
      </dl>
      <section class="corp-modal-section" aria-labelledby="corp-shareholders-title">
        <h3 id="corp-shareholders-title">Shareholder Register</h3>
        ${shareholders.length ? `<div class="corp-shareholder-list">
          ${shareholders.map(([holderPid, pct]) => {
            const pName = state.players?.[holderPid]?.name || holderPid;
            const isPres = corp.president === holderPid;
            const val = (pct / 10) * (mktPrice || corp.par || 0);
            return `<button type="button" class="corp-shareholder-row" data-player-details="${escapeHtml(holderPid)}">
              <span><b>${escapeHtml(pName)}</b> ${isPres ? '<em class="washi-seal-pill is-pres">★ President</em>' : ''}</span>
              <span><b>${pct}%</b> (${pct / 10} cert${pct === 10 ? '' : 's'}) · ${val ? money(val) : '—'} →</span>
            </button>`;
          }).join('')}
        </div>` : '<p class="washi-empty-card">No player shares held at this revision.</p>'}
      </section>
      ${corpPrivates.length ? `<section class="corp-modal-section" aria-labelledby="corp-privates-title">
        <h3 id="corp-privates-title">Corporate Concessions &amp; Active Powers</h3>
        <div class="player-privates-stack">
          ${corpPrivates.map((p) => {
            const pMeta = PRIVATE_META[p.id] || {};
            return `<button type="button" class="player-private-card" style="--priv-color:${pMeta.color || '#7c431e'}" data-private-details="${escapeHtml(p.id)}">
              <div class="player-private-art-col">
                <div class="player-private-thumb" aria-hidden="true">${renderPrivateIllustrationSVG(p.id)}</div>
                <div class="player-private-face-row"><span>Face ${money(p.value)}</span><span>+${money(p.revenue)}/OR</span></div>
              </div>
              <div class="player-private-copy-col">
                <div class="player-private-top">
                  <span class="player-private-code">${escapeHtml(p.id)}</span>
                  <div class="player-private-titles">
                    <strong>${escapeHtml(p.name || pMeta.name || p.id)}</strong>
                    ${pMeta.jp ? `<small lang="ja">${escapeHtml(pMeta.jp)}</small>` : ''}
                  </div>
                  <span class="player-private-yield">+${money(p.revenue)} / OR</span>
                </div>
                <div class="player-private-power-box">
                  <span class="power-benefit-pill">⚡ ${escapeHtml(pMeta.benefitTag || 'Company Power')}</span>
                  <p>${escapeHtml(pMeta.power || 'No special powers.')}</p>
                </div>
                <div class="player-private-footer">
                  <span class="inspect-link-hint">Inspect Private Concession →</span>
                </div>
              </div>
            </button>`;
          }).join('')}
        </div>
      </section>` : ''}
      <div class="private-power-actions corp-modal-actions">
        <div class="private-power-btn-row">
          <button type="button" class="confirm-button" data-open-corp-market="${escapeHtml(cid)}">Open ${escapeHtml(cid)} in Stock Exchange</button>
          <button type="button" class="secondary-btn" data-company-map="${escapeHtml(cid)}" data-home-hex="${escapeHtml(corp.home)}" data-close-modal="true">Inspect Home Station (${escapeHtml(corp.home)}) on Map</button>
          ${!historical && state.round === 'operating' && corp.president === viewData.viewer?.player_id && corp.trains?.length ? `<button type="button" class="secondary-btn" data-propose-corp-train-sale="${escapeHtml(cid)}" data-testid="corp-propose-train-sale-${escapeHtml(cid)}">🤝 Propose Sale / Transfer</button>` : ''}
        </div>
      </div>
    </section>
  </div>`;
}

export function renderPlayerDetailsModal(appState, viewData) {
  const pid = appState.playerDetailsId;
  const state = viewData.state;
  const player = state.players?.[pid];
  if (!player) return '';
  const money = (value) => `¥${Number(value || 0).toLocaleString()}`;
  const order = state.player_order || Object.keys(state.players || {});
  const seatIdx = Math.max(0, order.indexOf(pid));
  const persona = CLUB_MEMBERS[seatIdx] || CLUB_MEMBERS[0];
  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const isViewer = viewData.viewer?.player_id === pid;
  const isCurrentActor = state.current_player === pid;
  const holdsPriority = state.priority === pid;
  const stamp = viewData.club?.stamps?.[pid];

  const holdings = Object.entries(state.corporations || {}).filter(
    ([, c]) => c.holdings?.[pid] > 0
  );
  const privates = Object.values(state.privates || {}).filter(
    (p) => p.owner === pid && !p.closed
  );
  // Also surface private concessions owned by corporations where this player is President
  const presidedCorpPrivates = Object.entries(state.corporations || {})
    .filter(([, c]) => c.president === pid)
    .flatMap(([cid, c]) =>
      Object.values(state.privates || {})
        .filter((p) => p.owner === cid && !p.closed)
        .map((p) => ({ priv: p, cid, corpName: c.name }))
    );

  const certCount = viewData.certificates?.[pid] || 0;
  const certLimit = viewData.certificate_limit || 0;
  const stockValue = holdings.reduce((sum, [cid, c]) => {
    const unitPrice = viewData.prices?.[cid] ?? c.par ?? 0;
    return sum + ((c.holdings?.[pid] || 0) / 10) * unitPrice;
  }, 0);
  const privateFaceValue = privates.reduce((sum, p) => sum + (p.value || 0), 0);
  const privateOrIncome = privates.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const netWorth = (player.cash || 0) + stockValue + privateFaceValue;

  let escrowedBids = 0;
  if (state.round === 'auction' && state.auction?.bids) {
    for (const bmap of Object.values(state.auction.bids)) {
      escrowedBids += bmap?.[pid] || 0;
    }
  }

  const phaseNum = Number(state.phase);
  const corpBuyoutOpen = phaseNum >= 3 || state.phase === 'D';

  return `<div class="modal-backdrop" data-close-modal="true">
    <section class="modal-card player-modal washi-player-modal" role="dialog" aria-modal="true" aria-label="Player details">
      <header class="modal-header washi-player-header">
        <div class="washi-player-portrait-frame">
          <div class="washi-player-portrait-art">
            ${renderCharacter(viewData.members?.[pid]?.appearance, {
              memberId: pid,
              name: player.name,
              surface: 'portrait',
            })}
          </div>
          <span class="washi-seat-plaque">SEAT ${escapeHtml(pid.toUpperCase())}</span>
        </div>

        <div class="washi-player-identity">
          <p class="washi-player-kicker">${isHistorical ? 'Historical position' : 'Live position'} · Rev ${state.revision} · Seated member${isViewer ? ' · You' : ''}</p>
          <div class="washi-player-name-row">
            <h2>${escapeHtml(player.name)}</h2>
            ${persona?.jpTitle ? `<span class="washi-persona-jp" lang="ja">${escapeHtml(persona.jpTitle)}</span>` : ''}
          </div>
          <div class="washi-player-seals-row">
            ${persona?.roleTag ? `<span class="washi-seal-pill">${escapeHtml(persona.roleTag)}</span>` : ''}
            ${isViewer ? '<span class="washi-seal-pill is-you">You</span>' : ''}
            ${isCurrentActor ? '<span class="washi-seal-pill is-turn">⚡ Current actor at this revision</span>' : ''}
            ${holdsPriority ? '<span class="washi-seal-pill is-priority">🏮 Holds Priority Deal</span>' : ''}
            ${stamp ? `<span class="washi-seal-pill is-stamped">印 ${escapeHtml(stamp.seal || '高円寺')} · ${formatTime(stamp.recorded_at)}</span>` : ''}
          </div>
        </div>

        <button type="button" class="close-modal-btn" data-close-modal="true" aria-label="Close player details">×</button>
      </header>

      <div class="washi-ledger-strip" aria-label="Financial summary">
        <div class="washi-ledger-stat is-primary">
          <span class="stat-label">NET WORTH · 総資産</span>
          <strong class="stat-figure">${money(netWorth)}</strong>
          <small>Cash + Stock ${money(stockValue)} + Privates ${money(privateFaceValue)}</small>
        </div>
        <div class="washi-ledger-stat">
          <span class="stat-label">PURSE · 個人資金</span>
          <p class="stat-compat-line">Personal cash <b>¥${player.cash.toLocaleString()}</b> · ${certCount} certificates</p>
          <small>${escrowedBids > 0 ? `¥${escrowedBids.toLocaleString()} escrowed in auction bids` : 'Liquid personal treasury'}</small>
        </div>
        <div class="washi-ledger-stat">
          <span class="stat-label">CERTIFICATES · 株券枚数</span>
          <strong class="stat-figure">${certCount}${certLimit ? ` <small>/ ${certLimit}</small>` : ''}</strong>
          <small>${holdings.length} public corp${holdings.length === 1 ? '' : 's'} · ${privates.length} private${privates.length === 1 ? '' : 's'}</small>
        </div>
        <div class="washi-ledger-stat">
          <span class="stat-label">PRIVATE YIELD · 毎OR収入</span>
          <strong class="stat-figure">+${money(privateOrIncome)}<small>/OR</small></strong>
          <small>${privates.length ? `Face value ${money(privateFaceValue)}` : 'No active private income'}</small>
        </div>
      </div>

      <section class="washi-portfolio-section" aria-labelledby="player-privates-heading">
        <div class="washi-section-head">
          <h3 id="player-privates-heading">I. Private Concessions &amp; Special Powers</h3>
          <span>${privates.length ? `${privates.length} Open · +${money(privateOrIncome)}/OR · Click card for full view &amp; actions` : 'None Held'}</span>
        </div>
        ${
          privates.length
            ? `<div class="player-privates-stack">
                ${privates
                  .map((p) => {
                    const meta = PRIVATE_META[p.id] || {};
                    const name = p.name || meta.name || p.id;
                    const minBuyout = Math.ceil((p.value || 0) / 2);
                    const maxBuyout = (p.value || 0) * 2;
                    const hasBlocks = meta.blocks && meta.blocks !== 'None';
                    return `<button type="button" class="player-private-card" style="--priv-color:${meta.color || '#7c431e'}" data-private-details="${escapeHtml(p.id)}" data-from-player="${escapeHtml(pid)}">
                      <div class="player-private-art-col">
                        <div class="player-private-thumb" aria-hidden="true">${renderPrivateIllustrationSVG(p.id)}</div>
                        <div class="player-private-face-row">
                          <span>Face ${money(p.value)}</span>
                          <span>Buyout ${money(minBuyout)}–${money(maxBuyout)}</span>
                        </div>
                      </div>
                      <div class="player-private-copy-col">
                        <div class="player-private-top">
                          <span class="player-private-code">${escapeHtml(p.id)}</span>
                          <div class="player-private-titles">
                            <strong>Private ${escapeHtml(p.id)} · ${escapeHtml(name)} · ¥${p.revenue}/OR</strong>
                            ${meta.jp ? `<small lang="ja">${escapeHtml(meta.jp)}</small>` : ''}
                          </div>
                          <span class="player-private-yield">+${money(p.revenue)} / OR</span>
                        </div>
                        <div class="player-private-power-box">
                          <div class="power-pill-row">
                            <span class="power-benefit-pill">⚡ SPECIAL POWER: ${escapeHtml(meta.benefitTag || 'Active Concession')}</span>
                            ${hasBlocks ? `<span class="power-block-pill">📍 Blocks ${escapeHtml(meta.blocks)}</span>` : ''}
                          </div>
                          <p class="player-private-power-text">${escapeHtml(meta.power || 'No special powers.')}</p>
                          ${meta.powerJp ? `<p class="player-private-power-jp" lang="ja">${escapeHtml(meta.powerJp)}</p>` : ''}
                        </div>
                        <div class="player-private-footer">
                          <span class="buyout-status-note">${corpBuyoutOpen ? `✓ Phase ${escapeHtml(String(state.phase))}: Eligible for corporate buyout (${money(minBuyout)}–${money(maxBuyout)})` : `Phase ${escapeHtml(String(state.phase))}: Player-held (corporate buyouts open in Phase 3)`}</span>
                          <span class="inspect-link-hint">Open Concession Details &amp; Power Actions →</span>
                        </div>
                      </div>
                    </button>`;
                  })
                  .join('')}
              </div>`
            : '<p class="washi-empty-card">No open private concessions held by this player.</p>'
        }
        ${
          presidedCorpPrivates.length
            ? `<div class="presided-corp-privates-box">
                <div class="washi-subhead">Powers Held by Your Presided Corporations (${presidedCorpPrivates.length})</div>
                <div class="player-privates-stack">
                  ${presidedCorpPrivates
                    .map(({ priv: p, cid, corpName }) => {
                      const meta = PRIVATE_META[p.id] || {};
                      return `<button type="button" class="player-private-card is-corp-owned" style="--priv-color:${meta.color || '#4a3267'}" data-private-details="${escapeHtml(p.id)}" data-from-player="${escapeHtml(pid)}">
                        <div class="player-private-art-col">
                          <div class="player-private-thumb" aria-hidden="true">${renderPrivateIllustrationSVG(p.id)}</div>
                          <div class="player-private-face-row"><span>Owned by ${escapeHtml(cid)}</span><span>+${money(p.revenue)}/OR</span></div>
                        </div>
                        <div class="player-private-copy-col">
                          <div class="player-private-top">
                            <span class="player-private-code">${escapeHtml(p.id)}</span>
                            <div class="player-private-titles">
                              <strong>${escapeHtml(p.name || meta.name || p.id)} <small>(Treasury of ${escapeHtml(corpName)})</small></strong>
                            </div>
                            <span class="player-private-yield">+${money(p.revenue)} / OR to ${escapeHtml(cid)}</span>
                          </div>
                          <div class="player-private-power-box">
                            <span class="power-benefit-pill">⚡ ${escapeHtml(cid)} CORPORATE POWER: ${escapeHtml(meta.benefitTag || 'Active Power')}</span>
                            <p class="player-private-power-text">${escapeHtml(meta.power || 'No special powers.')}</p>
                          </div>
                          <div class="player-private-footer">
                            <span class="inspect-link-hint">Open Concession Details →</span>
                          </div>
                        </div>
                      </button>`;
                    })
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </section>

      <section class="washi-portfolio-section" aria-labelledby="player-public-heading">
        <div class="washi-section-head">
          <h3 id="player-public-heading">II. Public Railway Portfolio</h3>
          <span>${holdings.length ? `${holdings.length} Corporation${holdings.length === 1 ? '' : 's'} · ${money(stockValue)} Market Value · Click share for corporation details` : '0 Shares'}</span>
        </div>
        ${
          holdings.length
            ? `<div class="player-corps-grid">
                ${holdings
                  .map(([cid, c]) => {
                    const meta = CORP_META[cid] || {
                      name: c.name,
                      jp: '',
                      home: c.home,
                      homeName: HEX_NAMES[c.home] || c.home,
                      color: '#9c6b2b',
                      text: '#fff8eb',
                    };
                    const pct = c.holdings[pid];
                    const isPres = c.president === pid;
                    const unitPrice = viewData.prices?.[cid] ?? c.par ?? 0;
                    const holdingVal = (pct / 10) * unitPrice;
                    return `<button type="button" class="player-corp-card" style="--corp:${meta.color}; --corp-text:${meta.text || '#fff'}" data-corporation-details="${escapeHtml(cid)}" data-from-player="${escapeHtml(pid)}">
                      <span class="player-corp-ribbon"></span>
                      <span class="player-corp-badge">${escapeHtml(cid)}</span>
                      <div class="player-corp-main">
                        <p class="player-corp-compat">Public ${escapeHtml(cid)} · ${escapeHtml(c.name)}: <b>${pct}%</b>${isPres ? ' · President' : ''}</p>
                        <small>${escapeHtml(meta.jp ? `${meta.jp} · ` : '')}Home ${escapeHtml(c.home)} (${escapeHtml(meta.homeName || c.home)}) · ${c.floated ? `Floated · Safe ${money(c.cash)}` : `Unfloated · IPO ${c.ipo}%`}${c.trains?.length ? ` · Trains: ${escapeHtml(c.trains.join(', '))}` : ''}</small>
                      </div>
                      <div class="player-corp-valuation">
                        <strong>${money(holdingVal)}</strong>
                        <small>${pct / 10} sh @ ${unitPrice ? money(unitPrice) : 'Unparred'}${isPres ? ' · ★ Pres' : ''}</small>
                        <span class="inspect-link-hint">Details →</span>
                      </div>
                    </button>`;
                  })
                  .join('')}
              </div>`
            : '<p class="washi-empty-card">No public shares</p>'
        }
      </section>
    </section>
  </div>`;
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
                    <p data-no-translate>${escapeHtml(n.text)}</p>
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
