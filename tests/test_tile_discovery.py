"""Check discovery completeness against direct engine construction validation."""
import unittest
from copy import deepcopy
import tile_discovery_fixtures as fixtures
from server_bridge import lay_tile, tile_for, DATA, PHASES
from app.engine1889.errors import RuleError


class TileDiscoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.views = fixtures.fixtures()['views']

    def test_discovery_omits_no_engine_accepted_tile_orientation(self):
        for name in ('available', 'unconnected', 'many_choices'):
            with self.subTest(position=name):
                view = self.views[name]
                state = view['state']
                self.assertEqual(state['operating_turn']['step'], 'track')
                def key(coord, tile, rotation):
                    return (coord, tile, frozenset(frozenset(p) for p in tile_for(tile, rotation)['paths']))
                shown = {key(coord, p['tile'], p['rotation'])
                         for coord, choices in view['legal_tile_lays'].items() for p in choices}
                accepted = set()
                # No connectivity/candidate-hex filter: check every compatible
                # board position and every orientation directly with the engine.
                for coord, old in state['board'].items():
                    if old['color'] not in ('white', 'yellow', 'green'):
                        continue
                    target = dict(white='yellow', yellow='green', green='brown')[old['color']]
                    for tile, spec in DATA['tiles'].items():
                        if spec['color'] != target or target not in PHASES[state['phase']][1]:
                            continue
                        base = tile_for(tile, 0)
                        if base['label'] != old['label'] or [n['kind'] for n in base['nodes']] != [n['kind'] for n in old['nodes']]:
                            continue
                        for rotation in range(6):
                            try:
                                lay_tile(deepcopy(state), state['current_corporation'], coord, tile, rotation)
                            except RuleError:
                                continue
                            accepted.add(key(coord, tile, rotation))
                self.assertEqual(shown, accepted)

    def test_sr_can_build_j3_before_using_its_one_normal_lay(self):
        view = self.views['available']
        choices = view['legal_tile_lays']['J3']
        self.assertTrue(any(p['tile'] == '9' for p in choices))
        self.assertEqual(self.views['used']['legal_tile_lays'], {})
        self.assertTrue(self.views['used']['state']['operating_turn']['laid'])

    def test_multiple_connections_produce_more_than_six_valid_j3_choices(self):
        view = self.views['many_choices']
        choices = view['legal_tile_lays']['J3']
        self.assertGreater(len(choices), 6)
        for placement in choices:
            state = deepcopy(view['state'])
            lay_tile(state, 'KO', 'J3', placement['tile'], placement['rotation'])
            self.assertEqual(state['board']['J3']['tile'], placement['tile'])


if __name__ == '__main__':
    unittest.main()
