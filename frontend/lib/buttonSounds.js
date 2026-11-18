/**
 * Realistic mechanical button sounds (Web Audio API, no audio files needed).
 * Kinds: "press" (finger down), "release" (let go early), "success" (action confirmed).
 */
// One shared AudioContext — browsers cap how many can exist at once.
let sharedAudioCtx = null;
const getAudioCtx = () => {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
};

// One physical "click": a sharp plastic transient + a short body thump
const clickLayer = (ctx, at, { tone = 3200, body = 170, level = 0.55, decay = 0.018 } = {}) => {
  const len = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.0025));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(tone, at);
  bp.Q.setValueAtTime(1.4, at);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(level, at);
  nGain.gain.exponentialRampToValueAtTime(0.0008, at + decay);
  noise.connect(bp).connect(nGain).connect(ctx.destination);
  noise.start(at);
  noise.stop(at + 0.03);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(body * 1.6, at);
  osc.frequency.exponentialRampToValueAtTime(body, at + 0.02);
  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(level * 0.6, at);
  oGain.gain.exponentialRampToValueAtTime(0.0008, at + 0.045);
  osc.connect(oGain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.05);
};

export const playButtonSound = (kind = "press") => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + 0.005;
    if (kind === "press") {
      // Switch bottoming out
      clickLayer(ctx, now, { tone: 2800, body: 150, level: 0.6 });
    } else if (kind === "release") {
      // Lighter, higher spring-back click
      clickLayer(ctx, now, { tone: 4200, body: 260, level: 0.35, decay: 0.012 });
    } else if (kind === "success") {
      // Firm double "clack-click" like a biometric machine accepting the punch
      clickLayer(ctx, now, { tone: 2400, body: 130, level: 0.7, decay: 0.022 });
      clickLayer(ctx, now + 0.07, { tone: 4200, body: 240, level: 0.4, decay: 0.012 });
      const beep = ctx.createOscillator();
      const g = ctx.createGain();
      beep.type = "sine";
      beep.frequency.setValueAtTime(1760, now + 0.12);
      g.gain.setValueAtTime(0.0001, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.13);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      beep.connect(g).connect(ctx.destination);
      beep.start(now + 0.12);
      beep.stop(now + 0.32);
    }
  } catch (e) {
    // Audio unsupported or blocked
  }
};

export const vibrate = (pattern) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
};
