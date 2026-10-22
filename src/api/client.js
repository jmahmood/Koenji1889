import {isPortraitFace} from '../ui/invitations.js';
import {normalizeAppearance} from '../scene/Character.js';
import {RevisionCache} from './revisionCache.js';
/**
 * Transport & Session Client for Koenji Railway Club 1889.
 *
 * Talks to the authoritative Python 1889 backend (`/api/1889/...`),
 * manages per-tab authenticated seat credentials (`sessionStorage`) +
 * shared local room directory (`localStorage`) for effortless multi-window
 * testing, and coordinates `command_id` idempotency and revision locks.
 */

const ROOM_DIRECTORY_KEY = 'koenji_1889_rooms_v1';
const TAB_SESSION_KEY = 'koenji_1889_tab_session_v1';
const MEMBER_LOOKS_KEY = 'koenji_1889_member_looks_v1';

export class KoenjiApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.hostInvitations = new Map();
    this.appearanceContext=null;
    let storage=null;try {storage=globalThis.sessionStorage;} catch {}
    this.revisions=new RevisionCache({storage});
    this.channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('koenji-1889-room-sync')
        : null;
  }

  getAppearance() {
    if(this.appearanceContext) {
      // Tabs for the same member share edits; other members have separate keys.
      try {
        const shared=JSON.parse(localStorage.getItem(MEMBER_LOOKS_KEY) || '{}')?.[this.appearanceContext.key];
        if(shared) this.appearanceContext.appearance=normalizeAppearance(shared);
      } catch {}
      return {...this.appearanceContext.appearance};
    }
    try {
      const saved=JSON.parse(localStorage.getItem('koenji_1889_appearance_v1') || 'null');
      const session=typeof sessionStorage!=='undefined' ? JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || 'null') : null;
      if(isPortraitFace(session?.invite_face)) return normalizeAppearance({...saved,face:session.invite_face});
      return saved ? normalizeAppearance(saved) : null;
    } catch {return null;}
  }

  activateAppearance(room,token,view) {
    const member=view.members?.[view.viewer?.player_id] || (view.viewer?.role==='creator' ? view.host : null);
    const key=`${room}:${member?.member_id || `observer:${this.getBrowserId()}`}`;
    if(this.appearanceContext?.key===key) return;
    const saved=this.getAppearance();
    let remembered={};
    try {remembered=JSON.parse(localStorage.getItem(MEMBER_LOOKS_KEY) || '{}');} catch {}
    let appearance=member?.appearance_configured
      ? member.has_arrived ? member.appearance : {...saved,face:member.appearance.face}
      : remembered[key] || saved;
    this.appearanceContext={key,appearance:normalizeAppearance(appearance)};
    // The token's server-side preset wins over URL hints; consume hints only once.
    const session=JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || '{}');
    delete session.invite_face;
    sessionStorage.setItem(TAB_SESSION_KEY,JSON.stringify(session));
    this.rememberMemberAppearance();
  }

  rememberMemberAppearance() {
    if(!this.appearanceContext) return;
    let looks={};
    try {looks=JSON.parse(localStorage.getItem(MEMBER_LOOKS_KEY) || '{}');} catch {}
    looks[this.appearanceContext.key]=this.appearanceContext.appearance;
    localStorage.setItem(MEMBER_LOOKS_KEY,JSON.stringify(looks));
  }

  saveAppearance(value) {
    const appearance=normalizeAppearance(value);
    localStorage.setItem('koenji_1889_appearance_v1',JSON.stringify(appearance));
    if(this.appearanceContext) {this.appearanceContext.appearance=appearance;this.rememberMemberAppearance();}
    return appearance;
  }

  async setInvitationPortrait(room,memberId,face) {
    const token=this.getRoomDirectory()[room]?.creator_token;
    await this.request(`/api/1889/games/${encodeURIComponent(room)}/invitations`,
      {method:'POST',token,body:{member_id:memberId,face:face || null}});
    return this.loadHostInvitations(room);
  }

  getBrowserId() {
    let id=localStorage.getItem('koenji_1889_browser_id');
    if(!id) {
      // randomUUID is secure-context-only; getRandomValues also works on HTTP LANs.
      id=typeof crypto.randomUUID==='function'
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
      localStorage.setItem('koenji_1889_browser_id',id);
    }
    return id;
  }

  async arrive(room,token) {
    return this.request(`/api/1889/games/${encodeURIComponent(room)}/arrival`,{method:'POST',token,
      body:{appearance:this.getAppearance(),browser_id:this.getBrowserId()}});
  }

  getRoomDirectory() {
    try {
      return JSON.parse(localStorage.getItem(ROOM_DIRECTORY_KEY) || '{}');
    } catch {
      return {};
    }
  }

  saveRoomToDirectory(roomInfo) {
    if (!roomInfo || !roomInfo.room_code) return;
    const dir = this.getRoomDirectory();
    dir[roomInfo.room_code] = {
      room_code: roomInfo.room_code,
      creator_token: roomInfo.creator_token,
      spectator_token: roomInfo.spectator_token,
      player_tokens: roomInfo.player_tokens || [],
      seats: roomInfo.seats || [],
      preset: roomInfo.preset || 'custom',
      is_demo_fixture:true,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem(ROOM_DIRECTORY_KEY, JSON.stringify(dir));
    localStorage.setItem('koenji_1889_latest_room', roomInfo.room_code);
  }

  saveOwnRoom(roomCode, seatKey, token, { isHost = null, memberId = null } = {}) {
    const dir = this.getRoomDirectory();
    // Preserve explicit development bundles; ordinary rooms retain only this seat.
    if (!dir[roomCode]?.preset || dir[roomCode].preset === 'gathering') {
      const entry = dir[roomCode] || {};
      const existing = entry.own_session;
      const hostToken =
        entry.host_token ||
        (isHost === true ? token : null) ||
        (entry.creator_token && existing?.token ? existing.token : null);
      const hostMemberId =
        entry.host_member_id ||
        (isHost === true && memberId ? memberId : null);
      const isIncomingHost = Boolean(
        isHost === true ||
        seatKey === 'creator' ||
        (token && (token === entry.creator_token || token === hostToken)) ||
        (memberId && hostMemberId && memberId === hostMemberId)
      );
      const hasSavedHost = Boolean(
        existing?.token &&
        (entry.creator_token || entry.host_token || existing.is_host) &&
        (existing.token === hostToken || existing.token === entry.creator_token || existing.is_host)
      );
      const keepHostSession = Boolean(hasSavedHost && !isIncomingHost);
      const guestSessions = { ...(entry.guest_sessions || {}) };
      if (keepHostSession && seatKey && token) {
        for (const [k, v] of Object.entries(guestSessions)) {
          if (v === token && k !== seatKey) delete guestSessions[k];
        }
        guestSessions[seatKey] = token;
      } else if (isIncomingHost && token) {
        for (const [k, v] of Object.entries(guestSessions)) {
          if (v === token) delete guestSessions[k];
        }
      }
      const nextOwnSession = keepHostSession
        ? existing
        : {
            seat_key: seatKey,
            token,
            ...(isIncomingHost ? { is_host: true } : {}),
            ...(memberId || existing?.member_id ? { member_id: memberId || existing?.member_id } : {}),
          };
      dir[roomCode] = {
        ...entry,
        room_code: roomCode,
        preset: 'gathering',
        own_session: nextOwnSession,
        ...(hostToken || (isIncomingHost && token)
          ? { host_token: isIncomingHost && token ? token : hostToken }
          : {}),
        ...(hostMemberId ? { host_member_id: hostMemberId } : {}),
        ...(Object.keys(guestSessions).length ? { guest_sessions: guestSessions } : {}),
      };
      localStorage.setItem(ROOM_DIRECTORY_KEY, JSON.stringify(dir));
    }
    localStorage.setItem('koenji_1889_latest_room',roomCode);
  }

  rememberHostCredential(roomCode,token,hostSeatToken=null,hostMemberId=null) {
    const dir=this.getRoomDirectory();
    const existing=dir[roomCode] || {};
    const hostToken=hostSeatToken || existing.host_token || existing.own_session?.token || null;
    dir[roomCode]={
      ...existing,
      room_code:roomCode,
      creator_token:token,
      ...(hostToken ? {host_token:hostToken} : {}),
      ...(hostMemberId || existing.host_member_id ? {host_member_id:hostMemberId || existing.host_member_id} : {}),
      ...(existing.own_session && hostToken && existing.own_session.token===hostToken
        ? {own_session:{...existing.own_session,is_host:true}}
        : {}),
      preset:existing.preset || 'gathering',
    };
    localStorage.setItem(ROOM_DIRECTORY_KEY,JSON.stringify(dir));
  }

  getHostInvitations(roomCode) { return this.hostInvitations.get(roomCode) || null; }

  async loadHostInvitations(roomCode) {
    const token=this.getRoomDirectory()[roomCode]?.creator_token;
    const result=await this.request(`/api/1889/games/${roomCode}/invitations`,{token});
    this.hostInvitations.set(roomCode,result);
    const hostIdx=result?.seats?.findIndex(s=>s.is_host);
    if(hostIdx>=0 && result.player_tokens?.[hostIdx]) {
      this.saveOwnRoom(roomCode,`p${hostIdx+1}`,result.player_tokens[hostIdx],{isHost:true,memberId:result.seats[hostIdx].member_id});
    }
    return result;
  }

  async createWaitingRoom(names,title,playing=true,hostName="Club Host",hostRoute="door") {
    const room=await this.request('/api/1889/games',{method:'POST',body:{max_players:names.length,player_names:names,title,lobby:true,host_playing:playing,host_name:playing?names[0]:hostName,host_route:hostRoute}});
    const seat=playing?'p1':'creator',token=playing?room.player_tokens[0]:room.creator_token;
    this.saveOwnRoom(room.room_code,seat,token,{isHost:true});
    this.rememberHostCredential(room.room_code,room.creator_token,token);
    const dir=this.getRoomDirectory();dir[room.room_code].title=title;
    localStorage.setItem(ROOM_DIRECTORY_KEY,JSON.stringify(dir));
    if(playing) await this.request(`/api/1889/games/${room.room_code}/seat`,{method:'POST',token,body:{player_name:names[0]}});
    await this.loadHostInvitations(room.room_code);
    return {...room,seat_key:seat,token};
  }

  getLatestRoomBundle() {
    const dir = this.getRoomDirectory();
    const latestCode = localStorage.getItem('koenji_1889_latest_room');
    if (latestCode && dir[latestCode]) return dir[latestCode];
    const keys = Object.keys(dir);
    return keys.length ? dir[keys[keys.length - 1]] : null;
  }

  getTabSession() {
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const urlRoom = fragment.get('room') || params.get('room');
    const urlSeat = fragment.get('role') === 'creator' ? 'creator' : fragment.get('role') === 'spectator' ? 'spectator' : params.get('seat') || 'custom'; // e.g., p1, p2, p3, p4, spectator
    const urlToken = new URLSearchParams(window.location.hash.slice(1)).get('token') || params.get('token');

    if (urlRoom && (urlSeat || urlToken)) {
      const dir = this.getRoomDirectory();
      const bundle = dir[urlRoom];
      let resolvedToken = urlToken || (bundle?.own_session?.seat_key === urlSeat ? bundle.own_session.token : bundle?.guest_sessions?.[urlSeat] || null);
      if (!resolvedToken && bundle) {
        if (urlSeat === 'spectator') {
          resolvedToken = bundle.spectator_token;
        } else if (urlSeat === 'creator') {
          resolvedToken = bundle.creator_token;
        } else if (urlSeat && urlSeat.startsWith('p')) {
          const idx = parseInt(urlSeat.slice(1), 10) - 1;
          resolvedToken = bundle.player_tokens?.[idx];
        }
      }
      if (resolvedToken) {
        const sess = {
          room_code: urlRoom,
          seat_key: urlSeat || 'custom',
          token: resolvedToken,
        };
        this.setTabSession(sess.room_code, sess.seat_key, sess.token, fragment.get('face') || params.get('face'));
        this.saveOwnRoom(sess.room_code, sess.seat_key, sess.token);
        return sess;
      }
    }

    try {
      const existing = JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || 'null');
      if (existing && existing.room_code && existing.token) {
        return existing;
      }
    } catch {
      // ignore
    }
    return null;
  }

  setTabSession(roomCode, seatKey, token, invitationFace=null) {
    let old=null;try {old=JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || 'null');} catch {}
    const same=old?.room_code===roomCode && old?.token===token;
    if(!same) this.appearanceContext=null;
    const face=isPortraitFace(invitationFace) ? invitationFace : same ? old.invite_face : null;
    const sess = { room_code: roomCode, seat_key: seatKey, token, ...(isPortraitFace(face)?{invite_face:face}:{}) };
    sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(sess));
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    url.searchParams.set('seat', seatKey);
    url.searchParams.delete('token');
    url.searchParams.delete('face');
    url.hash = '';
    window.history.replaceState({}, '', url.toString());
    return sess;
  }

  async request(path, { method = 'GET', token = null, body = undefined } = {}) {
    const headers = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = { detail: `HTTP ${response.status}` };
    }
    if (!response.ok) {
      const message =
        typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail || data);
      const err = new Error(message);
      err.status = response.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async fetchCatalog() {
    return this.request('/api/1889/catalog');
  }

  async createFixtureRoom(
    preset = 'stock_round_1',
    playerNames = ['Daisuke', 'Haruka', 'Kenji', 'Alex']
  ) {
    const res = await this.request('/api/1889/dev/fixture', {
      method: 'POST',
      body: { preset, player_names: playerNames },
    });
    this.saveRoomToDirectory(res);
    this.notifyPeers(res.room_code, res.view?.state?.revision || 0);
    return res;
  }

  async createAndStartRoom(playerNames = ['Daisuke', 'Haruka', 'Kenji', 'Alex']) {
    const room = await this.request('/api/1889/games', {
      method: 'POST',
      body: { max_players: playerNames.length },
    });
    const view = await this.request(
      `/api/1889/games/${encodeURIComponent(room.room_code)}/start`,
      {
        method: 'POST',
        token: room.creator_token,
        body: { player_names: playerNames },
      }
    );
    const bundle = {
      ...room,
      seats: playerNames.map((name, i) => ({
        player_id: `p${i + 1}`,
        name,
        token: room.player_tokens[i],
        order: i,
      })),
      preset: 'auction_start',
      view,
    };
    this.hostInvitations.set(room.room_code,bundle);
    this.saveOwnRoom(room.room_code, 'p1', room.player_tokens[0]);
    this.notifyPeers(room.room_code, 0);
    return bundle;
  }

  async fetchGameView(roomCode, token) {
    return this.request(`/api/1889/games/${encodeURIComponent(roomCode)}`, {
      method: 'GET',
      token,
    });
  }

  async fetchRevisionView(roomCode, token, revision) {
    return this.revisions.read(roomCode,token,revision,()=>this.request(
      `/api/1889/games/${encodeURIComponent(roomCode)}/revisions/${revision}`,
      {
        method: 'GET',
        token,
      }
    ));
  }

  async submitAction(roomCode, token, expectedRevision, action, commandId = null) {
    const cid =
      commandId ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    const res = await this.request(
      `/api/1889/games/${encodeURIComponent(roomCode)}/actions`,
      {
        method: 'POST',
        token,
        body: {
          command_id: cid,
          expected_action_id: expectedRevision,
          expected_revision: expectedRevision,
          action,
        },
      }
    );
    this.notifyPeers(roomCode, res.state?.revision);
    return res;
  }

  async submitClubAction(roomCode, token, payload) {
    const res = await this.request(
      `/api/1889/games/${encodeURIComponent(roomCode)}/club`,
      {
        method: 'POST',
        token,
        body: payload,
      }
    );
    this.notifyPeers(roomCode, null);
    return res;
  }

  notifyPeers(roomCode, revision) {
    if (this.channel) {
      this.channel.postMessage({ room_code: roomCode, revision, ts: Date.now() });
    }
  }
}
