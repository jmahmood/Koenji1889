/**
 * Koenji 1889 — In-Map Gazette Pop-In Dispatch & Alert Window System
 *
 * Inspired by 90s/2000s web pop-ups and Meiji newspaper extra editions (号外 / Gogai).
 * Floats in the map canvas viewport over maritime open water (Iyo Sea) with zero
 * layout shift and zero vertical space taken from the top headers.
 */

import { escapeHtml as esc } from '../ui/presentation.js';

const money = (n) => `¥${Number(n || 0).toLocaleString()}`;

export const RUST_MILESTONES = {
  '2': { precursor: '3', trigger: '4', rusts: '2', cost: 300, name: 'Phase 4' },
  '3': { precursor: '3', trigger: '4', rusts: '2', cost: 300, name: 'Phase 4' },
  '4': { precursor: '5', trigger: '6', rusts: '3', cost: 630, name: 'Phase 6' },
  '5': { precursor: '5', trigger: '6', rusts: '3', cost: 630, name: 'Phase 6' },
  '6': { precursor: '6', trigger: 'D', rusts: '4', cost: 1100, name: 'Phase D' },
};

/**
 * Evaluates whether a rust alert condition exists in the current state.
 * Returns an alert descriptor or null if conditions are normal.
 */
export function computeRustAlert(appState, viewData) {
  if (!viewData || !viewData.state) return null;
  const s = viewData.state;
  const currentPhase = String(s.phase || '2');
  const milestone = RUST_MILESTONES[currentPhase];
  if (!milestone) return null;

  const depotTrains = Object.values(s.trains || {}).filter(
    (t) => t.owner === 'depot' && !t.rusted
  );
  const counts = depotTrains.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  const precursorLeft = counts[milestone.precursor] || 0;
  const triggerLeft = counts[milestone.trigger] || 0;

  // 1. Check for immediate cataclysm (trains rusted in the current event/revision)
  const lastEvent = viewData.last_event;
  const rustedList = lastEvent?.rusted_trains || [];
  if (rustedList.length > 0) {
    const affectedCorps = [...new Set(rustedList.map((t) => t.corporation || 'Unknown'))];
    const rustedType = rustedList[0].type || milestone.rusts;
    const triggerType = rustedType === '2' ? '4' : rustedType === '3' ? '6' : 'D';
    const phaseName = rustedType === '2' ? 'Phase 4' : rustedType === '3' ? 'Phase 6' : 'Phase D';

    return {
      id: `rust-cataclysm-rev-${s.revision}`,
      tierKey: `cataclysm-${currentPhase}`,
      severity: 'cataclysm',
      stamp: '号外 EXTRA',
      titlebarClass: 'retro-titlebar',
      title: `🔥 BREAKING NEWS · ${rustedType}-TRAINS HAVE RUSTED!`,
      marquee: `🚨 ${phaseName.toUpperCase()} TRANSITION ACTIVATED`,
      badge: 'CRITICAL',
      headline: `🔥 First ${triggerType}-Train Purchased!`,
      detail: `All <b>${rustedType}-Trains have been permanently removed</b> from the board. Affected corporations (${affectedCorps.join(', ')}) must replace engines in their next operating turn.`,
      depotGauge: {
        title: 'DEPOT TRANSITION',
        value: `${phaseName} Active`,
        sub: `${counts[triggerType] || 0}x ${triggerType}-Trains remaining`,
      },
      hazardGauge: {
        title: 'FLEET SCRAPPED',
        value: `${rustedList.length} Engines Lost`,
        sub: `Affected: ${affectedCorps.join(', ')}`,
        danger: true,
      },
      corps: evaluateCorpsVulnerability(s, milestone),
      primaryAction: {
        label: '🚂 Inspect Depot & Routes (Key 3)',
        action: 'open_depot',
      },
      buoyLabel: `🔥 ${rustedType}-Trains Rusted · Check Fleets`,
    };
  }

  // 2. Check for Step 5 Emergency Financing Shortfall (Critical)
  const isOperating = s.round === 'operating' && s.operating_turn?.step === 'train';
  const activeCid = s.current_corporation;
  const activeCorp = activeCid ? s.corporations?.[activeCid] : null;
  if (isOperating && activeCorp && (!activeCorp.trains || activeCorp.trains.length === 0)) {
    const cheapestPrice = depotTrains.reduce((min, t) => Math.min(min, t.price || 9999), 9999);
    const safeCash = activeCorp.cash || 0;
    const shortfall = Math.max(0, cheapestPrice - safeCash);
    if (shortfall > 0) {
      const presId = activeCorp.president;
      const presCash = s.players?.[presId]?.cash || 0;
      const personalGap = Math.max(0, shortfall - presCash);
      return {
        id: `emergency-shortfall-${activeCid}-${s.revision}`,
        tierKey: `emergency-${activeCid}`,
        severity: 'emergency',
        stamp: '緊急 EMERGENCY',
        titlebarClass: 'retro-titlebar',
        title: `🚨 MANDATORY FINANCING CRISIS · ${activeCid}`,
        marquee: `⚠️ TREASURY DEFICIT · PRESIDENTIAL CONTRIBUTION REQUIRED`,
        badge: 'ACTION REQ',
        headline: `🚨 ${activeCid} Treasury Shortfall: −${money(shortfall)}!`,
        detail: `${activeCid} owns 0 trains and must buy a locomotive (${money(cheapestPrice)}). Corporate safe has only ${money(safeCash)}. President must contribute personal funds or sell shares!`,
        depotGauge: {
          title: 'REQUIRED LOCOMOTIVE',
          value: `Cheapest: ${money(cheapestPrice)}`,
          sub: `Safe covers ${money(safeCash)}`,
        },
        hazardGauge: {
          title: 'PRESIDENTIAL GAP',
          value: personalGap > 0 ? `Deficit: −${money(personalGap)}` : `Purse covers shortfall`,
          sub: personalGap > 0 ? 'Emergency share sale required' : `Purse: ${money(presCash)}`,
          danger: true,
        },
        corps: evaluateCorpsVulnerability(s, milestone),
        primaryAction: {
          label: 'Open Decisions & Emergency Desk',
          action: 'open_decisions',
        },
        buoyLabel: `🚨 ${activeCid} Shortfall −${money(shortfall)}`,
      };
    }
  }

  // 3. Threat Warning: 1 precursor train remains (or 0 with trigger available)
  if (precursorLeft === 1 || (precursorLeft === 0 && triggerLeft > 0)) {
    const corpsRisk = evaluateCorpsVulnerability(s, milestone);
    const viewerId = viewData.viewer?.player_id;
    const userEndangered = corpsRisk.some(
      (c) => c.willEmpty && c.presidentId === viewerId
    );

    return {
      id: `threat-warning-${currentPhase}-${milestone.trigger}`,
      tierKey: `threat-${currentPhase}-${milestone.trigger}`,
      severity: 'threat',
      stamp: '号外 GAZETTE',
      titlebarClass: 'retro-titlebar',
      title: `⚠️ FLEET DISPATCH · ${milestone.name} RUST THREAT`,
      marquee: `⚡ ATTENTION PRESIDENTS: ${milestone.name.toUpperCase()} RUST IMMINENT`,
      badge: 'URGENT',
      headline: precursorLeft === 1
        ? `⚠️ Only 1x ${milestone.precursor}-Train Left in Depot!`
        : `⚠️ ${milestone.trigger}-Trains Available · 1st Purchase Rusts ${milestone.rusts}-Trains!`,
      detail: `Purchasing the final ${milestone.precursor}-Train unlocks ${milestone.trigger}-Trains (${money(milestone.cost)}). The first ${milestone.trigger}-Train bought <b>permanently scraps all ${milestone.rusts}-Trains</b>. Prepare your corporate treasury now!`,
      depotGauge: {
        title: 'DEPOT SUPPLY',
        value: precursorLeft === 1 ? `1x ${milestone.precursor}-Train (${money(counts[milestone.precursor] ? (s.trains[depotTrains.find(t=>t.type===milestone.precursor)?.id]?.price || 180) : 180)})` : `${milestone.trigger}-Train Ready`,
        sub: `Next Tier: ${milestone.trigger}-Train (${money(milestone.cost)})`,
      },
      hazardGauge: {
        title: 'YOUR FLEET HAZARD',
        value: userEndangered ? `Your Corp Runs Out of Trains!` : `Fleet Protected`,
        sub: userEndangered ? `Owns only ${milestone.rusts}-Trains` : `Holds surviving engines`,
        danger: userEndangered,
      },
      corps: corpsRisk,
      primaryAction: {
        label: '🚂 Inspect Depot & Routes (Key 3)',
        action: 'open_depot',
      },
      buoyLabel: `⚠️ 1x ${milestone.precursor}T Left · Rust Imminent`,
    };
  }

  // 4. Advisory: 2 precursor trains remain
  if (precursorLeft === 2) {
    return {
      id: `advisory-${currentPhase}-${milestone.trigger}`,
      tierKey: `advisory-${currentPhase}`,
      severity: 'advisory',
      stamp: '告示 NOTICE',
      titlebarClass: 'retro-titlebar is-amber',
      title: `ℹ️ FLEET ADVISORY · ${milestone.name} APPROACHING`,
      marquee: `⏳ 2x ${milestone.precursor}-TRAINS REMAIN BEFORE ${milestone.name.toUpperCase()}`,
      badge: 'NOTICE',
      headline: `ℹ️ 2x ${milestone.precursor}-Trains Remain in Depot`,
      detail: `Phase progression is approaching ${milestone.name}. When ${milestone.trigger}-Trains are bought, all ${milestone.rusts}-Trains will rust. Ensure your companies have capital.`,
      depotGauge: {
        title: 'DEPOT SUPPLY',
        value: `2x ${milestone.precursor}-Trains Left`,
        sub: `Next Tier: ${milestone.trigger}-Train (${money(milestone.cost)})`,
      },
      hazardGauge: {
        title: 'UPCOMING RUST',
        value: `All ${milestone.rusts}-Trains`,
        sub: `Scrapped at Phase ${milestone.trigger}`,
        danger: false,
      },
      corps: evaluateCorpsVulnerability(s, milestone),
      primaryAction: {
        label: 'View Depot Schedule',
        action: 'open_depot',
      },
      buoyLabel: `ℹ️ 2x ${milestone.precursor}T Left before ${milestone.name}`,
    };
  }

  return null;
}

/**
 * Computes vulnerability metrics for all corporations against an upcoming rust milestone.
 */
function evaluateCorpsVulnerability(state, milestone) {
  const rustType = milestone.rusts;
  const results = [];

  for (const [cid, corp] of Object.entries(state.corporations || {})) {
    if (!corp) continue;
    const owned = corp.trains || [];
    const rustingTrains = owned.filter((tid) => state.trains[tid]?.type === rustType);
    const survivingTrains = owned.filter((tid) => state.trains[tid]?.type !== rustType);
    const willEmpty = owned.length > 0 && survivingTrains.length === 0;

    const treasury = corp.cash || 0;
    const shortfall = Math.max(0, milestone.cost - treasury);

    results.push({
      corporationId: cid,
      name: corp.name || cid,
      presidentId: corp.president,
      ownedCount: owned.length,
      rustingCount: rustingTrains.length,
      survivingCount: survivingTrains.length,
      willEmpty,
      shortfall,
      treasury,
    });
  }

  return results;
}

/**
 * Renders the Retro 90s/2000s Pop-In Window and/or Minimized Maritime Buoy.
 */
export function renderGazettePopin(appState, viewData) {
  const alert = computeRustAlert(appState, viewData);
  if (!alert) return '';

  const isSuppressed = Boolean(appState.suppressedRustAlerts?.[alert.tierKey]);
  const isMinimized = Boolean(appState.rustAlertMinimized) || isSuppressed;
  const isClosed = Boolean(appState.rustAlertDismissed) && !appState.rustAlertMinimized;

  const posX = appState.gazettePosition?.x ?? 28;
  const posY = appState.gazettePosition?.y ?? 52;

  // Minimized Floating Buoy (Anchored quietly over Iyo Sea / Seto Inland Sea water)
  const buoyMarkup = `
    <button type="button" class="minimized-rust-buoy ${isMinimized && !isClosed ? '' : 'is-hidden'}" data-restore-gazette title="Click to reopen Gazette Bulletin" aria-label="Reopen Gazette Rust Bulletin">
      <span class="buoy-blip"></span>
      <span class="buoy-tag">${esc(alert.buoyLabel)}</span>
      <span class="buoy-restore-hint">[ Reopen ⤢ ]</span>
    </button>
  `;

  if (isClosed && isSuppressed) return buoyMarkup;

  // The Full Retro 90s / 2000s Pop-In Window
  const windowMarkup = `
    <article class="retro-popin-window ${isMinimized ? 'is-minimized' : ''} ${isClosed ? 'is-closed' : ''}" id="rustPopinWindow" style="left: ${posX}px; top: ${posY}px;" aria-label="Rust Alert Gazette Pop-Up" role="dialog" data-testid="rust-popin-window">
      <!-- 90s Title Bar -->
      <div class="${esc(alert.titlebarClass || 'retro-titlebar')}" data-gazette-drag title="Click and drag to move window">
        <div class="retro-title-left">
          <span class="gogai-stamp">${esc(alert.stamp)}</span>
          <span>${esc(alert.title)}</span>
        </div>
        <div class="retro-controls">
          <button type="button" class="retro-win-btn" data-minimize-gazette title="Minimize to map corner [_]" aria-label="Minimize">_</button>
          <button type="button" class="retro-win-btn btn-close" data-close-gazette title="Close bulletin [✕]" aria-label="Close">✕</button>
        </div>
      </div>

      <!-- 90s Style Marquee Kicker -->
      <div class="retro-ad-kicker">
        <span>${esc(alert.marquee)}</span>
        <span class="blinking-badge">${esc(alert.badge)}</span>
      </div>

      <!-- Pop-In Window Body -->
      <div class="retro-popin-body">
        <!-- Headline Box -->
        <div class="retro-headline-box">
          <h3>${esc(alert.headline)}</h3>
          <p>${alert.detail}</p>
        </div>

        <!-- 2-Column Gauge: Depot Countdown vs. Fleet Impact -->
        <div class="retro-gauge-grid">
          <div class="retro-gauge-card">
            <span class="gauge-title">${esc(alert.depotGauge.title)}</span>
            <span class="gauge-value">${esc(alert.depotGauge.value)}</span>
            <span class="gauge-sub">${esc(alert.depotGauge.sub)}</span>
          </div>
          <div class="retro-gauge-card">
            <span class="gauge-title">${esc(alert.hazardGauge.title)}</span>
            <span class="gauge-value ${alert.hazardGauge.danger ? 'is-danger' : ''}">${esc(alert.hazardGauge.value)}</span>
            <span class="gauge-sub">${esc(alert.hazardGauge.sub)}</span>
          </div>
        </div>

        <!-- Corporation Vulnerability Matrix -->
        <div class="retro-corps-affected">
          ${alert.corps.map((c) => {
            const isViewer = c.presidentId === viewData.viewer?.player_id;
            const statusCol = c.willEmpty ? '#a82414' : '#2b6e3b';
            const statusTxt = c.willEmpty
              ? `Safe: ${money(c.treasury)} (−${money(c.shortfall)} Gap)`
              : `✓ ${c.survivingCount} Surviving`;
            return `
              <div>
                <span><b>${esc(c.corporationId)}${isViewer ? ' (You)' : ''}</b>: ${c.rustingCount} rusting / ${c.ownedCount} owned</span>
                <span style="color: ${statusCol}; font-weight: bold;">${statusTxt}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Action Buttons -->
        <div class="retro-action-bar">
          <button type="button" class="btn-90s-primary" data-gazette-action="${esc(alert.primaryAction.action)}">
            ${esc(alert.primaryAction.label)}
          </button>
          <button type="button" class="btn-90s-secondary" data-minimize-gazette>
            Dismiss (X)
          </button>
        </div>
      </div>

      <!-- Footer with Suppression Checkbox -->
      <div class="retro-popin-footer">
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <input type="checkbox" data-suppress-gazette="${esc(alert.tierKey)}" ${isSuppressed ? 'checked' : ''}> Don't re-pop for this tier
        </label>
        <span>Drag titlebar to move</span>
      </div>
    </article>
  `;

  return `${windowMarkup}\n${buoyMarkup}`;
}
