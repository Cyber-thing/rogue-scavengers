/* Иконки предметов, символы автомата, бизнесы, уличные пропсы. */
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
export const CARS = [["#6a3040", "#8a4a5a"], ["#4a5a70", "#6a7e98"], ["#9a7a3a", "#ba9a56"], ["#2f4a6b", "#4a6a94"], ["#4a505c", "#6a727e"], ["#4a6048", "#6a8466"]];
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
    c = sprite(34, 34, (p) => {
      if (!b) {
        p.paint(polyM([[4, 12], [30, 12], [28, 31], [6, 31]]), ramp("#4a5e5c"));
        p.paint(polyM([[2, 7], [32, 7], [31, 13], [3, 13]]), ramp("#33403f"));
        p.rect(12, 4, 10, 3, "#6a7a78");
        for (let x = 6; x < 28; x += 4) p.rect(x, 22, 2, 2, x % 8 ? "#d9b44c" : "#14181c");
        p.rect(7, 20, 20, 1, "#14181c"); p.rect(7, 25, 20, 1, "#14181c");
        p.dot(26, 16, "#6fe0b0"); p.dot(8, 17, "#a8553a");
      } else {
        p.paint(polyM([[2, 20], [26, 20], [24, 32], [4, 32]]), ramp("#4a5e5c"));
        p.paint(polyM([[22, 10], [33, 18], [31, 22], [20, 14]]), ramp("#33403f"));
        [[3, 17, "#a8553a"], [9, 15, "#d8d0bc"], [15, 16, "#c9a23a"], [28, 28, "#d8d0bc"], [31, 25, "#6a7a78"], [20, 17, "#6fe0b0"]].forEach((q: any) => p.rect(q[0], q[1], 3, 3, q[2]));
        p.rect(7, 25, 14, 1, "#14181c");
      }
    });
  } else if (o.type === "hydrant") {
    c = sprite(30, 36, (p) => {
      if (!b) {
        p.paint(rectM(11, 8, 8, 24), ramp("#7a8590"));
        p.paint(rectM(8, 28, 14, 6), ramp("#4a5058"));
        p.paint(rectM(4, 14, 22, 4), ramp("#7a8590"));
        p.paint(ellM(6, 16, 3, 5), ramp("#a8553a")); p.paint(ellM(24, 16, 3, 5), ramp("#a8553a"));
        p.paint(ellM(15, 6, 7, 3.5), ramp("#a8553a"));
        p.rect(13, 3, 4, 2, "#d0d6dc");
        p.paint(ellM(15, 22, 3, 3), ramp("#e0a43a"), { rim: false }); p.dot(15, 22, "#fff0b0");
      } else {
        p.paint(rectM(8, 28, 14, 6), ramp("#4a5058"));
        p.paint(polyM([[11, 22], [13, 18], [15, 22], [17, 17], [19, 22], [19, 29], [11, 29]]), ramp("#7a8590"));
        p.rect(5, 30, 20, 1, "#6a8a9a");
      }
    });
  } else if (o.type === "phone") {
    c = sprite(38, 70, (p) => {
      p.paint(rectM(3, 3, 32, 64), ramp("#3a4658"));
      p.paint(rectM(6, 6, 26, 10), ramp("#242c38"));
      p.rect(9, 9, 12, 2, "#e0a43a"); p.rect(9, 12, 7, 1, "#a8553a");
      if (!b) {
        p.paint(rectM(7, 20, 24, 30), ramp("#10202a"), { shade: false });
        p.rect(8, 21, 22, 28, "#1c4a58"); p.rect(8, 21, 22, 3, "#3aa0b0");
        for (let y = 27; y < 46; y += 4) p.rect(11, y, 10 + ((y * 7) % 9), 1, "#7fe7ee");
        p.rect(8, 21, 4, 28, "#7fe7ee22");
        p.paint(rectM(10, 54, 18, 8), ramp("#242c38")); p.dot(14, 58, "#6fe0b0"); p.dot(19, 58, "#e0a43a");
      } else {
        p.paint(rectM(7, 20, 24, 30), ramp("#0a0e14"), { shade: false });
        p.rect(8, 21, 6, 8, "#8aa0b8"); p.rect(22, 38, 8, 11, "#8aa0b8"); p.rect(15, 44, 4, 5, "#8aa0b8");
        p.line(10, 22, 28, 48, "#c8d8e8", 1); p.line(26, 22, 14, 48, "#c8d8e8", 1);
        p.dot(30, 20, "#ffd070"); p.dot(5, 40, "#ffd070");
      }
    });
  } else if (o.type === "lamp") {
    c = sprite(34, 122, (p) => {
      p.paint(rectM(12, 12, 5, 106), ramp("#3a424c"));
      p.paint(rectM(8, 106, 13, 12), ramp("#2a3038"));
      p.paint(polyM([[12, 12], [14, 4], [26, 3], [31, 6], [26, 6], [16, 7], [16, 14]]), ramp("#3a424c"));
      p.paint(polyM([[21, 6], [32, 6], [30, 11], [23, 11]]), ramp("#4a5058"));
      p.rect(23, 10, 7, 2, "#ffd890"); p.rect(24, 11, 5, 1, "#fff6d8");
      p.rect(12, 60, 5, 2, "#d9a23a");
    });
  } else {
    const cc = b ? ["#2e2a34", "#3e3a46"] : CARS[o.col], win = b ? "#0e0c18" : "#3a5a72";
    c = sprite(112, 50, (p) => {
      p.paint(polyM([[4, 22], [14, 18], [98, 17], [108, 24], [108, 35], [4, 35]]), ramp(cc[0]));
      if (o.model === "sedan") p.paint(polyM([[22, 18], [32, 6], [76, 6], [90, 18]]), ramp(cc[0]));
      else p.paint(polyM([[30, 18], [40, 7], [70, 7], [86, 18]]), ramp(cc[0]));
      const wl = o.model === "sedan" ? 34 : 42;
      p.paint(polyM([[wl - 3, 17], [wl + 4, 9], [wl + 20, 9], [wl + 20, 17]]), ramp(win), { rim: false });
      p.paint(polyM([[wl + 23, 17], [wl + 23, 9], [wl + 38, 9], [wl + 46, 17]]), ramp(win), { rim: false });
      p.rect(wl - 1, 10, 2, 7, b ? "#1c1a22" : "#a8d0e8");
      p.rect(8, 28, 96, 1, darken(cc[0], 0.5));
      p.rect(2, 24, 5, 4, b ? "#3a2a20" : "#a8553a"); p.rect(103, 22, 6, 4, b ? "#3a2a20" : "#fff0b0");
      p.rect(24, 22, 6, 1, darken(cc[0], 0.5)); p.rect(60, 21, 1, 13, darken(cc[0], 0.5));
      if (!b) p.rect(14, 36, 84, 2, "#6fe0e6aa");
      if (b) { p.rect(32, 24, 10, 4, "#5a3a2a"); p.rect(70, 25, 8, 3, "#5a3a2a"); }
      for (const wx of [14, 80]) { p.paint(ellM(wx + 9, 36, 10, 10), ramp("#1a1c22")); p.paint(ellM(wx + 9, 36, 5.5, 5.5), ramp("#6a727e")); p.dot(wx + 9, 36, "#c0c8d0"); }
    }, o.face < 0);
  }
  return (propCache[key] = c);
}
void lighten;
