# Kemonito: assistant treasurer

Kemonito is the club mascot. The owner approved the purse-and-banknotes pose animation on 21 October 2026. Her first application role is distributing money; other positive occasions are deferred. Share certificate presentation remains unchanged.

## Behavior

- Uses the approved eight-pose artwork: purse, open, withdraw banknotes, offer, hand over, release, close, wave.
- Plays only for confirmed positive `cash_receipts`, including dividend payments, private income and other existing authoritative cash receipts. Amounts are never inferred from route revenue.
- Appears within the illustrated table beside the recipient's seat. Corporate receipts are directed to that company's president and labeled as company treasury money. Other workspaces use a compact presentation.
- Uses the existing bounded, deduplicated character playback queue. Refreshes and polling do not restart the same event. Viewing another workspace does not restart its poses.
- Skip/Dismiss, room changes, and hiding the document cancel playback through existing controls. The overlay does not capture board or player clicks.
- Motion Off and held historical inspection show a static receipt summary without Kemonito moving. The animation does not alter balances, create journal events, or block gameplay.

## Assets and validation

The reference photograph is not copied into application assets. `public/assets/kemonito/purse-poses.webp` is the approved generated character sheet, converted losslessly in geometry for browser use. The original sample and generation notes remain in the starter package's `previews/assistant-treasurer/` directory.

All 161 frontend tests pass, including checks for actual recipients, treasury destinations, positive-only amounts, duplicate events, cancellation, unchanged share purchase recipes, and Motion Off. Production build passes. Browser checks used `/validation/kemonito/index.html`, an isolated visual fixture that uses the production room, playback, and renderer without creating games or changing balances. Four-player animated placement and six-player Motion Off were inspected. This is not a claim of a complete human multiplayer playtest.

These are local changes; no deployment or publication was performed.
