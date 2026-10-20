import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {APPEARANCE_CATALOG, normalizeAppearance, renderCharacter} from '../src/scene/Character.js';
import rawCatalogue from '../src/data/appearance.json' with {type:'json'};
import {VALID_EXPRESSIONS, VALID_POSES, renderHead, renderTorso} from '../src/scene/paperDollArt.js';
import {renderCharacterSetup} from '../src/components/CharacterSetup.js';

const faces = APPEARANCE_CATALOG.faces.filter(face => face.headAtlas);
test('seventeen reference portraits provide nine distinct frames inside real transparent PNGs', () => {
  assert.deepEqual(faces.map(face => face.id), Array.from({length:17}, (_,i) => `reference-${String(i+1).padStart(2,'0')}`));
  for (const face of faces) {
    const atlas = face.headAtlas;
    const png = readFileSync(new URL(`../public/assets/koma-sprites/photoreal-heads/${atlas.file}`, import.meta.url));
    assert.equal(png.subarray(1,4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), atlas.width);
    assert.equal(png.readUInt32BE(20), atlas.height);
    assert.equal(png[25], 6, 'PNG must retain RGBA transparency');
    assert.deepEqual(Object.keys(atlas.frames), VALID_EXPRESSIONS);
    const distinct = new Set();
    for (const [expression, frame] of Object.entries(atlas.frames)) {
      const [x,y,w,h] = frame;
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= atlas.width && y+h <= atlas.height);
      distinct.add(frame.join(' '));
      const html = renderHead(face, expression);
      assert.ok(html.includes(`viewBox="${frame.join(' ')}"`));
      assert.ok(html.includes(`href="/assets/koma-sprites/photoreal-heads/${atlas.file}"`));
      assert.match(html, /overflow="hidden"/);
      assert.doesNotMatch(html, /-photoreal\.png/, 'new portraits share one cached expression atlas');
    }
    assert.equal(distinct.size, 9);
  }
});

test('portrait batches retain their original membership and expose all seven latest additions', () => {
  const batches = new Map();
  for (const face of faces) {
    if (!batches.has(face.portraitBatch)) batches.set(face.portraitBatch, []);
    batches.get(face.portraitBatch).push(face);
  }
  assert.deepEqual([...batches.values()].map(batch => batch.length), [7,3,7]);
  assert.deepEqual(batches.get(faces.at(-1).portraitBatch).map(face => face.id),
    Array.from({length:7}, (_,i) => `reference-${i+11}`));
});

test('new faces remain independent of outfits and render across all poses and UI crops', () => {
  for (const face of faces) {
    for (const clothes of APPEARANCE_CATALOG.clothes) {
      const look = {face:face.id, clothes:clothes.id};
      assert.deepEqual(normalizeAppearance(look), look);
      for (const surface of ['setup','table','portrait','arrival']) {
        const html = renderCharacter(look, {surface});
        assert.ok(html.includes(`data-face="${face.id}"`));
        assert.ok(html.includes(`data-clothes="${clothes.id}"`));
        assert.ok(html.includes(face.headAtlas.file));
      }
    }
    for (const pose of VALID_POSES) {
      assert.ok(renderCharacter({face:face.id}, {pose}).includes(face.headAtlas.file));
    }
    assert.match(renderHead(face, 'neutral', {rawPose:'bow'}), /translate\(0, 6\)/);
    assert.match(renderCharacterSetup({face:face.id}), new RegExp(`value="${face.id}" selected`));
  }
});

test('existing faces retain their image URLs and invalid expressions fall back safely', () => {
  for (const face of rawCatalogue.faces.filter(face => !face.headAtlas)) {
    assert.ok(renderHead(face, 'smile').includes(`${face.photorealId}-smile-photoreal.png`));
  }
  assert.equal(renderHead(faces[0], 'unsupported'), renderHead(faces[0], 'neutral'));
});

test('character layout sizes only the outer SVG, preserving nested atlas viewports', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.custom-character > svg\s*\{/);
  assert.doesNotMatch(css, /\.custom-character svg\s*\{[^}]*overflow:visible/);
});

test('every atlas viewport clips its exact source rectangle and registers its neck to the collar', () => {
  for (const face of faces) for (const expression of VALID_EXPRESSIONS) {
    const html = renderHead(face, expression);
    const match = html.match(/<svg class="paper-doll-head-frame" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    assert.ok(match, `${face.id}/${expression} has an explicit frame viewport`);
    const [x,y,w,h] = match.slice(1).map(Number);
    const [targetX,targetY,targetW,targetH] = face.headAtlas.placement;
    const [sourceX,sourceY,sourceW,sourceH] = face.headAtlas.frames[expression];
    const neck = face.headAtlas.neckAnchors[expression];
    assert.ok(neck[0] >= sourceX && neck[0] <= sourceX+sourceW);
    assert.ok(neck[1] >= sourceY && neck[1] <= sourceY+sourceH);
    const near = (actual, expected) => assert.ok(Math.abs(actual-expected) < 1e-9, `${actual} ≈ ${expected}`);
    near(w/h, sourceW/sourceH);
    near(x+(neck[0]-sourceX)*w/sourceW, targetX+targetW/2);
    near(y+(neck[1]-sourceY)*h/sourceH, targetY+targetH);
    assert.ok(w <= targetW+1e-9 && h <= targetH+1e-9);
    assert.match(html, /preserveAspectRatio="none" overflow="hidden"/);
  }
});

test('asymmetric head outlines move around a fixed neck attachment, preserving the full crop', () => {
  const face = {photorealId:'test', headAtlas:{file:'test.png',width:300,height:300,
    placement:[50,10,100,100], frames:{neutral:[20,30,100,100]}, neckAnchors:{neutral:[50,130]}}};
  const html = renderHead(face);
  assert.match(html, /x="70" y="10" width="100" height="100" viewBox="20 30 100 100"/);
  const legacy = {...face, headAtlas:{...face.headAtlas,neckAnchors:undefined}};
  assert.match(renderHead(legacy), /x="50" y="10" width="100" height="100"/);
});

test('portrait 15 keeps Smile, Shock and Laugh at the same head scale as Neutral', () => {
  const face=faces.find(f=>f.id==='reference-15');
  const size=expression=>{
    const html=renderHead(face,expression);
    return html.match(/class="paper-doll-head-frame"[^>]*width="([^"]+)" height="([^"]+)"/).slice(1).map(Number);
  };
  const [,neutralHeight]=size('neutral');
  for(const expression of VALID_EXPRESSIONS) {
    const [width,height]=size(expression);
    assert.ok(height/neutralHeight>.97 && height/neutralHeight<1.03,
      `${expression}: ${height} should stay within 3% of ${neutralHeight}`);
    assert.ok(width>83 && width<=88, `${expression} retains a full-size head`);
  }
});

test('all head expressions follow the same collar movement as every outfit and held pose', () => {
  const offset = html => html.match(/^<g[^>]*transform="([^"]+)"/)?.[1] || '';
  for (const pose of VALID_POSES) for (const clothes of APPEARANCE_CATALOG.clothes) {
    const torsoOffset = offset(renderTorso(clothes.id,pose));
    for (const face of faces) for (const expression of VALID_EXPRESSIONS) {
      assert.equal(offset(renderHead(face,expression,{rawPose:pose})),torsoOffset,
        `${face.id}/${expression}/${clothes.id}/${pose}`);
    }
  }
});
