import { useEffect, useRef, useState } from "react";
import { BAL, DL, H, W } from "../game/consts";
import { CLASSES, ITEMS, SLOTS, SLOTNAME, itemDesc } from "../game/content";
import { aliveUnits, G as gameState, meta, starsNow } from "../game/state";
import { Casino, buyItem, closeModal, invClick, marketPrice, mergeAll, onEscape, openModal, selectUnit, setCmd, spin, spinCost, toggleSound, togglePause, toggleSpeed, unequip, useMed, useStim } from "../game/economy";
import { arenaMouse, setArena, setSlot } from "../game/engine";
import { iconURL } from "../game/art/props";
import { getSprite, OX, OY } from "../game/art/characters";
import { drawSheetPortrait } from "../game/art/spriteSheets";
import { lookOf, poseOf } from "../game/render";
import { Btn, Panel, useGame } from "./common";
import { cn } from "../utils/cn";

/* ------------------------------ ВЕРХНЯЯ ПАНЕЛЬ ------------------------------ */
function Sigil() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" className="shrink-0">
      <path d="M16 2 28 9v14l-12 7L4 23V9z" fill="#10171f" stroke="#e0a43a" strokeWidth="1.5" />
      <path d="M11 12.5c0-2 2-3 5-3s5 .8 5 2.6c0 2-2 2.4-5 3s-5 1-5 3.2c0 2 2 3 5 3s5-1 5-3" fill="none" stroke="#e0a43a" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M6 24 26 8" stroke="#b8553a" strokeWidth="1.4" />
    </svg>
  );
}
function Chip(p: { label: string; children: React.ReactNode; tone?: string; hide?: boolean }) {
  return <div className={cn("chip", p.hide && "hidden xl:flex")}><small>{p.label}</small><b className={p.tone}>{p.children}</b></div>;
}
export function TopBar() {
  const G = useGame(), r = G.run, run = G.mode === "run";
  const st = r.demo ? 0 : starsNow(), m = Math.floor(r.t / 60), s = Math.floor(r.t % 60);
  return (
    <header className="topbar">
      <div className="logo">
        <Sigil />
        <div className="leading-none">
          <div className="logo-a">ROGUE</div>
          <div className="logo-b">SCAVENGERS</div>
        </div>
      </div>
      <Chip label="КРЕДИТЫ" tone="text-[#e8c25a]">{DL}{r.cash}</Chip>
      <Chip label="REP">{r.rep}</Chip>
      <Chip label="ДИСТ.">{r.distM}м</Chip>
      <Chip label="БАНДА">{aliveUnits().length}/{r.limit}</Chip>
      <div className="chip" title="Уровень тревоги системы безопасности WARDEN">
        <small>WARDEN</small>
        <b className="flex gap-[3px]">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={cn("pip", i <= st && (st >= 3 ? "pip-hot" : "pip-on"))} />)}</b>
      </div>
      <Chip label="ВРЕМЯ" hide>{m}:{s < 10 ? "0" : ""}{s}</Chip>
      <div className="grow" />
      <Btn variant="amber" disabled={!run} onClick={() => openModal("hire")}>+ Нанять</Btn>
      <Btn onClick={() => openModal("biz")}>Бизнесы</Btn>
      <Btn disabled={!run} on={G.speed === 2} onClick={toggleSpeed}>{G.speed}x</Btn>
      <Btn disabled={!run} onClick={togglePause}>{G.paused ? "Продолжить" : "Пауза"}</Btn>
      <Btn onClick={toggleSound}>Звук: {meta.sound ? "вкл" : "выкл"}</Btn>
      <Btn variant="red" disabled={!run || !!r.ending} onClick={onEscape}>{G.escArm > 0 ? "Точно? Жми ещё!" : "Уйти с добычей"}</Btn>
    </header>
  );
}

/* --------------------------------- АРЕНА --------------------------------- */
export function ArenaView() {
  const G = useGame();
  const wrap = useRef<HTMLDivElement>(null), cvs = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: W, h: H });
  useEffect(() => {
    setArena(cvs.current);
    const fit = () => {
      const el = wrap.current; if (!el) return;
      const sc = Math.min((el.clientWidth - 16) / W, (el.clientHeight - 16) / H);
      setSize({ w: Math.max(320, Math.floor(W * sc)), h: Math.max(180, Math.floor(H * sc)) });
    };
    fit(); const ro = new ResizeObserver(fit); if (wrap.current) ro.observe(wrap.current);
    return () => { ro.disconnect(); setArena(null); };
  }, []);
  return (
    <section className="arena-wrap" ref={wrap}>
      <div className="arena-frame" style={{ width: size.w, height: size.h }}>
        <canvas ref={cvs} width={W} height={H} data-testid="arena-canvas" className="arena-cv" onMouseDown={(e) => cvs.current && arenaMouse(e.nativeEvent, cvs.current)} />
        <div className="crt" />
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        {G.toastMsg && <div key={G.toastKey} className="toast">{G.toastMsg}</div>}
        {G.paused && G.mode === "run" && <div className="pause-tag">ПАУЗА</div>}
      </div>
    </section>
  );
}

/* --------------------------------- САЙДБАР --------------------------------- */
function SlotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { setSlot(ref.current); return () => setSlot(null); }, []);
  return <canvas ref={ref} width={180} height={56} className="slot-cv" />;
}
function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (100 * hp) / max));
  return <div className="hpb"><b style={{ width: pct + "%" }} className={pct < 30 ? "low" : ""} /><span>{Math.round(hp)}/{max}</span></div>;
}
export function Sidebar() {
  const G = useGame(), r = G.run, run = G.mode === "run";
  const u = r.units.find((x: any) => x.id === r.sel && !x.dead);
  const si = G.selItem >= 0 ? r.inv[G.selItem] : null;
  const cost = spinCost();
  return (
    <aside className="sidebar">
      <Panel title="РАНДОМАЙЗЕР ХАОС" right={<span className="text-[#e8c25a]">{DL}{cost}</span>} tag="01">
        <div className="slot-wrap"><SlotCanvas /></div>
        <Btn variant="amber" className="w-full mt-2" disabled={!run || Casino.spinning} onClick={spin}>{Casino.spinning ? "Крутим..." : `Крутить ${DL}${cost}`}</Btn>
        <div className="note">{Casino.msg}</div>
      </Panel>

      <Panel title="РЮКЗАК" right={`${r.inv.filter(Boolean).length}/${BAL.INV}`} tag="02">
        <div className="inv">
          {r.inv.map((it: any, i: number) => (
            <button key={i} className={cn("slot", it && "lv" + it.lv, G.selItem === i && "sel")} onClick={() => run && invClick(i)}
              title={it ? `${ITEMS[it.id].name} Lv.${it.lv} — ${itemDesc(it.id, it.lv)}` : ""}>
              {it && <><img src={iconURL(it.id)} alt="" /><span className="lvl">L{it.lv}</span></>}
            </button>
          ))}
        </div>
        <div className="note min-h-[30px]">
          {si ? <><b className="text-[#e8c25a]">{ITEMS[si.id].name} Lv.{si.lv}</b>: {itemDesc(si.id, si.lv)}. <i className="not-italic text-[#7d8a96]">{ITEMS[si.id].lore}</i></> : "Выбери предмет, затем кликни на бойца. Одинаковые — сливаются."}
        </div>
        <div className="row"><Btn small grow disabled={!run} onClick={mergeAll}>Слить пары</Btn><Btn small grow variant="amber" disabled={!run} onClick={buyItem}>Чёрный рынок {DL}{marketPrice()}</Btn></div>
        <div className="row"><Btn small grow disabled={!run} onClick={useMed}>Мед-пак {DL}{BAL.MED}</Btn><Btn small grow disabled={!run} onClick={useStim}>{r.buff ? `Стим ${Math.ceil(r.buff.t)}с` : `Боевой стим ${DL}${BAL.STIM}`}</Btn></div>
      </Panel>

      <Panel title="ВЫБРАННЫЙ БОЕЦ" right={<span className="text-[#7d8a96]">1-5 · A L F Q</span>} tag="03">
        {!u ? <div className="note">Нет выбранного бойца</div> : (() => {
          const s = u.s, C = CLASSES[u.cls];
          return (
            <div>
              <div className="flex justify-between items-baseline mb-1"><b className="text-[13px]">{u.name}</b><i className="not-italic text-[10px] text-[#7d8a96]">{C.name} · LV {u.lvl} · XP {Math.floor(u.xp)}/{30 + u.lvl * 25}</i></div>
              <HpBar hp={u.hp} max={u.maxHp} />
              <div className="stats">
                <span>УРОН <b>{Math.round(s.dmg)}</b></span><span>АТК/С <b>{s.rate.toFixed(1)}</b></span><span>СКОР <b>{Math.round(s.spd)}</b></span>
                <span>БРОНЯ <b>{Math.round(s.armor * 100)}%</b></span><span>КРИТ <b>{Math.round(s.crit * 100)}%</b></span><span>ДАЛЬН <b>{s.range}</b></span>
              </div>
              <div className="eqrow">
                {SLOTS.map((sl) => {
                  const it = u.eq[sl];
                  return (
                    <button key={sl} className={cn("eq", it ? "lv" + it.lv : "empty")} onClick={() => unequip(sl)}
                      title={it ? `${ITEMS[it.id].name} Lv.${it.lv} — ${itemDesc(it.id, it.lv)} (клик — снять)` : SLOTNAME[sl]}>
                      {it ? <><img src={iconURL(it.id)} alt="" /><span className="lvl">L{it.lv}</span></> : SLOTNAME[sl].slice(0, 4)}
                    </button>
                  );
                })}
              </div>
              <div className="row">
                {[["attack", "Атака"], ["loot", "Вскрыть"], ["follow", "За мной"], ["auto", "Авто"]].map((c) => (
                  <Btn key={c[0]} small grow on={u.cmd === c[0]} onClick={() => setCmd(c[0])}>{c[1]}</Btn>
                ))}
              </div>
            </div>
          );
        })()}
      </Panel>
    </aside>
  );
}

/* --------------------------- КАРТОЧКИ БОЙЦОВ --------------------------- */
function Portrait({ unit }: { unit: any }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = ref.current; if (!c) return; const g = c.getContext("2d")!; g.imageSmoothingEnabled = false; g.clearRect(0, 0, 56, 80);
      if (!drawSheetPortrait(g, unit, gameState.t, 56, 80)) {
        const pp = poseOf(unit, gameState.t);
        const spr = getSprite(lookOf(unit), pp[0] === "walk" ? "idle" : pp[0], pp[0] === "walk" ? 0 : pp[1], unit.eqi, 1, unit.flash > 0, unit.atkSeq || 0);
        g.drawImage(spr, OX - 28, OY - 79, 56, 80, 0, 0, 56, 80);
      }
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [unit]);
  return <canvas ref={ref} width={56} height={80} className="portrait" />;
}
export function Cards() {
  const G = useGame(), r = G.run, al = aliveUnits().length;
  if (G.mode === "menu") return <footer className="cards"><div className="cards-empty">Банда Scavenger Kingdom ждёт приказа. Нажми «Новый забег».</div></footer>;
  return (
    <footer className="cards">
      {r.units.map((u: any) => {
        const s = u.s, C = CLASSES[u.cls];
        return (
          <div key={u.id} className={cn("card", r.sel === u.id && "sel", G.selItem >= 0 && !u.dead && "target", u.dead && "dead")} onClick={() => selectUnit(u.id)}>
            <Portrait unit={u} />
            <div className="ci">
              <div className="nm">{u.name} <i>{C.name} · LV{u.lvl}</i></div>
              <HpBar hp={u.hp} max={u.maxHp} />
              <div className="eqs">{SLOTS.map((sl) => { const it = u.eq[sl]; return <div key={sl} className={cn("e", it && "lv" + it.lv)} title={it ? ITEMS[it.id].name : ""}>{it && <img src={iconURL(it.id)} alt="" />}</div>; })}</div>
              <div className="st"><span>УРН <b>{Math.round(s.dmg)}</b></span><span>СКР <b>{Math.round(s.spd)}</b></span><span>БРН <b>{Math.round(s.armor * 100)}%</b></span><span>КРТ <b>{Math.round(s.crit * 100)}%</b></span></div>
            </div>
          </div>
        );
      })}
      <div className="card hire" onClick={() => openModal("hire")}><b>+ НАНЯТЬ</b><small>банда {al}/{r.limit}</small></div>
    </footer>
  );
}
void closeModal;
