import {escapeHtml as esc} from './presentation.js';
import {renderCharacter} from '../scene/Character.js';
import {renderHouseEntrance} from '../scene/HouseEntrance.js';

// Cursor is scoped to a room/session, never a historical game revision.
export function unseenArrivals(events, cursor) {
  return [...events].filter(e=>Number.isSafeInteger(e.id)&&e.id>cursor).sort((a,b)=>a.id-b.id);
}
export function renderArrivalDock(event, {motion=true,pending=0,elapsed=0}={}) {
  return `<aside style="--arrival-delay:-${Math.max(0,Number(elapsed)||0)}s" class="arrival-dock" data-empty="${event ? 'false' : 'true'}" aria-label="Gathering arrivals"><div class="arrival-card ${event?.kind==='arrived'&&motion?'arrival-animated':''}">
    ${event?`${event.kind==='arrived'?`<div class="arrival-stage">${renderHouseEntrance(event.arrival_route)}${renderCharacter(event.appearance,{memberId:event.member_id,name:event.name,pose:'idle',surface:'arrival'})}</div>`:''}<div class="arrival-copy" role="status" aria-live="polite"><strong>${esc(event.name)} ${event.kind==='returned'?'returned':'arrived'}</strong><small>${event.kind==='returned'?'Back at the gathering':event.arrival_route==='kitchen'?'From the kitchen':event.arrival_route==='bedroom'?'From the downstairs bedroom':'Through the front door'}${pending?` · ${pending} more`:''}</small></div><button data-dismiss-arrival aria-label="Dismiss arrival">×</button>`:'<small class="arrival-empty">玄関 · Gathering arrivals</small>'}
    </div></aside>`;
}
