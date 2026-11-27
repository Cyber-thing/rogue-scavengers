/* ======================================================================
   РЕНДЕР арены: 640×360, пиксельный. Параллакс → фасады → улица →
   сущности → эффекты → неоновое освещение → дождь → виньетка → тексты.
   ====================================================================== */
import { W, H, K, CHPX, BAL } from "./consts";
import { G, starsNow } from "./state";
import { getSprite, OX, OY } from "./art/characters";
import { propSprite } from "./art/props";
import { art, farBeacons, farLogos, LAYER_W, PF } from "./art/world";
import { CLASSES } from "./content";
import { clamp, rnd } from "./util";

const GY = 176;      // тротуар
const ROAD = 218;    // начало дороги

export function poseOf(u: any): [string, number] {
  if (u.dead) return ["down", 1];
  switch (u.state) {
    case "down": return ["down", u.downT < 0.12 ? 0 : 1];
    case "hurt": return ["hurt", 0];
    case "attack": return ["attack", u.st < u.atkDur * 0.45 ? 0 : u.st < u.atkDur * 0.75 ? 1 : 2];
    case "loot": return ["loot", ((G.t * 5) | 0) & 1];
    case "cower": return ["cower", 0];
    case "run": return ["run", ((u.anim * 12) | 0) & 3];
  }
  if (u.moving) return ["walk", ((u.anim * 9) | 0) & 3];
  return ["idle", ((G.t * 2 + u.id) | 0) & 1];
}
export const lookOf = (u: any) => (u.civ ? u.look : u.team === 0 ? u.cls : u.type);
const HEIGHT: Record<string, number> = { hulk: 76, exo: 84, trooper: 76, rat: 64, runner: 68, cutter: 66, guard: 70, agent: 70 };

const sxOf = (x: number, cam: number) => Math.round(x * K) - cam;
const syOf = (y: number) => Math.round(y * K);

function txt(g: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, size: number, center = true, out = "#0a0d12") {
  g.font = `${size}px ${PF}`; g.textBaseline = "top"; g.textAlign = center ? "center" : "left";
  g.lineJoin = "round"; g.lineWidth = Math.max(2, size / 4); g.strokeStyle = out; g.strokeText(s, x, y);
  g.fillStyle = col; g.fillText(s, x, y);
}
function shadow(g: CanvasRenderingContext2D, x: number, y: number, w: number) {
  g.fillStyle = "rgba(0,0,0,.42)";
  const rows = [0.5, 0.85, 1, 0.85, 0.5];
  rows.forEach((f, i) => { const ww = Math.round(w * f); g.fillRect(Math.round(x - ww / 2), Math.round(y - 2 + i), ww, 1); });
}
function drawLayer(g: CanvasRenderingContext2D, l: HTMLCanvasElement, f: number, y: number, cam: number) {
  const o = -(((cam * f) % LAYER_W) + LAYER_W) % LAYER_W;
  g.drawImage(l, Math.round(o), y); g.drawImage(l, Math.round(o) + LAYER_W, y);
}

/* ---------- небо + воздушный трафик ---------- */
function drawSky(g: CanvasRenderingContext2D, cam: number) {
  g.fillStyle = "#0a0d12"; g.fillRect(0, 0, W, H);
  g.drawImage(art.sky, 0, 0);
  drawLayer(g, art.far, 0.06, 0, cam);
  const o = -(((cam * 0.06) % LAYER_W) + LAYER_W) % LAYER_W;
  for (const b of farBeacons) for (const off of [0, LAYER_W]) { const x = Math.round(b[0] + o + off); if (x < -4 || x > W + 4) continue; if (Math.sin(G.t * 2.2 + b[0]) > 0.55) { g.fillStyle = "#e0584a"; g.fillRect(x, b[1], 2, 2); g.fillStyle = "rgba(224,88,74,.25)"; g.fillRect(x - 2, b[1] - 2, 6, 6); } }
  /* голо-логотипы на башнях */
  g.globalCompositeOperation = "lighter";
  for (const l of farLogos) for (const off of [0, LAYER_W]) { const x = l[0] + o + off; if (x < -30 || x > W + 30) continue; const gr = g.createRadialGradient(x, l[1], 2, x, l[1], 34); gr.addColorStop(0, "rgba(220,130,60,.30)"); gr.addColorStop(1, "rgba(220,130,60,0)"); g.fillStyle = gr; g.fillRect(x - 34, l[1] - 34, 68, 68); }
  g.globalCompositeOperation = "source-over";
  /* дирижабль-реклама */
  const bx = ((G.t * 5 + 300) % (W + 360)) - 180, by = 54 + Math.sin(G.t * 0.4) * 3;
  g.fillStyle = "#1c2632"; g.beginPath(); g.ellipse(bx, by, 62, 16, 0, 0, 7); g.fill();
  g.fillStyle = "#2a3846"; g.beginPath(); g.ellipse(bx, by - 4, 56, 9, 0, 0, 7); g.fill();
  g.fillStyle = "#10161e"; g.fillRect(bx - 12, by + 14, 24, 5);
  g.fillStyle = "#0a0d12"; g.fillRect(bx - 38, by - 7, 76, 12); g.fillStyle = "#1a2e30"; g.fillRect(bx - 37, by - 6, 74, 10);
  txt(g, "AGOGEE", bx, by - 5, "#7fd0c4", 8, true, "#0a0d12");
  if (Math.sin(G.t * 3) > 0) { g.fillStyle = "#e0584a"; g.fillRect(bx + 56, by - 1, 2, 2); }
  /* летающие машины */
  for (let i = 0; i < 4; i++) {
    const dir = i & 1 ? -1 : 1, sp = 22 + i * 9, ph = i * 233, ly = 22 + i * 17 + (i & 1) * 20;
    let x = (G.t * sp + ph) % (W + 140) - 70; if (dir < 0) x = W - x;
    g.fillStyle = "#0e141c"; g.fillRect(Math.round(x) - 7, ly, 14, 3); g.fillRect(Math.round(x) - 4, ly - 2, 8, 2);
    g.fillStyle = dir > 0 ? "#fff0b0" : "#e0584a"; g.fillRect(Math.round(x) + (dir > 0 ? 6 : -7), ly + 1, 2, 1);
    g.fillStyle = "rgba(111,224,230,.5)"; g.fillRect(Math.round(x) - dir * 4, ly + 3, 6, 1);
    g.fillStyle = "rgba(111,224,230,.12)"; g.fillRect(Math.round(x) - dir * 20, ly + 2, 18, 2);
  }
  drawLayer(g, art.mid, 0.22, 0, cam);
}

/* ---------- улица ---------- */
function drawGround(g: CanvasRenderingContext2D, cam: number, r: any) {
  g.fillStyle = "#39414b"; g.fillRect(0, GY, W, 32);
  g.fillStyle = "#5c6976"; g.fillRect(0, GY, W, 2); g.fillStyle = "#2c333c"; g.fillRect(0, GY + 2, W, 1);
  for (let x = -(cam % 48); x < W; x += 48) { g.fillStyle = "#2b323b"; g.fillRect(Math.round(x), GY + 3, 1, 29); g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(Math.round(x) + 1, GY + 3, 1, 29); }
  g.fillStyle = "#30373f"; g.fillRect(0, GY + 16, W, 1);
  g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, GY + 26, W, 6);
  g.fillStyle = "#8a96a4"; g.fillRect(0, 208, W, 2); g.fillStyle = "#3d4550"; g.fillRect(0, 210, W, 6); g.fillStyle = "#1a1f26"; g.fillRect(0, 216, W, 2);
  for (let x = -(cam % 96); x < W; x += 96) { g.fillStyle = "#262c34"; g.fillRect(Math.round(x), 210, 2, 6); }
  const ox = -(cam % 128);
  for (let x = ox; x < W; x += 128) g.drawImage(art.asph, Math.round(x), ROAD);
  g.fillStyle = "#12161c"; g.fillRect(0, ROAD, W, 4);
  g.fillStyle = "rgba(168,138,62,.55)"; for (let x = -(cam % 112) - 112; x < W; x += 112) g.fillRect(Math.round(x), 296, 56, 3);
  g.fillStyle = "rgba(232,220,192,.10)"; g.fillRect(0, ROAD + 4, W, 1);
  /* лужи (отражают неон) */
  for (const k in r.chunks) {
    const ch = r.chunks[k], base = ch.x * K - cam; if (base < -CHPX || base > W + 10) continue;
    for (let q = 0; q < 3; q++) {
      const h = Math.abs(Math.sin((ch.i + 1) * 91.7 + q * 13.1)), h2 = Math.abs(Math.sin((ch.i + 3) * 37.1 + q * 7.3)), h3 = Math.abs(Math.sin((ch.i + 5) * 17.9 + q * 3.7));
      const cx = Math.round(base + 30 + h * (CHPX - 60)), cy = 238 + Math.round(h2 * 90), rx = 18 + Math.round(h3 * 28), ry = Math.max(3, Math.round(rx * 0.16));
      for (let j = -ry; j <= ry; j++) { const wd = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01))); g.fillStyle = "rgba(60,90,115,.45)"; g.fillRect(cx - wd, cy + j, wd * 2, 1); }
      g.fillStyle = `rgba(${ch.glow[0]},${ch.glow[1]},${ch.glow[2]},.22)`; g.fillRect(cx - (rx >> 1), cy - 1, rx, 1);
      g.fillStyle = "rgba(210,225,240,.14)"; g.fillRect(cx - rx + 4, cy - ry, (rx >> 1), 1);
    }
  }
}
/* пар из люков */
function drawSteam(g: CanvasRenderingContext2D, cam: number, r: any) {
  for (const k in r.chunks) {
    const ch = r.chunks[k]; if ((ch.i * 37) % 3 !== 0) continue;
    const vx = Math.round(ch.x * K - cam + 70 + ((ch.i * 53) % 190)), vy = 234;
    if (vx < -30 || vx > W + 30) continue;
    g.fillStyle = "#0c0f13"; g.fillRect(vx - 9, vy, 18, 4); g.fillStyle = "#3a424c"; g.fillRect(vx - 8, vy, 16, 1); g.fillStyle = "#1a1e24"; for (let i = -6; i <= 6; i += 3) g.fillRect(vx + i, vy + 1, 1, 2);
    for (let i = 0; i < 7; i++) {
      const t = ((G.t * 0.5 + i / 7 + ch.i * 0.13) % 1), s = 5 + t * 22, a = (1 - t) * 0.16;
      g.fillStyle = `rgba(190,205,215,${a})`; g.fillRect(Math.round(vx + Math.sin(i * 7 + G.t) * 5 * t - s / 2), Math.round(vy - t * 56 - s / 2), Math.round(s), Math.round(s * 0.8));
    }
  }
}
function drawShops(g: CanvasRenderingContext2D, cam: number, r: any) {
  for (const p of r.props) {
    if (p.kind !== "shop") continue;
    const x0 = Math.round(p.ch.x * K) - cam; if (x0 < -CHPX - 10 || x0 > W + 10) continue;
    const cx = Math.round(p.x * K) - cam;
    if (p.looted) {
      const z = p.ch.zone;
      g.fillStyle = "#3a414c"; g.fillRect(x0 + z[0], z[1], z[2], z[3]);
      g.fillStyle = "#262c34"; for (let y = z[1]; y < z[1] + z[3]; y += 3) g.fillRect(x0 + z[0], y, z[2], 1);
      g.fillStyle = "#566270"; g.fillRect(x0 + z[0], z[1] + z[3] - 4, z[2], 4); g.fillRect(x0 + z[0], z[1], z[2], 2);
      g.fillStyle = "#0a0d12"; g.fillRect(cx - 34, 144, 68, 16);
      txt(g, "ЗАКРЫТО", cx, 148, Math.sin(G.t * 3) > -0.6 ? "#d9605a" : "#7a3030", 8, true, "#0a0d12");
    } else {
      const y = Math.round(58 + Math.sin(G.t * 3 + p.x) * 3);
      g.fillStyle = "rgba(224,164,58,.10)"; g.fillRect(cx - 1, y + 14, 2, 70);
      for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(224,164,58,.5)"; g.fillRect(cx, y + 18 + k * 12 + (((G.t * 20) | 0) % 12), 1, 3); }
      g.fillStyle = "#0a0d12"; g.fillRect(cx - 9, y - 1, 18, 18);
      g.fillStyle = "#e0b440"; g.fillRect(cx - 8, y, 16, 16); g.fillStyle = "#f8dc80"; g.fillRect(cx - 7, y, 5, 2); g.fillStyle = "#a8742a"; g.fillRect(cx - 8, y + 14, 16, 2);
      g.fillStyle = "#3a2208"; g.fillRect(cx - 4, y + 3, 2, 4); g.fillRect(cx + 2, y + 3, 2, 4); g.fillRect(cx - 2, y + 7, 4, 2); g.fillRect(cx - 1, y + 9, 2, 5); g.fillRect(cx - 5, y + 10, 10, 1);
    }
  }
}

/* ---------- сущности ---------- */
function drawBars(g: CanvasRenderingContext2D, u: any, sx: number, sy: number) {
  const r = G.run, hgt = (u.civ ? 62 : HEIGHT[lookOf(u)] || 68) + 6, by = sy - hgt;
  if (u.civ) return;
  if (u.team === 0 && u.id === r.sel && !r.demo) {
    g.fillStyle = "#e0a43a";
    for (let i = 0; i < 30; i++) { const a = (i / 30) * 6.283 + G.t; if (i % 3) continue; g.fillRect(Math.round(sx + Math.cos(a) * 15), Math.round(sy + Math.sin(a) * 4.5), 2, 1); }
    g.fillStyle = "rgba(224,164,58,.5)"; g.fillRect(sx - 14, sy, 28, 1);
    const ay = by - 16 + Math.round(Math.sin(G.t * 6) * 2);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - 6, ay - 1, 13, 8); g.fillStyle = "#e0a43a"; g.fillRect(sx - 5, ay, 11, 2); g.fillRect(sx - 4, ay + 2, 9, 1); g.fillRect(sx - 3, ay + 3, 7, 1); g.fillRect(sx - 2, ay + 4, 5, 1); g.fillRect(sx - 1, ay + 5, 3, 1);
  }
  if (u.team === 0 || u.hp < u.maxHp) {
    const w = u.team === 0 ? 30 : 26, pct = clamp(u.hp / u.maxHp, 0, 1);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - w / 2 - 1, by - 1, w + 2, 6);
    g.fillStyle = "#1c2128"; g.fillRect(sx - w / 2, by, w, 4);
    g.fillStyle = u.team === 0 ? (pct < 0.3 ? "#d9605a" : "#5fd0a0") : "#d9704a";
    g.fillRect(sx - w / 2, by, Math.round(w * pct), 4);
    g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(sx - w / 2, by, Math.round(w * pct), 1);
    if (u.team === 0 && !r.demo) { g.fillStyle = "#e0a43a"; for (let i = 0; i < u.lvl; i++) g.fillRect(sx - w / 2 + i * 5, by + 6, 4, 2); }
  }
  if (u.state === "loot") {
    const pc = clamp(u.lootT / (BAL.LOOT_TIME / CLASSES[u.cls].loot), 0, 1);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - 16, by - 11, 32, 7); g.fillStyle = "#1c2128"; g.fillRect(sx - 15, by - 10, 30, 5);
    g.fillStyle = "#6fe0e6"; g.fillRect(sx - 15, by - 10, Math.round(30 * pc), 5);
  }
}
function drawFighter(g: CanvasRenderingContext2D, u: any, cam: number) {
  const look = lookOf(u), pp = poseOf(u);
  const spr = getSprite(look, pp[0], pp[1], u.team === 0 ? u.eqi : null, u.face >= 0 ? 1 : -1, u.flash > 0);
  let al = 1;
  if (u.dead) { al = u.deadT > 1 ? Math.max(0, 1 - (u.deadT - 1) * 1.6) : 1; if (u.deadT > 0.9 && ((G.t * 20) | 0) % 2) al *= 0.5; }
  const sx = sxOf(u.x, cam), sy = syOf(u.y);
  if (al < 1) g.globalAlpha = al;
  g.drawImage(spr, sx - OX, sy - OY + 1);
  g.globalAlpha = 1;
  if (u.dead) return;
  drawBars(g, u, sx, sy);
}
function drawProp(g: CanvasRenderingContext2D, o: any, cam: number) {
  const spr = propSprite(o);
  let x = sxOf(o.x, cam) - (spr.width >> 1); const y = syOf(o.y) + 1 - spr.height;
  if (o.flash > 0) x += Math.random() < 0.5 ? -1 : 1;
  g.drawImage(spr, x, y);
}
function drawEntities(g: CanvasRenderingContext2D, cam: number) {
  const r = G.run, list: [number, number, any][] = [];
  for (const p of r.props) { if (p.kind === "shop" || p.x < (cam / K) - 90 || p.x > (cam / K) + 570) continue; list.push([p.y, 0, p]); }
  for (const u of r.units) list.push([u.y, 1, u]);
  for (const e of r.enemies) list.push([e.y, 1, e]);
  for (const c of r.civs) list.push([c.y, 1, c]);
  list.sort((a, b) => a[0] - b[0]);
  for (const it of list) {
    const o = it[2];
    if (it[1] === 0) { if (o.kind === "lamp") continue; shadow(g, sxOf(o.x, cam), syOf(o.y), o.type === "car" ? 96 : 26); }
    else shadow(g, sxOf(o.x, cam), syOf(o.y), o.team === 1 && o.type === "exo" ? 40 : o.civ ? 22 : 28);
  }
  for (const it of list) { if (it[1] === 0) drawProp(g, it[2], cam); else drawFighter(g, it[2], cam); }
  for (const p of r.projs) {
    const px = sxOf(p.x, cam), py = syOf(p.y) - 24;
    g.fillStyle = p.team === 0 ? "#ffe08a" : "#ff9a7a"; g.fillRect(px - 5, py, 10, 2);
    g.fillStyle = "#fff"; g.fillRect(px + (p.vx > 0 ? 2 : -4), py, 3, 2);
    g.globalAlpha = 0.4; g.fillStyle = p.team === 0 ? "#ffe08a" : "#ff9a7a"; g.fillRect(px - (p.vx > 0 ? 22 : -8), py, 14, 1); g.globalAlpha = 1;
  }
}
function drawFx(g: CanvasRenderingContext2D, cam: number, r: any) {
  for (const p of r.parts) {
    const a = 1 - p.t / p.life, px = sxOf(p.x, cam), py = Math.round((p.y - p.z) * K), sz = Math.max(1, Math.round(p.size * K));
    if (p.kind === "smoke") { g.globalAlpha = Math.max(0, 0.5 * a); const s = sz * (1 + p.t * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), Math.round(s), Math.round(s)); }
    else { g.globalAlpha = a > 0.3 ? 1 : a / 0.3; g.fillStyle = p.col; g.fillRect(px, py, sz, sz); }
  }
  g.globalAlpha = 1;
  for (const q of r.rings) {
    const f = q.t / q.life, rr = q.maxR * K * (0.25 + f * 0.75), ry = rr * 0.38, cx = sxOf(q.x, cam), cy = Math.round((q.y - q.z) * K);
    g.globalAlpha = (1 - f) * 0.9; g.fillStyle = q.col;
    for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.283; g.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * ry), 2, 2); }
  }
  for (const q of r.slashes) {
    const f = q.t / q.life, R = (q.big ? 36 : 28), cx = sxOf(q.x, cam) - q.face * 8, cy = syOf(q.y);
    for (let k = 0; k <= 16; k++) {
      const fr = k / 16; if (fr > f * 1.25 || fr < f * 1.25 - 0.5) continue;
      const a = -1.15 + 2.3 * fr, al = 1 - (f * 1.25 - fr) / 0.5;
      g.globalAlpha = Math.max(0, al) * (1 - f * 0.4); g.fillStyle = q.col;
      const x = cx + q.face * Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.75, s = q.big ? 4 : 3;
      g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    }
  }
  g.globalAlpha = 1;
}

/* ---------- освещение ---------- */
function drawLighting(g: CanvasRenderingContext2D, cam: number, r: any) {
  g.globalCompositeOperation = "lighter";
  for (const k in r.chunks) {
    const ch = r.chunks[k], x0 = ch.x * K - cam; if (x0 < -CHPX - 20 || x0 > W + 20) continue;
    const c = ch.glow, cx0 = x0 + CHPX / 2;
    g.save(); g.translate(cx0, GY); g.scale(1, 0.42);
    const gr = g.createRadialGradient(0, 0, 10, 0, 0, 230);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},.20)`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = gr; g.fillRect(-230, 0, 460, 260); g.restore();
    for (const s of ch.signs) {
      const fl = s.flick ? (Math.sin(G.t * 13 + s.ph) > 0.75 ? 0.35 : 1) : 1, sx = x0 + s.x, sc = s.col;
      const rg = g.createRadialGradient(sx, s.y, 2, sx, s.y, 90);
      rg.addColorStop(0, `rgba(${sc[0]},${sc[1]},${sc[2]},${0.3 * fl})`); rg.addColorStop(1, `rgba(${sc[0]},${sc[1]},${sc[2]},0)`);
      g.fillStyle = rg; g.fillRect(sx - 90, s.y - 90, 180, 180);
      if (fl > 0.5 && s.y > 40) {
        const w = Math.min(70, s.w * 0.5) + Math.sin(G.t * 2 + s.ph) * 4, rf = g.createLinearGradient(0, ROAD, 0, 330);
        rf.addColorStop(0, `rgba(${sc[0]},${sc[1]},${sc[2]},${0.07 * fl})`); rf.addColorStop(1, `rgba(${sc[0]},${sc[1]},${sc[2]},0)`);
        g.fillStyle = rf;
        for (const f of [1, 0.72, 0.46]) g.fillRect(Math.round(sx - (w * f) / 2), ROAD, Math.round(w * f), 112);
      }
    }
  }
  for (const p of r.props) {
    if (p.kind === "lamp") {
      if (p.x * K < cam - 120 || p.x * K > cam + W + 120) continue;
      const lx = sxOf(p.x, cam) + 8, ly = syOf(p.y) - 112;
      const rg = g.createRadialGradient(lx, ly, 2, lx, ly, 110); rg.addColorStop(0, "rgba(255,200,120,.38)"); rg.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = rg; g.fillRect(lx - 110, ly - 110, 220, 230);
      const gg = g.createRadialGradient(lx, 236, 4, lx, 236, 80); gg.addColorStop(0, "rgba(255,200,120,.20)"); gg.addColorStop(1, "rgba(255,200,120,0)");
      g.save(); g.translate(0, 236); g.scale(1, 0.32); g.translate(0, -236); g.fillStyle = gg; g.fillRect(lx - 80, 150, 160, 170); g.restore();
    } else if (p.kind === "obj" && p.type === "car") {
      const cx = sxOf(p.x, cam), cy = syOf(p.y);
      if (cx < -80 || cx > W + 80) continue;
      const col = p.broken ? (p.burnT > 0 ? "rgba(255,150,60," + (0.25 + Math.random() * 0.12) + ")" : null) : "rgba(111,224,230,.22)";
      if (col) { g.fillStyle = col; g.fillRect(cx - 44, cy - 2, 88, 4); g.fillRect(cx - 34, cy + 2, 68, 3); }
      if (!p.broken) { g.fillStyle = "rgba(255,240,180,.10)"; g.fillRect(p.face > 0 ? cx + 50 : cx - 120, cy - 22, 70, 10); }
    }
  }
  for (const p of r.projs) {
    const px = sxOf(p.x, cam), py = syOf(p.y) - 24, rg = g.createRadialGradient(px, py, 1, px, py, 18);
    rg.addColorStop(0, "rgba(255,210,130,.5)"); rg.addColorStop(1, "rgba(255,210,130,0)"); g.fillStyle = rg; g.fillRect(px - 18, py - 18, 36, 36);
  }
  for (const u of r.units) if (!u.dead && u.state === "attack" && u.s.ranged && u.st < 0.1) { const px = sxOf(u.x + u.face * 20, cam), py = syOf(u.y) - 24, rg = g.createRadialGradient(px, py, 1, px, py, 40); rg.addColorStop(0, "rgba(255,220,150,.5)"); rg.addColorStop(1, "rgba(255,220,150,0)"); g.fillStyle = rg; g.fillRect(px - 40, py - 40, 80, 80); }
  g.globalCompositeOperation = "source-over";
}

/* ---------- главная функция ---------- */
export function render(g: CanvasRenderingContext2D) {
  const r = G.run; if (!r) return;
  g.imageSmoothingEnabled = false;
  const cam = Math.round(r.camX * K);
  let sx = 0, sy = 0; if (G.shake > 0.2) { sx = Math.round(rnd(-G.shake, G.shake)); sy = Math.round(rnd(-G.shake, G.shake)); }
  g.save(); g.translate(sx, sy);
  drawSky(g, cam);
  for (const k in r.chunks) { const ch = r.chunks[k], x = Math.round(ch.x * K) - cam; if (x < -CHPX - 2 || x > W + 2) continue; g.drawImage(ch.canvas, x, 0); }
  drawGround(g, cam, r); drawShops(g, cam, r); drawEntities(g, cam); drawFx(g, cam, r); drawSteam(g, cam, r);
  drawLighting(g, cam, r);
  const st = starsNow();
  if (!r.demo && st >= 3) {
    const a = 0.07 + 0.05 * Math.sin(G.t * 8), red = Math.sin(G.t * 5) > 0;
    g.fillStyle = red ? `rgba(200,60,50,${a})` : `rgba(70,140,170,${a})`; g.fillRect(-4, 0, 30, H); g.fillRect(W - 26, 0, 34, H);
  }
  /* дождь */
  g.fillStyle = "rgba(160,190,215,.26)";
  for (let i = 0; i < 70; i++) { const x = (i * 53.7 + G.t * 46) % (W + 20) - 10, y = ((i * 97.3 + G.t * (340 + (i % 3) * 50)) % (H + 16)) - 8; g.fillRect(x | 0, y | 0, 1, 4); g.fillRect((x | 0) + 1, (y | 0) + 4, 1, 4); }
  for (let i = 0; i < 16; i++) { const ph = (G.t * 2.4 + i * 0.37) % 1, x = ((i * 131.3) % W) | 0, y = 224 + ((i * 59.9) % 130 | 0), w = 2 + ph * 7; g.fillStyle = `rgba(180,205,225,${0.32 * (1 - ph)})`; g.fillRect(Math.round(x - w), y, Math.round(w * 2), 1); }
  g.restore();
  /* вспышки */
  if (G.flash > 0) { g.globalAlpha = clamp(G.flash * 0.55, 0, 0.5); g.fillStyle = G.flashCol; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  g.drawImage(art.vig, 0, 0);
  for (const t of r.texts) {
    const a = Math.min(1, (t.life - t.t) * 3); g.globalAlpha = a;
    txt(g, t.s, sxOf(t.x, cam), syOf(t.y), t.col, 8 * t.sc, true);
  }
  g.globalAlpha = 1;
  if (r.ending) {
    const en = r.ending, a = Math.min(0.6, en.t * 0.5);
    g.fillStyle = en.type === "arrest" ? `rgba(30,8,14,${a})` : `rgba(4,6,12,${a})`; g.fillRect(0, 0, W, H);
    txt(g, en.type === "arrest" ? "ЗАДЕРЖАНЫ!" : "УШЛИ!", W / 2, H / 2 - 20, en.type === "arrest" ? "#d9605a" : "#e0a43a", 32, true);
  }
}
