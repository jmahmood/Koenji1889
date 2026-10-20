import catalogue from '../data/appearance.json' with {type: 'json'};
import {escapeHtml as esc} from '../ui/presentation.js';
import {
  SURFACE_CROPS,
  resolvePoseAndExpression,
  renderTorso,
  renderHead,
  renderForeground,
} from './paperDollArt.js';

export const APPEARANCE_CATALOG = {...catalogue,faces:catalogue.faces.filter(face=>face.headAtlas)};
export const DEFAULT_APPEARANCE = {face:'reference-01',clothes:'indigo-haori'};
export function normalizeAppearance(value) {
  return {
    face: APPEARANCE_CATALOG.faces.some(f=>f.id===value?.face) ? value.face : DEFAULT_APPEARANCE.face,
    clothes: catalogue.clothes.some(c=>c.id===value?.clothes) ? value.clothes : DEFAULT_APPEARANCE.clothes,
  };
}

let presentationFor = () => null;
export function setCharacterPresentationResolver(resolve) { presentationFor=resolve; }

// Timer cuts replace only SVG character slots, preserving forms and focus.
export function refreshCharacterSlots(root=document) {
  root.querySelectorAll('[data-character-member]').forEach(slot=>{
    const options=JSON.parse(slot.dataset.characterBase);
    const next=presentationFor(options.memberId);
    if((next?.key || '')===slot.dataset.characterFrame) return;
    slot.outerHTML=renderCharacter({face:slot.dataset.face,clothes:slot.dataset.clothes},options);
  });
}

// One common registration point for preview, arrivals, portraits and seated poses.
// Uses the 3-Layer Inverted Paper-Doll stack with Semi-Photorealistic Head Layer (`Layer 2`),
// 12 customizable Meiji costumes (`Layer 1 + Layer 3`), 16 body poses, and separable props.
export function renderCharacter(value, options={}) {
  const {
  memberId=null,
  name='Member',
  pose='idle',
  expression=null,
  surface='table',
  props=null,
  motion=false,
  headMode='photoreal',
  assetBase='/assets/koma-sprites/photoreal-heads',
}=options;
  const active=memberId ? presentationFor(memberId) : null;
  const shownPose=active?.pose || pose;
  const shownExpression=active?.expression || expression;
  const shownProps=active ? active.props : props;
  const a=normalizeAppearance(value);
  const f=APPEARANCE_CATALOG.faces.find(f=>f.id===a.face) || APPEARANCE_CATALOG.faces[0];
  const c=catalogue.clothes.find(c=>c.id===a.clothes) || catalogue.clothes[0];
  const {pose: resolvedPose, expression: resolvedExpr} = resolvePoseAndExpression(shownPose, shownExpression);
  const viewBox = SURFACE_CROPS[surface] || SURFACE_CROPS.table;

  const layer1 = renderTorso(c.id, resolvedPose);
  const layer2 = renderHead(f, resolvedExpr, { rawPose: resolvedPose, assetBase, mode: headMode });
  const layer3 = renderForeground(f, c.id, resolvedPose, shownProps);

  return `<div class="custom-character ${motion?'koma-character':''} pose-${esc(shownPose)} expr-${esc(resolvedExpr)} surface-${esc(surface)}" ${memberId ? `data-character-member="${esc(memberId)}" data-character-base="${esc(JSON.stringify(options))}" data-character-frame="${esc(active?.key || '')}"` : ''} data-face="${a.face}" data-clothes="${a.clothes}" data-pose="${esc(resolvedPose)}" data-expression="${esc(resolvedExpr)}">
    <svg viewBox="${viewBox}" role="img" aria-label="${esc(name)} · ${esc(f.name)}, ${esc(c.name)}">
      <g class="character-body">
        ${layer1}
        ${layer2}
        ${layer3}
      </g>
    </svg></div>`;
}
