# Practice games

## Retirement newspaper

Open `/test?scenario=newspaper` or select **Newspaper · 2-train retirement** in the test game's **Start position** menu. The same fixture is available under **Demo Tools → Fixtures → Newspaper — Farewell to the 2-Trains**.

`train_newspaper` replays the first 178 legal moves from the attributed shared recording in `route_networks.json`, stopping immediately before the first 4-train purchase. Kenji (p3) operates Tosa Electric Railway (TR), which owns 2-5 and 3-0 and has ¥341. The ¥300 4-train is staged locally and the wizard opens at **Rust & Impact**, showing the retirement newspaper. Switch **English / 日本語** in the top bar to compare editions. This preview leaves the game in Phase 3 with all 2-trains still active; stamping the purchase in Dispatch advances to Phase 4, reduces the train limit to 3, and retires all 2-trains.

Selecting a **Start position** or clicking **New test game** creates a fresh copy at the defined checkpoint without changing earlier games. Refresh resumes the room in this tab's address, even when another tab has created a newer fixture. The newspaper also retains this tab's wizard step, selected order, open/closed state and reading position at the same game revision. After purchasing, refresh keeps the resulting position instead of recreating the retirement preview. The backend validates and persists the entire history using normal engine actions.

## SR track at J3

`tile_j3.json` contains an authored sequence of legal auction, stock and operating actions. `tile_j3` starts SR's second operating turn with I2 connected to J3 and straight tile #9 available. `tile_j3_used` adds the normal lay at I4; J3 then waits until the next SR track step. Every action is validated and saved normally, so both fixtures can be replayed and continued. No private player snapshots are included.

Open `/test?scenario=j3` or `/test?scenario=j3used` on the local development server. **New test game** resets the selected scenario without changing earlier games.

## Expanded route practice games

`route_networks.json` contains a shared recorded prefix and two authored branches. The bridge applies every move through the standard engine and persists every resulting revision. No trains, tiles, tokens, phases, or money are injected into an arbitrary snapshot.

| Preset | Recorded prefix | Authored branch | Opening position |
| --- | --- | --- | --- |
| route_network_3 | First 280 moves of existing game 962 | 39 moves | Phase 4, UR, Haruka (p2), three trains: 3 / 4 / 3; 18 laid hexes; ¥320. |
| route_network_4 | First 176 moves of existing game 962 | 67 moves | Phase 3, TR, Kenji (p3), four trains: 2 / 3 / 2 / 2; 16 laid hexes; ¥290. |

The branches use legal, consenting used-train purchases, finish operating turns, and wait until the new trains can run. The four-train branch additionally lays D3 and G4, upgrades E2 and B5, and places a TR station in E2. This joins the northern triangle and west/south corridors, leaving alternative stop choices around the other trains.

The shared prefix is copied from the existing `daemon18xx/app/unittests/fixtures/1889/962.json`, with player IDs normalized to p1–p4. Source: [tobymao/18xx](https://github.com/tobymao/18xx), Tobias Mao and contributors, revision `46a592e40494368390c9a731978a577ac4ecb1e0`, MIT license. The complete [upstream notice](../daemon18xx/app/engine1889/UPSTREAM_LICENSE) is retained. These are imported recording data followed by authored scenario moves; the local Python engine validates them.

Keep this directory with the backend in deployed installations. The runtime does not need the engine's test directory.
