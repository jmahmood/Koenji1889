# Illustrated train purchase wizard — implementation report

Implemented locally on 22 October 2026. No deployment performed.

## Delivered

- Transparent illustration-only masters for Iyo Railway No. 1, Class 8620 No. 58685, and C58 333, generated with the built-in image generation tool from the approved concepts.
- Six WebP runtime assets in `public/assets/trains/`, with alpha transparency and responsive resolution selection. Normal 640px versions are approximately 64–106 KB; larger versions are approximately 219–386 KB. Prompts and export dimensions are saved in `production/`.
- A shared historical artwork mapping in `src/components/TrainDesk.js`, with decorative empty alt text and a neutral SVG fallback for missing images and an explicit diesel-shaped fallback for Diesel. All six game tiers now have dedicated artwork.
- Illustrations in actual occupied fleet bays, depot certificates, inter-company offers and final purchase summaries. Removed the duplicate owned-fleet display; staged acquisitions remain distinct from owned engines.
- Espresso wizard header, connected station navigation, parchment workspace and footer, concise Fleet/Selection headings, illustrated arched bays, and live HTML labels for prices, quantities, IDs, availability, rust and funding information.
- All five steps retain the existing action handlers and authoritative rules. Close/resume, source switching, emergency funding, trade-ins, negotiations and final confirmation remain available. Optional End Turn is a green outlined alternative; mandatory acquisition still blocks it.
- Responsive layout, persistent confirmation footer and Japanese translations for new interface text. Historical names remain protected from automatic translation.

## Validation

- All 214 JavaScript tests passed. After the final transfer-art and footer edits, 48 focused train/decision/playtest tests also passed.
- Production build passed with the existing large-bundle advisory.
- Nine browser transaction scenarios passed: depot purchase/pass, offered transfer, emergency sales, common-president transfer, Phase 4 rust, Diesel trade-in, out-of-turn seller consent, insolvency and mobile purchase flow. No runtime errors.
- Additional full-app artwork audit passed at 1440×900, 1366×768, 1280×720, 800×600, 390×844 and 360×640. Verified image containment, modal width, all five step screens and visible confirmation button.
- Japanese mobile screenshot and missing-image fallback checks passed. Input images and full-resolution masters were visually inspected; final Fleet and Selection screenshots were inspected at desktop/mobile sizes.
- `git diff --check` passed.

Reports and real application screenshots: `validation/illustrated-trains-20261022/` (repository root). `browser-results.json`, `artwork-results.json`, and `dispatch-layouts.json` contain the browser results.

## Publication status

Photo provenance and licence notes are recorded in `public/assets/trains/CREDITS.md`. User-supplied reference permissions have not been independently established for every photograph. Confirm publication/licence obligations before public distribution; local development and testing are complete. Historical number plates and detailed running gear remain artistic interpretations rather than engineering documentation.

No rules-engine changes, real-game modifications or deployment were required.


## Completion of later tiers

The user expanded coverage to all trains. Dedicated transparent engraved assets now cover 5 (Class C11-inspired tank engine), 6 (Class D51-inspired tender engine), and D (Class DF50-inspired diesel-electric). All six types use the same image helper in fleet, depot, transfer and dispatch views. These additional assets are original generated class interpretations using the approved engraving style, not adaptations of new third-party photographs. They do not claim a literal historical progression in stop capacities.

The asset-completeness regression test compares the mapping against every train type in the authoritative fixture and verifies both runtime image resolutions. Diesel has an explicit Unlimited stops label and a diesel-shaped image-failure fallback. Late-tier browser results are recorded separately in `late-tier-results.json` after exercising exact prices, phase changes, rust and the ¥300 Diesel trade-in credit.

Late-tier verification completed: all 215 JavaScript tests passed, followed by 19 focused tests after adding the visible Unlimited stops depot label. Production build passed. All three new full-app purchase scenarios passed with no browser errors: 5-train ¥450 and limit 2, 6-train ¥630 and 3-train rust, Diesel ¥800 with ¥300 trade-in credit, return of the traded 6-train, 4-train rust and Unlimited stops in the resulting fleet. Desktop and mobile artwork screenshots were visually inspected. `late-tier-results.json` and `late-{5,6,D}-*.png` record the results.
