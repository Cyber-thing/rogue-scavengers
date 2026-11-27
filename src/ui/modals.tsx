import { useEffect, useRef } from "react";
import { BAL, DL } from "../game/consts";
import { BIZ, CLASSES, LORE } from "../game/content";
import { aliveUnits, meta } from "../game/state";
import { bizBuy, closeModal, hire, openModal, resetProgress, showMenu, startRun } from "../game/economy";
import { bizIcon } from "../game/art/props";
import { getSprite, OX, OY } from "../game/art/characters";
import { Btn, Modal, useGame } from "./common";
import keyart from "../assets/keyart.jpg";
import { cn } from "../utils/cn";

/* --------------------------------- ГЛАВНОЕ МЕНЮ --------------------------------- */
export function MainMenu() {
  return (
    <div className="menu">
      <img src={keyart} alt="" className="menu-art" />
      <div className="menu-shade" />
      <div className="menu-top">
        <div className="menu-kicker">SCAVENGER KINGDOM · SECTOR WEST-1</div>
        <h1 className="menu-title"><span>ROGUE</span> SCAVENGERS</h1>
        <div className="menu-sub">{LORE.sub}</div>
      </div>
      <div className="menu-bottom">
        <p className="menu-lore">{LORE.intro}</p>
        <div className="menu-stats">
          <span>Отмыто: <b>{DL}{meta.laundered}</b></span><span>Лучшая дистанция: <b>{meta.bestDist}м</b></span><span>Забегов: <b>{meta.runs}</b></span>
        </div>
        <div className="menu-btns">
          <Btn variant="amber" className="btn-xl" onClick={startRun}>▶ Новый забег</Btn>
          <Btn onClick={() => openModal("biz")}>Бизнесы</Btn>
          <Btn onClick={() => openModal("help")}>Как играть</Btn>
          <Btn small variant="ghost" onClick={() => { if (confirm("Сбросить весь прогресс (бизнесы и отмытые деньги)?")) resetProgress(); }}>Сбросить прогресс</Btn>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- ПОРТРЕТ КЛАССА --------------------------------- */
function ClassPortrait({ cls }: { cls: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const g = c.getContext("2d")!; g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
    g.drawImage(getSprite(cls, "idle", 0, {}, 1, false), OX - 36, OY - 86, 72, 90, 0, 0, 144, 180);
  }, [cls]);
  return <canvas ref={ref} width={144} height={180} className="class-portrait" />;
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
              <ClassPortrait cls={k} />
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
  return (
    <Modal wide>
      <h2>ВАШИ БИЗНЕСЫ</h2>
      <div className="mod-line">Отмытые деньги: <b className="text-[#e0a43a] text-[17px]">{DL}{meta.laundered}</b> <span className="dim"> — улучшения действуют со следующего забега</span></div>
      <div className="tiles g4">
        {Object.keys(BIZ).map((id) => {
          const B = BIZ[id], l = meta.biz[id], cost = l < 3 ? BAL.UPG[l] : 0;
          return (
            <div key={id} className="tile">
              <img src={bizIcon(id, B.sign)} width={192} height={128} alt="" className="biz-img" />
              <h3>{B.name}</h3>
              <p className="lore">{B.blurb}</p>
              <div className="pips">{[0, 1, 2].map((i) => <i key={i} className={i < l ? "on" : ""} />)}</div>
              <p>{B.eff(l)}</p>
              {l < 3 ? <><p className="nx">▶ {B.eff(l + 1)}</p><Btn variant="amber" disabled={meta.laundered < cost} onClick={() => bizBuy(id)}>Улучшить {DL}{cost}</Btn></>
                : <><p className="nx">МАКСИМАЛЬНЫЙ УРОВЕНЬ</p><Btn disabled>Готово</Btn></>}
            </div>
          );
        })}
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
        <p>• Тотализатор даёт кредиты, предметы и баффы, но в среднем забирает больше, чем отдаёт. Цена растёт каждые 3 спина.</p>
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
