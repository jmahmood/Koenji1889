import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const backendBuild=createHash('sha256').update(readFileSync(new URL('server_bridge.py',root))).digest('hex').slice(0,12);
writeFileSync(new URL('public/build-info.json',root),JSON.stringify({
  release:'v10-replay-compat',backendBuild,
  requiredBackendFeatures:['route-options','route-preview','route-revenues','cash-receipts','mascot-history'],
},null,2)+'\n');
