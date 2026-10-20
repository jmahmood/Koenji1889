"""Regressions for frontend-facing legal choices and interrupt/persistence paths."""
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from server_bridge import (KoenjiDatabase, KoenjiAppService, validated_action_options,
                           compute_legal_tile_lays, project_view, new_game, apply_action)
from app.unittests import test_Engine1889 as fixtures
from app.engine1889 import engine as E
from app.engine1889.data import MARKET

class DecisionCoverageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = KoenjiDatabase(Path(self.tmp.name)/'decisions.sqlite3')
        self.svc = KoenjiAppService(self.db)
        self.f = fixtures.Rules1889Tests('runTest'); self.f.setUp()

    def tearDown(self):
        self.tmp.cleanup()

    def install(self, state):
        state = deepcopy(state); state['revision']=0; state['history']=[]
        self.room=self.db.create_game('1889',len(state['players']),engine='python')
        self.game=self.db.get_game_by_room_code(self.room['room_code'])
        self.db.save_initial_state(self.game['id'],state,[p['name'] for p in state['players'].values()])
        self.path=f"/api/1889/games/{self.room['room_code']}"
        return state

    def request(self, method, suffix='', body=None, seat='p1'):
        token=self.room['spectator_token'] if seat=='spectator' else self.room['player_tokens'][int(seat[1:])-1]
        status,result=self.svc.handle(method,self.path+suffix,body,'Bearer '+token)
        self.assertEqual(status,200,result)
        return result

    def move(self, view, action, seat='p1'):
        return self.request('POST','/actions',dict(expected_revision=view['state']['revision'],command_id=f"{seat}-{view['state']['revision']}",action=action),seat)

    def test_multi_discard_choices_block_normal_moves_and_resume(self):
        f=self.f;f.operating();f.route()
        for t in ['3-0','3-1','4-0','4-1']:f.give_train('IR',t)
        E._phase_change(f.s,'5');self.install(f.s)
        v=self.request('GET')
        self.assertEqual({a['train'] for a in v['action_options']},{'3-0','3-1','4-0','4-1'})
        self.assertTrue(all(a['type']=='discard_train' for a in v['action_options']))
        for t in ['3-0','3-1']:
            v=self.move(v,dict(type='discard_train',corporation='IR',train=t))
        self.assertEqual(v['state']['pending_discards'],[])
        self.assertNotIn('discard_train',v['legal_actions']['types'])
        self.assertEqual(self.request('GET',seat='p2')['action_options'],[])

    def test_emergency_blocks_and_bankruptcy_choices_are_validated(self):
        f=self.f;f.operating();f.route();f.train_step()
        f.cash(f.s['corporations']['IR'],0);f.cash(f.s['players']['p1'],0)
        self.install(f.s);v=self.request('GET')
        sales=[a for a in v['action_options'] if a['type']=='emergency_sell']
        self.assertEqual(sales,[dict(type='emergency_sell',corporation='IR',percent=10)])
        self.assertNotIn(dict(type='bankrupt'),v['action_options'])
        v=self.move(v,sales[0]);v=self.move(v,dict(type='buy_train',train='2-0'))
        self.assertIn('2-0',v['state']['corporations']['IR']['trains'])
        f.operating();f.route();f.train_step()
        c=f.s['corporations']['IR'];c['holdings'].update(p1=30,p2=30,p3=0);c.update(ipo=40,pool=0)
        f.cash(c,0);f.cash(f.s['players']['p1'],0)
        self.install(f.s);v=self.request('GET')
        self.assertIn(dict(type='bankrupt'),v['action_options'])
        v=self.move(v,dict(type='bankrupt'))
        self.assertTrue(v['state']['finished']);self.assertTrue(v['state']['result'])
        self.assertEqual(v['action_options'],[])

    def test_er_offer_purchase_lay_or_decline_at_every_operating_step(self):
        for step in ['track','token','routes','dividend','train']:
            for resolve in ['pass','lay_tile']:
                with self.subTest(step=step,resolve=resolve):
                    f=self.f;f.operating();f.s['phase']='3';f.s['operating_turn']['step']=step;f.s['operating_turn']['dividend']=(step=='train')
                    self.install(f.s);v=self.request('GET')
                    offer=dict(type='offer',kind='private',item='ER',seller='p3',buyer='IR',price=40)
                    v=self.move(v,offer,'p3')
                    v=self.move(v,dict(type='buy_private',company='ER',buyer='IR',price=40))
                    seller=self.request('GET',seat='p3')
                    self.assertEqual(seller['legal_actions']['types'],['lay_tile','pass'])
                    self.assertTrue(seller['legal_tile_lays']['C4'])
                    action=dict(type='pass') if resolve=='pass' else dict(type='lay_tile',hex='C4',tile='14',rotation=1)
                    v=self.move(seller,action,'p3')
                    self.assertIsNone(v['state']['pending_special'])
                    self.assertEqual(v['state']['current_player'],'p1')
                    self.assertEqual(v['state']['operating_turn']['step'],step)

    def test_or_out_of_turn_dr_exchange_and_train_consent(self):
        f=self.f;f.operating();f.route();f.train_step();f.s['phase']='3'
        self.install(f.s);v=self.request('GET',seat='p2') # DR is owned by p2 in three-player auction
        self.assertIn('exchange_private',v['legal_actions']['types'])
        self.assertIn(dict(type='exchange_private',source='ipo'),v['action_options'])
        v=self.move(v,dict(type='exchange_private',source='ipo'),'p2')
        self.assertTrue(v['state']['privates']['DR']['closed'])
        f.operating();f.route();f.train_step();f.shares('AR','p2',50);f.give_train('AR','2-0')
        self.install(f.s);v=self.request('GET')
        v=self.move(v,dict(type='offer',kind='train',item='2-0',seller='AR',buyer='IR',price=80),'p2')
        v=self.move(v,dict(type='buy_train',train='2-0',price=80))
        self.assertEqual(v['state']['trains']['2-0']['owner'],'IR');self.assertEqual(v['state']['offers'],[])

    def test_diesel_trade_in_and_block_stock_zone_choices(self):
        f=self.f;f.operating();f.route()
        f.give_train('IR','4-0');f.give_train('IR','4-1');E._phase_change(f.s,'6')
        f.cash(f.s['corporations']['IR'],2000)
        f.s['operating_turn'].update(step='train',routes=[],revenue=0,dividend=True)
        self.install(f.s);v=self.request('GET')
        action=dict(type='buy_train',train='D-0',trade_in='4-0')
        self.assertIn(action,v['action_options']);v=self.move(v,action)
        self.assertEqual(v['state']['corporations']['IR']['cash'],1200)
        for zone in ['y','o']:
            f.stock();f.shares('IR','p1',60);f.cash(f.s['players']['p1'],3000)
            pos=next([r,c] for r,row in enumerate(MARKET) for c,cell in enumerate(row) if cell and cell['zone']==zone)
            E._position(f.s,f.s['corporations']['IR'],pos)
            f.s['stock_round']=2
            opts=validated_action_options(f.s,'p1')
            self.assertIn(dict(type='sell_shares',corporation='IR',percent=30),opts)
            buy=dict(type='buy_shares',corporation='IR',source='ipo',percent=20 if zone=='b' else 10)
            self.assertEqual(buy in opts,zone!='y')
            if zone=='b':
                f.s=apply_action(f.s,dict(buy,player='p1'))
                self.assertIn(dict(type='buy_shares',corporation='IR',source='ipo',percent=10),validated_action_options(f.s,'p1'))

    def test_route_quote_is_read_only_and_bad_routes_never_commit(self):
        f=self.f;f.operating();f.route();f.give_train('IR','2-0')
        self.install(f.s);v=self.request('GET');routes=v['route_quote']['routes']
        self.assertTrue(routes)
        for seat in ['p1','spectator']:
            q=self.request('POST','/route-preview',dict(revision=0,routes=routes),seat)
            self.assertEqual(q['revenue'],v['route_quote']['revenue'])
            self.assertEqual(self.request('GET')['state'],v['state'])
        bad=[dict(train='2-0',vertices=['bad'])]
        status,_=self.svc.handle('POST',self.path+'/route-preview',dict(revision=0,routes=bad),'Bearer '+self.room['player_tokens'][0])
        self.assertEqual(status,422)
        v=self.move(v,dict(type='run_routes',routes=routes))
        self.assertEqual(v['state']['operating_turn']['revenue'],q['revenue'])
        self.assertEqual(self.request('GET','/revisions/0')['state']['revision'],0)

    def test_authoritative_empty_tile_set_and_laid_flag(self):
        f=self.f;f.operating();before=deepcopy(f.s)
        self.assertTrue(compute_legal_tile_lays(f.s));self.assertEqual(f.s,before)
        f.s['operating_turn']['laid']=True
        self.assertEqual(compute_legal_tile_lays(f.s),{})
