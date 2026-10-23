import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const fixtures=JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8'));
const output='validation/illustrated-trains-20261022';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],results=[];
async function open({width=1440,height=900,locale='en',broken=false}={}) {
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(locale=>{localStorage.setItem('koenji_locale',locale);localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'}));},locale);
 if(broken)await p.route('**/assets/trains/**',r=>r.abort());
 const f=fixtures.train_rust4;
 await p.goto('http://127.0.0.1:15174/?wizard-audit#'+new URLSearchParams({room:f.room,token:f.token,role:'player'}));
 await p.locator('.room-context').waitFor();await p.locator('[data-view="map"]').filter({visible:true}).first().click();
 await p.locator('[data-open-train-wizard]').click();return p;
}
try {
 for(const [width,height]of [[1440,900],[1366,768],[1280,720],[800,600],[390,844],[360,640]]) {
  const p=await open({width,height});
  await p.locator('[data-wizard-next]').click();
  await p.locator('img[data-train-art]').first().evaluate(img=>img.decode());
  const bad=await p.locator('.locomotive-picture').evaluateAll(els=>els.filter(el=>{const img=el.querySelector('img');return img&&!img.hidden&&img.getBoundingClientRect().bottom>el.getBoundingClientRect().bottom+1}).length);
  assert.equal(bad,0,'illustrations must stay inside their boxes');
  const modal=p.locator('.train-purchase-modal');assert.ok(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await p.screenshot({path:output+`/art-selection-${width}.png`});
  for(const step of [1,2,3,4,5]) {
   if(step===3)await p.locator('[data-testid="depot-buy-4"]').click();
   else await p.locator(`[data-wizard-step="${step}"]`).click();
   if(width===1440)await p.screenshot({path:output+`/art-step-${step}.png`});
  }
  const button=p.locator('[data-stamp-train]');const rect=await button.boundingBox();assert.ok(rect.y+rect.height<=height+1,'stamp stays visible');
  results.push({width,height,imagesFit:true,stampVisible:true});await p.close();
 }
 const ja=await open({width:390,height:844,locale:'ja'});assert.match(await ja.locator('.wizard-step-intro').filter({visible:true}).innerText(),/保有列車/);
 await ja.locator('[data-wizard-next]').click();await ja.screenshot({path:output+'/art-selection-ja.png'});await ja.close();
 const broken=await open({broken:true});await broken.locator('[data-wizard-next]').click();await broken.waitForFunction(()=>[...document.querySelectorAll('img[data-train-art]')].every(el=>el.hidden));
 assert.ok(await broken.locator('.historical-train-art:not(.has-illustration) svg').filter({visible:true}).first().isVisible());await broken.close();
 assert.deepEqual(errors,[]);await writeFile(output+'/artwork-results.json',JSON.stringify({results,japanese:true,brokenAssetFallback:true,errors},null,2));console.log('PASS artwork sizing, all five steps, Japanese and missing-image fallback');
}finally{await browser.close();}
