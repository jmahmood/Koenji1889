# Second UI playthrough — accepted action ledger

Room DM0GHF. Exported read-only from SQLite after UI play. This records committed actions, not failed native inputs. See second-run-evidence for browser observations.

| Revision | Time | Actor | Accepted action | Bank | Personal / corporate cash deltas |
|---:|---|---|---|---:|---|
| 1 | 2026-10-19T04:55:43Z | p1 | Aki Aggressive bids ¥155 on UTF (Uno-Takamatsu Ferry) | 5320 | {"p1": -155} |
| 2 | 2026-10-19T04:55:56Z | p2 | Chi Conservative acquires TR (Takamatsu E-Railroad) for ¥20 | 5340 | {"p2": -20} |
| 3 | 2026-10-19T04:56:08Z | p3 | Osa Opportunistic passes | 5340 | {} |
| 4 | 2026-10-19T04:56:17Z | p4 | Nori Newcomer acquires MF (Mitsubishi Ferry) for ¥30 | 5370 | {"p4": -30} |
| 5 | 2026-10-19T04:56:25Z | p1 | Aki Aggressive acquires ER (Ehime Railway) for ¥40 | 5410 | {"p1": -40} |
| 6 | 2026-10-19T04:56:34Z | p2 | Chi Conservative acquires SMR (Sumitomo Mines Railway) for ¥50 | 5460 | {"p2": -50} |
| 7 | 2026-10-19T04:56:39Z | p3 | Osa Opportunistic acquires DR (Dougo Railway) for ¥60 | 5520 | {"p3": -60} |
| 8 | 2026-10-19T04:56:45Z | p4 | Nori Newcomer acquires SIR (South Iyo Railway) for ¥80 | 5755 | {"p4": -80} |
| 9 | 2026-10-19T04:56:57Z | p2 | Chi Conservative sets IR par at ¥80 & buys President's share (20%) | 5915 | {"p2": -160} |
| 10 | 2026-10-19T04:56:59Z | p2 | Chi Conservative ends turn | 5915 | {} |
| 11 | 2026-10-19T04:57:08Z | p3 | Osa Opportunistic performs exchange_private | 5915 | {} |
| 12 | 2026-10-19T04:57:18Z | p3 | Osa Opportunistic sets AR par at ¥80 & buys President's share (20%) | 6075 | {"p3": -160} |
| 13 | 2026-10-19T04:57:30Z | p3 | Osa Opportunistic ends turn | 6075 | {} |
| 14 | 2026-10-19T04:57:38Z | p4 | Nori Newcomer buys 10% IR from IPO (¥80) | 6155 | {"p4": -80} |
| 15 | 2026-10-19T04:57:41Z | p4 | Nori Newcomer ends turn | 6155 | {} |
| 16 | 2026-10-19T04:57:50Z | p1 | Aki Aggressive buys 10% IR from IPO (¥80) | 5435 | {"p1": -80, "IR": 800} |
| 17 | 2026-10-19T04:57:54Z | p1 | Aki Aggressive ends turn | 5435 | {} |
| 18 | 2026-10-19T04:58:02Z | p2 | Chi Conservative buys 10% AR from IPO (¥80) | 5515 | {"p2": -80} |
| 19 | 2026-10-19T04:58:15Z | p2 | Chi Conservative ends turn | 5515 | {} |
| 20 | 2026-10-19T04:58:20Z | p3 | Osa Opportunistic buys 10% AR from IPO (¥80) | 5595 | {"p3": -80} |
| 21 | 2026-10-19T04:58:23Z | p3 | Osa Opportunistic ends turn | 5595 | {} |
| 22 | 2026-10-19T04:58:35Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 4875 | {"p4": -80, "AR": 800} |
| 23 | 2026-10-19T04:58:37Z | p4 | Nori Newcomer ends turn | 4875 | {} |
| 24 | 2026-10-19T04:58:42Z | p1 | Aki Aggressive passes | 4875 | {} |
| 25 | 2026-10-19T04:58:46Z | p2 | Chi Conservative passes | 4875 | {} |
| 26 | 2026-10-19T04:58:50Z | p3 | Osa Opportunistic passes | 4875 | {} |
| 27 | 2026-10-19T04:58:55Z | p4 | Nori Newcomer passes → Operating Round | 4790 | {"p1": 40, "p2": 20, "p4": 25} |
| 28 | 2026-10-19T04:59:11Z | p4 | Nori Newcomer lays special (MF) tile #437 on G10 | 4790 | {} |
| 29 | 2026-10-19T04:59:21Z | p2 | IR (Chi Conservative) lays tile #57 on E2 | 4790 | {} |
| 30 | 2026-10-19T04:59:26Z | p2 | Chi Conservative skips step | 4790 | {} |
| 31 | 2026-10-19T04:59:32Z | p2 | IR withholds ¥0 to corporate treasury | 4790 | {} |
| 32 | 2026-10-19T04:59:34Z | p2 | IR purchases 2-0 train | 4870 | {"IR": -80} |
| 33 | 2026-10-19T04:59:42Z | p2 | IR purchases 2-1 train | 4950 | {"IR": -80} |
| 34 | 2026-10-19T04:59:44Z | p2 | Chi Conservative ends turn | 4950 | {} |
| 35 | 2026-10-19T04:59:54Z | p3 | AR (Osa Opportunistic) lays tile #57 on K8 | 4950 | {} |
| 36 | 2026-10-19T04:59:58Z | p3 | Osa Opportunistic skips step | 4950 | {} |
| 37 | 2026-10-19T05:00:02Z | p3 | AR withholds ¥0 to corporate treasury | 4950 | {} |
| 38 | 2026-10-19T05:00:10Z | p3 | AR purchases 2-2 train | 5030 | {"AR": -80} |
| 39 | 2026-10-19T05:00:15Z | p3 | AR purchases 2-3 train | 5110 | {"AR": -80} |
| 40 | 2026-10-19T05:00:37Z | p3 | AR purchases 2-4 train | 5190 | {"AR": -80} |
| 41 | 2026-10-19T05:00:42Z | p3 | AR purchases 2-5 train | 5270 | {"AR": -80} |
| 42 | 2026-10-19T05:00:46Z | p3 | Osa Opportunistic ends turn → Stock Round | 5270 | {} |
| 43 | 2026-10-19T05:01:45Z | p1 | Aki Aggressive passes | 5270 | {} |
| 44 | 2026-10-19T05:01:50Z | p2 | Chi Conservative passes | 5270 | {} |
| 45 | 2026-10-19T05:01:56Z | p3 | Osa Opportunistic passes | 5270 | {} |
| 46 | 2026-10-19T05:02:04Z | p4 | Nori Newcomer passes → Operating Round | 5185 | {"p1": 40, "p2": 20, "p4": 25} |
| 47 | 2026-10-19T05:02:17Z | p2 | IR (Chi Conservative) lays tile #9 on D3 | 5185 | {} |
| 48 | 2026-10-19T05:02:19Z | p2 | Chi Conservative skips step | 5185 | {} |
| 49 | 2026-10-19T05:02:42Z | p2 | IR runs 1 train(s) for ¥50 revenue | 5185 | {} |
| 50 | 2026-10-19T05:02:48Z | p2 | IR withholds ¥50 to corporate treasury | 5135 | {"IR": 50} |
| 51 | 2026-10-19T05:02:54Z | p2 | IR purchases 3-0 train | 5315 | {"IR": -180} |
| 52 | 2026-10-19T05:03:00Z | p2 | IR purchases 3-1 train | 5495 | {"IR": -180} |
| 53 | 2026-10-19T05:03:04Z | p2 | Chi Conservative ends turn | 5495 | {} |
| 54 | 2026-10-19T05:03:14Z | p3 | AR (Osa Opportunistic) lays tile #15 on K8 | 5495 | {} |
| 55 | 2026-10-19T05:03:18Z | p3 | Osa Opportunistic skips step | 5495 | {} |
| 56 | 2026-10-19T05:03:32Z | p3 | AR runs 1 train(s) for ¥50 revenue | 5495 | {} |
| 57 | 2026-10-19T05:03:35Z | p3 | AR pays out ¥50 in dividends to shareholders | 5470 | {"p2": 5, "p3": 15, "p4": 5} |
| 58 | 2026-10-19T05:03:55Z | p3 | Osa Opportunistic performs offer | 5470 | {} |
| 59 | 2026-10-19T05:04:05Z | p1 | Aki Aggressive performs offer | 5470 | {} |
| 60 | 2026-10-19T05:04:17Z | p3 | AR purchases private ER for ¥40 | 5470 | {"p1": 40, "AR": -40} |
| 61 | 2026-10-19T05:04:29Z | p1 | AR (Aki Aggressive) lays tile #12 on C4 | 5470 | {} |
| 62 | 2026-10-19T05:04:39Z | p3 | Osa Opportunistic ends turn → Stock Round | 5470 | {} |
| 63 | 2026-10-19T05:05:01Z | p1 | Aki Aggressive sets SR par at ¥65 & buys President's share (20%) | 5600 | {"p1": -130} |
| 64 | 2026-10-19T05:05:04Z | p1 | Aki Aggressive ends turn | 5600 | {} |
| 65 | 2026-10-19T05:05:46Z | p2 | Chi Conservative buys 10% SR from IPO (¥65) | 5665 | {"p2": -65} |
| 66 | 2026-10-19T05:05:50Z | p2 | Chi Conservative ends turn | 5665 | {} |
| 67 | 2026-10-19T05:06:04Z | p3 | Osa Opportunistic buys 10% SR from IPO (¥65) | 5730 | {"p3": -65} |
| 68 | 2026-10-19T05:06:06Z | p3 | Osa Opportunistic ends turn | 5730 | {} |
| 69 | 2026-10-19T05:06:16Z | p4 | Nori Newcomer buys 10% SR from IPO (¥65) | 5145 | {"p4": -65, "SR": 650} |
| 70 | 2026-10-19T05:06:19Z | p4 | Nori Newcomer ends turn | 5145 | {} |
| 71 | 2026-10-19T05:06:26Z | p1 | Aki Aggressive passes | 5145 | {} |
| 72 | 2026-10-19T05:06:27Z | p2 | Chi Conservative passes | 5145 | {} |
| 73 | 2026-10-19T05:06:29Z | p3 | Osa Opportunistic passes | 5145 | {} |
| 74 | 2026-10-19T05:06:32Z | p4 | Nori Newcomer passes → Operating Round | 5060 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 75 | 2026-10-19T05:06:52Z | p3 | AR (Osa Opportunistic) lays tile #58 on J9 | 5060 | {} |
| 76 | 2026-10-19T05:06:56Z | p3 | Osa Opportunistic skips step | 5060 | {} |
| 77 | 2026-10-19T05:07:07Z | p3 | AR runs 2 train(s) for ¥90 revenue | 5060 | {} |
| 78 | 2026-10-19T05:07:10Z | p3 | AR pays out ¥90 in dividends to shareholders | 5015 | {"p2": 9, "p3": 27, "p4": 9} |
| 79 | 2026-10-19T05:07:13Z | p3 | Osa Opportunistic ends turn | 5015 | {} |
| 80 | 2026-10-19T05:07:22Z | p2 | IR (Chi Conservative) lays tile #15 on E2 | 5015 | {} |
| 81 | 2026-10-19T05:07:25Z | p2 | Chi Conservative skips step | 5015 | {} |
| 82 | 2026-10-19T05:07:32Z | p2 | IR runs 1 train(s) for ¥60 revenue | 5015 | {} |
| 83 | 2026-10-19T05:07:35Z | p2 | IR withholds ¥60 to corporate treasury | 4955 | {"IR": 60} |
| 84 | 2026-10-19T05:07:37Z | p2 | Chi Conservative ends turn | 4955 | {} |
| 85 | 2026-10-19T05:07:53Z | p1 | SR (Aki Aggressive) lays tile #6 on I2 | 4955 | {} |
| 86 | 2026-10-19T05:07:56Z | p1 | Aki Aggressive skips step | 4955 | {} |
| 87 | 2026-10-19T05:07:57Z | p1 | SR withholds ¥0 to corporate treasury | 4955 | {} |
| 88 | 2026-10-19T05:07:59Z | p1 | SR purchases 3-2 train | 5135 | {"SR": -180} |
| 89 | 2026-10-19T05:08:02Z | p1 | SR purchases 3-3 train | 5315 | {"SR": -180} |
| 90 | 2026-10-19T05:08:05Z | p1 | SR purchases 3-4 train | 5495 | {"SR": -180} |
| 91 | 2026-10-19T05:08:11Z | p1 | Aki Aggressive ends turn | 5410 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 92 | 2026-10-19T05:08:21Z | p3 | Osa Opportunistic skips step | 5410 | {} |
| 93 | 2026-10-19T05:08:22Z | p3 | Osa Opportunistic skips step | 5410 | {} |
| 94 | 2026-10-19T05:08:25Z | p3 | AR runs 2 train(s) for ¥90 revenue | 5410 | {} |
| 95 | 2026-10-19T05:08:27Z | p3 | AR pays out ¥90 in dividends to shareholders | 5365 | {"p2": 9, "p3": 27, "p4": 9} |
| 96 | 2026-10-19T05:08:29Z | p3 | Osa Opportunistic ends turn | 5365 | {} |
| 97 | 2026-10-19T05:08:37Z | p2 | Chi Conservative skips step | 5365 | {} |
| 98 | 2026-10-19T05:08:38Z | p2 | Chi Conservative skips step | 5365 | {} |
| 99 | 2026-10-19T05:08:41Z | p2 | IR runs 1 train(s) for ¥60 revenue | 5365 | {} |
| 100 | 2026-10-19T05:08:43Z | p2 | IR withholds ¥60 to corporate treasury | 5305 | {"IR": 60} |
| 101 | 2026-10-19T05:08:44Z | p2 | Chi Conservative ends turn | 5305 | {} |
| 102 | 2026-10-19T05:08:52Z | p1 | Aki Aggressive skips step | 5305 | {} |
| 103 | 2026-10-19T05:08:53Z | p1 | Aki Aggressive skips step | 5305 | {} |
| 104 | 2026-10-19T05:08:56Z | p1 | SR runs 1 train(s) for ¥40 revenue | 5305 | {} |
| 105 | 2026-10-19T05:08:58Z | p1 | SR withholds ¥40 to corporate treasury | 5265 | {"SR": 40} |
| 106 | 2026-10-19T05:09:10Z | p1 | Aki Aggressive ends turn → Stock Round | 5265 | {} |
| 107 | 2026-10-19T05:09:26Z | p1 | Aki Aggressive passes | 5265 | {} |
| 108 | 2026-10-19T05:09:29Z | p2 | Chi Conservative passes | 5265 | {} |
| 109 | 2026-10-19T05:09:36Z | p3 | Osa Opportunistic passes | 5265 | {} |
| 110 | 2026-10-19T05:09:40Z | p4 | Nori Newcomer passes → Operating Round | 5180 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 111 | 2026-10-19T05:09:44Z | p3 | Osa Opportunistic skips step | 5180 | {} |
| 112 | 2026-10-19T05:09:46Z | p3 | Osa Opportunistic skips step | 5180 | {} |
| 113 | 2026-10-19T05:09:49Z | p3 | AR runs 2 train(s) for ¥90 revenue | 5180 | {} |
| 114 | 2026-10-19T05:09:51Z | p3 | AR pays out ¥90 in dividends to shareholders | 5135 | {"p2": 9, "p3": 27, "p4": 9} |
| 115 | 2026-10-19T05:09:52Z | p3 | Osa Opportunistic ends turn | 5135 | {} |
| 116 | 2026-10-19T05:09:58Z | p2 | Chi Conservative skips step | 5135 | {} |
| 117 | 2026-10-19T05:10:00Z | p2 | Chi Conservative skips step | 5135 | {} |
| 118 | 2026-10-19T05:10:03Z | p2 | IR runs 1 train(s) for ¥60 revenue | 5135 | {} |
| 119 | 2026-10-19T05:10:05Z | p2 | IR withholds ¥60 to corporate treasury | 5075 | {"IR": 60} |
| 120 | 2026-10-19T05:10:06Z | p2 | Chi Conservative ends turn | 5075 | {} |
| 121 | 2026-10-19T05:10:15Z | p1 | Aki Aggressive skips step | 5075 | {} |
| 122 | 2026-10-19T05:10:16Z | p1 | Aki Aggressive skips step | 5075 | {} |
| 123 | 2026-10-19T05:10:19Z | p1 | SR runs 1 train(s) for ¥40 revenue | 5075 | {} |
| 124 | 2026-10-19T05:10:20Z | p1 | SR withholds ¥40 to corporate treasury | 5035 | {"SR": 40} |
| 125 | 2026-10-19T05:10:21Z | p1 | Aki Aggressive ends turn | 4950 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 126 | 2026-10-19T05:10:26Z | p3 | Osa Opportunistic skips step | 4950 | {} |
| 127 | 2026-10-19T05:10:27Z | p3 | Osa Opportunistic skips step | 4950 | {} |
| 128 | 2026-10-19T05:10:30Z | p3 | AR runs 2 train(s) for ¥90 revenue | 4950 | {} |
| 129 | 2026-10-19T05:10:32Z | p3 | AR pays out ¥90 in dividends to shareholders | 4905 | {"p2": 9, "p3": 27, "p4": 9} |
| 130 | 2026-10-19T05:10:33Z | p3 | Osa Opportunistic ends turn | 4905 | {} |
| 131 | 2026-10-19T05:10:38Z | p2 | Chi Conservative skips step | 4905 | {} |
| 132 | 2026-10-19T05:10:39Z | p2 | Chi Conservative skips step | 4905 | {} |
| 133 | 2026-10-19T05:10:42Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4905 | {} |
| 134 | 2026-10-19T05:10:43Z | p2 | IR withholds ¥60 to corporate treasury | 4845 | {"IR": 60} |
| 135 | 2026-10-19T05:10:44Z | p2 | Chi Conservative ends turn | 4845 | {} |
| 136 | 2026-10-19T05:10:49Z | p1 | Aki Aggressive skips step | 4845 | {} |
| 137 | 2026-10-19T05:10:50Z | p1 | Aki Aggressive skips step | 4845 | {} |
| 138 | 2026-10-19T05:10:52Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4845 | {} |
| 139 | 2026-10-19T05:10:54Z | p1 | SR withholds ¥40 to corporate treasury | 4805 | {"SR": 40} |
| 140 | 2026-10-19T05:10:55Z | p1 | Aki Aggressive ends turn → Stock Round | 4805 | {} |
| 141 | 2026-10-19T05:11:04Z | p1 | Aki Aggressive passes | 4805 | {} |
| 142 | 2026-10-19T05:11:06Z | p2 | Chi Conservative passes | 4805 | {} |
| 143 | 2026-10-19T05:11:08Z | p3 | Osa Opportunistic passes | 4805 | {} |
| 144 | 2026-10-19T05:11:11Z | p4 | Nori Newcomer passes → Operating Round | 4720 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 145 | 2026-10-19T05:11:20Z | p3 | Osa Opportunistic skips step | 4720 | {} |
| 146 | 2026-10-19T05:11:21Z | p3 | Osa Opportunistic skips step | 4720 | {} |
| 147 | 2026-10-19T05:11:23Z | p3 | AR runs 2 train(s) for ¥90 revenue | 4720 | {} |
| 148 | 2026-10-19T05:11:25Z | p3 | AR pays out ¥90 in dividends to shareholders | 4675 | {"p2": 9, "p3": 27, "p4": 9} |
| 149 | 2026-10-19T05:11:26Z | p3 | Osa Opportunistic ends turn | 4675 | {} |
| 150 | 2026-10-19T05:11:31Z | p2 | Chi Conservative skips step | 4675 | {} |
| 151 | 2026-10-19T05:11:32Z | p2 | Chi Conservative skips step | 4675 | {} |
| 152 | 2026-10-19T05:11:34Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4675 | {} |
| 153 | 2026-10-19T05:11:36Z | p2 | IR withholds ¥60 to corporate treasury | 4615 | {"IR": 60} |
| 154 | 2026-10-19T05:11:37Z | p2 | Chi Conservative ends turn | 4615 | {} |
| 155 | 2026-10-19T05:11:42Z | p1 | Aki Aggressive skips step | 4615 | {} |
| 156 | 2026-10-19T05:11:43Z | p1 | Aki Aggressive skips step | 4615 | {} |
| 157 | 2026-10-19T05:11:45Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4615 | {} |
| 158 | 2026-10-19T05:11:47Z | p1 | SR withholds ¥40 to corporate treasury | 4575 | {"SR": 40} |
| 159 | 2026-10-19T05:11:55Z | p1 | Aki Aggressive ends turn | 4490 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 160 | 2026-10-19T05:11:59Z | p3 | Osa Opportunistic skips step | 4490 | {} |
| 161 | 2026-10-19T05:12:00Z | p3 | Osa Opportunistic skips step | 4490 | {} |
| 162 | 2026-10-19T05:12:03Z | p3 | AR runs 2 train(s) for ¥90 revenue | 4490 | {} |
| 163 | 2026-10-19T05:12:05Z | p3 | AR pays out ¥90 in dividends to shareholders | 4445 | {"p2": 9, "p3": 27, "p4": 9} |
| 164 | 2026-10-19T05:12:06Z | p3 | Osa Opportunistic ends turn | 4445 | {} |
| 165 | 2026-10-19T05:12:10Z | p2 | Chi Conservative skips step | 4445 | {} |
| 166 | 2026-10-19T05:12:11Z | p2 | Chi Conservative skips step | 4445 | {} |
| 167 | 2026-10-19T05:12:14Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4445 | {} |
| 168 | 2026-10-19T05:12:15Z | p2 | IR withholds ¥60 to corporate treasury | 4385 | {"IR": 60} |
| 169 | 2026-10-19T05:12:16Z | p2 | Chi Conservative ends turn | 4385 | {} |
| 170 | 2026-10-19T05:12:21Z | p1 | Aki Aggressive skips step | 4385 | {} |
| 171 | 2026-10-19T05:12:22Z | p1 | Aki Aggressive skips step | 4385 | {} |
| 172 | 2026-10-19T05:12:25Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4385 | {} |
| 173 | 2026-10-19T05:12:26Z | p1 | SR withholds ¥40 to corporate treasury | 4345 | {"SR": 40} |
| 174 | 2026-10-19T05:12:36Z | p1 | SR purchases 4-0 train | 4645 | {"SR": -300} |
| 175 | 2026-10-19T05:12:53Z | p1 | Aki Aggressive performs discard_train | 4645 | {} |
| 176 | 2026-10-19T05:12:54Z | p1 | Aki Aggressive ends turn → Stock Round | 4645 | {} |
| 177 | 2026-10-19T05:13:05Z | p1 | Aki Aggressive passes | 4645 | {} |
| 178 | 2026-10-19T05:13:07Z | p2 | Chi Conservative passes | 4645 | {} |
| 179 | 2026-10-19T05:13:09Z | p3 | Osa Opportunistic passes | 4645 | {} |
| 180 | 2026-10-19T05:13:12Z | p4 | Nori Newcomer passes → Operating Round | 4560 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 181 | 2026-10-19T05:13:17Z | p3 | Osa Opportunistic skips step | 4560 | {} |
| 182 | 2026-10-19T05:13:18Z | p3 | Osa Opportunistic skips step | 4560 | {} |
| 183 | 2026-10-19T05:13:22Z | p3 | AR withholds ¥0 to corporate treasury | 4560 | {} |
| 184 | 2026-10-19T05:13:40Z | p3 | AR purchases 4-1 train | 4860 | {"AR": -300} |
| 185 | 2026-10-19T05:13:41Z | p3 | Osa Opportunistic ends turn | 4860 | {} |
| 186 | 2026-10-19T05:13:46Z | p2 | Chi Conservative skips step | 4860 | {} |
| 187 | 2026-10-19T05:13:47Z | p2 | Chi Conservative skips step | 4860 | {} |
| 188 | 2026-10-19T05:13:50Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4860 | {} |
| 189 | 2026-10-19T05:13:52Z | p2 | IR withholds ¥60 to corporate treasury | 4800 | {"IR": 60} |
| 190 | 2026-10-19T05:13:53Z | p2 | Chi Conservative ends turn | 4800 | {} |
| 191 | 2026-10-19T05:13:55Z | p1 | Aki Aggressive skips step | 4800 | {} |
| 192 | 2026-10-19T05:13:56Z | p1 | Aki Aggressive skips step | 4800 | {} |
| 193 | 2026-10-19T05:13:59Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4800 | {} |
| 194 | 2026-10-19T05:14:01Z | p1 | SR withholds ¥40 to corporate treasury | 4760 | {"SR": 40} |
| 195 | 2026-10-19T05:14:02Z | p1 | Aki Aggressive ends turn | 4675 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 196 | 2026-10-19T05:14:08Z | p3 | Osa Opportunistic skips step | 4675 | {} |
| 197 | 2026-10-19T05:14:09Z | p3 | Osa Opportunistic skips step | 4675 | {} |
| 198 | 2026-10-19T05:14:12Z | p3 | AR runs 1 train(s) for ¥60 revenue | 4675 | {} |
| 199 | 2026-10-19T05:14:13Z | p3 | AR withholds ¥60 to corporate treasury | 4615 | {"AR": 60} |
| 200 | 2026-10-19T05:14:14Z | p3 | Osa Opportunistic ends turn | 4615 | {} |
| 201 | 2026-10-19T05:14:17Z | p2 | Chi Conservative skips step | 4615 | {} |
| 202 | 2026-10-19T05:14:18Z | p2 | Chi Conservative skips step | 4615 | {} |
| 203 | 2026-10-19T05:14:21Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4615 | {} |
| 204 | 2026-10-19T05:14:22Z | p2 | IR withholds ¥60 to corporate treasury | 4555 | {"IR": 60} |
| 205 | 2026-10-19T05:14:24Z | p2 | Chi Conservative ends turn | 4555 | {} |
| 206 | 2026-10-19T05:14:32Z | p1 | Aki Aggressive skips step | 4555 | {} |
| 207 | 2026-10-19T05:14:33Z | p1 | Aki Aggressive skips step | 4555 | {} |
| 208 | 2026-10-19T05:14:36Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4555 | {} |
| 209 | 2026-10-19T05:14:37Z | p1 | SR withholds ¥40 to corporate treasury | 4515 | {"SR": 40} |
| 210 | 2026-10-19T05:14:38Z | p1 | Aki Aggressive ends turn → Stock Round | 4515 | {} |
| 211 | 2026-10-19T05:14:44Z | p1 | Aki Aggressive passes | 4515 | {} |
| 212 | 2026-10-19T05:14:47Z | p2 | Chi Conservative passes | 4515 | {} |
| 213 | 2026-10-19T05:14:49Z | p3 | Osa Opportunistic passes | 4515 | {} |
| 214 | 2026-10-19T05:14:52Z | p4 | Nori Newcomer passes → Operating Round | 4430 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 215 | 2026-10-19T05:14:58Z | p3 | Osa Opportunistic skips step | 4430 | {} |
| 216 | 2026-10-19T05:14:59Z | p3 | Osa Opportunistic skips step | 4430 | {} |
| 217 | 2026-10-19T05:15:02Z | p3 | AR runs 1 train(s) for ¥60 revenue | 4430 | {} |
| 218 | 2026-10-19T05:15:04Z | p3 | AR withholds ¥60 to corporate treasury | 4370 | {"AR": 60} |
| 219 | 2026-10-19T05:15:13Z | p3 | AR purchases 4-2 train | 4670 | {"AR": -300} |
| 220 | 2026-10-19T05:15:14Z | p3 | Osa Opportunistic ends turn | 4670 | {} |
| 221 | 2026-10-19T05:15:16Z | p2 | Chi Conservative skips step | 4670 | {} |
| 222 | 2026-10-19T05:15:17Z | p2 | Chi Conservative skips step | 4670 | {} |
| 223 | 2026-10-19T05:15:20Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4670 | {} |
| 224 | 2026-10-19T05:15:22Z | p2 | IR withholds ¥60 to corporate treasury | 4610 | {"IR": 60} |
| 225 | 2026-10-19T05:15:23Z | p2 | Chi Conservative ends turn | 4610 | {} |
| 226 | 2026-10-19T05:15:34Z | p1 | Aki Aggressive skips step | 4610 | {} |
| 227 | 2026-10-19T05:15:35Z | p1 | Aki Aggressive skips step | 4610 | {} |
| 228 | 2026-10-19T05:15:38Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4610 | {} |
| 229 | 2026-10-19T05:15:40Z | p1 | SR withholds ¥40 to corporate treasury | 4570 | {"SR": 40} |
| 230 | 2026-10-19T05:15:41Z | p1 | Aki Aggressive ends turn | 4485 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 231 | 2026-10-19T05:15:47Z | p3 | Osa Opportunistic skips step | 4485 | {} |
| 232 | 2026-10-19T05:15:48Z | p3 | Osa Opportunistic skips step | 4485 | {} |
| 233 | 2026-10-19T05:15:51Z | p3 | AR runs 2 train(s) for ¥90 revenue | 4485 | {} |
| 234 | 2026-10-19T05:15:52Z | p3 | AR withholds ¥90 to corporate treasury | 4395 | {"AR": 90} |
| 235 | 2026-10-19T05:15:53Z | p3 | Osa Opportunistic ends turn | 4395 | {} |
| 236 | 2026-10-19T05:16:08Z | p1 | Aki Aggressive skips step | 4395 | {} |
| 237 | 2026-10-19T05:16:09Z | p1 | Aki Aggressive skips step | 4395 | {} |
| 238 | 2026-10-19T05:16:12Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4395 | {} |
| 239 | 2026-10-19T05:16:14Z | p1 | SR withholds ¥40 to corporate treasury | 4355 | {"SR": 40} |
| 240 | 2026-10-19T05:16:15Z | p1 | Aki Aggressive ends turn | 4355 | {} |
| 241 | 2026-10-19T05:16:18Z | p2 | Chi Conservative skips step | 4355 | {} |
| 242 | 2026-10-19T05:16:19Z | p2 | Chi Conservative skips step | 4355 | {} |
| 243 | 2026-10-19T05:16:22Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4355 | {} |
| 244 | 2026-10-19T05:16:23Z | p2 | IR withholds ¥60 to corporate treasury | 4295 | {"IR": 60} |
| 245 | 2026-10-19T05:16:24Z | p2 | Chi Conservative ends turn → Stock Round | 4295 | {} |
| 246 | 2026-10-19T05:16:36Z | p1 | Aki Aggressive sells 10% IR to Bank Pool (+¥10) | 4285 | {"p1": 10} |
| 247 | 2026-10-19T05:16:40Z | p1 | Aki Aggressive passes | 4285 | {} |
| 248 | 2026-10-19T05:16:43Z | p2 | Chi Conservative passes | 4285 | {} |
| 249 | 2026-10-19T05:16:45Z | p3 | Osa Opportunistic passes | 4285 | {} |
| 250 | 2026-10-19T05:16:47Z | p4 | Nori Newcomer passes | 4285 | {} |
| 251 | 2026-10-19T05:17:12Z | p1 | Aki Aggressive passes → Operating Round | 4200 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 252 | 2026-10-19T05:17:18Z | p3 | Osa Opportunistic skips step | 4200 | {} |
| 253 | 2026-10-19T05:17:19Z | p3 | Osa Opportunistic skips step | 4200 | {} |
| 254 | 2026-10-19T05:17:22Z | p3 | AR runs 2 train(s) for ¥90 revenue | 4200 | {} |
| 255 | 2026-10-19T05:17:24Z | p3 | AR withholds ¥90 to corporate treasury | 4110 | {"AR": 90} |
| 256 | 2026-10-19T05:17:25Z | p3 | Osa Opportunistic ends turn | 4110 | {} |
| 257 | 2026-10-19T05:17:28Z | p1 | Aki Aggressive skips step | 4110 | {} |
| 258 | 2026-10-19T05:17:29Z | p1 | Aki Aggressive skips step | 4110 | {} |
| 259 | 2026-10-19T05:17:32Z | p1 | SR runs 1 train(s) for ¥40 revenue | 4110 | {} |
| 260 | 2026-10-19T05:17:34Z | p1 | SR withholds ¥40 to corporate treasury | 4070 | {"SR": 40} |
| 261 | 2026-10-19T05:17:35Z | p1 | Aki Aggressive ends turn | 4070 | {} |
| 262 | 2026-10-19T05:17:40Z | p2 | Chi Conservative skips step | 4070 | {} |
| 263 | 2026-10-19T05:17:41Z | p2 | Chi Conservative skips step | 4070 | {} |
| 264 | 2026-10-19T05:17:44Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4070 | {} |
| 265 | 2026-10-19T05:17:45Z | p2 | IR pays out ¥60 in dividends to shareholders | 4040 | {"p2": 12, "p3": 6, "p4": 6, "IR": 6} |
| 266 | 2026-10-19T05:17:47Z | p2 | Chi Conservative ends turn | 3955 | {"p1": 30, "p2": 20, "p4": 25, "AR": 10} |
| 267 | 2026-10-19T05:17:53Z | p3 | Osa Opportunistic skips step | 3955 | {} |
| 268 | 2026-10-19T05:17:54Z | p3 | Osa Opportunistic skips step | 3955 | {} |
| 269 | 2026-10-19T05:17:57Z | p3 | AR runs 2 train(s) for ¥90 revenue | 3955 | {} |
| 270 | 2026-10-19T05:17:59Z | p3 | AR withholds ¥90 to corporate treasury | 3865 | {"AR": 90} |
| 271 | 2026-10-19T05:18:04Z | p3 | AR purchases 4-3 train | 4165 | {"AR": -300} |
| 272 | 2026-10-19T05:18:05Z | p3 | Osa Opportunistic ends turn | 4165 | {} |
| 273 | 2026-10-19T05:18:25Z | p2 | Chi Conservative skips step | 4165 | {} |
| 274 | 2026-10-19T05:18:25Z | p2 | Chi Conservative skips step | 4165 | {} |
| 275 | 2026-10-19T05:18:28Z | p2 | IR runs 1 train(s) for ¥60 revenue | 4165 | {} |
| 276 | 2026-10-19T05:18:30Z | p2 | IR withholds ¥60 to corporate treasury | 4105 | {"IR": 60} |
| 277 | 2026-10-19T05:18:44Z | p2 | IR purchases 5-0 train | 4555 | {"IR": -450} |
| 278 | 2026-10-19T05:18:59Z | p2 | Chi Conservative performs discard_train | 4555 | {} |
| 279 | 2026-10-19T05:19:09Z | p3 | Osa Opportunistic performs discard_train | 4555 | {} |
| 280 | 2026-10-19T05:19:18Z | p1 | Aki Aggressive performs discard_train | 4555 | {} |
| 281 | 2026-10-19T05:19:21Z | p2 | Chi Conservative ends turn | 4555 | {} |
| 282 | 2026-10-19T05:19:24Z | p1 | Aki Aggressive skips step | 4555 | {} |
| 283 | 2026-10-19T05:19:25Z | p1 | Aki Aggressive skips step | 4555 | {} |
| 284 | 2026-10-19T05:19:28Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4555 | {} |
| 285 | 2026-10-19T05:19:30Z | p1 | SR pays out ¥60 in dividends to shareholders | 4525 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 286 | 2026-10-19T05:19:31Z | p1 | Aki Aggressive ends turn → Stock Round | 4525 | {} |
| 287 | 2026-10-19T05:19:47Z | p2 | Chi Conservative passes | 4525 | {} |
| 288 | 2026-10-19T05:19:49Z | p3 | Osa Opportunistic passes | 4525 | {} |
| 289 | 2026-10-19T05:19:59Z | p4 | Nori Newcomer sets KO par at ¥100 & buys President's share (20%) | 4725 | {"p4": -200} |
| 290 | 2026-10-19T05:20:00Z | p4 | Nori Newcomer ends turn | 4725 | {} |
| 291 | 2026-10-19T05:20:14Z | p1 | Aki Aggressive buys 10% KO from IPO (¥100) | 4825 | {"p1": -100} |
| 292 | 2026-10-19T05:20:15Z | p1 | Aki Aggressive ends turn | 4825 | {} |
| 293 | 2026-10-19T05:20:19Z | p2 | Chi Conservative buys 10% KO from IPO (¥100) | 4925 | {"p2": -100} |
| 294 | 2026-10-19T05:20:20Z | p2 | Chi Conservative ends turn | 4925 | {} |
| 295 | 2026-10-19T05:20:27Z | p3 | Osa Opportunistic buys 10% KO from IPO (¥100) | 4025 | {"p3": -100, "KO": 1000} |
| 296 | 2026-10-19T05:20:28Z | p3 | Osa Opportunistic ends turn | 4025 | {} |
| 297 | 2026-10-19T05:20:31Z | p4 | Nori Newcomer passes | 4025 | {} |
| 298 | 2026-10-19T05:20:34Z | p1 | Aki Aggressive passes | 4025 | {} |
| 299 | 2026-10-19T05:20:39Z | p2 | Chi Conservative passes | 4025 | {} |
| 300 | 2026-10-19T05:20:42Z | p3 | Osa Opportunistic passes → Operating Round | 3975 | {"p1": 50} |
| 301 | 2026-10-19T05:20:54Z | p4 | KO (Nori Newcomer) lays tile #440 on K4 | 3975 | {} |
| 302 | 2026-10-19T05:20:56Z | p4 | Nori Newcomer skips step | 3975 | {} |
| 303 | 2026-10-19T05:20:59Z | p4 | KO withholds ¥0 to corporate treasury | 3975 | {} |
| 304 | 2026-10-19T05:21:04Z | p4 | KO purchases 5-1 train | 4425 | {"KO": -450} |
| 305 | 2026-10-19T05:21:17Z | p4 | KO purchases 5-2 train | 4875 | {"KO": -450} |
| 306 | 2026-10-19T05:21:18Z | p4 | Nori Newcomer ends turn | 4875 | {} |
| 307 | 2026-10-19T05:21:28Z | p3 | Osa Opportunistic skips step | 4875 | {} |
| 308 | 2026-10-19T05:21:29Z | p3 | Osa Opportunistic skips step | 4875 | {} |
| 309 | 2026-10-19T05:21:32Z | p3 | AR runs 2 train(s) for ¥110 revenue | 4875 | {} |
| 310 | 2026-10-19T05:21:34Z | p3 | AR pays out ¥110 in dividends to shareholders | 4820 | {"p2": 11, "p3": 33, "p4": 11} |
| 311 | 2026-10-19T05:21:35Z | p3 | Osa Opportunistic ends turn | 4820 | {} |
| 312 | 2026-10-19T05:21:38Z | p1 | Aki Aggressive skips step | 4820 | {} |
| 313 | 2026-10-19T05:21:39Z | p1 | Aki Aggressive skips step | 4820 | {} |
| 314 | 2026-10-19T05:21:42Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4820 | {} |
| 315 | 2026-10-19T05:21:44Z | p1 | SR pays out ¥60 in dividends to shareholders | 4790 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 316 | 2026-10-19T05:21:45Z | p1 | Aki Aggressive ends turn | 4790 | {} |
| 317 | 2026-10-19T05:21:52Z | p2 | Chi Conservative skips step | 4790 | {} |
| 318 | 2026-10-19T05:21:53Z | p2 | Chi Conservative skips step | 4790 | {} |
| 319 | 2026-10-19T05:21:56Z | p2 | IR runs 1 train(s) for ¥90 revenue | 4790 | {} |
| 320 | 2026-10-19T05:21:58Z | p2 | IR pays out ¥90 in dividends to shareholders | 4745 | {"p2": 18, "p3": 9, "p4": 9, "IR": 9} |
| 321 | 2026-10-19T05:22:00Z | p2 | Chi Conservative ends turn | 4695 | {"p1": 50} |
| 322 | 2026-10-19T05:22:09Z | p3 | Osa Opportunistic skips step | 4695 | {} |
| 323 | 2026-10-19T05:22:11Z | p3 | Osa Opportunistic skips step | 4695 | {} |
| 324 | 2026-10-19T05:22:14Z | p3 | AR runs 2 train(s) for ¥110 revenue | 4695 | {} |
| 325 | 2026-10-19T05:22:16Z | p3 | AR pays out ¥110 in dividends to shareholders | 4640 | {"p2": 11, "p3": 33, "p4": 11} |
| 326 | 2026-10-19T05:22:17Z | p3 | Osa Opportunistic ends turn | 4640 | {} |
| 327 | 2026-10-19T05:22:20Z | p4 | Nori Newcomer skips step | 4640 | {} |
| 328 | 2026-10-19T05:22:21Z | p4 | Nori Newcomer skips step | 4640 | {} |
| 329 | 2026-10-19T05:22:33Z | p4 | KO withholds ¥0 to corporate treasury | 4640 | {} |
| 330 | 2026-10-19T05:22:34Z | p4 | Nori Newcomer ends turn | 4640 | {} |
| 331 | 2026-10-19T05:22:37Z | p1 | Aki Aggressive skips step | 4640 | {} |
| 332 | 2026-10-19T05:22:39Z | p1 | Aki Aggressive skips step | 4640 | {} |
| 333 | 2026-10-19T05:22:42Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4640 | {} |
| 334 | 2026-10-19T05:22:44Z | p1 | SR pays out ¥60 in dividends to shareholders | 4610 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 335 | 2026-10-19T05:22:45Z | p1 | Aki Aggressive ends turn | 4610 | {} |
| 336 | 2026-10-19T05:22:50Z | p2 | Chi Conservative skips step | 4610 | {} |
| 337 | 2026-10-19T05:22:51Z | p2 | Chi Conservative skips step | 4610 | {} |
| 338 | 2026-10-19T05:22:55Z | p2 | IR runs 1 train(s) for ¥90 revenue | 4610 | {} |
| 339 | 2026-10-19T05:22:56Z | p2 | IR pays out ¥90 in dividends to shareholders | 4565 | {"p2": 18, "p3": 9, "p4": 9, "IR": 9} |
| 340 | 2026-10-19T05:22:58Z | p2 | Chi Conservative ends turn | 4515 | {"p1": 50} |
| 341 | 2026-10-19T05:23:09Z | p3 | Osa Opportunistic skips step | 4515 | {} |
| 342 | 2026-10-19T05:23:10Z | p3 | Osa Opportunistic skips step | 4515 | {} |
| 343 | 2026-10-19T05:23:13Z | p3 | AR runs 2 train(s) for ¥110 revenue | 4515 | {} |
| 344 | 2026-10-19T05:23:15Z | p3 | AR pays out ¥110 in dividends to shareholders | 4460 | {"p2": 11, "p3": 33, "p4": 11} |
| 345 | 2026-10-19T05:23:16Z | p3 | Osa Opportunistic ends turn | 4460 | {} |
| 346 | 2026-10-19T05:23:20Z | p4 | Nori Newcomer skips step | 4460 | {} |
| 347 | 2026-10-19T05:23:21Z | p4 | Nori Newcomer skips step | 4460 | {} |
| 348 | 2026-10-19T05:23:25Z | p4 | KO withholds ¥0 to corporate treasury | 4460 | {} |
| 349 | 2026-10-19T05:23:26Z | p4 | Nori Newcomer ends turn | 4460 | {} |
| 350 | 2026-10-19T05:23:30Z | p1 | Aki Aggressive skips step | 4460 | {} |
| 351 | 2026-10-19T05:23:31Z | p1 | Aki Aggressive skips step | 4460 | {} |
| 352 | 2026-10-19T05:23:34Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4460 | {} |
| 353 | 2026-10-19T05:23:36Z | p1 | SR pays out ¥60 in dividends to shareholders | 4430 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 354 | 2026-10-19T05:23:37Z | p1 | Aki Aggressive ends turn | 4430 | {} |
| 355 | 2026-10-19T05:23:43Z | p2 | Chi Conservative skips step | 4430 | {} |
| 356 | 2026-10-19T05:23:44Z | p2 | Chi Conservative skips step | 4430 | {} |
| 357 | 2026-10-19T05:23:47Z | p2 | IR runs 1 train(s) for ¥90 revenue | 4430 | {} |
| 358 | 2026-10-19T05:23:49Z | p2 | IR pays out ¥90 in dividends to shareholders | 4385 | {"p2": 18, "p3": 9, "p4": 9, "IR": 9} |
| 359 | 2026-10-19T05:23:51Z | p2 | Chi Conservative ends turn → Stock Round | 4385 | {} |
| 360 | 2026-10-19T05:24:01Z | p4 | Nori Newcomer passes | 4385 | {} |
| 361 | 2026-10-19T05:24:20Z | p1 | Aki Aggressive sets UR par at ¥100 & buys President's share (20%) | 4585 | {"p1": -200} |
| 362 | 2026-10-19T05:24:21Z | p1 | Aki Aggressive ends turn | 4585 | {} |
| 363 | 2026-10-19T05:24:36Z | p2 | Chi Conservative buys 10% UR from IPO (¥100) | 4685 | {"p2": -100} |
| 364 | 2026-10-19T05:24:38Z | p2 | Chi Conservative ends turn | 4685 | {} |
| 365 | 2026-10-19T05:24:52Z | p3 | Osa Opportunistic buys 10% UR from IPO (¥100) | 4785 | {"p3": -100} |
| 366 | 2026-10-19T05:24:53Z | p3 | Osa Opportunistic ends turn | 4785 | {} |
| 367 | 2026-10-19T05:25:02Z | p4 | Nori Newcomer buys 10% UR from IPO (¥100) | 3885 | {"p4": -100, "UR": 1000} |
| 368 | 2026-10-19T05:25:03Z | p4 | Nori Newcomer ends turn | 3885 | {} |
| 369 | 2026-10-19T05:25:06Z | p1 | Aki Aggressive passes | 3885 | {} |
| 370 | 2026-10-19T05:25:09Z | p2 | Chi Conservative passes | 3885 | {} |
| 371 | 2026-10-19T05:25:15Z | p3 | Osa Opportunistic passes | 3885 | {} |
| 372 | 2026-10-19T05:25:18Z | p4 | Nori Newcomer passes → Operating Round | 3835 | {"p1": 50} |
| 373 | 2026-10-19T05:25:32Z | p3 | Osa Opportunistic skips step | 3835 | {} |
| 374 | 2026-10-19T05:25:34Z | p3 | Osa Opportunistic skips step | 3835 | {} |
| 375 | 2026-10-19T05:25:37Z | p3 | AR runs 2 train(s) for ¥110 revenue | 3835 | {} |
| 376 | 2026-10-19T05:25:39Z | p3 | AR pays out ¥110 in dividends to shareholders | 3780 | {"p2": 11, "p3": 33, "p4": 11} |
| 377 | 2026-10-19T05:25:40Z | p3 | Osa Opportunistic ends turn | 3780 | {} |
| 378 | 2026-10-19T05:26:00Z | p1 | UR (Aki Aggressive) lays tile #9 on B5 | 3780 | {} |
| 379 | 2026-10-19T05:26:01Z | p1 | Aki Aggressive skips step | 3780 | {} |
| 380 | 2026-10-19T05:26:03Z | p1 | UR withholds ¥0 to corporate treasury | 3780 | {} |
| 381 | 2026-10-19T05:26:26Z | p1 | UR purchases 6-0 train | 4410 | {"UR": -630} |
| 382 | 2026-10-19T05:26:28Z | p1 | Aki Aggressive ends turn | 4410 | {} |
| 383 | 2026-10-19T05:26:42Z | p4 | Nori Newcomer skips step | 4410 | {} |
| 384 | 2026-10-19T05:26:44Z | p4 | Nori Newcomer skips step | 4410 | {} |
| 385 | 2026-10-19T05:26:51Z | p4 | KO withholds ¥0 to corporate treasury | 4410 | {} |
| 386 | 2026-10-19T05:26:53Z | p4 | Nori Newcomer ends turn | 4410 | {} |
| 387 | 2026-10-19T05:26:56Z | p1 | Aki Aggressive skips step | 4410 | {} |
| 388 | 2026-10-19T05:26:58Z | p1 | Aki Aggressive skips step | 4410 | {} |
| 389 | 2026-10-19T05:27:01Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4410 | {} |
| 390 | 2026-10-19T05:27:03Z | p1 | SR pays out ¥60 in dividends to shareholders | 4380 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 391 | 2026-10-19T05:27:04Z | p1 | Aki Aggressive ends turn | 4380 | {} |
| 392 | 2026-10-19T05:27:14Z | p2 | Chi Conservative skips step | 4380 | {} |
| 393 | 2026-10-19T05:27:22Z | p2 | Chi Conservative skips step | 4380 | {} |
| 394 | 2026-10-19T05:27:25Z | p2 | IR runs 1 train(s) for ¥90 revenue | 4380 | {} |
| 395 | 2026-10-19T05:27:27Z | p2 | IR withholds ¥90 to corporate treasury | 4290 | {"IR": 90} |
| 396 | 2026-10-19T05:27:36Z | p2 | Chi Conservative ends turn | 4240 | {"p1": 50} |
| 397 | 2026-10-19T11:19:36Z | p3 | Osa Opportunistic skips step | 4240 | {} |
| 398 | 2026-10-19T11:19:37Z | p3 | Osa Opportunistic skips step | 4240 | {} |
| 399 | 2026-10-19T11:19:50Z | p3 | AR runs 2 train(s) for ¥110 revenue | 4240 | {} |
| 400 | 2026-10-19T11:19:52Z | p3 | AR pays out ¥110 in dividends to shareholders | 4185 | {"p2": 11, "p3": 33, "p4": 11} |
| 401 | 2026-10-19T11:19:53Z | p3 | Osa Opportunistic ends turn | 4185 | {} |
| 402 | 2026-10-19T11:20:14Z | p1 | Aki Aggressive skips step | 4185 | {} |
| 403 | 2026-10-19T11:20:21Z | p1 | Aki Aggressive skips step | 4185 | {} |
| 404 | 2026-10-19T11:20:30Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4185 | {} |
| 405 | 2026-10-19T11:20:32Z | p1 | UR pays out ¥90 in dividends to shareholders | 4140 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 406 | 2026-10-19T11:20:33Z | p1 | Aki Aggressive ends turn | 4140 | {} |
| 407 | 2026-10-19T11:21:07Z | p4 | KO (Nori Newcomer) lays tile #9 on J3 | 4140 | {} |
| 408 | 2026-10-19T11:21:08Z | p4 | Nori Newcomer skips step | 4140 | {} |
| 409 | 2026-10-19T11:21:14Z | p4 | KO withholds ¥0 to corporate treasury | 4140 | {} |
| 410 | 2026-10-19T11:21:16Z | p4 | Nori Newcomer ends turn | 4140 | {} |
| 411 | 2026-10-19T11:21:19Z | p1 | Aki Aggressive skips step | 4140 | {} |
| 412 | 2026-10-19T11:21:20Z | p1 | Aki Aggressive skips step | 4140 | {} |
| 413 | 2026-10-19T11:21:48Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4140 | {} |
| 414 | 2026-10-19T11:21:50Z | p1 | SR pays out ¥60 in dividends to shareholders | 4110 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 415 | 2026-10-19T11:21:51Z | p1 | Aki Aggressive ends turn | 4110 | {} |
| 416 | 2026-10-19T11:22:01Z | p2 | Chi Conservative skips step | 4110 | {} |
| 417 | 2026-10-19T11:22:05Z | p2 | Chi Conservative skips step | 4110 | {} |
| 418 | 2026-10-19T11:22:16Z | p2 | IR runs 1 train(s) for ¥90 revenue | 4110 | {} |
| 419 | 2026-10-19T11:22:18Z | p2 | IR withholds ¥90 to corporate treasury | 4020 | {"IR": 90} |
| 420 | 2026-10-19T11:22:20Z | p2 | Chi Conservative ends turn | 3970 | {"p1": 50} |
| 421 | 2026-10-19T11:22:26Z | p3 | Osa Opportunistic skips step | 3970 | {} |
| 422 | 2026-10-19T11:22:28Z | p3 | Osa Opportunistic skips step | 3970 | {} |
| 423 | 2026-10-19T11:22:35Z | p3 | AR runs 2 train(s) for ¥110 revenue | 3970 | {} |
| 424 | 2026-10-19T11:23:07Z | p3 | AR pays out ¥110 in dividends to shareholders | 3915 | {"p2": 11, "p3": 33, "p4": 11} |
| 425 | 2026-10-19T11:23:12Z | p3 | Osa Opportunistic ends turn | 3915 | {} |
| 426 | 2026-10-19T11:23:22Z | p1 | Aki Aggressive skips step | 3915 | {} |
| 427 | 2026-10-19T11:23:41Z | p1 | Aki Aggressive skips step | 3915 | {} |
| 428 | 2026-10-19T11:24:14Z | p1 | UR runs 1 train(s) for ¥90 revenue | 3915 | {} |
| 429 | 2026-10-19T11:24:38Z | p1 | UR pays out ¥90 in dividends to shareholders | 3870 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 430 | 2026-10-19T11:24:39Z | p1 | Aki Aggressive ends turn | 3870 | {} |
| 431 | 2026-10-19T11:25:04Z | p4 | KO (Nori Newcomer) lays tile #58 on J5 | 3870 | {} |
| 432 | 2026-10-19T11:25:06Z | p4 | Nori Newcomer skips step | 3870 | {} |
| 433 | 2026-10-19T11:25:15Z | p4 | KO runs 1 train(s) for ¥50 revenue | 3870 | {} |
| 434 | 2026-10-19T11:25:17Z | p4 | KO pays out ¥50 in dividends to shareholders | 3845 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 435 | 2026-10-19T11:25:18Z | p4 | Nori Newcomer ends turn | 3845 | {} |
| 436 | 2026-10-19T11:25:31Z | p1 | Aki Aggressive skips step | 3845 | {} |
| 437 | 2026-10-19T11:25:32Z | p1 | Aki Aggressive skips step | 3845 | {} |
| 438 | 2026-10-19T11:25:36Z | p1 | SR runs 1 train(s) for ¥60 revenue | 3845 | {} |
| 439 | 2026-10-19T11:25:38Z | p1 | SR pays out ¥60 in dividends to shareholders | 3815 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 440 | 2026-10-19T11:25:39Z | p1 | Aki Aggressive ends turn | 3815 | {} |
| 441 | 2026-10-19T11:25:57Z | p2 | Chi Conservative skips step | 3815 | {} |
| 442 | 2026-10-19T11:26:03Z | p2 | Chi Conservative skips step | 3815 | {} |
| 443 | 2026-10-19T11:26:13Z | p2 | IR runs 1 train(s) for ¥90 revenue | 3815 | {} |
| 444 | 2026-10-19T11:26:15Z | p2 | IR withholds ¥90 to corporate treasury | 3725 | {"IR": 90} |
| 445 | 2026-10-19T11:26:26Z | p2 | IR purchases D-0 train | 4525 | {"IR": -800} |
| 446 | 2026-10-19T11:26:38Z | p2 | Chi Conservative ends turn → Stock Round | 4525 | {} |
| 447 | 2026-10-19T11:26:58Z | p1 | Aki Aggressive passes | 4525 | {} |
| 448 | 2026-10-19T11:27:01Z | p2 | Chi Conservative passes | 4525 | {} |
| 449 | 2026-10-19T11:27:05Z | p3 | Osa Opportunistic passes | 4525 | {} |
| 450 | 2026-10-19T11:27:08Z | p4 | Nori Newcomer passes → Operating Round | 4475 | {"p1": 50} |
| 451 | 2026-10-19T11:27:20Z | p3 | Osa Opportunistic skips step | 4475 | {} |
| 452 | 2026-10-19T11:27:21Z | p3 | Osa Opportunistic skips step | 4475 | {} |
| 453 | 2026-10-19T11:27:23Z | p3 | AR withholds ¥0 to corporate treasury | 4475 | {} |
| 454 | 2026-10-19T11:27:46Z | p3 | Osa Opportunistic sells 10% AR to Bank Pool (+¥140) | 4335 | {"p3": 140} |
| 455 | 2026-10-19T11:27:52Z | p3 | AR purchases 5-0 train | 4785 | {"p3": -400, "AR": -50} |
| 456 | 2026-10-19T11:27:54Z | p3 | Osa Opportunistic ends turn | 4785 | {} |
| 457 | 2026-10-19T11:28:06Z | p1 | Aki Aggressive skips step | 4785 | {} |
| 458 | 2026-10-19T11:28:22Z | p1 | Aki Aggressive skips step | 4785 | {} |
| 459 | 2026-10-19T11:28:28Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4785 | {} |
| 460 | 2026-10-19T11:28:31Z | p1 | UR pays out ¥90 in dividends to shareholders | 4740 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 461 | 2026-10-19T11:28:33Z | p1 | Aki Aggressive ends turn | 4740 | {} |
| 462 | 2026-10-19T11:28:45Z | p4 | Nori Newcomer skips step | 4740 | {} |
| 463 | 2026-10-19T11:28:46Z | p4 | Nori Newcomer skips step | 4740 | {} |
| 464 | 2026-10-19T11:28:52Z | p4 | KO runs 1 train(s) for ¥50 revenue | 4740 | {} |
| 465 | 2026-10-19T11:28:54Z | p4 | KO pays out ¥50 in dividends to shareholders | 4715 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 466 | 2026-10-19T11:28:56Z | p4 | Nori Newcomer ends turn | 4715 | {} |
| 467 | 2026-10-19T11:29:04Z | p1 | Aki Aggressive skips step | 4715 | {} |
| 468 | 2026-10-19T11:29:06Z | p1 | Aki Aggressive skips step | 4715 | {} |
| 469 | 2026-10-19T11:29:08Z | p1 | SR withholds ¥0 to corporate treasury | 4715 | {} |
| 470 | 2026-10-19T11:29:16Z | p1 | SR purchases 6-1 train | 5345 | {"p1": -420, "SR": -210} |
| 471 | 2026-10-19T11:29:28Z | p1 | Aki Aggressive ends turn | 5345 | {} |
| 472 | 2026-10-19T11:29:36Z | p2 | Chi Conservative skips step | 5345 | {} |
| 473 | 2026-10-19T11:29:37Z | p2 | Chi Conservative skips step | 5345 | {} |
| 474 | 2026-10-19T11:29:43Z | p2 | IR runs 1 train(s) for ¥130 revenue | 5345 | {} |
| 475 | 2026-10-19T11:29:46Z | p2 | IR pays out ¥130 in dividends to shareholders | 5280 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 476 | 2026-10-19T11:29:48Z | p2 | Chi Conservative ends turn | 5230 | {"p1": 50} |
| 477 | 2026-10-19T11:30:13Z | p3 | Osa Opportunistic skips step | 5230 | {} |
| 478 | 2026-10-19T11:30:15Z | p3 | Osa Opportunistic skips step | 5230 | {} |
| 479 | 2026-10-19T11:30:21Z | p3 | AR runs 1 train(s) for ¥80 revenue | 5230 | {} |
| 480 | 2026-10-19T11:30:23Z | p3 | AR pays out ¥80 in dividends to shareholders | 5190 | {"p2": 8, "p3": 16, "p4": 8, "AR": 8} |
| 481 | 2026-10-19T11:30:25Z | p3 | Osa Opportunistic ends turn | 5190 | {} |
| 482 | 2026-10-19T11:30:31Z | p1 | Aki Aggressive skips step | 5190 | {} |
| 483 | 2026-10-19T11:30:49Z | p1 | Aki Aggressive skips step | 5190 | {} |
| 484 | 2026-10-19T11:31:00Z | p1 | UR runs 1 train(s) for ¥90 revenue | 5190 | {} |
| 485 | 2026-10-19T11:31:03Z | p1 | UR pays out ¥90 in dividends to shareholders | 5145 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 486 | 2026-10-19T11:31:05Z | p1 | Aki Aggressive ends turn | 5145 | {} |
| 487 | 2026-10-19T11:31:15Z | p4 | Nori Newcomer skips step | 5145 | {} |
| 488 | 2026-10-19T11:31:17Z | p4 | Nori Newcomer skips step | 5145 | {} |
| 489 | 2026-10-19T11:31:22Z | p4 | KO runs 1 train(s) for ¥50 revenue | 5145 | {} |
| 490 | 2026-10-19T11:31:25Z | p4 | KO pays out ¥50 in dividends to shareholders | 5120 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 491 | 2026-10-19T11:31:27Z | p4 | Nori Newcomer ends turn | 5120 | {} |
| 492 | 2026-10-19T11:31:32Z | p1 | Aki Aggressive skips step | 5120 | {} |
| 493 | 2026-10-19T11:31:33Z | p1 | Aki Aggressive skips step | 5120 | {} |
| 494 | 2026-10-19T11:31:39Z | p1 | SR runs 1 train(s) for ¥60 revenue | 5120 | {} |
| 495 | 2026-10-19T11:31:41Z | p1 | SR pays out ¥60 in dividends to shareholders | 5090 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 496 | 2026-10-19T11:31:43Z | p1 | Aki Aggressive ends turn | 5090 | {} |
| 497 | 2026-10-19T11:31:48Z | p2 | Chi Conservative skips step | 5090 | {} |
| 498 | 2026-10-19T11:31:50Z | p2 | Chi Conservative skips step | 5090 | {} |
| 499 | 2026-10-19T11:31:55Z | p2 | IR runs 1 train(s) for ¥130 revenue | 5090 | {} |
| 500 | 2026-10-19T11:31:57Z | p2 | IR pays out ¥130 in dividends to shareholders | 5025 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 501 | 2026-10-19T11:31:58Z | p2 | Chi Conservative ends turn | 4975 | {"p1": 50} |
| 502 | 2026-10-19T11:32:09Z | p3 | Osa Opportunistic skips step | 4975 | {} |
| 503 | 2026-10-19T11:32:10Z | p3 | Osa Opportunistic skips step | 4975 | {} |
| 504 | 2026-10-19T11:32:13Z | p3 | AR runs 1 train(s) for ¥80 revenue | 4975 | {} |
| 505 | 2026-10-19T11:32:15Z | p3 | AR pays out ¥80 in dividends to shareholders | 4935 | {"p2": 8, "p3": 16, "p4": 8, "AR": 8} |
| 506 | 2026-10-19T11:32:15Z | p3 | Osa Opportunistic ends turn | 4935 | {} |
| 507 | 2026-10-19T11:32:23Z | p1 | Aki Aggressive skips step | 4935 | {} |
| 508 | 2026-10-19T11:32:32Z | p1 | Aki Aggressive skips step | 4935 | {} |
| 509 | 2026-10-19T11:32:35Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4935 | {} |
| 510 | 2026-10-19T11:32:37Z | p1 | UR pays out ¥90 in dividends to shareholders | 4890 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 511 | 2026-10-19T11:32:38Z | p1 | Aki Aggressive ends turn | 4890 | {} |
| 512 | 2026-10-19T11:32:41Z | p4 | Nori Newcomer skips step | 4890 | {} |
| 513 | 2026-10-19T11:32:42Z | p4 | Nori Newcomer skips step | 4890 | {} |
| 514 | 2026-10-19T11:32:45Z | p4 | KO runs 1 train(s) for ¥50 revenue | 4890 | {} |
| 515 | 2026-10-19T11:32:46Z | p4 | KO pays out ¥50 in dividends to shareholders | 4865 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 516 | 2026-10-19T11:32:47Z | p4 | Nori Newcomer ends turn | 4865 | {} |
| 517 | 2026-10-19T11:33:11Z | p1 | Aki Aggressive skips step | 4865 | {} |
| 518 | 2026-10-19T11:33:12Z | p1 | Aki Aggressive skips step | 4865 | {} |
| 519 | 2026-10-19T11:33:15Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4865 | {} |
| 520 | 2026-10-19T11:33:17Z | p1 | SR pays out ¥60 in dividends to shareholders | 4835 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 521 | 2026-10-19T11:33:18Z | p1 | Aki Aggressive ends turn | 4835 | {} |
| 522 | 2026-10-19T11:33:26Z | p2 | Chi Conservative skips step | 4835 | {} |
| 523 | 2026-10-19T11:33:37Z | p2 | Chi Conservative skips step | 4835 | {} |
| 524 | 2026-10-19T11:33:41Z | p2 | IR runs 1 train(s) for ¥130 revenue | 4835 | {} |
| 525 | 2026-10-19T11:33:42Z | p2 | IR pays out ¥130 in dividends to shareholders | 4770 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 526 | 2026-10-19T11:33:43Z | p2 | Chi Conservative ends turn → Stock Round | 4770 | {} |
| 527 | 2026-10-19T11:33:55Z | p1 | Aki Aggressive passes | 4770 | {} |
| 528 | 2026-10-19T11:33:57Z | p2 | Chi Conservative passes | 4770 | {} |
| 529 | 2026-10-19T11:34:03Z | p3 | Osa Opportunistic passes | 4770 | {} |
| 530 | 2026-10-19T11:34:18Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 4850 | {"p4": -80} |
| 531 | 2026-10-19T11:34:19Z | p4 | Nori Newcomer ends turn | 4850 | {} |
| 532 | 2026-10-19T11:34:22Z | p1 | Aki Aggressive passes | 4850 | {} |
| 533 | 2026-10-19T11:34:24Z | p2 | Chi Conservative passes | 4850 | {} |
| 534 | 2026-10-19T11:34:38Z | p3 | Osa Opportunistic sells 10% AR to Bank Pool (+¥155) | 4695 | {"p3": 155} |
| 535 | 2026-10-19T11:34:53Z | p3 | Osa Opportunistic passes | 4695 | {} |
| 536 | 2026-10-19T11:35:06Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 4775 | {"p4": -80} |
| 537 | 2026-10-19T11:35:07Z | p4 | Nori Newcomer ends turn | 4775 | {} |
| 538 | 2026-10-19T11:35:10Z | p1 | Aki Aggressive passes | 4775 | {} |
| 539 | 2026-10-19T11:35:12Z | p2 | Chi Conservative passes | 4775 | {} |
| 540 | 2026-10-19T11:35:15Z | p3 | Osa Opportunistic passes | 4775 | {} |
| 541 | 2026-10-19T11:35:17Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 4855 | {"p4": -80} |
| 542 | 2026-10-19T11:35:19Z | p4 | Nori Newcomer ends turn | 4855 | {} |
| 543 | 2026-10-19T11:35:30Z | p1 | Aki Aggressive passes | 4855 | {} |
| 544 | 2026-10-19T11:35:33Z | p2 | Chi Conservative passes | 4855 | {} |
| 545 | 2026-10-19T11:35:35Z | p3 | Osa Opportunistic passes | 4855 | {} |
| 546 | 2026-10-19T11:35:38Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 4935 | {"p4": -80} |
| 547 | 2026-10-19T11:35:39Z | p4 | Nori Newcomer ends turn | 4935 | {} |
| 548 | 2026-10-19T11:35:41Z | p1 | Aki Aggressive passes | 4935 | {} |
| 549 | 2026-10-19T11:35:44Z | p2 | Chi Conservative passes | 4935 | {} |
| 550 | 2026-10-19T11:35:47Z | p3 | Osa Opportunistic passes | 4935 | {} |
| 551 | 2026-10-19T11:35:49Z | p4 | Nori Newcomer buys 10% AR from IPO (¥80) | 5015 | {"p4": -80} |
| 552 | 2026-10-19T11:35:50Z | p4 | Nori Newcomer ends turn | 5015 | {} |
| 553 | 2026-10-19T11:36:00Z | p1 | Aki Aggressive passes | 5015 | {} |
| 554 | 2026-10-19T11:36:03Z | p2 | Chi Conservative passes | 5015 | {} |
| 555 | 2026-10-19T11:36:05Z | p3 | Osa Opportunistic passes | 5015 | {} |
| 556 | 2026-10-19T11:36:15Z | p4 | Nori Newcomer passes → Operating Round | 4965 | {"p1": 50} |
| 557 | 2026-10-19T11:36:25Z | p1 | Aki Aggressive skips step | 4965 | {} |
| 558 | 2026-10-19T11:36:42Z | p1 | Aki Aggressive skips step | 4965 | {} |
| 559 | 2026-10-19T11:36:46Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4965 | {} |
| 560 | 2026-10-19T11:36:47Z | p1 | UR pays out ¥90 in dividends to shareholders | 4920 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 561 | 2026-10-19T11:36:49Z | p1 | Aki Aggressive ends turn | 4920 | {} |
| 562 | 2026-10-19T11:36:51Z | p4 | Nori Newcomer skips step | 4920 | {} |
| 563 | 2026-10-19T11:36:52Z | p4 | Nori Newcomer skips step | 4920 | {} |
| 564 | 2026-10-19T11:36:55Z | p4 | AR runs 1 train(s) for ¥80 revenue | 4920 | {} |
| 565 | 2026-10-19T11:36:57Z | p4 | AR pays out ¥80 in dividends to shareholders | 4840 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 566 | 2026-10-19T11:36:58Z | p4 | Nori Newcomer ends turn | 4840 | {} |
| 567 | 2026-10-19T11:37:38Z | p4 | Nori Newcomer skips step | 4840 | {} |
| 568 | 2026-10-19T11:37:39Z | p4 | Nori Newcomer skips step | 4840 | {} |
| 569 | 2026-10-19T11:37:41Z | p4 | KO runs 1 train(s) for ¥50 revenue | 4840 | {} |
| 570 | 2026-10-19T11:37:43Z | p4 | KO pays out ¥50 in dividends to shareholders | 4815 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 571 | 2026-10-19T11:37:44Z | p4 | Nori Newcomer ends turn | 4815 | {} |
| 572 | 2026-10-19T11:37:47Z | p1 | Aki Aggressive skips step | 4815 | {} |
| 573 | 2026-10-19T11:37:48Z | p1 | Aki Aggressive skips step | 4815 | {} |
| 574 | 2026-10-19T11:37:51Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4815 | {} |
| 575 | 2026-10-19T11:37:52Z | p1 | SR pays out ¥60 in dividends to shareholders | 4785 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 576 | 2026-10-19T11:37:53Z | p1 | Aki Aggressive ends turn | 4785 | {} |
| 577 | 2026-10-19T11:37:56Z | p2 | Chi Conservative skips step | 4785 | {} |
| 578 | 2026-10-19T11:37:57Z | p2 | Chi Conservative skips step | 4785 | {} |
| 579 | 2026-10-19T11:38:00Z | p2 | IR runs 1 train(s) for ¥130 revenue | 4785 | {} |
| 580 | 2026-10-19T11:38:02Z | p2 | IR pays out ¥130 in dividends to shareholders | 4720 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 581 | 2026-10-19T11:38:03Z | p2 | Chi Conservative ends turn | 4670 | {"p1": 50} |
| 582 | 2026-10-19T11:38:08Z | p1 | Aki Aggressive skips step | 4670 | {} |
| 583 | 2026-10-19T11:38:15Z | p1 | Aki Aggressive skips step | 4670 | {} |
| 584 | 2026-10-19T11:38:18Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4670 | {} |
| 585 | 2026-10-19T11:38:19Z | p1 | UR pays out ¥90 in dividends to shareholders | 4625 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 586 | 2026-10-19T11:38:20Z | p1 | Aki Aggressive ends turn | 4625 | {} |
| 587 | 2026-10-19T11:38:25Z | p4 | Nori Newcomer skips step | 4625 | {} |
| 588 | 2026-10-19T11:38:26Z | p4 | Nori Newcomer skips step | 4625 | {} |
| 589 | 2026-10-19T11:38:29Z | p4 | AR runs 1 train(s) for ¥80 revenue | 4625 | {} |
| 590 | 2026-10-19T11:38:31Z | p4 | AR pays out ¥80 in dividends to shareholders | 4545 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 591 | 2026-10-19T11:38:32Z | p4 | Nori Newcomer ends turn | 4545 | {} |
| 592 | 2026-10-19T11:38:33Z | p4 | Nori Newcomer skips step | 4545 | {} |
| 593 | 2026-10-19T11:38:38Z | p4 | Nori Newcomer skips step | 4545 | {} |
| 594 | 2026-10-19T11:38:41Z | p4 | KO runs 1 train(s) for ¥50 revenue | 4545 | {} |
| 595 | 2026-10-19T11:38:42Z | p4 | KO pays out ¥50 in dividends to shareholders | 4520 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 596 | 2026-10-19T11:38:43Z | p4 | Nori Newcomer ends turn | 4520 | {} |
| 597 | 2026-10-19T11:38:46Z | p1 | Aki Aggressive skips step | 4520 | {} |
| 598 | 2026-10-19T11:38:47Z | p1 | Aki Aggressive skips step | 4520 | {} |
| 599 | 2026-10-19T11:38:50Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4520 | {} |
| 600 | 2026-10-19T11:38:51Z | p1 | SR pays out ¥60 in dividends to shareholders | 4490 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 601 | 2026-10-19T11:38:52Z | p1 | Aki Aggressive ends turn | 4490 | {} |
| 602 | 2026-10-19T11:38:55Z | p2 | Chi Conservative skips step | 4490 | {} |
| 603 | 2026-10-19T11:38:56Z | p2 | Chi Conservative skips step | 4490 | {} |
| 604 | 2026-10-19T11:38:59Z | p2 | IR runs 1 train(s) for ¥130 revenue | 4490 | {} |
| 605 | 2026-10-19T11:39:01Z | p2 | IR pays out ¥130 in dividends to shareholders | 4425 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 606 | 2026-10-19T11:39:02Z | p2 | Chi Conservative ends turn | 4375 | {"p1": 50} |
| 607 | 2026-10-19T11:39:11Z | p1 | Aki Aggressive skips step | 4375 | {} |
| 608 | 2026-10-19T11:39:13Z | p1 | Aki Aggressive skips step | 4375 | {} |
| 609 | 2026-10-19T11:39:16Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4375 | {} |
| 610 | 2026-10-19T11:39:17Z | p1 | UR pays out ¥90 in dividends to shareholders | 4330 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 611 | 2026-10-19T11:39:18Z | p1 | Aki Aggressive ends turn | 4330 | {} |
| 612 | 2026-10-19T11:39:21Z | p4 | Nori Newcomer skips step | 4330 | {} |
| 613 | 2026-10-19T11:39:22Z | p4 | Nori Newcomer skips step | 4330 | {} |
| 614 | 2026-10-19T11:39:25Z | p4 | AR runs 1 train(s) for ¥80 revenue | 4330 | {} |
| 615 | 2026-10-19T11:39:27Z | p4 | AR pays out ¥80 in dividends to shareholders | 4250 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 616 | 2026-10-19T11:39:28Z | p4 | Nori Newcomer ends turn | 4250 | {} |
| 617 | 2026-10-19T11:39:29Z | p4 | Nori Newcomer skips step | 4250 | {} |
| 618 | 2026-10-19T11:39:32Z | p4 | Nori Newcomer skips step | 4250 | {} |
| 619 | 2026-10-19T11:39:35Z | p4 | KO runs 1 train(s) for ¥50 revenue | 4250 | {} |
| 620 | 2026-10-19T11:39:37Z | p4 | KO pays out ¥50 in dividends to shareholders | 4225 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 621 | 2026-10-19T11:39:38Z | p4 | Nori Newcomer ends turn | 4225 | {} |
| 622 | 2026-10-19T11:39:40Z | p1 | Aki Aggressive skips step | 4225 | {} |
| 623 | 2026-10-19T11:39:41Z | p1 | Aki Aggressive skips step | 4225 | {} |
| 624 | 2026-10-19T11:39:44Z | p1 | SR runs 1 train(s) for ¥60 revenue | 4225 | {} |
| 625 | 2026-10-19T11:39:46Z | p1 | SR pays out ¥60 in dividends to shareholders | 4195 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 626 | 2026-10-19T11:39:47Z | p1 | Aki Aggressive ends turn | 4195 | {} |
| 627 | 2026-10-19T11:39:49Z | p2 | Chi Conservative skips step | 4195 | {} |
| 628 | 2026-10-19T11:39:50Z | p2 | Chi Conservative skips step | 4195 | {} |
| 629 | 2026-10-19T11:39:53Z | p2 | IR runs 1 train(s) for ¥130 revenue | 4195 | {} |
| 630 | 2026-10-19T11:39:55Z | p2 | IR pays out ¥130 in dividends to shareholders | 4130 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 631 | 2026-10-19T11:39:56Z | p2 | Chi Conservative ends turn → Stock Round | 4130 | {} |
| 632 | 2026-10-19T11:40:09Z | p1 | Aki Aggressive passes | 4130 | {} |
| 633 | 2026-10-19T11:40:11Z | p2 | Chi Conservative passes | 4130 | {} |
| 634 | 2026-10-19T11:40:14Z | p3 | Osa Opportunistic passes | 4130 | {} |
| 635 | 2026-10-19T11:40:16Z | p4 | Nori Newcomer passes → Operating Round | 4080 | {"p1": 50} |
| 636 | 2026-10-19T11:40:21Z | p1 | Aki Aggressive skips step | 4080 | {} |
| 637 | 2026-10-19T11:40:29Z | p1 | Aki Aggressive skips step | 4080 | {} |
| 638 | 2026-10-19T11:40:32Z | p1 | UR runs 1 train(s) for ¥90 revenue | 4080 | {} |
| 639 | 2026-10-19T11:40:33Z | p1 | UR pays out ¥90 in dividends to shareholders | 4035 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 640 | 2026-10-19T11:40:34Z | p1 | Aki Aggressive ends turn | 4035 | {} |
| 641 | 2026-10-19T11:40:37Z | p4 | Nori Newcomer skips step | 4035 | {} |
| 642 | 2026-10-19T11:40:38Z | p4 | Nori Newcomer skips step | 4035 | {} |
| 643 | 2026-10-19T11:40:40Z | p4 | AR runs 1 train(s) for ¥80 revenue | 4035 | {} |
| 644 | 2026-10-19T11:40:42Z | p4 | AR pays out ¥80 in dividends to shareholders | 3955 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 645 | 2026-10-19T11:40:43Z | p4 | Nori Newcomer ends turn | 3955 | {} |
| 646 | 2026-10-19T11:40:47Z | p4 | Nori Newcomer skips step | 3955 | {} |
| 647 | 2026-10-19T11:40:48Z | p4 | Nori Newcomer skips step | 3955 | {} |
| 648 | 2026-10-19T11:40:51Z | p4 | KO runs 1 train(s) for ¥50 revenue | 3955 | {} |
| 649 | 2026-10-19T11:40:53Z | p4 | KO pays out ¥50 in dividends to shareholders | 3930 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 650 | 2026-10-19T11:40:54Z | p4 | Nori Newcomer ends turn | 3930 | {} |
| 651 | 2026-10-19T11:40:56Z | p1 | Aki Aggressive skips step | 3930 | {} |
| 652 | 2026-10-19T11:40:57Z | p1 | Aki Aggressive skips step | 3930 | {} |
| 653 | 2026-10-19T11:41:00Z | p1 | SR runs 1 train(s) for ¥60 revenue | 3930 | {} |
| 654 | 2026-10-19T11:41:01Z | p1 | SR pays out ¥60 in dividends to shareholders | 3900 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 655 | 2026-10-19T11:41:02Z | p1 | Aki Aggressive ends turn | 3900 | {} |
| 656 | 2026-10-19T11:41:05Z | p2 | Chi Conservative skips step | 3900 | {} |
| 657 | 2026-10-19T11:41:11Z | p2 | Chi Conservative skips step | 3900 | {} |
| 658 | 2026-10-19T11:41:14Z | p2 | IR runs 1 train(s) for ¥130 revenue | 3900 | {} |
| 659 | 2026-10-19T11:41:16Z | p2 | IR pays out ¥130 in dividends to shareholders | 3835 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 660 | 2026-10-19T11:41:16Z | p2 | Chi Conservative ends turn | 3785 | {"p1": 50} |
| 661 | 2026-10-19T11:41:22Z | p1 | Aki Aggressive skips step | 3785 | {} |
| 662 | 2026-10-19T11:41:23Z | p1 | Aki Aggressive skips step | 3785 | {} |
| 663 | 2026-10-19T11:41:26Z | p1 | UR runs 1 train(s) for ¥90 revenue | 3785 | {} |
| 664 | 2026-10-19T11:41:28Z | p1 | UR pays out ¥90 in dividends to shareholders | 3740 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 665 | 2026-10-19T11:41:29Z | p1 | Aki Aggressive ends turn | 3740 | {} |
| 666 | 2026-10-19T11:41:31Z | p4 | Nori Newcomer skips step | 3740 | {} |
| 667 | 2026-10-19T11:41:32Z | p4 | Nori Newcomer skips step | 3740 | {} |
| 668 | 2026-10-19T11:41:35Z | p4 | AR runs 1 train(s) for ¥80 revenue | 3740 | {} |
| 669 | 2026-10-19T11:41:37Z | p4 | AR pays out ¥80 in dividends to shareholders | 3660 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 670 | 2026-10-19T11:41:38Z | p4 | Nori Newcomer ends turn | 3660 | {} |
| 671 | 2026-10-19T11:41:39Z | p4 | Nori Newcomer skips step | 3660 | {} |
| 672 | 2026-10-19T11:41:40Z | p4 | Nori Newcomer skips step | 3660 | {} |
| 673 | 2026-10-19T11:41:43Z | p4 | KO runs 1 train(s) for ¥50 revenue | 3660 | {} |
| 674 | 2026-10-19T11:41:45Z | p4 | KO pays out ¥50 in dividends to shareholders | 3635 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 675 | 2026-10-19T11:41:46Z | p4 | Nori Newcomer ends turn | 3635 | {} |
| 676 | 2026-10-19T11:41:48Z | p1 | Aki Aggressive skips step | 3635 | {} |
| 677 | 2026-10-19T11:41:49Z | p1 | Aki Aggressive skips step | 3635 | {} |
| 678 | 2026-10-19T11:41:52Z | p1 | SR runs 1 train(s) for ¥60 revenue | 3635 | {} |
| 679 | 2026-10-19T11:41:54Z | p1 | SR pays out ¥60 in dividends to shareholders | 3605 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 680 | 2026-10-19T11:41:55Z | p1 | Aki Aggressive ends turn | 3605 | {} |
| 681 | 2026-10-19T11:42:00Z | p2 | Chi Conservative skips step | 3605 | {} |
| 682 | 2026-10-19T11:42:03Z | p2 | Chi Conservative skips step | 3605 | {} |
| 683 | 2026-10-19T11:42:06Z | p2 | IR runs 1 train(s) for ¥130 revenue | 3605 | {} |
| 684 | 2026-10-19T11:42:08Z | p2 | IR pays out ¥130 in dividends to shareholders | 3540 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 685 | 2026-10-19T11:42:09Z | p2 | Chi Conservative ends turn | 3490 | {"p1": 50} |
| 686 | 2026-10-19T11:42:25Z | p1 | Aki Aggressive skips step | 3490 | {} |
| 687 | 2026-10-19T11:42:26Z | p1 | Aki Aggressive skips step | 3490 | {} |
| 688 | 2026-10-19T11:42:29Z | p1 | UR runs 1 train(s) for ¥90 revenue | 3490 | {} |
| 689 | 2026-10-19T11:42:30Z | p1 | UR pays out ¥90 in dividends to shareholders | 3445 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 690 | 2026-10-19T11:42:31Z | p1 | Aki Aggressive ends turn | 3445 | {} |
| 691 | 2026-10-19T11:42:34Z | p4 | Nori Newcomer skips step | 3445 | {} |
| 692 | 2026-10-19T11:42:35Z | p4 | Nori Newcomer skips step | 3445 | {} |
| 693 | 2026-10-19T11:42:38Z | p4 | AR runs 1 train(s) for ¥80 revenue | 3445 | {} |
| 694 | 2026-10-19T11:42:39Z | p4 | AR pays out ¥80 in dividends to shareholders | 3365 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 695 | 2026-10-19T11:42:40Z | p4 | Nori Newcomer ends turn | 3365 | {} |
| 696 | 2026-10-19T11:42:42Z | p4 | Nori Newcomer skips step | 3365 | {} |
| 697 | 2026-10-19T11:42:47Z | p4 | Nori Newcomer skips step | 3365 | {} |
| 698 | 2026-10-19T11:42:50Z | p4 | KO runs 1 train(s) for ¥50 revenue | 3365 | {} |
| 699 | 2026-10-19T11:42:51Z | p4 | KO pays out ¥50 in dividends to shareholders | 3340 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 700 | 2026-10-19T11:42:52Z | p4 | Nori Newcomer ends turn | 3340 | {} |
| 701 | 2026-10-19T11:42:55Z | p1 | Aki Aggressive skips step | 3340 | {} |
| 702 | 2026-10-19T11:42:56Z | p1 | Aki Aggressive skips step | 3340 | {} |
| 703 | 2026-10-19T11:42:59Z | p1 | SR runs 1 train(s) for ¥60 revenue | 3340 | {} |
| 704 | 2026-10-19T11:43:00Z | p1 | SR pays out ¥60 in dividends to shareholders | 3310 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 705 | 2026-10-19T11:43:01Z | p1 | Aki Aggressive ends turn | 3310 | {} |
| 706 | 2026-10-19T11:43:06Z | p2 | Chi Conservative skips step | 3310 | {} |
| 707 | 2026-10-19T11:43:07Z | p2 | Chi Conservative skips step | 3310 | {} |
| 708 | 2026-10-19T11:43:10Z | p2 | IR runs 1 train(s) for ¥130 revenue | 3310 | {} |
| 709 | 2026-10-19T11:43:12Z | p2 | IR pays out ¥130 in dividends to shareholders | 3245 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 710 | 2026-10-19T11:43:13Z | p2 | Chi Conservative ends turn → Stock Round | 3245 | {} |
| 711 | 2026-10-19T11:43:18Z | p1 | Aki Aggressive passes | 3245 | {} |
| 712 | 2026-10-19T11:43:20Z | p2 | Chi Conservative passes | 3245 | {} |
| 713 | 2026-10-19T11:43:24Z | p3 | Osa Opportunistic passes | 3245 | {} |
| 714 | 2026-10-19T11:43:26Z | p4 | Nori Newcomer passes → Operating Round | 3195 | {"p1": 50} |
| 715 | 2026-10-19T11:43:32Z | p1 | Aki Aggressive skips step | 3195 | {} |
| 716 | 2026-10-19T11:43:33Z | p1 | Aki Aggressive skips step | 3195 | {} |
| 717 | 2026-10-19T11:43:35Z | p1 | UR runs 1 train(s) for ¥90 revenue | 3195 | {} |
| 718 | 2026-10-19T11:43:37Z | p1 | UR pays out ¥90 in dividends to shareholders | 3150 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 719 | 2026-10-19T11:43:39Z | p1 | Aki Aggressive ends turn | 3150 | {} |
| 720 | 2026-10-19T11:43:41Z | p4 | Nori Newcomer skips step | 3150 | {} |
| 721 | 2026-10-19T11:43:42Z | p4 | Nori Newcomer skips step | 3150 | {} |
| 722 | 2026-10-19T11:43:45Z | p4 | AR runs 1 train(s) for ¥80 revenue | 3150 | {} |
| 723 | 2026-10-19T11:43:47Z | p4 | AR pays out ¥80 in dividends to shareholders | 3070 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 724 | 2026-10-19T11:43:48Z | p4 | Nori Newcomer ends turn | 3070 | {} |
| 725 | 2026-10-19T11:43:50Z | p4 | Nori Newcomer skips step | 3070 | {} |
| 726 | 2026-10-19T11:43:53Z | p4 | Nori Newcomer skips step | 3070 | {} |
| 727 | 2026-10-19T11:43:56Z | p4 | KO runs 1 train(s) for ¥50 revenue | 3070 | {} |
| 728 | 2026-10-19T11:43:58Z | p4 | KO pays out ¥50 in dividends to shareholders | 3045 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 729 | 2026-10-19T11:43:59Z | p4 | Nori Newcomer ends turn | 3045 | {} |
| 730 | 2026-10-19T11:44:02Z | p1 | Aki Aggressive skips step | 3045 | {} |
| 731 | 2026-10-19T11:44:02Z | p1 | Aki Aggressive skips step | 3045 | {} |
| 732 | 2026-10-19T11:44:05Z | p1 | SR runs 1 train(s) for ¥60 revenue | 3045 | {} |
| 733 | 2026-10-19T11:44:07Z | p1 | SR pays out ¥60 in dividends to shareholders | 3015 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 734 | 2026-10-19T11:44:08Z | p1 | Aki Aggressive ends turn | 3015 | {} |
| 735 | 2026-10-19T11:44:13Z | p2 | Chi Conservative skips step | 3015 | {} |
| 736 | 2026-10-19T11:44:16Z | p2 | Chi Conservative skips step | 3015 | {} |
| 737 | 2026-10-19T11:44:19Z | p2 | IR runs 1 train(s) for ¥130 revenue | 3015 | {} |
| 738 | 2026-10-19T11:44:21Z | p2 | IR pays out ¥130 in dividends to shareholders | 2950 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 739 | 2026-10-19T11:44:22Z | p2 | Chi Conservative ends turn | 2900 | {"p1": 50} |
| 740 | 2026-10-19T11:44:35Z | p1 | Aki Aggressive skips step | 2900 | {} |
| 741 | 2026-10-19T11:44:36Z | p1 | Aki Aggressive skips step | 2900 | {} |
| 742 | 2026-10-19T11:44:39Z | p1 | UR runs 1 train(s) for ¥90 revenue | 2900 | {} |
| 743 | 2026-10-19T11:44:41Z | p1 | UR pays out ¥90 in dividends to shareholders | 2855 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 744 | 2026-10-19T11:44:42Z | p1 | Aki Aggressive ends turn | 2855 | {} |
| 745 | 2026-10-19T11:44:44Z | p4 | Nori Newcomer skips step | 2855 | {} |
| 746 | 2026-10-19T11:44:45Z | p4 | Nori Newcomer skips step | 2855 | {} |
| 747 | 2026-10-19T11:44:48Z | p4 | AR runs 1 train(s) for ¥80 revenue | 2855 | {} |
| 748 | 2026-10-19T11:44:50Z | p4 | AR pays out ¥80 in dividends to shareholders | 2775 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 749 | 2026-10-19T11:44:51Z | p4 | Nori Newcomer ends turn | 2775 | {} |
| 750 | 2026-10-19T11:44:53Z | p4 | Nori Newcomer skips step | 2775 | {} |
| 751 | 2026-10-19T11:44:56Z | p4 | Nori Newcomer skips step | 2775 | {} |
| 752 | 2026-10-19T11:44:58Z | p4 | KO runs 1 train(s) for ¥50 revenue | 2775 | {} |
| 753 | 2026-10-19T11:45:00Z | p4 | KO pays out ¥50 in dividends to shareholders | 2750 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 754 | 2026-10-19T11:45:01Z | p4 | Nori Newcomer ends turn | 2750 | {} |
| 755 | 2026-10-19T11:45:03Z | p1 | Aki Aggressive skips step | 2750 | {} |
| 756 | 2026-10-19T11:45:04Z | p1 | Aki Aggressive skips step | 2750 | {} |
| 757 | 2026-10-19T11:45:07Z | p1 | SR runs 1 train(s) for ¥60 revenue | 2750 | {} |
| 758 | 2026-10-19T11:45:09Z | p1 | SR pays out ¥60 in dividends to shareholders | 2720 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 759 | 2026-10-19T11:45:10Z | p1 | Aki Aggressive ends turn | 2720 | {} |
| 760 | 2026-10-19T11:45:14Z | p2 | Chi Conservative skips step | 2720 | {} |
| 761 | 2026-10-19T11:45:18Z | p2 | Chi Conservative skips step | 2720 | {} |
| 762 | 2026-10-19T11:45:21Z | p2 | IR runs 1 train(s) for ¥130 revenue | 2720 | {} |
| 763 | 2026-10-19T11:45:23Z | p2 | IR pays out ¥130 in dividends to shareholders | 2655 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 764 | 2026-10-19T11:45:24Z | p2 | Chi Conservative ends turn | 2605 | {"p1": 50} |
| 765 | 2026-10-19T11:45:30Z | p1 | Aki Aggressive skips step | 2605 | {} |
| 766 | 2026-10-19T11:45:30Z | p1 | Aki Aggressive skips step | 2605 | {} |
| 767 | 2026-10-19T11:45:33Z | p1 | UR runs 1 train(s) for ¥90 revenue | 2605 | {} |
| 768 | 2026-10-19T11:45:35Z | p1 | UR pays out ¥90 in dividends to shareholders | 2560 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 769 | 2026-10-19T11:45:36Z | p1 | Aki Aggressive ends turn | 2560 | {} |
| 770 | 2026-10-19T11:45:39Z | p4 | Nori Newcomer skips step | 2560 | {} |
| 771 | 2026-10-19T11:45:40Z | p4 | Nori Newcomer skips step | 2560 | {} |
| 772 | 2026-10-19T11:45:42Z | p4 | AR runs 1 train(s) for ¥80 revenue | 2560 | {} |
| 773 | 2026-10-19T11:45:44Z | p4 | AR pays out ¥80 in dividends to shareholders | 2480 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 774 | 2026-10-19T11:45:45Z | p4 | Nori Newcomer ends turn | 2480 | {} |
| 775 | 2026-10-19T11:45:47Z | p4 | Nori Newcomer skips step | 2480 | {} |
| 776 | 2026-10-19T11:45:51Z | p4 | Nori Newcomer skips step | 2480 | {} |
| 777 | 2026-10-19T11:45:54Z | p4 | KO runs 1 train(s) for ¥50 revenue | 2480 | {} |
| 778 | 2026-10-19T11:45:56Z | p4 | KO pays out ¥50 in dividends to shareholders | 2455 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 779 | 2026-10-19T11:45:57Z | p4 | Nori Newcomer ends turn | 2455 | {} |
| 780 | 2026-10-19T11:45:59Z | p1 | Aki Aggressive skips step | 2455 | {} |
| 781 | 2026-10-19T11:46:00Z | p1 | Aki Aggressive skips step | 2455 | {} |
| 782 | 2026-10-19T11:46:03Z | p1 | SR runs 1 train(s) for ¥60 revenue | 2455 | {} |
| 783 | 2026-10-19T11:46:05Z | p1 | SR pays out ¥60 in dividends to shareholders | 2425 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 784 | 2026-10-19T11:46:06Z | p1 | Aki Aggressive ends turn | 2425 | {} |
| 785 | 2026-10-19T11:46:12Z | p2 | Chi Conservative skips step | 2425 | {} |
| 786 | 2026-10-19T11:46:14Z | p2 | Chi Conservative skips step | 2425 | {} |
| 787 | 2026-10-19T11:46:17Z | p2 | IR runs 1 train(s) for ¥130 revenue | 2425 | {} |
| 788 | 2026-10-19T11:46:19Z | p2 | IR pays out ¥130 in dividends to shareholders | 2360 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 789 | 2026-10-19T11:46:20Z | p2 | Chi Conservative ends turn → Stock Round | 2360 | {} |
| 790 | 2026-10-19T11:46:25Z | p1 | Aki Aggressive passes | 2360 | {} |
| 791 | 2026-10-19T11:46:27Z | p2 | Chi Conservative passes | 2360 | {} |
| 792 | 2026-10-19T11:46:31Z | p3 | Osa Opportunistic passes | 2360 | {} |
| 793 | 2026-10-19T11:46:33Z | p4 | Nori Newcomer passes → Operating Round | 2310 | {"p1": 50} |
| 794 | 2026-10-19T11:46:42Z | p1 | Aki Aggressive skips step | 2310 | {} |
| 795 | 2026-10-19T11:46:50Z | p1 | Aki Aggressive skips step | 2310 | {} |
| 796 | 2026-10-19T11:46:53Z | p1 | UR runs 1 train(s) for ¥90 revenue | 2310 | {} |
| 797 | 2026-10-19T11:46:55Z | p1 | UR pays out ¥90 in dividends to shareholders | 2265 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 798 | 2026-10-19T11:46:56Z | p1 | Aki Aggressive ends turn | 2265 | {} |
| 799 | 2026-10-19T11:46:59Z | p4 | Nori Newcomer skips step | 2265 | {} |
| 800 | 2026-10-19T11:47:00Z | p4 | Nori Newcomer skips step | 2265 | {} |
| 801 | 2026-10-19T11:47:02Z | p4 | AR runs 1 train(s) for ¥80 revenue | 2265 | {} |
| 802 | 2026-10-19T11:47:04Z | p4 | AR pays out ¥80 in dividends to shareholders | 2185 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 803 | 2026-10-19T11:47:05Z | p4 | Nori Newcomer ends turn | 2185 | {} |
| 804 | 2026-10-19T11:47:08Z | p4 | Nori Newcomer skips step | 2185 | {} |
| 805 | 2026-10-19T11:47:11Z | p4 | Nori Newcomer skips step | 2185 | {} |
| 806 | 2026-10-19T11:47:14Z | p4 | KO runs 1 train(s) for ¥50 revenue | 2185 | {} |
| 807 | 2026-10-19T11:47:15Z | p4 | KO pays out ¥50 in dividends to shareholders | 2160 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 808 | 2026-10-19T11:47:16Z | p4 | Nori Newcomer ends turn | 2160 | {} |
| 809 | 2026-10-19T11:47:19Z | p1 | Aki Aggressive skips step | 2160 | {} |
| 810 | 2026-10-19T11:47:20Z | p1 | Aki Aggressive skips step | 2160 | {} |
| 811 | 2026-10-19T11:47:23Z | p1 | SR runs 1 train(s) for ¥60 revenue | 2160 | {} |
| 812 | 2026-10-19T11:47:25Z | p1 | SR pays out ¥60 in dividends to shareholders | 2130 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 813 | 2026-10-19T11:47:26Z | p1 | Aki Aggressive ends turn | 2130 | {} |
| 814 | 2026-10-19T11:47:31Z | p2 | Chi Conservative skips step | 2130 | {} |
| 815 | 2026-10-19T11:47:33Z | p2 | Chi Conservative skips step | 2130 | {} |
| 816 | 2026-10-19T11:47:36Z | p2 | IR runs 1 train(s) for ¥130 revenue | 2130 | {} |
| 817 | 2026-10-19T11:47:38Z | p2 | IR pays out ¥130 in dividends to shareholders | 2065 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 818 | 2026-10-19T11:47:39Z | p2 | Chi Conservative ends turn | 2015 | {"p1": 50} |
| 819 | 2026-10-19T11:47:47Z | p1 | Aki Aggressive skips step | 2015 | {} |
| 820 | 2026-10-19T11:47:52Z | p1 | Aki Aggressive skips step | 2015 | {} |
| 821 | 2026-10-19T11:47:55Z | p1 | UR runs 1 train(s) for ¥90 revenue | 2015 | {} |
| 822 | 2026-10-19T11:47:57Z | p1 | UR pays out ¥90 in dividends to shareholders | 1970 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 823 | 2026-10-19T11:47:58Z | p1 | Aki Aggressive ends turn | 1970 | {} |
| 824 | 2026-10-19T11:48:00Z | p4 | Nori Newcomer skips step | 1970 | {} |
| 825 | 2026-10-19T11:48:01Z | p4 | Nori Newcomer skips step | 1970 | {} |
| 826 | 2026-10-19T11:48:04Z | p4 | AR runs 1 train(s) for ¥80 revenue | 1970 | {} |
| 827 | 2026-10-19T11:48:06Z | p4 | AR pays out ¥80 in dividends to shareholders | 1890 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 828 | 2026-10-19T11:48:07Z | p4 | Nori Newcomer ends turn | 1890 | {} |
| 829 | 2026-10-19T11:48:09Z | p4 | Nori Newcomer skips step | 1890 | {} |
| 830 | 2026-10-19T11:48:15Z | p4 | Nori Newcomer skips step | 1890 | {} |
| 831 | 2026-10-19T11:48:18Z | p4 | KO runs 1 train(s) for ¥50 revenue | 1890 | {} |
| 832 | 2026-10-19T11:48:20Z | p4 | KO pays out ¥50 in dividends to shareholders | 1865 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 833 | 2026-10-19T11:48:21Z | p4 | Nori Newcomer ends turn | 1865 | {} |
| 834 | 2026-10-19T11:48:23Z | p1 | Aki Aggressive skips step | 1865 | {} |
| 835 | 2026-10-19T11:48:24Z | p1 | Aki Aggressive skips step | 1865 | {} |
| 836 | 2026-10-19T11:48:27Z | p1 | SR runs 1 train(s) for ¥60 revenue | 1865 | {} |
| 837 | 2026-10-19T11:48:29Z | p1 | SR pays out ¥60 in dividends to shareholders | 1835 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 838 | 2026-10-19T11:48:30Z | p1 | Aki Aggressive ends turn | 1835 | {} |
| 839 | 2026-10-19T11:48:36Z | p2 | Chi Conservative skips step | 1835 | {} |
| 840 | 2026-10-19T11:48:38Z | p2 | Chi Conservative skips step | 1835 | {} |
| 841 | 2026-10-19T11:48:40Z | p2 | IR runs 1 train(s) for ¥130 revenue | 1835 | {} |
| 842 | 2026-10-19T11:48:42Z | p2 | IR pays out ¥130 in dividends to shareholders | 1770 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 843 | 2026-10-19T11:48:43Z | p2 | Chi Conservative ends turn | 1720 | {"p1": 50} |
| 844 | 2026-10-19T11:49:01Z | p1 | Aki Aggressive skips step | 1720 | {} |
| 845 | 2026-10-19T11:49:04Z | p1 | Aki Aggressive skips step | 1720 | {} |
| 846 | 2026-10-19T11:49:07Z | p1 | UR runs 1 train(s) for ¥90 revenue | 1720 | {} |
| 847 | 2026-10-19T11:49:09Z | p1 | UR pays out ¥90 in dividends to shareholders | 1675 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 848 | 2026-10-19T11:49:10Z | p1 | Aki Aggressive ends turn | 1675 | {} |
| 849 | 2026-10-19T11:49:13Z | p4 | Nori Newcomer skips step | 1675 | {} |
| 850 | 2026-10-19T11:49:13Z | p4 | Nori Newcomer skips step | 1675 | {} |
| 851 | 2026-10-19T11:49:16Z | p4 | AR runs 1 train(s) for ¥80 revenue | 1675 | {} |
| 852 | 2026-10-19T11:49:18Z | p4 | AR pays out ¥80 in dividends to shareholders | 1595 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 853 | 2026-10-19T11:49:19Z | p4 | Nori Newcomer ends turn | 1595 | {} |
| 854 | 2026-10-19T11:49:22Z | p4 | Nori Newcomer skips step | 1595 | {} |
| 855 | 2026-10-19T11:49:25Z | p4 | Nori Newcomer skips step | 1595 | {} |
| 856 | 2026-10-19T11:49:28Z | p4 | KO runs 1 train(s) for ¥50 revenue | 1595 | {} |
| 857 | 2026-10-19T11:49:30Z | p4 | KO pays out ¥50 in dividends to shareholders | 1570 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 858 | 2026-10-19T11:49:31Z | p4 | Nori Newcomer ends turn | 1570 | {} |
| 859 | 2026-10-19T11:49:33Z | p1 | Aki Aggressive skips step | 1570 | {} |
| 860 | 2026-10-19T11:49:34Z | p1 | Aki Aggressive skips step | 1570 | {} |
| 861 | 2026-10-19T11:49:37Z | p1 | SR runs 1 train(s) for ¥60 revenue | 1570 | {} |
| 862 | 2026-10-19T11:49:39Z | p1 | SR pays out ¥60 in dividends to shareholders | 1540 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 863 | 2026-10-19T11:49:40Z | p1 | Aki Aggressive ends turn | 1540 | {} |
| 864 | 2026-10-19T11:49:46Z | p2 | Chi Conservative skips step | 1540 | {} |
| 865 | 2026-10-19T11:49:48Z | p2 | Chi Conservative skips step | 1540 | {} |
| 866 | 2026-10-19T11:49:51Z | p2 | IR runs 1 train(s) for ¥130 revenue | 1540 | {} |
| 867 | 2026-10-19T11:49:53Z | p2 | IR pays out ¥130 in dividends to shareholders | 1475 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 868 | 2026-10-19T11:49:54Z | p2 | Chi Conservative ends turn → Stock Round | 1475 | {} |
| 869 | 2026-10-19T11:49:58Z | p1 | Aki Aggressive passes | 1475 | {} |
| 870 | 2026-10-19T11:50:01Z | p2 | Chi Conservative passes | 1475 | {} |
| 871 | 2026-10-19T11:50:04Z | p3 | Osa Opportunistic passes | 1475 | {} |
| 872 | 2026-10-19T11:50:07Z | p4 | Nori Newcomer passes → Operating Round | 1425 | {"p1": 50} |
| 873 | 2026-10-19T11:50:15Z | p1 | Aki Aggressive skips step | 1425 | {} |
| 874 | 2026-10-19T11:50:18Z | p1 | Aki Aggressive skips step | 1425 | {} |
| 875 | 2026-10-19T11:50:21Z | p1 | UR runs 1 train(s) for ¥90 revenue | 1425 | {} |
| 876 | 2026-10-19T11:50:23Z | p1 | UR pays out ¥90 in dividends to shareholders | 1380 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 877 | 2026-10-19T11:50:24Z | p1 | Aki Aggressive ends turn | 1380 | {} |
| 878 | 2026-10-19T11:50:27Z | p4 | Nori Newcomer skips step | 1380 | {} |
| 879 | 2026-10-19T11:50:28Z | p4 | Nori Newcomer skips step | 1380 | {} |
| 880 | 2026-10-19T11:50:31Z | p4 | AR runs 1 train(s) for ¥80 revenue | 1380 | {} |
| 881 | 2026-10-19T11:50:33Z | p4 | AR pays out ¥80 in dividends to shareholders | 1300 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 882 | 2026-10-19T11:50:34Z | p4 | Nori Newcomer ends turn | 1300 | {} |
| 883 | 2026-10-19T11:50:36Z | p4 | Nori Newcomer skips step | 1300 | {} |
| 884 | 2026-10-19T11:50:38Z | p4 | Nori Newcomer skips step | 1300 | {} |
| 885 | 2026-10-19T11:50:41Z | p4 | KO runs 1 train(s) for ¥50 revenue | 1300 | {} |
| 886 | 2026-10-19T11:50:43Z | p4 | KO pays out ¥50 in dividends to shareholders | 1275 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 887 | 2026-10-19T11:50:44Z | p4 | Nori Newcomer ends turn | 1275 | {} |
| 888 | 2026-10-19T11:50:47Z | p1 | Aki Aggressive skips step | 1275 | {} |
| 889 | 2026-10-19T11:50:48Z | p1 | Aki Aggressive skips step | 1275 | {} |
| 890 | 2026-10-19T11:50:51Z | p1 | SR runs 1 train(s) for ¥60 revenue | 1275 | {} |
| 891 | 2026-10-19T11:50:53Z | p1 | SR pays out ¥60 in dividends to shareholders | 1245 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 892 | 2026-10-19T11:50:54Z | p1 | Aki Aggressive ends turn | 1245 | {} |
| 893 | 2026-10-19T11:50:59Z | p2 | Chi Conservative skips step | 1245 | {} |
| 894 | 2026-10-19T11:51:02Z | p2 | Chi Conservative skips step | 1245 | {} |
| 895 | 2026-10-19T11:51:05Z | p2 | IR runs 1 train(s) for ¥130 revenue | 1245 | {} |
| 896 | 2026-10-19T11:51:07Z | p2 | IR pays out ¥130 in dividends to shareholders | 1180 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 897 | 2026-10-19T11:51:08Z | p2 | Chi Conservative ends turn | 1130 | {"p1": 50} |
| 898 | 2026-10-19T11:51:20Z | p1 | Aki Aggressive skips step | 1130 | {} |
| 899 | 2026-10-19T11:51:20Z | p1 | Aki Aggressive skips step | 1130 | {} |
| 900 | 2026-10-19T11:51:23Z | p1 | UR runs 1 train(s) for ¥90 revenue | 1130 | {} |
| 901 | 2026-10-19T11:51:25Z | p1 | UR pays out ¥90 in dividends to shareholders | 1085 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 902 | 2026-10-19T11:51:26Z | p1 | Aki Aggressive ends turn | 1085 | {} |
| 903 | 2026-10-19T11:51:31Z | p4 | Nori Newcomer skips step | 1085 | {} |
| 904 | 2026-10-19T11:51:32Z | p4 | Nori Newcomer skips step | 1085 | {} |
| 905 | 2026-10-19T11:51:35Z | p4 | AR runs 1 train(s) for ¥80 revenue | 1085 | {} |
| 906 | 2026-10-19T11:51:37Z | p4 | AR pays out ¥80 in dividends to shareholders | 1005 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 907 | 2026-10-19T11:51:38Z | p4 | Nori Newcomer ends turn | 1005 | {} |
| 908 | 2026-10-19T11:51:40Z | p4 | Nori Newcomer skips step | 1005 | {} |
| 909 | 2026-10-19T11:51:42Z | p4 | Nori Newcomer skips step | 1005 | {} |
| 910 | 2026-10-19T11:51:45Z | p4 | KO runs 1 train(s) for ¥50 revenue | 1005 | {} |
| 911 | 2026-10-19T11:51:47Z | p4 | KO pays out ¥50 in dividends to shareholders | 980 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 912 | 2026-10-19T11:51:48Z | p4 | Nori Newcomer ends turn | 980 | {} |
| 913 | 2026-10-19T11:51:51Z | p1 | Aki Aggressive skips step | 980 | {} |
| 914 | 2026-10-19T11:51:52Z | p1 | Aki Aggressive skips step | 980 | {} |
| 915 | 2026-10-19T11:51:55Z | p1 | SR runs 1 train(s) for ¥60 revenue | 980 | {} |
| 916 | 2026-10-19T11:51:57Z | p1 | SR pays out ¥60 in dividends to shareholders | 950 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 917 | 2026-10-19T11:51:58Z | p1 | Aki Aggressive ends turn | 950 | {} |
| 918 | 2026-10-19T11:52:03Z | p2 | Chi Conservative skips step | 950 | {} |
| 919 | 2026-10-19T11:52:06Z | p2 | Chi Conservative skips step | 950 | {} |
| 920 | 2026-10-19T11:52:09Z | p2 | IR runs 1 train(s) for ¥130 revenue | 950 | {} |
| 921 | 2026-10-19T11:52:11Z | p2 | IR pays out ¥130 in dividends to shareholders | 885 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 922 | 2026-10-19T11:52:12Z | p2 | Chi Conservative ends turn | 835 | {"p1": 50} |
| 923 | 2026-10-19T11:52:17Z | p1 | Aki Aggressive skips step | 835 | {} |
| 924 | 2026-10-19T11:52:18Z | p1 | Aki Aggressive skips step | 835 | {} |
| 925 | 2026-10-19T11:52:21Z | p1 | UR runs 1 train(s) for ¥90 revenue | 835 | {} |
| 926 | 2026-10-19T11:52:23Z | p1 | UR pays out ¥90 in dividends to shareholders | 790 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 927 | 2026-10-19T11:52:24Z | p1 | Aki Aggressive ends turn | 790 | {} |
| 928 | 2026-10-19T11:52:27Z | p4 | Nori Newcomer skips step | 790 | {} |
| 929 | 2026-10-19T11:52:28Z | p4 | Nori Newcomer skips step | 790 | {} |
| 930 | 2026-10-19T11:52:31Z | p4 | AR runs 1 train(s) for ¥80 revenue | 790 | {} |
| 931 | 2026-10-19T11:52:33Z | p4 | AR pays out ¥80 in dividends to shareholders | 710 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 932 | 2026-10-19T11:52:34Z | p4 | Nori Newcomer ends turn | 710 | {} |
| 933 | 2026-10-19T11:52:36Z | p4 | Nori Newcomer skips step | 710 | {} |
| 934 | 2026-10-19T11:52:42Z | p4 | Nori Newcomer skips step | 710 | {} |
| 935 | 2026-10-19T11:52:45Z | p4 | KO runs 1 train(s) for ¥50 revenue | 710 | {} |
| 936 | 2026-10-19T11:52:46Z | p4 | KO pays out ¥50 in dividends to shareholders | 685 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 937 | 2026-10-19T11:52:47Z | p4 | Nori Newcomer ends turn | 685 | {} |
| 938 | 2026-10-19T11:52:50Z | p1 | Aki Aggressive skips step | 685 | {} |
| 939 | 2026-10-19T11:52:51Z | p1 | Aki Aggressive skips step | 685 | {} |
| 940 | 2026-10-19T11:52:54Z | p1 | SR runs 1 train(s) for ¥60 revenue | 685 | {} |
| 941 | 2026-10-19T11:52:56Z | p1 | SR pays out ¥60 in dividends to shareholders | 655 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 942 | 2026-10-19T11:52:57Z | p1 | Aki Aggressive ends turn | 655 | {} |
| 943 | 2026-10-19T11:53:02Z | p2 | Chi Conservative skips step | 655 | {} |
| 944 | 2026-10-19T11:53:04Z | p2 | Chi Conservative skips step | 655 | {} |
| 945 | 2026-10-19T11:53:07Z | p2 | IR runs 1 train(s) for ¥130 revenue | 655 | {} |
| 946 | 2026-10-19T11:53:09Z | p2 | IR pays out ¥130 in dividends to shareholders | 590 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 947 | 2026-10-19T11:53:10Z | p2 | Chi Conservative ends turn → Stock Round | 590 | {} |
| 948 | 2026-10-19T11:53:15Z | p1 | Aki Aggressive passes | 590 | {} |
| 949 | 2026-10-19T11:53:17Z | p2 | Chi Conservative passes | 590 | {} |
| 950 | 2026-10-19T11:53:22Z | p3 | Osa Opportunistic passes | 590 | {} |
| 951 | 2026-10-19T11:53:27Z | p4 | Nori Newcomer passes → Operating Round | 540 | {"p1": 50} |
| 952 | 2026-10-19T11:53:41Z | p1 | Aki Aggressive skips step | 540 | {} |
| 953 | 2026-10-19T11:53:44Z | p1 | Aki Aggressive skips step | 540 | {} |
| 954 | 2026-10-19T11:53:46Z | p1 | UR runs 1 train(s) for ¥90 revenue | 540 | {} |
| 955 | 2026-10-19T11:53:48Z | p1 | UR pays out ¥90 in dividends to shareholders | 495 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 956 | 2026-10-19T11:53:49Z | p1 | Aki Aggressive ends turn | 495 | {} |
| 957 | 2026-10-19T11:53:54Z | p4 | Nori Newcomer skips step | 495 | {} |
| 958 | 2026-10-19T11:53:55Z | p4 | Nori Newcomer skips step | 495 | {} |
| 959 | 2026-10-19T11:53:58Z | p4 | AR runs 1 train(s) for ¥80 revenue | 495 | {} |
| 960 | 2026-10-19T11:54:00Z | p4 | AR pays out ¥80 in dividends to shareholders | 415 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 961 | 2026-10-19T11:54:01Z | p4 | Nori Newcomer ends turn | 415 | {} |
| 962 | 2026-10-19T11:54:02Z | p4 | Nori Newcomer skips step | 415 | {} |
| 963 | 2026-10-19T11:54:05Z | p4 | Nori Newcomer skips step | 415 | {} |
| 964 | 2026-10-19T11:54:08Z | p4 | KO runs 1 train(s) for ¥50 revenue | 415 | {} |
| 965 | 2026-10-19T11:54:10Z | p4 | KO pays out ¥50 in dividends to shareholders | 390 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 966 | 2026-10-19T11:54:11Z | p4 | Nori Newcomer ends turn | 390 | {} |
| 967 | 2026-10-19T11:54:13Z | p1 | Aki Aggressive skips step | 390 | {} |
| 968 | 2026-10-19T11:54:14Z | p1 | Aki Aggressive skips step | 390 | {} |
| 969 | 2026-10-19T11:54:17Z | p1 | SR runs 1 train(s) for ¥60 revenue | 390 | {} |
| 970 | 2026-10-19T11:54:19Z | p1 | SR pays out ¥60 in dividends to shareholders | 360 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 971 | 2026-10-19T11:54:20Z | p1 | Aki Aggressive ends turn | 360 | {} |
| 972 | 2026-10-19T11:54:29Z | p2 | Chi Conservative skips step | 360 | {} |
| 973 | 2026-10-19T11:54:31Z | p2 | Chi Conservative skips step | 360 | {} |
| 974 | 2026-10-19T11:54:34Z | p2 | IR runs 1 train(s) for ¥130 revenue | 360 | {} |
| 975 | 2026-10-19T11:54:36Z | p2 | IR pays out ¥130 in dividends to shareholders | 295 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 976 | 2026-10-19T11:54:37Z | p2 | Chi Conservative ends turn | 245 | {"p1": 50} |
| 977 | 2026-10-19T11:54:52Z | p1 | Aki Aggressive skips step | 245 | {} |
| 978 | 2026-10-19T11:54:56Z | p1 | Aki Aggressive skips step | 245 | {} |
| 979 | 2026-10-19T11:54:59Z | p1 | UR runs 1 train(s) for ¥90 revenue | 245 | {} |
| 980 | 2026-10-19T11:55:01Z | p1 | UR pays out ¥90 in dividends to shareholders | 200 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 981 | 2026-10-19T11:55:02Z | p1 | Aki Aggressive ends turn | 200 | {} |
| 982 | 2026-10-19T11:55:06Z | p4 | Nori Newcomer skips step | 200 | {} |
| 983 | 2026-10-19T11:55:07Z | p4 | Nori Newcomer skips step | 200 | {} |
| 984 | 2026-10-19T11:55:10Z | p4 | AR runs 1 train(s) for ¥80 revenue | 200 | {} |
| 985 | 2026-10-19T11:55:12Z | p4 | AR pays out ¥80 in dividends to shareholders | 120 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 986 | 2026-10-19T11:55:13Z | p4 | Nori Newcomer ends turn | 120 | {} |
| 987 | 2026-10-19T11:55:15Z | p4 | Nori Newcomer skips step | 120 | {} |
| 988 | 2026-10-19T11:55:17Z | p4 | Nori Newcomer skips step | 120 | {} |
| 989 | 2026-10-19T11:55:20Z | p4 | KO runs 1 train(s) for ¥50 revenue | 120 | {} |
| 990 | 2026-10-19T11:55:22Z | p4 | KO pays out ¥50 in dividends to shareholders | 95 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 991 | 2026-10-19T11:55:23Z | p4 | Nori Newcomer ends turn | 95 | {} |
| 992 | 2026-10-19T11:55:25Z | p1 | Aki Aggressive skips step | 95 | {} |
| 993 | 2026-10-19T11:55:26Z | p1 | Aki Aggressive skips step | 95 | {} |
| 994 | 2026-10-19T11:55:29Z | p1 | SR runs 1 train(s) for ¥60 revenue | 95 | {} |
| 995 | 2026-10-19T11:55:31Z | p1 | SR pays out ¥60 in dividends to shareholders | 65 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 996 | 2026-10-19T11:55:32Z | p1 | Aki Aggressive ends turn | 65 | {} |
| 997 | 2026-10-19T11:55:41Z | p2 | Chi Conservative skips step | 65 | {} |
| 998 | 2026-10-19T11:55:42Z | p2 | Chi Conservative skips step | 65 | {} |
| 999 | 2026-10-19T11:55:45Z | p2 | IR runs 1 train(s) for ¥130 revenue | 65 | {} |
| 1000 | 2026-10-19T11:55:58Z | p2 | IR pays out ¥130 in dividends to shareholders | 0 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 1001 | 2026-10-19T11:56:08Z | p2 | Chi Conservative ends turn | -50 | {"p1": 50} |
| 1002 | 2026-10-19T11:56:15Z | p1 | Aki Aggressive skips step | -50 | {} |
| 1003 | 2026-10-19T11:56:18Z | p1 | Aki Aggressive skips step | -50 | {} |
| 1004 | 2026-10-19T11:56:22Z | p1 | UR runs 1 train(s) for ¥90 revenue | -50 | {} |
| 1005 | 2026-10-19T11:56:23Z | p1 | UR pays out ¥90 in dividends to shareholders | -95 | {"p1": 18, "p2": 9, "p3": 9, "p4": 9} |
| 1006 | 2026-10-19T11:56:24Z | p1 | Aki Aggressive ends turn | -95 | {} |
| 1007 | 2026-10-19T11:56:29Z | p4 | Nori Newcomer skips step | -95 | {} |
| 1008 | 2026-10-19T11:56:30Z | p4 | Nori Newcomer skips step | -95 | {} |
| 1009 | 2026-10-19T11:56:33Z | p4 | AR runs 1 train(s) for ¥80 revenue | -95 | {} |
| 1010 | 2026-10-19T11:56:34Z | p4 | AR pays out ¥80 in dividends to shareholders | -175 | {"p2": 8, "p3": 8, "p4": 48, "AR": 16} |
| 1011 | 2026-10-19T11:56:35Z | p4 | Nori Newcomer ends turn | -175 | {} |
| 1012 | 2026-10-19T11:56:39Z | p4 | Nori Newcomer skips step | -175 | {} |
| 1013 | 2026-10-19T11:56:42Z | p4 | Nori Newcomer skips step | -175 | {} |
| 1014 | 2026-10-19T11:56:45Z | p4 | KO runs 1 train(s) for ¥50 revenue | -175 | {} |
| 1015 | 2026-10-19T11:56:47Z | p4 | KO pays out ¥50 in dividends to shareholders | -200 | {"p1": 5, "p2": 5, "p3": 5, "p4": 10} |
| 1016 | 2026-10-19T11:56:48Z | p4 | Nori Newcomer ends turn | -200 | {} |
| 1017 | 2026-10-19T11:56:50Z | p1 | Aki Aggressive skips step | -200 | {} |
| 1018 | 2026-10-19T11:56:51Z | p1 | Aki Aggressive skips step | -200 | {} |
| 1019 | 2026-10-19T11:56:54Z | p1 | SR runs 1 train(s) for ¥60 revenue | -200 | {} |
| 1020 | 2026-10-19T11:56:56Z | p1 | SR pays out ¥60 in dividends to shareholders | -230 | {"p1": 12, "p2": 6, "p3": 6, "p4": 6} |
| 1021 | 2026-10-19T11:56:57Z | p1 | Aki Aggressive ends turn | -230 | {} |
| 1022 | 2026-10-19T11:57:03Z | p2 | Chi Conservative skips step | -230 | {} |
| 1023 | 2026-10-19T11:57:05Z | p2 | Chi Conservative skips step | -230 | {} |
| 1024 | 2026-10-19T11:57:08Z | p2 | IR runs 1 train(s) for ¥130 revenue | -230 | {} |
| 1025 | 2026-10-19T11:57:10Z | p2 | IR pays out ¥130 in dividends to shareholders | -295 | {"p2": 26, "p3": 13, "p4": 13, "IR": 13} |
| 1026 | 2026-10-19T11:57:11Z | p2 | Chi Conservative ends turn → Finished Round | -295 | {} |
