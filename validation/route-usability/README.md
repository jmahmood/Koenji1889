# Route usability review

Browser verification at 1280 × 720, using separate engine-backed test games.

## Findings and changes

- Before: generic Decisions & Planning modal hid the board. Unrelated emergency funding text preceded the route. Stop names were about 9.5px.
- Map track screen: board on left, operating decision on right. Adopted that placement for route decisions.
- Dividend screen: revenue distribution follows route submission. Browser testing exposed the old dialog remaining open and switching to a purchase boardroom; route submission now dismisses it.
- First revised layout put Run below the fold. Reduced vertical spacing and re-captured: stops, ¥50 revenue, Run action, next-step text and advanced disclosure fit without scrolling.

## Verified flow

Open Decisions at route step → map and dedicated route panel → Matsuyama E2 to Imabari / Onomichi Ferry F1 → Run 1 train · ¥50 → server accepts revision 1 with ¥50 revenue → visible Pay Dividend (¥50) and Withhold (¥50), no purchase dialog.

## Evidence

- before.png: previous generic route modal
- after.png: revised route panel with highlighted map, visible Run action
- map.png: track decision comparison
- dividend.png: accepted route and payout controls
- player-inspection.png: inspection dialog comparison

## Limits

This is an expert walkthrough and live functional verification, not a novice participant study. Visually checked one runnable two-stop train on desktop. Multi-train layouts, mobile layouts, keyboard navigation and advanced custom segment editing have not been usability validated. Manual editing still exposes track-segment mechanics and needs a further redesign.
