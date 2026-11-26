import { vi } from 'vitest';

type PathOp = { op: 'moveTo' | 'lineTo'; x: number; y: number; color: string; dash: number[] };

/** Recording 2D context: remembers which colour/dash every path point was drawn with. */
export function recordingContext() {
  const ops: PathOp[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    dash: [] as number[],
    ops,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    setLineDash(d: number[]) {
      this.dash = d;
    },
    moveTo(x: number, y: number) {
      ops.push({ op: 'moveTo', x, y, color: this.strokeStyle, dash: this.dash });
    },
    lineTo(x: number, y: number) {
      ops.push({ op: 'lineTo', x, y, color: this.strokeStyle, dash: this.dash });
    },
  };
  return ctx;
}

export function chartCanvas(width = 220, height = 140) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  const ctx = recordingContext();
  vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  return { canvas, ctx };
}
