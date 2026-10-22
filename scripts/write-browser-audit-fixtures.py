"""Install disposable browser-audit positions into an isolated test database.

Never point this script at a real game database. Credentials go only to the
requested temporary output file, not the audit report or terminal.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "tests")]
from decision_fixtures import fixtures
from server_bridge import KoenjiDatabase
from test_decision_coverage import DecisionCoverageTests

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--database", required=True, type=Path)
parser.add_argument("--output", required=True, type=Path)
args = parser.parse_args()
if args.database.resolve().is_relative_to(ROOT):
    parser.error("Use a disposable database outside the application directory.")
states = fixtures()
t = DecisionCoverageTests("runTest")
t.setUp()
try:
    f = t.f
    f.operating()
    f.route()
    f.train_step()
    corp = f.s["corporations"]["IR"]
    corp["holdings"].update(p1=30, p2=30, p3=0)
    corp.update(ipo=40, pool=0)
    f.cash(corp, 0)
    f.cash(f.s["players"]["p1"], 0)
    t.install(f.s)
    states["bankruptcy"] = t.request("GET")
    f.stock()
    f.shares('IR', 'p1', 50)
    f.s.update(stock_round=4, stock_passes=2, current_player='p3')
    t.install(f.s)
    states['handoff'] = t.request('GET', seat='p3')
    f.operating()
    f.route()
    f.train_step()
    f.shares('AR','p2',50)
    f.shares('SR','p3',50)
    for i,tid in enumerate(tid for tid,train in f.s['trains'].items() if train['type']=='2'):
        f.give_train('AR' if i<4 else 'SR',tid)
    t.install(f.s)
    states['phase_change'] = t.request('GET')
finally:
    t.tearDown()
db = KoenjiDatabase(args.database)
rooms = {}
for name, view in states.items():
    state = view["state"]
    state["revision"] = 0
    state["history"] = []
    room = db.create_game("1889", len(state["players"]), engine="python")
    game = db.get_game_by_room_code(room["room_code"])
    db.save_initial_state(game["id"], state, [p["name"] for p in state["players"].values()])
    seat = view["viewer"].get("player_id")
    token = room["spectator_token"] if not seat else room["player_tokens"][int(seat[1:]) - 1]
    rooms[name] = {"room": room["room_code"], "token": token, "seat": seat or "spectator", "tokens": room["player_tokens"]}
args.output.write_text(json.dumps(rooms))
args.output.chmod(0o600)
print(f"Created {len(rooms)} disposable edge-case rooms.")
