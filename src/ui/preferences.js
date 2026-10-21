import {getLocale,setLocale,localize} from './i18n.js';
import {gameAudio,gameEffects} from './gameAudio.js';
export const localizePage=view=>localize(document,view);
export function installPreferences({app,render}){
  const toolbar=document.createElement('div');toolbar.className='player-preferences-toolbar';
  toolbar.innerHTML=`<label><span class="sr-only">Language</span><select aria-label="Language" data-locale><option value="en" lang="en">English</option><option value="ja" lang="ja">日本語</option></select></label><button type="button" data-preferences aria-label="Sound & reminders" title="Your preferences">⚙</button>`;
  toolbar.querySelector('select').value=getLocale();document.body.append(toolbar);
  const dialog=document.createElement('dialog');dialog.className='preferences-dialog';document.body.append(dialog);
  const musicState=()=>({playing:'Playing',loading:'Loading music…',waiting:'Waiting for interaction',unavailable:'Audio unavailable',idle:'Stopped'})[gameAudio.status] || 'Stopped';
  gameAudio.onChange=()=>{const status=dialog.querySelector('[data-music-status]');if(status){status.textContent=musicState();localize(dialog);}};
  const show=()=>{
    dialog.innerHTML=`<form method="dialog"><header><h2>Your preferences</h2><button aria-label="Close">×</button></header></form><label>Background music <button type="button" data-pref-music aria-pressed="${gameAudio.enabled}">${gameAudio.enabled?'On':'Off'}</button></label><label>Sound effects <button type="button" data-pref-effects aria-pressed="${gameEffects.enabled}">${gameEffects.enabled?'On':'Off'}</button></label><label>Effects volume <input aria-label="Effects volume" type="range" min="0" max="1" step=".05" value="${gameEffects.volume}" data-effects-volume></label><label>Route playback <select data-route-speed>${['normal','quick','instant'].map(value=>`<option value="${value}" ${value===(localStorage.getItem('koenji_route_speed') || 'normal')?'selected':''}>${({normal:'Normal',quick:'Quick',instant:'Instant'})[value]}</option>`).join('')}</select></label><button type="button" data-test-sound>Test sound</button><label>Turn reminder <select data-turn-delay>${[0,20,40,60].map(n=>`<option value="${n}" ${n===Number(localStorage.getItem('koenji_turn_reminder')??20)?'selected':''}>${n?`${n} seconds`:'Never'}</option>`).join('')}</select></label><label>Motion <button type="button" data-pref-motion aria-pressed="${!app.skipMotion}">${app.skipMotion?'Off':'On'}</button></label><p data-music-status role="status">${musicState()}</p><p>Music pauses while this window is hidden.</p><p>If audio is blocked, click anywhere to start it.</p>`;
    dialog.querySelector('[data-pref-music]').onclick=()=>{gameAudio.toggle();show();render();};
    dialog.querySelector('[data-pref-effects]').onclick=()=>{gameEffects.toggle();show();};
    dialog.querySelector('[data-effects-volume]').oninput=e=>gameEffects.setVolume(e.target.value);
    dialog.querySelector('[data-route-speed]').onchange=e=>{localStorage.setItem('koenji_route_speed',e.target.value);render();};
    dialog.querySelector('[data-test-sound]').onclick=()=>{gameEffects.unlock();gameEffects.play('track',`preview:${Date.now()}`);};
    dialog.querySelector('[data-turn-delay]').onchange=e=>{localStorage.setItem('koenji_turn_reminder',e.target.value);app.turnReminderVisible=false;render();};
    dialog.querySelector('[data-pref-motion]').onclick=()=>{app.skipMotion=!app.skipMotion;show();render();};
    localize(dialog);
  };
  toolbar.querySelector('[data-preferences]').onclick=()=>{show();dialog.showModal();};
  toolbar.querySelector('[data-locale]').onchange=e=>{setLocale(e.target.value);render();localize(document);};
}
