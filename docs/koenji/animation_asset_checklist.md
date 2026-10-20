# Animation preparation checklist

Prepared: 17 October 2026. Status: proposed art inventory for the owner to prepare, not an expansion of implemented features or a requirement to finish every optional animation before integration.

References: [current paper-doll preview](koma_paper_doll_preview.html), [integration plan](paper_doll_integration_plan.md), [pose/prompt guide](koma_pose_prompts.md), and [confirmed onboarding decisions](gathering_onboarding_and_game_sequence.md).

## 1. Prepare a reusable vocabulary

An animation is a short recipe of held poses, expressions, and props. The same offer/receive poses can support shares, trains, cash, private companies, and membership cards. Do not make a complete new drawing for every game action, company, player count, or seat.

The current prototype has **five expressions and eight body poses**. Keep their IDs stable. The highest-value additions are **wave, bow, triumph, offer, receive, and place**. Counting money and closing the ledger are useful refinements after those.

### Head/expression inventory — per face

| ID | Already in preview? | Visual direction | Uses |
|---|---|---|---|
| `neutral` | Yes | Calm listening face; relaxed mouth. | Rest, waiting, observation, static reduced-motion state. |
| `smile` | Yes | Warm sociable smile. | Greeting, tea, accepted purchases, congratulations. |
| `calculating` | Yes | Brows drawn in, eyes slightly downward. | Local planning, ledger inspection, reviewing an offer. |
| `declare` | Yes | Mouth open in a confident announcement. | Confirmed bid, purchase, track action, host announcement. |
| `shock` | Yes | Raised brows, wide eyes, comedic open mouth. | Occasional verified outbid or adverse outcome. Keep it brief. |
| `concerned` | Add next | Furrowed brows, smaller tense mouth; subtler than shock. | Emergency funding, obsolete trains, difficult financial decisions. |
| `disappointed` | Add next | Small rueful expression; preserve the friendly club tone. | Lost concession, bankruptcy/end-of-game loss, optional setback reaction. |
| `laugh` | Optional later | Eyes creased, open cheerful grin. | Explicit social celebration; smile is an adequate first fallback. |
| Blink overlay | Optional later | Open/closed eye variants that preserve glasses. | Occasional idle detail. Do not build a continuous talking rig. |

No additional satisfied expression is essential: reuse `smile`. The existing `declare` face can handle a short speaking pose; optional voice/lip synchronization is outside this preparation pass.

### Body/foreground inventory — per outfit

The outfit owns the torso and sleeves. Exposed hands derive their skin/stroke palette from the selected face. Where arms overlap the chin or beard, put them in the foreground layer.

| ID | Status | Static pose to prepare | Reuse |
|---|---|---|---|
| `idle` | Existing P1 | Seated, hands resting near table. | Default and final hold for most clips. |
| `tea` | Existing P2 | Both hands holding a cup at chest height. | Social idle, kitchen arrival, occasional toast. |
| `thinking` | Existing P3 | One hand at chin, other arm resting/folded. | Planning and observation. |
| `ledger` | Existing P4 | Open ledger with a finger marking a line. | Financial review, route claim, negotiation. |
| `point` | Existing P5 | Short, confident point toward the table. | Declaration before a confirmed action. |
| `certificate` | Existing P6 | Hold a card visibly beside the head/chest. | Shares, private companies, train cards, presidency card. Make the card replaceable. |
| `token` | Existing P7 | Hand pinching a small object above the table. | Holding a tile OR station token; these must be independently replaceable props. |
| `shock` | Existing P8 | Recoil, raised open hands. | Brief setback reaction. |
| `wave` | Add first | Open palm beside the face, with four separated fingers, a distinct thumb, and a visible wrist; other hand relaxed. Keep the silhouette readable at portrait size. | Guest/resident greeting and acknowledging a newcomer. |
| `bow` | Add first | Small forward upper-body/head inclination; hands together or resting. | Entering the house, thanks, end-of-evening courtesy. All three layers need compatible offsets. |
| `triumphant` | Add first | Modest fist lifted near chest or pleased upright posture. | Auction win, corporation milestone, final winner. Distinct from pointing. |
| `offer` | Add first | Forearm extended with an open hand or held item toward the table. | Offering a certificate, train, cash, or membership card. |
| `receive` | Add first | Hand extended to accept an item, then held near chest. | The other half of every transfer. |
| `place` | Add first | Hand reaching downward, with an optional held object. | Track tile, station token, hanko stamp, setting down a card/cup. Keep fingers and object separable. |
| `count` | Useful second pass | One hand holding a small stack/envelope, the other sorting/tapping. | Cash payment, dividends, emergency contribution, treasury bookkeeping. `ledger` is an initial fallback. |
| `close_ledger` | Useful second pass | Hands on a closed ledger, composed resting posture. | Withhold, endgame, quiet conclusion. Closed-ledger prop plus idle can stand in initially. |

For offer/receive/place, prepare **object in hand** and **empty hand after transfer** states. These can be shared foreground groups rather than full duplicate torsos. An optional intermediate grip is useful, but no in-between frames are required.

## 2. Props to separate from the body

| Prop | Preparation notes |
|---|---|
| Share certificate | Blank face with a clear text/seal area. Company, 10%/20%, and president mark come from the app. Do not bake IR/20% into every frame. |
| Private-company certificate | Reuse card geometry with a different border/icon. Company name comes from accepted state. |
| Train card | Replaceable face/label for the actual train. The same prop can be offered, received, discarded, or exchanged. |
| Track hex | Separate from the station token. The app can render the actual tile/rotation or a generic unlabelled decorative tile. Avoid a permanently baked track layout that contradicts the move. |
| Station token | Small replaceable round company marker. |
| Money stack/envelope | Generic decorative cash with an app-controlled amount label outside the art. Reuse for personal and corporate payments; the UI must still distinguish their funds. |
| Open/closed ledger | Registration-compatible pair. Keep any figures generic or app-rendered. |
| Tea cup | Existing prop; prepare a raised and set-down position. One or two held steam shapes are optional. |
| Hanko and membership card | Stamp raised, stamp contacting card, finished imprint. Keep stamp/card/text separate; one stamp per gathering remains the rule. |
| Obsolete/rusted marker | Optional train-card overlay, revealed only when the engine reports the corresponding effect. No need for a full train collapsing animation. |

If multiple participants interact, reuse the actor and recipient poses with scene-appropriate offsets. Full alternate left/right views are optional later. Do not mirror an entire SVG containing text; flip geometry while keeping labels readable.

## 3. Event sequence list

Each arrow below is an abrupt cut to another held frame. Suggested short sequences use 2–4 cuts, roughly 500–900ms per hold, and return to idle. Existing longer prototype holds can remain editable. These are presentation recipes, not extra game actions.

### House and club sequences

| Sequence | Suggested held frames | New material |
|---|---|---|
| **Guest first arrival** | Door closed → door ajar/person partially visible → smile/wave → bow/settle. | Door positions, wave, bow. Waist-up cuts are sufficient; no walking cycle or legs required. |
| **Yumiko from kitchen** | Kitchen origin → tea cup/smile → wave or small bow → settle. | Kitchen reference/composition later; reuse tea and greeting poses. |
| **Owner from downstairs bedroom** | Bedroom origin → neutral person at opening → smile/wave or bow → settle. | Bedroom reference/composition later; reuse greeting poses. |
| **Seated greeting** | Idle → smile + small wave → idle. | Reuse wave. Optional and brief; not every person must react to every arrival. |
| **Host opens the game** | Host with ledger → declare → open ledger/point → seated focus. | Ledger closed/open if desired. The host role comes from app identity. |
| **Membership stamp** | Present card → stamp raised → stamp contacts card → completed mark/smile. | Hanko/card props and place pose. Trigger after the stamp is accepted. |
| **Note / explicit toast** | Smile/tea raised → brief hold → idle. | Existing art. A routine note can use author-only feedback; group toasts should be occasional. |
| **Evening farewell** | Smile → small bow → idle/end card. | Reuse bow. Optional; no new departure feature is implied. |

A reconnect uses the confirmed quiet returned notice, **not another entry sequence**. One shared person sequence can appear against the three different origin scenes. Resident room layouts should wait for references.

### Auction and financial sequences

| Sequence | Suggested held frames | Important distinction |
|---|---|---|
| **Bid submitted** | Ledger/calculating → point/declare → idle. | A bid is not a win; do not award a certificate yet. |
| **Outbid reaction** | Neutral → shock OR concerned → thinking/idle. | Only the actual affected contender, when established by authoritative facts. |
| **Private awarded** | Receive card → present certificate → smile/triumph → idle. | Include cascade winners when reported, not just the player who submitted the last command. |
| **Share purchase** | Declare → receive/present certificate → smile → idle. | Actual company/percentage; same art for ordinary purchases and president certificates. |
| **Corporation floats** | Present certificate → modest triumph → short optional table acknowledgement. | Separate milestone from setting par/buying a president's certificate. Not every purchase floats a corporation. |
| **Share sale** | Present/offer certificate → receive/count cash → ledger/idle. | Actual seller and block percentage; secondary reactions are optional. |
| **Presidency changes** | Old holder offers marked card → new holder receives/presents → idle. | Only if the accepted state reports a presidency change. Do not infer it from a sale animation. |
| **Private exchange (DR)** | Offer private certificate → receive share certificate → smile/idle. | Existing card and transfer poses; no dedicated new body drawing. |
| **Negotiation offered** | Offer gesture → recipient studies ledger → idle. | A proposal does not transfer money or assets. |
| **Negotiated purchase completes** | Seller offers asset → buyer receives → cash/ledger settlement → idle. | Transfer only after the purchase is accepted. Same recipe for private companies and corporate trains. |
| **Pass / end stock turn** | Small open-hand gesture → idle. | Very short or static feedback. No separate elaborate animation needed. |

### Railway operation and endgame sequences

| Sequence | Suggested held frames | Reusable art / condition |
|---|---|---|
| **Track laid/upgraded** | Point → hold tile → place tile → smile/idle. | Token grip + place, with the actual tile prop. Local planning can use thinking without broadcasting unsubmitted choices. |
| **Station placed** | Hold station token → place → idle. | Same hands, separate token prop. |
| **Routes committed** | Point to map → check ledger → satisfied smile/idle. | Existing point/ledger/smile. No moving train is necessary for the first version. |
| **Dividend paid** | Count cash → offer payment → recipient acknowledgement/receive → idle. | Count/offer/receive; skip repetitive full-table sequences for every tiny payout. |
| **Revenue withheld** | Check ledger → put cash aside/close ledger → idle. | Clear alternative to distributing money. A closed-ledger prop can suffice. |
| **Train bought** | Review ledger → offer payment → receive train card → smile/idle. | Transfer poses + train prop. |
| **Diesel trade-in** | Offer old train card → receive new train card → smile/idle. | Reuse transfer; app supplies old/new train labels. |
| **Phase / train obsolescence** | Shared phase card → old train card with reported marker → concerned/neutral → idle. | Reuse one transition card and optional train overlay. Effects must match the engine. |
| **Mandatory train discard** | Hold train card → offer/remove it → empty hand → idle. | No new body pose; keep the mandatory controls usable throughout. |
| **Emergency funding** | Concerned/ledger → count/offer personal cash or sell certificate → settle. | Reuse sale/payment art. Distinguish personal contribution from treasury cash. |
| **ER/MF special action** | Brief decision posture → existing track/port placement or pass gesture. | Reuse operation art; the special-action owner may differ from the operating president. |
| **Bankruptcy** | Concerned/disappointed → close ledger → composed idle. | Brief, respectful conclusion; avoid making all other players celebrate it. |
| **Bank exhaustion / match ending** | Check ledger → close ledger → shared end card. | No need for dramatic physical collapse of the bank. |
| **Final results** | Winner smiles/triumphs → others smile/neutral → optional tea/bow. | Winner and ties from actual results; keep scoreboard figures readable. |

## 4. Shared scene/UI animation assets

- **One round/room transition design:** two or three held scene/title cards reused for auction, stock, operations, and results. Titles are rendered by the app.
- **Turn lantern:** two discrete emphasis states or a direct jump to the next member. No perpetual smooth pulse.
- **Action props:** certificate appearing in hand, stamp imprint, tile/token landing, cash transfer. These can be cut-on/cut-off states, not flight paths.
- **Arrival backgrounds:** front door first; kitchen and downstairs bedroom when reference images are available. Reuse character art across them.

Loading, errors, offline status, history mode, and the quiet returned notice can remain static UI. Rejected moves must not play success/declaration aftermath. Neither rewind nor every round transition needs its own new character pose.

## 5. Production order and delivery format

1. Finish the existing five head expressions and eight poses on **one face and one outfit**, especially thinking/chin, tea, certificate, and shock overlaps.
2. Add wave, bow, triumph, offer, receive, and place; prove them with one guest entry, one stock purchase, one tile placement, and one stamp sequence.
3. Apply the approved geometry to the other faces/outfits. Add concerned/disappointed expressions. Keep hand coloring parameterized.
4. Add count/closed-ledger refinements, richer reactions, and optional social details only after the core set is usable.

With five faces, the proposed seven core expressions mean **35 head/expression variants**. Eight existing + six new body poses across four outfits mean **56 posed outfit definitions**, each assembled from back and foreground components. Count and close-ledger add another eight definitions if desired. These are reusable definitions, not 35 × 56 complete animation files; procedural SVG and shared hands/props can reduce the amount of unique drawing further.

For each pose/expression/prop:

- Use the common 200×240 coordinate space and collar anchor near (100,92); keep the same canvas and registration across frames.
- Preserve torso → head → foreground hands/props ordering. Supply torso and foreground pieces separately when they overlap the face.
- Use transparent assets if exporting raster layers. Dark preview backgrounds belong to the workbench, not the cutouts.
- Keep character identity, clothing, pose, expression, and prop independently selectable. Keep text out of baked artwork where the game changes it.
- Supply a small manifest or workbench entry identifying the stable ID, component layers, anchor/offset overrides if any, and suggested hold duration in milliseconds.
- Preview at table size and at the smallest portrait size; facial distinctions and fingers/props should remain recognizable without hiding game figures.
- For Motion Off/reduced motion, choose one readable static frame per sequence. No rapid cuts, flashes, tweening, or in-between frames are needed.

The app can provide fallback poses while additional art is prepared. Preparing the entire optional list is not a prerequisite for beginning integration.

## 6. Additional 1889 rule consequences worth showing

Rules review, 17 October 2026: these additions were checked against the local [Japanese rulebook](../../daemon18xx/docs/rules1889.pdf), [rulebook audit](../../daemon18xx/docs/1889_RULEBOOK_AUDIT.md), and current [engine](../../daemon18xx/app/engine1889/engine.py)/[phase data](../../daemon18xx/app/engine1889/data.py). They expand the presentation inventory, not the rules or animation implementation.

Many important events are consequences of an accepted move rather than separate player actions. Prefer small board/card/cash cues for these, reusing the character poses above.

| Additional cue | Trigger and proposed held-frame treatment | Art to prepare / rule reference |
|---|---|---|
| **Auction escrow and settlement** | Bid money moves to a labelled reserved envelope; at actual settlement, the winner pays and unused commitments return to their owners. Do not imply money is refunded immediately when a bidder passes. | Reserved envelope, payment, refund states; reuse count/offer/receive. §5.7. |
| **Auction price reduction** | When the first private TR remains unsold through an all-pass cycle, its displayed price cuts down by ¥5; the zero-price award uses the actual recipient. If TR is already sold, all-pass can instead cause private income. | Replaceable price tag and optional free/awarded seal. Disambiguate private TR from the public corporation TR. §5.7. |
| **Automatic award cascade / runoff begins** | One accepted auction action can award several later privates or open a runoff. Cut a short series of certificates to the correct owners, then emphasize only eligible runoff bidders. | Existing card handoffs plus a shared runoff marker. §5.7. |
| **Priority Deal handoff** | Cut the priority card from its old holder to its new holder at the appropriate auction/stock boundary. Keep it separate from the current-turn lantern and president certificate. | Priority card with two held positions. §§5.2,5.7. |
| **Stock-marker movement and stacking** | Show before/after market positions for a sale block, payout, withhold, and the sold-out rise at stock-round end. If several markers share a cell, show the arriving marker's stack position. Use the authoritative market path/boundaries; a 30% sale need not physically move three cells if the marker hits the bottom. | Reusable company markers, origin outline, destination emphasis; no new body art. §§5.2.3,5.8. |
| **Market-color / limit changes** | A marker entering or leaving yellow/orange can change certificate or ownership exemptions. Briefly emphasize the changed limit badge and any correction the player must make. | Two colored badge states. The standard market here has yellow/orange, not a brown-market multi-buy zone. §§5.1,5.4. |
| **Flotation funding and free home station** | At 50% IPO sales, show bank → corporate treasury funding once. At the first operating-round start, show the free home marker appearing. These are distinct moments from the first president-certificate purchase and from a paid extra station. | Company charter/treasury envelope and home marker. Corporate capital is 10×par; do not put it into the president's personal wallet. §§5.6.4,7.1. |
| **Private-company income** | At operating-round start, show short payment cues to each current private owner: player wallet or corporate treasury. This also supports private-only auction income cycles. | Reuse cash/envelope art with two recipient types. §§4.1.2,5.7,11.3. |
| **Private closure and UTF exception** | On the first 5-train, closed privates receive a closed seal. Player-owned UTF stays open, increases income to ¥50, and cannot subsequently be sold to a corporation. Corporate-owned UTF closes. | Closed seal and an updated revenue badge; no extra facial set. §§4.2.4,11.4,15.2 and phase data. |
| **Construction restriction lifted** | If player-owned private TR/ER changes to corporate ownership or closes, its map-blocking badge disappears. Do not change the tile merely because the restriction ended. | Small lock/block marker with present/removed states. §15.1. |
| **MF port / ER interrupt / SMR saving** | MF: port tile appears and its one-use power marker turns used, without closing the private. ER: emphasize the seller's immediate optional lay/pass, then restore the original actor; using the ability does not close ER. SMR: show an applicable mountain-cost saving without consuming the repeatable power. | Port/ferry icon, used-ability badge, temporary actor marker, cost-saved seal. Reuse tile/point/place art. §15.2; ER optionality follows the project's recorded edition decision. |
| **A train purchase's effect chain** | Purchase → phase notice → actual rust/private closures/changed limits → any mandatory discard decisions. Keep each effect readable without delaying the live state or controls. | One shared phase card and state-derived affected-card highlights. §§4.2,10. |
| **Train limit / rust / depot changes** | Distinguish rusted cards from non-rusted trains returned to the depot by mandatory discard or trade-in. Newly available train types get a brief availability marker. | Different rusted/returned/available overlays. Limits: 4→3 at Phase 4; 3→2 at Phase 5. Rusts: 2-trains on first 4; 3-trains on first 6; 4-trains on first Diesel. Diesel availability begins with the first 6. §§4.2,10.2–10.5. |
| **Operating order changes** | Cut the company-order strip into its actual new order, with the operating-company marker emphasized. A person's multiple presidencies must remain distinguishable from their single player identity. | Shared company markers and operating-order ribbon; no character relocation required. §§4.1.2,5.8. |
| **Route claim revised before payment** | If a permitted ER/MF lay changes an unpaid route's value/connectivity, emphasize the revised route/amount and use ledger/calculating. Paid revenue stays final; never replay a payout because a later route graphic changed. | Existing route outline and ledger; small revised-value badge. §8.3 and the audited private-ability interactions. |
| **Dividend recipients** | Player-held shares pay players; bank-pool shares pay the operating treasury; unsold IPO shares do not pay the president. Show the actual recipients, and a separate market-marker move. | Cash cue directed to wallet, treasury, or no recipient; reuse props. §9.1. |
| **Bank exhaustion warning** | Show an end-of-game notice when the bank is exhausted, then keep it pending until the required operating set finishes. Money flowing back into the bank must not erase that warning. Bankruptcy has a separate immediate ending. | Persistent end-pending card plus final end card. §12. |

For the train-purchase chain, 2–4 concise effect panels are preferable to replaying every participant's full reaction. The same accepted move can affect several companies at once; target the actual affected cards/members. Mandatory decisions remain usable throughout.

### Highest-value additions from this rules review

Prepare these first if extending the art now:

1. A reusable **cash reservation/payment/refund envelope**.
2. **Closed / ability-used / rusted / returned** overlays with clearly different meanings.
3. **Priority Deal and operating-company markers**.
4. **Stock-market before/after emphasis** and marker stack positions.
5. A **company charter/treasury** and **free home-station** cue.
6. **Phase-change and bank-end-pending cards** with replaceable text.

These additions need very little new character drawing. The core wave/bow/offer/receive/place/count vocabulary remains sufficient for most 1889 events.
