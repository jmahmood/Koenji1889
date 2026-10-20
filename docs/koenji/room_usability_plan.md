# Koenji Railway Club 1889 — Room Purpose & Usability Plan

Prepared: 16 October 2026  
Status: Implementation authorized on 16 October 2026 with the recommended D1–D9 defaults. See [implementation and verification](room_usability_implementation.md) for the delivered behavior and verification limits.
Follow-up, 17 October 2026: the owner’s [onboarding decisions](gathering_onboarding_and_game_sequence.md) supersede smooth wipe effects with コマ送り scene cuts. Navigation, historical inspection, and reduced-motion contracts remain in force. See [implementation](onboarding_implementation.md).

Scope: Club table, private-company auction, stock exchange, map/operating desk, journal/replay, membership card, and development tools.

## 1. Intended outcome

Preserve the different reasons for visiting each room while making the experience understandable, accurate, and easy to move through. The club table should feel like returning to friends. The exchange should support economic comparison. The operating desk should support geographic reasoning. The journal should help players reconstruct the evening.

The governing principle is: standardize facts, action meanings, and transitions; allow composition, density, emphasis, and tools to serve each room.

The original implementation plan explicitly distinguishes the social tabletop from detailed game views. It requires a convincing room and recognizable people, while giving accuracy and legibility priority in detailed game views. That remains the design foundation.

Success means a returning player can identify the match, understand whose decision is pending, inspect what changed, perform a legal action with a clear understanding of its effects, and return to the social gathering. An observer can follow the same activity without being addressed as the acting player.

## 2. Scope and evidence

This plan builds on the rendered-screen review and a subsequent source review of the rooms' intended behavior. It separates observed problems from proposed product decisions. Implementation must recheck findings against the current working tree, which contains existing application changes from outside this planning task.

Evidence qualifications:

- The earlier review observed a blank exchange after entering the stock fixture. The current `syncRoundWindowsAndSelection` explicitly opens Corporations after an auction-to-stock transition. Reproduce current entry paths before proposing a fix; this may already be addressed.
- The enabled historical auction button labelled “Place Bid (+¥5) · Select …” selects a private company. It does not itself submit a bid. The problem is misleading wording, not evidence that history accepts moves.
- The engine permits some later operating actions to advance past optional earlier steps. A strict step-by-step interface would remove useful supported shortcuts. Preserve these shortcuts and explain their consequences.
- A list of action types or geometric tile candidates is not proof that a specific submitted action will pass every rule check. The server remains authoritative.
- The previous visual audit used 1280×720. The design brief's target desktop sizes are 1366×768, 1440×900, and 1920×1080; the follow-up review must cover them.
- The top-level starter prototype and `daemon18xx/old` are not additional product rooms. Future implementation targets the current `koenji-1889` application unless scope is explicitly expanded.

Out of scope for this plan: a new visual style, replacing the room art, game-rule changes, a generic application framework, mobile redesign, replaying recorded conversations, new authentication architecture, or a redesign of the original 1889 company identifiers.

## 3. Room contracts

### 3.1 Club table — social presence and orientation

Primary question: “Who is here, what happened, and where should I go next?”

Preserve:

- The continuous illustrated room, independently rendered friends, table props, and physical board/certificate/card hotspots.
- The mixed conversational account of social notes and game events, provided their types are distinguishable.
- Compact turn information, short event summaries, lightweight replay, and gathering traditions.

Proposed behavior:

1. Identify the viewer and current actor without confusing presidency, priority deal, turn ownership, or presence.
2. Present one concise current-action invitation that leads to the appropriate work room.
3. Keep the board hotspot directed to Map & Operations and the certificate hotspot directed to the financial workspace. During the opening auction, explain that the latter opens Private Company Auction.
4. Give Journal a reliable destination. Remove the current mismatch where “Operating View” can open the Journal outside an operating round.
5. Keep detailed financial comparison and operating forms in their work rooms. Summary values and badges can remain on the table.
6. Visually distinguish a friend's message, a club-host note, and a committed game event. Opening an event must have a predictable inspection action.
7. Preserve short, dismissible animations; an animation must never delay an accepted move or obstruct the next decision.
8. Show seated membership separately from actual online presence. If reliable presence is unavailable, use “seated” rather than claiming “connected.”

Acceptance: a player returning after an absence can find the active actor, recent relevant activity, and the next destination without opening a developer modal. The room remains primarily a social scene.

### 3.2 Private Company Auction — compare concessions and commit bids

Primary question: “What is offered, what have I committed, and what can I do now?”

Preserve the fixed auction composition, illustrated certificate cards, auction order, selected concession, and bidding desk. There is no need to reproduce the exchange's window arrangement.

Proposed behavior:

1. Distinguish the company currently offered, the company being inspected, and a company in a runoff auction. These are different states and can refer to different companies.
2. Keep the current offer, relevant highest bid, viewer's existing commitment, additional cost, and remaining spendable cash available near the bidding action. Label aggregate escrow separately from the viewer's escrow.
3. Use “Inspect [company]” or “Select a company to bid on” for selection. Reserve “Place bid ¥X” for submission.
4. State whether a bid is for a later concession or an active runoff. Explain the minimum increment and why Buy or Pass is unavailable when applicable.
5. Preserve selection and comparison in historical and observer modes. Replace submission controls with a clear read-only or waiting explanation.
6. Keep access to the map for assessing a private company's geographic power, with the selected company or relevant location retained where practical.
7. On auction completion, provide a short transition message and a useful stock workspace when the player enters it. Do not force someone inspecting the map or journal into another room because a live round changed.

Acceptance: selecting a later company changes no game state; submitting a bid explains its exact commitment; inspecting old auctions remains useful; the transition to Stock Round 1 never leaves the player without a clear next step.

### 3.3 Stock exchange — compare investments and understand settlement

Primary question: “Which corporation and transaction best serves my position?”

Preserve dense comparison tables, the price ledger, optional simultaneous reference windows, company geography, and the transaction ticket.

Proposed behavior:

1. Start a first visit with Corporations visible. Offer a comparison preset for Corporations + Market Ledger and a reliable Restore Layout command.
2. Respect deliberate window arrangements during the session. Closing the last reference window should leave an obvious way to reopen information; do not constantly reopen windows against an explicit user choice.
3. Keep corporation selection synchronized across the table, geography, details, and ticket. Clearly distinguish the inspected corporation from the current acting player.
4. Before submission, show source, certificate percentage, unit/par price, total settlement, cash effect, and relevant certificate/ownership limits.
5. Show a president's certificate as one certificate representing 20%, avoiding confusion with two standard 10% certificates. Percentage, share units, and certificate count must have distinct labels.
6. Make Buy, Sell, Exchange, Pass, and Finish Turn distinguishable. “Pass” and “Finish Turn after buying” must accurately describe their different state.
7. For an observer, show “Daisuke's holdings” or “Viewing Daisuke's position,” with an explicit perspective. Do not imply those holdings or the projected cash belong to the observer.
8. Keep the active player's choices separate from the viewer's own holdings when waiting for another player. Avoid silently switching financial perspective.
9. Use selected-company context when entering the map, and preserve the exchange arrangement when returning.

Acceptance: the player can compare alternatives without losing the transaction context and can explain the purchase's cash and ownership effects before committing it.

### 3.4 Map & Operations — spatial planning and corporate action

Primary question: “What can this railway build or run, and what does that action advance?”

Preserve map dominance, zoom, geographic inspection, movable reference windows, corporate treasury information, and the operating ticket. Keep map-only inspection available.

Proposed behavior:

1. Separate three interactions: inspect a location, preview a candidate change, and commit a server-validated action. A map click must communicate which one it performs.
2. Outside an operating action, retain useful city values, upgrade ladders, private powers, and geography. Label candidate information as inspection or planning; avoid “place legal track now” wording when the viewer cannot act.
3. During operation, show the active corporation, its president, corporate treasury, current step, and the viewer's authority. Distinguish corporate funds from personal cash.
4. Allow another corporation to be inspected without changing which corporation a submission operates. Make both contexts visible when they differ.
5. Make the recommended next action prominent while preserving legal shortcuts. An action advancing past optional steps must name the consequences adjacent to the control, for example “Run routes — skips remaining track/token actions.”
6. Use an extra confirmation only when a shortcut discards a staged selection or an important consequence cannot be communicated clearly in place. Routine legal actions should not accumulate repetitive dialogs.
7. Avoid implying that every advertised action type is valid for the selected hex, token slot, train, or dividend state. Use available server choices and prerequisite explanations; retain rejection handling.
8. Provide inspection using keyboard and a visible control as well as right-click. Explain the select/preview/rotate/confirm sequence.
9. Keep the commit control and relevant cost visible alongside the staged map change at target desktop sizes. Cancel must discard only the preview.
10. Explain an empty route or zero-revenue action in context. If the corporation has no trains, direct the player through the permitted sequence without suggesting a profitable run exists.

Acceptance: a player knows whether a click inspects or commits, whose funds are used, and which opportunities a shortcut skips. Inspection remains valuable outside operating rounds.

### 3.5 Journal & replay — reconstruct decisions and inspect consequences

Primary question: “What changed, why does this position look like this, and where am I in the evening?”

Preserve chronological emphasis, detailed events, complete game history, revision navigation, and richer replay controls than the social table needs.

Recommended interaction model:

1. Selecting a Journal entry selects its revision and retains the Journal so the player can compare neighboring events.
2. Provide an explicit “Inspect resulting position” action. It opens the applicable auction, exchange, or map at that revision and offers a return path to the originating entry.
3. In an already open Map or Exchange, timeline scrubbing preserves that inspection workspace. Its heading and action state update to the historical round, even when that room has no available gameplay action.
4. Within the shared financial workspace, changing between its auction and stock presentations may follow the historical round. Announce that transition and retain a route back to the Journal. Do not force the Map or Table into the financial workspace.
5. Returning to Live retains the chosen room, refreshes the authoritative position, and clears or revalidates stale staged actions. It never submits a preview.
6. New live actions update the live revision and a “new moves” indicator without moving a historical viewer to Live.
7. Keep the complete journal distinct from shorter room-specific activity feeds. A stock or operating activity panel can show a filtered or recent subset if its scope is labelled.
8. Use ordinary event descriptions. Store command identifiers and persistence/protocol explanations in developer details.

Acceptance: rewind never mutates the game; a player knows the viewed and latest revisions; selecting an event, inspecting its result, and returning to the journal or Live all have predictable outcomes.

### 3.6 Membership card and gathering notes — club ritual

Primary question: “Am I part of tonight's gathering, and what are my friends sharing?”

Preserve the tactile membership card, stamps, gathering identity, and social notes. This surface should feel distinct from a transaction ticket.

Recommended behavior:

- Treat game history and gathering state as separate timelines. The current backend projects current club state alongside historical game snapshots; it does not reconstruct historical chat/stamps.
- During game rewind, label notes and stamps “Current gathering” so they are not presented as records from the selected game revision.
- Permit social activity during game rewind only in this explicitly current-gathering context, under the same role permissions as Live. A read-only game snapshot must not silently relabel present-day messages as historical.
- Explain the one-stamp-per-gathering rule in friendly language. An observer can inspect the card; actions depend on the role's existing permissions.
- Close returns to the invoking room and preserves its selection, revision, and layout.

Acceptance: the membership ritual remains easy to find from the table, and nobody mistakes current social state for a replay of an earlier gathering moment.

### 3.7 Development tools — reproduce scenarios and verify contracts

Primary question: “How do we reproduce a game state or inspect a protocol result?”

Preserve fixture loading, multi-seat testing, and detailed protocol results for development use.

Recommended behavior:

- Organize Seats, Fixtures, and Protocol Checks into clearly separated sections or tabs.
- Identify fixture loading as creating/opening a different demonstration match. Explain the room change and provide a return path where supported; do not imply the previous match was erased.
- Keep HTTP codes, tokens, engine terminology, and idempotency details here.
- Make identity switching visibly a demo capability. Do not present it as normal authority to act for another friend.
- Keep room-changing tools outside the main path for ordinary bidding, trading, and operating.

Acceptance: developers retain convenient tools; ordinary players can complete their turns without encountering them.

## 4. Shared usability rules

These are contracts between rooms, not a requirement for identical headers or layouts.

| Area | Shared rule | Permitted room differences |
|---|---|---|
| Game facts | The same revision has the same cash, prices, holdings, bank, phase, and actor everywhere. | Summary badges versus detailed tables. |
| Identity | Viewer, active player, inspected perspective, president, and priority deal are distinct concepts. | Portraits, names, compact badges, and explanatory text. |
| Presence | “Online/connected” requires supported presence evidence; seated membership is separate. | Ambient signals on the table; compact indicators elsewhere. |
| Actions | Inspect, select, preview, commit, pass, finish, and return retain their meanings. | Cards, map gestures, tickets, and buttons. |
| Time | Historical game state and current social state are explicitly identified. | Compact table ribbon versus detailed Journal controls. |
| Navigation | A destination label accurately predicts its destination. | Physical hotspots on the table and practical room links elsewhere. |
| Feedback | Accepted moves, rejected moves, pending requests, and stale state have recognizable outcomes. | Short social animation versus precise financial feedback. |
| Accessibility | Essential state is available without color, hover, drag, or right-click alone. | Room-specific visual styling and density. |

Terminology proposal:

- Use Table, Private Company Auction, Stock Exchange, Map & Operations, and Journal as the destination names. The auction and exchange may continue sharing their existing financial workspace.
- Use Stock Round 1 and Operating Round 1.1 in full where space permits; SR 1 and OR 1.1 are acceptable compact equivalents. Never use an ambiguous “Round 1” where the round type matters.
- Use Phase 2 consistently. Reserve IR for Iyo Railway; remove the confusing “I.R. 2” phase presentation.
- Preserve official company identifiers. When a code such as TR occurs in both private and public contexts, add the entity type or full company name at the point of possible confusion.
- Label the revision consistently as Rev or Revision; do not reuse R in a way that can mean both round and revision in the same context.
- Distinguish bank cash from total money supply. At the reviewed four-player initial state, bank cash is ¥5,320 and total money supply is ¥7,000; derive displayed figures from the applicable state.
- Use real timestamps with one explicit display-time policy. Recommended default: each viewer's local time with a visible timezone; use stored instants for ordering. Do not mix invented evening times, host-local clock strings, and UTC substrings. Mark missing historic timestamps as unknown rather than inventing them.

Bilingual proposal: keep shared destination names and primary action meanings consistently bilingual where the existing presentation supports it. Long strategy/rules explanations may remain English in this iteration. Japanese terminology needs review before being treated as finalized. Do not shrink essential financial information to make decorative translations fit.

## 5. Transitions and cancellation

| Transition | Expected result | State to preserve or revalidate |
|---|---|---|
| Table → Auction/Exchange | Open a useful financial view for the displayed round. | Viewer, viewed revision, meaningful previous layout and selection. |
| Table → Map | Inspect the board; show operating guidance only when applicable. | Viewer, revision, prior map camera/selection unless an explicit hotspot supplies a new target. |
| Exchange → Company Map | Center on the selected corporation/home with the correct perspective. | Corporation, revision, and return-to-exchange context. |
| Work room → Table | Return to the gathering without changing game state or identity. | Revision and room arrangement for a subsequent return. |
| Journal entry → Inspect position | Open the relevant historical position explicitly. | Entry, revision, and Journal return path. |
| Any room → History | Clearly identify read-only game state. | Current inspection room and relevant layout; clear/revalidate live transaction previews. |
| History → Live | Refresh the chosen room at the latest authoritative revision. | Inspection preferences; never carry a stale executable transaction forward silently. |
| Live round change | Announce the round. Following live work in the ending round's room hands off to the next work room with a short wipe. Table, Journal, historical inspection, unrelated rooms, and open dialogs stay put with an explicit destination where appropriate. | Inspection preferences and room layouts; no preview is submitted. Motion-off and reduced-motion users receive the same announcement without a wipe. |
| Modal close | Return to its invoking room. | Selection, layout, revision, and prior focus. |

Recommended Escape hierarchy: close the top modal; otherwise cancel a staged preview; otherwise close a focused temporary inspection panel; otherwise pause active replay; otherwise return to Table. Each press performs one clear action. Back to Table remains an explicit one-click exit. Review this against the existing shortcut behavior before implementation.

Window behavior proposal: preserve arrangements across room visits in the current session, keep a simple Restore Layout control, and avoid persisting custom geometry across reloads until viewport-change behavior is proven. The exchange can start with a comparison panel; the map can start map-only. Those different defaults serve their purposes.

Owner-requested refinement, 16 October 2026: round changes need a visible handoff, especially Stock → Operations. Live work rooms now follow the next round; the social table announces it without moving the gathering. Ordinary room navigation uses a lighter, non-blocking wipe. This does not alter the historical-scrubbing contract in D4.

## 6. Decisions to settle before affected implementation

The recommended defaults below were adopted under the owner's instruction to execute this plan. They remain documented product choices that can be revisited with evidence from play.

| ID | Decision | Recommended default | Tradeoff / alternative |
|---|---|---|---|
| D1 | Does every room need identical global chrome? | Preserve room-specific headers; share identity, fact, state, and navigation meanings. | An identical header is easier to template but consumes scene space and weakens the social room. |
| D2 | Should the map and operating desk be separate destinations? | One Map & Operations destination with an inspection/acting distinction. | Separate destinations may improve explicitness but duplicate geographic context. |
| D3 | What does selecting a Journal entry do? | Select revision in place; use an explicit Inspect Position action to open another room. | Automatic navigation is faster for a single event but interrupts scanning and comparison. |
| D4 | What changes when scrubbing crosses rounds? | Preserve the room; permit the shared financial workspace to adapt between auction and stock presentations. | Following historical rooms everywhere creates a more cinematic replay but moves the player away from chosen analysis tools. |
| D5 | Are legal operating shortcuts retained? | Yes; show advancement/skipped-step consequences beside them. | A strict wizard teaches sequence but increases friction and removes supported flexibility. |
| D6 | Do social notes and stamps rewind with the game? | No; explicitly show the current gathering while game state rewinds. | Historical social replay requires new timestamped event capture and is a separate feature. |
| D7 | How much window customization persists? | Session-level arrangements with reset; cautious reload persistence later. | Permanent layouts are convenient but need robust recovery on different display sizes. |
| D8 | Which clock does the UI use? | Viewer-local time with timezone, based on stored instants. | JST provides a common club clock; either is coherent if applied consistently. |
| D9 | How bilingual is this iteration? | Shared navigation and primary actions; review vocabulary, retain readable room-specific detail. | Full bilingual rules help more users but materially expand content work. |

## 7. Delivery sequence

Each slice has a reviewable result and an exit condition. Keep application changes within the frontend and bridge unless a separately confirmed engine defect requires another scope decision. Preserve existing working-tree edits and saved matches.

### Slice 0 — Establish the current baseline and agree room contracts

Work:

1. Review D1–D9 and record accepted choices or revisions in this document.
2. Reproduce all room entry paths, including direct fixture entry, auction-to-stock transition, observer mode, and rewind across round boundaries.
3. Capture the actual current behavior at all three target desktop sizes. Use isolated demonstration matches and do not make moves in an existing user match.
4. Mark each original finding Confirmed, Already addressed, Intentional difference, or Needs product decision.
5. Record any additional issue exposed by the baseline, including whether presence indicators are supported and how current social state appears during game rewind.

Deliverable: a confirmed issue register linked to room purpose, plus annotated current screens. Exit: agreed room contracts and reproducible issues; no speculative layout rewrite.

### Slice 1 — Correct shared facts, identity, and misleading labels

Work: reconcile bank/money-supply labels, phase and round names, company-type context, observer perspective, presence claims, and selection-versus-submission wording. Define a consistent timestamp policy and mark unavailable data honestly.

Keep each room's arrangement. Before introducing shared helpers, identify which values actually need one source of presentation truth. Avoid building a generic UI system for cosmetic reuse.

Deliverable: small, focused corrections with before/after examples. Exit: the same revision is described accurately in every room and observers are never mistaken for actors.

### Slice 2 — Make navigation and historical state predictable

Work: resolve Operating View/Journal destination mismatch; implement agreed room transitions, history indicators, explicit Journal inspection, Return to Live, staged-action revalidation, and modal/Escape behavior. Label current gathering state during rewind. Ensure new live moves never interrupt historical inspection.

Deliverable: a documented transition walkthrough using the same room/revision across roles. Exit: every transition in section 5 has a clear result and no navigation action mutates the game.

### Slice 3 — Refine auction and stock decisions

Work: make auction selection/offer/commitment distinct; clarify bidding and escrow; verify useful exchange entry; provide comparison/reset layouts; clarify certificates, source, settlement, personal holdings, and Pass versus Finish Turn.

Retain illustrated auction cards and exchange reference windows. Review each room separately rather than applying one composition to both.

Deliverable: auction and stock decision walkthroughs with clear before/after monetary consequences. Exit: a player can describe the commitment before submission and inspect alternatives without losing context.

### Slice 4 — Refine map inspection and operating agency

Work: distinguish inspect/preview/commit; provide keyboard inspection; separate selected corporation from acting corporation; clarify treasury and step context; retain legal shortcuts with their consequences; keep selected-hex action validation and rejection feedback accurate.

Deliverable: walkthroughs for map inspection outside operation, a staged tile, a cancelled preview, an operating shortcut, and an observer watching the same turn. Exit: no player mistakes inspection for commitment or personal cash for corporate treasury.

### Slice 5 — Social room, modal, and desktop usability polish

Work: distinguish message/event/host-note types while retaining the combined social feed; refine membership/card access; organize developer tools; make close controls and focus behavior accessible; improve essential text sizes and overflow at target desktop sizes.

Use 14 px as a starting point for ordinary actionable text and 12 px for secondary prose, then assess actual readability. Cartographic and dense ledger annotations may differ if zoom or expansion gives an accessible readable equivalent. Do not solve density by reducing critical text to unreadable sizes.

Deliverable: room-by-room visual QA and a realistic returning-player walkthrough. Exit: key actions, costs, identity, and historical state remain readable and reachable; the table retains its social visual emphasis.

## 8. Verification and acceptance scenarios

Run the following journeys with an acting player, waiting player, and observer where applicable. Verify game effects in an isolated demonstration match. Some historical and social transitions are intentionally different; check their stated contract.

| ID | Scenario | Required outcome |
|---|---|---|
| A1 | Return after an absence | Identify actor, recent changes, and next destination without developer tools. |
| A2 | Inspect later auction company | Selection changes only presentation; current offer and existing commitments remain clear. |
| A3 | Place/raise bid, then inspect it from another client | Exact commitment appears consistently; no duplicated accepted action. |
| A4 | Auction finishes | Useful stock information appears on entry; a viewer in another room is not forcibly moved. |
| A5 | Compare and buy president's certificate | Price, 20% ownership, one certificate, total cost, and cash effect agree. |
| A6 | Observe another player's stock decision | Perspective names are explicit; submission is unavailable to the observer. |
| A7 | Inspect map during auction/stock | Geography and powers remain useful; no claim that construction can be committed now. |
| A8 | Stage, rotate, cancel, and commit a tile | Previews do not change state; committed tile/cost agree across clients. |
| A9 | Advance using a legal operating shortcut | Skipped opportunities are explained; behavior matches server rules. |
| A10 | Inspect another corporation during operation | Operating submissions remain tied to the active corporation. |
| A11 | Select a Journal event and inspect its result | Selected revision and return path remain clear; no accepted action is created. |
| A12 | Rewind across auction, stock, and operation | Agreed room behavior holds; historical action controls cannot commit gameplay. |
| A13 | A new live move arrives during rewind | Historical inspection remains fixed; latest revision/new-move notice updates. |
| A14 | Return to Live with a staged historical/live preview | Latest state appears; stale preview is cleared or revalidated, never submitted automatically. |
| A15 | Open/close card or developer modal; use Escape | One level is dismissed; room, revision, and focus return predictably. |
| A16 | Inspect gathering notes during game rewind | Current social state is labelled correctly and retains role permissions. |
| A17 | Resize between supported desktop sizes | Actions remain reachable; windows recover; layout reset works; facts stay readable. |
| A18 | Two players and an observer inspect the same revision | Bank, cash, holdings, prices, phase, actor, and timestamps agree; personal perspective differs explicitly. |

Automation should protect meaningful behavior: historical no-submit guards, actor/perspective projection, revision changes, shortcut consequences, and non-mutating previews. Use visual/manual review for composition, room character, readability, and comparing workspaces. Avoid tests that merely assert every room has identical markup.

For implementation slices, use the existing frontend build and relevant tests, then run the documented application test suite when shared state/bridge behavior changes. Add targeted behavioral coverage where existing tests do not protect the changed contract. The planning task itself makes no application changes and does not claim new test results.

Desktop QA: 1366×768, 1440×900, and 1920×1080, at ordinary browser zoom. Check keyboard-only access, visible focus, reduced motion, overflow cues, reachable primary actions, and sufficient contrast. If an unsupported smaller viewport is encountered, provide graceful scrolling rather than hiding critical controls.

## 9. Implementation touchpoints and safeguards

| File / area | Likely responsibility |
|---|---|
| `src/main.js` | Room transitions, round/window synchronization, identity controls, live/history state, Escape and modal return behavior. |
| `src/scene/ClubRoom.js` | Social composition, physical destinations, summary labels, mixed activity, table replay, gathering entry points. |
| `src/components/StockExchange.js` | Auction context, selection versus bid labels, comparison windows, perspectives, certificate/settlement ticket. |
| `src/components/HexMap1889.js` | Inspection/preview/commit affordances, corporation contexts, operating instructions, legal shortcuts, map window behavior. |
| `src/replay/TimelineBar.js` | Journal selection, revision context, explicit position inspection, replay/live navigation. |
| `src/components/Modals.js` | Membership/current gathering explanation, developer organization, accessible close/focus. |
| `src/constants1889.js` | Reviewed shared terminology and entity context where appropriate. |
| `src/style.css` | Room-specific readability, layout, contrast, overflow, focus, and window recovery. |
| `src/api/client.js` and `server_bridge.py` | Only when needed for actual shared facts, timestamps, projection, or supported state; preserve public contracts and saved data. |
| `daemon18xx/app/engine1889` | Reference for legal behavior. Do not change rules to make the UI more uniform. |

Before coding, inspect applicable repository instructions, record the existing working-tree state, and reconcile overlapping edits. Do not overwrite unrelated changes or regenerate the nested engine checkout as part of UI work. Preserve journals and stored snapshots; display corrections must not rewrite accepted action history without a separately justified migration plan.

## 10. Completion and review handoff

For each implemented slice, present the affected room's purpose, the concrete behavior changed, current screenshots or a short interaction recording, relevant checks and results, and any remaining product choice. Include an example of a room-specific feature deliberately preserved.

The full plan is complete when the acceptance scenarios pass, the decisions are recorded, and a returning player can move from social orientation to careful game decisions and historical inspection without ambiguity. Room differences that support those tasks remain part of the design.
