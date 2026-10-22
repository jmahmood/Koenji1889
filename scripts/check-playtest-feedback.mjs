// Local, disposable games only. Run with the isolated audit server and fixture file.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KOENJI_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.KOENJI_AUDIT_URL || 'http://127.0.0.1:15173';
const output=path.resolve(process.env.KOENJI_AUDIT_OUTPUT || 'validation/playtest-feedback-round2-20261021');
await mkdir(output,{recursive:true});
const fixtures=JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[],errors=[];
const context=()=>browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'});
async function pageFor(scenario,options={}){
 const c=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',...options});
 const p=await c.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/test?scenario='+scenario);await p.locator('.room-context').waitFor();return p;
}
async function state(p){return p.evaluate(async()=>{const s=JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));return fetch('/api/1889/games/'+s.room_code,{headers:{Authorization:'Bearer '+s.token}}).then(r=>r.json());});}
async function revision(p,n){await p.waitForFunction(n=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+n),n);}
const bounds=p=>p.locator('.workspace').boundingBox();
const sameBounds=(a,b)=>{for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<1,`${k}: ${a[k]} → ${b[k]}`);};
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL',name,e.stack);}}
let green;
try{
 await check('Messages and historical inspection preserve workspace bounds; snapshots survive reload without refetching',async()=>{
  const p=await pageFor('j3used');
  const before=await state(p),initial=before.state.revision,target=initial-1;let fetches=0;
  p.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/revisions/'+target))fetches++;});
  const original=await bounds(p);
  assert.match(await p.locator('.optional-step-note').innerText(),/optional/);
  green=await p.locator('.operating-commit-controls .confirm-button').evaluate(b=>getComputedStyle(b).backgroundImage);
  await p.locator('[data-testid="op-btn-skip"]').click();await revision(p,initial+1);
  assert.equal(await p.locator('.decision-confirm').count(),0);sameBounds(original,await bounds(p));
  for(const viewport of [{width:1280,height:640},{width:1440,height:900}]){
   await p.setViewportSize(viewport);const empty=await bounds(p);
   await p.evaluate(async()=>{const {renderActionFeedback}=await import('/src/ui/presentation.js');document.querySelector('.action-feedback-slot').outerHTML=renderActionFeedback({notice:'A long accepted move message. '.repeat(25)});});
   sameBounds(empty,await bounds(p));
  }
  const liveBounds=await bounds(p);
  await p.locator('[data-scrub-range]').evaluate((el,target)=>{el.value=String(target);el.dispatchEvent(new Event('input',{bubbles:true}));},target);await p.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Game read-only'));
  sameBounds(liveBounds,await bounds(p));assert.equal(fetches,1);
  await p.locator('.room-context [data-action="live"]').click();await revision(p,initial+1);
  await p.locator('[data-scrub-range]').evaluate((el,target)=>{el.value=String(target);el.dispatchEvent(new Event('input',{bubbles:true}));},target);await p.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Game read-only'));assert.equal(fetches,1);
  await p.reload();await p.locator('.room-context').waitFor();await p.locator('[data-scrub-range]').evaluate((el,target)=>{el.value=String(target);el.dispatchEvent(new Event('input',{bubbles:true}));},target);await p.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Game read-only'));assert.equal(fetches,1);
  await p.screenshot({path:path.join(output,'stable-history.png')});await p.context().close();
 });
 await check('Dividend uses the shared primary button and pays directly; first company milestone rains once and mascot amounts remain visible',async()=>{
  const p=await pageFor('routes',{reducedMotion:'no-preference'});
  await p.locator('[data-close-modal]').first().click();const before=await state(p);
  await p.locator('.operating-commit-controls [data-run-route-plan]').click();await revision(p,before.state.revision+1);
  const paid=await state(p),button=p.locator('.operating-commit-controls [data-op-action="dividend_payout"]');
  assert.equal(await button.evaluate(b=>getComputedStyle(b).backgroundImage),green);
  const original=await bounds(p);await button.click();await revision(p,paid.state.revision+1);
  assert.equal(await p.locator('.decision-confirm').count(),0);sameBounds(original,await bounds(p));
  await p.locator('.dividend-milestone.is-raining').waitFor();
  assert.match(await p.locator('.dividend-milestone').innerText(),/¥90 paid/);
  await p.screenshot({path:path.join(output,'dividend-rain.png')});
  await p.locator('[data-view="table"]').filter({visible:true}).first().click();
  await p.locator('.clubroom-stage .kemonito-payment-label').waitFor();
  const label=await p.locator('.kemonito-payment-label').evaluate(el=>{const r=el.getBoundingClientRect(),table=el.closest('.clubroom-stage').getBoundingClientRect(),sprite=el.parentElement.querySelector('.kemonito-sprite').getBoundingClientRect();return {text:el.textContent,stroke:getComputedStyle(el).webkitTextStrokeWidth,top:r.top,bottom:r.bottom,tableTop:table.top,tableBottom:table.bottom,overlapsSprite:r.left<sprite.right && r.right>sprite.left && r.top<sprite.bottom && r.bottom>sprite.top};});
  assert.match(label.text,/\+¥\d+/);assert.equal(label.stroke,'1px');assert.ok(label.top>=label.tableTop && label.bottom<=label.tableBottom,JSON.stringify(label));assert.equal(label.overlapsSprite,false);
  await p.screenshot({path:path.join(output,'outlined-payment.png')});await p.context().close();
 });
 await check('Buying the first 3-train announces two operating rounds, preserves current set and uses one reviewed purchase',async()=>{
  const c=await context(),p=await c.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'})));
  const f=fixtures.phase_change;
  await p.goto(base+'/#'+new URLSearchParams({room:f.room,token:f.token,role:'player'}));await p.locator('.room-context').waitFor();
  await p.locator('[data-view="map"]').filter({visible:true}).first().click();
  await p.locator('[data-buy-train="3-0"]').filter({visible:true}).first().click();
  const buy=p.locator('.operating-commit-controls [data-stamp-train]');
  assert.equal(await buy.evaluate(b=>getComputedStyle(b).backgroundImage),green);
  await buy.click();await revision(p,1);assert.equal(await p.locator('.decision-confirm').count(),0);
  const after=await state(p);assert.equal(after.state.phase,'3');assert.equal(after.state.or_total,1);
  const notice=await p.locator('[aria-label="Phase change announcement"]').innerText();
  assert.match(notice,/2 Operating Rounds/);assert.match(notice,/current set still has 1/);
  assert.equal(await p.locator('.offboard-value.is-current').count(),3);
  await p.screenshot({path:path.join(output,'phase-schedule.png')});await c.close();
 });
}finally{await browser.close();}
await writeFile(path.join(output,'feedback-results.json'),JSON.stringify({results,browserErrors:errors},null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/${results.length} feedback checks passed; ${errors.length} browser exceptions`);
if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;
