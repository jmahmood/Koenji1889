# Portraits 18–24 validation

Added 2026-10-22 in source attachment order. `all-expressions.png` renders all 63 new expression frames through the shared character renderer with the indigo haori. Reviewed likeness, full hair and beard silhouettes, frame separation and collar alignment. PNG atlases retain generated transparency unchanged.

Checks passed: 20 Node tests across reference_heads, character_arrivals, appearance_setup and invitation_portraits; seven server character-arrival tests, including persistence of all 24 portrait IDs without changing game history; production build; git diff whitespace check. The build reports its existing large-bundle warning.

The saved preview uses the actual SVG character renderer and a local rasterizer. Browser automation was unavailable in this environment, so this is a static renderer check. The served gallery at /docs/koenji/reference_head_gallery.html supports all expressions, twelve outfits and sixteen poses; Latest additions selects all seven new portraits.
