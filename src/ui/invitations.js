import {APPEARANCE_CATALOG, renderCharacter} from '../scene/Character.js';
import {escapeHtml as esc} from './presentation.js';

export const isPortraitFace=face=>APPEARANCE_CATALOG.faces.some(f=>f.id===face);

export function invitationUrl(origin,room,token,role='player',face=null) {
  const url=new URL(origin);
  url.search='';
  const hash=new URLSearchParams({room,token,role});
  if(role==='player' && isPortraitFace(face)) hash.set('face',face);
  url.hash=hash.toString();
  return url.toString();
}

export function renderInvitationList(room,host) {
  const origin=location.origin+location.pathname;
  return `<div class="invitation-list"><p>Choose a portrait for each person before sharing their invitation. They can change their look after joining.</p>${host.player_tokens.map((token,i)=>{
    const seat=host.seats[i],face=seat.appearance?.face;
    return `<article class="invitation-person">
      <div class="invitation-portrait">${face ? renderCharacter(seat.appearance,{name:seat.name,surface:'portrait'}) : '<span>Recipient chooses</span>'}</div>
      <div class="invitation-fields"><strong>${esc(seat.name)}</strong>${token ? `
        <label>Portrait for ${esc(seat.name)}<select data-invitation-face="${esc(seat.member_id)}" aria-label="Portrait for ${esc(seat.name)}">
          <option value="">Recipient chooses</option>${APPEARANCE_CATALOG.faces.map(f=>`<option value="${f.id}" ${face===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}
        </select></label>
        <label>${esc(seat.name)} invitation<input readonly aria-label="${esc(seat.name)} invitation" value="${esc(invitationUrl(origin,room,token,'player',face))}"></label>
      ` : '<p>Seat claimed · this member controls their look.</p>'}</div>
    </article>`;
  }).join('')}
    <label>Observer invitation<input readonly aria-label="Observer invitation" value="${esc(invitationUrl(origin,room,host.spectator_token,'spectator'))}"></label>
  </div>`;
}
