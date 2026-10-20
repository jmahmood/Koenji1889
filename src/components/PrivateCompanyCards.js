/**
 * Vintage Meiji-era Illustrated Private Company Cards & Auction Banner Artwork
 * (`src/components/PrivateCompanyCards.js`).
 *
 * Implements the illustrated certificate card style for all Shikoku 1889
 * private companies (TR, MF, ER, SMR, DR, SIR, UTF) including:
 * - Company color stamp badge + bilingual English/Japanese title header
 * - Traditional Japanese crest (top-right) & watermark vignette (bottom-left)
 * - Detailed woodblock/watercolor scene illustration (tramcar, coastal ferry,
 *   mountain viaduct locomotive, Besshi mine headframe, Dougo Onsen station,
 *   Iyo coastal line, and Uno-Takamatsu rail ferry)
 * - Inset parchment Face Value (額面) stamp box
 * - Bilingual special ability text and status ribbon (ON BLOCK, RUNOFF, BIDS, OWNED)
 */

import { PRIVATE_META } from '../constants1889.js';
import { escapeHtml } from '../ui/presentation.js';

const money = (n) => `¥${Number(n || 0).toLocaleString()}`;

export function renderPrivateCrestSVG(pid) {
  switch (pid) {
    case 'TR':
      // Crimson chrysanthemum & electric wheel foliage crest
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="none" stroke="currentColor" stroke-width="1.35" opacity="0.82">
            <path d="M8 32c9-10 21-15 36-15 8 0 15 2 20 6" opacity="0.45"/>
            <path d="M16 28c6-5 14-8 24-8M24 33c7-3 15-4 24-2" opacity="0.5"/>
            <circle cx="48" cy="18" r="10" fill="currentColor" fill-opacity="0.12"/>
            <circle cx="48" cy="18" r="4.2" fill="currentColor" fill-opacity="0.28"/>
            <path d="M48 6v24M36 18h24M39.5 9.5l17 17M56.5 9.5l-17 17"/>
            <path d="M14 22c3-4 7-5 11-3-2 4-6 5-11 3zM24 14c3-4 7-4 10-1-3 3-6 4-10 1z" fill="currentColor" fill-opacity="0.24"/>
          </g>
        </svg>
      `;
    case 'MF':
      // Seto cresting waves & three-diamond maritime emblem
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.1" opacity="0.84">
            <path d="M6 29c7-6 14-6 21 0 7-6 14-6 21 0 5-4 10-4 15 0" fill="none" stroke-width="1.6"/>
            <path d="M12 34c6-4 12-4 18 0 6-4 12-4 18 0" fill="none" opacity="0.65"/>
            <polygon points="44,6 48.5,13.5 44,21 39.5,13.5" fill-opacity="0.28"/>
            <polygon points="44,21 52.5,21 48.2,28.2 39.8,28.2" fill-opacity="0.22" transform="translate(-8.5, 0)"/>
            <polygon points="44,21 52.5,21 56.8,28.2 48.2,28.2" fill-opacity="0.22"/>
            <path d="M18 19c4-6 10-7 14-2-4 1-8 3-14 2z" fill-opacity="0.2"/>
          </g>
        </svg>
      `;
    case 'ER':
      // Ehime pine boughs & mountain crest
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.15" opacity="0.84">
            <path d="M12 28c6-9 14-14 24-14s18 5 24 14" fill="none" stroke-width="1.4"/>
            <path d="M22 25c4-7 8-11 14-11s10 4 14 11" fill-opacity="0.16"/>
            <circle cx="26" cy="18" r="5.5" fill-opacity="0.22"/>
            <circle cx="36" cy="14" r="6.5" fill-opacity="0.26"/>
            <circle cx="46" cy="18" r="5.5" fill-opacity="0.22"/>
            <path d="M36 14v17M26 18l5 7M46 18l-5 7" fill="none" stroke-width="1.4"/>
          </g>
        </svg>
      `;
    case 'SMR':
      // Besshi paulownia & crossed mining emblem
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.2" opacity="0.84">
            <path d="M38 7v22M29 11v18M47 11v18" fill="none" stroke-width="1.6"/>
            <circle cx="38" cy="7" r="2.4"/>
            <circle cx="29" cy="11" r="2"/>
            <circle cx="47" cy="11" r="2"/>
            <path d="M22 28c5-6 11-9 16-9s11 3 16 9c-5 3-11 4-16 4s-11-1-16-4z" fill-opacity="0.22"/>
            <path d="M14 24l10-10M24 24L14 14" fill="none" stroke-width="1.5" opacity="0.7"/>
          </g>
        </svg>
      `;
    case 'DR':
      // Traditional Japanese steaming onsen crest
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" opacity="0.85">
            <ellipse cx="42" cy="25" rx="15" ry="7.5" fill="currentColor" fill-opacity="0.14"/>
            <path d="M35 23c-2-4 2-6 0-10M42 24c-2-5 2-7 0-12M49 23c-2-4 2-6 0-10"/>
            <path d="M12 28c4-3 9-3 13 0" stroke-width="1.2" opacity="0.6"/>
          </g>
        </svg>
      `;
    case 'SIR':
      // Iyo camellia & coastal rail wheel crest
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.2" opacity="0.84">
            <circle cx="44" cy="19" r="10.5" fill-opacity="0.14"/>
            <circle cx="44" cy="19" r="3.5" fill-opacity="0.3"/>
            <path d="M44 8.5v21M33.5 19h21M36.5 11.5l15 15M51.5 11.5l-15 15" fill="none"/>
            <path d="M10 27c6-5 12-5 18 0" fill="none" stroke-width="1.5"/>
          </g>
        </svg>
      `;
    case 'UTF':
    default:
      // Royal Seto wave & cloud medallion
      return `
        <svg viewBox="0 0 68 38" aria-hidden="true" class="priv-crest-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.3" opacity="0.84">
            <path d="M22 22c0-7 6-13 15-13s15 6 15 13" fill-opacity="0.16"/>
            <path d="M14 26c5-5 10-5 15 0 5-5 10-5 15 0 5-5 10-5 15 0" fill="none" stroke-width="1.7"/>
            <path d="M18 31c5-4 10-4 15 0 5-4 10-4 15 0" fill="none" stroke-width="1.3" opacity="0.75"/>
            <circle cx="37" cy="16" r="3.5" fill-opacity="0.28"/>
          </g>
        </svg>
      `;
  }
}

export function renderPrivateWatermarkSVG(pid) {
  switch (pid) {
    case 'TR':
      // Botanical chrysanthemum & leaf spray in bottom-left
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.15" opacity="0.62">
            <circle cx="36" cy="26" r="9" fill-opacity="0.18"/>
            <circle cx="36" cy="26" r="3.2" fill-opacity="0.4"/>
            <path d="M36 13v26M23 26h26M27 17l18 18M45 17L27 35" fill="none"/>
            <circle cx="58" cy="32" r="6.5" fill-opacity="0.15"/>
            <path d="M12 46c10-9 22-14 38-14 11 0 21 3 30 9" fill="none" stroke-width="1.5"/>
            <path d="M18 38c4-5 9-6 13-3-3 4-8 5-13 3zM48 42c5-4 10-4 14-1-4 3-9 4-14 1z" fill-opacity="0.25"/>
          </g>
        </svg>
      `;
    case 'MF':
      // Ukiyo-e rolling Seto Inland Sea waves
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.68">
            <path d="M6 38c8-10 18-10 26 0 8-10 18-10 26 0 8-10 18-10 26 0"/>
            <path d="M10 45c8-8 16-8 24 0 8-8 16-8 24 0 8-8 16-8 24 0"/>
            <path d="M16 28c6-9 15-11 22-4-5 1-9 4-12 8" fill="currentColor" fill-opacity="0.2"/>
            <path d="M46 28c6-9 15-11 22-4-5 1-9 4-12 8" fill="currentColor" fill-opacity="0.2"/>
            <circle cx="24" cy="18" r="1.6" fill="currentColor"/>
            <circle cx="31" cy="15" r="1.3" fill="currentColor"/>
            <circle cx="56" cy="17" r="1.5" fill="currentColor"/>
          </g>
        </svg>
      `;
    case 'ER':
      // Traditional Japanese three-pine & cloud kamon
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.2" opacity="0.68">
            <path d="M26 34c0-8 9-14 22-14s22 6 22 14H26z" fill-opacity="0.22"/>
            <path d="M14 42c0-7 8-12 18-12s18 5 18 12H14z" fill-opacity="0.18"/>
            <path d="M44 42c0-7 8-12 18-12s18 5 18 12H44z" fill-opacity="0.18"/>
            <path d="M48 20v24M32 30v14M62 30v14" fill="none" stroke-width="1.8"/>
            <path d="M18 46h60" fill="none" stroke-width="1.5"/>
          </g>
        </svg>
      `;
    case 'SMR':
      // Craggy Besshi copper peaks
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" opacity="0.68">
            <polygon points="8,46 28,16 46,46" fill-opacity="0.24"/>
            <polygon points="32,46 54,11 76,46" fill-opacity="0.3"/>
            <polygon points="58,46 74,22 90,46" fill-opacity="0.2"/>
            <path d="M28 16l5 12-6 6M54 11l4 14-7 8" fill="none" stroke-width="1.2"/>
          </g>
        </svg>
      `;
    case 'DR':
      // Swirling auspicious hot-spring clouds (Ruiun)
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" opacity="0.68">
            <path d="M16 38c-5 0-8-4-7-8 1-5 6-7 11-5 3-7 12-10 19-5 5-3 12 0 13 6 5 0 9 4 8 8-1 4-5 6-11 6H16z" fill-opacity="0.22"/>
            <path d="M26 34c4-4 10-4 14 0M46 32c4-3 9-3 12 1M12 45h66" fill="none"/>
          </g>
        </svg>
      `;
    case 'SIR':
      // Southern Iyo terraced hills & river waves
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="currentColor" stroke="currentColor" stroke-width="1.3" opacity="0.68">
            <path d="M8 38c12-14 28-16 44-4 10-8 22-8 34 2v8H8z" fill-opacity="0.2"/>
            <path d="M8 44c9-5 18-5 27 0 9-5 18-5 27 0 9-5 18-5 26 0" fill="none" stroke-width="1.6"/>
          </g>
        </svg>
      `;
    case 'UTF':
    default:
      // Rolling Seto Inland Sea double waves
      return `
        <svg viewBox="0 0 96 54" aria-hidden="true" class="priv-watermark-svg">
          <g fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" opacity="0.7">
            <path d="M6 34c9-9 18-9 27 0 9-9 18-9 27 0 9-9 18-9 27 0" fill="currentColor" fill-opacity="0.16"/>
            <path d="M10 41c9-8 18-8 27 0 9-8 18-8 27 0 8-7 16-7 24 0"/>
            <path d="M14 47c9-6 18-6 27 0 9-6 18-6 27 0"/>
          </g>
        </svg>
      `;
  }
}

export function renderPrivateIllustrationSVG(pid) {
  switch (pid) {
    case 'TR':
      // Takamatsu E-Railroad: Vintage red-and-cream Meiji electric streetcar with overhead catenary poles & wires
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f3e5c8"/>
              <stop offset="65%" stop-color="#e5cfa8"/>
              <stop offset="100%" stop-color="#cbb089"/>
            </linearGradient>
            <linearGradient id="tr-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a82b22"/>
              <stop offset="100%" stop-color="#6e1712"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#tr-sky)"/>
          <!-- Distant Yashima plateau silhouette -->
          <path d="M0 84 L38 72 L78 70 L102 82 L260 84 L260 118 L0 118 Z" fill="#c9b497" opacity="0.65"/>
          <!-- Roadbed & gravel ballast -->
          <path d="M0 95 L260 88 L260 118 L0 118 Z" fill="#9c866b"/>
          <path d="M8 114 L252 93 M14 117 L256 96" stroke="#3c2f25" stroke-width="2"/>
          <!-- Wooden ties -->
          <g stroke="#543d2b" stroke-width="2" opacity="0.75">
            <line x1="25" y1="112" x2="34" y2="115"/><line x1="48" y1="110" x2="57" y2="113"/>
            <line x1="72" y1="108" x2="81" y2="111"/><line x1="96" y1="106" x2="105" y2="109"/>
            <line x1="120" y1="104" x2="129" y2="107"/><line x1="144" y1="102" x2="153" y2="105"/>
            <line x1="168" y1="100" x2="177" y2="103"/><line x1="192" y1="98" x2="201" y2="101"/>
            <line x1="216" y1="96" x2="225" y2="99"/>
          </g>
          <!-- Overhead Catenary Poles & Wires -->
          <g stroke="#3a2b20" fill="none">
            <line x1="26" y1="18" x2="26" y2="98" stroke-width="2.6"/>
            <line x1="16" y1="26" x2="38" y2="26" stroke-width="2"/>
            <line x1="18" y1="33" x2="36" y2="33" stroke-width="1.6"/>
            <line x1="212" y1="22" x2="212" y2="94" stroke-width="2.2"/>
            <line x1="203" y1="29" x2="221" y2="29" stroke-width="1.8"/>
            <path d="M0 24 Q115 31 260 19" stroke-width="1.1" opacity="0.8"/>
            <path d="M0 30 Q118 36 260 25" stroke-width="0.9" opacity="0.65"/>
            <!-- Trolley pole -->
            <line x1="128" y1="45" x2="92" y2="27" stroke-width="1.8"/>
            <circle cx="92" cy="27" r="2.2" fill="#d99b26"/>
          </g>
          <!-- Vintage Meiji Electric Streetcar (3/4 perspective) -->
          <g transform="translate(54, 38)">
            <!-- Clerestory roof -->
            <path d="M18 10 L122 4 L132 10 L10 16 Z" fill="#6b523e" stroke="#2c1d14" stroke-width="1.2"/>
            <path d="M6 16 L138 9 L144 15 L2 22 Z" fill="#cbb693" stroke="#2c1d14" stroke-width="1.3"/>
            <!-- Upper Cream Window Band -->
            <polygon points="4,21 142,14 142,35 4,43" fill="#efe0be" stroke="#2c1d14" stroke-width="1.3"/>
            <!-- Lower Crimson Body Panel -->
            <polygon points="4,42 142,34 142,54 4,63" fill="url(#tr-body)" stroke="#2c1d14" stroke-width="1.4"/>
            <!-- Gold Pinstripe -->
            <line x1="6" y1="50" x2="140" y2="41" stroke="#e5b95c" stroke-width="1.3"/>
            <!-- Streetcar Windows -->
            <g fill="#425863" stroke="#3b2316" stroke-width="1.1">
              <polygon points="10,24 23,23 23,39 10,40"/>
              <polygon points="28,23 42,22 42,38 28,39"/>
              <polygon points="46,22 60,21 60,37 46,38"/>
              <polygon points="64,21 78,20 78,36 64,37"/>
              <polygon points="82,20 96,19 96,35 82,36"/>
              <polygon points="100,19 114,18 114,34 100,35"/>
              <polygon points="118,18 136,17 136,33 118,34"/>
            </g>
            <!-- Underframe & Bogies -->
            <polygon points="10,62 138,53 136,61 12,70" fill="#231c18"/>
            <circle cx="34" cy="66" r="6.5" fill="#2b231e" stroke="#6e5a49" stroke-width="1.6"/>
            <circle cx="54" cy="64.5" r="6.5" fill="#2b231e" stroke="#6e5a49" stroke-width="1.6"/>
            <circle cx="104" cy="60.5" r="6.5" fill="#2b231e" stroke="#6e5a49" stroke-width="1.6"/>
            <circle cx="122" cy="59" r="6.5" fill="#2b231e" stroke="#6e5a49" stroke-width="1.6"/>
            <!-- Brass Headlamp & Cowcatcher -->
            <circle cx="141" cy="44" r="3.8" fill="#f7cf65" stroke="#2c1d14" stroke-width="1.2"/>
            <path d="M138 56 L149 59 L136 62 Z" fill="#3a2e27" stroke="#1b1410" stroke-width="1"/>
          </g>
        </svg>
      `;

    case 'MF':
      // Mitsubishi Ferry: Classic white-and-black steamship on Seto Inland Sea waters with mountains
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="mf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d4e1e8"/>
              <stop offset="58%" stop-color="#eddcc0"/>
              <stop offset="100%" stop-color="#c9d6de"/>
            </linearGradient>
            <linearGradient id="mf-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3a6885"/>
              <stop offset="100%" stop-color="#193b52"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#mf-sky)"/>
          <!-- Distant Seto Inland Sea Islands -->
          <path d="M0 76 L32 54 L66 64 L106 48 L152 68 L196 52 L242 66 L260 62 L260 80 L0 80 Z" fill="#8fa6b5" opacity="0.55"/>
          <path d="M18 78 L58 60 L98 73 L156 58 L210 74 L260 70 L260 82 L0 82 Z" fill="#6b8596" opacity="0.65"/>
          <!-- Coal Smoke Plume -->
          <path d="M118 31 C102 22, 78 20, 52 25 C72 14, 102 14, 122 26 Z" fill="#6d665e" opacity="0.45"/>
          <!-- Sea Water -->
          <rect x="0" y="77" width="260" height="41" fill="url(#mf-sea)"/>
          <!-- Steamship Ferry -->
          <g transform="translate(18, 22)">
            <!-- Masts & Rigging -->
            <line x1="48" y1="8" x2="48" y2="48" stroke="#4a3520" stroke-width="1.8"/>
            <line x1="158" y1="6" x2="158" y2="46" stroke="#4a3520" stroke-width="1.8"/>
            <line x1="22" y1="46" x2="48" y2="12" stroke="#3c2f25" stroke-width="0.9" opacity="0.7"/>
            <line x1="48" y1="12" x2="102" y2="32" stroke="#3c2f25" stroke-width="0.9" opacity="0.7"/>
            <line x1="106" y1="30" x2="158" y2="10" stroke="#3c2f25" stroke-width="0.9" opacity="0.7"/>
            <line x1="158" y1="10" x2="196" y2="44" stroke="#3c2f25" stroke-width="0.9" opacity="0.7"/>
            <!-- Smokestack / Funnel with Mitsubishi red band -->
            <rect x="98" y="10" width="13" height="26" rx="1" fill="#1e1c1a" stroke="#141210" stroke-width="1"/>
            <rect x="98" y="16" width="13" height="7" fill="#b82921"/>
            <!-- Upper White Deckhouse & Bridge -->
            <path d="M40 36 L172 34 L178 44 L34 45 Z" fill="#f5ead4" stroke="#2b231c" stroke-width="1.2"/>
            <rect x="64" y="27" width="76" height="9" fill="#fbf3e1" stroke="#2b231c" stroke-width="1.1"/>
            <!-- Cabin Windows -->
            <g fill="#253f52">
              <rect x="46" y="38" width="5" height="4"/><rect x="55" y="38" width="5" height="4"/>
              <rect x="64" y="38" width="5" height="4"/><rect x="73" y="38" width="5" height="4"/>
              <rect x="82" y="38" width="5" height="4"/><rect x="91" y="38" width="5" height="4"/>
              <rect x="100" y="38" width="5" height="4"/><rect x="109" y="38" width="5" height="4"/>
              <rect x="118" y="38" width="5" height="4"/><rect x="127" y="38" width="5" height="4"/>
              <rect x="136" y="38" width="5" height="4"/><rect x="145" y="38" width="5" height="4"/>
              <rect x="154" y="38" width="5" height="4"/><rect x="163" y="38" width="5" height="4"/>
            </g>
            <!-- Steel Hull (Black topsides + Red waterline) -->
            <path d="M12 43 L204 41 L194 57 L22 58 Z" fill="#1e242b" stroke="#101418" stroke-width="1.2"/>
            <path d="M20 55 L196 54 L193 60 L23 61 Z" fill="#8f2922"/>
            <!-- Hull Portholes -->
            <g fill="#f2dfb8">
              <circle cx="42" cy="49" r="1.4"/><circle cx="56" cy="49" r="1.4"/><circle cx="70" cy="49" r="1.4"/>
              <circle cx="84" cy="49" r="1.4"/><circle cx="98" cy="49" r="1.4"/><circle cx="112" cy="49" r="1.4"/>
              <circle cx="126" cy="49" r="1.4"/><circle cx="140" cy="49" r="1.4"/><circle cx="154" cy="49" r="1.4"/>
              <circle cx="168" cy="49" r="1.4"/>
            </g>
          </g>
          <!-- White Foam Wake & Ripples -->
          <path d="M16 83 Q65 80 120 83 T236 81" fill="none" stroke="#f0ead8" stroke-width="1.8" opacity="0.85"/>
          <path d="M28 92 Q90 89 155 92 T245 90" fill="none" stroke="#d5e4ec" stroke-width="1.2" opacity="0.65"/>
          <path d="M10 102 Q85 98 165 103 T250 100" fill="none" stroke="#9ab8cb" stroke-width="1" opacity="0.5"/>
        </svg>
      `;

    case 'ER':
      // Ehime Railway: Steam locomotive crossing a stone multi-arch viaduct bridge through green mountains
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="er-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#e8dec5"/>
              <stop offset="100%" stop-color="#c9d6be"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#er-sky)"/>
          <!-- Green Ehime Mountain Ridges -->
          <path d="M0 78 L28 34 L64 56 L112 22 L158 58 L204 28 L260 64 L260 118 L0 118 Z" fill="#5c8263" opacity="0.65"/>
          <path d="M0 92 L48 48 L92 70 L144 42 L192 68 L260 44 L260 118 L0 118 Z" fill="#3a6345" opacity="0.82"/>
          <!-- Steam Plume -->
          <path d="M138 30 C115 16, 80 18, 45 30 C70 12, 112 10, 142 26 Z" fill="#f7f2e4" opacity="0.85"/>
          <!-- Stone Masonry Multi-Arch Viaduct Bridge -->
          <g fill="#c9b796" stroke="#4a3b28" stroke-width="1.2">
            <path d="M0 96 L220 62 L220 72 L0 108 Z" fill="#d8c7a7"/>
            <path d="M0 106 L0 118 L18 118 C18 98, 42 94, 42 114 L54 114 C54 92, 78 88, 78 108 L90 108 C90 86, 114 82, 114 102 L126 102 C126 80, 148 76, 148 96 L158 96 C158 76, 178 72, 178 90 L190 88 L220 82 L220 66 L0 100 Z"/>
          </g>
          <!-- Train on Viaduct (angled along bridge deck) -->
          <g transform="translate(18, 76) rotate(-8.8)">
            <!-- Coaches -->
            <rect x="0" y="-12" width="32" height="11" fill="#6e3528" stroke="#241610" stroke-width="1"/>
            <rect x="35" y="-12" width="32" height="11" fill="#6e3528" stroke="#241610" stroke-width="1"/>
            <!-- Locomotive Tender & Boiler -->
            <rect x="70" y="-11" width="18" height="10" fill="#1e2224" stroke="#101214" stroke-width="1"/>
            <rect x="90" y="-15" width="14" height="14" fill="#23282a" stroke="#101214" stroke-width="1"/>
            <rect x="104" y="-12" width="26" height="11" fill="#1c2022" stroke="#101214" stroke-width="1"/>
            <!-- Smokestack & Brass Dome -->
            <rect x="122" y="-22" width="5" height="10" fill="#1c2022"/>
            <circle cx="113" cy="-14" r="3" fill="#d4a445"/>
            <polygon points="130,-4 137,-1 130,-1" fill="#a82b22"/>
            <!-- Wheels -->
            <g fill="#2b211a" stroke="#c8a96e" stroke-width="1">
              <circle cx="96" cy="0" r="3.5"/><circle cx="106" cy="0" r="3.5"/>
              <circle cx="116" cy="0" r="3.5"/><circle cx="126" cy="0" r="2.5"/>
            </g>
          </g>
        </svg>
      `;

    case 'SMR':
      // Sumitomo Mines Railway: Besshi copper mine timber headframe tower & ore cars in rocky mountains
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="smr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ded6dc"/>
              <stop offset="100%" stop-color="#e5d4b7"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#smr-sky)"/>
          <!-- Craggy Besshi Mountain Peaks -->
          <polygon points="0,95 28,38 66,85" fill="#7c6d7d" opacity="0.65"/>
          <polygon points="108,95 156,22 204,92" fill="#8d796e" opacity="0.72"/>
          <polygon points="168,95 212,34 260,90" fill="#6b5c6e" opacity="0.68"/>
          <!-- Rocky Mine Ground -->
          <path d="M0 86 L260 88 L260 118 L0 118 Z" fill="#8b735b"/>
          <path d="M0 95 L260 98 L260 118 L0 118 Z" fill="#634f3d"/>
          <!-- Timber Mine Headframe Tower & Ore Chute (Left) -->
          <g stroke="#2e2018" stroke-width="1.8" fill="none">
            <line x1="42" y1="88" x2="54" y2="20"/>
            <line x1="74" y1="88" x2="62" y2="20"/>
            <line x1="50" y1="20" x2="66" y2="20"/>
            <line x1="45" y1="68" x2="71" y2="68"/>
            <line x1="48" y1="48" x2="68" y2="48"/>
            <line x1="45" y1="68" x2="68" y2="48"/>
            <line x1="71" y1="68" x2="48" y2="48"/>
            <!-- Hoist Wheel -->
            <circle cx="58" cy="27" r="6.5" fill="#c9a55a" fill-opacity="0.35"/>
            <!-- Sloped Ore Tipple Shed -->
            <polygon points="66,44 102,64 102,86 66,86" fill="#594132" stroke-width="1.3"/>
          </g>
          <!-- Narrow-Gauge Mine Track -->
          <line x1="18" y1="104" x2="248" y2="96" stroke="#2c221c" stroke-width="2.2"/>
          <line x1="22" y1="108" x2="250" y2="100" stroke="#2c221c" stroke-width="1.8"/>
          <!-- Loaded Copper Ore Cars -->
          <g transform="translate(112, 62)">
            <!-- Ore mound 1 -->
            <path d="M4 14 L16 5 L32 8 L40 14 Z" fill="#6e4b3a" stroke="#2b1d14" stroke-width="1"/>
            <!-- Car 1 body -->
            <polygon points="2,14 42,14 38,31 6,31" fill="#32373d" stroke="#181a1d" stroke-width="1.3"/>
            <line x1="14" y1="14" x2="15" y2="31" stroke="#181a1d" stroke-width="1.1"/>
            <line x1="28" y1="14" x2="27" y2="31" stroke="#181a1d" stroke-width="1.1"/>
            <circle cx="13" cy="34" r="4.2" fill="#222" stroke="#8c7a65" stroke-width="1.3"/>
            <circle cx="31" cy="34" r="4.2" fill="#222" stroke="#8c7a65" stroke-width="1.3"/>
            <!-- Car 2 body -->
            <path d="M50 15 L60 7 L74 9 L80 15 Z" fill="#78523e" stroke="#2b1d14" stroke-width="1"/>
            <polygon points="48,15 82,15 79,30 51,30" fill="#3b4046" stroke="#181a1d" stroke-width="1.2"/>
            <circle cx="57" cy="33" r="3.8" fill="#222" stroke="#8c7a65" stroke-width="1.2"/>
            <circle cx="73" cy="33" r="3.8" fill="#222" stroke="#8c7a65" stroke-width="1.2"/>
          </g>
        </svg>
      `;

    case 'DR':
      // Dougo Railway: Meiji steam locomotive arriving at the traditional wooden Dougo Onsen station
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="dr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f2dfb8"/>
              <stop offset="100%" stop-color="#d8b989"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#dr-sky)"/>
          <!-- Matsuyama / Dougo Hills -->
          <path d="M0 80 Q55 56 118 72 T260 64 L260 118 L0 118 Z" fill="#b39268" opacity="0.55"/>
          <!-- Track Ballast -->
          <path d="M0 92 L260 92 L260 118 L0 118 Z" fill="#7c6348"/>
          <line x1="0" y1="98" x2="260" y2="96" stroke="#2e2118" stroke-width="2.2"/>
          <!-- Traditional Wooden Dougo Station Building (Right) -->
          <g transform="translate(142, 26)">
            <!-- Tiled Irimoya Roof -->
            <path d="M-8 26 L48 4 L106 26 Z" fill="#3a3d42" stroke="#1d1e21" stroke-width="1.3"/>
            <path d="M12 26 L48 11 L84 26 Z" fill="#dfd0b2" stroke="#3a2818" stroke-width="1.1"/>
            <!-- Wooden Station Walls & Veranda Pillars -->
            <rect x="4" y="26" width="88" height="40" fill="#c99f67" stroke="#3a2818" stroke-width="1.2"/>
            <rect x="14" y="34" width="18" height="22" fill="#f7cf78" stroke="#3a2818" stroke-width="1"/>
            <rect x="40" y="32" width="20" height="34" fill="#593a22" stroke="#2b1a0e" stroke-width="1"/>
            <rect x="68" y="34" width="16" height="22" fill="#f7cf78" stroke="#3a2818" stroke-width="1"/>
            <!-- Glowing Onsen Lanterns -->
            <circle cx="35" cy="34" r="3.2" fill="#ffae33" stroke="#5a2d0c" stroke-width="0.9"/>
            <circle cx="65" cy="34" r="3.2" fill="#ffae33" stroke="#5a2d0c" stroke-width="0.9"/>
          </g>
          <!-- Steam Plume -->
          <path d="M104 34 C82 20, 52 20, 26 32 C46 14, 80 14, 108 28 Z" fill="#fbf3e0" opacity="0.82"/>
          <!-- Vintage Meiji Steam Locomotive (Left/Center) -->
          <g transform="translate(16, 42)">
            <!-- Passenger Car & Tender -->
            <rect x="0" y="22" width="28" height="22" fill="#6b3426" stroke="#21140e" stroke-width="1.1"/>
            <rect x="31" y="25" width="22" height="19" fill="#25282c" stroke="#121416" stroke-width="1.1"/>
            <!-- Cab & Boiler with Brass Bands -->
            <rect x="55" y="16" width="20" height="28" fill="#262a2e" stroke="#121416" stroke-width="1.2"/>
            <rect x="75" y="22" width="38" height="20" fill="#1e2226" stroke="#121416" stroke-width="1.2"/>
            <line x1="84" y1="22" x2="84" y2="42" stroke="#d9a846" stroke-width="1.5"/>
            <line x1="98" y1="22" x2="98" y2="42" stroke="#d9a846" stroke-width="1.5"/>
            <!-- Tall Smokestack & Brass Steam Dome -->
            <polygon points="102,4 111,4 109,22 104,22" fill="#1e2226" stroke="#121416" stroke-width="1.1"/>
            <path d="M87 22 C87 13, 95 13, 95 22 Z" fill="#d9a846" stroke="#3a2818" stroke-width="1"/>
            <!-- Red Cowcatcher & Spoked Wheels -->
            <polygon points="113,36 123,44 113,44" fill="#a82b22"/>
            <circle cx="66" cy="46" r="7.5" fill="#231c16" stroke="#d4a64a" stroke-width="1.6"/>
            <circle cx="84" cy="46" r="7.5" fill="#231c16" stroke="#d4a64a" stroke-width="1.6"/>
            <circle cx="101" cy="48" r="5" fill="#231c16" stroke="#d4a64a" stroke-width="1.4"/>
            <circle cx="113" cy="48" r="5" fill="#231c16" stroke="#d4a64a" stroke-width="1.4"/>
          </g>
        </svg>
      `;

    case 'SIR':
      // South Iyo Railway: Coastal locomotive running beside Hijikawa bay and terraced Iyo hills
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="sir-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dce8e6"/>
              <stop offset="100%" stop-color="#ebd9b7"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#sir-sky)"/>
          <!-- Terraced Southern Iyo Hills -->
          <path d="M0 74 L48 32 L104 62 L168 28 L232 58 L260 44 L260 92 L0 92 Z" fill="#47756d" opacity="0.68"/>
          <!-- Coastal Seawall & Hijikawa Bay -->
          <rect x="0" y="88" width="260" height="30" fill="#295c6b"/>
          <path d="M0 76 L260 82 L260 92 L0 88 Z" fill="#b8a483" stroke="#4d3b27" stroke-width="1.1"/>
          <!-- Coastal Tank Locomotive & Coaches -->
          <g transform="translate(28, 48)">
            <path d="M114 2 C92 -8, 62 -6, 36 4 C60 -12, 92 -12, 118 0 Z" fill="#f7efe0" opacity="0.82"/>
            <rect x="0" y="14" width="38" height="16" fill="#28585e" stroke="#142b2e" stroke-width="1.1"/>
            <rect x="42" y="14" width="38" height="16" fill="#28585e" stroke="#142b2e" stroke-width="1.1"/>
            <rect x="85" y="10" width="44" height="20" fill="#1e2629" stroke="#101416" stroke-width="1.2"/>
            <rect x="118" y="0" width="6" height="12" fill="#1e2629"/>
            <circle cx="104" cy="10" r="3.5" fill="#d8a848"/>
            <circle cx="96" cy="31" r="5.5" fill="#222" stroke="#d8a848" stroke-width="1.4"/>
            <circle cx="114" cy="31" r="5.5" fill="#222" stroke="#d8a848" stroke-width="1.4"/>
          </g>
          <path d="M18 100 Q90 95 170 100 T250 98" fill="none" stroke="#e4eff2" stroke-width="1.4" opacity="0.75"/>
        </svg>
      `;

    case 'UTF':
    default:
      // Uno-Takamatsu Ferry: Grand twin-deck railway ferry steamer crossing the Seto Inland Sea
      return `
        <svg viewBox="0 0 260 118" class="priv-scene-svg" aria-hidden="true">
          <defs>
            <linearGradient id="utf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d7d8e8"/>
              <stop offset="55%" stop-color="#eed8b8"/>
              <stop offset="100%" stop-color="#c9d3e0"/>
            </linearGradient>
            <linearGradient id="utf-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#375d7d"/>
              <stop offset="100%" stop-color="#1c3552"/>
            </linearGradient>
          </defs>
          <rect width="260" height="118" fill="url(#utf-sky)"/>
          <!-- Distant Seto Islands -->
          <path d="M0 78 L42 56 L88 68 L142 50 L195 66 L244 54 L260 62 L260 82 L0 82 Z" fill="#8592ad" opacity="0.58"/>
          <!-- Sea Water -->
          <rect x="0" y="78" width="260" height="40" fill="url(#utf-sea)"/>
          <!-- Twin-Deck Uno-Takamatsu Railway Ferry Steamer -->
          <g transform="translate(14, 16)">
            <!-- Smoke -->
            <path d="M114 14 C88 4, 56 6, 26 14 C52 0, 88 0, 118 10 Z" fill="#6b645c" opacity="0.48"/>
            <!-- Masts & Flags -->
            <line x1="48" y1="4" x2="48" y2="38" stroke="#3c2a1b" stroke-width="1.7"/>
            <line x1="168" y1="6" x2="168" y2="38" stroke="#3c2a1b" stroke-width="1.7"/>
            <polygon points="48,5 36,9 48,12" fill="#b82921"/>
            <!-- Tall Funnel with Red & White Band -->
            <rect x="108" y="8" width="14" height="24" fill="#1e1e22" stroke="#111" stroke-width="1.1"/>
            <rect x="108" y="14" width="14" height="7" fill="#c43026"/>
            <!-- Bridge & Promenade Deck -->
            <rect x="64" y="24" width="82" height="9" fill="#faf1df" stroke="#2c231b" stroke-width="1.1"/>
            <path d="M30 33 L188 31 L194 42 L24 43 Z" fill="#f3e5cb" stroke="#2c231b" stroke-width="1.2"/>
            <path d="M22 43 L198 41 L202 50 L18 51 Z" fill="#e5d3b3" stroke="#2c231b" stroke-width="1.2"/>
            <!-- Promenade Windows -->
            <g fill="#2b4257">
              <rect x="36" y="35" width="6" height="4"/><rect x="46" y="35" width="6" height="4"/>
              <rect x="56" y="35" width="6" height="4"/><rect x="66" y="35" width="6" height="4"/>
              <rect x="76" y="35" width="6" height="4"/><rect x="86" y="35" width="6" height="4"/>
              <rect x="96" y="35" width="6" height="4"/><rect x="106" y="35" width="6" height="4"/>
              <rect x="116" y="35" width="6" height="4"/><rect x="126" y="35" width="6" height="4"/>
              <rect x="136" y="35" width="6" height="4"/><rect x="146" y="35" width="6" height="4"/>
              <rect x="156" y="35" width="6" height="4"/><rect x="166" y="35" width="6" height="4"/>
              <rect x="176" y="35" width="6" height="4"/>
            </g>
            <!-- Steel Hull & Red Boot-Topping -->
            <path d="M10 49 L212 47 L200 62 L20 63 Z" fill="#232938" stroke="#11151d" stroke-width="1.3"/>
            <path d="M18 59 L203 58 L200 64 L21 65 Z" fill="#9c2b23"/>
          </g>
          <!-- White Foam Bow Wave -->
          <path d="M12 83 Q75 78 135 83 T246 81" fill="none" stroke="#f5efe0" stroke-width="2" opacity="0.88"/>
          <path d="M24 94 Q95 90 165 94 T248 92" fill="none" stroke="#c8dce8" stroke-width="1.3" opacity="0.68"/>
        </svg>
      `;
  }
}

export function renderMeijiAuctionBannerSVG() {
  return `
    <svg viewBox="0 0 620 96" class="meiji-banner-art-svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="banner-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#19130f" stop-opacity="0.95"/>
          <stop offset="28%" stop-color="#5a4938" stop-opacity="0.75"/>
          <stop offset="62%" stop-color="#d5ba8e" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#b8986c" stop-opacity="0.92"/>
        </linearGradient>
        <linearGradient id="banner-sea" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1b2c38"/>
          <stop offset="100%" stop-color="#2e4e61"/>
        </linearGradient>
      </defs>
      <rect width="620" height="96" fill="url(#banner-sky)"/>
      <!-- Distant Shikoku Mountains -->
      <path d="M90 78 L165 32 L228 60 L308 16 L388 54 L452 24 L530 58 L620 30 L620 96 L90 96 Z" fill="#6b5c4d" opacity="0.58"/>
      <path d="M140 82 L212 44 L276 66 L352 28 L425 64 L495 38 L620 68 L620 96 L140 96 Z" fill="#493f36" opacity="0.72"/>
      <!-- Seto Inland Sea Horizon -->
      <rect x="80" y="72" width="540" height="24" fill="url(#banner-sea)" opacity="0.75"/>
      <!-- Traditional Coastal Town Houses (Middle Ground) -->
      <g fill="#38291e" stroke="#cbb084" stroke-width="0.6" opacity="0.85">
        <polygon points="190,66 202,58 214,66"/>
        <rect x="193" y="66" width="18" height="8"/>
        <polygon points="218,65 232,56 246,65"/>
        <rect x="221" y="65" width="22" height="9"/>
        <polygon points="252,67 263,60 274,67"/>
        <rect x="254" y="67" width="18" height="7"/>
      </g>
      <!-- Steam Plume from Locomotive -->
      <path d="M366 30 C330 14, 275 16, 225 28 C268 8, 328 8, 372 24 Z" fill="#f3e6c9" opacity="0.68"/>
      <!-- Embankment & Track -->
      <path d="M120 82 L620 76 L620 96 L120 96 Z" fill="#2c1f16"/>
      <line x1="140" y1="82" x2="610" y2="76" stroke="#c8a86b" stroke-width="1.4" opacity="0.8"/>
      <!-- Meiji Steam Train Consist -->
      <g transform="translate(348, 42)">
        <!-- Locomotive Boiler & Cab -->
        <polygon points="0,34 -10,39 2,39" fill="#a62c22"/>
        <rect x="2" y="18" width="34" height="16" fill="#1c2024" stroke="#c59f56" stroke-width="0.9"/>
        <rect x="6" y="4" width="6" height="14" fill="#1c2024" stroke="#c59f56" stroke-width="0.8"/>
        <circle cx="20" cy="16" r="3.5" fill="#d4a448"/>
        <rect x="36" y="12" width="16" height="22" fill="#23282d" stroke="#c59f56" stroke-width="0.9"/>
        <rect x="54" y="19" width="20" height="15" fill="#1c2024" stroke="#c59f56" stroke-width="0.8"/>
        <!-- Wooden Passenger Coaches -->
        <rect x="78" y="16" width="38" height="18" fill="#5e2e20" stroke="#d4b06a" stroke-width="0.9"/>
        <rect x="120" y="16" width="38" height="18" fill="#5e2e20" stroke="#d4b06a" stroke-width="0.9"/>
        <!-- Glowing Coach Windows -->
        <g fill="#f5cf76">
          <rect x="83" y="20" width="5" height="5"/><rect x="91" y="20" width="5" height="5"/>
          <rect x="99" y="20" width="5" height="5"/><rect x="107" y="20" width="5" height="5"/>
          <rect x="125" y="20" width="5" height="5"/><rect x="133" y="20" width="5" height="5"/>
          <rect x="141" y="20" width="5" height="5"/><rect x="149" y="20" width="5" height="5"/>
        </g>
        <!-- Spoked Wheels -->
        <g fill="#1b1510" stroke="#d4a84f" stroke-width="1.2">
          <circle cx="10" cy="36" r="4"/><circle cx="24" cy="36" r="5.5"/><circle cx="38" cy="36" r="5.5"/>
          <circle cx="60" cy="36" r="4"/><circle cx="70" cy="36" r="4"/>
          <circle cx="86" cy="36" r="4"/><circle cx="108" cy="36" r="4"/>
          <circle cx="128" cy="36" r="4"/><circle cx="150" cy="36" r="4"/>
        </g>
      </g>
      <!-- Left Fade Gradient into Title Area -->
      <rect x="0" y="0" width="210" height="96" fill="url(#banner-sky)" opacity="0.65"/>
    </svg>
  `;
}

/**
 * Renders an individual Private Company certificate card in the Meiji vintage
 * illustrated style (`TR`, `MF`, `ER`, `SMR`, `DR`, `SIR`, `UTF`).
 */
export function renderVintagePrivateCard(priv, options = {}) {
  const {
    index = 0,
    isSelected = false,
    isOffered = false,
    isRunoff = false,
    offerPrice = priv.value,
    ownerName = null,
    highBid = 0,
    minNextBid = priv.value + 5,
    bidSummary = '',
    inAuction = false,
    interactive = true,
    inspectable = false,
    compact = false,
  } = options;

  const meta = PRIVATE_META[priv.id] || {};
  const cardColor = meta.color || '#8c2d19';
  const cardBorder = meta.border || '#6e2011';
  const cardAccent = meta.accent || '#b8503b';
  const displayPrice = isOffered && !isRunoff ? offerPrice : priv.value;
  const isDiscounted = isOffered && !isRunoff && offerPrice < priv.value;
  const benefitTag =
    meta.benefitTag ||
    (meta.blocks && meta.blocks !== 'None' ? `Blocks ${meta.blocks}` : `Pays ${money(priv.revenue)}/OR`);

  let ribbonHtml = '';
  let stateClass = '';

  if (priv.closed) {
    stateClass = 'is-closed';
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-closed">
        <span>✕ CLOSED CONCESSION · 閉鎖済</span>
      </div>
    `;
  } else if (ownerName) {
    stateClass = 'is-owned';
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-owned">
        <span>✓ OWNED BY ${ownerName.toUpperCase()} · 所有者: ${ownerName} (Pays ${money(priv.revenue)}/OR)</span>
      </div>
    `;
  } else if (isOffered && isRunoff) {
    stateClass = 'offered is-runoff';
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-runoff">
        <span class="ribbon-gavel">🔨</span>
        <span>COMPETITIVE RUNOFF · HIGH ${money(highBid)} (${bidSummary})</span>
      </div>
    `;
  } else if (isOffered) {
    stateClass = 'offered';
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-on-block">
        <span class="ribbon-gavel">🔨</span>
        <span>ON BLOCK · OFFER ${money(offerPrice)} · SELECT TO INSPECT</span>
      </div>
    `;
  } else if (bidSummary) {
    stateClass = 'has-bids';
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-bids">
        <span>ESCROW BIDS: ${bidSummary} · NEXT ≥${money(minNextBid)}</span>
      </div>
    `;
  } else if (inAuction && !compact) {
    ribbonHtml = `
      <div class="priv-status-ribbon ribbon-available">
        <span>#${index + 1} IN ORDER · INSPECT TO PREPARE BID (MIN ${money(minNextBid)})</span>
      </div>
    `;
  }

  const tag = interactive || inspectable ? 'button' : 'article';
  const attrs = interactive
    ? `type="button" data-select-private="${priv.id}" aria-pressed="${isSelected}"`
    : inspectable
      ? `type="button" data-private-details="${escapeHtml(priv.id)}" aria-haspopup="dialog" aria-label="View details for ${escapeHtml(priv.name || meta.name || priv.id)}" title="View company details in larger text"`
      : '';

  return `
    <${tag}
      class="private-card vintage-private-card ${isSelected ? 'selected' : ''} ${stateClass} ${compact ? 'is-compact-preview' : ''}"
      style="--priv-color:${cardColor};--priv-border:${cardBorder};--priv-accent:${cardAccent}"
      ${attrs}
    >
      <div class="priv-card-inner">
        <header class="priv-card-header">
          <span class="priv-badge-stamp"><b>${priv.id}</b></span>
          <div class="priv-title-group">
            <strong class="priv-name">${priv.name || meta.name || priv.id}</strong>
            <small class="priv-jp">${meta.jp || ''}</small>
          </div>
          <span class="priv-crest">${renderPrivateCrestSVG(priv.id)}</span>
        </header>

        <div class="priv-card-art-row">
          <div class="priv-illustration-frame">
            ${renderPrivateIllustrationSVG(priv.id)}
          </div>
          <div class="priv-face-stamp">
            <strong class="priv-face-amount">${money(displayPrice)}</strong>
            <span class="priv-face-label-en">${isDiscounted ? `Face ${money(priv.value)}` : 'Face Value · 額面'}</span>
            <em class="priv-rev-pill">Pays ${money(priv.revenue)}/OR</em>
          </div>
        </div>

        <div class="priv-card-footer priv-benefit-box">
          <span class="priv-watermark">${renderPrivateWatermarkSVG(priv.id)}</span>
          <div class="priv-rules-copy">
            <div class="priv-benefit-header">
              <strong class="priv-benefit-kicker">BENEFIT: +${money(priv.revenue)}/OR</strong>
              <span class="priv-benefit-tag">${benefitTag}</span>
            </div>
            <p class="priv-power">${meta.power || ''}</p>
            <p class="priv-power-jp">${meta.powerJp || ''}</p>
          </div>
        </div>

        ${ribbonHtml}
      </div>
    </${tag}>
  `;
}
