/* ======================================================================
   PX — пиксельный растеризатор без сглаживания (16-битная ретро-графика).
   Маски (Mask) задают форму детали; Px.paint() красит её 4-тоновой
   рампой с диагональным форм-шейдингом, дизерингом Байера, бевелом
   и тёмным швом поверх соседних деталей.
   ====================================================================== */

export type Ramp = [string, string, string, string]; // hi, mid, lo, deep
export type C4 = [number, number, number, number];

const cache = new Map<string, C4>();
export function rgba(h: string): C4 {
  let c = cache.get(h);
  if (c) return c;
  let s = h.slice(1);
  if (s.length === 3) s = s.split("").map((x) => x + x).join("");
  const n = parseInt(s.slice(0, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6), 16) : 255;
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  cache.set(h, c);
  return c;
}
const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
export const toHex = (c: number[]) => "#" + hex2(c[0]) + hex2(c[1]) + hex2(c[2]);
export function mix(a: string, b: string, t: number): string {
  const A = rgba(a), B = rgba(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
/* Тени уходят в глубокий индиго, света — в тёплый янтарно-кремовый тон */
export const darken = (c: string, t: number) => mix(c, "#100c22", t);
export const lighten = (c: string, t: number) => mix(c, "#fff1d6", t);

const rampCache = new Map<string, Ramp>();
export function ramp(mid: string): Ramp {
  let r = rampCache.get(mid);
  if (!r) {
    r = [lighten(mid, 0.34), mid, darken(mid, 0.35), darken(mid, 0.65)];
    rampCache.set(mid, r);
  }
  return r;
}
export const dimRamp = (r: Ramp, t = 0.24): Ramp => [darken(r[0], t), darken(r[1], t), darken(r[2], t), darken(r[3], t)];

const BAYER2 = [0, 2, 3, 1];

/* ------------------------------ маски ------------------------------ */
export class Mask {
  d: Uint8Array;
  constructor(public x0: number, public y0: number, public w: number, public h: number) {
    this.d = new Uint8Array(Math.max(0, w * h));
  }
  get(x: number, y: number) {
    const i = x - this.x0, j = y - this.y0;
    return i >= 0 && j >= 0 && i < this.w && j < this.h && this.d[j * this.w + i] === 1;
  }
  set(x: number, y: number) {
    const i = x - this.x0, j = y - this.y0;
    if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.d[j * this.w + i] = 1;
  }
}
export function rectM(x: number, y: number, w: number, h: number) {
  const m = new Mask(Math.round(x), Math.round(y), Math.max(0, Math.round(w)), Math.max(0, Math.round(h)));
  m.d.fill(1);
  return m;
}
export function ellM(cx: number, cy: number, rx: number, ry: number) {
  const x0 = Math.floor(cx - rx), y0 = Math.floor(cy - ry);
  const m = new Mask(x0, y0, Math.ceil(rx * 2) + 2, Math.ceil(ry * 2) + 2);
  for (let y = y0; y < y0 + m.h; y++)
    for (let x = x0; x < x0 + m.w; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m.set(x, y);
    }
  return m;
}
export function capM(x0: number, y0: number, x1: number, y1: number, r0: number, r1 = r0) {
  const R = Math.max(r0, r1) + 1;
  const bx = Math.floor(Math.min(x0, x1) - R), by = Math.floor(Math.min(y0, y1) - R);
  const m = new Mask(bx, by, Math.ceil(Math.abs(x1 - x0) + R * 2) + 1, Math.ceil(Math.abs(y1 - y0) + R * 2) + 1);
  const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1;
  for (let y = by; y < by + m.h; y++)
    for (let x = bx; x < bx + m.w; x++) {
      const px = x + 0.5, py = y + 0.5;
      let t = ((px - x0) * vx + (py - y0) * vy) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const r = r0 + (r1 - r0) * t;
      if (Math.hypot(px - (x0 + vx * t), py - (y0 + vy * t)) <= r) m.set(x, y);
    }
  return m;
}
export function polyM(pts: number[][]) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const p of pts) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  const x0 = Math.floor(minX), y0 = Math.floor(minY);
  const m = new Mask(x0, y0, Math.ceil(maxX) - x0 + 1, Math.ceil(maxY) - y0 + 1);
  const n = pts.length;
  for (let y = y0; y < y0 + m.h; y++) {
    const cy = y + 0.5, xs: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy)) xs.push(a[0] + ((cy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) m.set(x, y);
  }
  return m;
}
export function unionM(...ms: Mask[]) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const m of ms) { x0 = Math.min(x0, m.x0); y0 = Math.min(y0, m.y0); x1 = Math.max(x1, m.x0 + m.w); y1 = Math.max(y1, m.y0 + m.h); }
  const r = new Mask(x0, y0, x1 - x0, y1 - y0);
  for (const m of ms)
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.d[y * m.w + x]) r.set(m.x0 + x, m.y0 + y);
  return r;
}
export function subM(a: Mask, b: Mask) {
  const r = new Mask(a.x0, a.y0, a.w, a.h);
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.d[y * a.w + x] && !b.get(a.x0 + x, a.y0 + y)) r.d[y * a.w + x] = 1;
  return r;
}
export function interM(a: Mask, b: Mask) {
  const r = new Mask(a.x0, a.y0, a.w, a.h);
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.d[y * a.w + x] && b.get(a.x0 + x, a.y0 + y)) r.d[y * a.w + x] = 1;
  return r;
}

/* --------------------------- холст-буфер --------------------------- */
export class Px {
  d: Uint8ClampedArray;
  constructor(public w: number, public h: number) {
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  alpha(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3];
  }
  put(x: number, y: number, c: C4) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (c[3] === 255) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255; return; }
    const a = c[3] / 255, ba = this.d[i + 3] / 255, oa = a + ba * (1 - a);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) this.d[i + k] = (c[k] * a + this.d[i + k] * ba * (1 - a)) / oa;
    this.d[i + 3] = oa * 255;
  }
  dot(x: number, y: number, col: string) { this.put(Math.round(x), Math.round(y), rgba(col)); }
  rect(x: number, y: number, w: number, h: number, col: string) {
    const c = rgba(col);
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, col: string, t = 1) {
    const c = rgba(col);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    const o = Math.floor(t / 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n) - o, y = Math.round(y0 + ((y1 - y0) * i) / n) - o;
      for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) this.put(x + a, y + b, c);
    }
  }
  fill(m: Mask, col: string) {
    const c = rgba(col);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.d[y * m.w + x]) this.put(m.x0 + x, m.y0 + y, c);
  }
  ditherFill(m: Mask, colA: string, colB: string) {
    const cA = rgba(colA), cB = rgba(colB);
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        if (!m.d[y * m.w + x]) continue;
        const gx = m.x0 + x, gy = m.y0 + y;
        this.put(gx, gy, ((gx + gy) & 1) === 0 ? cA : cB);
      }
  }
  /* основной «художник»: 4-тоновое форм-затенение с Байер-дизерингом + бевел + шов */
  paint(m: Mask, r: Ramp, o: { shade?: boolean; rim?: boolean; flat?: boolean; spec?: boolean } = {}) {
    const cols = r.map(rgba);
    const shade = o.shade !== false, rim = o.rim !== false;
    if (rim) {
      const seen = new Set<number>();
      for (let y = 0; y < m.h; y++)
        for (let x = 0; x < m.w; x++) {
          if (!m.d[y * m.w + x]) continue;
          const gx = m.x0 + x, gy = m.y0 + y;
          for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = gx + ox, ny = gy + oy;
            if (!m.get(nx, ny) && this.alpha(nx, ny) > 0) seen.add(ny * this.w + nx);
          }
        }
      seen.forEach((k) => {
        const i = k * 4;
        this.d[i] *= 0.46; this.d[i + 1] *= 0.44; this.d[i + 2] *= 0.56;
      });
    }
    const cx = m.x0 + m.w / 2, cy = m.y0 + m.h / 2, rad = Math.max(m.w, m.h) / 2;
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        if (!m.d[y * m.w + x]) continue;
        const gx = m.x0 + x, gy = m.y0 + y;
        let c = 1;
        if (o.flat) { this.put(gx, gy, cols[1]); continue; }
        if (shade && rad >= 2.2) {
          const t = ((gx - cx) * 0.52 + (gy - cy) * 0.85) / rad;
          const b = BAYER2[(gy & 1) * 2 + (gx & 1)] / 4;
          if (t > 0.55) c = 3;
          else if (t > 0.34) c = t > 0.44 + b * 0.14 ? 3 : 2;
          else if (t > 0.12) c = t > 0.22 + b * 0.16 ? 2 : 1;
          else if (t < -0.35) c = t < -0.52 + b * 0.14 ? 0 : 1;
        }
        const tl = !m.get(gx, gy - 1) || !m.get(gx - 1, gy);
        const br = !m.get(gx, gy + 1) || !m.get(gx + 1, gy);
        if (tl && !br) c = 0;
        else if (br && !tl) c = c >= 2 ? 3 : 2;
        if (o.spec && c === 0 && !m.get(gx - 1, gy - 1) && (gx + gy) % 3 === 0) {
          const sp = cols[0];
          this.put(gx, gy, [Math.min(255, sp[0] + 28), Math.min(255, sp[1] + 28), Math.min(255, sp[2] + 24), 255]);
          continue;
        }
        this.put(gx, gy, cols[c]);
      }
  }
  outline(col: string) {
    const c = rgba(col), w = this.w, h = this.h, o = new Uint8ClampedArray(this.d);
    const A = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : o[(y * w + x) * 4 + 3]);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (o[i + 3] < 128 && (A(x - 1, y) > 127 || A(x + 1, y) > 127 || A(x, y - 1) > 127 || A(x, y + 1) > 127)) {
          this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255;
        }
      }
  }
  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement("canvas");
    cv.width = this.w; cv.height = this.h;
    const g = cv.getContext("2d")!;
    const id = g.createImageData(this.w, this.h);
    id.data.set(this.d);
    g.putImageData(id, 0, 0);
    return cv;
  }
}
