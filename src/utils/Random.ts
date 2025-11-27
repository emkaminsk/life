import type { Position } from '../types';

export class Random {
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
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Return true with given probability (0-1)
   */
  static chance(probability: number): boolean {
    return Math.random() < probability;
  }

  /**
   * Select random element from array
   */
  static choice<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Find positions that minimize distance to target
   */
  static getClosestPositions(
    positions: Position[],
    targetX: number,
    targetY: number
  ): Position[] {
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
    range: number
  ): T[] {
    return entities.filter(entity => {
      const dist = Random.distance(centerX, centerY, entity.x, entity.y);
      return dist <= range && dist > 0; // Exclude self
    });
  }
}
