/* Инвентарь, казино, найм, бизнесы, флоу меню/забега. */
import { BAL, DL, LW } from "./consts";
import { CLASSES, ITEMS, SYMS, SYM_W, SYMNAME, itemDesc } from "./content";
import { Snd } from "./audio";
import { G, meta, setMeta, defaultMeta, saveMeta, toast, notify, addText, aliveUnits, SAVEKEY } from "./state";
import { addUnit, dropItem, hooks, newRun, recalc, rollItem, startEnding, addItem } from "./sim";
import { rnd } from "./util";

/* ============================ ИНВЕНТАРЬ ============================ */
export function invClick(i: number) {
  const r = G.run, it = r.inv[i];
  if (G.selItem >= 0 && G.selItem !== i) {
    const s = r.inv[G.selItem];
    if (s && it && s.id === it.id && s.lv === it.lv && it.lv < 3) { it.lv++; r.inv[G.selItem] = null; G.selItem = -1; Snd.buy(); toast("ОБЪЕДИНЕНО: " + ITEMS[it.id].name + " Lv." + it.lv); return; }
    if (s && !it) { r.inv[i] = s; r.inv[G.selItem] = null; G.selItem = -1; Snd.click(); notify(); return; }
  }
  G.selItem = !it || G.selItem === i ? -1 : i; Snd.click(); notify();
}
export function equipItem(u: any, idx: number) {
  const r = G.run, it = r.inv[idx]; if (!it || !u || u.dead) return;
  const slot = ITEMS[it.id].slot, cur = u.eq[slot];
  if (cur && cur.id === it.id && cur.lv === it.lv && cur.lv < 3) { cur.lv++; r.inv[idx] = null; toast("УЛУЧШЕНО: " + ITEMS[cur.id].name + " Lv." + cur.lv); }
  else { u.eq[slot] = it; r.inv[idx] = cur || null; toast(u.name + ": " + ITEMS[it.id].name + " надето"); }
  G.selItem = -1; recalc(u); Snd.buy(); addText(u.x, u.y - 56, "НАДЕТО", "#9ad0e8", 1); notify();
}
export function unequip(slot: string) {
  const r = G.run, u = r.units.find((x: any) => x.id === r.sel); if (!u || u.dead) return;
  const it = u.eq[slot]; if (!it) return;
  if (!addItem(it)) { toast("Инвентарь полон"); Snd.bad(); return; }
  u.eq[slot] = null; recalc(u); Snd.click(); notify();
}
export function mergeAll() {
  const inv = G.run.inv; let any = false, again = true;
  while (again) {
    again = false;
    outer: for (let i = 0; i < inv.length; i++) for (let j = i + 1; j < inv.length; j++) {
      const a = inv[i], b = inv[j];
      if (a && b && a.id === b.id && a.lv === b.lv && a.lv < 3) { a.lv++; inv[j] = null; again = true; any = true; break outer; }
    }
  }
  G.selItem = -1; if (any) { Snd.buy(); toast("Одинаковые предметы объединены"); } else { Snd.bad(); toast("Нет пар для объединения"); }
}
export const marketPrice = () => BAL.MARKET + BAL.MARKET_STEP * G.run.market;
export function buyItem() {
  const r = G.run, p = marketPrice();
  if (r.cash < p) { toast("Не хватает кредитов: нужно " + DL + p); Snd.bad(); return; }
  if (!r.inv.some((x: any) => !x)) { toast("Инвентарь полон (6/6)"); Snd.bad(); return; }
  r.cash -= p; r.market++; const it = rollItem(); addItem(it); Snd.buy(); toast("Купил у перекупа: " + ITEMS[it.id].name + " Lv." + it.lv);
}
export function useMed() {
  const r = G.run, al = aliveUnits();
  if (r.cash < BAL.MED) { toast("Не хватает кредитов"); Snd.bad(); return; }
  if (!al.some((u) => u.hp < u.maxHp)) { toast("Все целы"); return; }
  r.cash -= BAL.MED; const p = BAL.CLINIC_POWER[r.biz.clinic];
  al.forEach((u) => { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.35 * p); addText(u.x, u.y - 56, "+HP", "#7fd8a8", 1); }); Snd.buy(); toast("Мед-пак: банда подлечена");
}
export function useStim() {
  const r = G.run;
  if (r.cash < BAL.STIM) { toast("Не хватает кредитов"); Snd.bad(); return; }
  r.cash -= BAL.STIM; const p = BAL.CLINIC_POWER[r.biz.clinic];
  r.buff = { t: 15 * p, dmg: 0.3 * (1 + (p - 1) * 0.5), spd: 0.15 * (1 + (p - 1) * 0.5) }; Snd.buy(); toast("Боевой стим! Урон и скорость банды растут");
}

/* ============================== КАЗИНО ============================== */
export const Casino: any = {
  spinning: false, reels: [{ pos: 0, stopAt: 0, stopped: true, spd: 0, lt: 0 }, { pos: 2, stopAt: 0, stopped: true, spd: 0, lt: 0 }, { pos: 3, stopAt: 0, stopped: true, spd: 0, lt: 0 }],
  res: [0, 2, 3], t: 0, cost: 0, flash: 0, msg: "Три в ряд — джекпот!",
};
export const spinCost = () => BAL.SPIN_BASE + BAL.SPIN_STEP * Math.floor(G.run.spins / BAL.SPIN_EVERY);
function setMsg(t: string) { Casino.msg = t; }
function rollSym() { let x = Math.random() * SYM_W.reduce((a, b) => a + b, 0); for (let i = 0; i < SYM_W.length; i++) { x -= SYM_W[i]; if (x <= 0) return i; } return 0; }
export function spin() {
  const r = G.run; if (Casino.spinning || G.mode !== "run" || r.ending) return; const cost = spinCost();
  if (r.cash < cost) { toast("Не хватает кредитов на спин: " + DL + cost); Snd.bad(); return; }
  r.cash -= cost; r.spins++; Casino.cost = cost; Casino.spinning = true; Casino.t = 0; Casino.flash = 0; Casino.res = [rollSym(), rollSym(), rollSym()];
  Casino.reels.forEach((re: any, i: number) => { re.stopAt = 0.9 + i * 0.5; re.stopped = false; re.spd = 13 + i * 2; re.lt = 0; }); setMsg("Крутим..."); Snd.tick(); notify();
}
export function casinoUpdate(dt: number) {
  const C = Casino; if (C.flash > 0) C.flash -= dt; if (!C.spinning) return;
  if (G.mode !== "run") { C.spinning = false; return; }
  C.t += dt; let all = true;
  C.reels.forEach((re: any, i: number) => {
    if (re.stopped) return; all = false;
    if (C.t >= re.stopAt) { re.stopped = true; re.pos = C.res[i]; Snd.stop(); }
    else { re.pos = (re.pos + re.spd * dt) % 6; if (i === 0) { const k = Math.floor(re.pos * 2); if (k !== re.lt) { re.lt = k; Snd.tick(); } } }
  });
  if (all) { C.spinning = false; payout(); notify(); }
}
function payout() {
  const r = G.run, C = Casino, a = C.res[0], b = C.res[1], c = C.res[2], cost = C.cost;
  if (a === b && b === c) return jackpot(a, cost);
  if (a === b || b === c || a === c) {
    const s = a === b ? a : b === c ? b : a, m = [1.1, 1.7, 2.0, 1.5, 1.1, 1.1][s], v = Math.round(cost * m);
    r.cash += v; C.flash = 0.9; setMsg("Пара (" + SYMNAME[s] + "): +" + DL + v); Snd.coin(); Snd.coin(); return;
  }
  setMsg("Мимо. −" + DL + cost); Snd.lose();
}
function jackpot(s: number, cost: number) {
  const r = G.run, C = Casino; C.flash = 2.5; Snd.win(); G.shake = Math.max(G.shake, 3); let m = ""; const cx = r.camX + LW / 2;
  switch (SYMS[s]) {
    case "chip": { const v = cost * 6; r.cash += v; m = "ДЖЕКПОТ: ЧИПЫ! +" + DL + v; break; }
    case "credit": { const v = cost * 10; r.cash += v; m = "ДЖЕКПОТ: КРЕДИТЫ! +" + DL + v; break; }
    case "stim": { r.buff = { t: 40, dmg: 0.35, spd: 0.2 }; aliveUnits().forEach((u) => { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.25); }); m = "ДЖЕКПОТ: СТИМ! Банда в ударе 40с + лечение"; break; }
    case "shock": { dropItem(cx, 170); m = "ДЖЕКПОТ: МОНТИРОВКА! Выпала экипировка"; break; }
    case "ice": { dropItem(cx, 170, 2); r.rep += 2; m = "ДЖЕКПОТ: ICE-КАРТА! Предмет Lv.2+ и +2 REP"; break; }
    case "seven": { const v = cost * 12; r.cash += v; dropItem(cx, 170, 2); r.rep += 3; m = "ДЖЕКПОТ: 777! +" + DL + v + ", предмет Lv.2+, +3 REP"; break; }
  }
  setMsg(m); toast(m); addText(cx, 150, "ДЖЕКПОТ!", "#f0c850", 3);
}

/* ============================ МЕТА-ПРОГРЕСС ============================ */
export function launder(dist: number, loot: number, kills: number, arrested: boolean, biz: any) {
  const keep = arrested ? BAL.ARREST_KEEP[biz.laundry] : 1;
  const d = dist * BAL.LAUNDER.dist, l = loot * BAL.LAUNDER.loot * keep, k = kills * BAL.LAUNDER.kill;
  return { d, l, k, keep, total: Math.floor(d + l + k) };
}
hooks.finishRun = (type: string) => {
  const r = G.run, L = launder(r.distM, r.cashLooted, r.kills, type === "arrest", r.biz);
  meta.laundered += L.total; meta.total += L.total; meta.runs++; meta.bestDist = Math.max(meta.bestDist, r.distM); saveMeta();
  G.mode = "results"; G.selItem = -1; G.escArm = 0; Casino.spinning = false;
  G.modal = { type: "results", data: { type, L } }; notify();
};
export function bizBuy(id: string) {
  const l = meta.biz[id]; if (l >= 3) return; const cost = BAL.UPG[l];
  if (meta.laundered < cost) { Snd.bad(); return; }
  meta.laundered -= cost; meta.biz[id] = l + 1; saveMeta(); Snd.buy(); notify();
}

/* ================================ НАЙМ ================================ */
export function hire(cls: string) {
  const r = G.run, C = CLASSES[cls]; if (C.needClinic && r.biz.clinic < C.needClinic) return;
  if (aliveUnits().length >= r.limit) { toast("Лимит банды достигнут"); Snd.bad(); return; }
  if (r.rep < C.cost) { toast("Не хватает REP"); Snd.bad(); return; }
  r.rep -= C.cost; const u = addUnit(cls, r.camX + 16, rnd(170, 240)); r.sel = u.id; Snd.hire(); addText(u.x + 20, u.y - 50, "НОВЫЙ!", "#e0a43a", 1); toast("Нанят: " + u.name + " (" + C.name + ")"); notify();
}

/* ============================== ФЛОУ ============================== */
export function showMenu() {
  G.modal = null; G.mode = "menu"; G.paused = false; G.selItem = -1; newRun(true); notify();
}
export function startRun() {
  G.modal = null; newRun(false); G.mode = "run"; G.paused = false; G.speed = 1; G.selItem = -1; G.hitStop = 0; G.shake = 0; G.escArm = 0;
  Casino.spinning = false; Casino.reels.forEach((r: any) => (r.stopped = true)); setMsg("Три в ряд — джекпот!"); toast("НОВЫЙ ЗАБЕГ — ДЕРЖИТЕСЬ ВМЕСТЕ!");
}
export function resetProgress() {
  try { localStorage.removeItem(SAVEKEY); } catch { /* ignore */ }
  const sound = meta.sound; setMeta({ ...defaultMeta(), sound }); saveMeta(); showMenu();
}
export const openModal = (type: string) => { G.modal = { type }; notify(); };
export const closeModal = () => { G.modal = null; notify(); };
export function togglePause() { if (G.mode !== "run") return; G.paused = !G.paused; notify(); }
export function toggleSound() { meta.sound = !meta.sound; Snd.on = meta.sound; if (Snd.ctx) Snd.setOn(meta.sound); saveMeta(); notify(); }
export function toggleSpeed() { G.speed = G.speed === 1 ? 2 : 1; Snd.click(); notify(); }
export function onEscape() {
  const r = G.run; if (G.mode !== "run" || r.ending) return;
  if (G.escArm > 0) { G.escArm = 0; startEnding("escape"); } else { G.escArm = 3; toast("Нажми ещё раз, чтобы уйти с добычей"); }
  notify();
}
export function selectUnit(id: number) {
  const r = G.run, u = r.units.find((x: any) => x.id === id); if (!u || u.dead) return;
  if (G.selItem >= 0) { equipItem(u, G.selItem); return; } r.sel = id; Snd.click(); notify();
}
export function setCmd(c: string) {
  const r = G.run, u = r.units.find((x: any) => x.id === r.sel); if (!u || u.dead) return;
  u.cmd = c; u.focus = null; u.focusObj = null; u.cmdProp = null; u.fleeT = 0; Snd.click();
  addText(u.x, u.y - 56, ({ attack: "АТАКА", loot: "ВСКРЫТЬ", follow: "ЗА МНОЙ", auto: "АВТО" } as any)[c], "#e0a43a", 1); notify();
}
export { itemDesc };
