#!/usr/bin/env node
// Deterministic UI walkthroughs. No model/API key or AI service is involved.
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {PlaybackControls} from './playback-controls.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const {values: options, positionals} = parseArgs({allowPositionals:true, options:{
  delay:{type:'string',default:'1200'}, step:{type:'boolean'}, headless:{type:'boolean'},
  close:{type:'boolean'}, url:{type:'string'}, output:{type:'string'}, help:{type:'boolean'},
}});
if (options.help) {
  console.log(`Usage: node scripts/puppet-round.mjs operation|stock [options]
  --delay 1200   Milliseconds before each visible click (default 1200)
  --step         Start paused; N or Enter advances one click
  --headless     Run without a window and exit when finished
  --close        Close Chrome and exit when finished
  --url URL      Use an existing development server instead of a temporary server
  --output DIR   Save report and screenshots here

With no --url, starts isolated servers and a temporary game database.
Normally leaves Chrome open for inspection; press Enter in this terminal to close.
Live terminal keys: P = pause/resume, N = one click, R = restart, Q = quit. No Enter needed.
Close Chrome or press Ctrl+C to stop at any time. No AI calls or tokens required.`);
  process.exit(0);
}
const round = positionals[0];
assert.ok(positionals.length === 1 && ['operation','stock'].includes(round), 'Choose operation or stock; use --help for options.');
const pace = Number(options.delay);
assert.ok(Number.isFinite(pace) && pace >= 0, '--delay must be a nonnegative number.');
assert.ok(!options.step || (process.stdin.isTTY && !options.headless), '--step needs an interactive terminal and visible Chrome.');
async function runRound(attempt) {
const output = options.output
  ? path.resolve(options.output,...(attempt ? [`restart-${attempt}`] : []))
  : path.join(root,'validation/evidence',`puppet-${round}-${Date.now()}`);
const report = {round, status:'running', started:new Date().toISOString(), steps:[], errors:[]};
const children = [];
let temporary, browser, page, controls, serverLog = '', stopping = false, restarting = false;
let currentStep = 'Starting practice game';
let cleanupPromise;
async function cleanup() {
  return cleanupPromise ||= (async () => {
    controls?.close();
    await browser?.close().catch(()=>{});
    await Promise.all(children.map(child => new Promise(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      const timer = setTimeout(()=>{child.kill('SIGKILL');resolve();},2000);
      child.once('exit',()=>{clearTimeout(timer);resolve();});
      child.kill('SIGTERM');
    })));
    if (temporary) await rm(temporary,{recursive:true,force:true});
  })();
}
async function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  if (report.status==='running') report.status='stopped';
  report.finished=new Date().toISOString();
  await mkdir(output,{recursive:true}).then(()=>writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')).catch(()=>{});
  await cleanup();
  process.exit(exitCode);
}
const signalHandlers=['SIGINT','SIGTERM'].map(signal=>{
  const handler=()=>stop(signal==='SIGINT'?130:143);
  process.once(signal,handler);return [signal,handler];
});
function checkRestart() {if (restarting) throw new Error('Restart requested');}
function restart() {
  if (stopping || restarting) return;
  restarting=true;
  console.log('  ↻ RESTARTING — closing this practice run and starting a fresh game…');
  controls.close();
  // Interrupt a pending browser action. The run's finally block owns cleanup.
  browser?.close().catch(()=>{});
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const port = server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
function start(command,args,env) {
  const child = spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
  children.push(child);
  child.on('error',error=>{serverLog += error.message;});
  for (const stream of [child.stdout,child.stderr]) stream.on('data',data=>{serverLog = (serverLog + data).slice(-6000);});
  return child;
}
async function ready(url,child) {
  const deadline = Date.now()+30000;
  while (Date.now()<deadline) {
    checkRestart();
    if (child.exitCode !== null) throw new Error('Practice server exited: '+serverLog);
    try {const response = await fetch(url,{signal:AbortSignal.timeout(1000)}); if (response.ok) return;} catch {}
    await delay(200);
  }
  throw new Error('Practice server did not start: '+serverLog);
}
async function startServers() {
  temporary = await mkdtemp(path.join(tmpdir(),'koenji-puppet-'));
  const backendPort = await freePort();
  const backend = start(process.env.KOENJI_PYTHON || 'python3',['server_bridge.py'],{
    KOENJI_BACKEND_HOST:'127.0.0.1',KOENJI_BACKEND_PORT:String(backendPort),
    DAEMON18XX_DATABASE:path.join(temporary,'practice.sqlite3'),KOENJI_QUIET:'1',
  });
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  await ready(backendUrl+'/health',backend);
  checkRestart();
  const frontendPort = await freePort();
  const frontend = start(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(frontendPort),'--strictPort'],{
    DAEMON18XX_URL:backendUrl,
  });
  const base = `http://127.0.0.1:${frontendPort}`;
  await ready(base+'/health',frontend);
  return base;
}
async function view() {
  return page.evaluate(async()=>{
    const session = JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'));
    if (!session?.token) throw new Error('Practice session is missing.');
    const response = await fetch('/api/1889/games/'+encodeURIComponent(session.room_code),{
      headers:{Authorization:'Bearer '+session.token},
    });
    if (!response.ok) throw new Error('Practice state HTTP '+response.status);
    return response.json();
  });
}
const visible = selector => page.locator(selector).filter({visible:true}).first();
async function click(label,selector) {
  await controls.untilActive();
  currentStep = label;
  console.log('  → '+label);
  const button = visible(selector);
  await button.waitFor();
  const footerBounds = await button.evaluate(el=>{
    if (!el.closest('.train-wizard-footer')) return null;
    const r=el.getBoundingClientRect(),v=window.visualViewport;
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:v?.width ?? innerWidth,height:v?.height ?? innerHeight};
  });
  if (footerBounds) {
    assert.ok(footerBounds.left>=0 && footerBounds.top>=0 && footerBounds.right<=footerBounds.width+1 && footerBounds.bottom<=footerBounds.height+1,
      'Wizard footer action is outside the visible window: '+JSON.stringify(footerBounds));
  } else await button.scrollIntoViewIfNeeded();
  await button.evaluate(el=>{el.style.outline='4px solid #f5b642';el.style.outlineOffset='3px';});
  // The caption remains outside the application's re-rendered container.
  await page.evaluate(text=>{
    let caption = document.getElementById('puppet-caption');
    if (!caption) {
      caption = document.createElement('div');caption.id='puppet-caption';
      caption.style.cssText='position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:9px 18px;background:#172b32;color:#fff9df;border:2px solid #f5b642;border-radius:8px;font:16px system-ui;pointer-events:none;max-width:70vw;text-align:center';
      document.body.append(caption);
    }
    caption.textContent=text;
  },controls.paused ? 'PAUSED · '+label+' · P resume / N next' : label);
  await controls.beforeClick(pace);
  await button.click();
}
async function closeModal() {
  if (await visible('[data-close-modal]').count()) await click('Close reference window','[data-close-modal]');
}
async function commit(label,selector,type,check=()=>{}) {
  const before = await view();
  // Observe the browser's request; gameplay is submitted exclusively by UI clicks.
  // Pausing before the click or confirmation must not consume a network timeout.
  let listener,timer,response;
  const pending = new Promise(resolve=>{
    listener=r=>{if (r.request().method()==='POST' && new URL(r.url()).pathname.endsWith('/actions')) resolve(r);};
    page.on('response',listener);
  });
  try {
    await click(label,selector);
    if (await visible('[data-commit-decision]').count()) await click('Confirm: '+label,'[data-commit-decision]');
    response = await Promise.race([pending,new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('No move response within 15 seconds after clicking')),15000);
    })]);
  } finally {clearTimeout(timer);page.off('response',listener);}
  assert.ok(response.ok(),`Move rejected (HTTP ${response.status()}) during ${label}`);
  const action = response.request().postDataJSON().action;
  assert.equal(action.type,type,'Unexpected action submitted by the UI');
  const after = await response.json();
  assert.equal(after.state.revision,before.state.revision+1,'Each click must commit exactly once');
  await page.waitForFunction(rev=>{
    const text=document.querySelector('.room-context')?.innerText || '';
    return new RegExp('Live · Rev '+rev+'\\b').test(text);
  },after.state.revision);
  await check(after,before,action);
  report.steps.push({label,action,revision:after.state.revision,round:after.state.round,step:after.state.operating_turn?.step});
  // Flotation has a real acknowledgement overlay which must be dismissed.
  if (await visible('[data-dismiss-flotation]').count()) await click('Acknowledge company flotation','[data-dismiss-flotation]');
  return after;
}
async function currentSeat() {
  await closeModal();
  const before = await view();
  const actor = before.legal_actions.active_player || before.state.current_player;
  if (before.viewer.player_id !== actor) {
    await click('Switch to '+before.state.players[actor].name,'[data-test-turn]');
    await page.waitForFunction(actor=>JSON.parse(sessionStorage.getItem('koenji_1889_tab_session_v1'))?.seat_key===actor,actor);
    // Wait for both the credential switch and the newly authorized controls.
    await visible('[data-action="end_stock_turn"]:not([disabled])').waitFor();
  }
  assert.equal((await view()).viewer.player_id,actor);
}
async function stockRound() {
  await closeModal();
  await click('Open Stock Exchange','[data-view="market"]');
  const opening = await view();
  assert.equal(opening.state.round,'stock');
  assert.equal(opening.state.stock_round,1);
  async function buy(corporation,price) {
    await currentSeat();
    await click('Select '+corporation,`[data-company="${corporation}"]`);
    if (price) await click(`Set ${corporation} par to ¥${price}`,`[data-select-par="${price}"]`);
    else await click('Buy from the IPO','[data-select-source="ipo"]');
    await commit(`Buy ${corporation} shares`,'[data-action="buy_shares"]','buy_shares',(after,before)=>{
      const actor=before.viewer.player_id;
      assert.ok(after.state.players[actor].cash<before.state.players[actor].cash,'Purchase must spend personal cash');
      assert.equal(after.state.current_player,actor,'Buying must not silently end the turn');
    });
    await commit('Finish this player’s stock turn','[data-action="end_stock_turn"]','end_turn');
  }
  await buy('IR',80);
  await buy('KO',75);
  await buy('IR');
  await buy('IR');
  await buy('IR');
  for (let i=0;i<4;i++) {
    await currentSeat();
    await commit('Pass without buying','[data-action="end_stock_turn"]','pass');
  }
  const final = await view();
  assert.equal(final.state.round,'operating','Four consecutive passes must close the stock round');
  assert.equal(final.state.corporations.IR.floated,true);
  assert.equal(final.state.corporations.KO.par,75);
  assert.equal(final.state.revision,opening.state.revision+14);
  assert.equal(final.state.operating_turn.step,'track','Stop before the first operating action');
}
async function operationRound() {
  await closeModal();
  await click('Open Map & Operations','[data-view="map"]');
  const opening = await view();
  assert.equal(opening.state.round,'operating');
  assert.equal(opening.state.operating_turn.step,'track');
  const cid = opening.state.current_corporation;
  assert.equal(opening.state.corporations[cid].trains.length,2);
  // This legal lay connects a second exit so both existing 2-trains can earn.
  assert.ok(opening.legal_tile_lays.F3.some(p=>p.tile==='57' && p.rotation===2));
  await click('Inspect F3 on the map','[data-select-hex="F3"]');
  await click('Preview tile #57 at 120°','[data-select-legal-placement="F3:57:2"]');
  await commit('Lay track at F3','[data-op-action="lay_tile"]','lay_tile',after=>{
    assert.equal(after.state.board.F3.tile,'57');assert.equal(after.state.operating_turn.step,'token');
  });
  await commit('Station decision: keep the existing home station','[data-op-action="skip"]','skip',after=>{
    assert.equal(after.state.operating_turn.step,'routes');
  });
  const routes = await view();
  assert.equal(routes.route_quote.routes.length,2);
  assert.equal(routes.route_quote.revenue,90);
  await commit('Run both trains for ¥90','[data-run-route-plan]','run_routes',after=>{
    assert.equal(after.state.operating_turn.step,'dividend');assert.equal(after.state.operating_turn.revenue,90);
  });
  await commit('Pay dividends to shareholders','[data-op-action="dividend_payout"]','dividend',(after,before)=>{
    assert.equal(after.state.operating_turn.step,'train');
    assert.ok(after.state.players.p1.cash>before.state.players.p1.cash,'Shareholder must receive the dividend');
  });
  if (!await visible('.train-purchase-modal').count()) await click('Open Train Purchase Wizard','[data-open-train-wizard]');
  await visible('[data-wizard-panel="1"]').waitFor();
  await page.screenshot({path:path.join(output,'train-step-1.png')});
  await click('Train wizard 1/5: review fleet and obligation','[data-wizard-next]');
  await click('Train wizard 2/5: select another depot train','[data-buy-train]:not([disabled])');
  await visible('[data-wizard-panel="3"]').waitFor();
  await click('Train wizard 3/5: review rust and phase effects','[data-wizard-next]');
  await visible('[data-wizard-panel="4"]').waitFor();
  await click('Train wizard 4/5: review corporate financing','[data-wizard-next]');
  await visible('[data-wizard-panel="5"]').waitFor();
  await page.screenshot({path:path.join(output,'train-step-5.png')});
  await commit('Train wizard 5/5: stamp and buy','[data-stamp-train]','buy_train',(after,before,action)=>{
    assert.equal(after.state.trains[action.train].owner,cid);
    assert.equal(after.state.corporations[cid].trains.length,3);
    assert.ok(after.state.corporations[cid].cash<before.state.corporations[cid].cash);
    assert.equal(after.state.players.p1.cash,before.state.players.p1.cash,'Company pays for the train');
  });
  await commit('Finish the company’s operating turn','[data-wizard-pass]','end_turn');
  const final = await view();
  assert.equal(final.state.round,'stock','The entire operating round must be complete');
  assert.equal(final.state.stock_round,opening.state.stock_round+1);
  assert.equal(final.state.revision,opening.state.revision+6);
}
try {
  await mkdir(output,{recursive:true});
  controls = new PlaybackControls({input:options.headless?null:process.stdin,paused:!!options.step,onQuit:stop,onChange:state=>{
    console.log(state.paused ? '  ⏸ PAUSED — P resumes · N advances one click · R restarts · Q quits' : '  ▶ RESUMED — P pauses · R restarts · Q quits');
    page?.evaluate(({paused,label})=>{
      const caption=document.getElementById('puppet-caption');
      if (caption) caption.textContent=paused ? 'PAUSED · '+label+' · P resume / N next' : label;
    },{paused:state.paused,label:currentStep}).catch(()=>{});
  },onRestart:restart});
  if (controls.attached) console.log('Keyboard controls: P pause/resume · N one click · R restart · Q quit (no Enter needed).');
  const {chromium} = await import('playwright');
  checkRestart();
  const base = options.url ? new URL(options.url).origin : await startServers();
  checkRestart();
  assert.ok(/^https?:/.test(base),'Use an http or https development URL.');
  console.log(`Watching one ${round} round. ${options.step ? 'Starts paused. N or Enter advances one click; P starts playback.' : `Pace: ${pace} ms per click.`}`);
  console.log('Reports: '+output);
  browser = await chromium.launch({headless:!!options.headless,...(process.env.KOENJI_BROWSER_PATH ? {executablePath:process.env.KOENJI_BROWSER_PATH} : {channel:'chrome'})});
  checkRestart();
  // A visible walkthrough must use Chrome's actual content area. A forced
  // 1000px viewport can extend below a shorter physical window on macOS.
  page = await browser.newPage({viewport:options.headless ? {width:1440,height:1000} : null});
  report.viewportMode=options.headless ? 'fixed headless test viewport' : 'native browser window';
  report.viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,outerWidth,outerHeight,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height}));
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.errors.push({step:currentStep,message:error.message}));
  page.on('response',response=>{
    if (response.status()>=400 && new URL(response.url()).pathname.startsWith('/api/'))
      report.errors.push({step:currentStep,status:response.status(),path:new URL(response.url()).pathname});
  });
  await page.addInitScript(()=>localStorage.setItem('koenji_locale','en'));
  await page.goto(base+'/test?scenario='+(round==='operation'?'cycle':'stock'));
  await visible('.room-context').waitFor();
  const initial = await view();
  report.startRevision=initial.state.revision;
  await page.screenshot({path:path.join(output,'start.png')});
  if (round==='operation') await operationRound(); else await stockRound();
  assert.equal(report.errors.length,0,JSON.stringify(report.errors));
  report.status='passed';
  report.endRevision=(await view()).state.revision;
  await page.evaluate(round=>{
    document.getElementById('puppet-caption').textContent=`✓ ${round==='operation'?'Operation':'Stock'} round complete · stopped at the next round`;
  },round);
  console.log(`PASS — complete ${round} round, ${report.steps.length} verified moves. Stopped at the next round.`);
} catch(error) {
  if (!stopping && !restarting) {
    report.status='failed';report.failure={step:currentStep,message:error.message};
    process.exitCode=1;
    console.error('FAIL — '+currentStep+': '+error.message);
  }
} finally {
  if (!stopping && !restarting) {
    report.finished=new Date().toISOString();
    await page?.screenshot({path:path.join(output,report.status==='passed'?'finish.png':'failure.png'),fullPage:true}).catch(()=>{});
    await mkdir(output,{recursive:true});
    await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('Report: '+path.join(output,'report.json'));
    if (!restarting && browser?.isConnected() && !options.close && !options.headless) {
      console.log('Chrome is ready for inspection. R restarts from the beginning; Enter or Q closes.');
      await Promise.race([
        controls.waitForFinish(),
        new Promise(resolve=>browser.once('disconnected',resolve)),
        new Promise(resolve=>page?.once('close',resolve)),
      ]);
    }
  }
  await cleanup();
  for (const [signal,handler] of signalHandlers) process.off(signal,handler);
  if (restarting && !stopping) {
    report.status='restarted';report.finished=new Date().toISOString();
    await mkdir(output,{recursive:true});
    await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('Previous run saved: '+path.join(output,'report.json'));
  }
}
return restarting && !stopping;
}

let attempt=0;
for (;;) {
  process.exitCode=0;
  if (!await runRound(attempt++)) break;
}
