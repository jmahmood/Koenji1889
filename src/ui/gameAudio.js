// Koenji Railway Club 1889 — Adaptive Background Music & Vertical Stem Layering
// Gentle, non-intrusive parlor ambience with room-specific stem crossfades.

const STEM_FILES = [
  './music/1_Across_the_Shoji_Screens.mp3', // Stem 1: Base Bed (Hearth & Ledger)
  './music/2_Through_the_Paper_Screen.mp3', // Stem 2: Operations (Locomotive & Rails)
  './music/3_Silk_and_Soroban.mp3',        // Stem 3: Exchange & Auction (Market)
  './music/4_The_Ledger_on_the_Line.mp3'   // Stem 4: Crisis (Rust & Tension)
];

const PRESETS = {
  lounge: [1.0, 0.0, 0.0, 0.0],
  auction: [0.30, 0.0, 0.85, 0.0],
  stock: [0.22, 0.0, 0.95, 0.0],
  operations: [0.28, 0.95, 0.0, 0.0],
  crisis: [0.15, 0.20, 0.15, 1.0],
  finished: [0.35, 0.50, 0.70, 0.0]
};

const LOOP_END = 58.5; // Calibrated to shortest track duration (1_Across_the_Shoji_Screens = 58.67s)
const STEM_2_OFFSET_MS = -40; // 40ms phase lock compensation between Stem 1 and Stem 2

class GameAudioManager {
  constructor() {
    this.stems = [];
    this.enabled = localStorage.getItem('koenji_1889_bgm_enabled') === 'true';
    this.masterVolume = 0.20; // Default gentle, low-level background volume (20%)
    this.currentPresetKey = 'lounge';
    this.isPlaying = false;
    this.initialized = false;
    this.loopBound = false;
  }

  init() {
    if (this.initialized) return;

    STEM_FILES.forEach((src, idx) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = 0;

      const initialTarget = PRESETS.lounge[idx];

      const stemObj = {
        index: idx,
        audio,
        currentGain: initialTarget,
        targetGain: initialTarget,
        isFading: false,
        fadeStartGain: initialTarget,
        fadeStartTime: 0,
        fadeDuration: 0,
        offsetMs: idx === 1 ? STEM_2_OFFSET_MS : 0
      };

      this.stems.push(stemObj);
    });

    this.initialized = true;

    if (!this.loopBound) {
      this.loopBound = true;
      requestAnimationFrame(this.audioTick.bind(this));
    }
  }

  isEnabled() {
    return this.enabled;
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    localStorage.setItem('koenji_1889_bgm_enabled', this.enabled ? 'true' : 'false');

    if (this.enabled) {
      this.playAll();
    } else {
      this.pauseAll();
    }
    return this.enabled;
  }

  playAll() {
    if (!this.initialized) this.init();

    const startTime = this.stems[0]?.audio.currentTime || 0;
    this.syncPlayheads(startTime);

    this.stems.forEach(stem => {
      stem.audio.playbackRate = 1.0;
      stem.audio.play().catch(() => {});
    });

    this.isPlaying = true;
  }

  pauseAll() {
    this.stems.forEach(stem => {
      stem.audio.pause();
      stem.audio.volume = 0;
    });
    this.isPlaying = false;
  }

  syncPlayheads(targetTime) {
    this.stems.forEach(stem => {
      const adjusted = Math.max(0, targetTime + (stem.offsetMs / 1000));
      stem.audio.currentTime = adjusted;
    });
  }

  setPreset(presetKey, duration = 1.5) {
    if (this.currentPresetKey === presetKey) return;
    this.currentPresetKey = presetKey;

    const targets = PRESETS[presetKey] || PRESETS.lounge;
    const now = performance.now();

    targets.forEach((targetVal, idx) => {
      const stem = this.stems[idx];
      if (!stem) return;

      if (duration <= 0.05) {
        stem.currentGain = targetVal;
        stem.targetGain = targetVal;
        stem.isFading = false;
      } else {
        stem.fadeStartGain = stem.currentGain;
        stem.targetGain = targetVal;
        stem.fadeStartTime = now;
        stem.fadeDuration = duration;
        stem.isFading = true;
      }
    });
  }

  updateContext(appState, viewData) {
    if (!this.initialized && this.enabled) {
      this.init();
      this.playAll();
    }

    if (!this.enabled || !appState) return;

    const state = viewData?.state || appState.displayedViewData?.state || appState.liveViewData?.state;
    if (!state) return;

    // Check crisis conditions (train rusting, pending discards, emergency financing)
    const hasPendingDiscards = (state.pending_discards && state.pending_discards.length > 0);
    const hasEmergencySell = Boolean(viewData?.legal_actions?.types?.includes('emergency_sell') || viewData?.legal_actions?.types?.includes('bankrupt'));

    if (state.finished) {
      this.setPreset('finished', 2.0);
    } else if (hasPendingDiscards || hasEmergencySell) {
      this.setPreset('crisis', 1.0);
    } else if (appState.view === 'map' || state.round === 'operating') {
      this.setPreset('operations', 1.8);
    } else if (appState.view === 'market' || state.round === 'stock') {
      this.setPreset('stock', 1.8);
    } else if (state.round === 'auction') {
      this.setPreset('auction', 1.8);
    } else {
      this.setPreset('lounge', 2.0);
    }
  }

  audioTick() {
    const now = performance.now();

    if (this.enabled && this.isPlaying && this.stems.length > 0) {
      // 1. Smooth Volume Lerp
      this.stems.forEach(stem => {
        if (stem.isFading) {
          const elapsed = (now - stem.fadeStartTime) / 1000;
          if (elapsed >= stem.fadeDuration) {
            stem.currentGain = stem.targetGain;
            stem.isFading = false;
          } else {
            const t = elapsed / stem.fadeDuration;
            const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
            stem.currentGain = stem.fadeStartGain + (stem.targetGain - stem.fadeStartGain) * ease;
          }
        }

        const effectiveVol = Math.max(0, Math.min(1, stem.currentGain * this.masterVolume));
        if (Math.abs(stem.audio.volume - effectiveVol) > 0.005) {
          stem.audio.volume = effectiveVol;
        }
      });

      // 2. Playhead looping (only seek at the boundary to prevent stutter)
      const primary = this.stems[0].audio;
      const curr = primary.currentTime;

      if (curr >= LOOP_END) {
        this.syncPlayheads(0);
      }

      // 3. Smooth tape-speed drift correction
      this.stems.forEach((stem, idx) => {
        if (idx > 0) {
          const targetTime = curr + (stem.offsetMs / 1000);
          const diff = targetTime - stem.audio.currentTime;

          if (diff > 0.06) {
            stem.audio.playbackRate = 1.015;
          } else if (diff < -0.06) {
            stem.audio.playbackRate = 0.985;
          } else {
            stem.audio.playbackRate = 1.0;
          }
        }
      });
    }

    requestAnimationFrame(this.audioTick.bind(this));
  }
}

export const gameAudio = new GameAudioManager();
