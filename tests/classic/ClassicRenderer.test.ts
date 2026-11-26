import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLASSIC_COLORS, ClassicRenderer, FALLBACK_CELL_PX, fitCellSize } from '../../src/classic/ClassicRenderer';
import { LifeEngine } from '../../src/classic/LifeEngine';
import { CONWAY_RULE } from '../../src/classic/rules';
import { installCanvasStub } from '../rendering/canvasStub';

describe('fitCellSize', () => {
  it('uses the largest integer size that fits both width and height', () => {
    expect(fitCellSize(50, 50, 375, 812)).toBe(7); // width-bound (phone)
    expect(fitCellSize(50, 50, 1440, 600)).toBe(12); // height-bound (desktop)
    expect(fitCellSize(200, 200, 300, 300)).toBe(2); // never below 2px
    expect(fitCellSize(10, 10, 0, 0)).toBe(FALLBACK_CELL_PX); // unknown area
    expect(fitCellSize(10, 10, 100, 0)).toBe(10); // only the width is known
  });
});

describe('ClassicRenderer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const setup = (dpr = 2) => {
    vi.stubGlobal('devicePixelRatio', dpr);
    const stub = installCanvasStub();
    const canvas = document.createElement('canvas');
    const renderer = new ClassicRenderer(canvas);
    return { canvas, renderer, ctx: () => stub.contextOf(canvas) };
  };

  it('sizes a HiDPI canvas: CSS size × devicePixelRatio backing store', () => {
    const { canvas, renderer } = setup(2);
    renderer.fit(20, 10, 205, 1000);
    expect(renderer.cellSize).toBe(10);
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('100px');
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
  });

  it('draws the background plus one fillRect per live cell, with grid lines at ≥ 6px', () => {
    const { renderer, ctx } = setup(1);
    const engine = new LifeEngine(10, 10, { ...CONWAY_RULE });
    engine.set(2, 3, true);
    engine.set(9, 9, true);
    renderer.fit(10, 10, 100, 100);
    renderer.draw(engine);
    const c = ctx();
    expect(c.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(c.fills[0]).toMatchObject({ x: 0, y: 0, w: 100, h: 100, fillStyle: CLASSIC_COLORS.dead });
    const cells = c.fills.slice(1);
    expect(cells).toHaveLength(2);
    expect(cells[0]).toMatchObject({ x: 20, y: 30, w: 9, h: 9, fillStyle: CLASSIC_COLORS.alive });
    expect(c.stroke).toHaveBeenCalledTimes(1);
    expect(c.moveTo).toHaveBeenCalledTimes(22); // 11 vertical + 11 horizontal lines
  });

  it('skips grid lines for small cells and fills them edge to edge', () => {
    const { renderer, ctx } = setup(1);
    const engine = new LifeEngine(100, 100, { ...CONWAY_RULE });
    engine.set(1, 1, true);
    renderer.fit(100, 100, 300, 300);
    renderer.draw(engine);
    expect(renderer.cellSize).toBe(3);
    expect(ctx().fills[1]).toMatchObject({ x: 3, y: 3, w: 3, h: 3 });
    expect(ctx().stroke).not.toHaveBeenCalled();
  });

  it('maps pointer positions to cells, also when CSS scales the canvas', () => {
    const { canvas, renderer } = setup(1);
    renderer.fit(10, 10, 100, 100);
    const rect = (left: number, top: number, size: number) =>
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left,
        top,
        width: size,
        height: size,
        right: left + size,
        bottom: top + size,
        x: left,
        y: top,
        toJSON: () => ({}),
      });
    rect(50, 20, 100);
    expect(renderer.cellAt(50, 20)).toEqual({ x: 0, y: 0 });
    expect(renderer.cellAt(75, 59)).toEqual({ x: 2, y: 3 });
    expect(renderer.cellAt(149, 119)).toEqual({ x: 9, y: 9 });
    expect(renderer.cellAt(150, 50)).toBeNull();
    expect(renderer.cellAt(40, 50)).toBeNull();
    rect(0, 0, 50); // shown at half size
    expect(renderer.cellAt(25, 25)).toEqual({ x: 5, y: 5 });
    rect(0, 0, 0); // not laid out (jsdom): CSS pixels taken as-is
    expect(renderer.cellAt(35, 5)).toEqual({ x: 3, y: 0 });
  });

  it('does nothing without a 2D context', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    const renderer = new ClassicRenderer(canvas);
    expect(() => renderer.draw(new LifeEngine(3, 3, { ...CONWAY_RULE }))).not.toThrow();
  });
});
