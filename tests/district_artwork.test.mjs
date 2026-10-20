import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import artwork from '../src/data/districtArtwork.json' with {type:'json'};
import inventory from '../docs/koenji/district-research/board-inventory.json' with {type:'json'};
import research from '../public/assets/districts/research/districts.json' with {type:'json'};
const root=fileURLToPath(new URL('../',import.meta.url));

test('every engine board hex has a unique shipped portrait, source photo and historical research',()=>{
 assert.equal(Object.keys(inventory).length,52);
 assert.deepEqual(Object.keys(artwork).sort(),Object.keys(inventory).sort());
 assert.deepEqual(Object.keys(research).sort(),Object.keys(inventory).sort());
 assert.equal(new Set(Object.values(artwork).map(a=>a.file)).size,52);
 for(const [coord,a] of Object.entries(artwork)){
  assert.equal(a.kind,'generated-historical',coord);
  assert.ok(a.sceneYear>=1870&&a.sceneYear<=1900,coord);
  assert.match(a.file,/^\/assets\/districts\/[a-l]\d+-meiji-v[12]\.webp$/);
  const bytes=readFileSync(root+'public'+a.file);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',coord);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',coord);
  assert.ok(bytes.length>5000,coord);
  assert.ok(a.width>=768&&a.height>=380,coord);
  const r=research[coord];
  assert.ok(r.prompt.length>300&&!r.prompt.includes('Pending generation'),coord);
  assert.match(r.method,/Built-in imagegen/);
  assert.ok(r.history.summary&&r.history.url.startsWith('https://'),coord);
  assert.ok(r.references.length>0,coord);
  for(const ref of r.references){
   assert.ok(existsSync(root+'public'+ref.file),coord);
   assert.ok(ref.creator&&ref.license&&ref.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/'),coord);
  }
  assert.equal(a.researchUrl,'/assets/districts/research/index.html#'+coord);
 }
});

test('uncertain geographic matches and generated images remain explicitly qualified',()=>{
 const entries=Object.values(research);
 assert.equal(entries.filter(r=>r.mappingStatus==='named-board-location').length,25);
 assert.equal(entries.filter(r=>r.mappingStatus==='inferred-region').length,27);
 for(const r of entries.filter(r=>r.mappingStatus==='inferred-region')){
  assert.match(r.mappingBasis,/Approximate regional/);
  assert.ok(r.referenceUse);
 }
 const atlas=readFileSync(root+'public/assets/districts/research/index.html','utf8');
 assert.match(atlas,/52 \/ 52 portraits complete/);
 assert.match(atlas,/not archival photographs/);
 for(const coord of Object.keys(inventory))assert.ok(atlas.includes(`id="${coord}"`),coord);
});
