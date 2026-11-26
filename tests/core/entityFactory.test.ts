import { describe, it, expect, afterEach } from 'vitest';
import { createEntity } from '../../src/core/entityFactory';
import type { PlaceableKind } from '../../src/core/simulationEvents';
import { Game } from '../../src/core/Game';
import { Board } from '../../src/core/Board';
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities';
import { EntityType, Sex } from '../../src/types';
import { Random } from '../../src/utils/Random';
import { createConfig, createMockRenderer } from '../setup';

afterEach(() => Random.useMathRandom());

describe('createEntity', () => {
  const config = createConfig({
    human: { startingHealth: 60, gompertzA: 0.01, gompertzB: 0.2 },
    wolf: { startingHealth: 55, gompertzA: 0.02, gompertzB: 0.3 },
    dog: { startingHealth: 44, gompertzA: 0.03, gompertzB: 0.4 },
    fruit: { energyHealed: 12, roundsToRipen: 5 },
    mushroom: { energyRemoved: 9 },
  });

  it('creates the right class and type for every kind at the given position', () => {
    const cases: [PlaceableKind, unknown, EntityType][] = [
      ['male', Human, EntityType.MALE],
      ['female', Human, EntityType.FEMALE],
      ['wolf', Wolf, EntityType.WOLF],
      ['dog', Dog, EntityType.DOG],
      ['fruit', Fruit, EntityType.FRUIT],
      ['mushroom', Mushroom, EntityType.MUSHROOM],
    ];
    for (const [kind, cls, type] of cases) {
      const e = createEntity(kind, 3, 4, config);
      expect(e, kind).toBeInstanceOf(cls as never);
      expect(e.type, kind).toBe(type);
      expect([e.x, e.y], kind).toEqual([3, 4]);
    }
    expect((createEntity('male', 0, 0, config) as Human).sex).toBe(Sex.MALE);
    expect((createEntity('female', 0, 0, config) as Human).sex).toBe(Sex.FEMALE);
  });

  it('applies the per-species config parameters', () => {
    const wolf = createEntity('wolf', 0, 0, config);
    expect([wolf.health, wolf.gompertzA, wolf.gompertzB]).toEqual([55, 0.02, 0.3]);
    const dog = createEntity('dog', 0, 0, config);
    expect([dog.health, dog.gompertzA, dog.gompertzB]).toEqual([44, 0.03, 0.4]);
    const fruit = createEntity('fruit', 0, 0, config) as Fruit;
    expect([fruit.energyHealed, fruit.ripeningCounter]).toEqual([12, 5]);
    expect((createEntity('mushroom', 0, 0, config) as Mushroom).energyRemoved).toBe(9);
    const human = createEntity('female', 0, 0, config) as Human;
    expect([human.gompertzA, human.gompertzB]).toEqual([0.01, 0.2]);
    expect(human.health).toBeLessThanOrEqual(60);
  });

  it('draws human genomes around the configured averages (seeded)', () => {
    Random.seed(3);
    const c = createConfig({ human: { moveTowardFruitProbability: 0.2, avgCaution: 0.8, avgMetabolism: 0.4 } });
    const n = 500;
    let greed = 0;
    let caution = 0;
    let metabolism = 0;
    for (let i = 0; i < n; i++) {
      const g = (createEntity('male', 0, 0, c) as Human).genome;
      greed += g.greed;
      caution += g.caution;
      metabolism += g.metabolism;
    }
    expect(greed / n).toBeLessThan(0.3);
    expect(caution / n).toBeGreaterThan(0.7);
    expect(metabolism / n).toBeGreaterThan(0.36);
    expect(metabolism / n).toBeLessThan(0.44);
  });
});

describe('Game.initializeBoard uses createEntity', () => {
  it('is deterministic for a seed and fills every cell when spawn probabilities sum to 1', () => {
    const config = createConfig({
      board: { width: 10, height: 10 },
      spawn: {
        maleHumanProbability: 0.2,
        femaleHumanProbability: 0.2,
        wolfProbability: 0.15,
        dogProbability: 0.15,
        fruitProbability: 0.15,
        mushroomProbability: 0.15,
      },
    });
    const snapshot = (): string[] => {
      Random.seed(11);
      const board = new Board(10, 10);
      new Game(board, createMockRenderer()).initializeBoard(config);
      const out: string[] = [];
      for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) out.push(board.getEntity(x, y)?.type ?? '-');
      return out;
    };
    const first = snapshot();
    expect(snapshot()).toEqual(first);
    expect(first).not.toContain('-');
    for (const type of Object.values(EntityType)) expect(first, type).toContain(type);
  });
});
