/* ======================================================================
   Персонажи: скелетная риг-система + процедурный пиксель-арт.
   Каждая поза считается через прямую кинематику (FK), детали красятся
   Px.paint() с шейдингом и швами. Спрайты кэшируются.
   ====================================================================== */
import { Px, Ramp, ramp, dimRamp, darken, lighten, mix, ellM, capM, polyM, rectM, unionM, subM, interM } from "./px";

export const SW = 96, SH = 96, OX = 48, OY = 90;
export type Eq = { head?: string | null; weapon?: string | null; neck?: string | null; body?: string | null };

export interface Look {
  s: number; bulk: number;
  skin: string; hair?: string; top: string; top2?: string; pants: string; shoe: string; metal?: string; accent?: string;
  head: string; torso: string; armF: string; armB: string;
  coat?: boolean; defW?: string | null;
}

/* ------------------------------- ЛУКИ ------------------------------- */
export const LOOKS: Record<string, Look> = {
  /* --- Scavengers --- */
  rat: { s: 0.94, bulk: 0.95, skin: "#d29a72", hair: "#3a2a22", top: "#66724c", top2: "#a8553a", pants: "#4b5441", shoe: "#3a2a20", metal: "#9aa8b4", accent: "#e0a43a",
    head: "hood", torso: "hoodjacket", armF: "cyber", armB: "sleeve" },
  hulk: { s: 1.06, bulk: 1.42, skin: "#a8673f", hair: "#2a1a14", top: "#323b45", top2: "#5a4630", pants: "#58604a", shoe: "#2a2420", metal: "#98a6b4", accent: "#e0a43a",
    head: "bald", torso: "tank", armF: "cyber", armB: "bare" },
  runner: { s: 0.98, bulk: 0.92, skin: "#d9a07a", hair: "#1c1a20", top: "#4a5864", top2: "#6a5038", pants: "#2a3340", shoe: "#2a2a30", metal: "#8a99a8", accent: "#6fe0e6",
    head: "maskcrop", torso: "bomber", armF: "sleeve", armB: "sleeve", defW: "pistol" },
  cutter: { s: 0.97, bulk: 0.88, skin: "#c98a62", hair: "#17141a", top: "#8e4640", top2: "#2a2630", pants: "#2c2f3a", shoe: "#2a2024", metal: "#9aa8b4", accent: "#8fe8e0",
    head: "longhair", torso: "crop", armF: "sleeve", armB: "sleeve", defW: "whip" },
  /* --- Корпораты --- */
  guard: { s: 1.0, bulk: 1.02, skin: "#d9a98a", hair: "#2a2220", top: "#6f8a90", top2: "#c9a23a", pants: "#3c4650", shoe: "#1c1e24", metal: "#9aa8b4", accent: "#e0a43a",
    head: "cap", torso: "uniform", armF: "sleeve", armB: "sleeve", defW: "baton" },
  exo: { s: 1.12, bulk: 1.72, skin: "#b98a68", hair: "#2a2220", top: "#b8703c", top2: "#6a7480", pants: "#3a3f48", shoe: "#2a2c32", metal: "#8f9ca8", accent: "#ffb23a",
    head: "hardhat", torso: "exo", armF: "exo", armB: "exo" },
  agent: { s: 1.0, bulk: 0.98, skin: "#e2b497", hair: "#1c1a1e", top: "#aab2ba", top2: "#2a3548", pants: "#7e8892", shoe: "#18181e", metal: "#aab4be", accent: "#7fe7ee",
    head: "slick", torso: "suit", armF: "sleeve", armB: "sleeve", defW: "baton" },
  trooper: { s: 1.05, bulk: 1.28, skin: "#c99a78", hair: "#1c1a1e", top: "#3a363f", top2: "#a33f3f", pants: "#2c2a32", shoe: "#16151a", metal: "#6a7280", accent: "#ff4a4a",
    head: "helmet", torso: "armor", armF: "armor", armB: "armor", defW: "rifle" },
};

/* гражданские: 5 базовых типажей × 3 палитры */
const CIV_SKIN = ["#f0c4a0", "#d29a72", "#a8673f", "#7e4a30", "#e6b896"];
const CIV_HAIR = ["#1c1a20", "#3a2a22", "#6a4a30", "#8a8a92", "#a8553a"];
const CIV_BASE: Record<string, Partial<Look>> = {
  office: { torso: "suitc", head: "short", top: "#4a5260", top2: "#a8553a", pants: "#2c303a", shoe: "#18181e", defW: "case", armF: "sleeve", armB: "sleeve" },
  rain: { torso: "raincoat", head: "hoodc", top: "#b8863a", top2: "#3a4a5a", pants: "#2c303a", shoe: "#2a2a30", coat: true, defW: "umbrella", armF: "sleeve", armB: "sleeve" },
  vendor: { torso: "apron", head: "capc", top: "#7a8a6a", top2: "#d8d0bc", pants: "#4a4238", shoe: "#2a2420", armF: "short", armB: "short" },
  elder: { torso: "elder", head: "hatc", top: "#6a5a4a", top2: "#8a8a92", pants: "#3a3a44", shoe: "#222026", coat: true, armF: "sleeve", armB: "sleeve" },
  kid: { torso: "kid", head: "short", top: "#4a7a8a", top2: "#c9743a", pants: "#3a4258", shoe: "#d8d0bc", s: 0.74, armF: "sleeve", armB: "sleeve" },
};
const CIV_TOPS = [["#4a5260", "#6a7a5a", "#7a4a50"], ["#b8863a", "#4a7a8a", "#8a4a58"], ["#7a8a6a", "#8a7a4a", "#4a6a7a"], ["#6a5a4a", "#5a6a7a", "#7a5a6a"], ["#4a7a8a", "#a8553a", "#6a8a5a"]];
export const CIV_KINDS = Object.keys(CIV_BASE);
export const CIV_VARIANTS = 3;
CIV_KINDS.forEach((k, ki) => {
  for (let v = 0; v < CIV_VARIANTS; v++) {
    const b = CIV_BASE[k];
    LOOKS["civ_" + k + v] = {
      s: 1, bulk: k === "elder" ? 1.0 : 0.96, skin: CIV_SKIN[(ki * 2 + v * 3) % 5], hair: CIV_HAIR[(ki + v * 2) % 5],
      top: CIV_TOPS[ki][v], top2: "#8a8a92", pants: "#33384a", shoe: "#222026", metal: "#9aa8b4", accent: "#e0a43a",
      head: "short", torso: "suitc", armF: "sleeve", armB: "sleeve", ...b,
    } as Look;
  }
});

/* ------------------------------- ПОЗЫ ------------------------------- */
interface Pose {
  dx: number; hipDy: number; lean: number; tilt: number; hdx: number;
  aU: number; aF: number; bU: number; bF: number;
  fT: number; fS: number; kT: number; kS: number;
  mouth: number; eyes: number; flash: number; whip: number;
}
const P0: Pose = { dx: 0, hipDy: 0, lean: 5, tilt: 0, hdx: 0, aU: 35, aF: 140, bU: 15, bF: 130, fT: 12, fS: 4, kT: -14, kS: -8, mouth: 0, eyes: 0, flash: 0, whip: 0 };
const LEG = [[30, 22], [8, 4], [-24, -58], [18, -22]];

export function getPose(name: string, fr: number, o: { ranged?: boolean; whip?: boolean; civ?: boolean }): Pose {
  const p = { ...P0 };
  const A = (v: Partial<Pose>) => Object.assign(p, v);
  const civ = !!o.civ;
  switch (name) {
    case "idle": {
      A({ lean: fr ? 6 : 4, hipDy: fr ? 0 : 0 });
      if (civ) A({ aU: 6, aF: 12, bU: 2, bF: 8, lean: fr ? 3 : 2, fT: 6, fS: 2, kT: -6, kS: -3 });
      else if (fr) A({ aF: 144, bF: 134, aU: 36 });
      if (o.ranged) A({ aU: 55, aF: 100 });
      break;
    }
    case "walk": case "run": {
      const run = name === "run", m = run ? 1.25 : 1;
      const F = LEG[fr & 3], B = LEG[(fr + 2) & 3];
      A({ fT: F[0] * m, fS: F[1] * m, kT: B[0] * m, kS: B[1] * m, lean: run ? 14 : 8, hipDy: fr & 1 ? -1 : 1 });
      if (run) {
        const a = fr & 1 ? 1 : -1;
        A({ aU: 120 + a * 22, aF: 175 + a * 12, bU: 130 - a * 22, bF: 185 - a * 12, mouth: 1, tilt: -4 });
      } else if (civ) A({ aU: -F[0] * 0.7, aF: -F[0] * 0.7 + 22, bU: -B[0] * 0.7, bF: -B[0] * 0.7 + 22 });
      else A({ aU: -F[0] * 0.6 + 30, aF: -F[0] * 0.6 + 120, bU: -B[0] * 0.6 + 20, bF: -B[0] * 0.6 + 110 });
      if (o.ranged && !civ) A({ aU: 50, aF: 105 });
      break;
    }
    case "attack": {
      if (o.ranged) {
        if (fr === 0) A({ lean: 4, aU: 82, aF: 90, bU: 60, bF: 105, fT: 16, fS: 6, kT: -18, kS: -12 });
        else if (fr === 1) A({ lean: 0, dx: -1, aU: 76, aF: 82, bU: 56, bF: 100, flash: 1, mouth: 2, fT: 18, fS: 8, kT: -20, kS: -14 });
        else A({ lean: 3, aU: 80, aF: 88, bU: 58, bF: 104, fT: 16, fS: 6, kT: -18, kS: -12 });
      } else if (o.whip) {
        if (fr === 0) A({ lean: -10, dx: -3, aU: -50, aF: -105, bU: 45, bF: 120, whip: 1, fT: 12, fS: 6, kT: -22, kS: -18, mouth: 2 });
        else if (fr === 1) A({ lean: 16, dx: 3, aU: 72, aF: 78, bU: -20, bF: 20, whip: 2, fT: 42, fS: 24, kT: -30, kS: -36, mouth: 1 });
        else A({ lean: 8, dx: 2, aU: 48, aF: 62, bU: 20, bF: 90, whip: 3, fT: 24, fS: 10, kT: -22, kS: -20 });
      } else {
        if (fr === 0) A({ lean: -7, dx: -2, aU: -70, aF: -125, bU: 35, bF: 125, fT: 14, fS: 6, kT: -18, kS: -14, mouth: 2 });
        else if (fr === 1) A({ lean: 17, dx: 3, aU: 82, aF: 86, bU: -15, bF: 40, fT: 42, fS: 24, kT: -30, kS: -36, mouth: 1 });
        else A({ lean: 8, dx: 2, aU: 55, aF: 75, bU: 25, bF: 100, fT: 24, fS: 10, kT: -22, kS: -20 });
      }
      break;
    }
    case "hurt":
      A({ lean: -16, tilt: -14, hdx: -2, aU: -38, aF: -22, bU: -55, bF: -28, fT: 14, fS: 34, kT: -26, kS: -34, mouth: 1, eyes: 1 });
      break;
    case "loot":
      A({ lean: 30, tilt: 10, aU: 55, aF: 38 + (fr ? 10 : -6), bU: 42, bF: 62, fT: 64, fS: -6, kT: -26, kS: -82, mouth: 0 });
      break;
    case "cower":
      A({ lean: 48, tilt: 20, aU: 118, aF: 186, bU: 100, bF: 176, fT: 92, fS: -4, kT: -46, kS: -96, mouth: 1, eyes: 1 });
      break;
  }
  return p;
}

/* ------------------------------ ХЕЛПЕРЫ ------------------------------ */
const rd = (d: number) => (d * Math.PI) / 180;
const fk = (x: number, y: number, len: number, deg: number) => [x + Math.sin(rd(deg)) * len, y + Math.cos(rd(deg)) * len];
const METAL = ramp("#8f9eac");

/* ---------------------- ОТРИСОВКА ПЕРСОНАЖА ---------------------- */
export function drawChar(px: Px, L: Look, P: Pose, eq: Eq): number {
  const s = L.s, bulk = L.bulk, lb = 1 + (bulk - 1) * 0.65;
  const th = 14.5 * s, sh = 14 * s, tl = 19 * s;
  const nano = eq.body === "nano";
  const topR = ramp(nano ? "#3e5a66" : L.top);
  const top2R = ramp(L.top2 || L.top);
  const pantsR = ramp(L.pants), shoeR = ramp(L.shoe), skinR = ramp(L.skin), hairR = ramp(L.hair || "#222");
  const metalR = ramp(L.metal || "#8f9eac");
  const dTop = dimRamp(topR), dPants = dimRamp(pantsR), dSkin = dimRamp(skinR), dTop2 = dimRamp(top2R), dMetal = dimRamp(metalR);

  /* --- ноги: считаем FK и сажаем нижнюю стопу на землю --- */
  const kF = fk(0, 0, th, P.fT), aF = fk(kF[0], kF[1], sh, P.fS);
  const kB = fk(0, 0, th, P.kT), aB = fk(kB[0], kB[1], sh, P.kS);
  const footH = 3 * s;
  const hipX = OX + P.dx, hipY = OY - Math.max(aF[1], aB[1]) - footH + P.hipDy;
  const at = (p: number[]) => [hipX + p[0], hipY + p[1]];

  /* --- торс --- */
  const lean = rd(P.lean), u = [Math.sin(lean), -Math.cos(lean)], v = [Math.cos(lean), Math.sin(lean)];
  const TP = (t: number, side: number) => [hipX + u[0] * t * tl + v[0] * side * s * bulk, hipY + u[1] * t * tl + v[1] * side * s * bulk];
  const torsoPts = [TP(0, -5.5), TP(0.35, -4.6), TP(0.8, -6.6), TP(1.0, -5.6), TP(1.04, 0), TP(1.0, 5.6), TP(0.8, 7.4), TP(0.35, 5.2), TP(0, 5.6)];
  const torsoM = polyM(torsoPts);
  const ov = (pts: number[][], r: Ramp | string, o?: { rim?: boolean; shade?: boolean; flat?: boolean }) => {
    const m = interM(polyM(pts.map((p) => TP(p[0], p[1]))), torsoM);
    if (typeof r === "string") px.fill(m, r);
    else px.paint(m, r, { rim: false, ...(o || {}) });
  };
  const band = (t0: number, t1: number, a0 = -9, a1 = 9) => [[t0, a0], [t0, a1], [t1, a1], [t1, a0]];
  const sho = (back: boolean) => {
    const p = TP(0.86, back ? -2.4 : 1.8);
    return p;
  };

  /* --- голова: геометрия --- */
  const neck = TP(1.0, 0.8);
  const hc = [neck[0] + u[0] * 8.6 * s + P.hdx, neck[1] + u[1] * 8.6 * s];
  const T = rd(P.tilt), tc = Math.cos(T), ts = Math.sin(T);
  const HP = (lx: number, ly: number) => [hc[0] + (lx * tc - ly * ts) * s, hc[1] + (lx * ts + ly * tc) * s];

  /* --- оружие/предметы в руках --- */
  const wp = eq.weapon ? eq.weapon : L.defW || null;

  /* ===== рука ===== */
  const drawArm = (back: boolean) => {
    const sp = sho(back);
    const U = back ? P.bU : P.aU, F = back ? P.bF : P.aF;
    const el = fk(sp[0], sp[1], 12.5 * s, U), wr = fk(el[0], el[1], 12 * s, F);
    const style = back ? L.armB : L.armF;
    const r0 = 2.9 * s * lb, r1 = 2.3 * s * lb;
    const upper = capM(sp[0], sp[1], el[0], el[1], r0, r0 * 0.92), fore = capM(el[0], el[1], wr[0], wr[1], r0 * 0.9, r1);
    const arm = unionM(upper, fore);
    const tR = back ? dTop : topR, sR = back ? dSkin : skinR, mR = back ? dMetal : metalR;
    const dir = [wr[0] - el[0], wr[1] - el[1]], dl = Math.hypot(dir[0], dir[1]) || 1;
    const hand = [wr[0] + (dir[0] / dl) * 1.8, wr[1] + (dir[1] / dl) * 1.8];
    const gloveR = L.head === "cap" || L.head === "helmet" || style === "armor" ? dimRamp(ramp("#2a2c32"), back ? 0.1 : 0) : sR;
    if (style === "sleeve" || style === "armor") {
      px.paint(arm, tR);
      if (style === "armor") { px.paint(ellM(sp[0], sp[1] + 1, 4.6 * s * lb, 4 * s * lb), back ? dTop2 : top2R); px.paint(capM(el[0], el[1], wr[0], wr[1], r1 + 0.8, r1 + 0.6), mR, {rim:false}); }
      px.paint(ellM(hand[0], hand[1], 2.5 * s * lb, 2.5 * s * lb), gloveR);
    } else if (style === "bare") {
      px.paint(arm, sR);
      px.paint(ellM(hand[0], hand[1], 2.7 * s * lb, 2.7 * s * lb), sR);
    } else if (style === "short") {
      px.paint(upper, tR);
      px.paint(fore, sR);
      px.paint(ellM(hand[0], hand[1], 2.4 * s, 2.4 * s), sR);
    } else if (style === "cyber") {
      px.paint(upper, back ? dTop : style === "cyber" && L.torso === "tank" ? mR : tR);
      px.paint(fore, mR);
      /* гидравлика */
      px.paint(ellM(el[0], el[1], 3 * s * lb, 3 * s * lb), mR);
      px.dot(el[0], el[1], L.accent || "#e0a43a");
      const mx = (el[0] + wr[0]) / 2, my = (el[1] + wr[1]) / 2;
      px.line(el[0] + 1, el[1] + 2, mx + 1, my, darken(L.metal || "#8f9eac", 0.6), 1);
      px.dot(mx, my, "#c0c8d0");
      px.paint(ellM(hand[0], hand[1], 3.3 * s * lb, 3.1 * s * lb), mR);
      px.line(hand[0] - 1, hand[1] - 1, hand[0] + 2, hand[1] + 1, darken(L.metal || "#8f9eac", 0.65), 1);
    } else if (style === "exo") {
      px.paint(upper, ramp("#4a4f58"));
      px.paint(ellM(sp[0], sp[1], 5.2 * s, 4.6 * s), back ? dTop : topR);
      px.paint(fore, back ? dMetal : ramp("#7a8590"));
      px.paint(ellM(el[0], el[1], 3.4 * s, 3.4 * s), back ? dTop : topR);
      px.paint(ellM(hand[0], hand[1], 4.4 * s, 4.1 * s), back ? dMetal : ramp("#6a7480"));
      px.dot(hand[0] + 1, hand[1], L.accent || "#ffb23a");
    }
    return { sp, el, wr, hand, dir: [dir[0] / dl, dir[1] / dl] };
  };

  /* ===== нога ===== */
  const drawLeg = (back: boolean) => {
    const kn = at(back ? kB : kF), an = at(back ? aB : aF);
    const pr = back ? dPants : pantsR, sr = back ? dimRamp(shoeR) : shoeR;
    const wt = 3.6 * s * lb, wk = 3.1 * s * lb, wa = 2.5 * s * lb;
    let leg = unionM(capM(hipX, hipY, kn[0], kn[1], wt, wk), capM(kn[0], kn[1], an[0], an[1], wk, wa));
    px.paint(leg, pr);
    if (L.torso === "exo" || L.torso === "armor") px.paint(ellM(kn[0] + 1, kn[1], 3.2 * s * lb, 3.4 * s * lb), back ? dMetal : ramp(L.torso === "exo" ? "#6a7480" : "#3a3a44"));
    /* ботинок */
    const boot = unionM(capM(an[0], an[1] - 4 * s, an[0], an[1] + 0.5, 3.1 * s * lb, 3.1 * s * lb), ellM(an[0] + 3 * s, an[1] + 0.8 * s, 5.4 * s * lb, 2.6 * s));
    px.paint(boot, sr);
    px.rect(an[0] - 2, an[1] + 2.4 * s, 9 * s * lb, 1, darken(L.shoe, 0.7));
    if (L.accent && (L.head === "maskcrop" || L.head === "hood")) px.rect(an[0] - 1, an[1] + 1, 7, 1, L.accent);
  };

  /* ===== задняя часть: рюкзак/длинные волосы/плащ-сзади ===== */
  if (L.head === "longhair") {
    const fl = P.whip === 2 ? 5 : P.lean < 0 ? -2 : -4 + (P.tilt < 0 ? 3 : 0);
    const hb = polyM([HP(-5, -6), HP(-8.6, -2), HP(-9, 6), HP(-10 + fl * 0.3, 14), HP(-12 + fl, 22), HP(-9 + fl, 24), HP(-5, 18), HP(-3, 8), HP(0, -4)]);
    px.paint(hb, dimRamp(hairR, 0.05));
  }
  if (L.torso === "hoodjacket") {
    const bag = ellM(TP(0.55, -8.2)[0], TP(0.55, -8.2)[1], 4.8 * s, 7.2 * s);
    px.paint(bag, ramp("#7a6a4a"));
    px.rect(TP(0.52, -9.8)[0], TP(0.52, -9.8)[1] - 1, 2, 3, "#4a3c2a");
  }
  if (L.torso === "kid") {
    const bag = ellM(TP(0.55, -8)[0], TP(0.55, -8)[1], 5 * s, 6.5 * s);
    px.paint(bag, ramp("#c9743a"));
    px.rect(TP(0.4, -9)[0] - 1, TP(0.4, -9)[1], 3, 2, "#e8c27a");
  }
  if (L.torso === "exo") {
    px.paint(polyM([TP(1.0, -6), TP(1.3, -10), TP(0.2, -11), TP(0.1, -6)]), ramp("#4a4f58"));
  }

  /* ===== порядок слоёв ===== */
  const backArm = drawArm(true);
  drawLeg(true);
  drawLeg(false);

  /* торс */
  const baseTop = L.torso === "crop" ? ramp(L.top2 || "#2a2630") : L.torso === "tank" ? topR : topR;
  px.paint(torsoM, baseTop);
  switch (L.torso) {
    case "hoodjacket":
      ov(band(0.05, 0.97, 3.9, 5.2), darken(L.top, 0.55), { flat: true });
      ov([[1, -4], [1, -1], [0.14, 6.2], [0.14, 3.3]], "#5a3c28");
      ov(band(0.0, 0.14), darken(L.top, 0.35), { flat: true });
      ov([[0.6, -2], [0.6, 1.4], [0.45, 1.4], [0.45, -2]], "#a8553a");
      px.paint(ellM(TP(1.02, 0.6)[0], TP(1.02, 0.6)[1], 5.4 * s, 2.6 * s), ramp(L.top2!));
      px.paint(polyM([TP(1.0, -1), TP(0.7, -3.5), TP(0.6, -1.8), TP(0.9, 0.5)]), dimRamp(ramp(L.top2!), 0.1), { rim: false });
      px.paint(ellM(TP(1.0, -4.5)[0], TP(1.0, -4.5)[1], 4.4 * s, 3.4 * s), topR);
      break;
    case "tank":
      ov([[1.04, -1], [1.04, 4.8], [0.78, 3.6], [0.76, 0.6]], ramp(L.skin)[1]);
      ov([[1, -3.6], [1, -0.8], [0.12, 7], [0.12, 4]], "#5a4630");
      for (let k = 0; k < 4; k++) { const p = TP(0.82 - k * 0.17, 0.2 + k * 1.7); px.dot(p[0], p[1], "#c9a24c"); }
      ov(band(0.0, 0.16), "#24262c", { flat: true });
      { const b = TP(0.08, 2.6); px.rect(b[0] - 1, b[1] - 1, 3, 3, "#b8c0c8"); }
      { const c = TP(0.92, 3.4); px.line(c[0], c[1], c[0] - 1, c[1] + 6, "#d9b44c", 1); px.dot(c[0] - 1, c[1] + 7, "#f0d070"); }
      break;
    case "bomber":
      ov(band(0.0, 0.14), darken(L.top, 0.4), { flat: true });
      ov(band(0.05, 0.97, 4.4, 5.4), darken(L.top, 0.55), { flat: true });
      ov([[0.9, -5], [0.9, -3.4], [0.2, -3.4], [0.2, -5]], L.accent!, { flat: true });
      { const bg = TP(0.2, 5.6); px.paint(rectM(bg[0] - 3, bg[1] - 2, 7, 9), ramp(L.top2!)); px.dot(bg[0] + 1, bg[1] + 1, L.accent!); }
      px.paint(ellM(TP(1.0, 1)[0], TP(1.0, 1)[1], 5.6 * s, 2.7 * s), ramp(darken(L.top, 0.1)));
      break;
    case "crop":
      ov(band(0.4, 1.03), ramp(L.top)[1]);
      ov(band(0.4, 0.46), darken(L.top, 0.5), { flat: true });
      ov(band(0.1, 0.2), "#3a2a22", { flat: true });
      { const hs = TP(0.12, 5.4); px.paint(rectM(hs[0] - 2, hs[1], 4, 7), ramp("#5a4630")); }
      ov([[0.9, 4.4], [0.9, 5.2], [0.42, 5.2], [0.42, 4.4]], darken(L.top, 0.5), { flat: true });
      px.paint(ellM(TP(1.0, 1)[0], TP(1.0, 1)[1], 5.6 * s, 2.5 * s), ramp(L.top));
      break;
    case "uniform":
      ov(band(0.12, 0.96, -9, 9), ramp("#5a6670")[1], { flat: true });
      ov(band(0.34, 0.4), "#c9ced3", { flat: true });
      ov(band(0.6, 0.66), "#c9ced3", { flat: true });
      ov(band(0.05, 0.14), "#14161a", { flat: true });
      { const b = TP(0.75, 3.8); px.rect(b[0], b[1], 2, 2, "#e0c870"); }
      px.paint(ellM(TP(1.0, 1)[0], TP(1.0, 1)[1], 5.2 * s, 2.3 * s), ramp("#4a5660"));
      break;
    case "exo":
      ov(band(0.42, 1.04), ramp("#c97a40")[1]);
      ov(band(0.0, 0.42), ramp("#3a3f48")[1]);
      for (let k = 0; k < 3; k++) ov(band(0.06 + k * 0.1, 0.1 + k * 0.1), "#1a1c22", { flat: true });
      ov(band(0.58, 0.62), "#6a3a1c", { flat: true });
      { const l = TP(0.78, 3.4); px.rect(l[0], l[1], 3, 3, L.accent!); px.rect(l[0] - 1, l[1] - 1, 5, 5, "#ffb23a44"); }
      ov([[0.9, -7], [0.9, -4], [0.45, -4], [0.45, -7]], "#2a2c32");
      break;
    case "suit": case "suitc":
      ov([[1.0, 2.4], [1.0, 6.4], [0.4, 6.4], [0.4, 3.6]], ramp(L.top2 || "#2a3548")[1], { flat: true });
      { const t0 = TP(0.92, 4.4), t1 = TP(0.46, 5.0); px.line(t0[0], t0[1], t1[0], t1[1], L.torso === "suit" ? "#a8553a" : L.top2!, 2); }
      { const c = TP(1.0, 3.2); px.rect(c[0], c[1], 2, 2, "#e8e8ec"); }
      ov(band(0.0, 0.1), darken(L.top, 0.45), { flat: true });
      break;
    case "armor":
      ov(band(0.36, 1.04), ramp("#4a4650")[1]);
      ov(band(0.54, 0.62), L.top2!, { flat: true });
      ov(band(0.0, 0.2), "#1a181e", { flat: true });
      { const p = TP(0.18, 4.4); px.paint(rectM(p[0] - 1, p[1] - 1, 5, 5), ramp("#3a363f")); }
      { const p = TP(0.82, 4.2); px.rect(p[0], p[1], 2, 2, L.accent!); }
      break;
    case "raincoat": case "elder":
      ov(band(0.05, 0.97, 4, 5.2), darken(L.top, 0.5), { flat: true });
      ov(band(0.34, 0.4, -9, 9), darken(L.top, 0.4), { flat: true });
      px.paint(ellM(TP(1.0, 1)[0], TP(1.0, 1)[1], 5.6 * s, 2.5 * s), ramp(L.top2!));
      break;
    case "apron":
      ov([[0.85, 0.5], [0.85, 7.4], [0.0, 7.4], [0.0, 0.5]], ramp(L.top2!)[1]);
      ov(band(0.5, 0.62, 0.5, 7.4), darken(L.top2!, 0.2), { flat: true });
      break;
    case "kid":
      ov(band(0.0, 0.14), darken(L.top, 0.4), { flat: true });
      ov([[0.7, -2], [0.7, 4], [0.5, 4], [0.5, -2]], ramp(L.top)[2], { flat: true });
      break;
  }

  /* нано-куртка поверх */
  if (nano) {
    ov(band(0.82, 1.06), ramp("#4a6a78")[0]);
    ov(band(0.3, 0.34), "#6fd6d0", { flat: true });
    ov([[1, -1], [1, 0.3], [0.1, 0.3], [0.1, -1]], "#6fd6d0", { flat: true });
    px.paint(ellM(TP(0.97, -3)[0], TP(0.97, -3)[1], 4.4 * s, 3 * s), ramp("#4e6c7a"));
    px.paint(ellM(TP(0.97, 4.6)[0], TP(0.97, 4.6)[1], 4 * s, 3 * s), ramp("#4e6c7a"));
  }
  /* скан-ошейник */
  if (eq.neck === "scanner") {
    const n = TP(1.0, 0.8);
    px.paint(polyM([[n[0] - 4 * s, n[1] - 1], [n[0] + 4 * s, n[1] - 1.2], [n[0] + 4 * s, n[1] + 2], [n[0] - 4 * s, n[1] + 2.4]]), ramp("#4a4650"), { rim: false });
    const q = TP(0.82, 5.8);
    px.paint(ellM(q[0], q[1], 2.4, 2.4), ramp("#d9a23a"), { rim: false });
    px.dot(q[0], q[1], "#fff0b0");
    px.dot(n[0] + 3, n[1] + 0.5, "#ffd070");
  }

  /* длинное пальто поверх ног */
  if (L.coat) {
    const coat = polyM([TP(0.32, -6.5), TP(0.32, 6.4), TP(-0.5, 7.4 + P.lean * 0.05), TP(-0.55, -7.6)]);
    px.paint(coat, topR);
    px.line(TP(0.3, 4.5)[0], TP(0.3, 4.5)[1], TP(-0.5, 5.4)[0], TP(-0.5, 5.4)[1], darken(L.top, 0.55), 1);
  }

  /* ===== голова ===== */
  const covered = L.head === "helmet" && !eq.head;
  px.paint(capM(neck[0], neck[1] + 1, HP(-0.5, 6)[0], HP(-0.5, 6)[1], 2.7 * s, 2.5 * s), dSkin, { rim: false });
  const skull = ellM(hc[0], hc[1], 7.5 * s, 7.9 * s);
  const jaw = polyM([HP(-3.5, 2.5), HP(6.8, 1.2), HP(6.4, 6.4), HP(3, 9.4), HP(-0.6, 8.4)]);
  const head = unionM(skull, jaw);
  px.paint(head, L.head === "exo" ? skinR : skinR);
  if (L.head === "hardhat") px.paint(unionM(ellM(HP(0, 3)[0], HP(0, 3)[1], 6 * s, 5 * s)), dSkin, { rim: false, shade: false });

  const hairDark = darken(L.hair || "#222", 0.2);
  if (!covered) {
    const ear = HP(-2.4, 1.2);
    px.paint(ellM(ear[0], ear[1], 1.7 * s, 2.3 * s), dSkin, { rim: false });
    /* глаз */
    const e = HP(3.2, -1.2);
    if (P.eyes === 1) px.line(e[0] - 1, e[1] + 1, e[0] + 2, e[1] + 1, "#2a1a1a", 1);
    else { px.rect(e[0], e[1], 2, 2, "#f4f0e8"); px.dot(e[0] + 1, e[1] + 0.6, "#1a1218"); }
    const b0 = HP(1.4, -3.4), b1 = HP(5.8, -2.6);
    px.line(b0[0], b0[1], b1[0], b1[1], hairDark, 1);
    const n0 = HP(7.2, 0.6); px.dot(n0[0], n0[1], lighten(L.skin, 0.2)); px.dot(n0[0], n0[1] + 1, darken(L.skin, 0.3));
    const m0 = HP(3.8, 4.6);
    if (P.mouth === 1) px.rect(m0[0], m0[1] - 1, 3, 2, "#3a1418");
    else if (P.mouth === 2) { px.line(m0[0], m0[1], m0[0] + 3, m0[1], "#f0e8e0", 1); }
    else px.line(m0[0], m0[1], m0[0] + 2, m0[1], "#6a3030", 1);
  }

  const gh = (x0: number, y0: number, rx: number, ry: number) => { const p = HP(x0, y0); return ellM(p[0], p[1], rx * s, ry * s); };
  const hp = (pts: number[][]) => polyM(pts.map((p) => HP(p[0], p[1])));
  const helmEq = eq.head === "helm", visEq = eq.head === "visor";

  switch (L.head) {
    case "hood": {
      const hood = subM(gh(-1, -1.2, 9.4, 9.8), gh(4, 1.6, 5.8, 6.6));
      px.paint(hood, ramp(L.top));
      px.paint(hp([[3, -8.8], [8, -6], [9, -2], [7.6, -4.4], [5, -7]]), ramp(darken(L.top, 0.1)), { rim: false });
      /* гогглы */
      const g1 = HP(3.8, -0.8);
      px.line(HP(-8, -1.4)[0], HP(-8, -1.4)[1], g1[0], g1[1] - 1, "#3a2a1c", 2);
      px.paint(ellM(g1[0], g1[1], 3.6 * s, 3.5 * s), ramp("#7a5a38"));
      px.paint(ellM(g1[0] + 0.5, g1[1], 2.4 * s, 2.4 * s), ramp("#2a6a70"), { rim: false, shade: false });
      px.dot(g1[0] - 0.5, g1[1] - 1, "#bff4f0");
      /* шарф до носа */
      px.paint(hp([[1.6, 3.6], [8, 2.8], [7.4, 8.6], [1, 8.4]]), ramp(L.top2!));
      break;
    }
    case "bald": {
      const sh2 = HP(-2, -6); px.dot(sh2[0], sh2[1], lighten(L.skin, 0.4)); px.dot(sh2[0] + 1, sh2[1], lighten(L.skin, 0.3));
      px.paint(hp([[0.4, 3.8], [7, 2.8], [6.6, 8], [3, 9.8], [-0.4, 8]]), ramp("#2a1a14"), { rim: false, shade: false });
      px.paint(hp([[-3, -3.4], [-1.2, -2.8], [0, 0], [-1.8, 0.4]]), ramp("#7e4a30"), { rim: false, flat: true });
      /* шрам */
      const sc = HP(4.6, -3.6); px.line(sc[0], sc[1], sc[0] + 1, sc[1] + 3, "#d49a80", 1);
      px.rect(e1(HP(1.6, -3.2)), e2(HP(1.6, -3.2)), 4, 1, "#2a1a14");
      break;
    }
    case "maskcrop": {
      px.paint(hp([[-7.4, -1], [-7, -6], [-3, -9.4], [-1, -6], [1, -10.6], [3, -7], [5.4, -9], [6, -5], [8, -3], [6.4, -3.6], [2, -4.2], [-3, -3], [-7, 1.5]]), hairR);
      px.paint(hp([[1.6, 1.6], [8.2, 1.2], [8.2, 7.4], [2.4, 9.8], [-1, 7.4]]), ramp("#262a30"));
      px.paint(gh(6, 5.6, 1.9, 1.9), ramp("#59646e"), { rim: false });
      px.dot(HP(6, 5.6)[0], HP(6, 5.6)[1], "#6fe0e6");
      /* монокль */
      const mo = HP(3.8, -1);
      px.paint(ellM(mo[0], mo[1], 3.2 * s, 3.2 * s), ramp("#3a4048"));
      px.paint(ellM(mo[0] + 0.4, mo[1], 2.1 * s, 2.1 * s), ramp("#2a8a96"), { rim: false, shade: false });
      px.dot(mo[0] + 0.4, mo[1], "#c8fcff");
      px.line(HP(-7, -2)[0], HP(-7, -2)[1], mo[0] - 3, mo[1] - 1, "#2a2e34", 1);
      break;
    }
    case "longhair": {
      px.paint(hp([[-8, -2], [-7, -7], [0, -9.6], [5.6, -7.4], [8, -3], [5, -4], [1, -5.4], [-4, -4.4], [-5, 2]]), hairR);
      px.paint(hp([[3, -8], [7, -5], [5.6, -3.6], [2, -5.6]]), hairR, { rim: false });
      px.dot(HP(5, -6)[0], HP(5, -6)[1], lighten(L.hair || "#222", 0.4));
      px.line(HP(-8, -3.6)[0], HP(-8, -3.6)[1], HP(6, -5.6)[0], HP(6, -5.6)[1], "#7a3a30", 1);
      break;
    }
    case "cap": {
      px.paint(hp([[-7.6, -1.2], [-6, -7], [0, -9.6], [6, -7.2], [7.6, -2.4], [-1, -3]]), ramp("#3a4a52"));
      px.paint(hp([[3, -4.4], [11.6, -2.8], [11.4, -1.2], [3, -2]]), ramp("#262e34"), { rim: false });
      px.dot(HP(2, -7)[0], HP(2, -7)[1], "#e0c870");
      /* очки */
      px.paint(hp([[2, -2.4], [7.4, -2.2], [7.2, 0.8], [2.2, 0.6]]), ramp("#1a1e24"), { rim: false, shade: false });
      px.dot(HP(3, -1.6)[0], HP(3, -1.6)[1], "#9ac8d0");
      break;
    }
    case "hardhat": {
      px.paint(hp([[-7.8, -1], [-6, -7.4], [0, -10], [6.4, -7.4], [7.8, -1.6], [8.8, 0], [-1, 0]]), ramp("#c97a40"));
      px.paint(hp([[-6, -8], [0, -10.6], [3, -9.6], [0, -8.2]]), ramp("#e0a060"), { rim: false });
      px.paint(hp([[2.4, -2], [8.4, -1.8], [8.6, 2], [2.8, 2.4]]), ramp("#1a1c22"), { rim: false, shade: false });
      px.rect(HP(4.4, -0.6)[0], HP(4.4, -0.6)[1], 3, 1, "#ffb23a");
      px.paint(hp([[0, 4.8], [7, 4], [6.6, 9], [1, 9.6]]), ramp("#4a4f58"));
      break;
    }
    case "slick": {
      px.paint(hp([[-7.8, -1], [-6, -7], [0, -9.4], [6.4, -7], [7.8, -2.4], [3, -3.6], [-3, -2.6], [-6, 1.8]]), hairR);
      px.dot(HP(1, -8)[0], HP(1, -8)[1], lighten(L.hair || "#222", 0.45));
      /* зеркальные очки */
      px.paint(hp([[1.6, -2.8], [8.2, -2.6], [8, 0.8], [2, 0.8]]), ramp("#1e242e"), { rim: false, shade: false });
      px.line(HP(2.4, -1.8)[0], HP(2.4, -1.8)[1], HP(4.4, -2.2)[0], HP(4.4, -2.2)[1], "#9ee8f0", 1);
      px.dot(HP(6, -1.2)[0], HP(6, -1.2)[1], "#5ab8c4");
      px.dot(HP(-1.6, 3)[0], HP(-1.6, 3)[1], "#7fe7ee");
      break;
    }
    case "helmet": {
      if (!eq.head) {
        px.paint(unionM(gh(0, -0.4, 9, 9.4), hp([[-8, 2], [8, 3], [7, 9.4], [0, 11], [-7, 8]])), ramp("#3e3b46"));
        px.paint(hp([[-6, -7], [0, -9.8], [5, -8], [0, -6.4]]), ramp("#5a5664"), { rim: false });
        px.paint(hp([[1.4, -2.4], [9.4, -2], [9.6, 1.4], [2, 1.8]]), ramp("#1a181e"), { rim: false, shade: false });
        const vs = HP(3, -1.2); px.rect(vs[0], vs[1], 6, 1, "#ff4a4a"); px.rect(vs[0] + 1, vs[1] - 1, 4, 3, "#ff4a4a33");
        px.paint(hp([[2, 5], [9, 4.4], [8.4, 9.6], [2.4, 10.6]]), ramp("#2a2830"), { rim: false });
        px.line(HP(-4, -9)[0], HP(-4, -9)[1], HP(-6, -15)[0], HP(-6, -15)[1], "#6a7280", 1);
      }
      break;
    }
    case "short": {
      px.paint(hp([[-7.6, -1], [-6.4, -6.6], [0, -9], [6.2, -7], [7.6, -3], [3, -4], [-2, -3.2], [-6, 1.5]]), hairR);
      break;
    }
    case "hoodc": {
      const hood = subM(gh(-1, -1.2, 9.2, 9.6), gh(4, 1.6, 5.8, 6.4));
      px.paint(hood, ramp(L.top));
      break;
    }
    case "capc": {
      px.paint(hp([[-7.6, -1.2], [-6, -7], [0, -9.4], [6, -7.2], [7.6, -2.4], [-1, -3]]), ramp(L.top2!));
      px.paint(hp([[3, -4.4], [10.6, -3], [10.4, -1.6], [3, -2.2]]), ramp(darken(L.top2!, 0.25)), { rim: false });
      break;
    }
    case "hatc": {
      px.paint(hp([[-7.6, -3.4], [-5.4, -9], [3, -9.4], [6.4, -3.4]]), ramp(L.top2!));
      px.paint(hp([[-9.6, -3.6], [9.6, -3.2], [9.6, -1.8], [-9.6, -2]]), ramp(darken(L.top2!, 0.2)));
      px.paint(hp([[-7, 1], [-7.4, 3], [-5, 2], [-4, 0]]), ramp("#a8a8b0"), { rim: false });
      break;
    }
  }

  /* головные предметы экипировки */
  if (helmEq) {
    px.paint(hp([[-8.6, -0.4], [-8, -7.6], [0, -10.6], [7.6, -7.6], [8.4, -1], [3, -2.2], [-3, -1]]), ramp("#566a5a"));
    px.paint(hp([[-6, -8], [0, -10.4], [3.4, -9.4], [-1, -7.6]]), ramp("#7a9080"), { rim: false });
    px.rect(HP(2, -9.4)[0], HP(2, -9.4)[1] - 1, 4, 2, "#2a2e34");
    px.dot(HP(7, -3)[0], HP(7, -3)[1], "#e0a43a");
    for (let k = 0; k < 4; k++) px.dot(HP(-5 + k * 3, -6.2 + (k & 1))[0], HP(-5 + k * 3, -6.2 + (k & 1))[1], "#3a4a3e");
  }
  if (visEq) {
    px.paint(hp([[-7.6, -3.4], [8.2, -3], [8.4, 0.6], [-7.4, 0.2]]), ramp("#232a32"), { rim: false, shade: false });
    px.line(HP(-1, -1.6)[0], HP(-1, -1.6)[1], HP(8, -1.4)[0], HP(8, -1.4)[1], "#7fe7ee", 1);
    px.dot(HP(7, -1.4)[0], HP(7, -1.4)[1], "#e8ffff");
    px.paint(gh(-3, 0.4, 2.4, 2.4), ramp("#3a4048"), { rim: false });
    px.dot(HP(-3, 0.4)[0], HP(-3, 0.4)[1], "#6fe0e6");
  }

  /* ===== передняя рука + оружие ===== */
  const fa = drawArm(false);
  const hd = fa.hand;
  const angW = P.aF;
  const WD = [Math.sin(rd(angW)), Math.cos(rd(angW))];
  const wend = (len: number) => [hd[0] + WD[0] * len * s, hd[1] + WD[1] * len * s];
  if (wp === "crowbar") {
    const e = wend(24), b = wend(-5);
    px.paint(capM(b[0], b[1], e[0], e[1], 1.7, 1.5), METAL, { rim: false });
    const h2 = wend(3); px.paint(capM(b[0], b[1], h2[0], h2[1], 2.1, 2.1), ramp("#3a3640"), { rim: false });
    const hk = wend(21); px.line(hk[0], hk[1], hk[0] + WD[1] * 3, hk[1] - WD[0] * 3, "#6a7480", 2);
    px.dot(e[0], e[1], "#6fe0e6"); px.dot(e[0] + 1, e[1] - 1, "#d8ffff");
    if (P.aF < 0 || (P.aF > 60 && P.aF < 90 && P.lean > 12)) { px.dot(e[0] - 1, e[1] + 1, "#6fe0e688"); }
  } else if (wp === "baton") {
    const e = wend(21), b = wend(-4);
    px.paint(capM(b[0], b[1], e[0], e[1], 1.5, 1.3), ramp("#2a2c34"), { rim: false });
    px.dot(e[0], e[1], "#ffd070"); px.dot(e[0] + 1, e[1], "#ffb23a88");
    const gw = wend(2); px.dot(gw[0], gw[1], L.accent || "#e0a43a");
  } else if (wp === "pistol" || wp === "smg" || wp === "rifle") {
    const len = wp === "pistol" ? 8 : wp === "smg" ? 11 : 17, th2 = wp === "rifle" ? 1.9 : 1.7;
    const b = wend(-3), e = wend(len);
    px.paint(capM(b[0], b[1], e[0], e[1], th2, th2), ramp(wp === "rifle" ? "#34323c" : "#3a3e46"), { rim: false });
    px.line(b[0] + WD[0] * 2, b[1] + WD[1] * 2 - 1, e[0], e[1] - 1, "#8a94a0", 1);
    px.paint(capM(hd[0], hd[1], hd[0] - 1, hd[1] + 5, 1.6, 1.6), ramp("#24262c"), { rim: false });
    if (wp !== "pistol") { const mg = wend(wp === "rifle" ? 7 : 5); px.paint(capM(mg[0], mg[1], mg[0] - 0.5, mg[1] + 6, 1.4, 1.4), ramp("#24262c"), { rim: false }); }
    if (wp === "rifle") { const st = wend(-8); px.paint(capM(b[0], b[1], st[0], st[1], 2.2, 2.2), ramp("#4a3a30"), { rim: false }); }
    if (wp === "smg") px.dot(e[0] - 1, e[1] - 2, "#e0a43a");
    if (P.flash) {
      const f = wend(len + 3);
      px.paint(polyM([[f[0], f[1] - 5], [f[0] + 7, f[1]], [f[0], f[1] + 5], [f[0] + 2, f[1]]]), ["#fff6d0", "#ffd98a", "#e0a43a", "#a8553a"], { rim: false, shade: false });
      px.dot(f[0] + 1, f[1], "#ffffff");
    }
  } else if (wp === "whip") {
    px.paint(capM(hd[0] - 1, hd[1] - 1, hd[0] + 2, hd[1] + 3, 2, 2), ramp("#2a2630"), { rim: false });
    const tabs = [
      [[0, 3], [1, 8], [0, 13], [-2, 17]],
      [[-3, -4], [-8, -9], [-14, -12], [-21, -11], [-27, -8]],
      [[8, 0], [17, -1], [26, 0], [35, 2], [44, 4]],
      [[7, 4], [12, 10], [14, 17], [12, 23]],
    ];
    const pts = tabs[P.whip];
    let px0 = hd[0], py0 = hd[1];
    for (const p of pts) {
      px.line(px0, py0, hd[0] + p[0], hd[1] + p[1], "#9fe8e2", 1);
      px.dot(hd[0] + p[0], hd[1] + p[1] + 1, "#3a8a8a");
      px0 = hd[0] + p[0]; py0 = hd[1] + p[1];
    }
    px.dot(px0, py0, "#e8ffff");
  } else if (wp === "case") {
    const c = [hd[0] - 1, hd[1] + 6];
    px.line(hd[0], hd[1], c[0], c[1] - 2, "#2a2420", 1);
    px.paint(rectM(c[0] - 5, c[1] - 1, 11, 8), ramp("#7a5a38"));
    px.rect(c[0] - 1, c[1] + 1, 3, 2, "#d9b44c");
  } else if (wp === "umbrella") {
    const top = [hd[0] + 3, hd[1] - 20];
    px.line(hd[0], hd[1] + 1, top[0], top[1], "#2a2a30", 1);
    px.paint(polyM([[top[0] - 14, top[1] + 6], [top[0] - 10, top[1] - 1], [top[0], top[1] - 4], [top[0] + 10, top[1] - 1], [top[0] + 14, top[1] + 6], [top[0] + 7, top[1] + 4], [top[0], top[1] + 6], [top[0] - 7, top[1] + 4]]), ramp(L.top2!));
  }
  /* камера: дополнительный возврат, чтобы упорядочить: задняя рука нарисована, возвращаем бедро */
  void backArm;
  return hipY;
}
const e1 = (p: number[]) => p[0];
const e2 = (p: number[]) => p[1];

/* ----------------------- поворот (для «лежит») ----------------------- */
function rotatePx(src: Px, hx: number, hy: number, ang: number, ox: number, oy: number): Px {
  const out = new Px(src.w, src.h), c = Math.cos(ang), s = Math.sin(ang);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const dx = x + 0.5 - ox, dy = y + 0.5 - oy;
      const sx = Math.floor(hx + dx * c + dy * s), sy = Math.floor(hy - dx * s + dy * c);
      if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
      const i = (sy * src.w + sx) * 4, j = (y * out.w + x) * 4;
      if (src.d[i + 3]) { out.d[j] = src.d[i]; out.d[j + 1] = src.d[i + 1]; out.d[j + 2] = src.d[i + 2]; out.d[j + 3] = 255; }
    }
  return out;
}

/* ---------------------- кэш готовых спрайтов ---------------------- */
const cache: Record<string, HTMLCanvasElement> = {};
export function getSprite(look: string, pose: string, fr: number, eq: Eq | null | undefined, face: number, tint: boolean): HTMLCanvasElement {
  const e = eq || {};
  const key = `${look}|${pose}${fr}|${e.head || ""}.${e.weapon || ""}.${e.neck || ""}.${e.body || ""}|${face}${tint ? "w" : ""}`;
  let c = cache[key];
  if (c) return c;
  if (tint) {
    const b = getSprite(look, pose, fr, eq, face, false);
    c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const g = c.getContext("2d")!;
    g.drawImage(b, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(255,244,230,.72)";
    g.fillRect(0, 0, SW, SH);
    return (cache[key] = c);
  }
  if (face < 0) {
    const b = getSprite(look, pose, fr, eq, 1, false);
    c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const g = c.getContext("2d")!;
    g.translate(SW, 0); g.scale(-1, 1); g.drawImage(b, 0, 0);
    return (cache[key] = c);
  }
  const L = LOOKS[look];
  const wp = e.weapon || L.defW || null;
  const opt = { ranged: wp === "smg" || wp === "pistol" || wp === "rifle", whip: wp === "whip", civ: look.startsWith("civ_") };
  let px = new Px(SW, SH);
  if (pose === "down") {
    const tmp = new Px(SW, SH);
    const hipY = drawChar(tmp, L, getPose("hurt", 0, opt), e);
    const hx = OX, hy = hipY;
    px = rotatePx(tmp, hx, hy, fr === 0 ? -Math.PI / 4 : -Math.PI / 2, OX, OY - 15 + (fr === 0 ? -8 : 0));
  } else drawChar(px, L, getPose(pose, fr, opt), e);
  px.outline("#0a0d12");
  return (cache[key] = px.toCanvas());
}
void mix; void lighten;
