# Paper-doll application integration

Delivered 17 October 2026. The shared artwork and prepared sequences now run in the application, in addition to the authoring workbench. This supersedes the implementation assumptions in the [original proposal](paper_doll_integration_plan.md).

## What is connected

- Character setup, waiting-room chairs, seated players, auction/exchange/map portraits, conversation portraits, and the arrival dock use `src/scene/Character.js` and the shared `paperDollArt.js` renderer. Seventeen reference portraits retain nine expressions, independent Meiji outfit selections, exact atlas clipping, and the corrected wave hand. Older saved appearance IDs still work.
- Temporary poses target stable server member IDs. Selecting the same face does not make two players share reactions or permissions. A playing or non-playing host remains explicitly identified. Resident entrances retain the host-assigned kitchen/bedroom routes.
- The table spaces its actual 2–6 players evenly. Nameplates sit above the characters instead of covering faces and props. Compact portraits use the named portrait crop without the former additional 150% CSS zoom.
- A separate, reserved event-status area describes the accepted move and allows dismissal. Animation never delays a rule action or covers decision controls.

## Accepted events

| Accepted fact | Character presentation |
|---|---|
| Private auction bid / higher bid | Submit the actual company and bid; react only for the displaced highest bidder. |
| Private awards, including cascades and pass resolution | Receive and display each awarded company's charter on its actual winner, using the recorded price where available. The player who passes is not assumed to be the winner. |
| Share purchase / sale | Present the actual company and percentage; show par, proceeds, and source when available. |
| Corporation float / presidency change | Corporate funding cue; old and new presidents offer/receive the actual company's certificate. Initial par alone does not imply flotation. |
| Tile lay / station placement / route commitment | Reuse the prepared track, token, and route poses for the accepted actor and actual tile, hex, or corporation. Unknown tile colors use a neutral prop. |
| Dividend / withhold | Cash or ledger sequence using the accepted revenue, including zero. |
| Train purchase / negotiated purchase / offer | Actual asset and payment; proposals remain proposals until a transfer is accepted. |
| DR exchange / train discard / emergency share sale / bankruptcy | Corresponding offer/receive, returned-train, funding, or ledger poses. |
| Phase change / train rust / bank exhaustion / final scores | Announce only the reported consequences, target affected presidents, and celebrate actual winners, including ties. A phase change does not imply a train rusted. |
| First arrival / host opens game / membership stamp / new table note | Guest wave/bow, kitchen tea, bedroom bow, opening ledger, stamp, or tea cue. Returns remain quiet notices. |

Workbench example labels are replaced at binding time. Production never inherits the recipes' example IR certificate, ¥80 par, ¥450 payment, or tile #439. Unbound financial props are omitted. Dynamic SVG and notice text is escaped.

`server_bridge.py` adds optional journal facts derived from accepted before/after snapshots: private awards and winners, presidency changes, treasury funding, train price/seller, rusted trains, outbid players, bank-end warning, and final winners. Table notes record the authenticated actor separately from the editable author label; waiting-room seating changes remap that actor along with stamps. Existing journals remain readable; facts missing from old events are omitted instead of invented. No rules-engine change or database migration is required. Restart the Python bridge when deploying the new event projection.

## Playback and lifecycle

- `src/ui/characterPlayback.js` contains the editable held-frame recipes used by the workbench.
- `characterEvents.js` binds those recipes to accepted facts. `characterDirector.js` separates game, arrival, and social delivery; `characterController.js` owns elapsed time, queues, and cancellation.
- Live game delivery deduplicates by room and revision, including action response, polling, and duplicate presentation calls. Initial connection does not replay an old journal. A polling gap considers its missed journal entries but presents at most the latest three; each lane has at most three queued jobs behind its active job.
- One timer schedules the next cut in each active lane. Cuts replace only marked character slots and the event notice. Full app renders read the existing frame clock, so navigation and polling do not restart a sequence. Forms, action buttons, and focused inputs are not replaced by pose timers.
- Arrivals use their existing independent cursor and queue. Arrival presentation takes priority for that member; another player's game reaction can continue. Returned notices do not run a second entrance sequence.
- Manual rewind displays a static accepted pose. Play Replay uses fresh history identities and fits the sequence to the selected timeline speed; Instant uses a static frame. Pause settles the selected move. Return to Live clears historical presentation without replaying missed live moves. Current gathering activity remains independent of historical game inspection.
- Motion Off and system reduced motion stop JavaScript frame cuts as well as CSS motion. The accepted event remains readable with one static pose. Turning motion back on does not replay queued work. Leaving a room cancels its timers; backgrounding the page clears game/social playback rather than building a stale queue.

## Validation

- Full regression run passed: 51 JavaScript tests, 28 application/service tests, and 20 rules-engine tests. A subsequent seat-layout regression adds one JavaScript test, bringing the validated total to **100**. Final JavaScript checks and the targeted 10 character service/event tests were rerun after the final UI and note-identity changes. Production build passed.
- Fake-clock tests cover cut boundaries, duplicate delivery, bounded queues, independent actors, room cancellation, static mode, social baselines, and replay identities. Rendering tests cover all registered portrait/outfit combinations, atlas boundaries and neck registration, every supported pose, and 2/5/6 seated-member identity retention.
- Browser validation used an isolated temporary SQLite database and the real application. It exercised onboarding, two claimed seats and host start, an accepted private purchase, membership stamping, new notes, an unsent focused draft surviving pose cuts, Motion Off, navigation, and five-/six-player tables.
- Two authenticated seats received the same accepted AR purchase sequence on the correct stable member ID, even when their selected faces matched. A rewind showed `AR · 20%` and `PAR ¥65`; explicit replay used a fresh history identity. Hashes of the latest game snapshot and durable action journal were identical before and after replay/navigation.
- Browser visual inspection was at the available 1280×720 viewport. Separate 1366×768, 1440×900, and 1920×1080 visual certification remains outstanding; the structural and renderer checks are not a substitute for that visual matrix or a complete human multiplayer playthrough.

Evidence: [six-player table](validation/paper-doll-six-player-table.png), [five-player table](validation/paper-doll-five-player-table.png), and [accepted certificate during history inspection](validation/paper-doll-accepted-certificate.png).

## Continuing artwork work

Continue refining shared SVG functions, atlas metadata, and recipe hold times in place. The [face workbench](semi_photoreal_face_test.html) and [portrait gallery](reference_head_gallery.html) remain usable. Saved identity is still only `{face, clothes}`; expressions, poses, props, and frame progress remain temporary presentation state.

Kitchen/bedroom interiors can be refined when their reference photographs arrive. The wider [animation inventory](animation_asset_checklist.md) also includes future board, private-ability, market, and train overlays beyond this character integration; those are not all implemented scene effects. Uncommitted route/tile drafts and rejected moves do not trigger accepted-action celebrations. Cross-browser frame-perfect timing is not part of this delivery.
