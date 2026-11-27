import { describe, expect, it } from 'vitest';
import { fitCellSize, MIN_TAP_CELL, setupLayoutMode } from '../../../src/ui/setup/setupLayout';

describe('setupLayout', () => {
  it('picks the layout the CSS media queries use', () => {
    expect(setupLayoutMode({ width: 1440, height: 900 })).toBe('side');
    expect(setupLayoutMode({ width: 375, height: 812 })).toBe('stacked');
    expect(setupLayoutMode({ width: 812, height: 375 })).toBe('landscape');
    expect(setupLayoutMode({ width: 667, height: 375 })).toBe('landscape');
  });

  it('phone portrait: a 30×30 board fills the width with tappable cells', () => {
    const cell = fitCellSize(30, 30, { width: 375, height: 812 });
    expect(MIN_TAP_CELL).toBeGreaterThanOrEqual(11);
    expect(cell).toBeGreaterThanOrEqual(MIN_TAP_CELL);
    expect(cell * 30).toBeLessThanOrEqual(375 - 32);
  });

  it('phone landscape: the board fits the screen height', () => {
    const cell = fitCellSize(30, 30, { width: 812, height: 375 });
    expect(cell).toBeGreaterThanOrEqual(MIN_TAP_CELL);
    expect(cell * 30).toBeLessThanOrEqual(375);
  });

  it('desktop keeps the side palette and large cells', () => {
    const cell = fitCellSize(30, 30, { width: 1440, height: 900 });
    expect(cell).toBeGreaterThanOrEqual(18);
    expect(cell).toBeLessThanOrEqual(32);
    expect(fitCellSize(4, 4, { width: 1440, height: 900 })).toBe(32);
  });

  it('huge boards never go below the tap size on small or touch screens (the board scrolls instead)', () => {
    expect(fitCellSize(120, 120, { width: 375, height: 812 })).toBe(MIN_TAP_CELL);
    expect(fitCellSize(120, 120, { width: 1024, height: 768 }, true)).toBe(MIN_TAP_CELL);
    expect(fitCellSize(120, 120, { width: 1440, height: 900 })).toBeLessThan(MIN_TAP_CELL);
  });
});
