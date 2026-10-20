# Railway booking desk · setup and invitations

Implemented the approved 90s railway tycoon direction in the existing game. Appearance selection remains the existing character picker. Game rules, start authorization, credentials and backend endpoints remain unchanged.

## Main flow

- **Host a game:** game name, 2–6 player selector, optional host seat, individual name fields, Create table. Switching tabs or temporarily reducing player count retains the typed names.
- **Join a game:** invitation / room code, available seats after a room-code lookup, saved tables for rejoining with the existing identity.
- **Waiting table:** named roster, separate joined / online indicators, person-specific Copy invitation actions, server-gated Open host ledger. Claiming an invitation explicitly confirms the player’s name. Claimed offline seats remain ready.
- **At the table:** notes and membership stamps.
- **Advanced:** host name and resident entrance at creation; name edits, appearance, refresh, motion, seating order, portrait presets, observer invitation and resident entrances in the lobby. Developer fixtures stay in Advanced. Starting another gathering is also available there.

The menu styling is isolated in `src/booking.css`. It uses proportional system fonts, cream panels, forest-green title bars, red seat plaques, inset fields and beveled controls. Short desktop windows use a compact layout; the primary creation action stays accessible when the form needs scrolling. The same flow adapts to narrow viewports.

Copy actions show visible feedback. If the clipboard API is unavailable or denied, the private invitation appears in a selected read-only field. That fallback survives subsequent renders, and form text selection, draft values, expanded Advanced sections and scroll positions are preserved. Invitation loading also runs when a saved host rejoins. Guest tabs sharing the host browser continue to hide host invitations and start controls unless the existing explicit Advanced override is used.

## Verification

- Full `npm test`: 102 JavaScript tests, 34 Python application tests, 20 engine tests passed. A subsequent small identity correction adds one further JavaScript regression test; targeted setup tests and production build passed after the correction.
- `npm run build` passed. Vite retains the existing advisory for a JavaScript chunk above 500 kB.
- Browser: create five-player game; change counts and return without losing names; claim all four invitations independently; preserve host identity through seating reorder; post a note and stamp a card; start successfully with claimed players away.
- Browser at 390 px iframe width: create a two-player table with a non-playing host; look up open seats by room code; rejoin from recent tables; retain creator controls and private invitation buttons.
- Preview uses a separate local server and `/private/tmp/koenji-booking-design.sqlite3`, independent of the existing game database.
- Screenshots: `validation/booking-redesign/host-screen.png` and `invitation-lobby.png`. `mobile-preview.html` in that directory provides a 390 × 844 iframe for checking the live app.

## Station art

Generated with the built-in imagegen tool. The final full-bleed banner is saved in `public/assets/lobby/koenji-station.png`. It is an original game illustration, rather than a crop of the design mockup.

Generation prompt:

> Create a production game background asset, a very wide panoramic banner, ideally 3:1 landscape. Finely drawn 1990s railway tycoon computer game pixel art of a cozy Meiji Japanese railway station in Koenji: black steam locomotive on left, train cars along lower foreground, warm timber station with dark tiled roofs centered and right, tiny passengers on platform, green trees and a flowering cherry tree far right, hills, soft pale blue sky with cream clouds. Deliberate visible pixels and lightly dithered shaded surfaces, lovingly detailed nostalgic management game illustration, not photorealistic, not vector. Daylight. Composition essential: upper LEFT half mainly open pale sky for interface headline overlay; station and train occupy lower two thirds and right. Full bleed illustration only, no frames, NO TEXT OR LETTERS anywhere, no signage text, no UI controls, no title or watermark. Warm restrained colors with forest green and rust red accents, matching cream beveled desktop game menu.
