""" Playtest remediation verification suite:
- UI-002 server guard for mandatory train obligation
- Full 493-action deterministic engine replay & 494-snapshot ¥7,000 conservation check of room CYEU10
- Phases 5, 6, D progression, rusting, train limits, and Diesel trade-ins
- Concurrency, idempotency, stale revision (409), and role authorization (403)
"""
import json
import sqlite3
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from server_bridge import KoenjiAppService, KoenjiDatabase
from app.engine1889 import apply_action, legal_actions, new_game, replay
from app.engine1889 import engine as E
from app.unittests import test_Engine1889 as fixtures


class PlaytestRemediationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = KoenjiDatabase(Path(self.tmp.name) / "remediation.sqlite3")
        self.svc = KoenjiAppService(self.db)
        self.f = fixtures.Rules1889Tests("runTest")
        self.f.setUp()

    def tearDown(self):
        self.tmp.cleanup()

    def install(self, state):
        state = deepcopy(state)
        state["revision"] = 0
        state["history"] = []
        self.room = self.db.create_game("1889", len(state["players"]), engine="python")
        self.game = self.db.get_game_by_room_code(self.room["room_code"])
        self.db.save_initial_state(
            self.game["id"], state, [p["name"] for p in state["players"].values()]
        )
        self.path = f"/api/1889/games/{self.room['room_code']}"
        return state

    def request(self, method, suffix="", body=None, seat="p1", expect_status=200):
        token = (
            self.room["spectator_token"]
            if seat == "spectator"
            else (
                self.room["creator_token"]
                if seat == "creator"
                else self.room["player_tokens"][int(seat[1:]) - 1]
            )
        )
        status, result = self.svc.handle(
            method, self.path + suffix, body, "Bearer " + token
        )
        self.assertEqual(status, expect_status, result)
        return result

    def test_ui002_mandatory_train_blocks_end_turn_until_train_purchased(self):
        f = self.f
        f.operating()
        f.route()
        f.train_step()
        self.install(f.s)

        view = self.request("GET", seat="p1")
        self.assertIsNotNone(view["train_financing"])
        self.assertEqual(view["train_financing"]["mandatory"], True)
        self.assertNotIn("end_turn", view["legal_actions"]["types"])
        self.assertTrue(view["legal_actions"]["choices"].get("mandatory_train"))
        self.assertNotIn({"type": "end_turn"}, view["action_options"])

        # Attempting to submit end_turn directly to backend is rejected with 422
        self.request(
            "POST",
            "/actions",
            {
                "expected_revision": view["state"]["revision"],
                "command_id": "premature-end-ir",
                "action": {"type": "end_turn"},
            },
            seat="p1",
            expect_status=422,
        )

        # Buying a 2-train satisfies the obligation and unlocks end_turn
        after_buy = self.request(
            "POST",
            "/actions",
            {
                "expected_revision": view["state"]["revision"],
                "command_id": "buy-mandatory-2",
                "action": {"type": "buy_train", "train": "2-0"},
            },
            seat="p1",
        )
        self.assertIsNone(after_buy["train_financing"])
        self.assertIn("end_turn", after_buy["legal_actions"]["types"])
        self.assertIn({"type": "end_turn"}, after_buy["action_options"])

    def test_phases_5_6_diesel_privates_rust_and_offboard_progression(self):
        f = self.f
        f.operating()
        f.route()
        f.give_train("IR", "3-0")
        f.give_train("IR", "4-0")
        f.cash(f.s["corporations"]["IR"], 3000)
        f.s["operating_turn"].update(step="train", routes=[], revenue=0, dividend=True)

        # Add 4th player to test UTF revenue jump in Phase 5 (conserving total ¥7,000)
        f.s["players"]["p4"] = {"id": "p4", "name": "Nori", "cash": 0, "bankrupt": False}
        f.s["player_order"].append("p4")
        for c in f.s["corporations"].values():
            c["holdings"]["p4"] = 0
        f.s["privates"]["UTF"] = {
            "id": "UTF",
            "name": "Uno-Takamatsu Ferry",
            "value": 150,
            "revenue": 30,
            "hexes": [],
            "owner": "p1",
            "closed": False,
            "used": False,
        }

        # Transition to Phase 5: train limit becomes 2, non-UTF privates close, UTF revenue -> 50
        E._phase_change(f.s, "5")
        self.assertEqual(f.s["phase"], "5")
        self.assertEqual(f.s["privates"]["UTF"]["revenue"], 50)
        self.assertFalse(f.s["privates"]["UTF"]["closed"])
        for pid, priv in f.s["privates"].items():
            if pid != "UTF":
                self.assertTrue(priv["closed"], f"{pid} should close in Phase 5")

        # Transition to Phase 6: 3-trains rust
        E._phase_change(f.s, "6")
        self.assertEqual(f.s["phase"], "6")
        self.assertTrue(f.s["trains"]["3-0"]["rusted"])
        self.assertNotIn("3-0", f.s["corporations"]["IR"]["trains"])

        # Buy Diesel with 4-0 trade-in (cost 1100 - 300 = 800), rusting remaining 4-trains
        self.install(f.s)
        view = self.request("GET", seat="p1")
        trade_action = {"type": "buy_train", "train": "D-0", "trade_in": "4-0"}
        self.assertIn(trade_action, view["action_options"])
        after_d = self.request(
            "POST",
            "/actions",
            {
                "expected_revision": 0,
                "command_id": "buy-diesel-trade",
                "action": trade_action,
            },
            seat="p1",
        )
        self.assertEqual(after_d["state"]["phase"], "D")
        self.assertIn("D-0", after_d["state"]["corporations"]["IR"]["trains"])
        self.assertEqual(after_d["state"]["corporations"]["IR"]["cash"], 2200)

    def test_idempotency_stale_revision_and_authorization_guards(self):
        f = self.f
        f.stock()
        self.install(f.s)
        view = self.request("GET", seat="p1")

        # 1. Valid action commit
        cmd_id = "idempotent-stock-pass-1"
        res1 = self.request(
            "POST",
            "/actions",
            {
                "expected_revision": 0,
                "command_id": cmd_id,
                "action": {"type": "pass"},
            },
            seat="p1",
        )
        self.assertEqual(res1["state"]["revision"], 1)

        # 2. Duplicate submission with same command_id returns same revision without double-applying
        res2 = self.request(
            "POST",
            "/actions",
            {
                "expected_revision": 0,
                "command_id": cmd_id,
                "action": {"type": "pass"},
            },
            seat="p1",
        )
        self.assertEqual(res2["state"]["revision"], 1)

        # 3. Stale expected_revision with new command_id is rejected with 409 Conflict
        self.request(
            "POST",
            "/actions",
            {
                "expected_revision": 0,
                "command_id": "stale-cmd-2",
                "action": {"type": "pass"},
            },
            seat="p2",
            expect_status=409,
        )

        # 4. Wrong player turn or spectator token is rejected with 403/422
        self.request(
            "POST",
            "/actions",
            {
                "expected_revision": 1,
                "command_id": "spectator-attempt",
                "action": {"type": "pass"},
            },
            seat="spectator",
            expect_status=403,
        )

    def test_cyeu10_playtest_database_accounting_and_terminal_state(self):
        playtest_db = Path(__file__).resolve().parents[1] / "validation" / "playtest.sqlite3"
        if not playtest_db.exists():
            self.skipTest("validation/playtest.sqlite3 not present")
        conn = sqlite3.connect(str(playtest_db))
        try:
            game_row = conn.execute(
                "SELECT id, room_code, status FROM games WHERE room_code = 'CYEU10'"
            ).fetchone()
            self.assertIsNotNone(game_row)
            game_id = game_row[0]
            rows = conn.execute(
                "SELECT move_number, state_json FROM game_states WHERE game_id = ? ORDER BY move_number ASC",
                (game_id,),
            ).fetchall()
            action_rows = conn.execute(
                "SELECT revision, move_json FROM game_actions WHERE game_id = ? ORDER BY revision ASC",
                (game_id,),
            ).fetchall()
            self.assertEqual(len(rows), 494)
            self.assertEqual(len(action_rows), 493)

            initial_state = json.loads(rows[0][1])
            replayed_state = deepcopy(initial_state)

            for rev, raw in rows:
                st = json.loads(raw)
                self.assertEqual(st["revision"], rev)
                if rev > 0:
                    act_rev, act_raw = action_rows[rev - 1]
                    self.assertEqual(act_rev, rev)
                    replayed_state = apply_action(replayed_state, json.loads(act_raw))
                    self.assertEqual(
                        replayed_state,
                        st,
                        f"Engine replay diverged from stored snapshot at revision {rev}",
                    )
                personal = sum(p["cash"] for p in st["players"].values())
                corporate = sum(c["cash"] for c in st["corporations"].values())
                escrow = sum(
                    amt
                    for bids in st.get("auction", {}).get("bids", {}).values()
                    for amt in bids.values()
                )
                total = personal + corporate + st["bank"] + escrow
                self.assertEqual(total, 7000, f"Money conservation violated at rev {rev}")

            final_state = json.loads(rows[-1][1])
            player_names = [
                initial_state["players"][pid]["name"]
                for pid in initial_state["player_order"]
            ]
            full_rebuilt = replay(
                player_names, final_state["history"], initial_state["player_order"]
            )
            self.assertEqual(full_rebuilt, final_state)
            self.assertTrue(final_state["finished"])
            self.assertEqual(final_state["end_reason"], "bank")
            self.assertEqual(final_state["bank"], -411)
            self.assertEqual(
                final_state["result"],
                {"p1": 2037, "p2": 1156, "p3": 2775, "p4": 2283},
            )
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
