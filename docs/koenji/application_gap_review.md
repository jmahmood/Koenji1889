# Application versus plan and references

Reviewed 16 October 2026. This is a source and targeted verification review, not certification of a complete multiplayer match.

## Scope and evidence

The application is `koenji-1889/`. The starter-package root has a different, localStorage-only prototype in `src/main.js`; running Vite there does not run the authoritative game client.

Compared the original implementation plan, the room usability plan and implementation notes, the supplied interface overview and second stock-market illustration, current frontend action handlers, and the engine's action discovery and train handlers. Inspected the running clubroom in a browser. No live game move was submitted during this review. Opening the application automatically created its normal auction fixture room.

Executed `npm test` and `npm run build` in `koenji-1889`: 24 Node tests, seven bridge/integration tests, and 20 tests from `test_Engine1889.py` passed; production build passed. The command does not run every engine suite or a complete browser game.

## What exists

| Area | Implemented | Qualification / remaining work |
|---|---|---|
| Club table | Layered room, independent characters, turn indication, player inspection, physical board/certificate/card hotspots, room navigation | Current character art is a simplified interpretation of the illustrated references; approved familiar likenesses and richer pose art remain separate work. Seated membership is not actual online presence. |
| Auction | Company inspection, buy current offer, bids, pass, escrow/cash information, historical inspection | Tested auction flow exists. Negotiated private-company transactions during operating rounds (`offer` and corporate `buy_private` in Phases 3–4) are not exposed by the current handlers. |
| Stock | Par/president purchase, IPO/pool buying, 10% selling, pass/finish, DR exchange, comparison windows, geographic context | Sale handler fixes `percent: 10`, which blocks selling 20%+ of a corporation in one turn because `engine.py` allows only one sale block per corporation per turn (`turn["sales"]`). Client buy guards (`!alreadyBoughtThisTurn`, `< certLimit`, `<= 60%`) ignore market color zones (`y`/`o`/`b` certificate-limit exemption, `o`/`b` >60% holding exemption, and `b` repeat/multi-share IPO/pool purchases). `DR` exchange (`exchange_private`) is gated on the active player's Stock Round turn, blocking legal Operating Round and out-of-turn exchanges. (`pending_par` appears in `engine.py` `legal_actions` as an unused 1830 carryover; it is never set in 1889 or handled in `apply_action`.) |
| Map | State-backed SVG board, inspection, zoom, tile/rotation previews, commit, token placement, MF port controls | Candidates use `viewData.legal_tile_lays` when provided and fall back to local filtering (`getCandidateTilesForHex` omits `viewData`; `server_bridge.py` checks `laid_track` instead of `laid`). Token submission fixes `city: 0`, which is benign in 1889 because every multi-slot city is a single `nodes[0]` city node rather than a multi-city tile. ER (`pending_special`) guidance exists, but the interrupt is broken in the UI: `mapActionAuthority` sets `isOperatingPresident` to `false` during `pending_special`, disabling the Pass button so the ER seller cannot decline the optional `C4` lay, and the ticket's `Confirm Lay Tile` button only renders when `currentStep === "track"` even though ER can be bought during any operating step. |
| Routes | Compute/run best routes, route summaries/highlights, payout/withhold | No manual route construction (`run_routes`) or editable route-claim submission. The compute button commits `run_best_routes` immediately; it is not a separate quote/preview tool. |
| Trains | Depot schedule, available depot purchases, automatic engine phase/rust effects | No excess-train discard (`discard_train`), negotiated corporate train transfer (`offer` + `buy_train` with `price`), Diesel `trade_in` selection, emergency stock sales (`emergency_sell`), or bankruptcy (`bankrupt`). Because `mapActionAuthority` sets `isOperatingPresident` to `false` when `pending_discards` is non-empty without rendering a discard UI, any phase-change train discard hard-locks play. |
| History | Persistent accepted-action journal and snapshots, scrub/step/play/speeds/live, journal inspection, separate live/view revisions | Gameplay replay exists. Social conversation/stamps remain current-gathering information, not replayed social history. |
| Multiplayer | Authenticated seat tokens, authoritative HTTP actions, SQLite persistence, revision/idempotency checks, polling and local cross-tab notices | No ordinary lobby/invite/seat-claim experience. Demo room storage contains all seat credentials. Same-browser seat testing is not independent-user onboarding. Updates poll every 1.4 seconds rather than using the originally proposed Socket.IO push. |
| Club culture | Table messages/notes, one stamp per gathering, observer role, purchase and dividend presentation | No WebRTC voice, actual speaking/presence detection, guest-arrival lifecycle, or persistent member identity/attendance across gatherings. |
| Ending | Engine endgame/scoring and generic finished-state messaging | No dedicated final-results/scoreboard presentation (`state.result`) found in frontend source. No complete human multiplayer UI acceptance game established by this review. |

## How the references should be interpreted

The interface overview combines the intended social table, detailed financial/geographic workspaces, replay and club traditions with aspirational extras. The original plan explicitly defers gifts catalogues, automatic scrapbooks, stored/transcribed voice and cross-game support. Their absence is not unfinished MVP gameplay.

The current application implements the reference's two interaction depths and its dense financial comparison approach. Floating reference windows, restoration and split layouts are real interactions. The illustrated stock-market reference's sample prices, company identifiers, board and ownership are not rules specifications: the original plan explicitly makes engine data authoritative.

The room feels substantially simpler than the reference art. The largest product-behavior difference is that normal actions often have a single direct control, while uncommon but mandatory decisions have no interface. Better artwork alone will not resolve those gaps.

## Roadmap reconciliation

- PR 0–2: development harness, real stock action, durable journal and historical reads are substantially implemented. Their architecture follows the newer stateless engine, not the obsolete paths in the original plan.
- PR 3–4: illustrated social shell, navigation, committed-event animations and replay are implemented; art fidelity and exhaustive desktop/browser acceptance remain separate from source-level completeness.
- PR 5: incomplete at frontend level. Backend coverage documentation records full-game scenarios, but that does not establish that a group can finish through this UI. Missing train/emergency/transfer decisions, single-10%-only share sales, and the broken ER pass/non-track interrupt flow are concrete blockers.
- PR 6: stamps, observation and dividend animation exist; voice, reliable presence and normal guest/member lifecycle remain absent.

The existing implementation-status document's phrase “Full 1889 Frontend” overstates current action coverage. Its older backend revision description also predates the current coverage evidence. Prefer explicit subsystem status over a single completion percentage.

## Recommended next sequence

1. Unblock game-halting states and interrupts first: add `discard_train` UI when `pending_discards` is non-empty, add `emergency_sell` and `bankrupt` during mandatory train resolution, and fix the `pending_special` (ER) interrupt so the seller can pass or lay on `C4` regardless of which operating step triggered the purchase (remove dead `pending_par` checks carried over from 1830).
2. Fix Stock Round and special-power rule restrictions in the UI: add block-quantity selection (`percent`) for `sell_shares` (required by the one-block-per-corporation-per-turn rule) and Brown-zone `buy_shares`, relax client buy guards for Yellow/Orange/Brown market zones, and allow `DR` (`exchange_private`) during Operating Rounds and out-of-turn windows where `legal_actions` permits.
3. Expose Operating Round corporate negotiations and train options: add `offer` (`state.offers`) and corporate `buy_private` (Phases 3–4) / cross-corporate `buy_train` (`price`), plus Diesel `trade_in` selection.
4. Separate route planning/quotation (`best_routes` preview) from committed operation (`run_best_routes`), and expose manual `run_routes` submission if the desired tabletop experience includes choosing non-maximal or custom routes.
5. Add normal gathering creation, invitations/seat credentials, rejoining, and a dedicated endgame scoreboard (`state.result`). Keep development fixtures and all-seat switching as development tools, then complete a deterministic browser game and real multiplayer match before finishing familiar character art, live presence, and optional voice.

## Principal source locations

- `src/main.js`: bootstrap (around 293), polling (460), stock/auction/map action bindings (1930–2207).
- `src/components/StockExchange.js`: client-side buy/sell/DR guards (1123–1155) and share order ticket (1340–1385).
- `src/components/HexMap1889.js`: local tile-candidate fallback (367, 522), ER/operating guidance (1279), route/depot workspace (around 1730) and operating ticket (around 2250–2395).
- `src/ui/presentation.js`: `actionBlockReason` and `mapActionAuthority` (57–85).
- `src/api/client.js`: shared room credential directory (24–45), session resolution and HTTP actions.
- `src/scene/ClubRoom.js`: layered scene, social feed, hotspots and finished action summary.
- `src/replay/TimelineBar.js`: replay and Journal.
- `server_bridge.py` and `tests/test_koenji_vertical_slice.py`: persistence, `compute_legal_tile_lays` (842), protocol and targeted gameplay verification.
- `daemon18xx/app/engine1889/engine.py`: stock/zone rules (323–670), train purchases/discards (908 onward), `offer`/`_agreement` (1033–1132), emergency/endgame actions (1207–1410), legal action discovery (1580 onward).
- `daemon18xx/app/engine1889/RULE_COVERAGE.md`: backend scenario evidence and its limits.
