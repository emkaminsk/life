import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLASSIC_CONFIG } from '../../src/classic/ClassicConfigForm';
import { createClassicSession } from '../../src/classic/ClassicSession';
import type { ClassicConfig, ClassicSession } from '../../src/classic/types';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { Random } from '../../src/utils/Random';
import { installCanvasStub } from '../rendering/canvasStub';

const draw: ClassicConfig = { width: 10, height: 10, rule: 'B3/S23', start: { kind: 'draw' } };
const pattern = (patternId: string, size = 30): ClassicConfig => ({
  width: size,
  height: size,
  rule: 'B3/S23',
  start: { kind: 'pattern', patternId },
});

const pointer = (type: string, clientX: number, clientY: number, button = 0): Event => {
  const Ctor = typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
  return new Ctor(type, {
    clientX,
    clientY,
    button,
    bubbles: true,
    cancelable: true,
    pointerId: 1,
  } as PointerEventInit);
};

describe('ClassicSession', () => {
  let canvas: HTMLCanvasElement;
  let panel: HTMLElement;
  let session: ClassicSession;

  beforeEach(() => {
    vi.useFakeTimers();
    i18n.setLanguage(Language.EN);
    installCanvasStub();
    canvas = document.createElement('canvas');
    panel = document.createElement('div');
    document.body.append(canvas, panel);
    session = createClassicSession(canvas, panel);
    session.onRoundComplete = vi.fn();
    session.onStepComplete = vi.fn();
    session.onGameOver = vi.fn();
    session.setSpeed(100);
    session.fit(100, 100); // before begin(), as app.ts does: 10×10 board → 10px cells
  });

  afterEach(() => {
    session.destroy();
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  const value = (name: string) => panel.querySelector(`[data-classic="${name}"]`)?.textContent;
  const notice = () => panel.querySelector('.classic-notice')?.textContent ?? '';
  const hint = () => panel.querySelector<HTMLElement>('.classic-hint');

  it('begin() runs unless startPaused; start() is a no-op while running', () => {
    session.begin(pattern('pulsar'), { startPaused: false });
    expect(session.running()).toBe(true);
    session.start();
    vi.advanceTimersByTime(300);
    expect(session.getGeneration()).toBe(3);
    expect(session.onRoundComplete).toHaveBeenCalledTimes(3);
    session.pause();
    vi.advanceTimersByTime(300);
    expect(session.getGeneration()).toBe(3);
    session.pause(); // no-op
    expect(value('generation')).toBe('3');
    expect(value('population')).toBe('48');
  });

  it('starts paused when asked', () => {
    session.begin(pattern('glider'), { startPaused: true });
    expect(session.running()).toBe(false);
    expect(hint()?.hidden).toBe(false);
    expect(canvas.style.touchAction).toBe('none');
    session.start();
    expect(session.running()).toBe(true);
    expect(hint()?.hidden).toBe(true);
    expect(canvas.style.touchAction).toBe(''); // the page scrolls during a run
  });

  it('a draw start always begins paused on an empty board', () => {
    session.begin(draw, { startPaused: false });
    expect(session.running()).toBe(false);
    expect(value('population')).toBe('0');
    expect(session.isOver()).toBe(false);
  });

  it('stepRounds(5) fires onStepComplete once and reaches generation 5', () => {
    session.begin(pattern('glider'), { startPaused: true });
    session.stepRounds(5);
    expect(canvas.style.touchAction).toBe(''); // not editable mid-sequence
    session.stepRounds(5); // ignored while a sequence runs
    vi.advanceTimersByTime(1000);
    expect(session.getGeneration()).toBe(5);
    expect(session.onRoundComplete).toHaveBeenCalledTimes(5);
    expect(session.onStepComplete).toHaveBeenCalledTimes(1);
    session.step();
    expect(session.getGeneration()).toBe(6);
    expect(session.onStepComplete).toHaveBeenCalledTimes(2);
    session.stepRounds(0);
    expect(session.getGeneration()).toBe(6);
  });

  it('extinction ends the game once with a message in the panel', () => {
    session.begin(draw, { startPaused: false });
    canvas.dispatchEvent(pointer('pointerdown', 5, 5)); // one lonely cell
    expect(value('population')).toBe('1');
    session.stepRounds(5);
    expect(session.getGeneration()).toBe(1);
    expect(session.onGameOver).toHaveBeenCalledTimes(1);
    expect(session.onStepComplete).not.toHaveBeenCalled();
    expect(session.isOver()).toBe(true);
    expect(notice()).toContain('All cells have died');
    vi.advanceTimersByTime(1000);
    session.start();
    session.step();
    expect(session.running()).toBe(false);
    expect(session.getGeneration()).toBe(1);
  });

  it('a running game that dies out also stops its timer', () => {
    session.begin(pattern('diehard', 60), { startPaused: false });
    vi.advanceTimersByTime(100 * 135);
    expect(session.getGeneration()).toBe(130);
    expect(session.running()).toBe(false);
    expect(session.onGameOver).toHaveBeenCalledTimes(1);
  });

  it('stable and period-2 boards get a friendly notice but keep running', () => {
    session.begin(draw, { startPaused: true });
    for (const [x, y] of [
      [3, 5],
      [4, 5],
      [5, 5],
    ]) {
      canvas.dispatchEvent(pointer('pointerdown', x * 10 + 5, y * 10 + 5));
      canvas.dispatchEvent(pointer('pointerup', x * 10 + 5, y * 10 + 5));
    }
    session.start();
    vi.advanceTimersByTime(200);
    expect(notice()).toContain('two pictures');
    expect(session.running()).toBe(true);
    session.pause();
    // Turn the blinker into a block: a still life.
    session.begin(draw, { startPaused: true });
    for (const [x, y] of [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ]) {
      canvas.dispatchEvent(pointer('pointerdown', x * 10 + 1, y * 10 + 1));
    }
    session.start();
    vi.advanceTimersByTime(100);
    expect(notice()).toContain('frozen');
    expect(session.running()).toBe(true);
  });

  it('pointer position maps to the right cell; drag paints, tap toggles', () => {
    session.begin(draw, { startPaused: true });
    canvas.dispatchEvent(pointer('pointerdown', 35, 5));
    canvas.dispatchEvent(pointer('pointermove', 36, 6)); // same cell: no change
    canvas.dispatchEvent(pointer('pointermove', 45, 5));
    canvas.dispatchEvent(pointer('pointermove', 55, 15));
    canvas.dispatchEvent(pointer('pointermove', 500, 15)); // outside the board
    canvas.dispatchEvent(pointer('pointerup', 55, 15));
    canvas.dispatchEvent(pointer('pointermove', 65, 15)); // not painting any more
    expect(value('population')).toBe('3');
    // Dragging from a live cell erases.
    canvas.dispatchEvent(pointer('pointerdown', 45, 5));
    canvas.dispatchEvent(pointer('pointermove', 35, 5));
    canvas.dispatchEvent(pointer('pointercancel', 35, 5));
    expect(value('population')).toBe('1');
    canvas.dispatchEvent(pointer('pointerdown', 55, 15, 2)); // right button: ignored
    canvas.dispatchEvent(pointer('pointerdown', -5, 5)); // outside: ignored
    expect(value('population')).toBe('1');
    session.step(); // the single cell at (5,1) dies
    expect(session.isOver()).toBe(true);
  });

  it('blocks toggling while running and after stop()', () => {
    session.begin(pattern('glider', 10), { startPaused: false });
    const before = value('population');
    canvas.dispatchEvent(pointer('pointerdown', 5, 5));
    expect(value('population')).toBe(before);
    session.pause();
    session.stop?.();
    expect(session.isOver()).toBe(true);
    canvas.dispatchEvent(pointer('pointerdown', 5, 5));
    expect(value('population')).toBe(before);
    expect(hint()?.hidden).toBe(true);
  });

  it('a random start is seeded through Random; an invalid rule falls back to Conway', () => {
    Random.seed(7);
    session.begin({ ...DEFAULT_CLASSIC_CONFIG, width: 10, height: 10, rule: 'nonsense' }, { startPaused: true });
    const first = value('population');
    Random.seed(7);
    session.begin({ ...DEFAULT_CLASSIC_CONFIG, width: 10, height: 10 }, { startPaused: true });
    expect(value('population')).toBe(first);
    expect(value('rule')).toBe("Conway's Life (B3/S23)");
  });

  it('shows the rule name and explanation, a custom rule by its B/S text, and relabels on language change', () => {
    session.begin({ ...draw, rule: 'b36/s125' }, { startPaused: true });
    expect(value('rule')).toBe('B36/S125');
    expect(panel.querySelector('.classic-rule-text')?.textContent).toBe(
      'B36/S125: a dead cell with 3 or 6 neighbours is born; a live cell with 1, 2 or 5 survives.',
    );
    session.begin({ ...draw, rule: 'B3678/S34678' }, { startPaused: true });
    expect(value('rule')).toBe('Day & Night (B3678/S34678)');
    i18n.setLanguage(Language.PL);
    expect(value('rule')).toBe('Dzień i Noc (B3678/S34678)');
    expect(panel.querySelector('h2')?.textContent).toBe('⬛ Klasyczne Życie');
    i18n.setLanguage(Language.EN);
  });

  it('a pattern too big for the board starts paused with a notice', () => {
    session.begin(pattern('gosperGun', 20), { startPaused: false });
    expect(session.running()).toBe(false);
    expect(notice()).toContain('does not fit');
    session.begin(pattern('notAPattern', 20), { startPaused: false });
    expect(session.running()).toBe(false);
  });

  it('fit() before and after begin sizes the canvas to the area', () => {
    session.begin(draw, { startPaused: true });
    expect(canvas.style.width).toBe('100px');
    session.fit(55, 300);
    expect(canvas.style.width).toBe('50px');
  });

  it('end() clears the board; setSpeed ignores bad values; destroy empties the panel', () => {
    session.setSpeed(Number.NaN);
    session.begin(pattern('glider', 10), { startPaused: false });
    vi.advanceTimersByTime(100);
    expect(session.getGeneration()).toBe(1);
    session.end();
    expect(session.getGeneration()).toBe(0);
    expect(session.running()).toBe(false);
    expect(session.isOver()).toBe(false);
    session.start(); // nothing to run
    session.stop?.();
    expect(session.isOver()).toBe(false);
    session.fit(10, 10);
    session.destroy();
    expect(panel.childElementCount).toBe(0);
  });
});
