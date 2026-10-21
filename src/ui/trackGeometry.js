import {hexCenter,hexEdgePoint} from '../constants1889.js';

// The board renderer and moving trains deliberately share these anchors/curves.
export const MAP_GEOMETRY={radius:34,originX:68,originY:38};
export function endpointCoord(cx,cy,ep,nodesCount,radius) {
  if(ep.startsWith('e'))return hexEdgePoint(cx,cy,Number(ep.slice(1)),radius);
  const index=Number(ep.slice(1));
  return nodesCount<=1 || index===0 ? {x:cx,y:cy}
    : {x:cx+(index===1?10:-10),y:cy+(index===1?-8:8)};
}
export function trackSegment(cx,cy,a,b,nodesCount,radius) {
  const start=endpointCoord(cx,cy,a,nodesCount,radius),end=endpointCoord(cx,cy,b,nodesCount,radius);
  const control=a.startsWith('e')&&b.startsWith('e')?{x:cx,y:cy}:null;
  const d=`M ${start.x.toFixed(1)} ${start.y.toFixed(1)} ${control?`Q ${cx.toFixed(1)} ${cy.toFixed(1)}`:'L'} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  return {start,end,control,d};
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function routeGeometry(board,vertices,layout=MAP_GEOMETRY) {
  if(!Array.isArray(vertices)||vertices.length<2)return null;
  const points=[],stops=[],commands=[];let length=0;
  const anchor=vertex=>{
    const [hex,part]=vertex.split(':'),tile=board[hex];
    if(!tile || !/^(e[0-5]|n\d+)$/.test(part) || (part[0]==='n'&&!tile.nodes?.[Number(part.slice(1))]))return null;
    const {cx,cy}=hexCenter(hex,layout.radius,layout.originX,layout.originY);
    return {...endpointCoord(cx,cy,part,tile.nodes?.length||0,layout.radius),hex,part,cx,cy};
  };
  const add=point=>{if(points.length)length+=distance(points.at(-1),point);points.push({...point,distance:length});};
  const first=anchor(vertices[0]);if(!first)return null;
  add(first);commands.push(`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`);
  if(first.part[0]==='n')stops.push({vertex:vertices[0],...first,distance:0});
  for(let i=1;i<vertices.length;i++) {
    const a=anchor(vertices[i-1]),b=anchor(vertices[i]);if(!a||!b)return null;
    if(a.hex===b.hex) {
      if(!board[a.hex].paths?.some(([x,y])=>(x===a.part&&y===b.part)||(y===a.part&&x===b.part)))return null;
      const segment=trackSegment(a.cx,a.cy,a.part,b.part,board[a.hex].nodes.length,layout.radius);
      commands.push(segment.d.slice(segment.d.indexOf(a.part[0]==='e'&&b.part[0]==='e'?'Q':'L')));
      const steps=segment.control?24:1;
      for(let j=1;j<=steps;j++) {
        const t=j/steps,u=1-t,c=segment.control;
        add(c?{x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y}:b);
      }
    } else {
      // Neighboring edge midpoints coincide. A nonzero gap is invalid geometry,
      // never a license to draw a shortcut across another hex.
      if(a.part[0]!=='e'||b.part[0]!=='e'||distance(a,b)>.05)return null;
    }
    if(b.part[0]==='n')stops.push({vertex:vertices[i],...b,distance:length});
  }
  return length>0?{points,stops,length,d:commands.join(' ')}:null;
}
export function pointOnRoute(geometry,progress) {
  const target=Math.max(0,Math.min(1,progress))*geometry.length,points=geometry.points;
  let low=1,high=points.length-1;
  while(low<high){const mid=(low+high)>>1;if(points[mid].distance<target)low=mid+1;else high=mid;}
  const a=points[low-1],b=points[low],t=(target-a.distance)/(b.distance-a.distance||1);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI};
}
