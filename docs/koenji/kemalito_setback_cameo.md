# Kemalito: setback cameo

Added locally on 21 October 2026. Kemalito is Kemonito's mischievous counterpart. He appears beside the affected member, suppresses a giggle, laughs briefly and waves goodbye. His red vest, patterned kimono, white flower fastenings and tassels follow the owner's reference; the paper strip is omitted and simple tabi and sandals complete the full-body sprite.

## Triggers and behavior

- Uses confirmed `rusted_trains[].president`, `presidency_changes[].from`, `outbid_players`, `bankrupt.actor_id`, and `emergency_sell.actor_id`.
- A rust-triggering buyer is not assumed to be the affected player. The previous owner recorded in the accepted event determines the target.
- A compound event gets one 2.64-second cameo, listing the affected members and deduplicated consequences. Ordinary share sales, spending, dividends, passes, route revenues and unclassified price movements do not trigger him.
- Uses the existing deduplicated, bounded character sequence. He and Kemonito occupy separate frames, even when a setback and cash receipt share one transition.
- The giggle is an original procedural three-chuckle sound, not recorded or cloned from the reference child. It follows the existing effects mute and volume controls and starts once at the held laughing pose. Muting, hiding, dismissing or changing rooms stops it. Historical replay is silent.
- Motion Off and held history use a factual static setback summary. All game state settles independently of the mascot, and the overlay does not capture board clicks.

## Artwork provenance and prompt

Generated with the built-in image-generation tool using the owner's supplied photograph as the identity and clothing reference. The source photograph is not copied into application assets. The selected transparent sprite sheet is saved as `public/assets/kemalito/giggle-poses.webp`. Audio is exported as `public/sfx/giggle.wav` alongside the existing procedural effect pack.

Generation prompt:

> Eight-pose animation sprite sheet for Kemalito, a playful giggling little boy mascot in a Japanese railway board-game club. Preserve the reference toddler's recognizable round face, tousled short black hair, happy eyes and smile, young age and natural child proportions. Keep the vermilion red sleeveless ceremonial vest, cream/red hexagonal-pattern kimono, small white flower fastenings and red tassels. Add cream tabi and red sandals; omit the paper strip. Warm semi-realistic illustrated Japanese late-1990s management-game character art, natural face with softly painted costume. Exact four-column by two-row transparent grid, consistent camera, size and baseline, all figures isolated inside their cells. Poses: knowing grin; lean in curiously; one hand suppressing a giggle; shoulders raised while giggling; open laugh with hand at mouth and other on belly; bent-knee laugh; recover with mischievous grin and hands together; cheerful goodbye wave. Two arms, believable hands, no pointing, tears, captions, floor, background or other people. 1536 by 1024 pixels, each cell 384 by 512.

## Validation

All 167 frontend tests pass, including target ownership, ordinary-action exclusions, compound-event deduplication, exact duration, silent history, motion and audio cancellation, independent money sequences and finite three-burst PCM. Production build passes. Browser checks at `/validation/kemalito/index.html` inspected animated outbid targeting in the production room renderer and six-player Motion Off rust targeting. The preview creates no games and changes no balances. No complete multiplayer acceptance game is claimed. No deployment or publication was performed.
