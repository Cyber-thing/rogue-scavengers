/* ======================================================================
   РЕНДЕР арены: 640×360, 16-битный пиксель-арт в духе Streets of Rage / Huntdown.
   Порядок: Небо → Дальний/Средний/Ближний параллакс → Монорельс → Фасады и
   анимированные вентиляторы → Мостовая в перспективе → Декали/Лужи/Рябь →
   Шлейфы и сущности → Выстрелы/Вспышки/Звёзды ударов/Гильзы → Неон → Дождь → HUD текста.
   ====================================================================== */
import { W, H, K, CHPX, BAL } from "./consts";
import { G, starsNow } from "./state";
import { getSprite, OX, OY } from "./art/characters";
import { drawSheetGhost, drawSheetUnit } from "./art/spriteSheets";
import { poseOf } from "./art/poses";
import { propSprite } from "./art/props";
import { art, farBeacons, farLogos, LAYER_W, PF } from "./art/world";
import { CLASSES } from "./content";
import { shopForIndoorUnit } from "./shopLogic";
import { clamp, rnd } from "./util";

export { poseOf, shopForIndoorUnit };

const GY = 176;      // тротуар
const ROAD = 218;    // начало дороги

export const lookOf = (u: any) => u.look || (u.team === 0 ? u.cls : u.type);
const BASE_HEIGHT: Record<string, number> = {
  hulk: 88,
  exo: 84,
  trooper: 77,
  rat: 78,
  runner: 78,
  cutter: 78,
  guard: 73,
  agent: 74,
};
const heightOf = (u: any) => (u.civ ? 70 : BASE_HEIGHT[u.team === 0 ? u.cls : u.type] || 73);

const sxOf = (x: number, cam: number) => Math.round(x * K) - cam;
const syOf = (y: number) => Math.round(y * K);

function txt(g: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, size: number, center = true, out = "#0a0d12") {
  g.font = `${size}px ${PF}`;
  g.textBaseline = "top";
  g.textAlign = center ? "center" : "left";
  g.lineJoin = "round";
  g.lineWidth = Math.max(2, size / 4);
  g.strokeStyle = out;
  g.strokeText(s, x, y);
  g.fillStyle = col;
  g.fillText(s, x, y);
}

function shadow(g: CanvasRenderingContext2D, x: number, y: number, w: number, tint?: string) {
  g.fillStyle = tint || "rgba(0,0,0,.44)";
  const rows = [0.5, 0.85, 1, 0.85, 0.5];
  rows.forEach((f, i) => {
    const ww = Math.round(w * f);
    g.fillRect(Math.round(x - ww / 2), Math.round(y - 2 + i), ww, 1);
  });
}

function drawLayer(g: CanvasRenderingContext2D, l: HTMLCanvasElement, f: number, y: number, cam: number) {
  const o = -(((cam * f) % LAYER_W) + LAYER_W) % LAYER_W;
  g.drawImage(l, Math.round(o), y);
  g.drawImage(l, Math.round(o) + LAYER_W, y);
}

/* ---------- небо + воздушный трафик + монорельс ---------- */
function drawSky(g: CanvasRenderingContext2D, cam: number) {
  g.fillStyle = "#050811";
  g.fillRect(0, 0, W, H);
  g.drawImage(art.sky, 0, 0);
  drawLayer(g, art.far, 0.06, 0, cam);

  const o = -(((cam * 0.06) % LAYER_W) + LAYER_W) % LAYER_W;
  for (const b of farBeacons) {
    for (const off of [0, LAYER_W]) {
      const x = Math.round(b[0] + o + off);
      if (x < -4 || x > W + 4) continue;
      if (Math.sin(G.t * 2.2 + b[0]) > 0.52) {
        g.fillStyle = "#e0584a";
        g.fillRect(x, b[1], 2, 2);
        g.fillStyle = "rgba(224,88,74,.28)";
        g.fillRect(x - 2, b[1] - 2, 6, 6);
      }
    }
  }

  /* голо-логотипы на дальних башнях */
  g.globalCompositeOperation = "lighter";
  for (const l of farLogos) {
    for (const off of [0, LAYER_W]) {
      const x = l[0] + o + off;
      if (x < -30 || x > W + 30) continue;
      const gr = g.createRadialGradient(x, l[1], 2, x, l[1], 36);
      gr.addColorStop(0, "rgba(228,136,68,.32)");
      gr.addColorStop(1, "rgba(228,136,68,0)");
      g.fillStyle = gr;
      g.fillRect(x - 36, l[1] - 36, 72, 72);
    }
  }
  g.globalCompositeOperation = "source-over";

  /* дирижабль-реклама */
  const bx = ((G.t * 5 + 300) % (W + 360)) - 180;
  const by = 52 + Math.sin(G.t * 0.4) * 3;
  g.fillStyle = "#1c2632";
  g.beginPath(); g.ellipse(bx, by, 62, 16, 0, 0, 7); g.fill();
  g.fillStyle = "#2a3846";
  g.beginPath(); g.ellipse(bx, by - 4, 56, 9, 0, 0, 7); g.fill();
  g.fillStyle = "#10161e";
  g.fillRect(bx - 12, by + 14, 24, 5);
  g.fillStyle = "#0a0d12";
  g.fillRect(bx - 38, by - 7, 76, 12);
  g.fillStyle = "#1a2e30";
  g.fillRect(bx - 37, by - 6, 74, 10);
  txt(g, "AGOGEE", bx, by - 5, "#7fd0c4", 8, true, "#0a0d12");
  if (Math.sin(G.t * 3) > 0) {
    g.fillStyle = "#e0584a";
    g.fillRect(bx + 56, by - 1, 2, 2);
  }

  /* летающие машины */
  for (let i = 0; i < 5; i++) {
    const dir = i & 1 ? -1 : 1;
    const sp = 20 + i * 10;
    const ph = i * 211;
    const ly = 20 + i * 16 + (i & 1) * 18;
    let x = ((G.t * sp + ph) % (W + 160)) - 80;
    if (dir < 0) x = W - x;
    const rx = Math.round(x);
    g.fillStyle = "#0e141c";
    g.fillRect(rx - 8, ly, 16, 3);
    g.fillRect(rx - 4, ly - 2, 8, 2);
    g.fillStyle = dir > 0 ? "#fff0b0" : "#e0584a";
    g.fillRect(rx + (dir > 0 ? 7 : -8), ly + 1, 2, 1);
    g.fillStyle = "rgba(111,224,230,.55)";
    g.fillRect(rx - dir * 5, ly + 3, 6, 1);
    g.fillStyle = "rgba(111,224,230,.14)";
    g.fillRect(rx - dir * 24, ly + 2, 20, 2);
  }

  /* средний слой + скользящий монорельс на эстакаде */
  drawLayer(g, art.mid, 0.22, 0, cam);
  const om = -(((cam * 0.22) % LAYER_W) + LAYER_W) % LAYER_W;
  const txBase = ((G.t * 58) % (LAYER_W + 240)) - 120;
  for (const off of [0, LAYER_W, -LAYER_W]) {
    const tx = Math.round(txBase + om + off);
    if (tx < -140 || tx > W + 40) continue;
    for (let car = 0; car < 3; car++) {
      const cx = tx + car * 34;
      g.fillStyle = "#0b111a";
      g.fillRect(cx, 118, 31, 8);
      g.fillStyle = "#2b3b4e";
      g.fillRect(cx + 1, 119, 29, 2);
      g.fillStyle = car === 2 ? "#ffe8a0" : "#6fe0e6";
      for (let w = 0; w < 4; w++) g.fillRect(cx + 3 + w * 6, 121, 4, 2);
      g.fillStyle = "#e0a43a";
      g.fillRect(cx, 124, 31, 1);
    }
    // Луч фары поезда
    g.fillStyle = "rgba(255,232,160,.16)";
    g.fillRect(tx + 99, 120, 26, 4);
  }

  /* ближний фоновый слой (силуэты проводов и балок за зданиями) */
  drawLayer(g, art.nearBg, 0.44, 0, cam);
}

/* ---------- анимированные детали фасадов ---------- */
function drawChunkDetails(g: CanvasRenderingContext2D, ch: any, x0: number) {
  /* крутящиеся вытяжные вентиляторы */
  if (ch.fans) {
    for (const f of ch.fans) {
      const fx = Math.round(x0 + f.x);
      const fy = Math.round(f.y);
      if (fx < -16 || fx > W + 16) continue;
      const a = G.t * 11 + f.x * 0.1;
      for (let k = 0; k < 4; k++) {
        const ang = a + (k * Math.PI) / 2;
        const bx = Math.round(fx + Math.cos(ang) * f.r);
        const by = Math.round(fy + Math.sin(ang) * f.r);
        g.fillStyle = k & 1 ? "#7a8896" : "#4a5664";
        g.fillRect(Math.min(fx, bx), Math.min(fy, by), Math.abs(bx - fx) + 1, Math.abs(by - fy) + 1);
      }
      g.fillStyle = "#c0ccd8";
      g.fillRect(fx - 1, fy - 1, 2, 2);
    }
  }
  /* бегущая голо-развёртка на билбордах */
  if (ch.billboard) {
    const sy = 12 + Math.floor((G.t * 28) % 74);
    g.fillStyle = "rgba(180,248,255,.16)";
    g.fillRect(Math.round(x0 + 64), sy, 224, 3);
  }
}

/* ---------- улица (плитка, асфальт, декали, лужи, рябь) ---------- */
function drawGround(g: CanvasRenderingContext2D, cam: number, r: any) {
  /* мощёный тротуар в перспективе */
  const oxTile = -(((cam % 128) + 128) % 128);
  for (let x = oxTile; x < W; x += 128) g.drawImage(art.tile, Math.round(x), GY);
  g.fillStyle = "rgba(0,0,0,.24)";
  g.fillRect(0, GY, W, 3);

  /* мокрый асфальт */
  const ox = -(((cam % 128) + 128) % 128);
  for (let x = ox; x < W; x += 128) g.drawImage(art.asph, Math.round(x), ROAD);
  g.fillStyle = "#12161c";
  g.fillRect(0, ROAD, W, 4);
  g.fillStyle = "rgba(232,220,192,.10)";
  g.fillRect(0, ROAD + 4, W, 1);

  /* жёлтая прерывистая разметка */
  const oxDash = -(((cam % 112) + 112) % 112) - 112;
  g.fillStyle = "rgba(192,152,64,.62)";
  for (let x = oxDash; x < W; x += 112) {
    g.fillRect(Math.round(x), 296, 56, 3);
    g.fillStyle = "rgba(255,228,150,.18)";
    g.fillRect(Math.round(x), 296, 56, 1);
    g.fillStyle = "rgba(192,152,64,.62)";
  }

  /* лужи с мерцающими неоновыми отражениями */
  for (const k in r.chunks) {
    const ch = r.chunks[k], base = ch.x * K - cam;
    if (base < -CHPX || base > W + 10) continue;
    for (let q = 0; q < 3; q++) {
      const h = Math.abs(Math.sin((ch.i + 1) * 91.7 + q * 13.1));
      const h2 = Math.abs(Math.sin((ch.i + 3) * 37.1 + q * 7.3));
      const h3 = Math.abs(Math.sin((ch.i + 5) * 17.9 + q * 3.7));
      const cx = Math.round(base + 30 + h * (CHPX - 60));
      const cy = 238 + Math.round(h2 * 92);
      const rx = 20 + Math.round(h3 * 28);
      const ry = Math.max(3, Math.round(rx * 0.17));
      for (let j = -ry; j <= ry; j++) {
        const wd = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01)));
        g.fillStyle = "rgba(52,84,110,.5)";
        g.fillRect(cx - wd, cy + j, wd * 2, 1);
      }
      const shimmer = Math.round(Math.sin(G.t * 4 + q * 2 + ch.i) * 3);
      g.fillStyle = `rgba(${ch.glow[0]},${ch.glow[1]},${ch.glow[2]},.26)`;
      g.fillRect(cx - (rx >> 1) + shimmer, cy - 1, rx, 1);
      g.fillStyle = `rgba(${ch.glow[0]},${ch.glow[1]},${ch.glow[2]},.14)`;
      g.fillRect(cx - (rx >> 2) - shimmer, cy + 1, rx >> 1, 1);
      g.fillStyle = "rgba(216,232,248,.16)";
      g.fillRect(cx - rx + 4, cy - ry, rx >> 1, 1);
    }
  }

  /* декали на земле: гарь от взрыва, осколки стекла, мусор */
  if (r.decals) {
    for (const d of r.decals) {
      const dx = sxOf(d.x, cam), dy = syOf(d.y);
      if (dx < -60 || dx > W + 60) continue;
      if (d.kind === "scorch") {
        const rx = d.size, ry = Math.max(4, Math.round(rx * 0.3));
        for (let j = -ry; j <= ry; j++) {
          const wd = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01)));
          g.fillStyle = Math.abs(j) < ry * 0.5 ? "rgba(8,10,14,.72)" : "rgba(18,20,24,.45)";
          g.fillRect(dx - wd, dy + j, wd * 2, 1);
        }
        g.fillStyle = "rgba(224,104,56,.22)";
        g.fillRect(dx - (rx >> 2), dy - 1, rx >> 1, 2);
      } else if (d.kind === "glass") {
        for (let i = 0; i < 10; i++) {
          const ox2 = Math.round(Math.sin(d.seed * 91 + i * 7.3) * d.size);
          const oy2 = Math.round(Math.cos(d.seed * 47 + i * 5.1) * 6);
          g.fillStyle = i & 1 ? "#a8d8f0" : "#6fe0e6";
          g.fillRect(dx + ox2, dy + oy2, i % 3 === 0 ? 2 : 1, 1);
        }
      } else {
        for (let i = 0; i < 7; i++) {
          const ox2 = Math.round(Math.sin(d.seed * 61 + i * 9.1) * d.size);
          const oy2 = Math.round(Math.cos(d.seed * 29 + i * 4.7) * 5);
          g.fillStyle = i % 3 === 0 ? "#a8553a" : i % 2 === 0 ? "#c9a23a" : "#6c7c7a";
          g.fillRect(dx + ox2, dy + oy2, 2, 2);
        }
      }
    }
  }

  /* расширяющаяся рябь на лужах и от шагов */
  if (r.ripples) {
    for (const rp of r.ripples) {
      const f = rp.t / rp.life;
      const rx = Math.max(2, Math.round(rp.maxR * (0.25 + f * 0.75)));
      const ry = Math.max(1, Math.round(rx * 0.35));
      const cx = sxOf(rp.x, cam), cy = syOf(rp.y);
      if (cx < -30 || cx > W + 30) continue;
      g.globalAlpha = Math.max(0, 1 - f) * 0.7;
      g.fillStyle = rp.col;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * 6.283;
        g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
      }
    }
    g.globalAlpha = 1;
  }
}

/* ---------- пар из люков ---------- */
function drawSteam(g: CanvasRenderingContext2D, cam: number, r: any) {
  for (const k in r.chunks) {
    const ch = r.chunks[k];
    if ((ch.i * 37) % 3 !== 0) continue;
    const vx = Math.round(ch.x * K - cam + 70 + ((ch.i * 53) % 190)), vy = 234;
    if (vx < -30 || vx > W + 30) continue;
    g.fillStyle = "#0c0f13"; g.fillRect(vx - 9, vy, 18, 4);
    g.fillStyle = "#3a424c"; g.fillRect(vx - 8, vy, 16, 1);
    g.fillStyle = "#1a1e24";
    for (let i = -6; i <= 6; i += 3) g.fillRect(vx + i, vy + 1, 1, 2);
    for (let i = 0; i < 7; i++) {
      const t = (G.t * 0.5 + i / 7 + ch.i * 0.13) % 1;
      const s = 5 + t * 22, a = (1 - t) * 0.16;
      g.fillStyle = `rgba(190,205,215,${a})`;
      g.fillRect(Math.round(vx + Math.sin(i * 7 + G.t) * 5 * t - s / 2), Math.round(vy - t * 56 - s / 2), Math.round(s), Math.round(s * 0.8));
    }
  }
}

/* ---------- магазины и точки взлома ---------- */

function drawOpenShopDoor(g: CanvasRenderingContext2D, p: any, x0: number) {
  const isNet = p.type === "netcafe";
  const isCharge = p.type === "charge";
  const glowCol = isNet ? "#6fe0e6" : "#ffaa44";
  const wallBg = isNet ? "#133a44" : isCharge ? "#16343e" : "#4b2814";
  const floorBg = isNet ? "#1d4f5c" : isCharge ? "#204754" : "#66391d";

  if (isCharge) {
    // Открытый подсвеченный интерьер киоска FUSION CELL
    g.fillStyle = "#070a0f";
    g.fillRect(x0 + 122, 100, 104, 76);
    g.fillStyle = wallBg;
    g.fillRect(x0 + 124, 102, 100, 74);
    g.fillStyle = "rgba(111,224,230,.24)";
    g.fillRect(x0 + 124, 102, 100, 18);
    g.fillStyle = "#6fe0e6";
    g.fillRect(x0 + 130, 104, 88, 2);
    // Серверные стойки и ячейки энергии на задней стене
    for (const sx of [x0 + 130, x0 + 196]) {
      g.fillStyle = "#0b1a20";
      g.fillRect(sx, 114, 22, 46);
      for (let sy = 118; sy < 156; sy += 6) {
        g.fillStyle = sy % 12 === 0 ? "#6fe0e6" : "#ff9a46";
        g.fillRect(sx + 3, sy, 14, 2);
      }
    }
    g.fillStyle = floorBg;
    g.fillRect(x0 + 124, 160, 100, 16);
    g.fillStyle = "rgba(111,224,230,.20)";
    g.fillRect(x0 + 152, GY, 44, 9);
    return;
  }

  // Панорамный подсвеченный интерьер всего магазина (левая витрина + центр + правая витрина)
  const ix = x0 + 24, iw = 300;
  g.fillStyle = "#070a0f";
  g.fillRect(ix - 2, 100, iw + 4, 76);
  g.fillStyle = wallBg;
  g.fillRect(ix, 102, iw, 74);
  // Яркая верхняя потолочная подсветка
  g.fillStyle = isNet ? "rgba(111,224,230,.28)" : "rgba(255,184,76,.30)";
  g.fillRect(ix, 102, iw, 20);
  for (let lx = ix + 10; lx < ix + iw - 8; lx += 18) {
    g.fillStyle = glowCol;
    g.fillRect(lx, 105, 8, 2);
  }
  // Приглушённые задние полки / стойки внутри помещения (за спиной бойца)
  if (isNet) {
    for (const sx of [x0 + 32, x0 + 82, x0 + 214, x0 + 264]) {
      g.fillStyle = "#0b222a";
      g.fillRect(sx, 124, 40, 38);
      g.fillStyle = "#164856";
      g.fillRect(sx + 4, 127, 32, 16);
      g.fillStyle = "#6fe0e6aa";
      g.fillRect(sx + 6, 130, 18, 2);
      g.fillRect(sx + 6, 135, 24, 2);
    }
  } else {
    for (const sx of [x0 + 30, x0 + 212]) {
      g.fillStyle = "#361a0a";
      g.fillRect(sx, 124, 106, 36);
      for (const ry of [134, 148]) {
        g.fillStyle = "#6b4426";
        g.fillRect(sx + 4, ry, 98, 2);
        for (let bx = sx + 8; bx < sx + 98; bx += 12) {
          g.fillStyle = (bx % 24 === 0) ? "#d9a23a" : "#b8553a";
          g.fillRect(bx, ry - 8, 7, 8);
        }
      }
    }
  }
  // Кассовая стойка в глубине у двери
  g.fillStyle = isNet ? "#0e2d36" : "#3a2010";
  g.fillRect(x0 + 150, 142, 48, 20);
  g.fillStyle = glowCol;
  g.fillRect(x0 + 154, 142, 40, 2);

  // Светлый пол и широкий конус света из открытой двери на тротуар
  g.fillStyle = floorBg;
  g.fillRect(ix, 162, iw, 14);
  g.fillStyle = isNet ? "rgba(111,224,230,.22)" : "rgba(255,192,92,.24)";
  g.fillRect(x0 + 150, GY, 48, 9);
  g.fillRect(x0 + 156, GY + 9, 36, 4);

  // Распахнутая створка двери
  g.fillStyle = "#161c24";
  g.fillRect(x0 + 148, 108, 7, 68);
  g.fillStyle = isNet ? "#266872" : "#5c4a38";
  g.fillRect(x0 + 149, 111, 4, 42);
}

function drawStorefrontOverlay(g: CanvasRenderingContext2D, p: any, x0: number) {
  const isNet = p.type === "netcafe";
  const isCharge = p.type === "charge";

  if (isCharge) {
    g.fillStyle = "rgba(111,224,230,.08)";
    g.fillRect(x0 + 124, 102, 100, 58);
    g.fillStyle = "#0a0d12";
    g.fillRect(x0 + 122, 100, 104, 3);
    return;
  }

  // Лёгкие полупрозрачные блики стекла и тонкие перемычки рамы поверх персонажа (персонаж остаётся чётко видимым!)
  for (const wx of [x0 + 24, x0 + 204]) {
    g.fillStyle = isNet ? "rgba(90,224,236,.07)" : "rgba(255,186,96,.07)";
    g.fillRect(wx, 102, 120, 72);
    g.fillStyle = "rgba(255,255,255,.10)";
    g.fillRect(wx + 12, 102, 5, 72);
    g.fillRect(wx + 72, 102, 3, 72);
    g.fillStyle = "#2a3038";
    g.fillRect(wx - 2, 174, 124, 3);
  }
  g.fillStyle = "rgba(18,24,32,.75)";
  g.fillRect(x0 + 145, 102, 4, 74);
  g.fillRect(x0 + 199, 102, 4, 74);
  g.fillStyle = "#0a0d12";
  g.fillRect(x0 + 22, 100, 304, 3);
}

function drawShops(g: CanvasRenderingContext2D, cam: number, r: any) {
  const insideByShop = new Map<any, any[]>();
  for (const u of r.units) {
    const sh = shopForIndoorUnit(u, r);
    if (!sh) continue;
    const arr = insideByShop.get(sh) || [];
    arr.push(u);
    insideByShop.set(sh, arr);
  }

  for (const p of r.props) {
    if (p.kind !== "shop") continue;
    const x0 = Math.round(p.ch.x * K) - cam;
    if (x0 < -CHPX - 10 || x0 > W + 10) continue;
    const cx = Math.round(p.x * K) - cam;
    const visitors = (insideByShop.get(p) || []).sort((a, b) => a.y - b.y);
    const active = !p.looted && (visitors.length > 0 || r.units.some((u: any) => !u.dead && (u.lootShop === p || (u.lootP === p && Math.hypot(u.x - p.x, u.y - 148) < 28))));

    if (p.looted) {
      const z = p.ch.zone;
      g.fillStyle = "#3a414c"; g.fillRect(x0 + z[0], z[1], z[2], z[3]);
      g.fillStyle = "#262c34";
      for (let y = z[1]; y < z[1] + z[3]; y += 3) g.fillRect(x0 + z[0], y, z[2], 1);
      g.fillStyle = "#566270";
      g.fillRect(x0 + z[0], z[1] + z[3] - 4, z[2], 4);
      g.fillRect(x0 + z[0], z[1], z[2], 2);
      g.fillStyle = "#0a0d12"; g.fillRect(cx - 34, 144, 68, 16);
      txt(g, "ЗАКРЫТО", cx, 148, Math.sin(G.t * 3) > -0.6 ? "#d9605a" : "#7a3030", 8, true, "#0a0d12");
      continue;
    }

    if (active) {
      drawOpenShopDoor(g, p, x0);
      for (const u of visitors) {
        shadow(g, sxOf(u.x, cam), syOf(u.y), 24, "rgba(0,0,0,.35)");
        drawFighter(g, u, cam, false);
      }
      drawStorefrontOverlay(g, p, x0);
    }

    if (!active || visitors.length === 0) {
      const y = Math.round(58 + Math.sin(G.t * 3 + p.x) * 3);
      g.fillStyle = "rgba(224,164,58,.12)"; g.fillRect(cx - 1, y + 14, 2, 70);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = "rgba(224,164,58,.55)";
        g.fillRect(cx, y + 18 + k * 12 + (((G.t * 20) | 0) % 12), 1, 3);
      }
      g.fillStyle = "#0a0d12"; g.fillRect(cx - 9, y - 1, 18, 18);
      g.fillStyle = "#e0b440"; g.fillRect(cx - 8, y, 16, 16);
      g.fillStyle = "#f8dc80"; g.fillRect(cx - 7, y, 5, 2);
      g.fillStyle = "#a8742a"; g.fillRect(cx - 8, y + 14, 16, 2);
      g.fillStyle = "#3a2208";
      g.fillRect(cx - 4, y + 3, 2, 4); g.fillRect(cx + 2, y + 3, 2, 4);
      g.fillRect(cx - 2, y + 7, 4, 2); g.fillRect(cx - 1, y + 9, 2, 5); g.fillRect(cx - 5, y + 10, 10, 1);
    }
  }
}

/* ---------- сущности ---------- */
function drawBars(g: CanvasRenderingContext2D, u: any, sx: number, sy: number) {
  const r = G.run;
  if (u.civ) return;
  const hgt = heightOf(u) + 6;
  const by = sy - hgt;
  if (u.team === 0 && u.id === r.sel && !r.demo) {
    g.fillStyle = "#e0a43a";
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * 6.283 + G.t;
      if (i % 3) continue;
      g.fillRect(Math.round(sx + Math.cos(a) * 15), Math.round(sy + Math.sin(a) * 4.5), 2, 1);
    }
    g.fillStyle = "rgba(224,164,58,.5)"; g.fillRect(sx - 14, sy, 28, 1);
    const ay = by - 16 + Math.round(Math.sin(G.t * 6) * 2);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - 6, ay - 1, 13, 8);
    g.fillStyle = "#e0a43a";
    g.fillRect(sx - 5, ay, 11, 2); g.fillRect(sx - 4, ay + 2, 9, 1);
    g.fillRect(sx - 3, ay + 3, 7, 1); g.fillRect(sx - 2, ay + 4, 5, 1); g.fillRect(sx - 1, ay + 5, 3, 1);
  }
  if (u.team === 0 || u.hp < u.maxHp) {
    const w = u.team === 0 ? 30 : 26, pct = clamp(u.hp / u.maxHp, 0, 1);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - w / 2 - 1, by - 1, w + 2, 6);
    g.fillStyle = "#1c2128"; g.fillRect(sx - w / 2, by, w, 4);
    g.fillStyle = u.team === 0 ? (pct < 0.3 ? "#d9605a" : "#5fd0a0") : "#d9704a";
    g.fillRect(sx - w / 2, by, Math.round(w * pct), 4);
    g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(sx - w / 2, by, Math.round(w * pct), 1);
    if (u.team === 0 && !r.demo) {
      g.fillStyle = "#e0a43a";
      for (let i = 0; i < u.lvl; i++) g.fillRect(sx - w / 2 + i * 5, by + 6, 4, 2);
    }
  }
  if (u.state === "loot") {
    const pc = clamp(u.lootT / (BAL.LOOT_TIME / CLASSES[u.cls].loot), 0, 1);
    g.fillStyle = "#0a0d12"; g.fillRect(sx - 16, by - 11, 32, 7);
    g.fillStyle = "#1c2128"; g.fillRect(sx - 15, by - 10, 30, 5);
    g.fillStyle = "#6fe0e6"; g.fillRect(sx - 15, by - 10, Math.round(30 * pc), 5);
  }
}

function drawGhost(g: CanvasRenderingContext2D, gh: any, cam: number) {
  const f = gh.t / gh.life;
  const al = Math.max(0, 1 - f) * 0.42;
  if (al <= 0.02) return;
  const sx = sxOf(gh.x, cam), sy = syOf(gh.y);
  g.save();
  g.globalAlpha = al;
  g.globalCompositeOperation = "lighter";
  if (!drawSheetGhost(g, gh, sx, sy)) {
    const spr = getSprite(gh.look, gh.pose, gh.fr, gh.eqi, gh.face, true, gh.combo || 0);
    g.drawImage(spr, sx - OX, sy - OY + 1);
  }
  g.restore();
}

function drawFighter(g: CanvasRenderingContext2D, u: any, cam: number, withBars = true) {
  let al = 1;
  if (u.dead) {
    al = u.deadT > 1 ? Math.max(0, 1 - (u.deadT - 1) * 1.6) : 1;
    if (u.deadT > 0.9 && ((G.t * 20) | 0) % 2) al *= 0.5;
  }
  const sx = sxOf(u.x, cam), sy = syOf(u.y);
  if (al < 1) g.globalAlpha = al;
  if (!drawSheetUnit(g, u, sx, sy, G.t)) {
    const look = lookOf(u), pp = poseOf(u, G.t);
    const spr = getSprite(look, pp[0], pp[1], u.team === 0 ? u.eqi : null, u.face >= 0 ? 1 : -1, u.flash > 0, u.atkSeq || 0);
    g.drawImage(spr, sx - OX, sy - OY + 1);
  }
  g.globalAlpha = 1;
  if (u.dead || !withBars) return;
  drawBars(g, u, sx, sy);
}

function drawProp(g: CanvasRenderingContext2D, o: any, cam: number) {
  const spr = propSprite(o);
  let x = sxOf(o.x, cam) - (spr.width >> 1);
  let y = syOf(o.y) + 1 - spr.height;
  if (o.type === "car" && o.model === "spinner" && !o.broken) {
    y += Math.round(Math.sin(G.t * 4.2 + o.x * 0.1) * 1.5);
  }
  if (o.flash > 0) x += Math.random() < 0.5 ? -1 : 1;
  g.drawImage(spr, x, y);
}

function drawEntities(g: CanvasRenderingContext2D, cam: number) {
  const r = G.run, list: [number, number, any][] = [], indoorBars: any[] = [];
  for (const p of r.props) {
    if (p.kind === "shop" || p.x < cam / K - 95 || p.x > cam / K + 575) continue;
    list.push([p.y, 0, p]);
  }
  for (const u of r.units) {
    if (shopForIndoorUnit(u, r)) { indoorBars.push(u); continue; }
    list.push([u.y, 1, u]);
  }
  for (const e of r.enemies) list.push([e.y, 1, e]);
  for (const c of r.civs) list.push([c.y, 1, c]);
  list.sort((a, b) => a[0] - b[0]);

  for (const it of list) {
    const o = it[2];
    if (it[1] === 0) {
      if (o.kind === "lamp") continue;
      const isSpinner = o.type === "car" && o.model === "spinner" && !o.broken;
      shadow(g, sxOf(o.x, cam), syOf(o.y), o.type === "car" ? 96 : 26, isSpinner ? "rgba(20,58,72,.52)" : undefined);
    } else {
      shadow(g, sxOf(o.x, cam), syOf(o.y), o.team === 1 && o.type === "exo" ? 40 : o.civ ? 22 : 28);
    }
  }

  /* призрачные шлейфы позади активных бойцов */
  if (r.ghosts) {
    for (const gh of r.ghosts) drawGhost(g, gh, cam);
  }

  for (const it of list) {
    if (it[1] === 0) drawProp(g, it[2], cam);
    else drawFighter(g, it[2], cam);
  }
  for (const u of indoorBars) {
    drawBars(g, u, sxOf(u.x, cam), syOf(u.y));
  }

  /* пули-трассеры с огненным хвостом */
  for (const p of r.projs) {
    const px = sxOf(p.x, cam), py = syOf(p.y) - 24;
    const dir = p.vx > 0 ? 1 : -1;
    const len = p.heavy ? 12 : 9;
    const h = p.heavy ? 3 : 2;
    g.globalAlpha = 0.45;
    g.fillStyle = p.team === 0 ? "#ffe08a" : "#ff8a68";
    g.fillRect(px - (dir > 0 ? 24 : -6), py, 18, 1);
    g.globalAlpha = 1;
    g.fillStyle = p.team === 0 ? "#ffbe48" : "#ff6848";
    g.fillRect(px - (len >> 1), py - (h > 2 ? 1 : 0), len, h);
    g.fillStyle = "#ffffff";
    g.fillRect(px + (dir > 0 ? 1 : -4), py, 3, 2);
  }
}

/* ---------- спецэффекты арены (искры, факелы выстрелов, гильзы, звёзды) ---------- */
function drawFx(g: CanvasRenderingContext2D, cam: number, r: any) {
  /* дым и искры частиц */
  for (const p of r.parts) {
    const a = 1 - p.t / p.life, px = sxOf(p.x, cam), py = Math.round((p.y - p.z) * K), sz = Math.max(1, Math.round(p.size * K));
    if (p.kind === "smoke") {
      g.globalAlpha = Math.max(0, 0.52 * a);
      const s = sz * (1 + p.t * 1.6);
      g.fillStyle = p.col;
      g.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), Math.round(s), Math.round(s));
    } else {
      g.globalAlpha = a > 0.3 ? 1 : a / 0.3;
      g.fillStyle = p.col;
      g.fillRect(px, py, sz, sz);
    }
  }
  g.globalAlpha = 1;

  /* ударные кольца */
  for (const q of r.rings) {
    const f = q.t / q.life, rr = q.maxR * K * (0.25 + f * 0.75), ry = rr * 0.38, cx = sxOf(q.x, cam), cy = Math.round((q.y - q.z) * K);
    g.globalAlpha = (1 - f) * 0.9;
    g.fillStyle = q.col;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 6.283;
      g.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * ry), 2, 2);
    }
  }

  /* дуги ударов хлыстом/рукой */
  for (const q of r.slashes) {
    const f = q.t / q.life, R = q.big ? 38 : 28, cx = sxOf(q.x, cam) - q.face * 8, cy = syOf(q.y);
    for (let k = 0; k <= 18; k++) {
      const fr = k / 18;
      if (fr > f * 1.25 || fr < f * 1.25 - 0.55) continue;
      const a = -1.15 + 2.3 * fr, al = 1 - (f * 1.25 - fr) / 0.55;
      g.globalAlpha = Math.max(0, al) * (1 - f * 0.35);
      const x = cx + q.face * Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.75, s = q.big ? 4 : 3;
      g.fillStyle = q.col;
      g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      if (al > 0.65) {
        g.fillStyle = "#ffffff";
        g.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    }
  }
  g.globalAlpha = 1;

  /* 8-лучевые звёздные вспышки ударов (Streets of Rage / image_2c22f205) */
  if (r.sparks) {
    for (const s of r.sparks) {
      const f = s.t / s.life;
      const rad = (s.big ? 19 : 13) * (f < 0.35 ? 0.5 + f * 1.5 : 1.05 - (f - 0.35) * 0.5);
      const cx = sxOf(s.x, cam), cy = Math.round((s.y - s.z) * K);
      g.globalAlpha = Math.max(0, 1 - f * 0.85);
      for (let k = 0; k < 8; k++) {
        const ang = s.rot + (k * Math.PI) / 4;
        const lr = k & 1 ? rad * 0.58 : rad;
        const steps = Math.max(3, Math.round(lr));
        for (let d = 0; d <= steps; d++) {
          const px = Math.round(cx + Math.cos(ang) * d);
          const py = Math.round(cy + Math.sin(ang) * d);
          g.fillStyle = d < steps * 0.35 ? "#ffffff" : d < steps * 0.72 ? s.col : "#e85430";
          const sz = d < steps * 0.45 ? 3 : 2;
          g.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
        }
      }
      g.fillStyle = "#ffffff";
      g.fillRect(cx - 3, cy - 3, 6, 6);
    }
    g.globalAlpha = 1;
  }

  /* крупные огненные факелы выстрелов (Huntdown / image_1a735488) */
  if (r.muzzles) {
    for (const m of r.muzzles) {
      const f = m.t / m.life;
      const sc = (m.big ? 1.35 : 1.0) * (1 - f * 0.45);
      const mx = sxOf(m.x, cam), my = Math.round((m.y - m.z) * K);
      const dir = m.face >= 0 ? 1 : -1;
      g.globalAlpha = Math.max(0, 1 - f * 0.7);
      const len = Math.round(24 * sc);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const hw = Math.max(1, Math.round((1 - t * 0.72) * 8 * sc + (i % 3 === 0 ? 2 : 0)));
        const x = mx + dir * i;
        g.fillStyle = t < 0.25 ? "#ffffff" : t < 0.6 ? "#ffe270" : "#e8542a";
        g.fillRect(x, my - hw, 1, hw * 2);
      }
      // Внутренний белый шип
      g.fillStyle = "#ffffff";
      g.fillRect(dir > 0 ? mx : mx - Math.round(10 * sc), my - 2, Math.round(10 * sc), 4);
      // Искорки вылета
      g.fillStyle = "#ffd060";
      g.fillRect(mx + dir * (len + 3), my - 3, 2, 2);
      g.fillRect(mx + dir * (len + 6), my + 2, 2, 1);
    }
    g.globalAlpha = 1;
  }

  /* блестящие латунные гильзы на асфальте */
  if (r.casings) {
    for (const c of r.casings) {
      const a = c.t < c.life - 0.3 ? 1 : Math.max(0, (c.life - c.t) / 0.3);
      const cx = sxOf(c.x, cam), cy = Math.round((c.y - c.z) * K);
      g.globalAlpha = a;
      if (c.z > 1) {
        g.fillStyle = "rgba(0,0,0,.35)";
        g.fillRect(cx, syOf(c.y), 2, 1);
      }
      const horiz = Math.cos(c.rot) > 0;
      g.fillStyle = "#f4c869";
      g.fillRect(cx, cy, horiz ? 3 : 1, horiz ? 1 : 2);
      g.fillStyle = "#a87024";
      g.fillRect(cx + (horiz ? 2 : 0), cy + (horiz ? 0 : 1), 1, 1);
    }
    g.globalAlpha = 1;
  }
}

/* ---------- аддитивное неоновое освещение ---------- */
function drawLighting(g: CanvasRenderingContext2D, cam: number, r: any) {
  g.globalCompositeOperation = "lighter";
  for (const k in r.chunks) {
    const ch = r.chunks[k], x0 = ch.x * K - cam;
    if (x0 < -CHPX - 20 || x0 > W + 20) continue;
    const c = ch.glow, cx0 = x0 + CHPX / 2;
    g.save();
    g.translate(cx0, GY);
    g.scale(1, 0.42);
    const gr = g.createRadialGradient(0, 0, 10, 0, 0, 230);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},.22)`);
    gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = gr;
    g.fillRect(-230, 0, 460, 260);
    g.restore();

    for (const s of ch.signs) {
      const fl = s.flick ? (Math.sin(G.t * 13 + s.ph) > 0.75 ? 0.35 : 1) : 1;
      const sx = x0 + s.x, sc = s.col;
      const rg = g.createRadialGradient(sx, s.y, 2, sx, s.y, 92);
      rg.addColorStop(0, `rgba(${sc[0]},${sc[1]},${sc[2]},${0.32 * fl})`);
      rg.addColorStop(1, `rgba(${sc[0]},${sc[1]},${sc[2]},0)`);
      g.fillStyle = rg;
      g.fillRect(sx - 92, s.y - 92, 184, 184);
      if (fl > 0.5 && s.y > 40) {
        const w = Math.min(72, s.w * 0.5) + Math.sin(G.t * 2 + s.ph) * 4;
        const rf = g.createLinearGradient(0, ROAD, 0, 330);
        rf.addColorStop(0, `rgba(${sc[0]},${sc[1]},${sc[2]},${0.08 * fl})`);
        rf.addColorStop(1, `rgba(${sc[0]},${sc[1]},${sc[2]},0)`);
        g.fillStyle = rf;
        for (const f of [1, 0.72, 0.46]) g.fillRect(Math.round(sx - (w * f) / 2), ROAD, Math.round(w * f), 112);
      }
    }
  }

  for (const p of r.props) {
    if (p.kind === "lamp") {
      if (p.x * K < cam - 120 || p.x * K > cam + W + 120) continue;
      const lx = sxOf(p.x, cam) + 8, ly = syOf(p.y) - 112;
      const rg = g.createRadialGradient(lx, ly, 2, lx, ly, 110);
      rg.addColorStop(0, "rgba(255,200,120,.40)");
      rg.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = rg;
      g.fillRect(lx - 110, ly - 110, 220, 230);

      const gg = g.createRadialGradient(lx, 236, 4, lx, 236, 82);
      gg.addColorStop(0, "rgba(255,200,120,.22)");
      gg.addColorStop(1, "rgba(255,200,120,0)");
      g.save();
      g.translate(0, 236); g.scale(1, 0.32); g.translate(0, -236);
      g.fillStyle = gg;
      g.fillRect(lx - 82, 150, 164, 172);
      g.restore();
    } else if (p.kind === "obj" && p.type === "car") {
      const cx = sxOf(p.x, cam), cy = syOf(p.y);
      if (cx < -80 || cx > W + 80) continue;
      const col = p.broken ? (p.burnT > 0 ? "rgba(255,150,60," + (0.28 + Math.random() * 0.14) + ")" : null) : "rgba(111,224,230,.24)";
      if (col) {
        g.fillStyle = col;
        g.fillRect(cx - 46, cy - 2, 92, 4);
        g.fillRect(cx - 34, cy + 2, 68, 3);
      }
      if (!p.broken) {
        g.fillStyle = "rgba(255,240,180,.11)";
        g.fillRect(p.face > 0 ? cx + 50 : cx - 120, cy - 22, 70, 10);
      }
    }
  }

  for (const p of r.projs) {
    const px = sxOf(p.x, cam), py = syOf(p.y) - 24;
    const rg = g.createRadialGradient(px, py, 1, px, py, 20);
    rg.addColorStop(0, "rgba(255,210,130,.52)");
    rg.addColorStop(1, "rgba(255,210,130,0)");
    g.fillStyle = rg;
    g.fillRect(px - 20, py - 20, 40, 40);
  }

  if (r.muzzles) {
    for (const m of r.muzzles) {
      const mx = sxOf(m.x, cam), my = Math.round((m.y - m.z) * K);
      const rad = m.big ? 62 : 44;
      const rg = g.createRadialGradient(mx, my, 2, mx, my, rad);
      rg.addColorStop(0, "rgba(255,220,140,.58)");
      rg.addColorStop(1, "rgba(255,130,40,0)");
      g.fillStyle = rg;
      g.fillRect(mx - rad, my - rad, rad * 2, rad * 2);
    }
  }

  if (r.sparks) {
    for (const s of r.sparks) {
      const sx2 = sxOf(s.x, cam), sy2 = Math.round((s.y - s.z) * K);
      const rad = s.big ? 42 : 28;
      const rg = g.createRadialGradient(sx2, sy2, 1, sx2, sy2, rad);
      rg.addColorStop(0, "rgba(255,230,150,.38)");
      rg.addColorStop(1, "rgba(255,180,80,0)");
      g.fillStyle = rg;
      g.fillRect(sx2 - rad, sy2 - rad, rad * 2, rad * 2);
    }
  }

  g.globalCompositeOperation = "source-over";
}

/* ---------- ближний параллакс, дождь, финальный композит ---------- */
function drawForegroundAndWeather(g: CanvasRenderingContext2D, cam: number) {
  /* многослойный косой дождь + брызги луж */
  g.fillStyle = "rgba(140,175,205,.18)";
  for (let i = 0; i < 45; i++) {
    const x = ((i * 67.3 + G.t * 36) % (W + 20)) - 10;
    const y = ((i * 83.1 + G.t * (270 + (i % 3) * 35)) % (H + 12)) - 6;
    g.fillRect(x | 0, y | 0, 1, 5);
  }
  g.fillStyle = "rgba(175,208,235,.32)";
  for (let i = 0; i < 65; i++) {
    const x = ((i * 53.7 + G.t * 58) % (W + 20)) - 10;
    const y = ((i * 97.3 + G.t * (380 + (i % 3) * 50)) % (H + 16)) - 8;
    g.fillRect(x | 0, y | 0, 1, 5);
    g.fillRect((x | 0) + 1, (y | 0) + 5, 1, 5);
  }
  for (let i = 0; i < 20; i++) {
    const ph = (G.t * 2.6 + i * 0.31) % 1;
    const x = ((i * 131.3) % W) | 0;
    const y = 224 + (((i * 59.9) % 130) | 0);
    const w = 2 + ph * 8;
    g.fillStyle = `rgba(185,212,235,${0.36 * (1 - ph)})`;
    g.fillRect(Math.round(x - w), y, Math.round(w * 2), 1);
  }

  /* деликатные переднеплановые провода в самом верху экрана (как на image_d8d831c5) */
  const fgOff = -(((cam * 1.15) % 900) + 900) % 900;
  g.strokeStyle = "rgba(8,12,18,.78)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(fgOff, 4);
  g.quadraticCurveTo(fgOff + 450, 22, fgOff + 900, 4);
  g.moveTo(fgOff + 900, 4);
  g.quadraticCurveTo(fgOff + 1350, 22, fgOff + 1800, 4);
  g.stroke();
}

/* ---------- главная функция ---------- */
export function render(g: CanvasRenderingContext2D) {
  const r = G.run;
  if (!r) return;
  g.imageSmoothingEnabled = false;
  const cam = Math.round(r.camX * K);
  let sx = 0, sy = 0;
  if (G.shake > 0.2) {
    sx = Math.round(rnd(-G.shake, G.shake));
    sy = Math.round(rnd(-G.shake, G.shake));
  }

  g.save();
  g.translate(sx, sy);

  drawSky(g, cam);

  for (const k in r.chunks) {
    const ch = r.chunks[k], x = Math.round(ch.x * K) - cam;
    if (x < -CHPX - 2 || x > W + 2) continue;
    g.drawImage(ch.canvas, x, 0);
    drawChunkDetails(g, ch, x);
  }

  drawGround(g, cam, r);
  drawShops(g, cam, r);
  drawEntities(g, cam);
  drawFx(g, cam, r);
  drawSteam(g, cam, r);
  drawLighting(g, cam, r);

  const st = starsNow();
  if (!r.demo && st >= 3) {
    const a = 0.08 + 0.05 * Math.sin(G.t * 8), red = Math.sin(G.t * 5) > 0;
    g.fillStyle = red ? `rgba(200,60,50,${a})` : `rgba(70,140,170,${a})`;
    g.fillRect(-4, 0, 30, H);
    g.fillRect(W - 26, 0, 34, H);
  }

  drawForegroundAndWeather(g, cam);

  g.restore();

  if (G.flash > 0) {
    g.globalAlpha = clamp(G.flash * 0.55, 0, 0.5);
    g.fillStyle = G.flashCol;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
  }

  g.drawImage(art.vig, 0, 0);

  for (const t of r.texts) {
    const a = Math.min(1, (t.life - t.t) * 3);
    g.globalAlpha = a;
    txt(g, t.s, sxOf(t.x, cam), syOf(t.y), t.col, 8 * t.sc, true);
  }
  g.globalAlpha = 1;

  if (r.ending) {
    const en = r.ending, a = Math.min(0.6, en.t * 0.5);
    g.fillStyle = en.type === "arrest" ? `rgba(30,8,14,${a})` : `rgba(4,6,12,${a})`;
    g.fillRect(0, 0, W, H);
    txt(g, en.type === "arrest" ? "ЗАДЕРЖАНЫ!" : "УШЛИ!", W / 2, H / 2 - 20, en.type === "arrest" ? "#d9605a" : "#e0a43a", 32, true);
  }
}
