# Paper-doll SVG integration plan

Prepared: 17 October 2026. Historical proposal. The application integration is now delivered; see [current behavior and validation](paper_doll_integration.md). The prototype counts and implementation assumptions below describe the earlier planning baseline.

References: [working preview](koma_paper_doll_preview.html), [pose/prompt guide](koma_pose_prompts.md), [confirmed onboarding requirements](gathering_onboarding_and_game_sequence.md), and [current onboarding delivery](onboarding_implementation.md).

## Feasibility and inspection

The prototype is usable as the next character renderer. It already provides separate torso, head/expression, and foreground arm/prop functions, uses the application's `200×240` coordinate space, and reuses all four existing clothing IDs. SVG can remain the production format; neither a sprite-sheet conversion nor a new graphics library is required for this integration.

Inspection covered the source, the companion guide, browser selection of face/outfit/expression/pose, miniature portraits, and a running stock-purchase sequence. A temporary structural check rendered all **800 combinations** (5 faces × 4 outfits × 5 expressions × 8 poses) through the prototype functions. Every result parsed as XML with three root layers, the expected viewBox, and no undefined/NaN lookup values. This does not certify visual alignment across all combinations.

The preview and prompt guide remain the owner's work in progress. This planning task does not alter either file or the application runtime.

## 1. Keep artwork development independent

Use `src/scene/Character.js` as the existing app-facing entry point. Its callers already cover onboarding, the waiting room, the table, auction/exchange/map portraits, and the arrival dock.

In the first integration change, extract the artwork behind that entry point into a small module such as `src/scene/paperDollArt.js`:

- `renderTorso(outfit, pose)`
- `renderHead(face, expression)`
- `renderForeground(face, outfit, pose, props)`

These functions return SVG markup and have no document queries, timers, network calls, or access to game state. The adapter validates inputs and stacks their outputs. The prototype then imports the same artwork module and keeps its member selectors, manual pose controls, exploded view, and mock-event buttons. This makes the preview an authoring workbench for exactly the artwork used by the app, without maintaining two diverging copies.

Until that extraction is deliberately made, continue editing the current HTML freely. The first extraction should use the latest version, rather than requiring this draft to be frozen now.

Suggested app contract, retaining existing options while adding explicit presentation controls:

```js
renderCharacter(appearance, {
  name,
  pose: 'idle',
  expression: 'neutral',
  surface: 'table', // setup | table | portrait | arrival
  props: null,     // verified company/percentage/tile/etc., when needed
  motion: false,
});
```

`appearance` remains the saved `{ face, clothes }` pair. Pose, expression, and sequence progress are temporary client presentation state. They must not become identity, host permissions, or engine state.

## 2. Stabilize a few art contracts before scaling the catalogue

| Contract | Integration action |
|---|---|
| Canvas and attachment | Keep the full `200×240` canvas and agree on the collar anchor near `(100,92)`. Apply compatible pose offsets to all affected layers. Check the prototype's independent torso lean, head tilt, and unshifted arms for gaps under point/shock expressions. |
| Draw order | Preserve torso → head → foreground hands/props. Verify thinking hands overlap the chin/beard correctly and the app's foreground table does not unexpectedly cover raised props. Keep the chair optional or owned by the scene rather than permanently baked into every outfit. |
| Skin matching | Continue deriving hands and neck from the selected face's skin/stroke palette. If raster layers are later introduced, use transparent registered layers and a deliberate hand-skin variant strategy; avoid multiplying every outfit by every identity unnecessarily. |
| Outfit shape | The guide calls for wide kimono sleeves and tailored suit sleeves. The current foreground renderer mainly shares geometry with different outfit colors. Add per-outfit geometry where needed before declaring every posed outfit finished. |
| Vocabulary | Standardize the implemented expressions (`neutral`, `smile`, `calculating`, `declare`, `shock`) and eight body poses. Map the guide's `body_token_tile` to the preview's `token`. The guide also mentions `triumphant`, which has no dedicated preview pose yet: use `smile + idle` until artwork exists. |
| Existing app poses | Adapt `acting`, `speaking`, and `arriving` deliberately. Unknown poses must fall back to neutral/idle; the prototype currently falls through to shock hands for an unrecognized body pose. Arrival can initially use a smile/idle body under the existing doorway cuts. |
| Surface crops | Use named crop presets instead of stacking the prototype's portrait viewBox and scale with the app's existing 150% portrait CSS. Test table, setup, mini portrait, and arrival independently. Raised certificates and hands can extend beyond a head crop. |
| Accessible interaction | Keep one meaningful accessible name per character. The preview's clickable mini-card divs should become buttons when incorporated into the app; decorative sublayers should not create repeated screen-reader announcements. |

If generated raster art is used later, the guide's solid dark-slate backgrounds are preview backgrounds, not a production layer contract. Composite assets need true transparency, a consistent canvas, and matching registration points.

## 3. Preserve identity and saved selections

The five `m1`–`m5` entries currently combine a face definition with a mock roster member. Split those concepts:

- Add five stable face catalogue IDs, for example `paper-face-01` through `paper-face-05`. Keep descriptive labels until the intended member names are established.
- Keep existing `face-01` through `face-08` entries renderable for saved appearances. Do not silently turn someone's saved placeholder face into a particular club member's likeness. New faces can be selected explicitly.
- Keep the four clothing IDs unchanged. Their richer artwork can replace the old rendering without resetting clothing selections.
- Update the shared catalogue and backend validation together; `normalizeAppearance` and `clean_appearance` currently accept only registered IDs. The Python bridge loads the catalogue at startup, so it must be restarted after additions.
- Continue binding appearance to the server's stable member ID. A face ID is not a seat, resident identity, or host role. Two participants may choose the same face without becoming the same member.
- Render however many participants are in the actual gathering: 2–6 players, a non-playing host when present, and arriving observers. Five available reference faces do not impose a five-player roster.

No new authentication system or gameplay database migration is needed merely to add these faces and expressions.

## 4. Add a presentation controller before event choreography

The standalone timer loop is suitable for the workbench. Production needs a small client controller shared by every visible character surface, for example `src/ui/characterPlayback.js`.

Represent each sequence as data: held-frame duration, actor pose/expression, optional affected-member reactions, and verified prop data. Keep `startedAt`, sequence ID, and the current frame outside rendered DOM. Compute the held frame from elapsed time and schedule only the next cut. Navigation or ordinary polling must display the current frame instead of restarting it.

The app currently rebuilds much of its DOM on `render()`. A 550ms pose timer should not recreate forms, move keyboard focus, or replace gameplay buttons. Prefer updating dedicated character slots, marked with stable member IDs and surface names, for pose-only cuts. A normal full render can still query the same controller for the correct current pose. This is a targeted rendering change, not a frontend-framework rewrite.

Required lifecycle behavior:

- Deduplicate a committed animation by room + revision/event identity. Current `executeGameAction` and `applyFreshLiveView` can both invoke event presentation for the same accepted response; the controller must collapse those deliveries and subsequent polls into one sequence.
- Keep social arrival IDs separate from game revisions and replay sessions. Do not replace the existing first-entry/quiet-return rules.
- Reuse the same actor/reaction frame in table characters and miniature portraits within a browser. Exact synchronized wall-clock playback across different browsers is not required for the first slice.
- Define cancellation and priority: arrival stays in its reserved dock; mandatory decision controls remain usable; entering another gathering clears old sequences; replay scrubbing cancels stale presentation.
- Handle a burst of moves with a short queue or coalescing policy. On reconnect, show the latest state rather than playing minutes of old celebration. Do not rely solely on the newest `last_event` when deciding what arrived during a polling gap.
- For manual history scrubbing, show a static pose. Explicit Play Replay may run the sequence again using a fresh replay-session key and the existing playback-speed controls. Return to Live must not submit an action or replay the entire backlog.
- Motion Off/system reduced motion cancels timer-driven pose changes as well as CSS movement, leaving static readable information. CSS `animation:none` alone cannot stop JavaScript swapping expressions.

Prototype hold times of roughly 550–1300ms are already suitable for discrete コマ送り. Preserve them as editable data, not scattered timers. The stock demonstration currently lasts about **3.85 seconds**, longer than the app's existing 2.8-second overlay lifetime; use sequence durations rather than allowing that old timer to cut it off.

## 5. Connect events to facts

Keep pre-commit staging separate from accepted-action presentation. An authorized player's local draft may use thinking/ledger poses locally. Other clients should not see that player's unsubmitted choices or a declaration that suggests a move succeeded.

| Trigger | Initial integration behavior |
|---|---|
| Accepted `buy_shares` | Actor declares, presents the actual certificate, then settles to smile/idle. Use event company, percentage, par-set, float, and presidency facts. Setting par or buying a president's certificate does not always mean the corporation floated. |
| Accepted `bid` | Declaration with the actual company and bid. Show an award/certificate only when the authoritative auction result actually awards a company, including cascade awards. A raise alone is not a win. |
| `lay_tile` / `place_token` | Show the actual action/prop and actor, preserving MF/ER special-action authority. Do not call opponents blocked without evidence from rules/state. |
| `sell_shares` / `emergency_sell` | Start with actor-only presentation. Add affected-shareholder reactions after a reliable participant list can be derived from the accepted before/after state. |
| Accepted note/stamp/dividend | Use small, infrequent tea/smile celebrations under current social/game permissions. Do not automatically toast on every poll or ordinary message. |
| First arrival / return | Use the new rendering inside the existing arrival queue and doorway/resident routing. First entry can smile; returns remain quiet notices. |

Remove fixed `IR`, `20% PRES`, `¥80`, `¥70`, `#439`, and Kotohira claims from production choreography. Source exact labels from accepted events/catalogue data or use a generic unlabelled prop. Escape all dynamic text inserted into SVG.

The preview intentionally makes all other mock members react together. Production should identify a specific affected member when supported, or use a clearly decorative neutral/group reaction. Avoid inventing statuses such as “blocked on I4” or “holding ¥45.” If existing event metadata is insufficient, add small optional structured facts in `summarize_transition` without changing rules. Old journals must continue to render with safe fallbacks.

## 6. Delivery slices and acceptance

1. **Shared artwork, static rendering.** Extract the latest art functions, register the new faces, and integrate idle/manual-expression rendering into setup and the waiting room. Make the workbench use the shared functions. Acceptance: old saved looks survive; all new faces mix with all four outfits; changing art in one place updates both preview and app.
2. **All surfaces and playback lifecycle.** Add crop presets and the shared controller. Integrate table, auction/exchange/map portraits, and arrival characters. Acceptance: the same member retains their appearance after seating changes; navigation/polls do not restart poses; focus/forms survive cuts; Motion Off stops both timer and CSS animation.
3. **One real accepted stock purchase.** Connect the current journal/response path to one sequence, replace fixed prop labels, and deduplicate response/poll delivery. Acceptance: exactly one visual sequence follows a legitimate purchase in two authenticated clients; a rejected/stale move produces no success sequence; game state updates immediately without waiting for animation.
4. **Other actions, social cues, and final art QA.** Add auction/operation/dividend/note triggers incrementally after event facts and affected participants are correct. Exercise 2-, 5-, and 6-player layouts; long names; all five faces and four outfits; chin/tea/certificate/shock overlaps; resident arrivals; overlapping decisions; replay and reconnect. Verify the actual target desktop sizes (1366×768, 1440×900, 1920×1080).

Use table-driven rendering checks for the full combination matrix, selected visual snapshots for overlap/cropping, deterministic controller tests with a fake clock, and service/browser tests for accepted/rejected/duplicate event delivery. Compare saved state/journal before and after animation, dismissal, and replay to prove presentation never changes game rules.

## What the owner can keep refining now

Keep refining facial likenesses, hair/beard/glasses details, expressions, sleeves, hands, props, and hold durations. The most valuable stable choices are the common canvas/neck anchor, the five expression names, and the eight body-pose names. No final artwork freeze is needed for the first integration slice. The optional triumphant pose and dedicated arrival poses can be added later with idle fallbacks.

The companion prompt guide currently describes the inverted stack as already implemented in `Character.js`; source inspection shows that it is still a prototype design. Update that claim when slice 1 is delivered. Final likeness/publication permissions and private reference-photo handling remain governed by the existing project requirements.
