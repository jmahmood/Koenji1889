"""Real engine projections for rendering regression tests; no running server needed."""
import json
import sys
from copy import deepcopy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_decision_coverage import DecisionCoverageTests
from server_bridge import project_view
from app.engine1889 import engine as E
from app.engine1889.data import MARKET

def fixtures():
 t=DecisionCoverageTests('runTest');t.setUp();out={}
 def save(name,seat='p1'):
  t.install(t.f.s)
  out[name]=t.request('GET',seat=seat)
 f=t.f
 try:
  f.operating();f.route()
  for train in ['3-0','3-1','4-0','4-1']:f.give_train('IR',train)
  E._phase_change(f.s,'5');save('discard');save('discard_waiting','p2');save('discard_observer','spectator')
  f.operating();f.s['phase']='3';f.train_step()
  f.act('offer',player='p3',kind='private',item='ER',seller='p3',buyer='IR',price=40)
  f.act('buy_private',company='ER',buyer='IR',price=40);save('er_train','p3')
  f.operating();f.route();f.give_train('IR','2-0');save('routes')
  f.operating();f.route();f.train_step();save('train_normal')
  f.cash(f.s['corporations']['IR'],20);save('train_purse')
  f.operating();f.route();f.train_step();f.shares('AR','p2',50);f.give_train('AR','3-0')
  f.act('offer',player='p2',kind='train',item='3-0',seller='AR',buyer='IR',price=100);save('train_used');save('train_seller')
  f.operating();f.route();f.train_step();f.cash(f.s['corporations']['IR'],0);f.cash(f.s['players']['p1'],0);save('emergency')
  f.shares('AR','p2',50);f.shares('AR','p1',10);save('emergency_other_corporation')
  # A real stock-round transfer supplies the before/after presidency contract.
  # Emergency sales themselves cannot legally transfer a presidency.
  f.stock();f.shares('AR','p1',30);f.shares('AR','p2',30)
  f.s['stock_round']=2;save('presidency_sale')
  f.operating();f.route();f.train_step();c=f.s['corporations']['IR'];c['holdings'].update(p1=30,p2=30,p3=0);c.update(ipo=40,pool=0);f.cash(c,0);f.cash(f.s['players']['p1'],0);save('train_bankrupt');f.act('bankrupt');save('finished')
  f.operating();save('dr','p2')
  f.operating();f.s['phase']='3';save('negotiation','p3')
  for zone in ['y','o']:
   f.stock();f.shares('IR','p1',50);f.cash(f.s['players']['p1'],3000);f.s['stock_round']=2
   E._position(f.s,f.s['corporations']['IR'],next([r,c] for r,row in enumerate(MARKET) for c,cell in enumerate(row) if cell and cell['zone']==zone))
   save(zone)
  # Train-wizard edge cases retain real server action previews for browser checks.
  f.operating();f.route();f.train_step();f.shares('AR','p1',50);f.give_train('AR','2-0');save('train_common')
  f.operating();f.route();f.train_step();f.shares('AR','p2',50);f.shares('SR','p3',50);f.shares('KO','p2',50)
  E._phase_change(f.s,'3');f.give_train('IR','2-0')
  older=[tid for tid,t in f.s['trains'].items() if t['type'] in ('2','3') and t['owner']=='depot']
  for i,tid in enumerate(older):f.give_train(['AR','SR','KO'][i%3],tid)
  save('train_rust4')
  f.operating();f.route();f.give_train('IR','4-0');f.give_train('IR','6-0');E._phase_change(f.s,'6')
  f.cash(f.s['corporations']['IR'],2000);f.s['operating_turn'].update(step='train',routes=[],revenue=0,dividend=True)
  save('train_diesel')
  # Late-tier depot purchases exercise artwork and the same authoritative engine rules.
  for tier,phase,owned in [('5','4','4-0'),('6','5','5-0')]:
   f.operating();f.route();f.train_step();E._phase_change(f.s,phase)
   f.give_train('IR',owned);f.cash(f.s['corporations']['IR'],3000)
   others=[cid for cid in f.s['corporations'] if cid!='IR']
   earlier=[tid for tid,tr in f.s['trains'].items() if tr['type']!='D' and int(tr['type'])<int(tier) and tr['owner']=='depot' and not tr.get('rusted')]
   for i,tid in enumerate(earlier):f.give_train(others[i%len(others)],tid)
   save('train_late'+tier)
  return out
 finally:t.tearDown()

if __name__=='__main__':print(json.dumps(fixtures()))
