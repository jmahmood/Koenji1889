# Portrait-only characters and personalized invitations

Delivered 17 October 2026.

## Using it

1. Create a gathering with the intended player names.
2. In the waiting room’s **Host gathering controls**, retrieve invitations if necessary. The same controls appear in **Gathering & Invitations**.
3. Choose **Portrait for [person]** beside an unclaimed invitation. The preview and link update after the preset saves.
4. Share that person’s invitation. They join with the chosen face already configured, even when their browser remembers another face. They still claim their own seat and can edit their face or clothes with **Change your look**.

Choose **Recipient chooses** to remove a preset. Once a seat is claimed, the host’s preset selector is replaced by a notice that the member controls their own look. A preset does not claim a seat, mark someone online, create an arrival, or change readiness.

## Portrait catalogue

The app and semi-photoreal workbench offer only `reference-01` through `reference-17`. The default is Portrait 1. M1–M5 and the older `face-*` entries are not selectable and are never used by the app character renderer. Old saved selections normalize to Portrait 1 while retaining their outfit; the original source records and assets remain archived in place for reference. The workbench retains its vector comparison and custom-photo authoring tools.

The auction’s small position portrait also uses the shared character renderer rather than the former illustrated background image. Setup, waiting chairs, arrivals, table characters, and portrait strips share the same portrait-only catalogue.

## Data and permissions

- `POST /api/1889/games/{room}/invitations` accepts `{member_id, face}` using authenticated creator credentials. `face` must be a registered reference portrait, or `null` to clear it. Claimed seats, started matches, and members of other rooms cannot be changed through this endpoint.
- Presets use the persistent player/member identity in existing `gathering_members` storage. Names and engine seat positions do not determine ownership. Reordering seats carries the portrait and invitation token with the same person. No new database migration is required.
- The host invitation response includes each seat’s stable member ID and configured appearance. The URL keeps the seat credential and optional `face=reference-NN` in its fragment. Normal consumption removes those values from the address bar. The authenticated server preset takes precedence over an edited URL hint.
- Appearance remains editable presentation data, not authentication or a host/resident role. Existing seat authorization and private-link handling apply unchanged.
- The client remembers a separate look for each room/member. Active tabs keep their own appearance context; a guest changing their face does not overwrite the host’s heartbeat. Returning to a seat restores its server appearance instead of applying another person’s browser default. The face hint is consumed once and does not reset a member’s later choice.

## Verification

- Full regression suite: 57 JavaScript tests, 30 application/service tests, and 20 engine tests passed. JavaScript checks and the production build were rerun after the final waiting-room layout/focus fixes.
- New tests check portrait-only selection and rendering, legacy fallback, invitation fragment construction, preset precedence and consumption, independent member looks in separate tabs, creator-only configuration, invalid/cross-room targets, clearing, persistence, and preset/token identity after reordering.
- Browser checks used an isolated temporary database: assign Portrait 15, open its invitation with Portrait 10 already saved in the browser, confirm the invited look, claim the seat, change the guest to Portrait 3, and reload. The host remained Portrait 10. Existing user game data was not used for validation.
- The invitation form preserves its scroll position and focused portrait selector when saving. Waiting-room host portraits use valid block markup so they stay at their intended size.

Preview: [personalized invitation controls](validation/portrait-invitation-preset.png).
