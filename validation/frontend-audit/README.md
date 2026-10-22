# Frontend browser audit — October 21, 2026

All 29 browser checks passed on the local-network HTTP origin in installed Google Chrome. No uncaught browser exceptions or HTTP responses with status 400 or higher were recorded. Test games used a separate SQLite database; existing games were not used.

## Bugs fixed

- Stock-round Pass was wrongly blocked because the confirmation compared `pass` with the engine’s advertised `end_turn` permission. The mapping is now limited to stock rounds; stale positions and other seats remain blocked.
- The Japanese lobby lacked complete translations for its heading, invitations, readiness, presence, and seat-count messages. Added complete phrases to avoid partially translated sentences.

Earlier fixes also checked here: room-entry timer receiver, auction Buy Now permission, and personal-cash purchase wording.

## Step-by-step results

| Check | Result |
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

## Automated verification

- JavaScript: 178 tests pass, including stock-pass permissions and Japanese lobby regression coverage.
- Python bridge: 51 tests pass, including a complete all-phases game through the public service.
- 1889 rules engine: 20 tests pass.
- Production build succeeds; Vite retains its existing large-bundle advisory.

## Scope and limits

Actual clicks, forms, confirmation dialogs, displayed revisions, and authoritative balances/ownership were checked. Fixture setup seeded isolated positions for less-common situations; gameplay changes in the browser checks used the app controls. The complete long game was tested at the service layer, not played from beginning to end through the browser.

This browser run used Google Chrome. Safari and Firefox were not tested. The narrow-screen check covers the setup dialog only; the main game retains its existing desktop-width layout. Audio preference controls were exercised, but sound quality was not evaluated. The Japanese lobby correction covers the reported lobby text, not a full translation review of every game screen.

## Re-run

Requires Playwright and an installed Chrome browser. In one terminal, from the app directory:

```sh
KOENJI_BACKEND_PORT=18789 DAEMON18XX_DATABASE=/tmp/koenji-frontend-audit.sqlite3 npm run dev -- --host 0.0.0.0 --port 15173
```

In another terminal, generate fresh isolated edge-case rooms and run the checklist:

```sh
python3 scripts/write-browser-audit-fixtures.py --database /tmp/koenji-frontend-audit.sqlite3 --output /tmp/koenji-browser-fixtures.json
KOENJI_AUDIT_URL=http://localhost:15173 KOENJI_AUDIT_FIXTURES=/tmp/koenji-browser-fixtures.json node scripts/check-frontend.mjs
```

Set `KOENJI_PLAYWRIGHT_MODULE` to the absolute Playwright module location if it is provided outside this project. Set `KOENJI_BROWSER_PATH` for a custom Chrome executable. To test HTTP LAN behavior, set `KOENJI_AUDIT_URL` to the server’s LAN address. Generate fresh fixtures before every full run. Credentials are written only to the temporary fixture file, not the report.

## Deployment status

The audit and fixes are local. This run did not deploy to the Raspberry Pi. The configured frontend-only deployment command is `deploy koenji`; it runs JavaScript checks, builds, backs up the current frontend and game database, and uploads the frontend while leaving backend code and game data in place. See `deployment-cli/README.md` in the starter package for the deployment and rollback procedure.
