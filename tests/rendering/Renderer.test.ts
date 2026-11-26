import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Renderer } from '../../src/core/Renderer';
import { Board } from '../../src/core/Board';
import { AnimationSystem } from '../../src/core/AnimationSystem';
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities';
import { Sex, type VisualEffect } from '../../src/types';
import { installCanvasStub, type StubContext } from './canvasStub';

const CELL = 20;

type Stub = ReturnType<typeof installCanvasStub>;

let stub: Stub;
let canvas: HTMLCanvasElement;
let ctx: StubContext;
let rafQueue: FrameRequestCallback[];
let perfNow: number;

function setDpr(value: number): void {
  Object.defineProperty(window, 'devicePixelRatio', { value, configurable: true, writable: true });
}

function flushRaf(): number {
  const queue = rafQueue;
  rafQueue = [];
  for (const cb of queue) cb(perfNow);
  return queue.length;
}

/** Cells whose background tile was drawn on the main context. */
function cellsDrawn(c: StubContext = ctx, cell = CELL): string[] {
  return c.drawImage.mock.calls
    .filter((args) => (args[0] as HTMLCanvasElement).dataset?.role === 'cell-bg')
    .map((args) => `${(args[1] as number) / cell},${(args[2] as number) / cell}`);
}

interface SpriteDraw {
  emoji: string;
  x: number;
  y: number;
  w: number;
}
function spritesDrawn(c: StubContext = ctx): SpriteDraw[] {
  return c.drawImage.mock.calls
    .filter((args) => (args[0] as HTMLCanvasElement).dataset?.emoji)
    .map((args) => ({
      emoji: (args[0] as HTMLCanvasElement).dataset.emoji as string,
      x: args[1] as number,
      y: args[2] as number,
      w: args[3] as number,
    }));
}

function resetCalls(): void {
  ctx.drawImage.mockClear();
  ctx.fillRect.mockClear();
  ctx.fillText.mockClear();
  ctx.fills.length = 0;
}

function effect(type: VisualEffect['type'], x: number, y: number, duration = 1000): VisualEffect {
  return { type, x, y, startTime: Date.now(), duration };
}

function newRenderer(board: Board, cellSize = CELL): Renderer {
  const r = new Renderer(canvas, cellSize);
  r.resize(board.width, board.height);
  return r;
}

beforeEach(() => {
  stub = installCanvasStub();
  setDpr(1);
  rafQueue = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  perfNow = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => perfNow);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  canvas = document.createElement('canvas');
  canvas.getContext('2d');
  ctx = stub.contextOf(canvas);
});

afterEach(() => {
  vi.useRealTimers();
  setDpr(1);
});

describe('Renderer sizing', () => {
  it('sizes the canvas to board × cell size in CSS px at DPR 1', () => {
    const board = new Board(10, 5);
    newRenderer(board);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('100px');
  });

  it('uses a HiDPI backing store: canvas px = CSS px × devicePixelRatio', () => {
    setDpr(2);
    const board = new Board(10, 5);
    newRenderer(board);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('100px');
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('renders the emoji cache at size × DPR and draws it at CSS size', () => {
    setDpr(2);
    const board = new Board(4, 4);
    board.setEntity(1, 1, new Wolf(1, 1));
    const r = newRenderer(board);
    resetCalls();
    r.render(board);
    const [wolf] = spritesDrawn();
    const sprite = ctx.drawImage.mock.calls.find(
      (a) => (a[0] as HTMLCanvasElement).dataset?.emoji,
    )?.[0] as HTMLCanvasElement;
    expect(sprite.width).toBe(40);
    expect(wolf).toMatchObject({ emoji: '🐺', x: 20, y: 20, w: 20 });
  });

  it('fitToWidth clamps cell size to [6, 28] and resizes', () => {
    const r = new Renderer(canvas);
    expect(r.fitToWidth(1000, 100, 100)).toBe(10);
    expect(r.getCellSize()).toBe(10);
    expect(canvas.style.width).toBe('1000px');
    expect(r.fitToWidth(1000, 10, 10)).toBe(28);
    expect(canvas.style.width).toBe('280px');
    expect(r.fitToWidth(200, 100, 50)).toBe(6);
    expect(canvas.style.height).toBe('300px');
    expect(r.fitToWidth(Number.NaN, 10, 10)).toBe(6);
  });

  it('resize with a new cell size updates getCellSize and CSS size', () => {
    const r = new Renderer(canvas);
    r.resize(8, 4, 12);
    expect(r.getCellSize()).toBe(12);
    expect(canvas.style.width).toBe('96px');
    expect(canvas.style.height).toBe('48px');
  });
});

describe('Renderer emoji mapping and cache', () => {
  it('maps every entity type to its emoji', () => {
    const board = new Board(8, 1);
    const pregnant = new Human(2, 0, Sex.FEMALE);
    pregnant.pregnancyCounter = 3;
    const ripe = new Fruit(5, 0, 10, 0);
    const unripe = new Fruit(6, 0, 10, 3);
    const entities = [
      new Human(0, 0, Sex.MALE),
      new Human(1, 0, Sex.FEMALE),
      pregnant,
      new Wolf(3, 0),
      new Dog(4, 0),
      ripe,
      unripe,
      new Mushroom(7, 0),
    ];
    for (const e of entities) board.setEntity(e.x, e.y, e);
    const r = newRenderer(board);
    r.setInjuredThreshold(0);
    resetCalls();
    r.render(board);
    const byX = spritesDrawn().map((s) => [s.x / CELL, s.emoji]);
    expect(byX).toEqual([
      [0, '👨'],
      [1, '👩'],
      [2, '🤰'],
      [3, '🐺'],
      [4, '🐕'],
      [5, '🍎'],
      [6, '🍏'],
      [7, '🍄'],
    ]);
  });

  it('creates one offscreen canvas per emoji, never calls fillText on the main context', () => {
    const board = new Board(5, 5);
    for (let x = 0; x < 5; x++) board.setEntity(x, 0, new Wolf(x, 0));
    board.setEntity(0, 1, new Mushroom(0, 1));
    const r = newRenderer(board);
    const before = stub.created.length;
    r.render(board);
    r.renderFull(board);
    r.renderFull(board);
    // background tile + wolf + mushroom
    expect(stub.created.length - before).toBe(3);
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
    const offscreen = stub.created.slice(before).map((c) => stub.contextOf(c));
    const emojiTexts = offscreen.flatMap((c) => c.fillText.mock.calls.map((a) => a[0]));
    expect(emojiTexts.sort()).toEqual(['🍄', '🐺'].sort());
  });

  it('uses an emoji font stack and centres the glyph bounding box', () => {
    const board = new Board(2, 2);
    board.setEntity(0, 0, new Wolf(0, 0));
    const r = newRenderer(board);
    const before = stub.created.length;
    r.render(board);
    const sprite = stub.created.slice(before).find((c) => c.dataset.emoji === '🐺') as HTMLCanvasElement;
    const sctx = stub.contextOf(sprite);
    expect(sctx.font).toContain('Noto Color Emoji');
    expect(sctx.font).toContain('Apple Color Emoji');
    // stub metrics: left 0, right 16, ascent 14, descent 4 in a 20px box
    const [, x, y] = sctx.fillText.mock.calls[0];
    expect(x).toBe(2);
    expect(y).toBe(15);
  });

  it('rebuilds the cache for a new cell size', () => {
    const board = new Board(2, 2);
    board.setEntity(0, 0, new Wolf(0, 0));
    const r = newRenderer(board);
    r.render(board);
    const before = stub.created.length;
    r.resize(2, 2, 10);
    r.render(board);
    expect(stub.created.length - before).toBe(2); // bg tile + wolf at 10px
  });
});

describe('Renderer dirty rectangles', () => {
  it('first render after resize draws every cell, then nothing until marked', () => {
    const board = new Board(4, 3);
    const r = newRenderer(board);
    resetCalls();
    r.render(board);
    expect(cellsDrawn()).toHaveLength(12);
    resetCalls();
    r.render(board);
    expect(cellsDrawn()).toHaveLength(0);
  });

  it('only marked cells are drawn, each once', () => {
    const board = new Board(4, 3);
    board.setEntity(2, 1, new Wolf(2, 1));
    const r = newRenderer(board);
    r.render(board);
    resetCalls();
    r.markDirty(2, 1);
    r.markDirty(2, 1);
    r.markDirty(0, 2);
    r.markDirty(-1, 0); // ignored
    r.markDirty(4, 0); // ignored
    r.render(board);
    expect(cellsDrawn().sort()).toEqual(['0,2', '2,1']);
    expect(spritesDrawn().map((s) => s.emoji)).toEqual(['🐺']);
  });

  it('markAllDirty covers the whole board', () => {
    const board = new Board(5, 4);
    const r = newRenderer(board);
    r.render(board);
    resetCalls();
    r.markAllDirty(board);
    r.render(board);
    expect(new Set(cellsDrawn()).size).toBe(20);
  });

  it('resize reallocates the dirty set for the new dimensions', () => {
    const board = new Board(3, 3);
    const r = newRenderer(board);
    r.render(board);
    board.resize(6, 2);
    r.resize(6, 2);
    resetCalls();
    r.render(board);
    expect(new Set(cellsDrawn())).toEqual(
      new Set(['0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '0,1', '1,1', '2,1', '3,1', '4,1', '5,1']),
    );
  });

  it('follows a board whose size changed without an explicit resize', () => {
    const board = new Board(3, 3);
    const r = newRenderer(board);
    r.render(board);
    const other = new Board(4, 2);
    resetCalls();
    r.render(other);
    expect(cellsDrawn()).toHaveLength(8);
    expect(canvas.style.width).toBe('80px');
  });
});

describe('Renderer injured indicator', () => {
  function heartDraws(): SpriteDraw[] {
    return spritesDrawn().filter((s) => s.emoji === '💔');
  }

  function renderSingle(entity: Human | Wolf | Dog | Fruit | Mushroom, threshold?: number): Renderer {
    const board = new Board(3, 3);
    board.setEntity(1, 1, entity);
    const r = newRenderer(board);
    if (threshold !== undefined) r.setInjuredThreshold(threshold);
    resetCalls();
    r.render(board);
    return r;
  }

  it.each([
    ['human', () => new Human(1, 1, Sex.MALE)],
    ['wolf', () => new Wolf(1, 1)],
    ['dog', () => new Dog(1, 1)],
  ])('shows 💔 for an injured %s below the % threshold', (_name, make) => {
    const e = make();
    e.maxHealth = 100;
    e.health = 49;
    renderSingle(e, 50);
    expect(heartDraws()).toHaveLength(1);
  });

  it.each([
    ['human', () => new Human(1, 1, Sex.FEMALE)],
    ['wolf', () => new Wolf(1, 1)],
    ['dog', () => new Dog(1, 1)],
  ])('no 💔 for a %s at or above the threshold', (_name, make) => {
    const e = make();
    e.maxHealth = 100;
    e.health = 50;
    renderSingle(e, 50);
    expect(heartDraws()).toHaveLength(0);
  });

  it('threshold is a percentage of max health, not absolute health', () => {
    const wolf = new Wolf(1, 1);
    wolf.maxHealth = 200;
    wolf.health = 80; // 40 %
    renderSingle(wolf, 50);
    expect(heartDraws()).toHaveLength(1);

    const strong = new Wolf(1, 1);
    strong.maxHealth = 60;
    strong.health = 40; // 66 %
    renderSingle(strong, 50);
    expect(heartDraws()).toHaveLength(0);
  });

  it('never shows 💔 on plants', () => {
    const fruit = new Fruit(1, 1, 10, 0);
    fruit.health = 0.01;
    renderSingle(fruit, 100);
    const mushroom = new Mushroom(1, 1);
    mushroom.health = 0.01;
    renderSingle(mushroom, 100);
    expect(heartDraws()).toHaveLength(0);
  });

  it('setInjuredThreshold changes the outcome', () => {
    const dog = new Dog(1, 1);
    dog.maxHealth = 100;
    dog.health = 70;
    renderSingle(dog, 50);
    expect(heartDraws()).toHaveLength(0);
    renderSingle(dog, 80);
    expect(heartDraws()).toHaveLength(1);
  });

  it('icon is legible: ≈48% of the cell and at least 9 CSS px, inside the cell', () => {
    const wolf = new Wolf(1, 1);
    wolf.maxHealth = 100;
    wolf.health = 10;
    renderSingle(wolf, 50);
    const [heart] = heartDraws();
    expect(heart.w).toBeCloseTo(10, 0); // round(20 * 0.48)
    expect(heart.x + heart.w).toBeLessThanOrEqual(2 * CELL);
    expect(heart.y).toBe(CELL);

    const board = new Board(3, 3);
    board.setEntity(1, 1, wolf);
    const r = new Renderer(canvas, 14);
    r.resize(3, 3);
    resetCalls();
    r.render(board);
    expect(heartDraws()[0].w).toBe(9);
  });
});

describe('Renderer visual effects', () => {
  function effectFills(): { color: string; alpha: number; x: number; y: number }[] {
    return ctx.fills
      .filter((f) => f.globalAlpha < 1)
      .map((f) => ({ color: f.fillStyle, alpha: f.globalAlpha, x: f.x / CELL, y: f.y / CELL }));
  }

  it('uses red for combat, green for reproduction, yellow for eating', () => {
    const board = new Board(4, 1);
    const r = newRenderer(board);
    r.addVisualEffect(effect('combat', 0, 0));
    r.addVisualEffect(effect('reproduction', 1, 0));
    r.addVisualEffect(effect('eating', 2, 0));
    vi.setSystemTime(Date.now() + 100);
    resetCalls();
    r.render(board);
    const fills = effectFills().sort((a, b) => a.x - b.x);
    expect(fills.map((f) => f.color)).toEqual(['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(255, 255, 0)']);
    expect(fills.every((f) => f.alpha > 0 && f.alpha < 1)).toBe(true);
    expect(ctx.globalAlpha).toBe(1);
  });

  it('fades alpha over the duration', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    r.addVisualEffect(effect('eating', 1, 1, 1000));
    vi.setSystemTime(Date.now() + 100);
    resetCalls();
    r.render(board);
    const early = effectFills()[0].alpha;
    vi.setSystemTime(Date.now() + 700);
    resetCalls();
    r.render(board);
    const late = effectFills()[0].alpha;
    expect(late).toBeLessThan(early);
    expect(late).toBeGreaterThan(0);
  });

  it('keeps one effect per cell: a new one replaces the old (no alpha stacking)', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    r.addVisualEffect(effect('combat', 0, 0));
    r.addVisualEffect(effect('eating', 0, 0));
    r.addVisualEffect(effect('reproduction', 0, 0));
    expect(r.getActiveEffectCount()).toBe(1);
    resetCalls();
    r.render(board);
    const fills = effectFills();
    expect(fills).toHaveLength(1);
    expect(fills[0].color).toBe('rgb(0, 255, 0)');
    // the cell background is redrawn under the flash each frame
    expect(cellsDrawn()).toContain('0,0');
  });

  it('ignores effects outside the board', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    r.addVisualEffect(effect('combat', 5, 0));
    expect(r.getActiveEffectCount()).toBe(0);
  });

  it('redraws an expired effect cell clean and stops drawing it', () => {
    const board = new Board(3, 3);
    board.setEntity(1, 1, new Wolf(1, 1));
    const r = newRenderer(board);
    r.render(board);
    r.addVisualEffect(effect('combat', 1, 1, 1000));
    vi.setSystemTime(Date.now() + 1000);
    resetCalls();
    r.render(board);
    expect(cellsDrawn()).toEqual(['1,1']);
    expect(spritesDrawn().map((s) => s.emoji)).toEqual(['🐺']);
    expect(effectFills()).toHaveLength(0);
    expect(r.getActiveEffectCount()).toBe(0);
    resetCalls();
    r.render(board);
    expect(cellsDrawn()).toHaveLength(0);
  });

  it('keeps fading via its own rAF loop while paused, and stops when effects end', () => {
    const board = new Board(3, 3);
    const r = newRenderer(board);
    r.render(board); // remember the board
    r.addVisualEffect(effect('reproduction', 2, 2, 1000));
    expect(r.isEffectLoopRunning()).toBe(true);

    const alphas: number[] = [];
    for (let i = 0; i < 4; i++) {
      vi.setSystemTime(Date.now() + 200);
      resetCalls();
      expect(flushRaf()).toBe(1);
      alphas.push(effectFills()[0].alpha);
    }
    expect(alphas).toEqual([...alphas].sort((a, b) => b - a));
    expect(r.isEffectLoopRunning()).toBe(true);

    vi.setSystemTime(Date.now() + 300); // past expiry
    resetCalls();
    flushRaf();
    expect(cellsDrawn()).toEqual(['2,2']);
    expect(effectFills()).toHaveLength(0);
    expect(r.isEffectLoopRunning()).toBe(false);
    expect(flushRaf()).toBe(0);
  });

  it('does not schedule a loop when no effects exist', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    r.render(board);
    expect(r.isEffectLoopRunning()).toBe(false);
    expect(rafQueue).toHaveLength(0);
  });

  it('effect loop does not draw while an external animation drives frames', () => {
    const board = new Board(3, 1);
    const wolf = new Wolf(1, 0);
    board.setEntity(1, 0, wolf);
    const anim = new AnimationSystem();
    const r = newRenderer(board);
    r.render(board);
    anim.startAnimations([{ entity: wolf, fromX: 0, fromY: 0, toX: 1, toY: 0 }], 300);
    r.addVisualEffect(effect('combat', 2, 0));
    r.renderAnimationFrame(board, anim);
    resetCalls();
    perfNow += 16;
    flushRaf();
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(r.isEffectLoopRunning()).toBe(true); // still alive, waiting
  });

  it('clearVisualEffects removes flashes and redraws their cells', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    r.render(board);
    r.addVisualEffect(effect('combat', 1, 0));
    r.clearVisualEffects();
    resetCalls();
    r.render(board);
    expect(cellsDrawn()).toEqual(['1,0']);
    expect(effectFills()).toHaveLength(0);
  });
});

describe('Renderer animation frames', () => {
  function setup() {
    const board = new Board(5, 5);
    const wolf = new Wolf(2, 2);
    const fruit = new Fruit(3, 3, 10, 0);
    board.setEntity(2, 2, wolf);
    board.setEntity(3, 3, fruit);
    const r = newRenderer(board);
    r.setInjuredThreshold(0);
    r.render(board);
    // MovementSystem moved the wolf logically from (1,1) to (2,2)
    const anim = new AnimationSystem();
    anim.startAnimations([{ entity: wolf, fromX: 1, fromY: 1, toX: 2, toY: 2 }], 100);
    r.markAnimationPaths(board, anim);
    return { board, wolf, fruit, r, anim };
  }

  it('first frame redraws the whole path and draws the mover at its visual position', () => {
    const { board, r, anim } = setup();
    resetCalls();
    perfNow += 50;
    anim.update();
    r.renderAnimationFrame(board, anim);
    expect(new Set(cellsDrawn())).toEqual(new Set(['1,1', '2,1', '1,2', '2,2']));
    const sprites = spritesDrawn();
    expect(sprites).toEqual([{ emoji: '🐺', x: 30, y: 30, w: CELL }]);
  });

  it('redraws cells covered in the previous frame and the current frame (no ghosts)', () => {
    const { board, r, anim } = setup();
    perfNow += 50;
    anim.update();
    r.renderAnimationFrame(board, anim); // wolf at 1.5,1.5 → covers 1..2
    resetCalls();
    perfNow += 50;
    anim.update(); // complete: wolf at (2,2), batch cleared
    r.renderAnimationFrame(board, anim);
    // previous frame covered 1..2 × 1..2: all redrawn, wolf back on its logical cell
    expect(new Set(cellsDrawn())).toEqual(new Set(['1,1', '2,1', '1,2', '2,2']));
    expect(spritesDrawn()).toEqual([{ emoji: '🐺', x: 40, y: 40, w: CELL }]);
  });

  it('a render() after the animation cleans up the last frame cells', () => {
    const { board, wolf, r, anim } = setup();
    perfNow += 50;
    anim.update();
    r.renderAnimationFrame(board, anim);
    anim.stopAll(); // paused mid-animation
    wolf.syncVisualPosition();
    resetCalls();
    r.render(board);
    expect(new Set(cellsDrawn())).toEqual(new Set(['1,1', '2,1', '1,2', '2,2']));
    expect(spritesDrawn()).toEqual([{ emoji: '🐺', x: 40, y: 40, w: CELL }]);
  });

  it('does not draw an animating entity at its logical cell; stationary neighbours are kept', () => {
    const { board, fruit, r, anim } = setup();
    perfNow += 50;
    anim.update();
    expect(anim.isAnimatingEntity(board.getEntity(2, 2) as Wolf)).toBe(true);
    expect(anim.isAnimatingEntity(fruit)).toBe(false);
    r.markDirty(3, 3);
    resetCalls();
    r.renderAnimationFrame(board, anim);
    const sprites = spritesDrawn();
    expect(sprites.filter((s) => s.emoji === '🐺')).toHaveLength(1);
    expect(sprites.find((s) => s.emoji === '🍎')).toMatchObject({ x: 60, y: 60 });
  });

  it('covers start cells of a new batch even without markAnimationPaths', () => {
    const board = new Board(4, 1);
    const wolf = new Wolf(3, 0);
    board.setEntity(3, 0, wolf);
    const r = newRenderer(board);
    r.render(board);
    const anim = new AnimationSystem();
    anim.startAnimations([{ entity: wolf, fromX: 2, fromY: 0, toX: 3, toY: 0 }], 100);
    resetCalls();
    r.renderAnimationFrame(board, anim); // progress 0 (no update yet)
    expect(new Set(cellsDrawn())).toEqual(new Set(['2,0', '3,0']));
    expect(spritesDrawn()).toEqual([{ emoji: '🐺', x: 40, y: 0, w: CELL }]);
  });
});

describe('Renderer FPS', () => {
  it('measures frames actually rendered per second and reports 0 when idle', () => {
    const board = new Board(2, 2);
    const r = newRenderer(board);
    expect(r.getCurrentFps()).toBe(0);
    for (let i = 0; i < 31; i++) {
      perfNow += 1000 / 30;
      r.render(board);
    }
    expect(r.getCurrentFps()).toBeGreaterThanOrEqual(29);
    expect(r.getCurrentFps()).toBeLessThanOrEqual(31);
    perfNow += 2000;
    expect(r.getCurrentFps()).toBe(0);
  });
});
