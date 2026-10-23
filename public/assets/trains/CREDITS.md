# Historical locomotive illustrations

Created with the built-in OpenAI image generation tool for this project, from the user-approved engraving concepts and user-supplied locomotive photographs.

- `iyo-no1-*`: Iyo Railway No. 1; original photograph supplied by the user in this conversation.
- `8620-58685-*`: Class 8620, No. 58685; original photograph supplied by the user (visible original watermark: 旅客機と国鉄車両画像のページ).
- `c58-333-*`: Class C58, No. C58 333; original photograph supplied by the user. A matching photograph previously located on Wikimedia Commons is attributed to Rsa, with CC BY-SA 3.0/GFDL terms: https://commons.wikimedia.org/wiki/File:JNR_C58_333.jpg . Do not infer that the supplied upload has a different licence.

Photographs were provided for the requested adaptation. Their independent publication rights have not been established for all three inputs. Preserve these credits and confirm source permissions/licence obligations before distributing the derived assets publicly. This local implementation does not deploy or publish them.

These are artistic interpretations, not engineering drawings. Historical numbers are visual identities, separate from game instance IDs and stop capacities. The 2/3/4 mapping is an artistic game convention.

Full-resolution transparent masters, prompts, user references, and approved concepts are retained in `docs/koenji/train-wizard-redesign/`. Production prompts are in `production/prompts.json`; `production/exports.json` records sizes and dimensions. Runtime files are WebP derivatives at two resolutions with genuine alpha transparency. Full-resolution approved concept cards remain unchanged.


## Additional tiers (5, 6 and D)

- `c11-*`: original Class C11-inspired tank-locomotive interpretation for the 5-train.
- `d51-*`: original Class D51-inspired tender-locomotive interpretation for the 6-train.
- `df50-*`: original Class DF50-inspired diesel-electric interpretation for the D-train.

These were generated with built-in image_gen using the existing approved engraving as the style reference, without adding third-party photographs. Their class identities are artistic inspiration, not claims of literal game-tier history. Prompts, correction and transparent masters are in the production directory.

Museum reference for the DF50's Shikoku connection: https://s-trp.jp/guidence1.html . That page was consulted for historical context; its photographs were not used as generation inputs.

`newspaper-station.webp`: text-free station engraving derived with built-in image_gen from the approved fictional newspaper concept. Transparent train masters were not changed. The runtime scene has no UI labels or newspaper headlines. Source-concept and supplied-reference publication notes above still apply.
