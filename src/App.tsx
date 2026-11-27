import { useEffect } from "react";
import { initGame } from "./game/engine";
import { ArenaView, Cards, Sidebar, TopBar } from "./ui/hud";
import { MainMenu } from "./ui/MainMenu";
import { ModalHost } from "./ui/modals";
import { useGame } from "./ui/common";

export default function App() {
  const G = useGame();
  useEffect(() => { initGame(); }, []);
  if (!G.ready || !G.run)
    return (
      <div className="loading">
        <div className="loading-title">ROGUE <b>SCAVENGERS</b></div>
        <div className="loading-bar"><i /></div>
        <div className="loading-sub">ПОДКЛЮЧЕНИЕ К СЕТИ · WEST-1 · DIAL-IN…</div>
      </div>
    );
  if (G.mode === "menu")
    return (
      <>
        <MainMenu />
        <ModalHost />
      </>
    );
  return (
    <div className="app">
      <TopBar />
      <ArenaView />
      <Sidebar />
      <Cards />
      <ModalHost />
    </div>
  );
}
