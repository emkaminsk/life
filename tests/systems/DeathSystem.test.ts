import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeathSystem, speciesOf, deathRecordOf } from '../../src/systems/DeathSystem';
import { Board } from '../../src/core/Board';
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities';
import type { Entity } from '../../src/entities/Entity';
import { Sex } from '../../src/types';
import { Gompertz } from '../../src/utils/Gompertz';
import { Random } from '../../src/utils/Random';
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup';

/**
 * DeathSystem behaviour tests (Phase 5): health deaths, Gompertz age mortality
 * (rolled with the incremented age) and overcrowding multipliers.
 */

const A = 0.01;
const B = 0.1;
const EPS = 1e-9;

describe('DeathSystem', () => {
  let board: Board;
  let renderer: ReturnType<typeof createMockRenderer>;
  let system: DeathSystem;

  beforeEach(() => {
    board = new Board(12, 12);
    renderer = createMockRenderer();
    system = new DeathSystem(renderer);
  });

  function place<T extends Entity>(e: T): T {
    board.setEntity(e.x, e.y, e);
    return e;
  }

  const immortal = { gompertzA: 0, gompertzB: 0 };
  /** Human with longevity 1, so the effective Gompertz B equals `b`. */
  const human = (x: number, y: number, a = 0, b = 0, sex: Sex = Sex.MALE, longevity = 1) => {
    const h = new Human(x, y, sex, 100, a, b);
    h.genome = { ...h.genome, longevity };
    return h;
  };

  describe('health-based death', () => {
    it('removes creatures with health ≤ 0 and keeps the rest', () => {
      const dead = place(human(1, 1));
      dead.health = 0;
      const alive = place(human(2, 2));
      alive.health = 0.5;
      const deadWolf = place(new Wolf(3, 3, 80, 0, 0));
      deadWolf.health = 0;

      system.execute(board, createConfig());

      expect(board.getEntity(1, 1)).toBeNull();
      expect(board.getEntity(3, 3)).toBeNull();
      expect(board.getEntity(2, 2)).toBe(alive);
      expect(renderer.markDirty).toHaveBeenCalledWith(1, 1);
      expect(renderer.markDirty).toHaveBeenCalledWith(3, 3);
    });

    it('ages every entity (incl. plants) by one round', () => {
      const entities = [
        place(human(1, 1)),
        place(new Wolf(2, 2, 80, 0, 0)),
        place(new Dog(3, 3, 70, 0, 0)),
        place(new Fruit(4, 4)),
        place(new Mushroom(5, 5)),
      ];
      entities[0].age = 7;

      system.execute(board, createConfig());

      expect(entities.map((e) => e.age)).toEqual([8, 1, 1, 1, 1]);
    });
  });

  describe('Gompertz age mortality uses the incremented age', () => {
    const cases: Array<[string, () => Entity]> = [
      ['human', () => human(5, 5, A, B)],
      ['wolf', () => new Wolf(5, 5, 80, A, B)],
      ['dog', () => new Dog(5, 5, 70, A, B)],
    ];

    it.each(cases)('%s dies when the roll is just under p(age + 1)', (_name, make) => {
      const entity = place(make());
      entity.age = 10;
      const p = Gompertz.deathProbability(11, A, B);
      vi.spyOn(Math, 'random').mockReturnValue(p - EPS);

      system.execute(board, createConfig());

      expect(board.getEntity(5, 5)).toBeNull();
    });

    it.each(cases)('%s survives when the roll is just over p(age + 1)', (_name, make) => {
      const entity = place(make());
      entity.age = 10;
      const p = Gompertz.deathProbability(11, A, B);
      vi.spyOn(Math, 'random').mockReturnValue(p + EPS);

      system.execute(board, createConfig());

      expect(board.getEntity(5, 5)).toBe(entity);
    });

    it('plants never die of age', () => {
      const fruit = place(new Fruit(1, 1));
      const mushroom = place(new Mushroom(2, 2));
      fruit.age = mushroom.age = 10_000;
      vi.spyOn(Math, 'random').mockReturnValue(0);

      system.execute(board, createConfig());

      expect(board.getEntity(1, 1)).toBe(fruit);
      expect(board.getEntity(2, 2)).toBe(mushroom);
    });
  });

  describe('overcrowding', () => {
    // Roll between p(age 1, ×1) and p(age 1, ×3): dies only when the multiplier applies
    const pBase = Gompertz.deathProbability(1, A, B, 1);
    const pCrowded = Gompertz.deathProbability(1, A, B, 3);
    const roll = (pBase + pCrowded) / 2;

    function survivors(setup: () => void, overcrowding: ConfigOverrides['overcrowding']): number {
      board = new Board(12, 12);
      setup();
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      system.execute(board, createConfig({ overcrowding }));
      return board.getAllEntities().length;
    }

    const threeHumans = () => {
      for (let i = 0; i < 3; i++) place(human(i, 0, A, B));
    };

    it('human multiplier applies only when the human count exceeds the threshold', () => {
      expect(survivors(threeHumans, { humanThreshold: 2, humanMultiplier: 3 })).toBe(0);
      expect(survivors(threeHumans, { humanThreshold: 3, humanMultiplier: 3 })).toBe(3); // 3 is not > 3
      expect(survivors(threeHumans, { humanThreshold: 2, humanMultiplier: 1 })).toBe(3);
    });

    it('wolves and dogs are counted together for the animal threshold', () => {
      const pack = () => {
        place(new Wolf(0, 0, 80, A, B));
        place(new Wolf(1, 0, 80, A, B));
        place(new Dog(2, 0, 70, A, B));
      };
      expect(survivors(pack, { animalThreshold: 2, animalMultiplier: 3 })).toBe(0);
      expect(survivors(pack, { animalThreshold: 3, animalMultiplier: 3 })).toBe(3);
    });

    it('animal overcrowding does not affect humans and vice versa', () => {
      const mixed = () => {
        threeHumans();
        place(new Wolf(5, 5, 80, A, B));
      };
      // Humans crowded, animals not
      expect(
        survivors(mixed, {
          humanThreshold: 2,
          humanMultiplier: 3,
          animalThreshold: 5,
          animalMultiplier: 3,
        }),
      ).toBe(1);
      // Animals crowded (1 > 0), humans not
      expect(
        survivors(mixed, {
          humanThreshold: 5,
          humanMultiplier: 3,
          animalThreshold: 0,
          animalMultiplier: 3,
        }),
      ).toBe(3);
    });
  });

  it('immortal parameters (A = 0) never cause age deaths', () => {
    const h = place(new Human(1, 1, Sex.FEMALE, 100, immortal.gompertzA, immortal.gompertzB));
    h.age = 500;
    vi.spyOn(Math, 'random').mockReturnValue(0);

    system.execute(board, createConfig());

    expect(board.getEntity(1, 1)).toBe(h);
  });

  describe('death records', () => {
    it('health deaths are recorded with the entity deathCause, species and new age', () => {
      const m = place(human(1, 1));
      m.age = 4;
      m.takeDamage(500, 'wolfAttack');
      const f = place(human(2, 1, 0, 0, Sex.FEMALE));
      f.takeDamage(500, 'mushroom');
      const w = place(new Wolf(3, 1, 80, 0, 0));
      w.takeDamage(500, 'humanDefense');
      const d = place(new Dog(4, 1, 70, 0, 0));
      d.takeDamage(500, 'wolfAttack');
      const loser = place(human(5, 1));
      loser.kill('maleFight');
      const starved = place(human(6, 1));
      starved.takeDamage(500, 'metabolism');
      const w2 = place(new Wolf(7, 1, 80, 0, 0));
      w2.takeDamage(500, 'dogAttack');

      const deaths = system.execute(board, createConfig());

      expect(deaths).toEqual([
        { species: 'male', cause: 'wolfAttack', age: 5 },
        { species: 'female', cause: 'mushroom', age: 1 },
        { species: 'wolf', cause: 'humanDefense', age: 1 },
        { species: 'dog', cause: 'wolfAttack', age: 1 },
        { species: 'male', cause: 'maleFight', age: 1 },
        { species: 'male', cause: 'metabolism', age: 1 },
        { species: 'wolf', cause: 'dogAttack', age: 1 },
      ]);
    });

    it('a health death without a recorded cause is reported as unknown', () => {
      const w = place(new Wolf(1, 1, 80, 0, 0));
      w.health = 0;
      expect(system.execute(board, createConfig())).toEqual([{ species: 'wolf', cause: 'unknown', age: 1 }]);
    });

    it('returns an empty list when nobody dies', () => {
      place(human(1, 1));
      place(new Fruit(2, 2));
      expect(system.execute(board, createConfig())).toEqual([]);
    });

    it('an age death without overcrowding is oldAge, and the entity carries the cause', () => {
      const h = place(human(5, 5, A, B, Sex.FEMALE));
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const deaths = system.execute(board, createConfig());

      expect(deaths).toEqual([{ species: 'female', cause: 'oldAge', age: 1 }]);
      expect(h.deathCause).toBe('oldAge');
    });

    describe('oldAge vs overcrowding from the same single draw', () => {
      const pBase = Gompertz.deathProbability(1, A, B, 1);
      const pCrowded = Gompertz.deathProbability(1, A, B, 3);
      const crowded = { humanThreshold: 0, humanMultiplier: 3, animalThreshold: 0, animalMultiplier: 3 };

      it('a roll the plain hazard would also kill is oldAge even when crowded', () => {
        place(human(5, 5, A, B));
        vi.spyOn(Math, 'random').mockReturnValue(pBase - EPS);
        expect(system.execute(board, createConfig({ overcrowding: crowded }))[0].cause).toBe('oldAge');
      });

      it('a roll only the crowded hazard kills is overcrowding', () => {
        place(new Wolf(5, 5, 80, A, B));
        vi.spyOn(Math, 'random').mockReturnValue(pBase + EPS);
        expect(system.execute(board, createConfig({ overcrowding: crowded }))).toEqual([
          { species: 'wolf', cause: 'overcrowding', age: 1 },
        ]);
      });

      it('a roll above the crowded hazard survives', () => {
        place(new Dog(5, 5, 70, A, B));
        vi.spyOn(Math, 'random').mockReturnValue(pCrowded + EPS);
        expect(system.execute(board, createConfig({ overcrowding: crowded }))).toEqual([]);
      });

      it('uses exactly one random draw per creature', () => {
        place(human(1, 1, A, B));
        place(new Wolf(2, 2, 80, A, B));
        const spy = vi.spyOn(Math, 'random').mockReturnValue(pBase + EPS);
        system.execute(board, createConfig({ overcrowding: crowded }));
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('longevity gene (PRD 3.17)', () => {
    it('human age mortality uses gompertzB × longevity', () => {
      for (const longevity of [0.5, 2]) {
        board = new Board(12, 12);
        const h = place(human(5, 5, A, B, Sex.MALE, longevity));
        h.age = 30;
        const p = Gompertz.deathProbability(31, A, B * longevity);
        const spy = vi.spyOn(Math, 'random').mockReturnValue(p - EPS);
        expect(system.execute(board, createConfig())).toHaveLength(1);

        board = new Board(12, 12);
        const h2 = place(human(5, 5, A, B, Sex.MALE, longevity));
        h2.age = 30;
        spy.mockReturnValue(p + EPS);
        expect(system.execute(board, createConfig())).toHaveLength(0);
        vi.restoreAllMocks();
      }
    });

    it('humans with longevity 0.5 live longer on average than with 2.0 (seeded)', () => {
      const meanLifespan = (longevity: number): number => {
        Random.seed(7);
        let total = 0;
        const trials = 150;
        for (let i = 0; i < trials; i++) {
          board = new Board(1, 1);
          place(human(0, 0, 0.001, 0.1, Sex.FEMALE, longevity));
          let deaths: ReturnType<DeathSystem['execute']> = [];
          while (deaths.length === 0) deaths = system.execute(board, createConfig());
          total += deaths[0].age;
        }
        return total / trials;
      };

      const slow = meanLifespan(0.5);
      const fast = meanLifespan(2);
      expect(slow).toBeGreaterThan(fast * 2);
    });

    it('wolves and dogs ignore longevity (they have no genome)', () => {
      const w = place(new Wolf(5, 5, 80, A, B));
      w.age = 10;
      vi.spyOn(Math, 'random').mockReturnValue(Gompertz.deathProbability(11, A, B) - EPS);
      expect(system.execute(board, createConfig())).toEqual([{ species: 'wolf', cause: 'oldAge', age: 11 }]);
    });
  });
});

describe('speciesOf / deathRecordOf', () => {
  it('maps creatures to history species and plants to null', () => {
    expect(speciesOf(new Human(0, 0, Sex.MALE))).toBe('male');
    expect(speciesOf(new Human(0, 0, Sex.FEMALE))).toBe('female');
    expect(speciesOf(new Wolf(0, 0))).toBe('wolf');
    expect(speciesOf(new Dog(0, 0))).toBe('dog');
    expect(speciesOf(new Fruit(0, 0))).toBeNull();
    expect(deathRecordOf(new Mushroom(0, 0), 'unknown')).toBeNull();
  });

  it('builds a record with the entity age', () => {
    const dog = new Dog(0, 0);
    dog.age = 12;
    expect(deathRecordOf(dog, 'wolfAttack')).toEqual({ species: 'dog', cause: 'wolfAttack', age: 12 });
  });
});
