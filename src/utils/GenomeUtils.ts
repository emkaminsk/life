import { Genome } from '../types';
import { Random } from './Random';

export class GenomeUtils {
  private static readonly MUTATION_CHANCE = 0.2; // 20% chance per gene

  /**
   * Creates a random genome based on configuration averages
   */
  static createRandomGenome(
    avgMaxHealth: number,
    avgStrength: number,
    avgGreed: number,
    avgCaution: number
  ): Genome {
    return {
      maxHealth: this.gaussianRandom(avgMaxHealth, avgMaxHealth * 0.2), // 20% variance
      strength: this.gaussianRandom(avgStrength, avgStrength * 0.2),    // 20% variance
      metabolism: this.gaussianRandom(0.1, 0.05), // Avg 0.1 energy per turn
      greed: this.clamp(this.gaussianRandom(avgGreed, 0.2), 0, 1),
      caution: this.clamp(this.gaussianRandom(avgCaution, 0.2), 0, 1)
    };
  }

  /**
   * Creates a new genome by combining two parents and mutating
   */
  static crossover(mother: Genome, father: Genome): Genome {
    return {
      maxHealth: this.mutate(Random.chance(0.5) ? mother.maxHealth : father.maxHealth, 10),
      strength: this.mutate(Random.chance(0.5) ? mother.strength : father.strength, 2),
      metabolism: this.mutate(Random.chance(0.5) ? mother.metabolism : father.metabolism, 0.05, 0, 1),
      greed: this.mutate(Random.chance(0.5) ? mother.greed : father.greed, 0.1, 0, 1),
      caution: this.mutate(Random.chance(0.5) ? mother.caution : father.caution, 0.1, 0, 1)
    };
  }

  /**
   * Mutates a value slightly
   */
  private static mutate(value: number, variance: number, min?: number, max?: number): number {
    if (Random.chance(this.MUTATION_CHANCE)) {
      const mutation = (Math.random() * 2 - 1) * variance; // -variance to +variance
      let result = value + mutation;
      
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      
      return result;
    }
    return value;
  }

  /**
   * Generate number from normal distribution
   * Uses Box-Muller transform
   */
  private static gaussianRandom(mean: number, stdDev: number): number {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

