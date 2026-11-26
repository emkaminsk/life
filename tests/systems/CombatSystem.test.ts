import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSystem } from '../../src/systems/CombatSystem';
import { Board } from '../../src/core/Board';
import { Human, Wolf, Dog, Fruit } from '../../src/entities';
import { Sex } from '../../src/types';
import { VISUAL_EFFECT_DURATION_MS } from '../../src/config';
import { createConfig, createMockRenderer } from '../setup';

/**
 * CombatSystem behaviour tests (Phase 2).
 */

function human(x: number, y: number, sex: Sex, health = 100, strength = 1): Human {
  const h = new Human(x, y, sex);
  h.genome = { maxHealth: 100, strength, metabolism: 0, greed: 0, caution: 0, longevity: 1 };
  h.maxHealth = 100;
  h.health = health;
  return h;
}

describe('CombatSystem', () => {
  let board: Board;
  let renderer: ReturnType<typeof createMockRenderer>;
  let system: CombatSystem;

  beforeEach(() => {
    board = new Board(12, 12);
    renderer = createMockRenderer();
    system = new CombatSystem(renderer);
  });

  function place<T extends Human | Wolf | Dog | Fruit>(e: T): T {
    board.setEntity(e.x, e.y, e);
    return e;
  }

  describe('male vs male', () => {
    it('both take damage simultaneously, scaled by the opponent strength gene', () => {
      const m1 = place(human(5, 5, Sex.MALE, 100, 1));
      const m2 = place(human(6, 5, Sex.MALE, 100, 2));

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

      expect(m1.health).toBe(60); // took 20 × 2
      expect(m2.health).toBe(80); // took 20 × 1
    });

    it('uses the config passed to execute', () => {
      const m1 = place(human(5, 5, Sex.MALE));
      const m2 = place(human(5, 6, Sex.MALE));

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 7 } }));
      expect([m1.health, m2.health]).toEqual([93, 93]);

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 3 } }));
      expect([m1.health, m2.health]).toEqual([90, 90]);
    });

    it('when one dies the survivor gains the loser pre-fight health (capped at max)', () => {
      const m1 = place(human(5, 5, Sex.MALE, 50));
      const m2 = place(human(6, 6, Sex.MALE, 15));

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

      expect(m2.health).toBe(0);
      expect(m1.health).toBe(45); // 50 - 20 + 15

      const m3 = place(human(1, 1, Sex.MALE, 95));
      const m4 = place(human(2, 1, Sex.MALE, 10));
      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));
      expect(m4.health).toBe(0);
      expect(m3.health).toBe(85); // 95 - 20 + 10, below cap
    });

    it('when both would die, the one with lower UNCLAMPED health dies (independent of randomness)', () => {
      for (const r of [0, 0.99]) {
        board = new Board(12, 12);
        vi.spyOn(Math, 'random').mockReturnValue(r);
        // m1 deals 30, m2 deals 20
        const m1 = place(human(5, 5, Sex.MALE, 10, 1.5));
        const m2 = place(human(6, 5, Sex.MALE, 15, 1));
        // final: m1 = 10 - 20 = -10, m2 = 15 - 30 = -15 → m2 is lower and dies

        system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

        expect(m2.health).toBe(0);
        expect(m1.health).toBe(15); // 0 + m2's initial 15
      }
    });

    it('when both would die with equal health, a random one dies and the survivor keeps ≥ 1', () => {
      const survivors: string[] = [];
      for (const r of [0, 0.99]) {
        board = new Board(12, 12);
        vi.spyOn(Math, 'random').mockReturnValue(r);
        const m1 = place(human(5, 5, Sex.MALE, 10));
        const m2 = place(human(6, 5, Sex.MALE, 10));
        system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));
        const alive = [m1, m2].filter((m) => m.health > 0);
        expect(alive).toHaveLength(1);
        expect(alive[0].health).toBe(10);
        survivors.push(alive[0] === m1 ? 'm1' : 'm2');
      }
      expect(survivors.sort()).toEqual(['m1', 'm2']);
    });

    it('males and females do not fight; females do not fight each other', () => {
      const m = place(human(5, 5, Sex.MALE));
      const f1 = place(human(6, 5, Sex.FEMALE));
      const f2 = place(human(6, 6, Sex.FEMALE));

      system.execute(board, createConfig());

      expect([m.health, f1.health, f2.health]).toEqual([100, 100, 100]);
      expect(renderer.addVisualEffect).not.toHaveBeenCalled();
    });
  });

  describe('wolf vs human', () => {
    it('male takes damageToMale and counter-attacks with maleVsWolfDamage × strength', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const male = place(human(6, 5, Sex.MALE, 100, 2));

      system.execute(board, createConfig({ wolf: { damageToMale: 30 }, human: { maleVsWolfDamage: 10 } }));

      expect(male.health).toBe(70);
      expect(wolf.health).toBe(60);
    });

    it('female takes damageToFemale and does not fight back', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const female = place(human(4, 4, Sex.FEMALE)); // diagonal

      system.execute(board, createConfig({ wolf: { damageToFemale: 45 } }));

      expect(female.health).toBe(55);
      expect(wolf.health).toBe(80);
    });

    it('no combat when the wolf is two cells away', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const female = place(human(7, 5, Sex.FEMALE));

      system.execute(board, createConfig());

      expect(female.health).toBe(100);
      expect(wolf.health).toBe(80);
    });
  });

  describe('dog vs wolf', () => {
    it('wolf takes damageToWolf and the dog takes damageToDog', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const dog = place(new Dog(5, 4, 70));

      system.execute(board, createConfig({ dog: { damageToWolf: 35 }, wolf: { damageToDog: 17 } }));

      expect(wolf.health).toBe(45);
      expect(dog.health).toBe(53);
    });

    it('dogs never attack humans', () => {
      const dog = place(new Dog(5, 5, 70));
      const male = place(human(6, 5, Sex.MALE));

      system.execute(board, createConfig());

      expect(dog.health).toBe(70);
      expect(male.health).toBe(100);
    });
  });

  describe('pair detection', () => {
    it('processes each adjacent pair exactly once', () => {
      // 2×2 block of males: 6 adjacent pairs, each male is in 3 of them
      const males = [
        place(human(3, 3, Sex.MALE)),
        place(human(4, 3, Sex.MALE)),
        place(human(3, 4, Sex.MALE)),
        place(human(4, 4, Sex.MALE)),
      ];

      expect(CombatSystem.findCombatPairs(board)).toHaveLength(6);

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 5 } }));
      for (const m of males) expect(m.health).toBe(85); // 3 fights × 5
    });

    it('finds pairs across rows, including the down-left diagonal', () => {
      place(new Wolf(5, 5));
      place(human(4, 6, Sex.FEMALE));
      const pairs = CombatSystem.findCombatPairs(board);
      expect(pairs).toHaveLength(1);
    });

    it('ignores plants and non-fighting neighbours', () => {
      place(new Fruit(5, 5));
      place(new Wolf(6, 5));
      place(new Wolf(7, 5));
      place(new Dog(0, 0));
      expect(CombatSystem.findCombatPairs(board)).toHaveLength(0);
    });
  });

  describe('dead creatures do not keep fighting', () => {
    it('a male killed by the first wolf does not fight the second wolf', () => {
      const wolfA = place(new Wolf(4, 5, 80));
      const male = place(human(5, 5, Sex.MALE, 10, 1));
      const wolfB = place(new Wolf(6, 5, 80));

      system.execute(board, createConfig({ wolf: { damageToMale: 30 }, human: { maleVsWolfDamage: 25 } }));

      expect(male.health).toBe(0);
      expect(wolfA.health).toBe(55); // counter-attacked in the first fight
      expect(wolfB.health).toBe(80); // no second fight
    });

    it('creatures already at 0 health deal no damage', () => {
      const wolf = place(new Wolf(5, 5, 80));
      wolf.health = 0;
      const female = place(human(6, 5, Sex.FEMALE));

      system.execute(board, createConfig());

      expect(female.health).toBe(100);
    });
  });

  describe('visual feedback', () => {
    it('adds a red combat flash of VISUAL_EFFECT_DURATION_MS on both squares', () => {
      place(new Wolf(5, 5));
      place(new Dog(6, 5));

      system.execute(board, createConfig());

      const effects = renderer.addVisualEffect.mock.calls.map((c) => c[0]);
      expect(effects).toHaveLength(2);
      for (const e of effects) {
        expect(e.type).toBe('combat');
        expect(e.duration).toBe(VISUAL_EFFECT_DURATION_MS);
      }
      expect(effects.map((e) => `${e.x},${e.y}`).sort()).toEqual(['5,5', '6,5']);
      expect(renderer.markDirty).toHaveBeenCalledWith(5, 5);
      expect(renderer.markDirty).toHaveBeenCalledWith(6, 5);
    });

    it('handles an empty board without effects', () => {
      system.execute(board, createConfig());
      expect(renderer.addVisualEffect).not.toHaveBeenCalled();
    });
  });

  describe('symmetric male-vs-male outcomes (either argument order)', () => {
    it('double KO: the first male in scan order dies when his unclamped health is lower', () => {
      // m1 at (5,5) is entity1 of the pair, m2 at (6,5) is entity2
      const m1 = place(human(5, 5, Sex.MALE, 15, 1)); // takes 30 → -15
      const m2 = place(human(6, 5, Sex.MALE, 10, 1.5)); // takes 20 → -10

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

      expect(m1.health).toBe(0);
      expect(m1.deathCause).toBe('maleFight');
      expect(m2.health).toBe(15); // 0 + m1's initial 15
      expect(m2.deathCause).toBeNull();
    });

    it('only the first male dies: the second gains his pre-fight health', () => {
      const m1 = place(human(5, 5, Sex.MALE, 15));
      const m2 = place(human(6, 5, Sex.MALE, 50));

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

      expect(m1.health).toBe(0);
      expect(m2.health).toBe(45); // 50 - 20 + 15
    });

    it('only the second male dies: the first is healed, capped at max health', () => {
      const m1 = place(human(5, 5, Sex.MALE, 100));
      const m2 = place(human(6, 5, Sex.MALE, 15));

      system.execute(board, createConfig({ human: { maleVsMaleDamage: 20 } }));

      expect(m2.health).toBe(0);
      expect(m1.health).toBe(95); // 100 - 20 + 15 = 95
    });
  });

  describe('death causes', () => {
    const lethal = createConfig({
      wolf: { damageToMale: 500, damageToFemale: 500, damageToDog: 500 },
      dog: { damageToWolf: 500 },
      human: { maleVsWolfDamage: 500, maleVsMaleDamage: 500 },
    });

    it('a human killed by a wolf dies of wolfAttack', () => {
      place(new Wolf(5, 5, 80));
      const female = place(human(6, 5, Sex.FEMALE));
      system.execute(board, lethal);
      expect(female.deathCause).toBe('wolfAttack');
    });

    it('a wolf killed by a male counter-attack dies of humanDefense (and the male of wolfAttack)', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const male = place(human(6, 5, Sex.MALE));
      system.execute(board, lethal);
      expect(wolf.deathCause).toBe('humanDefense');
      expect(male.deathCause).toBe('wolfAttack');
    });

    it('wolf and dog killing each other: dogAttack and wolfAttack', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const dog = place(new Dog(6, 5, 70));
      system.execute(board, lethal);
      expect(wolf.deathCause).toBe('dogAttack');
      expect(dog.deathCause).toBe('wolfAttack');
    });

    it('the loser of a male fight dies of maleFight; a survivor of a double KO has no cause', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // tie-break → male1 survives
      const m1 = place(human(5, 5, Sex.MALE, 10));
      const m2 = place(human(6, 5, Sex.MALE, 10));
      system.execute(board, lethal);
      expect(m2.deathCause).toBe('maleFight');
      expect(m1.health).toBeGreaterThan(0);
      expect(m1.deathCause).toBeNull();
    });

    it('non-lethal damage records no cause', () => {
      const wolf = place(new Wolf(5, 5, 80));
      const dog = place(new Dog(6, 5, 70));
      system.execute(board, createConfig({ dog: { damageToWolf: 1 }, wolf: { damageToDog: 1 } }));
      expect(wolf.deathCause).toBeNull();
      expect(dog.deathCause).toBeNull();
    });
  });
});
