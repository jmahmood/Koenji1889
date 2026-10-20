# Shikoku district research — 1870–1900

All 52 board hexes have research records and distinct illustrations generated with built-in imagegen from 49 selected real photo references. The compact live Survey links to the published atlas at `/assets/districts/research/index.html`.

25 locations follow named board labels. 27 countryside matches are explicitly inferred regions, not exact geographic hex boundaries. Local events, period industries, biographical links and regional context are distinguished. A record that says no specific event was verified is a research limitation, not a claim that nothing happened.

The engine inventory comes from `daemon18xx/app/engine1889/board_data.py`; named anchors come from `src/constants1889.js`. Nearby anchors and the stylized map geometry guide unnamed matches. Each atlas entry provides a place-name map search, without implying a surveyed boundary.

## Review and reproduction

- `districts-plan.json`: final geographic interpretations, sources, reconstruction constraints and photo roles.
- `generation-log.json`: exact prompts, reference inputs and selected generation outputs.
- `originals/`: full-resolution original paintings, with earlier versions preserved.
- `reference-search/`: candidate metadata and rejected references retained for audit; only selected references are shipped in the app.
- `../../../scripts/build_district_artwork.py`: deterministic publishing/encoding script; uses Pillow, does not generate art.
- `../district-artwork.md`: replacement instructions, licensing and gameplay boundaries.

The atlas includes clickable historical sources and original photo pages, readable creator credits, individual source licenses and reconstruction notes. Scene years are interpretive settings; catalog/upload dates are not silently converted into historical capture dates.

## Coverage

| Hex | General locality | Mapping | Finding type | Historical finding |
|---|---|---|---|---|
| A8 | Ainan–Uwajima coastal hills | Inferred region | regional-context | [1889 — the centenarian lord at Tenshaen](https://www.city.uwajima.ehime.jp/site/sizen-bunka/141tennshaenn.html) |
| A10 | Sukumo and the Matsuda River | Named | local-event | [1872–1899 — post, school and town](https://www.city.sukumo.kochi.jp/sisi/092401.html) |
| B3 | Yawatahama and Kawanoishi | Named | local-event | [1889 — electric light at Uwa Spinning](https://www.city.yawatahama.ehime.jp/intro/sangyou/) |
| B5 | Seiyo — Unomachi basin | Inferred region | local-event | [1882 — Kaimei schoolhouse built](https://www.city.seiyo.ehime.jp/miryoku/uwachonomachinami/kaimei/) |
| B7 | Uwajima castle town | Named | local-event | [1889 — the centenarian lord at Tenshaen](https://www.city.uwajima.ehime.jp/site/sizen-bunka/141tennshaenn.html) |
| B9 | Matsuno and the lower Hiromi valley | Inferred region | regional-context | [1889 — the centenarian lord at Tenshaen](https://www.city.uwajima.ehime.jp/site/sizen-bunka/141tennshaenn.html) |
| B11 | Shimizu and the Ashizuri coast | Named | biographical-context | [1870–1898 — Manjiro’s later life](https://www.city.tosashimizu.kochi.jp/kanko/g01_jyonman03.html) |
| C4 | Ozu on the Hijikawa | Named | local-event | [1888–1895 — a changing river town](https://www.city.ozu.ehime.jp/uploaded/attachment/40704.pdf) |
| C6 | Uchiko and the Oda valley | Inferred region | local-event | [1894 — Kamihaga wax merchant house](https://cms2021.town.uchiko.ehime.jp/site/hozonsenta/kamihaga.html) |
| C8 | Kihoku and the Hiromi basin | Inferred region | local-event | [1889 — Hiromi basin villages organized](https://www.town.kihoku.ehime.jp/uploaded/attachment/10282.pdf) |
| C10 | Nakamura and the Shimanto River | Named | local-event | [1886 — flood in the Nakamura chronology](https://www.city.shimanto.lg.jp/uploaded/attachment/4051.pdf) |
| D3 | Iyo coastal plain west of Matsuyama | Inferred region | regional-context | [1888–1897 — the first Shikoku railways](https://www.kotohirakankou.jp/en/blog/staff/entry-514.html) |
| D5 | Kuma highlands | Inferred region | local-event | [1871 — the Kumayama disturbances](https://www.kumakogen.jp/site/archive/14559.html) |
| D7 | Oda–Niyodo mountain border | Inferred region | regional-context | [1888–1895 — a changing river town](https://www.city.ozu.ehime.jp/uploaded/attachment/40704.pdf) |
| D9 | Middle Shimanto basin around Kubokawa | Inferred region | regional-context | [1886 — flood in the Nakamura chronology](https://www.city.shimanto.lg.jp/uploaded/attachment/4051.pdf) |
| E2 | Matsuyama — Dogo Onsen | Named | local-event | [1894 — Dogo bathhouse rebuilt](https://www.city.matsuyama.ehime.jp/kanko/kankoguide/kankomeisho/dogoonsen/rekishi/rekishi.html) |
| E4 | Ishizuchi western foothills | Inferred region | regional-context | [1888–1899 — copper industry transformed](https://www.city.niihama.lg.jp/soshiki/dozan/dozanjike.html) |
| E6 | Omogo gorge and Ishizuchi interior | Inferred region | regional-context | [1888 — modernization beyond the mountains](https://www.ejrcf.or.jp/jrtr/jrtr39/s43_kis.html) |
| E8 | Ino and the lower Niyodo River | Inferred region | local-event | [1894 — recognition for papermaking innovation](https://www.town.ino.kochi.jp/bunkazai/bunka_town_01/) |
| F1 | Imabari and the Geiyo Islands | Named | local-event | [1894 — towel weaving begins](https://www.city.imabari.ehime.jp/sangyou/jibasan/) |
| F3 | Saijo and the Dōzen Plain | Named | period-development | [Meiji period — regional administrative center](https://www.city.saijo.ehime.jp/uploaded/attachment/7385.pdf) |
| F5 | Besshi mountain approaches | Inferred region | local-event | [1888–1899 — copper industry transformed](https://www.city.niihama.lg.jp/soshiki/dozan/dozanjike.html) |
| F7 | Tosa Reihoku mountain villages | Inferred region | regional-context | [1874–1880s — wider Tosa political change](https://www.city.kochi.kochi.jp/akarui/mangekyo/man1512.htm) |
| F9 | Kochi castle town | Named | local-event | [1874 — Risshisha founded](https://www.city.kochi.kochi.jp/site/kanko/risshisha.html) |
| G4 | Niihama and Besshi copper works | Named | local-event | [1888–1899 — copper industry transformed](https://www.city.niihama.lg.jp/soshiki/dozan/dozanjike.html) |
| G6 | Motoyama and the upper Yoshino basin | Inferred region | local-event | [1900 — a youth book collection begins](https://www.town.motoyama.kochi.jp/material/files/group/2/kouhou10.pdf) |
| G8 | Oboke and the western Iya approaches | Inferred region | regional-context | [Late Meiji — wider Awa context](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| G10 | Susaki inlet | Named | local-event | [1882 — Christian mission begins](https://www.city.susaki.lg.jp/download/?fid=2658&id=180&t=LD) |
| G12 | Nankoku and the Kochi Plain | Named | local-event | [1874–1878 — village elementary schools](https://www.city.nankoku.lg.jp/ominato-e/pg676.html) |
| G14 | Muroto Cape | Named | local-event | [1899 — Muroto lighthouse completed](https://www.city.muroto.kochi.jp/kyoiku/kyoi/pages/pages093.html) |
| H3 | Shikokuchuo–Kan-onji coastal corridor | Inferred region | regional-context | [1888–1897 — the first Shikoku railways](https://www.kotohirakankou.jp/en/blog/staff/entry-514.html) |
| H5 | Upper Yoshino valley west of Ikeda | Inferred region | regional-context | [Late Meiji — wider Awa context](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| H7 | Ikeda on the Yoshino River | Named | period-industry | [Bakumatsu–Meiji — Awa cut tobacco](https://www.miyoshi.i-tokushima.jp/education/docs/2015081000014.html) |
| H9 | Kami — Monobe River headwaters | Inferred region | regional-context | [1874–1880s — wider Tosa political change](https://www.city.kochi.kochi.jp/akarui/mangekyo/man1512.htm) |
| H11 | Aki and the eastern Tosa foothills | Inferred region | local-event | [c.1887 — the Nora-dokei field clock](https://www.city.aki.kochi.jp/life/dtl.php?hdnKey=42) |
| H13 | Kiragawa and the Muroto peninsula hills | Inferred region | period-industry | [Meiji period — Kiragawa charcoal commerce](https://www.city.muroto.kochi.jp/kyoiku/kyoi/pages/pages102.html) |
| I2 | Marugame castle town | Named | local-event | [1874–1877 — castle converted to army use](https://www.city.marugame.lg.jp/site/castle/2930.html) |
| I4 | Kotohira and Mount Zozu | Named | regional-context | [1888–1897 — the first Shikoku railways](https://www.kotohirakankou.jp/en/blog/staff/entry-514.html) |
| I6 | Yoshino River narrows near Awa | Inferred region | regional-context | [Late nineteenth century — the Awa indigo economy](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| I8 | Eastern Iya–Tsurugi foothills | Inferred region | regional-context | [Late Meiji — wider Awa context](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| I10 | Upper Naka River valley | Inferred region | regional-context | [Late Meiji — wider Awa context](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| I12 | Mugi fishing coast | Named | local-event | [1889 — Mugi village formed](https://library.bunmori.tokushima.jp/digital/webkiyou/23/2318.html) |
| J1 | Sakaide and the Bisan Strait | Named | regional-context | [1877 — telegraph reaches Marugame and Takamatsu](https://history.state.gov/historicaldocuments/frus1879/d339) |
| J3 | Central Sanuki plain around Ayagawa | Inferred region | regional-context | [1888–1897 — the first Shikoku railways](https://www.kotohirakankou.jp/en/blog/staff/entry-514.html) |
| J5 | Ritsurin Garden | Named | local-event | [1875 — garden opens to the public](https://www.city.takamatsu.kagawa.jp/smph/kurashi/kosodate/bunka/bunkazai/shiteibunkazai/meisho/ritsurin.html) |
| J7 | Mima–Kamiyama eastern mountain corridor | Inferred region | regional-context | [Late Meiji — wider Awa context](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| J9 | Komatsushima harbor | Named | no-verified-local-event | [Meiji port setting — exact local event unverified](https://www.city.komatsushima.lg.jp/komatsushima-navi/first/adout.html) |
| J11 | Anan — Tomioka and the Naka plain | Named | local-event | [1889 — villages in the Anan area reorganized](https://www.city.anan.tokushima.jp/docs/2018051500019/file_contents/Part1-17.pdf) |
| K4 | Takamatsu — Tamamo waterfront | Named | regional-context | [1888–1897 — the first Shikoku railways](https://www.kotohirakankou.jp/en/blog/staff/entry-514.html) |
| K6 | Yoshino River lower plain crossing | Inferred region | regional-context | [1899 — Tokushima Railway opens](https://www.ejrcf.or.jp/jrtr/jrtr39/s43_kis.html) |
| K8 | Tokushima and the Shinmachi River | Named | regional-context | [Late nineteenth century — the Awa indigo economy](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
| L7 | Naruto Strait and the Osaka sea connection | Named | regional-context | [Late nineteenth century — the Awa indigo economy](https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/rekishi) |
