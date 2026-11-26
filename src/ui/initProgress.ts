/**
 * Large-board initialization overlay (PRD 3.13.1–3.13.2, US-029, design F7).
 *
 * `work` receives a `report(fraction)` callback. Async work (for example
 * Game.initializeBoardAsync with `onProgress: report`) drives a real,
 * determinate bar: its width, `aria-valuenow` on the role="progressbar"
 * element and the "Spawning creatures: N%" text, which only changes when the
 * integer percentage changes (so screen readers are not flooded). Work that
 * never reports (the synchronous initializeBoard) shows an indeterminate bar
 * until it finishes. The overlay is always removed, even when work throws.
 */
export interface ProgressElements {
  overlay: HTMLElement | null;
  bar: HTMLElement | null;
  text: HTMLElement | null;
  /** The role="progressbar" element; defaults to the closest one around `bar`. */
  progressbar?: HTMLElement | null;
}

export type ReportProgress = (fraction: number) => void;
export type ProgressWork = (report: ReportProgress) => void | Promise<void>;
type Translate = (key: string, ...args: (string | number)[]) => string;

export const LARGE_BOARD_SIDE = 50;

export function isLargeBoard(width: number, height: number): boolean {
  return width > LARGE_BOARD_SIDE || height > LARGE_BOARD_SIDE;
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });

const noop: ReportProgress = () => {};

/** Fraction (any number) → integer percentage in 0..100; NaN counts as 0. */
export function toPercent(fraction: number): number {
  if (!Number.isFinite(fraction)) return fraction === Number.POSITIVE_INFINITY ? 100 : 0;
  return Math.round(Math.min(1, Math.max(0, fraction)) * 100);
}

export async function runWithProgress(
  work: ProgressWork,
  large: boolean,
  elements: ProgressElements,
  t: Translate,
  frame: () => Promise<void> = nextFrame,
): Promise<void> {
  const { overlay, bar, text } = elements;
  if (!large || !overlay) {
    await work(noop);
    return;
  }

  const progressbar = elements.progressbar ?? bar?.closest<HTMLElement>('[role="progressbar"]') ?? null;
  let shownPercent = -1;

  const show = (percent: number): void => {
    if (percent === shownPercent) return;
    shownPercent = percent;
    bar?.classList.remove('indeterminate');
    bar?.style.setProperty('width', `${percent}%`);
    progressbar?.setAttribute('aria-valuenow', String(percent));
    if (text) text.textContent = t('init.spawning', percent);
  };

  overlay.classList.add('active');
  overlay.setAttribute('aria-busy', 'true');
  progressbar?.setAttribute('aria-valuemin', '0');
  progressbar?.setAttribute('aria-valuemax', '100');
  progressbar?.removeAttribute('aria-valuenow'); // indeterminate until the first report
  bar?.classList.add('indeterminate');
  bar?.style.setProperty('width', '100%');
  if (text) text.textContent = t('init.working');

  try {
    // Let the browser paint the overlay before any synchronous work blocks it.
    await frame();
    await frame();
    await work((fraction) => show(toPercent(fraction)));
    show(100);
    await frame();
  } finally {
    overlay.classList.remove('active');
    overlay.removeAttribute('aria-busy');
    bar?.classList.remove('indeterminate');
  }
}
