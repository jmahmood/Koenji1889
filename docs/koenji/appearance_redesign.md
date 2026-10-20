# Appearance screen · railway menu redesign

Implemented the approved appearance mockup using the same green title bar, station illustration, cream panels, inset fields and beveled controls as game setup. The screen uses the existing 17 reference portraits, 12 outfits and shared character renderer; no portraits or costume assets were replaced.

- Desktop: portraits on the left, character preview in the centre, attire on the right. Numbered portrait tiles and shorter outfit captions keep the main controls readable. Full outfit names remain in accessible labels, tooltips and the Advanced selectors.
- Advanced: expression previews and labelled portrait / attire dropdowns. Choices stay synchronized with the main tiles and live preview. Preview expressions do not become permanent expressions during gameplay.
- A single save bar contains Save look & continue and, when a saved appearance exists, Keep previous look. Unsaved portrait / attire changes are labelled explicitly. First-time users choose and save a look before continuing.
- Smaller viewports rearrange the columns and permit scrolling. The save bar remains accessible, and selection changes retain the scroll position and keyboard focus.
- The existing save/cancel and authenticated appearance-sharing flow remains in `main.js`. Visual choice handlers are now exported from `CharacterSetup.js` so their draft behavior can be tested. Styling is isolated in `src/appearance.css`.

Validation: all 106 JavaScript tests passed, including new tests for complete catalogue access, independent portrait / outfit selection, Advanced tab draft retention, alternative selectors and legacy defaults. Production build passed. Browser checks verified tile and dropdown synchronization, expression previews, cancellation, saved appearance on the shared table, and persistence after reload. Browser verification used the separate local preview and test database from the booking redesign.

Screenshots are saved under `validation/booking-redesign/appearance-screen.png` and `appearance-mobile.png`.
