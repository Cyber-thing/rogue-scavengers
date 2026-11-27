/* ======================================================================
   МИР: небо, 3-слойный параллакс-мегаполис, мостовая в перспективе,
   фасады улиц (чанки) в духе Streets of Rage / Huntdown, асфальт.
   ====================================================================== */
import { W, H, CHPX } from "../consts";
import { mkCanvas, mulberry32 } from "../util";

export const PF = '"Press Start 2P", monospace';
export const GROUND_Y = 176; // начало тротуара (px)

export interface SignGlow { x: number; y: number; col: number[]; flick: boolean; ph: number; w: number; h?: number }
export interface FanPos { x: number; y: number; r: number }
export interface Chunk {
  i: number; x: number; type: string; canvas: HTMLCanvasElement;
  glow: number[]; signs: SignGlow[]; fans: FanPos[]; zone: number[] | null; billboard?: string;
}

export const CORPS = [
  { name: "AGOGEE HEIGHTS", slogan: "ЖИВИ ВЫШЕ", col: "#5fa8a0", dark: "#10282a" },
  { name: "INTERCELL SYNTHETICS", slogan: "ТВОЙ СИНТЕЗ", col: "#7fb0e0", dark: "#101c2e" },
  { name: "SLAYER INC.", slogan: "ПОРЯДОК — ЭТО МЫ", col: "#c25a4a", dark: "#2a1210" },
  { name: "TAKAMURI GLOBAL", slogan: "ДОСТАВИМ ВСЁ", col: "#d9a23a", dark: "#2a2010" },
  { name: "GEXOGEN MEDICAL", slogan: "ЗДОРОВЬЕ ПО ПОДПИСКЕ", col: "#8fc08a", dark: "#122418" },
  { name: "FUSION CYBERNETICS", slogan: "ЭНЕРГИЯ БЕЗ ГРАНИЦ", col: "#e0884a", dark: "#2a160c" },
];

let skyCv: HTMLCanvasElement, farCv: HTMLCanvasElement, midCv: HTMLCanvasElement, nearBgCv: HTMLCanvasElement;
let tileCv: HTMLCanvasElement, asphCv: HTMLCanvasElement, vigCv: HTMLCanvasElement;
export const farBeacons: number[][] = [];
export const farLogos: number[][] = [];
export const art = {
  get sky() { return skyCv; },
  get far() { return farCv; },
  get mid() { return midCv; },
  get nearBg() { return nearBgCv; },
  get tile() { return tileCv; },
  get asph() { return asphCv; },
  get vig() { return vigCv; },
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
    for (let x = 0; x < w; x++) {
      const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const q = c.map((v) => { const s = v / 9; const f = s - Math.floor(s); return Math.round((Math.floor(s) + (f > th ? 1 : 0)) * 9); });
      g.fillStyle = `rgb(${q[0]},${q[1]},${q[2]})`;
      g.fillRect(x, y0 + y, 1, 1);
    }
  }
}

export function initArt() {
  /* ---------- небо (закатно-ночной киберпанк-градиент с Байер-дизерингом) ---------- */
  skyCv = mkCanvas(W, 192);
  let g = skyCv.getContext("2d")!;
  gradientDither(g, W, 192, [
    [0, "#050811"], [0.28, "#0d1628"], [0.54, "#24223c"], [0.76, "#5d3044"], [0.91, "#9a4a42"], [1, "#663438"],
  ]);
  const rg = mulberry32(5);
  g.fillStyle = "#d4e0e8";
  for (let i = 0; i < 48; i++) g.fillRect(Math.floor(rg() * W), Math.floor(rg() * 68), 1, 1);
  for (let i = 0; i < 16; i++) {
    const y = 38 + Math.floor(rg() * 136), w = 90 + Math.floor(rg() * 240), x = Math.floor(rg() * W);
    g.fillStyle = `rgba(170,120,130,${0.04 + rg() * 0.05})`;
    g.fillRect(x, y, w, 2 + Math.floor(rg() * 3));
  }
  for (let r = 42; r > 0; r -= 6) {
    g.fillStyle = `rgba(225,205,195,${0.018 + (42 - r) * 0.003})`;
    g.beginPath(); g.arc(510, 44, r, 0, 7); g.fill();
  }
  g.fillStyle = "rgba(235,222,208,.55)"; g.fillRect(506, 40, 8, 8);

  /* ---------- дальний слой: мегабашни + антенны + логотипы ---------- */
  farBeacons.length = 0; farLogos.length = 0;
  farCv = mkCanvas(LAYER_W, 192);
  g = farCv.getContext("2d")!;
  let rr = mulberry32(11), x = 0;
  while (x < LAYER_W) {
    let w = 28 + Math.floor(rr() * 48);
    if (LAYER_W - x - w < 30) w = LAYER_W - x;
    const h = 76 + Math.floor(rr() * 102), top = 192 - h;
    const col = rr() < 0.5 ? "#0d1622" : "#121a28";
    g.fillStyle = col; g.fillRect(x, top, w, h);
    g.fillStyle = "rgba(180,140,160,.08)"; g.fillRect(x, top, 2, h);
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x + w - 3, top, 3, h);
    // Диагональные фермы на высоких башнях
    if (h > 130) {
      g.fillStyle = "rgba(100,130,160,.08)";
      for (let y = top + 12; y < 180; y += 16) g.fillRect(x + 2, y, w - 5, 1);
    }
    if (rr() < 0.55) { g.fillStyle = col; g.fillRect(x + (w >> 1) - 1, top - 14, 2, 14); farBeacons.push([x + (w >> 1), top - 14]); }
    if (rr() < 0.35) g.fillRect(x + 4, top - 6, w - 8, 6);
    for (let wy = top + 6; wy < 178; wy += 5) for (let wx = x + 4; wx < x + w - 4; wx += 4) {
      const r = rr();
      if (r < 0.24) { g.fillStyle = r < 0.08 ? "#a87442" : r < 0.14 ? "#d4845a" : "#305466"; g.fillRect(wx, wy, 2, 3); }
    }
    if (w > 44 && h > 120 && rr() < 0.55) {
      farLogos.push([x + w / 2, top + 28]);
      g.strokeStyle = "#c87842"; g.lineWidth = 2; g.beginPath(); g.arc(x + w / 2, top + 28, 7, 0, 7); g.stroke();
      g.fillStyle = "#c87842"; g.fillRect(x + w / 2 - 1, top + 16, 2, 24);
    }
    x += w + Math.floor(rr() * 4);
  }
  const fg = g.createLinearGradient(0, 82, 0, 192);
  fg.addColorStop(0, "rgba(70,56,74,0)"); fg.addColorStop(1, "rgba(110,64,68,.55)");
  g.fillStyle = fg; g.fillRect(0, 82, LAYER_W, 110);

  /* ---------- средний слой: промышленные башни + эстакада ---------- */
  midCv = mkCanvas(LAYER_W, 192);
  g = midCv.getContext("2d")!;
  rr = mulberry32(23); x = 0;
  while (x < LAYER_W) {
    let w = 36 + Math.floor(rr() * 54);
    if (LAYER_W - x - w < 40) w = LAYER_W - x;
    const h = 64 + Math.floor(rr() * 68), top = 192 - h;
    g.fillStyle = "#141f2c"; g.fillRect(x, top, w, h);
    g.fillStyle = "#1f2e3e"; g.fillRect(x, top, w, 3);
    g.fillStyle = "rgba(160,170,195,.07)"; g.fillRect(x, top, 2, h);
    if (rr() < 0.45) { g.fillStyle = "#0d141e"; g.fillRect(x + 4, top - 10, 14, 10); g.fillRect(x + 8, top - 15, 5, 5); }
    if (rr() < 0.45) { g.fillStyle = "#0d141e"; g.fillRect(x + w - 10, top - 18, 2, 18); g.fillRect(x + w - 14, top - 13, 10, 1); }
    for (let wy = top + 8; wy < 174; wy += 8) for (let wx = x + 5; wx < x + w - 6; wx += 7) {
      const r = rr();
      if (r < 0.34) {
        g.fillStyle = r < 0.11 ? "#e0a646" : r < 0.21 ? "#b07436" : "#5ca8ad";
        g.fillRect(wx, wy, 4, 4);
        g.fillStyle = "rgba(255,220,160,.12)"; g.fillRect(wx - 1, wy - 1, 6, 6);
      }
    }
    if (rr() < 0.3) {
      const c = CORPS[Math.floor(rr() * CORPS.length)];
      g.fillStyle = c.col; g.fillRect(x + 6, top + 14, 3, 32);
      g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x + 6, top + 14, 1, 32);
    }
    x += w + Math.floor(rr() * 6);
  }
  // Эстакада монорельса на среднем слое
  g.fillStyle = "#0e151e"; g.fillRect(0, 126, LAYER_W, 8);
  g.fillStyle = "#223142"; g.fillRect(0, 126, LAYER_W, 2);
  g.fillStyle = "#6fe0e633"; g.fillRect(0, 132, LAYER_W, 1);
  for (let px = 20; px < LAYER_W; px += 96) {
    g.fillStyle = "#0d131c"; g.fillRect(px, 134, 8, 58);
    g.fillStyle = "#1c2836"; g.fillRect(px, 134, 2, 58);
  }
  const mg = g.createLinearGradient(0, 108, 0, 192);
  mg.addColorStop(0, "rgba(42,36,52,0)"); mg.addColorStop(1, "rgba(70,48,58,.52)");
  g.fillStyle = mg; g.fillRect(0, 108, LAYER_W, 84);

  /* ---------- ближний фоновый слой: провода, трубы, переходы ---------- */
  nearBgCv = mkCanvas(LAYER_W, 192);
  g = nearBgCv.getContext("2d")!;
  rr = mulberry32(41);
  g.strokeStyle = "#090d14"; g.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const ax = rr() * LAYER_W, ay = 18 + rr() * 48, dx = 90 + rr() * 140;
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + dx * 0.5, ay + 14 + rr() * 24, ax + dx, ay + rr() * 12 - 6); g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const bx = i * 160 + 24;
    g.fillStyle = "#0b1018"; g.fillRect(bx, 68, 8, 124);
    g.fillStyle = "#192330"; g.fillRect(bx, 68, 2, 124);
    g.fillStyle = "#0b1018"; g.fillRect(bx - 10, 82, 28, 3);
  }

  /* ---------- тротуарная плитка в диагональной перспективе (как в Streets of Rage) ---------- */
  tileCv = mkCanvas(128, 44);
  g = tileCv.getContext("2d")!;
  g.fillStyle = "#2b3842"; g.fillRect(0, 0, 128, 44);
  const rows = [0, 8, 17, 27, 38];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r], y1 = rows[r + 1], rh = y1 - y0;
    const step = 16 + r * 4;
    const off = (r & 1) * (step >> 1);
    for (let x0 = -step; x0 < 128 + step; x0 += step) {
      const px0 = x0 + off;
      const shade = ((x0 + r * 31) % 3 === 0) ? "#2f3e48" : ((x0 + r * 17) % 2 === 0) ? "#293640" : "#33434e";
      g.fillStyle = shade;
      g.fillRect(px0 + 1, y0 + 1, step - 2, rh - 2);
      g.fillStyle = "#485d6b"; // верхний-левый блик плитки
      g.fillRect(px0 + 1, y0 + 1, step - 3, 1);
      g.fillRect(px0 + 1, y0 + 1, 1, rh - 2);
      g.fillStyle = "#182128"; // тёмный шов
      g.fillRect(px0, y0, step, 1);
      g.fillRect(px0, y0, 1, rh);
    }
  }
  // Бордюр
  g.fillStyle = "#627380"; g.fillRect(0, 32, 128, 2);
  g.fillStyle = "#313c46"; g.fillRect(0, 34, 128, 6);
  g.fillStyle = "#12161d"; g.fillRect(0, 40, 128, 4);
  for (let x0 = 0; x0 < 128; x0 += 32) {
    g.fillStyle = "#1b222a"; g.fillRect(x0, 34, 2, 6);
    g.fillStyle = "#7a8d9c"; g.fillRect(x0 + 2, 32, 8, 1);
  }

  /* ---------- асфальт ---------- */
  asphCv = mkCanvas(128, 160);
  g = asphCv.getContext("2d")!;
  gradientDither(g, 128, 160, [[0, "#212832"], [1, "#10141b"]]);
  const ra = mulberry32(77);
  for (let i = 0; i < 640; i++) {
    g.fillStyle = ra() < 0.5 ? "#2b333e" : "#0b0e14";
    g.fillRect(Math.floor(ra() * 128), Math.floor(ra() * 160), 1 + (ra() < 0.22 ? 1 : 0), 1);
  }
  for (const p of [[10, 30, 44], [70, 80, 36], [30, 128, 32]]) {
    g.fillStyle = "#181d25"; g.fillRect(p[0], p[1], p[2], 8);
    g.fillStyle = "#2d3540"; g.fillRect(p[0] + 3, p[1], p[2] - 10, 1);
  }
  g.strokeStyle = "#090b10"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(8, 10); g.lineTo(30, 18); g.lineTo(42, 14); g.lineTo(60, 30);
  g.moveTo(90, 100); g.lineTo(104, 112); g.lineTo(118, 108); g.stroke();
  g.fillStyle = "#0c0e12"; g.fillRect(90, 40, 22, 4); g.fillRect(93, 44, 14, 2);

  /* ---------- виньетка ---------- */
  vigCv = mkCanvas(W, H);
  g = vigCv.getContext("2d")!;
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.68);
  gr.addColorStop(0, "rgba(4,6,12,0)"); gr.addColorStop(1, "rgba(4,6,12,.68)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

/* ---------------------- ФАСАДЫ (чанки) ---------------------- */
export function bakeChunk(type: string, rng: () => number): Omit<Chunk, "i" | "x" | "type"> {
  const CW = CHPX, CHH = GROUND_Y + 2;
  const c = mkCanvas(CW, CHH), g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const ri = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const T = (t: string, x: number, y: number, size: number, col: string, center = false) => {
    g.font = `${size}px ${PF}`; g.textBaseline = "top"; g.textAlign = center ? "center" : "left"; g.fillStyle = col; g.fillText(t, Math.round(x), Math.round(y));
  };
  const signs: SignGlow[] = [];
  const fans: FanPos[] = [];
  let glow = [217, 164, 65];
  let zone: number[] | null = null;
  let billboard: string | undefined;

  const sign = (txt: string, x: number, y: number, w: number, h: number, bg: string, fg: string, size: number, gl: number[]) => {
    R(x - 3, y - 3, w + 6, h + 6, "#080b10"); R(x - 2, y - 2, w + 4, h + 4, "#2a3038");
    R(x, y, w, h, bg); R(x, y, w, 1, "#ffffff2a");
    T(txt, x + w / 2 + 1, y + (h - size) / 2 + 2, size, "#00000099", true);
    T(txt, x + w / 2, y + (h - size) / 2 + 1, size, fg, true);
    signs.push({ x: x + w / 2, y: y + h / 2, col: gl, flick: rng() < 0.35, ph: rng() * 6, w, h });
  };

  const PAL = [
    { b: "#303e4b", d: "#222d37", l: "#445769" },
    { b: "#4c3834", d: "#362624", l: "#624a44" },
    { b: "#36394c", d: "#262838", l: "#4b5068" },
    { b: "#46443b", d: "#323026", l: "#5b584c" },
  ];
  const lotLike = type === "lot" || type === "charge";
  const P = type === "club" ? { b: "#1e1a2c", d: "#13101e", l: "#302b44" }
    : type === "bar" ? { b: "#5c3b34", d: "#3f2622", l: "#744c42" }
    : PAL[ri(0, 3)];
  const top = lotLike ? 118 : ri(30, 56);
  const lit = ["#e0a642", "#ecc474", "#68b8b8", "#de8a48"];

  /* Классическая кирпичная/блочная кладка + трубы + вентиляторы */
  const brickTexture = (y0: number, y1: number) => {
    for (let y = y0; y < y1; y += 6) {
      R(0, y, CW, 1, P.d);
      const off = ((y / 6) | 0) & 1 ? 8 : 0;
      for (let x = off; x < CW; x += 16) {
        R(x, y, 1, 6, P.d);
        if (rng() < 0.14) R(x + 2, y + 1, 12, 4, rng() < 0.5 ? P.l + "38" : P.d + "88");
      }
    }
  };

  const winAt = (x: number, y: number, w: number, h: number) => {
    const on = rng() < 0.54, col = lit[ri(0, 3)];
    R(x - 1, y - 1, w + 2, h + 2, "#090c12");
    R(x, y, w, h, on ? col : "#131b26");
    if (on) {
      R(x, y, w, 2, "#ffffff48"); R(x + (w >> 1), y, 1, h, "#00000044"); R(x, y + (h >> 1), w, 1, "#00000044");
      if (rng() < 0.45) { for (let k = 0; k < h; k += 3) R(x, y + k, w, 1, "#00000033"); }
      if (rng() < 0.35) R(x + 3, y + h - 8, 5, 8, "#00000099");
    } else {
      // Решётка на окнах как в Streets of Rage (image_2c22f205)
      for (let bx = x + 4; bx < x + w - 2; bx += 4) R(bx, y, 1, h, "#222c38");
      R(x, y + 4, w, 1, "#222c38");
    }
    R(x - 2, y + h + 1, w + 4, 2, P.l); R(x - 2, y + h + 3, w + 4, 1, "#090c12");
    if (rng() < 0.22) {
      R(x + 2, y + h + 4, w - 4, 7, "#2a3038");
      R(x + 4, y + h + 5, w - 8, 1, "#4a525e");
      fans.push({ x: x + w - 6, y: y + h + 7, r: 2 });
    }
  };

  const facade = () => {
    R(0, top, CW, GROUND_Y - top, P.b);
    brickTexture(top + 8, GROUND_Y);
    for (let x = 0; x < CW; x += 58) { R(x, top, 2, GROUND_Y - top, P.d); R(x + 2, top, 1, GROUND_Y - top, "#ffffff0c"); }
    for (let i = 0; i < 10; i++) { const sx = ri(0, CW), sh = ri(30, 115); R(sx, top + 4, ri(2, 5), sh, "#00000033"); }
    R(0, top, CW, 6, P.l); R(0, top + 6, CW, 2, "#0a0d12"); R(0, top, CW, 1, "#ffffff33");
    for (let x = 4; x < CW; x += 16) R(x, top + 2, 10, 3, P.d);
    // Трубы и провода
    for (let k = 0; k < 2; k++) {
      const px = ri(6, CW - 14);
      R(px, top + 8, 5, GROUND_Y - top - 8, "#262c34");
      R(px, top + 8, 1, GROUND_Y - top - 8, "#5c6672");
      for (let y = top + 18; y < GROUND_Y; y += 32) R(px - 1, y, 7, 2, "#12161c");
    }
    g.strokeStyle = "#0a0d12"; g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const ax = ri(0, CW), ay = top + ri(8, 44);
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + 60, ay + ri(14, 34), ax + ri(90, 170), ay + ri(-4, 10)); g.stroke();
    }
    // Вентилятор на стене
    if (rng() < 0.7) {
      const fx = ri(20, CW - 30), fy = top + ri(14, 34);
      R(fx - 8, fy - 8, 16, 16, "#14181e"); R(fx - 7, fy - 7, 14, 14, "#242a32");
      fans.push({ x: fx, y: fy, r: 5 });
    }
    // Крыша
    if (rng() < 0.6) {
      const ax = ri(10, 200);
      R(ax, top - 12, 32, 12, "#2a3038"); R(ax + 2, top - 10, 28, 2, "#46505e"); R(ax + 24, top - 18, 2, 6, "#2a3038");
    }
    if (rng() < 0.55) {
      const ax = ri(180, 320);
      R(ax, top - 28, 2, 28, "#2a3038"); R(ax - 6, top - 22, 14, 1, "#2a3038");
      R(ax, top - 29, 2, 2, "#c0463a");
      signs.push({ x: ax + 1, y: top - 28, col: [210, 72, 60], flick: true, ph: rng() * 6, w: 6 });
    }
    if (rng() < 0.4) {
      const wx = ri(150, 280);
      R(wx, top - 22, 22, 22, "#3a3028"); R(wx - 1, top - 25, 24, 4, "#26201a");
    }
  };

  const upperWindows = (y0: number, y1: number) => {
    for (let y = y0; y < y1; y += 28) for (let x = 18; x < CW - 24; x += 38) winAt(x, y, 18, 18);
  };

  const door = (x: number, w: number, col: string) => {
    R(x - 2, 112, w + 4, 64, "#0a0d12"); R(x, 114, w, 62, "#2a2c34"); R(x + 3, 118, w - 6, 40, col); R(x + 3, 118, w - 6, 3, "#ffffff40");
    R(x + w / 2 - 1, 118, 2, 40, "#0a0d1288"); R(x + w - 9, 140, 2, 8, "#c0c8d0"); R(x + 3, 158, w - 6, 18, "#1a1c22");
  };

  /* Витрины в стиле PinE POT (image_d8d831c5): тёплое янтарное свечение + гирлянда огней + силуэты аркадных/кибер-машин внутри */
  const warmStorefront = (x: number, w: number, bg: string, glowCol: string, shelf: (x: number, y: number, w: number, h: number) => void) => {
    R(x - 3, 114, w + 6, 62, "#070a0f");
    R(x, 117, w, 59, bg);
    // Глубина интерьера — верхняя оранжевая подсветка и потолочные лампочки
    R(x, 117, w, 12, glowCol + "44");
    for (let lx = x + 6; lx < x + w - 4; lx += 10) {
      R(lx, 121, 2, 2, glowCol);
      R(lx - 1, 122, 4, 1, glowCol + "55");
    }
    shelf(x, 117, w, 59);
    // Стеклянные диагональные блики
    R(x + 10, 117, 6, 59, "#ffffff14");
    R(x + 18, 117, 2, 59, "#ffffff0c");
    R(x + w / 2, 117, 4, 59, "#ffffff0e");
    R(x - 3, 174, w + 6, 4, "#2a3038");
  };

  const poster = (x: number, y: number) => {
    const c = CORPS[ri(0, 5)];
    R(x, y, 22, 30, "#0a0d12"); R(x + 1, y + 1, 20, 28, c.dark); R(x + 1, y + 1, 20, 6, c.col + "cc");
    R(x + 4, y + 11, 14, 8, c.col + "55"); R(x + 4, y + 22, 10, 1, c.col); R(x + 4, y + 25, 14, 1, c.col + "88");
  };

  const graffiti = (x: number, y: number) => {
    T("SK", x, y, 16, "#b8553acc");
    g.strokeStyle = "#b8553acc"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y + 20); g.lineTo(x + 36, y - 4); g.stroke();
  };

  const cols6 = ["#a8553a", "#d9a23a", "#6fb0b0", "#b4506e", "#d8d0bc", "#4a7a9a"];

  if (!lotLike) facade();
  switch (type) {
    case "mart": {
      glow = [255, 168, 58];
      upperWindows(top + 20, 96);
      for (let x = 20; x < 330; x += 16) R(x, 98, 16, 12, (((x - 20) / 16) | 0) % 2 ? "#cfd6cc" : "#2f6a66");
      R(20, 110, 310, 2, "#00000070");
      for (let x = 20; x < 330; x += 16) R(x + 2, 110, 12, 3, (((x - 20) / 16) | 0) % 2 ? "#cfd6cc" : "#2f6a66");
      const shelf = (x: number, y: number, w: number, _h: number) => {
        for (const sy of [y + 26, y + 44]) {
          R(x + 4, sy, w - 8, 2, "#5a422c");
          for (let i = 0; i < (w - 12) / 8; i++) {
            const hh = ri(8, 15);
            R(x + 6 + i * 8, sy - hh, 6, hh, cols6[ri(0, 5)]);
          }
        }
        void _h;
      };
      warmStorefront(24, 120, "#3a1e0e", "#ffaa44", shelf);
      warmStorefront(204, 120, "#3a1e0e", "#ffaa44", shelf);
      door(150, 48, "#254a48");
      R(158, 130, 32, 8, "#0a0d12"); T("ОТКРЫТО", 174, 131, 8, "#e0a43a", true);
      sign("MART 24", 90, 68, 168, 24, "#0e1c24", "#ffb23a", 16, [255, 178, 58]);
      R(86, 64, 176, 1, "#ffb23a"); R(86, 96, 176, 1, "#ffb23a");
      zone = [24, 98, 302, 78];
      break;
    }
    case "netcafe": {
      glow = [90, 224, 236];
      upperWindows(top + 20, 96);
      for (let x = 20; x < 330; x += 20) R(x, 100, 20, 10, (((x - 20) / 20) | 0) % 2 ? "#183848" : "#265a6a");
      const shelf = (x: number, y: number, w: number, h: number) => {
        for (let k = 0; k < 2; k++) for (let i = 0; i < (w - 12) / 26; i++) {
          const mx = x + 6 + i * 26, my = y + 18 + k * 18;
          R(mx, my, 20, 14, "#080c12"); R(mx + 1, my + 1, 18, 12, "#0d2e28");
          for (let l = 0; l < 3; l++) R(mx + 3, my + 3 + l * 3, 5 + ri(0, 8), 1, "#6fe0e6");
          R(mx + 7, my + 14, 6, 2, "#2a3038");
        }
        void h;
      };
      warmStorefront(24, 120, "#0b2228", "#6fe0e6", shelf);
      warmStorefront(204, 120, "#0b2228", "#6fe0e6", shelf);
      door(150, 48, "#14383a");
      sign("NETLINE", 96, 66, 156, 24, "#081820", "#6fe0e6", 16, [111, 224, 230]);
      T("ONLINE 24H · DIAL-IN", 174, 93, 8, "#6fe08a", true);
      zone = [24, 98, 302, 78];
      break;
    }
    case "charge": {
      glow = [255, 140, 70];
      // Киоск + сетка рабица за ним
      g.strokeStyle = "#48586866"; g.lineWidth = 1;
      for (let i = -30; i < CW + 30; i += 8) {
        g.beginPath(); g.moveTo(i, 112); g.lineTo(i + 48, 174); g.moveTo(i + 48, 112); g.lineTo(i, 174); g.stroke();
      }
      R(120, 96, 108, 80, "#2c3440"); R(120, 96, 108, 4, "#46505e");
      R(124, 118, 100, 40, "#0a0d12"); R(126, 120, 96, 36, "#1a3a44"); R(126, 120, 96, 3, "#6fe0e6aa");
      door(158, 32, "#1a3a44");
      R(6, 62, 336, 18, "#1c222a"); R(6, 62, 336, 3, "#46505e"); R(6, 78, 336, 3, "#0a0d12");
      R(8, 80, 332, 2, "#ff8c46"); R(8, 82, 332, 3, "#ff8c4655");
      R(36, 80, 8, 96, "#3a424e"); R(36, 80, 3, 96, "#6a7480");
      R(304, 80, 8, 96, "#3a424e"); R(304, 80, 3, 96, "#6a7480");
      sign("FUSION CELL", 100, 66, 150, 12, "#14181e", "#ffa04a", 8, [255, 140, 70]);
      for (const px of [76, 262]) {
        R(px, 112, 22, 64, "#0a0d12"); R(px + 2, 114, 18, 60, "#46505e"); R(px + 2, 114, 18, 3, "#7a8490");
        R(px + 4, 120, 14, 14, "#0a0d12"); R(px + 5, 121, 12, 12, "#2aa0b0");
        R(px + 6, 123, 8, 1, "#c8fcff"); R(px + 6, 126, 5, 1, "#c8fcff");
        R(px + 5, 140, 12, 2, "#e0a43a");
      }
      R(310, 30, 4, 146, "#3a424e"); R(292, 40, 44, 24, "#0a0d12"); R(294, 42, 40, 20, "#14181e");
      T("0.19", 314, 45, 8, "#6fe0e6", true); T("0.24", 314, 54, 8, "#6fe0e6", true);
      R(0, 168, CW, 8, "#2a3038");
      zone = [158, 112, 32, 64];
      break;
    }
    case "bar": {
      glow = [232, 136, 54];
      upperWindows(top + 20, 96);
      const barShelf = (x: number, y: number, w: number, _h: number) => {
        for (let yy = y + 18; yy < y + 54; yy += 4) R(x, yy, w, 1, "#b47c2e88");
        R(x + 28, y + 18, 50, 22, "#0a0d12");
        for (let i = 0; i < 8; i++) R(x + 31 + i * 6, y + 20 + (i & 1) * 2, 3, 14, cols6[ri(0, 5)]);
        void _h;
      };
      warmStorefront(24, 112, "#462818", "#ff9a3a", barShelf);
      warmStorefront(212, 112, "#462818", "#ff9a3a", barShelf);
      door(150, 48, "#4a2a1c");
      sign("РЖАВЫЙ КОНТАКТ", 80, 70, 188, 22, "#140e10", "#e8a040", 8, [224, 140, 58]);
      R(76, 66, 196, 1, "#e0a43a"); R(76, 94, 196, 1, "#e0a43a");
      graffiti(10, 128);
      break;
    }
    case "club": {
      glow = [190, 82, 120];
      for (let x = 10; x < CW; x += 22) { R(x, top + 14, 4, 100 - top + 40, "#10101a"); R(x + 1, top + 14, 1, 100 - top + 40, "#b4506e66"); }
      R(104, 100, 140, 76, "#080b10"); R(108, 104, 64, 72, "#1a0f1c"); R(176, 104, 64, 72, "#1a0f1c");
      R(168, 134, 3, 8, "#c9ad6a"); R(177, 134, 3, 8, "#c9ad6a");
      R(100, 160, 148, 16, "#6b1f33"); R(96, 150, 5, 26, "#c9ad6a"); R(247, 150, 5, 26, "#c9ad6a"); R(100, 152, 148, 2, "#a8402f");
      for (const x of [24, 280]) {
        R(x - 2, 112, 48, 40, "#0a0d12"); R(x, 114, 44, 36, "#241a34");
        R(x + 8, 118, 12, 24, cols6[ri(0, 5)]); R(x + 24, 118, 12, 24, cols6[ri(0, 5)]);
      }
      sign("ХРОМ", 100, 54, 148, 34, "#1a0a18", "#e0788a", 16, [190, 80, 110]);
      R(96, 50, 156, 1, "#c0466a"); R(96, 90, 156, 1, "#c0466a");
      poster(60, 74);
      break;
    }
    case "apt": {
      glow = [217, 164, 65];
      for (let y = top + 18; y < 108; y += 28) for (let x = 18; x < CW - 24; x += 38) {
        if (y > 76 && x > 120 && x < 220) continue;
        winAt(x, y, 18, 20);
      }
      // Синяя гофрированная рольставня гаража (как на референсе image_2c22f205)
      if (rng() < 0.65) {
        const sx = 24;
        R(sx - 2, 114, 78, 62, "#0a0d12");
        R(sx, 116, 74, 60, "#244268");
        for (let y = 118; y < 174; y += 4) { R(sx, y, 74, 1, "#3a6494"); R(sx, y + 2, 74, 1, "#162a44"); }
        R(sx + 28, 166, 18, 4, "#8a98a8");
      }
      door(146, 56, "#1d2a50");
      R(132, 100, 84, 8, "#6b1f33"); R(132, 108, 84, 2, "#0a0d12");
      R(214, 130, 6, 14, "#0a0d12"); R(215, 131, 4, 12, "#6fe0e6");
      const fx = ri(240, 262);
      for (let y = top + 34; y < 150; y += 30) {
        R(fx, y, 70, 3, "#1c2028"); R(fx, y - 12, 70, 1, "#1c2028");
        for (let x = fx; x < fx + 70; x += 8) R(x, y - 12, 1, 12, "#1c2028");
      }
      g.strokeStyle = "#1c2028"; g.lineWidth = 2; g.beginPath();
      g.moveTo(fx + 4, top + 36); g.lineTo(fx + 24, top + 66);
      g.moveTo(fx + 28, top + 68); g.lineTo(fx + 48, top + 98); g.stroke();
      poster(ri(104, 122), 128);
      graffiti(ri(20, 80), 96);
      break;
    }
    default: { // lot — сетка рабица + голо-билборд в стиле image_1a735488 / image_36145ee6
      glow = [110, 200, 220];
      const cp = CORPS[ri(0, 5)]; billboard = cp.name;
      R(0, 150, CW, 26, "#282e36");
      for (let y = 150; y < 176; y += 5) R(0, y + 4, CW, 1, "#1a1f26");
      R(0, 150, CW, 3, "#4a525e");
      // Сетка рабица (image_36145ee6)
      g.strokeStyle = "#8a9aa866"; g.lineWidth = 1;
      for (let i = -50; i < CW + 50; i += 7) {
        g.beginPath(); g.moveTo(i, 96); g.lineTo(i + 54, 150); g.moveTo(i + 54, 96); g.lineTo(i, 150); g.stroke();
      }
      for (let x = 0; x < CW; x += 86) { R(x, 88, 4, 64, "#4a525e"); R(x, 88, 1, 64, "#8a98a8"); }
      R(0, 92, CW, 3, "#7a8696");
      // Голографический билборд
      R(58, 6, 236, 90, "#080b10"); R(62, 10, 228, 82, "#16202a"); R(64, 12, 224, 78, cp.dark);
      for (let y = 12; y < 90; y += 2) R(64, y, 224, 1, "#00000038");
      R(64, 12, 224, 14, cp.col + "66"); T(cp.name, 176, 16, 8, cp.col, true);
      T(cp.slogan, 176, 42, 16, "#e8f4f8", true);
      R(80, 68, 192, 2, cp.col); R(80, 74, 120, 1, cp.col + "88");
      R(100, 94, 6, 58, "#2a2e36"); R(246, 94, 6, 58, "#2a2e36");
      signs.push({ x: 176, y: 50, col: rgb(cp.col), flick: false, ph: 1, w: 224, h: 78 });
      for (let i = 0; i < 3; i++) {
        const bx = ri(10, 320);
        R(bx, 156, 14, 16, "#4a3a2a"); R(bx, 156, 14, 3, "#6a5a42"); R(bx + 5, 159, 4, 12, "#00000040");
        if (rng() < 0.5) { R(bx + 18, 160, 12, 12, "#2f4a46"); R(bx + 18, 160, 12, 2, "#5a8a82"); R(bx + 18, 166, 12, 2, "#d9b44c"); }
      }
      graffiti(ri(20, 260), 120);
      break;
    }
  }
  if (!lotLike) { R(0, GROUND_Y - 6, CW, 6, "#00000048"); R(0, GROUND_Y - 2, CW, 2, "#0a0d12"); }
  return { canvas: c, glow, signs, fans, zone, billboard };
}
