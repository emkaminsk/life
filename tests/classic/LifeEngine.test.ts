import { describe, expect, it } from 'vitest';
import { LifeEngine } from '../../src/classic/LifeEngine';
import { PATTERN_IDS, PATTERNS, parsePattern } from '../../src/classic/patterns';
import { type LifeRule, parseRule } from '../../src/classic/rules';
import { Random } from '../../src/utils/Random';

const rule = (text: string): LifeRule => {
  const r = parseRule(text);
  if (!r.ok) throw new Error(text);
  return r.rule;
};
const conway = (w: number, h: number) => new LifeEngine(w, h, rule('B3/S23'));

const alive = (e: LifeEngine): string[] => {
  const cells: string[] = [];
  for (let y = 0; y < e.height; y++) for (let x = 0; x < e.width; x++) if (e.get(x, y)) cells.push(`${x},${y}`);
  return cells;
};
const put = (e: LifeEngine, cells: [number, number][], dx = 0, dy = 0) => {
  for (const [x, y] of cells) e.set(x + dx, y + dy, true);
};
const shifted = (cells: [number, number][], dx: number, dy: number, w: number, h: number) =>
  cells
    .map(([x, y]) => [(x + dx + w) % w, (y + dy + h) % h])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([x, y]) => `${x},${y}`);

const GLIDER: [number, number][] = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

describe('LifeEngine basics', () => {
  it('set / get / toggle / clear keep the population in sync; coordinates wrap', () => {
    const e = conway(10, 10);
    e.set(1, 1, true);
    e.set(1, 1, true); // no double count
    expect(e.population).toBe(1);
    expect(e.get(11, -9)).toBe(true);
    expect(e.toggle(1, 1)).toBe(false);
    expect(e.toggle(2, 2)).toBe(true);
    expect(e.population).toBe(1);
    e.clear();
    expect(e.population).toBe(0);
    expect(e.status()).toBe('extinct');
  });

  it('blinker has period 2 and is reported as oscillating', () => {
    const e = conway(5, 5);
    put(e, [
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
    const start = alive(e);
    expect(e.step()).toBe(4); // 2 die, 2 are born
    expect(alive(e)).toEqual(['2,1', '2,2', '2,3']);
    expect(e.status()).toBe('active'); // only one generation of history
    e.step();
    expect(alive(e)).toEqual(start);
    expect(e.status()).toBe('oscillating');
    expect(e.generation).toBe(2);
    expect(e.population).toBe(3);
  });

  it('a block is a still life (stable, 0 changes)', () => {
    const e = conway(6, 6);
    put(e, [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ]);
    expect(e.step()).toBe(0);
    expect(e.status()).toBe('stable');
    e.toggle(0, 0); // an edit resets the history
    expect(e.status()).toBe('active');
  });

  it('a glider moves (+1, +1) every 4 generations, also across the wrap', () => {
    const e = conway(8, 8);
    put(e, GLIDER, 5, 5); // occupies x 5..7, y 5..7: the next moves wrap
    for (let i = 1; i <= 8; i++) {
      e.step();
      if (i % 4 === 0) expect(alive(e)).toEqual(shifted(GLIDER, 5 + i / 4, 5 + i / 4, 8, 8));
    }
    expect(e.population).toBe(5);
  });

  it('a corner cell counts neighbours on the opposite edges', () => {
    const e = conway(6, 6);
    // Three neighbours of (0,0), all across the edges: (5,5), (5,0), (0,5).
    put(e, [
      [5, 5],
      [5, 0],
      [0, 5],
    ]);
    e.step();
    expect(e.get(0, 0)).toBe(true); // born with exactly 3 wrapped neighbours
  });

  it('seeded random fill is deterministic and near the density', () => {
    Random.seed(42);
    const a = conway(40, 40);
    a.randomFill(0.3);
    Random.seed(42);
    const b = conway(40, 40);
    b.randomFill(0.3);
    expect(alive(a)).toEqual(alive(b));
    expect(a.population).toBe(alive(a).length);
    expect(a.population / 1600).toBeGreaterThan(0.25);
    expect(a.population / 1600).toBeLessThan(0.35);
  });
});

describe('patterns', () => {
  it('placePattern centres the pattern and clears the board', () => {
    const e = conway(9, 9);
    e.set(0, 0, true);
    expect(e.placePattern(PATTERNS.glider)).toEqual({ ok: true });
    expect(alive(e)).toEqual(shifted(GLIDER, 3, 3, 9, 9));
    const even = conway(10, 4);
    even.placePattern(parsePattern('glider', ['OO']));
    expect(alive(even)).toEqual(['4,1', '5,1']);
  });

  it('returns patternTooBig when the pattern does not fit', () => {
    const e = conway(20, 20);
    expect(e.placePattern(PATTERNS.gosperGun)).toEqual({ ok: false, error: 'patternTooBig' });
    expect(conway(40, 8).placePattern(PATTERNS.gosperGun)).toEqual({ ok: false, error: 'patternTooBig' });
  });

  it('every pattern parses to its known size and cell count', () => {
    const expected: Record<string, [number, number, number]> = {
      glider: [3, 3, 5],
      lwss: [5, 4, 9],
      pulsar: [13, 13, 48],
      rPentomino: [3, 3, 5],
      gosperGun: [36, 9, 36],
      acorn: [7, 3, 7],
      diehard: [8, 3, 7],
      pentadecathlon: [10, 3, 12],
    };
    for (const id of PATTERN_IDS) {
      const p = PATTERNS[id];
      expect([p.width, p.height, p.cells.length], id).toEqual(expected[id]);
    }
  });

  it('the Gosper glider gun emits gliders (population grows over 120 generations)', () => {
    const e = conway(80, 60);
    e.placePattern(PATTERNS.gosperGun);
    expect(e.population).toBe(36);
    for (let i = 0; i < 120; i++) e.step();
    // Period 30: the gun returns to 36 cells and every glider adds 5.
    expect(e.population).toBeGreaterThanOrEqual(36 + 3 * 5);
    expect(e.status()).toBe('active');
  });

  it('the pulsar has period 3 and the pentadecathlon period 15', () => {
    for (const [id, period] of [
      ['pulsar', 3],
      ['pentadecathlon', 15],
    ] as const) {
      const e = conway(30, 30);
      e.placePattern(PATTERNS[id]);
      const start = alive(e);
      for (let i = 0; i < period; i++) e.step();
      expect(alive(e), id).toEqual(start);
    }
  });

  it('diehard dies out after 130 generations', () => {
    const e = conway(60, 60);
    e.placePattern(PATTERNS.diehard);
    for (let i = 0; i < 129; i++) e.step();
    expect(e.population).toBeGreaterThan(0);
    e.step();
    expect(e.status()).toBe('extinct');
  });
});

describe('other rules', () => {
  it('Seeds (B2/S): every live cell dies, two cells seed new ones', () => {
    const e = new LifeEngine(10, 10, rule('B2/S'));
    put(e, [
      [4, 4],
      [5, 4],
    ]);
    e.step();
    expect(e.get(4, 4) || e.get(5, 4)).toBe(false);
    expect(alive(e)).toEqual(['4,3', '5,3', '4,5', '5,5']);
  });

  it('HighLife (B36/S23) births on 6 neighbours where Conway does not', () => {
    const six: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 2],
      [1, 2],
      [2, 2],
    ];
    const high = new LifeEngine(7, 7, rule('B36/S23'));
    const life = conway(7, 7);
    put(high, six, 2, 2);
    put(life, six, 2, 2);
    high.step();
    life.step();
    expect(high.get(3, 3)).toBe(true);
    expect(life.get(3, 3)).toBe(false);
  });

  it('the HighLife replicator copies itself (12 generations → 2 replicators)', () => {
    const e = new LifeEngine(40, 40, rule('B36/S23'));
    e.placePattern(parsePattern('glider', ['..OOO', '.O..O', 'O...O', 'O..O.', 'OOO..']));
    for (let i = 0; i < 12; i++) e.step();
    expect(e.population).toBe(24); // two copies of the 12-cell replicator
  });
});

describe('performance', () => {
  // Measured ~0.6 ms per step on a 200×200 board (target < 5 ms); the bound is loose for slow CI.
  it('steps a 200×200 board quickly', () => {
    Random.seed(1);
    const e = conway(200, 200);
    e.randomFill(0.3);
    e.step(); // warm-up (JIT)
    const runs = 20;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) e.step();
    const perStep = (performance.now() - t0) / runs;
    expect(perStep).toBeLessThan(25);
  });
});
