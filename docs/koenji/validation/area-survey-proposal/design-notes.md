# District Survey — compact revision

The revised proposal is 960 × 640 logical pixels, versus 1320 × 930 previously: 50.0% of the original canvas area. It is recomposed at that size with readable type, rather than scaling the previous layout down. The live game menu is unchanged.

## What earns space

| Information | Reason to show it |
| --- | --- |
| Marugame / I2 | Identifies the selected game location. |
| Small location picture | Aesthetic purpose: recognition and period atmosphere. It supplies no game statistics. |
| Current White city | Establishes the starting point of the upgrade sequence. |
| One station space and SR home reservation | Explains usable station capacity and a right that can block other companies from taking the last position. |
| Terrain cost | Affects the cost of a tile lay. |
| Required color order and phase gates | Explains what can be developed next. |
| Native tile shapes, tile numbers, and finite supply | Distinguishes actual tile choices and their availability. |

Removed: income and route-revenue figures; track-connection and exit metrics; the duplicate neighbourhood atlas; the before/after revenue receipt; the large planning call to action; and repeated descriptions of the same facts. The tile drawings still show their physical geometry because choosing a shape affects later upgrades. They do not show a connection score or route information.

## Upgrade order is a rule, not a suggestion

The example is a White city in Phase 2. It shows:

- White → Yellow: next color, available from Phase 2.
- Yellow → Green: requires a Yellow tile already present **and** Phase 3 or later.
- Green → Brown: requires a Green tile already present **and** Phase 5 or later.

Green and Brown are visibly locked and cannot be selected as the next development in this proposal. Only the Yellow specimens can be inspected. A phase unlock alone never authorizes skipping an earlier color. Pictured future tiles explain the color sequence; they do not imply that every Yellow tile upgrades to every Green specimen. Actual upgrades must preserve existing track and station capacity, match the location, and satisfy the game's remaining placement rules.

A future implementation should derive current color, current phase, station rights, remaining stock, and legal tile choices from the authoritative game projection. This standalone proposal uses a saved example stock snapshot and does not validate or submit game actions.

## Image policy

The picture is deliberately small: a 302 × 136 pixel vignette within the compact inspector. Its only purpose is place identity and atmosphere. The current image is a generated concept, not a historical source or a geographic reconstruction. In particular, a harbor visible in a picture does not confer a game port power, terrain fee, station right, or tile restriction.

See [artwork-replacement.md](artwork-replacement.md) for the asset contract, source metadata, crop controls, and rebuild/export steps for a future period photograph or print. No period-image search has been performed yet.

## Files

- `index.html`: current compact interactive proposal.
- `proposed-area-survey.svg`: 960 × 640 viewBox, exported at 1920 × 1280.
- `proposed-area-survey.png`: 1920 × 1280 render of the compact proposal.
- `artwork.json`: location-art asset and provenance metadata.
- `tile-specimens.json`: native tile drawings and example supply counts.
- `build-proposal.mjs`: reproducible generator for the SVG and HTML.
- `wide-v1/`: previous wide proposal and its original illustration-generation prompt.

## Validation

Visually inspect the proposal at its intended 960 × 640 size. Check that future colors remain locked, that Yellow tile selection changes only the inspection highlight, and that imagery does not introduce additional game facts. Recheck all displayed station and supply values when connecting the design to live state.
