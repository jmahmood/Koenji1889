"""Presentation receipts and compatibility facts must reflect accepted game cash."""
import unittest
from copy import deepcopy
from server_bridge import apply_action, summarize_transition
from app.unittests import test_Engine1889 as fixtures


class PlaytestReleaseTests(unittest.TestCase):
    def test_pool_and_ipo_dividends_have_distinct_receipts_and_conserve_money(self):
        f=fixtures.Rules1889Tests('runTest');f.setUp();f.operating()
        corp=f.s['corporations']['IR']
        corp['ipo']-=20;corp['pool']=20
        self.assertEqual(corp['ipo'],30)
        f.s['operating_turn'].update(routes=[],revenue=100)
        before=deepcopy(f.s)
        action={'type':'dividend','player':'p1','payout':True}
        after=apply_action(before,action)
        event=summarize_transition(before,after,action)
        self.assertEqual(event['dividend_allocation'],{
            'players':{'p1':50},'treasury':20,'ipo_retained_by_bank':30})
        self.assertEqual({(r['recipient'],r['destination']):r['amount'] for r in event['cash_receipts']},
                         {('p1','purse'):50,('IR','treasury'):20})
        self.assertEqual(before['bank']-after['bank'],70)
        self.assertEqual(sum(r['amount'] for r in event['cash_receipts']),70)
        # Event enrichment must not change either authoritative snapshot.
        self.assertEqual(before,f.s)

    def test_withholding_delivers_only_company_revenue(self):
        f=fixtures.Rules1889Tests('runTest');f.setUp();f.operating()
        f.s['operating_turn'].update(routes=[],revenue=100)
        action={'type':'dividend','player':'p1','payout':False}
        after=apply_action(f.s,action)
        event=summarize_transition(f.s,after,action)
        self.assertEqual(event['dividend_allocation'],{
            'players':{},'treasury':100,'ipo_retained_by_bank':0})
        self.assertEqual([(r['recipient'],r['amount']) for r in event['cash_receipts']],[('IR',100)])

    def test_receipt_animations_never_report_zero_or_negative_payments(self):
        f=fixtures.Rules1889Tests('runTest');f.setUp();f.stock()
        action={'type':'buy_shares','player':'p1','corporation':'IR','price':80}
        after=apply_action(f.s,action)
        event=summarize_transition(f.s,after,action)
        self.assertNotIn('cash_receipts',event)
