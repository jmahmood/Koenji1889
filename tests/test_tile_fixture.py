"""User-facing J3 fixtures are legal, replayable and safe to continue."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiAppService, KoenjiDatabase, replay


class TileFixtureTests(unittest.TestCase):
    def test_j3_positions_replay_and_allow_only_the_unused_normal_lay(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = KoenjiAppService(KoenjiDatabase(Path(tmp) / 'tiles.sqlite3'))
            fixtures = {}
            for preset in ('tile_j3', 'tile_j3_used'):
                status, bundle = service.handle('POST', '/api/1889/dev/fixture', {'preset': preset})
                self.assertEqual(status, 200, bundle)
                fixtures[preset] = bundle
                state = bundle['view']['state']
                self.assertEqual((state['round'], state['current_corporation'], state['current_player']), ('operating', 'SR', 'p1'))
                names = [state['players'][pid]['name'] for pid in state['player_order']]
                self.assertEqual(replay(names, state['history'], state['player_order']), state)
            available, used = fixtures['tile_j3'], fixtures['tile_j3_used']
            choices = available['view']['legal_tile_lays']['J3']
            straight = next(p for p in choices if p['tile'] == '9')
            for bundle, expected in ((available, 200), (used, 422)):
                base = '/api/1889/games/' + bundle['room_code']
                auth = 'Bearer ' + bundle['player_tokens'][0]
                revision = bundle['view']['state']['revision']
                status, result = service.handle('POST', base + '/actions', {
                    'expected_revision': revision,
                    'command_id': 'j3-placement',
                    'action': dict(type='lay_tile', hex='J3', **straight),
                }, auth)
                self.assertEqual(status, expected, result)
                status, saved = service.handle('GET', base, None, auth)
                self.assertEqual(status, 200)
                self.assertEqual(saved['state']['revision'], revision + (expected == 200))
                if expected == 200:
                    self.assertEqual(saved['state']['board']['J3']['tile'], '9')
                else:
                    self.assertEqual(saved['state'], bundle['view']['state'])
                    self.assertEqual(saved['legal_tile_lays'], {})
