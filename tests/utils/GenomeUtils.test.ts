import { describe, it, expect, vi } from 'vitest';
import { GenomeUtils, GENE_BOUNDS, LONGEVITY_MEAN } from '../../src/utils/GenomeUtils';
import { Random } from '../../src/utils/Random';
import type { Genome } from '../../src/types';

const mother: Genome = { maxHealth: 90, strength: 1.2, metabolism: 0.1, greed: 0.6, caution: 0.1, longevity: 0.8 };
const father: Genome = { maxHealth: 120, strength: 0.8, metabolism: 0.2, greed: 0.4, caution: 0.3, longevity: 1.3 };
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
      for (const parentRoll of [0.1, 0.9, 0.1, 0.9, 0.1, 0.9]) {
        spy.mockReturnValueOnce(parentRoll).mockReturnValueOnce(0.5);
      }
      expect(GenomeUtils.crossover(mother, father)).toEqual({
        maxHealth: mother.maxHealth,
        strength: father.strength,
        metabolism: mother.metabolism,
        greed: father.greed,
        caution: mother.caution,
        longevity: father.longevity,
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
        strength: 0.25,
        metabolism: 0.01,
        greed: 0.05,
        caution: 0.02,
        longevity: 0.55,
      };
      const child = GenomeUtils.crossover(tiny, tiny);
      expect(child).toEqual({ maxHealth: 1, strength: 0.1, metabolism: 0, greed: 0, caution: 0, longevity: 0.5 });
    });

    it('strength mutation stays within ±20 % of a mean-1 multiplier (seeded, 2000 children)', () => {
      Random.seed(5);
      const parent: Genome = { ...mother, strength: 1 };
      let min = Infinity;
      let max = -Infinity;
      let mutated = 0;
      for (let i = 0; i < 2000; i++) {
        const s = GenomeUtils.crossover(parent, parent).strength;
        min = Math.min(min, s);
        max = Math.max(max, s);
        if (s !== 1) mutated++;
      }
      expect(min).toBeGreaterThanOrEqual(0.8);
      expect(max).toBeLessThanOrEqual(1.2);
      // ~MUTATION_CHANCE of children actually mutate, so the bound is exercised
      expect(mutated).toBeGreaterThan(300);
      expect(max - min).toBeGreaterThan(0.3);
    });

    it('mutation (roll ~1 → +variance) is clamped to the [0,1] genes', () => {
      const spy = vi.spyOn(Math, 'random');
      for (let i = 0; i < 6; i++) spy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.1).mockReturnValueOnce(0.999);
      const high: Genome = {
        maxHealth: 100,
        strength: 1,
        metabolism: 0.99,
        greed: 0.99,
        caution: 0.99,
        longevity: 1.95,
      };
      const child = GenomeUtils.crossover(high, high);
      expect(child.metabolism).toBe(1);
      expect(child.greed).toBe(1);
      expect(child.caution).toBe(1);
      expect(child.longevity).toBe(2);
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

  describe('longevity gene', () => {
    it('has bounds 0.5–2.0 and mutation variance 0.1', () => {
      expect(GENE_BOUNDS.longevity).toEqual({ min: 0.5, max: 2.0 });
      expect(GenomeUtils.MUTATION_VARIANCE.longevity).toBe(0.1);
    });

    it('random genomes centre longevity on the mean of 1 (seeded)', () => {
      Random.seed(7);
      let sum = 0;
      for (let i = 0; i < 2000; i++) sum += GenomeUtils.createRandomGenome(100, 1, 0.5, 0.5).longevity;
      expect(LONGEVITY_MEAN).toBe(1);
      expect(sum / 2000).toBeGreaterThan(0.97);
      expect(sum / 2000).toBeLessThan(1.03);
    });

    it('is inherited from either parent', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(GenomeUtils.crossover(mother, father).longevity).toBe(mother.longevity);
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(GenomeUtils.crossover(mother, father).longevity).toBe(father.longevity);
    });
  });

  describe('createRandomGenome averages', () => {
    it('centres metabolism and caution on the requested averages (seeded)', () => {
      Random.seed(8);
      let metabolism = 0;
      let caution = 0;
      const n = 2000;
      for (let i = 0; i < n; i++) {
        const g = GenomeUtils.createRandomGenome(100, 1, 0.5, 0.5, 0.4);
        metabolism += g.metabolism;
        caution += g.caution;
      }
      expect(metabolism / n).toBeGreaterThan(0.37);
      expect(metabolism / n).toBeLessThan(0.43);
      expect(caution / n).toBeGreaterThan(0.47);
      expect(caution / n).toBeLessThan(0.53);
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
          longevity: 7,
        }),
      ).toEqual({
        maxHealth: 1,
        strength: 0.1,
        metabolism: 0,
        greed: 1,
        caution: 0,
        longevity: 2,
      });
      expect(GenomeUtils.clampGene('metabolism', Number.NaN)).toBe(0);
      expect(GenomeUtils.clampGene('maxHealth', 500)).toBe(500);
    });
  });
});
