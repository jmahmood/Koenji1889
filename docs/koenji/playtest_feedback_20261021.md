# Playtest feedback — October 21, 2026

Design requests are recorded separately from reproducible defects. The design backlog is for a separate implementation pass; this pass fixes verified defects and clarifies correct rule behavior.

## Design backlog

| ID | Feedback | Intended improvement / acceptance criteria |
| --- | --- | --- |
| D01 | Stock-page letters are too small. | Establish a readable minimum for names, cash, holdings, certificates, and trading controls. Check a laptop viewport and browser zoom without hiding actions. |
| D02 | Inactive players do not know where the action is happening, including the private auction. | Show every player the current actor, activity, and room, with a clear link to watch there. Keep spectators informed without moving their screen unexpectedly. |
| D03 | Randomize seating before starting. | Offer an obvious pre-start shuffle or a chosen default, show the resulting order, and preserve names, portraits, invitations, and host identity. The lobby currently offers manual randomization in Advanced. |
| D04 | No one remembers to finish. | Make the required next action and Finish Turn state prominent after purchases and other decisions. Distinguish a finished step from a finished company/player turn. |
| D05 | Maysa missed the par-price selection. | Explore a first-time company-launch wizard: choose corporation, choose par, review president certificate/cost, confirm. Make the chosen price visible before committing. |
| D06 | Private-company powers are unclear. | Give players an owned-powers summary, including availability, use limits, affected locations, phase requirements, and how to activate each power. |
| D07 | Buying a train is still unclear. | Explore an atmospheric pop-in flow: choose train, show fleet/phase effects and source of funds, review, stamp/confirm, then show the next step. |
| D08 | Practice mode should explain how to play. | Plan guided practice with goals and explanations, in addition to the existing practice positions. |
| D09 | Players need to know which tiles remain and how many. | Make a global supply overview discoverable; distinguish exhausted tiles, future-phase tiles, and location-compatible tiles. Existing per-location trays show counts but are not a sufficient global overview. |
| D10 | “Where am I?” when placing the first tile. | Orient the player to the operating company, its home, connected track, selected hex, and construction target. |
| D11 | Orange confirmation styling feels wrong. | Implemented in the [second feedback pass](playtest_feedback_round2_20261021.md): shared green primary actions and action-specific review labels. Redundant routine confirmations were removed. |

## Rules questions and saved-game verification

| ID | Report | Finding |
| --- | --- | --- |
| Q01 | Does a private company count toward the certificate limit? | Yes: one certificate for each open private owned by a player. Closed or company-owned privates do not count toward that player's limit. Bundled rulebook §15.1 and glossary; `certificate_count` implements this. |
| Q02 | Why does I4 allow turning track but not a straight tile? | I4/Kotohira is the special H location. Its yellow tile is #438, followed by the dedicated H upgrades; ordinary straight track is not a legal replacement. Document the restriction in the location UI rather than broadening the legal tile list. Tile supply and legal placement remain authoritative. |
| Q03 | Private-company income seemed missing at OR 4.1, phase 2. | Room 85X1E2 snapshots 61→62 show personal-cash increases of ¥25 / ¥25 / ¥20, matching the owned privates' income exactly. The same payments appear when OR 1.1, 2.1, 3.1, and 5.1 begin. No accounting correction is warranted. Payment timing and attribution need clearer feedback. |
| Q04 | Priority deal does not change between rounds. | It does not rotate automatically each round. It goes to the player after the last stock trader; if nobody trades it stays put. In room 85X1E2 it correctly remains p1 through several rounds, changes p1→p3 at revision 80 after p2 was the last trader, and starts the next stock round with p3 at revision 95. Bundled rulebook §§4.1.1, 5.2.2. |

The user authorized read-only inspection of this room's saved snapshots. No live game data was changed. Private snapshots and credentials are not included in this document or repository.

## Defects and verification work

| ID | Defect | Status |
| --- | --- | --- |
| B01 | Round-change announcement persists and covers the scene. | Fixed: hold for 8 seconds, fade for 350 ms, then remove. New rounds replace the timer; manual dismissal, room entry, and history navigation cancel it. Journal retains the action. |
| B02 | Right-side confirmation sometimes disappears. | Fixed: current-step actions are in the fixed operating footer, outside scrolling reference material and receipts. Includes track, stations, routes, dividends, and staged train purchases. Existing legal-action and revision checks remain in force. |
| B03 | Skip confirmation uses an internal, lower-case step name and vague wording. | Fixed: named Track Lay / Station Placement / Train Routes actions and explicit consequences in the review dialog. Skipping routes correctly describes proceeding to ¥0 dividend resolution. Mandatory actions remain gated. |
| B04 | I4 restriction is not explained alongside tile discovery. | Fixed: the survey and construction reference explain that Kotohira requires H-labeled city tiles. The legal tile list is unchanged. |
| B05 | Arrival notification overlaps bottom-right trading/operating controls. | Found during reproduction and fixed: arrival notices use the lower-left corner in map and exchange views. |

Payment attribution, the priority explanation, certificate counting, supply visibility, and action-location guidance are usability issues even when the underlying state is correct. They remain recorded above instead of being reported as fixed accounting or rules bugs.

## Validation

- 180 JavaScript tests pass, including notice expiry, explicit skip review, H-tile explanation, and the existing gameplay coverage.
- Three new service/rules regressions pass: phase-2 OR 4.1 private income and conserved money, no-trade priority retention, and private certificate counting.
- Actual operating positions were checked at 1280px wide and 640, 720, 768, and 900px high. All 20 combinations of five operating steps and four heights have visible current-step/turn controls that receive pointer input.
- Browser regression results and screenshots: `validation/playtest-feedback-20261021/`.
- The Pi was inspected read-only. These fixes have not been deployed there by this task.
