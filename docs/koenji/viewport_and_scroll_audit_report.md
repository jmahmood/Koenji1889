# Koenji 1889 — Single-Page Viewport Fit, Chrome Compaction & Scroll Audit Report

**Resolved — all 10 screens and modal workspaces now allocate `71%–84%` of the window to their primary workspace and fit on a single screen at `1366×768` and `1280×720` without scrolling.**

In the initial audit (captured in `docs/koenji/validation/audit-fail-*.png`), **73% to 78% of the vertical viewport (`564px–598px` out of `768px`) was consumed by stacked chrome bars**, including `168px` of permanently reserved empty slots (`.action-feedback-slot` `32px`, `.character-event-notice` `36px`, and `.arrival-dock` `100px`), a full-width second line inside `.decision-navigation` caused by `.confirm-button { width: 100% }` on `[DR power · Exchange for 10% IR]`, and a `96px`-tall `.market-top-deck`. That left only **`132px–204px` (`17%–26%` of the window)** for the actual game board, corporation table, or order ticket.

Following the high-density chrome and viewport compaction across [`src/style.css`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/style.css), [`src/main.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/main.js), [`src/ui/presentation.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/ui/presentation.js), and [`src/ui/arrivals.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/ui/arrivals.js), total fixed chrome has been reduced from **`564px–598px` down to `144px–170px`**, expanding the main workspace to **`547px–632px` at `1366×768` (`71.2%–82.3%` of the window, or `77%–86%` including the player status strip)** and eliminating scroll overflow across every primary view.

---

## Before vs. After Viewport Allocation (`1366×768` Target Baseline)

| # | Screen / View (`src/` Component) | Before: Main Workspace Height (`% of 768px`) | Before: Scroll Overflow (`1366×768`) | After: Main Workspace Height (`% of 768px`) | After: Scroll Overflow (`1366×768`) | After: Scroll Overflow (`1280×720`) | What Changed to Make the Main Purpose Dominate the Window |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **Character Setup** ([`CharacterSetup.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/CharacterSetup.js)) | `485px` (`63.2%`) | `+133px` col / `+15px` doc | **`520px` (`67.7%` card, `100%` stage)** | **`0px`** | **`0px`** | Switched portraits to a 4-column grid (`17` faces in 5 compact rows), attire to a 3-column grid (`12` outfits in 4 rows), and collapsed the duplicate `<select>` fallback to `sr-only`. |
| **2** | **Gathering & Invitations Modal** ([`DecisionDesk.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/DecisionDesk.js)) | `672px` (`87.5%`) | `+882px` | **`680px` (`88.5%`)** | **`0px`** | **`0px`** | Converted `Host a gathering` into a 3-column inline form grid (`44px` textarea), inline `Join or rejoin` bar, and 2-column compact `Seat invitations` grid. |
| **3** | **Gathering Lobby / Waiting Table** ([`GatheringLobby.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/GatheringLobby.js)) | `668px` (`87.0%`) | `+1,769px` | **`632px` (`82.3%`)** | **`0px`** | **`0px`** | Placed all 2–6 chairs in a single horizontal row (`repeat(auto-fit, minmax(140px, 1fr))`) and arranged Viewer/Notes on the bottom-left and Host Controls (`Start Match` + 2×2 invitations) on the bottom-right. |
| **4** | **Club Room Social Tabletop** ([`ClubRoom.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/scene/ClubRoom.js)) | `604px` (`78.6%`) | `0px` (`+20px` at `720p`) | **`696px` (`90.6%`)** | **`0px`** | **`0px`** | Collapsed empty `.arrival-dock` (`100px`) and empty status slots (`68px`), and removed `min-height: 740px` so `1280×720` never clips. |
| **5** | **Private Company Auction** ([`StockExchange.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/StockExchange.js)) | `183px` (`23.8%`) | `+543px` | **`570px` (`74.2%` board, `79.9%` w/ strip)** | **`0px`** | **`0px`** | Reclaimed `387px` of vertical height; arranged all 7 private cards (`TR`–`UTF`) in a 4×2 grid (`0px` scroll) and pinned `-¥5`/`+¥5`, `Place Bid`, `Buy Now`, and `Pass` in `.meiji-bidding-panel`. |
| **6** | **Stock Exchange** ([`StockExchange.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/StockExchange.js)) | `195px` (`25.4%`) | `+818px` ticket / `+167px` table | **`547px–570px` (`71.2%–74.2%`, `79.9%` w/ strip)** | **`0px`** | **`0px`** | All 7 corporations (`AR`–`UR`) fit at once on the left table (`0px` scroll); right Order Ticket uses a 6-col Par bar, 2×2 Before→After grid, and pinned `Buy` / `Exchange DR` / `Pass` buttons (`0px` scroll). |
| **7** | **Map & Operations — Step 1: Track** ([`HexMap1889.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/HexMap1889.js)) | `170px` (`22.1%`) | `+250px` | **`570px` (`74.2%` map, `79.9%` w/ strip)** | **`0px`** | **`0px`** | Expanded the Shikoku hex map from `170px` to `570px` tall (`3.35×` taller!) and compacted the right-hand Operating Ticket so tile pills and `Confirm Lay Tile` / `Skip Track` fit with `0px` scroll. |
| **8** | **Map & Operations — Step 4: Dividend** ([`HexMap1889.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/HexMap1889.js)) | `204px` (`26.6%`) | `+98px` | **`570px` (`74.2%` map, `79.9%` w/ strip)** | **`0px`** | **`0px`** | Side-by-side `Pay Dividend (¥60)` and `Withhold (¥60)` consequence cards and action buttons sit completely above the fold with `0px` scroll at both `720p` and `768p`. |
| **9** | **Decision Desk Modal** ([`DecisionDesk.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/components/DecisionDesk.js)) | `703px` (`91.5%`) | `+199px` | **`703px` (`91.5%`)** | **`0px`** | **`0px`** | Compacted route cards, segment builder bar, and headings so `Review & commit draft routes` and `Private companies & corporate train transfers` fit without scrolling. |
| **10** | **Action Journal (History View)** ([`TimelineBar.js`](/Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/src/replay/TimelineBar.js)) | `132px` (`17.2%`) | `+3,178px` (1 row visible) | **`567px` (`73.8%`)** | *List scrolls after ~14 moves* | *List scrolls after ~12 moves* | Expanded `.history-list` from a `132px` slit (`17.2%` of window, showing 1 move) to **`567px` (`73.8%` of window)** with compact single-line rows showing **12–14 moves at once**. |

---

## Side-by-Side Visual Verification: Before vs. After (`1366×768`)

### 1. Stock Exchange (`/test` Window with Active DR Power Notice)
- **Before (`audit-fail-6-stock-exchange.png`):** Stacked chrome bars (`topbar` + `test-controls` + `room-context` + empty `32px` feedback + `68px` 2-row `decision-navigation` + empty `36px` character notice + `96px` 4-line `market-top-deck` + `74px` player strip + `72px` timeline + `100px` empty arrival dock) left only **`195px` (`25.4%`)** for `.stock-dashboard`, hiding 4 of 7 corporations and clipping the entire Order Ticket (`+818px` overflow).
- **After (`fixed-6-stock-exchange.png`):** `.room-context`, `Decisions & Planning`, `Gathering & Invitations`, and `DR power · Exchange for 10% IR` share a single `26px` bar; empty feedback/notice/arrival slots collapse to `0px`; `.market-top-deck` is a single `32px` toolbar; and `.stock-dashboard` occupies **`547px` (`71.2%` of the window even with the `/test` bar open; `570px` / `74.2%` in regular play)** with all 7 corporations and the complete Order Ticket visible at a glance (`0px` overflow).

![Stock Exchange After Chrome Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-6-stock-exchange.png)

### 2. Private Company Auction
- **Before (`audit-fail-5-private-auction.png`):** Only `183px` (`23.8%`) of height remained for the auction workspace; Private Companies #4–#7 (`SIR`, `DR`, `SMR`, `UTF`) and all bidding action buttons (`+543px` overflow) were cut off.
- **After (`fixed-5-private-auction.png`):** All 7 Private Company cards (`TR`, `MF`, `ER`, `SMR`, `DR`, `SIR`, `UTF`) fit simultaneously in a 4×2 grid on the left, and the right-hand `Bidding & Information` panel displays the 2×2 consequence preview, escrow/bid stepper (`-¥5` / `+¥5`), `Place Bid on MF (¥35)`, `Buy TR Now for ¥20`, and `Pass` with **`0px` scroll overflow**.

![Private Company Auction After Chrome Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-5-private-auction.png)

### 3. Map & Operations — Step 1 (Lay Track) & Step 4 (Dividend)
- **Before (`audit-fail-7-operating-map-track.png` & `audit-fail-8-operating-map-dividend.png`):** The Shikoku hex map was crushed into a `170px`-tall strip (`22.1%` of the window), and the right-hand Operating Ticket clipped both the inline tile picker/action buttons (`+250px` overflow) and the `Pay Dividend` vs. `Withhold` buttons (`+98px` overflow).
- **After (`fixed-7-operating-map-track.png` & `fixed-8-operating-map-dividend.png`):** The Shikoku map stage expands to **`570px` tall (`74.2%` of the window)**, and the right-hand Operating Ticket fits the 5-step stepper, guidance box, hex breakdown, tile pills / dividend comparison cards, and primary action buttons with **`0px` scroll overflow**.

![Map & Operations Step 1 Track After Chrome Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-7-operating-map-track.png)

![Map & Operations Step 4 Dividend After Chrome Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-8-operating-map-dividend.png)

### 4. Gathering Lobby / Waiting Table
- **Before (`audit-fail-3-waiting-lobby.png`):** Stacked 3-column chairs and vertical sections created a `2,437px`-tall page (`+1,769px` overflow) that hid Seat 4, Gathering Notes, `Open the Shikoku Ledger · Start Match`, and all invitation links.
- **After (`fixed-3-waiting-lobby.png`):** All 4 seats sit side-by-side in a single row above a 2-column bottom deck (Viewer Seat + Table Notes on the left; Host `Open the Shikoku Ledger · Start Match` button + 2×2 Seat Invitations on the right), fitting in **`632px` total height (`0px` overflow)**.

![Gathering Lobby Waiting Table After Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-3-waiting-lobby.png)

### 5. Character Setup Studio, Gathering Modal, Decision Desk Modal & Action Journal
- **Character Setup (`fixed-1-character-setup.png`):** All 17 portraits (4-column grid), all 12 Meiji outfits (3-column grid), live preview, expression bar, and `Save look & continue` fit in `520px` (`0px` overflow).
- **Gathering & Invitations Modal (`fixed-2-gathering-modal.png`):** Host form, Join/Rejoin bar, Sandbox, and 2×2 Invitations fit inside a single modal view (`0px` overflow).
- **Decision Desk Modal (`fixed-9-decision-desk-modal.png`):** Docked route planner, segment builder, and `Review & commit draft routes` fit cleanly on one screen (`0px` overflow).
- **Action Journal (`fixed-10-history-journal.png`):** `.history-list` expands from `132px` to `567px` (`73.8%` of the window) with compact single-line snapshot rows.

![Character Setup After Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-1-character-setup.png)

![Gathering & Invitations Modal After Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-2-gathering-modal.png)

![Decision Desk Modal After Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-9-decision-desk-modal.png)

![Action Journal History View After Compaction](file:///Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889/docs/koenji/validation/fixed-10-history-journal.png)
