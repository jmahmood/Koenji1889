import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch
from server_bridge import KoenjiDatabase, build_history_events, new_game, apply_action, summarize_transition


class LegacyMascotReplayTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=KoenjiDatabase(Path(self.tmp.name)/'game.sqlite3')
        self.info=self.db.create_game(max_players=4)
        self.gid=self.info['game_id']
        self.state=new_game(['A','B','C','D'])
        self.db.save_initial_state(self.gid,self.state,['A','B','C','D'])

    def tearDown(self):
        self.tmp.cleanup()

    def record(self,after,action,event):
        after['revision']=self.state['revision']+1
        self.db.save_committed_action(self.gid,after,self.state['revision'],f"move-{after['revision']}",action['player'],action,event)
        self.state=after

    def test_old_journal_gets_exact_receipts_rust_presidency_and_winners_without_rewriting(self):
        before=deepcopy(self.state)
        before['corporations']['IR']['president']='p1'
        before['trains']['2-0']['owner']='IR'
        # Authored initial position, with both snapshots preserved as evidence.
        with self.db._connect() as conn:
            conn.execute('update game_states set state_json=? where game_id=?',(json.dumps(before),self.gid));conn.commit()
        self.state=before
        after=deepcopy(before)
        after['players']['p1']['cash']+=50;after['bank']-=50
        after['corporations']['IR']['president']='p2'
        after['trains']['2-0'].update(owner=None,rusted=True)
        after.update(finished=True,result={'p1':500,'p2':500,'p3':400,'p4':300})
        self.record(after,{'type':'pass','player':'p2'},{'type':'pass','actor_id':'p2','label':'Old event'})
        with self.db._connect() as conn:
            journal=conn.execute('select event_json from game_actions').fetchall()
            snapshots=conn.execute('select state_json from game_states').fetchall()
        event=build_history_events(self.db,self.gid,self.state)[-1]['event']
        self.assertEqual(event['cash_receipts'],[dict(recipient='p1',destination='purse',amount=50,name='A')])
        self.assertEqual(event['rusted_trains'][0]['president'],'p1')
        self.assertEqual(event['presidency_changes'][0]['from'],'p1')
        self.assertTrue(event['finished']);self.assertEqual(event['winners'],['p1','p2'])
        with patch.object(self.db,'get_game_state_at_revision',wraps=self.db.get_game_state_at_revision) as reads:
            again=build_history_events(self.db,self.gid,self.state)
            self.assertEqual(again[-1]['event'],event)
            self.assertEqual(reads.call_count,1,'Only revision zero should load on a cached history read')
        with self.db._connect() as conn:
            self.assertEqual(conn.execute('select event_json from game_actions').fetchall(),journal)
            self.assertEqual(conn.execute('select state_json from game_states').fetchall(),snapshots)

    def test_old_auction_preserves_real_outbid_identity(self):
        for action in [dict(type='bid',player='p1',company='MF',price=35),dict(type='bid',player='p2',company='ER',price=45),dict(type='bid',player='p3',company='ER',price=50)]:
            after=apply_action(self.state,action)
            self.record(after,action,dict(type='bid',actor_id=action['player'],label='Legacy bid'))
        event=build_history_events(self.db,self.gid,self.state)[-1]['event']
        self.assertEqual(event['outbid_players'],['p2'])

    def test_new_journals_skip_legacy_snapshot_reads(self):
        action=dict(type='bid',player='p1',company='MF',price=35)
        after=apply_action(self.state,action);event=summarize_transition(self.state,after,action)
        self.assertEqual(event['presentation_version'],1)
        self.record(after,action,event)
        with patch.object(self.db,'get_game_state_at_revision',wraps=self.db.get_game_state_at_revision) as reads:
            build_history_events(self.db,self.gid,self.state)
            self.assertEqual(reads.call_count,1)
