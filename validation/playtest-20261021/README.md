# Playtest fixes — 21 October 2026

Release target: http://10.0.0.30:8080. Turn rewind remains deferred.

## Delivered behavior

- Matching bridge/frontend, route editing, and per-train revenue. `/health` now
  identifies the loaded bridge and supported features. `/build-info.json` records
  the backend build expected by the served frontend.
- Dividend presentation separates market-pool payments to company treasury from
  unsold IPO dividends retained by the bank. The standard engine formula is unchanged.
- A common turn/phase bar appears directly below the header across game screens,
  with prominent company treasury. Normal-turn cues use `active_player`, distinct
  from authorization to use an out-of-turn private ability. Track/token phase cost previews remain beside
  the action. Turn reminders default to 20 seconds of inactivity; settings offer
  40 seconds, 60 seconds, or Off. Polling does not restart the reminder clock.
- Private-company cards have a separate corner magnifier. The modal enlarges the
  actual certificate, illustration, status, and full rules; opening it does not
  select, bid, or buy. Escape/close returns focus to the magnifier.
- Stock purchases and end-turn actions use a focused confirmation dialog. Decisions
  are bound to the game, credential, and revision; changed positions cannot be
  confirmed. Cancel/Escape restores the initiating control. Existing boardroom
  actions also retain review before submission.
- The roundhouse shows only currently owned trains. Proposed purchases, rust,
  trade-ins, and capacity appear in a separate after-purchase preview.
- Company maps have explicit home markers before and after flotation. The table's
  share-certificate hotspot has a visible destination label.
- Music uses buffered stems on one Web Audio clock with seamless loop crossfades
  and gain ramps. Saved Music On retries when browser interaction permits playback;
  it no longer needs an off/on cycle. Music fades out when the document is hidden
  and resumes on return. Actual playing/loading/waiting states appear in settings.
- Effects provide short turn, action, flotation, and train cues with independent
  mute and volume. Accepted-event IDs suppress duplicate polling/retry sounds.
- An English/Japanese selector is available before joining and throughout play.
  Locale is a browser preference, not game state. Core forms, decisions, private
  rules, operating controls, routes, money labels, and normal journal messages are
  translated. Names, notes, credentials, IDs, and submitted values are preserved.
  Developer diagnostics and external historical/source material retain their
  original text; unknown strings fall back to English.
- Flotation opens a railway-gazette charter notice with the actual company and
  funding. A small club helper offers cash to the correct recipient in live and
  historical animation, distinguishing personal money from company treasury.
  Receipts use accepted cash deltas, never the submitting player's total route
  revenue. Held/reduced-motion playback keeps all receipt amounts readable.

## Verification

The final release is active. Running bridge build: `bd1a37a39dd3`.
Served frontend: `index-DFQa-BJJ.js` and `index-b6zohTED.css`.
`verify_release.py` confirmed that the manifest and bridge match, referenced assets
and catalog load, and production development routes still return 404.

- All **146 JavaScript tests** pass, including added audio, zero/one-owned fleet,
  card-zoom, reminder, confirmation, private-action/active-turn, and helper tests.
- All **46 bridge/application tests** and **20 standard 1889 engine tests** pass.
  The complete `npm test` run passed before the last frontend-only regression;
  the full frontend suite was rerun after that correction.
- Post-activation Pi HTTP smoke checks passed for isolated room `G9EQ33`.
- Signed-in browser checks on remote room `PPYCWB` edited F1 → E2 at ¥50,
  retained the other train at ¥40, and submitted the ¥90 plan.
- Two remote clients converged at revision 34. Daisuke sees Your turn; Haruka sees
  Current turn / Daisuke and has no normal-turn action prompt. Private abilities
  remain independently authorized. See [authority evidence](remote-authority.json).
- The final Japanese dividend dialog shows ¥0 market-pool payment and ¥45 of
  unsold IPO dividends retained by the bank for the fixture's ¥90 revenue.

Total: **212 passing automated checks**, plus live remote HTTP/browser checks.
The production build succeeds with Vite's existing large-chunk advisory.

Browser checks performed locally:

- Corner zoom from the initial auction, with readable full rules and enlarged art.
- English/Japanese switching during play; names and money remain unchanged.
- Manual F1 → E2 stop selection: edited train ¥50, other train ¥40, total ¥90.
- Dividend dialog and correct retained IPO portion; company treasury stays visible.
- Remembered Music On after reload reaches Playing without toggling music off/on.
- Owned-train view and separate staged-purchase preview.
- Flotation notification with ¥800 funding at par ¥80.
- HOME markers on floated IR/E2 and unstarted AR/K8.
- Historical flotation cash handoff shows ¥800 entering company treasury; inspection
  remains read-only and live notification sounds are not replayed.

`verify_remote.py` creates isolated fixture games on the Pi and tests the real
Nginx/backend HTTP path: revenue, stop editing, quotes, route submission, idempotency,
wrong-seat/spectator rejection, stale revisions, dividends, reload, and history.
`verify_release.py` checks frontend/backend build compatibility, referenced assets,
catalog, and continued blocking of production development routes.

Evidence: [card zoom](card-zoom.png), [helper history playback](helper-history.png).
Deployed UI evidence: [Japanese routes](remote-routes-ja.png) and
[Japanese confirmation](remote-confirmation-ja.png).

Limits: no listening study across browsers/devices, no translation review by a
second Japanese speaker, and no exhaustive late-game Pi performance measurement.
No gameplay rewind or engine rule change is included.

## Deployment and rollback

Before updates, the existing database-backup service created
`games-20261021T061455161690Z.sqlite3`. The source engine hashes matched the installed
engine; no engine replacement was needed. The former bridge lacked `route-options`
and `route_revenues` despite a newer served frontend.

Retained rollback files on the Pi:

- `/home/jawaad/koenji/releases/playtest-20261021/app-before`
- `/home/jawaad/koenji/releases/playtest-20261021/www-before`
- `/home/jawaad/koenji/releases/playtest-20261021/bridge-before-final.py`

Database files stay outside upload paths. Older hashed frontend assets are retained.
No game database restoration or history truncation was performed. Production `/test`
and `/api/1889/dev/*` remain blocked. Isolated verification-room credentials remain in a private server-side file,
not this repo. The temporary local credential file was removed after verification.

The existing `deploy koenji` launcher remains frontend-only. A change to the bridge
requires a matching backend update and service restart; compare `/health` with
`/build-info.json` before declaring a deployment successful. See the Pi deployment
guide for the runtime layout and service names.
