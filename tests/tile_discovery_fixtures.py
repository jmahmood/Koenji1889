"""Synthetic track turns for frontend discovery tests; no player saves needed."""
import json
import sys
from copy import deepcopy
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from test_decision_coverage import DecisionCoverageTests
from server_bridge import KoenjiAppService
from app.engine1889 import engine as E


def fixtures():
    t = DecisionCoverageTests('runTest')
    t.setUp()
    out = {}
    try:
        def save(name, state):
            t.install(state)
            out[name] = t.request('GET', seat=state['current_player'])
        f = t.f
        f.stock()
        f.shares('SR', 'p1', 50)
        E._start_operating(f.s)
        f.act('lay_tile', hex='I2', tile='5', rotation=5)
        E._start_operating(f.s)
        available = deepcopy(f.s)
        save('available', available)
        f.s = deepcopy(available)
        f.act('lay_tile', hex='I4', tile='438', rotation=1)
        save('used', f.s)
        f.operating()
        save('unconnected', f.s)
        f.stock()
        f.shares('KO', 'p1', 50)
        f.s['phase'] = '3'
        E._start_operating(f.s)
        f.act('buy_private', company='TR', buyer='KO', price=20)
        f.act('lay_tile', hex='K4', tile='440', rotation=0)
        E._start_operating(f.s)
        f.act('lay_tile', hex='J5', tile='3', rotation=3)
        E._start_operating(f.s)
        save('many_choices', f.s)
        catalog = KoenjiAppService().handle('GET', '/api/1889/catalog')[1]
        return {'catalog': catalog, 'views': out}
    finally:
        t.tearDown()


if __name__ == '__main__':
    print(json.dumps(fixtures()))
