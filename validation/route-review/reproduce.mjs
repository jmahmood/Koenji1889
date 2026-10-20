// Current regressions for the defects recorded in the historical review.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
execFileSync(process.execPath,['--test','tests/route_planning.test.mjs'],{cwd:fileURLToPath(new URL('../..',import.meta.url)),stdio:'inherit'});
