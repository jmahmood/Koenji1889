> Historical review. The three findings below were addressed by the stop-based route editor. See [current validation](../custom-routes/README.md). `node validation/route-review/reproduce.mjs` now runs the corresponding regression checks; the original reproduction is preserved as `reproduce-before-stop-editor.mjs`.

# Route review and validation

Verdict: the one-train desktop layout is clearer, but the route experience is not ready to sign off. No production source edits were made during this review.

## Reproduced findings

1. **P1 — a quote can validate a different draft.** Start a revenue check, edit the draft while it is pending, then resolve the old request. The response guard checks room and game revision, not the draft contents. The edited draft inherits the old revenue and gains a Run button. Server route validation still applies, but the displayed revenue and user approval can be wrong. Snapshot the request draft and discard responses unless that draft still matches; bind Run to that exact validated draft.
2. **P2 — contradictory revenue in Trains & Routes.** Before running the real two-stop IR fixture, the operating ticket quotes ¥50 while the floating inspection window displays ¥0 and “Connected corridor.” Its renderer expects per-route revenue and stop fields absent from the engine response. Reproduced through the live browser and the real renderer. Use the authoritative quote total and normalize the same named stop list across route screens. Evidence: conflicting-revenue.png.
3. **P2 — advanced route confirmation hides the next step.** In the live test room: open advanced options, validate, Review & commit draft routes, Confirm routes. The server accepts ¥50 at revision 1 and moves to dividends, but the open dialog switches to the purchase/financing boardroom. Payout controls remain behind it. Dismiss the route dialog for both submission paths. Evidence: advanced-handoff.png.

## Checks

- All 110 JavaScript tests pass.
- Production build passes with the existing large-chunk warning.
- `node validation/route-review/reproduce.mjs` reproduces all three findings using the real renderer and bound event handlers.
- Live browser at 1280 × 720: route panel is readable and fits the basic single-train plan; both alternate-screen inconsistency and advanced handoff failure were verified.
- Full Python frontend integration suite was interrupted after roughly three minutes during `test_complete_client_game.test_all_phases_game_journal_restore_and_scoreboard_projection`; it did not finish and is not counted as passing. The interrupt stack was in legal-action projection/deep copying, not evidence that the route optimizer itself stalled. The separate focused decision-coverage suite passed all 7 Python tests in 1.7 seconds.

## Scope limits

No novice-user study. Mobile, multiple running trains, keyboard navigation, late-game generator performance, and custom segment editing have not been fully validated. Existing pass counts do not cover these usability risks.
