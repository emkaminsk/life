import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationSystem } from '../../src/core/AnimationSystem';
import { Wolf, Dog } from '../../src/entities';

let t: number;

beforeEach(() => {
  t = 5000;
  vi.spyOn(performance, 'now').mockImplementation(() => t);
});

function oneMove() {
  const anim = new AnimationSystem();
  const wolf = new Wolf(3, 4); // already moved logically to (3,4)
  anim.startAnimations([{ entity: wolf, fromX: 1, fromY: 2, toX: 3, toY: 4 }], 200);
  return { anim, wolf };
}

describe('AnimationSystem interpolation', () => {
  it('starts at the from cell (progress 0)', () => {
    const { anim, wolf } = oneMove();
    expect(wolf.visualX).toBe(1);
    expect(wolf.visualY).toBe(2);
    anim.update();
    expect(wolf.visualX).toBe(1);
    expect(wolf.visualY).toBe(2);
    expect(anim.getVisualPosition(wolf)).toEqual({ x: 1, y: 2 });
    expect(anim.getProgress()).toBe(0);
  });

  it('is halfway at progress 0.5 (linear)', () => {
    const { anim, wolf } = oneMove();
    t += 100;
    anim.update();
    expect(wolf.visualX).toBeCloseTo(2);
    expect(wolf.visualY).toBeCloseTo(3);
    expect(anim.getVisualPosition(wolf)).toEqual({ x: wolf.visualX, y: wolf.visualY });
    expect(anim.isAnimating()).toBe(true);
  });

  it('ends exactly at the target and clears the batch at progress 1', () => {
    const { anim, wolf } = oneMove();
    t += 250;
    anim.update();
    expect(wolf.visualX).toBe(3);
    expect(wolf.visualY).toBe(4);
    expect(anim.isAnimating()).toBe(false);
    expect(anim.isAnimatingEntity(wolf)).toBe(false);
    expect(anim.getVisualPosition(wolf)).toBeNull();
    expect(anim.getProgress()).toBe(1);
  });

  it.each(['linear', 'ease-out', 'ease-in-out'] as const)('%s easing hits both endpoints', (easing) => {
    const anim = new AnimationSystem();
    anim.setEasing(easing);
    const dog = new Dog(1, 0);
    anim.startAnimations([{ entity: dog, fromX: 0, fromY: 0, toX: 1, toY: 0 }], 100);
    anim.update();
    expect(dog.visualX).toBe(0);
    t += 100;
    anim.update();
    expect(dog.visualX).toBe(1);
  });

  it('ease-out is ahead of linear at the midpoint, ease-in-out equals it', () => {
    const positions: Record<string, number> = {};
    for (const easing of ['linear', 'ease-out', 'ease-in-out'] as const) {
      t = 5000;
      const anim = new AnimationSystem();
      anim.setEasing(easing);
      const dog = new Dog(1, 0);
      anim.startAnimations([{ entity: dog, fromX: 0, fromY: 0, toX: 1, toY: 0 }], 100);
      t += 50;
      anim.update();
      positions[easing] = dog.visualX;
    }
    expect(positions.linear).toBeCloseTo(0.5);
    expect(positions['ease-out']).toBeCloseTo(0.75);
    expect(positions['ease-in-out']).toBeCloseTo(0.5);
  });

  it('zero duration completes immediately', () => {
    const anim = new AnimationSystem();
    const dog = new Dog(1, 0);
    anim.startAnimations([{ entity: dog, fromX: 0, fromY: 0, toX: 1, toY: 0 }], 0);
    anim.update();
    expect(dog.visualX).toBe(1);
    expect(anim.isAnimating()).toBe(false);
  });
});

describe('AnimationSystem bookkeeping', () => {
  it('isAnimatingEntity / getAnimatingEntities reflect the batch', () => {
    const { anim, wolf } = oneMove();
    const other = new Wolf(0, 0);
    expect(anim.isAnimatingEntity(wolf)).toBe(true);
    expect(anim.isAnimatingEntity(other)).toBe(false);
    expect(anim.getAnimatingEntities()).toEqual([wolf]);
  });

  it('getAllMovementPaths returns the paths without copying per call', () => {
    const { anim, wolf } = oneMove();
    const a = anim.getAllMovementPaths();
    const b = anim.getAllMovementPaths();
    expect(a).toBe(b);
    expect(a.get(wolf)).toMatchObject({ fromX: 1, fromY: 2, toX: 3, toY: 4 });
    expect(anim.getMovementPath(wolf)).toMatchObject({ fromX: 1, fromY: 2, toX: 3, toY: 4 });
    expect(anim.getMovementPath(new Wolf(0, 0))).toBeNull();
  });

  it('stopAll clears every animation', () => {
    const { anim, wolf } = oneMove();
    anim.stopAll();
    expect(anim.isAnimating()).toBe(false);
    expect(anim.isAnimatingEntity(wolf)).toBe(false);
    expect(anim.getAllMovementPaths().size).toBe(0);
    anim.update(); // no-op
    expect(anim.getProgress()).toBe(1);
  });

  it('startAnimations replaces the previous batch and bumps the generation', () => {
    const { anim, wolf } = oneMove();
    const g = anim.getGeneration();
    const dog = new Dog(0, 1);
    anim.startAnimations([{ entity: dog, fromX: 0, fromY: 0, toX: 0, toY: 1 }], 100);
    expect(anim.getGeneration()).toBe(g + 1);
    expect(anim.isAnimatingEntity(wolf)).toBe(false);
    expect(anim.isAnimatingEntity(dog)).toBe(true);
  });
});
