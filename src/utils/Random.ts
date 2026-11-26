import type { Position } from '../types';

type RandomSource = () => number;

/**
 * Mulberry32: small, fast, deterministic PRNG returning floats in [0, 1).
 */
function mulberry32(seed: number): RandomSource {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Central source of randomness for the whole simulation.
 *
 * All game code must draw random numbers through this class (never call
 * Math.random directly) so experiments can be reproduced with a seed and
 * tests can be deterministic.
 *
 * By default it delegates to Math.random (so `vi.spyOn(Math, 'random')`
 * still controls it in tests). Call `Random.seed(n)` for a reproducible
 * sequence and `Random.useMathRandom()` to go back to the default.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: namespace-style utility kept for API stability
export class Random {
  private static source: RandomSource | null = null;

  /** Use a deterministic seeded sequence. */
  static seed(seed: number): void {
    Random.source = mulberry32(seed);
  }

  /** Restore the default (Math.random) source. */
  static useMathRandom(): void {
    Random.source = null;
  }

  /** Float in [0, 1). */
  static next(): number {
    return Random.source ? Random.source() : Math.random();
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  static int(min: number, max: number): number {
    return Math.floor(Random.next() * (max - min)) + min;
  }

  /**
   * Return true with given probability (0-1)
   */
  static chance(probability: number): boolean {
    return Random.next() < probability;
  }

  /**
   * Select random element from array
   */
  static choice<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    return array[Math.floor(Random.next() * array.length)];
  }

  /**
   * Find positions that minimize distance to target
   */
  static getClosestPositions(positions: Position[], targetX: number, targetY: number): Position[] {
    if (positions.length === 0) return [];

    let minDistance = Infinity;
    const closest: Position[] = [];

    for (const pos of positions) {
      const dist = Random.distance(pos.x, pos.y, targetX, targetY);
      if (dist < minDistance) {
        minDistance = dist;
        closest.length = 0;
        closest.push(pos);
      } else if (dist === minDistance) {
        closest.push(pos);
      }
    }

    return closest;
  }

  /**
   * Find all entities within perception range
   */
  static getEntitiesInRange<T extends { x: number; y: number }>(
    entities: T[],
    centerX: number,
    centerY: number,
    range: number,
  ): T[] {
    return entities.filter((entity) => {
      const dist = Random.distance(centerX, centerY, entity.x, entity.y);
      return dist <= range && dist > 0; // Exclude self
    });
  }
}
