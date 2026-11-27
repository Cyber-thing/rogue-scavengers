import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SHEETS = [
  { id: "rat", src: "src/assets/images/sheet_rat_1795773737512.jpg", targetH: 78 },
  { id: "hulk", src: "src/assets/images/sheet_hulk_fixed_1795773785535.jpg", targetH: 88 },
  { id: "runner", src: "src/assets/images/sheet_runner_1795773742123.jpg", targetH: 78 },
  { id: "cutter", src: "src/assets/images/sheet_cutter_1795773742188.jpg", targetH: 78 },
];

export const CELL_W = 148;
export const CELL_H = 112;
export const ANCHOR_X = 74;
export const ANCHOR_Y = 104;
const FRAMES = 8;

function decodeJpgToRgb(filePath) {
  const buf = execFileSync("convert", [filePath, "-depth", "8", "ppm:-"], { maxBuffer: 64 * 1024 * 1024 });
  let i = 0;
  const readTok = () => {
    while (i < buf.length && (buf[i] <= 32 || buf[i] === 35)) {
      if (buf[i] === 35) while (i < buf.length && buf[i] !== 10) i++;
      else i++;
    }
    const start = i;
    while (i < buf.length && buf[i] > 32) i++;
    return buf.toString("ascii", start, i);
  };
  const magic = readTok();
  if (magic !== "P6") throw new Error(`Expected P6 PPM, got ${magic}`);
  const w = parseInt(readTok(), 10);
  const h = parseInt(readTok(), 10);
  const maxv = parseInt(readTok(), 10);
  if (maxv !== 255) throw new Error(`Expected maxv 255, got ${maxv}`);
  i++; // single whitespace byte before binary payload
  const rgb = buf.subarray(i, i + w * h * 3);
  return { w, h, rgb };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePngRgba(w, h, rgba) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const rowOff = y * (1 + w * 4);
    raw[rowOff] = 0; // filter None
    rgba.copy(raw, rowOff + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function isNonWhite(rgb, idx) {
  const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
  return r < 235 || g < 235 || b < 235;
}

function findValley(counts, approx, radius) {
  const lo = Math.max(1, Math.floor(approx - radius));
  const hi = Math.min(counts.length - 2, Math.ceil(approx + radius));
  let bestIdx = Math.round(approx);
  let bestScore = Infinity;
  for (let i = lo; i <= hi; i++) {
    // Score prefers low pixel count and closeness to expected center
    const score = counts[i] * 1000 + Math.abs(i - approx) * 0.01;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function extractCellRgba(rgb, imgW, x0, y0, x1, y1) {
  const cw = x1 - x0;
  const ch = y1 - y0;
  const rgba = Buffer.alloc(cw * ch * 4);
  const visited = new Uint8Array(cw * ch);
  const q = new Int32Array(cw * ch);
  let qh = 0, qt = 0;

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * imgW + (x0 + x)) * 3;
      const di = (y * cw + x) * 4;
      rgba[di] = rgb[si];
      rgba[di + 1] = rgb[si + 1];
      rgba[di + 2] = rgb[si + 2];
      rgba[di + 3] = 255;
    }
  }

  const isBg = (p) => {
    const di = p * 4;
    const r = rgba[di], g = rgba[di + 1], b = rgba[di + 2];
    const maxc = Math.max(r, g, b), minc = Math.min(r, g, b);
    return maxc > 218 && minc > 205 && maxc - minc < 34;
  };

  const push = (x, y) => {
    const p = y * cw + x;
    if (visited[p] || !isBg(p)) return;
    visited[p] = 1;
    q[qt++] = p;
  };

  for (let x = 0; x < cw; x++) { push(x, 0); push(x, ch - 1); }
  for (let y = 0; y < ch; y++) { push(0, y); push(cw - 1, y); }

  while (qh < qt) {
    const p = q[qh++];
    rgba[p * 4 + 3] = 0;
    const x = p % cw, y = (p / cw) | 0;
    if (x > 0) push(x - 1, y);
    if (x + 1 < cw) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < ch) push(x, y + 1);
  }

  // Remove enclosed neutral-white pockets (e.g. between arm/torso, legs, or whip loops) while keeping tiny eye highlights
  const isPocketBg = (p) => {
    const di = p * 4;
    if (rgba[di + 3] === 0) return false;
    const r = rgba[di], g = rgba[di + 1], b = rgba[di + 2];
    const maxc = Math.max(r, g, b), minc = Math.min(r, g, b);
    return maxc > 210 && minc > 195 && maxc - minc < 26;
  };
  const seenPocket = new Uint8Array(cw * ch);
  for (let start = 0; start < cw * ch; start++) {
    if (seenPocket[start] || !isPocketBg(start)) continue;
    let ph = 0, pt = 0;
    seenPocket[start] = 1;
    q[pt++] = start;
    while (ph < pt) {
      const p = q[ph++];
      const x = p % cw, y = (p / cw) | 0;
      const tryPush = (np) => {
        if (!seenPocket[np] && isPocketBg(np)) {
          seenPocket[np] = 1;
          q[pt++] = np;
        }
      };
      if (x > 0) tryPush(p - 1);
      if (x + 1 < cw) tryPush(p + 1);
      if (y > 0) tryPush(p - cw);
      if (y + 1 < ch) tryPush(p + cw);
    }
    if (pt >= 40) {
      for (let k = 0; k < pt; k++) rgba[q[k] * 4 + 3] = 0;
    }
  }

  // Prune tiny isolated opaque specks/smudges disconnected from main character
  const seenOp = new Uint8Array(cw * ch);
  for (let start = 0; start < cw * ch; start++) {
    if (seenOp[start] || rgba[start * 4 + 3] === 0) continue;
    let ph = 0, pt = 0;
    seenOp[start] = 1;
    q[pt++] = start;
    while (ph < pt) {
      const p = q[ph++];
      const x = p % cw, y = (p / cw) | 0;
      const tryOp = (np) => {
        if (!seenOp[np] && rgba[np * 4 + 3] > 0) {
          seenOp[np] = 1;
          q[pt++] = np;
        }
      };
      if (x > 0) tryOp(p - 1);
      if (x + 1 < cw) tryOp(p + 1);
      if (y > 0) tryOp(p - cw);
      if (y + 1 < ch) tryOp(p + cw);
    }
    if (pt < 260) {
      let cminX = cw, cmaxX = 0;
      for (let k = 0; k < pt; k++) {
        const cx = q[k] % cw;
        if (cx < cminX) cminX = cx;
        if (cx > cmaxX) cmaxX = cx;
      }
      if (pt < 90 || cmaxX - cminX < 40) {
        for (let k = 0; k < pt; k++) rgba[q[k] * 4 + 3] = 0;
      }
    }
  }

  // Fringe cleanup on edge pixels adjacent to transparency (2 passes for crisp dark ink edges)
  for (let pass = 0; pass < 2; pass++) {
    const toClear = [];
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const p = y * cw + x;
        const di = p * 4;
        if (rgba[di + 3] === 0) continue;
        const hasTrans =
          rgba[((y - 1) * cw + x) * 4 + 3] === 0 ||
          rgba[((y + 1) * cw + x) * 4 + 3] === 0 ||
          rgba[(y * cw + x - 1) * 4 + 3] === 0 ||
          rgba[(y * cw + x + 1) * 4 + 3] === 0;
        if (!hasTrans) continue;
        const r = rgba[di], g = rgba[di + 1], b = rgba[di + 2];
        const maxc = Math.max(r, g, b), minc = Math.min(r, g, b);
        const lum = (r + g + b) / 3;
        if (lum > 170 && maxc - minc < 34) {
          toClear.push(p);
        } else if (pass === 0 && lum > 85 && maxc - minc < 28) {
          rgba[di] = Math.round(r * 0.35);
          rgba[di + 1] = Math.round(g * 0.35);
          rgba[di + 2] = Math.round(b * 0.35);
        }
      }
    }
    for (const p of toClear) rgba[p * 4 + 3] = 0;
  }

  // Subtle midtone lift so dark cyberpunk gear stays punchy against night asphalt
  for (let p = 0; p < cw * ch; p++) {
    const di = p * 4;
    if (rgba[di + 3] === 0) continue;
    const lum = (rgba[di] + rgba[di + 1] + rgba[di + 2]) / 3;
    if (lum > 48 && lum < 215) {
      rgba[di] = Math.min(255, Math.round(rgba[di] * 1.12 + 4));
      rgba[di + 1] = Math.min(255, Math.round(rgba[di + 1] * 1.12 + 4));
      rgba[di + 2] = Math.min(255, Math.round(rgba[di + 2] * 1.12 + 4));
    }
  }

  // Tight bounding box
  let bx0 = cw, by0 = ch, bx1 = -1, by1 = -1;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (rgba[(y * cw + x) * 4 + 3] > 0) {
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
    }
  }
  return { cw, ch, rgba, bx0, by0, bx1, by1 };
}

function buildAtlas(spec) {
  const { w, h, rgb } = decodeJpgToRgb(spec.src);
  const rowCounts = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let cnt = 0;
    for (let x = 0; x < w; x++) if (isNonWhite(rgb, (y * w + x) * 3)) cnt++;
    rowCounts[y] = cnt;
  }
  const splitY = findValley(rowCounts, h * 0.5, h * 0.14);

  const cells = [];
  for (const [ry0, ry1] of [[0, splitY], [splitY, h]]) {
    const colCounts = new Int32Array(w);
    for (let x = 0; x < w; x++) {
      let cnt = 0;
      for (let y = ry0; y < ry1; y++) if (isNonWhite(rgb, (y * w + x) * 3)) cnt++;
      colCounts[x] = cnt;
    }
    const c1 = findValley(colCounts, w * 0.25, w * 0.09);
    const c2 = findValley(colCounts, w * 0.50, w * 0.09);
    const c3 = findValley(colCounts, w * 0.75, w * 0.09);
    const xs = [0, c1, c2, c3, w];
    for (let k = 0; k < 4; k++) {
      cells.push(extractCellRgba(rgb, w, xs[k], ry0, xs[k + 1], ry1));
    }
  }

  // Uniform scale anchored to pose 0 (idle) standing height
  const idle = cells[0];
  const idleH = Math.max(1, idle.by1 - idle.by0 + 1);
  const scale = spec.targetH / idleH;

  // Compute standing lower-body anchor X for each pose so attacks extend forward rather than shifting body backward
  const atlasW = CELL_W * FRAMES;
  const atlasH = CELL_H;
  const atlas = Buffer.alloc(atlasW * atlasH * 4);

  for (let f = 0; f < FRAMES; f++) {
    const c = cells[f];
    const sw = c.bx1 - c.bx0 + 1;
    const sh = c.by1 - c.by0 + 1;
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));

    // Downsample into temporary cell buffer using box/area filtering + ink outline boost
    const tmp = Buffer.alloc(dw * dh * 4);
    const invS = 1 / scale;
    for (let dy = 0; dy < dh; dy++) {
      const sy0 = c.by0 + dy * invS;
      const sy1 = Math.min(c.by1 + 1, c.by0 + (dy + 1) * invS);
      for (let dx = 0; dx < dw; dx++) {
        const sx0 = c.bx0 + dx * invS;
        const sx1 = Math.min(c.bx1 + 1, c.bx0 + (dx + 1) * invS);

        let aSum = 0, wSum = 0, rSum = 0, gSum = 0, bSum = 0, darkCount = 0, opCount = 0;
        let drSum = 0, dgSum = 0, dbSum = 0;
        const iy0 = Math.floor(sy0), iy1 = Math.min(c.ch - 1, Math.floor(sy1));
        const ix0 = Math.floor(sx0), ix1 = Math.min(c.cw - 1, Math.floor(sx1));
        for (let sy = iy0; sy <= iy1; sy++) {
          const wy = Math.min(sy + 1, sy1) - Math.max(sy, sy0);
          if (wy <= 0) continue;
          for (let sx = ix0; sx <= ix1; sx++) {
            const wx = Math.min(sx + 1, sx1) - Math.max(sx, sx0);
            if (wx <= 0) continue;
            const wt = wx * wy;
            const si = (sy * c.cw + sx) * 4;
            const a = c.rgba[si + 3] / 255;
            wSum += wt;
            aSum += wt * a;
            if (a > 0.5) {
              const r = c.rgba[si], g = c.rgba[si + 1], b = c.rgba[si + 2];
              rSum += wt * r;
              gSum += wt * g;
              bSum += wt * b;
              opCount += wt;
              if (r + g + b < 150) {
                darkCount += wt;
                drSum += wt * r;
                dgSum += wt * g;
                dbSum += wt * b;
              }
            }
          }
        }
        const di = (dy * dw + dx) * 4;
        const alphaFrac = wSum > 0 ? aSum / wSum : 0;
        if (alphaFrac >= 0.42 && opCount > 0) {
          // Preserve crisp dark pixel-art ink lines where ink dominates footprint
          if (darkCount >= opCount * 0.36 && darkCount > 0) {
            tmp[di] = Math.round(drSum / darkCount);
            tmp[di + 1] = Math.round(dgSum / darkCount);
            tmp[di + 2] = Math.round(dbSum / darkCount);
          } else {
            tmp[di] = Math.round(rSum / opCount);
            tmp[di + 1] = Math.round(gSum / opCount);
            tmp[di + 2] = Math.round(bSum / opCount);
          }
          tmp[di + 3] = 255;
        }
      }
    }

    // Remove stray isolated 1px speckles in downsampled sprite
    for (let dy = 1; dy < dh - 1; dy++) {
      for (let dx = 1; dx < dw - 1; dx++) {
        const di = (dy * dw + dx) * 4;
        if (tmp[di + 3] === 0) continue;
        let nb = 0;
        if (tmp[((dy - 1) * dw + dx) * 4 + 3] > 0) nb++;
        if (tmp[((dy + 1) * dw + dx) * 4 + 3] > 0) nb++;
        if (tmp[(dy * dw + dx - 1) * 4 + 3] > 0) nb++;
        if (tmp[(dy * dw + dx + 1) * 4 + 3] > 0) nb++;
        if (nb === 0) tmp[di + 3] = 0;
      }
    }

    // Measure tight bounds & foot/torso anchor in downsampled tmp
    let tx0 = dw, tx1 = -1, ty0 = dh, ty1 = -1;
    let torsoSumX = 0, torsoN = 0;
    for (let dy = 0; dy < dh; dy++) {
      for (let dx = 0; dx < dw; dx++) {
        if (tmp[(dy * dw + dx) * 4 + 3] === 0) continue;
        if (dx < tx0) tx0 = dx;
        if (dx > tx1) tx1 = dx;
        if (dy < ty0) ty0 = dy;
        if (dy > ty1) ty1 = dy;
        // Core body weight in middle-lower torso & legs (prevents extended punch/whip from pulling body backward)
        if (dy >= dh * 0.48 && dy <= dh * 0.94) {
          torsoSumX += dx;
          torsoN++;
        }
      }
    }
    const coreCenterX = torsoN > 0 ? Math.round(torsoSumX / torsoN) : Math.round((tx0 + tx1) / 2);
    // On attack frame (f=5), keep body slightly behind the fist/whip extension by anchoring closer to left/core stance
    const anchorOffsetX = f === 5 ? Math.round(coreCenterX - (spec.id === "cutter" ? 8 : 4)) : f === 7 ? Math.round((tx0 + tx1) / 2) : coreCenterX;
    const pasteX = f * CELL_W + ANCHOR_X - anchorOffsetX;
    const pasteY = ANCHOR_Y - ty1;

    for (let dy = 0; dy < dh; dy++) {
      const ay = pasteY + dy;
      if (ay < 0 || ay >= atlasH) continue;
      for (let dx = 0; dx < dw; dx++) {
        const si = (dy * dw + dx) * 4;
        if (tmp[si + 3] === 0) continue;
        const ax = pasteX + dx;
        if (ax < f * CELL_W || ax >= (f + 1) * CELL_W) continue;
        const ai = (ay * atlasW + ax) * 4;
        atlas[ai] = tmp[si];
        atlas[ai + 1] = tmp[si + 1];
        atlas[ai + 2] = tmp[si + 2];
        atlas[ai + 3] = 255;
      }
    }
  }

  fs.mkdirSync("src/assets/sprites", { recursive: true });
  const outPath = `src/assets/sprites/${spec.id}.png`;
  fs.writeFileSync(outPath, encodePngRgba(atlasW, atlasH, atlas));
  console.log(`Built ${outPath} (${atlasW}x${atlasH}, scale=${scale.toFixed(3)})`);
  return { id: spec.id, atlasW, atlasH, atlas };
}

const built = SHEETS.map(buildAtlas);

// Render a dark-background contact sheet preview with baseline & crosshairs for visual inspection
const pw = CELL_W * FRAMES;
const ph = CELL_H * built.length;
const preview = Buffer.alloc(pw * ph * 4);
for (let y = 0; y < ph; y++) {
  for (let x = 0; x < pw; x++) {
    const i = (y * pw + x) * 4;
    const cellX = x % CELL_W, cellY = y % CELL_H;
    const isLine = cellY === ANCHOR_Y || cellX === ANCHOR_X;
    preview[i] = isLine ? 65 : 22;
    preview[i + 1] = isLine ? 45 : 28;
    preview[i + 2] = isLine ? 45 : 36;
    preview[i + 3] = 255;
  }
}
built.forEach((b, row) => {
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < pw; x++) {
      const si = (y * pw + x) * 4;
      if (b.atlas[si + 3] === 0) continue;
      const di = ((row * CELL_H + y) * pw + x) * 4;
      preview[di] = b.atlas[si];
      preview[di + 1] = b.atlas[si + 1];
      preview[di + 2] = b.atlas[si + 2];
      preview[di + 3] = 255;
    }
  }
});
fs.mkdirSync(".playwright-cli", { recursive: true });
fs.writeFileSync(".playwright-cli/sheets-preview.png", encodePngRgba(pw, ph, preview));
console.log("Wrote .playwright-cli/sheets-preview.png");
