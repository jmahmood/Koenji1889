// Uses only disposable rooms created by write-browser-audit-fixtures.py.
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const fixtures=JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8'));
const out='validation/illustrated-trains-20261022';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[],errors=[];
async function view(p){return p.evaluate(async()=>{const s=JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));return(await fetch('/api/1889/games/'+s.room_code,{headers:{Authorization:'Bearer '+s.token}})).json();});}
try {
 for(const [tier,name,file] of [['5','train_late5','c11'],['6','train_late6','d51'],['D','train_diesel','df50']]) {
  const p=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
  await p.addInitScript(()=>localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'})));
  const f=fixtures[name];await p.goto('http://127.0.0.1:15174/?wizard-audit#'+new URLSearchParams({room:f.room,token:f.token,role:'player'}));
  await p.locator('.room-context').waitFor();await p.locator('[data-view="map"]').filter({visible:true}).first().click();await p.locator('[data-open-train-wizard]').click();
  const before=await view(p);await p.locator('[data-wizard-next]').click();
  const art=p.locator(`.locomotive-picture img[src*="/${file}-"]`).filter({visible:true}).first();await art.evaluate(img=>img.decode());
  assert.ok(await art.evaluate(img=>img.naturalWidth>0));await p.screenshot({path:out+`/late-${tier}-selection.png`});
  await p.setViewportSize({width:390,height:844});await art.scrollIntoViewIfNeeded();assert.ok(await p.locator('.train-purchase-modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await p.screenshot({path:out+`/late-${tier}-mobile.png`});await p.setViewportSize({width:1366,height:768});
  if(tier==='D') await p.locator('[data-stage-trade-in]').filter({hasText:'6-0'}).click();else await p.locator(`[data-testid="depot-buy-${tier}"]`).click();
  await p.locator('[data-wizard-next]').click();await p.locator('[data-wizard-next]').click();
  const stamp=p.locator('[data-stamp-train]');const action=JSON.parse(await stamp.getAttribute('data-stamp-train'));
  assert.equal((await view(p)).state.revision,before.state.revision,'art selection never buys automatically');
  const expected=before.state.trains[action.train].price-(action.trade_in?300:0);
  assert.ok(await stamp.isEnabled());const rect=await stamp.boundingBox();assert.ok(rect.y+rect.height<=768+1);await stamp.click();
  await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Rev '+(rev+1)),before.state.revision);
  const after=await view(p);assert.equal(after.state.trains[action.train].owner,'IR');assert.equal(after.state.phase,tier);
  assert.equal(after.state.corporations.IR.cash,before.state.corporations.IR.cash-expected);
  if(tier==='5')assert.equal(after.train_limit,2);
  if(tier==='6')for(const t of Object.values(after.state.trains).filter(t=>t.type==='3'))assert.equal(t.rusted,true);
  if(tier==='D') {assert.equal(after.state.trains['6-0'].owner,'depot');assert.equal(after.state.trains['4-0'].rusted,true);assert.match(await p.locator('[data-wizard-panel="1"]').innerText(),/Unlimited/);}
  results.push({tier,artLoaded:true,purchase:true,price:expected,mobileFits:true});await p.close();console.log('PASS illustrated tier',tier);
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/late-tier-results.json',JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
