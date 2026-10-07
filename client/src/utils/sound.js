import stampAudioUrl from '../assets/sounds/stamp.mp3';
import rustleAudioUrl from '../assets/sounds/rustle.mp3';

const STORAGE_KEY = 'dictation_postcard_muted';

/**
 * Returns the persisted mute state from localStorage.
 * Defaults to false (unmuted).
 */
export function getInitialMuteState() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves mute state to localStorage.
 */
export function saveMuteState(isMuted) {
  try {
    localStorage.setItem(STORAGE_KEY, String(isMuted));
  } catch {
    // localStorage might be unavailable/full
  }
}

// Lazy-initialized Web Audio context for synthetic fallbacks
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthetic fallback: Stamp thud sound
 */
function playSynthStampThud() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Low frequency thud oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);

  // Subtle impact noise burst
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.1);
}

/**
 * Synthetic fallback: Paper rustle sound
 */
function playSynthPaperRustle() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.18);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.Q.setValueAtTime(1.8, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.2);
}

/**
 * Plays the stamp thud sound from assets/sounds/stamp.mp3 with fallback.
 */
export function playStampSound(isMuted) {
  if (isMuted) return;

  try {
    const audio = new Audio(stampAudioUrl);
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Fallback to synthetic audio if file is placeholder or empty
        playSynthStampThud();
      });
    }
  } catch {
    playSynthStampThud();
  }
}

/**
 * Plays the paper rustle sound from assets/sounds/rustle.mp3 with fallback.
 */
export function playRustleSound(isMuted) {
  if (isMuted) return;

  try {
    const audio = new Audio(rustleAudioUrl);
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Fallback to synthetic audio if file is placeholder or empty
        playSynthPaperRustle();
      });
    }
  } catch {
    playSynthPaperRustle();
  }
}
