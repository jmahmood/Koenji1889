# Corporation readability — 22 October 2026

The Corporations table uses 18–24 px main text and 15–18 px supporting text, sized to its own panel. Darker secondary text and the President label remain readable on selected rows. Rows wrap long company names and separate the train list from the president. The old compact font overrides were removed.

Browser verification:
- At 1840 × 950, the panel displays all seven companies without horizontal or vertical overflow. Computed main/holding text: 22.26 px; details: 17.066 px. See desktop.png.
- At 1280 × 720, main/holding text remains 18 px and details 15 px. The list scrolls without clipping cell text; selecting UR preserves the scroll position and ArrowUp focuses/selects KU. See small-window.png.
- Split 2-Up retains 18 px main/holding text and 15 px details, with horizontal scrolling and no overflowing text within cells. See split-window.png.

Stock and map inspection windows preserve their scroll positions when rendered again. Arrow-key corporation selection scrolls the selected row into view.

Validation: production build succeeded; all 34 tests in room_usability.test.mjs, decision_desk.test.mjs, and escape_navigation.test.mjs passed.
