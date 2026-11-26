import type { Genome } from '../types';
import { Random } from './Random';

/** Sane bounds for every gene (Gaussian sampling and mutation can otherwise go negative). */
export const GENE_BOUNDS: Readonly<Record<keyof Genome, { min: number; max: number }>> = {
  maxHealth: { min: 1, max: Infinity },
  strength: { min: 0.1, max: Infinity },
  metabolism: { min: 0, max: 1 },
  greed: { min: 0, max: 1 },
  caution: { min: 0, max: 1 },
};

// biome-ignore lint/complexity/noStaticOnlyClass: namespace-style utility kept for API stability
export class GenomeUtils {
  static readonly MUTATION_CHANCE = 0.2; // 20% chance per gene

  /** Mutation variance per gene (uniform in [-variance, +variance]). */
  static readonly MUTATION_VARIANCE: Readonly<Record<keyof Genome, number>> = {
    maxHealth: 10,
    strength: 2,
    metabolism: 0.05,
    greed: 0.1,
    caution: 0.1,
  };

  /**
   * Creates a random genome based on configuration averages
   */
  static createRandomGenome(avgMaxHealth: number, avgStrength: number, avgGreed: number, avgCaution: number): Genome {
    return GenomeUtils.clampGenome({
      maxHealth: GenomeUtils.gaussianRandom(avgMaxHealth, avgMaxHealth * 0.2), // 20% variance
      strength: GenomeUtils.gaussianRandom(avgStrength, avgStrength * 0.2), // 20% variance
      metabolism: GenomeUtils.gaussianRandom(0.1, 0.05), // Avg 0.1 energy per turn
      greed: GenomeUtils.gaussianRandom(avgGreed, 0.2),
      caution: GenomeUtils.gaussianRandom(avgCaution, 0.2),
    });
  }

  /**
   * Creates a new genome by combining two parents (each gene picked from the mother
   * when Random.chance(0.5) succeeds, otherwise from the father) and mutating.
   * Genes are always clamped to GENE_BOUNDS.
   */
  static crossover(mother: Genome, father: Genome): Genome {
    const pick = (gene: keyof Genome): number =>
      GenomeUtils.clampGene(
        gene,
        GenomeUtils.mutate(Random.chance(0.5) ? mother[gene] : father[gene], GenomeUtils.MUTATION_VARIANCE[gene]),
      );
    return {
      maxHealth: pick('maxHealth'),
      strength: pick('strength'),
      metabolism: pick('metabolism'),
      greed: pick('greed'),
      caution: pick('caution'),
    };
  }

  /** Clamp every gene of a genome to GENE_BOUNDS (returns a new object). */
  static clampGenome(genome: Genome): Genome {
    return {
      maxHealth: GenomeUtils.clampGene('maxHealth', genome.maxHealth),
      strength: GenomeUtils.clampGene('strength', genome.strength),
      metabolism: GenomeUtils.clampGene('metabolism', genome.metabolism),
      greed: GenomeUtils.clampGene('greed', genome.greed),
      caution: GenomeUtils.clampGene('caution', genome.caution),
    };
  }

  static clampGene(gene: keyof Genome, value: number): number {
    const { min, max } = GENE_BOUNDS[gene];
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Mutates a value slightly (with probability MUTATION_CHANCE)
   */
  private static mutate(value: number, variance: number): number {
    if (Random.chance(GenomeUtils.MUTATION_CHANCE)) {
      const mutation = (Random.next() * 2 - 1) * variance; // -variance to +variance
      return value + mutation;
    }
    return value;
  }

  /**
   * Generate number from normal distribution
   * Uses Box-Muller transform
   */
  private static gaussianRandom(mean: number, stdDev: number): number {
    const u = 1 - Random.next(); // Converting [0,1) to (0,1]
    const v = Random.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
}
