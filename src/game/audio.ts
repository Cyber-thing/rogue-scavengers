/* Процедурный звук (Web Audio) — приглушённый ночной синтвейв + уличные эффекты. */
export const Snd: any = {
  ctx: null as AudioContext | null, out: null as GainNode | null, on: true, nb: null as AudioBuffer | null,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = this.on ? 0.55 : 0;
      const comp = this.ctx.createDynamicsCompressor();
      this.out.connect(comp); comp.connect(this.ctx.destination);
      const n = (this.ctx.sampleRate * 1.6) | 0;
      this.nb = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      Music.start();
    } catch { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
  setOn(v: boolean) { this.on = v; if (this.out) this.out.gain.setTargetAtTime(v ? 0.55 : 0, this.ctx.currentTime, 0.02); },
  tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.15, dl = 0, dest?: AudioNode) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + dl, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur: number, vol: number, ft: BiquadFilterType, f0: number, f1: number, dl = 0, dest?: AudioNode) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + dl, s = c.createBufferSource();
    s.buffer = this.nb; const f = c.createBiquadFilter(); f.type = ft; f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.out); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.03);
  },
  hit(h?: boolean) { this.noise(0.09, h ? 0.35 : 0.2, "lowpass", h ? 1800 : 1200, 300); this.tone("square", h ? 140 : 200, 50, 0.1, h ? 0.2 : 0.1); },
  zap() { this.noise(0.12, 0.12, "bandpass", 4200, 900); this.tone("sawtooth", 1400, 200, 0.12, 0.06); },
  swing() { this.noise(0.07, 0.07, "highpass", 2000, 4000); },
  shoot() { this.noise(0.06, 0.16, "bandpass", 2600, 900); this.tone("square", 700, 150, 0.07, 0.08); },
  coin() { this.tone("square", 988, 988, 0.06, 0.06); this.tone("square", 1319, 1319, 0.14, 0.06, 0.06); },
  tick() { this.tone("square", 300 + Math.random() * 300, 200, 0.03, 0.04); },
  stop() { this.tone("square", 220, 170, 0.08, 0.09); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone("square", f, f, 0.15, 0.08, i * 0.09)); },
  lose() { this.tone("sawtooth", 180, 80, 0.3, 0.09); },
  glass() { for (let i = 0; i < 5; i++) this.noise(0.08, 0.18, "highpass", 3500 + Math.random() * 2500, 5000, i * 0.035); },
  siren(d = 1.6) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = "square"; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.05); g.gain.setValueAtTime(0.06, t + d - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.frequency.setValueAtTime(440, t);
    for (let k = 1; k * 0.3 <= d; k++) o.frequency.setValueAtTime(k % 2 ? 660 : 440, t + k * 0.3);
    f.type = "lowpass"; f.frequency.value = 1500; o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + 0.05);
  },
  boom() { this.noise(0.9, 0.6, "lowpass", 2200, 60); this.tone("sine", 90, 28, 0.7, 0.5); },
  hire() { [392, 494, 587, 784].forEach((f, i) => this.tone("triangle", f, f, 0.13, 0.14, i * 0.07)); },
  arrest() { this.siren(2.2); [300, 250, 200, 150].forEach((f, i) => this.tone("sawtooth", f, f * 0.8, 0.3, 0.09, i * 0.28)); },
  click() { this.tone("square", 600, 500, 0.04, 0.05); },
  buy() { this.tone("square", 660, 880, 0.08, 0.07); this.tone("square", 880, 1100, 0.1, 0.07, 0.08); },
  level() { [440, 554, 659, 880].forEach((f, i) => this.tone("triangle", f, f, 0.1, 0.12, i * 0.06)); },
  bad() { this.tone("square", 160, 110, 0.12, 0.08); },
};

/* Музыка: 84 BPM, минор, тёплый пад через ФНЧ + эхо, бас, арпеджио */
export const Music: any = {
  step: 0, next: 0, bus: null as GainNode | null, timer: 0,
  start() {
    const c: AudioContext = Snd.ctx;
    this.bus = c.createGain(); this.bus.gain.value = 0.5;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    const dly = c.createDelay(1); dly.delayTime.value = 60 / 84 * 0.75;
    const fb = c.createGain(); fb.gain.value = 0.32; const wet = c.createGain(); wet.gain.value = 0.35;
    this.bus.connect(lp); lp.connect(Snd.out); lp.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(Snd.out);
    this.next = c.currentTime + 0.15; this.loop();
  },
  loop() {
    const c: AudioContext | null = Snd.ctx; if (!c) return;
    let n = 0;
    while (this.next < c.currentTime + 0.3 && n++ < 32) { this.play(this.step, Math.max(0, this.next - c.currentTime)); this.next += 60 / 84 / 4; this.step = (this.step + 1) % 64; }
    if (this.next < c.currentTime - 1) this.next = c.currentTime + 0.1;
    this.timer = window.setTimeout(() => this.loop(), 90);
  },
  play(s: number, dl: number) {
    if (!Snd.on) return;
    const bar = s >> 4, st = s & 15;
    const roots = [55, 43.65, 65.41, 49];
    const ch = [[220, 261.63, 329.63, 493.88], [174.61, 220, 261.63, 329.63], [261.63, 329.63, 392, 493.88], [196, 246.94, 293.66, 392]][bar];
    if (st % 4 === 0 || st === 10) Snd.tone("sawtooth", roots[bar] * (st === 10 ? 2 : 1), roots[bar] * (st === 10 ? 2 : 1), 0.3, 0.075, dl, this.bus);
    const ap = [0, 2, 1, 3, 2, 1, 3, 2][st % 8];
    if (st % 2 === 1 || st % 4 === 0) Snd.tone("square", ch[ap] * (st > 7 ? 2 : 1), ch[ap] * (st > 7 ? 2 : 1), 0.12, 0.028, dl, this.bus);
    if (st === 0) { Snd.tone("sawtooth", ch[0], ch[0] * 1.004, 3.2, 0.03, dl, this.bus); Snd.tone("sawtooth", ch[2], ch[2] * 0.996, 3.2, 0.026, dl, this.bus); Snd.tone("triangle", ch[3], ch[3], 3.2, 0.03, dl, this.bus); }
    if (st % 8 === 0) Snd.tone("sine", 140, 40, 0.18, 0.22, dl, this.bus);
    if (st % 8 === 4) Snd.noise(0.12, 0.08, "bandpass", 1800, 1000, dl, this.bus);
    if (st % 2 === 1) Snd.noise(0.03, 0.03, "highpass", 7000, 7000, dl, this.bus);
  },
};
