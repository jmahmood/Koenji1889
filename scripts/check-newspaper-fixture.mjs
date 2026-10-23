// Run against a disposable local database: creates separate test games.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.KOENJI_AUDIT_URL || 'http://127.0.0.1:15174';
const output='validation/newspaper-fixture-20261022';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1366,height:1000},reducedMotion:'no-preference'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  async function view() {
    return page.evaluate(async()=>{
      const session=JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));
      return (await fetch('/api/1889/games/'+session.room_code,{headers:{Authorization:'Bearer '+session.token}})).json();
    });
  }
  async function paper(locale='en') {
    await page.locator('[data-wizard-panel="3"]:visible').waitFor();
    await page.locator(`.train-newspaper.edition-${locale}`).waitFor();
  }
  async function close() {
    await page.locator('.train-purchase-modal [data-close-modal]').click();
  }
  await page.goto(base+'/test?scenario=newspaper');
  await paper();
  const before=await view();
  assert.equal(before.viewer.player_id,'p3');
  assert.equal(before.state.phase,'3');
  assert.equal(before.state.revision,178);
  assert.ok(!before.state.trains['2-5'].rusted);
  await page.screenshot({path:output+'/english.png'});
  // Routine renders must preserve the reader's position in the tall newspaper.
  await page.locator('.wizard-page-body').hover();
  await page.mouse.wheel(0,280);
  await page.waitForFunction(()=>document.querySelector('.wizard-page-body')?.scrollTop>100);
  const readingTop=await page.locator('.wizard-page-body').evaluate(el=>el.scrollTop);
  await page.locator('[data-locale]').selectOption('en');
  assert.equal(await page.locator('.wizard-page-body').evaluate(el=>el.scrollTop),readingTop);
  await page.reload();
  await paper();
  assert.equal((await view()).room_code,before.room_code,'Refresh must resume this room');
  assert.equal(await page.locator('.wizard-page-body').evaluate(el=>el.scrollTop),readingTop);
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-wizard-panel="4"]:visible').waitFor();
  await page.reload();
  await page.locator('[data-wizard-panel="4"]:visible').waitFor();
  await page.locator('[data-wizard-prev]').click();
  await paper();
  // Another tab creating a new fixture must not redirect this tab on refresh.
  const other=await context.newPage();
  await other.goto(base+'/test?scenario=newspaper');
  await other.locator('.train-newspaper.edition-en').waitFor();
  await other.locator('.train-purchase-modal [data-close-modal]').click();
  await other.locator('[data-new-test]').click();
  await other.locator('.train-newspaper.edition-en').waitFor();
  await page.reload();
  await paper();
  assert.equal((await view()).room_code,before.room_code,'The address, not another tab’s latest fixture, chooses this room');
  await other.close();
  await close();
  await page.locator('[data-locale]').selectOption('ja');
  await page.locator('[data-open-train-wizard]').click();
  await paper('ja');
  assert.equal(await page.locator('.train-newspaper h3').evaluate(el=>getComputedStyle(el).writingMode),'vertical-rl');
  assert.equal((await view()).state.revision,178);
  await page.screenshot({path:output+'/japanese.png'});
  await close();
  await page.locator('[data-locale]').selectOption('en');
  await page.locator('[data-new-test]').click();
  await paper();
  const fresh=await view();
  assert.notEqual(fresh.room_code,before.room_code,'New test game must create a fresh copy');
  assert.equal(fresh.state.revision,178);
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-wizard-panel="4"]:visible').waitFor();
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-stamp-train]').click();
  await page.waitForFunction(()=>document.querySelector('.room-context')?.innerText.includes('Rev 179'));
  const after=await view();
  assert.equal(after.state.phase,'4');
  assert.ok(after.state.trains['2-5'].rusted);
  assert.equal(after.state.corporations.TR.cash,41);
  await page.reload();
  await page.locator('.room-context').waitFor();
  assert.equal((await view()).state.revision,179,'A purchased train must remain purchased on refresh');
  assert.equal(await page.locator('.train-newspaper').count(),0);
  await close();
  // Re-selecting a Start position must reset the fixture rather than resume
  // the previously purchased train or a different player / wizard step.
  await page.locator('[data-test-scenario]').selectOption('stock');
  await page.waitForFunction(()=>document.querySelector('[data-test-scenario]')?.value==='stock' && !document.querySelector('[data-test-scenario]').disabled);
  await page.locator('[data-test-scenario]').selectOption('newspaper');
  await paper();
  const reset=await view();
  assert.equal(reset.state.revision,178);
  assert.equal(reset.state.phase,'3');
  assert.equal(reset.viewer.player_id,'p3');
  assert.notEqual(reset.room_code,fresh.room_code);
  // An old replay must not carry on scrubbing the newly loaded Demo fixture.
  await close();
  await page.locator('[data-action="toggle_play"]').click();
  await page.locator('.is-historical-mode').waitFor();
  // The same direct preview must also work through the regular Demo Tools path.
  await page.locator('[data-modal="seats"]').filter({visible:true}).first().click();
  await page.locator('[data-developer-tab="fixtures"]').click();
  await page.locator('[data-load-fixture="train_newspaper"]').click();
  await paper();
  assert.equal((await view()).viewer.player_id,'p3');
  await page.waitForTimeout(4000);
  await paper();
  assert.equal(await page.locator('.is-historical-mode').count(),0);
  assert.match(await page.locator('.room-context').innerText(),/Live · Rev 178/);
  await page.screenshot({path:output+'/stable-fixture.png'});
  assert.deepEqual(errors,[]);
  await writeFile(output+'/results.json',JSON.stringify({directLink:true,refresh:true,editions:['en','ja'],reset:true,
    purchaseConfirmed:true,purchasePersists:true,demoTools:true,startPositionResets:true,
    tabIsolation:true,stepPreserved:true,readingPositionPreserved:true,oldReplayStopped:true,errors},null,2));
  console.log('PASS newspaper fixture: reset, tab isolation, step and scroll persistence, replay isolation, both editions and purchase');
} finally {
  await browser.close();
}
