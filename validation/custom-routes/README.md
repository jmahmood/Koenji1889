# Stop-based custom routes

Custom routes now use named stops and map targets. The segment dropdown, path indices, manual validation button, and duplicate advanced confirmation flow are gone. The recommended plan remains the starting point.

## Interaction

1. Choose **Change stops** for a train. Other trains retain their routes and reserve their track.
2. Click highlighted revenue stops on the map, or use the matching named buttons. Only prefixes of legal routes are offered. Numbered markers show stop order.
3. Undo a stop or cancel the edit. Escape cancels only the edit. Keyboard Enter works on map targets and on named stop buttons.
4. A completed route shows this train’s revenue and the resulting total. If several track connections serve the same stops, select a connection to preview it on the map.
5. **Use this route** stages it and automatically quotes the exact draft. **Run trains** commits the displayed plan and opens the dividend decision.

Use **Don’t run** to free a train’s reserved track, then choose stops for another train. **Restore recommended routes** restores the whole plan. Both the total and run action remain visible as the train list scrolls.

## Server and race protection

Authenticated `POST /api/1889/games/{room}/route-options` accepts the live revision, owned train ID, ordered stop vertices, and existing draft routes. It enumerates candidates through the existing engine, validates them against the other trains’ track, and returns possible next stops and complete connections with per-train and total revenue. No game action is recorded. Foreign seats, spectators, old revisions, newly bought trains, bad stops, and unavailable game positions are rejected. The run action retains the normal engine validation.

The client binds each quote to its room, token, game revision, request sequence and exact serialized draft. Stop responses are also bound to the edit session and stop prefix. Delayed responses cannot approve newer edits or revive canceled edits.

## Verification

Live browser at 1280 × 720 with the two-train fixture:

- Changed train 2-0 by choosing Imabari / Onomichi Ferry and Matsuyama on the map.
- Preserved train 2-1’s Matsuyama–Saijo route.
- Verified **Undo stop**, HTML-button Enter, SVG-map Enter and Escape cancellation.
- **Use this route** quoted ¥50 for that train and ¥90 total.
- **Run 2 trains · ¥90** was accepted at revision 34; payout and withhold controls were visible, with no boardroom dialog.
- The floating Trains & Routes screen now uses the same authoritative total and named stops.

Screenshots: choose-stops.png, route-complete.png, custom-plan.png, dividend.png.

Automated coverage: all 121 JavaScript tests pass, all 13 focused Python decision/fixture/stop-editor tests pass, and the production build passes (existing large-chunk warning). The stop-editor tests include overlapping track, capacity, malformed/repeated stops, read-only requests, authorization, and committing a chosen connection. JavaScript tests include cancellation and out-of-order responses.

Limits: no novice-participant study; no full late-game performance or mobile usability certification. The existing engine still enumerates exact routes; this change does not replace its search algorithm.
