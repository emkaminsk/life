import { describe, it, expect, afterEach, vi } from 'vitest';
import { Random } from '../../src/utils/Random';

afterEach(() => Random.useMathRandom());

const draw = (n: number): number[] => Array.from({ length: n }, () => Random.next());

describe('Random', () => {
  describe('seed', () => {
    it('produces the same sequence for the same seed', () => {
      Random.seed(42);
      const a = draw(50);
      Random.seed(42);
      expect(draw(50)).toEqual(a);
    });

    it('produces different sequences for different seeds', () => {
      Random.seed(1);
      const a = draw(10);
      Random.seed(2);
      expect(draw(10)).not.toEqual(a);
    });

    it('does not call Math.random while seeded, and useMathRandom restores it', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.25);
      Random.seed(7);
      draw(5);
      expect(spy).not.toHaveBeenCalled();
      Random.useMathRandom();
      expect(Random.next()).toBe(0.25);
    });
  });

  describe('next', () => {
    it('always returns floats in [0, 1)', () => {
      Random.seed(123);
      for (const v of draw(10000)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('is roughly uniform (seeded)', () => {
      Random.seed(9);
      const values = draw(10000);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      expect(mean).toBeGreaterThan(0.48);
      expect(mean).toBeLessThan(0.52);
    });
  });

  describe('chance', () => {
    it('is true exactly when the draw is below the probability', () => {
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.29).mockReturnValueOnce(0.3);
      expect(Random.chance(0.3)).toBe(true);
      expect(Random.chance(0.3)).toBe(false);
    });

    it('is never true for 0 and always true for 1', () => {
      Random.seed(5);
      for (let i = 0; i < 1000; i++) {
        expect(Random.chance(0)).toBe(false);
        expect(Random.chance(1)).toBe(true);
      }
    });

    it('matches the probability on average (seeded)', () => {
      Random.seed(17);
      let hits = 0;
      for (let i = 0; i < 10000; i++) if (Random.chance(0.2)) hits++;
      expect(hits / 10000).toBeGreaterThan(0.18);
      expect(hits / 10000).toBeLessThan(0.22);
    });
  });

  describe('choice', () => {
    it('returns null for an empty array', () => {
      expect(Random.choice([])).toBeNull();
    });

    it('stays within bounds, including the edges of [0, 1)', () => {
      const items = ['a', 'b', 'c'];
      vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9999999);
      expect(Random.choice(items)).toBe('a');
      expect(Random.choice(items)).toBe('c');
    });

    it('picks every element eventually (seeded)', () => {
      Random.seed(3);
      const seen = new Set<number>();
      for (let i = 0; i < 200; i++) seen.add(Random.choice([0, 1, 2, 3, 4]) as number);
      expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('distance / getClosestPositions', () => {
    it('uses Manhattan distance', () => {
      expect(Random.distance(0, 0, 3, -4)).toBe(7);
    });

    it('returns all positions tied for the minimum distance', () => {
      const positions = [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 2, y: 2 },
      ];
      expect(Random.getClosestPositions(positions, 0, 0)).toEqual([
        { x: 0, y: 1 },
        { x: 1, y: 0 },
      ]);
      expect(Random.getClosestPositions([], 0, 0)).toEqual([]);
    });
  });
});
