import {CORP_META, TILE_FILL} from '../constants1889.js';
import {escapeHtml as esc} from '../ui/presentation.js';
import artwork from '../data/districtArtwork.json' with {type:'json'};

const COLORS=['white','yellow','green','brown'];
const PHASE={yellow:'2',green:'3',brown:'5'};
const money=n=>`¥${Number(n || 0).toLocaleString()}`;
const title=s=>s.charAt(0).toUpperCase()+s.slice(1);
const lock='<svg class="survey-padlock" viewBox="0 0 20 24" aria-hidden="true"><path d="M4 10V6a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="1" y="10" width="18" height="13" rx="2" fill="currentColor"/><path d="M10 14v5" stroke="#3f2d18" stroke-width="2"/></svg>';
const terrainIcon='<svg viewBox="0 0 54 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.5"><path d="m8 25 18-20 19 20-19 19ZM26 5v50M8 55l37-30M8 25l37 30M4 57h45"/></g></svg>';
const stationIcon='<svg viewBox="0 0 60 34" aria-hidden="true"><path d="m4 17 26-15 26 15Z M10 18v13h40V18" fill="#7b4d2e" stroke="currentColor" stroke-width="1.5"/></svg>';

export function districtSurveyModel(view, catalog, coord, profile, parseTile, legalPlacements=[]) {
  const s=view.state, hex=s.board[coord], cityNodes=hex.nodes.filter(n=>n.kind==='city');
  const capacity=cityNodes.reduce((sum,n)=>sum+(n.slots || 0),0);
  const occupied=hex.nodes.flatMap((n,i)=>n.kind==='city' ? (hex.tokens?.[i] || []) : []);
  const reservations=Object.entries(s.corporations).filter(([,c])=>c.home===coord && !c.home_placed);
  const home=Object.entries(s.corporations).find(([,c])=>c.home===coord)?.[0] || profile.homeCorp?.id;
  const fixed=['red','gray'].includes(hex.color) || Boolean(hex.port);
  const options=profile.upgradeTiles.map(tile=>{
    const parsed=parseTile(tile.code,tile.color);
    return {...tile,slots:parsed.nodes.reduce((sum,n)=>sum+(n.kind==='city' ? n.slots : 0),0)};
  });
  const phaseColors=catalog.phases?.[s.phase]?.[1] || (['5','6','D'].includes(String(s.phase)) ? COLORS.slice(1) : String(s.phase)==='2' ? ['yellow'] : ['yellow','green']);
  const stageColors=fixed ? [hex.color] : [...new Set([...profile.stages.map(st=>st.color).filter(c=>COLORS.includes(c)),hex.color])].sort((a,b)=>COLORS.indexOf(a)-COLORS.indexOf(b));
  const currentIndex=COLORS.indexOf(hex.color);
  const nextColor=fixed ? null : COLORS[currentIndex+1];
  const stages=stageColors.map(color=>{
    const tiles=options.filter(t=>t.color===color);
    const current=color===hex.color;
    const next=color===nextColor;
    const phaseOpen=phaseColors.includes(color);
    const status=current ? 'current' : COLORS.indexOf(color)<currentIndex ? 'past' : next && phaseOpen ? 'next' : 'locked';
    const capacities=tiles.map(t=>t.slots);
    return {color,tiles,current,status,phaseOpen,previous:COLORS[COLORS.indexOf(color)-1],phase:PHASE[color],
      slots:current ? [capacity,capacity] : [capacities.length ? Math.min(...capacities) : 0,Math.max(0,...capacities)]};
  });
  const nextStage=stages.find(st=>st.color===nextColor);
  const blockers=Object.values(s.privates || {}).filter(p=>!p.closed && s.players[p.owner] && p.hexes?.includes(coord));
  const costs=[...new Set(legalPlacements.filter(p=>!p.special).map(p=>p.cost))];
  const cost=costs.length===1 ? costs[0] : hex.cost || 0;
  return {hex,capacity,occupied,reservations,home,fixed,stages,nextStage,blockers,cost,printedCost:hex.cost || 0,
    stock:nextStage?.tiles || [],nextColor,phaseOpen:Boolean(nextStage?.phaseOpen)};
}

function genericVignette(kind, hex) {
  const water=kind==='offboard' || hex.port;
  const houses=kind==='city' || kind==='town';
  return `<svg class="survey-generic-art" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="140" fill="#c7d1b4"/><circle cx="236" cy="30" r="19" fill="#f3d992"/><path d="M0 90 52 26 105 75 157 35 226 89 268 51 300 86v54H0Z" fill="#768576"/><path d="M0 101 70 78 128 99 211 73 300 103v37H0Z" fill="${water?'#557f80':'#879268'}"/>${water?'<path d="M10 116h80m29 10h111m-15-20h73" stroke="#b8c5ae"/><path d="m130 109 18 14h69l18-14Z" fill="#65482e"/><path d="M182 47v62m3-59 27 51h-27Z" fill="#ece1b6" stroke="#886c45"/>':''}${houses?[38,99,160].map((x,i)=>`<g transform="translate(${x} ${72+i%2*7})"><path d="M0 16 28 0 57 16Z" fill="#564b3b"/><path d="M7 17v27h43V17" fill="#c2aa75"/><path d="M17 24h9v20m10-20h8v10" stroke="#675234" stroke-width="4"/></g>`).join(''):!water?'<path d="M28 131 89 89 143 126" fill="#b8a179"/><path d="M83 125V84m-7 3h16M70 132l14-31 13 31" fill="none" stroke="#785b38" stroke-width="3"/>':''}</svg>`;
}

function portrait(coord, profile, hex) {
  const art=artwork[coord];
  const credit=art ? art.kind==='generated-historical' ? `Illustration · c.${art.sceneYear}` : art.kind==='generated-concept' ? 'Concept art' : 'Period image' : 'District vignette';
  const source=art?.sourceUrl && /^https:\/\//.test(art.sourceUrl) ? ` · <a href="${esc(art.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>` : '';
  const history=art?.researchUrl?.startsWith('/assets/districts/research/') ? ` · <a href="${esc(art.researchUrl)}" target="_blank" rel="noopener noreferrer" aria-label="History and artwork sources for ${esc(coord)}">History</a>` : '';
  const place=art?.mappingStatus==='inferred-region' ? `${art.shortName || art.locality} area` : profile.name;
  return `<figure class="survey-portrait">${art ? `<img src="${esc(art.file)}" alt="${esc(art.alt)}" decoding="async" width="${Number(art.width) || 768}" height="${Number(art.height) || 384}" style="object-position:${(art.focalPoint?.x??.5)*100}% ${(art.focalPoint?.y??.5)*100}%">` : genericVignette(profile.kind,hex)}<span class="survey-coordinate">${esc(coord)}</span><figcaption><h3 title="${esc(art?.locality || profile.name)}${art?.mappingStatus==='inferred-region'?' — approximate regional match':''}">${esc(place)}</h3><span>${esc(title(hex.color))} ${profile.kind==='countryside'?'land':esc(profile.kind)}${hex.label ? ` · ${esc(hex.label)} label` : ''}</span><small title="${esc([art?.title,art?.creator,art?.date,art?.credit].filter(Boolean).join(' · ') || 'Illustrative district landscape')}">${credit}${history || source}</small></figcaption></figure>`;
}

function stationRights(model, profile) {
  const {capacity,occupied,reservations,home}=model;
  const reserved=reservations.map(([id])=>id);
  const badges=[...occupied.map(id=>`<span class="survey-station-token" style="--station-color:${CORP_META[id]?.color || '#78613d'}" title="${esc(id)} station placed">${esc(id)}</span>`),...reserved.map(id=>`<span class="survey-station-reservation" title="${esc(id)} home space reserved">${esc(id)}</span>`)];
  const rights=reserved.length ? `${reserved.join(' / ')} home space reserved` : occupied.length ? `${occupied.join(' / ')} station${occupied.length>1?'s':''} placed` : home ? `${home} home district` : 'No station placed';
  return `<section class="survey-stations"><h4>${capacity ? 'STATION / HOME RIGHT' : 'LOCATION TYPE'}</h4><div class="survey-station-body"><div class="survey-station-prop">${stationIcon}<div class="survey-token-rack">${badges.join('') || '<span class="survey-vacant-slot" aria-hidden="true"></span>'}</div></div><div><strong>${capacity ? `${capacity} station space${capacity===1?'':'s'}` : profile.kind==='offboard' ? 'Ferry destination' : profile.kind==='town' ? 'Town stop' : 'Plain track'}</strong><span>${home ? `${esc(CORP_META[home]?.name || home)} home` : capacity ? `${occupied.length}/${capacity} occupied` : 'No station spaces'}</span>${capacity ? `<small>${esc(rights)}</small>` : ''}</div></div></section>`;
}

function renderStage(stage, hexArt, tileArt) {
  const {color,tiles,status}=stage;
  const slots=stage.slots[1] ? stage.slots[0]===stage.slots[1] ? `${stage.slots[0]} space${stage.slots[0]===1?'':'s'}` : `${stage.slots[0]}–${stage.slots[1]} spaces` : 'No stations';
  const note=stage.current ? 'Current board tile' : tiles.length ? `#${tiles.map(t=>t.id).join(' / #')}` : 'No tile replacements';
  const gate=stage.current ? 'Current' : status==='past' ? 'Earlier color' : status==='next' ? `Next color · Phase ${stage.phase}+` : `After ${title(stage.previous)} · Phase ${stage.phase}+`;
  return `<article class="survey-stage is-${status}" data-survey-stage="${esc(color)}" data-survey-status="${status}" style="--survey-tile-color:${TILE_FILL[color]}"><header><b>${esc(title(color))}</b>${status==='locked'?lock:`<small>${stage.current?'CURRENT':status==='next'?'NEXT':''}</small>`}</header><div class="survey-stage-specimen">${stage.current ? hexArt : tiles[0] ? tileArt(tiles[0].id) : ''}<div><strong>${slots}</strong><span>${esc(note)}</span></div></div><p>${esc(gate)}</p></article>`;
}

export function renderDistrictSurvey({app,view,catalog,coord,profile,parseTile,tileArt,hexArt,legalPlacements=[]}) {
  const model=districtSurveyModel(view,catalog,coord,profile,parseTile,legalPlacements);
  const {hex,nextStage,stock}=model;
  const selected=app.surveyInspection?.room===app.roomCode && app.surveyInspection?.hex===coord ? app.surveyInspection.tile : null;
  const chosen=stock.find(t=>t.id===selected) || stock.find(t=>t.remaining>0) || stock[0];
  const rawTerrain=hex.terrain || [];
  const terrain=rawTerrain.length ? rawTerrain.join(' / ') : 'Clear land';
  const currentLock=nextStage && !model.phaseOpen;
  return `<section class="district-survey" data-district-survey="${esc(coord)}" aria-label="${esc(profile.name)} district survey"><div class="survey-top">${portrait(coord,profile,hex)}${stationRights(model,profile)}<section class="survey-terrain"><h4>TERRAIN COST</h4><div>${terrainIcon}<div><strong>${money(model.cost)}</strong><span>${esc(terrain)}</span><small>${model.cost<model.printedCost ? `This turn · printed ${money(model.printedCost)}` : model.cost ? 'Printed terrain charge' : 'No terrain surcharge'}</small></div></div></section></div>
    ${model.blockers.length ? `<p class="survey-blocking" role="status">🔒 Blocked by ${esc(model.blockers.map(p=>p.id || p.name).join(', '))} while player-owned.</p>` : ''}
    <div class="survey-section-heading"><h4>${model.fixed?'PERMANENT LOCATION':'UPGRADE IN ORDER'}</h4><span>${model.fixed ? hex.port?'MF port · No further tile upgrades':'Fixed board location · No tile replacements' : 'A later phase never skips a color.'}</span></div><div class="survey-color-chain" style="--survey-stage-count:${model.stages.length}">${model.stages.map(stage=>renderStage(stage,hexArt,tileArt)).join('')}</div>
    ${stock.length ? `<section class="survey-stock"><header><h4>NEXT COLOR: ${esc(nextStage.color.toUpperCase())} TILE STOCK</h4><span data-survey-inspection-label role="status">${currentLock ? `Phase ${nextStage.phase}+ required` : chosen ? `Inspecting #${esc(chosen.id)}` : ''}</span></header><div class="survey-stock-tray">${stock.map(tile=>`<button type="button" class="survey-stock-tile ${chosen?.id===tile.id?'is-inspected':''}" data-survey-inspect-tile="${esc(tile.id)}" aria-pressed="${chosen?.id===tile.id}" ${currentLock || tile.remaining<=0?'disabled':''}>${tileArt(tile.id)}<span><b>#${esc(tile.id)}${tile.id==='437'?' · MF power':''}</b><small>${tile.remaining} in supply</small><span class="survey-stock-pips" aria-hidden="true">${Array.from({length:Math.min(12,tile.remaining)},()=>'<i></i>').join('')}</span></span></button>`).join('')}</div></section>` : `<p class="survey-fixed-note">${model.fixed ? 'This board location cannot receive a replacement tile.' : hex.color==='brown' ? 'Final tile color reached.' : 'No further tile types in this location’s catalog.'}</p>`}
    <footer>${model.fixed ? 'Printed location rules still apply.' : 'Upgrades preserve existing track and stations.'}<span>${esc(coord)} · ${esc(hex.color.toUpperCase())}${nextStage ? ` → ${esc(nextStage.color.toUpperCase())} NEXT` : ''}</span></footer></section>`;
}

export function bindDistrictSurvey(app, root=document) {
  root.querySelectorAll('[data-survey-inspect-tile]').forEach(button=>button.addEventListener('click',()=>{
    if (button.disabled) return;
    const survey=button.closest('[data-district-survey]');
    app.surveyInspection={room:app.roomCode,hex:survey.dataset.districtSurvey,tile:button.dataset.surveyInspectTile};
    survey.querySelectorAll('[data-survey-inspect-tile]').forEach(other=>{
      const selected=other===button;other.classList.toggle('is-inspected',selected);other.setAttribute('aria-pressed',String(selected));
    });
    survey.querySelector('[data-survey-inspection-label]').textContent=`Inspecting #${button.dataset.surveyInspectTile}`;
  }));
}
