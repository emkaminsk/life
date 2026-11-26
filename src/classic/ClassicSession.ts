import type { ClassicConfig, ClassicSession } from './types';

/**
 * W0 stub of the classic Life session: counts generations on a timer without
 * simulating cells (workstream W-C replaces the internals, not the interface).
 */
export function createClassicSession(canvas: HTMLCanvasElement, panel: HTMLElement): ClassicSession {
  let generation = 0;
  let isRunning = false;
  let pendingSteps = 0;
  let speed = 200;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const stop = (): void => {
    isRunning = false;
    pendingSteps = 0;
    clearTimer();
  };

  const schedule = (): void => {
    clearTimer();
    timer = setTimeout(tick, speed);
  };

  function tick(): void {
    timer = null;
    generation++;
    session.onRoundComplete?.();
    if (isRunning) {
      schedule();
    } else if (pendingSteps > 0) {
      pendingSteps--;
      if (pendingSteps > 0) schedule();
      else session.onStepComplete?.();
    }
  }

  const session: ClassicSession = {
    begin(config: ClassicConfig, opts: { startPaused: boolean }): void {
      clearTimer();
      generation = 0;
      pendingSteps = 0;
      isRunning = false;
      canvas.width = config.width;
      canvas.height = config.height;
      if (!opts.startPaused && config.start.kind !== 'draw') session.start();
    },
    end(): void {
      stop();
      generation = 0;
    },
    running: () => isRunning,
    start(): void {
      if (isRunning) return;
      isRunning = true;
      pendingSteps = 0;
      schedule();
    },
    pause(): void {
      if (!isRunning) return;
      isRunning = false;
      clearTimer();
    },
    stop,
    step(): void {
      session.stepRounds(1);
    },
    stepRounds(n: number): void {
      if (isRunning || n <= 0) return;
      pendingSteps = n;
      tick();
    },
    setSpeed(ms: number): void {
      speed = ms;
    },
    fit(): void {},
    getGeneration: () => generation,
    isOver: () => false,
    destroy(): void {
      stop();
      panel.replaceChildren();
    },
  };
  return session;
}
