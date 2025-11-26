/**
 * Gompertz mortality calculation
 *
 * Probability of death = 1 - e^(-A * e^(B * age))
 *
 * Where:
 * - A: baseline mortality rate
 * - B: rate of exponential increase with age
 * - age: current age of the entity
 */
export class Gompertz {
  /**
   * Calculate probability of death from age
   */
  static deathProbability(age: number, A: number, B: number): number {
    const exponent = -A * Math.exp(B * age);
    return 1 - Math.exp(exponent);
  }

  /**
   * Determine if entity dies based on age
   */
  static shouldDie(age: number, A: number, B: number): boolean {
    const probability = this.deathProbability(age, A, B);
    return Math.random() < probability;
  }
}
