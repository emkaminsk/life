import { describe, it, expect } from 'vitest';
import { Fruit } from '../../src/entities/Fruit';
import { Mushroom } from '../../src/entities/Mushroom';
import { Board } from '../../src/core/Board';
import { DeathSystem } from '../../src/systems/DeathSystem';
import { EntityType } from '../../src/types';
import { DEFAULT_CONFIG } from '../../src/config';
import { createConfig, createMockRenderer } from '../setup';

/**
 * Plant behaviour: fruit ripening and immortality of plants. How plants are eaten is
 * covered in tests/systems/EatingSystem.test.ts; spawning in SpawnSystem.test.ts.
 */

describe('Fruit Entity', () => {
  it('is a FRUIT carrying the given heal energy', () => {
    const fruit = new Fruit(1, 2, 17, 3);
    expect(fruit.type).toBe(EntityType.FRUIT);
    expect(fruit.energyHealed).toBe(17);
  });

  it('defaults to the configured ripening time and heal energy', () => {
    const fruit = new Fruit(0, 0);
    expect(fruit.ripeningCounter).toBe(DEFAULT_CONFIG.fruit.roundsToRipen);
    expect(fruit.energyHealed).toBe(DEFAULT_CONFIG.fruit.energyHealed);
  });

  it('ripens after exactly roundsToRipen advances and stays ripe', () => {
    const fruit = new Fruit(0, 0, undefined, 3);
    const states: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      states.push(fruit.isRipe());
      fruit.advanceRipening();
    }
    expect(states).toEqual([false, false, false, true, true]);
    expect(fruit.ripeningCounter).toBe(0);
  });

  it('a fruit created with roundsToRipen 0 is ripe immediately', () => {
    expect(new Fruit(0, 0, undefined, 0).isRipe()).toBe(true);
  });
});

describe('Mushroom Entity', () => {
  it('is a MUSHROOM carrying the given poison energy', () => {
    const mushroom = new Mushroom(1, 2, 60);
    expect(mushroom.type).toBe(EntityType.MUSHROOM);
    expect(mushroom.energyRemoved).toBe(60);
  });
});

describe('Plants never die', () => {
  it('a fruit and a mushroom aged 10,000 rounds survive DeathSystem even with A = 1', () => {
    const board = new Board(2, 1);
    const fruit = new Fruit(0, 0);
    const mushroom = new Mushroom(1, 0);
    fruit.age = mushroom.age = 10_000;
    fruit.gompertzA = mushroom.gompertzA = 1;
    board.setEntity(0, 0, fruit);
    board.setEntity(1, 0, mushroom);

    const deaths = new DeathSystem(createMockRenderer()).execute(board, createConfig());

    expect(deaths).toEqual([]);
    expect(board.getEntity(0, 0)).toBe(fruit);
    expect(board.getEntity(1, 0)).toBe(mushroom);
  });

  it('damage does not make a plant dead', () => {
    const fruit = new Fruit(0, 0);
    const mushroom = new Mushroom(0, 0);
    fruit.takeDamage(100);
    mushroom.takeDamage(100);
    expect(fruit.isDead()).toBe(false);
    expect(mushroom.isDead()).toBe(false);
  });
});
