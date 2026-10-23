import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const market=JSON.parse(execFileSync('python3',['-c','import sys,json;sys.path.insert(0,"daemon18xx");from app.engine1889.data import MARKET;print(json.dumps(MARKET))'],{encoding:'utf8'}));
const bundle=await build({stdin:{contents:`export {render2DStockMarketGrid} from './src/components/StockExchange.js'; export {captureMarket,animateMarket} from './src/ui/elasticMarket.js';`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'ledger'});
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>console.error(e.message));
 await page.route('http://ledger.test/**',route=>route.fulfill({contentType:'text/html',body:'<html></html>'}));
 await page.goto('http://ledger.test/');
 await page.setContent('<main class="stock-window-body" style="width:1360px;height:850px"></main>');
 await page.addStyleTag({content:await readFile('src/style.css','utf8')});
 await page.addStyleTag({content:await readFile('src/elasticMarket.css','utf8')});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(market=>{
  window.market=market;window.corps={AR:{position:[2,3]},TR:{position:[5,3]},UR:{position:[5,3]}};
  window.draw=(motion=true)=>{
   const root=document.querySelector('main'),old=ledger.captureMarket(document,'test');
   root.innerHTML=ledger.render2DStockMarketGrid({corporations:corps},{market});
   ledger.animateMarket(document,old,{identity:'test',motion});
  };draw();
 },market);
 const count=await page.locator('[data-market-position]').count();assert.equal(count,market.flat().length);
 await mkdir('validation/elastic-market',{recursive:true});
 await page.screenshot({path:'validation/elastic-market/ledger.png'});
 await page.evaluate(()=>{corps.AR.position=[3,3];draw();});
 assert.ok(await page.evaluate(()=>document.getAnimations().length>0));
 await page.waitForTimeout(180);
 await page.evaluate(()=>draw());
 assert.ok(await page.evaluate(()=>document.getAnimations().length>0));
 await page.waitForTimeout(700);
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
 await page.evaluate(()=>{corps.AR.position=[0,14];draw(false);});
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
 for(const width of [540,1000,1360]){
  await page.locator('main').evaluate((el,width)=>{el.style.width=width+'px';el.style.height='650px';},width);
  const fits=await page.locator('.elastic-market-key').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('main').getBoundingClientRect();return a.bottom<=b.bottom+1&&a.right<=b.right+1;});
  assert.ok(fits,'Key remains visible at width '+width);
 }
 await page.evaluate(()=>{corps=Object.fromEntries(['AR','IR','SR','KO','TR','KU','UR'].map(id=>[id,{position:[5,3]}]));draw(false);});
 assert.equal(await page.locator('[data-market-corporation]').count(),7);
 await page.evaluate(()=>draw());
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'Unchanged settled polls stay still');
 await page.evaluate(()=>{
  const old=ledger.captureMarket(document,'test');corps.AR.position=[0,14];
  document.querySelector('main').innerHTML=ledger.render2DStockMarketGrid({corporations:corps},{market});
  ledger.animateMarket(document,old,{identity:'another-room',motion:true});
 });
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'Room changes do not borrow old positions');
 await page.evaluate(()=>{corps.AR.position=[5,3];draw(false);});
 await page.screenshot({path:'validation/elastic-market/shared-cell.png'});
 console.log('PASS: catalog parity, movement, interrupted refresh, motion off, resized windows, seven shared markers');
} finally {await browser.close();}
