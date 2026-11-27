import { useEffect, useRef, useState } from "react";
import { BAL, DL } from "../game/consts";
import { BIZ, CLASSES } from "../game/content";
import { aliveUnits, meta } from "../game/state";
import { bizBuy, closeModal, hire, openModal, showMenu, startRun } from "../game/economy";
import { BIZ_ORDER, BizId, STREET_H, STREET_W, drawBizStreet, hitTestBizPlot } from "../game/art/bizStreet";
import portraitRat from "../assets/images/portrait_rat_1795772298965.jpg";
import portraitHulk from "../assets/images/portrait_hulk_1795772297781.jpg";
import portraitRunner from "../assets/images/portrait_runner_1795772299291.jpg";
import portraitCutter from "../assets/images/portrait_cutter_1795772300358.jpg";
import { Btn, Modal, useGame } from "./common";
import { cn } from "../utils/cn";

const CLASS_PORTRAITS: Record<string, string> = {
  rat: portraitRat,
  hulk: portraitHulk,
  runner: portraitRunner,
  cutter: portraitCutter,
};

/* --------------------------------- ПОРТРЕТ КЛАССА --------------------------------- */
function ClassPortrait({ cls, name }: { cls: string; name: string }) {
  const [broken, setBroken] = useState(false);
  const src = CLASS_PORTRAITS[cls];
  if (!src || broken) {
    return (
      <div className="class-portrait class-portrait-fallback" role="img" aria-label={name}>
        <span>{name}</span>
      </div>
    );
  }
  return (
    <div className="class-portrait-frame">
      <img
        src={src}
        alt={`Портрет класса ${name}`}
        width={144}
        height={180}
        className="class-portrait"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

/* ---------------------------------- МОДАЛКИ ---------------------------------- */
function HireModal() {
  const G = useGame(), r = G.run, al = aliveUnits().length;
  return (
    <Modal wide>
      <h2>ВЕРБОВКА БОЙЦОВ</h2>
      <div className="mod-line">REP: <b className="text-[#e0a43a]">{r.rep}</b> · Банда: <b>{al}/{r.limit}</b> <span className="dim"> — REP дают вскрытые точки</span></div>
      <div className="tiles g4">
        {Object.keys(CLASSES).map((k) => {
          const C = CLASSES[k], locked = C.needClinic && r.biz.clinic < C.needClinic;
          return (
            <div key={k} className="tile">
              <div className="tile-tag">{C.tag}</div>
              <ClassPortrait cls={k} name={C.name} />
              <h3>{C.name}</h3>
              <p>{C.desc}</p>
              <p className="lore">{C.lore}</p>
              <p className="statline">HP {C.hp} · УРН {C.dmg} · СКР {C.spd}<br />{C.ranged ? "Дальний бой" : C.chain ? "Хлыст ×3" : "Ближний бой"} · БРН {Math.round(C.armor * 100)}%</p>
              <Btn variant="amber" disabled={!!locked || al >= r.limit || r.rep < C.cost} onClick={() => hire(k)}>{locked ? "Нужна клиника Lv.1" : `Нанять · ${C.cost} REP`}</Btn>
            </div>
          );
        })}
      </div>
      <div className="mrow"><Btn onClick={closeModal}>Закрыть</Btn></div>
    </Modal>
  );
}

function BizModal() {
  const G = useGame();
  const [selectedId, setSelectedId] = useState<BizId>("laundry");
  const [hoveredId, setHoveredId] = useState<BizId | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(selectedId);
  const hovRef = useRef(hoveredId);
  selRef.current = selectedId;
  hovRef.current = hoveredId;

  useEffect(() => {
    let raf = 0;
    const started = performance.now();
    const renderStreet = (now: number) => {
      raf = requestAnimationFrame(renderStreet);
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      drawBizStreet(ctx, (now - started) / 1000, meta.biz, selRef.current, hovRef.current);
    };
    raf = requestAnimationFrame(renderStreet);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pickAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return hitTestBizPlot(nx, ny);
  };

  const B = BIZ[selectedId];
  const lv = meta.biz[selectedId] || 0;
  const cost = lv < 3 ? BAL.UPG[lv] : 0;

  return (
    <Modal wide>
      <h2>ВАШИ БИЗНЕСЫ</h2>
      <div className="mod-line">
        Отмытые деньги: <b className="text-[#e0a43a] text-[17px]">{DL}{meta.laundered}</b>
        <span className="dim"> — кликни по зданию на улице, чтобы купить или улучшить (действует со следующего забега)</span>
      </div>

      <div className="biz-street-wrap">
        <canvas
          ref={canvasRef}
          width={STREET_W}
          height={STREET_H}
          data-testid="biz-street-canvas"
          className={cn("biz-street-cv", hoveredId && "cursor-pointer")}
          onMouseMove={(e) => setHoveredId(pickAt(e))}
          onMouseLeave={() => setHoveredId(null)}
          onClick={(e) => {
            const hit = pickAt(e);
            if (hit) setSelectedId(hit);
          }}
        />
      </div>

      <div className="biz-tabs" role="tablist" aria-label="Выбор здания">
        {BIZ_ORDER.map((id) => {
          const item = BIZ[id];
          const curLv = meta.biz[id] || 0;
          const active = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn("biz-tab", active && "active", curLv === 0 && "inactive")}
              onClick={() => setSelectedId(id)}
            >
              <span className="biz-tab-name">{item.name}</span>
              <span className="biz-tab-lv">{curLv === 0 ? "Закрыто" : `Lv.${curLv}/3`}</span>
            </button>
          );
        })}
      </div>

      <div className="biz-detail">
        <div className="biz-detail-info">
          <div className="biz-detail-head">
            <h3>{B.name}</h3>
            <div className="pips">{[0, 1, 2].map((i) => <i key={i} className={i < lv ? "on" : ""} />)}</div>
            <span className="biz-stage-tag">{lv === 0 ? "Участок закрыт" : `Уровень ${lv}/3`}</span>
          </div>
          <p className="lore">{B.blurb}</p>
          <p className="biz-eff">{lv === 0 ? "Здание пока не открыто на улице." : B.eff(lv)}</p>
          <p className="nx">{lv < 3 ? `▶ Следующий уровень: ${B.eff(lv + 1)}` : "▶ МАКСИМАЛЬНЫЙ УРОВЕНЬ"}</p>
        </div>
        <div className="biz-detail-act">
          {lv < 3 ? (
            <Btn variant="amber" className="btn-xl" disabled={meta.laundered < cost} onClick={() => bizBuy(selectedId)}>
              {lv === 0 ? `Купить ${DL}${cost}` : `Улучшить ${DL}${cost}`}
            </Btn>
          ) : (
            <Btn disabled>Максимум</Btn>
          )}
        </div>
      </div>

      <div className="mrow">
        {G.mode === "results" ? <><Btn variant="amber" onClick={startRun}>Новый забег</Btn><Btn onClick={showMenu}>В меню</Btn></> : <Btn variant="amber" onClick={closeModal}>Закрыть</Btn>}
      </div>
    </Modal>
  );
}

function HelpModal() {
  return (
    <Modal>
      <h2>КАК ИГРАТЬ</h2>
      <div className="help">
        <p>Банда Scavenger Kingdom сама идёт по корпоративному кварталу, дерётся с охраной, вскрывает точки и ломает всё подряд. Ты управляешь составом, снаряжением и рискованными решениями. Мирные жители разбегаются от бунта — им лучше не мешаться под ногами.</p>
        <p><b>Цикл:</b> бой → вскрытие точки (¥ над дверью) → REP → найм → экипировка → рост тревоги WARDEN → уход с добычей или задержание → отмытые деньги → бизнесы.</p>
        <p>• Клик по бойцу — выбрать (1–5). Команды: <b>A</b> атака, <b>L</b> вскрыть, <b>F</b> за мной, <b>Q</b> авто. Клик по врагу / объекту / точке отдаёт приказ выбранному бойцу.</p>
        <p>• Предмет: клик в рюкзаке, затем клик на бойца (или на такой же предмет — слить). Одинаковые предметы одного уровня объединяются до Lv.3.</p>
        <p>• Рандомайзер Хаос даёт кредиты, предметы и баффы, но в среднем забирает больше, чем отдаёт. Цена растёт каждые 3 спина.</p>
        <p>• Тревога растёт от пути, взломов, поломок и убийств агентов. Ур.2 — службы безопасности Intercell, ур.4 — штурмовики Slayer. Враги крепнут со временем.</p>
        <p>• «Уйти с добычей» — безопасный выход. Задержание (все бойцы выбиты) конфискует часть добычи. Отмыто = дистанция×0.5 + кредиты×0.25 + убийства×2.</p>
        <p>• Пробел — пауза, M — звук, кнопка 1x/2x — скорость.</p>
      </div>
      <div className="mrow"><Btn variant="amber" onClick={closeModal}>Понятно</Btn></div>
    </Modal>
  );
}
function ResultsModal({ data }: { data: any }) {
  const G = useGame(), r = G.run, ar = data.type === "arrest", L = data.L;
  return (
    <Modal>
      <h2 className={cn(ar && "bad")}>{ar ? "ЗАДЕРЖАНЫ СБ" : "ВЫ УШЛИ С ДОБЫЧЕЙ"}</h2>
      <div className="dim">{ar ? "Банду накрыла служба безопасности. Часть добычи конфискована." : "Банда растворилась в переулках, пока WARDEN считал потери."}</div>
      <div className="res">
        <span>Дистанция</span><span>{r.distM}м ×0.5 = {Math.floor(L.d)}</span>
        <span>Награблено</span><span>{DL}{r.cashLooted} ×0.25{ar ? ` ×${Math.round(L.keep * 100)}% (задержание)` : ""} = {Math.floor(L.l)}</span>
        <span>Побеждено охраны</span><span>{r.kills} ×2 = {L.k}</span>
        <span>Вскрыто точек</span><span>{r.loots}</span>
        <span className="tot">ОТМЫТО</span><span className="tot">+{DL}{L.total}</span>
        <span>Всего отмыто</span><span>{DL}{meta.laundered}</span>
      </div>
      <div className="mrow"><Btn onClick={() => openModal("biz")}>Бизнесы</Btn><Btn variant="amber" onClick={startRun}>Новый забег</Btn><Btn onClick={showMenu}>В меню</Btn></div>
    </Modal>
  );
}
export function ModalHost() {
  const G = useGame(); const m = G.modal; if (!m) return null;
  switch (m.type) {
    case "hire": return <HireModal />;
    case "biz": return <BizModal />;
    case "help": return <HelpModal />;
    case "results": return <ResultsModal data={m.data} />;
  }
  return null;
}
