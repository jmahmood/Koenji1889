# District Survey — proposed area-information menu

This standalone proposal replaces the text-led Hex & Tile Lay inspector with an illustrated district dossier. It does not change the live application.

## Information hierarchy

1. **Recognize the place.** A painted district portrait, location coordinate, and Sanuki Railway home seal establish identity immediately. The artwork is conceptual, not a geographic reconstruction or a statement about railway access to the illustrated harbor.
2. **Read its current condition.** A fare ticket shows route revenue, a station bay shows capacity, surveying instruments show the terrain surcharge, and unfinished rails show the absence of track. These facts remain the current White-hex state while exploring future development.
3. **See its potential.** Four physical tile specimens replace the prose upgrade ladder: surveyed land, first connection, regional junction, and mature city. Color, track geometry, station circles, revenue, and phase labels work together.
4. **Inspect the tradeoff.** Selecting a stage reveals its tile specimens and a parchment comparison of revenue, station capacity, and terrain fee. The Green examples call out that #14 and #15 offer a second station slot; other Green examples may retain one.
5. **Keep the place in context.** A neighbourhood atlas highlights I2 beside the surrounding board hexes, using the project's actual board geometry.

The inspection window stays an information surface. Tile reach, rotation, inventory, upgrade compatibility, home reservations, and final commitment still belong to the operating track workflow. The phase ladder shows development potential, not guaranteed legal transitions between every pictured specimen.

## Visual language

- Retain the game's blue window title bar, cream serif type, and beveled brass controls.
- Use painted place portraits, wooden specimen trays, fare tickets, station bays, survey tools, and parchment comparisons.
- Keep substantial imagery tied to a question the player needs answered; do not invent population, demand, or desirability scores.
- Use the real catalog tile drawings instead of generic railway icons for upgrade decisions.
- A future implementation can reuse this structure for mountains, ports, towns, and offboard destinations with the appropriate artwork and rules.

## Files

- `index.html`: interactive standalone proposal; select stages and tile specimens.
- `proposed-area-survey.png`: 2640 × 1860 presentation image.
- `proposed-area-survey.svg`: self-contained editable vector layout with embedded illustration.
- `marugame-district-illustration.png`: original generated illustration asset.

## Validation

The layout was rendered in Chrome at 2× resolution and visually inspected. Stage selection updates the comparison and specimen tray; tile selection updates its highlighted specimen. No JavaScript page errors were observed. The supplied revenue, phase, slot, and tile examples follow the existing project inspector and catalog; the illustration is conceptual.

## Illustration generation

Method: built-in `image_gen` tool, using the imagegen skill. All typography, interface layout, icons, tile specimens, and atlas geometry are drawn separately in SVG, so generated text is not used in the interface.

Final generation prompt:

> Use case: historical-scene. Asset type: a panoramic background illustration for an 1889 Japanese railway strategy game's district-information menu, not the menu itself. Primary request: create a richly illustrated, readable miniature portrait of a modest coastal castle town in Shikoku, inspired by late-1990s Railroad Tycoon II / Ultimate Soccer Manager illustrated management screens. This is a conceptual illustration for Marugame, not a geographic reconstruction. Show foreground open grassy land with a small wooden survey stake and rolled surveying plans beside it, midground traditional Japanese tiled-roof town buildings and a small harbor with wooden sailing boats, a stone retaining wall and distant hilltop Japanese castle silhouette, inland fields and low hills behind. No railway track and no station yet: the district is unbuilt. A poised future railway location. Hand-painted isometric/diorama illustration with woodblock-influenced silhouettes, warm parchment highlights, moss greens, muted teal water, brick red accents; crisp and richly textured like premium 1990s PC strategy game artwork. Panoramic composition, approximately 2:1, town seen from elevated three-quarter viewpoint, safe empty foreground area near lower left for a small UI locator overlay. Edge-to-edge painted art. Afternoon light. No text, no letters, no numbers, no labels, no UI panels, no frames, no modern architecture, no modern cars, no locomotives, no people portraits. The scene should communicate the place at a glance with strong recognizable silhouettes rather than photographic detail.
