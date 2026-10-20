"""Accepted presentation facts remain distinct from the submitting player."""
import unittest
from copy import deepcopy
from server_bridge import new_game, apply_action, summarize_transition
from app.unittests import test_Engine1889 as fixtures


class CharacterEventTests(unittest.TestCase):
    def test_cascade_and_pass_awards_identify_winner_and_actual_escrow_price(self):
        state = new_game(['A', 'B', 'C', 'D'])
        actions = [
            dict(type='bid', player='p1', company='MF', price=35),
            dict(type='bid', player='p2', company='ER', price=45),
            dict(type='bid', player='p3', company='ER', price=50),
            dict(type='bid', player='p4', company='TR', price=20),
            dict(type='pass', player='p2'),
        ]
        events = []
        for action in actions:
            before = deepcopy(state)
            state = apply_action(state, action)
            after_copy = deepcopy(state)
            events.append(summarize_transition(before, state, action))
            self.assertEqual(state, after_copy, 'Presentation must not mutate rules state')
        self.assertEqual(events[2]['outbid_players'], ['p2'])
        self.assertEqual(events[3]['private_awards'], [
            dict(company='TR', player_id='p4', price=20),
            dict(company='MF', player_id='p1', price=35),
        ])
        self.assertEqual(events[4]['actor_id'], 'p2')
        self.assertEqual(events[4]['private_awards'], [dict(company='ER', player_id='p3', price=50)])

    def test_train_payment_is_depot_price_not_personal_cash_delta(self):
        f = fixtures.Rules1889Tests('runTest'); f.setUp(); f.operating(); f.route(); f.train_step()
        before = deepcopy(f.s)
        action = dict(type='buy_train', player='p1', train='2-0')
        after = apply_action(before, action)
        event = summarize_transition(before, after, action)
        self.assertEqual(event['price'], before['trains']['2-0']['price'])
        self.assertEqual(event['seller'], 'depot')
        self.assertNotIn('rusted_trains', event)

    def test_consequence_facts_come_only_from_snapshot_changes(self):
        before = new_game(['A', 'B'])
        before['corporations']['IR']['president'] = 'p1'
        before['trains']['2-0']['owner'] = 'IR'
        after = deepcopy(before)
        after['corporations']['IR']['president'] = 'p2'
        after['trains']['2-0'].update(owner=None, rusted=True)
        after.update(bank_broken=True)
        event = summarize_transition(before, after, dict(type='pass', player='p1'))
        self.assertEqual(event['presidency_changes'], [dict(corporation='IR', **{'from':'p1', 'to':'p2'})])
        self.assertEqual(event['rusted_trains'], [dict(train='2-0', type='2', corporation='IR', president='p1')])
        self.assertTrue(event['bank_end_pending'])
        after.update(finished=True, result={'p1':500, 'p2':500})
        event = summarize_transition(before, after, dict(type='pass', player='p1'))
        self.assertTrue(event['finished'])
        self.assertEqual(event['winners'], ['p1', 'p2'])
        self.assertFalse(event['bank_end_pending'])


if __name__ == '__main__':
    unittest.main()
