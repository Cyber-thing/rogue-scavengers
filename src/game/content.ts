/* ======================================================================
   КОНТЕНТ: лор, классы, враги, предметы, бизнесы.
   Сеттинг — приглушённый киберпанк 90-х из мира GMS-9000:
   банда Scavenger Kingdom против корпораций Intercell, Slayer, Agogee,
   Fusion, Takamuri и системы безопасности WARDEN.
   ====================================================================== */
import { BAL, DL } from "./consts";

export interface ClassDef {
  name: string; tag: string; cost: number; hp: number; dmg: number; spd: number; rate: number; armor: number; crit: number;
  range: number; knock: number; loot: number; dodge: number; ranged: boolean; chain: boolean; needClinic?: number; desc: string; lore: string;
}
export const CLASSES: Record<string, ClassDef> = {
  rat: { name: "Крыса", tag: "ВСКРЫТИЕ", cost: 2, hp: 70, dmg: 9, spd: 62, rate: 2.2, armor: 0.05, crit: 0.08, range: 20, knock: 70, loot: 1.6, dodge: 0.12, ranged: false, chain: false,
    desc: "Быстрый кулачный боец с кибер-кистью. Вскрывает точки в 1.6× быстрее.", lore: "Знает каждую подворотню Scavenger Kingdom. Если замок есть — значит, он уже открыт." },
  hulk: { name: "Громила", tag: "ТАНК", cost: 4, hp: 170, dmg: 22, spd: 40, rate: 0.8, armor: 0.2, crit: 0.1, range: 26, knock: 240, loot: 1, dodge: 0.03, ranged: false, chain: false,
    desc: "Гидравлическая рука и много HP. Медленный, но удар отбрасывает на полквартала.", lore: "Бывший грузчик Fusion. Руку ему «одолжил» пресс-конвейер, а вернуть забыли." },
  runner: { name: "Раннер", tag: "СТРЕЛОК", cost: 3, hp: 55, dmg: 8, spd: 84, rate: 1.6, armor: 0, crit: 0.15, range: 120, knock: 25, loot: 1, dodge: 0.25, ranged: true, chain: false,
    desc: "Курьер с монокль-прицелом и пистолетом. Стреляет издалека, хрупкий, но очень мобильный.", lore: "Таскал данные по ночным линиям. Теперь таскает пули — по той же ставке." },
  cutter: { name: "Резак", tag: "ЦЕПЬ ×3", cost: 5, hp: 110, dmg: 14, spd: 55, rate: 1.2, armor: 0.1, crit: 0.12, range: 34, knock: 110, loot: 1, dodge: 0.08, ranged: false, chain: true, needClinic: 1,
    desc: "Монофиламентный хлыст бьёт сразу по 3 целям. Нужна клиника рипера Lv.1.", lore: "Порты в предплечье, нить в рукояти. Режет кабели, замки и контракты." },
};

export interface EnemyDef {
  name: string; corp: string; hp: number; dmg: number; spd: number; rate: number; range: number; armor: number; crit: number; knock: number; kres: number;
  ranged: boolean; loot: number[]; xp: number;
}
export const ENEMIES: Record<string, EnemyDef> = {
  guard: { name: "Охранник Agogee", corp: "Agogee Heights", hp: 40, dmg: 6, spd: 55, rate: 1.1, range: 18, armor: 0, crit: 0.05, knock: 30, kres: 0, ranged: false, loot: BAL.ENEMY_LOOT, xp: 10 },
  exo: { name: "Экзо Fusion", corp: "Fusion Cybernetics", hp: 150, dmg: 16, spd: 32, rate: 0.7, range: 24, armor: 0.15, crit: 0.05, knock: 120, kres: 0.6, ranged: false, loot: [5, 8], xp: 25 },
  agent: { name: "Агент Intercell", corp: "Intercell Synthetics", hp: 85, dmg: 11, spd: 58, rate: 1, range: 26, armor: 0.05, crit: 0.05, knock: 50, kres: 0.2, ranged: false, loot: [4, 8], xp: 18 },
  trooper: { name: "Штурмовик Slayer", corp: "Slayer Incorporated", hp: 220, dmg: 14, spd: 48, rate: 0.9, range: 150, armor: 0.3, crit: 0.08, knock: 40, kres: 0.7, ranged: true, loot: [6, 8], xp: 40 },
};

export const SLOTS = ["head", "weapon", "neck", "body"] as const;
export const SLOTNAME: Record<string, string> = { head: "ГОЛОВА", weapon: "ОРУЖИЕ", neck: "ШЕЯ", body: "ТЕЛО" };
export interface ItemDef { name: string; slot: (typeof SLOTS)[number]; v: number[]; regen?: number[]; lore: string }
export const ITEMS: Record<string, ItemDef> = {
  helm: { name: "Баллистический шлем", slot: "head", v: [0.25, 0.33, 0.42], lore: "Кевлар, сетка и крепление под ПНВ. Снят с охранника." },
  visor: { name: "Рефлекс-визор", slot: "head", v: [0.3, 0.4, 0.5], lore: "Разогнанный курьерский визор. Мир замедляется — ты нет." },
  crowbar: { name: "Шоковая монтировка", slot: "weapon", v: [12, 20, 30], lore: "Арматура с катушкой от дверного замка Intercell." },
  smg: { name: "ПП «Шершень»", slot: "weapon", v: [18, 28, 40], lore: "Компактный пистолет-пулемёт. Дёшево, громко, злобно." },
  scanner: { name: "Скан-ошейник", slot: "neck", v: [0.5, 0.75, 1], lore: "Чует кредитные чипы и тайники за три метра." },
  nano: { name: "Нано-куртка", slot: "body", v: [45, 70, 100], regen: [1.5, 2.5, 4], lore: "Самозатягивающиеся швы. Корпоративный брак, наш актив." },
};
export const ITEM_IDS = Object.keys(ITEMS);
export function itemDesc(id: string, lv: number) {
  const v = ITEMS[id].v[lv - 1], p = Math.round(v * 100);
  switch (id) {
    case "helm": return "+" + p + "% брони";
    case "visor": return "+" + p + "% скорости";
    case "crowbar": return "+" + v + " урона";
    case "smg": return "+" + v + " урона, дальняя атака";
    case "scanner": return "+" + p + "% добычи";
    case "nano": return "+" + v + " Max HP, реген " + ITEMS.nano.regen![lv - 1] + "/с";
  }
  return "";
}

export const SYMS = ["chip", "ice", "seven", "credit", "stim", "shock"] as const;
export const SYM_W = [22, 12, 10, 14, 22, 20];
export const SYMNAME = ["Чип", "ICE-карта", "Семёрка", "Кредит", "Стим", "Монтировка"];

export interface BizDef { name: string; sign: string; blurb: string; eff: (l: number) => string }
export const BIZ: Record<string, BizDef> = {
  laundry: { name: "Обнал-контора", sign: "CASH", blurb: "Прачечная кредитов Scavenger Kingdom.",
    eff: (l) => "Лимит банды: " + (BAL.BASE_LIMIT + l) + " · при задержании сохраняется " + Math.round(BAL.ARREST_KEEP[l] * 100) + "% добычи" },
  clinic: { name: "Клиника рипера", sign: "RIPPER", blurb: "Подпольные импланты и стимуляторы.",
    eff: (l) => (l >= 1 ? "Резак доступен" : "Резак закрыт") + " · расходники ×" + BAL.CLINIC_POWER[l] },
  pawn: { name: "Скупка «Хлам»", sign: "ХЛАМ", blurb: "Скупка краденого и гараж на задворках.",
    eff: (l) => "Награда за грабёж +" + Math.round(BAL.PAWN_LOOT[l] * 100) + "% · старт " + DL + (BAL.START_CASH + BAL.PAWN_CASH[l]) },
  noodle: { name: "Лапшичная «Мао»", sign: "ЛАПША", blurb: "Здесь сплетничают все — от курьеров до клерков.",
    eff: (l) => "Редкие предметы +" + Math.round(BAL.NOODLE_RARE[l] * 100) + "% · старт REP " + (BAL.START_REP + BAL.NOODLE_REP[l]) },
};

export const NAMES = ["Крот", "Шов", "Зубило", "Бес", "Ржавый", "Тень", "Искра", "Гвоздь", "Проводок", "Жук", "Ворон", "Нуль", "Баг", "Тихий", "Сквоз", "Лом"];
export const PANIC_SHOUTS = ["СБ!", "БЕГИТЕ!", "А-А-А!", "ОХРАНА!", "ВЫЗОВИТЕ WARDEN!", "МОЯ СУМКА!", "СКАВЕНДЖЕРЫ!", "ПРОЧЬ!"];
export const WARDEN_NAMES = ["", "", "Служба безопасности в районе", "Корпоративный дозор", "Штурмовые отряды Slayer", "Полная блокировка"];

export const LORE = {
  title: "ROGUE SCAVENGERS",
  sub: "ROGUELITE О БАНДЕ SCAVENGER KINGDOM",
  intro: "Корпорации держат город на сетевом поводке. Ты — банда скавенджеров: грабишь точки Agogee, Fusion и Intercell, пока WARDEN не закрыл квартал.",
};
