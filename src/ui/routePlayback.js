import {routeGeometry,pointOnRoute} from './trackGeometry.js';

export function makeRouteTimeline(run,board,{speed='normal',durationMs=null}={}) {
  const total=durationMs??({normal:2900,quick:1350,instant:0})[speed]??2900;
  const routes=run.routes.map((route,index)=>{
    const sameTrack=!run.track||route.vertices.every(v=>{
      const hex=v.split(':')[0],saved=run.track[hex],current=board[hex];
      return saved&&current&&saved.nodes.length===current.nodes.length&&JSON.stringify(saved.paths)===JSON.stringify(current.paths);
    });
    return {...route,geometry:sameTrack?routeGeometry(run.track||board,route.vertices):null,index};
  });
  const stagger=Math.min(150,total*.055),lead=Math.min(180,total*.08),tail=Math.min(300,total*.12);
  const travel=Math.max(1,total-lead-tail-stagger*Math.max(0,routes.length-1));
  return {run,routes:routes.map(r=>({...r,start:lead+r.index*stagger,duration:travel})),duration:total};
}
export function sampleRouteTimeline(timeline,elapsed,settled=false) {
  const done=settled||elapsed>=timeline.duration;
  return {done,routes:timeline.routes.map(route=>{
    const progress=done?1:Math.max(0,Math.min(1,(elapsed-route.start)/route.duration));
    return {...route,progress,departed:done||elapsed>=route.start,done:done||progress>=1,
      point:route.geometry?pointOnRoute(route.geometry,progress):null};
  })};
}

// Old journals fall back to exact recorded routes/total; per-train values are
// deliberately absent rather than borrowed from a different recommended plan.
export function recordedRouteRun(view,event=null) {
  const s=view?.state,turn=s?.operating_turn;
  if(!s?.current_corporation||turn?.routes==null)return null;
  const matches=run=>run?.corporation===s.current_corporation&&run.revenue===turn.revenue&&
    JSON.stringify(run.routes.map(r=>({train:r.train,vertices:r.vertices})))===JSON.stringify(turn.routes.map(r=>({train:r.train,vertices:r.vertices})));
  const candidates=[event,view.last_event,...(view.history_events||[]).filter(e=>e.revision<=s.revision).slice().reverse().map(e=>e.event)];
  let recorded=null;
  for(const candidate of candidates) {
    if(!candidate)continue;
    if(['run_routes','run_best_routes'].includes(candidate.type)) {
      if(matches(candidate.route_run))recorded=candidate.route_run;
      break; // Never borrow a different claim from a previous operating turn.
    }
    if(candidate.type==='end_turn'||(candidate.round_before&&candidate.round_after!==candidate.round_before))break;
  }
  if(recorded)return structuredClone(recorded);
  return {corporation:s.current_corporation,revenue:turn.revenue,routes:turn.routes.map(r=>({...structuredClone(r),train_type:s.trains?.[r.train]?.type})),
    idle_trains:(s.corporations?.[s.current_corporation]?.trains||[]).filter(t=>!turn.routes.some(r=>r.train===t))};
}
