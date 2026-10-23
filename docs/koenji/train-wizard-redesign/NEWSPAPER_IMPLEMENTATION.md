# Retirement newspaper — local implementation

The Rust & Impact step now publishes a fictional railway special edition when a selected depot purchase triggers retirement. The language follows the game's existing language selector:

- English: horizontal letterpress-style columns and The Shikoku Railway Gazette masthead.
- Japanese: 四國鐵道新報, right-hand vertical masthead, vertical headline and article columns read right to left. Headline numerals use kanji.

All newspaper text is selectable HTML generated from the live projected phase/rust/limit values. No headline, date, train capacity or game rule is baked into the illustration. This is a future consequence preview, with explicit notices that nothing changes until Dispatch is stamped. The original detailed fleet comparison stays underneath, covering every railway.

The 2→4 transition uses the text-free station engraving: the old train remains intact while travelers choose the newer train. The 3→6 and 4→Diesel transitions use the corresponding existing locomotive assets; they never depict the wrong retirement tier or present a steam engine as the arriving Diesel. Ordinary purchases and inter-company transfers do not display a retirement newspaper. The unchanged-limit Diesel case says the limit remains unchanged.

Files: `src/components/TrainNewspaper.js`, `src/components/TrainDesk.js`, `src/trainIllustrations.css`, and new translation entries in `src/ui/i18n.js`. No rules-engine or payment-step changes.

The built-in image generation tool produced `production/newspaper-station.png`; its prompt is `production/newspaper-scene-prompt.txt`. The optimized runtime asset is `public/assets/trains/newspaper-station.webp` (approximately 434 KB at 1200×800). It derives from the previously approved concept; existing source-art publication notes still apply.

Validation:

- All 216 JavaScript tests passed; 20 focused train tests passed after final refinements.
- All nine purchase browser scenarios passed, including phase/rust effects, transfers, Diesel trade-in, emergency funding and insolvency.
- Newspaper browser checks cover English and Japanese, retirement of 2/3/4 trains, widths 1366/390/360, visible navigation, and unchanged game revisions while previewing.
- Screenshots and results: `validation/train-newspaper-20261022/`, with purchase-flow results in its `purchase-audit/` subdirectory.
- Production build and diff whitespace check passed.

Implemented locally; no deployment performed.
