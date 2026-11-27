/* Иконки предметов, символы автомата, бизнесы, уличные пропсы (включая ховер-спиннеры). */
import { Px, ramp, polyM, ellM, capM, rectM, unionM, darken, lighten } from "./px";
import { mkCanvas } from "../util";

/* ------------------------------ ИКОНКИ 24×24 ------------------------------ */
function icon(fn: (p: Px) => void): HTMLCanvasElement {
  const p = new Px(24, 24);
  fn(p);
  p.outline("#0a0d12");
  return p.toCanvas();
}
const ICONS: Record<string, (p: Px) => void> = {
  helm: (p) => {
    p.paint(polyM([[3, 15], [3, 10], [6, 5], [12, 3], [18, 5], [21, 10], [21, 15], [17, 13], [7, 13]]), ramp("#566a5a"));
    p.paint(polyM([[5, 14], [19, 14], [19, 18], [14, 20], [10, 20], [5, 18]]), ramp("#3a4a40"));
    p.rect(11, 2, 4, 2, "#2a2e34"); p.rect(13, 0, 2, 3, "#6a7280");
    for (let i = 0; i < 5; i++) p.dot(6 + i * 3, 8 + (i & 1), "#2f3d33");
    p.dot(19, 10, "#e0a43a");
    p.rect(8, 15, 9, 2, "#14181c"); p.rect(9, 15, 7, 1, "#6fe0e6");
  },
  visor: (p) => {
    p.paint(polyM([[2, 8], [22, 8], [23, 14], [3, 15]]), ramp("#232a32"));
    p.rect(4, 10, 17, 2, "#6fe0e6"); p.rect(5, 10, 6, 1, "#e8ffff");
    p.paint(ellM(4, 11, 3, 4), ramp("#3a4048"));
    p.dot(4, 11, "#6fe0e6");
    p.rect(2, 15, 20, 1, "#6fe0e644");
  },
  crowbar: (p) => {
    p.paint(capM(5, 19, 17, 6, 2.4, 2.2), ramp("#8f9eac"));
    p.paint(capM(3, 21, 8, 16, 2.8, 2.8), ramp("#3a3640"));
    p.paint(capM(17, 6, 21, 8, 1.8, 1.6), ramp("#8f9eac"));
    p.dot(21, 8, "#6fe0e6"); p.dot(20, 4, "#6fe0e6"); p.dot(22, 5, "#e8ffff"); p.dot(18, 3, "#6fe0e688");
  },
  smg: (p) => {
    p.paint(polyM([[2, 8], [18, 8], [20, 10], [20, 13], [2, 13]]), ramp("#3a3e46"));
    p.rect(19, 9, 4, 2, "#6a7280");
    p.paint(polyM([[5, 13], [9, 13], [8, 21], [5, 21]]), ramp("#24262c"));
    p.paint(polyM([[11, 13], [14, 13], [13, 18], [10, 18]]), ramp("#24262c"));
    p.rect(3, 9, 15, 1, "#8a94a0"); p.dot(17, 10, "#e0a43a");
    p.paint(rectM(0, 8, 3, 4), ramp("#4a3a30"));
  },
  scanner: (p) => {
    p.paint(unionM(ellM(12, 9, 9, 5)), ramp("#4a4650"));
    p.paint(ellM(12, 10, 6, 3), ramp("#2a2830"), { flat: true });
    p.paint(ellM(12, 17, 4, 4), ramp("#d9a23a"));
    p.dot(12, 17, "#fff0b0"); p.dot(11, 16, "#fff0b0");
    p.dot(12, 13, "#e0a43a"); p.dot(12, 14, "#e0a43a");
  },
  nano: (p) => {
    p.paint(polyM([[7, 3], [17, 3], [22, 8], [20, 20], [4, 20], [2, 8]]), ramp("#3e5a66"));
    p.paint(polyM([[2, 8], [7, 3], [7, 9], [4, 20]]), ramp("#4e6c7a"));
    p.rect(11, 3, 2, 17, "#6fd6d0"); p.rect(5, 12, 5, 1, "#6fd6d0"); p.rect(14, 12, 5, 1, "#6fd6d0");
    p.paint(ellM(12, 4, 4, 2), ramp("#4a6a78"), { rim: false });
  },
  chip: (p) => {
    p.paint(rectM(5, 5, 14, 14), ramp("#2f4a3c"));
    for (let i = 0; i < 5; i++) { p.rect(3, 6 + i * 3, 2, 2, "#d9b44c"); p.rect(19, 6 + i * 3, 2, 2, "#d9b44c"); p.rect(6 + i * 3, 3, 2, 2, "#d9b44c"); p.rect(6 + i * 3, 19, 2, 2, "#d9b44c"); }
    p.paint(rectM(8, 8, 8, 8), ramp("#1c2420"));
    p.rect(9, 9, 6, 1, "#6fe0b0"); p.rect(9, 12, 4, 1, "#6fe0b0"); p.dot(14, 14, "#e0a43a");
  },
  ice: (p) => {
    p.paint(rectM(2, 4, 20, 16), ramp("#1c2a36"));
    p.rect(3, 5, 18, 1, "#4a7a8a");
    p.paint(polyM([[12, 7], [15, 12], [12, 17], [9, 12]]), ramp("#7fe7ee"));
    p.line(12, 6, 12, 18, "#e8ffff", 1); p.line(7, 12, 17, 12, "#bff4f8", 1);
    p.rect(4, 16, 4, 2, "#d9b44c");
  },
  seven: (p) => {
    p.paint(polyM([[4, 3], [20, 3], [20, 7], [14, 21], [9, 21], [14, 8], [4, 8]]), ramp("#c0463a"));
    p.rect(5, 4, 14, 1, "#f0a08a");
  },
  credit: (p) => {
    p.paint(ellM(12, 12, 9.5, 9.5), ramp("#e0b440"));
    p.paint(ellM(12, 12, 7, 7), ramp("#c58a2b"), { rim: false });
    p.line(8, 7, 12, 12, "#3a2208", 2); p.line(16, 7, 12, 12, "#3a2208", 2); p.line(12, 12, 12, 18, "#3a2208", 2);
    p.rect(9, 13, 7, 1, "#3a2208"); p.rect(9, 15, 7, 1, "#3a2208");
  },
  stim: (p) => {
    p.paint(capM(7, 17, 16, 8, 3.2, 3.2), ramp("#a8c8d0"));
    p.paint(capM(9, 15, 14, 10, 2.2, 2.2), ramp("#3ac8a8"), { rim: false });
    p.paint(capM(16, 8, 19, 5, 1.6, 1.6), ramp("#6a7280"));
    p.line(19, 5, 22, 2, "#d8e0e8", 1);
    p.paint(capM(3, 21, 7, 17, 1, 1), ramp("#6a7280"));
    p.rect(15, 11, 4, 2, "#e0a43a");
  },
};
ICONS.shock = ICONS.crowbar;
const iconCache: Record<string, HTMLCanvasElement> = {};
export const iconCanvas = (id: string) => iconCache[id] || (iconCache[id] = icon(ICONS[id]));
const urlCache: Record<string, string> = {};
export const iconURL = (id: string) => urlCache[id] || (urlCache[id] = iconCanvas(id).toDataURL());

/* ------------------------------ БИЗНЕСЫ ------------------------------ */
const bizCache: Record<string, string> = {};
export function bizIcon(id: string, sign: string): string {
  if (bizCache[id]) return bizCache[id];
  const c = mkCanvas(96, 64), g = c.getContext("2d")!;
  const R = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const cfg: Record<string, string[]> = {
    laundry: ["#35505e", "#6fb0c0", "#1c2c38"], clinic: ["#3e4a44", "#7fe0b0", "#1c2622"],
    pawn: ["#5a3a2e", "#e0a43a", "#2a1a14"], noodle: ["#5a2e3a", "#e0788a", "#2a121c"],
  };
  const [wall, glow, dark] = cfg[id];
  R(0, 0, 96, 64, "#10161e");
  for (let y = 0; y < 30; y += 3) R(0, y, 96, 1, "#141c26");
  R(4, 6, 88, 58, wall); R(4, 6, 88, 4, dark);
  for (let y = 12; y < 58; y += 6) R(4, y, 88, 1, "#00000030");
  R(14, 10, 68, 17, "#0a0d12"); R(15, 11, 66, 15, dark);
  g.fillStyle = glow; g.font = '8px "Press Start 2P", monospace'; g.textBaseline = "top"; g.textAlign = "center";
  g.shadowColor = glow; g.shadowBlur = 6; g.fillText(sign, 48, 15); g.shadowBlur = 0;
  R(8, 30, 80, 4, dark);
  for (let x = 8; x < 88; x += 8) R(x, 30, 4, 4, glow + "aa");
  R(8, 38, 30, 20, "#0a0d12"); R(9, 39, 28, 18, glow + "55"); R(58, 38, 30, 20, "#0a0d12"); R(59, 39, 28, 18, glow + "55");
  R(41, 36, 14, 28, "#0a0d12"); R(42, 37, 12, 27, "#2a2e36"); R(50, 48, 2, 4, glow);
  for (let i = 0; i < 4; i++) { R(12 + i * 6, 46, 4, 10, darken(glow, 0.35)); R(63 + i * 6, 44 + (i & 1) * 3, 4, 12 - (i & 1) * 3, darken(glow, 0.5)); }
  R(0, 60, 96, 4, "#0a0d12");
  return (bizCache[id] = c.toDataURL());
}

/* --------------------------- УЛИЧНЫЕ ПРОПСЫ --------------------------- */
export const CARS = [["#6e3040", "#8e4a5a"], ["#485a72", "#687e98"], ["#94763c", "#b89658"], ["#2f4b6c", "#4c6d96"], ["#48505c", "#68727e"], ["#4a6248", "#6b8668"]];
function sprite(w: number, h: number, fn: (p: Px) => void, flip = false) {
  const p = new Px(w, h);
  fn(p);
  p.outline("#0a0d12");
  let c = p.toCanvas();
  if (flip) {
    const f = mkCanvas(w, h), g = f.getContext("2d")!;
    g.translate(w, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); c = f;
  }
  return c;
}
const propCache: Record<string, HTMLCanvasElement> = {};
export function propSprite(o: any): HTMLCanvasElement {
  const key = o.type + (o.type === "car" ? o.model + o.col + o.face : "") + (o.broken ? "B" : "");
  if (propCache[key]) return propCache[key];
  const b = !!o.broken;
  let c: HTMLCanvasElement;
  if (o.type === "trash") {
    c = sprite(36, 36, (p) => {
      if (!b) {
        p.paint(polyM([[4, 12], [32, 12], [30, 32], [6, 32]]), ramp("#556868"), { spec: true });
        for (let x = 8; x <= 28; x += 4) p.line(x, 14, x, 30, "#243030", 1);
        p.paint(polyM([[2, 7], [34, 7], [33, 13], [3, 13]]), ramp("#3d4c4b"));
        p.rect(13, 4, 10, 3, "#7a8c8a");
        p.rect(6, 21, 24, 1, "#14181c"); p.rect(6, 26, 24, 1, "#14181c");
        p.dot(27, 15, "#6fe0b0"); p.dot(9, 16, "#a8553a");
      } else {
        p.paint(polyM([[2, 21], [27, 21], [25, 33], [4, 33]]), ramp("#4c5e5e"));
        p.paint(polyM([[22, 11], [34, 19], [32, 23], [20, 15]]), ramp("#344241"));
        [[3, 18, "#a8553a"], [9, 16, "#d8d0bc"], [15, 17, "#c9a23a"], [29, 29, "#d8d0bc"], [32, 26, "#6a7a78"], [20, 18, "#6fe0b0"]].forEach((q: any) => p.rect(q[0], q[1], 3, 3, q[2]));
        p.rect(7, 26, 15, 1, "#14181c");
      }
    });
  } else if (o.type === "hydrant") {
    c = sprite(32, 38, (p) => {
      if (!b) {
        // Красный гидрант в духе Streets of Rage 2 (image_d8d831c5)
        p.paint(rectM(11, 9, 10, 23), ramp("#b23a32"), { spec: true });
        p.paint(rectM(8, 29, 16, 6), ramp("#7a2824"));
        p.paint(rectM(4, 15, 24, 4), ramp("#b23a32"));
        p.paint(ellM(6, 17, 3, 4.5), ramp("#9ca8b4")); p.paint(ellM(26, 17, 3, 4.5), ramp("#9ca8b4"));
        p.paint(ellM(16, 7, 7.5, 3.5), ramp("#c8463c"), { spec: true });
        p.rect(14, 3, 4, 3, "#d4dce2");
        p.paint(ellM(16, 22, 3, 3), ramp("#e0a43a"), { rim: false }); p.dot(16, 22, "#fff0b0");
      } else {
        p.paint(rectM(8, 29, 16, 6), ramp("#6a2420"));
        p.paint(polyM([[11, 22], [13, 18], [16, 23], [18, 17], [21, 22], [21, 30], [11, 30]]), ramp("#9a342e"));
        p.rect(5, 32, 22, 1, "#6fc0d0");
      }
    });
  } else if (o.type === "phone") {
    c = sprite(40, 72, (p) => {
      p.paint(rectM(3, 3, 34, 66), ramp("#364458"), { spec: true });
      p.paint(rectM(6, 6, 28, 10), ramp("#202834"));
      p.rect(9, 9, 14, 2, "#e0a43a"); p.rect(9, 12, 8, 1, "#a8553a");
      if (!b) {
        p.paint(rectM(7, 20, 26, 31), ramp("#0e202c"), { shade: false });
        p.rect(8, 21, 24, 29, "#164456"); p.rect(8, 21, 24, 3, "#44b4c6");
        for (let y = 27; y < 48; y += 4) p.rect(11, y, 10 + ((y * 7) % 10), 1, "#7fe7ee");
        p.rect(8, 21, 4, 29, "#7fe7ee26");
        p.paint(rectM(10, 55, 20, 8), ramp("#242c38")); p.dot(15, 59, "#6fe0b0"); p.dot(21, 59, "#e0a43a");
      } else {
        p.paint(rectM(7, 20, 26, 31), ramp("#0a0e14"), { shade: false });
        p.rect(8, 21, 6, 8, "#8aa0b8"); p.rect(24, 38, 8, 11, "#8aa0b8"); p.rect(16, 44, 4, 5, "#8aa0b8");
        p.line(10, 22, 29, 49, "#c8d8e8", 1); p.line(27, 22, 14, 49, "#c8d8e8", 1);
        p.dot(31, 20, "#ffd070"); p.dot(5, 40, "#ffd070");
      }
    });
  } else if (o.type === "lamp") {
    c = sprite(36, 124, (p) => {
      p.paint(rectM(12, 12, 5, 108), ramp("#36404c"));
      p.paint(rectM(8, 108, 13, 12), ramp("#242c34"));
      p.paint(polyM([[12, 12], [14, 4], [27, 3], [32, 6], [27, 6], [16, 7], [16, 14]]), ramp("#36404c"));
      p.paint(polyM([[21, 6], [33, 6], [31, 11], [23, 11]]), ramp("#4a525e"));
      p.rect(23, 10, 8, 2, "#ffd890"); p.rect(24, 11, 6, 1, "#fff8dc");
      p.rect(12, 60, 5, 2, "#d9a23a");
    });
  } else if (o.model === "spinner") {
    // Киберпанк ховер-спиннер (вдохновлено image_1a735488)
    const cc = b ? ["#2c2832", "#3e3846"] : ["#9a844c", "#ba9e5c"], win = b ? "#0d0b14" : "#3a627a";
    c = sprite(120, 52, (p) => {
      // Основной клиновидный корпус
      p.paint(polyM([[4, 24], [18, 18], [94, 18], [114, 26], [112, 34], [6, 34]]), ramp(cc[0]), { spec: true });
      // Кабина / обтекатель
      p.paint(polyM([[28, 18], [40, 8], [78, 8], [92, 18]]), ramp(cc[1]));
      p.paint(polyM([[36, 17], [44, 10], [74, 10], [84, 17]]), ramp(win), { rim: false });
      if (!b) p.line(42, 11, 46, 16, "#b8ecff", 1);
      // Грави-турбины вместо колёс
      for (const wx of [22, 90]) {
        p.paint(ellM(wx, 32, 10, 7), ramp("#1e242c"));
        p.paint(ellM(wx, 32, 6, 4), ramp("#36424e"));
        if (!b) p.rect(wx - 4, 37, 8, 2, "#6fe0e6");
      }
      // Боковые воздухозаборники и пулевые отверстия на разбитой машине
      p.rect(14, 25, 86, 1, darken(cc[0], 0.55));
      p.rect(6, 25, 6, 3, b ? "#3a2a20" : "#d94a3a");
      p.rect(106, 25, 8, 3, b ? "#3a2a20" : "#fff0b0");
      if (!b) p.rect(34, 35, 44, 2, "#6fe0e6cc");
      if (b) { p.rect(42, 22, 8, 4, "#5a3a2a"); p.rect(72, 24, 10, 3, "#5a3a2a"); }
    }, o.face < 0);
  } else {
    const cc = b ? ["#2e2a34", "#3e3a46"] : CARS[o.col], win = b ? "#0e0c18" : "#3a5c76";
    c = sprite(114, 52, (p) => {
      p.paint(polyM([[4, 22], [14, 18], [98, 17], [110, 24], [110, 35], [4, 35]]), ramp(cc[0]), { spec: true });
      if (o.model === "sedan") p.paint(polyM([[22, 18], [32, 6], [78, 6], [92, 18]]), ramp(cc[0]));
      else p.paint(polyM([[30, 18], [40, 7], [70, 7], [88, 18]]), ramp(cc[0]));
      const wl = o.model === "sedan" ? 34 : 42;
      p.paint(polyM([[wl - 3, 17], [wl + 4, 9], [wl + 20, 9], [wl + 20, 17]]), ramp(win), { rim: false });
      p.paint(polyM([[wl + 23, 17], [wl + 23, 9], [wl + 38, 9], [wl + 46, 17]]), ramp(win), { rim: false });
      p.rect(wl - 1, 10, 2, 7, b ? "#1c1a22" : "#a8d4ec");
      p.rect(8, 28, 98, 1, darken(cc[0], 0.5));
      p.rect(2, 24, 5, 4, b ? "#3a2a20" : "#b84438"); p.rect(105, 22, 6, 4, b ? "#3a2a20" : "#fff0b0");
      p.rect(24, 22, 6, 1, darken(cc[0], 0.5)); p.rect(60, 21, 1, 13, darken(cc[0], 0.5));
      if (!b) p.rect(14, 36, 84, 2, "#6fe0e6aa");
      if (b) { p.rect(32, 24, 10, 4, "#5a3a2a"); p.rect(70, 25, 8, 3, "#5a3a2a"); }
      for (const wx of [14, 82]) {
        p.paint(ellM(wx + 9, 36, 10, 10), ramp("#1a1c22"));
        p.paint(ellM(wx + 9, 36, 5.5, 5.5), ramp("#6a727e"));
        p.dot(wx + 9, 36, "#c8d0d8");
      }
    }, o.face < 0);
  }
  return (propCache[key] = c);
}
void lighten;
