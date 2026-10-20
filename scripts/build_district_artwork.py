"""Publish locally generated district art, provenance and the research gallery.
Run with a Python that has Pillow. Does not generate or creatively edit artwork;
it encodes display copies, retaining the full-resolution PNG originals.
"""
import argparse, html, json, pathlib, re, urllib.parse
from PIL import Image

ROOT=pathlib.Path(__file__).resolve().parents[1]
RESEARCH=ROOT/'docs/koenji/district-research'
PUBLIC=ROOT/'public/assets/districts'
parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');args=parser.parse_args()
plan=json.loads((RESEARCH/'districts-plan.json').read_text())
inventory=json.loads((RESEARCH/'board-inventory.json').read_text())
log=json.loads((RESEARCH/'generation-log.json').read_text())
assert set(plan)==set(inventory), 'Research must cover every board hex'
if not args.partial:assert set(log)==set(inventory), 'Generate all 52 portraits before publishing'

def clean(s):return ' '.join(html.unescape(re.sub('<[^>]*>',' ',s or '')).split())
def esc(s):return html.escape(str(s),quote=True)
def key(c):return c[0],int(c[1:])
def link(url,label):return f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">{esc(label)}</a>'
def pos(c):return ord(c[0])-65,int(c[1:])
named=[c for c,d in plan.items() if d['mappingStatus']=='named-board-location']
manifest={}; research={}; cards=[]
for c in sorted(plan,key=key):
 d=plan[c];refs=[]
 for refcoord in d['referenceCoords']:
  raw=json.loads((PUBLIC/'references'/f'{refcoord}-reference.json').read_text());m=raw['extmetadata']
  val=lambda k:clean(m.get(k,{}).get('value',''))
  refs.append({'title':raw['title'],'file':raw['localFile'],'sourceUrl':raw['descriptionurl'],'creator':val('Artist'),'credit':val('Credit'),'dateAsCatalogued':val('DateTimeOriginal'),'license':val('LicenseShortName'),'licenseUrl':val('LicenseUrl'),'referenceCoord':refcoord})
 x,y=pos(c)
 anchors=sorted(named,key=lambda k:(pos(k)[0]-x)**2*.75+(pos(k)[1]-y)**2*.25)[:3]
 mapping=d['mappingBasis']
 if d['mappingStatus']=='inferred-region':mapping+=' Nearby board anchors: '+', '.join(k+' '+plan[k]['locality'].split(' — ')[0] for k in anchors)+'.'
 details={**d,'mappingBasis':mapping,'references':refs,'method':'Built-in imagegen, one distinct generation per board hex; real photographs supplied as local reference images.','artworkStatus':'ready' if c in log else 'pending'}
 details['prompt']=log.get(c,{}).get('prompt','Pending generation')
 if c in log:
  version=d.get('artVersion',1)
  original=RESEARCH/'originals'/f'{c.lower()}-meiji-v{version}.png';assert original.exists(),original
  image=Image.open(original).convert('RGB');image.thumbnail((1024,512),Image.Resampling.LANCZOS)
  target=PUBLIC/f'{c.lower()}-meiji-v{version}.webp'
  if not target.exists() or target.stat().st_mtime<original.stat().st_mtime:image.save(target,'WEBP',quality=88,method=6)
  share=any('BY-SA' in v['license'] for v in refs)
  terms='CC BY-SA 4.0 for this reference-derived illustration; retain the listed photo attribution and indicate AI reconstruction.' if share else 'Generated historical interpretation; retain the listed photograph attribution and its original license when redistributing source photography.'
  credit='; '.join(f"{r['creator']} — {r['title'].removeprefix('File:')} ({r['license']})" for r in refs)
  art={'file':'/assets/districts/'+target.name,'mimeType':'image/webp','width':image.width,'height':image.height,'focalPoint':{'x':.5,'y':.45},'title':d['locality']+f" — interpretive scene c.{d['sceneYear']}",'alt':f"Painted historical interpretation of {d['locality']}, circa {d['sceneYear']}: {d['scene']}.",'kind':'generated-historical','creator':'Built-in imagegen; photographic references credited in History','date':None,'sceneYear':d['sceneYear'],'sourceUrl':refs[0]['sourceUrl'],'locality':d['locality'],'shortName':d.get('shortName'),'mappingStatus':d['mappingStatus'],'researchUrl':'/assets/districts/research/index.html#'+c,'reuseTerms':terms,'credit':credit}
  manifest[c]=art;details['artwork']=art
  visual=f'<img class="painting" src="{art["file"]}" width="1024" height="512" loading="lazy" alt="{esc(art["alt"])}">'
 else:visual='<p class="pending">Illustration generating…</p>'
 research[c]=details
 references=''.join(f'<figure><a href="{esc(v["sourceUrl"])}" target="_blank" rel="noopener noreferrer"><img src="{esc(v["file"])}" loading="lazy" alt="Real photo reference: {esc(v["title"])}"></a><figcaption>{link(v["sourceUrl"],v["title"])}<br>{esc(v["creator"])} · {esc(v["license"])}<br><small>Catalogued date: {esc(v["dateAsCatalogued"] or "not established")}. Upload dates are not treated as historical scene dates.</small><br><small>{esc(v["credit"])}</small>{" · "+link(v["licenseUrl"],"Photo license") if v["licenseUrl"].startswith("https://") else ""}</figcaption></figure>' for v in refs)
 maplink=link('https://www.openstreetmap.org/search?query='+urllib.parse.quote(d['mapSearch']),'Find the general locality on a map')
 h=d['history'];sources=link(h['url'],'Historical source')+''.join(' · '+link(s['url'],s['title']) for s in h.get('additionalSources',[]))
 status='Named board location' if c in named else 'Approximate regional match'
 cards.append(f'''<article id="{c}" data-search="{esc((c+' '+d['locality']).lower())}"><header><b>{c}</b><div><h2>{esc(d['locality'])}</h2><span>{status} · scene c.{d['sceneYear']}</span></div></header>{visual}<div class="notes"><p class="mapping">{esc(mapping)}<br>{maplink}</p><h3>{esc(h['title'])}</h3><span class="badge">{esc(h['scope'].replace('-',' '))}</span><p>{esc(h['summary'])}</p><p>{sources}</p><details><summary>Real photo references, credits and reconstruction notes</summary><p>{esc(d['referenceUse'])}</p><div class="references">{references}</div><p>{esc(manifest.get(c,{}).get('reuseTerms',''))}</p></details><details><summary>Generation prompt</summary><p class="prompt">{esc(details['prompt'])}</p></details></div></article>''')

(PUBLIC/'research').mkdir(exist_ok=True)
(ROOT/'src/data/districtArtwork.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
(PUBLIC/'research/districts.json').write_text(json.dumps(research,indent=2,ensure_ascii=False)+'\n')
nav=''.join(f'<a href="#{c}">{c}</a>' for c in sorted(plan,key=key))
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shikoku District Atlas · 1870–1900</title><style>
*{box-sizing:border-box}body{margin:0;background:#1c241f;color:#eaddb9;font:16px/1.55 Georgia,serif}main{max-width:1130px;margin:auto;padding:40px 22px}h1{font-size:40px;line-height:1.1;margin:12px 0}h2{font-size:25px;margin:0;line-height:1.2}h3{font-size:21px;margin:16px 0 6px}a{color:#ecd18c}p{max-width:84ch}.intro{border-bottom:2px solid #8c784e;padding-bottom:24px}.eyebrow{letter-spacing:.2em;color:#d5b96d;font:12px monospace}nav{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0}nav a{padding:5px 8px;border:1px solid #7d714c;text-decoration:none;background:#2b352c}input{padding:12px;width:min(100%,430px);font:inherit;background:#eee2c6;color:#233128;border:2px solid #b59757;margin:16px 0}article{background:#eee1c2;color:#293027;margin:28px 0;border:2px solid #b6985a;scroll-margin-top:20px}article>header{display:flex;gap:18px;padding:18px;background:#233b3c;color:#f3e1b3;align-items:center}article>header>b{font:700 23px monospace;border:1px solid #bda76f;padding:8px}header span{font:13px Georgia;color:#d0bc87}.painting{width:100%;height:auto;display:block;max-height:520px;object-fit:cover}.notes{padding:18px 24px}.notes a{color:#3c5c58}.mapping{border-left:3px solid #947638;padding-left:12px;font-size:14px}.badge{font:11px monospace;text-transform:uppercase;letter-spacing:.07em;background:#d6c89d;padding:4px 8px}.references{display:flex;gap:20px;flex-wrap:wrap}.references figure{margin:10px 0;flex:1 1 260px}.references img{width:100%;height:210px;object-fit:contain;background:#26372f}.references figcaption{font-size:13px;overflow-wrap:anywhere}details{border-top:1px solid #c0ad80;padding:12px 0}summary{cursor:pointer;font-weight:bold}.prompt{font:12px/1.6 monospace;white-space:pre-wrap}article:target{outline:4px solid #d5bd6a}.pending{padding:40px}.tally{color:#d6bd80}small{font-size:12px}footer{font-size:13px;border-top:1px solid #7d714c;padding-top:18px}@media(max-width:600px){main{padding:24px 12px}h1{font-size:30px}.notes{padding:12px}h2{font-size:21px}}
</style><main><section class="intro"><span class="eyebrow">KOENJI 1889 · DISTRICT SURVEY FIELD NOTES</span><h1>Shikoku, in the age of steam</h1><p>Geographic interpretations and historical research for all 52 board hexes, covering 1870–1900. Each portrait is a newly generated historical illustration based on real photographic references. The paintings are interpretive scenes, not archival photographs or exact architectural reconstructions.</p><p class="tally">25 named board locations · 27 approximate countryside regions · READY_COUNT / 52 portraits complete</p><p>The game map compresses and rearranges geography. Unnamed hexes have no authoritative real-world boundaries: their regional matches are explicitly inferred from named neighbors and terrain. A ferry hex identifies a sea connection, not a verified historical sailing route. Historical scenery does not confer game effects.</p><p>Dated local events are distinguished from period industries, biographies and wider regional context. Where no event at the particular inferred locality was verified, that limitation is stated. Most references are modern photographs used for landforms or surviving structures; modern infrastructure is removed in the artwork. A scene date is an artistic setting, not the photograph’s capture date.</p><label for="search">Find a hex or place</label><br><input id="search" type="search" placeholder="I2, Marugame, Yoshino…"><nav aria-label="Board hex index">NAVIGATION</nav></section>CARDS<footer>Method: built-in imagegen, one distinct generation per hex. Full-resolution PNG originals and exact prompts are preserved in docs/koenji/district-research; display copies are encoded locally as WebP. Photographs retain their listed licenses; reference-derived ShareAlike illustrations are offered under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Original photo creators are credited above. Replacing an image: update the research brief, source metadata, prompt and original, then run scripts/build_district_artwork.py. <a href="districts.json">Complete research data and prompts</a>.</footer></main><script>const search=document.querySelector('#search');search.addEventListener('input',()=>{let q=search.value.toLowerCase().trim();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.search.includes(q))});function focusHash(){const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(target){search.value='';document.querySelectorAll('article').forEach(a=>a.hidden=false);target.scrollIntoView()}}addEventListener('hashchange',focusHash);addEventListener('load',focusHash);</script></html>'''.replace('READY_COUNT',str(len(manifest))).replace('NAVIGATION',nav).replace('CARDS',''.join(cards))
(PUBLIC/'research/index.html').write_text(page)
print(f'Published {len(manifest)}/52 portraits and research for all {len(research)} hexes.')
