import { describe, it, expect, vi } from 'vitest';
import { GenomeUtils, GENE_BOUNDS } from '../../src/utils/GenomeUtils';
import { Random } from '../../src/utils/Random';
import type { Genome } from '../../src/types';

const mother: Genome = { maxHealth: 90, strength: 1.2, metabolism: 0.1, greed: 0.6, caution: 0.1 };
const father: Genome = { maxHealth: 120, strength: 0.8, metabolism: 0.2, greed: 0.4, caution: 0.3 };
const GENES = Object.keys(mother) as (keyof Genome)[];

function expectWithinBounds(g: Genome): void {
  for (const gene of GENES) {
    expect(g[gene]).toBeGreaterThanOrEqual(GENE_BOUNDS[gene].min);
    expect(g[gene]).toBeLessThanOrEqual(GENE_BOUNDS[gene].max);
  }
}

describe('GenomeUtils', () => {
  describe('crossover', () => {
    it('takes each gene from the mother when the parent roll is < 0.5 (no mutation when roll ≥ 0.2)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(GenomeUtils.crossover(mother, father)).toEqual(mother);
    });

    it('takes each gene from the father when the parent roll is ≥ 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(GenomeUtils.crossover(mother, father)).toEqual(father);
    });

    it('can mix genes per gene', () => {
      // per gene: parent roll, mutation roll (≥ 0.2 → none)
      const spy = vi.spyOn(Math, 'random');
      for (const parentRoll of [0.1, 0.9, 0.1, 0.9, 0.1]) {
        spy.mockReturnValueOnce(parentRoll).mockReturnValueOnce(0.5);
      }
      expect(GenomeUtils.crossover(mother, father)).toEqual({
        maxHealth: mother.maxHealth,
        strength: father.strength,
        metabolism: mother.metabolism,
        greed: father.greed,
        caution: mother.caution,
      });
    });

    it('mutates by at most ±variance per gene', () => {
      Random.seed(99);
      for (let i = 0; i < 500; i++) {
        const child = GenomeUtils.crossover(mother, mother);
        for (const gene of GENES) {
          expect(Math.abs(child[gene] - mother[gene])).toBeLessThanOrEqual(GenomeUtils.MUTATION_VARIANCE[gene] + 1e-12);
        }
      }
    });

    it('mutation (roll 0 → −variance) is clamped to gene bounds', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const tiny: Genome = {
        maxHealth: 2,
        strength: 0.5,
        metabolism: 0.01,
        greed: 0.05,
        caution: 0.02,
      };
      const child = GenomeUtils.crossover(tiny, tiny);
      expect(child).toEqual({ maxHealth: 1, strength: 0.1, metabolism: 0, greed: 0, caution: 0 });
    });

    it('mutation (roll ~1 → +variance) is clamped to the [0,1] genes', () => {
      const spy = vi.spyOn(Math, 'random');
      for (let i = 0; i < 5; i++) spy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.1).mockReturnValueOnce(0.999);
      const high: Genome = {
        maxHealth: 100,
        strength: 1,
        metabolism: 0.99,
        greed: 0.99,
        caution: 0.99,
      };
      const child = GenomeUtils.crossover(high, high);
      expect(child.metabolism).toBe(1);
      expect(child.greed).toBe(1);
      expect(child.caution).toBe(1);
      expect(child.maxHealth).toBeGreaterThan(100);
    });
  });

  describe('createRandomGenome', () => {
    it('always produces genes within bounds, even for extreme averages (seeded)', () => {
      Random.seed(5);
      for (let i = 0; i < 1000; i++) {
        expectWithinBounds(GenomeUtils.createRandomGenome(2, 0.1, 0.99, 0.01));
      }
    });

    it('centres maxHealth on the requested average (seeded, wide bounds)', () => {
      Random.seed(6);
      let sum = 0;
      for (let i = 0; i < 2000; i++) sum += GenomeUtils.createRandomGenome(150, 1, 0.5, 0).maxHealth;
      expect(sum / 2000).toBeGreaterThan(140);
      expect(sum / 2000).toBeLessThan(160);
    });
  });

  describe('clampGenome / clampGene', () => {
    it('clamps negative or out-of-range genes and NaN', () => {
      expect(
        GenomeUtils.clampGenome({
          maxHealth: -5,
          strength: -1,
          metabolism: -0.3,
          greed: 1.7,
          caution: -2,
        }),
      ).toEqual({
        maxHealth: 1,
        strength: 0.1,
        metabolism: 0,
        greed: 1,
        caution: 0,
      });
      expect(GenomeUtils.clampGene('metabolism', Number.NaN)).toBe(0);
      expect(GenomeUtils.clampGene('maxHealth', 500)).toBe(500);
    });
  });
});
