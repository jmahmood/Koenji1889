# Playtest fixes verification — October 21, 2026

All 31 browser checks passed in Google Chrome. Uncaught exceptions: 0. HTTP errors: 0.

| Browser check | Result |
| --- | --- |
| 01 Appearance selection and ordinary gathering creation | PASS |
| 02 Private invitation, separate browser, guest claims seat | PASS |
| 03 Host starts game; both players enter; reload keeps host seat | PASS |
| 04 Auction Buy Now cancel, confirm, payment and turn advance | PASS |
| 05 Auction bid on a later company and auction pass | PASS |
| 06 Stock round passes without buying | PASS |
| 07 Stock certificate purchase and end turn | PASS |
| 08 Historical inspection, replay and Return to Live | PASS |
| 09 Operating map legal tile preview and construction | PASS |
| 10 Operating skip/no-train revenue, purchase and finish turn | PASS |
| 11 routes: edit stops, undo, cancel and restore plan | PASS |
| 12 routes: commit routes and pay dividend | PASS |
| 11 routes3: edit stops, undo, cancel and restore plan | PASS |
| 12 routes3: commit routes and pay dividend | PASS |
| 11 routes4: edit stops, undo, cancel and restore plan | PASS |
| 12 routes4: commit routes and pay dividend | PASS |
| 13 Language switch, preferences, and return to English | PASS |
| 14 Narrow viewport still exposes setup and game actions | PASS |
| 15 Excess-train discards commit and unblock operation | PASS |
| 16 ER optional lay can be declined by its seller | PASS |
| 17 Emergency share sale funds a mandatory train purchase | PASS |
| 18 Bankruptcy confirmation reaches final results | PASS |
| 19 Out-of-turn DR exchange uses the owning seat | PASS |
| 20 Used-train offer is accepted and paid from the company | PASS |
| 21 Private negotiation consent and buyer purchase | PASS |
| 22 Stock sale, presidency transfer and proceeds | PASS |
| 23 Observer sees results and cannot act | PASS |
| 24 Withhold route revenue with normal motion enabled | PASS |
| 25 Non-playing host retains creator identity and starts the table | PASS |
| 26 Current operating actions remain clickable on a short laptop screen | PASS |
| 27 Round notice fades and expires despite repeated rendering | PASS |

Additional verification: 180 JavaScript tests, three new service/rules checks, and all 20 operating-layout measurements pass. The layout checks cover Track, Token, Routes, Dividend and Train at 1280px wide, with viewport heights 640/720/768/900. Production build succeeds with the existing bundle-size advisory.

Design backlog, verified rules behavior, and fixes: [playtest feedback](../../docs/koenji/playtest_feedback_20261021.md).

The browser suite used isolated test games and synthetic fixtures. The separate 20-layout reproduction used private snapshots only in temporary local files; none of those snapshots or credentials are stored here. Safari/Firefox and full mobile gameplay were not tested. This task did not deploy to the Pi.
