# Watch one round in Chrome

Double-click **Watch Operation Round.command** or **Watch Stock Round.command** in the starter package folder. They open Terminal and a separate Google Chrome window, start a fresh practice game, highlight each control, and click through one round. Chrome must be installed. Node.js 20+ and Python 3 are required. Dependencies are installed on the first run if missing.

No AI calls, API keys, or tokens are used. Each run starts its own local frontend and backend with a temporary database, so your regular server and saved games are untouched. The browser uses a separate temporary profile. The database and servers are removed when the run closes; JSON reports and screenshots remain in `koenji-1889/validation/evidence/puppet-…/`.

While it runs, click the **Terminal window** and press a single key—no Enter needed:

- **P** pauses; **P** again resumes. Take as long as you need for screenshots.
- **N** advances one click and stays paused. A purchase and its confirmation are separate clicks.
- **R** closes the current practice browser and servers, then opens a fresh game at the beginning of the same round. It works during playback, while paused, and after completion. Speed and launch settings are kept; `--step` starts paused again. Earlier reports are preserved.
- **Q** quits and closes the practice browser and servers.

Space also toggles pause, and Enter also advances one click. The game caption and Terminal show when playback is paused. A click already sent to Chrome finishes, then further clicks wait. These keys belong to Terminal; switch back to it after taking screenshots in Chrome. The existing double-click launchers enable the controls automatically.

**Operation:** starts at the beginning of IR's operating turn with two trains already owned. Lays F3 track, keeps the existing home station by skipping an additional token, runs both trains for ¥90, pays dividends, walks through all five train purchase wizard steps, buys a third train, and finishes the round. This practice position has one operating company, so its completion is the completion of the whole round. It stops on the following stock round.

**Stock:** starts at the beginning of Stock Round 1. Switches among all four players, pars IR at ¥80 and KO at ¥75, buys the certificates needed to float IR, acknowledges flotation, finishes the buying turns, and makes four consecutive passes. It stops at the start of the operating round. Selling is prohibited in the first stock round, so this walkthrough covers incorporation, purchases, turn endings, and passes.

The script checks the server's response after every move and verifies exactly one new revision. It also checks cash, trains, route revenue, round transitions, and browser errors. All gameplay goes through visible UI controls. Server reads are used only to verify results; the existing practice-game endpoint creates the starting position using legal, replayable actions.

Chrome stays open when the run passes or fails. Inspect it, then close its window or press Enter in Terminal to shut down the practice servers. Press Ctrl+C to stop early. Reports contain moves and results without invitation tokens. A failure screenshot and the named failing step help reproduce a problem; a passing run covers these two scripted paths, not every possible game decision.

From `koenji-1889`, you can also run:

```sh
npm run puppet:operation
npm run puppet:stock

# Start paused, then use N for each click or P to play:
npm run puppet:operation -- --step

# Slower playback (milliseconds per click):
npm run puppet:stock -- --delay 2500

# Fast unattended verification:
npm run puppet:operation -- --headless --delay 0
npm run puppet:stock -- --headless --delay 0
```

`--close` closes automatically after a visible run. `--output /absolute/path` changes the evidence folder. `KOENJI_BROWSER_PATH` selects a different Chrome executable; `KOENJI_PYTHON` selects Python. Default playback uses the game's normal animations. Press **P** before inspecting or taking screenshots; press **P** again to continue. Use `--step` if you want to start paused.

For an existing **development** server, use `--url http://localhost:5173`. This creates a new practice room in that server's database rather than using a temporary database. The Operation walkthrough needs the updated backend with the `operating_cycle` preset, so restart an older backend first. The default launchers handle this automatically by starting isolated servers.

The automation uses [Playwright's Chrome channel](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge).
