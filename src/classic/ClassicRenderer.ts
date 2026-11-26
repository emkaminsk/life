import type { LifeEngine } from './LifeEngine';

export const CLASSIC_COLORS = Object.freeze({
  dead: '#f4f6fb',
  alive: '#1f3a93',
  grid: '#d5dbe8',
});

/** Smallest cell, in CSS pixels. */
export const MIN_CELL_PX = 2;
/** Grid lines only when cells are at least this big. */
export const GRID_MIN_CELL_PX = 6;
/** Cell size used before fit() got a usable area. */
export const FALLBACK_CELL_PX = 8;

/** Largest integer cell size (≥ MIN_CELL_PX) that fits cols×rows into availW×availH CSS pixels. */
export function fitCellSize(cols: number, rows: number, availW: number, availH: number): number {
  const w = availW > 0 ? availW / cols : Number.POSITIVE_INFINITY;
  const h = availH > 0 ? availH / rows : Number.POSITIVE_INFINITY;
  const size = Math.min(w, h);
  if (!Number.isFinite(size)) return FALLBACK_CELL_PX;
  return Math.max(MIN_CELL_PX, Math.floor(size));
}

/**
 * Draws a LifeEngine on a HiDPI canvas: the backing store is devicePixelRatio
 * times the CSS size, and every generation is a full redraw (background, then
 * one fillRect per live cell, then grid lines when cells are big enough).
 */
export class ClassicRenderer {
  cellSize = FALLBACK_CELL_PX;
  private cols = 1;
  private rows = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  /** Size the canvas for a cols×rows board inside availW×availH CSS pixels. */
  fit(cols: number, rows: number, availW: number, availH: number): void {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = fitCellSize(cols, rows, availW, availH);
    const cssW = cols * this.cellSize;
    const cssH = rows * this.cellSize;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
  }

  draw(engine: LifeEngine): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const size = this.cellSize;
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.cols * size;
    const cssH = this.rows * size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = CLASSIC_COLORS.dead;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = CLASSIC_COLORS.alive;
    // Leave a 1px gap between neighbours when the grid is drawn so cells stay distinct.
    const inner = size >= GRID_MIN_CELL_PX ? size - 1 : size;
    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        if (engine.get(x, y)) ctx.fillRect(x * size, y * size, inner, inner);
      }
    }
    if (size < GRID_MIN_CELL_PX) return;
    ctx.strokeStyle = CLASSIC_COLORS.grid;
    ctx.lineWidth = 1 / dpr;
    ctx.beginPath();
    for (let x = 0; x <= this.cols; x++) {
      ctx.moveTo(x * size, 0);
      ctx.lineTo(x * size, cssH);
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.moveTo(0, y * size);
      ctx.lineTo(cssW, y * size);
    }
    ctx.stroke();
  }

  /** Board cell under a pointer position (client coordinates), or null outside the board. */
  cellAt(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    // Scale in case CSS stretched the canvas (rect differs from the size set in fit()).
    const scaleX = rect.width > 0 ? (this.cols * this.cellSize) / rect.width : 1;
    const scaleY = rect.height > 0 ? (this.rows * this.cellSize) / rect.height : 1;
    const x = Math.floor(((clientX - rect.left) * scaleX) / this.cellSize);
    const y = Math.floor(((clientY - rect.top) * scaleY) / this.cellSize);
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return { x, y };
  }
}
