/* Общее состояние игры + эффекты арены. React подписывается через subscribe(). */
import { BAL } from "./consts";
import { clamp, pick, rnd } from "./util";
import { isSheetClass, selectSheetFrame } from "./art/sheetLogic";

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
  if (r.texts.length > 44) r.texts.shift();
  r.texts.push({ x, y, s: String(s), col: col || "#fff", sc: sc || 1, t: 0, life: (sc || 1) > 1 ? 1.15 : 0.95 });
}
export function part(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, col: string, size: number, grav: number, kind?: string) {
  const r = G.run; if (!r) return;
  if (r.parts.length > 650) r.parts.shift();
  r.parts.push({ x, y, z, vx, vy, vz, life, t: 0, col, size, grav, kind });
}
export function burst(x: number, y: number, z: number, n: number, col: string | string[], sp: number, size?: number, grav?: number, life?: number) {
  for (let i = 0; i < n; i++)
    part(x, y, z, rnd(-sp, sp), rnd(-sp * 0.35, sp * 0.35), rnd(sp * 0.25, sp * 1.1), life || rnd(0.28, 0.58), Array.isArray(col) ? pick(col) : col, size || 1, grav === undefined ? 260 : grav);
}
export function ring(x: number, y: number, z: number, col: string, maxR = 22, life = 0.3) {
  const r = G.run; if (!r) return;
  if (r.rings.length > 24) r.rings.shift();
  r.rings.push({ x, y, z, col, maxR, t: 0, life });
}
export function slash(x: number, y: number, face: number, col = "#dff6ff", big = false) {
  const r = G.run; if (!r) return;
  if (r.slashes.length > 20) r.slashes.shift();
  r.slashes.push({ x, y, face, t: 0, life: 0.22, col, big });
}
/* Звёздная вспышка удара (Streets of Rage starburst) */
export function starburst(x: number, y: number, z: number, col = "#ffcf58", big = false) {
  const r = G.run; if (!r) return;
  if (!r.sparks) r.sparks = [];
  if (r.sparks.length > 24) r.sparks.shift();
  r.sparks.push({ x, y, z, col, big, t: 0, life: big ? 0.22 : 0.16, rot: rnd(0, 1.57) });
}
/* Огненный факел выстрела (Huntdown muzzle blast) */
export function muzzleBlast(x: number, y: number, z: number, face: number, big = false) {
  const r = G.run; if (!r) return;
  if (!r.muzzles) r.muzzles = [];
  if (r.muzzles.length > 18) r.muzzles.shift();
  r.muzzles.push({ x, y, z, face, big, t: 0, life: big ? 0.14 : 0.1 });
}
/* Выброс гильзы с отскоком об асфальт */
export function ejectCasing(x: number, y: number, z: number, face: number) {
  const r = G.run; if (!r) return;
  if (!r.casings) r.casings = [];
  if (r.casings.length > 80) r.casings.shift();
  r.casings.push({
    x, y, z,
    vx: -face * rnd(26, 52),
    vy: rnd(-10, 10),
    vz: rnd(65, 105),
    t: 0, life: 1.4,
    rot: rnd(0, 6.28),
  });
}
/* Призрачный шлейф (afterimage) при уклонении / рывке / комбо */
export function afterimage(u: any, col = "#6fe0e6", pose?: string, fr?: number) {
  const r = G.run; if (!r) return;
  if (!r.ghosts) r.ghosts = [];
  if (r.ghosts.length > 32) r.ghosts.shift();
  const useSheet = u.team === 0 && isSheetClass(u.cls);
  r.ghosts.push({
    x: u.x, y: u.y, face: u.face >= 0 ? 1 : -1,
    cls: useSheet ? u.cls : undefined,
    variant: u.variant || 0,
    sheetFrame: useSheet ? selectSheetFrame(u, G.t).frame : 0,
    look: u.look || (u.team === 0 ? u.cls : u.type),
    eqi: u.team === 0 ? { ...u.eqi } : null,
    pose: pose || u.state || "idle",
    fr: fr ?? 0,
    combo: u.atkSeq || 0,
    col, t: 0, life: 0.24,
  });
}
/* Рябь на лужах */
export function ripple(x: number, y: number, col = "rgba(180,220,240,.45)", maxR = 12) {
  const r = G.run; if (!r) return;
  if (!r.ripples) r.ripples = [];
  if (r.ripples.length > 48) r.ripples.shift();
  r.ripples.push({ x, y, col, maxR, t: 0, life: 0.45 });
}
/* Следы гари и обломки на асфальте */
export function addDecal(x: number, y: number, kind: "scorch" | "glass" | "trash", size = 24) {
  const r = G.run; if (!r) return;
  if (!r.decals) r.decals = [];
  if (r.decals.length > 40) r.decals.shift();
  r.decals.push({ x, y, kind, size, seed: Math.random() });
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
  if (r.sparks) {
    for (const s of r.sparks) s.t += dt;
    r.sparks = r.sparks.filter((s: any) => s.t < s.life);
  }
  if (r.muzzles) {
    for (const m of r.muzzles) m.t += dt;
    r.muzzles = r.muzzles.filter((m: any) => m.t < m.life);
  }
  if (r.casings) {
    for (const c of r.casings) {
      c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.vz -= 360 * dt; c.rot += dt * 18;
      if (c.z <= 0) { c.z = 0; c.vz = Math.abs(c.vz) * 0.42; c.vx *= 0.6; c.vy *= 0.6; }
    }
    r.casings = r.casings.filter((c: any) => c.t < c.life);
  }
  if (r.ghosts) {
    for (const g of r.ghosts) g.t += dt;
    r.ghosts = r.ghosts.filter((g: any) => g.t < g.life);
  }
  if (r.ripples) {
    for (const rp of r.ripples) rp.t += dt;
    r.ripples = r.ripples.filter((rp: any) => rp.t < rp.life);
  }
  if (r.decals && r.decals.length > 35) {
    r.decals = r.decals.filter((d: any) => d.x > r.camX - 180);
  }
  for (const a of r.alarms) a.t -= dt;
  r.alarms = r.alarms.filter((a: any) => a.t > 0);
  G.flash = Math.max(0, G.flash - dt * 2.4);
}
export const starsNow = () => Math.min(5, 1 + Math.floor(G.run.heat));
export const hpMul = () => (1 + 0.2 * (starsNow() - 1)) * (1 + Math.max(0, G.run.t - BAL.GRACE) / 420);
export const dmgMul = () => 1 + 0.14 * (starsNow() - 1) + Math.max(0, G.run.t - BAL.GRACE) / 900;
export const addHeat = (v: number) => { const r = G.run; if (!r.demo) r.heat = Math.min(4.999, r.heat + v); };
export const aliveUnits = (): any[] => G.run.units.filter((u: any) => !u.dead);
