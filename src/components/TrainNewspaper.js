import {escapeHtml as esc} from '../ui/presentation.js';
import {getLocale} from '../ui/i18n.js';

// Fictional editorial presentation only. The caller supplies the engine-derived
// phase/rust preview; the newspaper never changes rules or submits an action.
export function renderTrainNewspaper(view, action, preview, art) {
  const ja=getLocale()==='ja', s=view.state, old=preview.rusts;
  const selected=s.trains[action.train], next=selected.type;
  const jp=value=>({'2':'二','3':'三','4':'四','5':'五','6':'六'}[String(value)]||String(value));
  const oldJP=jp(old);
  const nextName=next==='D' ? (ja?'ディーゼル機関車':'Diesel locomotive') : (ja?`${jp(next)}型列車`:`${next}-Train`);
  const title=ja?`${oldJP}型列車、引退へ`:`THE ${old}-TRAIN ERA NEARS ITS END`;
  const affected=Object.values(s.corporations).flatMap(c=>(c.trains||[]).filter(id=>s.trains[id]?.type===old).map(id=>({company:c.id,id})));
  const subtitle=ja?`旅客は新しい${nextName}へ`:`Passengers turn to the new ${nextName}`;
  const body=ja ? [
    `長く親しまれた${oldJP}型列車が、役目を終えようとしている。車輪はまだ回るが、旅客の足は新しい列車へ向かう。`,
    `${nextName}の購入が確定すると、すべての${oldJP}型列車が運行を終える。`,
    `第${jp(s.phase)}期から第${jp(preview.phase)}期へ。列車の保有上限は${jp(view.train_limit)}両から${jp(preview.limit)}両へ。`,
  ] : [
    `After years of faithful service, the familiar ${old}-Trains are approaching retirement. Their engines still run, but passengers increasingly choose the newer locomotives.`,
    `Once this ${nextName} purchase is confirmed, every ${old}-Train will leave service. A new chapter begins across the railway.`,
    `Phase ${s.phase} advances to Phase ${preview.phase}. ${Number(view.train_limit)===Number(preview.limit) ? `The train limit remains ${preview.limit}.` : `Each railway’s train limit changes from ${view.train_limit} to ${preview.limit}.`}`,
  ];
  // The scenic engraving depicts the 2 → 4 transition only. Later eras use their
  // own mapped locomotives, so a Diesel purchase never depicts a new steam train.
  const picture=old==='2'&&next==='4'
    ? '<img class="newspaper-station-scene" src="/assets/trains/newspaper-station.webp" alt="" width="1200" height="800" decoding="async">'
    : `<div class="newspaper-era-art" aria-hidden="true"><div>${art(old)}<span>${esc(ja?`${oldJP}型列車`:`${old}-Train`)}</span></div><span class="newspaper-era-arrow">→</span><div>${art(next)}<span>${esc(nextName)}</span></div></div>`;
  return `<article class="train-newspaper edition-${ja?'ja':'en'}" lang="${ja?'ja':'en'}" data-no-translate aria-label="${ja?'列車引退の新聞・購入前の見通し':'Railway retirement newspaper · purchase preview'}">
    <header class="newspaper-masthead"><span>${ja?'四國鐵道新報':'THE SHIKOKU RAILWAY GAZETTE'}</span><b>${ja?'號外・予告':'SPECIAL EDITION · PREVIEW'}</b></header>
    <div class="newspaper-hero"><figure>${picture}<figcaption>${ja?'一つの時代に幕':'A farewell to a familiar sight'}</figcaption></figure><div class="newspaper-headlines"><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div></div>
    <div class="newspaper-lower"><div class="newspaper-columns">${body.map(text=>`<p>${esc(text)}</p>`).join('')}</div>
      <aside class="newspaper-game-effects rust-impact-banner is-cataclysm"><h4>${ja?'購入確定時に適用':'ON PURCHASE'}</h4><strong>${ja?`すべての${oldJP}型列車が引退`:`ALL ${old}-TRAINS WILL RUST`}</strong><p>${ja?'期':'Phase'} ${esc(s.phase)} → ${ja?'期':'Phase'} ${esc(preview.phase)}</p><p>${ja?'保有上限':'Train limit'} ${esc(view.train_limit)} → ${esc(preview.limit)}</p><p>${ja?'現在の対象':'Currently affected'}: ${affected.length}</p></aside>
    </div>
    <footer class="newspaper-preview"><b>${ja?'購入前の見通し':'PURCHASE PREVIEW'}</b><span>${ja?'購入に調印するまで、列車やフェーズは変わりません。':'Takes effect only when you stamp the purchase in Dispatch.'}</span></footer>
  </article>`;
}
