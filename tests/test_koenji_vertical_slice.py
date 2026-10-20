"""
End-to-end integration and acceptance tests for Koenji Railway Club 1889.
Verifies the complete vertical slice against the authoritative Daemon18xx
Python 1889 engine (`daemon18xx/app/engine1889`) and SQLite persistence.
"""

import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from server_bridge import KoenjiAppService, KoenjiDatabase


class KoenjiVerticalSliceTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmpdir.name) / "test_koenji.sqlite3"
        self.db = KoenjiDatabase(self.db_path)
        self.svc = KoenjiAppService(self.db)

    def tearDown(self):
        self.tmpdir.cleanup()

    def auth(self, token: str) -> str:
        return f"Bearer {token}"

    def test_catalog_and_health(self):
        status, health = self.svc.handle("GET", "/health")
        self.assertEqual(status, 200)
        self.assertEqual(health["status"], "ok")

        status, catalog = self.svc.handle("GET", "/api/1889/catalog")
        self.assertEqual(status, 200)
        self.assertEqual(catalog["layout"], "flat")
        self.assertEqual(catalog["currency"], "JPY")
        self.assertEqual(len(catalog["hexes"]), 52)
        self.assertEqual(len(catalog["corporations"]), 7)
        self.assertEqual(catalog["par_prices"], [65, 70, 75, 80, 90, 100])

    def test_create_start_and_reload_initial_state(self):
        status, room = self.svc.handle("POST", "/api/1889/games", {"max_players": 4})
        self.assertEqual(status, 200)
        code = room["room_code"]

        status, view = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/start",
            {"player_names": ["Daisuke", "Haruka", "Kenji", "Alex"]},
            self.auth(room["creator_token"]),
        )
        self.assertEqual(status, 200)
        self.assertEqual(view["state"]["revision"], 0)
        self.assertEqual(view["state"]["round"], "auction")
        self.assertEqual(view["state"]["bank"], 7000 - 4 * 420)

        # Reload from a fresh service instance pointing to the same SQLite file
        reloaded_svc = KoenjiAppService(KoenjiDatabase(self.db_path))
        status, p1_view = reloaded_svc.handle(
            "GET",
            f"/api/1889/games/{code}",
            None,
            self.auth(room["player_tokens"][0]),
        )
        self.assertEqual(status, 200)
        self.assertEqual(p1_view["viewer"]["player_id"], "p1")
        self.assertEqual(p1_view["viewer"]["player_name"], "Daisuke")
        self.assertEqual(p1_view["state"]["revision"], 0)

    def test_history_projects_real_initial_bank_and_timestamp_without_rewriting_game(self):
        status, fixture = self.svc.handle("POST", "/api/1889/dev/fixture", {"preset": "stock_round_1"})
        self.assertEqual(status, 200)
        code = fixture["room_code"]
        token = self.auth(fixture["player_tokens"][0])
        status, historical = self.svc.handle("GET", f"/api/1889/games/{code}/revisions/0", None, token)
        self.assertEqual(status, 200)
        event = historical["history_events"][0]
        self.assertIn(f"¥{historical['state']['bank']:,} bank cash", event["detail"])
        self.assertNotIn("¥7,000 bank", event["detail"])
        datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
        self.assertTrue(all(e.get("occurred_at") for e in historical["history_events"]))
        # Presence belongs to the current gathering, including during rewind.
        self.assertTrue(historical["presence"]["p1"]["online"])
        self.assertTrue(all(isinstance(p["online"], bool) and p["status"] in ("online", "away") for p in historical["presence"].values()))
        self.assertFalse(historical["presence"]["p2"]["online"])
        _, live = self.svc.handle("GET", f"/api/1889/games/{code}", None, token)
        self.assertEqual(live["state"]["revision"], 8)

    def test_current_gathering_updates_remain_distinct_from_historical_game_state(self):
        _, fixture = self.svc.handle("POST", "/api/1889/dev/fixture", {"preset": "stock_round_1"})
        code = fixture["room_code"]
        token = self.auth(fixture["player_tokens"][0])
        _, initial = self.svc.handle("GET", f"/api/1889/games/{code}/revisions/0", None, token)
        status, note = self.svc.handle("POST", f"/api/1889/games/{code}/club", {"action": "table_note", "text": "Tea has arrived"}, token)
        self.assertEqual(status, 200)
        self.assertTrue(note["club"]["notes"][-1]["recorded_at"].endswith("Z"))
        _, historical = self.svc.handle("GET", f"/api/1889/games/{code}/revisions/0", None, token)
        self.assertEqual(initial["state"], historical["state"])
        self.assertEqual(historical["club"]["notes"][-1]["text"], "Tea has arrived")
        self.assertEqual(historical["latest_revision"], 8)

    def test_vertical_slice_stock_purchase_idempotency_rejection_and_rewind(self):
        # 1. Create deterministic Stock Round 1 fixture via real 1889 auction moves
        status, fix = self.svc.handle(
            "POST",
            "/api/1889/dev/fixture",
            {"preset": "stock_round_1", "player_names": ["Daisuke", "Haruka", "Kenji", "Alex"]},
        )
        self.assertEqual(status, 200, fix)
        code = fix["room_code"]
        p1_token = fix["player_tokens"][0]  # Daisuke
        p2_token = fix["player_tokens"][1]  # Haruka
        spec_token = fix["spectator_token"]
        creator_token = fix["creator_token"]

        # Verify game is at Stock Round 1 (revision 8 after 8 auction moves)
        status, pre_view = self.svc.handle(
            "GET", f"/api/1889/games/{code}", None, self.auth(p1_token)
        )
        self.assertEqual(status, 200)
        rev_before = pre_view["state"]["revision"]
        self.assertEqual(rev_before, 8)
        self.assertEqual(pre_view["state"]["round"], "stock")
        self.assertEqual(pre_view["state"]["current_player"], "p1")
        daisuke_cash_before = pre_view["state"]["players"]["p1"]["cash"]
        self.assertEqual(daisuke_cash_before, 340)

        # 2. Player A (Daisuke, p1) performs a legitimate, server-validated stock purchase:
        # Sets Iyo Railway (IR) par at ¥80 and buys the 20% President's Certificate (¥160).
        status, post_view = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-buy-ir-pres",
                "expected_action_id": rev_before,
                "action": {"type": "buy_shares", "corporation": "IR", "price": 80},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 200, post_view)
        rev_after = post_view["state"]["revision"]
        self.assertEqual(rev_after, rev_before + 1)
        self.assertEqual(post_view["state"]["players"]["p1"]["cash"], 340 - 160)
        self.assertEqual(post_view["state"]["corporations"]["IR"]["holdings"]["p1"], 20)
        self.assertEqual(post_view["state"]["corporations"]["IR"]["president"], "p1")
        self.assertEqual(post_view["state"]["corporations"]["IR"]["ipo"], 80)
        self.assertEqual(post_view["last_event"]["animation"], "certificate_purchase")

        # 3. Retry with the exact same command_id (idempotency check):
        # Must return 200 without purchasing a second share or incrementing revision.
        status, retry_view = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-buy-ir-pres",
                "expected_action_id": rev_before,
                "action": {"type": "buy_shares", "corporation": "IR", "price": 80},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 200)
        self.assertTrue(retry_view.get("idempotent_replay"))
        self.assertEqual(retry_view["state"]["revision"], rev_after)
        self.assertEqual(retry_view["state"]["players"]["p1"]["cash"], 180)

        # 4. Rejections leave state untouched:
        # a) Stale expected_action_id with new command_id -> 409
        status, err_stale = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-stale-attempt",
                "expected_action_id": rev_before,
                "action": {"type": "end_turn"},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 409)

        # b) Wrong player turn (Haruka trying to act during Daisuke's turn) -> 422
        status, err_turn = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-wrong-turn",
                "expected_action_id": rev_after,
                "action": {"type": "pass"},
            },
            self.auth(p2_token),
        )
        self.assertEqual(status, 422)

        # c) Actor impersonation (p1 token claiming to be p2) -> 403
        status, err_impersonate = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-impersonate",
                "expected_action_id": rev_after,
                "action": {"type": "end_turn", "player": "p2"},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 403)

        # d) Spectator and Creator cannot submit gameplay actions -> 403
        for tok in (spec_token, creator_token):
            status, _ = self.svc.handle(
                "POST",
                f"/api/1889/games/{code}/actions",
                {
                    "command_id": "cmd-non-player",
                    "expected_action_id": rev_after,
                    "action": {"type": "end_turn"},
                },
                self.auth(tok),
            )
            self.assertEqual(status, 403)

        # e) Illegal 1889 rule action (buying a second certificate in the same turn) -> 422
        status, err_rule = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-double-buy",
                "expected_action_id": rev_after,
                "action": {"type": "buy_shares", "corporation": "IR", "source": "ipo"},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 422)

        # 5. Player B (Haruka, p2) inspects live state, then scrubs backward to rev_before (8)
        # and forward to rev_after (9), without altering live server state.
        status, p2_live = self.svc.handle(
            "GET", f"/api/1889/games/{code}", None, self.auth(p2_token)
        )
        self.assertEqual(status, 200)
        self.assertEqual(p2_live["state"]["revision"], rev_after)
        self.assertEqual(p2_live["state"]["corporations"]["IR"]["holdings"]["p1"], 20)

        status, p2_hist_before = self.svc.handle(
            "GET",
            f"/api/1889/games/{code}/revisions/{rev_before}",
            None,
            self.auth(p2_token),
        )
        self.assertEqual(status, 200)
        self.assertTrue(p2_hist_before["is_historical"])
        self.assertEqual(p2_hist_before["state"]["revision"], rev_before)
        self.assertEqual(p2_hist_before["latest_revision"], rev_after)
        self.assertEqual(
            p2_hist_before["state"]["corporations"]["IR"]["holdings"]["p1"], 0
        )
        self.assertEqual(p2_hist_before["state"]["players"]["p1"]["cash"], 340)

        status, p2_hist_after = self.svc.handle(
            "GET",
            f"/api/1889/games/{code}/revisions/{rev_after}",
            None,
            self.auth(p2_token),
        )
        self.assertEqual(status, 200)
        self.assertFalse(p2_hist_after["is_historical"])
        self.assertEqual(
            p2_hist_after["state"]["corporations"]["IR"]["holdings"]["p1"], 20
        )

        # 6. Simulate server restart and verify persistence of state, history, and club stamp
        status, stamp_res = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/club",
            {"action": "stamp_card"},
            self.auth(p1_token),
        )
        self.assertEqual(status, 200)
        self.assertFalse(stamp_res["already_stamped"])

        # Second stamp in the same gathering is a no-op (one stamp per gathering rule)
        status, stamp_dup = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/club",
            {"action": "stamp_card"},
            self.auth(p1_token),
        )
        self.assertEqual(status, 200)
        self.assertTrue(stamp_dup["already_stamped"])

        restarted_svc = KoenjiAppService(KoenjiDatabase(self.db_path))
        status, after_restart = restarted_svc.handle(
            "GET", f"/api/1889/games/{code}", None, self.auth(p2_token)
        )
        self.assertEqual(status, 200)
        self.assertEqual(after_restart["state"]["revision"], rev_after)
        self.assertIn("p1", after_restart["club"]["stamps"])
        self.assertEqual(len(after_restart["history_events"]), rev_after + 1)

    def test_operating_round_fixture_track_routes_and_dividend(self):
        status, fix = self.svc.handle(
            "POST", "/api/1889/dev/fixture", {"preset": "operating_round_1"}
        )
        self.assertEqual(status, 200, fix)
        code = fix["room_code"]
        p1_token = fix["player_tokens"][0]
        state = fix["view"]["state"]
        self.assertEqual(state["round"], "operating")
        self.assertEqual(state["current_corporation"], "IR")
        self.assertEqual(state["current_player"], "p1")
        rev = state["revision"]

        # Lay yellow tile #5 at E2 (Matsuyama, IR's home hex) with rotation 4
        status, after_lay = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-or-lay-e2",
                "expected_action_id": rev,
                "action": {"type": "lay_tile", "hex": "E2", "tile": "5", "rotation": 4},
            },
            self.auth(p1_token),
        )
        self.assertEqual(status, 200, after_lay)
        self.assertEqual(after_lay["state"]["board"]["E2"]["tile"], "5")

    def test_private_company_auction_start_runoff_cascade_and_completion(self):
        # 1. Start at Revision 0 in the Private Company Auction round
        status, fix = self.svc.handle(
            "POST",
            "/api/1889/dev/fixture",
            {"preset": "auction_start", "player_names": ["Daisuke", "Haruka", "Kenji", "Alex"]},
        )
        self.assertEqual(status, 200, fix)
        code = fix["room_code"]
        tokens = {f"p{i + 1}": fix["player_tokens"][i] for i in range(4)}
        state = fix["view"]["state"]
        self.assertEqual(state["revision"], 0)
        self.assertEqual(state["round"], "auction")
        self.assertEqual(state["current_player"], "p1")

        # 2. All 4 players pass on TR -> TR discount increases by ¥5 (offered at ¥15)
        for idx, pid in enumerate(["p1", "p2", "p3", "p4"]):
            status, res = self.svc.handle(
                "POST",
                f"/api/1889/games/{code}/actions",
                {
                    "command_id": f"cmd-pass-tr-{idx}",
                    "expected_action_id": idx,
                    "action": {"type": "pass"},
                },
                self.auth(tokens[pid]),
            )
            self.assertEqual(status, 200, res)
        self.assertEqual(res["state"]["auction"]["discount"], 5)
        self.assertIn("¥15", res["last_event"]["label"])

        # 3. p1 escrows ¥35 on MF, p2 escrows ¥45 on ER, p3 escrows ¥50 on ER (creating a 2-bidder runoff on ER)
        moves = [
            ("p1", {"type": "bid", "company": "MF", "price": 35}),
            ("p2", {"type": "bid", "company": "ER", "price": 45}),
            ("p3", {"type": "bid", "company": "ER", "price": 50}),
        ]
        curr_rev = 4
        for pid, act in moves:
            status, res = self.svc.handle(
                "POST",
                f"/api/1889/games/{code}/actions",
                {
                    "command_id": f"cmd-bid-{curr_rev}",
                    "expected_action_id": curr_rev,
                    "action": act,
                },
                self.auth(tokens[pid]),
            )
            self.assertEqual(status, 200, res)
            curr_rev += 1

        # 4. p4 buys offered TR for discounted ¥15 -> MF (sole bid by p1) cascades automatically to p1,
        # and ER (2 bids: p2 @ ¥45, p3 @ ¥50) enters competitive runoff with p2 to act!
        status, res = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-p4-buy-tr-15",
                "expected_action_id": curr_rev,
                "action": {"type": "buy_private", "company": "TR", "price": 15},
            },
            self.auth(tokens["p4"]),
        )
        self.assertEqual(status, 200, res)
        curr_rev += 1
        st = res["state"]
        self.assertEqual(st["privates"]["TR"]["owner"], "p4")
        self.assertEqual(st["privates"]["MF"]["owner"], "p1")
        self.assertEqual(st["auction"]["active"], "ER")
        self.assertEqual(st["current_player"], "p2")
        self.assertIn("MF awarded to Daisuke", res["last_event"]["detail"])
        self.assertIn("runoff begins on ER", res["last_event"]["detail"])

        # 5. In ER runoff, p2 passes -> p3 wins ER for ¥50 and normal auction resumes at p1 on SMR
        status, res = self.svc.handle(
            "POST",
            f"/api/1889/games/{code}/actions",
            {
                "command_id": "cmd-p2-pass-er-runoff",
                "expected_action_id": curr_rev,
                "action": {"type": "pass"},
            },
            self.auth(tokens["p2"]),
        )
        self.assertEqual(status, 200, res)
        curr_rev += 1
        st = res["state"]
        self.assertEqual(st["privates"]["ER"]["owner"], "p3")
        self.assertIsNone(st["auction"]["active"])
        self.assertEqual(st["current_player"], "p1")
        self.assertIn("Kenji wins ER", res["last_event"]["label"])

        # 6. Buy remaining privates (SMR, DR, SIR, UTF) to transition cleanly into Stock Round 1
        for pid, comp, price in [
            ("p1", "SMR", 50),
            ("p2", "DR", 60),
            ("p3", "SIR", 80),
            ("p4", "UTF", 150),
        ]:
            status, res = self.svc.handle(
                "POST",
                f"/api/1889/games/{code}/actions",
                {
                    "command_id": f"cmd-buy-{comp}",
                    "expected_action_id": curr_rev,
                    "action": {"type": "buy_private", "company": comp, "price": price},
                },
                self.auth(tokens[pid]),
            )
            self.assertEqual(status, 200, res)
            curr_rev += 1

        self.assertEqual(res["state"]["round"], "stock")
        self.assertEqual(res["state"]["stock_round"], 1)
        self.assertEqual(res["state"]["priority"], "p1")


if __name__ == "__main__":
    unittest.main()

