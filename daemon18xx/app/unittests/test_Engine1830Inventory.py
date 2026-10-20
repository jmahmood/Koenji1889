"""Direct regression coverage for the 1830 edge-case inventory."""

import unittest

from app.engine1830 import check_invariants
from app.engine1830 import engine as E
from app.engine1830.board_data import DATA
from app.unittests import test_Engine1830 as fixtures


class Inventory1830Tests(unittest.TestCase):
    def setUp(self):
        self.f = fixtures.Rules1830Tests("runTest")
        self.f.setUp()

    def test_setup_complete_board_tiles_homes_and_token_supplies(self):
        self.assertEqual(set(self.f.s["board"]), set(DATA["hexes"]))
        self.assertEqual(len(self.f.s["board"]), 93)
        self.assertTrue(all(tile["tile"] is None for tile in self.f.s["board"].values()))
        self.assertEqual(
            self.f.s["tiles"], {tid: spec["count"] for tid, spec in DATA["tiles"].items()}
        )
        self.assertEqual(sum(self.f.s["tiles"].values()), 85)
        expected = {
            "PRR": ("H12", 4), "NYC": ("E19", 4), "CPR": ("A19", 4),
            "B&O": ("I15", 3), "C&O": ("F6", 3), "ERIE": ("E11", 3),
            "NYNH": ("G19", 2), "B&M": ("E23", 2),
        }
        self.assertEqual(set(self.f.s["corporations"]), set(expected))
        for cid, (home, supply) in expected.items():
            with self.subTest(corporation=cid):
                corp = self.f.s["corporations"][cid]
                self.assertEqual((corp["home"], corp["token_supply"]), (home, supply))
                self.assertFalse(corp["home_placed"])
                self.assertFalse(any(
                    cid in tokens for tile in self.f.s["board"].values()
                    for tokens in tile["tokens"]
                ))
        check_invariants(self.f.s)

    def test_operating_steps_reject_duplicate_lay_route_and_dividend(self):
        self.f.operating()
        self.f.train("B&O", "2-0")
        self.f.reject("end_turn")
        self.f.act("lay_tile", hex="J14", tile="57", rotation=0)
        self.f.reject("lay_tile", hex="J14", tile="57", rotation=0)
        self.f.act("skip")
        self.f.reject("place_token", hex="J14")
        self.f.reject("skip")
        self.f.reject("dividend", kind="withhold")
        routes = [{"train": "2-0", "paths": [["I15", 1], ["J14", 1]]}]
        self.f.act("run_routes", routes=routes)
        self.assertEqual(self.f.s["operating_turn"]["revenue"], 50)
        self.f.reject("run_routes", routes=routes)
        self.f.reject("end_turn")
        self.f.act("dividend", kind="withhold")
        self.f.reject("dividend", kind="withhold")
        self.f.act("end_turn")

    def test_optional_steps_skip_but_dividend_and_mandatory_train_cannot(self):
        self.f.operating()
        self.f.washington()
        for step in ("track", "token", "routes"):
            self.assertEqual(self.f.s["operating_turn"]["step"], step)
            self.f.act("skip")
        self.f.reject("skip")
        self.f.reject("end_turn")
        self.f.reject("buy_train", train="2-0")
        self.f.act("dividend", kind="withhold")
        self.f.reject("skip")
        self.f.reject("end_turn")
        self.f.act("buy_train", train="2-0")
        self.f.act("end_turn")

    def test_new_train_waits_until_next_operating_turn(self):
        self.f.operating()
        self.f.washington()
        self.f.s["or_total"] = 2
        self.f.to_train()
        self.f.act("buy_train", train="2-0")
        self.assertEqual(self.f.s["operating_turn"]["new_trains"], ["2-0"])
        routes = [{"train": "2-0", "paths": [["I15", 1], ["J14", 1]]}]
        self.f.reject("run_routes", routes=routes)
        self.f.act("end_turn")
        self.assertEqual(self.f.s["or_number"], 2)
        self.assertEqual(self.f.s["operating_turn"]["new_trains"], [])
        self.f.act("run_routes", routes=routes)
        self.assertEqual(self.f.s["operating_turn"]["revenue"], 50)

    def test_bank_zero_negative_payments_final_scores_and_finished_actions(self):
        self.f.operating()
        self.f.s["or_total"] = 2
        for private in self.f.s["privates"].values():
            private["closed"] = True
        self.f.s["privates"]["SV"].update(closed=False, owner="p1", owner_type="player")
        self.f.s["privates"]["DH"].update(closed=False, owner="B&O", owner_type="corporation")
        self.f.cash(self.f.s["corporations"]["B&O"], 4321)
        self.f.cash(self.f.s["players"]["p1"], self.f.s["players"]["p1"]["cash"] + self.f.s["bank"] - 5)
        E._pay(self.f.s, "bank", "p1", 5)
        self.assertEqual(self.f.s["bank"], 0)
        self.assertTrue(self.f.s["bank_broken"])
        self.assertTrue(self.f.s["end_after_set"])
        self.assertFalse(self.f.s["finished"])
        E._pay(self.f.s, "bank", "p2", 7)
        self.assertEqual(self.f.s["bank"], -7)
        self.f.to_train()
        self.f.act("end_turn")
        self.assertFalse(self.f.s["finished"])
        self.assertEqual(self.f.s["or_number"], 2)
        self.f.to_train()
        self.f.act("end_turn")
        self.assertTrue(self.f.s["finished"])
        self.assertEqual(self.f.s["end_reason"], "bank")
        expected = {pid: p["cash"] for pid, p in self.f.s["players"].items()}
        expected["p1"] += 20  # Open player-owned SV; closed privates have no value.
        corp = self.f.s["corporations"]["B&O"]
        self.assertNotEqual(E._price(corp), corp["par"])
        expected[corp["president"]] += 6 * E._price(corp)
        self.assertEqual(self.f.s["result"], expected)
        self.assertGreater(corp["cash"], 4321)
        self.assertEqual(E.legal_actions(self.f.s), {"player": None, "types": [], "choices": {}})
        self.f.reject("pass")
