/**
 * Large-board initialization overlay (PRD 3.13.1–3.13.2, US-029).
 *
 * Game.initializeBoard() is synchronous, so there is no real intermediate
 * progress to report. Rather than animating a fake percentage before the
 * work starts (as before), the overlay shows an indeterminate bar while the
 * board is being populated and only reports 100% once it actually finished.
 */
export interface ProgressElements {
  overlay: HTMLElement | null;
  bar: HTMLElement | null;
  text: HTMLElement | null;
}

export const LARGE_BOARD_SIDE = 50;

export function isLargeBoard(width: number, height: number): boolean {
  return width > LARGE_BOARD_SIDE || height > LARGE_BOARD_SIDE;
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });

export async function runWithProgress(
  work: () => void,
  large: boolean,
  elements: ProgressElements,
  t: (key: string, ...args: (string | number)[]) => string,
  frame: () => Promise<void> = nextFrame,
): Promise<void> {
  const { overlay, bar, text } = elements;
  if (!large || !overlay) {
    work();
    return;
  }

  overlay.classList.add('active');
  overlay.setAttribute('aria-busy', 'true');
  bar?.classList.add('indeterminate');
  bar?.style.setProperty('width', '100%');
  if (text) text.textContent = t('init.working');

  // Let the browser paint the overlay before the synchronous work blocks it.
  await frame();
  await frame();

  try {
    work();
    bar?.classList.remove('indeterminate');
    if (text) text.textContent = t('init.spawning', 100);
    await frame();
  } finally {
    overlay.classList.remove('active');
    overlay.removeAttribute('aria-busy');
    bar?.classList.remove('indeterminate');
  }
}
