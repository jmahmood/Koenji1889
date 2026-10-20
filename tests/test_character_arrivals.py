"""Social identity and arrival events must not mutate the game journal."""
import json
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from server_bridge import KoenjiDatabase, KoenjiAppService, DEFAULT_APPEARANCE, APPEARANCE_CATALOG, new_game


class CharacterArrivalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = KoenjiDatabase(Path(self.tmp.name) / 'club.sqlite3')
        self.svc = KoenjiAppService(self.db)
        status, self.room = self.svc.handle('POST', '/api/1889/games', {
            'max_players': 2, 'lobby': True, 'player_names': ['Alice', 'Yumiko'], 'host_playing': True})
        self.assertEqual(status, 200)
        self.base = '/api/1889/games/' + self.room['room_code']
        self.a, self.b = self.room['player_tokens']
        self.host = self.room['creator_token']
        self.look = {'face': 'reference-05', 'clothes': 'plum-kimono'}

    def tearDown(self):
        self.tmp.cleanup()

    def req(self, method='GET', suffix='', body=None, token=None):
        return self.svc.handle(method, self.base + suffix, body, 'Bearer ' + (token or self.a))

    def claim(self, token, name):
        self.assertEqual(self.req('POST', '/seat', {'player_name': name}, token)[0], 200)

    def arrive(self, token=None, **extra):
        return self.req('POST', '/arrival', dict(appearance=self.look, **extra), token)

    def test_start_requires_claims_but_not_online_and_cannot_bypass_with_names(self):
        self.assertFalse(self.req()[1]['can_start'])
        self.assertEqual(self.req('POST', '/start', {'player_names': ['Alice','Yumiko']}, self.host)[0], 409)
        self.claim(self.a, 'Alice'); self.claim(self.b, 'Yumiko')
        with self.db._connect() as conn:
            conn.execute("UPDATE players SET last_seen_at='2000-01-01 00:00:00'")
            conn.commit()
        view = self.req(token=self.host)[1]
        self.assertTrue(view['can_start'])
        self.assertTrue(all(not seat['online'] for seat in view['seats']))
        self.assertEqual(self.req('POST', '/start', {}, self.a)[0], 403)
        self.assertEqual(self.req('POST', '/start', {}, self.host)[0], 200)

    def test_reordering_preserves_identity_look_host_route_and_credentials(self):
        self.claim(self.a, 'Alice'); self.claim(self.b, 'Yumiko')
        before = self.req()[1]; resident = before['members']['p2']['member_id']
        self.assertEqual(self.req('POST','/resident',{'member_id':resident,'arrival_route':'kitchen'},self.a)[0],403)
        self.assertEqual(self.req('POST','/resident',{'member_id':resident,'arrival_route':'kitchen'},self.host)[0],200)
        self.arrive(self.a); self.arrive(self.b)
        note=self.req('POST','/club',{'action':'table_note','author':'Yumiko','text':'Tea is ready'},self.a)[1]['club']['notes'][-1]
        self.assertEqual(note['actor_id'],'p1', 'Display text must never assign the acting member')
        self.req('POST', '/seating', {'order': [1, 0]}, self.host)
        view = self.req()[1]
        self.assertEqual(view['viewer']['player_id'], 'p2')
        self.assertEqual(view['club']['notes'][-1]['actor_id'],'p2')
        self.assertEqual(view['members']['p2']['member_id'], before['members']['p1']['member_id'])
        self.assertTrue(view['members']['p2']['is_host'])
        self.assertFalse(view['members']['p1']['is_host'])
        self.assertEqual(view['members']['p1']['arrival_route'], 'kitchen')
        self.assertEqual(view['members']['p2']['appearance'], self.look)
        self.assertEqual(self.req('POST','/start',{},self.host)[0],200)
        self.svc = KoenjiAppService(KoenjiDatabase(self.db.db_path))
        live = self.req()[1]
        self.assertTrue(live['members']['p2']['is_host'])
        self.assertEqual(live['members']['p1']['arrival_route'], 'kitchen')
        self.assertEqual(live['members']['p2']['appearance'], self.look)

    def test_tabs_and_polls_deduplicate_arrivals_returns_are_quiet_and_persistent(self):
        self.claim(self.a, 'Alice')
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.arrive(), range(2)))
        self.assertTrue(all(status == 200 for status, _ in results))
        events = self.req()[1]['arrival_events']
        self.assertEqual(len(events), 1); self.assertEqual(events[0]['kind'], 'arrived')
        for _ in range(3): self.arrive(); self.req()
        self.assertEqual(len(self.req()[1]['arrival_events']), 1)
        with self.db._connect() as conn:
            conn.execute('UPDATE gathering_members SET seen_at=?', ((datetime.now(timezone.utc)-timedelta(seconds=60)).isoformat(),))
            conn.commit()
        self.arrive()
        events = self.req()[1]['arrival_events']
        self.assertEqual([e['kind'] for e in events], ['arrived', 'returned'])
        self.assertEqual(events[0]['member_id'], events[1]['member_id'])
        self.arrive(); self.assertEqual(len(self.req()[1]['arrival_events']), 2)
        self.svc = KoenjiAppService(KoenjiDatabase(self.db.db_path))
        self.arrive(); self.assertEqual(len(self.req()[1]['arrival_events']), 2)

    def test_observer_appearance_is_separate_and_arrivals_leave_history_unchanged(self):
        self.claim(self.a, 'Alice'); self.claim(self.b, 'Yumiko')
        self.req('POST','/start',{},self.host)
        before = self.req()[1]
        for identity in ['browser-one-12345', 'browser-two-12345']:
            status, social = self.arrive(self.room['spectator_token'], browser_id=identity)
            self.assertEqual(status, 200)
        self.assertEqual(len(social['arrival_events']), 2)
        self.assertNotEqual(social['arrival_events'][0]['member_id'], social['arrival_events'][1]['member_id'])
        self.assertTrue(all(e['arrival_route']=='door' for e in social['arrival_events']))
        after = self.req()[1]
        self.assertEqual(before['state'], after['state'])
        self.assertEqual(before['history_events'], after['history_events'])
        self.assertEqual(self.req('GET','/revisions/0')[1]['arrival_events'], after['arrival_events'])
        self.assertEqual(self.req('POST','/claim',{'seat_index':0,'player_name':'Late'})[0],404)
        for secret in [self.host, self.a, self.b, self.room['spectator_token']]:
            self.assertNotIn(secret, json.dumps(social))

    def test_defaults_validation_and_nonplaying_host(self):
        view = self.req()[1]
        self.assertEqual(view['members']['p1']['appearance'], DEFAULT_APPEARANCE)
        self.assertEqual(self.arrive()[0],409)
        self.claim(self.a,'Alice')
        self.assertEqual(self.req('POST','/arrival',{'appearance':{'face':'bad','clothes':'bad'}})[0],422)
        self.assertEqual(self.req('POST','/arrival',{'appearance':self.look},self.room['spectator_token'])[0],422)
        status, room = self.svc.handle('POST','/api/1889/games',{'max_players':2,'lobby':True,'host_playing':False,'host_name':'Club Owner','host_route':'bedroom','player_names':['One','Two']})
        status, view = self.svc.handle('GET','/api/1889/games/'+room['room_code'],None,'Bearer '+room['creator_token'])
        self.assertEqual(view['host']['name'],'Club Owner')
        self.assertEqual(view['host']['member_id'],'creator')
        self.assertEqual(view['host']['arrival_route'],'bedroom')
        self.assertTrue(all(not m['is_host'] for m in view['members'].values()))

    def test_new_reference_portraits_persist_without_changing_game_history(self):
        self.claim(self.a, 'Alice')
        self.claim(self.b, 'Yumiko')
        self.assertEqual(self.req('POST', '/start', {}, self.host)[0], 200)
        before = self.req()[1]
        faces = [face for face in APPEARANCE_CATALOG['faces'] if face.get('headAtlas')]
        self.assertEqual(len(faces), 17)
        for face in faces:
            look = {'face': face['id'], 'clothes': 'charcoal-suit'}
            self.assertEqual(self.req('POST', '/arrival', {'appearance': look})[0], 200)
            self.svc = KoenjiAppService(KoenjiDatabase(self.db.db_path))
            view = self.req()[1]
            self.assertEqual(view['members']['p1']['appearance'], look)
            self.assertEqual(view['state'], before['state'])
            self.assertEqual(view['history_events'], before['history_events'])

    def test_legacy_database_upgrade_preserves_state_and_credentials(self):
        legacy = Path(self.tmp.name) / 'legacy.sqlite3'
        state = new_game(['Old One', 'Old Two'])
        with sqlite3.connect(legacy) as conn:
            conn.executescript("""
                CREATE TABLE games (id INTEGER PRIMARY KEY,room_code TEXT,variant TEXT,status TEXT,
                    creator_token TEXT,spectator_token TEXT,max_players INTEGER,engine TEXT,
                    created_at TEXT,updated_at TEXT);
                CREATE TABLE players (id INTEGER PRIMARY KEY,game_id INTEGER,player_name TEXT,
                    player_token TEXT,player_order INTEGER,is_spectator INTEGER,last_seen_at TEXT);
                CREATE TABLE game_states (id INTEGER PRIMARY KEY,game_id INTEGER,state_json TEXT,
                    move_number INTEGER,timestamp TEXT);
                INSERT INTO games VALUES (1,'LEGACY','1889','active','old-host','old-observer',2,'python',NULL,NULL);
                INSERT INTO players VALUES (10,1,'Old One','old-one',0,0,NULL);
                INSERT INTO players VALUES (11,1,'Old Two','old-two',1,0,NULL);
            """)
            conn.execute('INSERT INTO game_states VALUES (1,1,?,0,NULL)', (json.dumps(state),))
        service = KoenjiAppService(KoenjiDatabase(legacy))
        status, view = service.handle('GET','/api/1889/games/LEGACY',None,'Bearer old-one')
        self.assertEqual(status,200)
        self.assertEqual(view['state'],state)
        self.assertEqual(view['members']['p1']['appearance'],DEFAULT_APPEARANCE)
        self.assertEqual(view['arrival_events'],[])
        status, _ = service.handle('GET','/api/1889/games/LEGACY',None,'Bearer old-host')
        self.assertEqual(status,200)
