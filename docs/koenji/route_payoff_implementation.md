# Route payoff and tactile feedback

Implemented locally on 21 October 2026, following the [design plan](route_payoff_and_tactile_feedback_plan.md). No production deployment is included.

## Player experience

- Accepted route plans run a 2.9-second, staggered locomotive journey along the actual drawn rails. Curves, rotated exits, city nodes, and offboard termini share geometry with the map renderer.
- Each train retains its accepted earnings, followed by a compact operating receipt and an explicit “Awaiting dividend decision” label. No wallet moves during route execution.
- Skip settles immediately and transfers keyboard focus to Watch again. Local replay submits no game action. Dividend decisions remain available during travel.
- Payout receipts show actual personal and corporate balance deltas, market-pool allocation, retained IPO funds, and actual market movement. Withholding emphasizes the corporate treasury. Paid route details collapse to preserve room for train decisions.
- Track, stations, purchases, certificates, dividends, withholding, flotation, and warnings have distinct sounds. Local stop/connection selection uses a quiet paper tick. Accepted tiles, balances, acquired trains, and market positions receive local visual emphasis.
- Effects mute/volume remain independent of music. Settings add Normal/Quick/Instant route playback and Test sound. Motion Off/system reduced motion retain complete static information. New labels support English and Japanese.
- A soundboard at `/effects_soundboard.html` auditions individual cues and representative sequences against the current music stems; the existing music dashboard links to it.

## Implementation

`src/ui/actionPresentation.js` coordinates accepted event identity, lifecycle, sound, and route playback. Action-response/poll duplicates deliver once. Reconnect gaps settle statically without old whistles. Hidden tabs, room changes, history scrubbing, and superseding decisions cancel travel and its loop.

`src/ui/trackGeometry.js` supplies anchors and exact SVG line/quadratic paths to both the map and route timeline. `routePlayback.js` samples cumulative distance; `RoutePlaybackOverlay.js` patches only SVG transforms, traces, stop outlines, and result boundaries. Animation frames do not rerender the application. Ordinary rerenders preserve progress, receipt disclosure state, and playback-button focus.

The bridge adds optional accepted route paths, per-train revenue, scored-stop IDs, idle trains, and a small snapshot of the used track geometry. Existing validators calculate the financial totals. Recorded geometry that differs from the displayed board disables traversal rather than drawing across changed track. Older records retain their exact aggregate result without inventing per-train earnings. Corrected claims cannot borrow an older operating turn's receipt.

Additional optional presentation facts include net account deltas, actual market positions/prices, and revised unpaid route revenue. Net balance changes are labeled as net changes; the existing dividend allocation supplies payment attribution. The character/helper system is reused. A new route claim or dividend clears an outdated route character reaction before presenting the new consequence.

The sound pack is original deterministic synthesis in `src/ui/effectSounds.js`, rendered directly to cached Web Audio buffers. This removes asynchronous loading/decode races. `node scripts/write-effect-pack.mjs` exports identical PCM as fourteen mono WAV files plus a provenance manifest in `public/sfx/` for auditioning. Runtime voices are bounded, payment sounds are grouped, ledger ticks are rate-limited, travel loops are cancellable, and prominent cues duck music temporarily. Active mute/volume changes apply immediately.

The map's pre-existing duplicate gazette interpolation inside its desktop class was removed; the intended standalone gazette remains in place. This prevents duplicate rust windows and malformed overlay markup.

## Verification

- Full regression run: **156 JavaScript checks, 48 application/bridge tests, 20 engine tests passed** (224 total).
- After replay-safety/focus refinements, **35 focused JavaScript checks and 2 bridge presentation tests passed**, including the additional changed-track/older-claim regression.
- Production build passed. Vite retains its existing large-chunk advisory.
- `git diff --check` passed.

Browser checks used an isolated local SQLite database and matching bridge/frontend:

- Four-train routes resolved ¥70 + ¥100 + ¥60 + ¥60 = ¥290.
- Payout credited Kenji ¥145, Alex ¥58, and TR treasury ¥29; ¥58 remained with the bank for IPO shares. TR's price moved ¥55 → ¥60.
- Two-train routes resolved ¥50 + ¥40 = ¥90. Withholding moved only IR treasury ¥640 → ¥730; its price moved ¥75 → ¥70.
- Watch again, Skip, focused-button transfer, immediate dividend confirmation, preserved receipt disclosure state, Instant mode, English/Japanese labels, and settings sound preview were exercised.
- Soundboard loaded all cue controls and ran its route sequence without browser audio errors.

Evidence is retained in `validation/route-payoff/`. Automated timing/audio tests use fake clocks and audio contexts; browser verification is not a listening study across physical devices.

## Deployment and optional refinements

Deploy the updated bridge together with the built frontend, using the project's existing backend/build manifest checks. The changes add presentation fields to existing journal JSON and do not require a database migration or rules-engine replacement. Existing saved games remain readable. Retain the previous frontend and bridge for rollback; no database restore is needed to roll back presentation code.

Optional art/audio refinements remain: smoke puffs, additional locomotive silhouettes, real recorded Foley replacing the synthesized pack, and a broader listening/performance pass on club devices. The core traversal, financial separation, tactile vocabulary, controls, and lifecycle behavior are implemented.
