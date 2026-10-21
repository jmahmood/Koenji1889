// Local presentation preference only. Never translated on the server or written
// into authoritative state, invitations, names, notes, or form values.
let locale=globalThis.localStorage?.getItem('koenji_locale')==='ja'?'ja':'en';
export const getLocale=()=>locale;
export function setLocale(value){locale=value==='ja'?'ja':'en';globalThis.localStorage?.setItem('koenji_locale',locale);}
const pairs=`
Your preferences|表示・音の設定
Language|言語
Sound & reminders|音と手番通知
Background music|BGM
Sound effects|効果音
Effects volume|効果音の音量
Turn reminder|手番のお知らせ
Never|通知しない
20 seconds|20秒
40 seconds|40秒
60 seconds|60秒
Music pauses while this window is hidden.|別のタブに移るとBGMは一時停止します。
If audio is blocked, click anywhere to start it.|音が出ない場合は画面をクリックしてください。
Close|閉じる
On|オン
Off|オフ
Music|音楽
Motion|アニメーション
Your turn|あなたの手番
Current turn|現在の手番
Historical turn|この局面の手番
Match complete|ゲーム終了
Open your desk|操作画面を開く
It is your turn — open your desk|あなたの手番です — 操作画面を開く
Company treasury|会社資金
Company treasury funded|会社資金を受領
Personal purse|個人資金
Choose a private company|プライベート会社を選択
Buy, sell or pass|売買またはパス
REVIEW YOUR DECISION|操作内容の確認
Confirm|確定
Cancel|キャンセル
Continue|続ける
Confirm decision|操作を確定
Confirm routes|ルートを確定
Position changed. Review the decision again.|局面が変わりました。もう一度操作を確認してください。
Finish this turn?|この手番を終了しますか？
Pass this opportunity?|今回はパスしますか？
Skip this step?|このステップを省略しますか？
The next player or company will act.|次のプレイヤーまたは会社の手番になります。
Finish this stock turn.|この株式手番を終了します。
Continue to the next action.|次の操作に進みます。
Declare bankruptcy?|破産を宣言しますか？
This ends the match immediately.|ゲームが直ちに終了します。
DR will close.|DRは閉鎖されます。
Personal cash|所持金
Proceeds|受取額
President contributes|社長の個人出資
Market pool → company|公開市場分 → 会社
IPO retained by bank|未購入株式分は銀行に留保
Market pool|公開市場
retained by Bank|銀行に留保
retained by bank|銀行に留保
To Company treasury|会社資金へ
To Bank|銀行へ
KOENJI RAILWAY GAZETTE · EXTRA|高円寺鉄道新聞・号外
50% sold · The bank provides 10× par capital.|50％売却達成・銀行から基準株価の10倍の資金を受領。
Your railway joins the next operating round.|次の経営ラウンドから、この鉄道会社が運行します。
Club helper|倶楽部のお手伝い
Owned now|現在の所有列車
Train limit|列車保有上限
No trains owned|所有列車なし
After purchase|購入後
Preview only · Purchase not yet confirmed|購入前のプレビュー・まだ購入していません
Trade in|下取り
No trains|列車なし
Enlarge card|カードを拡大
Enlarged certificate|カード拡大表示
Close enlarged card|拡大カードを閉じる
Close private company details|会社詳細を閉じる
Private Auction|プライベート会社競売
Stock Exchange|株式取引所
Game Table|ゲーム卓
Map & Operations|マップ・経営
Shikoku Map|四国マップ
History|棋譜
Journal|棋譜
Membership Card|会員証
Demo Tools|デモツール
Koenji Stock Exchange|高円寺株式取引所
KOENJI RAILWAY CLUB|高円寺鉄道倶楽部
SHIKOKU 1889|四国1889
Private Company Auction|プライベート会社競売
Stock Round|株式ラウンド
Operating Round|経営ラウンド
Private Company|プライベート会社
Private Companies|プライベート会社
Private Railways|私有鉄道
Public portfolio|株式会社の保有株
Open privates|営業中のプライベート会社
Current Round|現在のラウンド
Current Market Price|現在の市場株価
Current Market|現在の市場
Current Player|現在のプレイヤー
Current actor at this revision|この局面での手番プレイヤー
Current actor|現在の手番プレイヤー
Current Action|現在の操作
Active Player|手番プレイヤー
Active Turn|手番
Acting player|行動するプレイヤー
Bank|銀行
Phase|フェーズ
Room|部屋
seated|着席
Revision|局面
Rev|局面
Live position|現在の局面
Historical position|過去の局面
Live|現在
Viewing as|参加者
Return to Live|現在の対局へ戻る
Game read-only|閲覧のみ
Historical game state is read-only. Return to Live before acting.|過去の局面は閲覧のみです。現在の対局に戻って操作してください。
Observers can inspect the game; only seated players can submit moves.|観戦者は閲覧のみです。操作できるのは着席プレイヤーです。
A move is being submitted. Please wait.|操作を送信中です。しばらくお待ちください。
Submitting move…|操作を送信中…
Loading snapshot…|局面を読込中…
Attention|確認してください
Latest update|最新情報
Dismiss message|メッセージを閉じる
Dismiss|閉じる
Player|プレイヤー
Players|プレイヤー
President|社長
★ President|★ 社長
Certificates held|保有株券
Certificate|株券
Certificates|株券
Certificate Source|株券の購入元
Par Price (President's 20% Share)|基準株価（20％社長株）
Par Price|基準株価
Market / Par|市場株価・基準株価
IPO / Bank Pool|未購入株・公開市場
IPO / Pool|未購入株・公開市場
Share supply|株式の残り
Share status|株式の状態
Float & Treasury|会社設立・資金
Ownership|持株比率
Owner|所有者
Face value|額面
Face Value|額面
Income per operating round|経営ラウンドごとの収入
Company powers|特殊能力
No special powers.|特殊能力なし。
Closed · No income|閉鎖済み・収入なし
Closed concession|閉鎖済み
This concession is closed. Its powers and income are no longer active.|この会社は閉鎖済みです。特殊能力と収入はありません。
Select|選択
Selected certificate details|選択した株券の詳細
Selecting a company does not place a bid.|会社を選択するだけでは入札されません。
Bid increment: ¥5. Selecting a company does not place a bid.|入札は5円刻みです。会社を選ぶだけでは入札されません。
Place Bid (+¥5)|入札する（+¥5）
Place Bid|入札する
Bidding & Information|入札・会社情報
All players' escrow|全員の入札預託金
Your Escrow|あなたの入札預託金
Your available cash|使用可能な所持金
Your recent tables|最近の対局
On Block / Min|出品中・最低額
Personal Cash|個人資金
Cash Impact|資金の変化
Certificate Slots|株券の枚数
No certificates or bids yet|株券・入札はまだありません
No certificates yet|株券はまだありません
No player shares held|プレイヤー保有株なし
No public shares|株式会社の株式なし
No offers recorded.|交渉記録はありません。
No additional decisions available.|追加の選択肢はありません。
Pass unavailable: the offered company must be taken, or you are the last runoff bidder.|出品会社の購入が必須、または競りの最後の入札者のため、パスできません。
Bank · Unowned|銀行・未所有
Bank Pool|公開市場
Unowned|未所有
Available|購入可能
Selected|選択中
Selected corporation|選択中の会社
Corporation|株式会社
Corporation / Order|会社・経営順
Charter Supply|会社株券
Station Tokens|駅トークン
Placed stations|配置済みの駅
Other station|他社の駅
Home reserved|本拠地予約済み
Home placed|本拠地配置済み
Home|本拠地
HOME|本拠地
Open Interactive Map|操作マップを開く
Open Map & Operating Desk|マップ・経営画面を開く
Open Operations|経営画面を開く
Open Private Auction Desk|プライベート会社競売を開く
Open Stock Exchange|株式取引所を開く
Back to Table|ゲーム卓へ戻る
Back to table|ゲーム卓へ戻る
Back to your table|ゲーム卓へ戻る
Open Boardroom|取締役会を開く
Train routes|列車ルート
Choose train routes|列車ルートを選択
Choose the first stop.|最初の停車地を選んでください。
Choose the connection to preview on the map:|マップで確認する接続を選択してください：
This train|この列車
Not running|運行しない
Don’t run|運行しない
Cancel edit|編集をやめる
Undo stop|停車地を1つ戻す
Use this route|このルートを採用
Edit route|ルートを編集
Choose stops|停車地を選択
Restore recommended routes|推奨ルートに戻す
Recommended routes|推奨ルート
Total Operating Revenue|総運行収入
Total revenue|総収入
Revenue|収入
No legal route|有効なルートなし
No route|ルートなし
Continue to train purchase|列車購入へ進む
Choose from a list|一覧から選ぶ
No operating fleet.|運行列車なし。
No corporation is operating.|経営中の会社はありません。
No corporate treasury in this round.|このラウンドでは会社資金を使いません。
No corporation is currently operating. Inspect the Train Depot and Phase Rust schedule below.|経営中の会社はありません。列車庫と廃車スケジュールを確認できます。
Pay Dividend|配当する
Pay dividend|配当する
Withhold|留保する
Operating Revenue Earned|運行収入
If Withheld|留保した場合
If Paid Out|配当した場合
Revenue resolution shortcut|配当ステップへ進む
Route resolution shortcut|ルートステップへ進む
Resolve this operating revenue.|この運行収入を処理します。
Next: pay shareholders or keep the revenue.|次に株主へ配当するか、会社に留保します。
No move (¥0)|収入0円・株価は左へ
Treasury|会社資金
Corporate treasury|会社資金
Treasury / Status|会社資金・状態
Treasury / Market|会社資金・株価
Treasury & fleet|会社資金・列車
Personal funds|個人資金
Personal cash|個人資金
Safe|会社金庫
Purse|個人の財布
Fleet|列車
Train|列車
Trains|列車
Owned Trains|所有列車
Trains & Tokens|列車・駅トークン
In Depot|列車庫の在庫
Select a locomotive or deal to prepare an order.|列車または取引を選んでください。
No depot engines remain.|列車庫に列車はありません。
Mandatory train financing|必須の列車購入資金
Mandatory train purchase|列車購入が必要です
Cheapest depot train|列車庫で最安の列車
Shortfall|不足額
President's personal cash|社長の個人資金
No share certificates held.|売却可能な株券はありません。
No legal emergency sale|有効な緊急売却なし
Bankruptcy unavailable in this position|この局面では破産できません
Emergency financing|緊急資金調達
Train purchase|列車購入
Staged dispatch order|購入予定の注文
Staged dispatch order|購入予定の注文
DISPATCH VOUCHER|購入伝票
COUNTING HOUSE · VAULT vs. PURSE|出納室・会社金庫と個人の財布
LOCOMOTIVE WORKS · DEPOT TRAY|機関車工場・購入可能な列車
ENGRAVED SHARE CERTIFICATE|株券
STAGED EMERGENCY LIQUIDATION · STEP 1|緊急株式売却の確認・第1段階
I. THE ROUNDHOUSE & DEPOT|一・機関庫と列車庫
II. THE COUNTING HOUSE & VAULT|二・出納室と金庫
III. CLUB DEAL TABLE & TRANSFERS|三・会社間取引
Inter-company trains · Private deals · Emergency financing|会社間の列車・プライベート会社の取引・緊急資金調達
Trains, emergency funding & private exchange|列車・緊急資金調達・プライベート会社交換
Private companies & corporate train transfers|プライベート会社・会社間の列車取引
Both presidents submit matching terms. A common president needs no separate consent. Purchases use the operating corporation's treasury.|双方の社長が同じ条件を提出します。同一社長なら別の同意は不要です。支払いには経営中の会社資金を使います。
Agreed price|合意した価格
Offer Ready|取引条件
Counterparty Offer|相手の提示条件
Review offer / consent|条件の確認・同意
Review purchase|購入内容を確認
Buyer|買い手
Seller|売り手
CLUB DEAL TABLE|倶楽部取引卓
CLUB TRANSFER SCROLL|取引証書
RECORDED OFFERS · CONSENT LEDGER|提示条件・同意記録
Station token shortcut|駅配置ステップへ進む
Selected Hex|選択中のヘクス
Staged Tile|仮置きタイル
Staged|仮置き
Terrain Fee|地形費用
TERRAIN COST|地形費用
Build Status|建設状況
Preview only|プレビューのみ
Clear|解除
Rotate 60°|60度回転
Inspect|確認
Inspecting|確認中
No information windows are open.|情報ウィンドウは開いていません。
Use the launcher buttons above or press keys 1–4.|上のボタン、または1〜4キーで開いてください。
Restore Layout|レイアウトを戻す
Map Only|マップのみ
Split 2-Up|2画面表示
Drag titlebar to move|タイトルバーをドラッグして移動
Keep preview|仮置きを維持
Leave the staged tile?|仮置きタイルを破棄しますか？
This operating action advances the turn and discards your uncommitted tile preview. The tile has not been built.|この操作は手番を進め、未確定の仮置きタイルを破棄します。まだ建設されていません。
Skip Step|ステップを省略
Skip|省略
track|線路敷設
token|駅配置
routes|ルート
dividend|配当
train|列車購入
auction|競売
stock|株式
operating|経営
End Operating Turn|経営手番を終了
Finish|終了
Pay|支払う
Buy|購入
Sell|売却
Pass|パス
Price|価格
Source|購入元
Cost|費用
Total|合計
Amount|金額
Stock price|株価
Priority Deal|優先取引
Shareholder|株主
Shareholders|株主
Cash|現金
Member|会員
You|あなた
YOU|あなた
Guest Observer (Spectator)|観戦者
Guest Observer|観戦者
Spectator|観戦者
Host|主催者
Host Next Gathering|次の対局を開く
New test game|新しいテスト対局
Test game|テスト対局
Start position|開始局面
Regular app|通常の画面
Retry test game|テスト対局を再試行
Try again|再試行
Refresh table|卓を更新
Your table|あなたの卓
Your tables will appear here after you host or join a game.|対局を開くか参加すると、ここに表示されます。
Welcome to Koenji Railway Club|高円寺鉄道倶楽部へようこそ
Opening Koenji Railway Club…|高円寺鉄道倶楽部を開いています…
Preparing your table and the latest game position.|卓と最新の局面を準備しています。
A look of your own, before you join the club.|倶楽部に入る前に、自分の姿を選びましょう。
Your appearance|あなたの姿
Your character|あなたのキャラクター
Your look is remembered in this browser.|このブラウザーに姿を保存します。
Portrait|顔写真
Attire|服装
1. Choose a portrait|1. 顔写真を選ぶ
2. Choose your attire|2. 服装を選ぶ
Keep previous look|以前の姿を使う
Save look & continue|保存して進む
Change your look|姿を変更
Change appearance|姿を変更
Choose from a list|一覧から選ぶ
An alternative to the portrait and outfit tiles.|顔写真と服装を一覧から選べます。
Try an expression on your character. Your portrait and outfit stay selected.|表情を試せます。顔写真と服装は変わりません。
Expression preview|表情プレビュー
Expression previews are for trying your look. The game controls expressions during play.|ここで表情を試せます。対局中の表情はゲームに合わせて変わります。
Ready for the club|倶楽部に入る準備完了
Good friends|気の合う仲間
Good trains|鉄道のひととき
A greater Shikoku|四国の鉄道を育てよう
1889 · A gathering for 2–6 friends|1889・2〜6人で楽しむ鉄道ゲーム
Reserve seats for friends|仲間の席を用意する
Each person gets a private invitation.|一人ずつ専用の招待を送ります。
Game name|対局名
Seating order|席順
Randomize seating|席順をランダムに
Move earlier ↑|席順を上へ ↑
I’m playing too|自分も参加する
Host name when you’re not playing|参加しない場合の主催者名
Host preferences|主催者の設定
House resident entrances|倶楽部の住人の入口
Your entrance|あなたの入口
Names and portraits do not assign entrance roles.|名前や顔写真は入口の役割に影響しません。
Names, portraits and invitations follow each person.|名前・顔写真・招待は各プレイヤーに紐づきます。
The usual settings are already selected. These are optional.|標準設定が選択済みです。必要に応じて変更できます。
Create table|卓を作る
Creating table…|卓を作成中…
Find your table|対局に参加する
Invitation or room code|招待リンクまたは部屋コード
Paste the invitation your host sent you, or enter a room code.|主催者の招待リンク、または部屋コードを入力してください。
Load invitation|招待を読み込む
Join game|対局に参加
Your recent tables|最近の対局
A seat is reserved for you|あなたの席が用意されています
Confirm your name to join this gathering.|名前を確認して参加してください。
Claim seat|着席する
You’re visiting as an observer.|観戦者として参加しています。
Around the table|卓の仲間たち
At the table|卓の様子
Observer invitation|観戦者の招待
Current table · portraits & observer invitation|現在の卓・顔写真と観戦者の招待
Portraits & observer invitation|顔写真・観戦者の招待
Choose a portrait for each person before sharing their invitation. They can change their look after joining.|招待する前に各人の顔写真を選べます。参加後に本人が変更できます。
Seat claimed · this member controls their look.|着席済み・本人が姿を変更できます。
Copy invitation|招待をコピー
Copy this private invitation|専用の招待をコピー
All seats have been claimed. Ask the host for your invitation.|すべての席が埋まっています。主催者に招待を確認してください。
Retrieve seat invitations|各席の招待を取得
Open host ledger|主催者の台帳を開く
Host gathering controls|対局の主催者設定
Gathering & Invitations|対局・招待
Manage seats|席の管理
Host or join another game|別の対局を開く・参加する
Leave a note|メモを残す
Table note|卓のメモ
Post Note|メモを投稿
The kettle’s on. Leave a note for your friends.|お茶が沸きました。仲間へのメモをどうぞ。
TABLE TEA, SNACKS & ARRIVAL NOTES|お茶・おやつ・来訪のメモ
Card stamped ✓|押印済み ✓
Koenji Railway Club Membership Card|高円寺鉄道倶楽部 会員証
Recent moves at the table|卓の最近の操作
Recent player activity|最近の活動
View results|結果を見る
Final results|最終結果
Place|順位
Net worth|総資産
Holds Priority Deal|優先取引権を所持
No negotiations available for this seat and operating corporation.|この席と経営中の会社で行える交渉はありません。
Choose an available green tile or decline. The interrupted operating step will resume.|使用可能な緑タイルを選ぶか辞退してください。中断中の経営手順に戻ります。
Each affected president chooses which train to return. Normal operation resumes after all required discards.|各社長が返却する列車を選びます。全社の返却が終わると通常の経営に戻ります。
Resolve excess trains|保有上限を超えた列車の処理
Correct excess certificates or ownership before finishing. Inspect the available sale blocks.|終了前に株券枚数や持株比率の超過を解消してください。売却候補を確認できます。
Historical game state · bids and purchases are read-only.|過去の局面・入札と購入はできません。
Read-only for this seat or revision.|この席または局面では閲覧のみです。
Read-only|閲覧のみ
No legal emergency sale|有効な緊急売却なし
All four seats available · refresh resumes this game|4席を使用可能・再読込でこの対局を再開
Opens a separate test game with demo controls.|デモ操作付きの独立したテスト対局を開きます。
Opens board/desk at selected move|選択した操作の盤面を開く
Inspect resulting position|操作後の局面を確認
Inspect position|局面を確認
Back|戻る
Fast|高速
Instant|即時
Play|再生
Pause|一時停止
Reopen|再び開く
EMPTY|空き
STAGED|購入予定
LOCKED|未解禁
RETURNED|返却済み
MANDATORY|必須
BANK POOL|公開市場
CORPORATE TREASURY|会社資金
PERSONAL FUNDS|個人資金
SALE PROCEEDS|売却代金
SETTLEMENT|決済
TRAIN PAYMENT|列車代金
PAYOUT|配当
STATION|駅
HOME|本拠地
`;
const extraPairs=`
Koenji Railway Club · 1889: History of Shikoku Railways (高円寺鉄道倶楽部)|高円寺鉄道倶楽部・1889 四国鉄道史
Decisions & Planning|意思決定・計画
Buy Share or Pass|株式購入・パス
DR power · Exchange for 10% IR|DRの能力・IR株10％と交換
Game Log|対局記録
Game move|ゲームの操作
The gathering begins around the Koenji table|高円寺の卓で対局が始まります
Awaiting dividend payout or withhold decision.|配当または留保を選んでください。
Current gathering · Note|今回の集まり・メモ
Say something to the table|卓の仲間にひとこと
Send table message|卓のメモを送信
Post message to the table|卓にメモを投稿
stamped tonight|今夜の押印
Stamp your membership card|会員証に押印
Membership card stamped ✓|会員証に押印済み ✓
Your name|あなたの名前
Paste invitation or enter 6-letter code|招待リンクまたは6文字の部屋コード
Guest · front door|ゲスト・玄関
Yumiko · kitchen|由美子・台所
Owner · downstairs bedroom|オーナー・階下の寝室
Guest|ゲスト
Ready|準備完了
Waiting|待機中
Start game|対局を開始
Start gathering|対局を開始
Start the game|対局を開始
Start this gathering|この対局を開始
Awaiting party|仲間を待っています
Open seats|空席
Seat|席
Start|開始
Refresh|更新
Copy|コピー
Copied|コピーしました
Closed|閉鎖済み
Unparred|基準株価未設定
Set Par|基準株価を設定
Needs 50% to float|経営開始には50％の売却が必要
Floated|経営開始可能
Pres|社長
Pool|公開市場
Stock Market|株式市場
Corporations|会社一覧
Market Ledger|株価台帳
Company Map|会社マップ
Details & Activity|詳細・履歴
Treasury / Status|会社資金・状態
Charter|会社証書
Supply|残数
YOUR DECISION|あなたの操作
Choose a corporation & stock action, or pass.|会社と売買操作を選択するか、パスしてください。
One President's (20%)|社長株1枚（20％）
per 10%|10％当たり
limit|上限
Purchase settlement|購入代金
Settlement preview|決済プレビュー
Before → After Preview|操作前 → 操作後
Settlement|決済
POSITION|持株比率
20% Pres = +1 cert|20％社長株＝株券1枚
certs|枚
cert|枚
priv|プライベート会社
sh|株
Submit for validation|内容を確認して確定
Sale block (one per corporation per turn)|まとめて売却（各社につき手番中1回）
Sale percentage|売却比率
Pass Stock Turn|株式手番をパス
End Stock Turn|株式手番を終了
Brown-zone purchase block|茶色エリアでの購入単位
Buy percentage|購入比率
Purchase preview|購入プレビュー
The server checks the move when submitted.|確定時にルールを確認します。
Sale preview|売却プレビュー
Purchase unavailable|購入不可
Sale unavailable|売却不可
Closed to purchases|購入不可
Station Charter Rack|駅トークン
Home reserved at|本拠地予約地
No station tokens placed yet|駅はまだ配置されていません
COMPANY MAP|会社マップ
CORPORATION GEOGRAPHY|会社の所在地
SELECTED CORPORATION|選択中の会社
Map Only|マップのみ
Drag to move · Double-click to restore|ドラッグで移動・ダブルクリックで元に戻す
Restore|元に戻す
Resize|大きさを変更
Open the Action Journal|棋譜を開く
First revision|最初の局面
Previous revision|前の局面
Next revision|次の局面
Step backward|1手戻る
Step forward|1手進む
Jump to Revision|指定局面へ移動
Play replay from current position|この局面から再生
Play replay|棋譜を再生
Play / Pause replay|棋譜の再生・一時停止
Replay playback speed|棋譜の再生速度
Scrub revision history|棋譜の局面を選択
LIVE TABLE|現在の卓
Live Match Active|現在の対局を表示中
Latest Rev|最新局面
Pinned Snapshot|固定した局面
HISTORICAL SNAPSHOT|過去の局面
AT THIS REVISION|この局面
READ-ONLY|閲覧のみ
First|最初
Previous|前
Next|次
Action Journal|棋譜
ACTION JOURNAL|棋譜
OPERATING & TABLE JOURNAL|経営・対局の棋譜
FLOATED|経営開始可能
Operating turn|会社の経営手番
CURRENT GATHERING|今回の集まり
GATHERING|対局
THE GATHERING|参加者
AT THE TABLE|卓の様子
PRIVATE RAILWAYS & FERRIES|私有鉄道・フェリー
ACTIVE ROUTE & REVENUE CALCULATOR|ルート・収入計算
OPERATING TURN · 3 OF 5|経営手番・5段階中3
CHOOSE AN ACTION|操作を選択
MAP|マップ
TILE|タイル
Track lay|線路敷設
Station token|駅トークン配置
Station|駅
Token|駅トークン
Lay track|線路を敷設
Lay tile|タイルを敷設
Place token|駅を配置
Token cost|駅の配置費用
Terrain cost|地形費用
Build|建設
Build track|線路を建設
Available tiles|使用可能なタイル
Legal placements|配置可能なタイル
Legal Hexes|配置可能なヘクス
Ready to build|建設準備完了
Staged track|仮置きの線路
Track|線路
Terrain|地形
Routes|ルート
Dividend|配当
Train purchase|列車購入
Route planner|ルート計画
Run routes|ルートを運行
Recommended|推奨
Use recommended routes|推奨ルートを使う
Loading route options…|ルート候補を読込中…
Checking route…|ルートを確認中…
Checking revenue…|収入を確認中…
Recalculate|再計算
Retry|再試行
Edit|編集
Use route|ルートを採用
Use this connection|この接続を採用
Choose connection|接続を選ぶ
No route selected|ルート未選択
No train selected|列車未選択
No stops selected|停車地未選択
Stopped|停車
Stops|停車地
Connected|接続済み
No connection|接続なし
Run|運行
Total route revenue|ルートの総収入
Each train|各列車
This route|このルート
This plan|この計画
Current plan|現在の計画
Quote pending|収入を確認中
Route error|ルートエラー
Train Depot|列車庫
Depot|列車庫
ROUNDHOUSE FLEET|所有列車
Fleet empty|所有列車なし
Future train phases|後のフェーズの列車
Later train phases|後のフェーズの列車
Click certificate to stage|株券を選んで購入内容を準備
Financing / train limit prevents purchase|資金または列車上限のため購入不可
Available from Phase 6|フェーズ6から購入可能
Earlier tier must sell out|先の種類が売り切れると購入可能
Returned train|返却列車
Fleet scrapped|廃車になった列車
Review this order before stamping.|注文を確認してから承認してください。
Stamp & Confirm|承認して確定
Stamp Share Sale|株式売却を承認
Open Full Boardroom Deal & Emergency Room…|会社間取引・緊急資金調達の画面を開く…
Open Boardroom Deal Table|会社間取引の画面を開く
Company|会社
PERMANENT|永久使用
Permanent|永久使用
Rust|廃車
Rusted|廃車済み
Rusts|廃車条件
Train limit becomes|列車保有上限
in depot|列車庫に残っています
NEW|新品
EMPTY STALL|空き区画
Phase & Rust Event|フェーズ・廃車イベント
PRESIDENTIAL SOLVENCY|社長の支払能力
Bank exhaustion · required operating set completed|銀行の資金切れ・必要な経営ラウンドが終了
Presidential bankruptcy · immediate ending|社長の破産・ゲーム終了
Personal cash + stock value + open privates. Corporate treasury is excluded.|個人資金＋保有株式の評価額＋営業中のプライベート会社の価値。会社資金は含みません。
The host opens the Shikoku ledger|主催者が四国の台帳を開きます
Membership card stamped|会員証に押印
Tabletop|ゲーム卓
View results|結果を見る
Time unavailable|時刻不明
Local testing controls|ローカルテスト操作
Stock action and transaction controls|株式の売買操作
Current match summary|現在の対局の情報
Viewing context|表示中の局面
Primary game views|主要なゲーム画面
Historical replay controls|棋譜の再生操作
Historical replay timeline|棋譜のタイムライン
Seated club members and turn status|着席メンバー・手番
Stock Market information windows|株式市場の情報ウィンドウ
Draggable Stock Market information windows|移動可能な株式情報ウィンドウ
Toggle background music|BGMのオン・オフ
Toggle reduced motion|アニメーションのオン・オフ
Train routes · two trains|列車ルート・2列車
Three trains · 3 / 3 / 4 stops|3列車・3／3／4停車地
Four trains · branching network|4列車・分岐路線
Play current turn|手番プレイヤーで操作
Tea is ready…|お茶が入りました…
Inspect · Shift+Enter on a hex|確認・ヘクスでShift+Enter
`;
const corePairs=`
Playing|再生中
Loading music…|音楽を読込中…
Waiting for interaction|画面の操作を待っています
Audio unavailable|音声を利用できません
Stopped|停止中
This railway joins the next operating round.|この鉄道会社は次の経営ラウンドから運行します。
District Survey|地域調査
Operating Order|経営順
Trains & Routes|列車・ルート
Private Powers|プライベート会社の能力
Operating Log|経営記録
PRESIDENT OF|社長
ACTING AS CORPORATION · CORPORATE FUNDS|会社として操作中・会社資金を使用
Recommended Route Plan|推奨ルート計画
All trains · total revenue|全列車の総収入
Change stops|停車地を変更
Change a train’s stops, or run this plan.|列車の停車地を変更するか、この計画で運行してください。
Click a highlighted stop on the map, or choose it below. Other trains keep their routes.|マップの強調された停車地、または下の一覧から選んでください。他の列車のルートは維持されます。
Finding connected stops…|接続する停車地を検索中…
Choose a starting stop. Highlighted stops have a legal connection.|出発地を選んでください。強調された停車地には有効な接続があります。
Choose the next stop. Highlighted stops have a legal connection.|次の停車地を選んでください。強調された停車地には有効な接続があります。
Route complete. Use this route or undo a stop to change it.|ルートが完成しました。採用するか、停車地を戻して変更できます。
No route fits these stops with the other trains. Undo a stop, or cancel and free another train’s route.|他の列車との競合のため、この停車地ではルートを作れません。停車地を戻すか、編集をやめて他の列車のルートを解除してください。
Updating revenue…|収入を更新中…
Updating…|更新中…
Choose stops on the map|マップで停車地を選択
No stop limit|停車地数の制限なし
New trains can run next operating turn.|新しい列車は次の経営手番から運行できます。
Companies are offered on block in the order shown below.|会社は下記の順で売り出されます。
ON BLOCK|出品中
OFFER|提示額
SELECT TO INSPECT|選択して確認
INSPECT TO PREPARE BID|確認して入札を準備
IN ORDER|番目
MIN|最低額
BENEFIT|収益・能力
Blocks K4 · Buyout ¥10–¥40|K4を予約・会社売却価格10〜40円
Port Tile #437 (¥30 Town)|港タイル#437（収入30円の町）
Blocks C4 · Free Green Tile|C4を予約・無料の緑タイル敷設
Ignores ¥80 Mountain Cost|山岳の建設費80円を免除
Exchange → 10% IR Share|IR株10％と交換
High Yield · Buyout ¥40–¥160|高収益・会社売却価格40〜160円
Phase 5+: Stays Open @ ¥50/OR|フェーズ5以降も営業・毎経営ラウンド50円
Pays ¥5/OR. Blocks K4 (Takamatsu) while player-owned; may be sold to a corporation in Phase 3+ for ¥10–¥40.|毎経営ラウンド5円。プレイヤー所有中はK4（高松）を予約します。フェーズ3以降、株式会社に10〜40円で売却できます。
Pays ¥5/OR. Owning player may lay permanent ¥30 port tile #437 on coastal towns B11, G10, I12, or J9.|毎経営ラウンド5円。所有プレイヤーはB11・G10・I12・J9の海岸の町に、収入30円の永久港タイル#437を敷設できます。
Pays ¥10/OR. Blocks C4 while player-owned; when sold to a corporation, seller may lay a free green tile on C4.|毎経営ラウンド10円。プレイヤー所有中はC4を予約します。株式会社への売却時、売り手はC4に緑タイルを無料で敷設できます。
Pays ¥15/OR. Owning corporation ignores pure mountain terrain costs (saves ¥80 per mountain hex).|毎経営ラウンド15円。所有する株式会社は山岳のみの地形費用を無視できます（山岳ヘクスごとに80円節約）。
Pays ¥15/OR. Owning player may close DR to exchange for a 10% IPO share of Iyo Railway (IR).|毎経営ラウンド15円。所有プレイヤーはDRを閉鎖し、伊予鉄道（IR）の未購入株式10％と交換できます。
Pays ¥20/OR. High-yield Meiji feeder line; may be sold to a corporation in Phase 3+ for up to ¥160.|毎経営ラウンド20円。高収益の支線です。フェーズ3以降、株式会社に最大160円で売却できます。
Pays ¥30/OR. If still player-owned at Phase 5, stays open permanently and increases revenue to ¥50/OR!|毎経営ラウンド30円。フェーズ5でもプレイヤー所有なら永久に存続し、収入が毎経営ラウンド50円に増えます。
Current Offer|現在の提示額
Your Position|あなたの状況
Turn|手番
Additional|追加額
Private|プライベート会社
Buy immediately|すぐに購入
Your total escrow|あなたの入札預託金合計
Your bid|あなたの入札額
Additional commitment|追加の預託額
On offer|出品中
No bid submitted|まだ入札していません
Bidding and Information|入札・会社情報
Auction commitment|入札・購入による変化
Takamatsu E-Railroad|高松電気軌道
Mitsubishi Ferry|三菱連絡船
Ehime Railway|愛媛鉄道
Sumitomo Mines Railway|住友鉱山鉄道
Dougo Railway|道後鉄道
South Iyo Railway|南予鉄道
Uno-Takamatsu Ferry|宇高連絡船
Awa Railroad|阿波鉄道
Iyo Railway|伊予鉄道
Sanuki Railway|讃岐鉄道
Takamatsu & Kotohira Electric Railway|高松琴平電気鉄道
Takamatsu & Kotohira Electric|高松琴平電気鉄道
Tosa Electric Railway|土佐電気鉄道
Tosa Kuroshio Railway|土佐くろしお鉄道
Uwajima Railway|宇和島鉄道
Tokushima|徳島
Matsuyama|松山
Marugame|丸亀
Takamatsu|高松
Kochi|高知
Sukumo|宿毛
Uwajima|宇和島
Saijo|西条
Niihama|新居浜
Ikeda|池田
SukumoWest|宿毛西部
Anan|阿南
Nankoku|南国
Nakamura|中村
Ritsurin|栗林
Shimizu|清水
Susaki|須崎
Mugi|牟岐
Komatsushima|小松島
Kotohira|琴平
Ozu|大洲
Yawatahama|八幡浜
Muroto|室戸
Imabari / Onomichi Ferry|今治・尾道連絡船
ImabariOnomichi Ferry|今治・尾道連絡船
Sakaide / Okayama Ferry|坂出・岡山連絡船
SakaideOkayama Ferry|坂出・岡山連絡船
Naruto / Osaka Ferry|鳴門・大阪連絡船
NarutoOsaka Ferry|鳴門・大阪連絡船
Hex|ヘクス
Tok|駅トークン
STEP|ステップ
Step|ステップ
Operating|経営
Company Map|会社マップ
map|マップ
Share|株式
Shares|株式
Train step|列車ステップ
Laying track|線路敷設
Running trains|列車運行
New trains|新しい列車
Station placed|駅を配置済み
Track laid|線路を敷設済み
`;
export const translations=new Map();
for(const line of `${pairs}\n${extraPairs}\n${corePairs}`.trim().split('\n')){const cut=line.indexOf('|');if(cut>0)translations.set(line.slice(0,cut).toLowerCase(),line.slice(cut+1));}
translations.set('finish turn & advance seat','手番を終了して次へ');
translations.set('finish turn','手番を終了');
translations.set('purchase complete — click finish turn on the ticket.','購入完了・伝票の「手番を終了」を押して進んでください。');
translations.set('certificate purchased. use the highlighted finish turn control to advance play.','株券を購入しました。強調された「手番を終了」で次へ進んでください。');
translations.set('runs 2 stops · rusts when the first 4-train is bought','2停車地を運行・最初の4列車の購入で廃車');
translations.set('phase 3 · green track & private purchases · rusts at phase 6','フェーズ3・緑タイルと会社購入が解禁・フェーズ6で廃車');
translations.set('phase 4 · rusts all 2-trains · train limit becomes 3','フェーズ4・全2列車が廃車・保有上限3台');
translations.set('phase 5 · brown track · train limit becomes 2 · permanent','フェーズ5・茶色タイル解禁・保有上限2台・廃車なし');
translations.set('phase 6 · rusts all 3-trains · permanent','フェーズ6・全3列車が廃車・廃車なし');
translations.set('phase d · rusts all 4-trains · permanent','フェーズD・全4列車が廃車・廃車なし');
translations.set('private purchases open in phase 3','プライベート会社の購入はフェーズ3から');
translations.set('no counterpart available','取引相手なし');
translations.set('all trains','全列車');
translations.set('this action is unavailable for this seat.','この席ではこの操作を実行できません。');
translations.set('train','列車');
translations.set('all trains','全列車');
translations.set('president of','社長');
translations.set('run trains','列車運行');
translations.set('mkt','株価');
translations.set('imabari','今治');
translations.set('onomichi ferry','尾道連絡船');
translations.set('sakaide','坂出');
translations.set('okayama ferry','岡山連絡船');
translations.set('naruto','鳴門');
translations.set('osaka ferry','大阪連絡船');
translations.set('west','西部');
translations.set('buy','購入');
translations.set('buys','購入');
translations.set('purse','個人の財布');
translations.set('per train','列車ごと');

const fragmentExcluded=new Set(['on','off','place']);
const escaped=[...translations.keys()].filter(key=>!fragmentExcluded.has(key)).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const fragments=new RegExp(`(?<![A-Za-z])(?:${escaped.join('|')})(?![A-Za-z])`,'gi');
const patterns=[
 [/^(.+) buys (.+)-Train \(#(.+)\) for (¥[\d,]+)$/,(_,id,type,serial,cost)=>`${id}が${type}列車（#${serial}）を${cost}で購入`],
 [/^(.+?) pays out (¥[\d,]+) in dividends to shareholders(?: · Rev (\d+))?$/,(_,id,money,rev)=>`${id}が${money}を配当${rev?`・局面${rev}`:''}`],
 [/^(.+) ends turn( → (.+) Round)?$/,(_,name,transition,round)=>`${name}が手番を終了${round?` → ${round}ラウンド`:''}`],
 [/^(.+) passes → (.+) Round$/,(_,name,round)=>`${name}がパス → ${round}ラウンド`],
 [/^(.+) \((.+)\) lays tile #(.+) on (.+)$/,(_,id,name,tile,hex)=>`${id}（${name}）が${hex}にタイル#${tile}を敷設`],
 [/^YOU ARE ACTING AS PRESIDENT OF (.+) · STEP (.+): (.+)$/,(_,id,step,action)=>`${id}の社長として操作中・ステップ${step}：${action}`],
 [/^Up to (\d+) stops$/,(_,n)=>`最大${n}停車地`],
 [/^Editing (.+) Stops$/,(_,id)=>`${id}の停車地を編集中`],
 [/^Run (.+) trains$/,(_,id)=>`${id}の列車を運行`],
 [/^(.+) has no trains yet\.$/,(_,id)=>`${id}はまだ列車を所有していません。`],
 [/^(.+) skips step$/,(_,name)=>`${name}がステップを省略`],
 [/^Inspect (.+) to prepare a bid$/,(_,id)=>`${id}を確認して入札を準備`],
 [/^Buy Now for (.+)$/,(_,price)=>`${price}で今すぐ購入`],
 [/^Pays (.+)\/OR$/,(_,price)=>`毎経営ラウンド${price}`],
 [/^(.+) acquires (.+) \((.+)\) for (.+)$/,(_,name,id,company,value)=>`${name}が${id}（${company}）を${value}で取得`],
 [/^(.+) passes$/,(_,name)=>`${name}がパス`],
 [/^(.+) ends (?:the )?(?:stock )?turn$/,(_,name)=>`${name}が手番を終了`],
 [/^(.+) sets (.+) par at (.+) & buys President's share \(20%\)$/,(_,name,id,price)=>`${name}が${id}の基準株価を${price}に設定し、社長株20％を購入`],
 [/^Set Par (.+) & Buy (.+)% (.+) \((.+)\)$/,(_,par,pct,id,cost)=>`基準株価${par}を設定・${id}株${pct}％を購入（${cost}）`],
 [/^Buy (.+)% (.+) from (.+)$/,(_,pct,id,source)=>`${source}から${id}株${pct}％を購入`],
 [/^Buy (.+)% (.+) \((.+)\)$/,(_,pct,id,cost)=>`${id}株${pct}％を購入（${cost}）`],
 [/^Sell (.+)% (.+)$/,(_,pct,id)=>`${id}株${pct}％を売却`],
 [/^Exchange Dougo Railway \(DR\) → 10% IR$/,()=>`道後鉄道（DR）をIR株10％と交換`],
 [/^Exchange DR for 10% IR from IPO$/,()=>`DRを未購入のIR株10％と交換`],
 [/^Purchase preview: one 20% President's certificate for (.+)\. The server checks the move when submitted\.$/,(_,cost)=>`社長株20％を1枚、${cost}で購入します。確定時にルールを確認します。`],
 [/^Purchase preview: (.+) certificate\(s\), (.+)%, from (.+) for (.+)\. The server checks the move when submitted\.$/,(_,count,pct,source,cost)=>`${source}から${count}枚（${pct}％）を${cost}で購入します。確定時にルールを確認します。`],
 [/^View revision (\d+)$/,(_,n)=>`局面${n}を見る`],
 [/^Inspect (.+)'s position \((.+)\)$/,(_,name,id)=>`${name}の状況を確認（${id}）`],
 [/^(.+)'s holding$/,(_,name)=>`${name}の保有株`],
 [/^Player (\d+) name$/,(_,n)=>`プレイヤー${n}の名前`],
 [/^First revision \(Rev (\d+)\)$/,(_,n)=>`最初の局面（${n}）`],
 [/^Buy (.+)-Train · (.+)$/,(_,train,cost)=>`${train}列車を購入・${cost}`],
 [/^Train has no connected route$/,()=>`列車に接続する有効なルートがありません`],
 [/^Corporation owns 0 trains$/,()=>`会社は列車を所有していません`],
 [/^No trains — Skip to Train Step \((.+)\)$/,(_,value)=>`所有列車なし・列車購入へ進む（${value}）`],
 [/^No legal route — Skip to Train Step \((.+)\)$/,(_,value)=>`有効なルートなし・列車購入へ進む（${value}）`],
 [/^Shows the recommended stops and total revenue\. Run the plan when ready\.$/,()=>`推奨停車地と総収入を表示します。準備ができたら運行してください。`],
 [/^Click a highlighted hex on the map to preview legal track tiles for (.+)\.$/,(_,id)=>`マップの強調されたヘクスをクリックすると、${id}が敷設できるタイルを確認できます。`],
 [/^Click a connected hex on the map to preview legal tile upgrades using (.+)'s treasury \((.+)\), or click Skip Step\.$/,(_,id,cash)=>`接続するヘクスをクリックし、${id}の会社資金（${cash}）で敷設できるタイルを確認するか、ステップを省略してください。`],
 [/^Mandatory: Buy a train for (.+) \((.+) treasury\)\.$/,(_,id,cash)=>`必須：${id}の列車を購入してください（会社資金${cash}）。`],
 [/^Mandatory train obligation locks End (.+) Turn until a train is acquired\.$/,(_,id)=>`列車購入義務があるため、購入するまで${id}の手番を終了できません。`],
 [/^Purchases use corporate treasury funds\. When finished, click End Operating Turn\.$/,()=>`購入には会社資金を使います。終わったら経営手番を終了してください。`],
 [/^(.+) now operates (\d+) train\(s\)\.$/,(_,id,n)=>`${id}の所有列車は${n}台です。`],
 [/^Phase advances to Phase (.+)!$/,(_,phase)=>`フェーズ${phase}に進みます！`],
 [/^(.+) floats with (.+) treasury!$/,(_,company,cash)=>`${company}が経営開始可能になり、${cash}の会社資金を受領！`],
 [/^(.+) geographic preview centered on (.+)$/,(_,company,home)=>`${company}の所在地・本拠地${home}を中心に表示`],
 [/^(.+) Home (.+)$/,(_,id,home)=>`${id}の本拠地 ${home}`],
 [/^(.+) station$/,(_,id)=>`${id}の駅`],
 [/^Switch to read-only Guest Spectator$/,()=>`閲覧専用の観戦者に切り替える`],
 [/^Current Round: Click to open (.+)$/,(_,screen)=>`現在のラウンド：${screen}を開く`],
 [/^Current Phase: Click to open (.+)$/,(_,screen)=>`現在のステップ：${screen}を開く`],
 [/^Click to open (.+)$/,(_,screen)=>`${screen}を開く`],
 [/^Press (\d+) to open, raise, or toggle (.+)$/,(_,key,screen)=>`${key}キーで${screen}を開く・前面に出す・閉じる`],
 [/^(.*?) is ready to run!$/,(_,c)=>`${c} 運行準備完了！`],
 [/^Enlarge (.+)$/,(_,name)=>`${name}を拡大`],
 [/^Waiting for (.+)\.$/,(_,name)=>`${name}の手番を待っています。`],
 [/^End (.+) Turn$/,(_,name)=>`${name}の手番を終了`],
 [/^Run (\d+) trains? · (.+)$/,(_,n,value)=>`${n}列車を運行・${value}`],
 [/^(.+) is making this decision\.$/,(_,name)=>`${name}が操作しています。`],
 [/^Buy offered (.+)$/,(_,what)=>`出品中の${what}を購入`],
 [/^Stamp & (?:Buy|Confirm) (.+)$/,(_,what)=>`承認して${what}を購入`],
 [/^Stock Round (.+)$/,(_,n)=>`株式ラウンド ${n}`],
 [/^Operating Round (.+)$/,(_,n)=>`経営ラウンド ${n}`],
 [/^Switch this browser tab to (.+)$/,(_,name)=>`このタブを${name}に切り替える`],
 [/^(.+) trains? remaining$/,(_,n)=>`残り${n}列車`],
 [/^(.+) in depot$/,(_,n)=>`列車庫に${n}台`],
 [/^(.+) now holds (.+) of (.+)\.$/,(_,name,pct,company)=>`${name}は${company}の${pct}を保有しています。`],
 [/^(.+) pays out (.+) in dividends to shareholders$/,(_,c,v)=>`${c}が${v}を配当`],
 [/^(.+) withholds (.+) to corporate treasury$/,(_,c,v)=>`${c}が${v}を会社資金に留保`],
 [/^(.+) share price moves to (.+)\.$/,(_,c,v)=>`${c}の株価は${v}へ移動。`],
 [/^(.+) runs (\d+) train\(s\) for (.+) revenue$/,(_,c,n,v)=>`${c}が${n}列車を運行・収入${v}`],
 [/^(.+) buys (.+)% (.+) from (.+) \((.+)\)$/,(_,name,pct,c,source,cost)=>`${name}が${source}から${c}株${pct}％を購入（${cost}）`],
 [/^(.+) sells (.+)% (.+) to Bank Pool \((.+)\)$/,(_,name,pct,c,v)=>`${name}が${c}株${pct}％を公開市場へ売却（${v}）`],
 [/^(.+) purchases (.+) train$/,(_,c,train)=>`${c}が列車${train}を購入`],
 [/^(.+) performs (.+)$/,(_,name,action)=>`${name}：${action}`],
 [/^Could not load revision (\d+): (.+)$/,(_,rev,error)=>`局面${rev}を読み込めません：${error}`],
 [/^Move not accepted: (.+)$/,(_,error)=>`操作を受け付けられません：${error}`],
];
function translateUnprotected(value,language=locale){
  if(language!=='ja' || !value)return value;
  const text=String(value),trimmed=text.trim();
  const direct=translations.get(trimmed.toLowerCase());
  if(direct)return text.replace(trimmed,direct);
  let result=trimmed;
  for(const [pattern,format]of patterns)if(pattern.test(result)){result=result.replace(pattern,format);break;}
  result=result.replace(fragments,key=>translations.get(key.toLowerCase()));
  return text.replace(trimmed,result);
}
export function translate(value,language=locale){
  if(language!=='ja' || !value)return value;
  const protectedParts=[];let masked=String(value);
  for(const name of [...protectedValues].sort((a,b)=>b.length-a.length)){
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    masked=masked.replace(new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`,'g'),match=>{protectedParts.push(match);return `\uE000${protectedParts.length-1}\uE001`;});
  }
  return translateUnprotected(masked,language).replace(/\uE000(\d+)\uE001/g,(_,index)=>protectedParts[Number(index)]);
}
const textOriginals=new WeakMap(),attributeOriginals=new WeakMap();
let protectedValues=new Set();
export function localize(root=globalThis.document,view){
  if(!root)return;
  if(view)protectedValues=new Set([...Object.values(view.state?.players || {}).map(p=>p.name),view.host?.name,view.title].filter(value=>typeof value==='string' && value));
  const doc=root.ownerDocument || root;
  if(doc.documentElement)doc.documentElement.lang=locale;
  const skip=el=>el?.closest?.('[data-no-translate],script,style,textarea,[contenteditable="true"],.note-text,.table-note,.chat-message');
  const walker=doc.createTreeWalker(root,4);let node;
  while((node=walker.nextNode())){
    if(skip(node.parentElement) || !node.nodeValue.trim() || protectedValues.has(node.nodeValue.trim()))continue;
    let record=textOriginals.get(node);
    if(!record || node.nodeValue!==record.last)record={source:node.nodeValue};
    record.last=translate(record.source);if(node.nodeValue!==record.last)node.nodeValue=record.last;
    textOriginals.set(node,record);
  }
  root.querySelectorAll?.('[title],[aria-label],[placeholder]').forEach(el=>{
    if(skip(el))return;
    const record=attributeOriginals.get(el) || {};
    for(const key of ['title','aria-label','placeholder']){
      const current=el.getAttribute(key);if(!current)continue;
      const previous=record[key];const source=previous&&previous.last===current?previous.source:current;
      const last=translate(source);if(last!==current)el.setAttribute(key,last);record[key]={source,last};
    }
    attributeOriginals.set(el,record);
  });
}
