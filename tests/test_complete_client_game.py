"""A complete public-action game through the same service used by the browser."""
import json
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiAppService, KoenjiDatabase

class CompleteClientGameTests(unittest.TestCase):
    def test_all_phases_game_journal_restore_and_scoreboard_projection(self):
        record=json.loads(Path('daemon18xx/app/unittests/fixtures/1889/authored_all_phases.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'complete.sqlite3'
            svc=KoenjiAppService(KoenjiDatabase(path))
            status,room=svc.handle('POST','/api/1889/games',{'max_players':len(record['names']),'lobby':True,'player_names':record['names'],'title':'Complete lifecycle regression'})
            self.assertEqual(status,200)
            base='/api/1889/games/'+room['room_code']
            for token,name in zip(room['player_tokens'],record['names']):
                status,claimed=svc.handle('POST',base+'/seat',{'player_name':name},'Bearer '+token)
                self.assertEqual(status,200,claimed)
            status,waiting=svc.handle('GET',base,None,'Bearer '+room['player_tokens'][0])
            self.assertEqual(waiting['status'],'waiting')
            status,view=svc.handle('POST',base+'/start',{},'Bearer '+room['creator_token'])
            self.assertEqual(status,200,view)
            phases=set()
            for index,action in enumerate(record['actions']):
                token=room['player_tokens'][int(action['player'][1:])-1]
                status,view=svc.handle('POST',base+'/actions',{'expected_revision':index,'command_id':f'complete-{index}','action':action},'Bearer '+token)
                self.assertEqual(status,200,(index,action,view))
                self.assertEqual(view['state']['revision'],index+1)
                phases.add(view['state']['phase'])
                if index in (100,800):
                    svc=KoenjiAppService(KoenjiDatabase(path))
                    status,reloaded=svc.handle('GET',base,None,'Bearer '+room['spectator_token'])
                    self.assertEqual(status,200)
                    self.assertEqual(reloaded['state'],view['state'])
            self.assertEqual(phases,{'2','3','4','5','6','D'})
            self.assertTrue(view['state']['finished'])
            self.assertEqual(view['state']['result'],record['result'])
            self.assertEqual(len(view['history_events']),len(record['actions'])+1)
            svc=KoenjiAppService(KoenjiDatabase(path))
            status,initial=svc.handle('GET',base+'/revisions/0',None,'Bearer '+room['spectator_token'])
            self.assertEqual(status,200);self.assertEqual(initial['state']['revision'],0)
            status,final=svc.handle('GET',base,None,'Bearer '+room['spectator_token'])
            self.assertEqual(status,200);self.assertEqual(final['state'],view['state'])
