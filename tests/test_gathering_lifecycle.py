"""Waiting-room authorization, atomic claims, presence and start lifecycle."""
import json
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from server_bridge import KoenjiDatabase, KoenjiAppService, seat_presence

class GatheringLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.db=KoenjiDatabase(Path(self.tmp.name)/'lobby.sqlite3');self.svc=KoenjiAppService(self.db)
        status,self.room=self.svc.handle('POST','/api/1889/games',dict(max_players=3,lobby=True,title='Friends at Koenji',player_names=['Alice','Bob','Carol']))
        self.assertEqual(status,200);self.base='/api/1889/games/'+self.room['room_code']
    def tearDown(self):self.tmp.cleanup()
    def req(self,method,suffix='',body=None,token=None):
        return self.svc.handle(method,self.base+suffix,body,'Bearer '+token if token else None)
    def test_waiting_view_claim_stamp_seating_start_and_reload(self):
        a,b,c=self.room['player_tokens'];host=self.room['creator_token']
        status,v=self.req('GET',token=a);self.assertEqual(status,200);self.assertEqual(v['status'],'waiting');self.assertNotIn('state',v)
        self.assertFalse(v['seats'][0]['claimed']);self.assertFalse(v['seats'][0]['online'])
        for token,name in [(a,'Alice'),(b,'Bob'),(c,'Carol')]:
            self.assertEqual(self.req('POST','/seat',dict(player_name=name),token)[0],200)
        self.assertEqual(self.req('POST','/club',dict(action='stamp_card'),a)[0],200)
        self.assertEqual(self.req('POST','/club',dict(action='table_note',text='Tea is ready'),b)[0],200)
        self.assertEqual(self.req('POST','/seating',dict(order=[1,0,2]),b)[0],403)
        self.assertEqual(self.req('POST','/seating',dict(order=[1,0,2]),host)[0],200)
        status,v=self.req('GET',token=a);self.assertEqual(v['viewer']['player_id'],'p2');self.assertIn('p2',v['club']['stamps'])
        self.assertEqual(self.req('POST','/start',{},b)[0],403)
        self.assertEqual(self.req('POST','/start',{'player_names':['Alice','Bob','Carol']},host)[0],409)
        status,v=self.req('POST','/start',{},host);self.assertEqual(status,200,v)
        self.assertEqual(v['state']['revision'],0);self.assertEqual(v['state']['players']['p1']['name'],'Bob')
        self.assertEqual(self.req('POST','/seat',dict(player_name='Other'),a)[0],409)
        self.assertEqual(self.req('POST','/claim',dict(seat_index=2,player_name='Other'))[0],404)
        self.assertEqual(self.req('POST','/start',{},host)[0],409)
        self.svc=KoenjiAppService(KoenjiDatabase(self.db.db_path))
        status,v=self.req('GET',token=a);self.assertEqual(v['viewer']['player_id'],'p2');self.assertEqual(v['state']['revision'],0)
    def test_public_claim_is_single_use_and_never_leaks_other_seat_tokens(self):
        status,v=self.req('GET','/lobby');self.assertEqual(status,200)
        for token in self.room['player_tokens']+[self.room['creator_token'],self.room['spectator_token']]:self.assertNotIn(token,json.dumps(v))
        def claim(_):return self.req('POST','/claim',dict(seat_index=1,player_name='Bob'))
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(claim,range(2)))
        self.assertEqual(sorted(r[0] for r in results),[200,409])
        credential=next(v['player_token'] for status,v in results if status==200)
        self.assertEqual(self.req('GET',token=self.room['player_tokens'][1])[0],403)
        self.assertEqual(self.req('GET',token=credential)[0],200)
        self.assertEqual(self.req('GET','/invitations',token=credential)[0],403)
        status,invites=self.req('GET','/invitations',token=self.room['creator_token']);self.assertEqual(status,200);self.assertIsNone(invites['player_tokens'][1])
    def test_presence_distinguishes_polling_from_seated_away_and_bad_timestamps(self):
        for instant in [None,'invalid','2000-01-01 00:00:00']:
            self.assertFalse(seat_presence({'last_seen_at':instant})['online'])
        token=self.room['player_tokens'][0];self.req('POST','/seat',{'player_name':'Alice'},token)
        status,v=self.req('GET',token=token);self.assertTrue(v['seats'][0]['online']);self.assertFalse(v['seats'][1]['online'])
