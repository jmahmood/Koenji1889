# Portraits 25–27 validation

Added 2026-10-22 in source attachment order. The three transparent atlases were created with built-in image generation and copied unchanged into public/assets/koma-sprites/photoreal-heads/reference-25-expressions.png through reference-27-expressions.png. Original photographs are not shipped. Prompts are recorded in docs/koenji/reference_head_generation.json.

all-expressions.png shows all 27 new expression frames rendered through the shared SVG character renderer with the indigo haori and a local rasterizer. Reviewed likeness, hair edges, expression separation and neck alignment. This is a static renderer check, not a browser automation check.

Passed: 20 Node tests across reference_heads, character_arrivals, appearance_setup and invitation_portraits; seven server character-arrival tests including saved appearance persistence for all 27 portrait IDs without changing game history; production build; git diff whitespace check. The build retains the existing large-bundle warning.

The served gallery at /docs/koenji/reference_head_gallery.html includes all 27 portraits. Latest additions shows Portraits 25–27; earlier portrait groups retain their original membership.
