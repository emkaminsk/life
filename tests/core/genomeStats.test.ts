import { describe, it, expect } from 'vitest';
import { Board } from '../../src/core/Board';
import { computeGenomeSnapshot, GenomeHistory, GENOME_TRAITS } from '../../src/core/genomeStats';
import { Human } from '../../src/entities/Human';
import { Wolf } from '../../src/entities/Wolf';
import { type Genome, type GenomeSnapshot, Sex } from '../../src/types';

const genome = (v: number): Genome => ({
  maxHealth: 100 * v,
  strength: v,
  metabolism: v / 2,
  greed: v / 4,
  caution: v / 5,
  longevity: v,
});

function place(board: Board, x: number, y: number, sex: Sex, g: Genome): Human {
  const human = new Human(x, y, sex, undefined, undefined, undefined, g);
  board.setEntity(x, y, human);
  return human;
}

const snap = (round: number): GenomeSnapshot => ({ round, maleAverage: genome(1), femaleAverage: null });

describe('computeGenomeSnapshot', () => {
  it('averages every gene separately for living males and females', () => {
    const board = new Board(4, 4);
    place(board, 0, 0, Sex.MALE, genome(1));
    place(board, 1, 0, Sex.MALE, genome(2));
    place(board, 2, 0, Sex.FEMALE, genome(0.8));
    board.setEntity(3, 3, new Wolf(3, 3));

    const s = computeGenomeSnapshot(board, 7);

    expect(s.round).toBe(7);
    expect(s.maleAverage).not.toBeNull();
    for (const trait of GENOME_TRAITS) {
      expect(s.maleAverage?.[trait]).toBeCloseTo((genome(1)[trait] + genome(2)[trait]) / 2, 10);
      expect(s.femaleAverage?.[trait]).toBeCloseTo(genome(0.8)[trait], 10);
    }
  });

  it('counts pregnant females and ignores dead humans', () => {
    const board = new Board(3, 3);
    const pregnant = place(board, 0, 0, Sex.FEMALE, genome(1));
    pregnant.pregnancyCounter = 3;
    place(board, 1, 0, Sex.FEMALE, genome(2));
    const dead = place(board, 2, 0, Sex.MALE, genome(5));
    dead.health = 0;

    const s = computeGenomeSnapshot(board, 1);

    expect(s.femaleAverage?.strength).toBeCloseTo(1.5);
    expect(s.maleAverage).toBeNull();
  });

  it('reports null (not NaN or 0) for a sex with no living members', () => {
    const empty = computeGenomeSnapshot(new Board(2, 2), 0);
    expect(empty).toEqual({ round: 0, maleAverage: null, femaleAverage: null });

    const board = new Board(2, 2);
    place(board, 0, 0, Sex.MALE, genome(1));
    const onlyMales = computeGenomeSnapshot(board, 2);
    expect(onlyMales.femaleAverage).toBeNull();
    expect(onlyMales.maleAverage?.maxHealth).toBe(100);
  });
});

describe('GenomeHistory', () => {
  it('keeps every round below the limit and returns them in order', () => {
    const history = new GenomeHistory(10);
    for (let r = 0; r < 10; r++) history.record(snap(r));
    expect(history.getSnapshots().map((s) => s.round)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(history.getLatest()?.round).toBe(9);
  });

  it('stays bounded over a very long game while keeping the first and the latest round', () => {
    const max = 100;
    const history = new GenomeHistory(max);
    for (let r = 0; r <= 20_000; r++) {
      history.record(snap(r));
      // the latest round is always available for the legend
      if (r % 997 === 0) expect(history.getSnapshots().slice(-1)[0]?.round).toBe(r);
    }
    const rounds = history.getSnapshots().map((s) => s.round);
    expect(rounds.length).toBeLessThanOrEqual(max + 1);
    expect(rounds.length).toBeGreaterThan(max / 2);
    expect(rounds[0]).toBe(0);
    expect(rounds[rounds.length - 1]).toBe(20_000);
    for (let i = 1; i < rounds.length; i++) expect(rounds[i]).toBeGreaterThan(rounds[i - 1]);
    // samples stay spread over the whole game rather than bunching at the start
    expect(rounds[Math.floor(rounds.length / 2)]).toBeGreaterThan(5_000);
    expect(rounds[Math.floor(rounds.length / 2)]).toBeLessThan(15_000);
  });

  it('reset() forgets everything and restarts at full resolution', () => {
    const history = new GenomeHistory(4);
    for (let r = 0; r < 50; r++) history.record(snap(r));
    history.reset();
    expect(history.getSnapshots()).toEqual([]);
    expect(history.getLatest()).toBeNull();
    for (let r = 0; r < 3; r++) history.record(snap(r));
    expect(history.getSnapshots().map((s) => s.round)).toEqual([0, 1, 2]);
  });

  it('rejects a limit that cannot hold a first and a latest snapshot', () => {
    expect(() => new GenomeHistory(1)).toThrow(RangeError);
  });
});
