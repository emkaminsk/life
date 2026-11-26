import { describe, expect, it } from 'vitest';
import {
  clampRect,
  countKinds,
  createEmptyLayout,
  fillRect,
  getCell,
  isLayoutEmpty,
  normalizeRect,
  randomFillRect,
  rectArea,
  resizeLayout,
  setCell,
} from '../../src/core/BoardLayout';
import { Random } from '../../src/utils/Random';

describe('BoardLayout', () => {
  it('creates an empty row-major layout', () => {
    const layout = createEmptyLayout(4, 3);
    expect(layout.width).toBe(4);
    expect(layout.height).toBe(3);
    expect(layout.cells).toHaveLength(12);
    expect(isLayoutEmpty(layout)).toBe(true);
  });

  it('setCell places one item without mutating the input; out of bounds is a no-op', () => {
    const empty = createEmptyLayout(3, 3);
    const one = setCell(empty, 2, 1, 'wolf');
    expect(getCell(one, 2, 1)).toBe('wolf');
    expect(one.cells[1 * 3 + 2]).toBe('wolf');
    expect(isLayoutEmpty(empty)).toBe(true);
    expect(setCell(one, 3, 0, 'dog')).toBe(one);
    expect(setCell(one, -1, 0, 'dog')).toBe(one);
    expect(getCell(one, 5, 5)).toBeNull();
  });

  it('normalizeRect orders reversed corners', () => {
    expect(normalizeRect({ x: 4, y: 1 }, { x: 1, y: 3 })).toEqual({ x0: 1, y0: 1, x1: 4, y1: 3 });
    expect(rectArea(normalizeRect({ x: 4, y: 1 }, { x: 1, y: 3 }))).toBe(12);
  });

  it('clampRect intersects with the board or returns null', () => {
    expect(clampRect({ x0: -2, y0: -1, x1: 10, y1: 1 }, 5, 4)).toEqual({ x0: 0, y0: 0, x1: 4, y1: 1 });
    expect(clampRect({ x0: 6, y0: 0, x1: 9, y1: 2 }, 5, 4)).toBeNull();
  });

  it('fillRect fills a reversed, partly outside rectangle clamped to the board', () => {
    const layout = fillRect(createEmptyLayout(4, 4), { x0: 5, y0: 3, x1: 2, y1: 2 }, 'fruit');
    const filled = layout.cells.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
    // cells (2,2) (3,2) (2,3) (3,3)
    expect(filled).toEqual([10, 11, 14, 15]);
    expect(countKinds(layout).fruit).toBe(4);
  });

  it('fillRect with null erases', () => {
    let layout = fillRect(createEmptyLayout(3, 3), { x0: 0, y0: 0, x1: 2, y1: 2 }, 'mushroom');
    layout = fillRect(layout, { x0: 0, y0: 0, x1: 1, y1: 2 }, null);
    expect(countKinds(layout).mushroom).toBe(3);
    expect(getCell(layout, 2, 0)).toBe('mushroom');
    expect(getCell(layout, 0, 0)).toBeNull();
  });

  it('countKinds counts every kind', () => {
    let layout = createEmptyLayout(5, 1);
    layout = setCell(layout, 0, 0, 'male');
    layout = setCell(layout, 1, 0, 'female');
    layout = setCell(layout, 2, 0, 'female');
    layout = setCell(layout, 3, 0, 'dog');
    expect(countKinds(layout)).toEqual({ male: 1, female: 2, dog: 1, wolf: 0, fruit: 0, mushroom: 0 });
    expect(isLayoutEmpty(layout)).toBe(false);
  });

  it('randomFillRect fills roughly `density` of the empty cells, never overwrites, and is reproducible', () => {
    const base = setCell(createEmptyLayout(20, 20), 0, 0, 'dog');
    Random.seed(7);
    const a = randomFillRect(base, { x0: 0, y0: 0, x1: 19, y1: 19 }, 'wolf', 0.3);
    Random.seed(7);
    const b = randomFillRect(base, { x0: 0, y0: 0, x1: 19, y1: 19 }, 'wolf', 0.3);
    expect(a.cells).toEqual(b.cells);
    const wolves = countKinds(a).wolf;
    expect(wolves).toBeGreaterThan(80);
    expect(wolves).toBeLessThan(160);
    expect(getCell(a, 0, 0)).toBe('dog');
    expect(randomFillRect(base, { x0: 0, y0: 0, x1: 19, y1: 19 }, 'wolf', 0)).toBe(base);
    expect(countKinds(randomFillRect(base, { x0: 0, y0: 0, x1: 19, y1: 19 }, 'wolf', 1)).wolf).toBe(399);
  });

  it('resizeLayout keeps the overlapping top-left region', () => {
    let layout = createEmptyLayout(3, 3);
    layout = setCell(layout, 0, 0, 'male');
    layout = setCell(layout, 2, 2, 'wolf');
    layout = setCell(layout, 1, 2, 'fruit');
    const bigger = resizeLayout(layout, 5, 4);
    expect(bigger.cells).toHaveLength(20);
    expect(getCell(bigger, 0, 0)).toBe('male');
    expect(getCell(bigger, 2, 2)).toBe('wolf');
    expect(getCell(bigger, 1, 2)).toBe('fruit');
    expect(getCell(bigger, 4, 3)).toBeNull();

    const smaller = resizeLayout(layout, 2, 3);
    expect(countKinds(smaller)).toEqual({ male: 1, female: 0, dog: 0, wolf: 0, fruit: 1, mushroom: 0 });
    expect(getCell(smaller, 1, 2)).toBe('fruit');
  });
});
