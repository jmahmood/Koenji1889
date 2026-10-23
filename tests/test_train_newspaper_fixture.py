"""Retirement practice is a legal, replayable preview until a player buys."""
import tempfile
import unittest
from pathlib import Path
from server_bridge import KoenjiAppService, KoenjiDatabase, replay


class TrainNewspaperFixtureTests(unittest.TestCase):
    def test_replays_previews_and_commits_retirement_only_on_purchase(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = KoenjiAppService(KoenjiDatabase(Path(tmp) / 'newspaper.sqlite3'))
            status, original = service.handle('POST', '/api/1889/dev/fixture', {'preset': 'train_newspaper'})
            self.assertEqual(status, 200, original)
            status, fixture = service.handle('POST', '/api/1889/dev/fixture', {'preset': 'train_newspaper'})
            self.assertEqual(status, 200, fixture)
            self.assertNotEqual(fixture['room_code'], original['room_code'])
            base = '/api/1889/games/' + fixture['room_code']
            token = 'Bearer ' + fixture['player_tokens'][2]
            status, view = service.handle('GET', base, None, token)
            self.assertEqual(status, 200, view)
            state = view['state']
            self.assertEqual((state['phase'], state['current_corporation'], state['current_player']), ('3', 'TR', 'p3'))
            self.assertEqual(state['operating_turn']['step'], 'train')
            self.assertEqual(state['corporations']['TR']['trains'], ['2-5', '3-0'])
            self.assertEqual(state['corporations']['TR']['cash'], 341)
            self.assertEqual(view['train_limit'], 4)
            self.assertFalse(any(t['rusted'] for t in state['trains'].values() if t['type'] == '2'))
            names = [state['players'][pid]['name'] for pid in state['player_order']]
            self.assertEqual(replay(names, state['history'], state['player_order']), state)
            purchase = next(a for a in view['action_options'] if a == {'type': 'buy_train', 'train': '4-0'})
            # Reopening the fixture view must not purchase or retire anything.
            status, reopened = service.handle('GET', base, None, token)
            self.assertEqual(status, 200)
            self.assertEqual(reopened['state'], state)
            status, after = service.handle('POST', base + '/actions', {
                'expected_revision': state['revision'], 'command_id': 'newspaper-buy', 'action': purchase,
            }, token)
            self.assertEqual(status, 200, after)
            self.assertEqual(after['state']['revision'], state['revision'] + 1)
            self.assertEqual(after['state']['phase'], '4')
            self.assertEqual(after['train_limit'], 3)
            self.assertTrue(all(t['rusted'] for t in after['state']['trains'].values() if t['type'] == '2'))
            self.assertEqual(after['state']['corporations']['TR']['trains'], ['3-0', '4-0'])
            self.assertEqual(after['state']['corporations']['TR']['cash'], 41)
            status, preserved = service.handle('GET', '/api/1889/games/' + original['room_code'], None,
                                                'Bearer ' + original['spectator_token'])
            self.assertEqual(status, 200)
            self.assertEqual(preserved['state'], original['view']['state'])

    def test_requires_four_seats_for_the_recorded_history(self):
        with tempfile.TemporaryDirectory() as tmp:
            service = KoenjiAppService(KoenjiDatabase(Path(tmp) / 'seats.sqlite3'))
            status, result = service.handle('POST', '/api/1889/dev/fixture', {
                'preset': 'train_newspaper', 'player_names': ['One', 'Two', 'Three'],
            })
            self.assertEqual(status, 422, result)
            self.assertIn('four player seats', result['detail'])
