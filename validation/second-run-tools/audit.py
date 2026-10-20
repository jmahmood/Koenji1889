"""Read-only accounting audit of the UI playthrough; never submits game actions."""
import ast
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'validation/second-run-evidence'
db = sqlite3.connect(f'file:{ROOT}/validation/second-playtest.sqlite3?mode=ro', uri=True)
gid = db.execute("select id from games where room_code='DM0GHF'").fetchone()[0]
states = {n: json.loads(raw) for n, raw in db.execute(
    'select move_number,state_json from game_states where game_id=? order by move_number', (gid,))}
actions = list(db.execute('select revision,actor_player_id,move_json,event_json,accepted_at from game_actions where game_id=? order by revision', (gid,)))
violations = []
counts = {'snapshots': len(states), 'actions': len(actions), 'routes': 0, 'dividends': 0, 'capitalizations': 0}
for n, s in states.items():
    escrow = sum(sum(b.values()) for b in s['auction']['bids'].values())
    total = s['bank'] + escrow + sum(p['cash'] for p in s['players'].values()) + sum(c['cash'] for c in s['corporations'].values())
    if total != 7000:
        violations.append([n, 'money', total])
    for cid, c in s['corporations'].items():
        if c['ipo'] + c['pool'] + sum(c['holdings'].values()) != 100:
            violations.append([n, 'share supply', cid])

ledger = ['# Second UI playthrough — accepted action ledger', '',
          'Room DM0GHF. Exported read-only from SQLite after UI play. This records committed actions, not failed native inputs. See second-run-evidence for browser observations.', '',
          '| Revision | Time | Actor | Accepted action | Bank | Personal / corporate cash deltas |',
          '|---:|---|---|---|---:|---|']
key_revisions = [1, 8, 16, 22, 28, 31, 32, 49, 50, 57, 60, 69, 174, 175, 277, 278, 279, 280, 295, 305, 367, 381, 445, 454, 455, 470, 534, 551, 1000, 1026]
transactions = []
for n, actor, raw, eraw, timestamp in actions:
    a, event = json.loads(raw), json.loads(eraw)
    before, after = states[n-1], states[n]
    pd = {p: after['players'][p]['cash'] - v['cash'] for p, v in before['players'].items()}
    cd = {c: after['corporations'][c]['cash'] - v['cash'] for c, v in before['corporations'].items()}
    deltas = {k: v for k, v in {**pd, **cd}.items() if v}
    bank_delta = after['bank'] - before['bank']
    label = event.get('label', a['type']).replace('|', '\\|')
    ledger.append(f"| {n} | {timestamp} | {actor} | {label} | {after['bank']} | {json.dumps(deltas)} |")
    if n in key_revisions:
        transactions.append({'revision': n, 'action': a, 'event': event, 'bank_delta': bank_delta, 'cash_deltas': deltas})
    if a['type'] == 'run_routes':
        counts['routes'] += 1
        expected = 0
        for route in a['routes']:
            tier = 2 if before['trains'][route['train']]['type'] == 'D' else (1 if before['phase'] in ['5','6','D'] else 0)
            for vertex in set(route['vertices']):
                h, node = vertex.split(':')
                if node.startswith('n'):
                    expected += before['board'][h]['nodes'][int(node[1:])]['revenue'][tier]
        actual = after['operating_turn']['revenue']
        if actual != expected:
            violations.append([n, 'route stop arithmetic', expected, actual])
    if a['type'] == 'dividend':
        counts['dividends'] += 1
        cid = before['current_corporation']
        c = before['corporations'][cid]
        revenue = before['operating_turn']['revenue']
        expected_pd = {p: revenue * c['holdings'].get(p,0) // 100 if a['payout'] else 0 for p in pd}
        expected_corp = revenue * c['pool'] // 100 if a['payout'] else revenue
        if pd != expected_pd or cd[cid] != expected_corp or bank_delta != -sum(pd.values())-expected_corp:
            violations.append([n, 'dividend arithmetic', pd, cd[cid], expected_pd, expected_corp])
    for cid, c in after['corporations'].items():
        if c['funded'] and not before['corporations'][cid]['funded']:
            counts['capitalizations'] += 1
            if cd[cid] != c['par']*10:
                violations.append([n, 'capitalization', cid, cd[cid]])

tree = ast.parse((ROOT/'daemon18xx/app/engine1889/data.py').read_text())
market_text = next(ast.literal_eval(node.value) for node in tree.body if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'MARKET_TEXT' for t in node.targets))
market = [[int(cell.rstrip('yop')) for cell in row.split()] for row in market_text]
final = states[max(states)]
prices = {cid: market[c['position'][0]][c['position'][1]] if c['position'] is not None else 0 for cid,c in final['corporations'].items()}
scores = []
for pid, p in final['players'].items():
    shares = {cid: c['holdings'].get(pid,0)//10 * prices[cid] for cid,c in final['corporations'].items() if c['holdings'].get(pid,0)}
    privates = {cid: c['value'] for cid,c in final['privates'].items() if c['owner']==pid and not c['closed']}
    total = p['cash'] + sum(shares.values()) + sum(privates.values())
    scores.append({'player':pid,'name':p['name'],'cash':p['cash'],'shares':shares,'privates':privates,'total':total,'stored_result':final['result'][pid]})
    if total != final['result'][pid]:
        violations.append(['final score',pid,total,final['result'][pid]])
scores.sort(key=lambda x:x['total'],reverse=True)
bank_trigger = next(n for n,s in states.items() if s['bank_broken'])
summary = {'room':'DM0GHF','classification':'Read-only independent arithmetic, not engine rules certification', 'counts':counts,'violations':violations,'bank_trigger_revision':bank_trigger,'final_revision':final['revision'],'finished':final['finished'],'end_reason':final['end_reason'],'final_bank':final['bank'],'final_prices':prices,'scores':scores,'final_cash':{'personal':sum(p['cash'] for p in final['players'].values()),'corporate':sum(c['cash'] for c in final['corporations'].values())},'key_transactions':transactions}
(OUT/'accounting-audit.json').write_text(json.dumps(summary,indent=2))
(OUT/'final-state-diagnostic.json').write_text(json.dumps(final,indent=2))
(ROOT/'validation/SECOND_ACTION_LEDGER.md').write_text('\n'.join(ledger)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='key_transactions'},indent=2))
