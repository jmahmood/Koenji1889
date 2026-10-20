# Room-purpose usability implementation

Delivered: 16 October 2026.

Follow-up, 17 October: the smooth wipe effects described in this historical delivery report have been replaced by held コマ送り scene cuts. See [onboarding implementation](onboarding_implementation.md) for the current animation, appearance, and arrival behavior.

This implements the recommended D1–D9 decisions in the [room usability plan](room_usability_plan.md). Consistency applies to facts, identity, action meanings, and transitions—not identical room layouts.

## Preserved baseline

Before implementation, the existing work was committed separately:

- Application checkpoint: `be20777` — current clubroom work, usability plan, and engine reference.
- Nested engine checkpoint: `32ea100` — the pre-existing 1830 regression-test work.

The implementation does not change engine rules, migrate saved matches, rewrite accepted action history, or replace the illustrated room. The engine checkout remains at its checkpoint. No push or deployment is part of this change.

## Delivered behavior by room

| Room | Purpose and deliberate differences retained | Usability changes |
|---|---|---|
| Club table | Illustrated social scene, friends, physical hotspots, combined gathering feed. | Predictable Table / financial workspace / Map & Operations / Journal destinations; player inspection instead of identity switching; distinct notes and game events; clearer phase and current actor. |
| Private Company Auction | Illustrated concessions, auction order, fixed bidding desk. | Inspection is explicitly separate from submission. The desk distinguishes the current offer, inspected company, viewer escrow, additional commitment, available cash, and waiting/history restrictions. Reference content scrolls independently of Buy and Pass. |
| Stock Exchange | Dense comparison tables, optional simultaneous reference windows, transaction ticket. | Useful first entry, Split 2-Up and Restore Layout, named holdings perspective, clearer settlement and cash effect, and one certificate for a president's 20% share. Transaction actions remain separate from scrolling reference content. |
| Map & Operations | Dominant geographic board, zoom, inspection windows, corporate workbench. | Inspection, staged track, and commitment have different meanings. Active corporation and treasury remain distinct from inspected information. Supported shortcuts explain skipped steps; discarding a staged preview requires confirmation. Keyboard inspection and visible inspector access supplement right-click. |
| Journal | Full chronology, snapshot comparison, richer replay controls. | Selecting an entry stays in the Journal; Inspect Result explicitly opens its position, with a return path. Historical inspection stays fixed as live moves arrive. The complete current journal remains available when viewing older snapshots. |
| Membership card | Tactile card, stamps, gathering notes. | Current gathering is explicitly separate from historical game state. Social activity keeps existing role permissions. Close and Escape preserve the underlying room and staged selection. |
| Demo Tools | Fixture creation, seat testing, protocol checks. | Separate tabs and clear demo-only identity switching. Fixtures open a different match; a session return control restores the previous match. Normal player inspection no longer impersonates another player. |

## Shared contracts

- A compact context row identifies viewer, round, phase, live/historical position, and revision without replacing room-specific headers.
- Historical, loading, observer, waiting, and pending-submission states cannot submit ordinary gameplay actions through the UI. The server remains authoritative, including for rule-specific special actions.
- Revision/seat changes and accepted moves clear stale tile previews. Older asynchronous snapshot responses cannot replace a newer requested position.
- Gathering notes remain current during rewind; game-event subsets stop at the viewed revision.
- Timestamps use stored instants, displayed in the viewer's local timezone. Legacy clock-only values are shown as unavailable rather than assigned an invented date. New notes and stamps carry ISO instants.
- Initial bank cash comes from revision zero rather than total money supply. Unsupported online-presence claims are replaced by seated membership.
- Escape dismisses one layer: dialog, staged preview, focused inspection window, replay, animation, then return to the table as applicable. Dialogs trap focus and restore the invoking control.
- Window arrangements persist within the session. Custom geometry is clamped to the current workspace after resizing, and Restore Layout provides recovery.

## Verification

Commands completed successfully:

```sh
git diff --check
npm test
npm run build
```

The test command passes 50 tests: 23 Node presentation/behavior checks, 7 application integration tests, and 20 existing 1889 engine tests. New coverage includes historical no-submit guards, observer perspective, certificate counting, layout transitions, Escape priority, shortcut consequences, timestamp policy, journal selection versus inspection, real operating-fixture rendering, initial bank/presence truth, non-mutating historical state with current gathering notes, operating-role guidance, bidirectional round-status navigation, reserved action feedback, and the round-handoff policy described below.

Browser checks used an isolated SQLite database and newly created demonstration matches, not an existing user match:

1. Inspecting an auction company left revision zero unchanged. A subsequent ¥35 bid advanced exactly one revision and showed cash ¥420 → ¥385, own escrow ¥35, and the next additional commitment of ¥5.
2. A president's certificate purchase showed ¥160 settlement, cash ¥340 → ¥180, 20% IR ownership, and certificate count 2 → 3. A separate observer could not buy.
3. That observer remained at historical revision zero when the purchase arrived, saw one new live move, and returned to the correct live position explicitly.
4. Journal selection retained the Journal; Inspect Result opened the historical exchange; Back Journal restored the originating entry even after further scrubbing across rounds. Latest entries remained present while inspecting an older revision.
5. Staging track changed no revision. Escape first closed a membership dialog without losing the preview, then cancelled the preview without leaving the map. Keyboard inspection opened the selected city's inspector.
6. A route shortcut warned that track/token opportunities would be skipped, required discarding the staged preview, and advanced through the server-supported no-train route action. A separate normal track commitment advanced to the token step and cleared the preview.
7. Posting a current-gathering note during game rewind preserved the selected game revision and displayed a real, timezone-labelled timestamp.
8. Returning from a new operating fixture restored the previous stock match and its live revision.
9. Table, Auction, Stock Exchange, map inspection, operating desk, and Journal were checked at 1366×768, 1440×900, and 1920×1080: 18 room/size combinations. None produced document-level horizontal overflow, and the checked primary financial/operating controls stayed on screen.
10. A keyboard-resized comparison window survived leaving and returning to the exchange, recovered within the smaller workspace after a 1920→1366 viewport change, and reset to the initial Corporations layout. No warnings or errors appeared in the final reviewed browser tab's captured console.

## Follow-up: round and room transitions

The owner's follow-up requested an explicit cinematic transition between rounds and a note for players socializing at the table. This refines the original live-round behavior without changing historical inspection:

- Live Auction → Stock, Stock → Operations, subsequent operating rounds, and Operations → Stock receive a round announcement. Match completion points back to the table.
- When following live play in the ending round's own work room, the interface follows the next round automatically. A 1.4-second brass/ink wipe identifies the next round; it does not delay accepting a move or block input. The announcement remains readable until dismissed or its destination is opened.
- The social table stays put and offers an explicit Open Map & Operations / Stock Exchange link. Journal inspection, rewind, open dialogs, and unrelated inspection rooms are not automatically relocated.
- Manual navigation between Table, Exchange, Map, and Journal receives a lighter 0.8-second wipe. Repeated renders and ordinary moves do not replay it. Escape can dismiss the wipe; rapid navigation replaces the previous one.
- Motion Off and the operating system's reduced-motion preference disable the wipe, not the round information. No sound or external media is added.
- Operating-round labels now use stock-round/set number plus operating-round number. The engine's corporation-turn index no longer masquerades as a new operating round.

Additional browser verification used a fresh isolated stock match. The final stock pass at revision 21 → 22 moved the live exchange to the map and announced Operating Round 1.1. A simultaneous social observer stayed at the table with the announcement and a working map link. A rewound observer stayed at revision 8 in the exchange with a new-live-move indicator and no intrusive announcement. Ending IR's legal no-train operation at revision 25 returned the live map to Stock Round 2, including for the live observer. With Motion Off, the same handoff and readable notice appeared without a wipe. A manual room change was visually checked during its wipe.

The following Stock Round 2 → Operating Round 2.1 handoff was also exercised. Its table and map announcements fit at 1366×768, 1440×900, and 1920×1080 without horizontal document overflow. The table's destination link remained on screen, and the map announcement did not cover the operating action panel at any checked size. The final reviewed browser console contained no captured warnings or errors.

The map's round-status callout is a native button during stock and auction rounds: clicking anywhere on it opens the corresponding financial room, and Enter/Space provide keyboard activation. It has a visible Open Exchange / Open Auction hint and preserves the viewed revision and seat. Operating-round callouts remain informational. Browser checks confirmed live stock navigation by click and Enter, and historical auction navigation by Space without leaving revision zero.

The reverse direction is also explicit: on the Stock Exchange during an operating round, the entire round-status callout opens Map & Operations. Its badge says Operating Round rather than Your Decision, and it shows Open Operations →. It preserves seat/revision for presidents, waiting players, observers, and historical views. Browser checks reproduced the reported stock-screen state at live revision 22 as Daisuke and confirmed both clicking the panel and pressing Enter opened the operating map without changing seat or revision. The normal stock-round callout remains informational while already in its own work room.

## Limits and follow-up decisions

Feedback placement correction: success and error messages no longer float over the bottom-right action ticket. They use a reserved 32px status lane immediately below the viewer/round context, above the workspace, in every room. The empty lane preserves geometry so appearance, timeout, and manual dismissal do not move the next button. Errors take precedence over an earlier success, retain alert semantics, and messages remain escaped and dismissible. A real tile commitment reproduced the reported confirmation at 1366×768; the message was wholly above the workspace and the workspace top did not move. Additional operating confirmations at 1440×900 and 1920×1080 also stayed above the action area without horizontal overflow; manual dismissal preserved the workspace position.

Operating-role correction: “What to do now” and “Acting for [corporation]” are reserved for the authorized operating president. Waiting players and observers see the president's name, the current step as observation, and inspection controls instead of normal operating submissions. Private-company permissions no longer imply normal presidential authority; MF port and pending ER tile actions retain their separate permissions and labels. Unauthorized stale tile previews are not rendered as staged construction. Regression checks cover observation wording across all five displayed steps, actual waiting-player/observer projections, retained president guidance, and the distinction between MF/ER powers and ordinary operation. Browser checks confirmed the president, Haruka, and an observer at the same live revision; Haruka could still inspect an MF port hex and see her separate power without receiving IR's normal operating controls.

- These are targeted regression and desktop usability checks, not certification of every 1889 rule, a complete multiplayer match, every browser, or mobile layouts.
- Supported shortcuts are preserved; the UI does not promise every geometric candidate or advertised action will pass all server rules.
- Social messages and stamps do not have historical replay. Older missing timestamps are not backfilled. Seated membership is not real-time connectivity.
- Layout memory is session-level, not permanent across reloads. Fixture return retains the previous match within the session, not an unlimited navigation history.
- Primary navigation retains the existing bilingual presentation. Long explanations are English; a full Japanese terminology/content review remains separate work.
- The table art, financial comparison windows, and geographic workbench intentionally remain different. Further visual uniformity should require a demonstrated usability benefit for that room.
- Restart the development server to pick up the Python bridge changes when using a pre-existing server process.
