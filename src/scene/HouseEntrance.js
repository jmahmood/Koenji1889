// Illustrated from the owner's entrance references; no source photos are served.
export function renderHouseEntrance(route='door') {
  if(route!=='door') return `<div class="interior-origin" aria-hidden="true"><div class="interior-door"></div><span>${route==='kitchen'?'台所 · Kitchen':'Downstairs bedroom'}</span></div>`;
  return `<svg class="house-entrance" viewBox="0 0 600 650" role="img" aria-label="Koenji house entrance with cream tiles, a dark front door, balcony, wall lamp and mailbox">
    <defs><pattern id="entrance-tiles" width="37" height="37" patternUnits="userSpaceOnUse"><rect width="37" height="37" fill="#d6cdb4"/><path d="M0 0 H37 V37" fill="none" stroke="#a89f8a" stroke-width="3"/></pattern></defs>
    <rect width="600" height="650" fill="#a6b8ba"/><path d="M30 0 H560 V620 H30Z" fill="url(#entrance-tiles)"/>
    <path d="M180 270 H405 V610 H180Z" fill="#a79d85"/><rect x="209" y="290" width="147" height="310" fill="#252c2c" stroke="#181c1d" stroke-width="10"/>
    <g class="entrance-door"><rect x="219" y="300" width="124" height="290" fill="#343a36"/><path d="M241 325 V562 M258 325 V562 M275 325 V562 M292 325 V562 M309 325 V562" stroke="#151e22" stroke-width="7"/><path d="M325 470 V510" stroke="#b5ac8c" stroke-width="5"/></g>
    <path d="M70 180 H465 V266 H70Z" fill="url(#entrance-tiles)" stroke="#343d3c" stroke-width="8"/><path d="M70 180 H465 M96 80 V180 M146 80 V180 M196 80 V180 M246 80 V180 M296 80 V180 M346 80 V180 M396 80 V180 M446 80 V180 M83 83 H455" stroke="#303b3e" stroke-width="8"/>
    <path d="M65 80 L470 80 L435 34 L95 34Z" fill="#c2ceca" stroke="#303b3e" stroke-width="8"/>
    <path d="M174 269 V295 H106 V598" fill="none" stroke="#30383a" stroke-width="10"/>
    <circle cx="175" cy="340" r="20" fill="#e5dfba" stroke="#30383a" stroke-width="5"/>
    <rect x="126" y="405" width="61" height="80" fill="#8b9186" stroke="#5b625b" stroke-width="3"/><path d="M133 422 H181" stroke="#343b39" stroke-width="5"/>
    <path d="M184 600 H379 L404 638 H159Z" fill="#b9ac92" stroke="#887e6c" stroke-width="3"/>
  </svg>`;
}
