# Gap fixes: implementation and validation

Delivered 16 October 2026 against the updated [application review](application_gap_review.md).

## Delivered fixes

| Review item | Implemented behavior | Evidence |
|---|---|---|
| Excess-train deadlock | Decisions & Planning lists the affected president's engine-validated discard choices; repeated discards keep the remaining requirement visible. | Python integration; actor/waiting/observer/history render tests; browser discarded two trains and returned to normal operation. |
| Emergency funding and bankruptcy | Lists only share-sale blocks and bankruptcy actions accepted by a dry run of the engine. Train review identifies corporate price and personal contribution. | Integration rejects excess funding/premature bankruptcy; browser sale exposed funded depot purchases. |
| ER interrupted operation | Seller can lay an available C4 tile or decline at every interrupted step, including train purchase. The map ticket and desk both support this. | All five steps × both outcomes through service/SQLite; browser exercised decline and a negotiated purchase followed by the special lay. |
| Stock block quantities | Sale block selector submits the selected percentage, respecting one block per corporation. Defensive brown-zone purchase block/repeat controls are included. | Engine choice tests and browser committed a 30% sale once. |
| Market zones | Settlement and guards honor certificate exemptions and orange holding exemption; exact action options are validated by the server engine. | Actual yellow/orange projections and synthetic brown rendering. The standard 1889 market in this checkout contains no brown cells; no market data was changed. |
| DR timing | A separate exchange control in Decisions & Planning follows the viewer's legal actions, including OR/out-of-turn exchange. | Engine integration and frontend rendering at a real out-of-turn position. |
| Corporate negotiations | Each party can submit an authenticated price offer. The operating president can review private/train purchases at the agreed price; privates are restricted to phases 3–4. | Integration for private and train consent; two-browser seller offer → president purchase → seller ER interrupt → resume. |
| Diesel options | Valid depot/Diesel purchase options include each allowed trade-in and discounted settlement. | Engine-backed projection and committed trade-in leaves expected treasury balance. |
| Route planning | Existing best-route controls open a plan rather than immediately committing. Drafts accept suggested routes or ordered custom rail segments; authenticated quotations are non-mutating. Commitment remains separately reviewed and server-validated. | Browser built E2 → F1 manually, quoted ¥50 at unchanged revision, then committed; history hid submit controls. Integration covers bad quotes and historical state isolation. |
| Tile candidates | Empty authoritative placement results remain empty, candidate helpers accept the projection, and the bridge checks `laid` rather than the nonexistent `laid_track`. ER candidate cost validation uses the seller's funds. | Backend and frontend regression tests; normal construction tests retained. |
| Dead par checks / city tokens | Removed the unused frontend `pending_par` restriction. Kept city index zero: all actual 1889 multi-slot cities use one city node. | No speculative 1830 action or unsupported multi-city rule was added. |
| Gathering / invitations / rejoining | First visit offers named 2–6-player creation and invitation entry rather than automatically creating a demo fixture. Per-seat and observer links work in another tab. Credentials leave the address after consumption. Saved ordinary rooms retain the viewer’s seat and, for the host, its own creator credential. Unclaimed invitations are retrieved with creator authorization and kept only in memory. Demo fixture bundles remain separate. | Browser created a waiting gathering, joined by invitation, claimed another seat by room code, stamped/posted before start, and explicitly started all clients at revision zero; storage/credential regression; creation/reload integration retained. |
| Final results | Dedicated ranked scoreboard from `state.result`, tied ranks, bankruptcy markers, itemized cash/portfolio/private breakdowns and Host Next Gathering; finished table no longer claims the first player has a turn. | Browser bankruptcy scoreboard and rendering test. |

**17 October follow-up:** [Appearance, host identity, arrivals, and コマ送り implementation](onboarding_implementation.md) extends this delivery. Statements below about onboarding implementation refer to the original lobby/credential flow, not completion of later portrait or room artwork.

The additional [gathering and full-game sequence](gathering_onboarding_and_game_sequence.md) is incorporated: the waiting table reuses the illustrated room and character sprites, offers host-controlled seating and start, and supports private invitations or an atomic room-code seat claim.

The desk preserves its sections, draft form values and scroll position on re-render. Reviewed commands are invalidated by incoming game revisions. Waiting players, observers and historical viewers can plan/inspect without committing moves. Ordinary scene, map, auction, exchange and Journal remain available.

## Validation executed

- `npm test`: **32 Node tests, 18 application/bridge tests, 20 selected engine tests passed**. The application tests include a complete **1,566-action authored game** through the same service used by HTTP/browser requests, waiting-room creation and named seat onboarding, all phases 2/3/4/5/6/D, complete journal, database restoration mid-game and at completion, revision-zero history and exact final scores.
- `npm run build`: passed; latest frontend regression run also passed all 32 tests after desk layout and endgame copy corrections.
- `git diff --check`: passed.
- Follow-up backend discovery with declared dependencies installed in `/tmp/koenji-validation-venv`: **371 tests passed, with no failures, errors or skips**, including HTTP integration tests. Corrected the stale test references in all nine affected edge-case entries and regenerated the readable checklist. Five new regression tests directly cover 1830 component setup, operating-step ordering and duplicate actions, mandatory resolution, newly purchased trains, and bank-end scoring/action rejection. State-isolation entries now reference existing tests that assert successful-action independence. All 261 inventory entries resolve to discoverable tests; `python tools/render_edge_cases.py --check` passes. The earlier 10 inventory errors are resolved.
- Targeted browser checks used an isolated SQLite database and two authenticated seats. They exercised creation/invitation, consent/purchase/ER handoff, discard resolution, emergency funding, custom route quotation/commitment, historical read-only decisions, stock block sales and final results.
- Browser visual verification was at the actual **1280×720** viewport, with no horizontal document overflow and the decision dialog on screen. The viewport capability did not apply the requested 1366/1440/1920 overrides; those dimensions are **not claimed as newly verified**.

Screenshots: [waiting table](validation/waiting-table.jpg), [emergency funding](validation/emergency-funding.jpg), [stock block sale](validation/stock-block-sale.jpg), [final results](validation/final-results.jpg). Application test output: [log](validation/application-tests.txt).

## Scope and remaining product acceptance

This delivers the concrete corrections and work items 1–5 in the review's recommended sequence. Artwork/likeness production and optional voice remain later product work, as stated in that sequence. No stored voice, scrapbook or gifts system was introduced.

The full-game evidence is an automated service/SQLite replay plus targeted observed browser interactions; it is not a claim that a human group completed the entire match in browsers. The review's requested human-group playtest remains a product acceptance activity. The added onboarding sequence is also implemented: waiting-table projection, atomic one-seat claims, authenticated seat naming, host-only reorder/start and invitation retrieval, pre-game notes/stamps, fragment-only invitation support, a separate development sandbox, honest presence from authenticated polls, automatic final-ledger presentation, and next-gathering name prefill. Normal seat and host rejoining persist locally; full invitation bundles are not persisted. The original “presence is always unknown” regression assertion was updated for the explicitly requested live-presence behavior, retaining its historical-state non-mutation checks.

The implementation is uncommitted and unpushed. Existing games were preserved. The normal local backend was started on port 8789 with the updated bridge; the isolated browser-validation server uses ports 5175/8791 and a temporary database.
