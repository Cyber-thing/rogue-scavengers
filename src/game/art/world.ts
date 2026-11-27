/* ======================================================================
   МИР: небо, параллакс-небоскрёбы, фасады улиц (чанки), асфальт.
   Всё запекается один раз в офф-скрин канвасы (640×360-пространство).
   ====================================================================== */
import { W, H, CHPX } from "../consts";
import { mkCanvas, mulberry32 } from "../util";

export const PF = '"Press Start 2P", monospace';
export const GROUND_Y = 176; // начало тротуара (px)

export interface SignGlow { x: number; y: number; col: number[]; flick: boolean; ph: number; w: number }
export interface Chunk { i: number; x: number; type: string; canvas: HTMLCanvasElement; glow: number[]; signs: SignGlow[]; zone: number[] | null; billboard?: string }

export const CORPS = [
  { name: "AGOGEE HEIGHTS", slogan: "ЖИВИ ВЫШЕ", col: "#5fa8a0", dark: "#10282a" },
  { name: "INTERCELL SYNTHETICS", slogan: "ТВОЙ СИНТЕЗ", col: "#7fb0e0", dark: "#101c2e" },
  { name: "SLAYER INC.", slogan: "ПОРЯДОК — ЭТО МЫ", col: "#c25a4a", dark: "#2a1210" },
  { name: "TAKAMURI GLOBAL", slogan: "ДОСТАВИМ ВСЁ", col: "#d9a23a", dark: "#2a2010" },
  { name: "GEXOGEN MEDICAL", slogan: "ЗДОРОВЬЕ ПО ПОДПИСКЕ", col: "#8fc08a", dark: "#122418" },
  { name: "FUSION CYBERNETICS", slogan: "ЭНЕРГИЯ БЕЗ ГРАНИЦ", col: "#e0884a", dark: "#2a160c" },
];

let skyCv: HTMLCanvasElement, farCv: HTMLCanvasElement, midCv: HTMLCanvasElement, asphCv: HTMLCanvasElement, vigCv: HTMLCanvasElement;
export const farBeacons: number[][] = [];
export const farLogos: number[][] = [];
export const art = {
  get sky() { return skyCv; }, get far() { return farCv; }, get mid() { return midCv; },
  get asph() { return asphCv; }, get vig() { return vigCv; },
};
export const LAYER_W = 960;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function rgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function gradientDither(g: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][], y0 = 0) {
  const S = stops.map((s) => [s[0], rgb(s[1])] as [number, number[]]);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    let i = 0;
    while (i < S.length - 2 && t > S[i + 1][0]) i++;
    const a = S[i], b = S[i + 1], k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
    const c = [0, 1, 2].map((q) => a[1][q] + (b[1][q] - a[1][q]) * k);
    // квантование на 5 уровней на канал + дизеринг по Байеру
    for (let x = 0; x < w; x++) {
      const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const q = c.map((v) => { const s = v / 10; const f = s - Math.floor(s); return Math.round((Math.floor(s) + (f > th ? 1 : 0)) * 10); });
      g.fillStyle = `rgb(${q[0]},${q[1]},${q[2]})`;
      g.fillRect(x, y0 + y, 1, 1);
    }
  }
}

export function initArt() {
  /* ---------- небо ---------- */
  skyCv = mkCanvas(W, 190);
  let g = skyCv.getContext("2d")!;
  gradientDither(g, W, 190, [[0, "#070b12"], [0.35, "#0f1a28"], [0.62, "#1e3040"], [0.82, "#4a4656"], [0.93, "#8a5a48"], [1, "#6a4a40"]]);
  const rg = mulberry32(5);
  g.fillStyle = "#c8d8e0";
  for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rg() * W), Math.floor(rg() * 70), 1, 1);
  for (let i = 0; i < 14; i++) { // слои смога
    const y = 40 + Math.floor(rg() * 130), w = 80 + Math.floor(rg() * 240), x = Math.floor(rg() * W);
    g.fillStyle = `rgba(150,130,130,${0.04 + rg() * 0.05})`; g.fillRect(x, y, w, 2 + Math.floor(rg() * 3));
  }
  /* тусклое пятно луны за дымкой */
  for (let r = 36; r > 0; r -= 6) { g.fillStyle = `rgba(200,200,190,${0.02 + (36 - r) * 0.0035})`; g.beginPath(); g.arc(500, 46, r, 0, 7); g.fill(); }
  g.fillStyle = "rgba(220,215,200,.5)"; g.fillRect(496, 42, 8, 8);

  /* ---------- дальний слой: мегабашни ---------- */
  farBeacons.length = 0; farLogos.length = 0;
  farCv = mkCanvas(LAYER_W, 190);
  g = farCv.getContext("2d")!;
  let rr = mulberry32(11), x = 0;
  while (x < LAYER_W) {
    let w = 26 + Math.floor(rr() * 46);
    if (LAYER_W - x - w < 30) w = LAYER_W - x;
    const h = 70 + Math.floor(rr() * 100), top = 190 - h;
    const col = rr() < 0.5 ? "#0e1722" : "#121c28";
    g.fillStyle = col; g.fillRect(x, top, w, h);
    g.fillStyle = "rgba(120,160,190,.07)"; g.fillRect(x, top, 2, h);
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + w - 3, top, 3, h);
    if (rr() < 0.5) { g.fillStyle = col; g.fillRect(x + (w >> 1) - 1, top - 12, 2, 12); farBeacons.push([x + (w >> 1), top - 12]); }
    if (rr() < 0.3) { g.fillRect(x + 4, top - 5, w - 8, 5); }
    for (let wy = top + 6; wy < 176; wy += 6) for (let wx = x + 4; wx < x + w - 4; wx += 5) {
      const r = rr();
      if (r < 0.22) { g.fillStyle = r < 0.07 ? "#8a6a3a" : "#2e5060"; g.fillRect(wx, wy, 2, 3); }
    }
    if (w > 44 && h > 120 && rr() < 0.5) { farLogos.push([x + w / 2, top + 26]); g.strokeStyle = "#b8703a"; g.lineWidth = 2; g.beginPath(); g.arc(x + w / 2, top + 26, 7, 0, 7); g.stroke(); g.fillStyle = "#b8703a"; g.fillRect(x + w / 2 - 1, top + 14, 2, 24); }
    x += w + Math.floor(rr() * 4);
  }
  /* дымка перед дальним слоем */
  const fg = g.createLinearGradient(0, 80, 0, 190); fg.addColorStop(0, "rgba(70,70,86,0)"); fg.addColorStop(1, "rgba(90,70,70,.5)"); g.fillStyle = fg; g.fillRect(0, 80, LAYER_W, 110);

  /* ---------- средний слой ---------- */
  midCv = mkCanvas(LAYER_W, 190);
  g = midCv.getContext("2d")!;
  rr = mulberry32(23); x = 0;
  while (x < LAYER_W) {
    let w = 34 + Math.floor(rr() * 50);
    if (LAYER_W - x - w < 40) w = LAYER_W - x;
    const h = 60 + Math.floor(rr() * 62), top = 190 - h;
    g.fillStyle = "#16212d"; g.fillRect(x, top, w, h);
    g.fillStyle = "#1c2a38"; g.fillRect(x, top, w, 3);
    g.fillStyle = "rgba(140,170,200,.06)"; g.fillRect(x, top, 2, h);
    if (rr() < 0.4) { g.fillStyle = "#0e1620"; g.fillRect(x + 4, top - 10, 12, 10); g.fillRect(x + 8, top - 14, 4, 4); }
    if (rr() < 0.4) { g.fillStyle = "#0e1620"; g.fillRect(x + w - 10, top - 16, 2, 16); g.fillRect(x + w - 14, top - 12, 10, 1); }
    for (let wy = top + 8; wy < 170; wy += 9) for (let wx = x + 5; wx < x + w - 6; wx += 8) {
      const r = rr();
      if (r < 0.3) { g.fillStyle = r < 0.1 ? "#d9a441" : r < 0.2 ? "#a8782f" : "#5fa0a0"; g.fillRect(wx, wy, 4, 5); g.fillStyle = "rgba(255,230,160,.12)"; g.fillRect(wx - 1, wy - 1, 6, 7); }
    }
    if (rr() < 0.25) { const c = CORPS[Math.floor(rr() * CORPS.length)]; g.fillStyle = c.col; g.fillRect(x + 6, top + 14, 3, 30); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x + 6, top + 14, 1, 30); }
    x += w + Math.floor(rr() * 5);
  }
  const mg = g.createLinearGradient(0, 100, 0, 190); mg.addColorStop(0, "rgba(40,40,56,0)"); mg.addColorStop(1, "rgba(60,48,52,.55)"); g.fillStyle = mg; g.fillRect(0, 100, LAYER_W, 90);

  /* ---------- асфальт ---------- */
  asphCv = mkCanvas(128, 160);
  g = asphCv.getContext("2d")!;
  gradientDither(g, 128, 160, [[0, "#242a32"], [1, "#12151b"]]);
  const ra = mulberry32(77);
  for (let i = 0; i < 520; i++) { g.fillStyle = ra() < 0.5 ? "#2c333c" : "#0e1116"; g.fillRect(Math.floor(ra() * 128), Math.floor(ra() * 160), 1 + (ra() < 0.2 ? 1 : 0), 1); }
  for (const p of [[10, 30, 44], [70, 80, 36], [30, 128, 32]]) { // заплатки
    g.fillStyle = "#1a1f26"; g.fillRect(p[0], p[1], p[2], 8); g.fillStyle = "#2e353f"; g.fillRect(p[0] + 3, p[1], p[2] - 10, 1);
  }
  g.strokeStyle = "#0a0c10"; g.lineWidth = 1; g.beginPath(); g.moveTo(8, 10); g.lineTo(30, 18); g.lineTo(42, 14); g.lineTo(60, 30); g.moveTo(90, 100); g.lineTo(104, 112); g.lineTo(118, 108); g.stroke();
  g.fillStyle = "#0c0e12"; g.fillRect(90, 40, 22, 4); g.fillRect(93, 44, 14, 2);
  /* ---------- виньетка ---------- */
  vigCv = mkCanvas(W, H);
  g = vigCv.getContext("2d")!;
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.65);
  gr.addColorStop(0, "rgba(4,6,12,0)"); gr.addColorStop(1, "rgba(4,6,12,.66)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

/* ---------------------- ФАСАДЫ (чанки) ---------------------- */
export function bakeChunk(type: string, rng: () => number): Omit<Chunk, "i" | "x" | "type"> {
  const CW = CHPX, CHH = GROUND_Y + 2;
  const c = mkCanvas(CW, CHH), g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const R = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const ri = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const T = (t: string, x: number, y: number, size: number, col: string, center = false) => {
    g.font = `${size}px ${PF}`; g.textBaseline = "top"; g.textAlign = center ? "center" : "left"; g.fillStyle = col; g.fillText(t, Math.round(x), Math.round(y));
  };
  const signs: SignGlow[] = [];
  let glow = [217, 164, 65];
  let zone: number[] | null = null;
  let billboard: string | undefined;
  const sign = (txt: string, x: number, y: number, w: number, h: number, bg: string, fg: string, size: number, gl: number[]) => {
    R(x - 3, y - 3, w + 6, h + 6, "#080b10"); R(x - 2, y - 2, w + 4, h + 4, "#2a3038"); R(x, y, w, h, bg); R(x, y, w, 1, "#ffffff22");
    T(txt, x + w / 2 + 1, y + (h - size) / 2 + 2, size, "#00000088", true);
    T(txt, x + w / 2, y + (h - size) / 2 + 1, size, fg, true);
    signs.push({ x: x + w / 2, y: y + h / 2, col: gl, flick: rng() < 0.35, ph: rng() * 6, w });
  };
  const PAL = [
    { b: "#34424e", d: "#27323c", l: "#46576a" }, { b: "#4a3a38", d: "#382a2a", l: "#5e4a46" },
    { b: "#3a3c4e", d: "#2c2e3e", l: "#4c5066" }, { b: "#48463e", d: "#363428", l: "#5a584c" },
  ];
  const lotLike = type === "lot" || type === "charge";
  const P = type === "club" ? { b: "#1e1a2a", d: "#14111e", l: "#2e2a40" } : type === "bar" ? { b: "#5a3a34", d: "#40282a", l: "#724a40" } : PAL[ri(0, 3)];
  const top = lotLike ? 118 : ri(34, 62);
  const lit = ["#d9a441", "#e8c070", "#6fb0b0", "#d98a4a"];

  const winAt = (x: number, y: number, w: number, h: number) => {
    const on = rng() < 0.52, col = lit[ri(0, 3)];
    R(x - 1, y - 1, w + 2, h + 2, "#0a0d12");
    R(x, y, w, h, on ? col : "#141c28");
    if (on) {
      R(x, y, w, 2, "#ffffff40"); R(x + (w >> 1), y, 1, h, "#00000040"); R(x, y + (h >> 1), w, 1, "#00000040");
      if (rng() < 0.4) { for (let k = 0; k < h; k += 3) R(x, y + k, w, 1, "#00000030"); }
      if (rng() < 0.3) R(x + 2, y + h - 7, 4, 7, "#00000090");
    } else { R(x, y, 2, h, "#222c3a"); R(x + w - 4, y + h - 3, 4, 3, "#222c3a"); }
    R(x - 2, y + h + 1, w + 4, 2, P.l); R(x - 2, y + h + 3, w + 4, 1, "#0a0d12");
    if (rng() < 0.18) { R(x + 2, y + h + 4, w - 4, 6, "#2a3038"); R(x + 4, y + h + 5, w - 8, 1, "#4a525e"); }
  };
  const facade = () => {
    R(0, top, CW, GROUND_Y - top, P.b);
    for (let x = 0; x < CW; x += 29) { R(x, top, 1, GROUND_Y - top, P.d); R(x + 1, top, 1, GROUND_Y - top, "#ffffff08"); }
    for (let y = top + 8; y < GROUND_Y; y += 22) { R(0, y, CW, 1, P.d); R(0, y + 1, CW, 1, "#ffffff07"); }
    for (let i = 0; i < 40; i++) R(ri(0, CW - 10), top + 6 + ri(0, 15) * 8, ri(6, 20), 6, rng() < 0.5 ? P.l + "55" : P.d + "99");
    for (let i = 0; i < 9; i++) { const sx = ri(0, CW), sh = ri(30, 110); R(sx, top + 4, ri(2, 5), sh, "#00000030"); }
    R(0, top, CW, 6, P.l); R(0, top + 6, CW, 2, "#0a0d12"); R(0, top, CW, 1, "#ffffff30");
    for (let x = 4; x < CW; x += 16) R(x, top + 2, 10, 3, P.d);
    /* трубы и кабели */
    for (let k = 0; k < 2; k++) { const px = ri(6, CW - 12); R(px, top + 8, 4, GROUND_Y - top - 8, "#2a3038"); R(px, top + 8, 1, GROUND_Y - top - 8, "#5a6470"); for (let y = top + 20; y < GROUND_Y; y += 34) R(px - 1, y, 6, 2, "#14181e"); }
    g.strokeStyle = "#0a0d12"; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const ax = ri(0, CW), ay = top + ri(10, 40); g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + 60, ay + ri(14, 30), ax + ri(90, 160), ay + ri(-4, 8)); g.stroke(); }
    /* крыша */
    if (rng() < 0.6) { const ax = ri(10, 200); R(ax, top - 12, 30, 12, "#2a3038"); R(ax + 2, top - 10, 26, 2, "#46505e"); R(ax + 22, top - 18, 2, 6, "#2a3038"); }
    if (rng() < 0.5) { const ax = ri(180, 320); R(ax, top - 2, 2, 1, "#000"); R(ax, top - 28, 2, 28, "#2a3038"); R(ax - 6, top - 22, 14, 1, "#2a3038"); R(ax, top - 29, 2, 2, "#c0463a"); signs.push({ x: ax + 1, y: top - 28, col: [192, 70, 58], flick: true, ph: rng() * 6, w: 6 }); }
    if (rng() < 0.4) { const wx = ri(150, 280); R(wx, top - 22, 22, 22, "#3a3028"); R(wx - 1, top - 25, 24, 4, "#26201a"); R(wx + 4, top - 2, 3, 2, "#241c16"); }
  };
  const upperWindows = (y0: number, y1: number) => { for (let y = y0; y < y1; y += 30) for (let x = 18; x < CW - 24; x += 38) winAt(x, y, 18, 18); };
  const door = (x: number, w: number, col: string) => {
    R(x - 2, 112, w + 4, 64, "#0a0d12"); R(x, 114, w, 62, "#2a2c34"); R(x + 3, 118, w - 6, 40, col); R(x + 3, 118, w - 6, 3, "#ffffff40");
    R(x + w / 2 - 1, 118, 2, 40, "#0a0d1288"); R(x + w - 9, 140, 2, 8, "#c0c8d0"); R(x + 3, 158, w - 6, 18, "#1a1c22");
  };
  const poster = (x: number, y: number) => {
    const c = CORPS[ri(0, 5)];
    R(x, y, 22, 30, "#0a0d12"); R(x + 1, y + 1, 20, 28, c.dark); R(x + 1, y + 1, 20, 6, c.col + "cc"); R(x + 4, y + 11, 14, 8, c.col + "55"); R(x + 4, y + 22, 10, 1, c.col); R(x + 4, y + 25, 14, 1, c.col + "88");
  };
  const warden = (x: number, y: number) => { R(x, y, 34, 16, "#0a0d12"); R(x + 1, y + 1, 32, 14, "#3a1818"); T("WARDEN", x + 17, y + 4, 8, "#d9605a", true); R(x + 2, y + 13, 30, 1, "#d9605a"); };
  const graffiti = (x: number, y: number) => { T("SK", x, y, 16, "#b8553acc"); g.strokeStyle = "#b8553acc"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y + 20); g.lineTo(x + 36, y - 4); g.stroke(); };
  const crack = (x: number) => {
    R(x + 40, 140, 18, 12, "#0a0d12"); g.strokeStyle = "#cfe0f0"; g.lineWidth = 1;
    for (const t of [[x + 49, 146, x + 8, 126], [x + 49, 146, x + 88, 128], [x + 49, 146, x + 28, 172], [x + 49, 146, x + 76, 172]]) { g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); g.stroke(); }
  };
  const shopWindow = (x: number, w: number, bg: string, shelf: (x: number, y: number, w: number, h: number) => void) => {
    R(x - 3, 118, w + 6, 58, "#080b10"); R(x, 121, w, 55, bg); R(x, 121, w, 4, "#ffffff30");
    shelf(x, 121, w, 55);
    R(x + 8, 121, 6, 55, "#ffffff10"); R(x + w / 2, 121, 3, 55, "#ffffff0c"); R(x - 3, 174, w + 6, 4, "#2a3038");
  };
  const cols6 = ["#a8553a", "#d9a23a", "#6fb0b0", "#b4506e", "#d8d0bc", "#4a7a9a"];

  if (!lotLike) facade();
  switch (type) {
    case "mart": {
      glow = [255, 178, 58];
      upperWindows(top + 20, 98);
      /* маркиза */
      for (let x = 20; x < 330; x += 16) R(x, 100, 16, 12, (((x - 20) / 16) | 0) % 2 ? "#cfd6cc" : "#2f6a66");
      R(20, 112, 310, 2, "#00000070"); for (let x = 20; x < 330; x += 16) R(x + 2, 112, 12, 3, (((x - 20) / 16) | 0) % 2 ? "#cfd6cc" : "#2f6a66");
      const shelf = (x: number, y: number, w: number, _h: number) => { R(x, y + 2, w, 3, "#cfe8e0"); for (const sy of [y + 22, y + 40]) { R(x + 4, sy, w - 8, 2, "#5a4a3a"); for (let i = 0; i < (w - 12) / 8; i++) { void _h; const hh = ri(8, 15); R(x + 6 + i * 8, sy - hh, 6, hh, cols6[ri(0, 5)]); } } };
      shopWindow(26, 118, "#1c3a3a", shelf); shopWindow(206, 118, "#1c3a3a", shelf);
      door(150, 48, "#254a48");
      R(158, 130, 32, 8, "#0a0d12"); T("ОТКРЫТО", 174, 131, 8, "#e0a43a", true);
      if (rng() < 0.5) crack(26); else crack(206);
      sign("MART 24", 90, 70, 168, 24, "#0e1c24", "#ffb23a", 16, [255, 178, 58]);
      R(86, 66, 176, 1, "#ffb23a"); R(86, 98, 176, 1, "#ffb23a");
      zone = [24, 100, 302, 76]; break;
    }
    case "netcafe": {
      glow = [111, 224, 230];
      upperWindows(top + 20, 98);
      for (let x = 20; x < 330; x += 20) R(x, 102, 20, 10, (((x - 20) / 20) | 0) % 2 ? "#1c3a4a" : "#2a5a6a");
      const shelf = (x: number, y: number, w: number, h: number) => { for (let k = 0; k < 3; k++) for (let i = 0; i < (w - 12) / 24; i++) { const mx = x + 6 + i * 24, my = y + 6 + k * 16; R(mx, my, 18, 12, "#0a0d12"); R(mx + 1, my + 1, 16, 10, "#0e2a1c"); for (let l = 0; l < 3; l++) R(mx + 2, my + 2 + l * 3, 4 + ri(0, 8), 1, "#6fe08a"); R(mx + 6, my + 12, 6, 2, "#2a3038"); } void h; };
      shopWindow(26, 118, "#10281c", shelf); shopWindow(206, 118, "#10281c", shelf);
      door(150, 48, "#14383a");
      sign("NETLINE", 96, 68, 156, 24, "#081820", "#6fe0e6", 16, [111, 224, 230]);
      T("ONLINE 24H · DIAL-IN", 174, 96, 8, "#6fe08a", true);
      zone = [24, 100, 302, 76]; break;
    }
    case "charge": {
      glow = [255, 140, 70];
      /* киоск за навесом */
      R(120, 96, 108, 80, "#2c3440"); R(120, 96, 108, 4, "#46505e"); R(124, 118, 100, 40, "#0a0d12"); R(126, 120, 96, 36, "#1a3a44"); R(126, 120, 96, 3, "#6fe0e6aa");
      door(158, 32, "#1a3a44");
      /* навес */
      R(6, 62, 336, 18, "#1c222a"); R(6, 62, 336, 3, "#46505e"); R(6, 78, 336, 3, "#0a0d12"); R(8, 80, 332, 2, "#ff8c46"); R(8, 82, 332, 3, "#ff8c4655");
      R(36, 80, 8, 96, "#3a424e"); R(36, 80, 3, 96, "#6a7480"); R(304, 80, 8, 96, "#3a424e"); R(304, 80, 3, 96, "#6a7480");
      sign("FUSION CELL", 100, 66, 150, 12, "#14181e", "#ffa04a", 8, [255, 140, 70]);
      for (const px of [76, 262]) { R(px, 112, 22, 64, "#0a0d12"); R(px + 2, 114, 18, 60, "#46505e"); R(px + 2, 114, 18, 3, "#7a8490"); R(px + 4, 120, 14, 14, "#0a0d12"); R(px + 5, 121, 12, 12, "#2aa0b0"); R(px + 6, 123, 8, 1, "#c8fcff"); R(px + 6, 126, 5, 1, "#c8fcff"); R(px + 5, 140, 12, 2, "#e0a43a"); R(px + 20, 128, 3, 30, "#14181e"); R(px + 22, 150, 4, 8, "#14181e"); }
      R(310, 30, 4, 146, "#3a424e"); R(292, 40, 44, 24, "#0a0d12"); R(294, 42, 40, 20, "#14181e"); T("0.19", 314, 45, 8, "#6fe0e6", true); T("0.24", 314, 54, 8, "#6fe0e6", true);
      R(0, 168, CW, 8, "#2a3038");
      zone = [158, 112, 32, 64]; break;
    }
    case "bar": {
      glow = [224, 140, 58];
      upperWindows(top + 20, 98);
      for (const x of [26, 214]) { R(x - 3, 118, 112, 58, "#080b10"); R(x, 121, 106, 52, "#4a3020"); for (let y = 124; y < 170; y += 4) R(x, y, 106, 1, "#a8742a88"); R(x + 30, 128, 46, 20, "#0a0d12"); for (let i = 0; i < 8; i++) R(x + 33 + i * 5, 130 + (i & 1) * 2, 3, 12, cols6[ri(0, 5)]); R(x + 4, 121, 100, 3, "#ffd09040"); }
      door(150, 48, "#4a2a1c");
      R(206, 124, 6, 14, "#0a0d12"); R(207, 125, 4, 12, "#e0a43a");
      sign("РЖАВЫЙ КОНТАКТ", 80, 72, 188, 22, "#140e10", "#e8a040", 8, [224, 140, 58]);
      R(76, 68, 196, 1, "#e0a43a"); R(76, 96, 196, 1, "#e0a43a");
      graffiti(10, 128); break;
    }
    case "club": {
      glow = [180, 80, 110];
      for (let x = 10; x < CW; x += 22) { R(x, top + 14, 4, 100 - top + 40, "#10101a"); R(x + 1, top + 14, 1, 100 - top + 40, "#b4506e55"); }
      R(104, 100, 140, 76, "#080b10"); R(108, 104, 64, 72, "#1a0f1c"); R(176, 104, 64, 72, "#1a0f1c"); R(168, 134, 3, 8, "#c9ad6a"); R(177, 134, 3, 8, "#c9ad6a");
      R(100, 160, 148, 16, "#6b1f33"); R(96, 150, 5, 26, "#c9ad6a"); R(247, 150, 5, 26, "#c9ad6a"); R(100, 152, 148, 2, "#a8402f");
      for (const x of [24, 280]) { R(x - 2, 112, 48, 40, "#0a0d12"); R(x, 114, 44, 36, "#241a34"); R(x + 8, 118, 12, 24, cols6[ri(0, 5)]); R(x + 24, 118, 12, 24, cols6[ri(0, 5)]); }
      sign("ХРОМ", 100, 56, 148, 34, "#1a0a18", "#e0788a", 16, [190, 80, 110]);
      R(96, 52, 156, 1, "#c0466a"); R(96, 92, 156, 1, "#c0466a");
      poster(60, 74); break;
    }
    case "apt": {
      glow = [217, 164, 65];
      for (let y = top + 18; y < 108; y += 30) for (let x = 18; x < CW - 24; x += 38) { if (y > 76 && x > 120 && x < 220) continue; winAt(x, y, 18, 20); }
      door(146, 56, "#1d2a50");
      R(132, 100, 84, 8, "#6b1f33"); R(132, 108, 84, 2, "#0a0d12");
      R(214, 130, 6, 14, "#0a0d12"); R(215, 131, 4, 12, "#6fe0e6");
      const fx = ri(240, 262);
      for (let y = top + 34; y < 150; y += 30) { R(fx, y, 70, 3, "#1c2028"); R(fx, y - 12, 70, 1, "#1c2028"); for (let x = fx; x < fx + 70; x += 8) R(x, y - 12, 1, 12, "#1c2028"); }
      g.strokeStyle = "#1c2028"; g.lineWidth = 2; g.beginPath(); g.moveTo(fx + 4, top + 36); g.lineTo(fx + 24, top + 66); g.moveTo(fx + 28, top + 68); g.lineTo(fx + 48, top + 98); g.stroke();
      if (rng() < 0.6) warden(40, 124);
      poster(ri(10, 90), 130);
      for (let i = 0; i < 2; i++) { const pxx = ri(8, 100); R(pxx, 150 + ri(0, 10), 10, 14, cols6[ri(0, 5)]); R(pxx + 1, 152, 8, 2, "#d8d0bc"); }
      graffiti(ri(20, 80), 100);
      break;
    }
    default: { // lot — пустырь с корп-билбордом
      glow = [134, 150, 171];
      const cp = CORPS[ri(0, 5)]; billboard = cp.name;
      R(0, 150, CW, 26, "#2a3038"); for (let y = 150; y < 176; y += 5) R(0, y + 4, CW, 1, "#1c2028"); R(0, 150, CW, 3, "#4a525e");
      g.strokeStyle = "#7a8a9a55"; g.lineWidth = 1;
      for (let i = -50; i < CW + 50; i += 8) { g.beginPath(); g.moveTo(i, 96); g.lineTo(i + 54, 150); g.moveTo(i + 54, 96); g.lineTo(i, 150); g.stroke(); }
      for (let x = 0; x < CW; x += 86) { R(x, 88, 4, 64, "#4a525e"); R(x, 88, 1, 64, "#8a98a8"); } R(0, 92, CW, 3, "#7a8696");
      /* билборд */
      R(60, 6, 232, 90, "#080b10"); R(64, 10, 224, 82, "#1a1e26"); R(66, 12, 220, 78, cp.dark);
      for (let y = 12; y < 90; y += 3) R(66, y, 220, 1, "#00000040");
      R(66, 12, 220, 14, cp.col + "55"); T(cp.name, 176, 16, 8, cp.col, true);
      T(cp.slogan, 176, 42, 16, "#e8e4d4", true);
      R(80, 68, 192, 2, cp.col); R(80, 74, 120, 1, cp.col + "88");
      R(100, 94, 6, 58, "#2a2e36"); R(246, 94, 6, 58, "#2a2e36");
      signs.push({ x: 176, y: 50, col: rgb(cp.col), flick: false, ph: 1, w: 200 });
      /* ящики, бочки */
      for (let i = 0; i < 3; i++) { const bx = ri(10, 320); R(bx, 156, 14, 16, "#4a3a2a"); R(bx, 156, 14, 3, "#6a5a42"); R(bx + 5, 159, 4, 12, "#00000040"); if (rng() < 0.5) { R(bx + 18, 160, 12, 12, "#2f4a46"); R(bx + 18, 160, 12, 2, "#5a8a82"); R(bx + 18, 166, 12, 2, "#d9b44c"); } }
      graffiti(ri(20, 260), 120); break;
    }
  }
  /* нижняя грязь у фундамента */
  if (!lotLike) { R(0, GROUND_Y - 6, CW, 6, "#00000040"); R(0, GROUND_Y - 2, CW, 2, "#0a0d12"); }
  return { canvas: c, glow, signs, zone, billboard };
}
