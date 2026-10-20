"""The route demo starts at a playable, fully replayable two-train decision."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiAppService, KoenjiDatabase, replay


class RouteFixtureTests(unittest.TestCase):
    def test_route_fixture_replays_and_runs_both_trains_then_pays_dividend(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = KoenjiDatabase(Path(tmp) / 'routes.sqlite3')
            service = KoenjiAppService(db)
            status, original = service.handle('POST', '/api/1889/dev/fixture', {'preset': 'operating_round_1'})
            self.assertEqual(status, 200)
            status, fixture = service.handle('POST', '/api/1889/dev/fixture', {'preset': 'route_planning'})
            self.assertEqual(status, 200, fixture)
            self.assertNotEqual(original['room_code'], fixture['room_code'])
            view = fixture['view']
            state = view['state']
            self.assertEqual((state['round'], state['current_corporation'], state['current_player']), ('operating', 'IR', 'p1'))
            self.assertEqual(state['operating_turn']['step'], 'routes')
            self.assertEqual(state['corporations']['IR']['trains'], ['2-0', '2-1'])
            self.assertEqual(state['operating_turn']['new_trains'], [])
            self.assertEqual(len(view['route_quote']['routes']), 2)
            self.assertEqual(view['route_quote']['revenue'], 90)
            names = [state['players'][pid]['name'] for pid in state['player_order']]
            self.assertEqual(replay(names, state['history'], state['player_order']), state)
            base = '/api/1889/games/' + fixture['room_code']
            token = 'Bearer ' + fixture['player_tokens'][0]
            for index, action in enumerate([
                {'type': 'run_routes', 'routes': view['route_quote']['routes']},
                {'type': 'dividend', 'payout': True},
            ]):
                status, view = service.handle('POST', base + '/actions', {
                    'expected_revision': view['state']['revision'], 'command_id': 'route-demo-' + str(index), 'action': action,
                }, token)
                self.assertEqual(status, 200, view)
                self.assertEqual(view['state']['operating_turn']['step'], 'dividend' if index == 0 else 'train')
                self.assertEqual(view['state']['operating_turn']['revenue'], 90)
            status, preserved = service.handle('GET', '/api/1889/games/' + original['room_code'], None, 'Bearer ' + original['player_tokens'][0])
            self.assertEqual(status, 200)
            self.assertEqual(preserved['state'], original['view']['state'])
