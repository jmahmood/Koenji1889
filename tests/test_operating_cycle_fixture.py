"""The Chrome walkthrough starts before track and completes one whole round."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiAppService, KoenjiDatabase, replay


class OperatingCycleFixtureTests(unittest.TestCase):
    def test_legal_replayable_opening_runs_trains_and_returns_to_stock(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = KoenjiAppService(KoenjiDatabase(Path(tmp) / 'cycle.sqlite3'))
            status, fixture = service.handle('POST', '/api/1889/dev/fixture', {'preset': 'operating_cycle'})
            self.assertEqual(status, 200, fixture)
            view = fixture['view']
            opening = view['state']
            self.assertEqual(opening['operating_turn']['step'], 'track')
            self.assertEqual(opening['corporations']['IR']['trains'], ['2-0', '2-1'])
            names = [opening['players'][pid]['name'] for pid in opening['player_order']]
            self.assertEqual(replay(names, opening['history'], opening['player_order']), opening)
            base = '/api/1889/games/' + fixture['room_code']

            def move(action):
                nonlocal view
                status, result = service.handle('POST', base + '/actions', {
                    'expected_revision': view['state']['revision'],
                    'command_id': 'cycle-' + str(view['state']['revision']), 'action': action,
                }, 'Bearer ' + fixture['player_tokens'][0])
                self.assertEqual(status, 200, result)
                view = result

            move({'type': 'lay_tile', 'hex': 'F3', 'tile': '57', 'rotation': 2})
            move({'type': 'skip'})
            self.assertEqual(view['route_quote']['revenue'], 90)
            move({'type': 'run_routes', 'routes': view['route_quote']['routes']})
            move({'type': 'dividend', 'payout': True})
            purchase = next(a for a in view['action_options'] if a['type'] == 'buy_train')
            move(purchase)
            move({'type': 'end_turn'})
            self.assertEqual(view['state']['round'], 'stock')
            self.assertEqual(view['state']['stock_round'], opening['stock_round'] + 1)
            self.assertEqual(view['state']['revision'], opening['revision'] + 6)
