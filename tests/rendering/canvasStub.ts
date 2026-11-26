import { vi } from 'vitest';

/**
 * Minimal 2D context stub for jsdom (which has no canvas implementation).
 * fillRect calls record the fillStyle / globalAlpha in effect at call time.
 */
export interface FillCall {
  x: number;
  y: number;
  w: number;
  h: number;
  fillStyle: string;
  globalAlpha: number;
}

export interface StubContext {
  canvas: HTMLCanvasElement;
  fillStyle: string;
  strokeStyle: string;
  globalAlpha: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  lineWidth: number;
  fills: FillCall[];
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
}

export function createStubContext(canvas: HTMLCanvasElement): StubContext {
  const ctx = {
    canvas,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    fills: [] as FillCall[],
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 10,
      actualBoundingBoxAscent: 14,
      actualBoundingBoxDescent: 4,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 16,
    })),
  } as unknown as StubContext;
  ctx.fillRect = vi.fn((...args: number[]): unknown => {
    const [x, y, w, h] = args;
    ctx.fills.push({ x, y, w, h, fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha });
    return undefined;
  });
  return ctx;
}

/** Installs the stub on HTMLCanvasElement.prototype.getContext; one context per canvas. */
export function installCanvasStub(): {
  contextOf(c: HTMLCanvasElement): StubContext;
  created: HTMLCanvasElement[];
} {
  const contexts = new WeakMap<HTMLCanvasElement, StubContext>();
  const created: HTMLCanvasElement[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    let ctx = contexts.get(this);
    if (!ctx) {
      ctx = createStubContext(this);
      contexts.set(this, ctx);
      created.push(this);
    }
    return ctx as unknown as CanvasRenderingContext2D;
  } as unknown as HTMLCanvasElement['getContext']);
  return {
    contextOf(c: HTMLCanvasElement): StubContext {
      const ctx = contexts.get(c);
      if (!ctx) throw new Error('no context for canvas');
      return ctx;
    },
    created,
  };
}
