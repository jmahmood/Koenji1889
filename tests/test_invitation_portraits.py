"""Host portrait presets follow the invited member without claiming a seat."""
import json
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiDatabase, KoenjiAppService, APPEARANCE_CATALOG, clean_appearance


class InvitationPortraitTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=KoenjiDatabase(Path(self.tmp.name)/'invites.sqlite3')
        self.svc=KoenjiAppService(self.db)
        status,self.room=self.svc.handle('POST','/api/1889/games',dict(max_players=2,lobby=True,player_names=['Alice','Bob']))
        self.assertEqual(status,200)
        self.base='/api/1889/games/'+self.room['room_code']
        self.a,self.b=self.room['player_tokens'];self.host=self.room['creator_token']

    def tearDown(self):
        self.tmp.cleanup()

    def request(self,method,suffix='',body=None,token=None):
        return self.svc.handle(method,self.base+suffix,body,'Bearer '+(token or self.host))

    def test_preset_persists_and_follows_the_token_through_reordering_without_arriving(self):
        before=self.request('GET',token=self.b)[1]
        member=before['members']['p2']['member_id']
        self.assertEqual(self.request('POST','/invitations',dict(member_id=member,face='reference-15'))[0],200)
        self.svc=KoenjiAppService(KoenjiDatabase(self.db.db_path))
        view=self.request('GET',token=self.b)[1]
        self.assertEqual(view['members']['p2']['appearance']['face'],'reference-15')
        self.assertTrue(view['members']['p2']['appearance_configured'])
        self.assertFalse(view['members']['p2']['has_arrived'])
        self.assertFalse(view['seats'][1]['claimed']);self.assertEqual(view['arrival_events'],[])
        invites=self.request('GET','/invitations')[1]
        self.assertEqual(invites['seats'][1]['appearance']['face'],'reference-15')
        self.request('POST','/seating',{'order':[1,0]})
        view=self.request('GET',token=self.b)[1]
        self.assertEqual(view['viewer']['player_id'],'p1')
        self.assertEqual(view['members']['p1']['member_id'],member)
        self.assertEqual(view['members']['p1']['appearance']['face'],'reference-15')
        self.assertEqual(self.request('GET','/invitations')[1]['player_tokens'][0],self.b)
        self.request('POST','/seat',{'player_name':'Bob'},self.b)
        self.assertEqual(self.request('POST','/invitations',dict(member_id=member,face='reference-02'))[0],409)
        self.request('POST','/arrival',{'appearance':{'face':'reference-15','clothes':'plum-kimono'}},self.b)
        self.assertEqual(self.request('GET',token=self.b)[1]['arrival_events'][0]['kind'],'arrived')
        self.request('POST','/arrival',{'appearance':{'face':'reference-03','clothes':'moss-hakama'}},self.b)
        self.assertEqual(self.request('GET',token=self.b)[1]['members']['p1']['appearance']['face'],'reference-03')

    def test_only_host_can_assign_valid_portraits_and_clearing_a_preset_preserves_the_seat(self):
        member=self.request('GET',token=self.b)[1]['members']['p2']['member_id']
        body=dict(member_id=member,face='reference-15')
        for token in [self.a,self.b,self.room['spectator_token']]:
            self.assertEqual(self.request('POST','/invitations',body,token)[0],403)
        for face in ['member-1','face-01','invalid','<script>',[],{}]:
            self.assertEqual(self.request('POST','/invitations',dict(body,face=face))[0],422)
        self.assertEqual(self.request('POST','/invitations',dict(body,member_id='player:99999'))[0],422)
        self.request('POST','/invitations',body)
        self.request('POST','/invitations',dict(body,face=None))
        self.assertIsNone(self.request('GET','/invitations')[1]['seats'][1]['appearance'])
        self.assertEqual(self.request('GET',token=self.b)[1]['arrival_events'],[])
        self.assertEqual(len(APPEARANCE_CATALOG['faces']),17)
        self.assertEqual(clean_appearance({'face':'member-1','clothes':'plum-kimono'}),{'face':'reference-01','clothes':'plum-kimono'})


if __name__=='__main__':
    unittest.main()
