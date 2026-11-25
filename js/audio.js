// Generated sounds (Web Audio), no files. Soft wooden taps, bell chimes for
// matches, a little fanfare for a cleared board. Nothing harsh, ever.

let ctx = null;
let master = null;
let muted = false;

export function setMuted(m) {
  muted = !!m;
  if (master) master.gain.value = muted ? 0 : 0.9;
}

export function isMuted() {
  return muted;
}

// Must be called from a tap (phones only allow sound after a user gesture).
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch (e) {
    ctx = null;
  }
}

function tone(freq, { at = 0, dur = 0.3, type = "sine", vol = 0.3, attack = 0.005, bend = 0 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (bend) o.frequency.exponentialRampToValueAtTime(freq * bend, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// A bell: a few inharmonic partials that fade at different speeds.
function bell(freq, at = 0, vol = 0.22) {
  tone(freq, { at, dur: 1.1, vol });
  tone(freq * 2.0, { at, dur: 0.7, vol: vol * 0.45 });
  tone(freq * 3.01, { at, dur: 0.4, vol: vol * 0.2 });
  tone(freq * 4.2, { at, dur: 0.18, vol: vol * 0.12 });
}

// Pentatonic steps so taps always sound pleasant together.
const STEPS = [392, 440, 523.25, 587.33, 659.25, 783.99, 880];

export const sfx = {
  tap(n = 0) {
    const f = STEPS[Math.min(n, STEPS.length - 1)];
    tone(f, { dur: 0.16, type: "triangle", vol: 0.28 });
    tone(f * 2, { dur: 0.06, vol: 0.08 });
  },
  match(combo = 0) {
    const base = [523.25, 587.33, 659.25, 698.46, 783.99][Math.min(combo, 4)];
    bell(base, 0);
    bell(base * 1.25, 0.07);
    bell(base * 1.5, 0.14, 0.26);
  },
  blocked() {
    tone(196, { dur: 0.12, type: "sine", vol: 0.12 });
  },
  undo() {
    tone(660, { dur: 0.22, type: "sine", vol: 0.15, bend: 0.6 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.13, 0.24));
    [1318.5, 1567.98, 2093].forEach((f, i) => tone(f, { at: 0.62 + i * 0.07, dur: 0.5, vol: 0.06 }));
  },
  lose() {
    tone(392, { dur: 0.5, type: "sine", vol: 0.18 });
    tone(329.63, { at: 0.22, dur: 0.7, type: "sine", vol: 0.16 });
  },
  wrong() {
    tone(349.23, { dur: 0.35, type: "triangle", vol: 0.14 });
    tone(311.13, { at: 0.16, dur: 0.45, type: "triangle", vol: 0.12 });
  },
  right() {
    bell(659.25, 0);
    bell(987.77, 0.1);
  },
  chest() {
    [783.99, 987.77, 1174.66, 1567.98, 1975.53].forEach((f, i) => bell(f, i * 0.08, 0.16));
  },
  bloom() {
    tone(880, { dur: 0.5, vol: 0.12, bend: 1.5, attack: 0.05 });
  },
};
