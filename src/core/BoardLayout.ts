import { Random } from '../utils/Random';
import type { BoardLayout, PlaceableKind } from './simulationEvents';

/**
 * Pure helpers for a hand-made starting board (manual setup, F1).
 * Every function returns a new layout and never mutates its input.
 */
export type { BoardLayout, PlaceableKind };

/** Palette order; digit keys 1–6 map onto this list. */
export const PLACEABLE_KINDS: readonly PlaceableKind[] = ['male', 'female', 'dog', 'wolf', 'fruit', 'mushroom'];

export interface CellPos {
  x: number;
  y: number;
}

/** Inclusive cell rectangle with x0 ≤ x1 and y0 ≤ y1. */
export interface CellRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function createEmptyLayout(width: number, height: number): BoardLayout {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  return { width: w, height: h, cells: new Array<PlaceableKind | null>(w * h).fill(null) };
}

function inBounds(layout: BoardLayout, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < layout.width && y < layout.height;
}

/** Content of a cell; null when empty or out of bounds. */
export function getCell(layout: BoardLayout, x: number, y: number): PlaceableKind | null {
  return inBounds(layout, x, y) ? layout.cells[y * layout.width + x] : null;
}

/** Place (or with null: erase) one cell. Out-of-bounds positions return the layout unchanged. */
export function setCell(layout: BoardLayout, x: number, y: number, kind: PlaceableKind | null): BoardLayout {
  if (!inBounds(layout, x, y) || getCell(layout, x, y) === kind) return layout;
  const cells = layout.cells.slice();
  cells[y * layout.width + x] = kind;
  return { ...layout, cells };
}

/** Rectangle spanned by two corner cells, in any order. */
export function normalizeRect(a: CellPos, b: CellPos): CellRect {
  return {
    x0: Math.min(a.x, b.x),
    y0: Math.min(a.y, b.y),
    x1: Math.max(a.x, b.x),
    y1: Math.max(a.y, b.y),
  };
}

/** Intersect a rectangle with the board; null when nothing is left. */
export function clampRect(rect: CellRect, width: number, height: number): CellRect | null {
  const x0 = Math.max(0, Math.ceil(rect.x0));
  const y0 = Math.max(0, Math.ceil(rect.y0));
  const x1 = Math.min(width - 1, Math.floor(rect.x1));
  const y1 = Math.min(height - 1, Math.floor(rect.y1));
  return x0 > x1 || y0 > y1 ? null : { x0, y0, x1, y1 };
}

/** Number of cells in a (normalised) rectangle. */
export function rectArea(rect: CellRect): number {
  return Math.max(0, rect.x1 - rect.x0 + 1) * Math.max(0, rect.y1 - rect.y0 + 1);
}

function mapRect(
  layout: BoardLayout,
  rect: CellRect,
  pick: (current: PlaceableKind | null) => PlaceableKind | null,
): BoardLayout {
  const r = clampRect(
    normalizeRect({ x: rect.x0, y: rect.y0 }, { x: rect.x1, y: rect.y1 }),
    layout.width,
    layout.height,
  );
  if (!r) return layout;
  const cells = layout.cells.slice();
  let changed = false;
  for (let y = r.y0; y <= r.y1; y++) {
    for (let x = r.x0; x <= r.x1; x++) {
      const i = y * layout.width + x;
      const next = pick(cells[i]);
      if (next !== cells[i]) {
        cells[i] = next;
        changed = true;
      }
    }
  }
  return changed ? { ...layout, cells } : layout;
}

/** Fill every cell of the rectangle (clamped to the board) with `kind`; null erases. */
export function fillRect(layout: BoardLayout, rect: CellRect, kind: PlaceableKind | null): BoardLayout {
  return mapRect(layout, rect, () => kind);
}

/**
 * Sprinkle `kind` over the rectangle: each EMPTY cell independently becomes `kind`
 * with probability `density` (0–1); placed items are never overwritten. Uses the
 * central, seedable Random so results are reproducible with Random.seed().
 */
export function randomFillRect(layout: BoardLayout, rect: CellRect, kind: PlaceableKind, density: number): BoardLayout {
  const p = Math.min(1, Math.max(0, density));
  return mapRect(layout, rect, (current) => (current === null && Random.chance(p) ? kind : current));
}

export function countKinds(layout: BoardLayout): Record<PlaceableKind, number> {
  const counts: Record<PlaceableKind, number> = { male: 0, female: 0, dog: 0, wolf: 0, fruit: 0, mushroom: 0 };
  for (const kind of layout.cells) if (kind) counts[kind]++;
  return counts;
}

/** New layout of width × height keeping the overlapping top-left region. */
export function resizeLayout(layout: BoardLayout, width: number, height: number): BoardLayout {
  const next = createEmptyLayout(width, height);
  const w = Math.min(layout.width, next.width);
  const h = Math.min(layout.height, next.height);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) next.cells[y * next.width + x] = layout.cells[y * layout.width + x];
  }
  return next;
}

export function isLayoutEmpty(layout: BoardLayout): boolean {
  return layout.cells.every((c) => c === null);
}
