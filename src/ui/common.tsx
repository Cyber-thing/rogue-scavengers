import { useSyncExternalStore, type ReactNode } from "react";
import { G, getVer, subscribe } from "../game/state";
import { cn } from "../utils/cn";

export function useGame() {
  useSyncExternalStore(subscribe, getVer);
  return G;
}

export function Btn(p: { children: ReactNode; onClick?: () => void; variant?: "amber" | "red" | "cyan" | "ghost"; disabled?: boolean; small?: boolean; on?: boolean; grow?: boolean; title?: string; className?: string; id?: string; "data-start"?: string }) {
  return (
    <button id={p.id} title={p.title} disabled={p.disabled} onClick={p.onClick} data-start={p["data-start"]}
      className={cn("btn", p.variant && "btn-" + p.variant, p.small && "btn-sm", p.on && "btn-on", p.grow && "grow", p.className)}>
      {p.children}
    </button>
  );
}

export function Panel(p: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tag?: string }) {
  return (
    <section className={cn("panel", p.className)}>
      <h4><span className="h-tag">{p.tag || "//"}</span><span className="h-title">{p.title}</span><span className="h-right">{p.right}</span></h4>
      {p.children}
    </section>
  );
}

export function Modal(p: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-back">
      <div className={cn("modal-box", p.wide && "wide")}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        {p.children}
      </div>
    </div>
  );
}
