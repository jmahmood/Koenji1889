"""Run on the Pi against its installed bridge and HTTP service.
Creates only isolated authored fixture games; never modifies ordinary games.
Credentials stay in a private server-side file, never in test output.
"""
import json
import os
import sys
import uuid
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
sys.path.insert(0, '/home/jawaad/koenji/app')
from server_bridge import KoenjiAppService, KoenjiDatabase
base = 'http://10.0.0.30:8080'
service = KoenjiAppService(KoenjiDatabase(Path('/home/jawaad/koenji/data/games.sqlite3')))

def request(path, token=None, body=None):
    headers={'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    try:
        with urlopen(Request(base+path, data=json.dumps(body).encode() if body is not None else None, headers=headers), timeout=180) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)

status, health=request('/health')
assert status==200 and {'route-options','route-revenues'}.issubset(health['features'])
status, fixture=service.handle('POST','/api/1889/dev/fixture',{'preset':'route_planning'})
assert status==200
room=fixture['room_code'];token=fixture['player_tokens'][0]
path='/api/1889/games/'+room
status,view=request(path,token);assert status==200
state=view['state'];revision=state['revision'];quote=view['route_quote']
assert len(quote['route_revenues'])==2 and sum(quote['route_revenues'].values())==quote['revenue']==90
payload={'revision':revision,'train':'2-0','stops':['F1:n0','E2:n0'],'routes':quote['routes']}
status,options=request(path+'/route-options',token,payload);assert status==200,(status,options)
connection=options['connections'][0]
plan=[route for route in quote['routes'] if route['train']!='2-0']+[connection['route']]
status,preview=request(path+'/route-preview',token,{'revision':revision,'routes':plan})
assert status==200 and preview['revenue']==90 and sum(preview['route_revenues'].values())==90
status,_=request(path+'/route-options',fixture['spectator_token'],payload);assert status==403
status,_=request(path+'/route-options',fixture['player_tokens'][1],payload);assert status==403
status,unchanged=request(path,token);assert status==200 and unchanged['state']['revision']==revision
command={'expected_revision':revision,'command_id':'route-smoke-'+str(uuid.uuid4()),'action':{'type':'run_routes','routes':plan}}
status,run=request(path+'/actions',token,command);assert status==200,(status,run)
status,retry=request(path+'/actions',token,command);assert status==200 and retry['state']['revision']==run['state']['revision']
status,_=request(path+'/route-options',token,payload);assert status==409
before=run['state'];corp=before['corporations'][before['current_corporation']];revenue=before['operating_turn']['revenue']
status,paid=request(path+'/actions',token,{'expected_revision':before['revision'],'command_id':'dividend-smoke-'+str(uuid.uuid4()),'action':{'type':'dividend','payout':True}})
assert status==200,(status,paid)
after=paid['state'];cid=before['current_corporation']
assert after['corporations'][cid]['cash']-corp['cash']==revenue*corp['pool']//100
for pid,person in before['players'].items():
    assert after['players'][pid]['cash']-person['cash']==revenue*corp['holdings'].get(pid,0)//100
expected=sum(revenue*pct//100 for pct in corp['holdings'].values())+revenue*corp['pool']//100
assert before['bank']-after['bank']==expected
assert paid['last_event']['dividend_allocation']['ipo_retained_by_bank']==revenue*corp['ipo']//100
status,reloaded=request(path,token);assert status==200 and reloaded['state']==after
status,history=request(path+'/revisions/'+str(revision),token);assert status==200 and history['state']==state
# Browser verification gets a fresh route position, not the already-paid game.
status,browser_fixture=service.handle('POST','/api/1889/dev/fixture',{'preset':'route_planning'})
assert status==200
private_path=Path('/home/jawaad/koenji/releases/playtest-20261021/browser-fixture.json')
fd=os.open(str(private_path), os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w') as output:json.dump(browser_fixture,output)
print(json.dumps({'status':'passed','backend_build':health['build'],'checks':['HTTP per-train revenue','manual stop editor','custom preview','spectator/other-seat rejection','idempotent route submission','stale revision rejection','rulebook dividend allocation','persistent reload','historical inspection'],'isolated_test_room':room,'browser_test_room':browser_fixture['room_code']}))
