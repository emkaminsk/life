import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleKeydown, type KeyboardDeps } from '../../src/ui/keyboard';
import { GameControls, type ControlButtons } from '../../src/ui/controls';

interface FakeGame {
  isRunning: boolean;
  running: () => boolean;
  start: () => void;
  pause: () => void;
  step: () => void;
  stepRounds: (n: number) => void;
}

function makeGame(running = false) {
  const game: FakeGame = {
    isRunning: running,
    running: vi.fn(() => game.isRunning),
    start: vi.fn(() => {
      game.isRunning = true;
    }),
    pause: vi.fn(() => {
      game.isRunning = false;
    }),
    step: vi.fn(),
    stepRounds: vi.fn(),
  };
  return game;
}

function makeButtons(): ControlButtons {
  const mk = (id: string) => {
    const b = document.createElement('button');
    b.id = id;
    document.body.appendChild(b);
    return b;
  };
  return {
    pause: mk('pauseBtn'),
    step: mk('stepBtn'),
    runFive: mk('runFiveBtn'),
    run: mk('runBtn'),
    reset: mk('resetBtn'),
    finish: mk('finishBtn'),
  };
}

function key(code: string, target: EventTarget | null = document.body) {
  return { code, key: code === 'Space' ? ' ' : code, target, preventDefault: vi.fn() };
}

describe('handleKeydown', () => {
  let game: ReturnType<typeof makeGame>;
  let buttons: ControlButtons;
  let controls: GameControls;
  let modal: { open: boolean; isOpen: () => boolean; close: () => void };
  let deps: KeyboardDeps;

  beforeEach(() => {
    document.body.innerHTML = '';
    game = makeGame();
    buttons = makeButtons();
    controls = new GameControls(game, buttons, (k) => k);
    modal = {
      open: false,
      isOpen: () => modal.open,
      close: vi.fn<[], void>(() => {
        modal.open = false;
      }),
    };
    deps = { game, controls, modal };
  });

  function startRunning() {
    controls.begin();
    expect(game.running()).toBe(true);
  }

  it('Space toggles pause and resume', () => {
    startRunning();
    const e = key('Space');
    expect(handleKeydown(e, deps)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(controls.getState()).toBe('paused');

    handleKeydown(key('Space'), deps);
    expect(game.start).toHaveBeenCalledTimes(2); // begin + resume
    expect(controls.getState()).toBe('running');
  });

  it('Space does nothing while no game is active', () => {
    handleKeydown(key('Space'), deps);
    expect(game.start).not.toHaveBeenCalled();
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('Space on a focused button is left to the button (no double fire)', () => {
    startRunning();
    const e = key('Space', buttons.pause);
    expect(handleKeydown(e, deps)).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('ArrowRight steps one round only when paused', () => {
    startRunning();
    handleKeydown(key('ArrowRight'), deps);
    expect(game.step).not.toHaveBeenCalled();

    controls.pause();
    handleKeydown(key('ArrowRight'), deps);
    expect(game.step).toHaveBeenCalledTimes(1);
    expect(controls.getState()).toBe('stepping');

    // A second press while the step is still executing is ignored.
    handleKeydown(key('ArrowRight'), deps);
    expect(game.step).toHaveBeenCalledTimes(1);
  });

  it('ArrowUp calls stepRounds(5) only when paused', () => {
    startRunning();
    handleKeydown(key('ArrowUp'), deps);
    expect(game.stepRounds).not.toHaveBeenCalled();

    controls.pause();
    handleKeydown(key('ArrowUp'), deps);
    expect(game.stepRounds).toHaveBeenCalledTimes(1);
    expect(game.stepRounds).toHaveBeenCalledWith(5);
    expect(game.step).not.toHaveBeenCalled();
  });

  it.each(['ArrowDown', 'ArrowLeft'])('%s pauses a running simulation', (code) => {
    startRunning();
    handleKeydown(key(code), deps);
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(controls.getState()).toBe('paused');

    // Already paused: no further pause calls
    handleKeydown(key(code), deps);
    expect(game.pause).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the open modal', () => {
    modal.open = true;
    const e = key('Escape');
    expect(handleKeydown(e, deps)).toBe(true);
    expect(modal.close).toHaveBeenCalled();
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('ignores shortcuts while the modal is open', () => {
    startRunning();
    modal.open = true;
    handleKeydown(key('Space'), deps);
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('ignores shortcuts while another dialog blocks them', () => {
    startRunning();
    handleKeydown(key('Space'), { ...deps, isBlocked: () => true });
    expect(game.pause).not.toHaveBeenCalled();
  });

  it.each([
    ['input', () => document.createElement('input')],
    ['textarea', () => document.createElement('textarea')],
    ['select', () => document.createElement('select')],
  ])('ignores keys typed in a %s', (_name, make) => {
    startRunning();
    const el = make();
    document.body.appendChild(el);
    for (const code of ['Space', 'ArrowDown', 'ArrowLeft']) {
      const e = key(code, el);
      expect(handleKeydown(e, deps)).toBe(false);
      expect(e.preventDefault).not.toHaveBeenCalled();
    }
    expect(game.pause).not.toHaveBeenCalled();
  });

  it('ignores modified keys (e.g. Ctrl+ArrowUp)', () => {
    startRunning();
    controls.pause();
    handleKeydown({ ...key('ArrowUp'), ctrlKey: true }, deps);
    expect(game.stepRounds).not.toHaveBeenCalled();
  });

  it('works with a real KeyboardEvent dispatched on the document', () => {
    startRunning();
    const listener = (e: KeyboardEvent) => handleKeydown(e, deps);
    document.addEventListener('keydown', listener);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
    document.removeEventListener('keydown', listener);
    expect(controls.getState()).toBe('paused');
  });
});
