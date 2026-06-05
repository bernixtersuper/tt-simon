export const BUTTONS = ['green', 'red', 'yellow', 'blue'] as const;
export type ButtonId = typeof BUTTONS[number];

export interface GameSpeed {
  flashMs: number;
  gapMs: number;
  timerMs: number;
}

export const SPEED_A: GameSpeed = { flashMs: 820, gapMs: 230, timerMs: 5000 };
export const SPEED_B: GameSpeed = { flashMs: 280, gapMs: 75, timerMs: 1800 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function getSpeed(score: number): GameSpeed {
  if (score <= 4) return SPEED_A;
  const t = Math.min(1, (score - 4) / 16);
  return {
    flashMs: Math.round(lerp(SPEED_A.flashMs, SPEED_B.flashMs, t)),
    gapMs:   Math.round(lerp(SPEED_A.gapMs,   SPEED_B.gapMs,   t)),
    timerMs: Math.round(lerp(SPEED_A.timerMs, SPEED_B.timerMs, t)),
  };
}

// Classic Simon tones (Hz) — original hardware frequencies
const TONES: Record<ButtonId, number> = {
  green:  415,
  red:    310,
  yellow: 252,
  blue:   209,
};

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

export function playButton(id: ButtonId, durationMs: number): void {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const dur = Math.max(durationMs, 100) / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(TONES[id], t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.62, t + 0.015);
    gain.gain.setValueAtTime(0.62, t + Math.max(dur - 0.06, 0.02));
    gain.gain.linearRampToValueAtTime(0, t + dur + 0.01);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch {
    // AudioContext unavailable
  }
}

export function playError(): void {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.7);
    gain.gain.setValueAtTime(0.38, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.85);
  } catch {
    // AudioContext unavailable
  }
}

// Radial gradient origin: inner corner of each pie slice (toward board center)
export const BUTTON_STYLE: Record<ButtonId, {
  dim: string;
  lit: string;
  shadow: string;
  borderRadius: string;
}> = {
  green: {
    dim: 'rgba(34,197,94,0.22)',
    lit: 'radial-gradient(circle at 100% 100%, rgba(187,247,208,1) 0%, rgba(74,222,128,0.95) 18%, rgba(34,197,94,0.8) 42%, rgba(34,197,94,0.3) 72%, transparent 100%)',
    shadow: '0 0 55px rgba(34,197,94,0.65), inset 0 0 45px rgba(134,239,172,0.2)',
    borderRadius: '100% 0 0 0',
  },
  red: {
    dim: 'rgba(239,68,68,0.22)',
    lit: 'radial-gradient(circle at 0% 100%, rgba(254,202,202,1) 0%, rgba(248,113,113,0.95) 18%, rgba(239,68,68,0.8) 42%, rgba(239,68,68,0.3) 72%, transparent 100%)',
    shadow: '0 0 55px rgba(239,68,68,0.65), inset 0 0 45px rgba(252,165,165,0.2)',
    borderRadius: '0 100% 0 0',
  },
  yellow: {
    dim: 'rgba(234,179,8,0.22)',
    lit: 'radial-gradient(circle at 100% 0%, rgba(254,240,138,1) 0%, rgba(250,204,21,0.95) 18%, rgba(234,179,8,0.8) 42%, rgba(234,179,8,0.3) 72%, transparent 100%)',
    shadow: '0 0 55px rgba(234,179,8,0.65), inset 0 0 45px rgba(253,224,71,0.2)',
    borderRadius: '0 0 0 100%',
  },
  blue: {
    dim: 'rgba(59,130,246,0.22)',
    lit: 'radial-gradient(circle at 0% 0%, rgba(191,219,254,1) 0%, rgba(96,165,250,0.95) 18%, rgba(59,130,246,0.8) 42%, rgba(59,130,246,0.3) 72%, transparent 100%)',
    shadow: '0 0 55px rgba(59,130,246,0.65), inset 0 0 45px rgba(147,197,253,0.2)',
    borderRadius: '0 0 100% 0',
  },
};

export const SHOWING_MESSAGES = [
  'Recordá los movimientos...',
  'Esta es difícil 😅',
  'Vas muy bien 💪',
  '... ¿cómo empezaba?',
  'Rojo, verde, rojo... eeh me perdí',
  '赤、緑、赤。。。なんだったっけえー',
  'Red, green, red... What was it?',
  'Vermelho, verde, vermelho... qual era?',
  'Красный, зелёный, красный... что дальше?',
  'Rosso, verde, rosso... come andava?',
  'Röd, grön, röd... vad var det nu igen?',
  'แดง เขียว แดง... อะไรนะ?',
  '빨강, 초록, 빨강... 뭐였더라?',
  'Rot, grün, rot... wie ging das nochmal?',
  'Rouge, vert, rouge... c\'était quoi déjà?',
  '红、绿、红。。。然后呢？',
  '紅、綠、紅⋯⋯接下來是什麼？',
];

export function randomButton(): ButtonId {
  return BUTTONS[Math.floor(Math.random() * BUTTONS.length)];
}
