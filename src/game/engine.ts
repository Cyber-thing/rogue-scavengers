/* Главный цикл, ввод, мост между игрой и React. */
import { BAL, H, K, W } from "./consts";
import { G, aliveUnits, addText, loadMeta, meta, notify, updateFx } from "./state";
import { Snd } from "./audio";
import { demoStep, stepRun } from "./sim";
import { render } from "./render";
import { initArt } from "./art/world";
import { iconCanvas } from "./art/props";
import { SYMS } from "./content";
import { Casino, casinoUpdate, closeModal, selectUnit, setCmd, showMenu, toggleSound, togglePause } from "./economy";
import { clamp } from "./util";

let ctx: CanvasRenderingContext2D | null = null;
let slotCtx: CanvasRenderingContext2D | null = null;
export function setArena(c: HTMLCanvasElement | null) { ctx = c ? c.getContext("2d") : null; }
export function setSlot(c: HTMLCanvasElement | null) { slotCtx = c ? c.getContext("2d") : null; }

/* ---------- казино: рисуем барабаны ---------- */
function drawCasino() {
  const g = slotCtx; if (!g) return; const C = Casino;
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#06090d"; g.fillRect(0, 0, 180, 56);
  for (let i = 0; i < 3; i++) {
    const x = i * 62, re = C.reels[i];
    g.fillStyle = "#141c26"; g.fillRect(x, 0, 56, 56);
    g.save(); g.beginPath(); g.rect(x + 3, 3, 50, 50); g.clip();
    const k = Math.floor(re.pos), fr = re.pos - k, y0 = Math.round(fr * 56);
    g.drawImage(iconCanvas(SYMS[k % 6]), x + 4, y0 + 4, 48, 48);
    g.drawImage(iconCanvas(SYMS[(k + 1) % 6]), x + 4, y0 + 4 - 56, 48, 48);
    g.restore();
    const fl = C.flash > 0 && ((G.t * 8) | 0) % 2 === 0;
    g.fillStyle = fl ? "#ffe9a8" : "#b8862e"; g.fillRect(x, 0, 56, 2); g.fillRect(x, 54, 56, 2); g.fillRect(x, 0, 2, 56); g.fillRect(x + 54, 0, 2, 56);
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x + 3, 3, 50, 8); g.fillRect(x + 3, 45, 50, 8);
  }
  g.fillStyle = "rgba(111,224,230,.5)"; g.fillRect(0, 27, 180, 2);
}

/* ---------- ввод по арене ---------- */
export function arenaMouse(e: MouseEvent, cv: HTMLCanvasElement) {
  Snd.init(); Snd.resume();
  const r = G.run; if (G.mode !== "run" || G.modal || r.ending) return;
  const rc = cv.getBoundingClientRect();
  const wx = ((e.clientX - rc.left) * W / rc.width + Math.round(r.camX * K)) / K, wy = ((e.clientY - rc.top) * H / rc.height) / K;
  const pickF = (list: any[]) => { let b: any = null; for (const o of list) { if (o.dead) continue; if (Math.abs(wx - o.x) <= 15 && wy >= o.y - 54 && wy <= o.y + 6 && (!b || o.y > b.y)) b = o; } return b; };
  const u = pickF(r.units); if (u) { selectUnit(u.id); return; }
  const sel = r.units.find((x: any) => x.id === r.sel && !x.dead); if (G.selItem >= 0 && !u) { G.selItem = -1; notify(); return; }
  if (!sel) return;
  const en = pickF(r.enemies); if (en) { sel.focus = en; sel.cmd = "attack"; addText(en.x, en.y - 70, "ЦЕЛЬ", "#d9605a", 1); Snd.click(); notify(); return; }
  for (const o of r.props) {
    if (o.kind !== "obj" || o.broken) continue; const car = o.type === "car";
    if (Math.abs(wx - o.x) <= (car ? 42 : 13) && wy >= o.y - (car ? 34 : 50) && wy <= o.y + 5) { sel.focusObj = o; sel.focus = null; sel.cmd = "auto"; addText(o.x, o.y - 50, "СЛОМАТЬ?", "#e0a43a", 1); Snd.click(); return; }
  }
  for (const p of r.props) {
    if (p.kind !== "shop" || p.looted) continue;
    if (Math.abs(wx - p.x) <= 44 && wy >= 44 && wy <= 152) { sel.cmd = "loot"; sel.cmdProp = p; sel.focus = null; sel.focusObj = null; addText(p.x, 100, "ВСКРЫТЬ", "#e0a43a", 1); Snd.click(); notify(); return; }
  }
}

function onKey(e: KeyboardEvent) {
  Snd.init(); Snd.resume(); if (e.repeat) return;
  if (e.code === "Escape" && G.modal && G.mode !== "results") { closeModal(); return; }
  if (G.mode !== "run" || G.modal) return;
  const c = e.code;
  if (c === "Space") { e.preventDefault(); togglePause(); return; }
  if (c === "KeyM") { toggleSound(); return; }
  if (/^Digit[1-5]$/.test(c)) { const u = aliveUnits()[+c.slice(5) - 1]; if (u) selectUnit(u.id); return; }
  if (c === "KeyA") setCmd("attack"); else if (c === "KeyL") setCmd("loot"); else if (c === "KeyF") setCmd("follow"); else if (c === "KeyQ") setCmd("auto");
}

/* ---------- главный цикл ---------- */
let lastT = 0, acc = 0, lastN = 0, started = false;
function frame(ts: number) {
  requestAnimationFrame(frame);
  const real = Math.min(0.1, Math.max(0, (ts - lastT) / 1000) || 0); lastT = ts; G.t += real; G.shake = Math.max(0, G.shake - real * 18);
  if (G.escArm > 0) G.escArm = Math.max(0, G.escArm - real);
  const frozen = G.paused || G.modal;
  if (G.mode === "run" && !frozen) {
    acc += real * G.speed; let n = 0;
    while (acc >= BAL.STEP && n < 12 && G.mode === "run") { stepRun(BAL.STEP); acc -= BAL.STEP; n++; }
    if (n >= 12) acc = 0;
  } else if (G.mode === "menu") demoStep(real);
  else if (G.mode === "results") updateFx(real);
  casinoUpdate(real);
  if (ctx) render(ctx);
  drawCasino();
  if (ts - lastN > 100) { lastN = ts; notify(); }
}
export async function initGame() {
  if (started) return; started = true;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('8px "Press Start 2P"', "Аа1"), document.fonts.load('16px "Press Start 2P"', "Аа1"), document.fonts.load('600 14px "Tektur"', "Аа1"), document.fonts.load('500 12px "IBM Plex Mono"', "Аа1")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* шрифты не критичны */ }
  loadMeta(); Snd.on = meta.sound; initArt(); showMenu();
  document.addEventListener("keydown", onKey);
  document.addEventListener("pointerdown", () => { Snd.init(); Snd.resume(); }, { once: false });
  G.ready = true; notify(); requestAnimationFrame(frame);
}
export { clamp };
