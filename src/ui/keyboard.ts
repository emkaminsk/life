/**
 * Global keyboard shortcuts (PRD 3.8.7, US-020):
 *   Space        pause / resume
 *   ArrowRight   advance 1 round (when paused)
 *   ArrowUp      advance 5 rounds (when paused)
 *   ArrowDown    pause
 *   ArrowLeft    pause
 *   Escape       close the rules modal
 */

export interface KeyboardControls {
  togglePause(): void;
  pause(): void;
  step(): void;
  stepFive(): void;
  canStep(): boolean;
}

export interface KeyboardModal {
  isOpen(): boolean;
  close(): void;
}

export interface KeyboardDeps {
  game: { running(): boolean };
  controls: KeyboardControls;
  modal: KeyboardModal;
  /** Another blocking dialog (e.g. the config panel) is showing. */
  isBlocked?: () => boolean;
}

type KeyEventLike = Pick<KeyboardEvent, 'code' | 'key' | 'target' | 'preventDefault'> &
  Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>>;

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/** Elements that natively activate on Space – handling Space there too would double-fire. */
function activatesOnSpace(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLButtonElement ||
    target instanceof HTMLAnchorElement ||
    target.getAttribute('role') === 'button' ||
    target.getAttribute('role') === 'tab'
  );
}

/**
 * Handle one keydown. Returns true when the key was consumed (and
 * preventDefault was called).
 */
export function handleKeydown(e: KeyEventLike, deps: KeyboardDeps): boolean {
  const { game, controls, modal } = deps;
  const code = e.code || e.key;

  if (code === 'Escape' && modal.isOpen()) {
    e.preventDefault();
    modal.close();
    return true;
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (isTextEntry(e.target)) return false;
  if (modal.isOpen() || deps.isBlocked?.()) return false;

  switch (code) {
    case 'Space':
    case ' ':
      if (activatesOnSpace(e.target)) return false;
      e.preventDefault();
      controls.togglePause();
      return true;

    case 'ArrowRight':
      e.preventDefault();
      if (!game.running() && controls.canStep()) controls.step();
      return true;

    case 'ArrowUp':
      e.preventDefault();
      if (!game.running() && controls.canStep()) controls.stepFive();
      return true;

    case 'ArrowDown':
    case 'ArrowLeft':
      e.preventDefault();
      if (game.running()) controls.pause();
      return true;

    default:
      return false;
  }
}
