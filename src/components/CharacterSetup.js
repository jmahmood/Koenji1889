import {APPEARANCE_CATALOG,normalizeAppearance,renderCharacter} from '../scene/Character.js';
import {renderTorso} from '../scene/paperDollArt.js';
import {escapeHtml as esc} from '../ui/presentation.js';
import {bookingTitlebar,bookingHero} from './GatheringSetup.js';

const PREVIEW_EXPRESSIONS = [
  ['smile', 'Smile'],
  ['neutral', 'Neutral'],
  ['declare', 'Declare'],
  ['calculating', 'Calculating'],
];

const OUTFIT_LABELS = {
  'imperial-railway-uniform':'Railway uniform',
  'crimson-furisode':'Crimson brocade',
  'inverness-cape':'Inverness cape',
  'merchant-hanten':'Merchant hanten',
  'ivory-summer-suit':'Ivory linen suit',
  'amber-jinbaori':'Crested jinbaori',
  'teal-frock-coat':'Teal frock coat',
  'slate-montsuki':'Five-crest montsuki',
};

export function renderCharacterSetup(value, canCancel=false, {tab='appearance',dirty=false}={}) {
  const a=normalizeAppearance(value);
  const expr=PREVIEW_EXPRESSIONS.some(([id])=>id===value?.expression) ? value.expression : 'smile';
  const activeFace=APPEARANCE_CATALOG.faces.find(f=>f.id===a.face);
  const activeClothes=APPEARANCE_CATALOG.clothes.find(c=>c.id===a.clothes);
  const portraitNumber=String(APPEARANCE_CATALOG.faces.indexOf(activeFace)+1).padStart(2,'0');
  const advanced=tab==='advanced';
  const selectedMark='<span class="appearance-selected-mark" aria-hidden="true">✓</span>';

  return `<main class="appearance-screen" data-appearance-scroll="page"><section class="booking-window appearance-window" aria-label="Character appearance">
    ${bookingTitlebar()}
    ${bookingHero('Choose your look','A familiar face at the railway club.')}
    <nav class="booking-tabs appearance-tabs" aria-label="Appearance options">
      <button type="button" data-appearance-tab="appearance" aria-current="${advanced ? 'false' : 'page'}">Your appearance</button>
      <button type="button" data-appearance-tab="advanced" aria-current="${advanced ? 'page' : 'false'}">Advanced</button>
    </nav>
    <form data-save-look>
      <div class="appearance-workspace ${advanced ? 'is-advanced' : ''}">
        <div class="appearance-choices" ${advanced ? 'hidden' : ''}>
          <fieldset class="appearance-column appearance-portraits" aria-label="Choose a portrait">
            <legend>1. Choose a portrait</legend><p class="booking-hint">${APPEARANCE_CATALOG.faces.length} club portraits</p>
            <div class="appearance-portrait-grid">${APPEARANCE_CATALOG.faces.map((f,i)=>{
              const selected=a.face===f.id;
              return `<button type="button" class="appearance-swatch appearance-face ${selected ? 'is-selected' : ''}" data-pick-face="${esc(f.id)}" aria-pressed="${selected}" aria-label="${esc(f.name)}" title="${esc(f.name)}">
                <span class="appearance-face-art">${renderCharacter({face:f.id,clothes:a.clothes},{name:f.name,surface:'portrait',expression:selected ? expr : 'neutral'})}</span>
                <span class="appearance-swatch-label">${String(i+1).padStart(2,'0')}</span>${selected ? selectedMark : ''}
              </button>`;
            }).join('')}</div>
          </fieldset>
          <fieldset class="appearance-column appearance-attire" aria-label="Choose Meiji attire">
            <legend>2. Choose your attire</legend><p class="booking-hint">${APPEARANCE_CATALOG.clothes.length} Meiji-inspired outfits</p>
            <div class="appearance-attire-grid">${APPEARANCE_CATALOG.clothes.map(c=>{
              const selected=a.clothes===c.id;
              return `<button type="button" class="appearance-swatch appearance-outfit ${selected ? 'is-selected' : ''}" data-pick-clothes="${esc(c.id)}" aria-pressed="${selected}" aria-label="${esc(c.name)}" title="${esc(c.name)}">
                <span class="appearance-outfit-art"><svg viewBox="32 90 136 125" aria-hidden="true">${renderTorso(c.id,'idle')}</svg><span class="appearance-fabric-chips" aria-hidden="true"><i style="background:${esc(c.color)}"></i><i style="background:${esc(c.inner)}"></i></span></span>
                <span class="appearance-swatch-label">${esc(OUTFIT_LABELS[c.id] || c.name)}</span>${selected ? selectedMark : ''}
              </button>`;
            }).join('')}</div>
          </fieldset>
        </div>
        <section class="appearance-preview-column" aria-labelledby="appearance-preview-heading">
          <h2 id="appearance-preview-heading">Your character</h2>
          <div class="appearance-preview-frame"><div class="appearance-character">${renderCharacter(a,{name:'Your character',expression:expr,surface:'setup'})}</div>
            <div class="appearance-preview-caption" role="status" aria-live="polite"><strong>Portrait ${portraitNumber}</strong><span>${esc(activeClothes.name)}</span><small>✓ Ready for the club</small></div>
          </div><p class="appearance-remember">Your look is remembered in this browser.</p>
        </section>
        <section class="appearance-advanced" aria-label="Advanced appearance controls" ${advanced ? '' : 'hidden'}>
          <h2 class="booking-section-heading">Expression preview</h2><p class="booking-hint">Try an expression on your character. Your portrait and outfit stay selected.</p>
          <div class="appearance-expressions" role="group" aria-label="Preview expression">${PREVIEW_EXPRESSIONS.map(([id,label])=>`<button type="button" data-preview-expr="${id}" aria-pressed="${expr===id}">${label}</button>`).join('')}</div>
          <h2 class="booking-section-heading">Choose from a list</h2><p class="booking-hint">An alternative to the portrait and outfit tiles.</p>
          <div class="booking-field"><label for="look-face">Portrait</label><select id="look-face" name="face" data-look-choice>${APPEARANCE_CATALOG.faces.map(f=>`<option value="${f.id}" ${a.face===f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>
          <div class="booking-field"><label for="look-clothes">Attire</label><select id="look-clothes" name="clothes" data-look-choice>${APPEARANCE_CATALOG.clothes.map(c=>`<option value="${c.id}" ${a.clothes===c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <p class="booking-hint">Expression previews are for trying your look. The game controls expressions during play.</p>
        </section>
      </div>
      <footer class="booking-actions appearance-actions">${canCancel ? '<button type="button" data-cancel-look><span aria-hidden="true">←</span> Keep previous look</button>' : '<span class="booking-hint">A look of your own, before you join the club.</span>'}<span class="appearance-selection-summary" aria-hidden="true">Portrait ${portraitNumber} · ${esc(OUTFIT_LABELS[a.clothes] || activeClothes.name)}</span><button type="submit" class="booking-primary">Save look &amp; continue <span aria-hidden="true">→</span></button></footer>
    </form>
    <div class="booking-statusbar"><span>${APPEARANCE_CATALOG.faces.length} portraits · ${APPEARANCE_CATALOG.clothes.length} outfits</span><span>${dirty ? 'Unsaved changes · Save to apply' : canCancel ? 'Saved on this device' : 'Choose a look to continue'}</span></div>
  </section></main>`;
}

export function bindAppearanceControls({app,api,render}) {
  const on=(selector,event,fn)=>document.querySelectorAll(selector).forEach(el=>el.addEventListener(event,fn));
  const update=(values,focusSelector)=>{
    app.appearanceDraft={...(app.appearanceDraft || api.getAppearance() || {}),...values};
    render();document.querySelector(focusSelector)?.focus({preventScroll:true});
  };
  on('[data-appearance-tab]','click',e=>{
    app.appearanceTab=e.currentTarget.dataset.appearanceTab;render();
    document.querySelector(`[data-appearance-tab="${app.appearanceTab}"]`)?.focus({preventScroll:true});
  });
  on('[data-look-choice]','change',e=>{
    const form=e.currentTarget.form;
    update({face:form.elements.face.value,clothes:form.elements.clothes.value},`[name="${e.currentTarget.name}"]`);
  });
  on('[data-pick-face]','click',e=>{
    const face=e.currentTarget.dataset.pickFace;update({face},`[data-pick-face="${face}"]`);
  });
  on('[data-pick-clothes]','click',e=>{
    const clothes=e.currentTarget.dataset.pickClothes;update({clothes},`[data-pick-clothes="${clothes}"]`);
  });
  on('[data-preview-expr]','click',e=>{
    const expression=e.currentTarget.dataset.previewExpr;update({expression},`[data-preview-expr="${expression}"]`);
  });
}
