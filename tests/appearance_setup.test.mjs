import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCharacterSetup,bindAppearanceControls} from '../src/components/CharacterSetup.js';
import {APPEARANCE_CATALOG} from '../src/scene/Character.js';

const element=extra=>({...extra,events:{},addEventListener(name,handler){this.events[name]=handler;},focus(){this.focused=true;}});

test('every existing portrait and outfit remains selectable and selected values submit through the form',()=>{
  const value={face:'reference-17',clothes:'slate-montsuki'};
  const html=renderCharacterSetup(value,true);
  assert.equal((html.match(/data-pick-face=/g)||[]).length,APPEARANCE_CATALOG.faces.length);
  assert.equal((html.match(/data-pick-clothes=/g)||[]).length,APPEARANCE_CATALOG.clothes.length);
  assert.match(html,/value="reference-17" selected/);
  assert.match(html,/value="slate-montsuki" selected/);
  assert.match(html,/data-pick-face="reference-17" aria-pressed="true"/);
  assert.match(html,/data-pick-clothes="slate-montsuki" aria-pressed="true"/);
  assert.match(html,/appearance-advanced[^>]*hidden/);
  assert.equal((html.match(/type="submit"/g)||[]).length,1);
  assert.match(html,/data-cancel-look/);
  assert.doesNotMatch(renderCharacterSetup(null),/data-cancel-look/);
});

test('draft portrait, outfit and expression choices survive tab changes without changing saved appearance',()=>{
  const saved={face:'reference-01',clothes:'indigo-haori'};
  const face=element({dataset:{pickFace:'reference-15'}});
  const attire=element({dataset:{pickClothes:'teal-frock-coat'}});
  const advanced=element({dataset:{appearanceTab:'advanced'}});
  const expression=element({dataset:{previewExpr:'calculating'}});
  const manual=element({name:'face',form:{elements:{face:{value:'reference-12'},clothes:{value:'ivory-summer-suit'}}}});
  const nodes={'[data-pick-face]':[face],'[data-pick-clothes]':[attire],'[data-appearance-tab]':[advanced],'[data-preview-expr]':[expression],'[data-look-choice]':[manual]};
  globalThis.document={querySelectorAll:selector=>nodes[selector] || [],querySelector:()=>null};
  const app={};let renders=0;
  bindAppearanceControls({app,api:{getAppearance:()=>saved},render(){renders++;}});
  face.events.click({currentTarget:face});attire.events.click({currentTarget:attire});
  advanced.events.click({currentTarget:advanced});expression.events.click({currentTarget:expression});
  assert.deepEqual(app.appearanceDraft,{face:'reference-15',clothes:'teal-frock-coat',expression:'calculating'});
  assert.equal(app.appearanceTab,'advanced');
  const html=renderCharacterSetup(app.appearanceDraft,true,{tab:app.appearanceTab,dirty:true});
  assert.match(html,/appearance-choices" hidden/);
  assert.doesNotMatch(html,/appearance-advanced[^>]*hidden/);
  assert.match(html,/data-preview-expr="calculating" aria-pressed="true"/);
  assert.match(html,/Unsaved changes · Save to apply/);
  manual.events.change({currentTarget:manual});
  assert.deepEqual(app.appearanceDraft,{face:'reference-12',clothes:'ivory-summer-suit',expression:'calculating'});
  assert.deepEqual(saved,{face:'reference-01',clothes:'indigo-haori'});
  assert.equal(renders,5);
});

test('legacy appearance and unknown preview expressions use safe existing defaults',()=>{
  const html=renderCharacterSetup({face:'old-member',clothes:'unknown',expression:'unknown'});
  assert.match(html,/value="reference-01" selected/);
  assert.match(html,/value="indigo-haori" selected/);
  assert.match(html,/data-preview-expr="smile" aria-pressed="true"/);
  assert.match(html,/Choose a look to continue/);
});
