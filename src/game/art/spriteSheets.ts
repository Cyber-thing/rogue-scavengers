/* ======================================================================
   БРАУЗЕРНЫЙ КЭШ PNG-АТЛАСОВ ДЛЯ БОЙЦОВ БАНДЫ (rat, hulk, runner, cutter)
   ====================================================================== */
import ratSheetUrl from "../../assets/sprites/rat.png";
import hulkSheetUrl from "../../assets/sprites/hulk.png";
import runnerSheetUrl from "../../assets/sprites/runner.png";
import cutterSheetUrl from "../../assets/sprites/cutter.png";
import {
  SHEET_ANCHOR_X,
  SHEET_ANCHOR_Y,
  SHEET_CELL_H,
  SHEET_CELL_W,
  SheetClass,
  isSheetClass,
  recolorAtlasPixels,
  selectSheetFrame,
} from "./sheetLogic";

const URLS: Record<SheetClass, string> = {
  rat: ratSheetUrl,
  hulk: hulkSheetUrl,
  runner: runnerSheetUrl,
  cutter: cutterSheetUrl,
};

const rawImages: Partial<Record<SheetClass, HTMLImageElement>> = {};
const atlasCache = new Map<string, HTMLCanvasElement>();

function ensureLoaded(cls: SheetClass): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  let img = rawImages[cls];
  if (!img) {
    img = new Image();
    img.src = URLS[cls];
    rawImages[cls] = img;
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Предзагружаем все 4 листа сразу при старте приложения
if (typeof Image !== "undefined") {
  for (const cls of Object.keys(URLS) as SheetClass[]) ensureLoaded(cls);
}

function getAtlasCanvas(cls: SheetClass, variant: number, flash: boolean): HTMLCanvasElement | null {
  const img = ensureLoaded(cls);
  if (!img) return null;
  const v = ((variant | 0) % 4 + 4) % 4;
  const key = `${cls}_${v}_${flash ? 1 : 0}`;
  const cached = atlasCache.get(key);
  if (cached) return cached;

  const cv = document.createElement("canvas");
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);

  if (flash || v !== 0) {
    const id = ctx.getImageData(0, 0, cv.width, cv.height);
    recolorAtlasPixels(id.data, cls, v, flash);
    ctx.putImageData(id, 0, 0);
  }
  atlasCache.set(key, cv);
  return cv;
}

export function drawSheetUnit(
  g: CanvasRenderingContext2D,
  u: any,
  sx: number,
  sy: number,
  t: number
): boolean {
  if (!u || u.team !== 0 || !isSheetClass(u.cls)) return false;
  const atlas = getAtlasCanvas(u.cls, u.variant || 0, (u.flash || 0) > 0);
  if (!atlas) return false;

  const { frame, bobY, lungeX } = selectSheetFrame(u, t);
  const face = u.face >= 0 ? 1 : -1;
  g.save();
  g.translate(Math.round(sx + lungeX * face), Math.round(sy + 1 + bobY));
  if (face < 0) g.scale(-1, 1);
  g.drawImage(
    atlas,
    frame * SHEET_CELL_W,
    0,
    SHEET_CELL_W,
    SHEET_CELL_H,
    -SHEET_ANCHOR_X,
    -SHEET_ANCHOR_Y,
    SHEET_CELL_W,
    SHEET_CELL_H
  );
  g.restore();
  return true;
}

export function drawSheetGhost(g: CanvasRenderingContext2D, gh: any, sx: number, sy: number): boolean {
  if (!gh || !gh.cls || !isSheetClass(gh.cls)) return false;
  const atlas = getAtlasCanvas(gh.cls, gh.variant || 0, true);
  if (!atlas) return false;

  const frame = gh.sheetFrame ?? 0;
  const face = gh.face >= 0 ? 1 : -1;
  g.save();
  g.translate(Math.round(sx), Math.round(sy + 1));
  if (face < 0) g.scale(-1, 1);
  g.drawImage(
    atlas,
    frame * SHEET_CELL_W,
    0,
    SHEET_CELL_W,
    SHEET_CELL_H,
    -SHEET_ANCHOR_X,
    -SHEET_ANCHOR_Y,
    SHEET_CELL_W,
    SHEET_CELL_H
  );
  g.restore();
  return true;
}

export function drawSheetPortrait(
  g: CanvasRenderingContext2D,
  u: any,
  t: number,
  w: number,
  h: number
): boolean {
  if (!u || u.team !== 0 || !isSheetClass(u.cls)) return false;
  const atlas = getAtlasCanvas(u.cls, u.variant || 0, (u.flash || 0) > 0);
  if (!atlas) return false;

  const { frame, bobY } = selectSheetFrame(u, t);
  const useFrame = frame >= 1 && frame <= 3 ? 0 : frame;
  // Крупный план из кадра стойки/действия в карточке 56×80
  const srcW = 68;
  const srcH = 96;
  const srcX = useFrame * SHEET_CELL_W + SHEET_ANCHOR_X - Math.floor(srcW / 2);
  const srcY = Math.max(0, SHEET_ANCHOR_Y - (u.cls === "hulk" ? 94 : 86) + bobY);
  g.drawImage(atlas, srcX, srcY, srcW, srcH, 0, 0, w, h);
  return true;
}
