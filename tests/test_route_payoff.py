"""Accepted presentation data stays reconciled with the rules engine."""
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from server_bridge import KoenjiDatabase, create_fixture_room, apply_action, summarize_transition, route_plan_quote


class RoutePayoffTests(unittest.TestCase):
    def test_route_events_keep_exact_train_paths_and_scores_without_moving_cash(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = KoenjiDatabase(Path(tmp) / 'payoff.sqlite3')
            for preset in ('route_planning', 'route_network_3', 'route_network_4'):
                view = create_fixture_room(db, preset)['view']
                before = view['state']
                routes = view['route_quote']['routes']
                quote = route_plan_quote(before, before['current_corporation'], routes)
                action = dict(type='run_routes', player=before['current_player'], routes=routes)
                after = apply_action(before, action)
                saved = deepcopy(after)
                event = summarize_transition(before, after, action)
                run = event['route_run']
                self.assertEqual(sum(r['revenue'] for r in run['routes']), run['revenue'])
                self.assertEqual(run['revenue'], quote['revenue'])
                self.assertEqual([r['vertices'] for r in run['routes']], [r['vertices'] for r in routes])
                self.assertTrue(all(len(r['scored_stops']) >= 2 for r in run['routes']))
                self.assertNotIn('account_deltas', event)
                self.assertNotIn('cash_receipts', event)
                self.assertEqual(after, saved)

    def test_settlement_facts_include_revised_revenue_net_deltas_and_actual_market_positions(self):
        with tempfile.TemporaryDirectory() as tmp:
            view = create_fixture_room(KoenjiDatabase(Path(tmp) / 'payoff.sqlite3'), 'route_planning')['view']
            state = apply_action(view['state'], dict(type='run_routes',player='p1',routes=view['route_quote']['routes']))
            for payout in (True, False):
                before = deepcopy(state)
                before['operating_turn']['revenue'] = 999  # Unpaid claim revalidated by the engine.
                action = dict(type='dividend',player='p1',payout=payout)
                after = apply_action(before, action)
                event = summarize_transition(before, after, action)
                self.assertEqual(event['revenue_revision'], dict(before=999,after=90))
                move = event['market_movements'][0]
                self.assertEqual(move['before'], before['corporations']['IR']['position'])
                self.assertEqual(move['after'], after['corporations']['IR']['position'])
                for delta in event['account_deltas']:
                    collection = 'corporations' if delta['destination']=='treasury' else 'players'
                    self.assertEqual(delta['after']-delta['before'],delta['amount'])
                    self.assertEqual(after[collection][delta['recipient']]['cash'],delta['after'])
                if not payout:
                    self.assertEqual(event['dividend_allocation']['treasury'],90)


if __name__ == '__main__':
    unittest.main()
