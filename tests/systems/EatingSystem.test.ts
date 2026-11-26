import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EatingSystem } from '../../src/systems/EatingSystem';
import { SpawnSystem } from '../../src/systems/SpawnSystem';
import { Board } from '../../src/core/Board';
import { Human, Wolf, Fruit, Mushroom } from '../../src/entities';
import { Sex } from '../../src/types';
import { VISUAL_EFFECT_DURATION_MS } from '../../src/config';
import { createConfig, createMockRenderer } from '../setup';

/**
 * EatingSystem behaviour tests (Phase 3).
 * Humans get a fixed genome (maxHealth 100) so healing caps are deterministic.
 */

function human(x: number, y: number, health = 50, sex: Sex = Sex.FEMALE): Human {
  const h = new Human(x, y, sex);
  h.genome = { maxHealth: 100, strength: 1, metabolism: 0, greed: 0, caution: 0 };
  h.maxHealth = 100;
  h.health = health;
  return h;
}

function ripeFruit(x: number, y: number, energy = 30): Fruit {
  const f = new Fruit(x, y, energy, 0);
  return f;
}

describe('EatingSystem', () => {
  let board: Board;
  let renderer: ReturnType<typeof createMockRenderer>;
  let system: EatingSystem;
  const config = createConfig();

  beforeEach(() => {
    board = new Board(12, 12);
    renderer = createMockRenderer();
    system = new EatingSystem(renderer);
  });

  function place<T extends Human | Wolf | Fruit | Mushroom>(e: T): T {
    board.setEntity(e.x, e.y, e);
    return e;
  }

  describe('fruit', () => {
    it('an adjacent injured human eats a ripe fruit, healing its energy; the fruit is removed', () => {
      const h = place(human(5, 5, 50));
      place(ripeFruit(6, 5, 30));

      system.execute(board, config);

      expect(h.health).toBe(80);
      expect(board.getEntity(6, 5)).toBeNull();
    });

    it('healing is capped at the human max health', () => {
      const h = place(human(5, 5, 90));
      place(ripeFruit(6, 6, 30));

      system.execute(board, config);

      expect(h.health).toBe(100);
    });

    it('unripe fruit is not eaten', () => {
      const h = place(human(5, 5, 50));
      const fruit = place(new Fruit(6, 5, 30, 2));

      system.execute(board, config);

      expect(h.health).toBe(50);
      expect(board.getEntity(6, 5)).toBe(fruit);
    });

    it('humans at full health do not eat fruit', () => {
      place(human(5, 5, 100));
      const fruit = place(ripeFruit(6, 5));

      system.execute(board, config);

      expect(board.getEntity(6, 5)).toBe(fruit);
    });

    it('exactly one of several eligible humans eats (random choice, both reachable)', () => {
      const eaters = new Set<string>();
      for (const r of [0, 0.99]) {
        board = new Board(12, 12);
        vi.spyOn(Math, 'random').mockReturnValue(r);
        const a = place(human(4, 5, 50));
        const b = place(human(6, 5, 50));
        place(ripeFruit(5, 5, 30));
        system.execute(board, config);
        const healed = [a, b].filter((h) => h.health === 80);
        expect(healed).toHaveLength(1);
        eaters.add(healed[0] === a ? 'a' : 'b');
      }
      expect(eaters).toEqual(new Set(['a', 'b']));
    });

    it('fruit is not eaten by a wolf or by a distant human', () => {
      place(new Wolf(5, 5));
      place(human(8, 5, 10));
      const fruit = place(ripeFruit(6, 5));

      system.execute(board, config);

      expect(board.getEntity(6, 5)).toBe(fruit);
    });

    it('heal amount comes from the fruit, which SpawnSystem sets from config', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // every empty cell spawns a fruit
      const spawnBoard = new Board(1, 1);
      new SpawnSystem(renderer).execute(spawnBoard, createConfig({ fruit: { energyHealed: 7, roundsToRipen: 0 } }));
      const spawned = spawnBoard.getEntity(0, 0) as Fruit;
      vi.restoreAllMocks();

      spawned.x = 6;
      spawned.y = 5;
      place(spawned);
      const h = place(human(5, 5, 50));

      system.execute(board, config);

      expect(h.health).toBe(57);
    });

    it('a dead human (0 health, e.g. killed in combat) does not eat', () => {
      const h = place(human(5, 5, 0));
      const fruit = place(ripeFruit(6, 5));

      system.execute(board, config);

      expect(h.health).toBe(0);
      expect(board.getEntity(6, 5)).toBe(fruit);
    });

    it('a human healed to full by one fruit does not also eat the next', () => {
      const h = place(human(5, 5, 90));
      place(ripeFruit(4, 5, 30));
      const second = place(ripeFruit(6, 5, 30));

      system.execute(board, config);

      expect(h.health).toBe(100);
      expect(board.getEntity(6, 5)).toBe(second);
    });
  });

  describe('mushrooms', () => {
    it('an adjacent human eats a mushroom and loses its energy; the mushroom is removed', () => {
      const h = place(human(5, 5, 100));
      place(new Mushroom(4, 4, 40));

      system.execute(board, config);

      expect(h.health).toBe(60);
      expect(board.getEntity(4, 4)).toBeNull();
    });

    it('health does not go below zero', () => {
      const h = place(human(5, 5, 10));
      place(new Mushroom(5, 6, 40));

      system.execute(board, config);

      expect(h.health).toBe(0);
    });

    it('dead humans do not eat mushrooms', () => {
      place(human(5, 5, 0));
      const mushroom = place(new Mushroom(5, 6, 40));

      system.execute(board, config);

      expect(board.getEntity(5, 6)).toBe(mushroom);
    });

    it('a human killed by one mushroom does not eat a second one', () => {
      place(human(5, 5, 30));
      place(new Mushroom(4, 5, 40));
      const second = place(new Mushroom(6, 5, 40));

      system.execute(board, config);

      expect(board.getEntity(6, 5)).toBe(second);
    });
  });

  describe('same round and feedback', () => {
    it('processes fruits before mushrooms in the same round (deterministic genome)', () => {
      const h = place(human(5, 5, 50));
      place(ripeFruit(4, 5, 30));
      place(new Mushroom(6, 5, 40));

      system.execute(board, config);

      expect(h.health).toBe(40); // 50 + 30 - 40
      expect(board.getEntity(4, 5)).toBeNull();
      expect(board.getEntity(6, 5)).toBeNull();
    });

    it('flashes yellow for fruit and red for mushrooms, each lasting VISUAL_EFFECT_DURATION_MS', () => {
      const h = place(human(5, 5, 50));
      place(ripeFruit(4, 5));
      place(new Mushroom(6, 5));

      system.execute(board, config);

      const effects = renderer.addVisualEffect.mock.calls.map((c) => c[0]);
      expect(effects).toEqual([
        expect.objectContaining({
          type: 'eating',
          x: 4,
          y: 5,
          duration: VISUAL_EFFECT_DURATION_MS,
        }),
        expect.objectContaining({
          type: 'combat',
          x: 6,
          y: 5,
          duration: VISUAL_EFFECT_DURATION_MS,
        }),
      ]);
      expect(renderer.markDirty).toHaveBeenCalledWith(4, 5);
      expect(renderer.markDirty).toHaveBeenCalledWith(6, 5);
      expect(renderer.markDirty).toHaveBeenCalledWith(h.x, h.y);
    });
  });
});
