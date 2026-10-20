# Koenji 1889 — second four-player validation

Validation completed 19 October 2026. **CONDITIONALLY READY.** A new four-player game reached the actual terminal results screen through Chrome UI, including phases 5, 6 and Diesel, emergency financing, presidency transfer and bank exhaustion. All four refreshed profiles agreed on the result. Independent arithmetic found no discrepancies. One newly observed misleading emergency-sale preview remains, and several adversarial/accessibility boundaries were not fully exercised.

## Baseline and preservation

Repository: `/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889`.

HEAD was verified as `e04fcbdf67871460d3e37ec556aeaf5758f58110` (expected e04fcbd), with a clean tracked working tree before validation. The prior [PLAYTEST_REPORT.md](PLAYTEST_REPORT.md), Chrome profile evidence, and remediation commits 58f776a/e04fcbd were read. No application code was modified. Final tracked diff is empty; new validation artifacts are untracked additions.

Original room CYEU10, its `validation/playtest.sqlite3`, report and evidence were preserved. Its database SHA-256 was checked against [preserved-database.sha256](second-run-evidence/preserved-database.sha256): `7c51792089e83519b73b44dd5bb47944fe1656ef40a18654ba59fbfdf146ac49`. This run uses `validation/second-playtest.sqlite3` and [second-run-evidence/](second-run-evidence/).

Environment: macOS 26.6.2 arm64, Chrome 155.0.8059.80, Node 26.7.0, Python 3.9.6, Vite 6.4.4, application 8.1.0, SQLite Python module reporting 3.51.0. These are local development services, not a public deployment. Frontend: `http://127.0.0.1:5199`; backend: port 8809; persistence: SQLite in the new database. Launch from repository root:

```sh
KOENJI_BACKEND_PORT=8809 DAEMON18XX_DATABASE=validation/second-playtest.sqlite3 npm run dev -- --host 127.0.0.1 --port 5199 --strictPort > validation/second-run-evidence/server.log 2>&1
```

The first sandboxed launch encountered EPERM; the authorized elevated launch succeeded. During post-game recovery testing the backend was stopped and restarted against the same database:

```sh
KOENJI_BACKEND_PORT=8809 DAEMON18XX_DATABASE=validation/second-playtest.sqlite3 python3 server_bridge.py >> validation/second-run-evidence/backend-restart.log 2>&1
```

`npm test` passed 94 JavaScript, 34 Python integration/remediation and 20 engine tests. `npm run build` passed, with the existing bundle-size warning (516.32 kB JavaScript). Logs: [tests](second-run-evidence/tests.log), [build](second-run-evidence/build.log), [server](second-run-evidence/server.log). These support, but do not substitute for, the browser observations below.

## Method and evidence boundaries

Primary room **DM0GHF** was created normally. Four independent Chrome profiles, Koenji Playtest P1–P4, completed membership/seat registration and retained distinct identities:

| Seat | Identity | Strategy |
|---|---|---|
| P1 | Aki Aggressive | Expand companies and fund technology advancement; retain revenue for trains. |
| P2 | Chi Conservative | Establish IR, manage cash and maintain routes. |
| P3 | Osa Opportunistic | Exchange DR, run AR, make private transactions and finance replacement trains. |
| P4 | Nori Newcomer | Straightforward purchases, MF placement, later KO and AR ownership expansion. |

Every primary action was selected and submitted through the actual native Chrome UI. Later repetitive operations used bounded native UI helpers reading current accessibility controls; they did not call internal APIs or access hidden state to select primary decisions. Committed revisions were checked before continuing. SQLite was read only for retrospective diagnostics/accounting. The [chronological accepted-action ledger](SECOND_ACTION_LEDGER.md) records all 1,026 committed actions, timestamps, actors and cash deltas. Numbered text files in the evidence directory record browser observations and attempted inputs; they include failed native inputs and are not themselves proof of a committed action. Milestone PNGs corroborate rendered behavior.

Three separate diagnostic rooms were used. **PDYP5V** was an ordinary room for shared-profile host/guest behavior. **GH7OW3** used the visible Demo Tools fixture workflow for stock badges and protocol diagnostics. **I7PP5Q** used a UI-created fixture followed by API replay of primary actions 1–183 solely to prepare a train-offer scenario. The replay and direct protocol calls are diagnostic API work, not UI playtesting or part of DM0GHF. Offer creation/acceptance in that prepared room was then performed in Chrome.

## Fix-by-fix browser results

| Area | Result and evidence |
|---|---|
| UI-001 host moved off p1 | **Passed browser check.** In PDYP5V the host moved p1→p2, then opened the p1 guest invitation in the same profile. Guest host controls were hidden and the shared-profile notice explained the situation. The original host tab retained p2 identity and host controls after reload. [Host moved](second-run-evidence/01-host-reordered.png), [guest notice](second-run-evidence/02-shared-guest.png), [host reloaded](second-run-evidence/03-host-reload.png). |
| UI-002 mandatory train despite sufficient cash | **Passed browser check.** At primary r31 IR had a connected route, no train and ¥800 corporate cash. The UI required purchase of the ¥80 2-train and disabled End Turn. Purchase r32 satisfied the obligation; the turn subsequently ended legally. [Train step](second-run-evidence/ui002-train-step.png). Later trainless AR/SR also encountered mandatory funding. |
| Completed private offers | **Passed browser check.** AR bought ER for ¥40 following seller consent at r59 and completion r60. Completed offer banners/actionable entries disappeared; the later ledger showed no offers. [Completed private purchase](second-run-evidence/er-completed.png), [ledger](second-run-evidence/er-ledger-after-completion.txt). |
| Completed train offers | **Passed browser check on API-prepared diagnostic position.** I7PP5Q: IR offered 3-0 to AR for ¥100 at r184; buyer accepted through confirmation at r185. Buyer and refreshed seller had no pending banner; ledger showed no offers. [Completed transfer](second-run-evidence/train-offer-completed.png), [replay classification](second-run-evidence/train-offer-replay.json). This is not a primary-game intercompany train sale. |
| City labels, hex selection, corporation inspection | **Passed exercised interactions.** Ordinary track placements and routes used E2, K8, G10, I2, D3 and J9 consistently. Diagnostic KO inspection selected K4/Takamatsu while IR remained the operating corporation, with explanatory text distinguishing inspection from action authority. [Inspection](second-run-evidence/inspection-vs-operation.png). No recurrence of the prior map deadlock was observed. This is not an exhaustive map audit. |
| MF placement | **Passed primary UI check.** P4 opened MF private details, saw eligible B11/G10/I12/J9 choices and placed #437 at G10 at r28. [Private details](second-run-evidence/mf-details.png). |
| Operating Order badges | **Passed browser check in fixture room.** Stock view distinguished AR Unparred, KO Par ¥75/20% sold and IR Floated ¥80. Operating view marked IR “OPERATING (TRACK)” while other statuses remained distinct. [Stock badges](second-run-evidence/operating-order-badges-stock.png), [operating badge](second-run-evidence/operating-order-badge-operating.png). |
| Long-panel confirmation | **Partially verified.** Confirmation controls rendered visibly in long train/route/private panels and native keyboard Find/Return successfully operated confirmations during play. No blocking clipped confirmation was observed. A systematic Tab/Shift-Tab focus-order, focus-trap and viewport-size audit was not completed; do not treat rendered markup or passing tests as full keyboard-accessibility certification. |

## Chronological game walkthrough

The linked action ledger is the complete chronology; this table highlights consequential decisions and transitions.

| Revisions | Browser-played events and outcomes |
|---|---|
| 0–8 | Four players began with ¥420 each. Auction bids included UTF ¥155 in escrow; private acquisitions totaled ¥435, leaving bank ¥5,755. |
| 9–27 | IR and AR parred at ¥80 and each floated for ¥800. P3 exchanged DR. Legal stock purchases and passes began OR1.1. |
| 28–42 | MF port placed through private details. IR/AR laid home track; mandatory train UI verified. Both bought 2-trains. AR reached fleet 4/4 and further train purchase was visibly disabled. |
| 43–74 | IR retained revenue and bought the first 3 at r51 (phase 3). AR paid revenue, bought ER with consent and used its special track. SR parred ¥65 and floated for ¥650. |
| 75–173 | Track and routes developed. AR paid dividends while IR/SR retained money for future trains. Legal stock passes and operating sets continued. |
| 174–180 | SR bought the first 4 for ¥300, triggering phase 4 and rusting all six 2-trains. Forced discard of 3-2 at r175 resolved fleet 4/3 before the turn could finish. |
| 181–276 | Trainless AR bought replacement 4 for ¥300. Further 4s were bought legally. P1 sold 10% IR at r246; subsequent dividends exercised bank-pool income. |
| 277–300 | IR bought the first 5 for ¥450: phase 5, non-UTF private closures and UTF revenue ¥50. IR, AR and SR each resolved forced discards at r278–280. KO parred ¥100 and floated for ¥1,000. |
| 301–372 | KO bought the remaining two 5s. The phase-5 operating set included three ORs. UR later parred ¥100 and floated for ¥1,000. |
| 373–444 | UR bought first 6 for ¥630 at r381: phase 6 and 3-train rusting. UR and KO developed their first routes. IR accumulated ¥843. |
| 445–471 | IR traded its 5 toward Diesel, paying ¥800 and retaining ¥43; Diesel rusted 4s. AR then needed ¥400 presidential contribution but P3 had ¥328. A legal emergency AR share sale raised ¥140; AR bought the returned 5 for ¥450 using ¥50 corporate + ¥400 personal. SR later bought a 6 using ¥210 corporate + ¥420 presidential funds. |
| 472–555 | Stable routes and payouts continued. P4 bought AR stock; P3's r534 sale transferred the presidency to P4. P4 reached AR 60%; the next purchase preview showed 60%→70%, the 60% limit and disabled purchase. Cash was also insufficient for some alternatives, so this is visible-limit coverage, not an isolated server rejection test. |
| 556–999 | Normal stock and operating rounds continued through sets 12–17. Companies operated legal established routes and paid dividends. No fixture, forced state or illegal purchase accelerated the primary game. |
| 1000–1026 | IR dividend reduced bank ¥65→¥0 in OR17.2. Bank-break/end-after-set flags were set, but the game remained unfinished. OR17.3 ran in full. Final End IR at r1026 produced the terminal result screen with end reason bank. |

Phase evidence includes `before-phase4.png`, `phase4-discard.png`, `diesel-trade-in.png`, `emergency-share-sale.png`, `presidency-transfer.png`, `ownership-limit.png`, `bankbreak-at1000.png` and `final-first.png` in the evidence directory.

## Independent accounting and completion

The read-only [audit script](second-run-tools/audit.py) checks snapshots and transaction arithmetic without invoking the engine action validator. [Audit output](second-run-evidence/accounting-audit.json) reports **zero violations** across 1,027 snapshots, all 1,026 accepted actions, 160 route claims, 172 dividend decisions and five full capitalizations. It checks:

- Bank + personal cash + corporate cash + auction bid escrow = ¥7,000 at every saved revision.
- IPO + pool + player holdings = 100% for every corporation at every revision.
- Route revenue as the sum of selected board stop values using the correct normal/Diesel revenue tier. This verifies arithmetic, not an independent graph-legality implementation.
- Dividend amounts from holdings, pool payments into corporate treasury, retained revenue and corresponding bank changes.
- Full capitalization at ten times par, and final scores from cash, share percentages at independently read market-grid prices, and open-private face value.

Significant payments reconcile: IR first 5 cash ¥996→¥546; Diesel trade-in ¥843→¥43; AR emergency sale personal ¥328→¥468, then contribution ¥400→¥68; SR contribution ¥420 reduced P1 ¥703→¥283. ER purchase transferred ¥40 corporate-to-seller. Auction escrow was included during bidding rather than counted as vanished money.

At the bank break r1000 the state was unfinished, OR2 of 3. The required final OR17.3 drained a further ¥295: UTF income ¥50, UR payout ¥45, AR ¥80, KO ¥25, SR ¥30 and IR ¥65. The final bank was **−¥295**. AR's pool owned 20%, contributing ¥16 of its ¥80 distribution to treasury; IR pool 10% received ¥13 of its ¥130 distribution. Final route claims included AR ¥80, UR ¥90, KO ¥50, SR ¥60 and Diesel IR ¥130. The 5-train did not receive Diesel-only stop values merely because the global phase was D.

| Rank | Player | Cash | Share value | Open privates | Verified final total |
|---:|---|---:|---:|---:|---:|
| 1 | Nori Newcomer (P4) | 1,635 | 3,755 | 0 | **5,390** |
| 2 | Aki Aggressive (P1) | 1,983 | 1,750 | 150 | **3,883** |
| 3 | Chi Conservative (P2) | 1,501 | 1,910 | 0 | **3,411** |
| 4 | Osa Opportunistic (P3) | 1,086 | 1,655 | 0 | **2,741** |

Final market prices: AR/SR/KO/UR ¥350; IR ¥255. TR/KU remained unparred. UTF alone remained open, valued ¥150 with revenue ¥50. Personal cash ¥6,205 + corporate cash ¥1,090 − bank deficit ¥295 = ¥7,000. Corporate treasury is excluded from personal final scores.

All four profiles were refreshed and independently displayed the same final revision, scores, ranking and winner: [P1](second-run-evidence/final-p1.png), [P2](second-run-evidence/final-p2.png), [P3](second-run-evidence/final-p3.png), [P4](second-run-evidence/final-p4.png). They agreed again after backend restart: `recovered-final-p1` through `recovered-final-p4` PNG/text evidence. No next gathering was started.

## Multiplayer, recovery and protocol results

Independent profiles retained their own memberships. Repeated profile switches, refreshes, navigation away/return and fresh windows recovered the appropriate seat/current committed game state. P3 also recovered after an extended inactive period. Revision checks paused automation when observations lagged rather than submitting a speculative next move.

For an actual service outage after completion, the backend process was terminated while Vite remained up. Browser reload visibly reported “Backend unreachable: HTTP 500” ([evidence](second-run-evidence/backend-offline.png)). Restarting the backend with the same database recovered the terminal game; all four profiles again showed identical results. This verifies persisted completion recovery, not a network partition during an active turn.

In separate GH7OW3 diagnostics, the browser Demo Tools stale action produced HTTP 409 without changing revision. Its duplicate-action button initially required a prior action and did not itself establish successful deduplication. Explicit **API diagnostics** then submitted two concurrent commands against revision 16: one accepted (200/revision17), one rejected (409). Repeating the accepted command ID returned 200/revision17 without another commit; a new stale command returned 409; forged actor returned 403; final revision remained17. [Protocol results](second-run-evidence/protocol-api-diagnostics.json). This is protocol-level evidence, not proof of two simultaneous native mouse submissions across profiles.

## Confirmed defect

**UI-003 — P2 / medium: emergency share-sale preview falsely announces presidency transfers.**

Reproduction from primary r453: AR is operating without a train, president P3 requires emergency funds. Open emergency sale choices. P3 holds only 10% IR and is not IR president (P2 is). The IR sale preview says “Holdings → 0% · Presidency transfers.” SR, KO and UR similarly show the transfer warning although their existing presidents are other players and P3 is selling a non-presidential 10% holding.

Evidence: [recorded browser controls](second-run-evidence/1083-ar-emergency-actions.txt), `emergency-share-sale.png`, and read-only holdings at that revision. Source inspection of `src/components/TrainDesk.js` identified the comparison of the projected president with the operating corporation's president, rather than the sold corporation's previous president. This explains the misleading label. No incorrect actual presidency transfer was demonstrated; the legitimate AR transfer at r534 worked. The primary game used the legal AR sale and continued. No application fix was made during validation.

Impact: a player can be misled about a consequential emergency funding choice. Compare the target corporation's before/after president when determining this warning. Retest the UI with both a true transfer and an ordinary non-president sale.

## Automation failures, uncertainties and remaining gaps

Native accessibility element IDs occasionally became stale, foreground/profile observations lagged, and keyboard Find sometimes failed to focus the intended control. Bounded recovery used current screenshots, fresh windows, current accessibility observations and pointer/keyboard input. Two native URL-entry attempts lost leading characters and opened Google search; verified full-URL paste recovered them. These are classified as automation failures, not confirmed application defects. Delayed observations were resolved by checking the committed revision before another action. No hidden-state workaround advanced the primary game.

No further blocking product defect was confirmed. The following completion boundaries remain explicitly untested or partial:

- Certificate exhaustion/rejection: the game exercised counts and ordinary ownership, but did not reach the 14-certificate limit. AR's visible 60% limit was reached; an isolated ownership-limit server rejection was not forced.
- True simultaneous browser submissions, duplicate native clicks and active-turn multi-client network partition were not fully exercised. Separate API race/idempotency checks passed.
- Long-panel keyboard use worked in exercised workflows, but complete Tab-order/focus-trap and responsive viewport accessibility coverage remains partial.
- Bankruptcy termination, every corporation/private combination, every tile/route rule and every possible emergency funding branch were not exhausted. The actual terminal condition tested was bank exhaustion.
- Diagnostic intercompany train transfer was browser-verified on an API-prepared position; it did not occur organically in the primary game.

The requested full primary playthrough and final-score agreement are complete. The readiness verdict remains **CONDITIONALLY READY** because the emergency preview defect should be corrected and the listed interaction boundaries merit focused follow-up. Passing automated tests alone is not the basis of this verdict; the completed game, preserved chronological evidence, browser fix checks and independent arithmetic are its supporting evidence.
