/* ======================================================================
   ЧИСТАЯ ЛОГИКА СПРАЙТ-ЛИСТОВ ДЛЯ БОЙЦОВ БАНДЫ (rat, hulk, runner, cutter)
   Кадры 8-кадрового атласа (148×112, стопы в (74, 104)):
   0: idle | 1..3: walk stride A / mid / B | 4: windup / loot | 5: strike | 6: hurt | 7: down
   ====================================================================== */

export const SHEET_CELL_W = 148;
export const SHEET_CELL_H = 112;
export const SHEET_ANCHOR_X = 74;
export const SHEET_ANCHOR_Y = 104;
export const SHEET_FRAMES = 8;

export const SHEET_CLASSES = ["rat", "hulk", "runner", "cutter"] as const;
export type SheetClass = (typeof SHEET_CLASSES)[number];

export function isSheetClass(cls: string): cls is SheetClass {
  return (SHEET_CLASSES as readonly string[]).includes(cls);
}

const WALK_SEQ = [1, 2, 3, 2] as const;

export interface SheetFramePose {
  frame: number;
  bobY: number;
  lungeX: number;
}

export function selectSheetFrame(u: any, t: number): SheetFramePose {
  const st = u.state || "idle";
  if (u.dead || st === "down") {
    const dt = u.downT ?? 1;
    return { frame: dt < 0.14 ? 6 : 7, bobY: 0, lungeX: 0 };
  }
  if (st === "hurt") {
    return { frame: 6, bobY: 0, lungeX: -1 };
  }
  if (st === "attack") {
    const dur = Math.max(0.12, u.atkDur || 0.36);
    const p = Math.max(0, Math.min(1, (u.st || 0) / dur));
    const ranged = u.cls === "runner" || u.eqi?.weapon === "smg";
    if (ranged) {
      return {
        frame: p < 0.22 ? 0 : 5,
        bobY: 0,
        lungeX: p >= 0.22 && p < 0.65 ? -1 : 0,
      };
    }
    const windup = p < 0.28;
    return {
      frame: windup ? 4 : 5,
      bobY: 0,
      lungeX: windup ? -1 : p < 0.72 ? (u.cls === "hulk" ? 3 : 2) : 1,
    };
  }
  if (st === "loot") {
    if (u.moving) {
      const idx = Math.floor((u.anim || 0) * 6) % WALK_SEQ.length;
      return { frame: WALK_SEQ[idx], bobY: 0, lungeX: 0 };
    }
    const bob = Math.sin(t * 9 + (u.id || 0)) > 0.35 ? 1 : 0;
    return { frame: 4, bobY: bob, lungeX: 0 };
  }
  if (u.moving) {
    const idx = Math.floor((u.anim || 0) * 6) % WALK_SEQ.length;
    return { frame: WALK_SEQ[idx], bobY: 0, lungeX: 0 };
  }
  const breathe = Math.sin(t * 3.6 + (u.id || 0) * 1.7) > 0.48 ? 1 : 0;
  return { frame: 0, bobY: breathe, lungeX: 0 };
}

/* Перекраска одежды по вариантам палитры (0 = оригинал как на портрете, 1..3 = альт. куртки/броня) */
export function recolorAtlasPixels(data: Uint8ClampedArray, cls: SheetClass, variant: number, flash: boolean): void {
  const v = ((variant | 0) % 4 + 4) % 4;
  if (!flash && v === 0) return;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    if (flash) {
      data[i] = 246;
      data[i + 1] = 238;
      data[i + 2] = 224;
      continue;
    }

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    const lum = (r + g + b) / 3;

    // Защищаем тёмные контуры и совсем белые блики
    if (lum < 36 || lum > 235) continue;

    if (cls === "cutter") {
      // Куртка Куттер ярко-малиновая: r заметно выше g и b (кожа имеет g ~ 0.68*r и сюда не попадает)
      if (r > g * 1.48 && r > b * 1.48 && r > 55) {
        if (v === 1) { data[i] = Math.round(b * 0.9); data[i + 1] = Math.round(g * 1.35 + 24); data[i + 2] = Math.min(255, Math.round(r * 1.05)); } // кобальт
        else if (v === 2) { data[i] = Math.round(r * 0.78); data[i + 1] = Math.round(g * 0.95); data[i + 2] = Math.min(255, Math.round(r * 0.92)); } // фиолет
        else if (v === 3) { data[i] = Math.round(g * 1.05); data[i + 1] = Math.min(255, Math.round(r * 0.85)); data[i + 2] = Math.round(r * 0.65); } // изумруд
      }
    } else if (cls === "runner") {
      // Куртка Раннера бирюзово-тёмная: g и b выше r, но не светящийся циановый глаз
      if (b > r + 10 && g > r + 6 && lum < 145) {
        if (v === 1) { data[i] = Math.min(255, Math.round(b * 1.12)); data[i + 1] = Math.round(r * 1.05); data[i + 2] = Math.round(r * 1.1); } // тёмно-бордовый
        else if (v === 2) { data[i] = Math.min(255, Math.round(b * 1.15)); data[i + 1] = Math.round(g * 0.92); data[i + 2] = Math.round(r * 0.95); } // охра-песок
        else if (v === 3) { data[i] = Math.round(g * 0.82); data[i + 1] = Math.round(r * 1.05); data[i + 2] = Math.min(255, Math.round(b * 1.15)); } // индиго
      }
    } else if (cls === "rat") {
      // Оливково-хаки жилет и штаны Крысы (без тёплой кожи, у кожи r - b > 26 и r > g + 16)
      const isSkin = r > g + 14 && r - b > 28 && lum > 85;
      if (!isSkin && maxc - minc >= 4 && g >= b && lum < 165) {
        if (v === 1) { data[i] = Math.round(r * 0.72); data[i + 1] = Math.round(g * 0.86); data[i + 2] = Math.min(255, Math.round(r * 1.16)); } // стальной синий
        else if (v === 2) { data[i] = Math.min(255, Math.round(r * 1.18)); data[i + 1] = Math.round(g * 0.66); data[i + 2] = Math.round(b * 0.72); } // ржавый кирпич
        else if (v === 3) { data[i] = Math.round(r * 0.92); data[i + 1] = Math.min(255, Math.round(g * 1.08)); data[i + 2] = Math.round(b * 0.85); } // хвойный
      }
    } else if (cls === "hulk") {
      // Тёмная майка и штаны Громилы (не трогаем тёплую кожу и светлую сталь руки)
      const isCloth = lum >= 36 && lum <= 84 && maxc - minc <= 18 && b >= r - 2;
      if (isCloth) {
        if (v === 1) { data[i] = Math.min(255, r + 24); data[i + 1] = g; data[i + 2] = Math.max(0, b - 4); } // бордовая
        else if (v === 2) { data[i] = Math.max(0, r - 4); data[i + 1] = Math.min(255, g + 18); data[i + 2] = Math.max(0, b - 4); } // армейский хаки
        else if (v === 3) { data[i] = Math.max(0, r - 4); data[i + 1] = Math.min(255, g + 10); data[i + 2] = Math.min(255, b + 28); } // тёмно-синий
      }
    }
  }
}
