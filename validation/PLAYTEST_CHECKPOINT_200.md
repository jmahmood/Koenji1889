# Four-player UI playtest — evidence-based status

## A. Executive summary

**NOT READY: end-to-end validation remains incomplete.** Four isolated Chrome profiles participated in room **CYEU10** through **200 accepted UI game actions**, reaching **Operating Round 6.1, Phase 4**. The game is still live; there is no final result, ranking, or validated winner.

The continuation passed the earlier revision-91 checkpoint, purchased the first 4-train, rusted the 2-trains, and completed repeated operating/stock rounds. Native desktop automation eventually stopped reliably activating freshly observed controls: `AXError.invalidUIElement`, “element ID is no longer valid,” `cannotClickOffscreenElement`, and `noWindowsAvailable`. Reload preserved the player session and revision 200, but subsequent map navigation still failed through automation. This is a **test-environment blocker**, not a demonstrated application deadlock. Full completion needs a working native input/capture channel or four browser profiles exposed through a supported browser connector.

Confirmed product observations in this report: **P0 0, P1 0, P2 2, P3 0**. These counts describe this run, not a certification that higher-severity defects do not exist. Additional usability concerns remain tentative.

**Correction to the earlier report:** the archived `PLAYTEST_REPORT_EARLIER_UNVERIFIED.md` contains unsupported conclusions and must not be used for release decisions. Its P0 map-deadlock claim is not established; optional Skip Track allowed continued play. Its initial bank figure, “fully compliant” assertions, byte-for-byte synchronization claim, mandatory-train severity, and readiness verdict were overstated. The actual starting bank was **¥5,320**, total money **¥7,000**. Incomplete validation requires NOT READY under the requested rubric.

## B. Environment and methodology

- macOS, Node 26.7.0, Python 3.9.6, SQLite, Vite 6.4.4.
- Git baseline `75c8179be66af15daac45bd5d4ee237445f31789`; dirty working tree. Initial recorded application version 8.0.0; package now reports 8.1.0. Source/package changes occurred during the broader session, so this was **not an immutable build qualification**. Baseline hashes/patch and final hashes are retained in evidence. No application source edits were made as part of these validation actions.
- Frontend `http://127.0.0.1:5189`; Python bridge port 8799; database `validation/playtest.sqlite3`.
- Launch: `KOENJI_BACKEND_PORT=8799 DAEMON18XX_DATABASE=validation/playtest.sqlite3 npm run dev -- --host 127.0.0.1 --port 5189` from repository root. Vite launches the bridge. Local listening required sandbox escalation. `npm run build` passed with a bundle-size warning; build success is not gameplay success.
- Gameplay used native Chrome UI via `cua_repl`. No internal API or database write advanced the game. Read-only SQLite diagnostics were exported afterward for accounting and the accepted-action ledger.
- Four signed-out Chrome profiles: P1 Akira Aggressive (host), P2 Chiyo Conservative, P3 Osamu Opportunistic, P4 Nori Newcomer. Profiles independently claimed seats and retained distinct player credentials. This establishes local membership/seat registration, not a tested email/password account system.
- P1 bid competitively and invested broadly; P2 retained corporate earnings; P3 exchanged DR and acquired ER for AR, paying dividends; P4 followed visible instructions and used MF. Later rounds reused stable legal routes and passed stock turns; this narrowed strategic coverage.
- Native profile switching, refreshes, fullscreen recovery and reduced zoom were operational workarounds. Personal Chrome activity interfered earlier; the user subsequently agreed to leave Chrome idle. Later invalid-control failures persisted. No private browser contents were retained as evidence.

[Profile verification](CHROME_PROFILE_VERIFICATION.md), [build log](evidence/build.log), [server log](evidence/server.log).

## C. Chronological walkthrough

Every accepted action and timestamp is preserved in [ACTION_LEDGER.md](ACTION_LEDGER.md). `live-*-ui.txt` and `live-*-action.txt` files preserve successive accessibility observations. They may include pre-render states; the accepted-action ledger is the authoritative diagnostic for committed revisions. Earlier `run-*` snapshots had a stale helper issue and should not independently establish outcomes.

| Revisions | Round/phase | Actions and observed consequences |
|---|---|---|
| 0 | Lobby/setup | Four profiles claim seats; only P1 has host authority; start enabled at four claimed seats. Each player ¥420, bank ¥5,320. |
| 1–10 | Private auction | P1 UTF155, P3 raises160, P1 raises165; P3 drops out/refunded. TR20 P2, MF30 P4, ER40 P1, SMR50 P2, DR60 P3, SIR80 P4; UTF165 awarded P1. Bank ¥5,765 afterward. |
| 11–30 | Stock 1, phase2 | P2 pars IR65; P3 exchanges DR for IPO10% IR out of turn, then pars AR65. IPO purchases float IR and AR at 50%; each receives ¥650. Separate finish-turn controls and four passes advance correctly. |
| 31–41 | OR1.1 | IR yellow57 E2; AR yellow57 K8. Zero revenue withholds. IR buys one2, AR two2s. Attempted premature End IR is rejected with no revision change; buy80 resolves obligation. |
| 42–57 | Stock2 | Additional IR/AR shares; P4 pars SR65. Other players buy until SR floats ¥650. Passes advance. |
| 58–70 | OR2.1 | SR tile6 I2 and two2s. IR tile9 D3; E2–F1 route50 withheld, buys final2 and first3 for180. Phase3 begins at69. |
| 71–81 | OR2.1 | AR green15 K8; route50 paid; two3s bought. P3 offer ER40, P1 consent, P3 corporate purchase; P1 executes ER free green14 C4, then returns control to AR. |
| 82–104 | Stock3 / OR3.1 | Four passes. AR tile58 J9, two routes90 paid. P4 MF437 port G10; optional normal track later skipped after map input failed. SR route40 paid, buys two3s. IR routes120 withheld; first4 bought300 at103, phase4 rusts all six2s. OR continues. |
| 105–119 | OR3.2 | AR90 paid, SR40 paid, IR120 withheld. Existing3s and4 operate; OR set ends normally. |
| 120–153 | Stock4 / OR4.1–4.2 | Stock passes, then each corporation completes both ORs with the same legal routes/dividend policy. |
| 154–187 | Stock5 / OR5.1–5.2 | Same sequence, successful repeated payouts/withholds and profile handoffs. |
| 188–200 | Stock6 / OR6.1 | Four stock passes. AR90 paid and finishes. SR skips optional track/token, commits route40 and pays dividend at200. SR train step pending, IR still to operate. Native automation can no longer reliably activate controls. |

Checkpoint at200: personal cash P1 **446**, P2 **298**, P3 **335**, P4 **399**; corporate AR **160**, IR **780**, SR **130**; bank **4,452**. Sum = **7,000**. Phase4, SR president P4, train step. `finished=false`, result absent, bank not broken. These are a checkpoint, not final scores.

Screenshots: [four seated lobby](evidence/09-chrome-p1-all-four-start-enabled.png), [initialization](evidence/10-game-initialization.png), [escrow](evidence/12-utf-escrow.png), [runoff](evidence/13-utf-runoff.png), [flotation](evidence/15-ir-flotation.png), [track](evidence/17-track-preview.png), [mandatory train rejection](evidence/18-mandatory-train-rejection.png), [route quote](evidence/19-ir-route-quote.png), [phase3](evidence/21-phase3-train-purchase.png), [ER sale](evidence/22-er-private-transfer.png), [seller action](evidence/23-er-seller-required-action.png), [MF port](evidence/24-mf-port.png), [phase4/rust](evidence/26-phase4-rust-event.png). Native captures can lag accessibility observations; the [last native capture](evidence/27-revision200-native-capture.png) is paired with [reconnected AX state](evidence/27-revision200-reconnected.txt), not represented as terminal-game evidence.

## D. Defect register

### UI-002 — P2 — End-turn affordance permits an action known to be mandatory-invalid

OR1.1, P2/IR, revision33. With a route and no train, End IR Turn appears enabled. Clicking it produces `Move not accepted: Corporation with a route must buy a train`; revision remains33. Buying the available2 for80 succeeds at34. Expected: mark the purchase mandatory and disable/explain End Turn before submission. Reproduce with a trainless IR after track and zero-revenue resolution. [Screenshot18](evidence/18-mandatory-train-rejection.png). Server rule enforcement worked; this did not prevent continuation. Recommended: use the server's train-obligation decision to guide/guard End Turn. Does not alone block supervised human testing.

### UI-001 — P2 — Shared-profile invitation tabs retain the creator identity

Initial lobby diagnostic GJDQCD. Opening an invitation in another tab in the same browser profile still exposes the stored creator identity/host controls. Expected for a second-person testing flow: clear identity disclosure and guidance to use an independent browser profile, or explicit identity selection. [Screenshot03](evidence/03-second-tab-shared-profile-host-controls.png). Reproduce by creating a gathering, opening its invitation in a second same-profile tab, and checking viewing identity and host controls. This is a same-storage-context identity/discoverability issue; it is **not evidence of cross-profile token theft or a remote authorization bypass**. Four independent Chrome profiles avoided it. Recommended: explain the shared identity and provide a supported multi-person local testing workflow. Does not block isolated-profile human testing.

### ENV-002 — environment blocker, no product severity assigned

At revision200 newly observed native AX element indices fail immediately; coordinate/scroll actions also report no windows. Screenshots and AX trees sometimes describe different rendering moments. Reproduced across route confirmation, modal close, map navigation; tried fresh observations, new native bindings, automation runtime reset, profile changes, fullscreen enter/exit, zoom reduction, keyboard activation/Escape, and reload. Some actions recovered earlier; the final clean reload retained P4 and200 but map control activation remained unreliable. No application deadlock is proven. Resume with reliable input before qualifying the game.

### Unconfirmed concerns

Map city selection often did not change the selected hex after MF placement, but native input was also failing elsewhere. Do not classify as P0 or prescribe a source fix from this evidence. Inspecting a different corporation without changing the operating ticket is explicitly described by the UI and is not itself a defect. An Operating Order “Unfloated” label appeared suspicious on already-operating companies; requires stable reproduction. MF power discoverability and counterparty offer visibility deserve human testing. Audio/animation quality was not measured and is not counted as a defect.

## E. Usability assessment

Turn/phase headers, operating steps, separate route validation/commit, par costs, IPO holdings, and explicit personal/corporate labels generally supported progression. Private-company negotiation requires several profile handoffs and a separate decision panel; seller action visibility should be tested with actual newcomers. The MF port action was found on the selected coastal hex rather than the private-card detail panel. Long decision panels and retaining scroll position make confirmations harder to locate. UI now contains explicit vault/purse financing language; the earlier report's blanket claim that no wallet distinction exists is inaccurate. No reliable conclusion about ordinary mouse accessibility follows from native automation failures alone.

## F. Rules, accounting, and multiplayer assessment

The repository rulebook and `daemon18xx/docs/1889_RULEBOOK_AUDIT.md` supply expected rules. The audit is implementation-authored evidence, not independent certification. Expected sequence: private auction → stock → operating set; first3/4/5/6/D trains advance phases, with rust/limits and track colors; later stock rounds interleave OR sets. Stock actions include par/buy/sell/pass subject to limits; OR steps track/token/routes/dividend/train, with mandatory train funding when required. Bank break should remain triggered and finish the prescribed OR set; bankruptcy and final wealth rules require separate coverage. Final wealth uses personal cash, share value, and applicable open privates, excluding corporate treasury. None of the terminal behavior was observed here.

| Checklist | Result |
|---|---|
| Auction turn order, competitive bids/escrow/refund | Exercised; UTF premium and refunded bid reconciled |
| Par, presidency, 50% flotation/full capital | Exercised for IR/AR/SR at65;650 each |
| IPO purchases, DR exchange, private consent/purchase | Exercised; ER40 debits AR and credits P1; DR closes |
| Track colors/rotations, free ER/MF power | Representative yellow/green and special lays accepted; terrain spending not independently exercised |
| Routes/dividends/withholds | IR50 then120; AR50 then90; SR40 independently summed from visible stops |
| Phase3 and4, 2-train rust | Observed; later fleets show all six2s removed |
| Phases5/6/D, forced discards, emergency funding | Not reached |
| Stock sales, presidency changes, limits, pool dividends | Not adequately covered |
| Endgame, scoring/rankings | Not reached; cannot certify |

Independent accounting: initial420×4+5320=7000. Private payments20+30+40+50+60+80+165=445; bank5765 after auction. Three full capitalizations cost1950. IR's first2 costs80; AR's first pair160. AR50 payout pays P1/P4 five each and P3 twenty;40% IPO retains20 in bank. Later AR90 pays54 to players; SR40 pays20; IR120 withhold pays120 to treasury. Private revenues total85 per OR after DR closes, of which ER10 goes to AR following its sale. Thus a stable OR drains279 including private income. At200 all cash still totals7000. [Accounting audit](evidence/accounting-audit.json) records all201 snapshots; auction escrow explains interim cash-only deficits (not missing money). This does not establish byte-for-byte UI/state equivalence.

Multiplayer: independent profiles, waiting/acting states, out-of-turn DR exchange, seller consent interruption, and later handoffs worked. Browser refresh restored credentials/state, including P4 at200. A local service interruption was recovered by restarting the same launch command against the same database; no accepted action was lost at that checkpoint. Concurrent actions, double-submit/idempotency, deliberate stale commands, network partition handling, and all-player final-result convergence were **not systematically tested**. HTTP polling is present; do not claim a websocket transport test.

[Read-only checkpoint diagnostic](evidence/revision200-state-diagnostic.json) contains no login/creator tokens. It was inspected after action selection for verification only.

## G. Human playtesting readiness

**NOT READY under the requested acceptance criteria**, because no terminal four-player game or final score verification exists. This is not evidence that the game cannot finish. Deployment, four-player participation, auctions, stock/operations, two train phase transitions, selected transactions, refresh recovery, screenshots, and logs are demonstrated. Terminal state, scoring, later phases and adversarial resilience coverage remain open. The automation blocker is documented; it is not a product P0.

## H. Prioritized next work

1. Restore reliable isolated browser control and resume CYEU10 at200: P4 finish SR train step, then P2 operate IR. Preserve the existing database/profile credentials.
2. Reach an actual bank-break or bankruptcy result using ordinary UI. Verify rankings independently and observe the same terminal result in all four profiles.
3. Cover the outstanding phases, stock sales, presidency/limit/emergency rules and resilience cases in a separate diagnostic game where necessary.
4. Address UI-002 mandatory-action guidance and UI-001 same-profile identity messaging. Reproduce map selection/label concerns with a reliable human pointer before classifying or editing code.
5. Repeat qualification against a fixed source/build version; retain this dirty-build run as exploratory evidence.
