# Expanded route-fixture validation

The old two-train fixture has two laid hexes. The new practice games have 18 and 16 respectively, with multiple company stations and branching routes.

- **Three trains / Western Network:** Phase 4, UR controlled by Haruka (p2), two 3-trains and a 4-train. Two company stations, up to nine reachable stop vertices, all three trains run for ¥320.
- **Four trains / Branching Network:** Phase 3, TR controlled by Kenji (p3), three 2-trains and a 3-train. Three company stations, up to ten reachable stop vertices, all four trains run for ¥290. With the other three recommended routes reserved, the 3-train still offers eight starting stops.

Both are deterministic replays of legal actions, including the authored used-train purchases and additional network development. No engine rules or phase limits were relaxed. Creation preserves other games. Demo Tools opens the correct president and route planner, resets the company/hex inspection context to the operating company, and keeps test-scenario refresh/New test game tied to the chosen fixture.

## Browser checks at 1280 × 720

1. Loaded both entries using Demo Tools → Fixtures.
2. Three-train game opened as Haruka at revision 319. Selected a full four-stop route: Nankoku → Susaki → Kochi → Uwajima; validated at ¥130 for that train, ¥320 total with the other routes retained.
3. Four-train game opened as Kenji at revision 243. Editing the 3-train highlighted eight starting stops around the northern and southern corridors while the other three routes stayed reserved.
4. Built a genuinely different four-train plan: Muroto → Nankoku → Susaki for the 3-train. The server accepted all four edited routes for ¥260 at revision 244 and exposed payout/withhold controls.
5. Refresh retained the same room and president. Undo/Cancel remain fixed beside Use this route for long option lists. A fresh copy was opened after the run.

Screenshots: three-trains.png, four-stop-route.png, four-train-choices.png. Additional browser evidence: alternate-southern-route.png and edited-four-train-run.png. All 124 JavaScript tests, all 16 focused Python tests, and the production build pass (existing large-chunk build warning).

## Regression checks

`tests/test_expanded_route_fixtures.py` verifies replay equality, phase/fleet limits, token counts, laid hex counts, routes serving each train's full stop capacity, alternate choices with reservations, custom-plan execution, dividend resolution, and preservation of the other fixture. It commits an alternate four-train plan through Muroto → Nankoku → Susaki for ¥260 rather than the recommended ¥290.

`tests/test_session.test.mjs` covers both scenario mappings, persistence and Demo Tools entries. `tests/route_planning.test.mjs` verifies long option lists retain fixed Undo/Cancel controls.
