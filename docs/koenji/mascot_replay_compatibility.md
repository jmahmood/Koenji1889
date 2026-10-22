# Hosted mascot replay compatibility fix

Prepared 21 October 2026 after the owner reported no mascot animations when replaying a hosted game.

## Confirmed cause

The hosted frontend already matches the v10 build. Its running backend is older than the corresponding local source. The owner's saved game has 93 recorded actions with no cash-receipt, setback or winner facts. Client animations depend on those structured facts, so updating the frontend alone does not enable them for that journal.

A strictly read-only check of the staged backend against that game's stored snapshots reconstructs 16 confirmed money receipts, at revisions 16, 19, 28, 32, 34, 37, 46, 51, 55, 61, 68, 72, 78, 82, 85 and 89. Its current history contains no qualifying Kemalito setbacks and no completed game, so no setback cameo or victory celebration is expected yet. The journal digest was unchanged by the check.

## Local changes

- Legacy event projection compares adjacent recorded snapshots for exact cash receipts, rust, presidency changes, auction outbids and final winners. It never reapplies game rules or rewrites saved events or balances. Existing recorded fields take precedence; missing snapshots produce no invented facts.
- Derived facts are cached in bounded memory. New journals carry a presentation version so normal polling does not load adjacent snapshots unnecessarily.
- Replay advances sequentially after each snapshot request completes. Normal speed allows the full mascot sequence to play; Fast and Instant retain their existing condensed timing. Pausing or restarting cancels pending playback scheduling.
- Health reports the new `mascot-history` capability. The generated build manifest identifies this compatibility release and the matching backend hash.

## Validation and deployment status

All 174 frontend tests, 51 application/backend tests and 20 selected engine tests pass; production build and whitespace checks pass. Added regression coverage checks read-only legacy enrichment, real outbid identity, cache behavior, modern-event behavior, ceremony duration and cancellation during slow snapshot requests.

The corrected backend is staged on the Pi as `app/server_bridge.replay-candidate.py` and was imported for the read-only check. It has **not** replaced the running backend. Automatic approval review rejected activation because replacing/restarting the hosted service needs explicit user approval. The remaining activation plan backs up the database and old backend, deploys the matching frontend, restarts the backend, checks health/build matching and verifies that the existing game still resumes. The existing v10 Git tag has not moved.
