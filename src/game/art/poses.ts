/* ======================================================================
   ПОЗЫ 3/4 (SEGA BEAT-'EM-UP): чистая математика скелета и плавной
   многокадровой анимации.
   - Поворот корпуса 3/4 к зрителю (видны оба плеча, грудь, бёдра).
   - Естественные широкие боевые стойки (передняя нога вынесена вперёд,
     задняя в упоре, ближняя рука в защите у подбородка, дальняя впереди).
   - 8 кадров idle, 10 кадров walk, 10 кадров run, 6 кадров attack (+ комбо),
     4 кадра hurt, 5 кадров down, 6 кадров loot, 4 кадра cower.
   - Плавные гармонические траектории без резких скачков посадки таза.
   ====================================================================== */

export const SW = 120, SH = 104, OX = 60, OY = 96;

export interface Pose {
  dx: number;
  hipDy: number;
  lean: number;       // наклон корпуса вперёд/назад (градусы)
  twist: number;      // разворот груди к зрителю: >0 открытая стойка 3/4, <0 замах/кросс
  tilt: number;       // наклон головы
  hdx: number;
  hdy: number;
  // Углы рук: near = ближняя к камере (-X сторона корпуса), lead = дальняя/передняя (+X сторона)
  nU: number; nF: number;
  lU: number; lF: number;
  // Углы ног: front = вынесенная к врагу нога, back = опорная задняя нога
  fT: number; fS: number;
  kT: number; kS: number;
  mouth: number;
  eyes: number;
  flash: number;
  whip: number;
  smear: number;      // 0 = нет, 1 = джеб передней, 2 = мощный кросс/апперкот ближней, 3 = выстрел
  coatSwing: number;
  bodyAng: number;    // угол тела при нокдауне
}

export const POSE_FRAMES = {
  idle: 8,
  walk: 10,
  run: 10,
  attack: 6,
  hurt: 4,
  down: 5,
  loot: 6,
  cower: 4,
} as const;

export interface CharMetrics {
  thighLen: number;
  shinLen: number;
  torsoLen: number;
  footH: number;
  neckLen: number;
  headRx: number;
  headRy: number;
  totalHeight: number;
  headHeight: number;
  headToBodyRatio: number;
}

export function getCharMetrics(s: number): CharMetrics {
  const thighLen = 16.5 * s;
  const shinLen = 16.5 * s;
  const torsoLen = 23.0 * s;
  const footH = 2.8 * s;
  const neckLen = 2.3 * s;
  const headRx = 4.15 * s;
  const headRy = 4.55 * s;
  const headHeight = headRy * 2;
  const totalHeight = footH + shinLen + thighLen + torsoLen + neckLen + headHeight;
  return {
    thighLen,
    shinLen,
    torsoLen,
    footH,
    neckLen,
    headRx,
    headRy,
    totalHeight,
    headHeight,
    headToBodyRatio: headHeight / totalHeight,
  };
}

// Естественная 3/4 боевая стойка (классический 16-битный brawler)
const P0: Pose = {
  dx: 0,
  hipDy: 0,
  lean: 7,
  twist: 1.08,
  tilt: 0,
  hdx: 0,
  hdy: 0,
  nU: -14, nF: 94,   // ближняя рука собрана в боевой гард у груди/корпуса
  lU: 46, lF: 146,   // передняя рука вынесена вперёд в высокий боевой гард
  fT: 31, fS: -11,   // передняя нога устойчиво вынесена вперёд
  kT: -25, kS: -21,  // задняя нога в плотном упоре
  mouth: 0,
  eyes: 0,
  flash: 0,
  whip: 0,
  smear: 0,
  coatSwing: 0,
  bodyAng: 0,
};

/* 10-фазная плавная походка: мягкая синусоида опоры и маха без рывков */
function walkStep(idx: number, run: boolean): { fT: number; fS: number; kT: number; kS: number; bob: number; sw: number } {
  const ph = (((idx % 10) + 10) % 10) / 10 * Math.PI * 2;
  const swF = Math.sin(ph);
  const swB = Math.sin(ph + Math.PI);
  const ampT = run ? 36 : 24;
  const bendF = Math.max(0, -Math.cos(ph)) * (run ? 54 : 32);
  const bendB = Math.max(0, -Math.cos(ph + Math.PI)) * (run ? 54 : 32);
  const fT = swF * ampT + (run ? 6 : 3);
  const kT = swB * ampT + (run ? 6 : 3);
  const fS = fT - bendF - (swF > 0 ? 4 : 8);
  const kS = kT - bendB - (swB > 0 ? 4 : 8);
  const bob = -Math.abs(Math.sin(ph)) * (run ? 1.8 : 0.9);
  return { fT, fS, kT, kS, bob, sw: swF };
}

export function getPose(
  name: string,
  fr: number,
  o: { ranged?: boolean; whip?: boolean; civ?: boolean; combo?: number; female?: boolean } = {}
): Pose {
  const p = { ...P0 };
  const A = (v: Partial<Pose>) => Object.assign(p, v);
  const civ = !!o.civ;
  const combo = (o.combo || 0) & 1;
  const fem = !!o.female;

  switch (name) {
    case "idle": {
      const f = ((fr % 8) + 8) % 8;
      const br = Math.sin((f / 8) * Math.PI * 2);
      const br2 = Math.cos((f / 8) * Math.PI * 2);
      if (civ) {
        A({
          lean: 2 + br * 0.8,
          twist: 1.08,
          hipDy: br * 0.45,
          hdy: br * 0.35,
          nU: 8 + br * 2, nF: 24 + br * 2,
          lU: 10 - br * 2, lF: 22 - br * 2,
          fT: 14, fS: -3,
          kT: -13, kS: -10,
          coatSwing: br * 1.1,
          eyes: f === 7 ? 1 : 0,
        });
      } else if (o.ranged) {
        A({
          lean: 5 + br * 1.0,
          twist: 1.04,
          hipDy: br * 0.5,
          hdy: br * 0.35,
          nU: -18 + br * 2, nF: 84 + br2 * 3,
          lU: 66 + br * 2, lF: 94 + br2 * 2,
          fT: 26, fS: -7,
          kT: -24, kS: -18,
          coatSwing: -1.5 + br * 1.2,
          eyes: f === 7 ? 1 : 0,
        });
      } else if (o.whip) {
        A({
          lean: 5 + br * 1.0,
          twist: 1.12,
          hipDy: br * 0.45,
          hdy: br * 0.3,
          nU: -20 + br * 2.5, nF: 86 + br2 * 3,
          lU: 52 - br * 2, lF: 142 + br * 3,
          fT: 26 + br, fS: -6,
          kT: -24 - br, kS: -18,
          coatSwing: -1 + br * 1.2,
          eyes: f === 7 ? 1 : 0,
        });
      } else if (fem) {
        // Сильная атлетичная женская боевая стойка в 3/4 (как Blaze / Lucia)
        A({
          lean: 6 + br * 1.1,
          twist: 1.10 + br * 0.04,
          hipDy: br * 0.5,
          hdy: br * 0.35,
          nU: -12 + br * 2.5, nF: 102 + br2 * 3,
          lU: 48 - br * 2, lF: 144 + br * 3,
          fT: 30, fS: -10,
          kT: -24, kS: -18,
          coatSwing: -1 + br * 1.4,
          eyes: f === 7 ? 1 : 0,
        });
      } else {
        // Классическая 3/4 боевая стойка тяжеловеса / бойца (Axel / Galsia)
        A({
          lean: 7 + br * 1.2,
          twist: 1.08 + br * 0.04,
          hipDy: br * 0.55,
          hdy: br * 0.35,
          nU: -14 + br * 2.5, nF: 94 + br2 * 3,
          lU: 46 - br * 2.0, lF: 146 + br * 3.5,
          fT: 31, fS: -11,
          kT: -25, kS: -21,
          coatSwing: -1 + br * 1.4,
          eyes: f === 7 ? 1 : 0,
        });
      }
      break;
    }

    case "walk":
    case "run": {
      const run = name === "run";
      const st = walkStep(fr, run);
      if (run) {
        A({
          fT: st.fT, fS: st.fS, kT: st.kT, kS: st.kS,
          lean: 15 + st.sw * 1.5,
          twist: 0.78 - st.sw * 0.14,
          hipDy: st.bob,
          hdy: st.bob * 0.35,
          tilt: -3,
          nU: 16 - st.sw * 28, nF: 124 - st.sw * 18,
          lU: 30 + st.sw * 28, lF: 132 + st.sw * 18,
          mouth: 1,
          coatSwing: -5 - Math.abs(st.sw) * 2,
        });
      } else if (civ) {
        A({
          fT: st.fT * 0.85, fS: st.fS * 0.85, kT: st.kT * 0.85, kS: st.kS * 0.85,
          lean: 4 + Math.abs(st.sw) * 1.0,
          twist: 0.94 - st.sw * 0.1,
          hipDy: st.bob * 0.7,
          nU: -st.sw * 18, nF: -st.sw * 18 + 20,
          lU: st.sw * 18, lF: st.sw * 18 + 20,
          coatSwing: -1.5 + st.sw * 1.2,
        });
      } else {
        A({
          fT: st.fT, fS: st.fS, kT: st.kT, kS: st.kS,
          lean: 8 + Math.abs(st.sw) * 1.2,
          twist: 0.92 - st.sw * 0.12,
          hipDy: st.bob,
          hdy: st.bob * 0.3,
          nU: 10 - st.sw * 20, nF: 128 - st.sw * 14,
          lU: 32 + st.sw * 20, lF: 138 + st.sw * 14,
          coatSwing: -2.5 + st.sw * 1.5,
        });
      }
      if (o.ranged && !civ) {
        A({
          lU: 58 + st.sw * 4, lF: 96 + st.sw * 3,
          nU: 18 - st.sw * 6, nF: 112,
        });
      }
      break;
    }

    case "attack": {
      const f = ((fr % 6) + 6) % 6;
      if (o.ranged) {
        // Голд-стиль выстрел с вытянутой передней руки + лёгкая отдача
        if (f === 0) A({ lean: 4, twist: 0.85, lU: 74, lF: 92, nU: 16, nF: 88, fT: 22, fS: -6, kT: -20, kS: -14 });
        else if (f === 1) A({ lean: 4, dx: 1, twist: 0.78, lU: 88, lF: 90, nU: 10, nF: 78, fT: 24, fS: -6, kT: -22, kS: -14 });
        else if (f === 2) A({ lean: -1, dx: -1, hdx: -1, twist: 0.72, lU: 82, lF: 84, nU: 8, nF: 72, flash: 1, mouth: 2, fT: 26, fS: -8, kT: -24, kS: -16, smear: 3, coatSwing: -4 });
        else if (f === 3) A({ lean: 1, dx: -1, twist: 0.76, lU: 86, lF: 88, nU: 12, nF: 80, flash: 1, fT: 24, fS: -7, kT: -22, kS: -14, coatSwing: -2 });
        else if (f === 4) A({ lean: 3, twist: 0.85, lU: 80, lF: 92, nU: 16, nF: 86, fT: 22, fS: -6, kT: -20, kS: -14 });
        else A({ lean: 4, twist: 0.92, lU: 66, lF: 96, nU: 18, nF: 94, fT: 20, fS: -5, kT: -19, kS: -13 });
      } else if (o.whip) {
        // 6-кадровый хлыст с разворотом корпуса
        if (f === 0) A({ lean: -5, twist: 1.2, dx: -1, lU: -22, lF: -60, nU: 28, nF: 124, whip: 0, fT: 18, fS: -4, kT: -22, kS: -16, coatSwing: 3 });
        else if (f === 1) A({ lean: -10, twist: 1.35, dx: -3, lU: -58, lF: -110, nU: 38, nF: 132, whip: 1, fT: 14, fS: -2, kT: -26, kS: -20, mouth: 2, coatSwing: 5 });
        else if (f === 2) A({ lean: 12, twist: 0.65, dx: 4, lU: 74, lF: 88, nU: -14, nF: 44, whip: 2, fT: 36, fS: -10, kT: -28, kS: -26, mouth: 1, smear: 1, coatSwing: -6 });
        else if (f === 3) A({ lean: 15, twist: 0.55, dx: 5, lU: 88, lF: 94, nU: -20, nF: 32, whip: 3, fT: 40, fS: -12, kT: -32, kS: -30, smear: 1, coatSwing: -7 });
        else if (f === 4) A({ lean: 9, twist: 0.82, dx: 2, lU: 62, lF: 84, nU: 8, nF: 88, whip: 4, fT: 26, fS: -8, kT: -24, kS: -20, coatSwing: -3 });
        else A({ lean: 5, twist: 1.0, dx: 1, lU: 44, lF: 100, nU: 26, nF: 120, whip: 5, fT: 20, fS: -5, kT: -19, kS: -14 });
      } else if (combo === 0) {
        // Комбо 0: быстрый аниме-джеб передней рукой с криком
        if (f === 0) A({ lean: 2, twist: 1.15, dx: -1, lU: 20, lF: 95, nU: 34, nF: 138, fT: 22, fS: -6, kT: -22, kS: -14, coatSwing: 2 });
        else if (f === 1) A({ lean: -3, twist: 1.25, dx: -2, lU: -18, lF: 48, nU: 42, nF: 144, fT: 18, fS: -4, kT: -24, kS: -16, mouth: 2, coatSwing: 4 });
        else if (f === 2) A({ lean: 14, twist: 0.62, dx: 4, hipDy: 0.8, lU: 90, lF: 90, nU: -22, nF: 78, fT: 34, fS: -10, kT: -28, kS: -24, mouth: 1, smear: 1, coatSwing: -6 });
        else if (f === 3) A({ lean: 16, twist: 0.56, dx: 5, hipDy: 1.0, lU: 94, lF: 92, nU: -26, nF: 68, fT: 36, fS: -12, kT: -30, kS: -26, mouth: 1, smear: 1, coatSwing: -7 });
        else if (f === 4) A({ lean: 9, twist: 0.84, dx: 2, lU: 66, lF: 104, nU: 12, nF: 112, fT: 28, fS: -8, kT: -24, kS: -18, coatSwing: -3 });
        else A({ lean: 6, twist: 1.0, dx: 1, lU: 50, lF: 112, nU: 26, nF: 126, fT: 24, fS: -6, kT: -21, kS: -14 });
      } else {
        // Комбо 1: мощный удар ближней рукой (кросс / апперкот с широким замахом)
        if (f === 0) A({ lean: -4, twist: 1.28, dx: -2, hipDy: 1.0, nU: -30, nF: -64, lU: 40, lF: 122, fT: 24, fS: -6, kT: -22, kS: -16, coatSwing: 3 });
        else if (f === 1) A({ lean: -8, twist: 1.38, dx: -3, hipDy: 1.5, nU: -56, nF: -96, lU: 48, lF: 128, fT: 20, fS: -4, kT: -26, kS: -20, mouth: 2, coatSwing: 4 });
        else if (f === 2) A({ lean: 15, twist: 0.45, dx: 5, hipDy: -0.5, nU: 98, nF: 108, lU: -16, lF: 60, fT: 36, fS: -10, kT: -30, kS: -26, mouth: 1, smear: 2, coatSwing: -6 });
        else if (f === 3) A({ lean: 14, twist: 0.40, dx: 6, hipDy: -1.0, nU: 112, nF: 124, lU: -22, lF: 48, fT: 34, fS: -10, kT: -28, kS: -24, smear: 2, coatSwing: -5 });
        else if (f === 4) A({ lean: 8, twist: 0.78, dx: 2, nU: 68, nF: 128, lU: 20, lF: 100, fT: 26, fS: -8, kT: -22, kS: -16 });
        else A({ lean: 5, twist: 0.98, dx: 1, nU: 34, nF: 130, lU: 44, lF: 112, fT: 22, fS: -6, kT: -20, kS: -14 });
      }
      break;
    }

    case "hurt": {
      const f = ((fr % 4) + 4) % 4;
      if (f === 0) A({ lean: -16, twist: 1.15, tilt: -14, hdx: -2, dx: -3, nU: -38, nF: -16, lU: -48, lF: -22, fT: 18, fS: 16, kT: -24, kS: -28, mouth: 1, eyes: 1, coatSwing: 5 });
      else if (f === 1) A({ lean: -12, twist: 1.1, tilt: -10, hdx: -1.5, dx: -2, nU: -26, nF: 0, lU: -36, lF: -10, fT: 16, fS: 12, kT: -22, kS: -24, mouth: 1, eyes: 1, coatSwing: 3 });
      else if (f === 2) A({ lean: -5, twist: 1.05, tilt: -5, hdx: -0.5, dx: -1, nU: -4, nF: 68, lU: -10, lF: 72, fT: 16, fS: 4, kT: -18, kS: -16, mouth: 1, coatSwing: 1 });
      else A({ lean: 2, twist: 1.0, tilt: -1, dx: 0, nU: 20, nF: 116, lU: 28, lF: 108, fT: 18, fS: -4, kT: -18, kS: -12 });
      break;
    }

    case "down": {
      const f = Math.max(0, Math.min(4, fr | 0));
      if (f === 0) A({ bodyAng: -42, hipDy: -10, lean: -10, tilt: -12, nU: -44, nF: -16, lU: -66, lF: -28, fT: 28, fS: 20, kT: -12, kS: 12, mouth: 1, eyes: 1 });
      else if (f === 1) A({ bodyAng: -78, hipDy: -6, lean: -6, tilt: -6, nU: -30, nF: 10, lU: -56, lF: -12, fT: 18, fS: 14, kT: -8, kS: 8, mouth: 1, eyes: 1 });
      else if (f === 2) A({ bodyAng: -90, hipDy: 0, lean: -2, tilt: 6, nU: 20, nF: 72, lU: -22, lF: 44, fT: 16, fS: 10, kT: -8, kS: 4, mouth: 1, eyes: 1 });
      else if (f === 3) A({ bodyAng: -92, hipDy: 1, lean: 0, tilt: 4, nU: 28, nF: 88, lU: 12, lF: 76, fT: 10, fS: 4, kT: -6, kS: -4, eyes: 1 });
      else A({ bodyAng: 0, hipDy: 3, lean: 28, twist: 0.9, tilt: 6, nU: 10, nF: -16, lU: 52, lF: 94, fT: 58, fS: -12, kT: -28, kS: -74 });
      break;
    }

    case "loot": {
      const f = ((fr % 6) + 6) % 6;
      const w = Math.sin((f / 6) * Math.PI * 2);
      A({
        lean: 26 + w * 2.0,
        twist: 0.85,
        tilt: 10 + w * 1.5,
        hipDy: 2.5,
        lU: 58 + w * 12, lF: 46 + w * 20,
        nU: 38 - w * 8, nF: 68 - w * 10,
        fT: 56, fS: -10, kT: -26, kS: -72,
        coatSwing: -2,
      });
      break;
    }

    case "cower": {
      const f = ((fr % 4) + 4) % 4;
      const sh = Math.sin((f / 4) * Math.PI * 2) * 1.0;
      A({
        lean: 40 + sh,
        twist: 0.9,
        tilt: 18,
        dx: sh * 0.4,
        hipDy: 3,
        nU: 118 + sh * 3, nF: 184,
        lU: 102 - sh * 3, lF: 174,
        fT: 78, fS: -8, kT: -44, kS: -82,
        mouth: 1, eyes: 1,
      });
      break;
    }
  }
  return p;
}

export function poseOf(u: {
  dead?: boolean;
  state?: string;
  downT?: number;
  st?: number;
  atkDur?: number;
  anim?: number;
  moving?: boolean;
  id?: number;
  atkSeq?: number;
}, globalTime: number): [string, number] {
  if (u.dead) {
    const dt = u.downT ?? 1;
    return ["down", dt < 0.14 ? 1 : dt < 0.28 ? 2 : 3];
  }
  switch (u.state) {
    case "down": {
      const dt = u.downT || 0;
      if (dt < 0.12) return ["down", 0];
      if (dt < 0.26) return ["down", 1];
      if (dt < 0.42) return ["down", 2];
      if (dt < 0.72) return ["down", 3];
      return ["down", 4];
    }
    case "hurt": {
      const st = u.st ?? 0.26;
      const elapsed = Math.max(0, 0.26 - st);
      return ["hurt", Math.min(3, Math.floor((elapsed / 0.26) * 4))];
    }
    case "attack": {
      const dur = u.atkDur || 0.34;
      const p = Math.max(0, Math.min(0.999, (u.st || 0) / dur));
      return ["attack", Math.floor(p * 6)];
    }
    case "loot":
      return u.moving ? ["walk", (((u.anim || 0) * 11) | 0) % 10] : ["loot", ((globalTime * 10) | 0) % 6];
    case "cower":
      return ["cower", ((globalTime * 10) | 0) % 4];
    case "run":
      return ["run", (((u.anim || 0) * 14) | 0) % 10];
  }
  if (u.moving) return ["walk", (((u.anim || 0) * 11) | 0) % 10];
  return ["idle", (((globalTime * 4.5 + (u.id || 0) * 1.37) | 0) % 8 + 8) % 8];
}
