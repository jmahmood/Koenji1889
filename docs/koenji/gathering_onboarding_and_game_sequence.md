# Koenji Railway Club 1889 — Gathering Onboarding & Full Game Sequence

**Prepared:** 16 October 2026  
**Design update:** 16 October 2026 — character customization, house references, arrival choreography, host identity, and コマ送り animation direction. The 16 October design update recorded requirements. See the [17 October implementation and verification](onboarding_implementation.md) for delivered behavior, placeholder assets, and remaining acceptance work.  
**Scope:** End-to-end player journey from club entrance and seat onboarding through match start, full 1889 gameplay (including interrupts, negotiations, and market zones), asynchronous reconnection, and the final scoreboard.  
**Related Documents:** [`application_gap_review.md`](application_gap_review.md), [`room_usability_plan.md`](room_usability_plan.md), [`room_usability_implementation.md`](room_usability_implementation.md), and [`daemon18xx/docs/frontend_integration.md`](../../daemon18xx/docs/frontend_integration.md).

---

## 1. Purpose and Governing Principles

The original development baseline automatically opened a fixture and shared all-seat credentials. The current application has explicit gathering/invitation entry and isolated ordinary seat credentials; see [gap fixes and validation](gap_fixes_implementation.md). The full journey requires a complete lifecycle to create a gathering, invite friends, claim individual seats with private credentials, start the match, play through every 1889 rule and interrupt without UI dead-ends, and finish with a proper club scoreboard.

This document defines the **preliminary full sequence** so Codex can implement the onboarding/lobby flow and PR 5 gameplay controls as a cohesive experience:

1. **Clubroom hospitality over generic SaaS lobbies:** Entering the app should feel like arriving at the Koenji Railway Club door (*Genkan* · 玄関) and taking a seat at the wooden table—not filling out a corporate dashboard.
2. **Strict credential isolation in normal play:** Each player's browser stores only the credential(s) issued to or claimed by that person (`creator_token` for the host, one `player_token` for a seated player, or `spectator_token` for an observer). All-seat switching (`Demo Tools ⚙`) remains available only in explicitly launched development fixtures.
3. **Personal characters and a real place:** First-time players choose a face and clothes before entering the gathering. The entrance is based on the actual Koenji Boardgame Club house at 東京都中野区大和町3-34-2; ordinary guest login is presented as coming through its front door.
4. **コマ送り throughout:** All animation uses held static poses with abrupt, exaggerated frame changes, at a deliberately very low frame rate. No in-between frames, smooth transitions, tweening, or interpolated movement. The intended reference is the jerky, staccato photographic-pose style of 2010s Japanese train advertisements.
5. **Zero dead-end states:** Every state reachable in `daemon18xx/app/engine1889/engine.py`—including pre-start waiting rooms, `pending_discards`, `pending_special` (ER), out-of-turn `DR`/`MF` powers, bilateral `offer` negotiations, Brown/Orange/Yellow market zones, emergency train funding, and `finished` scoring—must have a clear, reachable UI state.

---

## 2. End-to-End Lifecycle Overview

```text
[First visit: Choose character face + clothes; preview and confirm]
          │
          ▼
[Stage 0: Club Entrance (Genkan) — guest login through the real house front door]
   ├── Resume saved gathering from local bookmark (1 click)
   ├── Arrive via Invite Link (#room=CODE&invite=... or token=...)
   ├── Host a New Gathering (2–6 players, gathering title)
   └── Open Solo / Development Fixture Sandbox (Demo Tools enabled)
          │
          ▼
[Stage 1: Pre-Game Gathering Table (status = "waiting")]
   ├── Host shares Seat Invite Links (or Room Code + Seat Claim) & Observer Link
   ├── Friends claim seats (p1..pN), set display names, use their chosen face/clothes, stamp Membership Card, post tea/arrival notes
   └── Host clicks "Open the Shikoku Ledger (Start Match)" -> POST /api/1889/games/{room}/start
          │
          ▼
[Stage 2: Match Initialization (Revision 0 · Private Company Auction)]
   ├── Engine allocates cash (¥420 for 2–4p, ¥390 for 5–6p), filters privates (SIR/UTF), sets p1 Priority
   └── Brass/ink handoff announces Private Company Auction; table lantern highlights p1
          │
          ▼
[Stage 3: Full 1889 Gameplay Loop (Revisions 1..N)]
   ├── 3.1 Opening Private Auction (Buy offered, Escrow Bid, Pass, Clockwise Runoff, early MF Port lay)
   ├── 3.2 Stock Rounds (Par + 20% President, 10% IPO/Pool, Market Zone rules, Block Sales, DR Exchange)
   └── 3.3 Operating Rounds (Track, Token, Route Quote vs. Commit, Dividends, Trains, Offers, ER/Discards/Emergency)
          │
          ▼
[Stage 4: Asynchronous Reconnection, Presence & Replay]
   ├── Heartbeat presence (online vs. seated/away via last_seen_at)
   ├── Non-mutating Timeline & Journal scrub with queued live-move counter
   └── Gathering notes & one-per-gathering hanko stamp
          │
          ▼
[Stage 5: Match Completion & Final Club Ledger (round = "finished")]
   ├── Triggered by Bank exhaustion (end of OR set) or Player Bankruptcy (immediate)
   ├── Final Scoreboard modal & table summary (Cash + Stock Value + Open Privates = Net Worth)
   └── Read-only board/market/journal inspection + "Host Next Gathering" action
```

---

## 3. Detailed Sequence by Stage

### Stage 0 — Arrival & Session Resolution (Club Entrance · 玄関)

#### 0.1 First-Time Character Setup

- The first onboarding step for a new player is **Define Your Look**, before their first house-entry presentation and appearance at the gathering table. Let them select a **face** and **clothes** independently, preview the combined character, and confirm it.
- Generate a sufficiently varied library of selectable face sprites; the exact count and range will be decided when reference photos are supplied. Photo submission is not a prerequisite for recording this flow or for choosing from the eventual sprite library.
- Design sprites as compatible face and clothing components (or equivalent composable variants), with consistent alignment, scale, and pose coverage. A player's chosen look must carry through the preview, entrance/arrival poses, and seated character rather than reverting to a generic sprite.
- Persist stable face/clothing identifiers in the player’s browser for reuse across gatherings and include their selected appearance in the gathering projection for other viewers. Offer an explicit option to change the look before entering; returning players otherwise reuse their saved look without repeating setup. Cross-device synchronization is deferred. Clothing choices are **Meiji-inspired**.
- Character appearance, host authority, and resident arrival route are separate properties. Choosing a face or outfit must not grant a role or select a resident identity.

#### 0.2 House and Front-Door Reference

The Koenji Boardgame Club took place at the house where the project owner lived: **東京都中野区大和町3-34-2**. Ordinary guest login/entry should feel like approaching this house and coming through its front door. Use the supplied photographs as visual references for the illustrated entrance, not as an instruction to display the address in the interface.

- [House exterior reference](references/koenji_house_exterior.png): cream square-pattern exterior, dark trim, and balcony above the recessed entrance.
- [Front-door reference](references/koenji_house_front_door.png): dark narrow door beneath the balcony overhang, tiled step, circular wall light, mailbox, and exposed dark downpipe. This closer view is the principal entrance reference.
- Preserve these references for later scene/asset work. Character reference photos and references for the kitchen and downstairs bedroom will be supplied later.

#### 0.3 Session Resolution

When a browser loads the application (`bootstrapSession` in `src/main.js`):

1. **Check URL Fragment / Query for Invite Credentials:**
   - Support `#room=ABC123&token=<bearer>&role=<player|spectator|creator>` (preferring URL hash fragments so tokens are never transmitted in HTTP `Referer` headers, while retaining backward compatibility with `?room=...&token=...`).
   - Immediately strip the raw token from the browser's address bar via `window.history.replaceState` and store the credential in `sessionStorage` (active tab session) and `localStorage` (`koenji_1889_my_gatherings_v1[roomCode]`, which stores only *this user's* token and seat, never the full `player_tokens` array unless the room is flagged `is_demo_fixture: true`).
2. **Check Active Tab Session (`sessionStorage`):**
   - If the tab already has a bound `{ room_code, token }`, fetch `GET /api/1889/games/{room}` and resume directly in that room (whether `waiting`, active, or `finished`).
3. **Present the Club Entrance Screen (No Active Tab Session):**
   - Do **not** auto-create a fixture room on initial visit. Instead, render the **Koenji Club Entrance** card over the illustrated house/front-door backdrop based on §0.2 with four clear options:
     - **Resume Recent Gathering:** Lists any rooms saved in `koenji_1889_my_gatherings_v1` with room code, gathering title, viewer's seat/role, and a one-click **Re-enter Clubroom** button.
     - **Host a New Gathering:** Form to select player count (`2–6`, default `4`), optional Gathering Title (default `"Autumn Koenji Session · 高円寺例会"`), and whether the host is taking Seat 1 (with their display name) or acting as a non-playing Club Host.
     - **Join a Gathering:** Input for a 6-character Room Code (plus seat claim or personal token) or paste of an invite link.
     - **Open Development Sandbox (Fixtures):** Explicitly creates a demo fixture (`auction_start`, `stock_round_1`, `stock_round_active`, or `operating_round_1`) with `is_demo_fixture: true` and all-seat switching enabled.

---

### Stage 1 — Hosting, Invitations & Pre-Game Gathering Table (`status: "waiting"`)

#### 1.1 Backend Lobby Support (`server_bridge.py`)

`POST /api/1889/games` creates a waiting room; the current bridge already returns a waiting projection from `GET /api/1889/games/{room}`. The following describes the lobby contract, including the 17 October claim-based start requirement:

1. **Waiting-State Projection on `GET /api/1889/games/{room}`:**
   - When `game["status"] == "waiting"`, return `HTTP 200` with a pre-game view payload instead of `HTTP 409`:
     ```json
     {
       "room_code": "K89SHK",
       "status": "waiting",
       "max_players": 4,
       "seats": [
         { "seat_index": 0, "player_id": "p1", "name": "Daisuke", "claimed": true, "online": true },
         { "seat_index": 1, "player_id": "p2", "name": "Player 2 (open)", "claimed": false, "online": false }
       ],
       "viewer": { "role": "player", "player_id": "p1", "player_name": "Daisuke", "can_start": true },
       "club": { "gathering_title": "Autumn Koenji Session", "stamps": {}, "notes": [] }
     }
     ```
2. **Seat Claim & Name Binding (`POST /api/1889/games/{room}/claim` or `/seat`):**
   - Support two ways for friends to take their seats before `/start`:
     - **Direct Seat Invite Link:** The host copies seat-specific invite links (`#room=K89SHK&token=<player_token_i>`) generated from the `POST /api/1889/games` creation response. When Player $i$ opens their link, they authenticate with `<player_token_i>` and submit their display name (`POST /api/1889/games/{room}/seat` with `{ "player_name": "Haruka" }`), marking seat $i$ as claimed.
     - **Room Code Seat Claim:** A player enters room code `K89SHK`, views the open seats in the waiting room, picks an unclaimed seat (`0..max_players-1`), enters their name, and receives *only* that seat's `player_token` (once claimed, that seat cannot be claimed by another anonymous request).
   - If the host also plays Seat 1 (`p1`), the host's client stores both `creator_token` (used exclusively for the **Start Match** call) and `player_tokens[0]` (used for all gameplay and polling).
3. **Host Identity and Start Authority:**
   - Clearly label the gathering creator **Host** in the waiting-room roster and beside their character/name when seated; keep the label visible during play. Show a separate host identity when the host is not playing.
   - Host is a gathering role, independent of seat order, current turn, appearance, or residency. A resident is not automatically the host, and Seat 1 is not itself proof of host authority.
   - Only the host sees actionable start/seating/invitation controls; the server must enforce creator authority rather than relying on hidden buttons. Other players see who is hosting and a clear waiting-for-host state once enough players are ready.
4. **Starting the Match (`POST /api/1889/games/{room}/start`):**
   - Once every configured seat `0..max_players-1` is claimed and has a distinct non-empty name, the host chooses when to start; arrival never auto-starts the game. Players do not all need to be online, and there is no separate Ready button. A host-entered name alone does not count as a seat claim. Enforce this readiness rule on the server as well as in the UI. The host clicks **Open the Shikoku Ledger (Start Match)**.
   - The server calls `new_game(player_names)`, saves `Revision 0` in `game_states` and `game_actions`, transitions `games.status` from `"waiting"` to `"active"`, and returns the initial live game view.

#### 1.2 Pre-Game Club Table UI (`src/scene/ClubRoom.js`)

While `status === "waiting"`:

- Render the **Koenji Club Table** with the `max_players` chairs around the table. Claimed seats show the member's character sprite, name plaque, and live presence indicator; unclaimed seats show an empty cushion with **"Seat Open · Waiting for Member"** (and a **Copy Seat Invite Link** button for the host).
- Allow seated members to open the **Membership Card** to stamp their hanko for the evening and post **Table Notes** ("Arrived with warm sake") while waiting for the last player.
- Display the **Host Gathering Controls** card on the table felt for the creator:
  - Copyable **Seat Invite Links** (Seats 1–$N$) and **Guest Observer Link**.
  - Option to reorder seats or randomize initial seating order before starting.
  - Primary button: **Start 1889 Match (Open Private Auction)** (enabled when all configured seats are claimed and their names are distinct and non-blank, regardless of current online presence; only the host can activate it).

---

### Arrival Choreography — Guests, Residents & Mid-Game Joins

- **Ordinary guests:** Enter through the front door described in §0.2, then appear in the gathering using their selected face and clothes.
- **House residents:** Use an interior-origin arrival instead of the exterior/front-door sequence. **Yumiko emerges from the kitchen; the project owner emerges from the downstairs bedroom.** Bind these routes to the appropriate resident identities separately from host permissions. In the current implementation the host explicitly assigns the routes each gathering, including their own route at creation; names and face selections never imply residency. Reference photos will be provided when asset work begins; do not invent final likenesses or room layouts now.
- **Arrivals during an active game:** Show a simple arrival vignette at the **bottom right** of the current game screen. It should identify the arriving person, use their chosen look and guest/resident route, and leave the ongoing game and its controls usable. Arrival does not pause play, advance the turn, or automatically add a new playing seat to a match already in progress; late-player versus observer rules still need a separate decision.
- **Presence and reconnects:** Treat an arrival as a discrete event rather than playing the animation on every poll. Plan event identifiers/deduplication so repeated state updates do not replay it. Play the arrival animation only on the person’s first entry into that gathering. Later reconnects show a quiet “returned” notice without repeating the animation. Repeated polls and additional tabs must not create duplicate first arrivals or spurious returned notices.
- **All animation uses コマ送り:** Hold static photographic-style poses, then cut abruptly to the next exaggerated pose. Keep the frame rate very low, with no in-between frames, smooth transitions, fades, sliding, or tweening. Apply this to entrance, resident emergence, mid-game arrival, character reactions, and any animated round handoff or other scene/UI animation. Existing brass/ink handoffs and lantern cues must follow this direction if animated. Exact pose counts and hold durations will be set during asset prototyping.

---

### Stage 2 — Match Start & Opening Handoff (`Revision 0`)

1. When the host triggers `/start`, all polling clients observe `status: "active"` and `state.revision === 0` (`state.round === "auction"`).
2. The engine sets up starting capital (`¥420` each for 2–4 players; `¥390` each for 5–6 players; `¥7,000` total money invariant), removes player-count-restricted privates (`SIR` omitted in 2-player games; `UTF` omitted in 2–3-player games), and assigns Priority Deal and the opening turn to `p1`.
3. A brass/ink round handoff announces **"Private Company Auction Begins · 私有鉄道競売"** and invites the active player (`p1`) to open the **Private Company Auction** workspace.

---

### Stage 3 — Full Playable 1889 Match Sequence

Every round and interrupt below relies on `viewData.legal_actions`, `viewData.action_options`, `viewData.legal_tile_lays`, `viewData.market_zones`, and `viewData.route_quote` from `server_bridge.py`.

#### 3.1 Opening Private Company Auction (`round: "auction"`)

| Step | Actor | UI Control & Action Payload | Rules & Transition Behavior |
|---|---|---|---|
| **Inspect Concessions** | Any viewer | Click any private card (`TR`–`UTF`) or **Shikoku Map 🗺️** | Highlights reserved/special hexes (`K4`, `C4`, coastal towns, `I4`) without submitting a move. |
| **Buy Current Offer** | `state.current_player` | **Buy [Offered] for ¥X** → `{ type: "buy_private", company, price }` | Available when the lowest unsold private has 0 bids. Immediately awards the company and triggers the cascade check. |
| **Place Escrow Bid** | `state.current_player` | Select later unsold company, adjust bid (`≥ max(face, high_bid) + ¥5`), click **Place Bid ¥X** → `{ type: "bid", company, price }` | Escrows cash from the bidder immediately (`state.auction.bids[company][player]`). Resets consecutive pass count. |
| **Pass Auction Turn** | `state.current_player` | **Pass** → `{ type: "pass" }` | If all players pass with `TR` unsold, `TR` discount increases by `¥5` (at `¥0`, `p1` must take `TR` for free); if `TR` is already sold, all-pass pays private revenues (`_private_revenue`). |
| **Competitive Runoff** | `state.auction.bidders` (clockwise after high bidder) | **Raise Bid (+¥5 min)** (`{ type: "bid", company, price }`) or **Withdraw / Pass** (`{ type: "pass" }`) | Triggered automatically when the next unsold company has 2+ bids (`state.auction.active`). Non-bidders see a clear runoff observation banner. |
| **Early MF Port Lay** | Owner of `MF` (if already awarded) | Map → select unbuilt coastal town (`B11`, `G10`, `I12`, `J9`) → **Lay MF Port (#437)** → `{ type: "lay_tile", special: "MF", hex, tile: "437", rotation }` | Permitted during the auction whenever `legal_actions.choices.port_hexes` is non-empty. |

When the final private company is awarded, Priority Deal passes to the player after the final buyer and the match transitions to **Stock Round 1**.

#### 3.2 Stock Rounds (`round: "stock"`)

| Decision | Actor | UI Control & Action Payload | Required UI Behavior (Fixing Current Gaps) |
|---|---|---|---|
| **Float / Par a Corporation** | `state.current_player` | Select unparred corp (`corp.par === null`), choose Par (`¥65–¥100`), click **Set Par & Buy 20% President's Certificate** → `{ type: "buy_shares", corporation, price }` | Displays 1 certificate = 20% (`2 × par` cost). When 50% of IPO is sold (`ipo <= 50`), corporation floats and receives `10 × par` in treasury. |
| **Buy 10% (or Brown Block) Share** | `state.current_player` | Select parred corp, choose `IPO` or `Bank Pool`, select quantity (`10%`, or `10%–N%` in Brown zone), click **Confirm Purchase** → `{ type: "buy_shares", corporation, source, percent }` | Gate the Buy button using `viewData.action_options` and `viewData.market_zones`: allow **Yellow/Orange/Brown (`y`/`o`/`b`)** buys at the certificate limit, allow **Orange/Brown (`o`/`b`)** buys above 60% holdings, and allow repeat/multi-share buys in the **Brown (`b`)** zone during the same turn. |
| **Sell Share Block (SR 2+)** | `state.current_player` | Select owned parred corp, choose **Block Percentage (`10%`, `20%`, `30%`, …)** from legal `action_options`, click **Sell X% to Pool** → `{ type: "sell_shares", corporation, percent }` | **Critical:** Because 1889 allows only **one sale block per corporation per turn** (`turn.sales`), the ticket must provide a `10% / 20% / 30%...` block selector before selling, show the resulting stock-price drop (`1 row per 10%`), and indicate if presidency will transfer. |
| **Exchange Dougo Railway (`DR`)** | Owner of `DR` (in-turn **or out-of-turn**) | **Exchange DR → 10% IR (IPO)** → `{ type: "exchange_private", source: "ipo" }` | Render a persistent **Private Power Action Bar** whenever `viewData.legal_actions.types.includes("exchange_private")`, even when `!isViewerActiveTurn` or when `state.round === "operating"`. |
| **Finish Turn / Pass** | `state.current_player` | **Finish Turn** (`{ type: "end_turn" }`) after acting, or **Pass Stock Turn** (`{ type: "pass" }`) | If the player exceeds the certificate limit or a 60% holding limit (after a stock drops out of Orange/Brown), display a clear prompt that excess shares must be sold before ending the turn. |

#### 3.3 Operating Rounds (`round: "operating"`), Negotiations & Mandatory Interrupts

Corporations operate in descending share-price order (`state.or_order`). At the start of each Operating Round, open private companies pay their revenue and newly floated corporations place their free home station automatically.

1. **Interrupt Priority Banner (Always Checked First in Map & Exchange):**
   - Before rendering normal step controls for `state.current_corporation`, check for active interrupts:
     - **Ehime Railway (`ER`) Special Tile Interrupt (`state.pending_special`):**
       - Active Actor: `state.pending_special.player` (the player who just sold `ER` to the operating corporation).
       - UI: Regardless of `state.operating_turn.step`, render a dedicated **ER Seller Interrupt Ticket** for `pending_special.player` with two explicit actions:
         1. **Preview & Confirm Green Tile (`#12, #13, #14, #15, #205, #206`) on `C4` (Ōzu):** `{ type: "lay_tile", special: "ER", hex: "C4", tile, rotation }`.
         2. **Decline / Pass Special Tile Lay:** `{ type: "pass" }`.
     - **Excess Train Discard Interrupt (`state.pending_discards`):**
       - Active Actor: The president(s) of any corporation listed in `state.pending_discards` after a phase change lowers the train limit (`4 → 3` in Phase 4; `3 → 2` in Phase 5).
       - UI: Render a mandatory **Discard Excess Train** card listing each excess corporation's owned trains from `viewData.action_options` and submitting `{ type: "discard_train", corporation, train }`.

2. **Normal 5-Step Corporate Operating Turn (`isOperatingPresident`):**
   - **Step 1 — Track (`lay_tile` or `skip`):** Click a highlighted hex (`viewData.legal_tile_lays`), cycle through legal tile IDs and rotations on the map, and confirm `{ type: "lay_tile", hex, tile, rotation }` (with `SMR` mountain discount applied automatically).
   - **Step 2 — Station Token (`place_token` or `skip`):** Select a connected city hex with an open token slot and confirm `{ type: "place_token", hex, city: 0 }` (`¥40` from corporate treasury).
   - **Step 3 — Routes (Quote Preview vs. Commit):**
     - **Preview / Quote Optimal Route (Non-Mutating):** Display `viewData.route_quote` (`routes` and `revenue`) on the map and in the Trains & Routes window automatically (or via `POST /api/1889/games/{room}/route-preview` when testing custom train paths) *without* submitting a game move.
     - **Commit Routes (`run_best_routes` or `run_routes`):** Click **Commit Optimal Routes (¥X)** (`{ type: "run_best_routes" }`) or submit a manual route selection (`{ type: "run_routes", routes }`). If an `MF` or `ER` tile lay changes the board before dividends are paid, allow re-submitting routes (`§8.3`).
   - **Step 4 — Dividends (`dividend`):** Choose **Pay Dividend** (`{ type: "dividend", payout: true }`) or **Withhold to Treasury** (`{ type: "dividend", payout: false }`).
   - **Step 5 — Train Purchases, Diesel Trade-Ins & Emergency Financing:**
     - **Depot Train Purchase:** Buy an available train (`{ type: "buy_train", train }`).
     - **Diesel Trade-In (`Phase 6 / D`):** When `D` trains are available and the operating corporation owns a `4`, `5`, or `6` train, display a **Trade In `[4/5/6-train]` for Diesel (`¥800` instead of `¥1,100`)** option (`{ type: "buy_train", train: "D-...", trade_in }`), which is also legal when the corporation is already at the 2-train limit.
     - **Emergency Train Financing (`emergency_sell`) & Bankruptcy (`bankrupt`):** When the corporation has 0 trains, has a valid route (`route_candidates`), and `corp.cash < cheapest_depot_train`:
       - Display an **Emergency Train Financing** panel showing the shortfall (`cheapest_price - corp.cash`), the president's personal cash (`player.cash`), and legal emergency share-sale blocks from `viewData.action_options` (`{ type: "emergency_sell", corporation, percent }`).
       - Once `corp.cash + player.cash >= cheapest_price`, enable **Buy `[Cheapest Train]` with Presidential Contribution (`¥shortfall`)** (`{ type: "buy_train", train }`).
       - If total legal emergency sales + `player.cash` + `corp.cash` cannot reach `cheapest_price`, enable **Declare Bankruptcy (`{ type: "bankrupt" }`)**.

3. **Out-of-Turn & Cross-Controller Actions During Operating Rounds:**
   - **Private Company Purchases (`Phases 3–4`) & Corporate Train Transfers:**
     - **Same-Controller Direct Transfer:** If the operating president already owns the target private company (or is also president of the selling corporation for a train), render a direct **Buy `[Private / Train]` for `[Operating Corp]`** control with a price input (`0.5×–2×` face value for privates; `≥ ¥1` for trains), submitting `{ type: "buy_private", company, buyer, price }` or `{ type: "buy_train", train, price }`.
     - **Two-Player Negotiated Transfer (`offer` → `buy_private` / `buy_train`):** When the seller and buyer are controlled by different players, either party can submit `{ type: "offer", kind: "private" | "train", item, seller, buyer, price }`. Active offers appear in `state.offers` on both players' screens with a one-click **Accept & Execute Purchase (`¥price`)** button for the counterparty.
   - **Mitsubishi Ferry (`MF`) & Dougo Railway (`DR`):**
     - The owner of `MF` sees the **Lay MF Port (#437)** control on eligible coastal towns (`B11`, `G10`, `I12`, `J9`) during any window permitted by `legal_actions.choices.port_hexes`.
     - The owner of `DR` can trigger **Exchange DR → 10% IR** from the Private Powers window or Stock Exchange whenever `legal_actions.types` includes `"exchange_private"` (which immediately updates `IR`'s presidency and `current_player` if `IR` is currently operating!).

---

### Stage 4 — Asynchronous Play, Presence, Replay & Club Culture

1. **Honest Presence Indicators (`server_bridge.py` + `ClubRoom.js`):**
   - `verify_token` in `server_bridge.py` already updates `players.last_seen_at = CURRENT_TIMESTAMP` on every authenticated poll.
   - Compute `online: (now - last_seen_at) <= 15s` in `project_view` so the UI distinguishes **Seated & Online now** from **Seated · Last seen 14m ago** without fabricating WebRTC presence.
2. **Non-Mutating History & Replay (`TimelineBar.js`):**
   - Any seated player or observer can scrub to `Revision 0..liveRevision`, step through moves at `1× / Fast / Instant`, or inspect past snapshots in the **Journal (`棋譜`)** while live moves accumulate in `queuedLiveCount` (`Return to Live (+N new)`).
3. **Gathering Traditions (`Modals.js`):**
   - Seated members can stamp their **Koenji Membership Card** once per gathering and post timestamped notes in the table feed at any point during the evening.

---

### Stage 5 — Match Completion & Final Club Ledger (`round: "finished"`)

When `state.finished === true` (via `end_reason: "bank"` at the end of an Operating Round set, or immediately via `end_reason: "bankruptcy"`):

1. **Final Scoreboard Presentation (`src/components/Modals.js` & `src/scene/ClubRoom.js`):**
   - Automatically present (and allow re-opening from the Club Table and Topbar) the **Koenji Railway Club Final Ledger (最終決算報告)**:
     - **Match Outcome Header:** States whether the match concluded by **Bank Exhaustion (`銀行破산・規定OR終了`)** or **Presidential Bankruptcy (`破産終了`)** at Revision `N`.
     - **Ranked Player Standings Table (1st to $N$th by `state.result[pid]`):**
       - **Rank & Member Name** (highlighting the winner with the Club Trophy / Lantern seal and marking any bankrupt player).
       - **Personal Cash (`¥`)**
       - **Public Portfolio Value (`¥`)**: Itemized breakdown of each corporation held (`holdings[pid]% × final_price`).
       - **Open Private Concessions (`¥`)**: Face value of any open private companies still owned by that player (`UTF`, or all privates if ended before Phase 5).
       - **Total Net Worth (`state.result[pid]`)**.
2. **Post-Match Inspection & Next Gathering:**
   - Keep **Map & Operations**, **Stock Exchange**, and **Journal / Timeline Replay** open in read-only mode so the group can review the final board and scrub through the match history.
   - Provide a **Host Next Gathering** button that returns to the Stage 0 Host Gathering flow with the current group's player names pre-filled.

---

## 4. Recommended Implementation Order for Codex

This original phase breakdown records the sequence behind the delivered gameplay/lobby work. Phases A/B and the basic Phase C lobby are covered by [gap fixes and validation](gap_fixes_implementation.md); the new appearance/arrival work is covered by [onboarding implementation](onboarding_implementation.md). Do not interpret this list as a request to rebuild delivered controls.

To deliver this full sequence cleanly alongside the gameplay gap fixes in [`application_gap_review.md`](application_gap_review.md):

1. **Phase A — Gameplay Completeness & No-Dead-End Controls (`StockExchange.js`, `HexMap1889.js`, `main.js`, `server_bridge.py`):**
   - Wire `viewData.action_options` and `viewData.market_zones` into `StockExchange.js` and `HexMap1889.js`:
     - Add `discard_train` UI for `state.pending_discards`.
     - Fix `state.pending_special` (ER) so the seller can `pass` or `lay_tile` on `C4` during any operating step.
     - Add block-percentage selector (`10%..50%`) for `sell_shares` and Brown-zone `buy_shares`; relax client buy guards for Yellow/Orange/Brown zones.
     - Allow `exchange_private` (`DR`) whenever `legal_actions.types` includes `"exchange_private"` (including Operating Rounds and out of turn).
     - Add `emergency_sell`, `bankrupt`, Diesel `trade_in`, and `offer` / `buy_private` / cross-corp `buy_train` negotiation controls.
     - Separate non-mutating route preview (`viewData.route_quote` / `/route-preview`) from committing `run_best_routes` (and optional manual `run_routes`).
2. **Phase B — Final Scoreboard (`ClubRoom.js`, `Modals.js`, `main.js`):**
   - Render the **Final Club Ledger** scoreboard from `state.result`, `state.end_reason`, player cash, holdings, and open privates whenever `state.finished === true`.
3. **Phase C — Club Entrance, Waiting Table & Seat Onboarding (`server_bridge.py`, `client.js`, `main.js`, `ClubRoom.js`, `Modals.js`):**
   - Add `status: "waiting"` projection to `GET /api/1889/games/{room}` and seat-claim/name-update support (`POST /api/1889/games/{room}/seat`) in `server_bridge.py`.
   - Replace automatic `loadFixturePreset('auction_start')` on cold boot with the **Stage 0 Club Entrance** (Host Gathering, Join Gathering, Resume Saved Gathering, or Open Development Sandbox) and **Stage 1 Pre-Game Waiting Table** with per-seat invite links and private per-browser token storage.
   - Build first-time face/clothing selection and composable sprite support before the house-entry presentation; project each member's selected appearance to the table and arrival scenes.
   - Use the preserved house/front-door references for guest entry; reserve kitchen and downstairs-bedroom emergence routes for Yumiko and the project owner, pending their reference photos.
   - Add explicit host labels and server-enforced start authority, with start readiness based on all configured seats being claimed, without requiring simultaneous online presence or a separate Ready button.
   - Add deduplicated bottom-right arrival vignettes during play and use コマ送り for all animation, including existing handoffs.
   - Compute real `online` status from `last_seen_at` in `server_bridge.py`.
4. **Phase D — End-to-End Verification:**
   - Add an integration test in `tests/test_koenji_vertical_slice.py` covering room creation → seat claim/start → ER interrupt → phase-change train discard → emergency sale / endgame score projection, and verify a complete browser match from Stage 0 to Stage 5.


## 5. Confirmed Product Decisions

Confirmed by the owner on 16 October 2026:

1. **Start readiness:** All configured seats must be claimed before the host starts. Players need not all be online. No separate Ready button.
2. **Appearance persistence:** Remember face and clothes in the same browser across gatherings, with an option to edit before entering. Cross-device synchronization can wait.
3. **Clothing direction:** Meiji-inspired outfits.
4. **Reconnects:** Animate first entry once per person per gathering; use a quiet “returned” notice for later reconnects, without replaying the animation.

## 6. Agreed Acceptance Checklist

These are the agreed acceptance criteria. See [implementation and verification](onboarding_implementation.md) for evidence and remaining limits; this checklist alone is not a claim that every criterion has been fully verified:

1. A new player chooses a face and Meiji-inspired clothes, enters, reloads, and retains the look. The same browser offers it in later gatherings, with an option to edit before entering.
2. Reordering seats preserves each person’s appearance, credentials, host identity, and resident arrival route.
3. Only the host can start, and only after all configured seats are claimed with distinct non-empty names. Offline claimed players do not block start; no Ready button is required. UI and server enforce the same rule.
4. Ordinary guests enter through the referenced front door; Yumiko emerges from the kitchen and the project owner from the downstairs bedroom.
5. Simultaneous arrivals never cover or interrupt a pending gameplay decision. Bottom-right presentation must accommodate existing action controls, remain dismissible, and handle multiple arrivals.
6. Repeated polling, multiple tabs, reconnects, and game rewind do not produce unwanted arrival replays. First entry animates once per person per gathering; later reconnects receive a quiet returned notice. Arrival handling preserves the viewed room and revision.
7. Motion Off and system reduced-motion preferences provide the same arrival and round information without animation. All enabled animation follows コマ送り.
8. Existing saved gatherings load with sensible appearance defaults and preserve their game state and credentials.

## 7. Deferred Asset and Product Decisions

Before building the corresponding assets and behavior, settle:

- Face-library size/range, the initial Meiji-inspired clothing catalogue, and reference photos.
- Kitchen and downstairs-bedroom references and resident identity binding.
- What an arrival during an active match may do beyond observing or resuming an existing seat.
- コマ送り pose counts/hold durations, arrival queue timing, and layout details.

The full human multiplayer playtest remains an outstanding product acceptance activity, as documented in [gap fixes and validation](gap_fixes_implementation.md).
