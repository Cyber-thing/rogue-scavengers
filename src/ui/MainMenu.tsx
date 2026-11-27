import { useEffect, useRef, useState } from "react";
import { getMenuIntroState, MENU_SUBTITLE, MENU_TIMING } from "../game/menuIntro";
import { openModal, resetProgress, startRun } from "../game/economy";
import { meta } from "../game/state";
import { Btn } from "./common";
import keyart from "../assets/keyart.jpg";
import { cn } from "../utils/cn";

interface BlastParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "spark" | "smoke" | "ember";
  color: string;
}

const FW = 480;
const FH = 270;
const BLAST_X = 240;
const BLAST_Y = 48;

export function MainMenu() {
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  const [elapsedMs, setElapsedMs] = useState(() =>
    reducedMotion ? MENU_TIMING.buttonsAtMs + 600 : 0,
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const skipOffsetRef = useRef(0);
  const blastedRef = useRef(false);

  const hasProgress =
    meta.runs > 0 ||
    meta.laundered > 0 ||
    Object.values(meta.biz || {}).some((v: any) => (v | 0) > 0);

  const intro = getMenuIntroState(elapsedMs, reducedMotion);

  // Confirm reset auto-cancels after 3s
  useEffect(() => {
    if (!confirmReset) return;
    const id = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirmReset]);

  // Intro timeline + pixel explosion & ambient embers canvas loop
  useEffect(() => {
    if (reducedMotion) return;

    const particles: BlastParticle[] = [];
    let shockAge = -1;
    let shakeAmt = 0;
    let raf = 0;
    const t0 = performance.now();
    let prev = t0;

    const spawnExplosion = () => {
      shockAge = 0;
      shakeAmt = 6.5;
      const sparkCols = ["#ffffff", "#fff3b8", "#f4c869", "#e0a43a", "#ff7738", "#d94b2b"];
      const smokeCols = ["#39424d", "#242b33", "#151a20"];

      // Core smoke puffs
      for (let i = 0; i < 22; i++) {
        const a = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.4;
        const sp = 22 + Math.random() * 54;
        particles.push({
          x: BLAST_X + (Math.random() - 0.5) * 56,
          y: BLAST_Y + (Math.random() - 0.5) * 14,
          vx: Math.cos(a) * sp * 1.4,
          vy: Math.sin(a) * sp * 0.65 - 8,
          life: 0,
          maxLife: 0.48 + Math.random() * 0.42,
          size: 4 + Math.floor(Math.random() * 5),
          kind: "smoke",
          color: smokeCols[i % smokeCols.length],
        });
      }

      // Bright pixel sparks & debris
      for (let i = 0; i < 84; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 55 + Math.random() * 195;
        particles.push({
          x: BLAST_X + (Math.random() - 0.5) * 76,
          y: BLAST_Y + (Math.random() - 0.5) * 14,
          vx: Math.cos(a) * sp * 1.35,
          vy: Math.sin(a) * sp * 0.72 - 14,
          life: 0,
          maxLife: 0.34 + Math.random() * 0.55,
          size: Math.random() < 0.32 ? 2 : 1,
          kind: "spark",
          color: sparkCols[Math.floor(Math.random() * sparkCols.length)],
        });
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      const curElapsed = now - t0 + skipOffsetRef.current;
      setElapsedMs(curElapsed);

      if (!blastedRef.current && curElapsed >= MENU_TIMING.explosionAtMs) {
        blastedRef.current = true;
        spawnExplosion();
      }

      // Apply impact micro-shake to screen wrapper
      if (screenRef.current) {
        if (shakeAmt > 0.15) {
          const sx = (Math.random() - 0.5) * 2 * shakeAmt;
          const sy = (Math.random() - 0.5) * 2 * shakeAmt;
          screenRef.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
          shakeAmt = Math.max(0, shakeAmt - dt * 24);
        } else if (screenRef.current.style.transform) {
          screenRef.current.style.transform = "";
        }
      }

      // Gentle ambient embers after blast
      if (blastedRef.current && Math.random() < dt * 7 && particles.length < 140) {
        particles.push({
          x: Math.random() * FW,
          y: FH + 4,
          vx: (Math.random() - 0.5) * 14,
          vy: -(16 + Math.random() * 24),
          life: 0,
          maxLife: 3.2 + Math.random() * 2.4,
          size: 1,
          kind: "ember",
          color: Math.random() < 0.5 ? "#f4c869" : "#e07a38",
        });
      }

      const c = canvasRef.current;
      if (!c) return;
      const g = c.getContext("2d");
      if (!g) return;
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, FW, FH);

      // Draw shockwave + flash burst
      if (shockAge >= 0) {
        shockAge += dt;
        const p = shockAge / 0.52;
        if (p < 1) {
          if (p < 0.25) {
            const flashAlpha = (1 - p / 0.25) * 0.42;
            g.fillStyle = `rgba(255, 224, 150, ${flashAlpha.toFixed(3)})`;
            g.fillRect(0, 0, FW, FH);
          }

          // Expanding horizontal blast streak
          if (p < 0.45) {
            const w = Math.round(140 + p * 480);
            const h = Math.max(1, Math.round((1 - p / 0.45) * 8));
            g.fillStyle = `rgba(255, 240, 190, ${((1 - p / 0.45) * 0.85).toFixed(3)})`;
            g.fillRect(Math.round(BLAST_X - w / 2), Math.round(BLAST_Y - h / 2), w, h);
          }

          // Pixel shockwave ring
          const r = Math.round(8 + p * 128);
          const ry = Math.round(r * 0.46);
          g.strokeStyle = `rgba(244, 200, 105, ${((1 - p) * 0.8).toFixed(3)})`;
          g.lineWidth = p < 0.3 ? 2 : 1;
          g.beginPath();
          g.ellipse(BLAST_X, BLAST_Y, r, ry, 0, 0, Math.PI * 2);
          g.stroke();
        } else {
          shockAge = -1;
        }
      }

      // Update & render pixel particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const k = pt.life / pt.maxLife;
        if (pt.kind === "spark") {
          pt.vx *= 1 - dt * 2.1;
          pt.vy += 120 * dt;
        } else if (pt.kind === "smoke") {
          pt.vx *= 1 - dt * 3.0;
          pt.vy *= 1 - dt * 2.4;
          pt.vy -= 8 * dt;
        } else {
          pt.vx += Math.sin(pt.life * 3 + pt.y * 0.08) * dt * 6;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;

        g.globalAlpha = pt.kind === "ember" ? (1 - k) * 0.55 : Math.max(0, 1 - k * k);
        g.fillStyle = pt.color;
        g.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
      }
      g.globalAlpha = 1;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const skipIntro = () => {
    if (!intro.complete && skipOffsetRef.current === 0) {
      skipOffsetRef.current = MENU_TIMING.buttonsAtMs + 400;
      setElapsedMs((prev) => Math.max(prev, MENU_TIMING.buttonsAtMs + 400));
    }
  };

  return (
    <main
      ref={screenRef}
      className="menu-screen"
      onClick={skipIntro}
    >
      <img
        src={keyart}
        alt="Rogue Scavengers — киберпанк-арена"
        referrerPolicy="no-referrer"
        className="menu-art"
      />
      <div className="menu-shade" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        width={FW}
        height={FH}
        className="menu-fx"
        aria-hidden="true"
      />

      <div className="menu-hero">
        <h1 className={cn("menu-title", intro.showTitle && "is-boom")}>
          <span>ROGUE</span> SCAVENGERS
        </h1>
        <p
          className={cn("menu-typed", intro.typingStarted && "is-visible")}
          aria-label={MENU_SUBTITLE}
        >
          <span>{intro.typedText}</span>
          {intro.typingStarted && (
            <span
              className={cn("menu-cursor", intro.typingDone && "is-idle")}
              aria-hidden="true"
            />
          )}
        </p>
      </div>

      <nav
        aria-label="Главное меню"
        className={cn("menu-actions", intro.showButtons && "is-visible")}
        onClick={(e) => e.stopPropagation()}
      >
        <Btn
          variant="amber"
          className="btn-xl"
          data-start="true"
          onClick={startRun}
        >
          ▶ Новый забег
        </Btn>
        <Btn onClick={() => openModal("biz")}>Бизнесы</Btn>
        <Btn onClick={() => openModal("help")}>Как играть</Btn>
        {hasProgress && (
          <Btn
            small
            variant="ghost"
            onClick={() => {
              if (confirmReset) {
                setConfirmReset(false);
                resetProgress();
              } else {
                setConfirmReset(true);
              }
            }}
          >
            {confirmReset ? "Точно сбросить?" : "Сбросить прогресс"}
          </Btn>
        )}
      </nav>
    </main>
  );
}
