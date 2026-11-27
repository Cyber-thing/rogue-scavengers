/* ======================================================================
   УЛИЦА БИЗНЕСОВ: интерактивный пиксель-арт квартал (640×220).
   Каждый из 4 бизнесов имеет 4 визуальных состояния (Lv.0..3):
   - Lv.0: неактивный/заброшенный участок (тёмные ставни, забор, без света)
   - Lv.1: открытый светящийся фасад первого этажа и неоновая вывеска
   - Lv.2: надстройка второго этажа, козырёк, кондиционеры, уличные объекты
   - Lv.3: кибер-штаб с крышной голограммой, антеннами, анимацией и транспортом
   ====================================================================== */

export const STREET_W = 640;
export const STREET_H = 220;
export const BIZ_ORDER = ["laundry", "clinic", "pawn", "noodle"] as const;
export type BizId = (typeof BIZ_ORDER)[number];

export interface BizPlotRect {
  id: BizId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BIZ_PLOTS: BizPlotRect[] = [
  { id: "laundry", x: 16, y: 18, w: 144, h: 168 },
  { id: "clinic", x: 170, y: 18, w: 144, h: 168 },
  { id: "pawn", x: 326, y: 18, w: 144, h: 168 },
  { id: "noodle", x: 480, y: 18, w: 144, h: 168 },
];

export function hitTestBizPlot(normX: number, normY: number): BizId | null {
  const px = normX * STREET_W;
  const py = normY * STREET_H;
  for (const p of BIZ_PLOTS) {
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h + 18) {
      return p.id;
    }
  }
  return null;
}

export interface BizVisualSummary {
  active: boolean;
  floors: number;
  hasNeonSign: boolean;
  hasUpperFloor: boolean;
  hasStreetProp: boolean;
  hasRooftopHolo: boolean;
}

export function describeBizStage(lv: number): BizVisualSummary {
  const l = Math.max(0, Math.min(3, Math.floor(lv)));
  return {
    active: l >= 1,
    floors: l >= 2 ? 2 : 1,
    hasNeonSign: l >= 1,
    hasUpperFloor: l >= 2,
    hasStreetProp: l >= 2,
    hasRooftopHolo: l >= 3,
  };
}

interface Theme {
  sign: string;
  wall: string;
  wallDark: string;
  wallTrim: string;
  glow: string;
  glowRgb: string;
  accent: string;
}

const THEMES: Record<BizId, Theme> = {
  laundry: {
    sign: "CASH",
    wall: "#253b4a",
    wallDark: "#15232e",
    wallTrim: "#3c5f74",
    glow: "#6fe0e6",
    glowRgb: "111,224,230",
    accent: "#4da8cc",
  },
  clinic: {
    sign: "RIPPER",
    wall: "#273c36",
    wallDark: "#162420",
    wallTrim: "#3d5e54",
    glow: "#6ee8a8",
    glowRgb: "110,232,168",
    accent: "#45b884",
  },
  pawn: {
    sign: "ХЛАМ",
    wall: "#473128",
    wallDark: "#2a1b15",
    wallTrim: "#684838",
    glow: "#e8b24a",
    glowRgb: "232,178,74",
    accent: "#c8683a",
  },
  noodle: {
    sign: "ЛАПША",
    wall: "#482633",
    wallDark: "#28131c",
    wallTrim: "#6d3a4d",
    glow: "#ff7a96",
    glowRgb: "255,122,150",
    accent: "#f0b848",
  },
};

export function drawBizStreet(
  g: CanvasRenderingContext2D,
  t: number,
  biz: Record<string, number>,
  selectedId: string,
  hoveredId: string | null
) {
  g.imageSmoothingEnabled = false;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  /* 1. Ночное небо и далёкий силуэт мегаполиса */
  const sky = g.createLinearGradient(0, 0, 0, 165);
  sky.addColorStop(0, "#050912");
  sky.addColorStop(0.55, "#111b2c");
  sky.addColorStop(1, "#2a2232");
  g.fillStyle = sky;
  g.fillRect(0, 0, STREET_W, 170);

  // Силуэт башен на горизонте
  for (let i = 0; i < 18; i++) {
    const bx = i * 38 - 6;
    const bh = 42 + ((i * 29) % 72);
    const bw = 28 + ((i * 11) % 14);
    R(bx, 168 - bh, bw, bh, i & 1 ? "#0b121d" : "#0e1726");
    for (let wy = 168 - bh + 8; wy < 145; wy += 9) {
      for (let wx = bx + 5; wx < bx + bw - 5; wx += 6) {
        if (((wx + wy + i) % 5) === 0) {
          R(wx, wy, 2, 3, (wx + i) % 3 === 0 ? "#b87a3c" : "#3a6e7c");
        }
      }
    }
  }

  // Пролетающие аэрокары на фоне неба
  for (let i = 0; i < 3; i++) {
    const dir = i === 1 ? -1 : 1;
    let cx = ((t * (22 + i * 9) + i * 210) % (STREET_W + 60)) - 30;
    if (dir < 0) cx = STREET_W - cx;
    const cy = 22 + i * 16;
    R(cx - 5, cy, 10, 2, "#121a24");
    R(cx + (dir > 0 ? 4 : -5), cy, 2, 1, dir > 0 ? "#ffe8a0" : "#e0584a");
    R(cx - dir * 8, cy + 1, 6, 1, "rgba(111,224,230,.32)");
  }

  /* 2. Тротуар и мокрый асфальт */
  R(0, 162, STREET_W, 24, "#24303a");
  R(0, 162, STREET_W, 2, "#121820");
  for (let tx = 0; tx < STREET_W; tx += 16) {
    R(tx, 164, 1, 20, "#19222a");
    R(tx + 2, 184, 12, 1, "#5c6f7e");
  }
  R(0, 184, STREET_W, 3, "#364450");
  R(0, 187, STREET_W, 33, "#10151d");
  // Дорожная разметка
  for (let dx = 12; dx < STREET_W; dx += 48) {
    R(dx, 204, 24, 2, "rgba(216,168,64,.55)");
  }

  // Уличные фонари между участками
  for (const lx of [165, 321, 475]) {
    R(lx - 1, 96, 3, 72, "#242c36");
    R(lx - 4, 94, 9, 3, "#3b4654");
    R(lx - 2, 97, 5, 2, "#ffd98c");
    const lg = g.createRadialGradient(lx, 100, 1, lx, 100, 32);
    lg.addColorStop(0, "rgba(255,212,130,.28)");
    lg.addColorStop(1, "rgba(255,212,130,0)");
    g.fillStyle = lg;
    g.fillRect(lx - 32, 68, 64, 64);
  }

  /* 3. Рендер каждого из 4 зданий */
  for (const plot of BIZ_PLOTS) {
    const lv = Math.max(0, Math.min(3, biz[plot.id] || 0));
    const th = THEMES[plot.id];
    const x = plot.x;
    const w = plot.w;
    const baseY = 166;
    const isSel = selectedId === plot.id;
    const isHov = hoveredId === plot.id;

    if (lv === 0) {
      drawInactivePlot(g, x, w, baseY, th, isSel, isHov);
    } else {
      drawActiveBuilding(g, plot.id, lv, x, w, baseY, th, t, isSel, isHov);
    }

    // Отражение неона в лужах на асфальте под участком
    const puddleX = x + 22;
    const puddleW = w - 44;
    R(puddleX, 193, puddleW, 7, "rgba(32,54,72,.55)");
    if (lv >= 1) {
      const sh = Math.round(Math.sin(t * 3.5 + x) * 4);
      const alpha = lv === 1 ? 0.25 : lv === 2 ? 0.42 : 0.65;
      R(puddleX + 10 + sh, 195, puddleW - 20, 2, `rgba(${th.glowRgb},${alpha})`);
      if (lv >= 3) {
        R(puddleX + 18 - sh, 198, puddleW - 36, 1, `rgba(${th.glowRgb},0.4)`);
      }
    }

    // Подсветка выбранного / наведённого здания
    if (isSel || isHov) {
      const bCol = isSel ? "#e8b24a" : "rgba(111,224,230,.7)";
      const topY = lv === 0 ? 96 : lv === 1 ? 82 : lv === 2 ? 48 : 26;
      const bw = 10;
      // Уголки выбора вокруг здания
      R(x - 3, topY, bw, 2, bCol);
      R(x - 3, topY, 2, bw, bCol);
      R(x + w + 3 - bw, topY, bw, 2, bCol);
      R(x + w + 1, topY, 2, bw, bCol);
      R(x - 3, baseY + 12, bw, 2, bCol);
      R(x - 3, baseY + 14 - bw, 2, bw, bCol);
      R(x + w + 3 - bw, baseY + 12, bw, 2, bCol);
      R(x + w + 1, baseY + 14 - bw, 2, bw, bCol);
    }
  }

  /* 4. Деликатный дождь по всей улице */
  g.fillStyle = "rgba(165,200,228,.22)";
  for (let i = 0; i < 42; i++) {
    const rx = ((i * 59.3 + t * 34) % (STREET_W + 10)) - 5;
    const ry = ((i * 71.7 + t * 240) % (STREET_H + 10)) - 5;
    g.fillRect(rx | 0, ry | 0, 1, 4);
  }
}

function drawInactivePlot(
  g: CanvasRenderingContext2D,
  x: number,
  w: number,
  baseY: number,
  th: Theme,
  isSel: boolean,
  isHov: boolean
) {
  const R = (rx: number, ry: number, rw: number, rh: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh));
  };

  // Заброшенный заколоченный павильон за сеткой
  const top = 104;
  R(x + 8, top, w - 16, baseY - top, "#171d24");
  R(x + 6, top, w - 12, 4, "#242c36");
  // Гофрированные закрытые рольставни
  R(x + 18, 118, w - 36, 48, "#10141a");
  for (let sy = 121; sy < 164; sy += 4) {
    R(x + 20, sy, w - 40, 2, "#1c222b");
  }
  // Диагональные доски / крест на ставнях
  g.strokeStyle = "#362b22";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + 26, 126);
  g.lineTo(x + w - 26, 156);
  g.moveTo(x + w - 26, 126);
  g.lineTo(x + 26, 156);
  g.stroke();

  // Погасшая вывеска
  R(x + 28, 108, w - 56, 12, "#0b0e14");
  g.fillStyle = isSel || isHov ? "#6f8090" : "#384450";
  g.font = '7px "Press Start 2P", monospace';
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillText(th.sign, x + w / 2, 111);

  // Сетка-ограждение участка
  g.strokeStyle = "rgba(90,108,124,.34)";
  g.lineWidth = 1;
  for (let sx = x + 4; sx < x + w - 8; sx += 10) {
    g.beginPath();
    g.moveTo(sx, baseY - 26);
    g.lineTo(sx + 10, baseY);
    g.moveTo(sx + 10, baseY - 26);
    g.lineTo(sx, baseY);
    g.stroke();
  }
  R(x + 2, baseY - 27, w - 4, 2, "#323c46");
  for (const px of [x + 2, x + w / 2 - 1, x + w - 4]) {
    R(px, baseY - 28, 2, 28, "#46525e");
  }

  // Ярлык статуса внизу на плитке
  R(x + 32, baseY + 3, w - 64, 10, "#0b1016");
  g.fillStyle = isSel ? "#e0a43a" : "#6c7a88";
  g.font = '6px "Press Start 2P", monospace';
  g.fillText("НЕ КУПЛЕНО", x + w / 2, baseY + 5);
}

function drawActiveBuilding(
  g: CanvasRenderingContext2D,
  id: BizId,
  lv: number,
  x: number,
  w: number,
  baseY: number,
  th: Theme,
  t: number,
  _isSel: boolean,
  _isHov: boolean
) {
  const R = (rx: number, ry: number, rw: number, rh: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh));
  };

  // Высота здания зависит от уровня: Lv.1 = 1 этаж (top=94), Lv.2 = 2 этажа (top=60), Lv.3 = усиленная крыша + надстройка (top=48)
  const top = lv === 1 ? 94 : lv === 2 ? 60 : 48;
  const bx = x + 4;
  const bw = w - 8;

  // Основная коробка здания
  R(bx, top, bw, baseY - top, th.wall);
  R(bx - 2, top, bw + 4, 5, th.wallTrim);
  R(bx, top + 5, bw, 2, "#0a0d12");

  // Кирпичные/панельные линии
  for (let py = top + 12; py < baseY; py += 8) {
    R(bx + 2, py, bw - 4, 1, "rgba(0,0,0,.22)");
  }
  R(bx, top, 3, baseY - top, th.wallDark);
  R(bx + bw - 3, top, 3, baseY - top, th.wallDark);

  /* --- УРОВЕНЬ 2+: ВТОРОЙ ЭТАЖ, ОКНА, ВЕНТИЛЯТОР И НАВЕС --- */
  if (lv >= 2) {
    // Разделительный карниз между этажами
    R(bx - 1, 96, bw + 2, 4, th.wallDark);
    R(bx - 1, 96, bw + 2, 1, th.wallTrim);

    // Окна 2 этажа
    for (const wx of [bx + 14, bx + 54, bx + 94]) {
      R(wx - 1, 68, 22, 20, "#0a0d12");
      const lit = wx !== bx + 54 || lv === 3;
      R(wx, 69, 20, 18, lit ? (wx === bx + 54 ? th.glow : "#e8b454") : "#16202a");
      if (lit) {
        R(wx, 69, 20, 3, "rgba(255,255,255,.35)");
        R(wx + 9, 69, 2, 18, "rgba(0,0,0,.35)");
        R(wx, 77, 20, 2, "rgba(0,0,0,.35)");
      }
    }

    // Крутящийся вентилятор / кондиционер на фасаде (сбоку)
    const fx = bx + bw - 14;
    const fy = 56;
    R(fx - 7, fy - 7, 14, 14, "#141820");
    R(fx - 5, fy - 5, 10, 10, "#242c36");
    const a = t * 10 + x;
    R(fx + Math.cos(a) * 3 - 1, fy + Math.sin(a) * 3 - 1, 3, 3, "#8fa0b0");
    R(fx - Math.cos(a) * 3 - 1, fy - Math.sin(a) * 3 - 1, 3, 3, "#8fa0b0");

    // Полосатый навес / козырёк над витриной 1 этажа
    for (let ax = bx + 6; ax < bx + bw - 8; ax += 10) {
      const even = (((ax - bx) / 10) | 0) % 2 === 0;
      R(ax, 114, 10, 7, even ? th.accent : "#dfe4e8");
      R(ax + 1, 121, 8, 2, even ? th.wallDark : "#8a96a4");
    }
  }

  /* --- УРОВЕНЬ 3: КИБЕР-НАДСТРОЙКА, ГОЛОГРАММА И НЕОН-ПОДСВЕТКА --- */
  if (lv >= 3) {
    // Неоновые полосы по краям здания
    R(bx + 1, top + 6, 2, baseY - top - 8, th.glow);
    R(bx + bw - 3, top + 6, 2, baseY - top - 8, th.glow);

    // Крышный технический блок, антенна с маячком и голографическая вывеска
    R(bx + 14, top - 10, 26, 10, "#1c242e");
    R(bx + 16, top - 8, 22, 2, "#465466");
    // Антенна + мигающий маячок
    R(bx + 22, top - 24, 2, 14, "#3a4654");
    if (Math.sin(t * 5 + x) > 0) {
      R(bx + 21, top - 26, 4, 3, "#ff5448");
    }

    // Анимированная крышная голограмма (уникальная для каждого бизнеса!)
    const hx = bx + 46;
    const hy = top - 24;
    const pulse = 0.72 + Math.sin(t * 4 + x * 0.1) * 0.22;
    R(hx, top - 6, 56, 6, "#141c26");
    g.fillStyle = `rgba(${th.glowRgb},${0.22 * pulse})`;
    g.fillRect(hx - 2, hy, 60, 18);
    g.strokeStyle = th.glow;
    g.lineWidth = 1;
    g.strokeRect(hx, hy + 1, 56, 16);
    // Сканирующая полоса голограммы
    const scanY = hy + 2 + ((t * 18) % 14);
    R(hx + 1, scanY, 54, 1, "rgba(255,255,255,.45)");

    g.fillStyle = "#ffffff";
    g.font = '6px "Press Start 2P", monospace';
    g.textAlign = "center";
    g.textBaseline = "top";
    const holoTxt = id === "laundry" ? "BANK ×" : id === "clinic" ? "BIO +3" : id === "pawn" ? "VIP 24" : "NOODLE";
    g.fillText(holoTxt, hx + 28, hy + 6);
  }

  /* --- УРОВЕНЬ 1+: СВЕТЯЩАЯСЯ ВЫВЕСКА И ВИТРИНЫ 1 ЭТАЖА --- */
  const signY = lv >= 2 ? 99 : 97;
  R(bx + 18, signY, bw - 36, 14, "#070a0f");
  R(bx + 20, signY + 2, bw - 40, 10, th.wallDark);
  // Свечение вывески
  const sg = g.createRadialGradient(x + w / 2, signY + 7, 2, x + w / 2, signY + 7, 46);
  sg.addColorStop(0, `rgba(${th.glowRgb},${lv >= 3 ? 0.36 : 0.24})`);
  sg.addColorStop(1, `rgba(${th.glowRgb},0)`);
  g.fillStyle = sg;
  g.fillRect(x, signY - 24, w, 64);

  g.fillStyle = th.glow;
  g.font = '8px "Press Start 2P", monospace';
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillText(th.sign, x + w / 2, signY + 4);

  // Витрина слева, дверь по центру/справа — уникальные интерьеры для каждого бизнеса
  const winY = 125;
  const winH = 34;
  R(bx + 8, winY, 64, winH, "#080c12");
  R(bx + 10, winY + 2, 60, winH - 4, th.wallDark);
  R(bx + 10, winY + 2, 60, 7, `rgba(${th.glowRgb},0.28)`);

  // Силуэты внутри витрины
  if (id === "laundry") {
    for (let i = 0; i < 3; i++) {
      R(bx + 14 + i * 19, winY + 12, 15, 18, "#223a48");
      R(bx + 17 + i * 19, winY + 15, 9, 9, th.glow);
    }
  } else if (id === "clinic") {
    R(bx + 18, winY + 9, 18, 22, "#113a32");
    R(bx + 21, winY + 12, 12, 16, th.glow);
    R(bx + 44, winY + 14, 18, 14, "#1e322e");
    R(bx + 51, winY + 17, 4, 8, "#ff6870");
    R(bx + 49, winY + 19, 8, 4, "#ff6870");
  } else if (id === "pawn") {
    R(bx + 12, winY + 14, 56, 2, "#7a5836");
    R(bx + 12, winY + 24, 56, 2, "#7a5836");
    for (let i = 0; i < 5; i++) {
      R(bx + 15 + i * 11, winY + 9, 6, 5, i & 1 ? th.glow : "#8ea4b8");
      R(bx + 15 + i * 11, winY + 19, 7, 5, i & 1 ? "#c85a3a" : th.glow);
    }
  } else {
    // Лапшичная: открытая стойка с тёплым светом и фонариками
    R(bx + 10, winY + 20, 60, 10, "#5c3422");
    for (let i = 0; i < 3; i++) {
      R(bx + 16 + i * 20, winY + 4, 6, 8, "#e0485a");
      R(bx + 17 + i * 20, winY + 6, 4, 4, "#ffe08a");
    }
    R(bx + 26, winY + 15, 10, 5, "#f0e8d0");
    R(bx + 46, winY + 15, 10, 5, "#f0e8d0");
  }
  // Блик стекла витрины
  R(bx + 16, winY + 2, 4, winH - 4, "rgba(255,255,255,.12)");

  // Входная дверь / гараж справа
  if (id === "pawn") {
    // У Скупки — рольставня гаража
    R(bx + 80, 122, 46, 44, "#0a0d12");
    R(bx + 82, 124, 42, 42, lv >= 2 ? "#221814" : "#2f3842");
    if (lv >= 2) {
      R(bx + 86, 126, 34, 4, th.glow);
      R(bx + 90, 148, 16, 16, "#5a422c");
      R(bx + 108, 142, 12, 22, "#3a4c5e");
    } else {
      for (let gy = 128; gy < 164; gy += 4) R(bx + 82, gy, 42, 2, "#465260");
    }
  } else {
    R(bx + 86, 122, 32, 44, "#0a0d12");
    R(bx + 88, 124, 28, 42, "#1c2834");
    R(bx + 91, 127, 22, 24, `rgba(${th.glowRgb},0.35)`);
    R(bx + 111, 142, 2, 6, th.glow);
  }
  // Свет из двери на тротуар
  R(bx + 86, baseY, 32, 8, `rgba(${th.glowRgb},0.18)`);

  /* --- УЛИЧНЫЕ ЭЛЕМЕНТЫ ПРИ УЛУЧШЕНИЯХ Lv.2 и Lv.3 --- */
  if (lv >= 2) {
    if (id === "laundry") {
      // Уличный крипто-терминал (ATM) на тротуаре слева
      R(bx + 4, 140, 14, 28, "#0a0d12");
      R(bx + 5, 141, 12, 26, "#2c4c5e");
      R(bx + 7, 144, 8, 7, "#6fe0e6");
      R(bx + 8, 154, 6, 2, "#e0a43a");
    } else if (id === "clinic") {
      // Крио-баллон с биогелем у входа
      R(bx + 6, 138, 12, 30, "#0a0d12");
      R(bx + 8, 140, 8, 24, "#1e6e58");
      R(bx + 9, 144, 6, 14, "#6ee8a8");
      R(bx + 7, 137, 10, 3, "#6a7886");
    } else if (id === "pawn") {
      // Стопка ящиков / запчастей у гаража
      R(bx + 4, 150, 16, 16, "#5a422c");
      R(bx + 6, 152, 12, 2, "#8a6846");
      R(bx + 21, 155, 11, 11, "#3a4c5e");
    } else {
      // Уличные табуреты и паровой котёл лапшичной
      for (const sx of [bx + 18, bx + 36, bx + 54]) {
        R(sx, 160, 8, 3, "#b84048");
        R(sx + 3, 163, 2, 6, "#242c36");
      }
      // Лёгкий пар от лапшичной
      for (let i = 0; i < (lv >= 3 ? 6 : 3); i++) {
        const sp = (t * 0.65 + i * 0.25) % 1;
        const sy = 136 - sp * 28;
        const sx = bx + 28 + Math.sin(t * 2 + i) * 5;
        R(sx, sy, 4 + sp * 6, 3, `rgba(240,228,236,${0.26 * (1 - sp)})`);
      }
    }
  }

  if (lv >= 3) {
    if (id === "laundry") {
      // Патрульный дрон охраны над входом
      const dx = bx + 100 + Math.sin(t * 2.2) * 18;
      const dy = 110 + Math.cos(t * 3.4) * 3;
      R(dx - 7, dy - 3, 14, 6, "#1e2a36");
      R(dx - 5, dy - 2, 10, 2, "#6fe0e6");
      R(dx - 3, dy + 3, 6, 1, "rgba(111,224,230,.5)");
    } else if (id === "clinic") {
      // Светящаяся мед-площадка у двери + мигающий крест
      R(bx + 80, baseY + 2, 44, 6, "rgba(110,232,168,.32)");
      R(bx + 99, baseY + 3, 6, 4, "#6ee8a8");
    } else if (id === "pawn") {
      // Кибер ховер-байк припаркован перед гаражом
      const mx = bx + 78;
      const my = 152 + Math.round(Math.sin(t * 4) * 1);
      R(mx, my + 4, 34, 6, "#a84434");
      R(mx + 6, my, 14, 5, "#242c38");
      R(mx + 2, my + 10, 8, 2, "#6fe0e6");
      R(mx + 24, my + 10, 8, 2, "#6fe0e6");
    } else {
      // Гирлянда ярких фонариков вдоль фасада
      for (let lx = bx + 8; lx < bx + bw - 8; lx += 14) {
        const ly = 123 + Math.round(Math.sin(t * 4 + lx) * 1);
        R(lx, ly, 4, 6, lx % 28 === 0 ? "#ff6884" : "#f4c869");
      }
    }
  }

  // Ярлык уровня на тротуаре под зданием
  R(x + 40, baseY + 4, w - 80, 10, "#080d14");
  g.fillStyle = th.glow;
  g.font = '6px "Press Start 2P", monospace';
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillText(`LV.${lv}`, x + w / 2, baseY + 6);
}
