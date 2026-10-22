# Deployment and J3 practice verification

- Production: http://10.0.0.30:8080
- Release: `release-20261022T033900Z-0a92eb14` (October 21, 2026 Edmonton / October 22 UTC).
- The configured frontend deployment passed preflight, created database backup `games-20261022T033902417325Z.sqlite3` and a frontend rollback snapshot, uploaded assets, atomically activated HTML, and passed health and asset checks.
- Only frontend build output was uploaded. Existing game state, engine rules and backend source were not replaced.
- 185 JavaScript tests passed before building/deploying. Four Python tile discovery/fixture tests passed locally.
- Chrome opened the served production app without browser exceptions or failed HTTP responses. Served HTML, JavaScript and CSS exactly matched the tested local build; SHA-256 hashes are in `production-smoke-results.json`.
- Local `/test?scenario=j3` opened SR at its Track Lay step, placed straight #9 at J3, persisted revision 30, and resumed the same game after refresh.
- Local `/test?scenario=j3used` opened after SR's normal I4 lay, displayed the already-used-lay explanation at J3 and offered no legal J3 construction. The API rejected an attempted second normal lay without changing the saved state.
- Both user-facing fixtures replay exactly from their legal action histories. No private player snapshots or credentials are included in fixture files or verification artifacts.

Run `npm run dev` from the app directory and open `http://localhost:5173/test?scenario=j3` or `http://localhost:5173/test?scenario=j3used`. Use **New test game** to reset the selected practice scenario. An older separately running backend must be restarted to load the new fixture presets.
