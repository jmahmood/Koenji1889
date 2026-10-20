import {escapeHtml as esc} from '../ui/presentation.js';
import {renderCharacter} from '../scene/Character.js';
import {renderInvitationList} from '../ui/invitations.js';

export const bookingTrain = `<svg viewBox="0 0 32 24" fill="currentColor" aria-hidden="true"><path d="M5 4h11v8h8V8h3v4h2v6H3v-7h2zm3 2v5h5V6zM2 20h28v2H2z"/><circle cx="8" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><circle cx="26" cy="18" r="3"/></svg>`;

export function bookingTitlebar(close=false) {
  return `<header class="booking-titlebar"><span>${bookingTrain} KOENJI RAILWAY CLUB <span class="booking-year">· 1889</span></span>${close ? '<button type="button" class="close-modal-btn booking-close" data-close-modal="true" aria-label="Close game setup">×</button>' : '<span class="booking-title-emblem" aria-hidden="true">✦</span>'}</header>`;
}

export function bookingHero(title,subtitle) {
  return `<div class="booking-hero"><div class="booking-hero-copy"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></div>`;
}

export function gatheringDraft(app) {
  if (!app.gatheringDraft || (app.nextNames && app.nextNames!==app.gatheringDraft.sourceNames)) {
    const names=(app.nextNames || '').split('\n').map(n=>n.trim()).filter(Boolean);
    app.gatheringDraft={title:'Autumn Koenji Session',count:names.length || 5,names,playing:true,hostName:'Club Host',hostRoute:'door',sourceNames:app.nextNames};
  }
  return app.gatheringDraft;
}

export function renderGatheringSetup(app,api) {
  if (app.activeModal!=='gathering' && !app.needsGathering) return '';
  const draft=gatheringDraft(app),tab=app.gatheringTab || 'host';
  const rooms=Object.values(api.getRoomDirectory()).filter(r=>r.own_session);
  const view=app.liveViewData,viewer=view?.viewer;
  const viewerSeat=view?.seats?.find(s=>s.player_id && s.player_id===viewer?.player_id);
  const mayManage=!view || viewer?.role==='creator' || viewerSeat?.is_host || view.members?.[viewer?.player_id]?.is_host || app.showSharedHostControls;
  const host=mayManage ? api.getHostInvitations(app.roomCode) : null;
  const ownName=draft.playing ? draft.names[0] || app.liveViewData?.viewer?.player_name || 'Your player' : draft.hostName || 'Club Host';
  return `<div class="modal-backdrop booking-backdrop"><section class="modal-card booking-window booking-setup" role="dialog" aria-modal="true" aria-label="Arrange or join a game">
    ${bookingTitlebar(Boolean(app.liveViewData))}
    ${bookingHero('Arrange a game','A table for friends, near or far.')}
    <nav class="booking-tabs" aria-label="Game setup">
      ${[['host','Host a game'],['join','Join a game'],['advanced','Advanced']].map(([id,label])=>`<button type="button" data-gathering-tab="${id}" aria-current="${tab===id ? 'page' : 'false'}">${label}</button>`).join('')}
    </nav>
    ${app.errorBanner ? `<p class="booking-alert" role="alert">${esc(app.errorBanner)}</p>` : ''}
    <form data-create-gathering>
      <div class="booking-body" ${tab!=='host' ? 'hidden' : ''}>
        <div class="booking-identity"><div class="booking-portrait">${renderCharacter(api.getAppearance?.(),{name:ownName,surface:'portrait'})}</div><strong>${esc(ownName)}</strong><button type="button" data-edit-look>Change appearance</button></div>
        <h2 id="booking-heading" class="booking-section-heading">Your table</h2>
        <label class="booking-field">Game name<input name="title" data-gathering-draft="title" maxlength="100" required value="${esc(draft.title)}"></label>
        <div class="booking-players"><fieldset><legend>Players</legend><div class="booking-player-count">${[2,3,4,5,6].map(n=>`<button type="button" data-player-count="${n}" aria-pressed="${draft.count===n}">${n}</button>`).join('')}</div></fieldset><label class="booking-check"><input name="playing" data-gathering-draft="playing" type="checkbox" ${draft.playing ? 'checked' : ''}> I’m playing too</label></div>
        <h2 class="booking-section-heading">Reserve seats for friends</h2><p class="booking-hint">Each person gets a private invitation.</p>
        <div class="booking-name-list">${Array.from({length:draft.count},(_,i)=>`<label class="booking-name-row"><span class="booking-seat-number" aria-hidden="true">${i+1}</span><span class="sr-only">${i===0 && draft.playing ? 'Your name' : `Player ${i+1} name`}</span><input name="player_${i}" data-player-name="${i}" required maxlength="60" autocomplete="off" placeholder="${i===0 && draft.playing ? 'Your name' : `Player ${i+1} name`}" value="${esc(draft.names[i] || '')}">${i===0 && draft.playing ? '<span class="booking-you">You</span>' : ''}</label>`).join('')}</div>
      </div>
      <div class="booking-body booking-advanced" ${tab!=='advanced' ? 'hidden' : ''}>
        <h2 class="booking-section-heading">Host preferences</h2>
        <p class="booking-hint">The usual settings are already selected. These are optional.</p>
        <label class="booking-field">Host name when you’re not playing<input name="host_name" data-gathering-draft="hostName" maxlength="60" value="${esc(draft.hostName)}"></label>
        <label class="booking-field">Your entrance<select name="host_route" data-gathering-draft="hostRoute">${[['door','Guest · front door'],['kitchen','Yumiko · kitchen'],['bedroom','Owner · downstairs bedroom']].map(([id,label])=>`<option value="${id}" ${draft.hostRoute===id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <button type="button" data-action="motion">Motion: ${app.skipMotion ? 'Off' : 'On'}</button>
        <details class="booking-details"><summary>Development sandbox</summary><p>Opens a separate test game with demo controls.</p><div class="booking-button-group">${['auction_start','stock_round_1','stock_round_active','operating_round_1','route_planning','route_network_3','route_network_4'].map(p=>`<button type="button" data-open-sandbox="${p}">${esc(p.replaceAll('_',' '))}</button>`).join('')}</div></details>
        ${host ? `<details class="booking-details"><summary>Current table · portraits &amp; observer invitation</summary>${renderInvitationList(app.roomCode,host)}</details>` : ''}
        <button type="button" data-gathering-tab="host">← Back to your table</button>
      </div>
      <footer class="booking-actions" ${tab!=='host' ? 'hidden' : ''}>${app.liveViewData ? '<button type="button" data-close-modal="true">← Back to table</button>' : '<span class="booking-hint">1889 · A gathering for 2–6 friends</span>'}<button class="booking-primary" type="submit" ${app.creatingGathering ? 'disabled' : ''}>${app.creatingGathering ? 'Creating table…' : 'Create table <span aria-hidden="true">→</span>'}</button></footer>
    </form>
    <div ${tab!=='join' ? 'hidden' : ''}>
      <div class="booking-body"><h2 class="booking-section-heading">Find your table</h2><p class="booking-hint">Paste the invitation your host sent you, or enter a room code.</p>
        <form data-join-gathering><label class="booking-field">Invitation or room code<input name="invitation" required autocomplete="off" placeholder="Paste invitation or enter 6-letter code" value="${esc(app.joinInvitation || '')}"></label><button class="booking-primary" type="submit">Join game <span aria-hidden="true">→</span></button></form>
        ${app.publicLobby ? `<section class="booking-open-seats"><h2 class="booking-section-heading">Open seats · ${esc(app.publicLobby.room_code)}</h2>${app.publicLobby.seats.filter(s=>!s.claimed).map(s=>`<form class="booking-claim-row" data-claim-seat="${s.seat_index}"><label>Seat ${s.seat_index+1}<input name="player_name" required maxlength="60" value="${esc(s.name)}"></label><button type="submit">Claim seat</button></form>`).join('') || '<p>All seats have been claimed. Ask the host for your invitation.</p>'}</section>` : ''}
        <h2 class="booking-section-heading">Your recent tables</h2><div class="booking-recent">${rooms.length ? rooms.reverse().map(r=>`<button type="button" data-rejoin-room="${esc(r.room_code)}"><span>${esc(r.title || 'Koenji gathering')}<small>${esc(r.room_code)}</small></span><span aria-hidden="true">→</span></button>`).join('') : '<p class="booking-hint">Your tables will appear here after you host or join a game.</p>'}</div>
      </div>
    </div>
    <div class="booking-statusbar"><span>1889 · ${draft.count} players</span><span role="status" aria-live="polite">${esc(app.notice || 'Private invitations')}</span></div>
  </section></div>`;
}

export function bindGatheringSetup({app,render}) {
  const on=(sel,event,fn)=>document.querySelectorAll(sel).forEach(el=>el.addEventListener(event,fn));
  const draft=gatheringDraft(app);
  on('[data-gathering-draft]','input',e=>{const el=e.currentTarget;draft[el.dataset.gatheringDraft]=el.type==='checkbox' ? el.checked : el.value;});
  on('[data-player-name]','input',e=>{draft.names[Number(e.currentTarget.dataset.playerName)]=e.currentTarget.value;});
  on('[data-gathering-draft="playing"]','change',()=>render());
  on('[data-gathering-tab]','click',e=>{app.gatheringTab=e.currentTarget.dataset.gatheringTab;render();document.querySelector(`[data-gathering-tab="${app.gatheringTab}"]`)?.focus({preventScroll:true});});
  on('[data-player-count]','click',e=>{draft.count=Number(e.currentTarget.dataset.playerCount);render();document.querySelector(`[data-player-count="${draft.count}"]`)?.focus({preventScroll:true});});
  on('[data-join-gathering] input','input',e=>{app.joinInvitation=e.currentTarget.value;});
}
