# Couple playtest triage — 20 October 2026

Updated 21 October 2026 after the dividend, deployment, card-zoom, and rewind clarifications.

Status: active fixes implemented and deployed on 21 October 2026. Turn rewind
remains deferred. The ranked table below retains the original investigation plan;
see [delivery and validation](../../validation/playtest-20261021/README.md) for final
behavior, test evidence, deployment versions, rollback files, and language limits.
The user confirmed that “English / Japanese version” means adding a language switch.

Current scope decisions:

- Prioritize checking and deploying the current `server_bridge.py` and any required
  matching runtime dependencies, then verify both remote route features.
- The IPO observation concerns dividends, not purchase proceeds or flotation capital.
  The user accepts the rulebook as authoritative: pool dividends go to the company,
  unsold IPO dividends stay with the bank. The local rule question is resolved;
  verify deployed behavior and labels after updating the bridge.
- Private-company cards get a corner zoom button that enlarges the card itself.
- Turn rewind is deferred. Existing history playback and added character animations
  remain in scope.

## Ranking

P1: address before the next meaningful remote playtest. P2: next usability release.
P3: presentation improvements after gameplay is clear and reliable. Effort estimates
are relative (S/M/L), not commitments or measured durations. Ranking combines player
impact, evidence, and implementation risk; it is not simply an implementation order.

| Rank | Priority | Observation | Proposed fix | Effort / evidence |
| --- | --- | --- | --- | --- |
| 1 | P1 | Remote bridge appears older; manual route editing fails | Compare deployed and local bridge/runtime versions, back up the database and current app, deploy the current bridge with required matching dependencies, restart the backend, and verify authenticated `route-options` in a separate test game. | M; user suspects stale bridge; host comparison still pending |
| 2 | P1 | Individual route revenue missing remotely | Verify after the bridge update: `route_quote.route_revenues`, custom `route-preview`, and each train card/total. Align frontend assets if needed. | S–M; remote cause unconfirmed; investigate remaining failures only after version alignment |
| 3 | P1 verification | Verify deployed dividend allocation and IPO/pool labels | Follow §9.1.1: market-pool dividends → company; unsold IPO dividends stay with bank. Keep the local engine formula and verify remote player/company/bank deltas after the bridge deployment. Correct misleading UI labels or any confirmed deployed discrepancy. | S–M; user accepts rulebook; local formula matches; remote behavior unverified |
| 4 | P1 | Company treasury too small, especially track/token phases | Give the operating company's cash a prominent, persistent amount near phase actions. Show cost and remaining balance beside a proposed purchase/lay. | S–M; reported readability barrier |
| 5 | P1 | Initial private-company cards cannot be enlarged | Add a visible zoom button in the corner of each card. It opens a large rendering of that same card, preserving artwork and readable text; closing returns to the auction without changing selection, bid, or purchase. Reuse modal infrastructure. | S–M; separate zoom and selection controls, no nested buttons |
| 6 | P1 | Current-turn indicator is inconsistently placed | Use one shared turn/status component at a consistent position across Game Table, stock exchange, and operating map. Show player, company where applicable, phase, and next action. | M; cross-screen presentation change |
| 7 | P1 | Players fail to notice it is their turn | Pair #5 with an immediate “Your turn” transition and a gentle reminder after a proposed 20 seconds without interaction. Offer configurable delay/mute; remind only the acting seat, suppress in history, and avoid repeated alerts on every poll. | M; 20 seconds is a proposed default |
| 8 | P1 | Confirmation requires finding another bottom button | Use a consistent in-app confirmation dialog with the action and consequences visible, keyboard focus, Confirm, and Cancel. If a countdown is used, make it an optional brief undo period for suitable actions, not a forced reading deadline. | M; retain revision validation and duplicate-submit prevention |
| 9 | P1 | Music is enabled on reopening but stays silent until toggled off/on | Preserve the preference, distinguish enabled/pending/playing states, and retry blocked playback on the first eligible user interaction without requiring a toggle cycle. Only mark playback started after successful play results. | S–M; swallowed play rejection and false playing state identified in source; browser reproduction pending |
| 10 | P2 | Train station/roundhouse illustration suggests incorrect train ownership | Render only owned engines under “Owned now: N”. Put proposed purchases in a separate “After purchase” preview; show capacity as text rather than engine-like empty bays. Preserve rust/trade-in previews. | M; source mixes staged fleet and owned count |
| 11 | P2 | Company home unclear on stock-round map | Add a persistent, labeled HOME marker using company identity and an outline/callout that is distinct from placed station tokens. Keep it visible before flotation and after expansion. | S–M; current preview already centers/highlights home, but shares highlight with other stations |
| 12 | P2 | Game Table stock navigation icon unclear | Use a recognizable share certificate/stock ledger graphic with a visible “Stock Exchange” label and matching hover/focus description. Match icon and destination wording across screens. | S; navigation discoverability |
| 13 | P2 | Music pops when window loses focus | Reproduce at a loop boundary while backgrounded. Replace animation-frame-dependent audio timing with audio-clock scheduling and smooth gain changes; define background playback/pause behavior explicitly. | M; plausible timing cause identified, audible symptom not reproduced |
| 14 | P2 | English/Japanese language switch | Add per-browser locale preference and shared translation/formatting helpers; translate core decisions and errors, then rules/help/onboarding. Support player-specific language in the same game. Start extracting strings during earlier UI work. | L; current bilingual fragments are not a complete localization layer |
| 15 | P3 | Flotation deserves a graphic/story alert | Build an illustrated railway charter/newspaper notice showing company, 50% threshold, capital received, and when operation begins. Reuse existing flotation event and character recipe; deliver across screens once per revision, with a readable history entry. | M; event and animation recipe already exist |
| 16 | P3 | Expand rewind/playback character animations, including receiving money from the little helper | Add a helper-to-recipient cash handoff using authoritative payer, recipient, amount, and destination. Expand accepted-event recipes for live play and history playback, with reduced-motion fallback and playback-speed support. | M; preserve existing playback style; distinct from gameplay undo |
| 17 | P3 | Add sound effects | Add restrained cues for turn start, accepted action, flotation, and train events, with effects volume/mute separate from music. Trigger from accepted events and deduplicate polling/reconnect/replay. | M; follow audio reliability work |

## Findings and implementation references

### Remote routes: likely deployment mismatch, not yet established

The configured target is `http://10.0.0.30:8080`, SSH `jawaad@10.0.0.30`.
The deployment launcher is explicitly frontend-only (`../../../deployment-cli/README.md`
and `../../../deployment-cli/apps.json`). The Pi guide instead requires keeping both
halves together (`../../deploy/raspberry-pi/README.md`, Updates).

Local `server_bridge.py` has:

- `route_plan_quote`, returning authoritative per-train `route_revenues`.
- `POST /api/1889/games/{room}/route-options` for stop editing.
- `POST /api/1889/games/{room}/route-preview` for custom-plan quotation.

`src/ui/routePlanning.js` uses these endpoints and binds responses to the exact
game, player credential, revision, and draft. A newer frontend with an older
bridge could explain both reports. Alternative causes include stale browser
assets, wrong seat/origin credentials, outdated revisions, route errors swallowed
by projection, and slow route computation on the Pi 2. The backend currently
catches all exceptions during recommended-route projection and returns an empty
quote; this merits checking if code versions match.

Treat deployment of the current bridge as the first concrete work item, following
the user's clarification. Check whether its imports, engine snapshot, appearance
catalog, or fixtures also differ, and transfer required matching runtime files.
Back up SQLite and retain copies of the current runtime/frontend before activation;
keep the persistent database outside uploads. Restart the backend so it loads the
new Python source, then verify saved-game resume and both route features. Align the
frontend only where its version requires it. Retain a compatible rollback copy.
The current frontend-only launcher cannot perform this backend update as configured.

Do not equate a healthy `/health` response with feature compatibility. Verify backend
build/file hashes and actual route responses, in addition to static assets. The
user's stale-bridge diagnosis is plausible but remains unconfirmed until the host
can be inspected.

### Dividend allocation: interpretation corrected, rulebook policy accepted

The user's observation concerns dividends while shares remain in the IPO, not share
purchase proceeds or flotation capital. The earlier capitalization explanation
answered a different question. The user has since explicitly accepted following the
rulebook even where their recollection was reversed.

The bundled Japanese rulebook `daemon18xx/docs/rules1889.pdf`, printed page 16,
§9.1.1, says:

- Dividends for shares in the open market (bank/market pool, including sold shares)
  enter company capital.
- Dividends for never-purchased IPO shares go to the bank (remain in the bank).

Local `_dividend` in `daemon18xx/app/engine1889/engine.py` implements that direction
through `revenue * corp["pool"] // 100`. The rulebook audit records it under
§§9.1.1–9.1.4. Retain this formula. The rule question is resolved; the host's actual
behavior and the clarity of the UI still need verification.

Example: ¥100 revenue, 50% player holdings, 30% IPO, 20% pool. Pay ¥50 to players,
¥20 to company treasury, and leave ¥30 in the bank. Use unequal IPO/pool percentages
so the deployment check can distinguish the two directions.

Acceptance covers zero IPO, zero pool, payouts versus withholds, exact per-player
receipts, bank/treasury conservation, persistence/reload, and matching receipt
labels/helper animations. Fix only confirmed deployed or display discrepancies;
no change to standard-1889 dividend policy is planned.

### Private-card enlargement and map homes

`src/components/Modals.js` already renders the large private-details dialog.
`PrivateCompanyCards.js` chooses selection attributes when `interactive` is true,
and details attributes otherwise. The initial auction uses interactive cards in
`StockExchange.js`. Add a separate corner magnifier button and enlarge the actual
certificate with its artwork, text, and status; a facts-only detail dialog is not
sufficient. Reuse modal/focus infrastructure, with a sibling zoom control rather
than a button nested inside a selection button. Zooming must not select, bid, or
purchase. Closing retains auction state. Check touch, Enter/Space, Escape, focus
return to the corner button, small viewports, and 200% browser zoom.

`renderCorporationMapPreview` in `HexMap1889.js` already includes the home in the
viewport and highlights it. The home and placed stations share the same highlighted
border. Improve visual distinction and labeling rather than adding duplicate map
data or relying only on color.

### Train ownership and background audio

`renderRoundhouse` in `TrainDesk.js` renders `projectedFleet` while its plaque starts
with the current owned count. `stagedDepotAction` may select a default train before
the player makes a choice. That creates a concrete way for the picture and perceived
ownership to disagree, even with a STAGED label.

`gameAudio.js` plays four HTML audio elements, handles volume interpolation, checks
its 58.5-second loop boundary, and corrects drift inside `requestAnimationFrame`.
Background-tab throttling is a plausible contributor to late seeks or abrupt gain
changes. The visibility handler in `main.js` clears character playback but does not
manage audio. Source inspection is not proof of the reported audible cause.

### Music enabled but silent after reopening

The user reports that saved Music On does not start audio on reopening the window;
turning it off and on makes it work. Treat this as a separate bug from background
popping, although both belong in the same audio reliability pass.

`GameAudioManager.updateContext` attempts startup only when uninitialized and enabled.
`playAll` discards every `audio.play()` rejection and sets `isPlaying = true`
unconditionally. Once initialized, subsequent renders do not retry that startup.
This is consistent with a blocked or failed initial playback attempt, though it has
not been reproduced in a browser in this investigation.

Proposed behavior: retain Music On as user intent; track pending and actual playback
separately; retry on an eligible pointer/keyboard interaction while enabled; never
restart music after the user has switched it off. A browser may require interaction
before allowing audio, so the goal is automatic recovery on interaction rather than
guaranteed sound before any interaction. Handle partial stem startup and pending
play promises, including mute/disable while a start attempt is in flight. Preserve
the selected room preset on retry and avoid duplicate starts on polling/rendering.

Acceptance: save On, reload/reopen, verify playback starts when permitted (or on the
first eligible interaction), with no off/on cycle. Also test saved Off, rejected play
then retry, partial failure, and disabling during pending startup. Check the actual
browsers used for the remote playtest, not only mocked Audio objects.

### More playback animation and the little helper

The user wants more of the existing rewind/history-playback animation style, including
an explicit little-helper money delivery. This is an enhancement to visualization;
it is separate from the requested ability to reverse a live operating turn.

`characterEvents.js` already binds cash-envelope props for share sales, dividends,
settlements, and flotation. The current dividend recipe is bound to the acting
player with total route revenue, which must not be mistaken for each shareholder's
actual payment. No helper handoff was found in the inspected event-binding code.

Propose a short sequence: helper offers the envelope, the correct recipient receives
and counts it, and a label names the amount and destination (personal purse or
company treasury). Use actual event facts and exact per-recipient allocations;
never infer a payout from the total revenue alone. Start with dividends/private
income and flotation, then extend to sale proceeds and other receipts where useful.
Confirm the intended helper character/artwork against the existing design before
adding a new character asset.

History playback should visualize the event at the inspected revision without
changing balances or replaying live notifications. Support step/rewind, all existing
playback speeds, cancellation, and reduced-motion/static presentation. Live polling
and reconnects must not duplicate the same delivery animation. Acceptance includes
multiple shareholders, company recipients, zero payments, and withhold versus payout.

### Turn rewind — deferred by the user

Reversing a live operating turn is outside the current delivery scope. Do not design
or implement checkpoints, rollback endpoints, or history restoration in this pass.
Retain the idea in the backlog for later. This deferral does not remove existing
read-only history inspection/playback or the requested animation enhancements.

## Remote test plan

1. Restore connectivity to the configured Pi address. Read served HTML asset IDs,
   backend version/file hashes, health, and service status without changing games.
2. Compare frontend, bridge, engine, and required runtime files with the local
   checkout; capture a failing authenticated route response without exposing tokens.
   Back up the database/current runtime, deploy the current bridge and required
   dependencies, restart the backend, then verify health and saved-game resume.
3. Use a separate two-seat test gathering. The installed Nginx deliberately blocks
   `/test` and `/api/1889/dev/*`; do not expose those publicly just to import a fixture.
   If a prepared route fixture is needed, use an isolated server-side test instance
   with a separate database and private access, or reach routes through normal play.
4. Verify per-train and total revenue, edit one route, reserve the other train's
   track, commit the plan, and confirm both clients converge after reload/rejoin.
5. Check stale revision, non-president, and historical-view behavior; rejected
   attempts must leave the game unchanged. Measure slow route responses on the Pi.
   Audit a dividend with unequal nonzero IPO/pool holdings: compare exact player,
   company, and bank deltas locally and remotely against §9.1.1, and
   verify persisted balances and receipt labels after reloading.
6. Verify saved Music On across reload/reopen, including first-interaction recovery
   without toggling. Verify saved Off stays silent. Background the browser for several
   music loops, return to it, and listen for pops. Repeat with music muted/effects
   enabled once effects exist. Check helper handoffs in live and historical playback.
7. After any approved deployment, repeat with a fresh tab and a previously open
   tab. Preserve ordinary games and keep frontend/backend rollback compatible.

## Verification performed

- 11 existing JavaScript route-planning tests passed.
- 6 existing bridge route-fixture/stop-editor tests passed.
- 2 focused engine rulebook tests passed: full capitalization, and route correction
  before dividend versus locking afterward. An initial invocation used the wrong
  test class for the latter; the corrected invocation passed both tests.
- Read the relevant bundled rulebook pages and inspected implementation references.
- Initial connectivity attempts failed. After the user's macOS permission change,
  HTTP and SSH succeeded. The installed bridge was confirmed stale (missing the
  stop-editor endpoint and per-train revenue fields), updated, and tested remotely.
- Final validation: 146 JavaScript, 46 bridge/application, and 20 engine tests pass;
  real Pi HTTP checks and two-client browser verification also pass. See the linked
  delivery report for details and saved visual evidence.

## Proposed delivery sequence

1. Inspect and deploy the current `server_bridge.py` with required matching runtime
   files, database/runtime backup, backend restart, and saved-game verification.
   Re-test manual routes and per-train revenue on the actual host before considering
   additional route-code changes. Remote connectivity is still a prerequisite.
2. Verify deployed dividend allocation and IPO/pool labels against accepted §9.1.1
   using unequal IPO/pool percentages and exact cash deltas. Preserve the correct
   local engine formula; fix any confirmed deployment/display discrepancy.
3. Accessibility and decision clarity: treasury, corner card zoom, common turn
   indicator, idle reminder, confirmation dialog, and music startup recovery.
   Introduce locale helpers while editing.
4. Fleet/home/navigation clarity, background audio reliability, and core localization.
5. Flotation presentation, expanded playback/helper cash delivery, and sound effects,
   then another two-person playtest in both languages on the actual host.

Turn rewind is deferred and has no implementation step in this delivery sequence.
The active delivery sequence is complete. Backend build `bd1a37a39dd3` and its
matching frontend are serving on the Pi. Saved game storage was preserved, and the
rulebook dividend formula was retained. Core Japanese gameplay UI is available;
reference material, diagnostics, and unknown strings can retain English fallback.
