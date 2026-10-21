"""Read-only checks for the frontend/backend release served by the Pi."""
import json
import re
from urllib.request import urlopen
from urllib.error import HTTPError
from urllib.parse import urljoin
BASE='http://10.0.0.30:8080/'
def read(path):
    with urlopen(urljoin(BASE,path),timeout=30) as response:
        assert response.status==200
        return response.read()
health=json.loads(read('health'));manifest=json.loads(read('build-info.json'))
assert health['status']=='ok'
assert health['build']==manifest['backendBuild'],(health['build'],manifest['backendBuild'])
assert set(manifest['requiredBackendFeatures']).issubset(health['features'])
html=read('').decode()
assets=[url for url in re.findall(r'(?:src|href)="([^"]+)"',html) if url.startswith('/assets/')]
assert len(assets)>=2
for asset in assets:assert read(asset)
assert json.loads(read('api/1889/catalog'))
for forbidden in ['test','api/1889/dev/fixture']:
    try:read(forbidden)
    except HTTPError as error:assert error.code==404
    else:raise AssertionError('Development route exposed')
print(json.dumps({'status':'passed','release':manifest['release'],'backend_build':health['build'],'assets':assets,'development_routes':'blocked'}))
