# District Survey artwork and data

The live map inspector is rendered by `src/components/DistrictSurvey.js`. All **52 board hexes** have a distinct photo-referenced, generated historical portrait in `src/data/districtArtwork.json`. The compact Survey labels these **Illustration · c.YEAR** and links to the corresponding research entry. They are interpretations of Shikoku in 1870–1900, not archival photographs.

Open `/assets/districts/research/index.html` in the running app for the complete atlas: geography, mapping confidence, historical findings, actual photo references, creators, licenses, source links and exact generation prompts. The atlas is served in production as well as development.

## Geographic and historical limits

The board contains 25 named locations and 27 unnamed countryside hexes. Named locations follow the game labels; unnamed hexes receive explicitly **inferred regional matches** from surrounding named locations and terrain. There is no authoritative geographic polygon for an unnamed hex. A reference may show an adjacent landscape within the same region; its role and limits are recorded individually. The three offboards represent sea connections, not verified historical ferry timetables or routes.

Research distinguishes dated local events, period industries, biographical links and wider regional context. Where a specific local event was not verified, the atlas says so. Events outside 1870–1900 are not presented as events inside that interval. Scene years describe the artistic setting; photographic catalog dates, scan dates and upload dates are separate.

Most references are modern photographs used for landforms or surviving architecture. The contemporary 1894 Dogo image and an older Besshi image supply historical forms. Modern bridges, dams, vehicles, infrastructure and later additions are excluded from reconstruction prompts. For example, the Ozu and Takamatsu scenes omit keeps demolished in 1888 and 1884 respectively; Shimizu does not acquire its later Ashizuri lighthouse. Background detail and people are interpretive, not an exact historical survey.

## Files and regeneration

- `docs/koenji/district-research/board-inventory.json`: exact engine board inventory.
- `docs/koenji/district-research/districts-plan.json`: all locality interpretations, historical findings, scene briefs and reference roles; the publishing source of truth.
- `docs/koenji/district-research/history-sources.json`: the initial normalized historical source library. Per-hex refinements in `districts-plan.json` take precedence.
- `docs/koenji/district-research/generation-log.json`: exact prompts, built-in generation output paths and reference inputs.
- `docs/koenji/district-research/originals/`: full-resolution, distinct generated PNG originals for all hexes.
- `public/assets/districts/references/`: selected real photographs and their original Commons metadata, including creator and license.
- `public/assets/districts/*-meiji-v1.webp`: locally encoded display copies. Encoding does not change the composition; original PNGs remain untouched.
- `public/assets/districts/research/`: published atlas and full research/prompt data.
- `scripts/build_district_artwork.py`: publishes the atlas, runtime manifest and WebP copies. It does not generate artwork or call an image API.

Run the publisher with a Python environment containing Pillow:

```sh
python3 scripts/build_district_artwork.py
npm run build
node --test tests/district_survey.test.mjs tests/district_artwork.test.mjs
```

The default publisher refuses incomplete coverage. `--partial` exists only for work in progress.

## Replacing an illustration

1. Update the hex's record in `districts-plan.json`. Use a geographically appropriate real photograph, inspect it, and retain its source URL, creator, catalog date, credit and reuse terms. Distinguish a historical photograph from a modern landscape reference. Never infer a capture year from an upload date.
2. Save the original reference plus its metadata in `references/`. List its coordinate key in `referenceCoords`; shared regional references are allowed only with the geographic limitation stated in `referenceUse`. Confirm structures existed in the scene year before reproducing them.
3. Use built-in imagegen with the actual local reference image(s), one distinct generation for the hex. Keep the historical subject and constraints explicit. Save a versioned PNG alongside the existing original; preserve prior versions.
4. Record the exact prompt, reference paths, method and selected output in `generation-log.json`. Set that hex’s `artVersion` to the new version in `districts-plan.json`. The first set's shared visual direction is painterly late-1990s business strategy art, restrained woodblock contours and clear silhouettes at vignette size.
5. Rebuild metadata and display copies with the publisher. Preserve required photo attribution and compatible ShareAlike terms for reference-derived illustrations. Individual source photographs retain their own licenses. The atlas contains readable credits rather than relying on tiny in-game text.
6. Inspect the live Survey at default, narrow and maximized sizes. Check the correct district image, readable subject, scene date, history link and geographic qualifier. Review the generated picture for modern objects and unsupported landmarks.

For a genuine archival photo or print shown directly, use `kind: period-image` and the actual recorded date, rather than labeling it as a generated scene. The manifest supports `focalPoint` for CSS framing without editing the original. The previous Marugame concept remains in the asset directory as an unused design reference.

## Gameplay sources

Art and historical context confer no game effects. The Survey retains station capacity, occupied tokens, home reservations, terrain charges, private-company blocks, sequential color/phase gates and live tile stock. Specimen inspection never stages or submits construction. The operating ticket and server retain placement validation.

Gameplay fields come from the displayed server snapshot, including historical views. A later phase cannot skip a tile color. Permanent locations and special H/T/K chains retain their existing catalog rules. Financial forecasts, route revenue and connection counters remain omitted.
