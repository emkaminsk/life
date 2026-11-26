import { Random } from '../utils/Random';
import type { Pattern } from './patterns';
import type { LifeRule } from './rules';

/**
 * - active: the board is still changing
 * - stable: nothing changed in the last generation (a still life)
 * - oscillating: the board is the same as two generations ago (period 2, e.g. a blinker)
 * - extinct: no live cells
 */
export type LifeStatus = 'active' | 'stable' | 'oscillating' | 'extinct';

export type PlaceResult = { ok: true } | { ok: false; error: 'patternTooBig' };

/**
 * Pure life-like cellular automaton on a torus (edges wrap around).
 *
 * The cells live in two Uint8Array buffers (1 = alive), swapped after each
 * step: the new generation is written over the previous one, which is exactly
 * the state two generations before the new one, so detecting period 2 costs
 * one comparison per cell.
 */
export class LifeEngine {
  generation = 0;
  population = 0;
  /** Cells that changed in the last step. */
  lastChanged = 0;

  private cells: Uint8Array;
  private previous: Uint8Array;
  /** Steps since the last edit (history is only meaningful after 1 or 2). */
  private history = 0;
  private sameAsTwoBack = false;
  /** Row start index of the row above / below; column index left / right (wrapped). */
  private readonly rowUp: Int32Array;
  private readonly rowDown: Int32Array;
  private readonly colLeft: Int32Array;
  private readonly colRight: Int32Array;

  constructor(
    readonly width: number,
    readonly height: number,
    public rule: LifeRule,
  ) {
    const size = width * height;
    this.cells = new Uint8Array(size);
    this.previous = new Uint8Array(size);
    this.rowUp = Int32Array.from({ length: height }, (_, y) => ((y - 1 + height) % height) * width);
    this.rowDown = Int32Array.from({ length: height }, (_, y) => ((y + 1) % height) * width);
    this.colLeft = Int32Array.from({ length: width }, (_, x) => (x - 1 + width) % width);
    this.colRight = Int32Array.from({ length: width }, (_, x) => (x + 1) % width);
  }

  private index(x: number, y: number): number {
    const w = this.width;
    const h = this.height;
    return (((y % h) + h) % h) * w + (((x % w) + w) % w);
  }

  /** Is the cell alive? Coordinates wrap around. */
  get(x: number, y: number): boolean {
    return this.cells[this.index(x, y)] === 1;
  }

  set(x: number, y: number, alive: boolean): void {
    const i = this.index(x, y);
    const value = alive ? 1 : 0;
    if (this.cells[i] === value) return;
    this.cells[i] = value;
    this.population += alive ? 1 : -1;
    this.history = 0;
  }

  /** Flip a cell; returns its new state. */
  toggle(x: number, y: number): boolean {
    const alive = !this.get(x, y);
    this.set(x, y, alive);
    return alive;
  }

  clear(): void {
    this.cells.fill(0);
    this.population = 0;
    this.history = 0;
  }

  /** Every cell alive with probability `density` (0–1), drawn from Random. */
  randomFill(density: number): void {
    let population = 0;
    for (let i = 0; i < this.cells.length; i++) {
      const alive = Random.next() < density ? 1 : 0;
      this.cells[i] = alive;
      population += alive;
    }
    this.population = population;
    this.history = 0;
  }

  /** Clear the board and put the pattern in the middle. */
  placePattern(pattern: Pattern): PlaceResult {
    if (pattern.width > this.width || pattern.height > this.height) return { ok: false, error: 'patternTooBig' };
    this.clear();
    const left = Math.floor((this.width - pattern.width) / 2);
    const top = Math.floor((this.height - pattern.height) / 2);
    for (const [x, y] of pattern.cells) this.set(left + x, top + y, true);
    return { ok: true };
  }

  /** Advance one generation; returns the number of cells that changed. */
  step(): number {
    const width = this.width;
    const height = this.height;
    const rowUp = this.rowUp;
    const rowDown = this.rowDown;
    const colLeft = this.colLeft;
    const colRight = this.colRight;
    const cur = this.cells;
    const out = this.previous; // two generations before the new one: overwritten by it
    const birth = this.rule.birth;
    const survive = this.rule.survive;
    let changed = 0;
    let diffTwoBack = 0;
    let population = 0;
    for (let y = 0; y < height; y++) {
      const up = rowUp[y];
      const row = y * width;
      const down = rowDown[y];
      for (let x = 0; x < width; x++) {
        const l = colLeft[x];
        const r = colRight[x];
        const n =
          cur[up + l] +
          cur[up + x] +
          cur[up + r] +
          cur[row + l] +
          cur[row + r] +
          cur[down + l] +
          cur[down + x] +
          cur[down + r];
        const i = row + x;
        const alive = cur[i];
        const next = ((alive ? survive : birth) >> n) & 1;
        if (next !== alive) changed++;
        if (next !== out[i]) diffTwoBack++;
        out[i] = next;
        population += next;
      }
    }
    this.previous = cur;
    this.cells = out;
    this.population = population;
    this.lastChanged = changed;
    this.history++;
    this.sameAsTwoBack = this.history >= 2 && diffTwoBack === 0;
    this.generation++;
    return changed;
  }

  status(): LifeStatus {
    if (this.population === 0) return 'extinct';
    if (this.history >= 1 && this.lastChanged === 0) return 'stable';
    if (this.sameAsTwoBack) return 'oscillating';
    return 'active';
  }
}
