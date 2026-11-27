/* Размеры: логика игры живёт в «480×270», картинка рисуется в 640×360
   (коэффициент K = 4/3), поэтому спрайты остаются чёткими, а баланс — прежним. */
export const W = 640, H = 360, K = 4 / 3;
export const LW = 480, LH = 270;
export const CH = 261, CHPX = 348; // ширина чанка улицы (логика / пиксели)
export const DL = "¥";

export const BAL = {
  START_CASH: 50, START_REP: 4, BASE_LIMIT: 2,
  SPIN_BASE: 15, SPIN_STEP: 3, SPIN_EVERY: 3,
  LOOT_TIME: 2.5,
  LOOT: { mart: [15, 30], netcafe: [20, 35], charge: [25, 45] } as Record<string, number[]>,
  ENEMY_LOOT: [3, 8], OBJ_LOOT: [5, 15], SHOP_REP: [2, 4],
  PX_PER_M: 14, MARCH: 38, GRACE: 60,
  UPG: [100, 250, 550],
  MARKET: 30, MARKET_STEP: 8, MED: 25, STIM: 30, INV: 6,
  ARREST_KEEP: [0.3, 0.5, 0.7, 0.9],
  LAUNDER: { dist: 0.5, loot: 0.25, kill: 2 },
  PAWN_LOOT: [0, 0.15, 0.3, 0.5], PAWN_CASH: [0, 25, 50, 100],
  NOODLE_RARE: [0, 0.1, 0.2, 0.3], NOODLE_REP: [0, 1, 2, 3],
  CLINIC_POWER: [1, 1.3, 1.6, 2.0],
  STEP: 1 / 60,
};
