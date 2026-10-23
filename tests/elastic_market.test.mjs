import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {layoutMarket} from '../src/ui/elasticMarket.js';
import {render2DStockMarketGrid} from '../src/components/StockExchange.js';
const market=JSON.parse(execFileSync('python3',['-c','import sys,json;sys.path.insert(0,"daemon18xx");from app.engine1889.data import MARKET;print(json.dumps(MARKET))'],{encoding:'utf8'}));
const corps={AR:{position:[2,3],market_order:2},TR:{position:[5,3],market_order:1},UR:{position:[5,3],market_order:3}};
test('preserves authoritative catalog, coordinates, zones and par slots without controls',()=>{
 const before=JSON.stringify({market,corps}),html=render2DStockMarketGrid({corporations:corps},{market}),layout=layoutMarket(market,corps);
 assert.equal(layout.cells.size,market.flat().length);
 market.forEach((row,r)=>row.forEach((cell,c)=>assert.match(html,new RegExp(`data-market-position="${r},${c}"`))));
 assert.match(html,/>350<\/span>/);assert.match(html,/>315<\/span>/);
 assert.equal((html.match(/class="elastic-par"/g)||[]).length,6);
 for(const [zone,code] of [['yellow','y'],['orange','o']])assert.equal((html.match(new RegExp(`stock-cell zone-${zone}`,'g'))||[]).length,market.flat().filter(c=>c.zone===code).length);
 assert.equal(JSON.stringify({market,corps}),before);
 assert.match(html,/Market colour key/);assert.doesNotMatch(html,/<button|section-label|sidebar/);
});
test('all seven markers fit a shared cell in market order without overlap',()=>{
 const companies=Object.fromEntries(['AR','IR','SR','KO','TR','KU','UR'].map((id,i)=>[id,{position:[5,3],market_order:7-i}]));
 const layout=layoutMarket(market,companies),cell=layout.cells.get('5,3'),tokens=[...layout.tokens.values()];
 assert.equal(tokens.length,7);assert.equal([...layout.tokens.keys()][0],'UR');
 for(const t of tokens)assert.ok(t.x>=cell.x&&t.y>=cell.y&&t.x+t.w<=cell.x+cell.w&&t.y+t.h<=cell.y+cell.h);
 for(let i=0;i<tokens.length;i++)for(let j=i+1;j<tokens.length;j++){const a=tokens[i],b=tokens[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);}
});
test('neighbours preserve axes and do not overlap at market edges or expanded cells',()=>{
 for(const position of [[0,14],[10,0],[5,3],[2,3]]){
 const layout=layoutMarket(market,{...corps,AR:{position}});
 for(const [key,a] of layout.cells){const [r,c]=key.split(',').map(Number),right=layout.cells.get(`${r},${c+1}`),down=layout.cells.get(`${r+1},${c}`);
 if(right){assert.equal(a.y+a.h/2,right.y+right.h/2);assert.ok(a.x+a.w<right.x);}
 if(down){assert.equal(a.x+a.w/2,down.x+down.w/2);assert.ok(a.y+a.h<down.y);}}
 }
});
test('unparred and invalid positions never invent markers',()=>{
 assert.equal(layoutMarket(market,{IR:{position:null},AR:{position:[-1,0]},UR:{position:[0,99]}}).tokens.size,0);
});
