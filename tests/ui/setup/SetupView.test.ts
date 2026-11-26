import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../../../src/config';
import { type BoardLayout, countKinds, createEmptyLayout, getCell, setCell } from '../../../src/core/BoardLayout';
import { i18n } from '../../../src/i18n/i18n';
import { Language } from '../../../src/i18n/types';
import { SetupView } from '../../../src/ui/setup/SetupView';
import { installCanvasStub } from '../../rendering/canvasStub';

let root: HTMLElement;
let stub: ReturnType<typeof installCanvasStub>;
let view: SetupView;

beforeEach(() => {
  stub = installCanvasStub();
  i18n.setLanguage(Language.EN);
  root = document.createElement('div');
  root.id = 'setupView';
  document.body.appendChild(root);
  view = new SetupView(root);
});

afterEach(() => {
  view.destroy();
  root.remove();
  i18n.setLanguage(Language.EN);
});

const open = (initial?: BoardLayout) => view.open({ width: 6, height: 4, config: DEFAULT_CONFIG, initial });
const canvas = () => root.querySelector<HTMLCanvasElement>('canvas.setup-canvas') as HTMLCanvasElement;
const cellSize = () => Number.parseFloat(canvas().style.width) / 6;
const tool = (id: string) =>
  root.querySelector<HTMLButtonElement>(`.setup-tool[data-tool="${id}"]`) as HTMLButtonElement;
const count = (id: string) => tool(id).querySelector('.setup-tool-count')?.textContent;
const button = (cls: string) => root.querySelector<HTMLButtonElement>(`.${cls}`) as HTMLButtonElement;
/** Client coordinates of the centre of a cell (jsdom's bounding rect is at 0,0). */
const at = (x: number, y: number) => ({ clientX: (x + 0.5) * cellSize(), clientY: (y + 0.5) * cellSize() });
const press = (code: string, mods: KeyboardEventInit = {}) =>
  canvas().dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...mods }));

/** Pointer event at the centre of a cell (plus an optional pixel offset). */
function pointer(type: string, x: number, y: number, pointerType = 'mouse', target: EventTarget = canvas(), dx = 0) {
  const { clientX, clientY } = at(x, y);
  const init = { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType, isPrimary: true };
  target.dispatchEvent(new PointerEvent(type, { ...init, clientX: clientX + dx, clientY }));
}

function drop(kind: string, x: number, y: number) {
  const event = new MouseEvent('drop', { bubbles: true, cancelable: true, ...at(x, y) });
  Object.defineProperty(event, 'dataTransfer', { value: { getData: () => kind, dropEffect: 'none' } });
  canvas().dispatchEvent(event);
}

describe('SetupView', () => {
  it('opens as a visible, focused editor and closes again', () => {
    expect(root.hidden).toBe(true);
    open();
    expect(view.isActive()).toBe(true);
    expect(root.hidden).toBe(false);
    expect(document.activeElement).toBe(canvas());
    expect(canvas().getAttribute('aria-label')).toBe('Setup board, 6 by 4 fields');
    view.close();
    expect(view.isActive()).toBe(false);
    expect(root.hidden).toBe(true);
  });

  it('dropping a palette item on the board places exactly one entity there', () => {
    open();
    drop('wolf', 3, 2);
    const layout = view.getLayout();
    expect(getCell(layout, 3, 2)).toBe('wolf');
    expect(countKinds(layout).wolf).toBe(1);
    expect(count('wolf')).toBe('1');
    // The preview canvas draws the same wolf sprite the game renderer uses.
    const drawn = stub.contextOf(canvas()).drawImage.mock.calls.map((c) => (c[0] as HTMLCanvasElement).dataset.emoji);
    expect(drawn).toContain('🐺');
    drop('eraser', 3, 2);
    expect(countKinds(view.getLayout()).wolf).toBe(0);
  });

  it('clicking a palette item switches the tool used by board clicks', () => {
    open();
    tool('dog').click();
    expect(tool('dog').getAttribute('aria-pressed')).toBe('true');
    expect(tool('male').getAttribute('aria-pressed')).toBe('false');
    pointer('pointerdown', 1, 1);
    pointer('pointerup', 1, 1, 'mouse', window);
    expect(getCell(view.getLayout(), 1, 1)).toBe('dog');
    expect(countKinds(view.getLayout()).dog).toBe(1);
  });

  it('mouse drag selects a rectangle that a digit key then fills', () => {
    open();
    pointer('pointerdown', 4, 3);
    pointer('pointermove', 2, 1, 'mouse', window);
    pointer('pointerup', 2, 1, 'mouse', window);
    // A drag only selects; nothing is placed yet.
    expect(countKinds(view.getLayout()).male).toBe(0);
    const selection = root.querySelector<HTMLElement>('.setup-selection') as HTMLElement;
    expect(selection.hidden).toBe(false);
    expect(selection.style.width).toBe(`${3 * cellSize()}px`);
    press('Digit5');
    expect(countKinds(view.getLayout()).fruit).toBe(9);
    expect(getCell(view.getLayout(), 2, 1)).toBe('fruit');
    expect(getCell(view.getLayout(), 1, 1)).toBeNull();
    expect(tool('fruit').getAttribute('aria-pressed')).toBe('true');
  });

  it('touch: a tap places the chosen item', () => {
    open();
    tool('wolf').click();
    pointer('pointerdown', 2, 2, 'touch');
    pointer('pointerup', 2, 2, 'touch');
    expect(getCell(view.getLayout(), 2, 2)).toBe('wolf');
    expect(countKinds(view.getLayout()).wolf).toBe(1);
  });

  it('touch: a small finger wobble across a cell edge is still a tap', () => {
    open();
    // Starts 1 px left of the edge between cells 1 and 2, ends 2 px right of it.
    const half = cellSize() / 2;
    pointer('pointerdown', 1, 1, 'touch', canvas(), half - 1);
    pointer('pointermove', 2, 1, 'touch', canvas(), -half + 2);
    pointer('pointerup', 2, 1, 'touch', canvas(), -half + 2);
    expect(countKinds(view.getLayout()).male).toBe(1);
    expect(getCell(view.getLayout(), 1, 1)).toBe('male');
  });

  it('touch: dragging selects an area that tapping a palette item fills', () => {
    open();
    pointer('pointerdown', 0, 0, 'touch');
    pointer('pointermove', 1, 1, 'touch');
    pointer('pointermove', 2, 1, 'touch');
    pointer('pointerup', 2, 1, 'touch');
    expect(countKinds(view.getLayout()).male).toBe(0);
    const selection = root.querySelector<HTMLElement>('.setup-selection') as HTMLElement;
    expect(selection.hidden).toBe(false);
    expect(selection.style.width).toBe(`${3 * cellSize()}px`);
    expect(selection.style.height).toBe(`${2 * cellSize()}px`);
    tool('mushroom').click();
    expect(countKinds(view.getLayout()).mushroom).toBe(6);
    expect(tool('mushroom').getAttribute('aria-pressed')).toBe('true');
    // A tap clears the selection; then a palette tap only picks the item.
    pointer('pointerdown', 5, 3, 'touch');
    pointer('pointerup', 5, 3, 'touch');
    expect(selection.hidden).toBe(true);
    tool('dog').click();
    expect(countKinds(view.getLayout()).dog).toBe(0);
  });

  it('a cancelled pointer (the browser took over the gesture) places nothing', () => {
    open();
    pointer('pointerdown', 3, 3, 'touch');
    pointer('pointercancel', 3, 3, 'touch');
    pointer('pointerup', 3, 3, 'touch');
    expect(countKinds(view.getLayout()).male).toBe(0);
  });

  it('marks the keyboard help so touch screens can hide it, and mentions tapping', () => {
    open();
    expect(root.querySelector('.setup-help-keys')?.textContent).toContain('Arrows');
    expect(root.querySelector('.setup-help-pointer')?.textContent).toMatch(/tap/i);
  });

  it('keyboard: Shift+arrows select, Delete erases, live region announces', () => {
    open(setCell(setCell(createEmptyLayout(6, 4), 0, 0, 'female'), 1, 0, 'male'));
    press('ArrowRight', { shiftKey: true });
    expect(root.querySelector('.setup-live')?.textContent).toBe('Field 2, 1: Man. Selected 2 by 1 fields (2 fields)');
    press('Delete');
    expect(countKinds(view.getLayout()).male + countKinds(view.getLayout()).female).toBe(0);
  });

  it('confirm passes the layout and closes', () => {
    const onConfirm = vi.fn();
    view.onConfirm = onConfirm;
    open();
    drop('female', 0, 0);
    button('setup-start').click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const layout = onConfirm.mock.calls[0][0] as BoardLayout;
    expect(layout.width).toBe(6);
    expect(getCell(layout, 0, 0)).toBe('female');
    expect(view.isActive()).toBe(false);

    open(layout);
    press('Enter', { ctrlKey: true });
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('cancel: empty board leaves at once; a non-empty one asks first', () => {
    const onCancel = vi.fn();
    view.onCancel = onCancel;
    view.confirmDiscard = vi.fn(() => false);
    open();
    press('Escape');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(view.confirmDiscard).not.toHaveBeenCalled();

    open();
    drop('dog', 0, 0);
    button('setup-back').click();
    expect(view.confirmDiscard).toHaveBeenCalledWith(expect.stringContaining('Leave the board setup'));
    expect(view.isActive()).toBe(true);
    view.confirmDiscard = () => true;
    button('setup-back').click();
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(view.isActive()).toBe(false);
  });

  it('warns when no humans are placed and resizes a differently sized initial layout', () => {
    const initial = setCell(createEmptyLayout(10, 10), 5, 1, 'male');
    open(initial);
    const layout = view.getLayout();
    expect(layout.cells).toHaveLength(24);
    expect(getCell(layout, 5, 1)).toBe('male');
    const warning = root.querySelector<HTMLElement>('.setup-warning') as HTMLElement;
    expect(warning.hidden).toBe(true);
    button('setup-clear').click();
    expect(warning.hidden).toBe(false);
    expect(warning.textContent).toContain('no humans');
  });

  it('relabels everything when the language changes', () => {
    open();
    expect(root.querySelector('h1')?.textContent).toBe('Board setup');
    i18n.setLanguage(Language.PL);
    expect(root.querySelector('h1')?.textContent).toBe('Ustawienie planszy');
    expect(tool('wolf').querySelector('.setup-tool-name')?.textContent).toBe('Wilk');
    expect(button('setup-start').textContent).toBe('Rozpocznij grę');
    expect(canvas().getAttribute('aria-label')).toBe('Plansza do ustawiania, 6 na 4 pól');
  });

  describe('disabledKinds (challenge constraints)', () => {
    const openWithout = (initial?: BoardLayout) =>
      view.open({ width: 6, height: 4, config: DEFAULT_CONFIG, initial, disabledKinds: ['dog'] });

    it('hides the forbidden item and strips it from the initial layout', () => {
      const initial = setCell(setCell(createEmptyLayout(6, 4), 0, 0, 'dog'), 1, 0, 'male');
      openWithout(initial);
      expect(tool('dog').hidden).toBe(true);
      expect(tool('wolf').hidden).toBe(false);
      expect(countKinds(view.getLayout()).dog).toBe(0);
      expect(getCell(view.getLayout(), 1, 0)).toBe('male');
    });

    it('never places a forbidden item, by keyboard or by pointer', () => {
      openWithout();
      tool('dog').click(); // hidden, but still reachable programmatically
      pointer('pointerdown', 2, 2);
      pointer('pointerup', 2, 2, 'mouse', window);
      press('Digit3'); // 3 = dog
      expect(countKinds(view.getLayout()).dog).toBe(0);
    });

    it('re-opening without constraints shows the item again', () => {
      openWithout();
      open();
      expect(tool('dog').hidden).toBe(false);
    });
  });
});
