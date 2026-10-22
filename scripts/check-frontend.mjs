// Run against an isolated Vite development server. Requires Playwright + Chrome.
// KOENJI_AUDIT_URL, KOENJI_PLAYWRIGHT_MODULE, KOENJI_BROWSER_PATH and
// KOENJI_AUDIT_OUTPUT can override the local defaults.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KOENJI_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.KOENJI_AUDIT_URL || 'http://localhost:15173';
const output=path.resolve(process.env.KOENJI_AUDIT_OUTPUT || 'validation/frontend-audit');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.KOENJI_BROWSER_PATH ? {executablePath:process.env.KOENJI_BROWSER_PATH} : {channel:'chrome'})});
const results=[],errors=[],networkErrors=[];
let current='initialization';
async function blank(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',...options});
  const p=await context.newPage();p.setDefaultTimeout(8000);
  p.on('pageerror',error=>errors.push({step:current,message:error.stack}));
  p.on('response',response=>{if(response.status()>=400)networkErrors.push({step:current,status:response.status(),path:new URL(response.url()).pathname});});
  return p;
}
async function page(scenario,options={}){
  const p=await blank(options);
  await p.goto(`${base}${scenario ? '/test?scenario='+scenario : '/'}`);
  if(scenario)await p.locator('.room-context').waitFor();
  return p;
}
async function check(name,run){
  current=name;const before=errors.length;
  try{await run();assert.equal(errors.length,before,JSON.stringify(errors.slice(before)));results.push({name,status:'pass'});console.log('PASS',name);}
  catch(error){
    results.push({name,status:'fail',message:error.stack});console.log('FAIL',name,error.message);
    const p=browser.contexts().flatMap(c=>c.pages()).at(-1);
    if(p)await p.screenshot({path:path.join(output,`failure-${results.length}.png`),fullPage:true}).catch(()=>{});
  }
}
async function view(p){return p.evaluate(async()=>{
  const s=JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));
  const r=await fetch('/api/1889/games/'+s.room_code,{headers:{Authorization:'Bearer '+s.token}});
  if(!r.ok)throw new Error('View HTTP '+r.status);return r.json();
});}
async function revision(p,old){
  await p.waitForFunction(old=>document.querySelector('.room-context')?.innerText.includes('Live · Rev '+(old+1)),old);
  return view(p);
}
async function confirm(p,optional=false){
  if(optional && !await p.locator('[data-commit-decision]').count())return;
  const button=p.locator('[data-commit-decision]');await button.waitFor();
  assert.equal(await button.isDisabled(),false,await p.locator('.decision-confirm').innerText());
  await button.click();
}
async function close(p){const b=p.locator('[data-close-modal]').filter({visible:true}).first();if(await b.count())await b.click();}
async function market(p){await close(p);await p.locator('[data-view="market"]').filter({visible:true}).first().click();}
async function map(p){await close(p);await p.locator('[data-view="map"]').filter({visible:true}).first().click();}
async function shot(p,name){await p.screenshot({path:path.join(output,name+'.png'),fullPage:true});}
let host,guest,auction,stock,operating,routes;
const fixtures=process.env.KOENJI_AUDIT_FIXTURES ? JSON.parse(await readFile(process.env.KOENJI_AUDIT_FIXTURES,'utf8')) : {};
async function fixture(name,seat){
  const f=fixtures[name];assert.ok(f,'Missing fixture '+name);
  const p=await blank();
  await p.addInitScript(()=>localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify({face:'reference-05',clothes:'charcoal-suit'})));
  await p.goto(base+'/?audit=fixture#'+new URLSearchParams({room:f.room,token:seat ? f.tokens[Number(seat.slice(1))-1] : f.token,role:'player'}));
  await p.locator('.room-context').waitFor();return p;
}
async function desk(p){if(!await p.locator('.decision-desk').count())await p.locator('[data-open-desk]').first().click();}
function review(p,type){return p.locator(`[data-review-action*='"type":"${type}"']`).filter({visible:true}).first();}
async function finishLook(p){
  await p.locator('[data-save-look], .waiting-club').first().waitFor();
  if(await p.locator('[data-save-look]').count())await p.locator('[data-save-look] button[type="submit"]').click();
}
try{
 await check('01 Appearance selection and ordinary gathering creation',async()=>{
  host=await page();await host.locator('[data-pick-face="reference-05"]').click();
  await host.locator('[data-save-look] button[type="submit"]').click();
  await host.locator('[data-player-count="2"]').click();
  await host.locator('[name=player_0]').fill('Audit Host');await host.locator('[name=player_1]').fill('Audit Guest');
  await host.locator('[data-create-gathering] button[type="submit"]').click();
  await host.locator('.waiting-club').waitFor();await shot(host,'01-lobby');
 });
 await check('02 Private invitation, separate browser, guest claims seat',async()=>{
  const href=await host.locator('[data-copy-invite]').first().getAttribute('data-copy-invite');
  guest=await blank();await guest.goto(href);
  await finishLook(guest);
  await guest.locator('[data-name-seat] button[type="submit"]').click();
  await host.locator('[data-start-gathering]:not([disabled])').waitFor();
  assert.equal(await guest.locator('[data-start-gathering]').count(),0);
 });
 await check('03 Host starts game; both players enter; reload keeps host seat',async()=>{
  await host.locator('[data-start-gathering]').click();await host.locator('.room-context').waitFor();await guest.locator('.room-context').waitFor();
  await host.reload();await host.locator('.room-context').waitFor();assert.equal((await view(host)).viewer.player_id,'p1');
 });
 await check('04 Auction Buy Now cancel, confirm, payment and turn advance',async()=>{
  auction=await page('auction');await market(auction);const before=await view(auction);
  await auction.locator('[data-auction-action="buy_offered"]').click();await auction.locator('[data-cancel-decision]').click();
  assert.equal((await view(auction)).state.revision,before.state.revision);
  await auction.locator('[data-auction-action="buy_offered"]').click();await confirm(auction);
  const after=await revision(auction,before.state.revision);
  assert.equal(after.state.privates.TR.owner,before.viewer.player_id);
  assert.equal(after.state.players[before.viewer.player_id].cash,before.state.players[before.viewer.player_id].cash-20);
  await shot(auction,'04-auction');
 });
 await check('05 Auction bid on a later company and auction pass',async()=>{
  await auction.locator('[data-test-turn]').click();const before=await view(auction);
  await auction.locator('[data-select-private="ER"]').first().click();
  await auction.locator('[data-auction-action="bid"]').click();await revision(auction,before.state.revision);
  await auction.locator('[data-test-turn]').click();const bid=await view(auction);
  await auction.locator('[data-auction-action="pass"]').click();await confirm(auction,true);await revision(auction,bid.state.revision);await auction.close();
 });
 await check('06 Stock round passes without buying',async()=>{
  stock=await page('stock');await market(stock);const before=await view(stock);
  await stock.locator('[data-action="end_stock_turn"]').first().click();await confirm(stock,true);
  const after=await revision(stock,before.state.revision);assert.notEqual(after.state.current_player,before.state.current_player);await stock.close();
 });
 await check('07 Stock certificate purchase and end turn',async()=>{
  stock=await page('stock');await market(stock);const before=await view(stock);
  await stock.locator('[data-action="buy_shares"]').click();await confirm(stock);const bought=await revision(stock,before.state.revision);
  assert.ok(bought.state.players[before.viewer.player_id].cash<before.state.players[before.viewer.player_id].cash);
  await stock.locator('[data-action="end_stock_turn"]').first().click();await confirm(stock,true);await revision(stock,bought.state.revision);
  await shot(stock,'07-stock');
 });
 await check('08 Historical inspection, replay and Return to Live',async()=>{
  await stock.locator('[data-revision="0"]').first().click();
  await stock.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('History · Rev 0'));
  for(const button of await stock.locator('[data-action="buy_shares"]').all())assert.equal(await button.isDisabled(),true);
  await stock.locator('[data-action="toggle_play"]').click();
  await stock.waitForFunction(()=>document.querySelector('[data-action="toggle_play"]')?.getAttribute('aria-label')==='Pause replay');
  await stock.locator('[data-action="toggle_play"]').click();await stock.locator('[data-action="live"]').filter({visible:true}).first().click();
  await stock.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Live · Rev'));await stock.close();
 });
 await check('09 Operating map legal tile preview and construction',async()=>{
  operating=await page('operating');await map(operating);const before=await view(operating);
  const [hex,placements]=Object.entries(before.legal_tile_lays).find(([,ps])=>ps.length);
  await operating.locator(`[data-select-hex="${hex}"]`).first().click();
  const place=placements[0];await operating.locator(`[data-select-legal-placement="${hex}:${place.tile}:${place.rotation}"]`).click();
  await operating.locator('[data-op-action="lay_tile"]').filter({visible:true}).first().click();
  const after=await revision(operating,before.state.revision);assert.equal(after.state.board[hex].tile,place.tile);
  await shot(operating,'09-operating');
 });
 await check('10 Operating skip/no-train revenue, purchase and finish turn',async()=>{
  const before=await view(operating);
  const skip=operating.locator('[data-op-action="run_best_routes"]').filter({visible:true}).first();
  if(!await skip.count())await operating.locator('summary').filter({hasText:'Route resolution shortcut'}).click();
  await operating.locator('[data-op-action="run_best_routes"]').first().click();
  await confirm(operating,true);const trains=await revision(operating,before.state.revision);
  assert.equal(trains.state.operating_turn.step,'train');
  await operating.locator('[data-buy-train]:not([disabled])').filter({visible:true}).first().click();
  const stamp=operating.locator('[data-stamp-train]').filter({visible:true});
  if(await stamp.count())await stamp.click();else await operating.locator('[data-confirm-reviewed]').click();
  await confirm(operating,true);const bought=await revision(operating,trains.state.revision);
  assert.ok(bought.state.corporations[bought.state.current_corporation].trains.length);
  await operating.locator('[data-op-action="end_turn"]').filter({visible:true}).first().click();await confirm(operating,true);await revision(operating,bought.state.revision);await operating.close();
 });
 for(const scenario of ['routes','routes3','routes4']){
  await check(`11 ${scenario}: edit stops, undo, cancel and restore plan`,async()=>{
   routes=await page(scenario);const before=await view(routes);
   await routes.locator('.route-focus-desk [data-edit-route]').first().click();
   await routes.locator('.route-focus-desk .route-stop-options [data-route-stop]').first().click();
   await routes.locator('.route-focus-desk [data-route-undo-stop]').click();
   await routes.locator('.route-focus-desk [data-route-cancel]').click();
   await routes.locator('.route-focus-desk [data-route-idle]').first().click();
   await routes.locator('.route-focus-desk [data-copy-route-plan]').click();
   assert.equal((await view(routes)).state.revision,before.state.revision);
  });
  await check(`12 ${scenario}: commit routes and pay dividend`,async()=>{
   const before=await view(routes);await routes.locator('.route-focus-desk [data-run-route-plan]').click();
   const ran=await revision(routes,before.state.revision);assert.equal(ran.state.operating_turn.step,'dividend');
   await routes.locator('[data-op-action="dividend_payout"]').filter({visible:true}).click();await confirm(routes,true);
   const paid=await revision(routes,ran.state.revision);assert.equal(paid.state.operating_turn.step,'train');
   await shot(routes,'12-'+scenario);await routes.close();
  });
 }
 await check('13 Language switch, preferences, and return to English',async()=>{
  await host.locator('[data-locale]').selectOption('ja');assert.equal(await host.locator('html').getAttribute('lang'),'ja');
  await shot(host,'13-japanese');await host.locator('[data-preferences]').click();
  await host.locator('[data-pref-motion]').click();await host.locator('.preferences-dialog button[aria-label]').first().click();
  await host.locator('[data-locale]').selectOption('en');assert.equal(await host.locator('html').getAttribute('lang'),'en');
 });
 await check('14 Narrow viewport still exposes setup and game actions',async()=>{
  await host.setViewportSize({width:390,height:844});await host.locator('[data-open-gathering]').click();
  const bounds=await host.locator('.booking-window').boundingBox();assert.ok(bounds.x>=0 && bounds.width<=390);
  await shot(host,'14-narrow');await host.close();await guest.close();
 });
 if(Object.keys(fixtures).length){
  await check('15 Excess-train discards commit and unblock operation',async()=>{
   const p=await fixture('discard');await desk(p);
   for(let i=0;i<2;i++){
    const before=await view(p);await review(p,'discard_train').click();await confirm(p);await revision(p,before.state.revision);
    if(i===0)await desk(p);
   }
   assert.equal((await view(p)).state.pending_discards.length,0);await p.close();
  });
  await check('16 ER optional lay can be declined by its seller',async()=>{
   const p=await fixture('er_train');await desk(p);const before=await view(p);
   await review(p,'pass').click();await confirm(p,true);const after=await revision(p,before.state.revision);
   assert.equal(after.state.pending_special,null);assert.equal(after.state.operating_turn.step,'train');await p.close();
  });
  await check('17 Emergency share sale funds a mandatory train purchase',async()=>{
   const p=await fixture('emergency');await desk(p);const before=await view(p);
   await review(p,'emergency_sell').click();await confirm(p);const sold=await revision(p,before.state.revision);
   assert.ok(sold.state.players.p1.cash>before.state.players.p1.cash);await desk(p);
   await review(p,'buy_train').click();await confirm(p);
   const bought=await revision(p,sold.state.revision);assert.ok(bought.state.corporations.IR.trains.length);await shot(p,'17-emergency');await p.close();
  });
  await check('18 Bankruptcy confirmation reaches final results',async()=>{
   const p=await fixture('bankruptcy');await desk(p);const before=await view(p);
   await review(p,'bankrupt').click();await confirm(p);const after=await revision(p,before.state.revision);
   assert.equal(after.state.finished,true);await p.locator('.match-results').waitFor();await shot(p,'18-results');await p.close();
  });
  await check('19 Out-of-turn DR exchange uses the owning seat',async()=>{
   const p=await fixture('dr');const before=await view(p);await review(p,'exchange_private').click();await confirm(p);
   const after=await revision(p,before.state.revision);assert.equal(after.state.privates.DR.closed,true);await p.close();
  });
  await check('20 Used-train offer is accepted and paid from the company',async()=>{
   const p=await fixture('train_used');await desk(p);const before=await view(p);
   await p.locator(`.decision-desk [data-review-action*='"train":"3-0"']`).filter({visible:true}).first().click();await confirm(p);const after=await revision(p,before.state.revision);
   assert.equal(after.state.trains['3-0'].owner,'IR');assert.equal(after.state.corporations.IR.cash,before.state.corporations.IR.cash-100);await p.close();
  });
  await check('21 Private negotiation consent and buyer purchase',async()=>{
   const seller=await fixture('negotiation');await desk(seller);
   const form=seller.locator('[data-negotiation*="ER"]').first();
   await form.locator('[name=price]').fill('40');const before=await view(seller);
   await form.locator('[value=offer]').click();await confirm(seller);await revision(seller,before.state.revision);
   const buyer=await fixture('negotiation','p1');const offered=await view(buyer);
   await review(buyer,'buy_private').click();await confirm(buyer);const bought=await revision(buyer,offered.state.revision);
   assert.equal(bought.state.privates.ER.owner,'IR');assert.equal(bought.state.corporations.IR.cash,offered.state.corporations.IR.cash-40);
   await seller.close();await buyer.close();
  });
  await check('22 Stock sale, presidency transfer and proceeds',async()=>{
   const p=await fixture('presidency_sale');await market(p);const before=await view(p);
   await p.locator('[data-company="AR"]').first().click();await p.locator('[data-action="sell_shares"]').click();await confirm(p);
   const after=await revision(p,before.state.revision);assert.equal(after.state.corporations.AR.president,'p2');
   assert.ok(after.state.players.p1.cash>before.state.players.p1.cash);await p.close();
  });
  await check('23 Observer sees results and cannot act',async()=>{
   const p=await fixture('discard_observer');await desk(p);
   assert.equal(await p.locator('.decision-desk [data-review-action]').count(),0);await p.close();
   const finished=await fixture('finished');await finished.locator('.match-results').waitFor();await finished.close();
  });
 }
 await check('24 Withhold route revenue with normal motion enabled',async()=>{
  const p=await page('routes',{reducedMotion:'no-preference'});const before=await view(p);
  await p.locator('.route-focus-desk [data-run-route-plan]').click();const ran=await revision(p,before.state.revision);
  const cid=ran.state.current_corporation;
  await p.locator('[data-op-action="dividend_withhold"]').filter({visible:true}).click();await confirm(p,true);
  const paid=await revision(p,ran.state.revision);
  assert.equal(paid.state.corporations[cid].cash,ran.state.corporations[cid].cash+ran.state.operating_turn.revenue);
  assert.equal(paid.state.players.p1.cash,ran.state.players.p1.cash);await shot(p,'24-withhold');await p.close();
 });
 await check('25 Non-playing host retains creator identity and starts the table',async()=>{
  const p=await page();await p.locator('[data-save-look] button[type="submit"]').click();
  await p.locator('[data-player-count="2"]').click();await p.locator('[name=playing]').uncheck();
  await p.locator('[data-gathering-tab="advanced"]').click();await p.locator('[name=host_name]').fill('Observer Host');
  await p.locator('[data-gathering-tab="host"]').first().click();await p.locator('[name=player_0]').fill('Player A');await p.locator('[name=player_1]').fill('Player B');
  await p.locator('[data-create-gathering] button[type="submit"]').click();await p.locator('.waiting-club').waitFor();
  assert.equal((await view(p)).viewer.role,'creator');
  const links=await p.locator('[data-copy-invite]').evaluateAll(bs=>bs.map(b=>b.dataset.copyInvite));const guests=[];
  for(const link of links){const g=await blank();await g.goto(link);await finishLook(g);await g.locator('[data-name-seat] button[type="submit"]').click();guests.push(g);}
  await p.locator('[data-start-gathering]:not([disabled])').click();await p.locator('.room-context').waitFor();assert.equal((await view(p)).viewer.player_id,null);
  for(const g of guests)await g.close();await p.close();
 });
 await check('26 Current operating actions remain clickable on a short laptop screen',async()=>{
  const p=await page('operating');await map(p);
  async function reachable(){
   for(const height of [900,768,720,640]){
    await p.setViewportSize({width:1280,height});
    await p.waitForTimeout(100);
    const actions=await p.locator('.operating-commit-controls button').evaluateAll(bs=>bs.filter(b=>!b.disabled).map(b=>{
     const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return {label:b.textContent,visible:r.top>=0&&r.bottom<=innerHeight,clickable:hit===b||b.contains(hit)};
    }));
    assert.ok(actions.length,'No enabled current action');
    for(const action of actions){assert.ok(action.visible,action.label+' clipped');assert.ok(action.clickable,action.label+' covered');}
   }
  }
  const before=await view(p);const [hex,ps]=Object.entries(before.legal_tile_lays).find(([,ps])=>ps.length);
  await p.locator(`[data-select-hex="${hex}"]`).first().click();
  await p.locator(`[data-select-legal-placement="${hex}:${ps[0].tile}:${ps[0].rotation}"]`).click();await reachable();await p.close();
  const routePage=await page('routes');await close(routePage);await routePage.setViewportSize({width:1280,height:640});
  const first=await view(routePage);await routePage.locator('.operating-commit-controls [data-run-route-plan]').click();await revision(routePage,first.state.revision);
  for(const selector of ['dividend_payout','dividend_withhold']){
   const b=routePage.locator(`.operating-commit-controls [data-op-action="${selector}"]`);
   assert.equal(await b.isEnabled(),true);await b.click({trial:true});
  }
  await shot(routePage,'26-short-dividend');await routePage.close();
 });
 if(fixtures.handoff)await check('27 Round notice fades and expires despite repeated rendering',async()=>{
  const p=await fixture('handoff');await market(p);const before=await view(p);
  await p.evaluate(()=>{window.auditHandoffFaded=false;new MutationObserver(()=>{if(document.querySelector('.round-handoff.is-fading'))window.auditHandoffFaded=true;}).observe(document.querySelector('#app'),{childList:true,subtree:true});});
  await p.locator('[data-action="end_stock_turn"]').first().click();await confirm(p,true);await revision(p,before.state.revision);
  await p.locator('.round-handoff').waitFor();
  await p.locator('.round-handoff').waitFor({state:'detached',timeout:11000});
  assert.equal(await p.evaluate(()=>window.auditHandoffFaded),true);
  assert.equal((await view(p)).state.round,'operating');await p.close();
 });
}finally{
 await writeFile(path.join(output,'results.json'),JSON.stringify({base,results,errors,networkErrors},null,2)+'\n');
 await browser.close();
}
console.log(`${results.filter(r=>r.status==='pass').length}/${results.length} checks passed; ${errors.length} browser exceptions`);
if(results.some(r=>r.status==='fail') || errors.length || networkErrors.length)process.exitCode=1;
