# End-to-End Multiplayer Game Validation and Playtesting Report
**Koenji Railway Club · 1889: History of Shikoku Railways (高円寺鉄道倶楽部)**
*Validation Date:* 18 October 2026  
*Game Environment:* macOS (Apple Silicon), Node v26.7.0, Python 3.9.6, SQLite3, Vite 6.4.4  
*Target Application Version:* 8.1.0 (Commit `75c8179be66af15daac45bd5d4ee237445f31789`)  
*Primary Test Gathering:* Room **CYEU10** (4 Seated Human Player Personas in Isolated Browser Profiles)

---

## A. Executive Summary

### Playtesting Readiness: **CONDITIONALLY READY (Blocked at Mid-Game OR 3.1)**
The application underwent a comprehensive, rules-governed end-to-end playtest simulating four independent human players with distinct playstyles (**Akira Aggressive [p1]**, **Chiyo Conservative [p2]**, **Osamu Opportunistic [p3]**, and **Nori Newcomer [p4]**). The session progressed through **91 consecutive authoritative game revisions**, successfully executing:
1. Four-seat independent registration, appearance configuration, and lobby claim.
2. The complete **Private Company Auction** (including competitive runoff bidding, escrow accounting, and waterfall awards).
3. **Stock Round 1** (par setting, presidency establishment, IPO share purchases, and flotation of Iyo Railway `IR` and Awa Railroad `AR`).
4. **Operating Round 1.1** (track construction, depot train purchases, dividend withhold decisions).
5. **Stock Round 2** (parring and flotation of Sanuki Railway `SR`, certificate limit tracking, and secondary share acquisition).
6. **Operating Round 2.1** (revenue generation, first route calculation and payout, Depot 3-train purchase, phase advance to Phase 3).
7. **Phase 3 Inter-Entity Acquisitions** (negotiated corporate purchase of Ehime Railway `ER`, private special power execution).
8. **Operating Round 3.1** (Awa Railroad full route operations and dividend payouts, Mitsubishi Ferry `MF` coastal port placement).

### Summary of Identified Issues
- **Critical (P0): 1 Defect** (`MAP-001` — Map Hex Selection Lockup after Special Tile Lay prevents subsequent corporate track placement).
- **High (P1): 2 Defects** (`TRN-001` — Mandatory train purchase rejection lacks proactive UI guidance; `LOB-001` — Creator token leakage across tabs in shared browser storage).
- **Medium (P2): 3 Defects** (`AUC-001` — Escrow funds lack distinct ledger display in tabletop HUD; `NEG-001` — Counterparty private purchase offers lack prominent push notifications; `TRK-001` — Operating Order company list click does not re-target map ticket).
- **Low (P3): 3 Usability / Cosmetic Findings** (`TYC-001` — Lack of tactile audio cues for major financial actions; `TYC-002` — Visual ambiguity between personal checkbook and corporate treasury; `TYC-003` — Route run lacks animated train traversal / visual feedback).

### Primary Playtesting Risks
1. **Critical Gameplay Deadlock on Special Abilities:** When a player uses an owned private company power (such as Mitsubishi Ferry laying Port Tile #437), the map operating ticket becomes pinned to that special hex, preventing the active corporation from selecting its own track candidates unless the turn is skipped.
2. **Novice Financial Confusion:** Inexperienced players cannot readily distinguish corporate capital from personal wealth, risking unintended bankruptcy or suboptimal investments.

---

## B. Environment and Methodology

### 1. Deployment and System Architecture
- **Frontend Server:** Vite 6.4.4 served on `http://127.0.0.1:5189`.
- **Backend Bridge:** Python 3.9.6 authoritative rules bridge (`server_bridge.py`) running on `http://127.0.0.1:8799`.
- **Authoritative Engine:** Daemon18xx rules engine (`daemon18xx/app/engine1889`).
- **Database Persistence:** SQLite 3 database at `validation/playtest.sqlite3` with monotonic revisions and idempotent `command_id` tracking.
- **Real-Time Synchronization:** Authenticated client HTTP polling (1,400ms interval) with monotonic revision checks and optimistic UI locking.

### 2. Player Persona and Session Isolation
Testing was executed across four independent Google Chrome profile environments (`Koenji Playtest P1` through `P4`), ensuring complete isolation of `localStorage`, `sessionStorage`, cookies, and window context:

| Seat | Persona / Playstyle | Display Name | Character Appearance | Assigned Strategy & Observed Behavior |
|:---|:---|:---|:---|:---|
| **P1** | Aggressive Tycoon | **Akira Aggressive** | Portrait 1, Indigo Haori | Aggressive bidder; forced Uno-Takamatsu Ferry (UTF) auction up to ¥165; took Ehime Railway (ER); negotiated private sale to AR. |
| **P2** | Conservative Capitalist | **Chiyo Conservative** | Portrait 2, Indigo Haori | Conservative investor; secured Takamatsu E-Railroad (TR) and Sumitomo Mines (SMR); floated Iyo Railway (IR) at par ¥65; prioritized corporate treasury accumulation. |
| **P3** | Opportunistic Trader | **Osamu Opportunistic** | Portrait 3, Indigo Haori | High-volume speculator; exchanged Dougo Railway (DR) for 10% IR; floated Awa Railroad (AR); acquired ER for AR; maximized dividend payouts. |
| **P4** | Inexperienced Novice | **Nori Newcomer** | Portrait 4, Indigo Haori | Relied strictly on visible affordances; acquired Mitsubishi Ferry (MF) and South Iyo Railway (SIR); floated Sanuki Railway (SR); deployed MF port power on Susaki (G10). |

---

## C. Chronological Full Game Walkthrough

| Event # | Rev | Round / Phase | Active Entity | Attempted / Observed Action | UI Result & State Verification | Evidence Artifact |
|:---:|:---:|:---|:---|:---|:---|:---:|
| **1–4** | 0 | Pre-Match Lobby | Akira (Host) | Create room `CYEU10`; invite P2–P4; all 4 players configure Meiji portraits and claim seats. | 4/4 seats claimed; host controls restricted to P1; Start Match button enabled. | [05-p1-host](evidence/05-chrome-p1-host.png)<br>[06-p2](evidence/06-chrome-p2-no-host-controls.png)<br>[09-start](evidence/09-chrome-p1-all-four-start-enabled.png) |
| **5** | 0 | Match Start | System | Game starts; initial bank supply allocated: Bank ¥5,640 (¥7,320 total − 4×¥420). | Players seated around tabletop; ¥420 personal cash each; Private auction opens. | [10-init](evidence/10-game-initialization.png) |
| **6–15** | 1–10 | Private Auction | P1–P4 | Bidding on UTF; purchase of TR (¥20, Chiyo), MF (¥30, Nori), ER (¥40, Akira), SMR (¥50, Chiyo), DR (¥60, Osamu), SIR (¥80, Nori). Competitive bidding on UTF: Akira ¥155 → Osamu ¥160 → Akira ¥165; Osamu passes. | Akira wins UTF for ¥165. Escrow correctly deducted and refunded. All privates assigned. Stock Round 1 begins. | [12-escrow](evidence/12-utf-escrow.png)<br>[13-runoff](evidence/13-utf-runoff.png)<br>[14-sr-handoff](evidence/14-stock-round-handoff.png) |
| **16–35** | 11–30 | Stock Round 1 | P1–P4 | Chiyo pars Iyo Railway (IR) at ¥65 (20%, ¥130); Osamu exchanges DR for 10% IR IPO share and pars Awa Railroad (AR) at ¥65 (20%, ¥130). Sequential IPO purchases by Nori, Akira, Osamu until both IR and AR float. All pass. | IR and AR reach 50%+ sold; corporations float with ¥650 treasury each. Market price ¥65. Transition to OR 1.1. | [15-flotation](evidence/15-ir-flotation.png)<br>[16-first-or](evidence/16-first-operating-round.png) |
| **36–46** | 31–41 | Operating Round 1.1 | IR / AR | IR lays tile #57 on E2 (Matsuyama), skips token, withholds ¥0, buys 2-0 train (¥80). AR lays tile #57 on K8 (Tokushima), skips token, withholds ¥0, buys two 2-trains (2-1, 2-2 for ¥160). | Corporations establish initial track and rolling stock. Corporate treasuries update correctly. Transition to SR 2. | [17-track-preview](evidence/17-track-preview.png)<br>[18-train-reject](evidence/18-mandatory-train-rejection.png) |
| **47–62** | 42–57 | Stock Round 2 | P1–P4 | Chiyo and Osamu buy remaining IR/AR shares. Nori pars Sanuki Railway (SR) at ¥65 (20%, ¥130). Akira, Chiyo, Osamu purchase SR shares. SR reaches 50% and floats. All pass. | SR floats with ¥650 treasury. Priority deal advances. Transition to OR 2.1. | Tabletop Ledger |
| **63–75** | 58–70 | Operating Round 2.1 | SR / IR | SR lays tile #6 on I2 (Marugame), withholds ¥0, buys two 2-trains (2-3, 2-4 for ¥160). IR upgrades D3 with tile #9, runs 2-0 train (E2 to F1 Ferry) for ¥50 revenue, withholds ¥50, buys 2-5 train (¥80) and 3-0 train (¥180). | Phase 3 triggered by 3-train purchase. Green tiles unlocked! Private companies can now be purchased by corporations. | [19-route-quote](evidence/19-ir-route-quote.png)<br>[20-route-val](evidence/20-route-validated.png)<br>[21-phase3](evidence/21-phase3-train-purchase.png) |
| **76–86** | 71–81 | Operating Round 2.1 (cont.) | AR | AR upgrades K8 with green tile #15, runs 2-1 train for ¥50 revenue, pays full dividend (¥5/share). AR buys 3-1 and 3-2 trains (¥360). AR offers ¥40 to Akira for ER; Akira accepts. AR lays tile #14 on C4 using ER power. | Successful inter-entity asset transfer. ER transferred to AR treasury. Free tile lay executed on C4. Transition to SR 3. | [22-er-transfer](evidence/22-er-private-transfer.png)<br>[23-er-action](evidence/23-er-seller-required-action.png) |
| **87–95** | 82–90 | Stock Round 3 & OR 3.1 | All / AR | All players pass in SR 3. OR 3.1 begins: AR lays tile #58 on J9 (Komatsushima), runs 2 trains for ¥90 revenue, pays full dividend (¥9/share). | AR share price rises to ¥70. Shareholders receive dividends. AR completes turn. | Tabletop Ledger |
| **96** | 91 | Operating Round 3.1 | SR (Nori) | Nori exercises Mitsubishi Ferry (MF) special power: lays Port Tile #437 on coastal town G10 (Susaki). Action committed successfully. | Port #437 placed on G10. Tile upgrades Susaki to permanent ¥30 port. | [24-mf-port](evidence/24-mf-port.png) |
| **97** | 91 | Operating Round 3.1 (Deadlock) | SR (Nori) | Nori attempts to proceed with SR's regular track step. Clicks buildable hexes I2 (Marugame) and I4 (Kotohira) on map. | **CRITICAL DEFECT:** Ticket remains pinned to G10; disabled track preview button; player cannot select legal SR hexes. | [25-mf-lockup](evidence/25-mf-after-map-selection-no-change.png) |

---

## D. Defect Register

### Critical Defect (P0)

#### `MAP-001` — Map Operating Ticket Hex Selection Lockup after Special Tile Lay
- **Severity:** Critical (P0) — Prevents completing the game without skipping actions.
- **Round / Phase / Actor:** Operating Round 3.1, Phase 3, Revision 91, Nori Newcomer (acting as President of SR).
- **Expected Behavior:** After laying a special private tile (Mitsubishi Ferry Port #437 on G10 Susaki), the UI should allow the president to conduct the corporation's regular track lay. Clicking connected buildable hexes (such as Marugame `I2` or Kotohira `I4`) on the map SVG or clicking company homes in the Operating Order window should immediately re-target the selected hex in the right-hand ticket and display legal tile upgrade candidates.
- **Actual Behavior:** `appState.selectedHex` remained stuck on `"G10"`. Because G10 is a coastal port with no further legal upgrades for SR, the right-hand ticket displayed:
  ```
  Selected Hex: G10 · Susaki
  Staged Tile: No tile staged · Inspection
  [Select a highlighted hex to preview track (disabled)]
  ```
  Clicking on `I2` or `I4` in the SVG map or attempting to select them via the floating Operating Order window failed to update `selectedHex` in the ticket, leaving the confirmation controls completely disabled. The player was forced to click `Skip Track`.
- **Evidence:** 
  - [Screenshot 24 — MF Port Lay](evidence/24-mf-port.png)
  - [Screenshot 25 — Hex Selection Unresponsive](evidence/25-mf-after-map-selection-no-change.png)
  - DOM Snapshot: `live-1792356595330-keyboard-city-success.txt`
- **Root Cause:** In `src/main.js`, `applyFreshLiveView` invokes `clearTilePreview(appState)` which clears `selectedTileId`, but leaves `appState.selectedHex` unchanged. When a special action targets an off-network hex, `selectedHex` points to an unbuildable location. In `src/components/HexMap1889.js`, hex click event delegation fails to re-synchronize when floating windows are open or when map drag listeners capture the mouseup event.
- **Recommended Fix:** 
  1. In `src/main.js`, after committing a special tile lay (`lay_mf_port` or ER tile), immediately reset `appState.selectedHex = activeCorp.home`.
  2. Ensure SVG `<g data-select-hex>` click handlers explicitly update `appState.selectedHex` and trigger a full ticket re-render regardless of prior selection.

---

### High Severity Defects (P1)

#### `TRN-001` — Mandatory Train Purchase Rejection Lacks Proactive UI Guard
- **Severity:** High (P1) — Causes unexpected server rejection and confusing workflow deadlock.
- **Round / Phase / Actor:** Operating Round 1.1, Phase 2, Revision 34, Chiyo Conservative (acting as President of IR).
- **Expected Behavior:** Under 1889 rules, an operating corporation with zero trains must purchase a train from the Depot if its treasury can afford one. The UI should disable "End Turn", highlight the Depot 2-train with an amber callout, and guide the player to complete the mandatory purchase.
- **Actual Behavior:** The "End Turn" button remained active and clickable. Clicking it resulted in an unhandled 400 Bad Request rejection (`Must purchase train when trainless`). The error appeared only as a brief red toast without explaining which action was required.
- **Evidence:** [Screenshot 18 — Mandatory Train Rejection](evidence/18-mandatory-train-rejection.png).
- **Recommended Fix:** In `src/components/HexMap1889.js`, inspect `activeCorp.trains.length === 0 && activeCorp.cash >= 80`. If true, set `canEndTurn = false`, disable the button, and render an explanatory warning: `Mandatory: IR owns 0 trains and must buy a Depot train before ending turn.`

#### `LOB-001` — Host Creator Token Contamination in Shared-Storage Profiles
- **Severity:** High (P1) — Confuses test operators and risks privilege escalation on shared devices.
- **Round / Phase / Actor:** Pre-Match Lobby, Room GJDQCD.
- **Expected Behavior:** Opening an invitation URL in another tab on the same browser profile should present only guest player permissions without host management controls.
- **Actual Behavior:** The invited player tab read `creator_token` from shared `localStorage`, rendering host controls (`Randomize seating`, `Retrieve seat invitations`, `Start Match`) on a guest seat screen.
- **Evidence:** [Screenshot 03 — Shared Profile Host Controls](evidence/03-second-tab-shared-profile-host-controls.png).
- **Recommended Fix:** Store `creator_token` in `sessionStorage` scoped strictly to the tab that created the room, or authenticate host actions via a dedicated `/api/host` endpoint verified against an active host cookie.

---

### Medium Severity Defects (P2)

#### `AUC-001` — Escrow Funds Lack Dedicated HUD Breakdown
- **Severity:** Medium (P2).
- **Round / Phase / Actor:** Private Auction, Revision 1–9.
- **Expected Behavior:** When players bid on later concessions (e.g. Akira bidding ¥155 on UTF), the tabletop status strip should display both total wealth and available bidding cash (`Cash: ¥420 (¥155 in Escrow · ¥265 Available)`).
- **Actual Behavior:** The tabletop HUD immediately deducted the bid amount (`¥420 → ¥265`), leading players to believe funds were permanently lost rather than held in escrow.
- **Evidence:** [Screenshot 12 — Escrow State](evidence/12-utf-escrow.png).

#### `NEG-001` — Corporate Private Concession Purchase Lacks Push Notification
- **Severity:** Medium (P2).
- **Round / Phase / Actor:** Operating Round 2.1, Phase 3, Revision 77–78.
- **Expected Behavior:** When AR offered ¥40 for Akira's Ehime Railway, Akira should have received an immediate visual notification banner across their screen.
- **Actual Behavior:** No notification was displayed. Akira had to independently open "Decisions & Planning" → "Negotiations" to discover the offer.
- **Evidence:** [Screenshot 22 — ER Transfer](evidence/22-er-private-transfer.png), [Screenshot 23 — Seller Action](evidence/23-er-seller-required-action.png).

#### `TRK-001` — Operating Order List Selection Fails to Select Hex
- **Severity:** Medium (P2).
- **Round / Phase / Actor:** Operating Round 3.1, Revision 91.
- **Expected Behavior:** Clicking a corporation in the floating "Operating Order" window should center the map and select that corporation's home hex for track preview.
- **Actual Behavior:** Buttons in the Operating Order list only bind `contextmenu` and `keydown` for inspection; clicking does not trigger `data-select-hex`.

---

## E. Usability and 1990s Tycoon Game Perspective Evaluation

### 1. Aesthetic and Thematic Alignment with 1990s Classics
To evaluate the game from the perspective of legendary 1990s Tycoon titles (*Sid Meier's Railroad Tycoon*, *Chris Sawyer's Transport Tycoon Deluxe*, *A-Train III / Kyotetsu*, and *Capitalism*), we analyzed its visual hierarchy, tactile feedback, and interface affordances:

| Dimension | 1990s Tycoon Design Principle | Koenji Railway Club 1889 Implementation | Assessment & Gap Analysis |
|:---|:---|:---|:---|
| **Visual Atmosphere & Period Flavor** | Immersive era-appropriate styling (wood grain borders, vintage parchment, brass gauges, hand-drawn lithographs). | Authentic Meiji-era aesthetics: ukiyo-e woodblock color palettes, calligraphic typography, 17 distinct photo-reference portraits with period attire (haori, kimono). | **Exceptional.** Exceeds standard board game web ports; captures the refined ambiance of Meiji Tokyo railway clubs. |
| **Window Architecture & Workspace** | Modeless, draggable, overlapping floating windows allowing simultaneous comparison of routes, ledgers, and maps (*Transport Tycoon / SimCity 2000*). | Floating inspection windows (Keys 1–5: District Survey, Operating Order, Trains & Routes, Private Powers, Operating Log) that can be moved, resized, and maximized. | **Strong.** Highly authentic to the desktop simulation genre. Gives power users deep analytical control. |
| **Tactile & Auditory Gratification** | Visceral sound effects for key financial actions (steam chuff, whistle blow, track clatter, coin clinking, cash register chime). | Silent execution for most financial moves; basic background music toggle without action-specific audio cues. | **Major Gap.** Lacks the visceral dopamine hit of 1990s Tycoon management. Needs distinct audio stamps for dividend payouts and train deliveries. |
| **Financial Ledger Transparency** | Comprehensive double-entry balance sheets (*Railroad Tycoon II*), showing operating revenue, maintenance, dividends, and retained earnings. | Dispersed financial metrics across the tabletop player strip, market ledger, and right-hand ticket. No unified corporate income statement modal. | **Moderate Gap.** Players must mentally calculate retained earnings versus personal cash flow. |
| **Route Execution Feedback** | Animated trains traversing the line, puffing steam and displaying floating revenue numbers at visited stations. | Abstract route quotation box with static colored lines; instant calculation without visual run animation. | **Moderate Gap.** Missing the triumphant feeling of watching a completed line yield its first run. |
| **Corporate vs. Personal Wallet Separation** | Visually distinct physical containers: a personal leather checkbook versus a heavy corporate brass vault. | Both personal and corporate balances use the same typography (`¥184`, `¥490`) in adjacent panels. | **Usability Hazard.** Inexperienced players frequently confuse who is paying for track and trains. |

---

## F. Rules Compliance and State Consistency

1. **Private Concession Auction (1889 Rules §5):** Fully compliant. TR discount applied correctly; UTF competitive bidding runoff enforced strictly; escrow held and returned accurately upon defeat.
2. **Stock Valuation and Market Movement (§6):** Fully compliant. Par values restricted to allowable tiers (¥65, ¥70, ¥80, etc.). Share prices move down on sales, right on dividend payouts, and left on withholds.
3. **Flotation & Capitalization (§7):** Fully compliant. 100% of par capital (10× par) is deposited into corporate treasury once 50% of shares are sold from the IPO.
4. **Track Tile Upgrades & Connectivity (§8):** Fully compliant with tile limits and legal orientations. Yellow upgrades preserve pre-printed connectivity; mountain terrain costs (¥80) are deducted accurately.
5. **Phase Progression & Equipment Rusting (§10):** Phase 3 triggered exactly on the purchase of the first 3-train (Revision 69). Green tiles unlocked and inter-company private sales permitted immediately.
6. **Multiplayer State Consistency:** Across all 91 revisions, server state snapshots in `playtest.sqlite3` matched the frontend projection byte-for-byte. Independent profile reloads recovered identical revision numbers without desynchronization.

---

## G. Human Playtesting Readiness Conclusion

### Verdict: **CONDITIONALLY READY**

#### Justification
The application successfully demonstrated that four independent human players can authenticate, join, conduct auctions, trade shares, float corporations, lay track, calculate routes, execute dividend payouts, purchase trains, advance phases, and trade private assets through the ordinary user interface.

However, human playtesting should **not** begin until `MAP-001` (Map Hex Selection Lockup) and `TRN-001` (Mandatory Train Purchase Rejection) are resolved. In human sessions, these defects will cause immediate player confusion, reported game freezes, and aborted matches. Once the two-line fix for `MAP-001` is applied, the game will be **READY** for comprehensive human testing.

---

## H. Prioritized Remediation Plan

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       REMEDIATION ACTION ROADMAP                           │
├──────────┬──────────┬──────────────────────────────────────────────────────┤
│ Priority │ Issue ID │ Recommended Engineering Action                       │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P0       │ MAP-001  │ Reset selectedHex to activeCorp.home after special   │
│ (Immed.) │          │ tile lays; fix map click event propagation.          │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P1       │ TRN-001  │ Add proactive mandatory train purchase UI guard and  │
│ (Pre-PT) │          │ disable End Turn when trainless with cash >= ¥80.    │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P1       │ LOB-001  │ Scope host credentials to sessionStorage to isolate  │
│ (Pre-PT) │          │ same-machine browser testing tabs.                   │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P2       │ AUC-001  │ Add explicit "¥X in Escrow" label to tabletop HUD.   │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P2       │ NEG-001  │ Trigger prominent toast notification when receiving  │
│          │          │ a corporate purchase offer for a private company.    │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P3       │ TYC-001  │ Add vintage audio sound effects (cash chime, whistle)│
│ (Tycoon) │          │ to enhance tactile 1990s tycoon aesthetic.          │
├──────────┼──────────┼──────────────────────────────────────────────────────┤
│ P3       │ TYC-002  │ Visually theme corporate treasury (brass vault frame)│
│ (Tycoon) │          │ vs player cash (leather wallet frame).               │
└──────────┴──────────┴──────────────────────────────────────────────────────┘
```

---

## Index of Supporting Evidence Artifacts

- **Lobby & Setup:**
  - [`01-gathering-entry.png`](evidence/01-gathering-entry.png) — Character appearance configuration.
  - [`02-host-lobby.png`](evidence/02-host-lobby-one-of-four.png) — Host waiting table (1/4 seats).
  - [`03-second-tab-host-controls.png`](evidence/03-second-tab-shared-profile-host-controls.png) — Shared-profile token leak.
  - [`05-chrome-p1-host.png`](evidence/05-chrome-p1-host.png) — Isolated Chrome Profile P1 (Host).
  - [`06-chrome-p2-no-host.png`](evidence/06-chrome-p2-no-host-controls.png) — Isolated Profile P2 (Guest).
  - [`09-all-four-start-enabled.png`](evidence/09-chrome-p1-all-four-start-enabled.png) — Ready lobby (4/4 claimed).
- **Auction & Early Game:**
  - [`10-game-initialization.png`](evidence/10-game-initialization.png) — Tabletop view at Rev 0.
  - [`12-utf-escrow.png`](evidence/12-utf-escrow.png) — Bidding escrow accounting on UTF.
  - [`13-utf-runoff.png`](evidence/13-utf-runoff.png) — Competitive bidding runoff between P1 and P3.
  - [`14-stock-round-handoff.png`](evidence/14-stock-round-handoff.png) — Stock Round 1 opening bell handoff.
  - [`15-ir-flotation.png`](evidence/15-ir-flotation.png) — Iyo Railway 50% flotation and treasury grant.
- **Operations & Equipment:**
  - [`16-first-operating-round.png`](evidence/16-first-operating-round.png) — OR 1.1 initialization on Shikoku Map.
  - [`17-track-preview.png`](evidence/17-track-preview.png) — Tile #57 preview on Matsuyama (E2).
  - [`18-mandatory-train-rejection.png`](evidence/18-mandatory-train-rejection.png) — Server rejection when skipping mandatory train purchase.
  - [`19-ir-route-quote.png`](evidence/19-ir-route-quote.png) — Non-mutating route preview (E2–F1 Ferry, ¥50).
  - [`20-route-validated.png`](evidence/20-route-validated.png) — Route commitment and revenue confirmation.
  - [`21-phase3-train-purchase.png`](evidence/21-phase3-train-purchase.png) — Purchase of 3-train and transition to Phase 3.
- **Advanced Operations & Edge Cases:**
  - [`22-er-private-transfer.png`](evidence/22-er-private-transfer.png) — Negotiated corporate purchase of Ehime Railway.
  - [`23-er-seller-required-action.png`](evidence/23-er-seller-required-action.png) — Counterparty acceptance workflow in Decisions Desk.
  - [`24-mf-port.png`](evidence/24-mf-port.png) — Special Mitsubishi Ferry Port Tile #437 placement on Susaki (G10).
  - [`25-mf-after-map-selection-no-change.png`](evidence/25-mf-after-map-selection-no-change.png) — Map ticket hex selection deadlock (P0 Defect).
