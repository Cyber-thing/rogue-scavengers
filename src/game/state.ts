/* Общее состояние игры + эффекты. React подписывается через subscribe(). */
import { BAL } from "./consts";
import { clamp, pick, rnd } from "./util";

export const G: any = {
  mode: "menu", run: null, speed: 1, paused: false, modal: null as null | { type: string; data?: any },
  hitStop: 0, shake: 0, t: 0, selItem: -1, escArm: 0, flash: 0, flashCol: "#fff0d0",
  toastMsg: "", toastKey: 0, ver: 0, ready: false,
};
export const SAVEKEY = "rogue_scavengers_save_v1";
export const defaultMeta = () => ({ laundered: 0, biz: { laundry: 0, clinic: 0, pawn: 0, noodle: 0 }, bestDist: 0, runs: 0, sound: true, total: 0 });
export let meta: any = defaultMeta();
export function setMeta(m: any) { meta = m; }
export function loadMeta() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVEKEY) || "null");
    if (s && typeof s === "object") {
      meta = Object.assign(defaultMeta(), s);
      meta.biz = Object.assign(defaultMeta().biz, s.biz || {});
      for (const k in meta.biz) meta.biz[k] = clamp(meta.biz[k] | 0, 0, 3);
      meta.laundered = Math.max(0, meta.laundered | 0);
    }
  } catch { /* ignore */ }
}
export function saveMeta() { try { localStorage.setItem(SAVEKEY, JSON.stringify(meta)); } catch { /* ignore */ } }

/* ---------- подписка для React ---------- */
const subs = new Set<() => void>();
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getVer = () => G.ver;
export function notify() { G.ver++; subs.forEach((f) => f()); }

export function toast(m: string) { G.toastMsg = m; G.toastKey++; notify(); }

/* ---------- эффекты ---------- */
export function addText(x: number, y: number, s: string, col?: string, sc?: number) {
  const r = G.run; if (!r) return;
  if (r.texts.length > 40) r.texts.shift();
  r.texts.push({ x, y, s: String(s), col: col || "#fff", sc: sc || 1, t: 0, life: (sc || 1) > 1 ? 1.1 : 0.95 });
}
export function part(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, col: string, size: number, grav: number, kind?: string) {
  const r = G.run; if (!r) return;
  if (r.parts.length > 500) r.parts.shift();
  r.parts.push({ x, y, z, vx, vy, vz, life, t: 0, col, size, grav, kind });
}
export function burst(x: number, y: number, z: number, n: number, col: string | string[], sp: number, size?: number, grav?: number, life?: number) {
  for (let i = 0; i < n; i++)
    part(x, y, z, rnd(-sp, sp), rnd(-sp * 0.3, sp * 0.3), rnd(sp * 0.2, sp), life || rnd(0.3, 0.6), Array.isArray(col) ? pick(col) : col, size || 1, grav === undefined ? 260 : grav);
}
export function ring(x: number, y: number, z: number, col: string, maxR = 22, life = 0.3) {
  const r = G.run; if (!r) return;
  if (r.rings.length > 20) r.rings.shift();
  r.rings.push({ x, y, z, col, maxR, t: 0, life });
}
export function slash(x: number, y: number, face: number, col = "#dff6ff", big = false) {
  const r = G.run; if (!r) return;
  r.slashes.push({ x, y, face, t: 0, life: 0.2, col, big });
}
/* сигнал тревоги: заставляет гражданских разбегаться */
export function alarm(x: number, y: number, rad: number, t: number) {
  const r = G.run; if (!r) return;
  r.alarms.push({ x, y, rad, t });
}
export function updateFx(dt: number) {
  const r = G.run;
  for (const p of r.parts) {
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.grav * dt;
    if (p.grav && p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.7; p.vy *= 0.7; }
  }
  r.parts = r.parts.filter((p: any) => p.t < p.life);
  for (const t of r.texts) { t.t += dt; t.y -= 16 * dt; }
  r.texts = r.texts.filter((t: any) => t.t < t.life);
  for (const q of r.rings) q.t += dt;
  r.rings = r.rings.filter((q: any) => q.t < q.life);
  for (const q of r.slashes) q.t += dt;
  r.slashes = r.slashes.filter((q: any) => q.t < q.life);
  for (const a of r.alarms) a.t -= dt;
  r.alarms = r.alarms.filter((a: any) => a.t > 0);
  G.flash = Math.max(0, G.flash - dt * 2.4);
}
export const starsNow = () => Math.min(5, 1 + Math.floor(G.run.heat));
export const hpMul = () => (1 + 0.2 * (starsNow() - 1)) * (1 + Math.max(0, G.run.t - BAL.GRACE) / 420);
export const dmgMul = () => 1 + 0.14 * (starsNow() - 1) + Math.max(0, G.run.t - BAL.GRACE) / 900;
export const addHeat = (v: number) => { const r = G.run; if (!r.demo) r.heat = Math.min(4.999, r.heat + v); };
export const aliveUnits = (): any[] => G.run.units.filter((u: any) => !u.dead);
