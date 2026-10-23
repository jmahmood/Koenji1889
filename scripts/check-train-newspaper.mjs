// Read-only preview checks in disposable games. Never stamps a purchase.
import {chromium} from 'playwright';import {readFile,mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const fixtures=JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8'));
const output='validation/train-newspaper-20261022';await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],results=[];
try {
 for(const [name,tier,old]of [['train_rust4','4','2'],['train_late6','6','3'],['train_diesel','D','4']]) {
  const p=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
  await p.addInitScript(()=>localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'})));
  const f=fixtures[name];await p.goto('http://127.0.0.1:15174/?wizard-audit#'+new URLSearchParams({room:f.room,token:f.token,role:'player'}));
  await p.locator('.room-context').waitFor();await p.locator('[data-view="map"]').filter({visible:true}).first().click();await p.locator('[data-open-train-wizard]').click();await p.locator('[data-wizard-next]').click();
  if(tier==='D')await p.locator('[data-stage-trade-in]').filter({hasText:'6-0'}).click();else await p.locator(`[data-testid="depot-buy-${tier}"]`).click();
  for(const locale of ['en','ja']) {
   await p.locator('[data-locale]').selectOption(locale);const paper=p.locator(`.train-newspaper.edition-${locale}`);await paper.waitFor();
   assert.match(await paper.innerText(),new RegExp(locale==='en'?`${old}-TRAIN ERA`:`${{'2':'二','3':'三','4':'四'}[old]}型列車`));
   for(const width of [1366,390,360]) {
    await p.setViewportSize({width,height:width<600?844:900});assert.ok(await paper.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    const next=await p.locator('[data-wizard-next]').boundingBox();assert.ok(next.y+next.height<=(width<600?844:900)+1);
    if(locale==='ja')assert.equal(await paper.locator('h3').evaluate(el=>getComputedStyle(el).writingMode),'vertical-rl');
    await p.screenshot({path:`${output}/rust-${old}-${locale}-${width}.png`});results.push({old,locale,width,preview:true});
   }
  }
  assert.match(await p.locator('.room-context').innerText(),/(?:Rev|局面) 0/);await p.locator('[data-wizard-next]').click();await p.locator('[data-wizard-panel="4"]:visible').waitFor();await p.close();
 }
 assert.deepEqual(errors,[]);await writeFile(output+'/results.json',JSON.stringify({results,errors},null,2));console.log('PASS both newspaper editions, all rust tiers, mobile and unchanged revisions');
}finally{await browser.close();}
