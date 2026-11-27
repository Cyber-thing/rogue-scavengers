export const MENU_SUBTITLE = "scavenger kingdom - sector west-1";

export const MENU_TIMING = {
  explosionAtMs: 380,
  explosionDurationMs: 560,
  typeStartMs: 900,
  typeCharMs: 32,
  buttonsAtMs: 2050,
} as const;

export interface MenuIntroState {
  showTitle: boolean;
  explosionTriggered: boolean;
  explosionActive: boolean;
  explosionProgress: number;
  typedCount: number;
  typedText: string;
  typingStarted: boolean;
  typingDone: boolean;
  showButtons: boolean;
  complete: boolean;
}

export function getMenuIntroState(elapsedMs: number, reducedMotion = false): MenuIntroState {
  const totalChars = MENU_SUBTITLE.length;
  if (reducedMotion) {
    return {
      showTitle: true,
      explosionTriggered: false,
      explosionActive: false,
      explosionProgress: 1,
      typedCount: totalChars,
      typedText: MENU_SUBTITLE,
      typingStarted: true,
      typingDone: true,
      showButtons: true,
      complete: true,
    };
  }

  const t = Math.max(0, elapsedMs);
  const explosionTriggered = t >= MENU_TIMING.explosionAtMs;
  const explosionElapsed = Math.max(0, t - MENU_TIMING.explosionAtMs);
  const explosionProgress = explosionTriggered
    ? Math.min(1, explosionElapsed / MENU_TIMING.explosionDurationMs)
    : 0;
  const explosionActive = explosionTriggered && explosionProgress < 1;

  const typingStarted = t >= MENU_TIMING.typeStartMs;
  const typedCount = typingStarted
    ? Math.min(totalChars, Math.floor((t - MENU_TIMING.typeStartMs) / MENU_TIMING.typeCharMs) + 1)
    : 0;
  const typedText = MENU_SUBTITLE.slice(0, typedCount);
  const typingDone = typedCount >= totalChars;

  const showButtons = t >= MENU_TIMING.buttonsAtMs;
  const complete = showButtons && typingDone && !explosionActive;

  return {
    showTitle: explosionTriggered,
    explosionTriggered,
    explosionActive,
    explosionProgress,
    typedCount,
    typedText,
    typingStarted,
    typingDone,
    showButtons,
    complete,
  };
}
