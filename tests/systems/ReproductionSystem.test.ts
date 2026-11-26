import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReproductionSystem } from '../../src/systems/ReproductionSystem';
import { BirthSystem } from '../../src/systems/BirthSystem';
import { Board } from '../../src/core/Board';
import { Human } from '../../src/entities/Human';
import { Sex } from '../../src/types';
import { Random } from '../../src/utils/Random';
import { VISUAL_EFFECT_DURATION_MS } from '../../src/config';
import { createConfig, createMockRenderer } from '../setup';

/**
 * ReproductionSystem behaviour tests (Phase 4), incl. exact pregnancy timing with
 * the BirthSystem (Phase 6).
 */

/** Human with max health 100; default health 65 is MODERATE energy (reproduction modifier ×1). */
function human(x: number, y: number, sex: Sex, health = 65): Human {
  const genome = { maxHealth: 100, strength: 1, metabolism: 0, greed: 0, caution: 0, longevity: 1 };
  const h = new Human(x, y, sex, 100, undefined, undefined, genome);
  h.health = health;
  return h;
}

describe('ReproductionSystem', () => {
  let board: Board;
  let renderer: ReturnType<typeof createMockRenderer>;
  let system: ReproductionSystem;

  beforeEach(() => {
    board = new Board(12, 12);
    renderer = createMockRenderer();
    system = new ReproductionSystem(renderer);
  });

  function place(h: Human): Human {
    board.setEntity(h.x, h.y, h);
    return h;
  }

  describe('conception', () => {
    it('a female adjacent to a male becomes pregnant for exactly pregnancyPeriod rounds (probability 1)', () => {
      const female = place(human(5, 5, Sex.FEMALE));
      const male = place(human(6, 5, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1, pregnancyPeriod: 4 } }));

      expect(female.isPregnant()).toBe(true);
      // Not advanced in the conception round
      expect(female.pregnancyCounter).toBe(4);
      expect(female.fatherGenome).toBe(male.genome);
    });

    it('diagonal adjacency counts', () => {
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(4, 6, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(female.isPregnant()).toBe(true);
    });

    it('probability 0 never conceives', () => {
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE));

      for (let i = 0; i < 20; i++) system.execute(board, createConfig({ human: { reproductionProbability: 0 } }));

      expect(female.isPregnant()).toBe(false);
    });

    it('uses the configured reproductionProbability (roll 0.4: 0.5 succeeds, 0.3 fails)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.4);
      const f1 = place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE));
      system.execute(board, createConfig({ human: { reproductionProbability: 0.3 } }));
      expect(f1.isPregnant()).toBe(false);
      system.execute(board, createConfig({ human: { reproductionProbability: 0.5 } }));
      expect(f1.isPregnant()).toBe(true);
    });

    it('requires a male within one cell', () => {
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(7, 5, Sex.MALE));
      place(human(4, 5, Sex.FEMALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(female.isPregnant()).toBe(false);
    });

    it('a dead male cannot father and a dead female cannot conceive', () => {
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE, 0));
      const deadFemale = place(human(1, 1, Sex.FEMALE, 0));
      place(human(2, 1, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(female.isPregnant()).toBe(false);
      expect(deadFemale.isPregnant()).toBe(false);
    });

    it('several females next to one male can each conceive in the same round', () => {
      place(human(5, 5, Sex.MALE));
      const females = [place(human(4, 5, Sex.FEMALE)), place(human(6, 5, Sex.FEMALE)), place(human(5, 6, Sex.FEMALE))];

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(females.every((f) => f.isPregnant())).toBe(true);
    });

    it('pregnant females and females in cooldown do not conceive; cooldown counts down', () => {
      const pregnant = place(human(5, 5, Sex.FEMALE));
      pregnant.pregnancyCounter = 3;
      const resting = place(human(6, 6, Sex.FEMALE));
      resting.reproductionCooldown = 2;
      place(human(6, 5, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(pregnant.pregnancyCounter).toBe(2); // advanced, not restarted
      expect(resting.isPregnant()).toBe(false);
      expect(resting.reproductionCooldown).toBe(1);
    });
  });

  describe('male energy modifier (PRD 3.16.4, US-045)', () => {
    it.each([
      [20, 'DESPERATE'],
      [40, 'HUNGRY'],
    ])('a male at health %i (%s) never fathers, even with probability 1', (health) => {
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE, health));

      for (let i = 0; i < 10; i++) system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(female.isPregnant()).toBe(false);
    });

    it('FULL and SATIATED males get ×1.5 (roll 0.7 vs p 0.5: MODERATE fails, FULL/SATIATED succeed)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      const config = createConfig({ human: { reproductionProbability: 0.5 } });
      const conceives = (maleHealth: number): boolean => {
        board = new Board(12, 12);
        const female = place(human(5, 5, Sex.FEMALE));
        place(human(6, 5, Sex.MALE, maleHealth));
        return system.execute(board, config) === 1 && female.isPregnant();
      };
      expect(conceives(65)).toBe(false);
      expect(conceives(90)).toBe(true);
      expect(conceives(100)).toBe(true);
    });

    it('the boosted probability is capped at 1 (p 0.8 × 1.5): every try succeeds', () => {
      Random.seed(3);
      let pregnancies = 0;
      for (let i = 0; i < 100; i++) {
        board = new Board(12, 12);
        place(human(5, 5, Sex.FEMALE));
        place(human(6, 5, Sex.MALE, 100));
        pregnancies += system.execute(board, createConfig({ human: { reproductionProbability: 0.8 } }));
      }
      expect(pregnancies).toBe(100);
    });

    it("uses the male's energy, not the female's", () => {
      const female = place(human(5, 5, Sex.FEMALE, 20)); // desperate female
      place(human(6, 5, Sex.MALE, 65));
      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));
      expect(female.isPregnant()).toBe(true);
    });
  });

  describe('per-male tries (PRD 3.3.3, US-032)', () => {
    const MALE_CELLS: [number, number][] = [
      [4, 4],
      [6, 5],
      [5, 6],
    ];

    function conceptionRate(maleCount: number, trials = 600): number {
      Random.seed(21);
      let pregnancies = 0;
      const config = createConfig({ human: { reproductionProbability: 0.3 } });
      for (let i = 0; i < trials; i++) {
        board = new Board(12, 12);
        place(human(5, 5, Sex.FEMALE));
        for (const [x, y] of MALE_CELLS.slice(0, maleCount)) place(human(x, y, Sex.MALE));
        pregnancies += system.execute(board, config);
      }
      return pregnancies / trials;
    }

    it('three adjacent males give a higher conception rate: 1 − (1 − p)³ instead of p', () => {
      const one = conceptionRate(1); // expected 0.3
      const three = conceptionRate(3); // expected 0.657
      expect(one).toBeGreaterThan(0.24);
      expect(one).toBeLessThan(0.36);
      expect(three).toBeGreaterThan(0.6);
      expect(three).toBeLessThan(0.72);
    });

    it('the father is chosen among all adjacent males in random order, not scan order', () => {
      Random.seed(8);
      const fathers = new Map<string, number>();
      for (let i = 0; i < 300; i++) {
        board = new Board(12, 12);
        const female = place(human(5, 5, Sex.FEMALE));
        const males = MALE_CELLS.map(([x, y]) => place(human(x, y, Sex.MALE)));
        system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));
        const father = males.find((m) => m.genome === female.fatherGenome);
        expect(father).toBeDefined();
        const key = `${father?.x},${father?.y}`;
        fathers.set(key, (fathers.get(key) ?? 0) + 1);
      }
      expect(fathers.size).toBe(3);
      for (const count of fathers.values()) expect(count).toBeGreaterThan(70);
    });

    it('males that cannot reproduce (hungry) are skipped in favour of an eligible one', () => {
      Random.seed(4);
      for (let i = 0; i < 20; i++) {
        board = new Board(12, 12);
        const female = place(human(5, 5, Sex.FEMALE));
        place(human(4, 4, Sex.MALE, 40));
        const eligible = place(human(6, 5, Sex.MALE));
        place(human(5, 6, Sex.MALE, 20));
        system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));
        expect(female.fatherGenome).toBe(eligible.genome);
      }
    });

    it('returns the number of new pregnancies', () => {
      place(human(5, 5, Sex.MALE));
      place(human(4, 5, Sex.FEMALE));
      place(human(6, 5, Sex.FEMALE));
      const pregnantAlready = place(human(5, 4, Sex.FEMALE));
      pregnantAlready.pregnancyCounter = 2;
      expect(system.execute(board, createConfig({ human: { reproductionProbability: 1 } }))).toBe(2);
    });
  });

  describe('pregnancy timing (M2)', () => {
    /** Returns the round (after conception in round 0) in which the baby is born. */
    function birthRound(pregnancyPeriod: number): number {
      board = new Board(12, 12);
      const config = createConfig({
        human: { reproductionProbability: 1, pregnancyPeriod, cooldownPeriod: 2 },
      });
      const female = place(human(5, 5, Sex.FEMALE));
      const male = place(human(6, 5, Sex.MALE));
      const births = new BirthSystem(renderer);

      system.execute(board, config); // round 0: conception
      births.execute(board, config);
      expect(female.isPregnant()).toBe(true);
      board.removeEntity(male.x, male.y);

      for (let round = 1; round <= 20; round++) {
        const before = board.getAllEntities().length;
        system.execute(board, config);
        births.execute(board, config);
        if (board.getAllEntities().length > before) return round;
      }
      return -1;
    }

    it.each([1, 2, 3, 5])('pregnancyPeriod %i ⇒ birth exactly that many rounds after conception', (period) => {
      expect(birthRound(period)).toBe(period);
    });
  });

  describe('cooldown after birth', () => {
    it('blocks conception for exactly cooldownPeriod rounds after the birth round', () => {
      const config = createConfig({
        human: { reproductionProbability: 1, pregnancyPeriod: 1, cooldownPeriod: 3 },
      });
      const female = place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE));
      const births = new BirthSystem(renderer);
      // Remove babies so only the parents remain
      const clearBabies = () => {
        for (const e of board.getAllEntities()) {
          if (e !== female && !(e.x === 6 && e.y === 5)) board.removeEntity(e.x, e.y);
        }
      };

      system.execute(board, config); // round 0: conceive
      births.execute(board, config);
      system.execute(board, config); // round 1: pregnancy completes
      expect(female.readyToGiveBirth).toBe(true);
      expect(female.reproductionCooldown).toBe(3);
      births.execute(board, config);
      clearBabies();

      const pregnantInRound: boolean[] = [];
      for (let round = 2; round <= 5; round++) {
        system.execute(board, config);
        births.execute(board, config);
        clearBabies();
        pregnantInRound.push(female.isPregnant());
      }
      // rounds 2,3,4 blocked (cooldown 3), round 5 conceives
      expect(pregnantInRound).toEqual([false, false, false, true]);
    });
  });

  describe('visual feedback', () => {
    it('adds a green flash on conception', () => {
      place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 1 } }));

      expect(renderer.addVisualEffect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reproduction',
          x: 5,
          y: 5,
          duration: VISUAL_EFFECT_DURATION_MS,
        }),
      );
      expect(renderer.markDirty).toHaveBeenCalledWith(5, 5);
    });

    it('adds no flash when conception fails', () => {
      place(human(5, 5, Sex.FEMALE));
      place(human(6, 5, Sex.MALE));

      system.execute(board, createConfig({ human: { reproductionProbability: 0 } }));

      expect(renderer.addVisualEffect).not.toHaveBeenCalled();
    });
  });
});
