"""Stop editing must offer complete legal routes and preserve reserved train track."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiDatabase, KoenjiAppService, route_revenue


class RouteStopEditorTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.service=KoenjiAppService(KoenjiDatabase(Path(self.tmp.name)/'routes.sqlite3'))
        status,self.fixture=self.service.handle('POST','/api/1889/dev/fixture',{'preset':'route_planning'})
        self.assertEqual(status,200)
        self.view=self.fixture['view']
        self.base='/api/1889/games/'+self.fixture['room_code']

    def tearDown(self):
        self.tmp.cleanup()

    def options(self,stops,**extra):
        payload=dict(revision=self.view['state']['revision'],train='2-0',routes=self.view['route_quote']['routes'],stops=stops)
        token=extra.pop('token',self.fixture['player_tokens'][0]);payload.update(extra)
        return self.service.handle('POST',self.base+'/route-options',payload,'Bearer '+token)

    def test_stop_choices_reserve_other_train_and_complete_with_correct_total(self):
        for stops,expected in [([],['E2:n0','F1:n0']),(['F1:n0'],['E2:n0'])]:
            status,result=self.options(stops);self.assertEqual(status,200,result)
            self.assertEqual(result['next_stops'],expected)
            self.assertEqual(result['connections'],[])
        status,result=self.options(['F1:n0','E2:n0']);self.assertEqual(status,200,result)
        choice=result['connections'][0]
        self.assertEqual((choice['revenue'],choice['total']),(50,90))
        other=[r for r in self.view['route_quote']['routes'] if r['train']!='2-0']
        self.assertEqual(route_revenue(self.view['state'],'IR',other+[choice['route']])[0],90)
        status,after=self.service.handle('GET',self.base,None,'Bearer '+self.fixture['player_tokens'][0])
        self.assertEqual(status,200);self.assertEqual(after['state'],self.view['state'])

    def test_releasing_other_train_unlocks_its_stops_but_conflicts_never_offered(self):
        status,result=self.options([],routes=[]);self.assertEqual(status,200)
        self.assertIn('F3:n0',result['next_stops'])
        status,result=self.options(['E2:n0','F3:n0']);self.assertEqual(status,200)
        self.assertEqual(result['connections'],[])
        status,result=self.options(['E2:n0','F3:n0'],routes=[]);self.assertEqual(status,200)
        self.assertEqual(result['connections'][0]['revenue'],40)

    def test_capacity_repeat_and_unknown_stop_checks(self):
        for stops in [['E2:n0','E2:n0'],['garbage'],['ZZ99:n0'],['E2:n-1'],['E2:n99'],['E2:e4']]:
            with self.subTest(stops=stops):self.assertEqual(self.options(stops)[0],422)
        status,result=self.options(['F1:n0','E2:n0','F3:n0'],routes=[])
        self.assertEqual(status,200);self.assertEqual(result['next_stops'],[]);self.assertEqual(result['connections'],[])
        self.assertEqual(self.options([],train='3-0')[0],422)

    def test_history_and_other_seats_cannot_edit(self):
        self.assertEqual(self.options([],revision=0)[0],409)
        for token in [self.fixture['player_tokens'][1],self.fixture['spectator_token']]:
            self.assertEqual(self.options([],token=token)[0],403)

    def test_chosen_connection_can_run_without_a_manual_validation_action(self):
        status,result=self.options(['F1:n0','E2:n0']);self.assertEqual(status,200)
        routes=[r for r in self.view['route_quote']['routes'] if r['train']!='2-0']+[result['connections'][0]['route']]
        status,result=self.service.handle('POST',self.base+'/actions',{'expected_revision':self.view['state']['revision'],'command_id':'custom-stops','action':{'type':'run_routes','routes':routes}},'Bearer '+self.fixture['player_tokens'][0])
        self.assertEqual(status,200,result);self.assertEqual(result['state']['operating_turn']['step'],'dividend');self.assertEqual(result['state']['operating_turn']['revenue'],90)
