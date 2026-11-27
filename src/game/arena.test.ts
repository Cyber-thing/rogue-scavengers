import test from "node:test";
import assert from "node:assert/strict";
import { getCharMetrics, getPose, POSE_FRAMES, poseOf, SW, SH } from "./art/poses.ts";
import { drawChar, LOOKS, profileOf, CLASS_VARIANTS, CIV_LOOKS } from "./art/characters.ts";
import { Px } from "./art/px.ts";
import { BAL } from "./consts.ts";
import { NAMES_F, NAMES_M } from "./content.ts";
import { getMenuIntroState, MENU_SUBTITLE, MENU_TIMING } from "./menuIntro.ts";
import { shopForIndoorUnit } from "./shopLogic.ts";
import { BIZ_PLOTS, BIZ_ORDER, describeBizStage, hitTestBizPlot } from "./art/bizStreet.ts";
import { isSheetClass, recolorAtlasPixels, selectSheetFrame, SHEET_CLASSES } from "./art/sheetLogic.ts";

test("character proportions avoid oversized heads across all scales", () => {
  for (const scale of [0.78, 0.94, 1.0, 1.09, 1.14]) {
    const m = getCharMetrics(scale);
    assert.ok(m.headToBodyRatio <= 0.14, `expected realistic head-to-body ratio <= 0.14 for scale ${scale}, got ${m.headToBodyRatio}`);
    assert.ok(m.headToBodyRatio >= 0.10, `head ratio too tiny: ${m.headToBodyRatio}`);
  }
});

test("pose catalog provides high frame counts for smooth retro animation", () => {
  assert.ok(POSE_FRAMES.idle >= 8);
  assert.ok(POSE_FRAMES.walk >= 10);
  assert.ok(POSE_FRAMES.run >= 10);
  assert.ok(POSE_FRAMES.attack >= 6);
  assert.ok(POSE_FRAMES.down >= 5);
  assert.ok(POSE_FRAMES.loot >= 6);
  assert.ok(POSE_FRAMES.hurt >= 4);
  assert.ok(POSE_FRAMES.cower >= 4);
});

test("3/4 combat stances, smooth 10-frame walk, and two-hand combos work cleanly", () => {
  const idle = getPose("idle", 0);
  assert.ok(idle.twist >= 0.9, "idle stance must turn torso 3/4 toward viewer");
  assert.ok(idle.fT > 0 && idle.kT < 0, "combat stance spreads front and back legs");

  const walkFrames = Array.from({ length: POSE_FRAMES.walk }, (_, i) => getPose("walk", i));
  assert.notEqual(walkFrames[0].fT, walkFrames[4].fT);
  assert.notEqual(walkFrames[0].kT, walkFrames[4].kT);
  // Ensure hip bob stays gentle and continuous across frames (no abrupt vertical jumps)
  for (let i = 0; i < walkFrames.length; i++) {
    const next = walkFrames[(i + 1) % walkFrames.length];
    assert.ok(Math.abs(walkFrames[i].hipDy - next.hipDy) < 0.75, "walk hipDy step too abrupt");
  }

  const jab = getPose("attack", 2, { combo: 0 });
  const uppercut = getPose("attack", 2, { combo: 1 });
  assert.notEqual(jab.lU, uppercut.lU);
  assert.notEqual(jab.nU, uppercut.nU);
  assert.equal(jab.smear, 1);
  assert.equal(uppercut.smear, 2);

  const rangedFire = getPose("attack", 2, { ranged: true });
  assert.equal(rangedFire.flash, 1);

  const whipSwing = getPose("attack", 3, { whip: true });
  assert.equal(whipSwing.whip, 3);

  const kdAir = getPose("down", 0);
  const kdFlat = getPose("down", 3);
  assert.ok(kdFlat.bodyAng <= -90);
  assert.notEqual(kdAir.hipDy, kdFlat.hipDy);
});

test("poseOf cycles smoothly through idle, walk, attack, loot entry, and knockdown stages", () => {
  const idleFrames = new Set<number>();
  for (let i = 0; i < 16; i++) {
    const [name, fr] = poseOf({ state: "idle", moving: false, id: 1 }, i * 0.23);
    assert.equal(name, "idle");
    idleFrames.add(fr);
  }
  assert.equal(idleFrames.size, POSE_FRAMES.idle);

  const walkFrames = new Set<number>();
  for (let i = 0; i < 10; i++) {
    const [name, fr] = poseOf({ state: "idle", moving: true, anim: i / 11 + 0.01 }, 0);
    assert.equal(name, "walk");
    walkFrames.add(fr);
  }
  assert.equal(walkFrames.size, POSE_FRAMES.walk);

  const [lootWalkName] = poseOf({ state: "loot", moving: true, anim: 0.2 }, 0);
  const [lootStandName] = poseOf({ state: "loot", moving: false, anim: 0.2 }, 0.3);
  assert.equal(lootWalkName, "walk");
  assert.equal(lootStandName, "loot");

  const [atkStart, frStart] = poseOf({ state: "attack", st: 0.02, atkDur: 0.36 }, 0);
  const [atkHit, frHit] = poseOf({ state: "attack", st: 0.2, atkDur: 0.36 }, 0);
  assert.equal(atkStart, "attack");
  assert.equal(atkHit, "attack");
  assert.ok(frHit > frStart);

  const [kdName, kdFr] = poseOf({ state: "down", downT: 0.5 }, 0);
  assert.equal(kdName, "down");
  assert.equal(kdFr, 3);
});

test("every character LOOK preset renders cleanly across all poses and equipment", () => {
  const poses = ["idle", "walk", "run", "attack", "hurt", "down", "loot", "cower"];
  for (const [id, L] of Object.entries(LOOKS)) {
    for (const pose of poses) {
      for (const combo of pose === "attack" ? [0, 1] : [0]) {
        const px = new Px(SW, SH);
        const P = getPose(pose, 2, {
          ranged: L.defW === "pistol" || L.defW === "rifle",
          whip: L.defW === "whip",
          civ: id.startsWith("civ_"),
          female: L.gender === "f",
          combo,
        });
        assert.doesNotThrow(() => {
          drawChar(px, L, P, { head: "visor", body: "nano", neck: "scanner", weapon: "crowbar" });
        }, `render failed for ${id} pose=${pose}`);
      }
    }
  }
});

test("gender name pools and launder balance coefficients are valid", () => {
  assert.ok(NAMES_M.length >= 10 && NAMES_F.length >= 10);
  assert.equal(BAL.ARREST_KEEP[0], 0.3);
  assert.ok(BAL.ARREST_KEEP[3] > BAL.ARREST_KEEP[0]);
  assert.ok(BAL.LAUNDER.dist > 0 && BAL.LAUNDER.loot > 0 && BAL.LAUNDER.kill > 0);
});

test("main menu intro sequences background, explosion title, typewriter subtitle, then buttons", () => {
  const start = getMenuIntroState(0);
  assert.equal(start.showTitle, false);
  assert.equal(start.typingStarted, false);
  assert.equal(start.typedText, "");
  assert.equal(start.showButtons, false);

  const boom = getMenuIntroState(MENU_TIMING.explosionAtMs + 10);
  assert.equal(boom.showTitle, true);
  assert.equal(boom.explosionActive, true);
  assert.equal(boom.typingStarted, false);
  assert.equal(boom.showButtons, false);

  const midType = getMenuIntroState(MENU_TIMING.typeStartMs + MENU_TIMING.typeCharMs * 8);
  assert.equal(midType.typingStarted, true);
  assert.equal(midType.typedText, MENU_SUBTITLE.slice(0, 9));
  assert.equal(midType.typingDone, false);
  assert.equal(midType.showButtons, false);

  const ready = getMenuIntroState(MENU_TIMING.buttonsAtMs + 200);
  assert.equal(ready.showTitle, true);
  assert.equal(ready.typedText, MENU_SUBTITLE);
  assert.equal(ready.typingDone, true);
  assert.equal(ready.showButtons, true);

  const reduced = getMenuIntroState(0, true);
  assert.equal(reduced.showTitle, true);
  assert.equal(reduced.typedText, MENU_SUBTITLE);
  assert.equal(reduced.showButtons, true);
  assert.equal(reduced.complete, true);
});

test("all male and female body profiles meet sturdy 16-bit brawler proportions", () => {
  for (const build of ["heavy_m", "musc_m", "lean_m"] as const) {
    const p = profileOf(build);
    assert.ok(p.shoN >= 8.5, `${build} shoulders must be broad, got ${p.shoN}`);
    assert.ok(p.armR1 >= 2.0, `${build} forearm must not be stick-like, got ${p.armR1}`);
    assert.ok(p.legWa >= 1.85, `${build} lower leg must be sturdy, got ${p.legWa}`);
  }
  const fem = profileOf("slim_f");
  assert.ok(fem.shoN >= 7.0 && fem.armR0 >= 2.5 && fem.armR1 >= 1.8, "female build must have defined shoulders and arms");
  assert.ok(fem.legWt >= 3.6 && fem.legWk >= 2.3 && fem.legWa >= 1.6, "female build must have strong athletic legs");
});

test("character roster offers wide variety of hairstyles, outfits, and colors", () => {
  for (const cls of ["rat", "hulk", "runner", "cutter"]) {
    const total = new Set([...CLASS_VARIANTS[cls].m, ...CLASS_VARIANTS[cls].f]).size;
    assert.ok(total >= 5, `class ${cls} should have at least 5 distinct presets, got ${total}`);
  }
  assert.ok(CIV_LOOKS.length >= 20, `expected >= 20 civilian presets, got ${CIV_LOOKS.length}`);
  const heads = new Set(Object.values(LOOKS).map((L) => L.head));
  const torsos = new Set(Object.values(LOOKS).map((L) => L.torso));
  const tops = new Set(Object.values(LOOKS).map((L) => L.top));
  assert.ok(heads.size >= 12, `expected >= 12 distinct hairstyles/heads, got ${heads.size}`);
  assert.ok(torsos.size >= 12, `expected >= 12 distinct outfit styles, got ${torsos.size}`);
  assert.ok(tops.size >= 18, `expected >= 18 distinct outfit colors, got ${tops.size}`);
});

test("shopForIndoorUnit keeps looting characters visible inside open shops and clears when closed", () => {
  const shop = { kind: "shop", x: 300, y: 147, looted: false };
  const r = { props: [shop] };
  assert.equal(shopForIndoorUnit({ dead: false, x: 315, y: 132, lootShop: shop }, r), shop);
  assert.equal(shopForIndoorUnit({ dead: false, x: 315, y: 134 }, r), shop);
  assert.equal(shopForIndoorUnit({ dead: false, x: 315, y: 148, lootShop: shop }, r), null);
  assert.equal(shopForIndoorUnit({ dead: true, x: 315, y: 132, lootShop: shop }, r), null);
  shop.looted = true;
  assert.equal(shopForIndoorUnit({ dead: false, x: 315, y: 132, lootShop: shop }, r), null);
});

test("interactive business street maps plots accurately and evolves buildings across Lv.0..3", () => {
  assert.equal(BIZ_PLOTS.length, 4);
  for (const id of BIZ_ORDER) {
    const plot = BIZ_PLOTS.find((p) => p.id === id)!;
    const hit = hitTestBizPlot((plot.x + plot.w / 2) / 640, (plot.y + plot.h / 2) / 220);
    assert.equal(hit, id);
  }
  assert.equal(hitTestBizPlot(0.001, 0.001), null);

  const s0 = describeBizStage(0);
  const s1 = describeBizStage(1);
  const s2 = describeBizStage(2);
  const s3 = describeBizStage(3);
  assert.equal(s0.active, false);
  assert.equal(s0.hasNeonSign, false);
  assert.equal(s1.active, true);
  assert.equal(s1.hasNeonSign, true);
  assert.equal(s1.hasUpperFloor, false);
  assert.equal(s2.hasUpperFloor, true);
  assert.equal(s2.hasStreetProp, true);
  assert.equal(s2.hasRooftopHolo, false);
  assert.equal(s3.hasRooftopHolo, true);
});

test("gang sprite-sheet logic maps poses smoothly and recolors variants safely", () => {
  for (const cls of SHEET_CLASSES) assert.equal(isSheetClass(cls), true);
  assert.equal(isSheetClass("guard"), false);

  assert.equal(selectSheetFrame({ cls: "rat", state: "idle", moving: false, id: 1 }, 0).frame, 0);
  const walkSet = new Set<number>();
  for (let i = 0; i < 4; i++) {
    walkSet.add(selectSheetFrame({ cls: "cutter", state: "idle", moving: true, anim: i / 6 + 0.01 }, 0).frame);
  }
  assert.deepEqual([...walkSet].sort((a, b) => a - b), [1, 2, 3]);

  const meleeWindup = selectSheetFrame({ cls: "hulk", state: "attack", st: 0.03, atkDur: 0.36 }, 0);
  const meleeStrike = selectSheetFrame({ cls: "hulk", state: "attack", st: 0.22, atkDur: 0.36 }, 0);
  assert.equal(meleeWindup.frame, 4);
  assert.equal(meleeStrike.frame, 5);
  assert.ok(meleeStrike.lungeX > 0);

  const rangedAim = selectSheetFrame({ cls: "runner", state: "attack", st: 0.02, atkDur: 0.36 }, 0);
  const rangedFire = selectSheetFrame({ cls: "runner", state: "attack", st: 0.25, atkDur: 0.36 }, 0);
  assert.equal(rangedAim.frame, 0);
  assert.equal(rangedFire.frame, 5);

  assert.equal(selectSheetFrame({ cls: "rat", state: "loot", moving: false, id: 1 }, 0).frame, 4);
  assert.equal(selectSheetFrame({ cls: "rat", state: "hurt" }, 0).frame, 6);
  assert.equal(selectSheetFrame({ cls: "rat", state: "down", downT: 0.5 }, 0).frame, 7);

  // Cutter crimson jacket pixel shifts on variant 1 while transparent pixel stays untouched
  const px = new Uint8ClampedArray([160, 42, 46, 255, 0, 0, 0, 0]);
  recolorAtlasPixels(px, "cutter", 1, false);
  assert.ok(px[2] > px[0], "variant 1 cutter jacket should shift crimson toward cobalt");
  assert.equal(px[7], 0, "transparent pixel must remain transparent");

  recolorAtlasPixels(px, "cutter", 0, true);
  assert.equal(px[0], 246);
  assert.equal(px[7], 0);
});
