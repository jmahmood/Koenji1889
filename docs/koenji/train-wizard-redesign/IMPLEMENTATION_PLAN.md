# Illustrated train purchase wizard — implementation plan

Status: approved visual direction; implementation has not started.
Date: 22 October 2026.

## Intended result

Replace the wizard's dense dark panels and generic locomotive graphic with the approved espresso header, parchment workspace, illustrated railway cards, connected station step indicator, and clear footer actions. Keep the existing five-step purchase flow and authoritative rules.

Historical artwork mapping is an aesthetic interpretation of game tiers:

| Game tier | Illustration inspiration | Saved concept |
| --- | --- | --- |
| 2 | Iyo Railway No. 1 | [2-train](artwork/2-train-iyo-no1.png) |
| 3 | Class 8620, No. 58685 | [3-train](artwork/3-train-8620-58685.png) |
| 4 | Class C58, No. C58 333 | [4-train](artwork/4-train-c58-333.png) |

These historical classes do not determine stop counts, rust, price, or ownership. Those remain game properties. A historical locomotive number is distinct from an instance ID such as `2-0`.

Approved layout references: [Fleet](mockups/step-1-roundhouse.png), [Selection](mockups/step-2-selection.png).

## 1. Prepare production artwork

- Preserve these full-resolution concept cards unchanged as design masters. `asset-manifest.json` records original locations, dimensions and SHA-256 hashes. Reject the earlier C58 draft with four large driving wheels; only the corrected version is saved here.
- Derive illustration-only assets from the three approved concepts using the image generation/editing workflow. Remove baked-in frames, titles, badges, stop counts and parchment so the live interface supplies them. Request genuine transparency; do not simulate it with a beige rectangle.
- Keep the full locomotive, tender where appropriate, chimney, and running gear uncropped. Retain the distinctive small green Iyo tank engine, slim 8620 tender locomotive, and C58 smoke deflectors/collector. Check wheel arrangements and number plates against the supplied photographs before final export.
- Normalize baseline and padding across assets while retaining visually believable relative proportions. Test at card size, not only enlarged.
- Export lightweight, appropriately sized runtime assets into `public/assets/trains/`; retain high-resolution masters here. Use responsive resolutions and explicit dimensions to prevent layout shift. Set a target of roughly 150–300 KB per normal card image and inspect visual quality before accepting compression.
- Record source-photo credit, permission/licence status, and generation provenance in an asset credits file. Supplied photographs are reference material; do not assume public-domain status. Resolve reuse terms before shipping derived artwork.
- Maintain the existing neutral illustration fallback for 5-, 6-, D-trains and failed asset loads. Do not assign historical identities to those tiers in this change.

Deliverable: three reviewed illustration-only assets and an asset mapping with a fallback.

## 2. Introduce shared illustration rendering

Primary file: `src/components/TrainDesk.js`.

- Replace the generic rendering for tiers 2/3/4 through a shared image helper, with historical display name and source metadata separate from game state.
- Update all relevant illustration uses consistently: fleet bays, depot cards, selected purchase summary and dispatch voucher. Keep the compact sidebar launcher decorative and appropriately sized.
- Labels, historical names, prices, quantities, statuses, train IDs and buttons remain real accessible HTML. Never use the full concept-card image as a screenshot button.
- Render game tier and physical instance ID prominently where needed; show historical class names as secondary identity.

## 3. Restyle the five-step wizard shell

Primary files: `src/components/TrainDesk.js`, wizard rules in `src/style.css`; review shared overrides in `src/operatingControls.css` and `src/playtestFeedback.css`.

- Use an espresso header with active company name, concise “Train purchase” title, phase/limit information and close action.
- Replace heavy step boxes with a connected station indicator. Keep all five labels readable and show current/completed/future states with text or shape as well as colour.
- Preserve existing step navigation, selection requirements, close/resume behaviour and keyboard handling. Do not make future steps actionable earlier merely because the mockup depicts them as stations.
- Use parchment content surfaces, dark ink, brass rules, serif headings and legible supporting type.
- Keep Back, progress and Next/confirmation controls outside the scrolling content. An available “End [Company] Turn” action uses transparent parchment with green outline and text. Purchase/Next uses filled green.
- Audit actual app-wide styles so primary-action overrides cannot recolour the outlined alternative or halve its width.

## 4. Rebuild Fleet and Selection presentations

### Fleet

- Put locomotive artwork directly in occupied roundhouse bays; remove the separate duplicate owned-fleet strip.
- Show tier, instance ID, active/rust/trade-in state and capacity from the live view. Empty bays use quiet tracks or a subtle silhouette.
- Generate bay counts from the current train limit and existing over-limit/discard handling; do not hardcode four bays.
- Condense the optional/required notice. Preserve emergency funding and mandatory-purchase guidance when relevant.
- Keep staged acquisition, rust and trade-in previews clear without presenting them as confirmed changes.

### Selection

- Integrate historical artwork into the existing depot certificates. Retain authoritative price, stock count, phase/rust notes, returned-train status, trade-in terms and exact action payloads.
- Use distinct available, selected and future-stock states. Future stock remains viewable but unselectable. Derive locks from existing server projections, not hardcoded phase labels.
- The approved mockup is an artwork/layout reference: its omission of prices and stock details is not a requirement to remove those live purchase details.
- Support every tier, including 5/6/D through the fallback. Reflow long catalogues into a responsive grid; never restrict the depot to the three illustrated examples.
- Preserve the depot/inter-company source switch, seller identity, negotiated prices, consent requirements and offer handling. Apply artwork to used trains without changing transfer permissions.

## 5. Carry the style through Rust, Financing and Dispatch

- Apply the same shell, type hierarchy and parchment surfaces to existing content.
- Keep rust/phase consequences, contribution amounts, emergency share sales, solvency/bankruptcy handling, and final payment breakdown visible and accurate.
- Preserve the final explicit Stamp & Buy confirmation and stale-revision checks. Selecting artwork or advancing a step must never submit a purchase.
- Keep only one dispatch summary; retain the persistent confirmation footer.

## 6. Accessibility, translation and responsive layout

- Keep native buttons, visible keyboard focus, accessible dialog naming and existing focus restoration. Give decorative art empty alt text when the adjacent label already identifies it.
- Add new labels to `src/ui/i18n.js`; preserve proper names and game IDs correctly. Check English and Japanese for wrapping.
- Keep notices readable without animation and selected/locked states understandable without colour alone.
- Reflow four fleet bays and depot cards to two/one columns at narrow widths. Use object containment, legible text and ordinary content scrolling rather than shrinking the whole wizard.
- Retain visible close, Back, End Turn when legal, and Next/Stamp controls at short window heights. Expanded financial details must not push the footer offscreen.

## 7. Validate against the real application

Use disposable fixtures, never real games. Extend meaningful coverage in `tests/train_desk.test.mjs` and existing decision tests for the new rendering and preserved action restrictions. Use `scripts/check-train-wizard.mjs` with fixture setup for browser verification.

Required scenarios:

- Optional purchase, required purchase, empty/full fleet and over-limit discard interruption.
- Depot availability changes, future stock, returned stock, Diesel trade-in and phase-triggered rust.
- Inter-company purchases, seller consent, common-president transfer, emergency share sales and bankruptcy.
- Close/resume, keyboard navigation, historical/observer restrictions and stale revisions.
- Asset loading/fallback, all train tiers and both language layouts.

Run focused tests and the production build. Browser checks must load the complete app and all shared styles, not only isolated components. Verify footer button hit targets, widths, overflow, real clicks and absence of runtime errors at 1440×900, 1366×768, 1280×720, 800×600, 390×844 and 360×640. Inspect screenshots of all five steps, the expanded financial content and the sidebar launcher.

## Completion criteria and delivery

- The three historical illustrations appear in Fleet/Selection and relevant purchase summaries, with readable live HTML labels.
- Five steps share the approved visual language; no cropped locomotives, duplicated fleet panels or unreachable actions.
- All purchase permissions and funding/rust consequences remain authoritative; required purchases cannot end the turn early.
- Optimized assets, credits, screenshots, focused test results and build results are saved with the implementation.
- Review the complete working wizard before deployment. This plan does not authorize deployment or modify the rules engine.

Suggested sequence: production artwork → shared image mapping → shell/Fleet → Selection → remaining steps → real-app validation. Keep each stage independently reviewable.
