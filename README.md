# Koenji Railway Club · 1889

An illustrated, browser-based railway board-game club set in Meiji-era Tokyo. Play **1889: History of Shikoku Railways** with 2–6 players, from the private-company auction through stock trading, track building, train operations, and final scoring.

The JavaScript frontend uses Vite. A Python bridge validates actions through the Daemon18xx rules engine, saves games in SQLite, and synchronizes players through HTTP polling.

## Origins and influences

The project began as a way to revisit the creator’s former Koenji Boardgame Club in Tokyo: familiar friends around a recognizable wooden table, with tea, snacks, late arrivals, and stamped membership cards. That memory shapes the gathering, characters, and rooms. The aim is to make an online match feel like returning to a place where friends play together.

**1889: History of Shikoku Railways** supplies the game at the table. Its railway investment, stock dealing, and operating decisions sit inside an imagined Meiji-era club, with period-inspired clothing, paper ledgers, and railway imagery.

**Ultimate Soccer Manager 2000** is a reference for the tactile room navigation: moving between illustrated spaces and interacting with objects to reach different activities. **Railroad Tycoon II** and illustrated management games of that era also informed the district-art direction, with painted landscapes and a sense of place around the financial decisions.

The character animation takes its cue from **コマ送り (koma-okuri)**: held poses and abrupt, exaggerated frame changes. The specific reference in the design notes is the staccato photographic-pose style of Japanese train advertisements from the 2010s. This gives arrivals and game reactions a playful, deliberately choppy rhythm.

## Features

- Gatherings with individual player invitations, observers, and saved character appearances.
- Stock exchange, private-company auctions, track and station placement, route planning, dividends, and train purchases.
- Persistent games, an action journal, and read-only inspection of earlier positions.
- Illustrated club rooms, character animations, music, and reduced-motion controls.
- Kemonito, the club mascot, distributes confirmed money payments from her purse at the table.
- Kemalito appears with a brief giggle for confirmed setbacks such as rusted trains or being outbid.
- Kemonito and Kemalito celebrate confirmed game winners together with clapping, cheers, and a high-five.
- Development scenarios for stock rounds, operating rounds, and multi-train route planning.

## Requirements

- Node.js 18 or newer compatible with Vite 6; Node.js 22 is recommended.
- npm.
- Python 3.12, available as `python3`.

The bridge and bundled rules engine use the Python standard library. No Python package installation is required for this application's runtime.

## Run locally

From the repository root (the directory containing this README and `server_bridge.py`):

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally **http://localhost:5173**. The development server automatically starts the Python bridge on `127.0.0.1:8789` when that port is available and proxies `/api` and `/health` requests to it.

Create a gathering, name the players, and share each person's invitation privately. Every seat must be claimed before the host starts. Invitations contain access credentials; treat them like passwords.

For a quick practice game, open `/test` on the development server. Available scenarios include:

| URL | Starting position |
| --- | --- |
| `/test` | Stock round |
| `/test?scenario=routes` | Two trains ready to run |
| `/test?scenario=routes3` | Three-train western network |
| `/test?scenario=routes4` | Four-train branching network |

Use **New test game** to create another copy. Practice games are separate from ordinary gatherings. Additional fixtures and protocol checks are available in **Demo Tools**.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the frontend and automatically start the local backend |
| `npm run backend` | Run the Python bridge separately |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the build on port 4173 with backend proxying |
| `npm test` | Run JavaScript tests, bridge tests, and the 1889 engine tests |

`npm run preview` is for local build verification. Follow the deployment guide for hosting.

## Configuration and storage

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `KOENJI_BACKEND_HOST` | `127.0.0.1` | Python bridge bind address |
| `KOENJI_BACKEND_PORT` | `8789` | Python bridge port and default Vite proxy port |
| `DAEMON18XX_URL` | Local bridge URL | Override Vite's backend target; disables automatic backend startup |
| `DAEMON18XX_DATABASE` | `data/games.sqlite3` | SQLite database path; use durable storage when hosting |
| `KOENJI_QUIET` | Unset | Set to `1` to suppress bridge request logging |

Game databases and backups can contain invitation credentials and should remain private. Keep local `.env` files, logs, build output, and dependencies out of Git.

## Deployment

Publishing this repository to GitHub makes the source available. **GitHub Pages alone cannot run the application:** gameplay requires the Python bridge and persistent SQLite storage.

Host the built frontend and backend at the same domain root, with `/api` and `/health` forwarded to the bridge. Run one bridge process with durable local storage. The current service is intended for a small club; review the access and hosting limitations before exposing it publicly.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Linux, Nginx, HTTPS, backups, and rollback, or [the Raspberry Pi guide](deploy/raspberry-pi/README.md) for the supplied service configuration.

## Project layout

```text
src/             Frontend, game screens, character scenes, and API client
public/          Runtime artwork, sprites, and music
server_bridge.py HTTP API, gatherings, action journal, and persistence
daemon18xx/      Python rules engine and upstream documentation
fixtures/        Authored route-practice networks
tests/           Frontend and bridge regression tests
deploy/          Hosting configuration and backup tooling
docs/koenji/     Design, implementation, and asset documentation
validation/      Retained playtest reports and visual checks
```

## Credits and licensing

The authoritative Python rules engine is [Daemon18xx](https://github.com/jmahmood/Daemon18xx). Its tracked source snapshot (`875e3c6`), documentation, and notices are included directly in `daemon18xx/`; no submodule initialization is needed. The byte-identical, case-only duplicate of the 1830 test module is represented once as `test_Engine1830.py` for portable checkouts.

Some 1889 game data and recorded fixtures originate from [tobymao/18xx](https://github.com/tobymao/18xx), by Tobias Mao and contributors, under the MIT license. See the [retained upstream notice](daemon18xx/app/engine1889/UPSTREAM_LICENSE). The application runs the Python Daemon18xx engine.

This repository has no project-wide license grant. Retained upstream licenses apply to their respective material; do not assume the application's code, artwork, portraits, or music are covered by those licenses.
