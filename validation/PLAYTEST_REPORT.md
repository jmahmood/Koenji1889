# Four-player UI playtest — evidence-based status

## A. Executive summary

**CONDITIONALLY READY for supervised human playtesting of the exercised core path.** A full four-player game in room **CYEU10** reached its terminal results screen at **revision 493**, after **Operating Round 14.2, Phase 4**. All four isolated Chrome profiles recovered the same winner and scores after browser reload. **Osamu Opportunistic won with ¥2,775.**

The bank broke at revision472 (SR dividend, bank −¥12). Play correctly continued through the remainder of OR14.1 and all of OR14.2; the game ended at493 with bank −¥411. Independent accounting reconciles **all494 stored revisions**, including auction escrow, to ¥7,000. Every final score was independently recomputed from personal cash, share units at final market prices, and open-private face values. Corporate treasury was excluded.

Earlier native desktop input failures were recovered during the resumed run using fresh profile windows, browser Find-to-focus keyboard activation, and explicit revision-change checks before closing dialogs or handing off turns. This is a documented UI automation workaround; no API calls or database writes advanced play. The original pending game was resumed, not replaced. Later phases5/6/D and several adversarial scenarios were not exercised, and the build changed during the broader session; this result is exploratory qualification, not exhaustive rules certification.

Confirmed product observations in this report: **P0 0, P1 0, P2 2, P3 0**. These counts describe this run, not a certification that higher-severity defects do not exist. Additional usability concerns remain tentative.

**Correction to the earlier report:** the archived `PLAYTEST_REPORT_EARLIER_UNVERIFIED.md` contains unsupported conclusions and must not be used for release decisions. Its P0 map-deadlock claim is not established; optional Skip Track allowed continued play. Its initial bank figure, “fully compliant” assertions, byte-for-byte synchronization claim, mandatory-train severity, and readiness verdict were overstated. The actual starting bank was **¥5,320**, total money **¥7,000**. The earlier NOT READY checkpoint was appropriate while the endgame was incomplete; the resumed terminal run supports the conditional verdict above.

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
| 201–221 | OR6.1–6.2 resumed | Finish SR and IR, then complete OR6.2. Native accessibility input failures required fresh windows and keyboard Find activation. Same room/database and membership identities retained. |
| 222–459 | Stock7–13 / OR7.1–13.2 | Repeated four stock passes and both ORs per set. AR90 paid, SR40 paid, IR120 withheld. Optional track/token skipped. Confirmed revisions before handoffs; occasional transition rendering required observing the newly available control again. |
| 460–471 | Stock14 / OR14.1 | Four passes; bank62 at start of14.1. AR90 pays54 to players, leaving8. SR route40 commits at471. |
| 472 | OR14.1, SR dividends | SR40 pays20 to players; bank falls to−12 and bank-break trigger remains set. Game continues. |
| 473–492 | OR14.1–14.2 | Finish SR/IR and complete final AR, SR, IR operations. Required two-OR set completes despite negative bank. |
| 493 | Finished | P2 ends IR turn; Match complete / Final results opens. Bank−411. Winner P3, score2775. All four profiles reload and display the same final rankings. |


Historical checkpoint at200: personal cash P1 **446**, P2 **298**, P3 **335**, P4 **399**; corporate AR **160**, IR **780**, SR **130**; bank **4,452**. Sum = **7,000**. Phase4, SR president P4, train step. `finished=false`, result absent, bank not broken. These are a historical checkpoint, not final scores. The completed game is summarized below.

Screenshots: [four seated lobby](evidence/09-chrome-p1-all-four-start-enabled.png), [initialization](evidence/10-game-initialization.png), [escrow](evidence/12-utf-escrow.png), [runoff](evidence/13-utf-runoff.png), [flotation](evidence/15-ir-flotation.png), [track](evidence/17-track-preview.png), [mandatory train rejection](evidence/18-mandatory-train-rejection.png), [route quote](evidence/19-ir-route-quote.png), [phase3](evidence/21-phase3-train-purchase.png), [ER sale](evidence/22-er-private-transfer.png), [seller action](evidence/23-er-seller-required-action.png), [MF port](evidence/24-mf-port.png), [phase4/rust](evidence/26-phase4-rust-event.png). Native captures can lag accessibility observations; the [last native capture](evidence/27-revision200-native-capture.png) is paired with [reconnected AX state](evidence/27-revision200-reconnected.txt), not represented as terminal-game evidence.

### Final scoring and endgame evidence

| Place | Player | Personal cash | Public shares at final market | Open privates at face | Independently checked net worth |
|---|---|---:|---:|---:|---:|
| 1 | Osamu / P3 | 1,015 | 4×350 AR + 1×10 IR + 1×350 SR = 1,760 | 0 | **2,775** |
| 2 | Nori / P4 | 1,113 | 1×350 AR + 1×10 IR + 2×350 SR = 1,060 | MF30 + SIR80 =110 | **2,283** |
| 3 | Akira / P1 | 1,177 | 1×350 AR + 1×10 IR + 1×350 SR =710 | UTF150 | **2,037** |
| 4 | Chiyo / P2 | 706 | 3×10 IR + 1×350 SR =380 | TR20 + SMR50 =70 | **1,156** |

No final score includes corporate cash (AR330, IR2940, SR130). Final monetary conservation: personal4011 + corporate3400 + bank(−411) =7000. UTF scores at face150 despite its auction price165. AR's corporate-owned ER does not score as a personal private. DR was exchanged and closed.

[Bank-break screenshot](evidence/28-bank-break.png), [bank-break AX](evidence/28-bank-break-state.txt), final screenshots for [P1](evidence/29-final-p1.png), [P2](evidence/29-final-p2.png), [P3](evidence/29-final-p3.png), [P4](evidence/29-final-p4.png). Each `29-final-pN.txt` records the post-refresh results in that isolated profile. [Final diagnostic](evidence/final-state-diagnostic.json) confirms `finished=true`, `end_reason=bank`, revision493 and the same four scores.

## D. Defect register

### UI-002 — P2 — End-turn affordance permits an action known to be mandatory-invalid

OR1.1, P2/IR, revision33. With a route and no train, End IR Turn appears enabled. Clicking it produces `Move not accepted: Corporation with a route must buy a train`; revision remains33. Buying the available2 for80 succeeds at34. Expected: mark the purchase mandatory and disable/explain End Turn before submission. Reproduce with a trainless IR after track and zero-revenue resolution. [Screenshot18](evidence/18-mandatory-train-rejection.png). Server rule enforcement worked; this did not prevent continuation. Recommended: use the server's train-obligation decision to guide/guard End Turn. Does not alone block supervised human testing.

### UI-001 — P2 — Shared-profile invitation tabs retain the creator identity

Initial lobby diagnostic GJDQCD. Opening an invitation in another tab in the same browser profile still exposes the stored creator identity/host controls. Expected for a second-person testing flow: clear identity disclosure and guidance to use an independent browser profile, or explicit identity selection. [Screenshot03](evidence/03-second-tab-shared-profile-host-controls.png). Reproduce by creating a gathering, opening its invitation in a second same-profile tab, and checking viewing identity and host controls. This is a same-storage-context identity/discoverability issue; it is **not evidence of cross-profile token theft or a remote authorization bypass**. Four independent Chrome profiles avoided it. Recommended: explain the shared identity and provide a supported multi-person local testing workflow. Does not block isolated-profile human testing.

### ENV-002 — recovered environment blocker, no product severity assigned

At revision200 newly observed native AX element indices fail immediately; coordinate/scroll actions also report no windows. Screenshots and AX trees sometimes describe different rendering moments. Reproduced across route confirmation, modal close, map navigation; tried fresh observations, new native bindings, automation runtime reset, profile changes, fullscreen enter/exit, zoom reduction, keyboard activation/Escape, and reload. Some actions recovered earlier; the final clean reload retained P4 and200 but map control activation remained unreliable. No application deadlock is proven. **Recovered on resumption:** fresh native profile windows and keyboard Find focused exact visible controls; confirmations selected the button match, Escape closed planning, and revision polling verified mutations before another action. Same game reached493. Browser identity remained profile-isolated. No privileged gameplay shortcut was used.

### Unconfirmed concerns

Map city selection often did not change the selected hex after MF placement, but native input was also failing elsewhere. Do not classify as P0 or prescribe a source fix from this evidence. Inspecting a different corporation without changing the operating ticket is explicitly described by the UI and is not itself a defect. An Operating Order “Unfloated” label appeared suspicious on already-operating companies; requires stable reproduction. MF power discoverability and counterparty offer visibility deserve human testing. Audio/animation quality was not measured and is not counted as a defect.

## E. Usability assessment

Turn/phase headers, operating steps, separate route validation/commit, par costs, IPO holdings, and explicit personal/corporate labels generally supported progression. Private-company negotiation requires several profile handoffs and a separate decision panel; seller action visibility should be tested with actual newcomers. The MF port action was found on the selected coastal hex rather than the private-card detail panel. Long decision panels and retaining scroll position make confirmations harder to locate. UI now contains explicit vault/purse financing language; the earlier report's blanket claim that no wallet distinction exists is inaccurate. No reliable conclusion about ordinary mouse accessibility follows from native automation failures alone.

## F. Rules, accounting, and multiplayer assessment

The repository rulebook and `daemon18xx/docs/1889_RULEBOOK_AUDIT.md` supply expected rules. The audit is implementation-authored evidence, not independent certification. Expected sequence: private auction → stock → operating set; first3/4/5/6/D trains advance phases, with rust/limits and track colors; later stock rounds interleave OR sets. Stock actions include par/buy/sell/pass subject to limits; OR steps track/token/routes/dividend/train, with mandatory train funding when required. Bank break should remain triggered and finish the prescribed OR set; this was observed from472 through493. Final wealth uses personal cash, share value, and applicable open privates, excluding corporate treasury; all four totals were independently checked. Bankruptcy remains untested.

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
| Bank-break endgame, scoring/rankings | Observed at472/493; all four scores and post-refresh profile results agree |

Independent accounting: initial420×4+5320=7000. Private payments20+30+40+50+60+80+165=445; bank5765 after auction. Three full capitalizations cost1950. IR's first2 costs80; AR's first pair160. AR50 payout pays P1/P4 five each and P3 twenty;40% IPO retains20 in bank. Later AR90 pays54 to players; SR40 pays20; IR120 withhold pays120 to treasury. Private revenues total85 per OR after DR closes, of which ER10 goes to AR following its sale. Thus a stable OR drains279 including private income. At200 all cash still totals7000. The final [accounting audit](evidence/accounting-audit.json) checks all494 snapshots: cash plus held auction escrow equals7000 at every revision. Auction escrow explains interim cash-only deficits. This does not establish byte-for-byte UI/state equivalence.

Multiplayer: independent profiles, waiting/acting states, out-of-turn DR exchange, seller consent interruption, and later handoffs worked. Browser refresh restored credentials/state, including P4 at200. A local service interruption was recovered by restarting the same launch command against the same database; no accepted action was lost at that checkpoint. All four isolated profiles refreshed after completion and showed revision493, identical rankings and score breakdowns. Concurrent actions, double-submit/idempotency, deliberate stale commands and network partition handling were **not systematically tested**. HTTP polling is present; do not claim a websocket transport test.

[Read-only checkpoint diagnostic](evidence/revision200-state-diagnostic.json) contains no login/creator tokens. It was inspected after action selection for verification only.

## G. Human playtesting readiness

**CONDITIONALLY READY for supervised human playtesting.** The full four-player game completed through ordinary UI interaction, with no confirmed P0/P1 product defect in this path. The bank-break completion and final scores were validated, and all four profiles recovered identical results after refresh. UI-001/UI-002 should be addressed or monitored with newcomers.

Limitations: this stable-route game ended in phase4; later train phases, emergency funding/bankruptcy, presidency changes, stock sales/limits, and concurrent or duplicate submissions need separate diagnostic coverage. Local membership claims were exercised; external email/password registration was not present in the tested flow. The working tree changed during the session, so repeat against an immutable release build before a broad unsupervised playtest. The requested exhaustive scenario matrix is not complete, even though the primary full-game criterion is now met.

## H. Prioritized remediation and follow-up

1. Re-run the completed lifecycle against a fixed commit/build; preserve this exploratory database, accepted-action ledger, captures, and source hashes.
2. Improve UI-002: proactive mandatory train guidance and End Turn guard. Clarify UI-001: same-profile shared identity versus independent participant sessions.
3. In separate diagnostic games, exercise phases5/6/D, emergency funding, bankruptcy, forced discards, stock sales/presidency/limits and rejected illegal actions.
4. Test simultaneous actions, deliberate stale clients and double submissions without disturbing this completed game.
5. Reproduce map selection and labeling concerns using reliable human pointer input before classifying or editing application code. Evaluate MF discoverability and seller-offer visibility with actual newcomers.

The completed room remains **CYEU10**, revision493. No next gathering was started and no application code was modified by this validation pass.
