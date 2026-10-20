# Koenji 1889 — Inverted Paper-Doll & コマ送り (Koma-okuri) Pose & Prompt Guide

## 1. Architecture Overview: Inverted Paper-Doll Layering

To allow players to freely mix and match **Faces** and **Meiji-Era Clothes** without sleeve-clipping or arm-deformation jank across poses, the sprite system in [`src/scene/Character.js`](../../src/scene/Character.js) uses an **Inverted Paper-Doll** stack:

1. **Layer 1 (Back) — Posed Outfit Body (`clothes` × `pose`):**
   - Owns the torso, collar, sleeves, hands, and held props (teacup, pocket ledger, 1889 share certificate, brass station token/hex tile).
   - Because the outfit owns the sleeves and arms, an **Indigo Haori** (`indigo-haori`) or **Plum Kimono** (`plum-kimono`) naturally displays wide draping *tamoto* sleeves when raised, while a **Charcoal Meiji Suit** (`charcoal-suit`) displays tailored wool sleeves and shirt cuffs.
   - Features a standardized empty collar registration point at `(x: 100, y: 92)` in the `200×240` character coordinate space.
2. **Layer 2 (Middle) — Player Head & Expression (`face` × `expression`):**
   - Generated from the player's base reference photo, cropped cleanly at the base of the bare neck with no shirt collar or modern accessories.
   - Uses 5 discrete facial expressions (`face_neutral`, `face_warm_smile`, `face_calculating`, `face_declare`, `face_shock`) locked to the same 15° three-quarter angle and upper-left warm brass-lamp lighting.
3. **Layer 3 (Front) — Foreground Hand / Prop Overlay (for Chin-Overlap Poses):**
   - For poses where a hand reaches up in front of the chin or lower face (`body_thinking`, `body_tea`), the raised forearm/hand sits in a foreground layer (`z-index: 3`) in front of the head layer so fingers naturally overlap the chin/beard without clipping.

---

## 2. Multi-Stage コマ送り Trigger Sequences Across Screens

All animations use `steps(1, end)` (zero interpolation, zero tweening, abrupt frame cuts at ~1.5–2.5 FPS) across both the **Main Club Table** (`ClubRoom.js`, waist-up crop) and the **Map & Stock Exchange Mini-Portraits** (`HexMap1889.js` and `StockExchange.js`, chest-and-head crop):

| Sequence / Event Trigger | Stage 1: Contemplation / Staging | Stage 2: Action Execution (Rapid Cuts) | Stage 3: Aftermath & Table Reactions |
|---|---|---|---|
| **Stock Purchase / Par Float** (`buy_shares`) | Active player alternates `body_idle + face_neutral` ↔ `body_thinking + face_calculating` (900ms steps) while inspecting corporations or Par prices. | **Cut A (0–450ms):** `body_point + face_declare`<br>**Cut B (450–1250ms):** `body_certificate + face_declare` | **Actor (1200ms):** `body_triumphant + face_warm_smile`<br>**Other Players:** `body_idle + face_warm_smile` |
| **Stock Dump / Block Sale** (`sell_shares`, `emergency_sell`) | Seller holds `body_ledger + face_calculating` while choosing `10%–50%` block size. | **Cut A (0–450ms):** `body_point + face_declare`<br>**Cut B (450–1250ms):** `body_certificate + face_calculating` | **Seller:** `body_thinking + face_calculating`<br>**Affected President / Shareholders:** `body_shock + face_shock` |
| **Private Auction Bid / Runoff** (`bid`, `buy_private`) | Active bidder holds `body_ledger + face_calculating` while adjusting `±¥5` bid stepper. | **Cut A (0–450ms):** `body_point + face_declare`<br>**Cut B (450–1250ms):** `body_certificate + face_declare` | **High Bidder:** `body_triumphant + face_warm_smile`<br>**Outbid Contender:** `body_shock + face_shock` |
| **Operating Track / Token / Train** (`lay_tile`, `place_token`, `buy_train`) | Operating president holds `body_thinking + face_calculating` while selecting a hex; switches to `body_ledger + face_calculating` when rotating a candidate tile. | **Cut A (0–450ms):** `body_point + face_declare`<br>**Cut B (450–1250ms):** `body_token_tile + face_declare` | **President:** `body_triumphant + face_warm_smile`<br>**Blocked Opponent (if city slot taken):** `body_shock + face_shock` |
| **Table Note / Hanko Stamp / Dividend Payout** | Idle table loop (`body_idle` ↔ `body_tea` every 4.5s). | **Cut A (0–800ms):** `body_tea + face_warm_smile` (or `body_triumphant` for hanko stamp) | All seated players cut to `body_tea + face_warm_smile` for a brief clubroom toast. |

---

## 3. Set A Prompts: 5 Facial Expression Head Layers (Per Person)

Use these prompts with the person's reference photo attached as the image reference.

### E1. `face_neutral` (Default Seated Idle)
```text
Transform the person in the reference photo into a stylized 2D head-and-neck-only character sprite layer (E1: Neutral Idle expression) in the style of late-1990s Japanese historical strategy games and warm painterly visual novels. Preserve their exact facial likeness, hair/head shape, skin tone, glasses (if any), and facial hair. Remove any modern accessories (headphones, lanyards) and remove all clothing/shirt collars, cropping cleanly at the base of the bare neck so the head can be layered onto different outfits. Slight 15-degree 3/4 front angle facing right-center, calm friendly half-smile, looking forward, warm amber brass-lamp key lighting from upper left, crisp dark-brown ink linework, rich cel-and-painterly shading, centered on a solid flat dark-slate background (#1a1612), no text.
```

### E2. `face_warm_smile` (Tea / Chat / Arrival / Dividend Toast)
```text
Transform the person in the reference photo into a stylized 2D head-and-neck-only character sprite layer (E2: Warm Sociable Smile expression) in the style of late-1990s Japanese historical strategy games and warm painterly visual novels. Preserve their exact facial likeness, hair/head shape, skin tone, glasses, and facial hair. Remove all clothing/shirt collars and modern accessories, cropping cleanly at the base of the bare neck. Slight 15-degree 3/4 front angle, warm crinkly-eyed sociable smile with mouth slightly open in friendly clubroom conversation, warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, centered on a solid flat dark-slate background (#1a1612), no text.
```

### E3. `face_calculating` (Stage 1: Strategic Contemplation / Inspecting Map & Ledger)
```text
Transform the person in the reference photo into a stylized 2D head-and-neck-only character sprite layer (E3: Calculating Strategic Concentration expression) in the style of late-1990s Japanese historical strategy games and warm painterly visual novels. Preserve their exact facial likeness, hair/head shape, skin tone, glasses, and facial hair. Remove all clothing/shirt collars and modern accessories, cropping cleanly at the base of the bare neck. Slight 15-degree 3/4 front angle, shrewd analytical concentration, eyebrows drawn together, eyes glancing slightly downward as if studying a railway board and stock ledger, lips pressed in deep thought, subtle glint on glasses lenses, warm amber key lighting from upper left, crisp dark-brown ink linework, centered on a solid flat dark-slate background (#1a1612), no text.
```

### E4. `face_declare` (Stage 2: Bold コマ送り Action Announcement)
```text
Transform the person in the reference photo into a stylized 2D head-and-neck-only character sprite layer (E4: Bold コマ送り Action Declaration expression) in the style of late-1990s Japanese historical strategy games and warm painterly visual novels. Preserve their exact facial likeness, hair/head shape, skin tone, glasses, and facial hair. Remove all clothing/shirt collars and modern accessories, cropping cleanly at the base of the bare neck. Slight 15-degree 3/4 front angle, bold dramatic announcement expression, mouth open mid-declaration as if calling out a stock purchase or railway bid, confident raised eyebrows, intense energetic eyes, warm amber key lighting from upper left, crisp dark-brown ink linework, centered on a solid flat dark-slate background (#1a1612), no text.
```

### E5. `face_shock` (Stage 3: Comedic コマ送り Shock / Outbid / Stock Dumped)
```text
Transform the person in the reference photo into a stylized 2D head-and-neck-only character sprite layer (E5: Comedic コマ送り Shock/Recoil expression) in the style of late-1990s Japanese historical strategy games and warm painterly visual novels. Preserve their exact facial likeness, hair/head shape, skin tone, glasses, and facial hair. Remove all clothing/shirt collars and modern accessories, cropping cleanly at the base of the bare neck. Slight 15-degree 3/4 front angle, exaggerated comedic Japanese stop-motion shock expression, wide startled eyes, eyebrows raised high, mouth open in stunned 'eh?!' disbelief as if outbid or having railroad stock dumped on them, warm amber key lighting from upper left, crisp dark-brown ink linework, centered on a solid flat dark-slate background (#1a1612), no text.
```

---

## 4. Set B Prompts: 8 Headless Posed Meiji Outfit Layers (Per Outfit)

Substitute `[OUTFIT DESCRIPTION]` with any of the 4 catalog outfits in [`src/data/appearance.json`](../../src/data/appearance.json):
- **`indigo-haori`:** `traditional deep indigo woven haori jacket worn over a cream-colored kimono inner collar with braided silk haori himo cord tied across the chest`
- **`plum-kimono`:** `rich plum-burgundy silk Meiji kimono with subtle woven geometric pattern over a warm cream juban inner collar and dark brocade obi sash`
- **`moss-hakama`:** `moss-green formal Meiji kimono top with pleated dark slate-green hakama straps and cream inner collar`
- **`charcoal-suit`:** `tailored charcoal-grey Meiji-era wool three-piece suit coat, warm brown waistcoat/vest with brass pocket-watch chain, crisp high starched cream shirt collar and burgundy silk cravat`

### P1. `body_idle` (Calm Seated Neutral)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Seated upright in a carved wooden club armchair, hands resting calmly together near the lower frame edge. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P2. `body_tea` (Holding Ceramic Club Mug / Yunomi)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Seated relaxed, both hands raised to upper-chest height holding a warm ceramic Japanese tea cup (湯呑み) with subtle steam. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P3. `body_thinking` (Stage 1: Hand Raised to Chin Pivot)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 1 Strategic Thinking pose—waist-up seated torso leaning slightly forward, left arm folded across the chest, right forearm and hand raised with index finger and thumb positioned just below the empty collar opening (ready to sit beneath a layered chin). Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P4. `body_ledger` (Stage 1: Inspecting Meiji Pocket Railway Ledger)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 1 Staging/Preview pose—waist-up seated torso, left hand holding open a vintage leather-bound 1889 Shikoku railway ledger at chest height, right index finger tapping a line of figures on the page. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P5. `body_point` (Stage 2, Cut A: Dramatic Pointing Declaration)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 2 Dramatic コマ送り Pointing Declaration pose—waist-up seated torso leaning boldly forward, right arm extended dramatically forward pointing a decisive index finger toward the viewer/table, left hand resting on the lower edge. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P6. `body_certificate` (Stage 2, Cut B: Presenting 1889 Stock Certificate)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 2 Dramatic コマ送り Stock Certificate Reveal pose—waist-up seated torso, one hand raised to shoulder/chest height holding up a vintage ornate cream-and-gold 1889 Japanese railway stock certificate with a red seal, other hand resting confidently on the chest lapel. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P7. `body_token_tile` (Stage 2, Cut B: Holding Hex Track Tile & Brass Token)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 2 Dramatic コマ送り Operating Commit pose—waist-up seated torso, right hand raised to chest/shoulder height pinching a yellow-and-green hexagonal railway track tile and brass station token between thumb and forefinger, ready to place it on the board. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```

### P8. `body_shock` (Stage 3: Comedic コマ送り Recoil / Hands Raised)
```text
2D game paper-doll clothing and body sprite layer ONLY (completely headless, no head, no neck, empty collar opening at the top center for a separate character head layer). Stylized late-1990s Japanese historical strategy game / painterly visual novel illustration. 1889 Meiji-era Japanese railway investor outfit: [OUTFIT DESCRIPTION]. Pose: Stage 3 Comedic コマ送り Shock Recoil pose—waist-up seated torso leaning sharply backward, both hands raised open with spread fingers on either side of the empty collar opening in startled disbelief. Warm amber brass-lamp lighting from upper left, crisp dark-brown ink linework, rich painterly shading, centered on a solid flat dark-slate background (#1a1612), no head, no mannequin, no text.
```
