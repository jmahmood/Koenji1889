# Koenji Railway Club 1889 — Implementation Status & Architecture Audit

**Portrait invitations:** Hosts can assign a reference portrait to each unclaimed seat invitation. The app catalogue now contains only the 17 photo-reference portraits. See [portrait invitation delivery](portrait_invitations.md).

**17 October character integration:** Shared paper-doll artwork, live accepted-event sequences, Motion Off, and replay are connected. See [delivery and validation](paper_doll_integration.md).

**17 October follow-up:** See [character onboarding and arrivals](onboarding_implementation.md) for appearance, host identity, resident entrances, claim-based start readiness, and コマ送り implementation.

**Current follow-up:** See [gap fixes and validation](gap_fixes_implementation.md) for the action-coverage work delivered after this baseline audit. The baseline below does not certify a complete human multiplayer match.

**Prepared:** 2026-10-15  
**Application Directory:** `/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889`  
**Inspected `Daemon18xx` Commit:** `b9a0f4f` (`Backend only (#47)`)  

## 1. Reconciliation of `Daemon18xx` vs. `Koenji_1889_Codex_Implementation_Plan.md`

`Koenji_1889_Codex_Implementation_Plan.md` was originally drafted against commit `6bd5b3d0` (which used `app/state.py` and `multiplayer/backend/` + `multiplayer/frontend/`). Since then, commit `b9a0f4f Backend only (#47)` in `Daemon18xx` refactored the repository into a clean, backend-only architecture:

- **Authoritative Rules Engine (`daemon18xx/app/engine1889/`):** Pure Python, standard-library-only, stateless rules engine (`new_game`, `apply_action`, `legal_actions`, `replay`, `best_routes`, `migrate_state`, `validate_state`). Every move runs on an isolated deep copy (`deepcopy`), raises `RuleError` on illegal actions without mutating caller state, and verifies accounting invariants (`¥7,000` total money conservation, `100%` share supply per corporation, certificate limits, and finite tile counts) after every accepted action.
- **Frontend Separation (`daemon18xx/AGENTS.md` & `daemon18xx/docs/frontend_integration.md`):** `Daemon18xx` is strictly backend-only; frontends live in separate projects and communicate over the authenticated HTTP/JSON contract (`/api/1889/catalog`, `/api/1889/games`, `/api/1889/games/{room}/start`, `/api/1889/games/{room}`, `/api/1889/games/{room}/actions`).
- **Legacy Code Archive (`daemon18xx/old/`):** The older prototype files (`app/state.py`, `multiplayer/`) were archived under `daemon18xx/old/` by the repository owner.

## 2. What Was Built in `koenji-1889/`

1. **Authoritative Backend & Action Journal (`server_bridge.py`):**
   - Imports `daemon18xx/app/engine1889` directly and persists to SQLite (`data/games.sqlite3`) using Python's standard library (`sqlite3`, `http.server`) so it runs out-of-the-box on macOS Python 3 without external pip dependencies while remaining 100% compatible with the `Daemon18xx` HTTP contract.
   - Implements the `game_actions` durable journal table (`(game_id, revision)` primary key, `(game_id, command_id)` unique constraint) alongside `game_states` snapshots in a single atomic `BEGIN IMMEDIATE` transaction.
   - Enforces server-derived seat identity (`Bearer <player_token>`), rejects spectator/creator gameplay moves (`403`), rejects actor impersonation (`403`), rejects stale revisions (`409`), rejects illegal 1889 moves (`422`) without mutating state, and provides `command_id` idempotency (`200` with `idempotent_replay: true`).
   - Exposes `GET /api/1889/games/{room}/revisions/{rev}` and `GET /api/1889/games/{room}/history` for non-mutating historical inspection, `POST /api/1889/dev/fixture` for rules-validated 1889 match presets (`stock_round_1`, `stock_round_active`, `operating_round_1`, `auction_start`), and `POST /api/1889/games/{room}/club` for non-gameplay Koenji club state (one membership stamp per gathering + table notes).

2. **Illustrated Koenji Clubroom & Core 1889 Frontend (`src/`):**
   - **Social Tabletop (`src/scene/ClubRoom.js`):** Three-quarter Meiji-era Koenji clubroom scene with seated character sprites (`idle`, `acting`, `speaking`), active turn lantern, live miniature 1889 Shikoku board hotspot, stock certificate hotspot, membership stamp card hotspot, and skippable certificate-purchase & assistant-treasurer dividend animations.
   - **Stock Exchange & Private Auction (`src/components/StockExchange.js`):** Interactive Share Order Ticket supporting Par selection (`¥65–¥100`) for 20% President's Certificates, 10% IPO and Bank Pool purchases, SR 2+ share sales, Dougo Railway (`DR`) IPO exchange, Private Company Auction bidding/purchasing, and the full 2D Shikoku Stock Market grid.
   - **Interactive 52-Hex Shikoku Map & Operating Desk (`src/components/HexMap1889.js`):** Flat-topped SVG geometry rendered from `state.board` and `catalog.tiles`, supporting phase-filtered tile upgrades, 60° tile rotation preview, station token placement, `run_best_routes` optimal route calculation, dividend payout/withhold, and train depot purchases.
   - **Non-Mutating Timeline Rewind & Replay (`src/replay/TimelineBar.js`):** Separates `viewRevision` from `liveRevision`, allowing any client to scrub backward/forward or auto-replay (`1×`, `Fast`, `Instant`) without altering live server state or jumping out of historical mode when new live moves arrive.
   - **Multi-Browser Seat Switcher & Protocol Probes (`src/components/Modals.js`):** Allows opening a second browser tab/window bound to Player B (`Haruka`, `p2`) or `Spectator` in one click and running live 409/403/Idempotency probes.

## 3. Boot & Verification Commands

```bash
cd /Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889

# Run automated vertical-slice & 1889 engine tests:
npm test

# Build production frontend bundle:
npm run build

# Start both the Python 1889 backend (port 8789) and Vite dev server (port 5173):
npm run dev
```
