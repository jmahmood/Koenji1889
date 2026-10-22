import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {setTimeout as delay} from 'node:timers/promises';
import {PlaybackControls} from '../scripts/playback-controls.mjs';

function setup(options={}) {
  const input=new PassThrough();input.isTTY=true;input.isRaw=false;
  input.setRawMode=value=>{input.isRaw=value;};
  const controls=new PlaybackControls({input,...options});
  return {controls,input,key:name=>input.emit('keypress',name,{name})};
}

test('P pauses during the delay and resumes the pending click',async()=>{
  const {controls,key}=setup();
  try {
    let clicked=false;
    const pending=controls.beforeClick(50).then(()=>{clicked=true;});
    key('p');
    await delay(90);
    assert.equal(clicked,false,'A paused delay must never release a click');
    key('p');await pending;
    assert.equal(clicked,true);
  } finally {controls.close();}
});

test('N allows exactly one click and keeps the next click paused',async()=>{
  const {controls,key}=setup({paused:true});
  try {
    let clicks=0;
    const first=controls.beforeClick(5000).then(()=>{clicks++;});
    key('n');await first;
    assert.equal(controls.paused,true);
    const second=controls.beforeClick(0).then(()=>{clicks++;});
    await delay(30);assert.equal(clicks,1);
    key('return');await second;
    assert.equal(clicks,2);assert.equal(controls.paused,true);
  } finally {controls.close();}
});

test('preparation also waits while paused and does not spend the single-click permit',async()=>{
  const {controls,key}=setup({paused:true});
  try {
    let prepared=false;
    const prepare=controls.untilActive().then(()=>{prepared=true;});
    await delay(25);assert.equal(prepared,false);
    key('n');await prepare;
    await controls.beforeClick(1000);
    assert.equal(controls.credits,0);
    assert.equal(controls.paused,true);
  } finally {controls.close();}
});

test('keys need no newline, Q exits, and closing restores the terminal',async()=>{
  let exit;
  const {controls,input}=setup({onQuit:code=>{exit=code;}});
  assert.equal(input.isRaw,true);
  input.write('P');assert.equal(controls.paused,true);
  input.write('p');assert.equal(controls.paused,false);
  input.write('q');assert.equal(exit,0);
  controls.close();controls.close();
  assert.equal(input.isRaw,false);assert.equal(input.listenerCount('keypress'),0);
  assert.equal(input.isPaused(),true,'Initially idle input must not keep the process alive');
});

test('completion waits for Enter and ignores play/step keys',async()=>{
  const {controls,key}=setup();
  try {
    let finished=false;
    const pending=controls.waitForFinish().then(()=>{finished=true;});
    key('p');key('n');await delay(10);
    assert.equal(finished,false);assert.equal(controls.paused,false);
    key('return');await pending;assert.equal(finished,true);
  } finally {controls.close();}
});

test('R restarts while playing, paused, or inspecting a completed run without Enter',async()=>{
  let restarts=0;
  const {controls,input,key}=setup({onRestart:()=>{restarts++;}});
  try {
    input.write('r');assert.equal(restarts,1);
    key('p');input.write('R');assert.equal(restarts,2);
    const finished=controls.waitForFinish();
    input.write('r');assert.equal(restarts,3);
    controls.close();await finished;
    await controls.waitForFinish();
  } finally {controls.close();}
});

test('restart closes the controls and releases a click waiting on pause',async()=>{
  const {controls,key}=setup({paused:true,onRestart:()=>controls.close()});
  const waiting=controls.beforeClick(5000);
  key('r');
  await assert.rejects(waiting,/Playback stopped/);
  assert.equal(controls.credits,0);
});
