#!/usr/bin/env python3
"""
Koenji Railway Club 1889 — Authoritative Backend Bridge & Action Journal Server.

Wraps the stateless Python 1889 rules engine in `daemon18xx/app/engine1889`
with SQLite persistence (`games`, `players`, `game_states`, `game_actions`,
`club_gatherings`). Implements the full Daemon18xx HTTP contract documented in
`daemon18xx/docs/frontend_integration.md` plus:
  - Monotonic per-game revisions with atomic snapshot + journal commits
  - `command_id` idempotency so retried requests return the original commit
  - Non-mutating historical state inspection (`GET /api/1889/games/{room}/revisions/{rev}`)
  - Structured action journal (`GET /api/1889/games/{room}/history`)
  - Deterministic, rules-validated development fixtures (`POST /api/1889/dev/fixture`)
  - Clubroom-only social state (`POST /api/1889/games/{room}/club`)
"""

import json
import hashlib
import os
import secrets
import sqlite3
import string
import sys
import threading
from copy import deepcopy
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, unquote, urlparse

ROOT_DIR = Path(__file__).resolve().parent
BRIDGE_BUILD = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()[:12]
APPEARANCE_CATALOG = json.loads((ROOT_DIR / "src/data/appearance.json").read_text())
LEGACY_FACE_IDS = {f["id"] for f in APPEARANCE_CATALOG["faces"] if not f.get("headAtlas")}
APPEARANCE_CATALOG["faces"] = [f for f in APPEARANCE_CATALOG["faces"] if f.get("headAtlas")]
DEFAULT_APPEARANCE = {"face": "reference-01", "clothes": "indigo-haori"}


def clean_appearance(value):
    if not isinstance(value, dict):
        raise ValueError("Choose a face and Meiji-inspired clothes")
    value = dict(value)
    if not isinstance(value.get("face"), str) or not isinstance(value.get("clothes"), str):
        raise ValueError("Choose an available face and outfit")
    if value.get("face") in LEGACY_FACE_IDS:
        value["face"] = DEFAULT_APPEARANCE["face"]
    if value.get("face") not in {f["id"] for f in APPEARANCE_CATALOG["faces"]} or value.get("clothes") not in {c["id"] for c in APPEARANCE_CATALOG["clothes"]}:
        raise ValueError("Choose an available face and outfit")
    return {"face": value["face"], "clothes": value["clothes"]}


DAEMON_DIR = ROOT_DIR / "daemon18xx"
if str(DAEMON_DIR) not in sys.path:
    sys.path.insert(0, str(DAEMON_DIR))

from app.engine1889 import (  # noqa: E402
    RuleError,
    apply_action,
    best_routes,
    legal_actions,
    migrate_state,
    new_game,
    replay,
)
from app.engine1889.board import (  # noqa: E402
    lay_tile,
    node_info,
    neighbor,
    reachable,
    route_candidates,
    route_revenue,
    tile_for,
)
from app.engine1889.board_data import DATA  # noqa: E402
from app.engine1889.data import (  # noqa: E402
    CERT_LIMITS,
    CORPORATIONS,
    MARKET,
    PAR_PRICES,
    PHASES,
    PRIVATES,
    TRAIN_TYPES,
    UPGRADES,
)
from app.engine1889.engine import (  # noqa: E402
    _price,
    _zone,
    available_depot,
    certificate_count,
)

DEFAULT_DB_PATH = ROOT_DIR / "data" / "games.sqlite3"


def generate_token(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_room_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def now_jst_clock() -> str:
    return datetime.now().strftime("%H:%M")


def summarize_transition(
    before: Dict[str, Any], after: Dict[str, Any], action: Dict[str, Any]
) -> Dict[str, Any]:
    """Derive concise structured visual facts from before/after authoritative state."""
    actor_id = action.get("player")
    actor_name = (
        after["players"].get(actor_id, {}).get("name")
        or before["players"].get(actor_id, {}).get("name")
        or actor_id
        or "System"
    )
    kind = action.get("type", "unknown")
    cash_before = before["players"].get(actor_id, {}).get("cash", 0)
    cash_after = after["players"].get(actor_id, {}).get("cash", 0)
    cash_delta = cash_after - cash_before

    event: Dict[str, Any] = {
        "type": kind,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "round_before": before.get("round"),
        "round_after": after.get("round"),
        "phase_before": before.get("phase"),
        "phase_after": after.get("phase"),
        "cash_delta": cash_delta,
        "animation": None,
        "label": f"{actor_name} performs {kind}",
        "detail": "",
    }

    if kind == "buy_shares":
        cid = action.get("corporation", "")
        corp_before = before["corporations"].get(cid, {})
        corp_after = after["corporations"].get(cid, {})
        corp_name = corp_after.get("name", cid)
        pct_before = corp_before.get("holdings", {}).get(actor_id, 0)
        pct_after = corp_after.get("holdings", {}).get(actor_id, 0)
        pct_bought = pct_after - pct_before
        shares_count = pct_bought // 10
        source = action.get("source", "ipo").upper()
        unit_price = corp_after.get("par") if source == "IPO" else _price(corp_after)
        floated_now = (not corp_before.get("floated")) and bool(corp_after.get("floated"))
        par_set = corp_before.get("par") is None and corp_after.get("par") is not None
        event.update(
            {
                "corporation": cid,
                "corporation_name": corp_name,
                "percent": pct_bought,
                "shares": shares_count,
                "source": source,
                "unit_price": unit_price,
                "cost": -cash_delta,
                "par_set": corp_after.get("par") if par_set else None,
                "floated": floated_now,
                "president": corp_after.get("president"),
                "animation": "certificate_purchase",
                "label": (
                    f"{actor_name} sets {cid} par at ¥{corp_after.get('par')} & buys President's share (20%)"
                    if par_set
                    else f"{actor_name} buys {pct_bought}% {cid} from {source} (¥{-cash_delta})"
                ),
                "detail": (
                    f"{corp_name} floats with ¥{corp_after.get('cash', 0)} treasury!"
                    if floated_now
                    else f"{actor_name} now holds {pct_after}% of {corp_name}."
                ),
            }
        )
    elif kind in ("sell_shares", "emergency_sell"):
        cid = action.get("corporation", "")
        corp_after = after["corporations"].get(cid, {})
        pct = action.get("percent", 10)
        event.update(
            {
                "corporation": cid,
                "corporation_name": corp_after.get("name", cid),
                "percent": pct,
                "shares": pct // 10,
                "proceeds": cash_delta,
                "price_after": _price(corp_after),
                "animation": "certificate_sale",
                "label": f"{actor_name} sells {pct}% {cid} to Bank Pool (+¥{cash_delta})",
                "detail": f"{cid} share price is now ¥{_price(corp_after)}.",
            }
        )
    elif kind in ("buy_private", "bid"):
        pid = action.get("company", "")
        priv_after = after["privates"].get(pid, {})
        priv_name = priv_after.get("name", pid)
        if before.get("round") == "auction":
            newly_awarded = [
                p_id
                for p_id, p_obj in after.get("privates", {}).items()
                if not before.get("privates", {}).get(p_id, {}).get("owner")
                and p_obj.get("owner")
            ]
            cascade_awards = [p_id for p_id in newly_awarded if p_id != pid]
            cascade_notes = [
                f"{p_id} awarded to {after['players'].get(after['privates'][p_id]['owner'], {}).get('name', after['privates'][p_id]['owner'])}"
                for p_id in cascade_awards
            ]
            active_runoff = after.get("auction", {}).get("active")
            if priv_after.get("owner") == actor_id:
                paid = action.get("price", priv_after.get("value", -cash_delta))
                detail_parts = []
                if cascade_notes:
                    detail_parts.append("Sole bids resolved: " + ", ".join(cascade_notes) + ".")
                if after.get("round") == "stock":
                    detail_parts.append("Auction concludes — Stock Round 1 begins!")
                elif active_runoff:
                    detail_parts.append(f"Competitive bidding runoff begins on {active_runoff}!")
                else:
                    detail_parts.append(f"Revenue ¥{priv_after.get('revenue', 0)}/OR")
                event.update(
                    {
                        "company": pid,
                        "company_name": priv_name,
                        "price": paid,
                        "animation": "private_acquired",
                        "label": f"{actor_name} acquires {pid} ({priv_name}) for ¥{paid}",
                        "detail": " ".join(detail_parts),
                    }
                )
            else:
                bid_price = action.get("price", 0)
                event.update(
                    {
                        "company": pid,
                        "company_name": priv_name,
                        "price": bid_price,
                        "label": f"{actor_name} bids ¥{bid_price} on {pid} ({priv_name})",
                        "detail": (
                            f"Competitive runoff bid on {priv_name} (¥{bid_price})."
                            if before.get("auction", {}).get("active") == pid
                            else f"Escrowed bid on {priv_name} (¥{bid_price})."
                        ),
                    }
                )
        else:
            buyer = action.get("buyer", after.get("current_corporation"))
            price = action.get("price", 0)
            event.update(
                {
                    "company": pid,
                    "company_name": priv_name,
                    "buyer": buyer,
                    "price": price,
                    "animation": "private_acquired",
                    "label": f"{buyer} purchases private {pid} for ¥{price}",
                    "detail": f"Transferred to {buyer} treasury.",
                }
            )
    elif kind == "lay_tile":
        hex_id = action.get("hex", "")
        tile_id = action.get("tile", "")
        rot = action.get("rotation", 0)
        cid = before.get("current_corporation")
        special = action.get("special")
        event.update(
            {
                "hex": hex_id,
                "tile": tile_id,
                "rotation": rot,
                "corporation": cid,
                "special": special,
                "animation": "track_laid",
                "label": (
                    f"{actor_name} lays special ({special}) tile #{tile_id} on {hex_id}"
                    if special
                    else f"{cid} ({actor_name}) lays tile #{tile_id} on {hex_id}"
                ),
                "detail": f"Hex {hex_id} upgraded with tile #{tile_id} (rot {rot}).",
            }
        )
    elif kind == "place_token":
        hex_id = action.get("hex", "")
        cid = before.get("current_corporation")
        event.update(
            {
                "hex": hex_id,
                "corporation": cid,
                "animation": "token_placed",
                "label": f"{cid} ({actor_name}) places a station token at {hex_id}",
                "detail": f"Station established at {hex_id}.",
            }
        )
    elif kind in ("run_routes", "run_best_routes"):
        cid = before.get("current_corporation")
        rev = (after.get("operating_turn") or {}).get("revenue", 0)
        routes = (after.get("operating_turn") or {}).get("routes") or []
        event.update(
            {
                "corporation": cid,
                "revenue": rev,
                "routes_count": len(routes),
                "animation": "routes_claimed",
                "label": f"{cid} runs {len(routes)} train(s) for ¥{rev} revenue",
                "detail": "Awaiting dividend payout or withhold decision.",
            }
        )
        quote = route_plan_quote(after, cid, routes)
        event["route_run"] = {
            "version": 1, "corporation": cid, "revenue": rev,
            "track": {coord: {"nodes": [{} for _ in after["board"][coord]["nodes"]],
                              "paths": deepcopy(after["board"][coord]["paths"])}
                      for coord in sorted({v.split(":")[0] for route in routes for v in route["vertices"]})},
            "routes": [dict(deepcopy(route), revenue=quote["route_revenues"][route["train"]],
                            train_type=after["trains"][route["train"]]["type"],
                            scored_stops=quote["stops"][index]["stops"])
                       for index, route in enumerate(routes)],
            "idle_trains": [tid for tid in after["corporations"][cid]["trains"]
                            if tid not in {route["train"] for route in routes}],
        }
    elif kind == "dividend":
        cid = before.get("current_corporation")
        rev = (after.get("operating_turn") or {}).get("revenue", 0)
        payout = action.get("payout")
        if payout is None:
            payout = action.get("kind") == "payout"
        corp_after = after["corporations"].get(cid, {})
        event.update(
            {
                "corporation": cid,
                "revenue": rev,
                "payout": bool(payout),
                "price_after": _price(corp_after),
                "animation": "dividend_payout" if payout and rev > 0 else "dividend_withhold",
                "label": (
                    f"{cid} pays out ¥{rev} in dividends to shareholders"
                    if payout and rev > 0
                    else f"{cid} withholds ¥{rev} to corporate treasury"
                ),
                "detail": f"{cid} share price moves to ¥{_price(corp_after)}.",
            }
        )
    elif kind == "buy_train":
        cid = before.get("current_corporation")
        tid = action.get("train", "")
        t_obj = after["trains"].get(tid, {})
        event.update(
            {
                "corporation": cid,
                "train": tid,
                "train_type": t_obj.get("type"),
                "animation": "train_purchased",
                "label": f"{cid} purchases {tid} train",
                "detail": (
                    f"Phase advances to Phase {after.get('phase')}!"
                    if before.get("phase") != after.get("phase")
                    else f"{cid} now operates {len(after['corporations'][cid]['trains'])} train(s)."
                ),
            }
        )
    elif kind in ("pass", "end_turn", "skip"):
        round_transition = (
            f" → {after.get('round').capitalize()} Round"
            if before.get("round") != after.get("round")
            else ""
        )
        label_verb = (
            "passes"
            if kind == "pass"
            else ("skips step" if kind == "skip" else "ends turn")
        )
        if before.get("round") == "auction" and kind == "pass":
            newly_awarded = [
                p_id
                for p_id, p_obj in after.get("privates", {}).items()
                if not before.get("privates", {}).get(p_id, {}).get("owner")
                and p_obj.get("owner")
            ]
            disc_before = before.get("auction", {}).get("discount", 0)
            disc_after = after.get("auction", {}).get("discount", 0)
            if newly_awarded:
                first_id = newly_awarded[0]
                winner_id = after["privates"][first_id]["owner"]
                winner_name = after["players"].get(winner_id, {}).get("name", winner_id)
                award_summary = ", ".join(
                    f"{p_id} → {after['players'].get(after['privates'][p_id]['owner'], {}).get('name', after['privates'][p_id]['owner'])}"
                    for p_id in newly_awarded
                )
                event.update(
                    {
                        "company": first_id,
                        "company_name": after["privates"][first_id].get("name", first_id),
                        "animation": "private_acquired",
                        "label": f"{actor_name} passes · {winner_name} wins {first_id}{round_transition}",
                        "detail": (
                            f"Awarded: {award_summary}. Auction concludes — Stock Round 1 begins!"
                            if after.get("round") == "stock"
                            else f"Awarded: {award_summary}. Next up: {after['players'].get(after.get('current_player'), {}).get('name', '—')}"
                        ),
                    }
                )
            elif disc_after > disc_before:
                new_tr_price = max(0, 20 - disc_after)
                event.update(
                    {
                        "label": f"{actor_name} passes · TR discounted to ¥{new_tr_price}",
                        "detail": f"All players passed — Takamatsu E-Railroad (TR) offer price drops to ¥{new_tr_price}.",
                    }
                )
            else:
                event.update(
                    {
                        "label": f"{actor_name} {label_verb}{round_transition}",
                        "detail": f"Next up: {after['players'].get(after.get('current_player'), {}).get('name', '—')}",
                    }
                )
        else:
            event.update(
                {
                    "label": f"{actor_name} {label_verb}{round_transition}",
                    "detail": (
                        f"Transitioned to {after.get('round')} round."
                        if round_transition
                        else f"Next up: {after['players'].get(after.get('current_player'), {}).get('name', '—')}"
                    ),
                }
            )

    # Additional presentation facts are derived from the accepted transition.
    # They never participate in rule validation or mutate either snapshot.
    awards = []
    for company, private in after.get("privates", {}).items():
        winner = private.get("owner")
        if before.get("privates", {}).get(company, {}).get("owner") or winner not in after["players"]:
            continue
        bids = before.get("auction", {}).get("bids", {}).get(company, {})
        price = bids.get(winner)
        if action.get("company") == company and actor_id == winner:
            price = action.get("price", price)
        award = {"company": company, "player_id": winner}
        if price is not None:
            award["price"] = price
        awards.append(award)
    if awards:
        event["private_awards"] = awards

    changes = []
    for cid, corp in after.get("corporations", {}).items():
        previous = before.get("corporations", {}).get(cid, {})
        if previous.get("president") and previous.get("president") != corp.get("president"):
            changes.append({"corporation": cid, "from": previous["president"], "to": corp.get("president")})
        if cid == event.get("corporation") and event.get("floated"):
            event["float_funding"] = corp.get("cash", 0)
    if changes:
        event["presidency_changes"] = changes
    rusted = []
    for tid, train in after.get("trains", {}).items():
        old = before.get("trains", {}).get(tid, {})
        if train.get("rusted") and not old.get("rusted") and old.get("owner") in before.get("corporations", {}):
            cid = old["owner"]
            rusted.append({"train": tid, "type": train.get("type"), "corporation": cid,
                           "president": before["corporations"][cid].get("president")})
    if rusted:
        event["rusted_trains"] = rusted
    if kind == "bid" and not awards:
        bids = before.get("auction", {}).get("bids", {}).get(action.get("company"), {})
        high = max(bids.values(), default=None)
        if high is not None and action.get("price", 0) > high:
            event["outbid_players"] = [pid for pid, amount in bids.items() if amount == high and pid != actor_id]
    if kind == "offer":
        event.update(item=action.get("item"), price=action.get("price"), seller=action.get("seller"), buyer=action.get("buyer"))
    if kind == "buy_train":
        train = before.get("trains", {}).get(action.get("train"), {})
        if train.get("owner") == "depot":
            event["price"] = train.get("price", 0) - (300 if action.get("trade_in") else 0)
        elif "price" in action:
            event["price"] = action["price"]
        event["seller"] = train.get("owner")
    if kind == "buy_private" and before.get("round") != "auction":
        event["corporation"] = action.get("buyer") or before.get("current_corporation")
        event["negotiated"] = True
    if kind == "exchange_private":
        # The accepted DR exchange is visible as the private closing and IPO shares moving.
        event["company"] = "DR"
        for cid, corp in after.get("corporations", {}).items():
            gained = corp.get("holdings", {}).get(actor_id, 0) - before["corporations"][cid].get("holdings", {}).get(actor_id, 0)
            if gained > 0:
                event.update(corporation=cid, percent=gained)
                break
    if kind == "discard_train":
        tid = action.get("train")
        event.update(train=tid, train_type=before.get("trains", {}).get(tid, {}).get("type"))
    if not before.get("bank_broken") and after.get("bank_broken"):
        event["bank_end_pending"] = not after.get("finished")
    if not before.get("finished") and after.get("finished"):
        event["finished"] = True
        results = after.get("result") or {}
        if results:
            best = max(results.values())
            event["winners"] = [pid for pid, value in results.items() if value == best]
    # Positive cash changes are authoritative receipts, including automatic
    # private income at round transitions. Presentation never invents an amount
    # from route revenue or pays anything a second time during history playback.
    receipts = []
    for collection, destination in (("players", "purse"), ("corporations", "treasury")):
        for recipient, account in after.get(collection, {}).items():
            amount = account.get("cash", 0) - before.get(collection, {}).get(recipient, {}).get("cash", 0)
            if amount > 0:
                receipts.append({"recipient": recipient, "destination": destination,
                                 "amount": amount, "name": account.get("name", recipient)})
    if receipts:
        event["cash_receipts"] = receipts
    deltas = []
    for collection, destination in (("players", "purse"), ("corporations", "treasury")):
        for recipient, account in after.get(collection, {}).items():
            previous = before.get(collection, {}).get(recipient, {}).get("cash", 0)
            current = account.get("cash", 0)
            if current != previous:
                deltas.append(dict(recipient=recipient, destination=destination,
                                   name=account.get("name", recipient), before=previous,
                                   after=current, amount=current-previous))
    if deltas:
        event["account_deltas"] = deltas
    movements = []
    for cid, corp in after.get("corporations", {}).items():
        old = before.get("corporations", {}).get(cid, {})
        if corp.get("position") is not None and (old.get("position") != corp.get("position") or
                (kind == "dividend" and cid == before.get("current_corporation"))):
            movements.append(dict(corporation=cid, before=deepcopy(old.get("position")),
                                  after=deepcopy(corp.get("position")),
                                  price_before=_price(old), price_after=_price(corp)))
    if movements:
        event["market_movements"] = movements
    if kind == "dividend":
        corp = before["corporations"][before["current_corporation"]]
        revenue = (after.get("operating_turn") or {}).get("revenue", 0)
        event["revenue"] = revenue
        claimed = (before.get("operating_turn") or {}).get("revenue", 0)
        if claimed != revenue:
            event["revenue_revision"] = {"before": claimed, "after": revenue}
        event["dividend_allocation"] = {
            "players": {pid: revenue * percent // 100 for pid, percent in corp["holdings"].items() if percent > 0} if event["payout"] else {},
            "treasury": revenue * corp["pool"] // 100 if event["payout"] else revenue,
            "ipo_retained_by_bank": revenue * corp["ipo"] // 100 if event["payout"] else 0,
        }
    floats = [{"corporation": cid, "name": corp.get("name", cid),
               "funding": corp.get("par", 0) * 10}
              for cid, corp in after.get("corporations", {}).items()
              if corp.get("floated") and not before.get("corporations", {}).get(cid, {}).get("floated")]
    if floats:
        event["flotations"] = floats
    return event


class KoenjiDatabase:
    """Thread-safe SQLite manager preserving Daemon18xx schema + action journal."""

    def __init__(self, db_path: Optional[Path] = None):
        env_path = os.environ.get("DAEMON18XX_DATABASE")
        self.db_path = Path(env_path) if env_path else (db_path or DEFAULT_DB_PATH)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._locks: Dict[int, threading.Lock] = {}
        self._global_lock = threading.Lock()
        self.initialize()

    def game_lock(self, game_id: int) -> threading.Lock:
        with self._global_lock:
            if game_id not in self._locks:
                self._locks[game_id] = threading.Lock()
            return self._locks[game_id]

    def _connect(self):
        from contextlib import contextmanager

        @contextmanager
        def _cm():
            conn = sqlite3.connect(str(self.db_path), timeout=10.0)
            conn.row_factory = sqlite3.Row
            try:
                yield conn
            finally:
                conn.close()

        return _cm()

    def initialize(self) -> None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS games (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_code TEXT UNIQUE NOT NULL,
                    variant TEXT NOT NULL,
                    engine TEXT NOT NULL DEFAULT 'python',
                    status TEXT NOT NULL,
                    creator_token TEXT NOT NULL,
                    spectator_token TEXT NOT NULL,
                    max_players INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cols = [
                r[1] for r in conn.execute("PRAGMA table_info(games)").fetchall()
            ]
            if "engine" not in cols:
                conn.execute(
                    "ALTER TABLE games ADD COLUMN engine TEXT NOT NULL DEFAULT 'legacy'"
                )

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id INTEGER NOT NULL,
                    player_name TEXT NOT NULL,
                    player_token TEXT UNIQUE NOT NULL,
                    player_order INTEGER,
                    is_spectator BOOLEAN DEFAULT 0,
                    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (game_id) REFERENCES games(id)
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS game_states (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id INTEGER NOT NULL,
                    state_json TEXT NOT NULL,
                    move_number INTEGER NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (game_id) REFERENCES games(id)
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS game_actions (
                    game_id INTEGER NOT NULL,
                    revision INTEGER NOT NULL,
                    command_id TEXT NOT NULL,
                    actor_player_id TEXT NOT NULL,
                    move_type TEXT NOT NULL,
                    move_json TEXT NOT NULL,
                    event_json TEXT NOT NULL,
                    accepted_at TEXT NOT NULL,
                    PRIMARY KEY (game_id, revision),
                    UNIQUE (game_id, command_id)
                )
                """
            )
            if "seat_claimed" not in {row[1] for row in conn.execute("PRAGMA table_info(players)")}:
                conn.execute("ALTER TABLE players ADD COLUMN seat_claimed INTEGER NOT NULL DEFAULT 0")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS club_gatherings (
                    game_id INTEGER PRIMARY KEY,
                    club_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            game_columns = {r[1] for r in conn.execute("PRAGMA table_info(games)")}
            for column, definition in (("host_player_id", "INTEGER"), ("host_name", "TEXT NOT NULL DEFAULT 'Club Host'")):
                if column not in game_columns:
                    conn.execute(f"ALTER TABLE games ADD COLUMN {column} {definition}")
            conn.execute("""CREATE TABLE IF NOT EXISTS gathering_members (
                game_id INTEGER NOT NULL, member_key TEXT NOT NULL,
                display_name TEXT NOT NULL, appearance_json TEXT NOT NULL DEFAULT '{}',
                arrival_route TEXT NOT NULL DEFAULT 'door', entered_at TEXT, seen_at TEXT,
                PRIMARY KEY (game_id, member_key))""")
            conn.execute("""CREATE TABLE IF NOT EXISTS gathering_arrivals (
                id INTEGER PRIMARY KEY AUTOINCREMENT, game_id INTEGER NOT NULL,
                member_key TEXT NOT NULL, event_json TEXT NOT NULL, recorded_at TEXT NOT NULL)""")
            conn.commit()

    def create_game(
        self, variant: str = "1889", max_players: int = 4, engine: str = "python"
    ) -> Dict[str, Any]:
        for _ in range(5):
            room_code = generate_room_code()
            credentials = [generate_token() for _ in range(max_players + 2)]
            if len(set(credentials)) != len(credentials):
                continue
            with self._connect() as conn:
                try:
                    conn.execute("BEGIN IMMEDIATE")
                    marks = ",".join("?" for _ in credentials)
                    row = conn.execute(
                        f"SELECT 1 FROM games WHERE creator_token IN ({marks}) "
                        f"OR spectator_token IN ({marks}) UNION ALL "
                        f"SELECT 1 FROM players WHERE player_token IN ({marks}) LIMIT 1",
                        credentials * 3,
                    ).fetchone()
                    if row:
                        conn.rollback()
                        continue
                    creator_token, spectator_token = credentials[:2]
                    player_tokens = credentials[2:]
                    cur = conn.execute(
                        "INSERT INTO games (room_code, variant, status, creator_token, spectator_token, max_players, engine) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (
                            room_code,
                            variant,
                            "waiting",
                            creator_token,
                            spectator_token,
                            max_players,
                            engine,
                        ),
                    )
                    game_id = cur.lastrowid
                    for i, token in enumerate(player_tokens):
                        conn.execute(
                            "INSERT INTO players (game_id, player_name, player_token, player_order, is_spectator, last_seen_at) "
                            "VALUES (?, ?, ?, ?, ?, NULL)",
                            (game_id, f"Player {i + 1} (pending)", token, i, 0),
                        )
                    club_init = {
                        "gathering_title": "Autumn Koenji Session · 高円寺例会",
                        "gathering_date": "1889 Meiji Railway Evening",
                        "stamps": {},
                        "notes": [
                            {
                                "id": "welcome",
                                "author": "Club Host",
                                "text": "Tea is poured and the Shikoku ledger is open on the table.",
                                "time": now_jst_clock(),
                                "recorded_at": now_iso(),
                            }
                        ],
                    }
                    conn.execute(
                        "INSERT OR REPLACE INTO club_gatherings (game_id, club_json, updated_at) VALUES (?, ?, ?)",
                        (game_id, json.dumps(club_init), now_iso()),
                    )
                    conn.commit()
                    return {
                        "game_id": game_id,
                        "room_code": room_code,
                        "creator_token": creator_token,
                        "spectator_token": spectator_token,
                        "player_tokens": player_tokens,
                        "variant": variant,
                        "max_players": max_players,
                    }
                except sqlite3.IntegrityError:
                    conn.rollback()
        raise ValueError("Unable to allocate unique room credentials; retry creation")

    def gathering_projection(self, game):
        rows = self.get_players_for_game(game["id"])
        with self._connect() as conn:
            profiles = {r["member_key"]: dict(r) for r in conn.execute(
                "SELECT * FROM gathering_members WHERE game_id=?", (game["id"],))}
            events = [dict(json.loads(r["event_json"]), id=r["id"]) for r in conn.execute(
                "SELECT * FROM gathering_arrivals WHERE game_id=? ORDER BY id DESC LIMIT 50", (game["id"],))]
        def member(key, name):
            profile = profiles.get(key, {})
            try:
                appearance = clean_appearance(json.loads(profile.get("appearance_json", "{}")))
                configured = True
            except (ValueError, TypeError):
                appearance = dict(DEFAULT_APPEARANCE)
                configured = False
            return dict(member_id=key, name=name, appearance=appearance,
                        appearance_configured=configured,
                        has_arrived=bool(profile.get("entered_at")),
                        arrival_route=profile.get("arrival_route", "door"),
                        is_host=(key == (f"player:{game['host_player_id']}" if game.get("host_player_id") else "creator")))
        members = {f"p{r['player_order']+1}": member(f"player:{r['id']}", r["player_name"])
                   for r in rows if r.get("player_order") is not None}
        host = next((m for m in members.values() if m["is_host"]), member("creator", game.get("host_name", "Club Host")))
        return dict(members=members, host=host, arrival_events=list(reversed(events)))

    def touch_arrival(self, game, key, name, appearance):
        # A stable member key, transaction, and grace period deduplicate tabs/polls.
        # Authentication polling itself never creates social arrival events.
        with self.game_lock(game["id"]), self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT * FROM gathering_members WHERE game_id=? AND member_key=?", (game["id"], key)).fetchone()
            previous = dict(row) if row else {}
            now = now_iso()
            first = not previous.get("entered_at")
            elapsed = 0
            if previous.get("seen_at"):
                elapsed = (datetime.fromisoformat(now.replace("Z", "+00:00")) - datetime.fromisoformat(previous["seen_at"].replace("Z", "+00:00"))).total_seconds()
            route = previous.get("arrival_route", "door")
            conn.execute("""INSERT INTO gathering_members (game_id,member_key,display_name,appearance_json,entered_at,seen_at)
                VALUES (?,?,?,?,?,?) ON CONFLICT(game_id,member_key) DO UPDATE SET
                display_name=excluded.display_name,appearance_json=excluded.appearance_json,
                entered_at=COALESCE(gathering_members.entered_at,excluded.entered_at),seen_at=excluded.seen_at""",
                (game["id"], key, name, json.dumps(appearance), now, now))
            if first or elapsed > 45:
                event = dict(member_id=key, name=name, kind="arrived" if first else "returned",
                             appearance=appearance, arrival_route=route, recorded_at=now)
                conn.execute("INSERT INTO gathering_arrivals (game_id,member_key,event_json,recorded_at) VALUES (?,?,?,?)",
                             (game["id"], key, json.dumps(event), now))
            conn.commit()

    def get_game_by_room_code(self, room_code: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM games WHERE room_code = ?", (room_code,)
            ).fetchone()
            return dict(row) if row else None

    def get_players_for_game(self, game_id: int) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM players WHERE game_id = ? ORDER BY player_order ASC",
                (game_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def verify_token(self, game_id: int, token: str) -> Dict[str, Any]:
        with self._connect() as conn:
            game = conn.execute(
                "SELECT * FROM games WHERE id = ?", (game_id,)
            ).fetchone()
            if not game:
                return {"valid": False, "error": "Game not found"}
            game_dict = dict(game)
            if token == game_dict["creator_token"]:
                return {"valid": True, "type": "creator", "game": game_dict}
            if token == game_dict["spectator_token"]:
                return {"valid": True, "type": "spectator", "game": game_dict}
            player = conn.execute(
                "SELECT * FROM players WHERE player_token = ? AND game_id = ?",
                (token, game_id),
            ).fetchone()
            if player:
                conn.execute(
                    "UPDATE players SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (player["id"],),
                )
                conn.commit()
                return {
                    "valid": True,
                    "type": "player",
                    "player": dict(player),
                    "game": game_dict,
                }
            return {"valid": False, "error": "Invalid token"}

    def get_latest_game_state(self, game_id: int) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM game_states WHERE game_id = ? ORDER BY move_number DESC, id DESC LIMIT 1",
                (game_id,),
            ).fetchone()
            return dict(row) if row else None

    def get_game_state_at_revision(
        self, game_id: int, revision: int
    ) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM game_states WHERE game_id = ? AND move_number = ? ORDER BY id DESC LIMIT 1",
                (game_id, revision),
            ).fetchone()
            return dict(row) if row else None

    def get_action_by_command_id(
        self, game_id: int, command_id: str
    ) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM game_actions WHERE game_id = ? AND command_id = ?",
                (game_id, command_id),
            ).fetchone()
            return dict(row) if row else None

    def get_actions_for_game(self, game_id: int) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM game_actions WHERE game_id = ? ORDER BY revision ASC",
                (game_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def get_club_state(self, game_id: int) -> Dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT club_json FROM club_gatherings WHERE game_id = ?", (game_id,)
            ).fetchone()
            if row:
                try:
                    return json.loads(row["club_json"])
                except json.JSONDecodeError:
                    pass
            return {
                "gathering_title": "Autumn Koenji Session · 高円寺例会",
                "gathering_date": "1889 Meiji Railway Evening",
                "stamps": {},
                "notes": [],
            }

    def update_club_state(self, game_id: int, club_state: Dict[str, Any]) -> Dict[str, Any]:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO club_gatherings (game_id, club_json, updated_at) VALUES (?, ?, ?)",
                (game_id, json.dumps(club_state), now_iso()),
            )
            conn.commit()
        return club_state

    def save_initial_state(
        self, game_id: int, state: Dict[str, Any], player_names: List[str]
    ) -> None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            latest = conn.execute(
                "SELECT move_number FROM game_states WHERE game_id = ? ORDER BY move_number DESC LIMIT 1",
                (game_id,),
            ).fetchone()
            if latest is not None:
                conn.rollback()
                raise ValueError("Game has already started")
            club_row=conn.execute("SELECT club_json FROM club_gatherings WHERE game_id=?",(game_id,)).fetchone()
            if club_row and json.loads(club_row["club_json"]).get("is_lobby"):
                current_names=[r["player_name"] for r in conn.execute("SELECT player_name FROM players WHERE game_id=? ORDER BY player_order",(game_id,))]
                if current_names != [name.strip() for name in player_names]:
                    conn.rollback()
                    raise ValueError("Seat names changed; refresh the waiting table before starting")
            for idx, name in enumerate(player_names):
                conn.execute(
                    "UPDATE players SET player_name = ? WHERE game_id = ? AND player_order = ?",
                    (name.strip(), game_id, idx),
                )
            conn.execute(
                "INSERT INTO game_states (game_id, state_json, move_number) VALUES (?, ?, ?)",
                (game_id, json.dumps(state, separators=(",", ":")), 0),
            )
            conn.execute(
                "UPDATE games SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (game_id,),
            )
            conn.commit()

    def save_committed_action(
        self,
        game_id: int,
        state: Dict[str, Any],
        expected_version: int,
        command_id: str,
        actor_id: str,
        action: Dict[str, Any],
        event: Dict[str, Any],
    ) -> None:
        with self._connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            latest = conn.execute(
                "SELECT move_number FROM game_states WHERE game_id = ? ORDER BY move_number DESC, id DESC LIMIT 1",
                (game_id,),
            ).fetchone()
            actual = latest[0] if latest else None
            if actual != expected_version:
                conn.rollback()
                raise ValueError("State changed; reload before submitting another action")
            conn.execute(
                "INSERT INTO game_states (game_id, state_json, move_number) VALUES (?, ?, ?)",
                (
                    game_id,
                    json.dumps(state, separators=(",", ":")),
                    state["revision"],
                ),
            )
            conn.execute(
                "INSERT INTO game_actions (game_id, revision, command_id, actor_player_id, move_type, move_json, event_json, accepted_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    game_id,
                    state["revision"],
                    command_id,
                    actor_id,
                    action.get("type", "unknown"),
                    json.dumps(action, separators=(",", ":")),
                    json.dumps(event, separators=(",", ":")),
                    now_iso(),
                ),
            )
            conn.execute(
                "UPDATE games SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                ("completed" if state["finished"] else "in_progress", game_id),
            )
            conn.commit()


def build_history_events(
    db: KoenjiDatabase, game_id: int, latest_state: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Return ordered history from revision 0 through latest_revision."""
    initial_record = db.get_game_state_at_revision(game_id, 0)
    initial_state = json.loads(initial_record["state_json"]) if initial_record else None
    initial_time = initial_record.get("timestamp") if initial_record else None
    if initial_time and "T" not in initial_time:
        initial_time = initial_time.replace(" ", "T") + "Z"
    initial_bank = initial_state["bank"] if initial_state else None
    events: List[Dict[str, Any]] = [
        {
            "revision": 0,
            "command_id": "init-0",
            "actor_id": None,
            "actor_name": "Club Host",
            "move_type": "game_start",
            "timestamp": initial_time[11:16] if initial_time else "Unknown",
            "occurred_at": initial_time,
            "label": "The gathering begins around the Koenji table",
            "detail": f"{len(latest_state['player_order'])} railway investors seated"
            + (f" · ¥{initial_bank:,} bank cash" if initial_bank is not None else ""),
            "animation": None,
        }
    ]
    rows = db.get_actions_for_game(game_id)
    row_by_rev = {r["revision"]: r for r in rows}
    for rev in range(1, latest_state["revision"] + 1):
        if rev in row_by_rev:
            r = row_by_rev[rev]
            ev = json.loads(r["event_json"])
            accepted_at = r["accepted_at"]
            short_time = (
                accepted_at[11:16] if len(accepted_at) >= 16 else "Unknown"
            )
            events.append(
                {
                    "revision": rev,
                    "command_id": r["command_id"],
                    "actor_id": r["actor_player_id"],
                    "actor_name": ev.get("actor_name", r["actor_player_id"]),
                    "move_type": r["move_type"],
                    "timestamp": short_time,
                    "occurred_at": accepted_at,
                    "label": ev.get("label", f"{r['actor_player_id']} · {r['move_type']}"),
                    "detail": ev.get("detail", ""),
                    "animation": ev.get("animation"),
                    "event": ev,
                }
            )
        elif rev - 1 < len(latest_state.get("history", [])):
            act = latest_state["history"][rev - 1]
            actor_id = act.get("player", "p1")
            actor_name = latest_state["players"].get(actor_id, {}).get("name", actor_id)
            events.append(
                {
                    "revision": rev,
                    "command_id": f"hist-{rev}",
                    "actor_id": actor_id,
                    "actor_name": actor_name,
                    "move_type": act.get("type", "move"),
                    "timestamp": "Unknown",
                    "occurred_at": None,
                    "label": f"{actor_name} · {act.get('type', 'move')}",
                    "detail": "",
                    "animation": None,
                    "event": act,
                }
            )
    return events


def compute_legal_tile_lays(state: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    """Return authoritative legal (tile, rotation) placements per hex for the active turn."""
    result: Dict[str, List[Dict[str, Any]]] = {}
    if state.get("finished"):
        return result

    board = state.get("board") or {}
    colors = ["white", "yellow", "green", "brown"]
    phase_colors = PHASES.get(state.get("phase", "2"), (4, ["yellow"], 1))[1]

    # Case 1: Pending ER special green lay on C4
    if state.get("pending_special"):
        spec_info = state["pending_special"]
        coord = spec_info.get("hex", "C4")
        cid = spec_info.get("corporation") or state.get("current_corporation")
        if coord in board and cid in state.get("corporations", {}):
            seen_paths = {}
            lays = []
            for tid in ["12", "13", "14", "15", "205", "206"]:
                if state["tiles"].get(tid, 0) <= 0:
                    continue
                seen_paths[tid] = set()
                for rot in range(6):
                    t_obj = tile_for(tid, rot)
                    sig = frozenset(frozenset(p) for p in t_obj["paths"])
                    if sig in seen_paths[tid]:
                        continue
                    try:
                        sim = deepcopy(state)
                        cost = lay_tile(sim, cid, coord, tid, rot, special="ER", spender=spec_info["player"])
                        seen_paths[tid].add(sig)
                        lays.append(
                            {
                                "tile": tid,
                                "rotation": rot,
                                "color": t_obj["color"],
                                "cost": cost,
                                "special": "ER",
                            }
                        )
                    except Exception:
                        continue
            if lays:
                result[coord] = lays
        return result

    if state.get("round") != "operating":
        return result

    cid = state.get("current_corporation")
    op_turn = state.get("operating_turn") or {}
    if not cid or cid not in state.get("corporations", {}):
        return result

    # Only compute normal track lays when the corporation has not yet laid its tile
    if op_turn.get("step") == "track" and not op_turn.get("laid"):
        can_reach = reachable(board, cid)
        candidate_coords = []
        for coord, hex_obj in board.items():
            if hex_obj["color"] in ("red", "gray") or hex_obj.get("port"):
                continue
            if hex_obj["color"] not in colors:
                continue
            c_idx = colors.index(hex_obj["color"])
            if c_idx + 1 >= len(colors):
                continue
            target_color = colors[c_idx + 1]
            if target_color not in phase_colors:
                continue
            has_node_reach = any(
                f"{coord}:n{i}" in can_reach for i in range(len(hex_obj["nodes"]))
            )
            has_edge_reach = any(
                f"{neighbor(coord, e)}:e{(e + 3) % 6}" in can_reach for e in range(6)
            )
            if has_node_reach or has_edge_reach:
                candidate_coords.append((coord, target_color))

        # Order plain yellow tiles nicely (#9 straight, #8 gentle, #7 sharp)
        tile_sort_order = {
            "9": 1,
            "8": 2,
            "7": 3,
            "57": 4,
            "6": 5,
            "5": 6,
            "58": 7,
            "3": 8,
            "438": 9,
            "14": 10,
            "15": 11,
            "611": 12,
            "448": 13,
        }
        sorted_tids = sorted(
            DATA["tiles"].keys(),
            key=lambda t: (tile_sort_order.get(t, 50), int(t)),
        )

        for coord, target_color in candidate_coords:
            old = board[coord]
            old_kinds = [n["kind"] for n in old["nodes"]]
            lays = []
            for tid in sorted_tids:
                if tid == "437":
                    continue
                if state["tiles"].get(tid, 0) <= 0:
                    continue
                spec = DATA["tiles"][tid]
                if spec["color"] != target_color:
                    continue
                base_tile = tile_for(tid, 0)
                if base_tile["label"] != old["label"]:
                    continue
                if [n["kind"] for n in base_tile["nodes"]] != old_kinds:
                    continue
                if old.get("tile") and tid not in UPGRADES.get(old["tile"], []):
                    continue

                seen_sigs = set()
                for rot in range(6):
                    t_obj = tile_for(tid, rot)
                    sig = frozenset(frozenset(p) for p in t_obj["paths"])
                    if sig in seen_sigs:
                        continue
                    try:
                        sim = deepcopy(state)
                        cost = lay_tile(sim, cid, coord, tid, rot)
                        seen_sigs.add(sig)
                        lays.append(
                            {
                                "tile": tid,
                                "rotation": rot,
                                "color": target_color,
                                "cost": cost,
                            }
                        )
                    except Exception:
                        continue
            if lays:
                result[coord] = lays

    return result


def seat_presence(row, claimed=True):
    instant = row.get("last_seen_at")
    try:
        seen = datetime.fromisoformat(instant.replace("Z", "+00:00"))
        if seen.tzinfo is None:
            seen = seen.replace(tzinfo=timezone.utc)
        online = claimed and 0 <= (datetime.now(timezone.utc)-seen).total_seconds() <= 15
    except (ValueError, TypeError, AttributeError):
        online = False
    return {"online": bool(online), "last_seen_at": instant, "status": "online" if online else "away"}


def waiting_view(db, game, auth=None, player=None):
    seats = []
    for row in db.get_players_for_game(game["id"]):
        if row.get("player_order") is None:
            continue
        claimed = bool(row.get("seat_claimed"))
        seats.append(dict(seat_index=row["player_order"], player_id=f"p{row['player_order']+1}",
                          name=row["player_name"], claimed=claimed, **seat_presence(row, claimed)))
    club = db.get_club_state(game["id"])
    result = {"room_code": game["room_code"], "status": "waiting", "max_players": game["max_players"],
              "seats": sorted(seats, key=lambda r:r["seat_index"]), "gathering_title":club["gathering_title"]}
    if auth:
        gathering = db.gathering_projection(game)
        result.update(gathering)
        for seat in seats:
            seat.update(gathering["members"][seat["player_id"]])
        result["can_start"] = all(s["claimed"] for s in seats) and len({s["name"].strip() for s in seats}) == game["max_players"] and all(s["name"].strip() for s in seats)
        result.update(club=club, viewer={"role":auth["type"], "player_id":player,
            "player_name":next((r["name"] for r in seats if r["player_id"]==player), "Club Host" if auth["type"]=="creator" else "Guest Observer")})
    return result


def validated_action_options(state, player, include_preview=False):
    if not player or state.get("finished"):
        return []
    types = legal_actions(state, player)["types"]
    candidates = []
    for cid, corp in state["corporations"].items():
        if "buy_shares" in types:
            if corp["par"] is None:
                candidates += [dict(type="buy_shares", corporation=cid, price=p) for p in PAR_PRICES]
            else:
                for source in ("ipo", "pool"):
                    candidates += [dict(type="buy_shares", corporation=cid, source=source, percent=p)
                                   for p in range(10, corp[source] + 1, 10)]
        for kind in ("sell_shares", "emergency_sell"):
            if kind in types:
                candidates += [dict(type=kind, corporation=cid, percent=p)
                               for p in range(10, min(corp["holdings"][player], 50-corp["pool"]) + 1, 10)]
        if "discard_train" in types and cid in state["pending_discards"]:
            candidates += [dict(type="discard_train", corporation=cid, train=t) for t in corp["trains"]]
    if "buy_train" in types:
        corp = state["corporations"][state["current_corporation"]]
        for tid in available_depot(state):
            candidates.append(dict(type="buy_train", train=tid))
            if state["trains"][tid]["type"] == "D":
                candidates += [dict(type="buy_train", train=tid, trade_in=t) for t in corp["trains"]
                               if state["trains"][t]["type"] in ("4", "5", "6")]
    if "end_turn" in types and state["round"] in ("stock", "operating"):
        candidates.append(dict(type="end_turn"))
    if "bankrupt" in types:
        candidates.append(dict(type="bankrupt"))
    if "exchange_private" in types:
        candidates.append(dict(type="exchange_private", source="ipo"))
    result = []
    for action in candidates:
        try:
            after=apply_action(state, dict(action, player=player))
        except RuleError:
            continue
        corp=after["corporations"].get(action.get("corporation"))
        preview={"action":action,"cash_after":after["players"][player]["cash"]}
        if corp:
            preview.update(price_after=_price(corp),president=corp["president"],holdings_after=corp["holdings"][player],pool_after=corp["pool"])
        result.append(preview if include_preview else action)
    return result


def route_plan_quote(state, corporation, routes):
    """Validate the whole allocation and quote each train using the same rules."""
    revenue, stops = route_revenue(state, corporation, routes)
    return {
        "revenue": revenue,
        "stops": stops,
        "route_revenues": {
            route["train"]: route_revenue(state, corporation, [route])[0]
            for route in routes
        },
    }


def project_view(
    db: KoenjiDatabase,
    game: Dict[str, Any],
    state: Dict[str, Any],
    player_id: Optional[str] = None,
    auth_type: str = "spectator",
    latest_state: Optional[Dict[str, Any]] = None,
    last_event: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Safe, serializable frontend projection (compatible with Daemon18xx + Koenji UI)."""
    effective_latest = latest_state or state
    cid = state.get("current_corporation")
    candidate_routes = []
    route_quote = {"routes": [], "revenue": 0, "route_revenues": {}}
    if state.get("round") == "operating" and cid and state["corporations"].get(cid, {}).get("trains"):
        try:
            best = best_routes(state, cid)
            candidate_routes = best.get("routes", [])
            route_quote = dict(best, **route_plan_quote(state, cid, candidate_routes))
        except Exception:
            candidate_routes = []

    previews=validated_action_options(state,player_id,include_preview=True)
    financing=None
    if cid and state["round"]=="operating" and state["operating_turn"]["step"]=="train":
        corp=state["corporations"][cid]
        if not corp["trains"] and route_candidates(state,cid,limit=1):
            depot=available_depot(state)
            cheapest=min((state["trains"][t]["price"] for t in depot), default=0)
            financing={
                "mandatory":True,
                "cheapest":cheapest,
                "treasury":corp["cash"],
                "shortfall":max(0,cheapest-corp["cash"]) if depot else 0,
                "personal_cash":state["players"][corp["president"]]["cash"],
            }
    legal = deepcopy(legal_actions(state, player_id))
    if financing:
        if "end_turn" in legal.get("types", []):
            legal["types"] = [t for t in legal["types"] if t != "end_turn"]
        legal.setdefault("choices", {})["mandatory_train"] = True
    players_db = db.get_players_for_game(game["id"])
    presence = {f"p{p['player_order']+1}":seat_presence(p) for p in players_db if p.get("player_order") is not None}


    return {
        "room_code": game["room_code"],
        "state": state,
        "currency": "JPY",
        "legal_actions": legal,
        "legal_tile_lays": compute_legal_tile_lays(state),
        "prices": {c_id: _price(c) for c_id, c in state["corporations"].items()},
        "certificates": {p: certificate_count(state, p) for p in state["players"]},
        "available_depot_trains": available_depot(state),
        "train_limit": PHASES[state["phase"]][0],
        "best_routes_hint": candidate_routes,
        "route_quote": route_quote,
        "market_zones": {c: _zone(v) for c, v in state["corporations"].items()},
        "action_options": [p["action"] for p in previews],
        "action_previews": previews,
        "train_financing": financing,
        "latest_revision": effective_latest["revision"],
        "is_historical": state["revision"] != effective_latest["revision"],
        "viewer": {
            "role": auth_type,
            "player_id": player_id,
            "player_name": (
                state["players"].get(player_id, {}).get("name")
                if player_id
                else ("Club Host" if auth_type == "creator" else "Guest Observer")
            ),
        },
        "presence": presence,
        **db.gathering_projection(game),
        "history_events": build_history_events(db, game["id"], effective_latest),
        "last_event": last_event,
        "club": db.get_club_state(game["id"]),
    }


def load_latest_state(db: KoenjiDatabase, game: Dict[str, Any]) -> Dict[str, Any]:
    record = db.get_latest_game_state(game["id"])
    if not record:
        raise LookupError("Game has not started")
    return migrate_state(json.loads(record["state_json"]))


def load_revision_state(
    db: KoenjiDatabase, game: Dict[str, Any], revision: int
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    latest = load_latest_state(db, game)
    if revision < 0 or revision > latest["revision"]:
        raise IndexError(f"Revision {revision} out of range (0..{latest['revision']})")
    if revision == latest["revision"]:
        return latest, latest
    record = db.get_game_state_at_revision(game["id"], revision)
    if record:
        return migrate_state(json.loads(record["state_json"])), latest
    # Fallback: deterministic replay from history
    order = latest["player_order"]
    names = [latest["players"][pid]["name"] for pid in order]
    rebuilt = replay(names, latest["history"][:revision], order)
    return rebuilt, latest


def route_stop_options(state, train, stops, routes):
    """Quote legal stop-by-stop edits against the other trains' reserved track."""
    cid = state.get("current_corporation")
    corp = state.get("corporations", {}).get(cid)
    if not corp or train not in corp["trains"]:
        raise RuleError("Choose a train owned by the operating company")
    if train in (state.get("operating_turn") or {}).get("new_trains", []):
        raise RuleError("New trains can run next operating turn")
    if not isinstance(stops, list):
        raise RuleError("Choose stops on the map")
    for vertex in stops:
        try:
            valid = isinstance(vertex, str) and vertex.split(":")[1].startswith("n") and int(vertex.split(":")[1][1:]) >= 0 and node_info(state["board"], vertex)
        except (ValueError, KeyError, IndexError, TypeError):
            valid = False
        if not valid:
            raise RuleError("Choose stops on the map")
    if len(stops) != len(set(stops)):
        raise RuleError("A route cannot visit the same stop twice")
    if not isinstance(routes, list) or not all(isinstance(r, dict) for r in routes):
        raise RuleError("Routes must be a list")
    other = [r for r in routes if r.get("train") != train]
    # Validate the reservation independently; a bad draft must not unlock track.
    route_revenue(state, cid, other)
    next_stops, complete, seen = set(), [], set()
    for candidate in route_candidates(state, cid, train, limit=None):
        try:
            total, _ = route_revenue(state, cid, other + [candidate])
        except RuleError:
            continue
        revenue, _ = route_revenue(state, cid, [candidate])
        for vertices in (candidate["vertices"], list(reversed(candidate["vertices"]))):
            sequence = [v for v in vertices if node_info(state["board"], v)]
            if sequence[:len(stops)] != stops:
                continue
            if len(sequence) > len(stops):
                next_stops.add(sequence[len(stops)])
            elif tuple(vertices) not in seen:
                seen.add(tuple(vertices))
                complete.append({"route": {"train": train, "vertices": vertices}, "revenue": revenue, "total": total})
    complete.sort(key=lambda option: (-option["revenue"], len(option["route"]["vertices"]), option["route"]["vertices"]))
    return {"next_stops": sorted(next_stops), "connections": complete}


def create_fixture_room(
    db: KoenjiDatabase,
    preset: str = "stock_round_1",
    player_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Create a deterministic, rules-validated 1889 game and return all seat tokens."""
    names = player_names or ["Daisuke", "Haruka", "Kenji", "Alex"]
    if preset in ("route_network_3", "route_network_4") and len(names) != 4:
        raise ValueError("Expanded route practice uses four player seats")
    info = db.create_game(variant="1889", max_players=len(names), engine="python")
    game_id = info["game_id"]
    state = new_game(names)
    db.save_initial_state(game_id, state, names)

    scripted_moves: List[Dict[str, Any]] = []
    if preset in ("route_network_3", "route_network_4"):
        practice = json.loads((ROOT_DIR / "fixtures" / "route_networks.json").read_text())
        scenario = practice["scenarios"][preset]
        # Keep the attributed reference prefix with runtime fixture data, rather
        # than depending on the engine's test directory in deployed installations.
        scripted_moves.extend(practice["reference"]["actions"][:scenario["checkpoint"]])
        scripted_moves.extend(scenario["actions"])
    if preset in ("stock_round_1", "stock_round_active", "operating_round_1", "route_planning"):
        # Deterministic 4-player private company auction that lands in Stock Round 1
        # with Priority Deal on p1 (Daisuke, ¥340 cash).
        if len(names) == 4:
            scripted_moves.extend(
                [
                    {"player": "p1", "type": "buy_private", "company": "TR"},
                    {"player": "p2", "type": "buy_private", "company": "MF"},
                    {"player": "p3", "type": "buy_private", "company": "ER"},
                    {"player": "p4", "type": "buy_private", "company": "SMR"},
                    {"player": "p1", "type": "buy_private", "company": "DR"},
                    {"player": "p2", "type": "buy_private", "company": "SIR"},
                    {"player": "p3", "type": "pass"},
                    {"player": "p4", "type": "buy_private", "company": "UTF"},
                ]
            )
        else:
            for priv_id in list(state["privates"].keys()):
                scripted_moves.append(
                    {"player": state["current_player"], "type": "buy_private", "company": priv_id}
                )

    if preset in ("stock_round_active", "operating_round_1", "route_planning"):
        # Par Iyo Railway (IR) at ¥80 by Daisuke (p1) and Kotohira (KO) at ¥75 by Haruka (p2)
        scripted_moves.extend(
            [
                {"player": "p1", "type": "buy_shares", "corporation": "IR", "price": 80},
                {"player": "p1", "type": "end_turn"},
                {"player": "p2", "type": "buy_shares", "corporation": "KO", "price": 75},
                {"player": "p2", "type": "end_turn"},
                {"player": "p3", "type": "buy_shares", "corporation": "IR", "source": "ipo"},
                {"player": "p3", "type": "end_turn"},
                {"player": "p4", "type": "buy_shares", "corporation": "IR", "source": "ipo"},
                {"player": "p4", "type": "end_turn"},
            ]
        )

    if preset in ("operating_round_1", "route_planning"):
        # Float IR (50% sold from IPO) and pass around to enter Operating Round 1.1
        scripted_moves.extend(
            [
                {"player": "p1", "type": "buy_shares", "corporation": "IR", "source": "ipo"},
                {"player": "p1", "type": "end_turn"},
                {"player": "p2", "type": "pass"},
                {"player": "p3", "type": "pass"},
                {"player": "p4", "type": "pass"},
                {"player": "p1", "type": "pass"},
            ]
        )

    if preset == "route_planning":
        # Buy trains in the first operating turn, then run them in the next one.
        # Separate home-city exits allow both trains to earn without sharing track.
        scripted_moves.extend([
            {"player": "p1", "type": "lay_tile", "hex": "E2", "tile": "5", "rotation": 4},
            {"player": "p1", "type": "dividend", "payout": False},
            {"player": "p1", "type": "buy_train", "train": "2-0"},
            {"player": "p1", "type": "buy_train", "train": "2-1"},
            {"player": "p1", "type": "end_turn"},
            {"player": "p2", "type": "pass"},
            {"player": "p3", "type": "pass"},
            {"player": "p4", "type": "pass"},
            {"player": "p1", "type": "pass"},
            {"player": "p1", "type": "lay_tile", "hex": "F3", "tile": "57", "rotation": 2},
            {"player": "p1", "type": "skip"},
        ])

    for idx, move in enumerate(scripted_moves):
        actor = move.get("player") or state["current_player"]
        full_action = dict(move, player=actor, expected_action_id=state["revision"])
        next_state = apply_action(state, full_action)
        ev = summarize_transition(state, next_state, full_action)
        db.save_committed_action(
            game_id=game_id,
            state=next_state,
            expected_version=state["revision"],
            command_id=f"fixture-{preset}-{idx + 1}",
            actor_id=actor,
            action=full_action,
            event=ev,
        )
        state = next_state

    seats = [
        {
            "player_id": f"p{i + 1}",
            "name": name,
            "token": info["player_tokens"][i],
            "order": i,
        }
        for i, name in enumerate(names)
    ]
    game = db.get_game_by_room_code(info["room_code"])
    return {
        "room_code": info["room_code"],
        "creator_token": info["creator_token"],
        "spectator_token": info["spectator_token"],
        "player_tokens": info["player_tokens"],
        "seats": seats,
        "preset": preset,
        "view": project_view(db, game, state, "p1", "player", state),
    }


class KoenjiAppService:
    """Core request router usable both over HTTP and directly in tests."""

    def __init__(self, db: Optional[KoenjiDatabase] = None):
        self.db = db or KoenjiDatabase()

    def authenticate(
        self, room_code: str, authorization: Optional[str]
    ) -> Tuple[int, Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str]]:
        if not authorization or not authorization.startswith("Bearer "):
            return 401, None, None, "Bearer token required"
        game = self.db.get_game_by_room_code(room_code)
        if not game or game["variant"] != "1889" or game.get("engine") != "python":
            return 404, None, None, "1889 room not found"
        auth = self.db.verify_token(game["id"], authorization[7:])
        if not auth["valid"]:
            return 403, None, None, "Invalid room token"
        return 200, game, auth, None

    def handle(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        authorization: Optional[str] = None,
    ) -> Tuple[int, Dict[str, Any]]:
        parsed = urlparse(path)
        clean_path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        if method == "GET" and clean_path == "/":
            return 200, {
                "service": "Koenji1889-Daemon18xx",
                "variants": ["1889"],
                "docs": "/docs",
            }

        if method == "GET" and clean_path == "/health":
            try:
                with self.db._connect() as conn:
                    conn.execute("SELECT id FROM games LIMIT 1")
                return 200, {"status": "ok", "build": BRIDGE_BUILD,
                             "features": ["route-options", "route-preview", "route-revenues", "cash-receipts"]}
            except sqlite3.Error:
                return 503, {"detail": "Database unavailable"}

        if method == "GET" and clean_path == "/api/1889/catalog":
            return 200, dict(
                DATA,
                currency="JPY",
                market=MARKET,
                par_prices= list(PAR_PRICES),
                corporations=CORPORATIONS,
                privates=PRIVATES,
                certificate_limits=CERT_LIMITS,
                train_types=TRAIN_TYPES,
                phases=PHASES,
                appearance_catalog=APPEARANCE_CATALOG,
            )

        if method == "POST" and clean_path == "/api/1889/dev/fixture":
            payload = body or {}
            preset = payload.get("preset", "stock_round_1")
            names = payload.get("player_names")
            try:
                result = create_fixture_room(self.db, preset=preset, player_names=names)
                return 200, result
            except (RuleError, ValueError) as exc:
                return 422, {"detail": str(exc)}

        if method == "POST" and clean_path == "/api/1889/games":
            payload = body or {}
            max_players = payload.get("max_players", 4)
            if type(max_players) is not int or not (2 <= max_players <= 6):
                return 422, {"detail": "max_players must be an integer between 2 and 6"}
            try:
                info = self.db.create_game(
                    variant="1889", max_players=max_players, engine="python"
                )
            except ValueError as exc:
                return 503, {"detail": str(exc)}
            if payload.get("lobby"):
                club = self.db.get_club_state(info["game_id"])
                club["is_lobby"] = True
                club["gathering_title"] = str(payload.get("title") or club["gathering_title"])[:100]
                names = payload.get("player_names") or []
                if not isinstance(names,list) or len(names) != max_players or not all(isinstance(n,str) and n.strip() and len(n)<=60 for n in names) or len(set(n.strip() for n in names)) != max_players:
                    return 422, {"detail":"Provide a distinct name for each of the 2–6 seats"}
                with self.db._connect() as conn:
                    for index,name in enumerate(names):
                        conn.execute("UPDATE players SET player_name=? WHERE game_id=? AND player_order=?",(name.strip(),info["game_id"],index))
                    conn.commit()
                self.db.update_club_state(info["game_id"],club)
                with self.db._connect() as conn:
                    first_player = conn.execute("SELECT id FROM players WHERE game_id=? AND player_order=0", (info["game_id"],)).fetchone()[0]
                    host_name = str(payload.get("host_name") or (names[0] if payload.get("host_playing") else "Club Host"))[:60]
                    conn.execute("UPDATE games SET host_player_id=?,host_name=? WHERE id=?",
                                 (first_player if payload.get("host_playing") else None, host_name, info["game_id"]))
                    route = payload.get("host_route", "door")
                    if route not in ("door", "kitchen", "bedroom"):
                        route = "door"
                    key = f"player:{first_player}" if payload.get("host_playing") else "creator"
                    conn.execute("INSERT INTO gathering_members (game_id,member_key,display_name,arrival_route) VALUES (?,?,?,?)",
                                 (info["game_id"], key, host_name, route))
                    conn.commit()
            return 200, {
                k: info[k]
                for k in (
                    "room_code",
                    "creator_token",
                    "spectator_token",
                    "player_tokens",
                )
            }

        parts = [unquote(p) for p in clean_path.split("/") if p]
        # Match /api/{variant}/games/{room_code}...
        if len(parts) >= 4 and parts[0] == "api" and parts[2] == "games":
            variant = parts[1]
            if variant != "1889":
                return 404, {"detail": "1889 room not found"}
            room_code = parts[3]
            if len(parts)==5 and parts[4] in ("lobby","claim"):
                game=self.db.get_game_by_room_code(room_code)
                if not game or game["variant"]!="1889" or game["status"]!="waiting":
                    return 404, {"detail":"Waiting gathering not found"}
                if parts[4]=="lobby" and method=="GET":
                    return 200, waiting_view(self.db,game)
                if parts[4]=="claim" and method=="POST":
                    payload=body or {}; index=payload.get("seat_index"); name=payload.get("player_name")
                    if type(index) is not int or not 0<=index<game["max_players"] or not isinstance(name,str) or not name.strip() or len(name)>60:
                        return 422, {"detail":"Choose an open seat and a display name"}
                    with self.db.game_lock(game["id"]), self.db._connect() as conn:
                        conn.execute("BEGIN IMMEDIATE")
                        current=conn.execute("SELECT status FROM games WHERE id=?",(game["id"],)).fetchone()
                        row=conn.execute("SELECT * FROM players WHERE game_id=? AND player_order=?",(game["id"],index)).fetchone()
                        if current["status"]!="waiting" or row["seat_claimed"]:
                            return 409, {"detail":"This seat is already claimed or the match has started"}
                        token=generate_token()
                        conn.execute("UPDATE players SET player_name=?, player_token=?, seat_claimed=1,last_seen_at=CURRENT_TIMESTAMP WHERE id=?",(name.strip(),token,row["id"]))
                        conn.commit()
                    return 200, {"room_code":room_code,"player_id":f"p{index+1}","player_token":token}
            status, game, auth, err = self.authenticate(room_code, authorization)
            if status != 200 or not game or not auth:
                return status, {"detail": err}

            player_id = (
                f"p{auth['player']['player_order'] + 1}"
                if auth["type"] == "player"
                else None
            )

            if len(parts) == 5 and parts[4] == "arrival" and method == "POST":
                payload = body or {}
                try:
                    appearance = clean_appearance(payload.get("appearance", DEFAULT_APPEARANCE))
                except ValueError as exc:
                    return 422, {"detail": str(exc)}
                if auth["type"] == "player":
                    key = f"player:{auth['player']['id']}"
                    name = auth["player"]["player_name"]
                    if game["status"] == "waiting" and not auth["player"].get("seat_claimed"):
                        return 409, {"detail": "Claim your seat before entering"}
                elif auth["type"] == "creator":
                    # A playing host uses its seat identity even in a creator tab.
                    row = next((r for r in self.db.get_players_for_game(game["id"]) if r["id"] == game.get("host_player_id")), None)
                    key, name = (f"player:{row['id']}", row["player_name"]) if row else ("creator", game.get("host_name", "Club Host"))
                else:
                    browser_id = payload.get("browser_id", "")
                    if not isinstance(browser_id, str) or len(browser_id) > 64 or len(browser_id) < 12 or not all(c in string.ascii_letters + string.digits + "-" for c in browser_id):
                        return 422, {"detail": "An observer browser identifier is required"}
                    # Shared observer invitations grant no player/host authority.
                    key, name = f"observer:{browser_id}", "Guest Observer"
                self.db.touch_arrival(game, key, name, appearance)
                return 200, self.db.gathering_projection(game)

            if len(parts) == 5 and parts[4] == "resident" and method == "POST":
                if auth["type"] != "creator":
                    return 403, {"detail": "Only the host can assign resident entrances"}
                payload = body or {}
                gathering = self.db.gathering_projection(game)
                target = next((m for m in list(gathering["members"].values()) + [gathering["host"]] if m["member_id"] == payload.get("member_id")), None)
                route = payload.get("arrival_route")
                if not target or route not in ("door", "kitchen", "bedroom"):
                    return 422, {"detail": "Select a member and a guest or resident entrance"}
                with self.db.game_lock(game["id"]), self.db._connect() as conn:
                    conn.execute("""INSERT INTO gathering_members (game_id,member_key,display_name,arrival_route)
                        VALUES (?,?,?,?) ON CONFLICT(game_id,member_key) DO UPDATE SET arrival_route=excluded.arrival_route""",
                        (game["id"], target["member_id"], target["name"], route))
                    conn.commit()
                return 200, {"updated": True}

            if len(parts)==5 and parts[4]=="invitations" and method in ("GET", "POST"):
                if auth["type"]!="creator":
                    return 403, {"detail":"Only the host can manage invitations"}
                if method == "POST":
                    payload = body or {}
                    face = payload.get("face")
                    if face is not None and (not isinstance(face, str) or face not in {f["id"] for f in APPEARANCE_CATALOG["faces"]}):
                        return 422, {"detail":"Choose an available reference portrait"}
                    with self.db.game_lock(game["id"]), self.db._connect() as conn:
                        conn.execute("BEGIN IMMEDIATE")
                        current = conn.execute("SELECT status FROM games WHERE id=?", (game["id"],)).fetchone()
                        rows = conn.execute("SELECT * FROM players WHERE game_id=?", (game["id"],)).fetchall()
                        target = next((r for r in rows if f"player:{r['id']}" == payload.get("member_id")), None)
                        if not target:
                            return 422, {"detail":"Choose a member of this gathering"}
                        if current["status"] != "waiting" or target["seat_claimed"]:
                            return 409, {"detail":"Portrait presets can only be changed before that seat is claimed"}
                        appearance = dict(DEFAULT_APPEARANCE, face=face) if face else {}
                        conn.execute("""INSERT INTO gathering_members (game_id,member_key,display_name,appearance_json)
                            VALUES (?,?,?,?) ON CONFLICT(game_id,member_key) DO UPDATE SET appearance_json=excluded.appearance_json""",
                            (game["id"], payload["member_id"], target["player_name"], json.dumps(appearance)))
                        conn.commit()
                    return 200, {"updated":True}
                rows=sorted(self.db.get_players_for_game(game["id"]),key=lambda r:r["player_order"])
                members=self.db.gathering_projection(game)["members"]
                return 200, {"room_code":room_code,"player_tokens":[r["player_token"] if not r["seat_claimed"] else None for r in rows],
                    "seats":[{"name":r["player_name"], "member_id":f"player:{r['id']}",
                              "appearance":members[f"p{r['player_order']+1}"]["appearance"] if members[f"p{r['player_order']+1}"]["appearance_configured"] else None} for r in rows],
                    "spectator_token":game["spectator_token"]}
            if len(parts)==5 and parts[4] in ("seat","seating") and method=="POST":
                if game["status"]!="waiting":
                    return 409, {"detail":"Seating is fixed after the match starts"}
                payload=body or {}
                with self.db.game_lock(game["id"]), self.db._connect() as conn:
                    conn.execute("BEGIN IMMEDIATE")
                    current=conn.execute("SELECT status FROM games WHERE id=?",(game["id"],)).fetchone()
                    if current["status"]!="waiting":
                        return 409,{"detail":"The match has already started"}
                    if parts[4]=="seat":
                        if auth["type"]!="player":
                            return 403,{"detail":"Only a seated player can rename their seat"}
                        name=payload.get("player_name")
                        if not isinstance(name,str) or not name.strip() or len(name)>60:
                            return 422,{"detail":"A display name of at most 60 characters is required"}
                        conn.execute("UPDATE players SET player_name=?,seat_claimed=1 WHERE id=?",(name.strip(),auth["player"]["id"]))
                    else:
                        if auth["type"]!="creator":
                            return 403,{"detail":"Only the host can reorder seats"}
                        order=payload.get("order")
                        if not isinstance(order,list) or any(type(i) is not int for i in order) or sorted(order)!=list(range(game["max_players"])):
                            return 422,{"detail":"Provide each seat index exactly once"}
                        rows={r["player_order"]:r for r in conn.execute("SELECT * FROM players WHERE game_id=?",(game["id"],))}
                        for index,old in enumerate(order):
                            conn.execute("UPDATE players SET player_order=? WHERE id=?",(index,rows[old]["id"]))
                        club=self.db.get_club_state(game["id"])
                        club["stamps"]={f"p{order.index(int(pid[1:])-1)+1}":stamp for pid,stamp in club.get("stamps",{}).items()}
                        for note in club.get("notes", []):
                            if note.get("actor_id"):
                                note["actor_id"] = f"p{order.index(int(note['actor_id'][1:])-1)+1}"

                        conn.execute("UPDATE club_gatherings SET club_json=? WHERE game_id=?",(json.dumps(club),game["id"]))
                    conn.commit()
                return 200, {"updated":True}

            # POST /api/1889/games/{room}/start
            if len(parts) == 5 and parts[4] == "start" and method == "POST":
                if auth["type"] != "creator":
                    return 403, {"detail": "Only the creator may start a game"}
                payload = body or {}
                names = payload.get("player_names")
                if names is None:
                    names=[r["player_name"] for r in sorted(self.db.get_players_for_game(game["id"]),key=lambda r:r["player_order"])]
                if not isinstance(names,list) or not all(isinstance(n,str) and n.strip() and len(n)<=60 for n in names) or len(set(n.strip() for n in names))!=len(names):
                    return 422,{"detail":"Each seat needs a distinct non-empty name"}
                if not isinstance(names, list) or len(names) != game["max_players"]:
                    return 422, {
                        "detail": "Provide one name per registered player slot"
                    }
                with self.db.game_lock(game["id"]):
                    rows = self.db.get_players_for_game(game["id"])
                    if self.db.get_club_state(game["id"]).get("is_lobby"):
                        if not all(r["seat_claimed"] for r in rows):
                            return 409, {"detail": "Every configured seat must be claimed before starting"}
                        current_names = [r["player_name"] for r in rows]
                        if body and body.get("player_names") is not None and names != current_names:
                            return 409, {"detail": "Use the claimed players’ current names"}
                        names = current_names
                        if len({n.strip() for n in names}) != len(names) or not all(n.strip() for n in names):
                            return 422, {"detail": "Each seat needs a distinct non-empty name"}
                    try:
                        state = new_game(names)
                        self.db.save_initial_state(game["id"], state, names)
                    except RuleError as exc:
                        return 422, {"detail": str(exc)}
                    except ValueError as exc:
                        return 409, {"detail": str(exc)}
                    return 200, project_view(
                        self.db, game, state, None, auth["type"], state
                    )

            # GET /api/1889/games/{room}
            if len(parts) == 4 and method == "GET":
                if game["status"]=="waiting":
                    return 200,waiting_view(self.db,game,auth,player_id)
                try:
                    rev_param = query.get("revision", [None])[0]
                    if rev_param is not None:
                        rev_num = int(rev_param)
                        rev_state, latest = load_revision_state(
                            self.db, game, rev_num
                        )
                        return 200, project_view(
                            self.db,
                            game,
                            rev_state,
                            player_id,
                            auth["type"],
                            latest,
                        )
                    state = load_latest_state(self.db, game)
                except LookupError as exc:
                    return 409, {"detail": str(exc)}
                except (IndexError, ValueError) as exc:
                    return 404, {"detail": str(exc)}
                except RuleError as exc:
                    return 409, {"detail": "Saved game migration failed: " + str(exc)}
                return 200, project_view(
                    self.db, game, state, player_id, auth["type"], state
                )

            # GET /api/1889/games/{room}/history
            if len(parts) == 5 and parts[4] == "history" and method == "GET":
                try:
                    latest = load_latest_state(self.db, game)
                except LookupError as exc:
                    return 409, {"detail": str(exc)}
                events = build_history_events(self.db, game["id"], latest)
                return 200, {
                    "room_code": room_code,
                    "latest_revision": latest["revision"],
                    "events": events,
                }

            # GET /api/1889/games/{room}/revisions/{rev}
            if len(parts) == 6 and parts[4] == "revisions" and method == "GET":
                try:
                    rev_num = int(parts[5])
                    rev_state, latest = load_revision_state(self.db, game, rev_num)
                except LookupError as exc:
                    return 409, {"detail": str(exc)}
                except (IndexError, ValueError) as exc:
                    return 404, {"detail": str(exc)}
                return 200, project_view(
                    self.db, game, rev_state, player_id, auth["type"], latest
                )

            # Stop-by-stop route editing uses the same authoritative topology as running.
            if len(parts) == 5 and parts[4] == "route-options" and method == "POST":
                payload = body or {}
                revision = payload.get("revision")
                if type(revision) is not int or revision < 0:
                    return 422, {"detail": "A non-negative revision is required"}
                try:
                    snapshot, latest = load_revision_state(self.db, game, revision)
                    if revision != latest["revision"]:
                        return 409, {"detail": "Position changed. Return to the live game to edit routes."}
                    if snapshot.get("round") != "operating" or snapshot.get("pending_special") or snapshot.get("pending_discards"):
                        return 422, {"detail": "Route editing is unavailable in this position"}
                    if player_id != snapshot.get("current_player"):
                        return 403, {"detail": "Only the operating president can edit routes"}
                    result = route_stop_options(snapshot, payload.get("train"), payload.get("stops", []), payload.get("routes", []))
                    return 200, dict(result, revision=revision)
                except (RuleError, LookupError, ValueError, IndexError) as exc:
                    return 422, {"detail": str(exc)}

            # Authenticated, non-mutating route quotation at an explicit revision.
            if len(parts) == 5 and parts[4] == "route-preview" and method == "POST":
                payload = body or {}
                revision = payload.get("revision")
                if type(revision) is not int or revision < 0:
                    return 422, {"detail": "A non-negative revision is required"}
                try:
                    snapshot, latest = load_revision_state(self.db, game, revision)
                    quote = route_plan_quote(snapshot, snapshot["current_corporation"], payload.get("routes"))
                    return 200, dict(quote, revision=revision)
                except (RuleError, LookupError, ValueError) as exc:
                    return 422, {"detail": str(exc)}

            # POST /api/1889/games/{room}/club
            if len(parts) == 5 and parts[4] == "club" and method == "POST":
                payload = body or {}
                club_action = payload.get("action")
                with self.db.game_lock(game["id"]):
                    club = self.db.get_club_state(game["id"])
                    actor_label = payload.get("author") or (
                        player_id if player_id else auth["type"]
                    )
                    if club_action == "stamp_card":
                        if auth["type"] != "player" or not player_id:
                            return 403, {
                                "detail": "Only seated club members may stamp their membership card"
                            }
                        stamps = club.setdefault("stamps", {})
                        if player_id in stamps:
                            return 200, {
                                "club": club,
                                "already_stamped": True,
                                "message": "Membership card already stamped for this gathering.",
                            }
                        stamps[player_id] = {
                            "stamped_at": now_jst_clock(),
                            "recorded_at": now_iso(),
                            "seal": "高円寺",
                            "gathering": club.get(
                                "gathering_title", "Autumn Koenji Session"
                            ),
                        }
                        self.db.update_club_state(game["id"], club)
                        return 200, {
                            "club": club,
                            "already_stamped": False,
                            "message": "Membership card stamped for tonight's gathering!",
                        }
                    elif club_action == "table_note":
                        text = str(payload.get("text", "")).strip()[:160]
                        if not text:
                            return 422, {"detail": "Note text required"}
                        notes = club.setdefault("notes", [])
                        notes.append(
                            {
                                "id": generate_token(8),
                                "author": actor_label,
                                "actor_id": player_id,
                                "text": text,
                                "time": now_jst_clock(),
                                "recorded_at": now_iso(),
                            }
                        )
                        club["notes"] = notes[-25:]
                        self.db.update_club_state(game["id"], club)
                        return 200, {"club": club}
                    return 422, {"detail": "Unknown club action"}

            # POST /api/1889/games/{room}/actions
            if len(parts) == 5 and parts[4] == "actions" and method == "POST":
                if auth["type"] != "player" or not player_id:
                    return 403, {"detail": "Only a player may submit actions"}
                payload = body or {}
                expected_rev = payload.get(
                    "expected_action_id", payload.get("expected_revision")
                )
                if type(expected_rev) is not int or expected_rev < 0:
                    return 422, {
                        "detail": "expected_action_id must be a non-negative integer"
                    }
                raw_action = payload.get("action")
                if not isinstance(raw_action, dict):
                    return 422, {"detail": "action object required"}
                if "player" in raw_action and raw_action["player"] != player_id:
                    return 403, {"detail": "Cannot act as another player"}

                command_id = payload.get("command_id") or generate_token(16)
                if not isinstance(command_id, str) or not command_id.strip():
                    return 422, {"detail": "command_id must be a non-empty string"}

                with self.db.game_lock(game["id"]):
                    # Check command_id idempotency first
                    existing_cmd = self.db.get_action_by_command_id(
                        game["id"], command_id
                    )
                    if existing_cmd:
                        rev_state, latest = load_revision_state(
                            self.db, game, existing_cmd["revision"]
                        )
                        ev = json.loads(existing_cmd["event_json"])
                        proj = project_view(
                            self.db,
                            game,
                            latest,
                            player_id,
                            auth["type"],
                            latest,
                            last_event=ev,
                        )
                        proj["idempotent_replay"] = True
                        proj["command_id"] = command_id
                        return 200, proj

                    try:
                        state = load_latest_state(self.db, game)
                    except LookupError as exc:
                        return 409, {"detail": str(exc)}
                    except RuleError as exc:
                        return 409, {
                            "detail": "Saved game migration failed: " + str(exc)
                        }

                    if expected_rev != state["revision"]:
                        return 409, {
                            "detail": f"Stale action version (expected {expected_rev}, current is {state['revision']}); reload the current state",
                            "current_revision": state["revision"],
                        }

                    action = deepcopy(raw_action)
                    action.update(player=player_id, expected_action_id=expected_rev)
                    try:
                        working_copy = deepcopy(state)
                        result = apply_action(working_copy, action)
                        ev = summarize_transition(state, result, action)
                        self.db.save_committed_action(
                            game_id=game["id"],
                            state=result,
                            expected_version=state["revision"],
                            command_id=command_id,
                            actor_id=player_id,
                            action=action,
                            event=ev,
                        )
                    except RuleError as exc:
                        return 422, {"detail": str(exc)}
                    except ValueError as exc:
                        return 409, {"detail": str(exc)}

                    proj = project_view(
                        self.db,
                        game,
                        result,
                        player_id,
                        auth["type"],
                        result,
                        last_event=ev,
                    )
                    proj["command_id"] = command_id
                    return 200, proj

        return 404, {"detail": "Not found"}


class KoenjiHTTPHandler(BaseHTTPRequestHandler):
    service: KoenjiAppService = None  # type: ignore

    def log_message(self, format: str, *args: Any) -> None:
        if os.environ.get("KOENJI_QUIET") == "1":
            return
        super().log_message(format, *args)

    def _send_json(self, status: int, payload: Dict[str, Any]) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Authorization, Content-Type"
        )
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Authorization, Content-Type"
        )
        self.end_headers()

    def do_GET(self) -> None:
        auth = self.headers.get("Authorization")
        status, resp = self.service.handle("GET", self.path, None, auth)
        self._send_json(status, resp)

    def do_POST(self) -> None:
        auth = self.headers.get("Authorization")
        length = int(self.headers.get("Content-Length", "0") or "0")
        body = None
        if length > 0:
            raw = self.rfile.read(length).decode("utf-8")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                self._send_json(422, {"detail": "Invalid JSON body"})
                return
        status, resp = self.service.handle("POST", self.path, body, auth)
        self._send_json(status, resp)


def run_server(host: str = "127.0.0.1", port: int = 8789) -> None:
    svc = KoenjiAppService()
    KoenjiHTTPHandler.service = svc
    httpd = ThreadingHTTPServer((host, port), KoenjiHTTPHandler)
    print(f"Koenji 1889 authoritative backend listening on http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    port_num = int(os.environ.get("KOENJI_BACKEND_PORT", "8789"))
    host_addr = os.environ.get("KOENJI_BACKEND_HOST", "127.0.0.1")
    run_server(host_addr, port_num)
