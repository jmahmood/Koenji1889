# Additional playtest feedback — October 21, 2026

This follows the [first feedback audit](playtest_feedback_20261021.md). The screenshot shows a historical read-only position with a character/action message expanding the header.

## Defects fixed

| Report | Change |
| --- | --- |
| Notices change the viewport size. | Action feedback, character messages and counterparty/pending-action alerts use an overlay rack outside the header's layout. Historical read-only status and Return to Live remain in the existing context row; the extra historical ribbon is removed. Long notices scroll inside the overlay. |
| Kemonito's payment amount is sometimes unreadable or disappears below the artwork. | Actual receipt amounts use contrasting outlined text. During delivery, an additional amount label sits beside the mascot, toward the center of the table; outside the table it sits underneath the sprite. It never overlaps the sprite or her face. Captions also retain the outlined amount; Motion Off retains all receipt amounts. |
| Primary confirmations vary between orange/brown buttons and other styles. | Primary action buttons share a green treatment across the map, dividend actions, purchase review and staged train purchase. Review buttons name the action instead of saying only “Confirm.” |
| Skip is poorly presented; Maysa did not realize station placement was optional. | The operating footer explicitly explains optional station placement and its ¥40 price, and offers a prominent “Skip Station Placement” action. Skip controls appear for applicable steps rather than leaving irrelevant disabled “Skip Dividend” or “Skip Train Purchase” controls. |
| Historical snapshots take too long to reopen. | Historical requests share in-flight loads and use a bounded per-tab cache scoped to room, credential and revision. The cache survives reloads, evicts old entries and tolerates storage failure. One adjacent snapshot is warmed at a time. Live state continues to be fetched fresh. Cold snapshots can still take time to calculate. |
| The current offboard revenue is unclear. | All three printed values remain visible; the value active in the viewed phase is brighter, bold and underlined. Tooltip text gives the current value and phase ranges. Historical maps use their historical phase. |
| No warning when the phase introduces two operating rounds. | A nonblocking phase announcement explains increases to two or three operating rounds per stock round. It also explains that the already-started operating set keeps its original round count and the new schedule begins after the next stock round. |
| Additional bug found during verification: Back to Table is unclickable at laptop widths. | The fixed-height map/exchange header no longer wraps navigation underneath the player strip. Inspection tabs scroll horizontally when necessary; room navigation remains on its row. |

## Interface decisions implemented

- **Reduce redundant confirmation.** Routine skips, passes, dividends and finishing a turn act directly from their labelled controls. Purchases, sales, exchanges, negotiated offers and bankruptcy retain a review. A staged train purchase has its final purchase button in the footer; it no longer opens another generic review after that review has already been shown. Revision/credential checks and server validation remain in place.
- **Use the same dividend confirmation style.** The user clarified that “Pay dividend must be the same” refers to the primary button treatment, rather than the brown/orange styling.
- **Company dividend milestones.** The user selected the company's total dividend, with first milestones at ¥20, ¥100 and ¥200 per company per game. The effect is derived from confirmed payout history, excludes withholding and non-dividend payments, and combines multiple new thresholds crossed in one payout into one brief banknote shower. Repeated responses do not replay it. Historical replay does not trigger a new celebration; Motion Off shows a static milestone. No money or rules state is changed.

## Rules clarification

A new tile and a tile upgrade both use the company's **one normal tile lay** during its operating turn. It cannot do one of each as ordinary construction. Special private-company construction is separate and has its own restrictions. The existing blocked-placement message explains when the normal lay is already used. No construction limits were loosened.

## Verification and scope

- 192 JavaScript regression tests pass, including cache isolation/coalescing/eviction, milestone history, optional station guidance, offboard phases and phase schedule announcements.
- Focused Chrome checks verify unchanged workspace bounds when notices appear and when switching into history, no repeat request for a cached snapshot after reload, direct dividend payment, actual milestone animation, an outlined amount inside the table bounds, and the phase-2-to-3 train purchase announcement.
- All 31 general Chrome browser regressions pass without browser exceptions or failed HTTP responses; the three focused checks pass as well.
- Browser reports and screenshots are retained in `validation/playtest-feedback-round2-20261021/`.
- Only disposable local games were used. No live game data, engine rules or Raspberry Pi deployment was changed for this feedback pass.

The earlier design backlog (stock typography, par/train wizards, powers overview, guided practice, and other unimplemented design items) remains in the first audit. This pass does not close those separate items.
