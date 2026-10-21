# Kemonito and Kemalito: shared victory celebration

Added locally on 21 October 2026 using the owner's photograph of both children as the basis for their shared joy, relative height, clothing and interaction.

## Behavior

The accepted game-ending event must contain `finished: true` and actual winner IDs. Bank exhaustion on its own does not start the celebration. Both mascots arrive together, clap, raise their arms, high-five, clap again and wave over 4.35 seconds. Each winning seated character also adopts a triumphant pose. The current winning viewer sees “You win!” or “You share the win!”; other players and observers see the actual winning names.

The final celebration replaces the last move's ordinary money/setback presentation and clears earlier queued game animations. It never alters cash or results. Duplicate event deliveries do not clear or restart a celebration already in progress. An ending caused by bankruptcy gets the shared congratulations rather than a teasing Kemalito cameo. The existing event notice's Dismiss control skips the ceremony; it remains nonblocking for game inspection. Room changes and hidden-document handling use the existing cancellation behavior.

Motion Off and held historical inspection retain a shared high-five still and the confirmed winner label. Explicit historical animation can replay the pose sequence. The celebration adds no sound, so no giggle is misattributed to the winning moment. Initial page loads retain the existing no-backlog behavior rather than replaying a completed game automatically.

## Artwork and prompt

Generated with the built-in image-generation tool. The source photograph is not copied into the application. The original six-frame transparent pair atlas is retained as `public/assets/club-mascots/victory-pair.webp`. Playback now uses six independent 512-square images in `public/assets/club-mascots/victory-frames/` to prevent neighboring poses from appearing at frame edges.

Generation prompt:

> Transparent animation sprite sheet of both children in reference image 1 celebrating a friend's victory at a Japanese board-game club. Preserve the little boy's recognizable round smiling face, tousled short black hair, vermilion red vest, cream-and-red hexagon-pattern kimono, white flower fastenings and red tassels. Preserve the older girl's straight black bob and bangs, white floral vest and bright red floral kimono, with joyful expressions like the reference. Warm semi-realistic illustrated Japanese late-1990s PC management-game character art with natural recognizable faces and softly painted clothes. Exact three-column by two-row grid; each of six cells contains both complete figures, boy on left, girl on right and about 25 percent taller. Consistent scale, ground baseline and head sizes, transparent margins and full cream tabi and red sandals. Poses: look up smiling with hands excited near chest; clap; laugh with both arms raised in banzai; meet inside hands in one joyful high-five; clap again laughing; wave warmly to the viewer. Two arms per child, believable hands. No purse, shopping bags, paper strips, money, trophies, text, panels, floor, room, extra people or confetti. Genuine alpha-zero transparent background. 1536 by 1024 pixels, 512-square cells.

## Verification

All 171 frontend tests pass. New checks cover confirmed-result gating, ties, viewer-specific wording, escaped names, exact timing, priority over queued animations, duplicates, static history, Motion Off, cancellation and unchanged game data. Production build passes. Browser checks used `/validation/victory/index.html` with the production room and character renderer, inspecting a personal win and a tied win with Motion Off. The fixture does not create a game or change balances. This does not certify a new complete multiplayer playtest. No deployment or publication was performed.

## Frame-edge correction

The original high-five extended into the next atlas cell, leaving part of a hand and sandal visible along the following clapping frame's left edge. Playback now selects individual images rather than sampling a shared atlas. The clapping image excludes the neighboring pose's spill, while the high-five was corrected with the built-in image-generation tool and saved as `public/assets/club-mascots/victory-frames/pose-3.webp`. The original remains intact for provenance. Frames preload once to keep pose changes from flashing.

Correction prompt: Preserve the existing lower-left high-five's identities, expressions, red costumes, illustration style and relative height. Produce only that complete pair in one transparent square: boy left, girl right, inside hands meeting in one high-five and outside arms spread. Recompose to fit all hands, elbows, sleeves, feet and sandals within the square with transparent margins. No neighboring figures, extra poses, grid, text, floor or background. Both full bodies remain visible.

All five targeted celebration tests pass, including a regression check that each pose references an existing independent image with no atlas positioning. Production build and whitespace checks pass. The corrected high-five was inspected in the actual browser preview; the following clapping frame was inspected separately and contains no stray hand or sandal.
