# Character onboarding, house arrivals, and host identity

Implemented locally on 17 October 2026 against the owner’s [confirmed decisions and acceptance checklist](gathering_onboarding_and_game_sequence.md). This extends the existing lobby and game controls; it does not implement new game rules.

**Portrait invitation update:** The app now uses only the 17 reference portraits. Hosts can preconfigure a portrait on each unclaimed invitation, and saved looks are scoped to the actual member. See [current behavior and verification](portrait_invitations.md).

## Delivered behavior

- First visit begins with face and Meiji-inspired clothing selection. Seventeen reference portraits and twelve independently composable outfits share the same anchors in preview, seated characters, player portraits, and arrival poses. The browser remembers stable appearance identifiers across gatherings and exposes an edit action in Gathering & Invitations. No photo upload or account is required; cross-device synchronization remains deferred.
- The guest entrance illustration uses the cream square tiles, dark recessed door, balcony, wall light, mailbox, and downpipe from the supplied references. Source photographs and the exact address are not served by the application. The kitchen and downstairs-bedroom scenes use schematic placeholders pending references.
- Creating a gathering lets the host explicitly choose their own guest/resident entrance. The waiting room lets the host assign Yumiko’s kitchen entrance and the owner’s downstairs-bedroom entrance to the relevant members, including unclaimed seats before their first entry. These are per-gathering assignments, never inferred from names, faces, or seat numbers.
- Each seated member has an identity bound to the persistent player row, independently of their reorderable engine seat (`p1`, etc.). Appearance, host association, and resident route follow that row. The host is named in the waiting room and game context, with Host badges on their seated character and player card. A non-playing host has a separate named identity. Existing rooms without a recorded host-seat association display Club Host rather than guessing which player is the creator.
- UI and server start checks require all configured seats to be claimed with distinct non-empty names. Current online status is irrelevant, and there is no Ready button. Only creator credentials can start/reorder/configure resident entrances. The legacy non-lobby setup contract and explicit development fixtures remain compatible; the claimed-seat requirement applies to ordinary gatherings created through the lobby.
- Authenticated arrival heartbeats create one persistent first-entry event per member per gathering. Polls and additional tabs reuse the same member key. After more than 45 seconds without a member heartbeat, the next heartbeat records a quiet returned event. A reconnect never repeats the first-entry animation. Observer invitations use a browser identifier to distinguish observers sharing an invitation; this identifier grants no player/host authority.
- Arrivals queue in a permanent 100px footer lane at the bottom right, outside the workspace and gameplay tickets. The scene is dismissible, does not capture focus, and expires after five seconds (returned notices after 3.5 seconds). Elapsed animation time survives ordinary re-renders. Initial connection establishes an event cursor so existing arrivals are not replayed to a newly opened tab; new arrivals are delivered during live play or historical inspection without changing room/revision.
- All enabled CSS movement uses discrete コマ送り steps. Smooth hover transitions are removed, and cinematic wipes become held scene cuts. Motion Off and system reduced motion suppress animation while preserving readable arrival and round information.
- Additive SQLite migration creates member/event storage and host metadata. It does not rewrite game snapshots, action journals, or existing credentials. Missing appearance data receives a safe default. Arrival projection is current social state, including when viewing historical game snapshots.

## Verification

- Baseline `npm test` passed before this work: 32 Node, 18 application, and 20 selected 1889 engine tests.
- Full `npm test` passed with the initial additions: 36 Node, 23 application (including the complete authored game), and 20 selected 1889 engine tests. Log: [onboarding-tests.txt](validation/onboarding-tests.txt).
- After final changes, all 36 Node tests, all six targeted character/arrival integration tests, and the three existing gathering lifecycle tests passed, including the additional legacy-schema migration test, resident host creation, seat reorder, parallel first entry, quiet returns, server restart, observer isolation, and unchanged game state/history. Log: [final targeted checks](validation/onboarding-final-checks.txt).
- `npm run build` and `git diff --check` passed.
- Browser checks used an isolated database at `/tmp/koenji-arrival-validation.sqlite3` and ports 5177/8797, preserving normal saved games. They exercised selecting a face/outfit, creation with one claimed seat and a disabled Start button, the second player claiming their seat, Yumiko’s kitchen entry, host start, a late observer with a different look, immediate observer reload without another entrance, Motion Off, and keyboard Tab navigation through the look editor. The late arrival left the match at revision zero. The captured browser console had no warnings/errors.
- The actual browser viewport was 1280×720. Requested viewport overrides did not change the measured dimensions, so 1366×768, 1440×900, and 1920×1080 are not claimed as verified. At the measured size, the checked map workspace ended above the timeline and arrival lane with no document-level horizontal overflow.

Screenshots: [character setup](validation/character-setup.png), [late arrival at the table](validation/arrival-table.png).

## Remaining acceptance work

- Replace illustrated placeholder faces with approved reference-based sprites, settle the final catalogue, and replace schematic interior scenes when photos are supplied. The sprite composition and route contracts are ready for those assets.
- Confirm queue timing and composition with actual participants, particularly simultaneous arrivals and six-player games. Automated tests cover identity/deduplication and presentation selection; a six-player browser session and every overlapping dialog/decision combination have not been manually certified.
- Complete target desktop-size and system reduced-motion browser checks. Motion Off was exercised; the system preference path is implemented in CSS and checked by inspection, not toggled in the browser.
- Complete the original full human multiplayer playtest. The complete deterministic service game and targeted browser interactions are not a substitute for it.
- Cross-device appearance synchronization, host recovery/transfer, and admitting a new playing seat after start are not delivered. Late visitors can observe or resume an existing seat.

The changes are uncommitted and unpushed. Restart an existing normal Python bridge before using the new endpoints; the isolated preview runs the updated bridge. The original roadmap is historical context; current behavior belongs in the application README and this delivery report, while the onboarding sequence records the owner’s product requirements.
