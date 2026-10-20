import {actionBlockReason} from './presentation.js';
import {HEX_NAMES} from '../constants1889.js';

export const routeSignature = routes => JSON.stringify(routes || []);
export const stopName = vertex => {
  const [hex, node] = vertex.split(':');
  return `${HEX_NAMES[hex] || hex} (${hex})${node !== 'n0' ? ` · station ${Number(node.slice(1)) + 1}` : ''}`;
};
export function syncRoutePlan(app, view) {
  const key=`${app.roomCode}:${view.state.revision}:${view.state.current_corporation}`;
  if (app.routeDraftKey === key) return;
  app.routeDraftKey=key;
  app.routeDraft=view.state.operating_turn?.step==='routes' ? structuredClone(view.route_quote?.routes || []) : [];
  app.routePreview=null;app.routeEditor=null;app.routeError=null;app.routeQuoting=false;
  app.routeQuoteRequest=(app.routeQuoteRequest || 0)+1;
}
export function routeQuote(app, view) {
  if(app.routeDraftKey!==`${app.roomCode}:${view.state.revision}:${view.state.current_corporation}`) return view.route_quote;
  if (routeSignature(app.routeDraft)===routeSignature(view.route_quote?.routes)) return view.route_quote;
  if (app.routePreview?.revision===view.state.revision && app.routePreview.signature===routeSignature(app.routeDraft)) return app.routePreview;
  return null;
}
export function currentRouteEditor(app, view) {
  const e=app.routeEditor;
  return (app.activeModal==='decisions' || app.view==='map') && e?.revision===view.state.revision && e.signature===routeSignature(app.routeDraft) ? e : null;
}
export function displayedRoutes(app, view) {
  const base=app.routeDraftKey===`${app.roomCode}:${view.state.revision}:${view.state.current_corporation}` ? app.routeDraft : null;
  const editor=currentRouteEditor(app,view);
  const preview=editor?.connections?.[editor.connection || 0]?.route;
  if(editor) return [...(base || []).filter(r=>r.train!==editor.train),...(preview ? [preview] : [])];
  return base || view.state.operating_turn?.routes || view.route_quote?.routes || [];
}
export function bindRoutePlanning({app,api,render,execute,toast}) {
  const on=(selector,event,fn)=>document.querySelectorAll(selector).forEach(el=>el.addEventListener(event,fn));
  const ensureDraft=()=>{
    if(app.routeDraftKey===undefined && app.displayedViewData?.state) syncRoutePlan(app,app.displayedViewData);
  };
  const canEdit=()=>{
    ensureDraft();
    return app.routeDraftKey===`${app.roomCode}:${app.viewRevision}:${app.displayedViewData.state.current_corporation}` && !actionBlockReason(app,app.displayedViewData) && app.displayedViewData.legal_actions?.types?.includes('run_routes');
  };
  const quote=async()=>{
    const room=app.roomCode,token=app.token,revision=app.viewRevision,routes=structuredClone(app.routeDraft),signature=routeSignature(routes);
    const request=app.routeQuoteRequest=(app.routeQuoteRequest || 0)+1;
    app.routePreview=null;app.routeError=null;app.routeQuoting=true;render();
    const current=()=>room===app.roomCode && token===app.token && revision===app.viewRevision && request===app.routeQuoteRequest && signature===routeSignature(app.routeDraft);
    try {
      const result=await api.request(`/api/1889/games/${encodeURIComponent(room)}/route-preview`,{method:'POST',token,body:{revision,routes}});
      if(current()) app.routePreview={...result,signature};
    } catch(error) {if(current()) app.routeError=error.message;}
    finally {if(current()){app.routeQuoting=false;render();}}
  };
  const loadStops=async()=>{
    if(!canEdit() || !app.routeEditor)return;
    const editor=app.routeEditor,room=app.roomCode,token=app.token;
    const stops=[...editor.stops],signature=routeSignature(stops),request=editor.request=(editor.request || 0)+1;
    editor.loading=true;editor.error=null;editor.next_stops=[];editor.connections=[];render();
    const current=()=>app.routeEditor===editor && room===app.roomCode && token===app.token && editor.revision===app.viewRevision && request===editor.request && signature===routeSignature(editor.stops) && editor.signature===routeSignature(app.routeDraft);
    try {
      const result=await api.request(`/api/1889/games/${encodeURIComponent(room)}/route-options`,{method:'POST',token,body:{revision:editor.revision,train:editor.train,stops,routes:structuredClone(app.routeDraft)}});
      if(current()) {editor.next_stops=result.next_stops;editor.connections=result.connections;editor.connection=0;}
    } catch(error) {if(current()) editor.error=error.message;}
    finally {if(current()){
      editor.loading=false;render();
      const selector=editor.error ? '[data-route-retry-stops]' : editor.next_stops?.length ? '.route-stop-options [data-route-stop]' : editor.connections?.length ? '[data-route-use]' : '[data-route-undo-stop]';
      document.querySelector?.(selector)?.focus?.({preventScroll:true});
    }}
  };
  on('[data-edit-route]','click',async event=>{
    if(!canEdit()) return;
    const isInline=Boolean(event.currentTarget?.closest?.('[data-inline-route-planner]'));
    app.view='map';if(!isInline) app.activeModal='decisions';app.reviewAction=null;
    app.routeEditor={train:event.currentTarget.dataset.editRoute,stops:[],revision:app.viewRevision,signature:routeSignature(app.routeDraft)};
    await loadStops();
  });
  on('[data-route-stop]','click',async event=>{
    event.preventDefault();event.stopPropagation();
    const e=currentRouteEditor(app,app.displayedViewData),vertex=event.currentTarget.dataset.routeStop;
    if(!canEdit() || !e || e.loading || !e.next_stops.includes(vertex)) return;
    e.stops.push(vertex);await loadStops();
  });
  on('[data-route-stop]','keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();event.currentTarget.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  on('[data-route-undo-stop]','click',async()=>{const e=app.routeEditor;if(!canEdit() || !e?.stops.length)return;e.stops.pop();await loadStops();});
  on('[data-route-connection]','click',event=>{const e=app.routeEditor;if(!e || e.loading)return;e.connection=Number(event.currentTarget.dataset.routeConnection);render();});
  on('[data-route-cancel]','click',()=>{app.routeEditor=null;render();});
  on('[data-route-use]','click',async()=>{
    const e=currentRouteEditor(app,app.displayedViewData),selected=e?.connections?.[e.connection || 0];
    if(!canEdit() || !selected || e.loading) return;
    app.routeDraft=[...app.routeDraft.filter(r=>r.train!==e.train),structuredClone(selected.route)];
    app.routeEditor=null;await quote();
  });
  on('[data-route-idle]','click',async event=>{if(!canEdit())return;app.routeDraft=app.routeDraft.filter(r=>r.train!==event.currentTarget.dataset.routeIdle);app.routeEditor=null;await quote();});
  on('[data-copy-route-plan]','click',()=>{if(!canEdit())return;app.routeDraft=structuredClone(app.displayedViewData.route_quote.routes);app.routePreview=null;app.routeEditor=null;app.routeError=null;app.routeQuoting=false;app.routeQuoteRequest=(app.routeQuoteRequest || 0)+1;render();});
  on('[data-route-retry-quote]','click',quote);
  on('[data-route-retry-stops]','click',loadStops);
  on('[data-run-route-plan]','click',async()=>{
    const view=app.displayedViewData;
    if(!canEdit() || currentRouteEditor(app,view) || !app.routeDraft?.length || !routeQuote(app,view))return;
    const routes=structuredClone(app.routeDraft);app.activeModal=null;app.reviewAction=null;app.routeEditor=null;
    await execute({type:'run_routes',routes});
  });
}
