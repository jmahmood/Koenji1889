# Full-page train wizard rescue · 22 October 2026

The train purchase workflow now occupies a dedicated full-page modal. Its five screens share a persistent stepper and footer; only the active screen scrolls. The map dock contains an entry button rather than the wizard itself. The modal opens once when the operating president reaches the train step, and closing it keeps the current draft until the game revision changes.

The final dispatch stamp commits one server-validated purchase. It does not automatically end the railway's turn: additional purchases remain possible, followed by an optional End Turn action on Fleet Status. Mandatory purchases cannot be passed. Pending special actions and excess-train discards retain their existing resolution screens.

## Verification

- Production build: passed. Vite retains its existing advisory about bundle size.
- JavaScript regressions: **201 passed**.
- Core 1889 rules: **20 passed**.
- Backend application regressions: **57 passed, 1 failed**. The unrelated `test_only_host_can_assign_valid_portraits_and_clearing_a_preset_preserves_the_seat` still asserts 17 portrait faces; the existing appearance catalog contains 27. Neither portrait assets nor that test were changed for this rescue.
- Real browser audit: **9 passed**, no browser runtime errors.

The browser audit exercises:

1. Desktop sizing, grouped depot tiers, all five screens, keyboard focus containment, Escape, close/resume, exact depot payment, and optional passing after buying.
2. Seller-signed used-train consent and payment between corporate treasuries, with phase unchanged.
3. Unfunded depot preview, disabled purchase stamp, emergency share sale, and return to Financing.
4. Common-president transfers at an exact typed price, committed only by the final stamp.
5. First 4-Train preview and actual rust across all railways, including the new train limit.
6. Diesel trade-ins while at capacity, ¥300 credit, rust, and final fleet.
7. Out-of-turn Seller's Desk posting, receipt by the buyer, and execution at the agreed price.
8. Insolvency review and bankruptcy from Financing.
9. Mobile layout, active-screen isolation, reachable footer, and absence of horizontal overflow.

See `browser-results.json` and the retained screenshots. Browser games used a disposable database in `/tmp`; credentials are not retained in this report.

## Repeat the browser audit

The existing fixture writer now includes common-president, rust, Diesel, seller, and insolvency positions. Start the local development server with a **disposable** database, generate the fixtures into that same database, then run `scripts/check-train-wizard.mjs` with:

- `KOENJI_AUDIT_URL`: the local development server URL.
- `KOENJI_AUDIT_FIXTURES`: the private JSON credential file produced by `scripts/write-browser-audit-fixtures.py`.
- `KOENJI_PLAYWRIGHT_MODULE`: an installed Playwright module path, if it is not locally installed.
- `KOENJI_TRAIN_AUDIT_OUTPUT`: an optional destination for screenshots and results.

Use fresh fixture rooms for each run: the audit intentionally commits purchases, sales, turn endings, and bankruptcy. Do not use a real game's database.
