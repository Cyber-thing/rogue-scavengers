/* ======================================================================
   ПЕРСОНАЖИ (3/4 SEGA BEAT-'EM-UP): перерисовано с нуля.
   - Поворот корпуса 3/4 к камере (видны оба плеча, грудь, бёдра, оба глаза).
   - Разные телосложения: накачанный атлет (musc_m), тяжёлый боец (heavy_m),
     поджарый стрелок/агент (lean_m), стройная спортивная женщина (slim_f).
   - Рандомные мужские и женские варианты для банды, врагов и прохожих.
   - Пропорции ~1:8 (никаких больших голов) и 10-кадровая плавная анимация.
   ====================================================================== */
import { Px, Ramp, ramp, dimRamp, darken, lighten, mix, ellM, capM, polyM, rectM, unionM, subM, interM } from "./px";
import { SW, SH, OX, OY, Pose, getPose, getCharMetrics } from "./poses";

export { SW, SH, OX, OY };
export type Eq = { head?: string | null; weapon?: string | null; neck?: string | null; body?: string | null };
export type BodyBuild = "musc_m" | "heavy_m" | "lean_m" | "slim_f";

export interface Look {
  s: number;
  build: BodyBuild;
  gender: "m" | "f";
  skin: string;
  hair?: string;
  top: string;
  top2?: string;
  pants: string;
  shoe: string;
  metal?: string;
  accent?: string;
  head: string;
  torso: string;
  armN: string; // ближняя рука (со стороны камеры)
  armL: string; // передняя рука (со стороны врага)
  coat?: boolean;
  defW?: string | null;
}

/* ------------------------------- РОСТЕР СТИЛЕЙ ------------------------------- */
export const LOOKS: Record<string, Look> = {
  /* === КРЫСА (rat): уличный боец / взломщик с кибер-рукой === */
  rat_m0: {
    s: 0.99, build: "musc_m", gender: "m",
    skin: "#d69e74", hair: "#2a1e18", top: "#2c546e", top2: "#b44e38", pants: "#385684", shoe: "#583424", metal: "#9aa8b6", accent: "#e0a43a",
    head: "spiky", torso: "open_vest", armN: "bare", armL: "cyber",
  },
  rat_m1: {
    s: 1.0, build: "musc_m", gender: "m",
    skin: "#aa6a44", hair: "#1a1414", top: "#c44434", top2: "#e0a43a", pants: "#242832", shoe: "#c84032", metal: "#96a4b4", accent: "#6fe0e6",
    head: "headband", torso: "tee_musc", armN: "bare", armL: "cyber",
  },
  rat_m2: {
    s: 0.99, build: "musc_m", gender: "m",
    skin: "#e2ae86", hair: "#6a3a22", top: "#4f5e3b", top2: "#9c6234", pants: "#2b332c", shoe: "#382820", metal: "#98a4b0", accent: "#e0a43a",
    head: "hood", torso: "street_hoodie", armN: "sleeve", armL: "cyber",
  },
  rat_m3: {
    s: 1.0, build: "lean_m", gender: "m",
    skin: "#8b5438", hair: "#1a1820", top: "#c67c2c", top2: "#282e38", pants: "#28364a", shoe: "#22242a", metal: "#a4b0bc", accent: "#6fe0e6",
    head: "fade", torso: "track_top", armN: "sleeve", armL: "cyber",
  },
  rat_f0: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#eab48e", hair: "#6b321c", top: "#cc342e", top2: "#1e2028", pants: "#cc342e", shoe: "#c42e28", metal: "#9aa8b6", accent: "#e8c058",
    head: "blaze_hair", torso: "jacket_crop", armN: "jacket_short", armL: "cyber",
  },
  rat_f1: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#d89c72", hair: "#221820", top: "#2e6d6c", top2: "#e8c25a", pants: "#26363e", shoe: "#22262e", metal: "#9aa8b6", accent: "#6fe0e6",
    head: "ponytail", torso: "blaze_skirt", armN: "bare", armL: "cyber",
  },
  rat_f2: {
    s: 0.98, build: "slim_f", gender: "f",
    skin: "#f0c29e", hair: "#d89c38", top: "#783c66", top2: "#22202c", pants: "#2c3448", shoe: "#6c325a", metal: "#9aa8b6", accent: "#f2c858",
    head: "bob", torso: "crop_hoodie", armN: "jacket_short", armL: "cyber",
  },
  rat_f3: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#b87a52", hair: "#48b0b8", top: "#b65a34", top2: "#22262e", pants: "#38465a", shoe: "#2a2420", metal: "#a0aebc", accent: "#6fe0e6",
    head: "sidecut", torso: "sport_crop", armN: "bare", armL: "cyber",
  },

  /* === ГРОМИЛА (hulk): тяжёлый танк / атлет-титан === */
  hulk_m0: {
    s: 1.11, build: "heavy_m", gender: "m",
    skin: "#a86640", hair: "#201612", top: "#323a46", top2: "#d9a23a", pants: "#3e587c", shoe: "#4e2e20", metal: "#a4b2c0", accent: "#e0a43a",
    head: "shades_bald", torso: "bare_pecs", armN: "bare", armL: "cyber",
  },
  hulk_m1: {
    s: 1.12, build: "heavy_m", gender: "m",
    skin: "#d69c74", hair: "#261c18", top: "#c25838", top2: "#262832", pants: "#344248", shoe: "#26201c", metal: "#9caab8", accent: "#ffb23a",
    head: "headband", torso: "tank", armN: "bare", armL: "cyber",
  },
  hulk_m2: {
    s: 1.10, build: "heavy_m", gender: "m",
    skin: "#7d4a30", hair: "#e2d8c0", top: "#445a46", top2: "#d9a23a", pants: "#2b303a", shoe: "#241e1a", metal: "#94a2b0", accent: "#6fe0e6",
    head: "mohawk", torso: "cyber_harness", armN: "bare", armL: "cyber",
  },
  hulk_m3: {
    s: 1.11, build: "heavy_m", gender: "m",
    skin: "#eab48e", hair: "#9c4624", top: "#723644", top2: "#24262e", pants: "#2f3d54", shoe: "#3e261c", metal: "#a0aebc", accent: "#e8c058",
    head: "pompadour", torso: "open_vest", armN: "bare", armL: "cyber",
  },
  hulk_m4: {
    s: 1.12, build: "heavy_m", gender: "m",
    skin: "#c6885c", hair: "#1a1820", top: "#304868", top2: "#c84632", pants: "#242830", shoe: "#1e1a18", metal: "#9aa8b6", accent: "#e0a43a",
    head: "bandana", torso: "tank", armN: "bare", armL: "cyber",
  },

  /* === РАННЕР (runner): быстрый стрелок === */
  runner_m0: {
    s: 1.0, build: "lean_m", gender: "m",
    skin: "#d8a07a", hair: "#181820", top: "#3c5468", top2: "#6b4d35", pants: "#26303d", shoe: "#22242a", metal: "#8c9ba8", accent: "#6fe0e6",
    head: "shades_spiky", torso: "bomber", armN: "sleeve", armL: "sleeve", coat: true, defW: "pistol",
  },
  runner_m1: {
    s: 1.01, build: "musc_m", gender: "m",
    skin: "#b2704a", hair: "#241c18", top: "#284468", top2: "#a83e38", pants: "#20242c", shoe: "#c43e32", metal: "#94a2b0", accent: "#6fe0e6",
    head: "headband", torso: "open_vest", armN: "bare", armL: "bare", defW: "pistol",
  },
  runner_m2: {
    s: 1.0, build: "lean_m", gender: "m",
    skin: "#e6b490", hair: "#c46834", top: "#6e363c", top2: "#24242c", pants: "#282c36", shoe: "#1c1e24", metal: "#8e9ca8", accent: "#f0c850",
    head: "pompadour", torso: "leather_jacket", armN: "sleeve", armL: "sleeve", defW: "pistol",
  },
  runner_m3: {
    s: 0.99, build: "lean_m", gender: "m",
    skin: "#965c3e", hair: "#d8dee4", top: "#386454", top2: "#e0a43a", pants: "#262c34", shoe: "#242220", metal: "#94a2b0", accent: "#6fe0e6",
    head: "dreads", torso: "track_top", armN: "sleeve", armL: "sleeve", defW: "pistol",
  },
  runner_f0: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#eab690", hair: "#5a2818", top: "#28507e", top2: "#1c202a", pants: "#28507e", shoe: "#284878", metal: "#8c9ba8", accent: "#6fe0e6",
    head: "blaze_hair", torso: "jacket_crop", armN: "jacket_short", armL: "jacket_short", defW: "pistol",
  },
  runner_f1: {
    s: 0.98, build: "slim_f", gender: "f",
    skin: "#dc9e76", hair: "#1c1824", top: "#be3438", top2: "#1e2028", pants: "#be3438", shoe: "#b82e32", metal: "#94a2b0", accent: "#ffe078",
    head: "ponytail", torso: "blaze_skirt", armN: "bare", armL: "bare", defW: "pistol",
  },
  runner_f2: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#f0c4a0", hair: "#8c2c44", top: "#346864", top2: "#1e242a", pants: "#26303c", shoe: "#20242c", metal: "#909ea8", accent: "#6fe0e6",
    head: "bob", torso: "leather_jacket", armN: "sleeve", armL: "sleeve", defW: "pistol",
  },
  runner_f3: {
    s: 0.98, build: "slim_f", gender: "f",
    skin: "#b27450", hair: "#e8be52", top: "#844874", top2: "#1e202a", pants: "#2a2838", shoe: "#783c68", metal: "#94a2b0", accent: "#ffe078",
    head: "twintails", torso: "crop_hoodie", armN: "jacket_short", armL: "jacket_short", defW: "pistol",
  },

  /* === РЕЗАК (cutter): хлыст-мононить === */
  cutter_f0: {
    s: 1.0, build: "slim_f", gender: "f",
    skin: "#edb892", hair: "#682e1a", top: "#cc342e", top2: "#1c1e26", pants: "#cc342e", shoe: "#c42e28", metal: "#9aa8b6", accent: "#f0c850",
    head: "blaze_hair", torso: "blaze_skirt", armN: "bare", armL: "bare", defW: "whip",
  },
  cutter_f1: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#d89c74", hair: "#e8b43c", top: "#2e4884", top2: "#181a24", pants: "#28427a", shoe: "#2e4884", metal: "#9aa8b6", accent: "#7fe7ee",
    head: "wavy", torso: "bodysuit", armN: "bare", armL: "bare", defW: "whip",
  },
  cutter_f2: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#f2c6a2", hair: "#3ca8b4", top: "#2e7068", top2: "#182024", pants: "#24544e", shoe: "#224642", metal: "#9aa8b6", accent: "#7fe7ee",
    head: "sidecut", torso: "jacket_crop", armN: "jacket_short", armL: "bare", defW: "whip",
  },
  cutter_f3: {
    s: 0.98, build: "slim_f", gender: "f",
    skin: "#bc7c56", hair: "#a22c4a", top: "#6c3668", top2: "#1a1824", pants: "#562a54", shoe: "#4a2248", metal: "#a0aebc", accent: "#f0c850",
    head: "twintails", torso: "sport_crop", armN: "bare", armL: "bare", defW: "whip",
  },
  cutter_m0: {
    s: 1.0, build: "musc_m", gender: "m",
    skin: "#cc8e64", hair: "#d45434", top: "#2e2834", top2: "#a83e38", pants: "#22242c", shoe: "#3a2420", metal: "#9aa8b6", accent: "#7fe7ee",
    head: "tiger_mane", torso: "bare_pecs", armN: "bare", armL: "bare", defW: "whip",
  },
  cutter_m1: {
    s: 1.01, build: "musc_m", gender: "m",
    skin: "#9c6240", hair: "#1a1620", top: "#5c2e38", top2: "#e0a43a", pants: "#24242c", shoe: "#261c1a", metal: "#9aa8b6", accent: "#7fe7ee",
    head: "dreads", torso: "cyber_harness", armN: "bare", armL: "bare", defW: "whip",
  },

  /* === ОХРАНА AGOGEE (guard) === */
  guard_m0: {
    s: 1.01, build: "musc_m", gender: "m",
    skin: "#d8a888", hair: "#28201e", top: "#4e6d7a", top2: "#c9a23a", pants: "#2e3844", shoe: "#181a20", metal: "#9aa8b4", accent: "#e0a43a",
    head: "cap", torso: "uniform", armN: "short", armL: "short", defW: "baton",
  },
  guard_m1: {
    s: 1.02, build: "musc_m", gender: "m",
    skin: "#9c623e", hair: "#1c1614", top: "#425e6b", top2: "#d9a23a", pants: "#2c3642", shoe: "#181a20", metal: "#9aa8b4", accent: "#e0a43a",
    head: "cap", torso: "uniform", armN: "short", armL: "short", defW: "baton",
  },
  guard_m2: {
    s: 1.0, build: "lean_m", gender: "m",
    skin: "#e8ba98", hair: "#744424", top: "#3f5866", top2: "#6fe0e6", pants: "#28323d", shoe: "#181a20", metal: "#9aa8b4", accent: "#6fe0e6",
    head: "fade", torso: "uniform", armN: "sleeve", armL: "sleeve", defW: "baton",
  },
  guard_f0: {
    s: 0.96, build: "slim_f", gender: "f",
    skin: "#dfb08e", hair: "#2a201c", top: "#4c6c7a", top2: "#d9a23a", pants: "#2a3440", shoe: "#181c24", metal: "#9aa8b4", accent: "#6fe0e6",
    head: "cap_f", torso: "uniform", armN: "short", armL: "short", defW: "baton",
  },
  guard_f1: {
    s: 0.97, build: "slim_f", gender: "f",
    skin: "#c88c66", hair: "#1c1820", top: "#466472", top2: "#d9a23a", pants: "#26303c", shoe: "#181c24", metal: "#9aa8b4", accent: "#e0a43a",
    head: "ponytail", torso: "uniform", armN: "short", armL: "short", defW: "baton",
  },

  /* === ЭКЗО FUSION (exo) === */
  exo_m0: {
    s: 1.14, build: "heavy_m", gender: "m",
    skin: "#b68664", hair: "#261e1c", top: "#c27038", top2: "#5a6470", pants: "#353a44", shoe: "#22242a", metal: "#8d9ba8", accent: "#ffb23a",
    head: "hardhat", torso: "exo", armN: "exo", armL: "exo",
  },
  exo_m1: {
    s: 1.13, build: "heavy_m", gender: "m",
    skin: "#8c583c", hair: "#1a181e", top: "#487478", top2: "#c9a23a", pants: "#2d323c", shoe: "#22242a", metal: "#95a4b2", accent: "#6fe0e6",
    head: "hardhat", torso: "exo", armN: "exo", armL: "exo",
  },

  /* === АГЕНТ INTERCELL (agent) === */
  agent_m0: {
    s: 1.02, build: "lean_m", gender: "m",
    skin: "#d8a27c", hair: "#18161c", top: "#202b3c", top2: "#b43632", pants: "#1c2432", shoe: "#121318", metal: "#aab4be", accent: "#7fe7ee",
    head: "shades_bald", torso: "suit", armN: "sleeve", armL: "sleeve", coat: true, defW: "baton",
  },
  agent_m1: {
    s: 1.01, build: "lean_m", gender: "m",
    skin: "#e6b896", hair: "#c8cdd6", top: "#2b3240", top2: "#4898a8", pants: "#202530", shoe: "#121318", metal: "#aab4be", accent: "#7fe7ee",
    head: "slick", torso: "suit", armN: "sleeve", armL: "sleeve", coat: true, defW: "baton",
  },
  agent_f0: {
    s: 0.97, build: "slim_f", gender: "f",
    skin: "#e4b898", hair: "#1a1620", top: "#2a3548", top2: "#b84440", pants: "#222938", shoe: "#14161c", metal: "#aab4be", accent: "#7fe7ee",
    head: "slick", torso: "suit", armN: "sleeve", armL: "sleeve", coat: true, defW: "baton",
  },
  agent_f1: {
    s: 0.97, build: "slim_f", gender: "f",
    skin: "#c68862", hair: "#682628", top: "#382c40", top2: "#d9a23a", pants: "#282030", shoe: "#14161c", metal: "#aab4be", accent: "#7fe7ee",
    head: "bob", torso: "suit", armN: "sleeve", armL: "sleeve", coat: true, defW: "baton",
  },

  /* === ШТУРМОВИК SLAYER (trooper) === */
  trooper_m0: {
    s: 1.06, build: "musc_m", gender: "m",
    skin: "#c89876", hair: "#1a181e", top: "#38343e", top2: "#a83838", pants: "#282630", shoe: "#141318", metal: "#6a7482", accent: "#ff4848",
    head: "helmet", torso: "armor", armN: "armor", armL: "armor", defW: "rifle",
  },
  trooper_m1: {
    s: 1.07, build: "musc_m", gender: "m",
    skin: "#986040", hair: "#1a181e", top: "#2e3844", top2: "#c87834", pants: "#222830", shoe: "#141318", metal: "#6a7482", accent: "#ff8844",
    head: "helmet", torso: "armor", armN: "armor", armL: "armor", defW: "rifle",
  },
  trooper_f0: {
    s: 0.99, build: "slim_f", gender: "f",
    skin: "#d8a888", hair: "#221c26", top: "#3c3644", top2: "#b43c3c", pants: "#24222c", shoe: "#141318", metal: "#727c8a", accent: "#ff4848",
    head: "helmet", torso: "armor", armN: "armor", armL: "armor", defW: "rifle",
  },
};

// Алиасы базовых классов для обратной совместимости
LOOKS.rat = LOOKS.rat_m0;
LOOKS.hulk = LOOKS.hulk_m0;
LOOKS.runner = LOOKS.runner_f0;
LOOKS.cutter = LOOKS.cutter_f0;
LOOKS.guard = LOOKS.guard_m0;
LOOKS.exo = LOOKS.exo_m0;
LOOKS.agent = LOOKS.agent_m0;
LOOKS.trooper = LOOKS.trooper_m0;

export const CLASS_VARIANTS: Record<string, { m: string[]; f: string[] }> = {
  rat: { m: ["rat_m0", "rat_m1", "rat_m2", "rat_m3"], f: ["rat_f0", "rat_f1", "rat_f2", "rat_f3"] },
  hulk: { m: ["hulk_m0", "hulk_m1", "hulk_m2", "hulk_m3", "hulk_m4"], f: ["hulk_m0", "hulk_m1", "hulk_m2", "hulk_m3", "hulk_m4"] },
  runner: { m: ["runner_m0", "runner_m1", "runner_m2", "runner_m3"], f: ["runner_f0", "runner_f1", "runner_f2", "runner_f3"] },
  cutter: { m: ["cutter_m0", "cutter_m1"], f: ["cutter_f0", "cutter_f1", "cutter_f2", "cutter_f3"] },
  guard: { m: ["guard_m0", "guard_m1", "guard_m2"], f: ["guard_f0", "guard_f1"] },
  exo: { m: ["exo_m0", "exo_m1"], f: ["exo_m0", "exo_m1"] },
  agent: { m: ["agent_m0", "agent_m1"], f: ["agent_f0", "agent_f1"] },
  trooper: { m: ["trooper_m0", "trooper_m1"], f: ["trooper_f0"] },
};

export function pickClassLook(cls: string, rand = Math.random): { look: string; gender: "m" | "f" } {
  const pool = CLASS_VARIANTS[cls];
  if (!pool) return { look: cls, gender: "m" };
  const forceM = cls === "hulk" || cls === "exo";
  const gender: "m" | "f" = forceM ? "m" : rand() < 0.5 ? "m" : "f";
  const arr = pool[gender];
  return { look: arr[Math.floor(rand() * arr.length)], gender };
}

/* === ГРАЖДАНСКИЕ: спортивные атлеты, панки, офисные, в дождевиках — 24 стиля === */
const CIV_SKIN = ["#efc29e", "#d29a72", "#a8673f", "#7e4a30", "#e6b896", "#c68b62"];
const CIV_HAIR = ["#1a1820", "#3a2a22", "#6a4a30", "#c95a32", "#e4b242", "#d4dae2", "#46a6b0", "#8e2c44"];

export const CIV_LOOKS: string[] = [];
const addCiv = (id: string, L: Look) => {
  LOOKS[id] = L;
  CIV_LOOKS.push(id);
};

const M_TOPS = ["#3e5a74", "#8a3e38", "#426652", "#c27d32", "#5c4268", "#2d6a6c"];
const M_PANTS = ["#2c384e", "#262832", "#3a424c", "#423a2c", "#242c38", "#30323c"];
const M_HEADS = ["spiky", "shades_bald", "headband", "pompadour", "fade", "bandana"];
const M_TORSOS = ["tee_musc", "open_vest", "tank", "track_top", "leather_jacket", "street_hoodie"];

const F_TOPS = ["#c83430", "#325c8a", "#9e344e", "#2f7a6d", "#c87a34", "#6e4082"];
const F_PANTS = ["#c83430", "#2c507c", "#9e344e", "#283644", "#2b2b36", "#362844"];
const F_HEADS = ["blaze_hair", "wavy", "ponytail", "bob", "sidecut", "twintails"];
const F_TORSOS = ["blaze_skirt", "jacket_crop", "sport_crop", "crop_hoodie", "leather_jacket", "bodysuit"];

for (let v = 0; v < 6; v++) {
  const sk = CIV_SKIN[v % CIV_SKIN.length], hr = CIV_HAIR[(v * 3) % CIV_HAIR.length];
  const mTorso = M_TORSOS[v];
  const mArm = mTorso === "track_top" || mTorso === "leather_jacket" || mTorso === "street_hoodie" ? "sleeve" : "bare";
  addCiv("civ_msport" + v, {
    s: 0.99 + (v % 2) * 0.02, build: v % 2 === 0 ? "musc_m" : "lean_m", gender: "m",
    skin: sk, hair: hr,
    top: M_TOPS[v], top2: ["#d8d0bc", "#e0a43a", "#242a34", "#6fe0e6", "#d85848", "#c8a850"][v],
    pants: M_PANTS[v], shoe: ["#282220", "#1e2028", "#482a20", "#22242a", "#3a2824", "#1a1c22"][v], accent: "#e0a43a",
    head: M_HEADS[v], torso: mTorso, armN: mArm, armL: mArm,
  });

  const fTorso = F_TORSOS[v];
  const fArm = fTorso === "jacket_crop" || fTorso === "crop_hoodie" ? "jacket_short" : fTorso === "leather_jacket" ? "sleeve" : "bare";
  addCiv("civ_fsport" + v, {
    s: 0.97 + (v % 2) * 0.02, build: "slim_f", gender: "f",
    skin: CIV_SKIN[(v + 1) % CIV_SKIN.length], hair: CIV_HAIR[(v * 5 + 1) % CIV_HAIR.length],
    top: F_TOPS[v], top2: ["#1e2028", "#e8dcc0", "#1c2028", "#e0a43a", "#222630", "#6fe0e6"][v],
    pants: F_PANTS[v], shoe: ["#be2e2a", "#2e4e78", "#942c44", "#243038", "#2a201c", "#482854"][v], accent: "#e8c25a",
    head: F_HEADS[v], torso: fTorso, armN: fArm, armL: fArm,
  });
}

for (let v = 0; v < 6; v++) {
  const isF = v % 2 === 1;
  addCiv("civ_office" + v, {
    s: isF ? 0.97 : 1.0, build: isF ? "slim_f" : "lean_m", gender: isF ? "f" : "m",
    skin: CIV_SKIN[(v + 2) % CIV_SKIN.length], hair: CIV_HAIR[(v * 2 + 2) % CIV_HAIR.length],
    top: ["#3e4858", "#524658", "#384844", "#4d3838", "#2d3c4e", "#4e4a38"][v],
    top2: ["#a8553a", "#c9a23a", "#4e8ca0", "#d4604a", "#6fb090", "#8e589a"][v],
    pants: ["#242834", "#20222c", "#2a3038", "#282226", "#1e2430", "#262622"][v], shoe: "#16161c", accent: "#e0a43a",
    head: isF ? ["slick", "bob", "ponytail"][(v >> 1) % 3] : ["spiky", "fade", "shades_spiky"][(v >> 1) % 3],
    torso: "suit", armN: "sleeve", armL: "sleeve", defW: v % 3 === 0 ? "case" : null,
  });
  addCiv("civ_rain" + v, {
    s: isF ? 0.97 : 0.99, build: isF ? "slim_f" : "lean_m", gender: isF ? "f" : "m",
    skin: CIV_SKIN[(v + 3) % CIV_SKIN.length], hair: CIV_HAIR[(v * 3 + 4) % CIV_HAIR.length],
    top: ["#b48238", "#487888", "#744454", "#4c6a4a", "#8e4a38", "#3d5478"][v],
    top2: ["#344454", "#c88a3a", "#4a6c7a", "#a84c5c", "#3a4a5a", "#d9a23a"][v],
    pants: "#282c36", shoe: "#26262c", accent: "#6fe0e6",
    coat: true, head: isF ? ["ponytail", "bob", "wavy"][(v >> 1) % 3] : ["hood", "dreads", "bandana"][(v >> 1) % 3],
    torso: "raincoat", armN: "sleeve", armL: "sleeve", defW: v % 2 === 0 ? "umbrella" : null,
  });
}

/* ------------------------------ ХЕЛПЕРЫ ------------------------------ */
const rd = (d: number) => (d * Math.PI) / 180;
const fk = (x: number, y: number, len: number, deg: number) => [x + Math.sin(rd(deg)) * len, y + Math.cos(rd(deg)) * len];
const METAL = ramp("#95a4b2");

interface BuildProfile {
  shoN: number; shoL: number;
  chestN: number; chestL: number;
  waistN: number; waistL: number;
  hipN: number; hipL: number;
  hipSpread: number;
  armR0: number; armREl: number; armR1: number;
  legWt: number; legWk: number; legWa: number;
  bootHeel: boolean;
}

export function profileOf(b: BodyBuild): BuildProfile {
  switch (b) {
    case "heavy_m":
      return {
        shoN: 11.2, shoL: 9.6, chestN: 10.4, chestL: 8.8, waistN: 8.2, waistL: 7.0, hipN: 8.2, hipL: 7.2,
        hipSpread: 3.9, armR0: 4.2, armREl: 3.3, armR1: 2.85, legWt: 4.7, legWk: 3.4, legWa: 2.55, bootHeel: false,
      };
    case "musc_m":
      return {
        shoN: 9.8, shoL: 8.3, chestN: 8.6, chestL: 7.4, waistN: 6.2, waistL: 5.3, hipN: 6.6, hipL: 5.7,
        hipSpread: 3.5, armR0: 3.5, armREl: 2.75, armR1: 2.4, legWt: 4.1, legWk: 2.9, legWa: 2.1, bootHeel: false,
      };
    case "slim_f":
      return {
        shoN: 7.1, shoL: 6.1, chestN: 6.6, chestL: 5.7, waistN: 4.5, waistL: 3.9, hipN: 6.7, hipL: 5.9,
        hipSpread: 3.0, armR0: 2.6, armREl: 2.1, armR1: 1.85, legWt: 3.75, legWk: 2.45, legWa: 1.65, bootHeel: true,
      };
    default: // lean_m -> поджарый уличный боец (широкие плечи, плотные руки и ноги)
      return {
        shoN: 8.6, shoL: 7.3, chestN: 7.6, chestL: 6.5, waistN: 5.7, waistL: 4.9, hipN: 6.2, hipL: 5.3,
        hipSpread: 3.3, armR0: 3.05, armREl: 2.4, armR1: 2.1, legWt: 3.7, legWk: 2.65, legWa: 1.9, bootHeel: false,
      };
  }
}

/* ---------------------- ОТРИСОВКА ПЕРСОНАЖА В 3/4 ---------------------- */
export function drawChar(px: Px, L: Look, P: Pose, eq: Eq): number {
  const s = L.s;
  const bp = profileOf(L.build);
  const m = getCharMetrics(s);
  const th = m.thighLen, sh = m.shinLen, tl = m.torsoLen, footH = m.footH;

  const nano = eq.body === "nano";
  const topR = ramp(nano ? "#3b5966" : L.top);
  const top2R = ramp(L.top2 || L.top);
  const pantsR = ramp(L.pants);
  const shoeR = ramp(L.shoe);
  const skinR = ramp(L.skin);
  const hairR = ramp(L.hair || "#222");
  const metalR = ramp(L.metal || "#95a4b2");
  const dTop = dimRamp(topR, 0.16), dPants = dimRamp(pantsR, 0.18), dSkin = dimRamp(skinR, 0.16), dTop2 = dimRamp(top2R, 0.16), dMetal = dimRamp(metalR, 0.16);

  /* --- широкая 3/4 стойка ног, устойчивая посадка таза --- */
  const spread = bp.hipSpread * s * Math.max(0.75, P.twist);
  const hipBackOff = [-spread, -0.4];
  const hipFrontOff = [spread * 0.85, 0.5];

  const kF = fk(hipFrontOff[0], hipFrontOff[1], th, P.fT);
  const aF = fk(kF[0], kF[1], sh, P.fS);
  const kB = fk(hipBackOff[0], hipBackOff[1], th, P.kT);
  const aB = fk(kB[0], kB[1], sh, P.kS);

  const hipX = OX + P.dx;
  const hipY = OY - Math.max(aF[1], aB[1]) - footH + P.hipDy;
  const at = (p: number[]) => [hipX + p[0], hipY + p[1]];

  /* --- торс 3/4: широкая грудная клетка, оба плеча, V-талия или женский изгиб --- */
  const lean = rd(P.lean);
  const u = [Math.sin(lean), -Math.cos(lean)];
  const v = [Math.cos(lean), Math.sin(lean)];
  const tw = P.twist; // разворот ширины плеч/груди в 3/4 перспективе
  const TP = (t: number, side: number) => [
    hipX + u[0] * t * tl + v[0] * side * s * (0.85 + 0.15 * tw),
    hipY + u[1] * t * tl + v[1] * side * s * (0.85 + 0.15 * tw),
  ];

  // Мощный анатомический контур корпуса: трапеция -> широкие плечи -> массивная грудь -> талия -> бедро
  const torsoPts = [
    TP(0.0, -bp.hipN),
    TP(0.16, -(bp.hipN * 0.62 + bp.waistN * 0.38)),
    TP(0.32, -bp.waistN),
    TP(0.50, -(bp.waistN * 0.32 + bp.chestN * 0.68)),
    TP(0.70, -bp.chestN),
    TP(0.86, -bp.shoN),
    TP(0.96, -bp.shoN * 0.64),
    TP(1.03, -bp.shoN * 0.34),
    TP(1.06, 0.7),
    TP(1.02, bp.shoL * 0.42),
    TP(0.95, bp.shoL * 0.68),
    TP(0.86, bp.shoL),
    TP(0.70, bp.chestL),
    TP(0.50, bp.waistL * 0.30 + bp.chestL * 0.70),
    TP(0.32, bp.waistL),
    TP(0.16, bp.hipL * 0.62 + bp.waistL * 0.38),
    TP(0.0, bp.hipL),
  ];
  const torsoM = polyM(torsoPts);

  const ov = (pts: number[][], r: Ramp | string | undefined, o?: { rim?: boolean; shade?: boolean; flat?: boolean; spec?: boolean }) => {
    if (!r) return;
    const mask = interM(polyM(pts.map((p) => TP(p[0], p[1]))), torsoM);
    if (typeof r === "string") px.fill(mask, r);
    else px.paint(mask, r, { rim: false, ...(o || {}) });
  };
  const band = (t0: number, t1: number, a0 = -14, a1 = 14) => [[t0, a0], [t0, a1], [t1, a1], [t1, a0]];

  // Ближнее (к камере) и дальнее (к врагу) плечи
  const shoNear = TP(0.86, -bp.shoN * 0.76);
  const shoLead = TP(0.87, bp.shoL * 0.80);

  /* --- 3/4 голова (пропорциональная ~1:8, без больших голов) --- */
  const neck = TP(1.03, 0.75);
  const hc = [
    neck[0] + u[0] * (m.neckLen + m.headRy * 0.92) + P.hdx,
    neck[1] + u[1] * (m.neckLen + m.headRy * 0.92) + P.hdy,
  ];
  const T = rd(P.tilt), tc = Math.cos(T), ts = Math.sin(T);
  const HP = (lx: number, ly: number) => [hc[0] + (lx * tc - ly * ts) * s, hc[1] + (lx * ts + ly * tc) * s];

  const wp = eq.weapon ? eq.weapon : L.defW || null;

  /* ===== отрисовка руки в 3/4 (дельта, рельефный бицепс, мощное предплечье, кулак) ===== */
  const drawArm = (side: "near" | "lead") => {
    const isNear = side === "near";
    const sp = isNear ? shoNear : shoLead;
    const U = isNear ? P.nU : P.lU;
    const F = isNear ? P.nF : P.lF;
    const el = fk(sp[0], sp[1], 11.4 * s, U);
    const wr = fk(el[0], el[1], 10.9 * s, F);
    const style = isNear ? L.armN : L.armL;

    const r0 = bp.armR0 * s, rEl = bp.armREl * s, r1 = bp.armR1 * s;
    const bicepPt = [sp[0] * 0.52 + el[0] * 0.48, sp[1] * 0.52 + el[1] * 0.48];
    const foreMid = [el[0] * 0.66 + wr[0] * 0.34, el[1] * 0.66 + wr[1] * 0.34];
    const upper = unionM(
      capM(sp[0], sp[1], bicepPt[0], bicepPt[1], r0 * 1.05, r0 * 0.96),
      capM(bicepPt[0], bicepPt[1], el[0], el[1], r0 * 0.96, rEl)
    );
    const fore = unionM(
      capM(el[0], el[1], foreMid[0], foreMid[1], rEl * 1.04, rEl * 1.18),
      capM(foreMid[0], foreMid[1], wr[0], wr[1], rEl * 1.18, r1)
    );
    const arm = unionM(upper, fore);

    const isFarDim = !isNear;
    const tR = isFarDim ? dTop : topR;
    const sR = isFarDim ? dSkin : skinR;
    const mR = isFarDim ? dMetal : metalR;

    const dir = [wr[0] - el[0], wr[1] - el[1]], dl = Math.hypot(dir[0], dir[1]) || 1;
    const nd = [dir[0] / dl, dir[1] / dl];
    const hand = [wr[0] + nd[0] * 1.8 * s, wr[1] + nd[1] * 1.8 * s];
    const gloveR = L.head === "cap" || L.head === "cap_f" || L.head === "helmet" || style === "armor" || L.torso === "bodysuit" || L.torso === "sport_crop" || L.torso === "jacket_crop" || L.torso === "blaze_skirt"
      ? dimRamp(ramp("#22242e"), isFarDim ? 0.14 : 0)
      : sR;

    if (style === "sleeve" || style === "armor") {
      px.paint(arm, tR, { rim: isNear });
      if (style === "armor") {
        px.paint(ellM(sp[0], sp[1] + 0.4, r0 * 1.28, r0 * 1.08), isFarDim ? dTop2 : top2R, { spec: true });
        px.paint(unionM(capM(el[0], el[1], foreMid[0], foreMid[1], rEl + 0.5, rEl * 1.22 + 0.4), capM(foreMid[0], foreMid[1], wr[0], wr[1], rEl * 1.22 + 0.4, r1 + 0.4)), mR, { rim: false, spec: true });
      } else {
        px.dot(el[0], el[1], darken(L.top, 0.48));
      }
      px.paint(ellM(hand[0], hand[1], r1 * 1.32, r1 * 1.18), gloveR);
      if (isNear) px.dot(hand[0] + nd[0], hand[1] - 0.5, lighten(gloveR[1], 0.25));
    } else if (style === "jacket_short") {
      const jR = isFarDim ? dTop2 : top2R;
      px.paint(upper, jR, { spec: isNear, rim: isNear });
      px.paint(ellM(sp[0], sp[1] + 0.4, r0 * 1.18, r0 * 1.06), jR, { rim: isNear });
      if (isNear && L.accent) px.dot(sp[0] - 0.6, sp[1] + 1.8, L.accent);
      px.paint(fore, sR, { spec: isNear, rim: isNear });
      const wristBand = capM(wr[0] - nd[0] * 2.2, wr[1] - nd[1] * 2.2, wr[0], wr[1], r1 * 1.16, r1 * 1.16);
      px.paint(wristBand, gloveR, { rim: false });
      px.paint(ellM(hand[0], hand[1], r1 * 1.32, r1 * 1.18), gloveR);
      px.dot(hand[0] + nd[0] * 0.6, hand[1] - 0.2, L.skin);
    } else if (style === "bare") {
      px.paint(arm, sR, { spec: isNear, rim: isNear });
      px.paint(ellM(sp[0], sp[1] + 0.3, r0 * 1.16, r0 * 1.05), sR, { spec: isNear, rim: isNear });
      const wristBand = capM(wr[0] - nd[0] * 2.2, wr[1] - nd[1] * 2.2, wr[0], wr[1], r1 * 1.14, r1 * 1.14);
      px.paint(wristBand, ramp(L.top2 || "#242630"), { rim: false });
      px.paint(ellM(hand[0], hand[1], r1 * 1.32, r1 * 1.18), gloveR);
      if (L.build === "slim_f") px.dot(hand[0] + nd[0] * 0.6, hand[1] - 0.2, L.skin);
      else if (isNear) px.dot(hand[0] + nd[0], hand[1], L.accent || "#e0a43a");
    } else if (style === "short") {
      px.paint(upper, tR, { rim: isNear });
      px.paint(ellM(sp[0], sp[1] + 0.3, r0 * 1.14, r0 * 1.02), tR, { rim: isNear });
      px.paint(fore, sR, { rim: isNear });
      px.paint(ellM(hand[0], hand[1], r1 * 1.3, r1 * 1.16), gloveR);
    } else if (style === "cyber") {
      px.paint(upper, isFarDim ? dSkin : skinR, { spec: isNear });
      px.paint(ellM(sp[0], sp[1] + 0.3, r0 * 1.15, r0 * 1.04), isFarDim ? dSkin : skinR, { rim: isNear });
      px.paint(fore, mR, { spec: true });
      px.paint(ellM(el[0], el[1], rEl * 1.14, rEl * 1.14), mR, { spec: true });
      px.dot(el[0], el[1], L.accent || "#e0a43a");
      px.paint(ellM(hand[0], hand[1], r1 * 1.34, r1 * 1.2), mR, { spec: true });
      px.dot(hand[0] + nd[0], hand[1], L.accent || "#e0a43a");
    } else if (style === "exo") {
      px.paint(upper, ramp("#464b54"));
      px.paint(ellM(sp[0], sp[1], 4.8 * s, 4.1 * s), isFarDim ? dTop : topR, { spec: true });
      px.paint(fore, isFarDim ? dMetal : ramp("#788390"), { spec: true });
      px.paint(ellM(el[0], el[1], 2.9 * s, 2.9 * s), isFarDim ? dTop : topR);
      px.paint(ellM(hand[0], hand[1], 3.5 * s, 3.1 * s), isFarDim ? dMetal : ramp("#66707c"), { spec: true });
      px.dot(hand[0] + 1, hand[1], L.accent || "#ffb23a");
    }

    // Классический шлейф удара в духе Streets of Rage
    if (!wp && ((side === "lead" && P.smear === 1) || (side === "near" && P.smear === 2))) {
      for (let k = 1; k <= 8; k++) {
        px.dot(hand[0] - nd[0] * k * 2.2, hand[1] - nd[1] * k * 1.4, k < 4 ? "#fff4d0" : "#9ad8ec");
      }
    }

    return { sp, el, wr, hand, dir: nd, ang: F };
  };

  /* ===== отрисовка ноги: сильные бедра, рельефные икры, устойчивая боевая обувь ===== */
  const drawLeg = (front: boolean) => {
    const hOff = front ? hipFrontOff : hipBackOff;
    const kn = at(front ? kF : kB), an = at(front ? aF : aB);
    const hipPt = [hipX + hOff[0], hipY + hOff[1]];

    const isFem = L.build === "slim_f";
    const bareLegs = isFem && (L.torso === "blaze_skirt" || L.torso === "jacket_crop" || L.torso === "sport_crop" || L.torso === "bodysuit");
    const pr = bareLegs ? (front ? skinR : dSkin) : (front ? pantsR : dPants);
    const sr = front ? shoeR : dimRamp(shoeR, 0.2);

    const wt = bp.legWt * s, wk = bp.legWk * s, wa = bp.legWa * s;
    const quadPt = [hipPt[0] * 0.54 + kn[0] * 0.46, hipPt[1] * 0.54 + kn[1] * 0.46];
    const calfPt = [kn[0] * 0.68 + an[0] * 0.32, kn[1] * 0.68 + an[1] * 0.32];
    const calfR = wk * (isFem ? 1.04 : 1.14);
    const leg = unionM(
      unionM(
        capM(hipPt[0], hipPt[1], quadPt[0], quadPt[1], wt, wt * 0.94),
        capM(quadPt[0], quadPt[1], kn[0], kn[1], wt * 0.94, wk)
      ),
      unionM(
        capM(kn[0], kn[1], calfPt[0], calfPt[1], wk, calfR),
        capM(calfPt[0], calfPt[1], an[0], an[1], calfR, wa)
      )
    );
    px.paint(leg, pr, { spec: bareLegs && front });

    const hasCuffedBoots = bareLegs && (L.torso === "blaze_skirt" || L.torso === "jacket_crop" || L.torso === "sport_crop" || L.torso === "bodysuit");
    if (hasCuffedBoots) {
      const bootTop = [kn[0] * 0.54 + an[0] * 0.46, kn[1] * 0.54 + an[1] * 0.46];
      px.paint(capM(bootTop[0], bootTop[1], an[0], an[1], wa * 1.44, wa * 1.2), sr, { spec: front });
      if (front) px.line(bootTop[0] - wa * 1.25, bootTop[1], bootTop[0] + wa * 1.25, bootTop[1], L.accent || "#e8c25a", 1);
    } else if (L.torso === "exo" || L.torso === "armor" || L.torso === "open_vest") {
      px.paint(ellM(kn[0] + 0.6, kn[1], wk * 0.9, wk * 0.9), front ? ramp("#3c4452") : dMetal);
    } else if (front) {
      px.dot(kn[0] + 0.6, kn[1] - 0.5, lighten(L.pants, 0.22));
    }

    const toeDx = (front ? (isFem ? 2.6 : 3.2) : (isFem ? 2.0 : 2.5)) * s;
    const boot = unionM(
      capM(an[0], an[1] - (hasCuffedBoots ? 2.1 : 1.7) * s, an[0], an[1] + 0.4, wa * 1.18, wa * 1.22),
      ellM(an[0] + toeDx, an[1] + 0.9 * s, (bp.bootHeel ? 3.3 : 4.2) * s, (bp.bootHeel ? 1.65 : 1.95) * s)
    );
    px.paint(boot, sr, { spec: front });
    px.rect(an[0] - (isFem ? 1.1 : 1.5), an[1] + 1.8 * s, (isFem ? 5.6 : 6.9) * s, 1, darken(L.shoe, 0.7));
  };

  /* ===== задние слои: развевающиеся волосы / дреды / хвосты / рюкзак / ранец ===== */
  if (L.head === "blaze_hair" || L.head === "wavy" || L.head === "ponytail" || L.head === "tiger_mane" || L.head === "dreads" || L.head === "twintails" || L.head === "bob") {
    const fl = P.coatSwing * 0.6;
    const hb = L.head === "ponytail"
      ? polyM([HP(-2.2, -2.5), HP(-5.8, -2.0), HP(-8.2 + fl, 3.0), HP(-6.8 + fl, 7.2), HP(-4.2, 4.0), HP(-1.5, 0.5)])
      : L.head === "twintails"
      ? unionM(
          polyM([HP(-3.2, -2.8), HP(-6.6, -1.6), HP(-8.6 + fl, 4.2), HP(-6.2 + fl, 7.0), HP(-4.0, 2.2)]),
          polyM([HP(2.8, -3.4), HP(5.8, -2.4), HP(7.0 + fl * 0.5, 2.8), HP(5.0 + fl * 0.4, 4.6), HP(3.0, 0.8)])
        )
      : L.head === "dreads"
      ? polyM([HP(-2.2, -2.8), HP(-6.0, -1.2), HP(-7.6 + fl * 0.5, 6.2), HP(-5.2 + fl * 0.5, 9.8), HP(-2.4, 6.0), HP(-0.6, 1.2)])
      : L.head === "bob"
      ? polyM([HP(-2.6, -2.0), HP(-5.4, 0.2), HP(-5.6, 4.8), HP(-2.8, 5.2), HP(-1.0, 2.0)])
      : polyM([HP(-2.2, -2.5), HP(-5.8, -1.0), HP(-7.2 + fl * 0.4, 5.2), HP(-8.6 + fl, 12.2), HP(-4.8 + fl, 12.6), HP(-2.0, 6.2), HP(0, 1.5)]);
    px.paint(hb, dimRamp(hairR, 0.08), { spec: true });
  }
  if (L.torso === "hoodjacket" || L.torso === "street_hoodie") {
    const bag = ellM(TP(0.54, -bp.waistN - 2.0)[0], TP(0.54, -bp.waistN - 2.0)[1], 3.4 * s, 4.6 * s);
    px.paint(bag, ramp("#726244"));
  }
  if (L.torso === "exo") {
    px.paint(polyM([TP(0.95, -bp.shoN), TP(1.2, -bp.shoN - 3.2), TP(0.3, -bp.waistN - 3.0), TP(0.2, -bp.waistN)]), ramp("#464b54"), { spec: true });
    px.dot(TP(1.05, -bp.shoN - 2.2)[0], TP(1.05, -bp.shoN - 2.2)[1], L.accent || "#ffb23a");
  }

  /* ===== ПОРЯДОК СЛОЁВ В 3/4 ===== */
  const leadArm = drawArm("lead");
  drawLeg(false);
  drawLeg(true);

  /* таз / мини-юбка / короткие шорты (органично перетекают в бёдра) */
  const isSkirt = L.torso === "blaze_skirt" || L.torso === "jacket_crop";
  const pelvis = polyM(
    isSkirt
      ? [
          TP(0.16, -bp.hipN - 0.3),
          TP(0.16, bp.hipL + 0.3),
          [hipX + hipFrontOff[0] + bp.legWt * s * 0.78, hipY + 5.0 * s],
          [hipX + 0.3 * s, hipY + 5.4 * s],
          [hipX + hipBackOff[0] - bp.legWt * s * 0.78, hipY + 4.7 * s],
        ]
      : [
          TP(0.08, -bp.hipN),
          TP(0.08, bp.hipL),
          [hipX + hipFrontOff[0] + bp.legWt * s * 0.66, hipY + 3.0 * s],
          [hipX + 0.4 * s, hipY + 4.0 * s],
          [hipX + hipBackOff[0] - bp.legWt * s * 0.66, hipY + 2.6 * s],
        ]
  );
  px.paint(pelvis, pantsR, { rim: isSkirt, spec: isSkirt });
  if (L.torso === "jacket_crop") {
    const b0 = TP(0.12, -bp.hipN + 0.3), b1 = [hipX + 1.2 * s, hipY + 4.6 * s];
    px.line(b0[0], b0[1], b1[0], b1[1], "#181a22", 2);
    px.dot(b1[0], b1[1] - 1.2, "#d8e0ec");
  }

  /* торс */
  const bareChest = L.torso === "bare_pecs" || L.torso === "open_vest" || L.torso === "sport_crop" || L.torso === "blaze_skirt" || L.torso === "jacket_crop" || L.torso === "cyber_harness" || L.torso === "crop_hoodie";
  const baseTop = bareChest ? skinR : topR;
  px.paint(torsoM, baseTop);

  // Реалистичный анатомический рельеф груди, ключиц и пресса в 3/4
  if (bareChest || L.torso === "tank" || L.torso === "tee_musc") {
    const skC = bareChest ? L.skin : L.top;
    // Ключичная дуга и тень шеи
    const cl0 = TP(0.95, -2.0), cl1 = TP(0.92, 0.7), cl2 = TP(0.95, 2.8);
    px.line(cl0[0], cl0[1], cl1[0], cl1[1], darken(skC, 0.22), 1);
    px.line(cl1[0], cl1[1], cl2[0], cl2[1], darken(skC, 0.22), 1);
    if (L.build === "slim_f") {
      const b1 = TP(0.69, -1.2), b2 = TP(0.7, 2.5);
      px.line(b1[0] - 1.8, b1[1] + 1.0, b1[0] + 1.1, b1[1] + 1.8, darken(skC, 0.32), 1);
      px.line(b2[0] - 1.0, b2[1] + 1.8, b2[0] + 1.8, b2[1] + 1.0, darken(skC, 0.32), 1);
      px.dot(b1[0], b1[1], lighten(skC, 0.24));
      px.dot(b2[0], b2[1], lighten(skC, 0.24));
      const ab = TP(0.38, 1.1);
      px.line(ab[0], ab[1] - 1.2, ab[0], ab[1] + 2.2, darken(L.skin, 0.22), 1);
    } else {
      // Грудные мышцы, грудина, зубчатые мышцы и рельеф пресса
      const st0 = TP(0.86, 1.3), st1 = TP(0.60, 1.2);
      px.line(st0[0], st0[1], st1[0], st1[1], darken(skC, 0.34), 1);
      const pL0 = TP(0.60, -3.2), pL1 = TP(0.60, 1.1);
      const pR0 = TP(0.60, 1.6), pR1 = TP(0.60, 4.4);
      px.line(pL0[0], pL0[1], pL1[0], pL1[1], darken(skC, 0.34), 1);
      px.line(pR0[0], pR0[1], pR1[0], pR1[1], darken(skC, 0.34), 1);
      px.dot(TP(0.72, -1.2)[0], TP(0.72, -1.2)[1], lighten(skC, 0.2));
      px.dot(TP(0.72, 2.8)[0], TP(0.72, 2.8)[1], lighten(skC, 0.18));
      if (bareChest) {
        const lL0 = TP(0.50, 1.0), lL1 = TP(0.24, 0.9);
        px.line(lL0[0], lL0[1], lL1[0], lL1[1], darken(L.skin, 0.22), 1);
        for (let k = 0; k < 2; k++) {
          const ab = TP(0.44 - k * 0.14, 1.0);
          px.line(ab[0] - 1.4, ab[1], ab[0] + 1.4, ab[1], darken(L.skin, 0.26), 1);
        }
      }
    }
  }

  switch (L.torso) {
    case "blaze_skirt":
      // Культовый красный/цветной топ-бюстье Blaze + открытый пресс + ремень с серебряной пряжкой + мини-юбка
      ov(band(0.54, 0.88, -bp.chestN * 0.9, bp.chestL * 0.94), topR, { spec: true });
      // Тонкие бретельки топа к плечам
      ov([[0.98, -2.8], [0.98, -1.2], [0.82, -1.4], [0.82, -2.8]], topR);
      ov([[0.98, 2.4], [0.98, 3.8], [0.82, 3.6], [0.82, 2.2]], topR);
      // Блик на бюстье
      { const h1 = TP(0.74, -1.2), h2 = TP(0.75, 2.8); px.dot(h1[0], h1[1], "#ffe078"); px.dot(h2[0], h2[1], "#ffe078"); }
      // Юбка + чёрный ремень с металлической пряжкой
      ov(band(0.0, 0.24), topR, { spec: true });
      ov(band(0.16, 0.28), "#181a22", { flat: true });
      { const b = TP(0.22, 1.5); px.rect(b[0] - 1.5, b[1] - 1.2, 3.5, 2.5, "#dce4f0"); }
      break;
    case "jacket_crop":
      // Открытая короткая кожанка (как на арте Blaze 2!) поверх кроп-топа + шорты/юбка с ремнём
      ov(band(0.54, 0.88, -bp.chestN * 0.86, bp.chestL * 0.9), topR, { spec: true });
      // Борта открытой куртки по краям груди и отложной воротник
      ov([[1.0, -bp.shoN], [1.0, -2.0], [0.44, -2.4], [0.44, -bp.waistN - 1]], top2R, { spec: true });
      ov([[1.0, 3.2], [1.0, bp.shoL], [0.44, bp.waistL + 1], [0.44, 3.2]], top2R, { spec: true });
      // Блик на топе + чёрный ремень на талии
      { const h1 = TP(0.74, -0.8), h2 = TP(0.75, 2.6); px.dot(h1[0], h1[1], lighten(L.top, 0.45)); px.dot(h2[0], h2[1], lighten(L.top, 0.45)); }
      ov(band(0.0, 0.22), topR, { spec: true });
      ov(band(0.15, 0.26), "#181a22", { flat: true });
      { const b = TP(0.2, 1.5); px.rect(b[0] - 1.5, b[1] - 1, 3, 2, "#dce4f0"); }
      break;
    case "open_vest":
      // Открытый уличный жилет поверх голого торса (Galsia / Vice!)
      ov([[1.0, -bp.shoN], [1.0, -0.4], [0.06, -0.2], [0.06, -bp.hipN]], topR);
      ov([[1.0, 2.8], [1.0, bp.shoL], [0.06, bp.hipL], [0.06, 2.6]], topR);
      ov(band(0.0, 0.14), "#22242c", { flat: true });
      { const b = TP(0.07, 1.6); px.rect(b[0] - 1, b[1] - 1, 3, 2, "#e0c870"); }
      break;
    case "bare_pecs":
      ov(band(0.0, 0.15), "#22242c", { flat: true });
      ov([[0.82, -1.6], [0.82, 2.6], [0.15, 2.6], [0.15, -1.6]], skinR, { rim: false });
      { const b = TP(0.08, 1.6); px.rect(b[0] - 1, b[1] - 1, 3, 2, L.top2 || "#d9a23a"); }
      break;
    case "tank":
      ov(band(0.14, 0.96, -bp.shoN * 0.72, bp.shoL * 0.75), topR);
      ov(band(0.0, 0.14), "#22242c", { flat: true });
      { const b = TP(0.07, 1.6); px.rect(b[0] - 1, b[1] - 1, 3, 2, "#d9b44c"); }
      break;
    case "tee_musc":
      ov(band(0.08, 0.98), topR);
      ov(band(0.0, 0.12), "#1e2028", { flat: true });
      px.line(TP(0.76, -2.5)[0], TP(0.76, -2.5)[1], TP(0.45, 3.0)[0], TP(0.45, 3.0)[1], L.top2 || "#e0a43a", 1);
      break;
    case "sport_crop":
      // Женский спортивный топ + открытая подтянутая талия + высокий пояс
      ov(band(0.48, 0.98), topR);
      ov(band(0.44, 0.5), darken(L.top, 0.45), { flat: true });
      ov(band(0.0, 0.18), ramp(L.pants));
      ov(band(0.12, 0.19), "#242632", { flat: true });
      { const b = TP(0.15, 1.4); px.rect(b[0] - 1, b[1] - 1, 3, 2, L.accent || "#e0a43a"); }
      break;
    case "bodysuit":
      // Боди / тактический комбинезон (Electra / Nora!)
      ov(band(0.02, 0.96), topR, { spec: true });
      ov([[0.82, 0.6], [0.82, 2.2], [0.16, 2.2], [0.16, 0.6]], darken(L.top, 0.48), { flat: true });
      ov(band(0.1, 0.17), L.top2 || "#181a24", { flat: true });
      { const b = TP(0.13, 1.5); px.rect(b[0] - 1, b[1] - 1, 3, 2, L.accent || "#e0c870"); }
      break;
    case "hoodjacket":
      ov(band(0.06, 0.97, 0.8, 2.0), darken(L.top, 0.5), { flat: true });
      ov(band(0.0, 0.12), darken(L.top, 0.35), { flat: true });
      px.paint(ellM(TP(1.0, 0.5)[0], TP(1.0, 0.5)[1], 4.2 * s, 1.9 * s), ramp(L.top2 || L.top));
      break;
    case "bomber":
      ov(band(0.0, 0.13), darken(L.top, 0.42), { flat: true });
      ov(band(0.05, 0.97, 1.2, 2.3), darken(L.top, 0.55), { flat: true });
      ov([[0.84, -3.5], [0.84, -2.0], [0.24, -2.0], [0.24, -3.5]], L.accent || L.top2 || "#e0a43a", { flat: true });
      px.paint(ellM(TP(1.0, 0.6)[0], TP(1.0, 0.6)[1], 4.4 * s, 2.1 * s), ramp(darken(L.top, 0.12)));
      break;
    case "uniform":
      ov(band(0.14, 0.96), ramp("#55626c"), { spec: true });
      ov(band(0.38, 0.44), "#c9ced3", { flat: true });
      ov(band(0.66, 0.72), "#c9ced3", { flat: true });
      ov(band(0.04, 0.14), "#14161a", { flat: true });
      { const b = TP(0.74, 2.8); px.rect(b[0], b[1], 2, 2, "#e0c870"); }
      px.paint(ellM(TP(1.0, 0.6)[0], TP(1.0, 0.6)[1], 4.2 * s, 1.8 * s), ramp("#44505a"));
      break;
    case "exo":
      ov(band(0.42, 1.04), ramp("#c6783e"), { spec: true });
      ov(band(0.0, 0.42), ramp("#363b44"));
      for (let k = 0; k < 3; k++) ov(band(0.06 + k * 0.1, 0.1 + k * 0.1), "#1a1c22", { flat: true });
      ov(band(0.58, 0.63), "#6a3a1c", { flat: true });
      { const l = TP(0.74, 2.4); px.rect(l[0], l[1], 3, 3, L.accent || "#ffb23a"); }
      break;
    case "suit":
      // Деловой открытый пиджак в 3/4 + рубашка + красный галстук (Gold!)
      ov([[1.0, -0.2], [1.0, 3.2], [0.32, 2.6], [0.32, 0.2]], "#e6ecf2", { flat: true });
      { const t0 = TP(0.95, 1.6), t1 = TP(0.38, 1.6); px.line(t0[0], t0[1], t1[0], t1[1], L.top2 || "#b43632", 2); }
      ov(band(0.0, 0.1), darken(L.top, 0.45), { flat: true });
      break;
    case "armor":
      ov(band(0.36, 1.04), ramp("#48444e"), { spec: true });
      ov(band(0.56, 0.64), L.top2 || "#a83838", { flat: true });
      ov(band(0.0, 0.18), "#18161c", { flat: true });
      { const p = TP(0.8, 2.8); px.rect(p[0], p[1], 2, 2, L.accent || "#ff4848"); }
      break;
    case "raincoat":
      ov(band(0.05, 0.97, 1.0, 2.2), darken(L.top, 0.5), { flat: true });
      ov(band(0.34, 0.4), darken(L.top, 0.4), { flat: true });
      px.paint(ellM(TP(1.0, 0.6)[0], TP(1.0, 0.6)[1], 4.4 * s, 2.0 * s), ramp(L.top2 || L.top));
      break;
    case "street_hoodie":
      ov(band(0.06, 0.97), topR);
      ov([[0.96, -0.8], [0.96, 2.8], [0.16, 2.6], [0.16, -0.6]], top2R, { flat: true });
      ov(band(0.0, 0.12), darken(L.top, 0.4), { flat: true });
      px.paint(ellM(TP(1.0, 0.4)[0], TP(1.0, 0.4)[1], 4.5 * s, 2.1 * s), ramp(L.top2 || L.top));
      break;
    case "leather_jacket":
      ov(band(0.06, 0.98), topR, { spec: true });
      ov([[0.96, 0.0], [0.96, 2.8], [0.46, 1.8], [0.46, 0.4]], L.top2 || "#e4e0d8", { flat: true });
      px.line(TP(0.92, -1.6)[0], TP(0.92, -1.6)[1], TP(0.24, 1.6)[0], TP(0.24, 1.6)[1], "#9aa8b6", 1);
      ov(band(0.0, 0.13), "#181a22", { flat: true });
      { const b = TP(0.06, 1.5); px.rect(b[0] - 1.5, b[1] - 1, 3, 2, "#dce4f0"); }
      break;
    case "track_top":
      ov(band(0.06, 0.98), topR);
      ov(band(0.56, 0.70), L.top2 || "#e0a43a", { flat: true });
      ov(band(0.74, 0.80), L.accent || "#f4f6fa", { flat: true });
      ov([[0.96, 0.8], [0.96, 1.8], [0.06, 1.8], [0.06, 0.8]], "#181c24", { flat: true });
      ov(band(0.0, 0.11), "#1c2028", { flat: true });
      break;
    case "cyber_harness":
      ov(band(0.0, 0.15), "#1c1e26", { flat: true });
      px.line(TP(0.92, -bp.shoN * 0.7)[0], TP(0.92, -bp.shoN * 0.7)[1], TP(0.18, bp.hipL * 0.7)[0], TP(0.18, bp.hipL * 0.7)[1], L.top, 2);
      px.line(TP(0.92, bp.shoL * 0.7)[0], TP(0.92, bp.shoL * 0.7)[1], TP(0.18, -bp.hipN * 0.7)[0], TP(0.18, -bp.hipN * 0.7)[1], L.top, 2);
      { const c = TP(0.56, 0.8); px.rect(c[0] - 2, c[1] - 2, 4, 4, L.accent || "#6fe0e6"); }
      break;
    case "crop_hoodie":
      ov(band(0.46, 0.98), topR, { spec: true });
      ov([[0.96, 0.2], [0.96, 2.4], [0.46, 2.2], [0.46, 0.2]], top2R, { flat: true });
      ov(band(0.0, 0.19), ramp(L.pants));
      ov(band(0.13, 0.20), "#181a22", { flat: true });
      px.paint(ellM(TP(1.0, 0.4)[0], TP(1.0, 0.4)[1], 4.2 * s, 1.9 * s), ramp(L.top2 || L.top));
      break;
  }

  /* нано-куртка и скан-ошейник поверх торса */
  if (nano) {
    ov(band(0.82, 1.04), ramp("#4a6a78")[0]);
    ov(band(0.3, 0.34), "#6fd6d0", { flat: true });
    ov([[1, 0.4], [1, 1.6], [0.1, 1.6], [0.1, 0.4]], "#6fd6d0", { flat: true });
  }
  if (eq.neck === "scanner") {
    const n = TP(1.02, 0.6);
    px.paint(polyM([[n[0] - 3.4 * s, n[1] - 1], [n[0] + 3.4 * s, n[1] - 1], [n[0] + 3.4 * s, n[1] + 1.8], [n[0] - 3.4 * s, n[1] + 2]]), ramp("#4a4650"), { rim: false });
    const q = TP(0.84, 2.8);
    px.paint(ellM(q[0], q[1], 1.8, 1.8), ramp("#d9a23a"), { rim: false });
    px.dot(q[0], q[1], "#fff0b0");
  }

  /* полы плаща/пиджака */
  if (L.coat) {
    const sw = P.coatSwing;
    const coat = polyM([
      TP(0.3, -bp.waistN - 1.2),
      TP(0.3, bp.waistL + 1.0),
      TP(-0.44, bp.hipL + 1.2 + sw * 0.35),
      TP(-0.5, -bp.hipN - 1.6 + sw),
    ]);
    px.paint(coat, topR);
  }

  /* ===== РЕАЛИСТИЧНАЯ 16-БИТНАЯ ГОЛОВА И ЛИЦО В 3/4 (в духе Streets of Rage) ===== */
  const covered = L.head === "helmet" && !eq.head;
  const isFemHead = L.build === "slim_f";
  px.paint(capM(neck[0], neck[1] + 0.8, HP(0, 3.6)[0], HP(0, 3.6)[1], 2.1 * s, 1.9 * s), dSkin, { rim: false });
  const skull = ellM(hc[0], hc[1], m.headRx * (isFemHead ? 0.94 : 1.02), m.headRy * (isFemHead ? 0.96 : 1.0));
  const jaw = isFemHead
    ? polyM([HP(-3.3, 0.8), HP(3.8, 0.6), HP(3.2, 3.4), HP(1.2, 4.9), HP(-1.6, 4.2)])
    : polyM([HP(-3.8, 0.8), HP(4.1, 0.6), HP(3.6, 3.7), HP(1.5, 5.1), HP(-2.0, 4.4)]);
  const head = unionM(skull, jaw);
  px.paint(head, skinR);

  const hairDark = darken(L.hair || "#222", 0.34);
  if (!covered) {
    const ear = HP(-3.5, 0.8);
    px.dot(ear[0], ear[1], darken(L.skin, 0.25));

    // Серьёзный ретро-прищур в тени надбровных дуг (без комичных/больших глаз)
    const eN = HP(-0.2, 0.2), eL = HP(2.6, 0.2);
    if (P.eyes === 1) {
      px.line(eN[0] - 0.8, eN[1], eN[0] + 0.8, eN[1], "#16121a", 1);
      px.line(eL[0] - 0.6, eL[1], eL[0] + 0.8, eL[1], "#16121a", 1);
    } else {
      // Надбровная тень + чёткий взгляд
      px.line(eN[0] - 1.0, eN[1] - 0.9, eN[0] + 1.0, eN[1] - 0.6, darken(L.skin, 0.42), 1);
      px.line(eL[0] - 0.6, eL[1] - 0.6, eL[0] + 1.0, eL[1] - 0.9, darken(L.skin, 0.42), 1);
      px.dot(eN[0], eN[1], "#121018");
      px.dot(eL[0], eL[1], "#121018");
    }
    // Аккуратная тень носа и сжатых губ
    px.dot(HP(1.6, 1.5)[0], HP(1.6, 1.5)[1], darken(L.skin, 0.28));
    const m0 = HP(0.8, 3.1);
    if (P.mouth === 1 || P.mouth === 2) {
      px.line(m0[0], m0[1], m0[0] + 1.5, m0[1], "#441418", 1);
    } else {
      px.line(m0[0], m0[1], m0[0] + 1.4, m0[1], darken(L.skin, 0.36), 1);
    }
  }

  const gh = (x0: number, y0: number, rx: number, ry: number) => { const p = HP(x0, y0); return ellM(p[0], p[1], rx * s, ry * s); };
  const hp = (pts: number[][]) => polyM(pts.map((p) => HP(p[0], p[1])));
  const helmEq = eq.head === "helm", visEq = eq.head === "visor";

  switch (L.head) {
    case "spiky": {
      px.paint(hp([[-4.6, -0.5], [-4.8, -4.4], [-1.8, -6.5], [0.5, -5.0], [2.6, -6.4], [4.2, -3.2], [4.7, -1.2], [1.8, -2.4], [0.8, -1.2], [-0.5, -2.4], [-2.8, -1.0], [-4.0, 1.4]]), hairR, { spec: true });
      break;
    }
    case "headband": {
      px.paint(hp([[-4.6, -0.8], [-4.4, -4.6], [-0.6, -6.2], [3.2, -4.8], [4.6, -2.0], [1.2, -2.0], [0, -1.0], [-2.0, -2.0], [-3.8, 1.2]]), hairR, { spec: true });
      const hbCol = L.top2 || "#c84032";
      px.line(HP(-4.6, -2.4)[0], HP(-4.6, -2.4)[1], HP(4.4, -2.4)[0], HP(4.4, -2.4)[1], hbCol, 2);
      px.line(HP(-4.6, -2.4)[0], HP(-4.6, -2.4)[1], HP(-7.8, -0.6)[0], HP(-7.8, -0.6)[1], hbCol, 2);
      break;
    }
    case "shades_bald": {
      px.paint(hp([[-1.2, -1.2], [4.2, -1.0], [4.0, 0.8], [-0.8, 0.8]]), ramp("#141820"), { rim: false, shade: false });
      px.dot(HP(0.4, -0.2)[0], HP(0.4, -0.2)[1], "#90d4e8");
      px.dot(HP(2.8, -0.2)[0], HP(2.8, -0.2)[1], "#90d4e8");
      px.paint(hp([[0.2, 3.1], [3.2, 2.8], [2.8, 4.4], [1.2, 4.9], [-0.6, 4.1]]), ramp("#241812"), { rim: false, shade: false });
      break;
    }
    case "shades_spiky": {
      px.paint(hp([[-4.6, -0.8], [-4.2, -4.8], [-0.5, -6.4], [3.5, -4.6], [4.6, -1.8], [1.6, -2.4], [-0.5, -1.6], [-3.2, -1.2]]), hairR, { spec: true });
      px.paint(hp([[-1.2, -1.0], [4.2, -0.8], [4.0, 0.8], [-0.8, 0.8]]), ramp("#141820"), { rim: false, shade: false });
      px.dot(HP(0.4, -0.2)[0], HP(0.4, -0.2)[1], "#6fe0e6");
      px.dot(HP(2.8, -0.2)[0], HP(2.8, -0.2)[1], "#6fe0e6");
      break;
    }
    case "mohawk": {
      px.paint(hp([[-2.2, -2.2], [-2.8, -6.8], [-0.8, -7.8], [0.8, -6.2], [2.4, -7.2], [3.4, -3.6], [1.4, -2.6]]), hairR, { spec: true });
      break;
    }
    case "blaze_hair":
    case "ponytail":
    case "wavy": {
      px.paint(hp([[-4.8, 0.8], [-4.6, -4.0], [-1.6, -6.2], [2.0, -5.8], [4.5, -3.4], [4.4, -1.4], [1.8, -2.2], [-1.4, -1.6], [-3.8, 2.6]]), hairR, { spec: true });
      px.dot(HP(-3.2, 1.8)[0], HP(-3.2, 1.8)[1], "#f2c848");
      break;
    }
    case "beret": {
      px.paint(hp([[-4.6, -1.6], [-3.8, -5.2], [1.4, -5.6], [4.5, -2.2], [-1.2, -2.4]]), ramp(L.top));
      px.paint(hp([[0.2, -2.6], [5.8, -1.8], [5.4, -0.8], [0.2, -1.4]]), ramp(darken(L.top, 0.3)), { rim: false });
      break;
    }
    case "tiger_mane": {
      px.paint(hp([[-5.0, -0.4], [-4.8, -5.0], [-1.4, -6.8], [1.8, -5.4], [4.2, -3.6], [1.2, -2.6], [-3.0, -1.8]]), hairR, { spec: true });
      break;
    }
    case "hood": {
      const hood = subM(gh(-0.6, -0.6, 5.4, 5.6), gh(2.0, 0.8, 3.2, 3.6));
      px.paint(hood, ramp(L.top));
      break;
    }
    case "cap":
    case "cap_f": {
      px.paint(hp([[-4.4, -1.0], [-3.8, -4.6], [0, -5.8], [3.8, -4.6], [4.4, -1.6], [-0.8, -1.8]]), ramp("#3a4a52"));
      px.paint(hp([[0.8, -2.2], [6.4, -1.4], [6.0, -0.6], [0.8, -1.2]]), ramp("#222a30"), { rim: false });
      px.rect(HP(1.0, -4.2)[0], HP(1.0, -4.2)[1], 1.5, 1.5, "#e0c870");
      break;
    }
    case "hardhat": {
      px.paint(hp([[-4.8, -0.8], [-3.8, -4.8], [0, -6.2], [4.0, -4.8], [4.8, -1.0], [5.6, 0], [-0.8, 0]]), ramp("#c97a40"), { spec: true });
      px.paint(hp([[0.2, -1.2], [4.6, -1.0], [4.4, 0.8], [0.4, 1.0]]), ramp("#181a20"), { rim: false, shade: false });
      px.dot(HP(2.2, -0.2)[0], HP(2.2, -0.2)[1], "#ffb23a");
      break;
    }
    case "slick": {
      px.paint(hp([[-4.4, -0.6], [-3.8, -4.4], [0, -5.6], [3.8, -4.4], [4.4, -1.4], [1.4, -2.2], [-2.0, -1.4], [-3.6, 1.2]]), hairR, { spec: true });
      px.paint(hp([[-1.0, -1.0], [4.2, -0.8], [4.0, 0.8], [-0.8, 0.6]]), ramp("#1a202a"), { rim: false, shade: false });
      px.dot(HP(0.4, -0.2)[0], HP(0.4, -0.2)[1], "#9ee8f0");
      px.dot(HP(2.8, -0.2)[0], HP(2.8, -0.2)[1], "#9ee8f0");
      break;
    }
    case "helmet": {
      if (!eq.head) {
        px.paint(unionM(gh(0, -0.2, 5.4, 5.4), hp([[-4.6, 1.0], [4.6, 1.6], [4.0, 4.8], [0, 5.2], [-4.0, 4.0]])), ramp("#3c3944"), { spec: true });
        px.paint(hp([[0.2, -1.4], [5.0, -1.0], [4.8, 1.0], [0.4, 1.0]]), ramp("#18161c"), { rim: false, shade: false });
        const vs = HP(1.4, -0.4);
        px.rect(vs[0], vs[1], 3.5, 1.0, "#ff4a4a");
      }
      break;
    }
    case "pompadour": {
      px.paint(hp([[-4.6, 0.2], [-4.4, -4.2], [-1.0, -6.8], [4.2, -7.2], [6.4, -4.6], [4.8, -2.0], [0.6, -2.2], [-3.2, -0.8]]), hairR, { spec: true });
      break;
    }
    case "dreads": {
      px.paint(hp([[-4.8, 0.8], [-4.6, -4.2], [-0.8, -6.2], [3.6, -4.8], [4.6, -1.8], [1.4, -2.2], [-2.2, -1.2], [-4.2, 2.6]]), hairR, { spec: true });
      px.line(HP(-3.6, -2.0)[0], HP(-3.6, -2.0)[1], HP(-5.4, 3.6)[0], HP(-5.4, 3.6)[1], darken(L.hair || "#222", 0.35), 1);
      px.line(HP(-2.0, -3.0)[0], HP(-2.0, -3.0)[1], HP(-4.2, 3.8)[0], HP(-4.2, 3.8)[1], darken(L.hair || "#222", 0.35), 1);
      break;
    }
    case "bob": {
      px.paint(hp([[-4.8, 1.4], [-4.6, -4.2], [-0.8, -6.0], [3.6, -4.4], [4.6, -1.2], [2.4, -1.8], [-1.0, -1.4], [-3.4, 3.2]]), hairR, { spec: true });
      break;
    }
    case "sidecut": {
      px.paint(hp([[-4.4, -1.0], [-4.0, -4.6], [0, -6.2], [4.4, -4.6], [5.4, -1.4], [2.2, -2.0], [-1.2, -2.6]]), hairR, { spec: true });
      px.dot(HP(-2.8, -0.8)[0], HP(-2.8, -0.8)[1], darken(L.skin, 0.16));
      break;
    }
    case "bandana": {
      const bR = ramp(L.top2 || L.top);
      px.paint(hp([[-4.6, -1.2], [-4.2, -4.8], [0, -5.8], [3.8, -4.6], [4.4, -2.0], [-1.2, -2.2]]), bR, { spec: true });
      px.line(HP(-4.6, -2.0)[0], HP(-4.6, -2.0)[1], HP(-8.0, 0.2)[0], HP(-8.0, 0.2)[1], L.top2 || L.top, 2);
      break;
    }
    case "fade": {
      px.paint(hp([[-4.2, -1.0], [-4.2, -5.2], [3.6, -5.2], [4.2, -2.2], [1.2, -2.2], [-2.2, -1.6]]), hairR, { spec: true });
      break;
    }
    case "twintails": {
      px.paint(hp([[-4.6, 0.2], [-4.4, -4.2], [-0.8, -6.0], [3.2, -4.8], [4.4, -1.8], [1.6, -2.2], [-1.8, -1.6], [-3.6, 1.8]]), hairR, { spec: true });
      px.dot(HP(-3.6, -2.2)[0], HP(-3.6, -2.2)[1], L.accent || "#e8c25a");
      px.dot(HP(2.8, -2.8)[0], HP(2.8, -2.8)[1], L.accent || "#e8c25a");
      break;
    }
  }

  if (helmEq) {
    px.paint(hp([[-5.0, -0.4], [-4.6, -4.8], [0, -6.2], [4.4, -4.8], [4.8, -0.6], [1.6, -1.4], [-1.8, -0.8]]), ramp("#566a5a"), { spec: true });
    px.rect(HP(3.2, -1.8)[0], HP(3.2, -1.8)[1], 1.5, 1.5, "#e0a43a");
  }
  if (visEq) {
    px.paint(hp([[-4.0, -1.4], [4.4, -1.2], [4.6, 0.8], [-3.8, 0.4]]), ramp("#20262e"), { rim: false, shade: false });
    px.line(HP(-0.6, -0.4)[0], HP(-0.6, -0.4)[1], HP(4.4, -0.3)[0], HP(4.4, -0.3)[1], "#7fe7ee", 1);
  }
  void hairDark;

  /* ===== БЛИЖНЯЯ РУКА (поверх бокового края груди — ключевой 3/4 объём!) ===== */
  const nearArm = drawArm("near");

  /* ===== ОРУЖИЕ (в активной руке: передней, либо при комбо-2 в ближней) ===== */
  const wArm = P.smear === 2 && !wp ? nearArm : leadArm;
  const hd = wArm.hand;
  const WD = [Math.sin(rd(wArm.ang)), Math.cos(rd(wArm.ang))];
  const wend = (len: number) => [hd[0] + WD[0] * len * s, hd[1] + WD[1] * len * s];

  if (wp === "crowbar") {
    const e = wend(22), b = wend(-4);
    px.paint(capM(b[0], b[1], e[0], e[1], 1.5, 1.3), METAL, { rim: false, spec: true });
    px.paint(capM(b[0], b[1], wend(3)[0], wend(3)[1], 1.8, 1.8), ramp("#3a3640"), { rim: false });
    const hk = wend(19);
    px.line(hk[0], hk[1], hk[0] + WD[1] * 3, hk[1] - WD[0] * 3, "#6a7480", 2);
    px.dot(e[0], e[1], "#6fe0e6");
  } else if (wp === "baton") {
    const e = wend(19), b = wend(-4);
    px.paint(capM(b[0], b[1], e[0], e[1], 1.35, 1.15), ramp("#2a2c34"), { rim: false });
    px.dot(e[0], e[1], "#ffd070");
  } else if (wp === "pistol" || wp === "smg" || wp === "rifle") {
    const len = wp === "pistol" ? 8 : wp === "smg" ? 12 : 18, th2 = wp === "rifle" ? 1.8 : 1.5;
    const b = wend(-3), e = wend(len);
    px.paint(capM(b[0], b[1], e[0], e[1], th2, th2), ramp(wp === "rifle" ? "#34323c" : "#3a3e46"), { rim: false });
    px.line(b[0] + WD[0] * 2, b[1] + WD[1] * 2 - 1, e[0], e[1] - 1, "#8a94a0", 1);
    px.paint(capM(hd[0], hd[1], hd[0] - 1, hd[1] + 4.2, 1.3, 1.3), ramp("#22242a"), { rim: false });
    if (wp !== "pistol") {
      const mg = wend(wp === "rifle" ? 7 : 5);
      px.paint(capM(mg[0], mg[1], mg[0] - 0.5, mg[1] + 5.2, 1.25, 1.25), ramp("#22242a"), { rim: false });
    }
    if (wp === "rifle") {
      const st = wend(-8);
      px.paint(capM(b[0], b[1], st[0], st[1], 1.9, 1.9), ramp("#4a3a30"), { rim: false });
    }
    if (P.flash) {
      const f = wend(len + 3);
      px.paint(polyM([[f[0], f[1] - 5], [f[0] + 9, f[1]], [f[0], f[1] + 5], [f[0] + 2, f[1]]]), ["#fff8d8", "#ffd878", "#e8843a", "#b03a2a"], { rim: false, shade: false });
      px.dot(f[0] + 2, f[1], "#ffffff");
    }
  } else if (wp === "whip") {
    px.paint(capM(hd[0] - 1, hd[1] - 1, hd[0] + 2, hd[1] + 3, 1.7, 1.7), ramp("#2a2630"), { rim: false });
    const tabs: number[][][] = [
      [[0, 3], [1, 8], [0, 13], [-2, 17]],
      [[-4, -4], [-10, -10], [-18, -13], [-26, -11], [-33, -7]],
      [[10, -1], [21, -2], [32, 0], [42, 2], [51, 4]],
      [[11, 2], [23, 3], [35, 5], [47, 7], [56, 8]],
      [[8, 4], [15, 10], [19, 17], [16, 23]],
      [[3, 4], [5, 10], [4, 15], [1, 19]],
    ];
    const pts = tabs[Math.min(tabs.length - 1, P.whip)];
    let px0 = hd[0], py0 = hd[1];
    for (const p of pts) {
      px.line(px0, py0, hd[0] + p[0], hd[1] + p[1], "#9fe8e2", 1);
      px.dot(hd[0] + p[0], hd[1] + p[1] + 1, "#3a8a8a");
      px0 = hd[0] + p[0]; py0 = hd[1] + p[1];
    }
    px.dot(px0, py0, "#ffffff");
  } else if (wp === "case") {
    const c = [hd[0] - 1, hd[1] + 5];
    px.line(hd[0], hd[1], c[0], c[1] - 2, "#2a2420", 1);
    px.paint(rectM(c[0] - 5, c[1] - 1, 10, 7), ramp("#7a5a38"));
    px.rect(c[0] - 1, c[1] + 1, 2, 2, "#d9b44c");
  } else if (wp === "umbrella") {
    const top = [hd[0] + 2, hd[1] - 18];
    px.line(hd[0], hd[1] + 1, top[0], top[1], "#2a2a30", 1);
    px.paint(
      polyM([
        [top[0] - 13, top[1] + 5], [top[0] - 9, top[1] - 1], [top[0], top[1] - 4], [top[0] + 9, top[1] - 1],
        [top[0] + 13, top[1] + 5], [top[0] + 6, top[1] + 3], [top[0], top[1] + 5], [top[0] - 6, top[1] + 3],
      ]),
      ramp(L.top2!)
    );
  }
  return hipY;
}

/* ----------------------- поворот (для нокдауна) ----------------------- */
function rotatePx(src: Px, hx: number, hy: number, ang: number, ox: number, oy: number): Px {
  const out = new Px(src.w, src.h), c = Math.cos(ang), s = Math.sin(ang);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const dx = x + 0.5 - ox, dy = y + 0.5 - oy;
      const sx = Math.floor(hx + dx * c + dy * s), sy = Math.floor(hy - dx * s + dy * c);
      if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
      const i = (sy * src.w + sx) * 4, j = (y * out.w + x) * 4;
      if (src.d[i + 3]) {
        out.d[j] = src.d[i]; out.d[j + 1] = src.d[i + 1]; out.d[j + 2] = src.d[i + 2]; out.d[j + 3] = 255;
      }
    }
  return out;
}

/* ---------------------- кэш готовых спрайтов ---------------------- */
const cache: Record<string, HTMLCanvasElement> = {};
export function getSprite(
  look: string,
  pose: string,
  fr: number,
  eq: Eq | null | undefined,
  face: number,
  tint: boolean,
  combo = 0
): HTMLCanvasElement {
  const e = eq || {};
  const cm = pose === "attack" ? combo & 1 : 0;
  const key = `${look}|${pose}${fr}_${cm}|${e.head || ""}.${e.weapon || ""}.${e.neck || ""}.${e.body || ""}|${face}${tint ? "w" : ""}`;
  let c = cache[key];
  if (c) return c;
  if (tint) {
    const b = getSprite(look, pose, fr, eq, face, false, combo);
    c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const g = c.getContext("2d")!;
    g.drawImage(b, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(255,244,230,.78)";
    g.fillRect(0, 0, SW, SH);
    return (cache[key] = c);
  }
  if (face < 0) {
    const b = getSprite(look, pose, fr, eq, 1, false, combo);
    c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const g = c.getContext("2d")!;
    g.translate(SW, 0); g.scale(-1, 1); g.drawImage(b, 0, 0);
    return (cache[key] = c);
  }
  const L = LOOKS[look] || LOOKS.rat_m0;
  const wp = e.weapon || L.defW || null;
  const opt = {
    ranged: wp === "smg" || wp === "pistol" || wp === "rifle",
    whip: wp === "whip",
    civ: look.startsWith("civ_"),
    female: L.gender === "f",
    combo: cm,
  };
  let px = new Px(SW, SH);
  const P = getPose(pose, fr, opt);
  if (pose === "down" && P.bodyAng !== 0) {
    const tmp = new Px(SW, SH);
    const hipY = drawChar(tmp, L, P, e);
    const yLift = fr === 0 ? -12 : fr === 1 ? -6 : fr === 2 ? -2 : 0;
    px = rotatePx(tmp, OX, hipY, (P.bodyAng * Math.PI) / 180, OX, OY - 10 + yLift);
  } else {
    drawChar(px, L, P, e);
  }
  px.outline("#080b10");
  return (cache[key] = px.toCanvas());
}
void mix;
