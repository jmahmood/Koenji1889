"""Larger practice maps must exercise train capacity, allocation and real alternatives."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import (KoenjiAppService, KoenjiDatabase, replay, route_candidates,
                           route_stop_options)
from app.engine1889 import validate_state


class ExpandedRouteFixturesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.service = KoenjiAppService(KoenjiDatabase(Path(cls.tmp.name)/'networks.sqlite3'))
        cls.fixtures = {}
        for count in (3,4):
            status, result = cls.service.handle('POST','/api/1889/dev/fixture',{'preset':f'route_network_{count}'})
            if status != 200:
                raise AssertionError(result)
            cls.fixtures[count] = result

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_rich_networks_are_replayable_and_all_trains_can_run(self):
        for count, phase, corporation, laid, stations, revenue in [(3,'4','UR',18,2,320),(4,'3','TR',16,3,290)]:
            with self.subTest(fleet=count):
                view=self.fixtures[count]['view'];state=view['state'];corp=state['corporations'][corporation]
                validate_state(state)
                self.assertEqual((state['phase'],state['current_corporation'],state['operating_turn']['step']),(phase,corporation,'routes'))
                self.assertEqual(len(corp['trains']),count)
                self.assertEqual(state['operating_turn']['new_trains'],[])
                self.assertEqual(state['pending_discards'],[])
                self.assertGreaterEqual(sum(h['tile'] is not None for h in state['board'].values()),laid)
                self.assertGreaterEqual(sum(corporation in tokens for h in state['board'].values() for tokens in h['tokens']),stations)
                self.assertEqual(len(view['route_quote']['routes']),count)
                self.assertEqual(view['route_quote']['revenue'],revenue)
                expected = {'3-3':100,'4-3':130,'3-1':90} if count==3 else {'2-5':70,'3-0':100,'2-4':60,'2-1':60}
                self.assertEqual(view['route_quote']['route_revenues'],expected)
                names=[state['players'][pid]['name'] for pid in state['player_order']]
                self.assertEqual(replay(names,state['history'],state['player_order']),state)

    def test_long_trains_have_many_legal_routes_and_choices_remain_with_other_trains_reserved(self):
        for count in (3,4):
            with self.subTest(fleet=count):
                view=self.fixtures[count]['view'];state=view['state'];cid=state['current_corporation']
                for train in state['corporations'][cid]['trains']:
                    routes=route_candidates(state,cid,train,limit=None)
                    self.assertGreaterEqual(len(routes),5)
                    capacity=state['trains'][train]['distance']
                    self.assertEqual(max(sum(':n' in v for v in r['vertices']) for r in routes),capacity)
                    unreserved=route_stop_options(state,train,[],[])
                    self.assertGreaterEqual(len(unreserved['next_stops']),8)
                    reserved=route_stop_options(state,train,[],view['route_quote']['routes'])
                    self.assertGreaterEqual(len(reserved['next_stops']),3)
        types={self.fixtures[3]['view']['state']['trains'][tid]['type'] for tid in self.fixtures[3]['view']['state']['corporations']['UR']['trains']}
        self.assertEqual(types,{'3','4'})

    def test_correct_president_can_edit_run_and_pay_while_other_demo_is_preserved(self):
        originals={count:fixture['view']['state'] for count,fixture in self.fixtures.items()}
        for count in (3,4):
            fixture=self.fixtures[count];state=originals[count];actor=state['current_player']
            token='Bearer '+fixture['player_tokens'][state['player_order'].index(actor)]
            base='/api/1889/games/'+fixture['room_code'];routes=fixture['view']['route_quote']['routes']
            wanted='4' if count==3 else '3'
            chosen=next(r for r in routes if state['trains'][r['train']]['type']==wanted)
            stops=list(reversed([v for v in chosen['vertices'] if ':n' in v])) if count==3 else ['G14:n0','G12:n0','G10:n0']
            status,options=self.service.handle('POST',base+'/route-options',{'revision':state['revision'],'train':chosen['train'],'routes':routes,'stops':stops},token)
            self.assertEqual(status,200,options);self.assertTrue(options['connections'])
            self.assertEqual(options['connections'][0]['total'],320 if count==3 else 260)
            revised=[r for r in routes if r['train']!=chosen['train']]+[options['connections'][0]['route']]
            status,quote=self.service.handle('POST',base+'/route-preview',{'revision':state['revision'],'routes':revised},token)
            self.assertEqual(status,200,quote)
            expected=dict(fixture['view']['route_quote']['route_revenues'])
            expected[chosen['train']]=130 if count==3 else 70
            self.assertEqual(quote['route_revenues'],expected)
            self.assertEqual(sum(quote['route_revenues'].values()),quote['revenue'])
            status,after=self.service.handle('POST',base+'/actions',{'expected_revision':state['revision'],'command_id':f'network-{count}','action':{'type':'run_routes','routes':revised}},token)
            self.assertEqual(status,200,after);self.assertEqual(after['state']['operating_turn']['step'],'dividend')
            self.assertEqual(after['state']['operating_turn']['revenue'],320 if count==3 else 260)
            self.assertEqual(len(after['state']['operating_turn']['routes']),count)
            status,after=self.service.handle('POST',base+'/actions',{'expected_revision':after['state']['revision'],'command_id':f'network-dividend-{count}','action':{'type':'dividend','payout':False}},token)
            self.assertEqual(status,200,after);self.assertEqual(after['state']['operating_turn']['step'],'train')
            if count == 3:
                other=self.fixtures[4]
                status,preserved=self.service.handle('GET','/api/1889/games/'+other['room_code'],None,'Bearer '+other['spectator_token'])
                self.assertEqual(status,200);self.assertEqual(preserved['state'],originals[4])
        self.assertNotEqual(self.fixtures[3]['room_code'],self.fixtures[4]['room_code'])
