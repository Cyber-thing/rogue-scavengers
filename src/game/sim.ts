/* ======================================================================
   СИМУЛЯЦИЯ: забег, бой, ИИ, спавн, события, гражданские.
   Геймплей полностью сохранён — добавлена богатая визуальная отдача,
   комбо-вариации, гильзы, вспышки, следы шагов и ховер-спиннеры.
   ====================================================================== */
import { BAL, CH, CHPX, LW, DL } from "./consts";
import { CLASSES, ENEMIES, ITEMS, ITEM_IDS, NAMES_F, NAMES_M, PANIC_SHOUTS, WARDEN_NAMES } from "./content";
import { Snd } from "./audio";
import {
  G, meta, toast, addText, part, burst, ring, slash, alarm, updateFx, starsNow, hpMul, dmgMul, addHeat, aliveUnits,
  starburst, muzzleBlast, ejectCasing, afterimage, ripple, addDecal,
} from "./state";
import { clamp, mulberry32, pick, rint, rnd } from "./util";
import { bakeChunk } from "./art/world";
import { CIV_LOOKS, pickClassLook } from "./art/characters";
import { isSheetClass } from "./art/sheetLogic";
import { poseOf } from "./art/poses";

export const hooks: { finishRun: (t: string) => void } = { finishRun: () => {} };

/* ============================ ЗАБЕГ ============================ */
export function newRun(demo: boolean) {
  const b = Object.assign({}, meta.biz);
  const r: any = {
    demo: !!demo, seed: (Math.random() * 1e9) | 0, t: 0, cash: BAL.START_CASH + BAL.PAWN_CASH[b.pawn], rep: BAL.START_REP + BAL.NOODLE_REP[b.noodle],
    cashLooted: 0, kills: 0, loots: 0, front: 100, camX: 0, heat: 0, starsPrev: 1, limit: BAL.BASE_LIMIT + b.laundry, biz: b,
    units: [], enemies: [], civs: [], props: [], projs: [], parts: [], texts: [], rings: [], slashes: [], alarms: [],
    sparks: [], muzzles: [], casings: [], ghosts: [], ripples: [], decals: [],
    chunks: {}, nextChunk: 0, spins: 0, market: 0, inv: new Array(BAL.INV).fill(null), sel: null, buff: null,
    spawnT: 7, civT: 0.5, eventT: 55, uid: 1, ending: null, distM: 0,
  };
  G.run = r;
  ensureChunks();
  if (demo) {
    ["rat", "hulk", "runner", "cutter"].forEach((c, i) => addUnit(c, 160 + i * 48, 190));
    for (let i = 0; i < 4; i++) civLogic(10);
  } else {
    const u = addUnit("rat", 70, 195);
    r.sel = u.id;
    for (let i = 0; i < 3; i++) { const c = spawnCiv(true); if (c) c.x = r.camX + rnd(120, 420); }
  }
  return r;
}
export function addUnit(cls: string, x: number, y: number) {
  const r = G.run;
  const picked = pickClassLook(cls);
  const gender: "m" | "f" = isSheetClass(cls) ? (cls === "cutter" ? "f" : "m") : picked.gender;
  const variant = r.units.filter((x: any) => x.cls === cls).length % 4;
  const look = isSheetClass(cls) ? (cls === "cutter" ? "cutter_f0" : `${cls}_m0`) : picked.look;
  const u: any = {
    id: r.uid++, team: 0, cls, look, variant, gender, name: pick(gender === "f" ? NAMES_F : NAMES_M), x, y, kx: 0, ky: 0, face: 1, lvl: 1, xp: 0, eq: { head: null, weapon: null, neck: null, body: null },
    cmd: "auto", state: "idle", st: 0, atkCd: rnd(0, 0.4), flash: 0, armorT: 0, combatT: 0, dead: false, deadT: 0, downT: 0, anim: rnd(0, 4), moving: false, moveT: 0,
    busy: false, fleeT: 0, lootP: null, lootShop: null, exitDoorX: null, lootT: 0, focus: null, focusObj: null, cmdProp: null, hitDone: false, atkDur: 0.34, atkT: null, atkSeq: 0,
    stepT: 0, kres: 0, hp: undefined, maxHp: 0,
  };
  recalc(u); r.units.push(u); G.uiDirty = true; return u;
}
export function recalc(u: any) {
  const C = CLASSES[u.cls], lv = u.lvl - 1, e = u.eq;
  const val = (s: string) => (e[s] ? ITEMS[e[s].id].v[e[s].lv - 1] : 0), is = (s: string, id: string) => e[s] && e[s].id === id, s: any = {};
  s.maxHp = Math.round(C.hp * (1 + 0.12 * lv) + (is("body", "nano") ? val("body") : 0));
  s.dmg = C.dmg * (1 + 0.1 * lv) + (is("weapon", "crowbar") || is("weapon", "smg") ? val("weapon") : 0);
  s.spd = C.spd * (1 + (is("head", "visor") ? val("head") : 0));
  s.armor = Math.min(0.75, C.armor + (is("head", "helm") ? val("head") : 0));
  s.crit = C.crit; s.knock = C.knock; s.chain = C.chain; s.ranged = C.ranged; s.range = C.range; s.rate = C.rate; s.dodge = C.dodge;
  if (is("weapon", "smg")) { s.ranged = true; s.range = 130; s.rate = Math.max(C.rate, 1.1); s.chain = false; }
  s.lootMult = 1 + (is("neck", "scanner") ? val("neck") : 0);
  s.regen = is("body", "nano") ? ITEMS.nano.regen![e.body.lv - 1] : 0;
  const old = u.maxHp || s.maxHp; u.maxHp = s.maxHp;
  u.hp = u.hp === undefined ? s.maxHp : clamp(u.hp + Math.max(0, s.maxHp - old), 1, s.maxHp);
  u.s = s;
  u.eqi = { head: e.head ? e.head.id : null, weapon: e.weapon ? e.weapon.id : null, neck: e.neck ? e.neck.id : null, body: e.body ? e.body.id : null };
  G.uiDirty = true;
}
function mkEnemy(type: string, x: number, y: number) {
  const E = ENEMIES[type], st = starsNow(), hp = Math.round(E.hp * hpMul()), dm = dmgMul();
  const { look, gender } = pickClassLook(type);
  return {
    id: G.run.uid++, team: 1, type, look, gender, x, y, kx: 0, ky: 0, face: -1, hp, maxHp: hp, state: "idle", st: 0, atkCd: rnd(0.3, 1), flash: 0, armorT: 0, combatT: 0, dead: false,
    deadT: 0, downT: 0, anim: rnd(0, 3), moving: false, moveT: 0, busy: false, inside: false, tgt: null, retgt: 0, kres: E.kres, hitDone: false, atkDur: 0.42, atkT: null, atkSeq: 0, stepT: 0,
    s: { dmg: E.dmg * dm, spd: E.spd * (1 + 0.03 * (st - 1)), rate: E.rate, range: E.range, ranged: E.ranged, crit: E.crit, armor: E.armor, knock: E.knock, chain: false, dodge: 0, lootMult: 1, regen: 0 },
  } as any;
}

/* ========================= ГЕНЕРАЦИЯ УЛИЦЫ ========================= */
const LOOTT = ["mart", "netcafe", "charge"], OBJHP: Record<string, number> = { trash: 18, hydrant: 30, phone: 28, car: 80 };
function genChunk(i: number) {
  const r = G.run, rng = mulberry32((r.seed + i * 7919) >>> 0);
  let type: string;
  if (i === 0) type = "apt"; else if (i === 1) type = "mart";
  else {
    const pt = r.chunks[i - 1] ? r.chunks[i - 1].type : "apt", pp = r.chunks[i - 2] ? r.chunks[i - 2].type : "apt";
    if (!LOOTT.includes(pt) && !LOOTT.includes(pp)) type = LOOTT[Math.floor(rng() * 3)];
    else { const bag = ["mart", "netcafe", "charge", "bar", "club", "apt", "apt", "mart", "netcafe", "lot"]; type = bag[Math.floor(rng() * bag.length)]; }
  }
  const b = bakeChunk(type, rng), ch: any = { i, x: i * CH, type, ...b };
  r.chunks[i] = ch;
  r.props.push({ kind: "lamp", type: "lamp", x: ch.x + 16 + rng() * 20, y: 147, glow: 1 });
  if (LOOTT.includes(type)) r.props.push({ kind: "shop", type, x: ch.x + CHPX / 2 / (4 / 3), y: 148, looted: false, ch });
  const n = Math.floor(rng() * 3);
  for (let k = 0; k < n; k++) {
    const tp = rng() < 0.45 ? "trash" : rng() < 0.55 ? "hydrant" : "phone";
    let x = ch.x + 24 + rng() * 212; if (Math.abs(x - (ch.x + 130)) < 24) x += 40;
    r.props.push({ kind: "obj", type: tp, x, y: 151 + rng() * 14, hp: OBJHP[tp], maxHp: OBJHP[tp], broken: false, flash: 0 });
  }
  if (rng() < 0.48) {
    const mr = rng();
    const model = mr < 0.34 ? "spinner" : mr < 0.67 ? "sedan" : "coupe";
    r.props.push({
      kind: "obj", type: "car", model, col: Math.floor(rng() * 6),
      face: rng() < 0.5 ? 1 : -1, x: ch.x + 44 + rng() * 170, y: 188 + rng() * 52, hp: OBJHP.car, maxHp: OBJHP.car, broken: false, flash: 0,
    });
  }
}
export function ensureChunks() {
  const r = G.run;
  while (r.nextChunk * CH < r.camX + LW + CH * 1.5) genChunk(r.nextChunk++);
  for (const k in r.chunks) if (r.chunks[k].x + CH < r.camX - CH * 1.5) delete r.chunks[k];
  if (r.props.length > 55) r.props = r.props.filter((p: any) => p.x > r.camX - 320);
}

/* ============================ ЭКОНОМИКА ============================ */
const moneyMult = (src: any) => (src && src.team === 0 ? src.s.lootMult : 1);
export function earn(amount: number, x: number, y: number, src: any, shop?: boolean) {
  const r = G.run; let m = moneyMult(src); if (shop) m *= 1 + BAL.PAWN_LOOT[r.biz.pawn];
  const v = Math.max(1, Math.round(amount * m)); r.cash += v; r.cashLooted += v; addText(x, y, "+" + v, "#e8c25a", 1);
  const n = Math.min(8, 2 + ((v / 6) | 0));
  for (let i = 0; i < n; i++) part(x, y + 10, 10, rnd(-30, 30), rnd(-10, 10), rnd(60, 120), rnd(0.6, 0.9), "#e0b440", 2, 320);
  Snd.coin(); return v;
}
export function rollItem(min?: number) {
  const r = G.run, rb = BAL.NOODLE_RARE[r.biz.noodle], x = Math.random(), p3 = 0.01 + rb * 0.15, p2 = 0.07 + rb; let lv = 1;
  if (x < p3) lv = 3; else if (x < p3 + p2) lv = 2; if (min && lv < min) lv = min;
  return { id: pick(ITEM_IDS), lv };
}
export function addItem(it: any) {
  const r = G.run, i = r.inv.findIndex((x: any) => !x); if (i < 0) return false; r.inv[i] = it; G.uiDirty = true; return true;
}
export function dropItem(x: number, y: number, min?: number) {
  const it = rollItem(min);
  if (addItem(it)) { addText(x, y - 20, "ЛУТ!", "#9ad0e8", 1); toast("ПОЛУЧЕНО: " + ITEMS[it.id].name + " Lv." + it.lv); }
  else { earn(12, x, y, null); toast("Инвентарь полон: " + ITEMS[it.id].name + " продан за " + DL + "12"); }
  Snd.buy();
}
export function addXp(u: any, v: number) {
  u.xp += v; let up = false;
  while (u.lvl < 6 && u.xp >= 30 + u.lvl * 25) { u.xp -= 30 + u.lvl * 25; u.lvl++; up = true; recalc(u); u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.3); }
  if (up) {
    addText(u.x, u.y - 56, "УРОВЕНЬ!", "#9ad0e8", 1); Snd.level(); G.uiDirty = true;
    ring(u.x, u.y, 4, "#9ad0e8", 28, 0.55);
    burst(u.x, u.y, 18, 12, ["#9ad0e8", "#fff0b0", "#6fe0e6"], 85, 1.5, 160, 0.5);
  }
}
const giveXp = (att: any, xp: number) => { for (const u of G.run.units) if (!u.dead) addXp(u, u === att ? xp : xp * 0.4); };

/* ============================== БОЙ ============================== */
export function doDamage(att: any, t: any, raw: number, o?: any) {
  o = o || {}; if (t.dead || t.state === "down") return 0;
  if (t.team === 0 && !o.noDodge && t.state !== "loot" && t.state !== "hurt" && Math.random() < t.s.dodge) {
    addText(t.x, t.y - 40, "ПРОМАХ", "#8696ab", 1);
    const pp = poseOf(t, G.t);
    afterimage(t, "#6fe0e6", pp[0], pp[1]);
    t.ky = Math.random() < 0.5 ? 155 : -155; t.kx -= (t.face || 1) * 34;
    return 0;
  }
  const d = Math.max(1, Math.round(raw * (1 - t.s.armor))); t.hp -= d; t.flash = 0.14; t.combatT = 3;
  const crit = !!o.crit, dir = o.dir || (att && att.x > t.x ? -1 : 1);
  t.kx += dir * (o.knock || 0) * (1 - (t.kres || 0)) * (crit ? 1.3 : 1);
  addText(t.x + rnd(-6, 6), t.y - 38, String(d), crit ? "#f0c050" : t.team === 0 ? "#e0735a" : "#f0e8d0", crit ? 2 : 1);
  let kd = false;
  if (t.state !== "loot" && t.armorT <= 0 && (t.kres || 0) < 0.7 && t.hp > 0) {
    if (d >= t.maxHp * 0.3 || (crit && Math.random() < 0.45) || ((o.knock || 0) >= 200 && Math.random() < 0.5)) {
      kd = true; t.state = "down"; t.st = 1.05; t.downT = 0; t.armorT = 1.4; addText(t.x, t.y - 52, "НОКДАУН!", "#e8dcc0", 1); t.kx += dir * 64;
      afterimage(t, "#ffd078", "hurt", 0);
    } else if ((t.kres || 0) < 0.5) { t.state = "hurt"; t.st = 0.26; t.armorT = 0.5; }
  }
  if (crit) addText(t.x, t.y - 64, "КРИТ!", "#e0a43a", 1); else if (d >= 20 && !kd) addText(t.x, t.y - 64, "УДАР!", "#e0735a", 1);
  const heavy = d >= 18 || crit || kd; Snd.hit(heavy);
  const hitZ = 24 + rnd(-3, 3);
  starburst(t.x - dir * 4, t.y, hitZ, crit ? "#ffe678" : heavy ? "#ffaa44" : "#ffd888", heavy);
  if (heavy) {
    G.hitStop = Math.max(G.hitStop, crit ? 0.085 : 0.055);
    G.shake = Math.max(G.shake, crit ? 4.2 : 2.6);
    ring(t.x, t.y, hitZ, crit ? "#f0c050" : "#f0e8d0", crit ? 26 : 18, 0.28);
    alarm(t.x, t.y, 150, 1.2);
    if (att) {
      const pp = poseOf(att, G.t);
      afterimage(att, crit ? "#ffe078" : "#9fe8f0", pp[0], pp[1]);
    }
  }
  burst(t.x - dir * 3, t.y, hitZ, heavy ? 12 : 6, ["#fff4d0", "#ffbe48", "#d94e3a", "#9fe8f0"], heavy ? 140 : 95, 1.2, 310, 0.36);
  if (t.hp <= 0) { t.hp = 0; if (t.team === 0) killUnit(t); else killEnemy(t, att); }
  return d;
}
function killEnemy(e: any, att: any) {
  const r = G.run; e.dead = true; e.state = "down"; e.deadT = 0; e.downT = 0; r.kills++;
  const E = ENEMIES[e.type]; earn(rint(E.loot[0], E.loot[1]), e.x, e.y - 30, att); giveXp(att, E.xp);
  if (e.type === "agent" || e.type === "trooper") { addHeat(e.type === "agent" ? 0.15 : 0.25); if (Math.random() < 0.35) { r.rep++; addText(e.x, e.y - 70, "REP+1", "#9ad0e8", 1); } }
  else if (e.type === "exo" && Math.random() < 0.3) { r.rep++; addText(e.x, e.y - 70, "REP+1", "#9ad0e8", 1); }
  burst(e.x, e.y, 20, 12, ["#7fe7ee", "#e0a43a", "#ff8a48", "#d8e0e8"], 115, 2, 280, 0.52);
  starburst(e.x, e.y, 22, "#ffbe50", true);
  if (Math.random() < 0.07) dropItem(e.x, e.y);
}
function killUnit(u: any) {
  u.dead = true; u.state = "down"; u.deadT = 0; u.downT = 0; u.lootP = null; u.lootShop = null; if (u.y < 150) u.y = 150; addText(u.x, u.y - 44, "K.O.", "#c4473a", 2); Snd.lose(); G.shake = Math.max(G.shake, 3); G.uiDirty = true;
  const r = G.run; if (r.sel === u.id) { const n = aliveUnits()[0]; r.sel = n ? n.id : null; }
}
function hitObj(o: any, d: number, _src: any) {
  if (o.broken) return; o.hp -= d; o.flash = 0.12; Snd.hit(false);
  starburst(o.x, o.y, 16, o.type === "phone" ? "#7fe7ee" : "#ffc060", false);
  burst(o.x, o.y, 14, 6, o.type === "phone" ? ["#8aa0b8", "#e8dcc0", "#7fe7ee"] : ["#8a8e98", "#e0b440"], 95, 1.2, 300, 0.32);
  addText(o.x, o.y - 34, String(Math.round(d)), "#f0e8d0", 1);
  if (o.hp <= 0) breakObj(o, _src);
}
function breakObj(o: any, src: any) {
  o.broken = true; addHeat(0.03); earn(rint(BAL.OBJ_LOOT[0], BAL.OBJ_LOOT[1]), o.x, o.y - 30, src);
  if (o.type === "phone") {
    Snd.glass();
    burst(o.x, o.y, 20, 20, ["#8aa0b8", "#c8d8e8", "#4a6a8a", "#7fe7ee"], 140, 2, 320, 0.72);
    addDecal(o.x, o.y, "glass", 18);
    alarm(o.x, o.y, 160, 1.5);
  } else if (o.type === "car") {
    explode(o.x, o.y, src); o.burnT = 14; o.sm = 0;
  } else if (o.type === "hydrant") {
    o.sprayT = 3.2; o.sm = 0; Snd.hit(true);
    burst(o.x, o.y, 14, 14, ["#b8d0dc", "#e8f4fa"], 130, 2, 300, 0.65);
    ripple(o.x, o.y + 4, "rgba(180,230,255,.55)", 22);
  } else {
    Snd.hit(true);
    burst(o.x, o.y, 10, 14, ["#a8553a", "#e8dcc0", "#c9a23a", "#5a7a78"], 120, 2, 300, 0.62);
    addDecal(o.x, o.y, "trash", 20);
  }
}
function explode(x: number, y: number, src: any) {
  const r = G.run; Snd.boom(); G.shake = Math.max(G.shake, 8); G.hitStop = Math.max(G.hitStop, 0.085); G.flash = 0.6; G.flashCol = "#ffc070"; addHeat(0.08);
  alarm(x, y, 340, 3);
  ring(x, y, 14, "#ffe090", 66, 0.48);
  ring(x, y, 10, "#e06838", 46, 0.36);
  starburst(x, y, 20, "#fff0a0", true);
  addDecal(x, y, "scorch", 44);
  burst(x, y, 14, 42, ["#fff4c0", "#e0a43a", "#d94a36", "#f0c068", "#6b1f33"], 190, 3, 210, 0.85);
  for (let i = 0; i < 14; i++) part(x + rnd(-14, 14), y, 8, rnd(-26, 26), rnd(-8, 8), rnd(22, 58), rnd(0.8, 1.6), "#2a2e36", rnd(5, 9), 0, "smoke");
  for (const e of r.enemies.slice()) if (!e.dead && Math.hypot(e.x - x, (e.y - y) * 1.5) < 62) doDamage(src, e, 45, { knock: 200, dir: e.x >= x ? 1 : -1, noDodge: true });
  for (const u of r.units.slice()) if (!u.dead && Math.hypot(u.x - x, (u.y - y) * 1.5) < 62) doDamage(null, u, 18, { knock: 160, dir: u.x >= x ? 1 : -1, noDodge: true });
  for (const c of r.civs) if (!c.dead && Math.hypot(c.x - x, (c.y - y) * 1.5) < 70) { c.state = "down"; c.st = 1.2; c.downT = 0; c.kx += (c.x >= x ? 1 : -1) * 150; c.panic = 4; }
}
function startAttack(u: any, t: any) {
  const s = u.s, buffS = u.team === 0 && G.run.buff ? G.run.buff.spd * 0.5 : 0, rate = s.rate * (1 + buffS);
  u.state = "attack"; u.st = 0; u.moveT = 0; u.moving = false; u.hitDone = false; u.atkT = t; u.face = t.x >= u.x ? 1 : -1;
  u.atkSeq = ((u.atkSeq || 0) + 1) & 1;
  u.atkCd = 1 / rate; u.atkDur = Math.min(u.team === 0 ? 0.36 : 0.48, 0.9 / rate);
}
function resolveHit(u: any) {
  const r = G.run, s = u.s, t = u.atkT, bd = u.team === 0 && r.buff ? 1 + r.buff.dmg : 1, base = s.dmg * bd;
  if (s.ranged) {
    const isHeavyGun = (u.team === 1 && u.type === "trooper") || (u.team === 0 && u.eqi?.weapon === "smg");
    const mx = u.x + u.face * 20;
    r.projs.push({
      x: mx, y: u.y, px: mx, vx: u.face * 310, team: u.team,
      dmg: base * rnd(0.9, 1.1), crit: Math.random() < s.crit, knock: s.knock,
      life: (s.range + 55) / 310, owner: u, heavy: isHeavyGun,
    });
    Snd.shoot();
    muzzleBlast(mx + u.face * 3, u.y, 22, u.face, isHeavyGun);
    ejectCasing(u.x + u.face * 6, u.y, 24, u.face);
    burst(mx + u.face * 4, u.y, 22, isHeavyGun ? 6 : 3, ["#fff2b0", "#ff9040"], 60, 1, 80, 0.18);
    alarm(u.x, u.y, 230, 1.6);
    return;
  }
  const wpn = u.team === 0 ? u.eqi.weapon : null;
  const col = wpn === "crowbar" ? "#9ff4ff" : s.chain ? "#aef0ea" : u.team === 1 ? "#ffd890" : "#f4f6fa";
  slash(u.x + u.face * 15, u.y - 21, u.face, col, !!s.chain || (u.team === 1 && u.type === "exo"));
  if (wpn === "crowbar" || (u.team === 1 && (u.type === "guard" || u.type === "agent"))) Snd.zap();
  if (t && t.kind === "obj") {
    if (!t.broken && Math.abs(t.x - u.x) <= s.range + (t.type === "car" ? 40 : 12) && Math.abs(t.y - u.y) <= 18) hitObj(t, base * rnd(0.9, 1.1), u);
    else Snd.swing();
    return;
  }
  const effY = (o: any) => (o.state === "loot" && o.y < 150 ? 150 : o.y);
  const list = u.team === 0 ? r.enemies : r.units, targets: any[] = [];
  if (s.chain) {
    for (const e of list) { if (e.dead || e.state === "down") continue; const dx = (e.x - u.x) * u.face; if (dx > -6 && dx <= s.range + 10 && Math.abs(effY(e) - u.y) <= 16) targets.push([dx, e]); }
    targets.sort((a, b) => a[0] - b[0]); targets.length = Math.min(3, targets.length);
  } else if (t && !t.dead && Math.abs(t.x - u.x) <= s.range + 10 && Math.abs(effY(t) - u.y) <= 14) targets.push([0, t]);
  if (!targets.length) { Snd.swing(); return; }
  for (const tt of targets) { const crit = Math.random() < s.crit; doDamage(u, tt[1], base * rnd(0.88, 1.12) * (crit ? 1.8 : 1), { crit, knock: s.knock, dir: u.face }); }
}
function updateProjs(dt: number) {
  const r = G.run;
  for (const p of r.projs) {
    p.px = p.x; p.x += p.vx * dt; p.life -= dt; if (p.life <= 0) continue;
    const list = p.team === 0 ? r.enemies : r.units;
    for (const e of list) {
      const ey = e.state === "loot" && e.y < 150 ? 150 : e.y;
      if (!e.dead && e.state !== "down" && Math.abs(e.x - p.x) < 10 && Math.abs(ey - p.y) < 10) {
        doDamage(p.owner, e, p.dmg * (p.crit ? 1.8 : 1), { crit: p.crit, knock: p.knock, dir: p.vx > 0 ? 1 : -1 });
        p.life = 0; break;
      }
    }
    if (p.life > 0 && p.team === 0) for (const o of r.props) {
      if (o.kind === "obj" && !o.broken && Math.abs(o.x - p.x) < (o.type === "car" ? 38 : 8) + 3 && Math.abs(o.y - p.y) < 9) {
        hitObj(o, p.dmg, p.owner); p.life = 0; break;
      }
    }
  }
  r.projs = r.projs.filter((p: any) => p.life > 0);
}
function updateProps(dt: number) {
  const r = G.run;
  for (const o of r.props) {
    if (o.flash > 0) o.flash -= dt; if (o.kind !== "obj" || !o.broken) continue;
    if (o.type === "car" && o.burnT > 0) {
      o.burnT -= dt; o.sm -= dt;
      if (o.sm <= 0) {
        o.sm = 0.09;
        part(o.x + rnd(-12, 12), o.y, rnd(10, 18), rnd(-6, 6), 0, rnd(16, 34), rnd(0.8, 1.5), pick(["#3a3646", "#2a2e36", "#4a4658"]), rnd(3, 6), 0, "smoke");
        if (Math.random() < 0.6) part(o.x + rnd(-12, 12), o.y, rnd(10, 15), rnd(-6, 6), 0, rnd(22, 46), rnd(0.28, 0.5), pick(["#ffe080", "#e0a43a", "#c4473a"]), rnd(1.5, 3), 0);
      }
    }
    if (o.type === "hydrant" && o.sprayT > 0) {
      o.sprayT -= dt; o.sm -= dt;
      if (o.sm <= 0) {
        o.sm = 0.035;
        part(o.x, o.y, 14, rnd(-18, 18), rnd(-8, 8), rnd(100, 165), rnd(0.4, 0.7), pick(["#b8d8e8", "#e8f6fc"]), 2, 330);
        if (Math.random() < 0.25) ripple(o.x + rnd(-10, 10), o.y + rnd(-2, 4), "rgba(180,225,245,.4)", 12);
      }
    }
  }
}

/* =============================== ИИ =============================== */
function steer(u: any, tx: number, ty: number, sp: number, dt: number) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
  if (d < 2.5) return d;
  const m = Math.min(d, sp * dt);
  u.x += (dx / d) * m; u.y += (dy / d) * m * 0.85;
  if (Math.abs(dx) > 4.5) u.face = dx > 0 ? 1 : -1;
  if (m > 0.08) { u.moveT = 0.09; u.moving = true; }
  u.stepT = (u.stepT || 0) - dt;
  if (u.stepT <= 0) {
    u.stepT = 0.25;
    if (u.y > 165) ripple(u.x, u.y + 1, "rgba(160,200,220,.28)", 7);
    part(u.x - u.face * 3, u.y + 1, 1, -u.face * rnd(8, 18), rnd(-4, 4), rnd(10, 22), 0.24, u.y > 165 ? "#6a8898" : "#78808a", 1, 60);
  }
  return d - m;
}
const spdOf = (u: any) => u.s.spd * (u.team === 0 && G.run.buff ? 1 + G.run.buff.spd : 1);
function nearestEnemy(u: any): [any, number] {
  let b = null, bd = 1e9; for (const e of G.run.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - u.x, (e.y - u.y) * 1.4); if (d < bd) { bd = d; b = e; } } return [b, bd];
}
function fight(u: any, t: any, dt: number, sp: number) {
  const s = u.s, isObj = t.kind === "obj"; if (isObj) u.busy = true;
  const ty = !isObj && t.state === "loot" && t.y < 150 ? 150 : t.y;
  const hw = isObj ? (t.type === "car" ? 38 : 8) : 0, dx = t.x - u.x, dy = ty - u.y, adx = Math.max(0, Math.abs(dx) - hw), ady = Math.abs(dy), dir = dx >= 0 ? 1 : -1;
  if (s.ranged) {
    const want = Math.min(s.range * 0.7, 95); let tx = u.x;
    if (adx > s.range * 0.95) tx = t.x - dir * want; else if (adx < want * 0.45 && !isObj) tx = u.x - dir * 40;
    if (Math.abs(ty - u.y) > 7 || Math.abs(tx - u.x) > 3) steer(u, tx, ty, sp, dt); else u.face = dir;
    if (ady <= 10 && adx <= s.range && u.atkCd <= 0 && Math.abs(tx - u.x) < 14) { u.face = dir; startAttack(u, t); }
  } else {
    if (adx <= s.range && ady <= 11) { u.face = dir; if (u.atkCd <= 0) startAttack(u, t); }
    else steer(u, t.x - dir * (hw + s.range * 0.72), ty, sp, dt);
  }
}
function nearLoot(u: any, any_: boolean) {
  const r = G.run; let best = null, bd = 1e9;
  for (const p of r.props) {
    if (p.kind !== "shop" || p.looted) continue;
    if (p.x < r.camX + 4 || p.x > r.camX + LW - 4) continue;
    if (!any_ && (p.x < r.front - 260 || p.x > r.front + 170)) continue;
    if (r.units.some((o: any) => o !== u && !o.dead && (o.lootP === p || o.lootShop === p))) continue;
    const d = Math.abs(p.x - u.x) + Math.abs(148 - u.y); if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function nearObj(u: any) {
  const r = G.run; let best = null, bd = 1e9;
  for (const o of r.props) {
    if (o.kind !== "obj" || o.broken) continue; if (o.x < r.camX + 10 || o.x > r.camX + LW - 10) continue;
    if (o.type === "car" && u.hp < u.maxHp * 0.6) continue;
    const d = Math.abs(o.x - u.x) + Math.abs(o.y - u.y) * 0.5; if (d < 150 && d < bd) { bd = d; best = o; }
  }
  return best;
}
function goLoot(u: any, p: any, dt: number, sp: number) {
  u.lootP = p;
  steer(u, p.x, 148, sp, dt);
  if (Math.hypot(p.x - u.x, 148 - u.y) < 6) {
    u.state = "loot";
    u.lootT = 0;
    u.lootShop = p;
    u.exitDoorX = p.x;
    u.x = p.x;
    u.y = 148;
    u.face = 1;
    u.moveT = 0;
    u.moving = false;
  }
}
function finishLoot(u: any) {
  const p = u.lootShop || u.lootP;
  u.state = "idle";
  u.lootP = null;
  u.lootShop = null;
  if (!p || p.looted) return;
  u.exitDoorX = p.x;
  const r = G.run; p.looted = true; const L = BAL.LOOT[p.type];
  earn(rint(L[0], L[1]), p.x, 100, u, true); const rep = rint(BAL.SHOP_REP[0], BAL.SHOP_REP[1]); r.rep += rep; addText(p.x, 86, "REP+" + rep, "#9ad0e8", 1);
  addHeat(0.12); r.loots++; Snd.glass();
  burst(p.x, 148, 20, 16, ["#8aa0b8", "#c8d8e8", "#7fe7ee", "#e0a43a"], 115, 2, 300, 0.62);
  starburst(p.x, 148, 24, "#6fe0e6", true);
  addXp(u, 12); alarm(p.x, 148, 260, 3);
  if (Math.random() < 0.3) dropItem(p.x, 140);
  if (u.cmd === "loot") { u.cmd = "auto"; u.cmdProp = null; G.uiDirty = true; }
  toast("ТОЧКА ВСКРЫТА: +" + rep + " REP");
}
function march(u: any, dt: number, sp: number) {
  const r = G.run, al = aliveUnits(), idx = Math.max(0, al.indexOf(u));
  const tx = r.front - 10 - (idx >> 1) * 26, ty = 170 + (idx % 3) * 30, d = Math.hypot(tx - u.x, ty - u.y);
  if (d > 7) steer(u, tx, ty, sp * (1 + Math.min(1, d / 120) * 0.6), dt);
}
function gather(u: any, dt: number, sp: number) {
  const al = aliveUnits().filter((o) => o !== u); if (!al.length) return march(u, dt, sp);
  let cx = 0, cy = 0; al.forEach((o) => { cx += o.x; cy += o.y; }); cx /= al.length; cy /= al.length;
  if (Math.hypot(cx - u.x, cy - u.y) > 36) steer(u, cx - 20, cy, sp, dt);
}
function thinkUnit(u: any, dt: number) {
  const r = G.run; u.lootP = null; const sp = spdOf(u), [e1, d1] = nearestEnemy(u);
  if (u.focus && u.focus.dead) u.focus = null; if (u.focusObj && u.focusObj.broken) u.focusObj = null;
  if (u.cmd === "auto" && u.hp < u.maxHp * 0.28 && e1 && d1 < 170 && u.fleeT <= 0) u.fleeT = 2.5;
  if (u.fleeT > 0) {
    u.fleeT -= dt;
    if (e1) { const tx = e1.x < u.x ? u.x + 70 : u.x - 70; if (tx < r.camX + 22 || tx > r.camX + LW - 22) { u.fleeT = 0; } else { steer(u, tx, u.y, sp * 1.15, dt); return; } }
    else u.fleeT = 0;
  }
  if (u.cmd === "loot") {
    const p = u.cmdProp && !u.cmdProp.looted && !r.units.some((o: any) => o !== u && !o.dead && (o.lootP === u.cmdProp || o.lootShop === u.cmdProp)) ? u.cmdProp : nearLoot(u, true);
    if (p) { goLoot(u, p, dt, sp); return; } u.cmd = "auto"; u.cmdProp = null; G.uiDirty = true;
  }
  if (u.cmd === "follow") { if (e1 && d1 < 60) { fight(u, e1, dt, sp); return; } gather(u, dt, sp); return; }
  let tgt = u.focus || null; if (!tgt && e1 && (u.cmd === "attack" || d1 < 260)) tgt = e1;
  if (tgt) { fight(u, tgt, dt, sp); return; }
  if (u.focusObj) { fight(u, u.focusObj, dt, sp); return; }
  if (u.cmd === "auto") { const p = nearLoot(u, false); if (p) { goLoot(u, p, dt, sp); return; } const o = nearObj(u); if (o) { fight(u, o, dt, sp); return; } }
  march(u, dt, sp);
}
function physics(a: any, dt: number) {
  const r = G.run; a.x += a.kx * dt; a.y += a.ky * dt; const f = Math.exp(-9 * dt); a.kx *= f; a.ky *= f;
  if (a.state === "loot") {
    a.y = clamp(a.y, 127, 258);
  } else if (!a.dead && a.y < 150) {
    if (a.exitDoorX != null && Math.abs(a.x - a.exitDoorX) > 2 && a.y < 145) {
      const dx = a.exitDoorX - a.x;
      a.x += Math.sign(dx) * Math.min(Math.abs(dx), 95 * dt);
    }
    a.y = Math.min(150, a.y + 88 * dt);
    a.moveT = 0.08;
    a.moving = true;
    if (a.y >= 150) a.exitDoorX = null;
  } else {
    a.y = clamp(a.y, 150, 258);
  }
  if (a.team === 0) a.x = clamp(a.x, r.camX + 10, r.camX + LW - 10);
  else { if (!a.inside) { if (a.x > r.camX + 10 && a.x < r.camX + LW - 10) a.inside = true; } else a.x = clamp(a.x, r.camX + 6, r.camX + LW - 6); }
}
function commonTimers(a: any, dt: number) {
  a.moveT = Math.max(0, (a.moveT || 0) - dt);
  a.moving = a.moveT > 0;
  a.busy = false; a.anim += dt; a.flash = Math.max(0, a.flash - dt); a.atkCd -= dt; a.armorT -= dt; a.combatT -= dt;
}
function runState(a: any, dt: number, think: (a: any, dt: number) => void) {
  switch (a.state) {
    case "down": a.st -= dt; a.downT += dt; a.moveT = 0; a.moving = false; if (a.st <= 0) a.state = "idle"; break;
    case "hurt": a.st -= dt; a.moveT = 0; a.moving = false; if (a.st <= 0) a.state = "idle"; break;
    case "attack":
      a.st += dt; a.moveT = 0; a.moving = false;
      if (a.atkT && a.atkT.kind === "obj") a.busy = true;
      if (!a.hitDone && a.st >= a.atkDur * 0.4) { a.hitDone = true; resolveHit(a); }
      if (a.st >= a.atkDur) a.state = "idle";
      break;
    case "loot": {
      const p = a.lootShop || a.lootP;
      a.lootP = p;
      const total = BAL.LOOT_TIME / CLASSES[a.cls].loot;
      a.lootT += dt;
      const prog = clamp(a.lootT / total, 0, 1);
      const sp = spdOf(a);
      if (p) {
        const side = (a.id & 1) ? -1 : 1;
        const insideX = p.type === "charge" ? p.x + side * 14 : p.x + side * 34;
        const insideY = p.type === "charge" ? 133 : 132;
        let tx = p.x, ty = 148;
        if (prog < 0.16) {
          tx = p.x; ty = insideY;
        } else if (prog < 0.74) {
          tx = insideX; ty = insideY;
        } else if (prog < 0.86) {
          tx = p.x; ty = insideY + 2;
        } else {
          tx = p.x; ty = 150;
        }
        const d = Math.hypot(tx - a.x, ty - a.y);
        if (d > 1.8) {
          const step = Math.min(d, sp * 1.15 * dt);
          a.x += ((tx - a.x) / d) * step;
          a.y += ((ty - a.y) / d) * step;
          if (Math.abs(tx - a.x) > 1.2) a.face = tx > a.x ? 1 : -1;
          else a.face = prog >= 0.90 ? 1 : -1;
          a.moveT = 0.08;
          a.moving = true;
        } else {
          a.moveT = 0;
          a.moving = false;
          a.face = prog >= 0.74 ? 1 : -side;
          if (prog >= 0.16 && prog < 0.74 && Math.random() < dt * 11) {
            part(a.x + rnd(-6, 6), a.y, 16, rnd(-26, 26), rnd(-10, 10), rnd(20, 50), 0.26, pick(["#6fe0e6", "#ffe080"]), 1, 200);
          }
        }
      }
      if (a.lootT >= total && (a.y >= 146 || a.lootT >= total + 0.45)) {
        if (a.y < 148) a.y = 148;
        finishLoot(a);
      }
      break;
    }
    default: think(a, dt);
  }
}
function updateUnit(u: any, dt: number) {
  commonTimers(u, dt);
  if (u.dead) { u.deadT += dt; u.downT += dt; physics(u, dt); return; }
  if (u.s.regen && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.s.regen * dt);
  if (u.combatT <= 0 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.012 * dt);
  runState(u, dt, thinkUnit); physics(u, dt);
}
function thinkEnemy(e: any, dt: number) {
  const r = G.run; let t = e.tgt; if (t && t.dead) t = null; e.retgt -= dt;
  if (!t || e.retgt <= 0) {
    e.retgt = rnd(0.6, 1.4); let best = 1e9; t = null;
    for (const u of r.units) { if (u.dead) continue; const ey = u.state === "loot" && u.y < 150 ? 150 : u.y; const d = Math.hypot(u.x - e.x, (ey - e.y) * 1.4) + (u.state === "loot" ? -30 : 0); if (d < best) { best = d; t = u; } }
    e.tgt = t;
  }
  if (t) fight(e, t, dt, e.s.spd);
}
function updateEnemy(e: any, dt: number) { commonTimers(e, dt); if (e.dead) { e.deadT += dt; e.downT += dt; physics(e, dt); return; } runState(e, dt, thinkEnemy); physics(e, dt); }
function separate(dt: number) {
  const r = G.run, all: any[] = [];
  for (const a of r.units) if (!a.dead && a.state !== "down" && a.state !== "loot") all.push(a);
  for (const a of r.enemies) if (!a.dead && a.state !== "down") all.push(a);
  const f = 18 * dt;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = a.x - b.x, dy = a.y - b.y;
    const minX = a.team === b.team ? 11 : 6, minY = a.team === b.team ? 5 : 3;
    if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
      const sx = (dx === 0 ? (a.id > b.id ? 1 : -1) : dx > 0 ? 1 : -1);
      const sy = dy >= 0 ? 1 : -1;
      a.x += sx * f; b.x -= sx * f;
      a.y += sy * f * 0.65; b.y -= sy * f * 0.65;
    }
  }
}

/* ======================= ГРАЖДАНСКИЕ (мирные жители) ======================= */
function spawnCiv(initial = false) {
  const r = G.run, fromRight = initial ? Math.random() < 0.5 : Math.random() < 0.7;
  const dir = fromRight ? -1 : 1, x = fromRight ? r.camX + LW + 16 : r.camX - 16;
  const y = Math.random() < 0.6 ? rnd(152, 176) : rnd(176, 250);
  const c: any = {
    id: r.uid++, team: 2, civ: true, look: pick(CIV_LOOKS), x, y, kx: 0, ky: 0, face: dir, dir, state: "walk", st: 0, spd: rnd(17, 27),
    panic: 0, anim: rnd(0, 4), moving: false, flash: 0, dead: false, deadT: 0, downT: 0, idleT: rnd(1.5, 5), pauseT: 0, shouted: false, cowerT: 0, fleeDir: 0, tx: 0,
  };
  r.civs.push(c); return c;
}
export function civLogic(dt: number) {
  const r = G.run; r.civT -= dt; if (r.civT > 0) return;
  r.civT = rnd(2.4, 4.2);
  const target = r.demo ? 5 : clamp(Math.round(6 - r.heat * 1.1 - Math.max(0, r.t - 90) / 150), 1, 6);
  const near = r.civs.filter((c: any) => c.x > r.camX - 60 && c.x < r.camX + LW + 60).length;
  if (near < target) spawnCiv(false);
}
function threatFor(c: any): { x: number; y: number; d: number } | null {
  const r = G.run; let best: any = null;
  const consider = (x: number, y: number, rad: number) => { const d = Math.hypot(x - c.x, (y - c.y) * 1.4); if (d < rad && (!best || d < best.d)) best = { x, y, d }; };
  for (const a of r.alarms) consider(a.x, a.y, a.rad);
  for (const u of r.units) if (!u.dead && (u.state === "attack" || u.state === "loot" || u.combatT > 0)) consider(u.x, u.y, 150);
  for (const e of r.enemies) if (!e.dead && (e.state === "attack" || e.combatT > 0)) consider(e.x, e.y, 150);
  return best;
}
function updateCiv(c: any, dt: number) {
  c.moving = false; c.anim += dt; c.flash = Math.max(0, c.flash - dt);
  if (c.state === "down") { c.st -= dt; c.downT += dt; if (c.st <= 0) { c.state = "walk"; c.panic = 3; } physics2(c, dt); return; }
  const th = threatFor(c);
  if (th) {
    if (c.panic <= 0 && !c.shouted && Math.random() < 0.55) { addText(c.x, c.y - 52, pick(PANIC_SHOUTS), "#f0d890", 1); c.shouted = true; }
    c.panic = 2.6; c.fleeDir = c.x >= th.x ? 1 : -1; c.threatD = th.d;
  }
  if (c.panic > 0) {
    c.panic -= dt;
    if (c.state === "cower") { c.cowerT -= dt; if (c.cowerT <= 0) c.state = "walk"; physics2(c, dt); return; }
    if (c.threatD < 42 && Math.random() < dt * 0.9 && c.cowerT <= 0) { c.state = "cower"; c.cowerT = rnd(0.9, 1.6); c.cowerCd = 3; }
    const dir = c.fleeDir || c.dir; c.face = dir; c.x += dir * 82 * dt; c.y += Math.sin(c.anim * 3 + c.id) * 14 * dt; c.moving = true; c.state = c.state === "cower" ? "cower" : "run";
    if (c.panic <= 0) { c.state = "walk"; c.dir = dir; }
  } else {
    c.state = "walk"; c.shouted = false;
    if (c.pauseT > 0) { c.pauseT -= dt; c.state = "idle"; }
    else { c.idleT -= dt; if (c.idleT <= 0) { c.pauseT = rnd(1, 2.2); c.idleT = rnd(3, 7); } c.x += c.dir * c.spd * dt; c.face = c.dir; c.moving = true; }
  }
  physics2(c, dt);
}
function physics2(a: any, dt: number) { a.x += a.kx * dt; a.y += a.ky * dt; const f = Math.exp(-9 * dt); a.kx *= f; a.ky *= f; a.y = clamp(a.y, 150, 258); }
function updateCivs(dt: number) {
  const r = G.run; for (const c of r.civs) updateCiv(c, dt);
  r.civs = r.civs.filter((c: any) => c.x > r.camX - 90 && c.x < r.camX + LW + 90);
}

/* ====================== СПАВН И СОБЫТИЯ ====================== */
function pickType() {
  const r = G.run, st = starsNow(); if (r.t < BAL.GRACE) return "guard";
  const w: Record<string, number> = { guard: 10 }; if (r.t > 45) w.exo = st >= 2 ? 5 + st : r.t > 75 ? 3 : 0; if (st >= 2) w.agent = 4 + st * 2;
  if (st >= 4 && r.enemies.filter((e: any) => !e.dead && e.type === "trooper").length < 2) w.trooper = 2 + (st - 3) * 3;
  let tot = 0; for (const k in w) tot += w[k]; let x = Math.random() * tot; for (const k in w) { x -= w[k]; if (x <= 0) return k; } return "guard";
}
function spawnEnemy(type: string, side: number) {
  const r = G.run; let x = r.camX + LW + 18, face = -1; if (side < 0 && r.camX > 30) { x = r.camX - 18; face = 1; }
  const e = mkEnemy(type, x, rnd(152, 252)); e.face = face; r.enemies.push(e); return e;
}
function spawnLogic(dt: number) {
  const r = G.run, st = starsNow(), grace = r.t < BAL.GRACE, al = aliveUnits().length, alive = r.enemies.filter((e: any) => !e.dead).length;
  const maxE = grace ? 2 : Math.round(3 + st * 1.4 + (al - 1) * 0.6 + Math.min(3, (r.t - BAL.GRACE) / 90));
  r.spawnT -= dt;
  if (r.spawnT <= 0) {
    r.spawnT = Math.max(1.8, (grace ? 9 : 8) * Math.pow(0.8, st - 1) * rnd(0.8, 1.2));
    if (alive < maxE) { const n = st >= 3 && Math.random() < 0.4 ? 2 : 1; for (let i = 0; i < n; i++) spawnEnemy(pickType(), Math.random() < 0.2 ? -1 : 1); }
  }
}
function eventLogic(dt: number) {
  const r = G.run; if (r.t < 45) return; r.eventT -= dt; if (r.eventT > 0) return; r.eventT = rnd(28, 42);
  const st = starsNow(), w: [string, number][] = [["ambush", 3], ["stash", 2]]; if (st >= 2) w.push(["raid", 3]);
  let tot = 0; w.forEach((a) => (tot += a[1])); let x = Math.random() * tot, ev = "ambush"; for (const a of w) { x -= a[1]; if (x <= 0) { ev = a[0]; break; } }
  if (ev === "ambush") { toast("ЗАСАДА СБ! Патруль Agogee со всех сторон"); for (let i = 0; i < 3; i++) spawnEnemy("guard", i === 2 ? -1 : 1); }
  else if (ev === "raid") { toast("РЕЙД INTERCELL! Агенты на подходе"); Snd.siren(1.4); alarm(r.camX + LW / 2, 200, 500, 3); spawnEnemy("agent", 1); spawnEnemy("agent", -1); if (st >= 4) spawnEnemy("trooper", 1); }
  else { const v = rint(20, 40); toast("ТАЙНИК КУРЬЕРА! +" + DL + v); earn(v, r.camX + LW / 2, 170, null); if (Math.random() < 0.5) dropItem(r.camX + LW / 2, 170); }
}

/* ============================ ШАГ ЗАБЕГА ============================ */
export function startEnding(type: string) {
  const r = G.run; if (r.ending) return; r.ending = { type, t: 0, done: false };
  if (type === "arrest") { Snd.arrest(); toast("ЗАДЕРЖАНЫ СЛУЖБОЙ БЕЗОПАСНОСТИ!"); } else { Snd.hire(); toast("ВЫ УШЛИ С ДОБЫЧЕЙ!"); }
}
function stepEnding(dt: number) {
  const r = G.run, en = r.ending; en.t += dt;
  for (const u of r.units) { u.anim += dt; u.flash = Math.max(0, u.flash - dt); if (u.dead) { u.deadT += dt; u.downT += dt; continue; } if (en.type === "escape") { u.state = "idle"; u.x += 140 * dt; u.face = 1; u.moving = true; } }
  for (const e of r.enemies) { e.anim += dt; e.flash = Math.max(0, e.flash - dt); if (e.dead) { e.deadT += dt; e.downT += dt; } }
  for (const c of r.civs) { c.anim += dt; }
  if (en.t > (en.type === "arrest" ? 2.4 : 1.7) && !en.done) { en.done = true; hooks.finishRun(en.type); }
}
export function stepRun(dt: number) {
  const r = G.run; if (G.hitStop > 0) { G.hitStop -= dt; return; }
  r.t += dt;
  if (r.ending) { stepEnding(dt); updateFx(dt); return; }
  ensureChunks(); spawnLogic(dt); eventLogic(dt); civLogic(dt);
  for (const u of r.units) updateUnit(u, dt);
  for (const e of r.enemies) updateEnemy(e, dt);
  updateCivs(dt);
  separate(dt); updateProjs(dt); updateProps(dt); updateFx(dt);
  const before = r.units.length; r.units = r.units.filter((u: any) => !(u.dead && u.deadT > 1.6)); if (r.units.length !== before) G.uiDirty = true;
  r.enemies = r.enemies.filter((e: any) => !(e.dead && e.deadT > 1.2));
  if (r.sel !== null && !r.units.some((u: any) => u.id === r.sel && !u.dead)) { const n = aliveUnits()[0]; r.sel = n ? n.id : null; G.uiDirty = true; }
  const clear = !r.enemies.some((e: any) => !e.dead && Math.abs(e.x - r.front) < 300);
  const busy = r.units.some((u: any) => !u.dead && (u.state === "loot" || u.lootP || u.busy));
  if (clear && !busy) { const dx = BAL.MARCH * dt; r.front += dx; addHeat((dx / BAL.PX_PER_M) * 0.005); }
  r.distM = Math.max(r.distM, Math.floor((r.front - 100) / BAL.PX_PER_M));
  const target = r.front - 150; r.camX = Math.max(r.camX, r.camX + (target - r.camX) * Math.min(1, dt * 3));
  const st = starsNow();
  if (st > r.starsPrev) { r.starsPrev = st; Snd.siren(1.4); alarm(r.camX + LW / 2, 200, 500, 3); toast("УРОВЕНЬ WARDEN: " + st + (WARDEN_NAMES[st] ? " — " + WARDEN_NAMES[st] : "")); r.spawnT = Math.min(r.spawnT, 2); }
  if (r.buff) { r.buff.t -= dt; if (r.buff.t <= 0) { r.buff = null; G.uiDirty = true; } }
  if (r.units.length && r.units.every((u: any) => u.dead)) startEnding("arrest");
}
export function demoStep(dt: number) {
  const r = G.run; r.camX += 24 * dt; r.front = r.camX + 150; ensureChunks();
  r.units.forEach((u: any, i: number) => {
    u.x = r.camX + 120 + i * 52;
    u.y = 180 + (i % 4) * 18;
    u.moving = true; u.moveT = 0.2; u.face = 1; u.anim += dt; u.state = "idle";
  });
  civLogic(dt); updateCivs(dt); updateFx(dt); updateProps(dt);
}
