import {renderCharacter} from '../scene/Character.js';
/**
 * 1889 Stock Exchange, Share Order Ticket, 2D Market Grid, and Dedicated
 * Meiji Private Railway Auction Tab (`src/components/StockExchange.js`).
 *
 * Features:
 * - Separate "Private Auction" tab (`5: Private Auction / 私有鉄道入札`) that
 *   only appears during the opening Private Company Auction round.
 * - Full Meiji Private Railway Auction visual layout with panoramic locomotive
 *   header banner, 4-player portrait strip, vintage illustrated Private Company
 *   certificate cards, and the right-hand Bidding & Information desk.
 * - Modeless draggable/resizable Stock Exchange windows (1–4) for Stock Rounds.
 */

import { CORP_META, HEX_NAMES, PRIVATE_META } from '../constants1889.js';
import { escapeHtml } from '../ui/presentation.js';
import { renderCorporationMapPreview } from './HexMap1889.js';
import {
  renderMeijiAuctionBannerSVG,
  renderVintagePrivateCard,
} from './PrivateCompanyCards.js';

const money = (n) => `¥${Number(n || 0).toLocaleString()}`;

export function getAuctionContext(appState, viewData) {
  const state = viewData.state;
  const privates = Object.values(state.privates || {});
  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const viewerId = viewData.viewer?.player_id;
  const activePlayerId = state.current_player;
  const activePlayer = state.players?.[activePlayerId];
  const perspectiveId = viewerId || activePlayerId || 'p1';
  const perspectivePlayer = state.players?.[perspectiveId] || activePlayer;
  const playerCash = perspectivePlayer?.cash || 0;

  const isAuctionTurn =
    !isHistorical && !appState.isPlayingReplay && !appState.isSubmitting && !appState.isLoadingRevision &&
    state.round === 'auction' &&
    Boolean(viewerId && activePlayerId === viewerId);

  const unsold = privates.filter((p) => !p.owner);
  const isRunoff = Boolean(state.auction?.active);
  const runoffBidders = state.auction?.bidders || [];
  const offeredId = state.auction?.active || unsold[0]?.id || null;
  const offeredPriv =
    (offeredId && state.privates?.[offeredId]) || unsold[0] || privates[0] || null;
  const offeredDiscount =
    offeredId === 'TR' ? state.auction?.discount || 0 : 0;
  const offeredPrice = offeredPriv
    ? Math.max(0, offeredPriv.value - offeredDiscount)
    : 0;

  let selectedPrivId = appState.selectedPrivateId;
  if (state.round === 'auction') {
    if (isRunoff && offeredId) {
      selectedPrivId = offeredId;
    } else if (
      !selectedPrivId ||
      !state.privates?.[selectedPrivId] ||
      state.privates[selectedPrivId].owner
    ) {
      selectedPrivId = offeredId || privates[0]?.id || 'TR';
    }
  } else if (!selectedPrivId || !state.privates?.[selectedPrivId]) {
    selectedPrivId = offeredId || privates[0]?.id || 'TR';
  }

  const selectedPriv =
    state.privates?.[selectedPrivId] || offeredPriv || privates[0] || null;
  const bidsOnSelected =
    (selectedPriv && state.auction?.bids?.[selectedPriv.id]) || {};
  const highestBid = Object.values(bidsOnSelected).reduce(
    (m, v) => Math.max(m, v),
    0
  );
  const highestBidderId =
    Object.keys(bidsOnSelected).find(
      (pid) => bidsOnSelected[pid] === highestBid && highestBid > 0
    ) || null;
  const highestBidderName = highestBidderId
    ? state.players?.[highestBidderId]?.name || highestBidderId
    : null;

  const isOffered =
    !isRunoff &&
    Boolean(selectedPriv && offeredId && selectedPriv.id === offeredId && !selectedPriv.owner);
  const selectedDiscount =
    selectedPriv?.id === 'TR' ? state.auction?.discount || 0 : 0;
  const minBidPrice = !selectedPriv
    ? 0
    : isOffered
      ? Math.max(0, selectedPriv.value - selectedDiscount)
      : Math.max(selectedPriv.value, highestBid) + 5;
  const currentBidInput = Math.max(
    minBidPrice,
    appState.bidPrice || minBidPrice
  );

  const myExistingBid = perspectiveId
    ? bidsOnSelected[perspectiveId] || 0
    : 0;
  const additionalCashNeeded = isOffered
    ? offeredPrice
    : Math.max(0, currentBidInput - myExistingBid);
  const canAffordSelected = playerCash >= additionalCashNeeded;

  const canBuyOffered =
    isAuctionTurn &&
    !isRunoff &&
    Boolean(offeredPriv && !offeredPriv.owner) &&
    playerCash >= offeredPrice;

  const canBidSelected =
    isAuctionTurn &&
    Boolean(selectedPriv && !selectedPriv.owner) &&
    (isRunoff
      ? selectedPriv.id === offeredId && runoffBidders.includes(viewerId)
      : selectedPriv.id !== offeredId) &&
    canAffordSelected;

  const mustTakeFreeTR =
    !isRunoff && offeredId === 'TR' && offeredDiscount >= 20;
  const canPassAuction =
    isAuctionTurn &&
    !mustTakeFreeTR &&
    (!isRunoff || runoffBidders.length > 1);

  // Compute total escrowed yen across all privates
  let totalEscrow = 0;
  for (const bmap of Object.values(state.auction?.bids || {})) {
    for (const amt of Object.values(bmap || {})) {
      totalEscrow += Number(amt || 0);
    }
  }

  return {
    privates,
    unsold,
    isHistorical,
    viewerId,
    activePlayerId,
    activePlayer,
    perspectiveId,
    perspectivePlayer,
    playerCash,
    isAuctionTurn,
    isRunoff,
    runoffBidders,
    offeredId,
    offeredPriv,
    offeredDiscount,
    offeredPrice,
    selectedPrivId,
    selectedPriv,
    bidsOnSelected,
    highestBid,
    highestBidderId,
    highestBidderName,
    isOffered,
    minBidPrice,
    currentBidInput,
    myExistingBid,
    additionalCashNeeded,
    canAffordSelected,
    canBuyOffered,
    canBidSelected,
    mustTakeFreeTR,
    canPassAuction,
    totalEscrow,
  };
}

function render2DStockMarketGrid(state, catalog) {
  const market = catalog?.market || [];
  if (!market.length) return '';

  const posMap = {};
  for (const [cid, corp] of Object.entries(state.corporations || {})) {
    if (Array.isArray(corp.position) && corp.position.length === 2) {
      const key = `${corp.position[0]},${corp.position[1]}`;
      if (!posMap[key]) posMap[key] = [];
      posMap[key].push(cid);
    }
  }

  return `
    <div class="market-chart-card">
      <div class="section-label">SHIKOKU STOCK MARKET LEDGER · 株価ボード (PAR SLOTS MARKED "P")</div>
      <div class="market-grid-scroll">
        <div class="stock-2d-grid">
          ${market
            .map(
              (row, rIdx) => `
              <div class="stock-2d-row">
                ${row
                  .map((cell, cIdx) => {
                    const key = `${rIdx},${cIdx}`;
                    const tokens = posMap[key] || [];
                    const zoneClass =
                      cell.zone === 'y'
                        ? 'zone-yellow'
                        : cell.zone === 'o'
                          ? 'zone-orange'
                          : 'zone-white';
                    return `
                      <div data-market-position="${rIdx},${cIdx}" class="stock-cell ${zoneClass} ${cell.par ? 'par-slot' : ''}" title="Row ${rIdx + 1}, Col ${cIdx + 1} · ¥${cell.price}${cell.par ? ' (Par slot)' : ''}">
                        <span class="cell-price">${cell.price}${cell.par ? 'P' : ''}</span>
                        <div class="cell-tokens">
                          ${tokens
                            .map(
                              (cid) =>
                                `<b data-market-corporation="${cid}" class="cell-token" style="background:${CORP_META[cid]?.color || '#c9a236'};color:${CORP_META[cid]?.text || '#fff'}">${cid}</b>`
                            )
                            .join('')}
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>`
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function renderPrivateCardsGrid(appState, viewData, interactive = true) {
  const state = viewData.state;
  const ctx = getAuctionContext(appState, viewData);
  const {
    privates,
    isRunoff,
    offeredId,
    offeredDiscount,
    selectedPriv,
  } = ctx;

  return `
    <div class="meiji-privates-card-grid privates-grid">
      ${privates
        .map((p, idx) => {
          const ownerName = p.owner
            ? state.players?.[p.owner]?.name ||
              state.corporations?.[p.owner]?.name ||
              p.owner
            : null;
          const bids = state.auction?.bids?.[p.id] || {};
          const bidEntries = Object.entries(bids);
          const highOnP = bidEntries.reduce((m, [, v]) => Math.max(m, v), 0);
          const minNextBidOnP = Math.max(p.value, highOnP) + 5;
          const bidSummary = bidEntries
            .map(([pid, amt]) => `${state.players?.[pid]?.name || pid}: ¥${amt}`)
            .join(', ');
          const isCurrOffered = state.round === 'auction' && p.id === offeredId;
          const pOfferPrice =
            p.value - (p.id === 'TR' ? offeredDiscount : 0);

          return renderVintagePrivateCard(p, {
            index: idx,
            isSelected: selectedPriv?.id === p.id,
            isOffered: isCurrOffered,
            isRunoff: isCurrOffered && isRunoff,
            offerPrice: pOfferPrice,
            ownerName,
            highBid: highOnP,
            minNextBid: minNextBidOnP,
            bidSummary,
            inAuction: state.round === 'auction',
            interactive,
          });
        })
        .join('')}
    </div>
  `;
}

function renderPrivateAuctionSection(appState, viewData) {
  const state = viewData.state;
  const ctx = getAuctionContext(appState, viewData);
  const {
    privates,
    isRunoff,
    runoffBidders,
    offeredId,
    offeredPriv,
    offeredPrice,
    selectedPriv,
    highestBid,
    highestBidderName,
  } = ctx;

  if (!privates.length || !selectedPriv) return '';

  const runoffBanner =
    state.round === 'auction' && isRunoff
      ? (() => {
          const bidderList = runoffBidders
            .map((pid) => {
              const name = state.players?.[pid]?.name || pid;
              const amt = state.auction?.bids?.[offeredId]?.[pid] || 0;
              return `${name} (¥${amt})`;
            })
            .join(' vs. ');
          return `
            <div class="meiji-runoff-strip" role="status">
              <span class="guide-pill">🔥 COMPETITIVE BIDOFF</span>
              <b>${offeredId} · ${offeredPriv?.name || offeredId}</b>
              <span>Contenders: ${bidderList} · High Bid: <b>${money(highestBid)}</b> (${highestBidderName || '—'})</span>
            </div>
          `;
        })()
      : '';

  return `
    <div class="meiji-privates-board auction-panel-card">
      <header class="meiji-privates-board-header">
        <div class="meiji-briefcase-seal" aria-hidden="true">
          <svg viewBox="0 0 28 24">
            <rect x="2" y="6" width="24" height="16" rx="2.5" fill="#d8a24a" stroke="#472810" stroke-width="1.6"/>
            <path d="M9 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" fill="none" stroke="#f3cf82" stroke-width="1.8"/>
            <line x1="2" y1="12" x2="26" y2="12" stroke="#5e3616" stroke-width="1.6"/>
            <rect x="11.5" y="10" width="5" height="4" rx="1" fill="#fff0bd" stroke="#472810" stroke-width="1.1"/>
          </svg>
        </div>
        <div class="meiji-privates-board-titles">
          <h3>Private Companies <small>私有鉄道</small></h3>
          <p>
            <span>${
              state.round === 'auction'
                ? 'Companies are offered on block in the order shown below.'
                : 'Private railway & ferry concessions held by investors and corporations.'
            }</span>
            <small>${
              state.round === 'auction'
                ? '下記の順番で入札が行われます。'
                : '各社・投資家が保有する私有鉄道一覧'
            }</small>
          </p>
        </div>
        ${
          offeredId && state.round === 'auction'
            ? `<div class="meiji-onblock-pill">
                <span>${isRunoff ? 'RUNOFF:' : 'ON BLOCK:'}</span>
                <b>${offeredId} · ${money(isRunoff ? highestBid : offeredPrice)}</b>
              </div>`
            : ''
        }
      </header>
      ${runoffBanner}
      ${renderPrivateCardsGrid(appState, viewData, true)}
    </div>
  `;
}

function renderMeijiBiddingPanel(appState, viewData, certCounts, certLimit) {
  const state = viewData.state;
  const ctx = getAuctionContext(appState, viewData);
  const {
    unsold,
    isHistorical,
    viewerId,
    activePlayerId,
    activePlayer,
    isAuctionTurn,
    isRunoff,
    offeredId,
    offeredDiscount,
    offeredPrice,
    selectedPriv,
    bidsOnSelected,
    highestBid,
    isOffered,
    minBidPrice,
    currentBidInput,
    canBuyOffered,
    canBidSelected,
    mustTakeFreeTR,
    canPassAuction,
    totalEscrow,
  } = ctx;

  if (!selectedPriv) return '';

  const selectedOwnerName = selectedPriv.owner
    ? state.players?.[selectedPriv.owner]?.name ||
      state.corporations?.[selectedPriv.owner]?.name ||
      selectedPriv.owner
    : null;
  const bidEntries = Object.entries(bidsOnSelected);
  const bidSummary = bidEntries
    .map(([pid, amt]) => `${state.players?.[pid]?.name || pid}: ¥${amt}`)
    .join(', ');
  const activeSeatIndex = Math.max(
    0,
    (state.player_order || []).indexOf(activePlayerId)
  );
  const laterUnsold = unsold.filter((p) => p.id !== offeredId);
  const firstLaterUnsold = laterUnsold[0] || null;

  const displayBidBoxAmount = isOffered ? offeredPrice : currentBidInput;
  const ownEscrow = Object.values(state.auction?.bids || {}).reduce((sum, bids) => sum + (bids[viewerId] || 0), 0);
  const ownBid = bidsOnSelected[viewerId] || 0;
  const additional = isOffered ? offeredPrice : Math.max(0, currentBidInput - ownBid);

  return `
    <aside class="meiji-bidding-panel auction-ticket-panel" aria-label="Bidding and Information">
      <header class="meiji-bidding-header">
        <span class="bidding-gavel-icon" aria-hidden="true">🔨</span>
        <h3>Bidding &amp; Information <small>入札・情報</small></h3>
      </header>

      <div class="auction-reference-scroll">
      <details class="bidding-preview-card-wrap"><summary>Selected certificate details</summary>
        ${renderVintagePrivateCard(selectedPriv, {
          index: 0,
          isSelected: false,
          isOffered: selectedPriv.id === offeredId && state.round === 'auction',
          isRunoff: selectedPriv.id === offeredId && isRunoff,
          offerPrice:
            selectedPriv.value -
            (selectedPriv.id === 'TR' ? offeredDiscount : 0),
          ownerName: selectedOwnerName,
          highBid: highestBid,
          minNextBid: minBidPrice,
          bidSummary,
          inAuction: state.round === 'auction',
          interactive: false,
          compact: true,
        })}
      </details>

      <div class="meiji-bidding-ledger">
        <div class="meiji-escrow-bar">
          <div class="bar-labels">
            <strong>All players' escrow</strong>
            <small>エスクロー合計</small>
          </div>
          <b class="bar-value">${money(totalEscrow)}</b>
        </div>

        <div class="meiji-current-bid-bar">
          <div class="bar-labels">
            <strong>${isOffered ? 'Current Offer' : isRunoff ? 'Runoff Bid' : `Bid on ${selectedPriv.id}`}</strong>
            <small>${isOffered ? '現在の提示額' : '現在の入札額'}</small>
          </div>
          <div class="bid-amount-cluster">
            ${
              isAuctionTurn && !isOffered && !selectedPriv.owner
                ? `<div class="bid-stepper meiji-inline-stepper">
                    <button type="button" data-bid-step="-5" aria-label="Decrease bid">−¥5</button>
                    <button type="button" data-bid-step="5" aria-label="Increase bid">+¥5</button>
                  </div>`
                : ''
            }
            <b class="current-bid-figure">${money(displayBidBoxAmount)}</b>
          </div>
        </div>

        <div class="meiji-active-player-box">
          <div class="ap-header-row">
            <strong>${viewerId ? 'Your Position · 自分の資金' : 'Active Player · 現在の手番'}</strong>
            <small>Turn: ${escapeHtml(activePlayer?.name || 'Complete')} (${(activePlayerId || 'p1').toUpperCase()})</small>
          </div>
          <div class="ap-card-row">
            <div class="stock-player-portrait custom-portrait ap-mini-portrait">${renderCharacter(viewData.members?.[viewerId || activePlayerId]?.appearance,{memberId:viewData.members?.[viewerId || activePlayerId]?.member_id || viewerId || activePlayerId,name:viewerId ? state.players[viewerId]?.name : activePlayer?.name,surface:'portrait'})}</div>
            <strong class="ap-name">${viewerId ? `${escapeHtml(state.players[viewerId]?.name || viewerId)} (${viewerId.toUpperCase()})` : `${escapeHtml(activePlayer?.name || 'Complete')} (${(activePlayerId || 'p1').toUpperCase()})`}</strong>
            <b class="ap-cash">${money(viewerId ? state.players[viewerId]?.cash || 0 : activePlayer?.cash || 0)}</b>
          </div>
        </div>
      </div>

      <div class="auction-commitment" aria-label="Auction commitment">
        <div class="consequence-preview-grid auction-consequence-grid">
          <div class="consequence-cell ${viewerId && (state.players[viewerId]?.cash || 0) < additional ? 'is-deficit' : ''}">
            <span class="consequence-label">1. Cash Impact</span>
            <strong class="consequence-delta">${money(viewerId ? state.players[viewerId]?.cash || 0 : activePlayer?.cash || 0)}${isAuctionTurn ? ` → <b>${money((state.players[viewerId]?.cash || 0) - additional)}</b>` : ''}</strong>
            <small>${isAuctionTurn ? `Additional: −${money(additional)}` : 'Active turn cash'}</small>
          </div>
          <div class="consequence-cell">
            <span class="consequence-label">2. Your Escrow</span>
            <strong class="consequence-delta">${money(ownEscrow)}${isAuctionTurn && !isOffered ? ` → <b>${money(ownEscrow + additional)}</b>` : ''}</strong>
            <small>On ${selectedPriv.id}: ${money(ownBid)}${isAuctionTurn && !isOffered ? ` → ${money(currentBidInput)}` : ''}</small>
          </div>
          <div class="consequence-cell">
            <span class="consequence-label">3. Certificates</span>
            <strong class="consequence-delta">${certCounts[viewerId || activePlayerId] || 0} → ${(certCounts[viewerId || activePlayerId] || 0) + 1} / ${certLimit}</strong>
            <small>Private ${selectedPriv.id} (+¥${selectedPriv.revenue}/OR)</small>
          </div>
          <div class="consequence-cell">
            <span class="consequence-label">4. On Block / Min</span>
            <strong class="consequence-delta">${offeredId} · ${money(offeredPrice)}</strong>
            <small>${isOffered ? 'Buy immediately' : `Min bid ${money(minBidPrice)} (+¥5)`}</small>
          </div>
        </div>
        <p><b>${isRunoff ? 'Runoff' : 'On offer'}:</b> Private ${offeredId} · ${money(offeredPrice)}${isRunoff ? ` · High bid ${money(highestBid)}` : ''} · <b>Inspecting:</b> Private ${selectedPriv.id} · ${escapeHtml(selectedPriv.name)}</p>
        ${viewerId ? `<p class="sr-only-ledger-line">Your available cash: <b>${money(state.players[viewerId]?.cash || 0)}</b> · Your total escrow: ${money(ownEscrow)} · Your bid on ${selectedPriv.id}: ${money(ownBid)}${isAuctionTurn ? ` · Additional commitment: <b>${money(additional)}</b>` : ''}</p>` : `<p>Observer · inspecting ${escapeHtml(activePlayer?.name || 'the active player')}'s turn (${money(activePlayer?.cash || 0)} cash). Only the active player can commit.</p>`}
        ${isHistorical ? '<p>🔒 Historical game state · bids and purchases are read-only.</p>' : !isAuctionTurn ? `<p>Current Player: <b>${escapeHtml(activePlayer?.name || 'the active player')}</b> (${money(activePlayer?.cash || 0)} cash). Bidding controls appear on your turn.</p>` : !canPassAuction ? '<p>Pass unavailable: the offered company must be taken, or you are the last runoff bidder.</p>' : '<p>Bid increment: ¥5. Selecting a company does not place a bid.</p>'}
      </div>
      </div>
      ${
        isAuctionTurn
          ? `<div class="meiji-bidding-actions">
        ${
          !isOffered && !selectedPriv.owner
            ? `<button
                type="button"
                class="meiji-action-btn meiji-btn-bid"
                data-auction-action="bid"
                data-company="${selectedPriv.id}"
                data-price="${currentBidInput}"
                ${canBidSelected ? '' : 'disabled'}
              >
                <span class="btn-icon" aria-hidden="true">🔨</span>
                <span class="btn-copy">
                  <strong>${isRunoff ? `Raise Bid on ${selectedPriv.id}` : `Place Bid on ${selectedPriv.id}`} (${money(currentBidInput)})</strong>
                  <small>入札する (${money(currentBidInput)})</small>
                </span>
              </button>`
            : firstLaterUnsold
              ? `<button
                  type="button"
                  class="meiji-action-btn meiji-btn-bid"
                  data-select-private="${firstLaterUnsold.id}"
                  title="Select ${firstLaterUnsold.name} (${firstLaterUnsold.id}) to place an escrowed bid (+¥5)"
                >
                  <span class="btn-icon" aria-hidden="true">🔨</span>
                  <span class="btn-copy">
                    <strong>Inspect ${firstLaterUnsold.id} to prepare a bid</strong>
                    <small>会社を選択 · No bid submitted</small>
                  </span>
                </button>`
              : `<button type="button" class="meiji-action-btn meiji-btn-bid" disabled>
                  <span class="btn-icon" aria-hidden="true">🔨</span>
                  <span class="btn-copy">
                    <strong>Place Bid (+¥5)</strong>
                    <small>入札する (+¥5)</small>
                  </span>
                </button>`
        }

        <button
          type="button"
          class="meiji-action-btn meiji-btn-buy"
          data-auction-action="buy_offered"
          data-company="${offeredId || 'TR'}"
          data-price="${offeredPrice}"
          ${canBuyOffered ? '' : 'disabled'}
        >
          <span class="btn-icon" aria-hidden="true">🏷️</span>
          <span class="btn-copy">
            <strong>Buy ${offeredId && selectedPriv.id !== offeredId ? `${offeredId} ` : ''}Now for ${money(offeredPrice)}</strong>
            <small>今すぐ購入 (${offeredId || 'TR'} · ${money(offeredPrice)})</small>
          </span>
        </button>

        <button
          type="button"
          class="meiji-action-btn meiji-btn-pass"
          data-auction-action="pass"
          ${canPassAuction ? '' : 'disabled'}
        >
          <span class="btn-icon" aria-hidden="true">✕</span>
          <span class="btn-copy">
            <strong>${mustTakeFreeTR ? 'Must Accept Free TR (¥0)' : isRunoff ? 'Pass & Drop Out' : 'Pass'}</strong>
            <small>パス</small>
          </span>
        </button>
      </div>`
          : `<div class="meiji-bidding-actions is-observing-turn">
        <p class="inspection-only">
          ${
            isHistorical
              ? `Historical revision ${appState.viewRevision} · auction inspection only.`
              : `Current Player: ${escapeHtml(activePlayer?.name || activePlayerId || 'Complete')}. Waiting for their auction decision.`
          }
        </p>
      </div>`
      }
    </aside>
  `;
}

function renderAuctionPlayerStrip(appState, viewData, certCounts, certLimit) {
  const state = viewData.state;
  const viewerId = viewData.viewer?.player_id;

  return `
    <section class="meiji-auction-player-strip" aria-label="Seated club members in the Private Railway Auction">
      ${state.player_order
        .map((pid, index) => {
          const player = state.players[pid];
          const isActive = state.current_player === pid;
          const isViewer = viewerId === pid;
          const isPriority = state.priority === pid;

          const ownedPrivs = Object.values(state.privates || {}).filter(
            (pr) => pr.owner === pid && !pr.closed
          );
          const activeBids = Object.entries(state.auction?.bids || {})
            .filter(([, bmap]) => (bmap?.[pid] || 0) > 0)
            .map(([privId, bmap]) => `Bid:${privId} ¥${bmap[pid]}`);

          return `
            <button type="button" class="meiji-player-card ${isActive ? 'active' : ''} ${isViewer ? 'is-viewer' : ''}" data-player-details="${pid}" title="Inspect ${player.name}'s position (${pid.toUpperCase()})">
              <div class="stock-player-portrait custom-portrait portrait-${index}">${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:player.name,surface:"portrait"})}</div>
              <div class="meiji-player-body">
                <div class="mp-top-row">
                  <strong>${player.name}</strong>
                  <div class="mp-cash-cluster">
                    <b>${money(player.cash)}</b>
                    <i class="mp-status-dot ${isActive ? 'dot-active' : 'dot-idle'}" title="Seated member"></i>
                  </div>
                </div>
                <div class="mp-bottom-row">
                  <span class="mp-certs-meta">
                    <svg viewBox="0 0 16 14" aria-hidden="true" class="mp-mini-case"><rect x="1" y="3" width="14" height="10" rx="1.5" fill="#7a5835"/><path d="M5 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" fill="none" stroke="#7a5835" stroke-width="1.3"/></svg>
                    ${certCounts[pid] || 0}/${certLimit} certs${isPriority ? ' · PD' : ''}${ownedPrivs.length ? ` · ${ownedPrivs.map((p) => `P·${p.id}`).join(' ')}` : ''}${activeBids.length ? ` · ${activeBids.join(' ')}` : ''}
                  </span>
                  ${
                    isActive
                      ? `<em class="mp-turn-badge">${isViewer ? 'YOUR TURN' : 'ACTIVE TURN'}</em>`
                      : isViewer
                        ? '<em class="mp-you-badge">YOU</em>'
                        : ''
                  }
                </div>
              </div>
            </button>
          `;
        })
        .join('')}
    </section>
  `;
}

export function renderUnifiedPlayerAndTurnStrip(appState, viewData, certCounts, certLimit, isViewerActiveTurn) {
  const state = viewData.state;
  const viewerId = viewData.viewer?.player_id;
  const activePlayer = state.players?.[state.current_player];
  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const latest = (viewData.history_events || []).filter((ev) => ev.revision <= state.revision).at(-1);
  const opensOperations = state.round === 'operating';
  const calloutTag = opensOperations ? 'button' : 'aside';

  let statusTag = isViewerActiveTurn
    ? 'YOUR DECISION'
    : isHistorical
      ? `REPLAY REV ${appState.viewRevision}`
      : `${activePlayer?.name || 'TABLE'}'S TURN`;
  let instruction = 'Select a corporation to inspect or trade.';
  if (opensOperations) {
    statusTag = isHistorical ? `REPLAY REV ${appState.viewRevision}` : 'OPERATING ROUND';
    instruction = isHistorical
      ? 'Historical operating position — inspect on the map.'
      : `${activePlayer?.name || 'The president'} is operating ${state.current_corporation || 'a railway'}. Open the map.`;
  } else if (isHistorical) {
    instruction = 'Read-only historical snapshot. Return to live to act.';
  } else if (state.round === 'auction') {
    const ctx = getAuctionContext(appState, viewData);
    statusTag = isViewerActiveTurn
      ? ctx.isRunoff
        ? 'YOUR RUNOFF BID'
        : 'YOUR AUCTION TURN'
      : `${activePlayer?.name || 'TABLE'}'S AUCTION TURN`;
    if (ctx.isRunoff) {
      instruction = isViewerActiveTurn
        ? `Competitive Bidoff on ${ctx.offeredId}: Raise bid to ≥${money(ctx.minBidPrice)} or Pass to drop out.`
        : `Competitive Bidoff on ${ctx.offeredId} (High ${money(ctx.highestBid)}): Waiting for ${activePlayer?.name} to raise or pass.`;
    } else {
      const laterList = ctx.unsold
        .filter((p) => p.id !== ctx.offeredId)
        .map((p) => p.id)
        .join(', ');
      instruction = isViewerActiveTurn
        ? `Buy offered ${ctx.offeredId} (${money(ctx.offeredPrice)}), click a later private (${laterList || 'none'}) to bid, or Pass.`
        : `Waiting for ${activePlayer?.name || state.current_player} to buy ${ctx.offeredId} (${money(ctx.offeredPrice)}), bid, or pass.`;
    }
  } else if (state.round !== 'stock') {
    instruction = `Currently in ${state.round.toUpperCase()} round.`;
  } else if (isViewerActiveTurn) {
    instruction = state.stock_turn?.bought
      ? 'Purchase complete — click Finish Turn on the ticket.'
      : 'Choose a corporation & stock action, or pass.';
  } else {
    instruction = `Waiting for ${activePlayer?.name || state.current_player} to act.`;
  }

  return `
    <section class="stock-player-strip" aria-label="Seated club members and turn status">
      <div class="stock-player-cards">
        ${state.player_order
          .map((pid, index) => {
            const player = state.players[pid];
            const isActive = state.current_player === pid;
            const isViewer = viewerId === pid;
            const isPriority = state.priority === pid;
            const holdings = Object.entries(state.corporations || {})
              .filter(([, corp]) => (corp.holdings?.[pid] || 0) > 0)
              .map(
                ([cid, corp]) =>
                  `<span style="--corp:${CORP_META[cid]?.color || '#8e7650'}" title="${cid}: ${corp.holdings[pid]}%${corp.president === pid ? ' (President)' : ''}"><b>${cid}</b> ${corp.holdings[pid]}%${corp.president === pid ? '★' : ''}</span>`
              )
              .join('');
            const ownedPrivs = Object.values(state.privates || {}).filter(
              (pr) => pr.owner === pid && !pr.closed
            );
            const privCount = ownedPrivs.length;
            const privHoldings = ownedPrivs
              .map(
                (pr) =>
                  `<span style="--corp:#7c562b" title="Private ${pr.id}: ${pr.name} (Revenue ¥${pr.revenue}/OR)"><b>P·${pr.id}</b>¥${pr.revenue}</span>`
              )
              .join('');
            const activeBids = Object.entries(state.auction?.bids || {})
              .filter(([, bmap]) => (bmap?.[pid] || 0) > 0)
              .map(
                ([privId, bmap]) =>
                  `<span style="--corp:#3c6478" title="Escrowed bid on ${privId}: ¥${bmap[pid]}"><b>Bid:${privId}</b>¥${bmap[pid]}</span>`
              )
              .join('');
            const combinedBadges = holdings + privHoldings + activeBids;

            return `
              <button type="button" class="stock-player-card ${isActive ? 'active' : ''} ${isViewer ? 'is-viewer' : ''}" data-player-details="${pid}" title="Inspect ${player.name}'s position (${pid.toUpperCase()})">
                <div class="stock-player-portrait custom-portrait portrait-${index}">${renderCharacter(viewData.members?.[pid]?.appearance,{memberId:viewData.members?.[pid]?.member_id || pid,name:player.name,surface:"portrait"})}</div>
                <div class="stock-player-data">
                  <div class="sp-top-row">
                    <strong>${player.name}</strong>
                    <b>${money(player.cash)}</b>
                  </div>
                  <div class="sp-meta-row">
                    <small>${certCounts[pid] || 0}/${certLimit} certs${privCount ? ` · ${privCount} priv` : ''}${isPriority ? ' · PD' : ''}</small>
                    ${
                      isActive
                        ? `<em class="sp-turn-pill">${isViewer ? 'YOUR TURN' : 'TURN'}</em>`
                        : isViewer
                          ? '<em class="sp-you-pill">YOU</em>'
                          : ''
                    }
                  </div>
                  <div class="stock-player-holdings">${combinedBadges || '<small class="no-sh-label">No certificates or bids yet</small>'}</div>
                </div>
                <i class="stock-presence" title="Seated member"></i>
              </button>
            `;
          })
          .join('')}
      </div>

      <${calloutTag} class="stock-turn-callout ${opensOperations ? 'is-room-link' : ''} ${isViewerActiveTurn && !opensOperations ? 'is-my-turn' : ''} ${isHistorical ? 'is-history' : ''}" ${opensOperations ? 'type="button" data-view="map" aria-label="Open Map &amp; Operations" title="Open Map &amp; Operations at the currently viewed revision"' : ''}>
        <span class="callout-top">
          <span class="callout-badge">${statusTag}</span>
          <span class="callout-bank">Phase <b>${state.phase}</b> · Bank <b>${money(state.bank)}</b></span>
        </span>
        <strong class="callout-instruction">${instruction}</strong>
        <span class="callout-latest" title="${latest?.label || 'The gathering begins'}">
          <small>REV ${state.revision}:</small>
          <span>${latest?.label || 'The gathering begins'}</span>
          ${opensOperations ? '<span class="callout-open" aria-hidden="true">Open Operations →</span>' : ''}
        </span>
      </${calloutTag}>
    </section>
  `;
}

function renderFocusedActivity(viewData, selectedCid) {
  const events = (viewData.history_events || []).filter((ev) => ev.revision <= viewData.state.revision).slice().reverse().slice(0, 8);
  return `
    <section class="focused-activity-card">
      <header><div><div class="section-label">AT THE TABLE · テーブルの様子</div><h3>Recent player activity</h3></div><span>Latest ${events.length} moves (up to Rev ${viewData.state.revision})</span></header>
      <div class="focused-activity-list">
        ${events
          .map(
            (event) => `<article>
          <i>${event.actor_name?.slice(0, 1) || '•'}</i>
          <div><b>${event.actor_name || 'System'} <small>Rev ${event.revision}</small></b><p>${event.label}</p></div>
        </article>`
          )
          .join('')}
      </div>
    </section>`;
}

function renderCorporationGeography(state, selectedCid, meta) {
  const corp = state.corporations[selectedCid];
  const stations = [];
  for (const [coord, hexObj] of Object.entries(state.board || {})) {
    if ((hexObj.tokens || []).some((slots) => (slots || []).includes(selectedCid))) {
      stations.push({ coord, name: HEX_NAMES[coord] || coord });
    }
  }
  const stationText = stations.length
    ? stations.map((s) => `${s.name || s.coord} (${s.coord})`).join(' · ')
    : 'No stations placed yet (Home reserved at ' +
      `${meta.homeName || corp.home} ${corp.home})`;

  return `
    <section class="company-map-card">
      <header>
        <div>
          <div class="section-label">CORPORATION GEOGRAPHY · ${selectedCid}</div>
          <h3>${corp.name} around ${meta.homeName || corp.home} (${corp.home})</h3>
        </div>
        <button class="map-link-button" data-company-map="${selectedCid}" data-home-hex="${corp.home}">Open Interactive Map ↗</button>
      </header>
      <div class="company-map-preview">
        ${renderCorporationMapPreview(state, selectedCid)}
        <div class="map-preview-legend">
          <span><i class="legend-home"></i> Home: ${meta.homeName || corp.home} (${corp.home})</span>
          <span><i class="legend-station"></i> ${selectedCid} station</span>
          <span><i class="legend-other"></i> Other station</span>
        </div>
      </div>
      <p><b>Placed stations:</b> ${stationText}</p>
    </section>`;
}

function renderCorporationDetails(state, selectedCid, meta, prices, perspectiveId) {
  const corp = state.corporations[selectedCid];
  const president = corp.president
    ? state.players?.[corp.president]?.name || corp.president
    : 'Unparred';
  return `
    <section class="company-details-card" style="--corp:${meta.color}">
      <header><span>${selectedCid}</span><div><div class="section-label">SELECTED CORPORATION</div><h3>${corp.name}</h3><small>${meta.jp || ''} · Home ${corp.home} (${meta.homeName || corp.home})</small></div></header>
      <dl>
        <div><dt>Current Market Price</dt><dd>${prices[selectedCid] ? money(prices[selectedCid]) : 'Unparred'}</dd></div>
        <div><dt>Par Price</dt><dd>${corp.par ? money(corp.par) : 'Not set (¥65–¥100)'}</dd></div>
        <div><dt>IPO / Bank Pool</dt><dd>${corp.ipo}% IPO · ${corp.pool}% Pool</dd></div>
        <div><dt>President</dt><dd>${president}</dd></div>
        <div><dt>${escapeHtml(state.players[perspectiveId]?.name || 'Inspected player')}'s holdings</dt><dd>${corp.holdings?.[perspectiveId] || 0}% (${(corp.holdings?.[perspectiveId] || 0) / 10} share units)</dd></div>
        <div><dt>Float & Treasury</dt><dd>${corp.floated ? `Floated · ${money(corp.cash)}` : `Needs ${Math.max(0, 50 - (100 - corp.ipo))}% more from IPO`}</dd></div>
        <div><dt>Stations remaining</dt><dd>${corp.token_supply} total (${corp.home_placed ? 'Home placed' : 'Home reserved'})</dd></div>
        <div><dt>Owned Trains</dt><dd>${corp.trains?.length ? corp.trains.join(', ') : 'None'}</dd></div>
      </dl>
    </section>`;
}

function renderCorporationTable(state, prices, perspectiveId, perspectivePlayer, selectedCid, viewData) {
  const latestCorporation =
    viewData.last_event?.corporation ||
    (viewData.history_events || []).at(-1)?.event?.corporation;

  return `
    <div class="market-board corporation-primary-table">
      <header>
        <span>Corporation <small class="keyboard-column-hint">↑↓ select</small></span>
        <span>Market / Par</span>
        <span>IPO / Pool</span>
        <span>Treasury / Status</span>
        <span>${escapeHtml(perspectivePlayer?.name || perspectiveId)}'s holding</span>
      </header>
      ${Object.keys(state.corporations)
        .map((cid) => {
          const c = state.corporations[cid];
          const m = CORP_META[cid] || {
            short: cid,
            name: c.name,
            color: '#c9a236',
            home: c.home,
            homeName: '',
          };
          const mktPrice = prices[cid] || 0;
          const holdPct = c.holdings?.[perspectiveId] || 0;
          const presName = c.president
            ? state.players?.[c.president]?.name || c.president
            : 'Unparred';

          return `
            <button class="market-company ${cid === selectedCid ? 'selected' : ''} ${latestCorporation === cid ? 'recently-changed' : ''}" data-company="${cid}" aria-pressed="${cid === selectedCid}" title="Select ${c.name} (${cid}) · Use ↑/↓ to move between corporations">
              <span class="corp-identity">
                <i style="--company:${m.color}"></i>
                <b>${cid}</b>
                <span>
                  <strong>${c.name}</strong>
                  <small>${m.jp || ''} · Home ${c.home} (${m.homeName})</small>
                </span>
              </span>
              <span class="corp-pricing">
                <strong>${mktPrice ? money(mktPrice) : 'Unparred'}</strong>
                <small>${c.par ? `Par ${money(c.par)}` : 'Set Par (¥65–100)'}</small>
              </span>
              <span class="corp-supply">
                <em>IPO: ${c.ipo}%</em>
                <small>Pool: ${c.pool}%</small>
              </span>
              <span class="corp-status">
                <em class="${c.floated ? 'floated-tag' : 'unfloated-tag'}">${
                  c.floated
                    ? `Floated · ${money(c.cash)}`
                    : `Needs ${Math.max(0, 50 - (100 - c.ipo))}% to float`
                }</em>
                <small>Pres: ${presName}${c.trains?.length ? `<span class="corp-fleet">Trains: ${c.trains.join(', ')}</span>` : ''}</small>
              </span>
              <span class="corp-holding">
                <strong>${holdPct}% (${holdPct / 10} sh)</strong>
                ${c.president === perspectiveId ? '<small class="pres-seal">★ President</small>' : ''}
              </span>
            </button>
          `;
        })
        .join('')}
    </div>`;
}

const BASE_STOCK_WINDOW_DEFS = [
  ['corporations', 'Corporations', '会社一覧'],
  ['ledger', 'Market Ledger', '株価ボード'],
  ['geography', 'Company Map', '路線図'],
  ['details', 'Details & Activity', '会社情報'],
];

const AUCTION_TAB_DEF = ['privates', 'Private Auction', '私有鉄道入札'];

export function getVisibleStockWindowDefs(state) {
  // The Private Auction tab only shows up during the opening auction round
  if (state?.round === 'auction') {
    return [...BASE_STOCK_WINDOW_DEFS, AUCTION_TAB_DEF];
  }
  return BASE_STOCK_WINDOW_DEFS;
}

function renderStockWindowIcon(id) {
  const paths = {
    corporations: '<rect x="3" y="7" width="14" height="11" fill="#d9b35e"/><rect x="6" y="3" width="8" height="4" fill="#eee0aa"/><path d="M6 10h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM6 14h2v2H6zm4 0h2v4h-2zm4 0h2v2h-2z" fill="#315174"/>',
    ledger: '<rect x="2" y="3" width="16" height="15" fill="#f0d99c"/><path d="M5 6h10v2H5zm0 4h3v5H5zm5 2h2v3h-2zm4-4h2v7h-2z" fill="#295b7a"/><path d="M4 17h13" stroke="#75431f" stroke-width="1"/>',
    geography: '<path d="M2 4l5-2 6 2 5-2v14l-5 2-6-2-5 2z" fill="#d4c37e"/><path d="M7 2v14m6-12v14" stroke="#72562b"/><path d="M4 13l3-4 4 2 4-5 2 3" fill="none" stroke="#367357" stroke-width="2"/>',
    details: '<rect x="3" y="2" width="14" height="16" fill="#eee2b9"/><rect x="5" y="5" width="4" height="4" fill="#b8623d"/><path d="M11 5h4M11 8h4M5 12h10M5 15h8" stroke="#38546d" stroke-width="1.5"/>',
    privates: '<path d="M2 7h16v10H2z" fill="#b77b37"/><path d="M6 4h8v3H6z" fill="#e1b96a"/><path d="M2 10h16" stroke="#5d351b" stroke-width="2"/><rect x="9" y="9" width="3" height="3" fill="#f3d98b"/>',
  };
  return `<svg viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges">${paths[id] || paths.details}</svg>`;
}

function computeAutoTileSlotStyle(slotIndex, totalOpen) {
  if (totalOpen <= 1) {
    return 'left:0.4%;top:0.8%;width:99.2%;height:98.4%';
  }
  if (totalOpen === 2) {
    return slotIndex === 0
      ? 'left:0.4%;top:0.8%;width:55.4%;height:98.4%'
      : 'left:56.4%;top:0.8%;width:43.2%;height:98.4%';
  }
  if (totalOpen === 3) {
    if (slotIndex === 0) return 'left:0.4%;top:0.8%;width:54.4%;height:98.4%';
    if (slotIndex === 1) return 'left:55.4%;top:0.8%;width:44.2%;height:48.6%';
    return 'left:55.4%;top:50.6%;width:44.2%;height:48.6%';
  }
  const col = slotIndex % 2;
  const row = Math.floor(slotIndex / 2) % 2;
  const left = col === 0 ? '0.4%' : '50.2%';
  const top = row === 0 ? '0.8%' : '50.4%';
  return `left:${left};top:${top};width:49.4%;height:48.8%`;
}

function renderStockDesktopWindow(id, title, jp, content, appState, topZ, slotIndex, totalOpen) {
  const windowState = appState.stockWindows?.[id];
  if (!windowState?.open) return '';
  const hasCustomGeom =
    Number.isFinite(windowState.x) ||
    Number.isFinite(windowState.y) ||
    Number.isFinite(windowState.w) ||
    Number.isFinite(windowState.h);
  const isMaximized = Boolean(
    windowState.maximized ||
      (totalOpen === 1 && !hasCustomGeom && !windowState.floating)
  );

  const styles = [`z-index:${windowState.z || 1}`];
  if (isMaximized) {
    styles.push('left:0.4%;top:0.8%;width:99.2%;height:98.4%');
  } else if (hasCustomGeom) {
    if (Number.isFinite(windowState.x)) styles.push(`left:${windowState.x}px`, 'right:auto');
    if (Number.isFinite(windowState.y)) styles.push(`top:${windowState.y}px`);
    if (Number.isFinite(windowState.w)) styles.push(`width:${windowState.w}px`);
    if (Number.isFinite(windowState.h)) styles.push(`height:${windowState.h}px`);
  } else if (windowState.floating && totalOpen === 1) {
    styles.push('left:3%;top:4%;width:86%;height:88%');
  } else {
    styles.push(computeAutoTileSlotStyle(slotIndex, totalOpen));
  }

  const maxIcon = isMaximized ? '❐' : '□';
  const maxLabel = isMaximized ? `Restore ${title} size` : `Maximize ${title}`;

  return `
    <section class="stock-pop-window window-${id} ${windowState.z === topZ ? 'is-front' : ''} ${isMaximized ? 'is-maximized' : ''}" data-stock-window-shell="${id}" style="${styles.join(';')}" role="region" aria-label="${title}" tabindex="-1">
      <header class="stock-window-titlebar" data-stock-window-drag="${id}" title="Drag to move · Double-click to ${isMaximized ? 'restore' : 'maximize'}">
        <span class="stock-window-title-icon">${renderStockWindowIcon(id)}</span>
        <strong>${title}</strong>
        <small>${jp}</small>
        <div class="stock-window-controls">
          <button type="button" class="win-ctrl-btn win-max-btn" data-maximize-stock-window="${id}" aria-label="${maxLabel}" title="${maxLabel}">${maxIcon}</button>
          <button type="button" class="win-ctrl-btn win-close-btn" data-close-stock-window="${id}" aria-label="Close ${title}" title="Close ${title}">×</button>
        </div>
      </header>
      <div class="stock-window-body">${content}</div>
      <button type="button" class="stock-window-resize-grip" data-stock-window-resize="${id}" aria-label="Resize ${title}" title="Drag to resize ${title}; arrow keys resize when focused"></button>
    </section>`;
}

function renderMeijiBottomTabBar(visibleDefs, appState, topWindowZ, isAuctionTabActive) {
  return `
    <nav class="meiji-bottom-tabs" aria-label="Workspace Tabs">
      ${visibleDefs
        .map(([id, label, jp], index) => {
          const isOpen = Boolean(appState.stockWindows?.[id]?.open);
          const isActive =
            id === 'privates'
              ? isAuctionTabActive
              : !isAuctionTabActive && isOpen && appState.stockWindows[id]?.z === topWindowZ;
          return `
            <button
              type="button"
              class="meiji-bottom-tab ${isActive ? 'is-active-tab' : ''} ${id === 'privates' ? 'is-auction-tab' : ''}"
              data-stock-window="${id}"
              aria-pressed="${isActive}"
              title="Press ${index + 1} to switch to ${label}"
            >
              <kbd>${index + 1}</kbd>
              <span class="tab-copy">
                <b>${label}</b>
                <small>${jp}</small>
              </span>
            </button>
          `;
        })
        .join('')}
    </nav>
  `;
}

export function renderStockExchangeView(appState, viewData, catalog) {
  const state = viewData.state;
  const prices = viewData.prices || {};
  const certCounts = viewData.certificates || {};
  const certLimit = catalog?.certificate_limits?.[state.player_order.length] || 14;
  const viewerId = viewData.viewer?.player_id;
  const activePlayerId = state.current_player;
  const activePlayer = state.players?.[activePlayerId];
  const perspectiveId = viewerId || activePlayerId || 'p1';
  const perspectivePlayer = state.players?.[perspectiveId] || activePlayer;

  const isHistorical = appState.viewRevision !== appState.liveRevision;
  const isViewerActiveTurn =
    !isHistorical && !appState.isPlayingReplay && !appState.isSubmitting && !appState.isLoadingRevision &&
    viewerId &&
    state.current_player === viewerId;

  const visibleDefs = getVisibleStockWindowDefs(state);
  const openStockWindows = visibleDefs.filter(
    ([id]) => appState.stockWindows?.[id]?.open
  );
  const topWindowZ = Math.max(
    0,
    ...openStockWindows.map(([id]) => appState.stockWindows[id].z || 0)
  );

  // Determine whether the dedicated Private Auction tab is the active view:
  // It only shows up when state.round === 'auction' and 'privates' is the frontmost open tab
  const isAuctionTabActive =
    state.round === 'auction' &&
    Boolean(appState.stockWindows?.privates?.open) &&
    (appState.stockWindows.privates.z || 0) >= topWindowZ;

  if (isAuctionTabActive) {
    return `
      <section class="detail-view market-view meiji-auction-view" aria-label="Meiji Private Railway Auction">
        <div class="market-top-deck">
          <div class="exchange-title-cluster">
            <div class="section-label">SHIKOKU CONCESSIONS · PRIVATE AUCTION · REV ${state.revision}</div>
            <h2>Private Company Auction <small>私有鉄道入札会場</small></h2>
          </div>

          <nav class="stock-window-launcher cols-${visibleDefs.length}" aria-label="Stock Market information windows">
            ${visibleDefs
              .map(([id, label, jp], index) => {
                const isOpen = Boolean(appState.stockWindows?.[id]?.open);
                const isFront = isOpen && appState.stockWindows[id].z === topWindowZ;
                const isAuctionHighlight = state.round === 'auction' && id === 'privates';
                return `<button class="${isOpen ? 'is-open' : ''} ${isFront ? 'is-front' : ''} ${isAuctionHighlight ? 'auction-launcher-pulse' : ''}" data-stock-window="${id}" aria-pressed="${isOpen}" title="Press ${index + 1} to open, raise, or toggle ${label}">
                  <span>${renderStockWindowIcon(id)}</span><kbd>${index + 1}</kbd><b>${label}${isAuctionHighlight ? ' ●' : ''}</b><small>${jp}</small>
                </button>`;
              })
              .join('')}
            <button class="stock-tile-windows" data-tile-stock-windows title="Tile Corporations + Market Ledger side-by-side"><span>⊞</span><b>Split 2-Up</b></button>
            <button class="stock-tile-windows" data-reset-stock-windows title="Restore the initial layout"><b>Restore Layout</b></button>
          </nav>

          <div class="heading-actions">
            <button type="button" class="secondary-btn" data-view="map" title="Inspect 1889 Shikoku Map">Shikoku Map 🗺️</button>
            <button type="button" class="back-table-btn" data-view="table" title="Return directly to the Tabletop">Back to Table · テーブルへ戻る</button>
          </div>
        </div>

        ${renderAuctionPlayerStrip(appState, viewData, certCounts, certLimit)}

        <div class="meiji-auction-workspace">
          ${renderPrivateAuctionSection(appState, viewData)}
          ${renderMeijiBiddingPanel(appState, viewData, certCounts, certLimit)}
        </div>
      </section>
    `;
  }

  const selectedCid =
    appState.selectedCompanyId && state.corporations?.[appState.selectedCompanyId]
      ? appState.selectedCompanyId
      : 'IR';
  const corp = state.corporations[selectedCid];
  const meta = CORP_META[selectedCid] || {
    short: selectedCid,
    name: corp.name,
    color: '#c9a236',
    home: corp.home,
    homeName: corp.home,
  };

  const isUnparred = corp.par === null;
  const parChoices = catalog?.par_prices || [65, 70, 75, 80, 90, 100];
  const selectedPar = parChoices.includes(appState.selectedParPrice)
    ? appState.selectedParPrice
    : 80;

  const source =
    !isUnparred && appState.selectedSource === 'pool' && corp.pool >= 10
      ? 'pool'
      : 'ipo';
  const zone = viewData.market_zones?.[selectedCid] || '';
  const brown = zone === 'b';
  const repeatBuy = !state.stock_turn?.bought || (brown && state.stock_turn?.brown_company === selectedCid);
  const sharePercent = isUnparred ? 20 : brown ? Number(appState.buyPercent || 10) : 10;
  const sellPercent = Number(appState.sellPercent || 10);
  const options = viewData.action_options;
  const matches = (type, percent) => options?.some(a => a.type === type && a.corporation === selectedCid &&
    (type !== 'buy_shares' || (isUnparred ? a.price === selectedPar : a.source === source)) &&
    (isUnparred && type === 'buy_shares' || a.percent === percent));
  const unitPrice = isUnparred
    ? selectedPar
    : source === 'ipo'
      ? corp.par
      : prices[selectedCid] || corp.par;
  const totalCost = (sharePercent / 10) * unitPrice;

  const certificateDelta = ['y','o','b'].includes(zone) ? 0 : isUnparred ? 1 : sharePercent / 10;
  const alreadyBoughtThisTurn = Boolean(state.stock_turn?.bought);
  const soldThisRound = (state.sold?.[perspectiveId] || []).includes(selectedCid);
  const availInSource = isUnparred ? corp.ipo : corp[source];
  const playerCash = perspectivePlayer?.cash || 0;
  const playerHoldings = corp.holdings?.[perspectiveId] || 0;

  const canBuy =
    isViewerActiveTurn &&
    state.round === 'stock' &&
    repeatBuy &&
    !soldThisRound &&
    availInSource >= sharePercent &&
    playerCash >= totalCost &&
    (['y', 'o', 'b'].includes(zone) || (certCounts[perspectiveId] || 0) + sharePercent / 10 - Number(isUnparred) <= certLimit) &&
    (viewData.legal_actions?.types || []).includes('buy_shares') &&
    (['o', 'b'].includes(zone) || playerHoldings + sharePercent <= 60) &&
    (!options || matches('buy_shares', sharePercent));

  const canSellBlock =
    isViewerActiveTurn &&
    state.round === 'stock' &&
    state.stock_round > 1 &&
    !isUnparred &&
    playerHoldings >= sellPercent &&
    corp.pool + sellPercent <= 50 &&
    !(state.stock_turn?.sales || []).includes(selectedCid) &&
    (!options || matches('sell_shares', sellPercent));

  const canActInStockRound = Boolean(
    isViewerActiveTurn && state.round === 'stock'
  );

  const canExchangeDR =
    !isHistorical && !appState.isPlayingReplay &&
    state.privates?.DR?.owner === viewerId &&
    !state.privates?.DR?.closed &&
    (viewData.legal_actions?.types || []).includes('exchange_private');

  const salePreview=viewData.action_previews?.find(p=>p.action.type==='sell_shares' && p.action.corporation===selectedCid && p.action.percent===sellPercent);
  const canEndStockTurn =
    (!options || options.some(a=>a.type==='end_turn')) && canActInStockRound &&
    ((viewData.legal_actions?.types || []).includes('end_turn') ||
      (viewData.legal_actions?.types || []).includes('pass'));

  const stockWindowContent = {
    corporations: renderCorporationTable(
      state,
      prices,
      perspectiveId,
      perspectivePlayer,
      selectedCid,
      viewData
    ),
    ledger: render2DStockMarketGrid(state, catalog),
    geography: renderCorporationGeography(state, selectedCid, meta),
    details: `<div class="stock-details-tab-grid">
      ${renderCorporationDetails(state, selectedCid, meta, prices, perspectiveId)}
      ${renderFocusedActivity(viewData, selectedCid)}
    </div>`,
    privates: renderPrivateAuctionSection(appState, viewData),
  };

  let statusReason = '';
  if (isHistorical || appState.isPlayingReplay) {
    statusReason = `Viewing historical revision ${appState.viewRevision} (read-only). Return to live to act.`;
  } else if (!viewerId) {
    statusReason =
      `Observer · viewing ${perspectivePlayer?.name || 'the active player'}'s position. Only the active player can submit a move.`;
  } else if (state.round !== 'stock') {
    statusReason = `Game is currently in ${state.round.toUpperCase()} round.`;
  } else if (!isViewerActiveTurn) {
    statusReason = `Waiting for ${activePlayer?.name || activePlayerId}. You are inspecting ${perspectivePlayer?.name || perspectiveId}'s position.`;
  } else if (alreadyBoughtThisTurn && !repeatBuy) {
    statusReason =
      'Certificate purchased. Use the highlighted Finish Turn control to advance play.';
  } else if (soldThisRound) {
    statusReason = `You sold ${selectedCid} earlier this Stock Round and cannot repurchase it.`;
  } else if (availInSource < sharePercent) {
    statusReason = `Insufficient shares remaining in ${source.toUpperCase()}.`;
  } else if (playerCash < totalCost) {
    statusReason = `Insufficient cash (need ${money(totalCost)}, have ${money(playerCash)}).`;
  } else {
    statusReason = isUnparred
      ? `Purchase preview: one 20% President's certificate for ${money(totalCost)}. The server checks the move when submitted.`
      : `Purchase preview: ${sharePercent / 10} certificate(s), ${sharePercent}%, from ${source.toUpperCase()} for ${money(totalCost)}. The server checks the move when submitted.`;
  }

  return `
    <section class="detail-view market-view">
      <div class="market-top-deck">
        <div class="exchange-title-cluster">
          <div class="section-label">${
            state.round === 'auction'
              ? `SHIKOKU CONCESSIONS · PRIVATE AUCTION · REV ${state.revision}`
              : `SHIKOKU EXCHANGE · ${
                  state.round === 'stock'
                    ? `SR ${state.stock_round}`
                    : state.round.toUpperCase()
                } · REV ${state.revision}`
          }</div>
          <h2>Koenji Stock Exchange <small>高円寺株式取引所</small></h2>
        </div>

        <nav class="stock-window-launcher cols-${visibleDefs.length}" aria-label="Stock Market information windows">
          ${visibleDefs
            .map(([id, label, jp], index) => {
              const isOpen = Boolean(appState.stockWindows?.[id]?.open);
              const isFront = isOpen && appState.stockWindows[id].z === topWindowZ;
              const isAuctionHighlight = state.round === 'auction' && id === 'privates';
              return `<button class="${isOpen ? 'is-open' : ''} ${isFront ? 'is-front' : ''} ${isAuctionHighlight ? 'auction-launcher-pulse' : ''}" data-stock-window="${id}" aria-pressed="${isOpen}" title="Press ${index + 1} to open, raise, or toggle ${label}">
                <span>${renderStockWindowIcon(id)}</span><kbd>${index + 1}</kbd><b>${label}${isAuctionHighlight ? ' ●' : ''}</b><small>${jp}</small>
              </button>`;
            })
            .join('')}
          <button class="stock-tile-windows" data-tile-stock-windows title="Tile Corporations + Market Ledger side-by-side"><span>⊞</span><b>Split 2-Up</b></button>
          <button class="stock-tile-windows" data-reset-stock-windows title="Restore the initial Corporations layout"><b>Restore Layout</b></button>
        </nav>

        <div class="heading-actions">
          <button class="secondary-btn" data-view="map">Shikoku Map 🗺️</button>
          <button class="back-table-btn" data-view="table" title="Return directly to the Tabletop">Back to Table · テーブルへ戻る</button>
        </div>
      </div>

      ${renderUnifiedPlayerAndTurnStrip(appState, viewData, certCounts, certLimit, isViewerActiveTurn)}

      <div class="stock-dashboard">
        <main class="stock-window-desktop open-count-${openStockWindows.length}" aria-label="Draggable Stock Market information windows">
          ${
            openStockWindows.length
              ? openStockWindows
                  .map(([id, label, jp], idx) =>
                    renderStockDesktopWindow(
                      id,
                      label,
                      jp,
                      stockWindowContent[id],
                      appState,
                      topWindowZ,
                      idx,
                      openStockWindows.length
                    )
                  )
                  .join('')
              : '<div class="stock-desktop-empty"><b>No information windows are open.</b><span>Use the launcher buttons above or press keys 1–4.</span></div>'
          }
        </main>

        ${
          state.round === 'auction'
            ? renderMeijiBiddingPanel(appState, viewData, certCounts, certLimit)
            : canActInStockRound
              ? `
        <aside class="order-ticket stock-action-panel" aria-label="Stock action and transaction controls">
          <div class="ticket-cut"></div>
          <div class="ticket-corp-banner" style="--corp:${meta.color}">
            <span class="ticket-corp-badge">${selectedCid}</span>
            <div>
              <small class="ticket-kicker">SELECTED CORPORATION · 株式取引</small>
              <h3>${corp.name}</h3>
              <small>${meta.jp || ''} · Home: ${corp.home} (${meta.homeName})</small>
            </div>
          </div>

          <div class="stock-ticket-reference">
          ${
            alreadyBoughtThisTurn
              ? ''
              : isUnparred
                ? `
                <div class="par-selector-block">
                  <label>Par Price (President's 20% Share)</label>
                  <div class="par-buttons">
                    ${parChoices
                      .map(
                        (p) => `
                        <button class="par-btn ${selectedPar === p ? 'selected' : ''}" data-select-par="${p}">
                          ¥${p}
                        </button>`
                      )
                      .join('')}
                  </div>
                </div>
              `
                : `
                <div class="source-selector-block">
                  <label>Certificate Source</label>
                  <div class="source-buttons">
                    <button class="source-btn ${source === 'ipo' ? 'selected' : ''}" data-select-source="ipo" ${corp.ipo >= 10 ? '' : 'disabled'}>
                      IPO (${corp.ipo}% left · ${money(corp.par)})
                    </button>
                    <button class="source-btn ${source === 'pool' ? 'selected' : ''}" data-select-source="pool" ${corp.pool >= 10 ? '' : 'disabled'}>
                      Bank Pool (${corp.pool}% left · ${money(prices[selectedCid])})
                    </button>
                  </div>
                </div>
              `
          }

          <dl class="ticket-ledger compact-ledger">
            <div><dt>Acting player</dt><dd>${perspectivePlayer?.name || perspectiveId} (${perspectiveId.toUpperCase()})</dd></div>
            <div><dt>Current actor</dt><dd>${activePlayer?.name || 'Match complete'}</dd></div>
            <div><dt>Certificate</dt><dd>${isUnparred ? "One President's (20%)" : `${sharePercent / 10} standard (${sharePercent}%)`} · ${money(unitPrice)} per 10%</dd></div>
            <div><dt>${repeatBuy ? 'Personal cash → after purchase' : 'Personal cash'}</dt><dd class="${playerCash - totalCost < 0 ? 'neg-cash' : ''}">${money(playerCash)}${repeatBuy ? ` → <b>${money(playerCash - totalCost)}</b>` : ''}</dd></div>
            <div><dt>Certificates held</dt><dd>${certCounts[perspectiveId] || 0} / ${certLimit} limit${['y','o','b'].includes(zone) ? ' · selected stock exempt' : ''}${repeatBuy ? ` → ${(certCounts[perspectiveId] || 0) + certificateDelta}` : ''}</dd></div>
            <div><dt>Ownership</dt><dd>${playerHoldings}%${repeatBuy ? ` → ${playerHoldings + sharePercent}% (${['o','b'].includes(zone) ? 'market-zone exemption' : '60% limit'})` : ''}</dd></div>
          </dl>

          <div class="order-total">
            <span>${repeatBuy ? 'Purchase settlement' : 'Indicative certificate price'}</span>
            <b>${money(totalCost)}</b>
          </div>
          </div>

          <div class="settlement-summary consequence-preview-card" aria-label="Settlement preview">
            <div class="consequence-card-header">
              <b>${repeatBuy ? `Before → After Preview · ${money(totalCost)} · ${isUnparred ? '20% President' : `${sharePercent}% standard`} · ${source.toUpperCase()}` : `${escapeHtml(perspectivePlayer?.name || 'Inspected player')}'s position`}</b>
            </div>
            <div class="consequence-preview-grid">
              <div class="consequence-cell ${playerCash - totalCost < 0 ? 'is-deficit' : ''}">
                <span class="consequence-label">1. Personal Cash</span>
                <strong class="consequence-delta">${money(playerCash)}${repeatBuy ? ` → <b>${money(playerCash - totalCost)}</b>` : ''}</strong>
                <small>${repeatBuy ? `Settlement: −${money(totalCost)}` : 'Current cash'}</small>
              </div>
              <div class="consequence-cell">
                <span class="consequence-label">2. ${selectedCid} Position</span>
                <strong class="consequence-delta">${playerHoldings}%${repeatBuy ? ` → <b>${playerHoldings + sharePercent}%</b>` : ''}${isUnparred || playerHoldings + sharePercent >= 20 ? ' ★' : ''}</strong>
                <div class="ownership-mini-bar" aria-hidden="true">
                  ${[10,20,30,40,50,60].map(pct => `<i class="own-seg ${pct <= playerHoldings ? 'is-held' : repeatBuy && pct <= playerHoldings + sharePercent ? 'is-added' : ''}" style="--corp:${meta.color}"></i>`).join('')}
                </div>
              </div>
              <div class="consequence-cell">
                <span class="consequence-label">3. Certificate Slots</span>
                <strong class="consequence-delta">${certCounts[perspectiveId] || 0}${repeatBuy ? ` → <b>${(certCounts[perspectiveId] || 0) + certificateDelta}</b>` : ''} / ${certLimit}</strong>
                <small>${['y','o','b'].includes(zone) ? 'Zone exempt (+0)' : isUnparred ? '20% Pres = +1 cert' : `+${certificateDelta} cert`}</small>
              </div>
              <div class="consequence-cell">
                <span class="consequence-label">4. Market / Par</span>
                <strong class="consequence-delta">${isUnparred ? `Par ${money(selectedPar)} P` : salePreview ? `${money(prices[selectedCid])} → ${money(salePreview.price_after)} ↓` : `Mkt ${money(unitPrice)}`}</strong>
                <small>${corp.floated ? `Floated · ${money(corp.cash)}` : `IPO ${corp.ipo}% → ${Math.max(0, corp.ipo - (repeatBuy ? sharePercent : 0))}%`}</small>
              </div>
            </div>
            <span class="sr-only-ledger-line">${repeatBuy ? `Cash ${money(playerCash)} → ${money(playerCash - totalCost)} · Certificates ${certCounts[perspectiveId] || 0} → ${(certCounts[perspectiveId] || 0) + certificateDelta}/${certLimit}` : `Cash ${money(playerCash)} · ${playerHoldings}% ${selectedCid} · ${certCounts[perspectiveId] || 0}/${certLimit} certificates`}</span>
          </div>

          <div class="action-panel-heading">
            <span>CHOOSE AN ACTION · アクション</span>
            <small>Submit for validation</small>
          </div>

          <label>Sale block (one per corporation per turn)
            <select data-stock-quantity="sellPercent" aria-label="Sale percentage">${[10,20,30,40,50].map(p => `<option value="${p}" ${sellPercent === p ? 'selected' : ''}>${p}%</option>`).join('')}</select></label>
          ${brown && !isUnparred ? `<label>Brown-zone purchase block<select data-stock-quantity="buyPercent" aria-label="Purchase percentage">${[10,20,30,40,50,60,70,80,90,100].map(p => `<option value="${p}" ${sharePercent === p ? 'selected' : ''}>${p}%</option>`).join('')}</select></label>` : ''}
          <div class="stock-action-buttons ${alreadyBoughtThisTurn ? 'turn-ready' : ''}">
            ${
              alreadyBoughtThisTurn
                ? `
              <button class="pass-turn-btn finish-turn-primary" data-action="end_stock_turn" ${canEndStockTurn ? '' : 'disabled'}>
                Finish Turn & Advance Seat →
              </button>`
                : ''
            }

            ${
              repeatBuy
                ? `<button class="confirm-button action-buy" data-action="buy_shares" ${canBuy ? '' : 'disabled'}>
              ${
                isUnparred
                  ? `Set Par ${money(selectedPar)} & Buy 20% ${selectedCid} (${money(totalCost)})`
                  : `Buy ${sharePercent}% ${selectedCid} (${money(totalCost)})`
              }
            </button>`
                : ''
            }

            ${
              canSellBlock
                ? `<button class="secondary-ticket-btn action-sell" data-action="sell_shares">
              Sell ${sellPercent}% ${selectedCid} to Pool (+${money(prices[selectedCid] * sellPercent / 10)})
            </button>`
                : ''
            }

            ${
              canExchangeDR
                ? `<button class="secondary-ticket-btn action-exchange" data-action="exchange_dr">
              Exchange Dougo Railway (DR) → 10% IR
            </button>`
                : ''
            }

            ${
              !alreadyBoughtThisTurn
                ? `
              <button class="pass-turn-btn" data-action="end_stock_turn" ${canEndStockTurn ? '' : 'disabled'}>
                Pass Stock Turn →
              </button>`
                : ''
            }
          </div>

          ${salePreview ? `<p class="ticket-status-msg">Sale preview: cash ${money(playerCash)} → ${money(salePreview.cash_after)}; stock price ${money(prices[selectedCid])} → ${money(salePreview.price_after)}. President: ${escapeHtml(state.players[salePreview.president]?.name || 'None')}${salePreview.president!==corp.president ? ' (transfers)' : ' (unchanged)'}.</p>` : ''}
          ${canActInStockRound && !canEndStockTurn ? '<p class="ticket-status-msg">Correct excess certificates or ownership before finishing. Inspect the available sale blocks.</p>' : ''}
          <p class="ticket-status-msg">${statusReason}</p>
        </aside>`
              : `
        <aside class="order-ticket stock-action-panel is-inspection-only" aria-label="Corporation and turn information">
          <div class="ticket-cut"></div>
          <div class="ticket-corp-banner" style="--corp:${meta.color}">
            <span class="ticket-corp-badge">${selectedCid}</span>
            <div>
              <small class="ticket-kicker">SELECTED CORPORATION · 会社情報</small>
              <h3>${corp.name}</h3>
              <small>${meta.jp || ''} · Home: ${corp.home} (${meta.homeName})</small>
            </div>
          </div>

          <div class="stock-ticket-reference">
            <div class="op-guidance-box stock-turn-info-box">
              <div class="op-guidance-kicker">
                <span>${
                  isHistorical || appState.isPlayingReplay
                    ? `HISTORICAL SNAPSHOT · REV ${appState.viewRevision}`
                    : state.round === 'operating'
                      ? `OPERATING ROUND · 運行中`
                      : `CURRENT TURN · 現在の手番`
                }</span>
                <em>${
                  isHistorical || appState.isPlayingReplay
                    ? 'Read-only'
                    : 'Inspection mode'
                }</em>
              </div>
              <strong>${
                state.round === 'operating'
                  ? `Current Player: ${escapeHtml(activePlayer?.name || 'President')} (Operating ${state.current_corporation || 'Railway'})`
                  : `Current Player: ${escapeHtml(activePlayer?.name || activePlayerId || 'Match complete')}${activePlayerId ? ` (${activePlayerId.toUpperCase()})` : ''}`
              }</strong>
              <p>${escapeHtml(statusReason)}</p>
            </div>

            <dl class="ticket-ledger compact-ledger">
              <div><dt>Current actor</dt><dd>${escapeHtml(activePlayer?.name || 'Match complete')}${activePlayerId ? ` (${activePlayerId.toUpperCase()})` : ''}</dd></div>
              <div><dt>Share status</dt><dd>${isUnparred ? `Unparred (Par ¥${parChoices[0]}–¥${parChoices.at(-1)})` : `${corp.floated ? 'Floated' : 'Parred'} · Market ${money(prices[selectedCid] || corp.par)} (Par ${money(corp.par)})`}</dd></div>
              <div><dt>Certificate</dt><dd>${isUnparred ? "One President's (20%)" : `${sharePercent / 10} standard (${sharePercent}%)`} · ${isUnparred ? `¥${parChoices[0]}–¥${parChoices.at(-1)}` : money(unitPrice)} per 10%</dd></div>
              <div><dt>Share supply</dt><dd>IPO ${corp.ipo}% · Bank Pool ${corp.pool}%</dd></div>
              <div><dt>President</dt><dd>${corp.president ? `${escapeHtml(state.players?.[corp.president]?.name || corp.president)} (${corp.holdings?.[corp.president] || 0}%)` : 'Unparred (20% President share in IPO)'}</dd></div>
              <div><dt>Treasury &amp; fleet</dt><dd>${corp.floated ? money(corp.cash) : `Needs ${Math.max(0, 50 - (100 - corp.ipo))}% from IPO to float`} · ${corp.trains?.length ? corp.trains.join(', ') : '0 trains'} · ${corp.token_supply} stations</dd></div>
            </dl>
          </div>

          <div class="settlement-summary" aria-label="Player position summary">
            <b>${escapeHtml(perspectivePlayer?.name || 'Inspected player')}'s position</b>
            <span>Cash ${money(playerCash)} · ${playerHoldings}% ${selectedCid} · ${certCounts[perspectiveId] || 0}/${certLimit} certificates</span>
          </div>

          ${
            state.round === 'operating'
              ? `<div class="stock-action-buttons">
                  <button type="button" class="confirm-button" data-view="map">
                    Open Map &amp; Operations 🗺️
                  </button>
                </div>`
              : ''
          }
        </aside>`
        }
      </div>
    </section>
  `;
}
