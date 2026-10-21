# Route payoff and tactile feedback implementation plan

Prepared 21 October 2026. Status: proposed implementation, grounded in the current source. No gameplay, audio, or animation changes are implemented by this document.

## 1. Intended experience

Make a completed railway feel like a working railway: the player commits a route plan, hears a short departure whistle, watches a small locomotive trace the actual track, sees each train's earnings resolve, and then decides what to do with that revenue. Track, stations, certificates, and payments should have their own restrained physical feedback.

The central design principle is **action → physical response → readable consequence**. Preserve the illustrated Meiji board, analytical windows, and deliberate 18xx pace. Use paper, ink, wood, metal, and steam as the sensory vocabulary. The payoff should come from seeing the network work and understanding its result.

Recommended first release: one strong route sequence plus distinctive track, station, train-purchase, payout, and withhold cues. Build richer stock and auction feedback afterward. Avoid making a large character-art expansion a prerequisite.

## 2. What already exists

The outside evaluation describes some gaps that have since narrowed. This is a refinement of an existing presentation system.

| Area | Verified current implementation | Remaining work |
|---|---|---|
| Music | `src/ui/gameAudio.js` has buffered music stems, round/crisis presets, fades, gesture unlocking, and hidden-tab handling. | Mix effects against music; add temporary ducking for prominent cues. |
| Sound effects | `GameEffects` has independent mute/volume, event deduplication, and synthesized turn/action/flotation/train tones. | Replace generic event beeps with recognizable material sounds; manage overlapping voices and cancellation. |
| Route planning | `src/ui/routePlanning.js` supports editable per-train routes, server quotes, and committing the chosen plan. | Add payoff after acceptance; keep planning and execution visibly distinct. |
| Route drawing | `HexMap1889.js` draws colored ribbons, train identification, and stop-value pills. The ribbon is a polyline through hex centers. | Share actual track geometry with a moving locomotive; preserve stop identity within a hex. |
| Characters | `characterEvents.js`, `characterDirector.js`, and `characterController.js` bind accepted facts to held poses, bounded playback, and history behavior. | Coordinate timing with route and financial effects without creating a second reaction sequence. |
| Cash receipts | Accepted positive cash deltas produce helper handoffs, with purse/treasury destinations. Dividend events also contain `dividend_allocation`. | Connect receipt emphasis and settlement sound to those existing facts. |
| Preferences | `preferences.js` already exposes music, effects, effects volume, and Motion On/Off. System reduced motion is also observed. | Add route playback speed and a sound-preview control; apply preferences to every new effect. |
| Delivery safety | Action responses and polling share revision-based event presentation; historical inspection is separate. | Centralize audiovisual delivery, preserve deduplication, and handle render replacement and interruptions. |

These observations come from source inspection and the retained [21 October playtest report](../../validation/playtest-20261021/README.md). The report's test results describe the existing release; they are not validation of this proposal.

## 3. Route execution: the main payoff

### 3.1 Before commitment

Keep the recommended plan, per-train editing, route colors, and quoted revenue. Label the amount as an estimate/quote until accepted. Idle trains stay visibly idle. Selecting a stop can produce a tiny local paper/selection tick, but no whistle, earnings stamp, or settlement sound.

The existing Run control submits the same action it submits today. During the request, use its pending appearance. Start the payoff only after an accepted `run_routes` or `run_best_routes` event. A rejected or stale submission preserves the appropriate correction UI and never produces a success effect.

### 3.2 Default live sequence

Example using the existing two-train fixture: one train earns ¥50, another earns ¥40, total ¥90.

| Beat | Proposed timing | Visual | Sound |
|---|---|---|---|
| Departure | 0–200 ms | Emphasize company and current train label; place locomotive at the first accepted route vertex. | One short steam departure cue for the whole run. |
| Travel | Approximately 1.2–2.6 s across the whole plan | Move locomotives along their routes; reveal a stronger completed section behind each. Briefly emphasize reached scoring stops. | Quiet wheel rhythm under travel, controlled by one shared envelope. |
| Per-train completion | As each train finishes | Resolve its card to the accepted amount, e.g. `2-0 · ¥50`. | Soft ledger tick, subject to a rate limit. |
| Total | Approximately 250–400 ms | Stamp/underline `Route revenue ¥90 · Awaiting dividend decision`. | One dry ledger/stamp sound. |
| Rest | Until the player acts or dismisses | Retain a compact static result and completed route outlines. | Silence. |

Target **2–3.5 seconds total**, including multiple trains. Use a staggered start of roughly 150 ms per train with overlapping traversal, rather than playing four full journeys one after another. Fit the travel durations to a shared time budget; never accelerate a long route into an unreadable flash. If necessary, use a simpler trace for the longest cases. These numbers are initial tuning targets, to be adjusted after observing real games.

All financial figures in the regular UI update immediately from the accepted state. An optional earnings counter is decorative and clearly attached to the route result. It must never delay or replace the authoritative total, alter accessible text on every animation frame, or increment a wallet.

### 3.3 Locomotive and track treatment

- Use a small ink-and-brass locomotive silhouette, outlined for legibility over every tile color. Identify it by train ID and the existing route color; do not rely on color alone.
- Follow the track centerline, including curves, rotated exits, junctions, and the correct city node. Never cut diagonally across a hex or jump between separate stations in one hex.
- Use a steady world-space journey; the overlay inherits map pan/zoom. Do not automatically recenter or follow the train with the camera.
- Keep all unselected track and board labels readable. Use a narrow line reveal and a brief stop outline, rather than darkening the entire board.
- Optional smoke is a second-pass embellishment: at most a few short-lived puffs per locomotive, with no persistent particle trail. Steam locomotives may puff; a Diesel should not use steam effects.
- Offboard routes end at the represented terminal. The train should not travel across empty sea just because a destination label is outside the hex.
- Show only engine-scored stop earnings. If a precise per-stop breakdown is unavailable, animate visits and show the authoritative per-train total; never manufacture a breakdown from tile labels.

### 3.4 Result placement and controls

Use the existing operating ticket/route workspace for the compact result and playback controls. Add no permanent header row and no compulsory modal. Keep the route sequence inside the map's presentation layer, below inspection windows and decision controls, with pointer events disabled.

Provide `Skip animation` during travel and `Watch again` on the resulting route summary. Skip settles immediately to the same static result; it does not cancel or resubmit the game action. Watch again is a local presentation replay of the recorded route, with no API mutation. Keep this distinct from the existing journal's historical replay.

The Dividend controls are usable as soon as the server accepts the routes. If the player pays or withholds during travel, finish the route presentation immediately and present the settlement. They never have to wait for a locomotive to finish before continuing.

If the map is not visible, show a compact result where the player already is. Do not pull observers away from another screen or bring a covered window to the front. A route replay can be explicitly opened later. If the operating ticket is too narrow, use a short wrapped summary with full train details in Trains & Routes.

### 3.5 Revenue and cash remain separate

The route sequence ends with **revenue awaiting allocation**. Do not play coins or move money to a personal purse when a route completes.

After an accepted dividend decision:

- **Payout:** emphasize actual player receipts and any bank-pool payment to the company treasury. Keep the retained IPO portion visible in the allocation summary. Use one grouped cash/ledger cue, rather than one sound for every shareholder.
- **Withhold:** show the accepted revenue entering the company treasury, with a safe/ledger-close sound and treasury emphasis.
- **Zero revenue:** show the actual zero result and accepted market consequence without a celebratory cash cue.
- **Market movement:** emphasize the marker's actual before/after position. At a boundary, show the accepted result even if its position did not change.

Reuse the existing helper receipt presentation. Do not add a competing animated envelope system. Bind bank/purse/treasury labels to the accounts actually affected.

An ER/MF lay can change an unpaid route's score, and the engine revalidates at dividend time. If that happens, show `Revenue revised: ¥X → ¥Y` from accepted facts and use the final amount for settlement. Do not replay the original reward as a second earning. A corrected route claim can show a short revised trace; a previously paid result stays final.

## 4. Tactile feedback vocabulary

Use small local responses around the object that changed. A button's pressed state acknowledges input immediately; the object's landing/stamp acknowledges server acceptance. Keep those two moments distinct during network latency.

| Event | Visual response after acceptance | Sound direction | Initial duration |
|---|---|---|---|
| Track laid/upgraded | New tile/track resolves, then a single local outline settles. Upgrade stays aligned to its hex. | Muted wood-and-metal placement thud. | 120–220 ms |
| Station placed | Token settles into its actual city slot, then holds. | Small wooden/ceramic clack. | 120–180 ms |
| Route run | Locomotive traversal and ledger result described above. | Steam departure, low wheel rhythm, final ledger stamp. | 2–3.5 s total |
| Train purchased | Actual acquired card receives an ownership seal; emphasize the actual paying account. | Mechanical latch and short delivery cue. | 200–400 ms |
| Dividend paid | Actual destination balances receive a static delta and brief emphasis; reuse helper receipt. | Compact grouped coin/ledger sound. | 300–600 ms emphasis |
| Revenue withheld | Company treasury receives a delta and ledger seal. | Safe latch/ledger close. | 200–350 ms |
| Share bought/sold | Actual certificate/source and paying/receiving account are emphasized. | Paper slide plus restrained transaction tick. | 150–300 ms |
| Corporation floats | Reuse charter notice, treasury funding, and helper receipt. | A single stronger charter/seal motif. | Existing notice, brief cue |
| Phase/rust consequence | Emphasize affected cards and actual mandatory decision; integrate with existing gazette. | One subdued warning, taking priority over train-delivery fanfare. | Brief cue; persistent information |
| Local inspection/selection | Pressed/selected state only; tiny tick if enabled. | Very quiet paper tap. | Under 80 ms |
| Move rejected | Inline error remains readable beside the decision. | Optional soft dry tap; no success motif. | Brief cue |

Avoid whole-screen shakes, repeated flashing, confetti, permanent pulsing, and sounds on hover or every poll. Financial success should feel satisfying without making every small transaction an announcement.

Create balance deltas from accepted before/after values, preserve the purse/treasury label, and leave the final numeric balance fixed. Do not make the number bounce or temporarily show an old balance as though it is current. Offscreen targets receive a summary entry, not a forced scroll.

## 5. Audio implementation and asset brief

### 5.1 Extend the existing system

Keep saved music/effects preferences and existing gesture unlocking. Extend `GameEffects` with a small sample manifest, decoded-buffer cache, per-cue gain, voice limits, and cancellable loop/one-shot handles. Retain a quiet synthesized fallback so asset loading never blocks gameplay.

Continue using the current music manager. Add temporary music ducking behind a departure or grouped financial cue, initially around 3–5 dB with a quick attack and gradual release. Ducking requests must compose safely so one cue cannot restore the music while another is still active. Two existing audio contexts do not have to be consolidated for the first release; expose a simple mix-control API and avoid unrelated music rewrites.

Audio scheduling should use the Web Audio clock. The presentation controller supplies cue offsets and cancellation; the route renderer does not call `play()` every frame. Schedule stop ticks near their due time rather than scheduling an uncancellable full sequence up front. Stop a wheel loop on completion, skip, new incompatible state, leaving the room, or hiding the tab.

Allow at most one travel loop and one prominent cue at a time, plus a quiet UI tick where appropriate. Prioritize mandatory/crisis information over routine rewards. Debounce grouped payments and rate-limit stop ticks. On mute or volume changes, immediately apply the new gain to active voices; do not merely change future playback.

Effects should be softer than an ordinary conversation and recognizable at low volume. Treat the durations/gains here as mixing hypotheses; inspect and listen to assets before finalizing them. Audio load, decode, or autoplay failures leave complete visual feedback and never accumulate sounds to play later.

### 5.2 Initial asset pack

Prepare short, clean, mostly mono recordings with trimmed silence, small fades, and consistent perceived loudness. Record provenance and reuse rights in a manifest. Use a browser-supported delivery format after testing target browsers; keep editable masters outside the runtime bundle.

| Asset ID | Suggested source/character | Budget |
|---|---|---|
| `paper_tick` | Fingertip/paper contact | 40–80 ms |
| `track_settle` | Small wood block with a light metal transient | 120–220 ms |
| `station_clack` | Wooden token on a board | 80–150 ms |
| `ledger_stamp` | Rubber/wood stamp on thick paper | 100–200 ms |
| `cash_settle` | A few coins and a ledger touch, without a long jingle | 250–450 ms |
| `safe_close` | Soft latch, not a heavy cinematic door | 150–300 ms |
| `train_departure` | Short distant steam whistle with little reverb | 450–800 ms |
| `wheel_loop` | Quiet rhythmic rail motion, seamless | Short reusable loop |
| `train_delivery` | Mechanical latch/delivery bell | 200–400 ms |
| `warning_soft` | Restrained low bell/wood motif | 250–450 ms |

Variants and a separate Diesel departure are later refinements. If a suitable Diesel sample is missing, use a neutral mechanical cue rather than a steam whistle. A period-styled coin sound is preferable here to a loud modern shop-register effect; that is an art-direction choice, not a requirement for a historical recreation.

Add a development soundboard that auditions each real production cue, individual volume, a representative route sequence, and a full train-purchase consequence chain against the existing music. Reuse or link the existing `public/audio_testing_dashboard.html` where useful, but keep the production asset manifest as the source of truth. Add `Test sound` to user preferences without requiring a game transaction.

## 6. Technical architecture

### 6.1 One event delivery path

Today `presentEventAnimation()` selects a broad sound and separately sends the event to characters. It can be reached through both `applyFreshLiveView()` and the action response. Replace this broad selection with one accepted-event presentation adapter; route all live audiovisual acceptance through it once.

```text
accepted response / live polling
              ↓
presentation adapter: room + revision + delivery mode + snapshot facts
              ↓
deduplication / visibility / interruption policy
              ↓
shared presentation clock
        ↙             ↓              ↘
route overlay     sound cues      existing character/receipt playback
              ↓
static result; game state was already committed
```

Reuse the character controller's clock/queue conventions, but do not turn every locomotive frame into a character frame. Preserve the existing character director and feed it the same event identity and coordinated start/settle signals. The generic action beep must be suppressed when a specific cue replaces it.

The controller is a presentation state machine: `idle → playing → settled`, with cancellation/settling paths for skip, state changes, and lifecycle changes. It never submits a dividend, pays money, or advances an operating step. Inject clocks/schedulers and audio dependencies so timing and deduplication can be tested without wall-clock waits.

### 6.2 Capture accepted facts, not the current screen's guess

The current route journal event contains company, total revenue, and route count, but not the full accepted journey. The accepted state contains routes; route quotes already expose per-train revenue and stops. Extend the bridge's event projection with optional, versioned route presentation facts computed against the event's own accepted snapshot.

Proposed conceptual payload, with final field names chosen during implementation:

```js
route_run: {
  version: 1,
  corporation: 'IR',
  revenue: 90,
  routes: [
    {
      train: '2-0',
      vertices: [/* normalized ordered accepted vertices */],
      revenue: 50,
      scored_stops: [/* exact scoring node IDs; amounts only if authoritative */]
    }
  ]
}
```

The abbreviated example omits the second route; actual payloads include every operated train. Route order should be stable across clients. Distinguish train identity from train type and explicitly account for any owned idle trains in the rendered summary.

Use the engine's existing validator/quote helpers. Do not reimplement revenue rules in JavaScript. If per-stop contributions require a new read-only scoring breakdown helper, scope and test it separately; keep total/per-train scoring identical to the engine. Include Diesel multipliers and phase-sensitive offboards in its verification. Otherwise ship exact per-train totals first.

For financial and market effects, reuse `cash_receipts`, `dividend_allocation`, `flotations`, and `rusted_trains`. Add actual account deltas or market before/after facts where existing fields are insufficient. Positive net cash deltas alone are not proof of a specific gross transfer: one accepted action may contain several consequences. Use allocation facts for dividend attribution and net deltas for balance emphasis; do not infer an entire source/destination transfer graph from totals.

Existing journals must continue to work. If an older route event lacks these fields, an already available matching revision snapshot can support local replay. Otherwise show its static recorded summary; do not fetch a long revision chain during live catch-up. Never animate an old route using a newer board or phase. If geometry is no longer available, settle to text and train totals.

This is an additive presentation projection, with no intended rules or action-contract change. Follow the existing journal JSON storage rather than assuming a database migration. Any bridge update still needs a matching backend deployment.

### 6.3 Shared track geometry

Extract the relevant geometry from `HexMap1889.js` into a focused module rather than duplicating it in the animation renderer:

1. Map each node and rotated edge vertex to its actual drawn anchor.
2. Expose the same line/curve path used to draw each track segment, including multi-city layouts.
3. Stitch the ordered accepted route vertices into continuous geometry, respecting inter-hex links and avoiding duplicate boundary points.
4. Build a cumulative arc-length table. Interpolate train position and heading by distance, not segment count, so curves and short links do not cause speed jumps.
5. Record scored-stop positions along the journey. Visit animations use node identity, not just hex identity.
6. Render one completed-trace path and one locomotive per active train; keep decorative ribbon offsets separate from the true travel centerline.

Keep the existing static route overlay available as a fallback. Missing or discontinuous geometry should settle to that summary rather than send a train off the rails. Prove the geometry on one route before adding smoke or extra sound layers.

### 6.4 Rendering and ownership

`main.js` often replaces rendered UI. Store presentation identity, start time, progress, and cancellation outside transient DOM. Render/attach reads existing progress; it never restarts a journey. Use one animation-frame loop for active travel, patch only the overlay and relevant result slots, and stop requesting frames when settled.

Both the map and overlay must use the same SVG coordinate system and pan/zoom transform. A resize can rebind/recompute geometric projection from the same progress without resetting time. Respect window stacking and clipping. Retain forms, scroll position, focus, and unsent input through presentation updates.

### 6.5 Proposed file responsibilities

| File | Change |
|---|---|
| `src/ui/actionPresentation.js` — new | Accepted-event adapter, identities, policy, timing, lifecycle, and coordinator. |
| `src/ui/routePlayback.js` — new | Pure route timeline/progress calculation and completion/skip behavior. |
| `src/ui/trackGeometry.js` — new | Shared track paths, route stitching, and distance/heading lookup. |
| `src/components/RoutePlaybackOverlay.js` — new | SVG markup/patching for locomotives, traces, and stop emphasis. |
| `src/ui/gameAudio.js` | Extend existing effects with samples, voice handles, grouped cues, and mixing hooks. |
| `src/ui/characterDirector.js` / `characterController.js` | Minimal coordination hooks; reuse existing receipt and pose recipes. |
| `src/components/HexMap1889.js` | Shared geometry integration, overlay host, and compact result slot. |
| `src/main.js` | Single event entry point; lifecycle and reattachment wiring. |
| `src/ui/preferences.js` / `i18n.js` | Route speed, preview sound, and English/Japanese strings. |
| `src/style.css` / `playtest.css` | Local response states, overlay layering, and motion-off treatment. |
| `server_bridge.py` | Optional accepted route facts and any missing before/after presentation facts. |
| `public/sfx/` — new | Small runtime cue pack and manifest. |

Names are proposals, not a requirement to split trivial helpers into separate files. Keep the existing Vite/JavaScript stack.

## 7. Delivery, interruption, and accessibility policy

| Situation | Required behavior |
|---|---|
| Duplicate response/poll/retry | One live presentation per room/revision. Explicit replay uses a separate local playback identity. |
| Initial load/reload | Show current state and static result; do not replay the journal or pending sounds. |
| Remote live move | If already watching the map live, show the brief route sequence with local sound preferences. Else show a compact summary without navigation. |
| Reconnect with several missed moves | Summarize catch-up; do not play several old journeys/whistles. A currently relevant latest route may be shown statically. |
| Fast next action | Settle superseded decorative work immediately. Only a compatible view update of the same event preserves travel. |
| Dividend accepted during route travel | Stop travel/loop, retain route total, and present the final settlement once. |
| Another company becomes active | Settle the old company result; never draw its train onto the new company's draft. |
| History scrub | Static route/result from the selected historical snapshot; no live notification sound. |
| Explicit journal playback | Respect existing replay speed; default to silent visuals. Stop/settle when paused or scrubbed. |
| Watch again | Replay this route locally; play only its route cues if effects are enabled. No turn reminders or payment cues are replayed. |
| Hide tab / leave room | Cancel active voices, animation frames, and queued decoration. Resume with current static state, without a backlog. |
| Effects disabled / audio blocked | Identical information visually; no deferred burst after unlocking. |
| Motion Off / system reduced motion | No travel, line sweep, smoke, bounce, or counter tween. Show static complete routes, amounts, and account deltas immediately. Audio remains independently controlled. |
| Preference changed mid-sequence | Apply immediately; motion-off settles, effects-off fades/stops. Turning either back on does not restart old work. |

Keep route playback speed separate from journal replay speed. Suggested options: Normal, Quick, Instant. System reduced motion and Motion Off override travel speed. Effects remain independently enabled. Use the existing English/Japanese localization approach and preserve IDs, names, and numeric values.

Announce one concise route result to assistive technology, followed by a separate accepted settlement result when it happens. Decorative locomotives and per-frame counters are hidden from accessibility APIs. Playback controls are keyboard accessible, do not capture unrelated shortcuts, and do not steal focus. Skip is a real button; Escape should not interfere with an existing dialog's close behavior.

For colocated players, local effects mute/volume already provides control over several laptops sounding together. A shared-room quiet preset is optional later; do not invent cross-client leader election for the first release.

## 8. Build sequence and review gates

Effort estimates below are focused implementation days for one developer familiar with this repository. They exclude sourcing original recordings and stakeholder turnaround. Validate the geometry and event projection first; those are the main uncertainty.

### Milestone 1 — Event contract and single-route spike · 1–2 days

- Add additive accepted route facts with old-event fallback.
- Introduce the single presentation entry point and event identity contract.
- Extract enough shared geometry to trace one curved, rotated route correctly.
- Animate a simple dot/locomotive along it using a cancellable clock.
- Verify a duplicate response/poll, full rerender, and skip.

**Review gate:** one accepted route follows the actual rails and retains its progress across ordinary rendering; no request, retry, or preview can double-play it. Stop here to correct geometry before producing extra assets.

### Milestone 2 — Complete route payoff · 1.5–2.5 days

- Add staggered multi-train journeys, exact per-train totals, and compact final result.
- Add static/instant/reduced-motion versions, Skip, and Watch again.
- Coordinate the existing route character pose.
- Add observer, non-map, history, resize, and interruption behavior.
- Resolve revised route claims and unpaid revenue language.

**Review gate:** the 2-, 3-, and 4-train scenarios all feel readable within the bounded duration. A player can pay/withhold immediately, and doing so settles travel without blocking controls or duplicating results.

### Milestone 3 — Material sounds and mixing · 1–2 days

- Integrate the first sound pack and audition it against current music.
- Add departure, wheel envelope, route completion, track, station, and train delivery.
- Add per-cue gain, cancellation, priority, a soundboard, and Test sound.
- Suppress replaced generic beeps; preserve existing preferences and gesture behavior.

**Review gate:** sounds distinguish actions at low volume, repeated operations remain comfortable, and a muted/blocked/hidden tab never produces a delayed sound burst.

**First playable slice:** Milestones 1–3, roughly 3.5–6.5 focused days. This should already deliver the missing railway payoff and the core physical vocabulary.

### Milestone 4 — Financial settlement and consequence coordination · 1–2 days

- Connect actual destination deltas to existing helper receipts.
- Add payout versus withhold sounds and treasury/purse emphasis.
- Add actual market-marker before/after emphasis, including no-movement boundaries.
- Group payouts and coordinate flotation, train purchase, phase/rust, and mandatory decisions.
- Verify revised unpaid revenue and zero-revenue behavior.

**Review gate:** a new player can explain what the route earned, which accounts actually received cash, and why payout and withhold look/sound different.

### Milestone 5 — Stock/auction refinements and finish · 1–2 days

- Extend the same vocabulary to shares, private settlement, and relevant escrow facts.
- Tune locomotive silhouette, headings, optional smoke, and sound variants.
- Finish localization and device/browser listening/performance review.
- Package matching frontend/backend changes and retain rollback instructions.

**Review gate:** a full operating round feels coherent and brisk, without accumulating stale animation or excessive audio.

**Estimated total:** approximately 5.5–10.5 focused days, plus asset preparation and any geometry issues exposed by the spike. Optional smoke, variants, and broader auction polish can be cut without weakening the first playable slice. Treat these as planning ranges, not a delivery commitment.

## 9. Verification and acceptance

### Automated coverage that earns its place

Use the existing JavaScript and Python suites. Add focused tests for new state/timing behavior and the bridge event facts, rather than snapshot tests for every cosmetic frame.

- Geometry: rotated curves, edge-to-edge joins, multi-node cities, junctions/crossings, reversed routes, repeated-hex traversal where legal, and offboard terminals. Assert continuous positions and exact node identity.
- Timing: one start/finish per identity, shared multi-train budget, skip, replay identities, mute/motion changes, room switch, hidden tab, and newer state cancellation with fake clocks.
- Event facts: accepted routes and per-train totals reconcile to the engine; preview/rejection does not emit success; missing optional fields remain compatible.
- Finance: payout, withhold, zero revenue, bank-pool and IPO allocation, no-movement market boundaries, and revised unpaid route revenue agree with accepted state. Presentation never mutates balances.
- Audio: bounded voices, no generic-plus-specific duplicate, grouped payouts, loop cleanup, cancellation during decode, and no stale play after unlock.
- Regression: route editing/quoting, historical inspection, character receipts, existing preferences, and authorization behavior continue to work.

Run the relevant focused tests while building, then `npm test` and `npm run build` from the application directory before release. No tests were run for this planning document.

### Browser and listening pass

Start with `/test?scenario=routes`, `routes3`, and `routes4`. Known retained fixture expectations include ¥90 for the two-train plan and ¥290 for the recommended four-train plan; modifying one four-train route produces ¥260 in the retained validation. Reconfirm those baselines against the current fixture before relying on them.

Also exercise a phase/rust purchase, payout/withhold, a zero route result, an idle train, an ER/MF unpaid-route change, a blocked submission, two live clients, history replay, and reconnect. Use laptop speakers and headphones at low volume. Check the browsers/devices actually used by the club, including a touch device if applicable.

Verify map pan/zoom and resize during travel, a floating window covering part of the route, open dialogs, keyboard-only use, long labels, Japanese text, hidden tabs, music off/effects on, effects off/music on, and system reduced motion. Check that route playback does not introduce focus loss or a full-app render every frame.

Performance targets: normally sustain display-rate motion on the reference laptop, remain usable on a modest client, maintain bounded DOM/voice counts, and schedule zero travel frames after settling. Measure the browser client separately from the bridge host; a Pi serving the application is not necessarily the device rendering animation. Record the tested hardware and real measurements instead of promising universal frame rates.

### Human acceptance criteria

1. Watching a route makes its path and train revenue easier to understand.
2. Players distinguish revenue earned from money distributed without an explanation.
3. Track, station, train purchase, payout, and withhold are recognizable by their cue at low volume.
4. Frequent players can proceed at their own pace without waiting for effects.
5. After a full operating round, the layer still feels pleasant rather than repetitive.

In a short playtest, ask players to identify the paying/receiving account after a route run and a dividend decision; observe any forced skips or muted effects. Tune duration and sound density from that evidence. A successful outcome is both satisfying and easier to read.

## 10. Deliberate boundaries

This plan does not add continuous train simulation between turns, passenger/cargo modeling, train collisions or timetable rules, automatic dividend decisions, hardware haptics, or a new route-selection system. It preserves the rules engine and current action flow. Richer character acting and historical locomotive variants can follow after the core route payoff works.

The highest-value first demonstration is small and concrete: **submit the two-train plan, watch both engines follow the rails, resolve ¥50 + ¥40 = ¥90, then hear and see the separate accepted payout or treasury retention.** Use that sequence to approve the visual and audio direction before widening coverage.
