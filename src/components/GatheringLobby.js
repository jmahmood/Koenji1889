import {renderInvitationList, invitationUrl} from '../ui/invitations.js';
import {renderCharacter} from '../scene/Character.js';
import {escapeHtml as esc} from '../ui/presentation.js';
import {bookingTitlebar,bookingHero} from './GatheringSetup.js';

function renderEmptyChairSVG() {
  return `<svg class="booking-chair empty-chair-visual" viewBox="0 0 48 52" aria-hidden="true"><path d="M12 29V7h24v22M19 7v22M29 7v22" fill="#bf9972" stroke="#684c35" stroke-width="2"/><path d="M8 29h32v9H8z" fill="#9b4136" stroke="#684c35" stroke-width="2"/><path d="M12 38v11M36 38v11" stroke="#684c35" stroke-width="3"/></svg>`;
}

export function renderWaitingTable(app, view, api) {
  const storedCreator=api.getRoomDirectory()[app.roomCode]?.creator_token;
  const viewerSeat=view.viewer?.player_id ? view.seats?.find(s=>s.player_id===view.viewer.player_id) : null;
  const isSharedProfileGuest=Boolean(storedCreator && ((viewerSeat && !viewerSeat.is_host) || view.viewer?.role==='spectator'));
  const creator=isSharedProfileGuest && !app.showSharedHostControls ? null : storedCreator;
  const host=creator ? api.getHostInvitations(app.roomCode) : null;
  const claimedCount=view.seats.filter(s=>s.claimed).length;
  const totalSeats=view.max_players || view.seats.length;
  const stamps=view.club?.stamps || {};
  const tab=app.lobbyTab || 'invitations';
  const ownSeatForm=viewerSeat ? `<form data-name-seat class="booking-seat-form"><label class="booking-field">${viewerSeat.claimed ? 'Your display name' : 'Your name'}<input name="player_name" required maxlength="60" value="${esc(view.viewer.player_name || viewerSeat.name)}"></label><button class="${viewerSeat.claimed ? '' : 'booking-primary'}" type="submit">${viewerSeat.claimed ? 'Update name' : 'Take your seat →'}</button></form>` : '';

  return `<main class="waiting-club booking-lobby"><section class="booking-window booking-lobby-window" aria-label="Gathering lobby">
    ${bookingTitlebar()}
    ${bookingHero(creator ? 'Your table is ready' : 'Welcome to the table',`${view.gathering_title} · ${totalSeats} players`)}
    <div class="booking-lobby-meta"><span>Host · <strong>${esc(view.host?.name || 'Club Host')}</strong></span><span>Room <b>${esc(view.room_code)}</b></span></div>
    <div class="character-event-notice" data-character-notice data-notice-id="${esc(app.characterNoticeId || '')}" role="status" aria-live="polite">${app.characterNotice || ''}</div>
    ${app.errorBanner ? `<p class="booking-alert" role="alert">${esc(app.errorBanner)}</p>` : ''}
    ${viewerSeat && !viewerSeat.claimed ? `<div class="booking-body booking-claim-prompt"><h2 class="booking-section-heading">A seat is reserved for you</h2><p class="booking-hint">Confirm your name to join this gathering.</p>${ownSeatForm}</div>` : ''}
    <nav class="booking-tabs" aria-label="Table options">${[['invitations',creator ? 'Invitations' : 'Players'],['social','At the table'],['advanced','Advanced']].map(([id,label])=>`<button type="button" data-lobby-tab="${id}" aria-current="${tab===id ? 'page' : 'false'}">${label}</button>`).join('')}</nav>
    <div class="booking-body" ${tab!=='invitations' ? 'hidden' : ''}>
      <div class="booking-readiness lobby-readiness-bar" aria-label="Seats claimed readiness"><strong>${claimedCount} of ${totalSeats} seats claimed</strong><span>${view.can_start ? '✓ All seats claimed' : `${totalSeats-claimedCount} still to join`}</span><div class="booking-progress" aria-hidden="true">${view.seats.map(s=>`<i class="${s.claimed ? 'is-claimed' : ''}"></i>`).join('')}</div></div>
      <div class="booking-roster">${view.seats.map(s=>{
        const seatToken=host?.player_tokens?.[s.seat_index];
        const seatFace=(host?.seats?.[s.seat_index]?.appearance || s.appearance)?.face;
        const inviteHref=seatToken ? invitationUrl(location.origin+location.pathname,app.roomCode,seatToken,'player',seatFace) : '';
        const isYou=Boolean(view.viewer?.player_id && s.player_id===view.viewer.player_id);
        const portrait=s.claimed || s.appearance_configured ? renderCharacter(view.members?.[s.player_id]?.appearance || s.appearance,{memberId:s.member_id,name:s.name,surface:'portrait',expression:s.online ? 'smile' : 'neutral'}) : renderEmptyChairSVG();
        return `<article class="booking-roster-row ${s.claimed ? 'is-claimed' : ''}">
          <span class="booking-seat-number" aria-label="Seat ${s.seat_index+1}">${s.seat_index+1}</span>
          ${isYou ? `<button type="button" class="booking-portrait booking-portrait-button" data-edit-look aria-label="Change your appearance" title="Change your appearance">${portrait}</button>` : `<div class="booking-portrait">${portrait}</div>`}
          <div class="booking-seat-name"><strong>${esc(s.name)} ${s.is_host ? '<span class="host-badge">Host</span>' : ''}</strong>${stamps[s.player_id] ? '<span class="chair-stamp-seal">Card stamped ✓</span>' : ''}</div>
          <div class="booking-seat-status"><span class="${s.claimed ? 'booking-joined' : 'booking-pending'}">${s.claimed ? '✓' : '○'} ${isYou ? 'You · ' : ''}${s.claimed ? 'Joined' : 'Not joined'}</span>${s.claimed ? `<small>${s.online ? '● Online now' : 'Away · seat stays claimed'}</small>` : ''}</div>
          <div class="booking-invite-action">${!s.claimed && creator ? (inviteHref ? `<button type="button" data-copy-invite="${esc(inviteHref)}" aria-label="Copy invitation for ${esc(s.name)}"><span aria-hidden="true">✉</span> Copy invitation</button><label class="booking-invite-fallback" data-invite-fallback ${app.inviteFallback===inviteHref ? '' : 'hidden'}>Copy this private invitation<input name="invite_${s.seat_index}" readonly aria-label="${esc(s.name)} private invitation" value="${esc(inviteHref)}"></label>` : '<button type="button" data-load-invitations>Load invitation</button>') : '<span class="booking-hint" aria-hidden="true">—</span>'}</div>
        </article>`;
      }).join('')}</div>
      <div class="booking-invitation-tip"><span class="booking-envelope" aria-hidden="true">✉</span><div><strong>${creator ? 'Send each invitation privately.' : 'Make yourself at home.'}</strong><p>${creator ? 'Friends can claim their seats at different times.' : 'The host will open the ledger once every seat is claimed.'}</p></div>${creator ? '<button type="button" data-lobby-tab="advanced">Manage seats</button>' : '<button type="button" data-edit-look>Change appearance</button>'}</div>
    </div>
    <div class="booking-body" ${tab!=='social' ? 'hidden' : ''}><h2 class="booking-section-heading">At the table</h2><div class="booking-table-notes">${view.club?.notes?.length ? view.club.notes.map(n=>`<p><b>${esc(n.author)}</b> · ${esc(n.text)}</p>`).join('') : '<p class="booking-hint">The kettle’s on. Leave a note for your friends.</p>'}</div>${view.viewer.player_id ? `<form data-waiting-note class="booking-seat-form"><label class="booking-field">Table note<input name="text" required maxlength="160" placeholder="Tea is ready…"></label><button type="submit">Leave a note</button></form><button type="button" data-waiting-stamp ${stamps[view.viewer.player_id] ? 'disabled' : ''}>${stamps[view.viewer.player_id] ? 'Membership card stamped ✓' : 'Stamp your membership card'}</button>` : '<p class="booking-hint">You’re visiting as an observer.</p>'}</div>
    <div class="booking-body booking-advanced" ${tab!=='advanced' ? 'hidden' : ''}>
      <h2 class="booking-section-heading">Your preferences</h2><div class="booking-button-group"><button type="button" data-open-gathering>Host or join another game</button><button type="button" data-edit-look>Change appearance</button><button type="button" data-lobby-refresh>Refresh table</button><button type="button" data-action="motion">Motion: ${app.skipMotion ? 'Off' : 'On'}</button></div>
      ${viewerSeat?.claimed ? ownSeatForm : ''}
      ${isSharedProfileGuest ? `<details class="booking-details shared-profile-notice" data-testid="shared-profile-notice"><summary>Shared browser profile</summary><strong>Shared Browser Profile · Viewing as ${esc(view.viewer.player_name || view.viewer.player_id || 'Observer')} (${esc(viewerSeat ? `Seat ${viewerSeat.seat_index+1}` : 'Spectator')})</strong><p>This profile also stores the host credentials. Host controls stay hidden in this guest tab. Use separate browser profiles for independent players.</p><button type="button" data-toggle-shared-host data-testid="toggle-shared-host-btn">${app.showSharedHostControls ? 'Hide host controls in this tab' : 'Show host controls in this tab'}</button></details>` : ''}
      ${creator ? `<h2 class="booking-section-heading">Host gathering controls</h2><details class="booking-details"><summary>Seating order</summary><p>Names, portraits and invitations follow each person.</p><div class="booking-reorder-list">${view.seats.map(s=>`<div><span>${s.seat_index+1}. ${esc(s.name)}</span><button type="button" data-reorder-seat="${s.seat_index}" ${s.seat_index===0 ? 'disabled' : ''}>Move earlier ↑</button></div>`).join('')}</div><button type="button" data-shuffle-seats>Randomize seating</button></details>
      <details class="booking-details"><summary>Portraits &amp; observer invitation</summary>${host ? renderInvitationList(app.roomCode,host) : '<button type="button" data-load-invitations>Retrieve seat invitations</button>'}</details>
      <details class="booking-details"><summary>House resident entrances</summary><p>Names and portraits do not assign entrance roles.</p>${[...view.seats,...(view.host?.member_id==='creator' ? [view.host] : [])].map(s=>`<label class="booking-field">${esc(s.name)}<select data-resident-route="${esc(s.member_id)}">${[['door','Guest · front door'],['kitchen','Yumiko · kitchen'],['bedroom','Owner · downstairs bedroom']].map(([id,label])=>`<option value="${id}" ${s.arrival_route===id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`).join('')}</details>` : ''}
    </div>
    <footer class="booking-actions booking-lobby-footer"><div><strong>${view.can_start ? 'Everyone has a seat.' : 'Waiting for your friends.'}</strong><p class="booking-hint">${view.can_start ? 'Claimed seats stay ready even when players are away.' : 'The host opens the ledger once every seat is claimed.'}</p></div>${creator ? `<button type="button" class="booking-primary" data-start-gathering ${view.can_start && !app.startingGathering ? '' : 'disabled'}>Open host ledger <span aria-hidden="true">→</span></button>` : `<span class="booking-host-wait">${view.can_start ? 'Waiting for the host to start' : 'Your table is saved'}</span>`}</footer>
    <div class="booking-statusbar"><span>${claimedCount} of ${totalSeats} seats claimed</span><span role="status" aria-live="polite">${esc(app.notice || `1889 · ${totalSeats} players`)}</span></div>
  </section></main>`;
}

export function bindWaitingTable({app,api,render,refresh,enterRoom,toast}) {
  const on=(sel,event,fn)=>document.querySelectorAll(sel).forEach(el=>el.addEventListener(event,fn));
  const request=async(suffix,body,creator=false)=>{
    try {await api.request(`/api/1889/games/${app.roomCode}/${suffix}`,{method:'POST',token:creator ? api.getRoomDirectory()[app.roomCode]?.creator_token : app.token,body});await refresh();return true;}
    catch(e){toast(e.message,true);return false;}
  };
  on('[data-lobby-tab]','click',e=>{app.lobbyTab=e.currentTarget.dataset.lobbyTab;render();document.querySelector(`[data-lobby-tab="${app.lobbyTab}"]`)?.focus({preventScroll:true});});
  on('[data-toggle-shared-host]','click',()=>{app.showSharedHostControls=!app.showSharedHostControls;render();});
  on('[data-resident-route]','change',e=>request('resident',{member_id:e.target.dataset.residentRoute,arrival_route:e.target.value},true));
  on('[data-lobby-refresh]','click',refresh);
  on('[data-name-seat]','submit',e=>{e.preventDefault();request('seat',{player_name:new FormData(e.currentTarget).get('player_name')});});
  on('[data-waiting-stamp]','click',()=>request('club',{action:'stamp_card'}));
  on('[data-waiting-note]','submit',e=>{e.preventDefault();const text=new FormData(e.currentTarget).get('text');e.currentTarget.querySelector('input').value='';request('club',{action:'table_note',text,author:app.liveViewData.viewer.player_name});});
  const invitations=async()=>{try{await api.loadHostInvitations(app.roomCode);render();}catch(e){toast(e.message,true);}};
  on('[data-load-invitations]','click',invitations);
  on('[data-copy-invite]','click',async e=>{
    const button=e.currentTarget,href=button.dataset.copyInvite;
    try {
      if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(href);app.inviteFallback=null;toast('Private invitation copied. Send it to this person only.');
    } catch {
      app.inviteFallback=href;
      toast('Copy the private invitation shown below the button.');
      const current=[...document.querySelectorAll('[data-copy-invite]')].find(el=>el.dataset.copyInvite===href);
      const input=current?.parentElement.querySelector('.booking-invite-fallback input');
      input?.focus();input?.select();
    }
  });
  on('[data-reorder-seat]','click',async e=>{const index=Number(e.currentTarget.dataset.reorderSeat),order=app.liveViewData.seats.map(s=>s.seat_index);[order[index-1],order[index]]=[order[index],order[index-1]];await request('seating',{order},true);await invitations();});
  on('[data-shuffle-seats]','click',async()=>{const order=app.liveViewData.seats.map(s=>s.seat_index);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}await request('seating',{order},true);await invitations();});
  on('[data-start-gathering]','click',async()=>{if(app.startingGathering)return;app.startingGathering=true;render();await request('start',{},true);app.startingGathering=false;render();});
}
