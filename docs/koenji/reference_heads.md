# Photo-reference portraits

Added 2026-10-17. `reference-01` through `reference-07` correspond to the first seven supplied photos in attachment order. `reference-08` through `reference-10` correspond to the next three photos: navy glasses and a silver-chin beard; wavy dark hair and thin oval spectacles; and a shaved head with burgundy glasses and a goatee. The labels describe appearance without assigning identities or resident roles. The original face data and assets are retained for reference; the app and current workbench offer only these seventeen reference portraits. Legacy M1–M5/face selections normalize to Portrait 1, retaining the selected outfit, and can be changed in the look editor.

`reference-11` through `reference-17` correspond to the third set of seven supplied photos in attachment order: upright short hair; a low ponytail and wispy fringe; a balding head and subtle stubble; swept hair and browline glasses; shoulder-length hair and a side fringe; short hair and rectangular glasses; and a black cap with a mustache and goatee. The last portrait retains the cap and subtle ear stud as part of its head artwork.

- Available in character setup, the shared table/arrival/player-strip renderer, and the semi-photoreal face workbench.
- Each portrait includes neutral, smile, calculating, declare, shock, concerned, disappointed, laugh, and blink expressions.
- All twelve Meiji-inspired outfits and sixteen body poses use the same independent head layer.
- Expression changes swap static frames; the existing コマ送り timing and reduced-motion behavior apply.

## Asset format

`public/assets/koma-sprites/photoreal-heads/reference-NN-expressions.png` contains each person's nine transparent expression frames. These are original generated PNGs copied unchanged. The input photographs are not included in public assets.

`src/data/appearance.json` contains the PNG dimensions, per-expression source rectangles, body placement, and skin colors for the foreground hands. The shared renderer clips each source rectangle with a nested SVG viewBox, so only one image per person downloads and remains cached across expression changes. The viewport matches the source rectangle's aspect ratio and registers its neck to the collar; this prevents adjacent atlas rows from appearing in letterbox space, including on the wider shock expressions. Metadata accounts for slight differences in the generated sheet spacing; do not assume exact equal-size cells. Keep the collar registration when replacing future artwork.

The nine expressions are derived from a single reference photo per person, so expressions and unseen angles are artistic interpretations. Preview likeness, neck alignment, glasses, hair edges and hand overlap before accepting replacement artwork. Original head assets remain available for comparison.

Each expression also has a `headAtlas.neckAnchors` point in source-image pixels. The renderer attaches that point to the outfit at `(100, 118)` in character coordinates, independently of the crop's silhouette center. This keeps tilted heads, asymmetric hair, caps and ponytails attached to the collar. Head and torso share the same vertical movement when a held pose leans. Adjust the neck anchor when calibrating an expression; translating or tightening its source crop can otherwise reintroduce offset or clipping. All seventeen portraits have per-expression registration, including the opposing offsets in Portraits 8 and 9. Natural head angles remain part of the artwork.

## Preview and generation record

With the Vite app running, open `/docs/koenji/reference_head_gallery.html` to compare all seventeen portraits, expressions, outfits and poses. **Latest additions** filters by `portraitBatch` in the catalogue, keeping all seven newest portraits together; numbered portrait groups let you review earlier sets, including **Portraits 8–10**. `/docs/koenji/semi_photoreal_face_test.html` includes the new portrait buttons alongside the existing members and animation sequences. Use the served URLs so JavaScript module imports work.

The portraits were created using built-in image generation from the reference photos. Exact prompts and output paths are recorded in [reference_head_generation.json](reference_head_generation.json).

Validation: `node --test tests/reference_heads.test.mjs tests/character_arrivals.test.mjs`; the backend character-arrival tests check that the new face IDs survive social-profile persistence without changing game history.

## Portrait 15 expression scale correction

The Smile, Shock, and Laugh source rectangles included excess horizontal space at the left of their atlas column. Fitting those oversized rectangles into the shared head placement reduced the visible heads by about 20%. Their source crops now closely bound the same head silhouette as the other expressions, retaining the original PNG and absolute neck anchors. All nine expressions render within 3% of Neutral's head-frame height. A renderer regression checks that bound and the existing tests continue to verify collar attachment and exact clipping.
