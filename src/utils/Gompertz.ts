/**
 * Gompertz mortality calculation
 *
 * Probability of death = 1 - e^(-A * multiplier * e^(B * age))
 *
 * Where:
 * - A: baseline mortality rate
 * - B: rate of exponential increase with age
 * - age: current age of the entity
 * - multiplier: overcrowding multiplier (optional, default: 1)
 */
export class Gompertz {
  /**
   * Calculate probability of death from age
   */
  static deathProbability(age: number, A: number, B: number, multiplier: number = 1): number {
    const exponent = -A * multiplier * Math.exp(B * age);
    return 1 - Math.exp(exponent);
  }

  /**
   * Determine if entity dies based on age
   */
  static shouldDie(age: number, A: number, B: number, multiplier: number = 1): boolean {
    const probability = Gompertz.deathProbability(age, A, B, multiplier);
    return Math.random() < probability;
  }
}
