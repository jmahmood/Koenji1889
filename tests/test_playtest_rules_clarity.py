"""Reported accounting/rules questions tested through actual round transitions."""
import unittest
import test_decision_coverage as fixtures
from server_bridge import certificate_count


class PlaytestRulesClarityTests(unittest.TestCase):
    setUp = fixtures.DecisionCoverageTests.setUp
    tearDown = fixtures.DecisionCoverageTests.tearDown
    install = fixtures.DecisionCoverageTests.install
    request = fixtures.DecisionCoverageTests.request
    move = fixtures.DecisionCoverageTests.move
    def test_phase_two_or_four_one_pays_every_open_private_owner(self):
        f = self.f
        f.stock()
        f.shares('IR', 'p1', 50)
        f.s['stock_round'] = 4
        f.s['stock_passes'] = 2
        f.s['current_player'] = 'p3'
        f.s['last_deal'] = 'p2'
        before = self.install(f.s)
        v = self.request('GET', seat='p3')
        after = self.move(v, dict(type='pass'), seat='p3')['state']
        self.assertEqual((after['round'], after['stock_round'], after['or_number'], after['phase']), ('operating', 4, 1, '2'))
        total = 0
        for pid, player in before['players'].items():
            due = sum(p['revenue'] for p in before['privates'].values() if p['owner'] == pid and not p['closed'])
            self.assertEqual(after['players'][pid]['cash'] - player['cash'], due)
            total += due
        funding = sum(c['cash'] - before['corporations'][cid]['cash'] for cid, c in after['corporations'].items())
        self.assertEqual(before['bank'] - after['bank'], total + funding)
        self.assertEqual(after['priority'], 'p3')

    def test_no_trade_stock_round_keeps_priority_instead_of_rotating(self):
        f = self.f
        f.stock()
        f.shares('IR', 'p1', 50)
        f.s.update(stock_passes=2, current_player='p3', last_deal=None, priority='p2')
        self.install(f.s)
        v = self.request('GET', seat='p3')
        self.assertEqual(self.move(v, dict(type='pass'), seat='p3')['state']['priority'], 'p2')

    def test_each_open_player_private_counts_as_one_certificate(self):
        self.f.stock()
        state = self.f.s
        before = certificate_count(state, 'p1')
        private = next(p for p in state['privates'].values() if p['owner'] == 'p1')
        private['closed'] = True
        self.assertEqual(certificate_count(state, 'p1'), before - 1)
        private['closed'] = False
        private['owner'] = 'IR'
        self.assertEqual(certificate_count(state, 'p1'), before - 1)


if __name__ == '__main__':
    unittest.main()
