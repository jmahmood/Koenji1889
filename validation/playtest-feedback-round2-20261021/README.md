# Additional playtest verification

See [feedback and implementation notes](../../docs/koenji/playtest_feedback_round2_20261021.md).

- 192 JavaScript tests pass.
- Production frontend build succeeds, with the existing bundle-size advisory.
- Three focused Chrome feedback checks pass without browser exceptions.
- All 31 general Chrome regressions pass without browser exceptions or failed HTTP responses.
- Focused feedback checks: `feedback-results.json` and screenshots.
- General regression checks: `results.json` and screenshots.

Both browser scripts use Chrome and disposable local games. Credential files and test databases remain outside the repository. No private game snapshots are included. These changes are local; this pass did not deploy a new Pi release.

Follow-up: payment amounts sit beside Kemonito at the table (toward the table center), or beneath her outside the table. Three actual-animation placement checks passed with no browser exceptions; labels stay in the viewport and do not overlap the sprite. Four mascot tests and the frontend build also pass. See `payment-position-results.json` and the `payment-beside-mascot-*.png` screenshots.
