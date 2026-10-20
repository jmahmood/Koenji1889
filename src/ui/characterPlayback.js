/**
 * Deterministic コマ送り (Koma-okuri) Sequence Recipes
 * Authoring recipes for club sequences & 1889 rule consequences from `docs/koenji/animation_asset_checklist.md`.
 */

export const SEQUENCE_RECIPES = {
  // 3.1 House & Club Sequences
  guest_arrival: {
    category: 'House & Club',
    title: 'Guest First Arrival (Door → Wave → Bow)',
    staticFallback: { expr: 'smile', pose: 'wave' },
    frames: [
      { ms: 550, expr: 'neutral', pose: 'idle', label: 'DOOR AJAR: Guest at Genkan Entrance' },
      { ms: 700, expr: 'smile', pose: 'wave', label: 'GREETING: Warm Smile & Wave' },
      { ms: 700, expr: 'smile', pose: 'bow', label: 'COURTESY: Polite Bow Before Taking Seat' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'SETTLED: Seated at Koenji Table' },
    ],
  },
  yumiko_kitchen: {
    category: 'House & Club',
    title: 'Yumiko Arrives from Kitchen (Tea → Wave)',
    staticFallback: { expr: 'smile', pose: 'tea' },
    frames: [
      { ms: 650, expr: 'smile', pose: 'tea', label: 'FROM KITCHEN: Bringing Warm Tea' },
      { ms: 650, expr: 'smile', pose: 'wave', label: 'GREETING: Welcoming Club Members' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'SETTLED: Seated at Table' },
    ],
  },
  owner_bedroom: {
    category: 'House & Club',
    title: 'Owner from Downstairs Bedroom (Neutral → Bow)',
    staticFallback: { expr: 'smile', pose: 'bow' },
    frames: [
      { ms: 600, expr: 'neutral', pose: 'idle', label: 'FROM DOWNSTAIRS: Entering Clubroom' },
      { ms: 700, expr: 'smile', pose: 'bow', label: 'HOST COURTESY: Bowing to Guests' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'SETTLED: Ready at Table' },
    ],
  },
  host_opens_game: {
    category: 'House & Club',
    title: 'Host Opens the Match (Ledger → Declare → Point)',
    staticFallback: { expr: 'declare', pose: 'ledger' },
    frames: [
      { ms: 650, expr: 'calculating', pose: 'ledger', label: 'HOST: Opening the Shikoku 1889 Ledger' },
      { ms: 650, expr: 'declare', pose: 'point', label: 'DECLARATION: "Private Auction Begins!"' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'MATCH OPEN: Seated Focus' },
    ],
  },
  membership_stamp: {
    category: 'House & Club',
    title: 'Membership Card Hanko Stamp (Present → Place Stamp)',
    staticFallback: { expr: 'smile', pose: 'place', prop: { kind: 'hanko_stamp', label: '高円寺' } },
    frames: [
      { ms: 600, expr: 'neutral', pose: 'offer', prop: { kind: 'hanko_stamp', label: '高円寺' }, label: 'STAMP CARD: Presenting Membership Card' },
      { ms: 650, expr: 'calculating', pose: 'place', prop: { kind: 'hanko_stamp', label: '高円寺' }, label: 'HANKO CONTACT: Pressing Vermilion Seal' },
      { ms: 750, expr: 'smile', pose: 'receive', prop: { kind: 'hanko_stamp', label: '高円寺' }, label: 'IMPRINT COMPLETE: Gathering Stamp Recorded' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Stamp Complete' },
    ],
  },
  tea_toast: {
    category: 'House & Club',
    title: 'Note / Explicit Tea Toast',
    staticFallback: { expr: 'smile', pose: 'tea' },
    frames: [
      { ms: 850, expr: 'smile', pose: 'tea', label: 'SOCIAL TOAST: Raising Warm Tea Cup' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Back to Match' },
    ],
  },
  evening_farewell: {
    category: 'House & Club',
    title: 'Evening Farewell (Smile → Polite Bow)',
    staticFallback: { expr: 'smile', pose: 'bow' },
    frames: [
      { ms: 700, expr: 'smile', pose: 'wave', label: 'FAREWELL: Thanking the Table' },
      { ms: 800, expr: 'smile', pose: 'bow', label: 'COURTESY: End-of-Evening Bow' },
      { ms: 0, expr: 'neutral', pose: 'close_ledger', label: 'CONCLUDED: Ledger Closed' },
    ],
  },

  // 3.2 Auction & Financial Sequences
  bid_submitted: {
    category: 'Auction & Finance',
    title: 'Bid Submitted (Escrow Envelope — Not Yet Won)',
    staticFallback: { expr: 'declare', pose: 'point' },
    frames: [
      { ms: 600, expr: 'calculating', pose: 'ledger', label: 'BID REVIEW: Checking Private Value & Escrow' },
      { ms: 650, expr: 'declare', pose: 'offer', prop: { kind: 'cash_envelope', label: '¥BID', sublabel: 'ESCROW RESERVED' }, label: 'ESCROW COMMITTED: Bid Placed in Reserved Envelope' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'WAITING: Bid Escrowed' },
    ],
  },
  outbid_reaction: {
    category: 'Auction & Finance',
    title: 'Outbid Reaction (Shock / Concerned → Thinking)',
    staticFallback: { expr: 'concerned', pose: 'thinking' },
    frames: [
      { ms: 650, expr: 'shock', pose: 'shock', label: 'OUTBID: Rival Raised the Runoff Bid!' },
      { ms: 750, expr: 'concerned', pose: 'thinking', label: 'RECALCULATING: Evaluating Remaining Cash' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'READY: Awaiting Runoff Decision' },
    ],
  },
  private_awarded: {
    category: 'Auction & Finance',
    title: 'Private Company Awarded (Receive → Present → Triumph)',
    staticFallback: { expr: 'smile', pose: 'certificate', prop: { kind: 'private_cert', label: 'PRIVATE', sublabel: 'AWARDED' } },
    frames: [
      { ms: 600, expr: 'smile', pose: 'receive', prop: { kind: 'private_cert', label: 'TR / ER', sublabel: 'CONCESSION' }, label: 'RECEIVE CONCESSION: Private Charter Accepted' },
      { ms: 700, expr: 'declare', pose: 'certificate', prop: { kind: 'private_cert', label: 'TR / ER', sublabel: 'CONCESSION' }, label: 'PRESENT CHARTER: Concession Displayed' },
      { ms: 750, expr: 'smile', pose: 'triumphant', label: 'AUCTION WON: Modest Triumph' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Concession Added to Portfolio' },
    ],
  },
  share_purchase: {
    category: 'Auction & Finance',
    title: 'Share Purchase (Declare → Receive/Present Certificate → Smile)',
    staticFallback: { expr: 'smile', pose: 'certificate', prop: { kind: 'share_cert', label: 'IR · 20%', sublabel: 'PRESIDENT ★' } },
    frames: [
      { ms: 550, expr: 'declare', pose: 'point', label: 'DECLARE ORDER: Calling Share Purchase' },
      { ms: 650, expr: 'smile', pose: 'receive', prop: { kind: 'share_cert', label: 'IR · 20%', sublabel: 'PRESIDENT ★', color: '#c94a38' }, label: 'RECEIVE SHARE: Accepting Certificate' },
      { ms: 800, expr: 'declare', pose: 'certificate', prop: { kind: 'share_cert', label: 'IR · 20%', sublabel: 'PRESIDENT ★', color: '#c94a38' }, label: 'PRESENT CERTIFICATE: Share Recorded' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'SETTLED: Portfolio Updated' },
    ],
  },
  corporation_floats: {
    category: 'Auction & Finance',
    title: 'Corporation Floats (10×Par Treasury Funding + Triumph)',
    staticFallback: { expr: 'smile', pose: 'triumphant' },
    frames: [
      { ms: 650, expr: 'declare', pose: 'certificate', prop: { kind: 'cash_envelope', label: '10×PAR', sublabel: 'CORP TREASURY' }, label: '50% SOLD: Bank Funds Corporate Treasury (10×Par)' },
      { ms: 750, expr: 'laugh', pose: 'triumphant', label: 'FLOATED: Company Ready for Operations!' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'IDLE: Corporation Active' },
    ],
  },
  share_sale: {
    category: 'Auction & Finance',
    title: 'Share Sale (Offer Certificate → Count Cash → Ledger)',
    staticFallback: { expr: 'calculating', pose: 'count' },
    frames: [
      { ms: 600, expr: 'calculating', pose: 'offer', prop: { kind: 'share_cert', label: 'SELL 10%', sublabel: 'TO BANK POOL' }, label: 'OFFER SHARE: Selling Block to Bank Pool' },
      { ms: 700, expr: 'calculating', pose: 'count', prop: { kind: 'cash_envelope', label: '+¥CASH', sublabel: 'PROCEEDS' }, label: 'RECEIVE PROCEEDS: Counting Sale Cash' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Market Price Adjusted' },
    ],
  },
  presidency_changes: {
    category: 'Auction & Finance',
    title: 'Presidency Handoff (Offer President Card → Receive)',
    staticFallback: { expr: 'concerned', pose: 'offer', prop: { kind: 'share_cert', label: '20% PRES', sublabel: 'HANDOFF ★' } },
    frames: [
      { ms: 650, expr: 'disappointed', pose: 'offer', prop: { kind: 'share_cert', label: '20% PRES', sublabel: 'HANDOFF ★' }, label: 'OLD PRESIDENT: Offering Presidency Certificate' },
      { ms: 700, expr: 'declare', pose: 'receive', prop: { kind: 'share_cert', label: '20% PRES', sublabel: 'NEW PRES ★' }, label: 'NEW PRESIDENT: Receiving Company Control' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Presidency Transferred' },
    ],
  },
  private_exchange_dr: {
    category: 'Auction & Finance',
    title: 'Dougo Railway (DR) Exchange (Offer Private → Receive 10% Share)',
    staticFallback: { expr: 'smile', pose: 'receive', prop: { kind: 'share_cert', label: '10% SHARE', sublabel: 'DR EXCHANGE' } },
    frames: [
      { ms: 650, expr: 'declare', pose: 'offer', prop: { kind: 'private_cert', label: 'DR PRIVATE', sublabel: 'EXCHANGE' }, label: 'EXCHANGE DR: Offering Dougo Railway Private' },
      { ms: 750, expr: 'smile', pose: 'receive', prop: { kind: 'share_cert', label: '10% SHARE', sublabel: 'RECEIVED', overlay: 'closed' }, label: 'RECEIVE SHARE: 10% Equity Claimed & DR Closed' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Exchange Complete' },
    ],
  },
  negotiated_purchase: {
    category: 'Auction & Finance',
    title: 'Negotiated Private/Train Purchase (Offer → Receive → Count Cash)',
    staticFallback: { expr: 'smile', pose: 'receive' },
    frames: [
      { ms: 600, expr: 'calculating', pose: 'offer', prop: { kind: 'private_cert', label: 'OFFER', sublabel: 'PROPOSAL' }, label: 'PROPOSAL: Offering Asset Across Table' },
      { ms: 650, expr: 'smile', pose: 'receive', prop: { kind: 'private_cert', label: 'ACCEPTED', sublabel: 'TRANSFERRED' }, label: 'ACCEPTED: Buyer Receives Asset' },
      { ms: 650, expr: 'smile', pose: 'count', prop: { kind: 'cash_envelope', label: '¥TREASURY', sublabel: 'SETTLED' }, label: 'SETTLEMENT: Treasury Cash Transferred' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Transfer Complete' },
    ],
  },

  // 3.3 Railway Operation & Endgame Sequences
  track_laid: {
    category: 'Railway Operations',
    title: 'Track Laid / Upgraded (Point → Hold Hex → Place Hex)',
    staticFallback: { expr: 'smile', pose: 'place', prop: { kind: 'track_hex', color: '#5da667', label: '#439' } },
    frames: [
      { ms: 550, expr: 'declare', pose: 'point', label: 'DECLARE HEX: Calling Track Upgrade' },
      { ms: 650, expr: 'calculating', pose: 'token', prop: { kind: 'track_hex', color: '#5da667', label: '#439' }, label: 'HOLD TILE: Inspecting Track Orientation' },
      { ms: 700, expr: 'smile', pose: 'place', prop: { kind: 'track_hex', color: '#5da667', label: '#439' }, label: 'PLACE TILE: Laying Track onto Shikoku Hex' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'IDLE: Track Committed' },
    ],
  },
  station_placed: {
    category: 'Railway Operations',
    title: 'Station Token Placed (Hold Token → Place Token)',
    staticFallback: { expr: 'smile', pose: 'place', prop: { kind: 'station_token', label: 'IR', color: '#c94a38' } },
    frames: [
      { ms: 600, expr: 'declare', pose: 'token', prop: { kind: 'station_token', label: 'IR', sublabel: 'STATION', color: '#c94a38' }, label: 'HOLD TOKEN: Selecting Corporate Station Marker' },
      { ms: 700, expr: 'smile', pose: 'place', prop: { kind: 'station_token', label: 'IR', sublabel: 'PLACED ✓', color: '#c94a38' }, label: 'PLACE TOKEN: Establishing Station on City Circle' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Station Active' },
    ],
  },
  routes_committed: {
    category: 'Railway Operations',
    title: 'Routes Committed (Point → Ledger → Smile)',
    staticFallback: { expr: 'smile', pose: 'ledger' },
    frames: [
      { ms: 600, expr: 'declare', pose: 'point', label: 'RUN TRAINS: Pointing Out Claimed Route' },
      { ms: 650, expr: 'calculating', pose: 'ledger', label: 'VERIFY REVENUE: Recording Route Total in Ledger' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'AWAITING DIVIDEND DECISION' },
    ],
  },
  dividend_paid: {
    category: 'Railway Operations',
    title: 'Dividend Paid (Count Cash → Offer Payment → Receive)',
    staticFallback: { expr: 'smile', pose: 'count', prop: { kind: 'cash_envelope', label: '¥DIV', sublabel: 'PAYOUT' } },
    frames: [
      { ms: 600, expr: 'smile', pose: 'count', prop: { kind: 'cash_envelope', label: '¥DIV', sublabel: 'PAYOUT' }, label: 'COUNT DIVIDENDS: Sorting Shareholder Payouts' },
      { ms: 650, expr: 'declare', pose: 'offer', prop: { kind: 'cash_envelope', label: '¥DIV', sublabel: 'TO HOLDERS' }, label: 'DISTRIBUTE: Paying Shareholders & Pool Treasury' },
      { ms: 650, expr: 'smile', pose: 'receive', prop: { kind: 'cash_envelope', label: '+¥DIV', sublabel: 'RECEIVED' }, label: 'RECEIVED: Shareholders Collect Dividends' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'IDLE: Share Price Advances Right →' },
    ],
  },
  revenue_withheld: {
    category: 'Railway Operations',
    title: 'Revenue Withheld (Ledger → Close Ledger)',
    staticFallback: { expr: 'calculating', pose: 'close_ledger' },
    frames: [
      { ms: 650, expr: 'calculating', pose: 'ledger', label: 'WITHHOLD: Retaining Revenue in Corporate Treasury' },
      { ms: 750, expr: 'neutral', pose: 'close_ledger', label: 'CLOSE LEDGER: Funds Locked in Treasury' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Share Price Steps Left ←' },
    ],
  },
  train_bought: {
    category: 'Railway Operations',
    title: 'Train Bought (Ledger → Offer Cash → Receive Train Card)',
    staticFallback: { expr: 'smile', pose: 'certificate', prop: { kind: 'train_card', label: '5-TRAIN', sublabel: '¥450' } },
    frames: [
      { ms: 550, expr: 'calculating', pose: 'ledger', label: 'INSPECT DEPOT: Checking Corporate Treasury' },
      { ms: 600, expr: 'declare', pose: 'offer', prop: { kind: 'cash_envelope', label: '¥450', sublabel: 'TREASURY' }, label: 'PAY DEPOT: Offering Corporate Treasury Cash' },
      { ms: 750, expr: 'smile', pose: 'receive', prop: { kind: 'train_card', label: '5-TRAIN', sublabel: 'ACQUIRED' }, label: 'RECEIVE TRAIN: Locomotive Added to Fleet' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'IDLE: Fleet Updated' },
    ],
  },
  phase_obsolescence: {
    category: 'Railway Operations',
    title: 'Phase Change / Train Rust & UTF Exception (Section 6)',
    staticFallback: { expr: 'concerned', pose: 'certificate', prop: { kind: 'train_card', label: '2-TRAIN', overlay: 'rusted' } },
    frames: [
      { ms: 700, expr: 'declare', pose: 'certificate', prop: { kind: 'phase_card', label: 'PHASE 4 / 5', sublabel: 'LIMIT CHANGE' }, label: 'PHASE ADVANCE: New Phase & Train Limit Announced' },
      { ms: 750, expr: 'concerned', pose: 'certificate', prop: { kind: 'train_card', label: 'OLD TRAIN', sublabel: 'OBSOLETE', overlay: 'rusted' }, label: 'TRAIN RUSTED: Obsolete Trains Removed (UTF → ¥50)' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'IDLE: Phase Transition Complete' },
    ],
  },
  emergency_funding: {
    category: 'Railway Operations',
    title: 'President Emergency Funding (Concerned → Count Personal Cash)',
    staticFallback: { expr: 'concerned', pose: 'count', prop: { kind: 'cash_envelope', label: '¥PERSONAL', sublabel: 'EMERGENCY' } },
    frames: [
      { ms: 650, expr: 'concerned', pose: 'ledger', label: 'TREASURY SHORTFALL: President Must Cover Train Cost' },
      { ms: 750, expr: 'concerned', pose: 'count', prop: { kind: 'cash_envelope', label: '¥PERSONAL', sublabel: 'CONTRIBUTION' }, label: 'PERSONAL FUNDS: Counting Out-of-Pocket Contribution' },
      { ms: 650, expr: 'declare', pose: 'offer', prop: { kind: 'cash_envelope', label: '¥PERSONAL', sublabel: 'TO DEPOT' }, label: 'EMERGENCY PAYMENT: Submitting Required Funds' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'SETTLED: Emergency Train Purchased' },
    ],
  },
  bankruptcy: {
    category: 'Railway Operations',
    title: 'Bankruptcy / Setback (Concerned → Disappointed → Close Ledger)',
    staticFallback: { expr: 'disappointed', pose: 'close_ledger' },
    frames: [
      { ms: 700, expr: 'concerned', pose: 'ledger', label: 'INSOLVENCY: Unable to Raise Required Train Funds' },
      { ms: 800, expr: 'disappointed', pose: 'close_ledger', label: 'BANKRUPTCY: Closing the Ledger Respectfully' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'MATCH ENDED' },
    ],
  },
  bank_exhaustion: {
    category: 'Railway Operations',
    title: 'Bank Exhaustion Warning (End Pending Card → Close Ledger)',
    staticFallback: { expr: 'concerned', pose: 'certificate', prop: { kind: 'bank_end_pending', sublabel: 'FINISH OR SET' } },
    frames: [
      { ms: 750, expr: 'concerned', pose: 'certificate', prop: { kind: 'bank_end_pending', sublabel: 'FINISH OR SET' }, label: 'BANK EXHAUSTED: End Pending After Current OR Set' },
      { ms: 700, expr: 'calculating', pose: 'ledger', label: 'FINAL OPERATING SET: Completing Remaining Turns' },
      { ms: 0, expr: 'neutral', pose: 'idle', label: 'END PENDING ACTIVE' },
    ],
  },
  final_results: {
    category: 'Railway Operations',
    title: 'Final Results (Winner Triumphs / Laughs → Courteous Bow)',
    staticFallback: { expr: 'laugh', pose: 'triumphant' },
    frames: [
      { ms: 750, expr: 'laugh', pose: 'triumphant', label: 'FINAL RESULTS: Winner Celebrates at the Table!' },
      { ms: 750, expr: 'smile', pose: 'tea', label: 'CLUB TOAST: Congratulating All Players' },
      { ms: 750, expr: 'smile', pose: 'bow', label: 'COURTESY: Evening Bow' },
      { ms: 0, expr: 'smile', pose: 'idle', label: 'MATCH COMPLETE' },
    ],
  },
};
