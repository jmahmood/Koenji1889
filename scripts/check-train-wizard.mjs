// Run after write-browser-audit-fixtures.py against a disposable local database.
// KOENJI_AUDIT_FIXTURES points to its private credential file.
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KOENJI_PLAYWRIGHT_MODULE || 'playwright');
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
assert.ok(process.env.KOENJI_AUDIT_FIXTURES, 'Set KOENJI_AUDIT_FIXTURES to the disposable fixture credential file.');
const fixtures=JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8'));
const base=process.env.KOENJI_AUDIT_URL || 'http://127.0.0.1:15174';
const output=path.resolve(process.env.KOENJI_TRAIN_AUDIT_OUTPUT || 'validation/train-wizard-20261022');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.KOENJI_BROWSER_PATH ? {executablePath:process.env.KOENJI_BROWSER_PATH} : {channel:'chrome'})});
const results=[],errors=[];
async function page(name,{mobile=false,seat=0}={}){
 const p=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},reducedMotion:'reduce'});
 p.setDefaultTimeout(10000);
 p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'})));
 const f=fixtures[name];
 await p.goto(base+'/?wizard-audit#'+new URLSearchParams({room:f.room,token:seat?f.tokens[seat-1]:f.token,role:'player'}));
 await p.locator('.room-context').waitFor();
 if(!seat){await p.locator('[data-view="map"]').filter({visible:true}).first().click();await p.locator('[data-open-train-wizard]').click();}
 return p;
}
async function view(p){return p.evaluate(async()=>{
 const s=JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));
 return (await fetch('/api/1889/games/'+s.room_code,{headers:{Authorization:'Bearer '+s.token}})).json();
});}
async function next(p){await p.locator('[data-wizard-next]').click();}
async function assertDispatchVisible(p,{fits=false}={}){
 const geometry=await p.locator('[data-stamp-train]').evaluate(button=>{
  const bounds=button.getBoundingClientRect(),body=document.querySelector('.wizard-page-body');
  const top=document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  return {x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,viewportWidth:innerWidth,viewportHeight:innerHeight,
    inFooter:Boolean(button.closest('.train-wizard-footer')),unobscured:top===button||button.contains(top),
    bodyOverflow:body.scrollHeight-body.clientHeight,duplicateVouchers:document.querySelectorAll('[data-wizard-panel="5"] .dispatch-voucher').length};
 });
 assert.ok(geometry.inFooter,'Dispatch must be outside scrolling content');
 assert.ok(geometry.unobscured,'Dispatch must be fully clickable without scrolling');
 assert.ok(geometry.x>=0&&geometry.y>=0&&geometry.x+geometry.width<=geometry.viewportWidth+1&&geometry.y+geometry.height<=geometry.viewportHeight+1,JSON.stringify(geometry));
 assert.equal(geometry.duplicateVouchers,0);
 if(fits)assert.ok(geometry.bodyOverflow<=1,'Review should fit without scrolling: '+JSON.stringify(geometry));
 return geometry;
}
async function check(name,fn){try{await fn();results.push({name,status:'pass'});console.log('PASS',name);}catch(e){results.push({name,status:'fail',message:e.stack});console.log('FAIL',name,e.message);}}
try {
 await check('Desktop: five steps, close/resume, depot purchase and optional pass',async()=>{
  const p=await page('train_normal');await p.locator('.train-purchase-modal').waitFor();
  const bounds=await p.locator('.train-purchase-modal').boundingBox();assert.ok(bounds.width>1200);assert.ok(bounds.height>900);
  assert.equal(await p.locator('.train-wizard-step:visible').count(),1);
  assert.equal(await p.locator('[data-wizard-pass]').count(),0);
  await p.screenshot({path:path.join(output,'desktop-step1.png')});
  await p.locator('[data-wizard-next]').focus();await p.keyboard.press('Tab');
  assert.equal(await p.locator('[data-close-modal]').filter({visible:true}).evaluate(el=>el===document.activeElement),true);
  const before=await view(p);await next(p);assert.equal(await p.locator('[data-wizard-next]').isDisabled(),true);
  await p.locator('[data-buy-train]:not([disabled])').first().click();
  await p.locator('[data-wizard-panel="3"]:visible').waitFor();assert.equal((await view(p)).state.revision,before.state.revision);
  await next(p);assert.equal(await p.locator('.wizard-money-card').count(),1);
  await p.screenshot({path:path.join(output,'desktop-financing.png')});
  await p.keyboard.press('Escape');await p.locator('.train-purchase-modal').waitFor({state:'detached'});
  await p.locator('[data-view="map"]').filter({visible:true}).first().click();
  await p.locator('[data-open-train-wizard]').click();await p.locator('[data-wizard-panel="4"]:visible').waitFor();
  await next(p);
  const sizes=[[1840,928],[1440,900],[1366,768],[1280,720],[1024,640],[800,600],[390,844],[360,640]];
  const layouts=[];
  for(const [width,height] of sizes){
   await p.setViewportSize({width,height});await p.waitForTimeout(100);
   layouts.push(await assertDispatchVisible(p,{fits:width>=800}));
   if(width===1366||width===360)await p.screenshot({path:path.join(output,`dispatch-${width}x${height}.png`)});
  }
  await writeFile(path.join(output,'dispatch-layouts.json'),JSON.stringify(layouts,null,2));
  await p.setViewportSize({width:1440,height:1000});
  await p.screenshot({path:path.join(output,'desktop-voucher.png')});
  await p.locator('[data-stamp-train]').click();
  await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  const after=await view(p),cid=before.state.current_corporation;
  assert.equal(after.state.corporations[cid].trains.length,1);assert.equal(after.state.corporations[cid].cash,before.state.corporations[cid].cash-80);
  assert.equal(after.state.players[before.viewer.player_id].cash,before.state.players[before.viewer.player_id].cash);
  await p.locator('[data-wizard-panel="1"]:visible').waitFor();assert.match(await p.locator('[data-wizard-pass]').innerText(),/End/);await p.locator('[data-wizard-pass]').click();
  await p.waitForFunction(()=>!document.querySelector('.train-purchase-modal'));await p.close();
 });
 await check('Inter-company seller offer: staged consent and corporate treasury transfer',async()=>{
  const p=await page('train_used');await p.locator('.train-purchase-modal').waitFor();const before=await view(p);
  await next(p);await p.locator('[data-wizard-source="market"]').click();
  await p.locator('[data-stage-used-train]').click();await next(p);
  assert.equal(await p.locator('.wizard-money-card').count(),2);await p.screenshot({path:path.join(output,'transfer-financing.png')});
  await next(p);await p.locator('[data-stamp-train]').click();
  await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  const after=await view(p);assert.equal(after.state.trains['3-0'].owner,'IR');assert.equal(after.state.corporations.AR.cash,before.state.corporations.AR.cash+100);
  assert.equal(after.state.corporations.IR.cash,before.state.corporations.IR.cash-100);assert.equal(after.state.phase,before.state.phase);
  await p.close();
 });
 await check('Emergency: preview unfunded train, sell shares, return to financing',async()=>{
  const p=await page('emergency');await p.locator('.train-purchase-modal').waitFor();const before=await view(p);
  await next(p);await p.locator('[data-buy-train]:not([disabled])').first().click();await next(p);
  await p.locator('[data-wizard-panel="4"]:visible').waitFor();
  await p.screenshot({path:path.join(output,'emergency-financing.png')});
  await next(p);await assertDispatchVisible(p);
  assert.equal(await p.locator('[data-stamp-train]').isDisabled(),true);
  await p.locator('[data-wizard-prev]').click();
  await p.locator('[data-review-action]').filter({visible:true}).first().click();
  await p.locator('[data-confirm-reviewed]').click();
  await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  await p.locator('[data-wizard-panel="4"]:visible').waitFor();const after=await view(p);assert.ok(after.state.players.p1.cash>before.state.players.p1.cash);
  await p.close();
 });
 await check('Common president: exact price and final stamp, with no immediate execution',async()=>{
  const p=await page('train_common');await p.locator('.train-purchase-modal').waitFor();const before=await view(p);
  await next(p);await p.locator('[data-wizard-source="market"]').click();
  assert.equal(await p.getByText('Execute Transfer Now').count(),0);
  const form=p.locator('[data-common-transfer-form="2-0"]');await form.locator('input[name="price"]').fill('37');
  await form.locator('button[type="submit"]').click();await next(p);await next(p);
  assert.ok((await p.locator('.wizard-voucher-summary-grid').innerText()).includes('¥37'));
  assert.equal((await view(p)).state.revision,before.state.revision);
  await p.locator('[data-stamp-train]').click();await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  const after=await view(p);assert.equal(after.state.corporations.IR.cash,before.state.corporations.IR.cash-37);assert.equal(after.state.corporations.AR.cash,before.state.corporations.AR.cash+37);
  assert.equal(after.state.players.p1.cash,before.state.players.p1.cash);await p.close();
 });
 await check('Phase 4: preview every rusted fleet before buying and apply exact result',async()=>{
  const p=await page('train_rust4');await p.locator('.train-purchase-modal').waitFor();const before=await view(p);
  await next(p);await p.locator('[data-testid="depot-buy-4"]').click();
  assert.match(await p.locator('.rust-impact-banner').innerText(),/ALL 2-TRAINS WILL RUST/);
  await p.screenshot({path:path.join(output,'rust-preview.png')});
  assert.equal((await view(p)).state.phase,'3');await next(p);await next(p);await p.locator('[data-stamp-train]').click();
  await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  const after=await view(p);assert.equal(after.state.phase,'4');assert.equal(after.train_limit,3);
  for(const t of Object.values(after.state.trains).filter(t=>t.type==='2'))assert.equal(t.rusted,true);await p.close();
 });
 await check('Diesel trade-in: available at capacity, correct credit, rust and final fleet',async()=>{
  const p=await page('train_diesel');await p.locator('.train-purchase-modal').waitFor();const before=await view(p);
  await next(p);await p.locator('[data-stage-trade-in]').filter({hasText:'6-0'}).click();await next(p);await next(p);
  assert.match(await p.locator('.wizard-voucher-summary-grid').innerText(),/¥800/);
  await p.locator('[data-stamp-train]').click();await p.waitForFunction(rev=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(rev+1)),before.state.revision);
  const after=await view(p);assert.equal(after.state.phase,'D');assert.equal(after.state.trains['6-0'].owner,'depot');assert.equal(after.state.trains['4-0'].rusted,true);
  assert.deepEqual(after.state.corporations.IR.trains,['D-0']);assert.equal(after.state.corporations.IR.cash,1200);await p.close();
 });
 await check('Seller desk: out-of-turn posting, buyer receives and stamps agreed terms',async()=>{
  const p=await page('train_seller',{seat:2});await p.locator('[data-open-desk]').first().click();
  const form=p.locator('[data-seller-offer-form]');await form.locator('input[name="price"]').fill('50');
  await form.locator('button[type="submit"]').click();await p.locator('[data-commit-decision]').click();
  await p.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Live · Rev 1'));
  const v=await view(p);assert.ok(v.state.offers.some(o=>o.price===50&&o.offered_by==='p2'));
  await p.close();const buyer=await page('train_seller');await buyer.locator('.train-purchase-modal').waitFor();await next(buyer);await buyer.locator('[data-wizard-source="market"]').click();
  const offer=buyer.locator('[data-stage-used-train]').filter({hasText:'¥50'});assert.equal(await offer.isEnabled(),true);await offer.click();await next(buyer);await next(buyer);await buyer.locator('[data-stamp-train]').click();
  await buyer.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Live · Rev 2'));assert.equal((await view(buyer)).state.trains['3-0'].owner,'IR');await buyer.close();
 });
 await check('Insolvency: bankruptcy remains accessible in Financing and requires review',async()=>{
  const p=await page('train_bankrupt');await p.locator('.train-purchase-modal').waitFor();await next(p);
  await p.locator('[data-buy-train]:not([disabled])').first().click();await next(p);
  await p.locator('.bankruptcy-gate [data-review-action]').click();
  assert.equal((await view(p)).state.finished,false);
  await p.locator('[data-commit-decision]').click();
  await p.waitForFunction(()=>document.querySelector('.match-results'));assert.equal((await view(p)).state.finished,true);
  await p.close();
 });
 await check('Mobile: page width, usable footer and one active screen',async()=>{
  const p=await page('train_purse',{mobile:true});await p.locator('.train-purchase-modal').waitFor();
  assert.equal(await p.locator('.train-wizard-step:visible').count(),1);
  const b=await p.locator('[data-wizard-next]').boundingBox();assert.ok(b.x>=0&&b.x+b.width<=390);assert.ok(b.y+b.height<=844);
  await next(p);await p.screenshot({path:path.join(output,'mobile-selection.png')});
  await p.locator('[data-buy-train]:not([disabled])').first().click();await next(p);await p.screenshot({path:path.join(output,'mobile-financing.png')});
  const width=await p.locator('.train-purchase-modal').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));assert.equal(width.scroll,width.width);
  await p.close();
 });
} finally {await browser.close();await writeFile(path.join(output,'browser-results.json'),JSON.stringify({results,errors},null,2));}
assert.equal(errors.length,0,JSON.stringify(errors));assert.ok(results.every(r=>r.status==='pass'));
