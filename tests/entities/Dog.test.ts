import { describe, it, expect } from 'vitest';
import { Dog } from '../../src/entities/Dog';
import { Board } from '../../src/core/Board';
import { DeathSystem } from '../../src/systems/DeathSystem';
import { SpawnSystem } from '../../src/systems/SpawnSystem';
import { createConfig, createMockRenderer } from '../setup';

/**
 * Dog entity behaviour: construction from configured stats, damage and healing
 * limits, and the configured Gompertz parameters actually driving age mortality.
 * Combat behaviour lives in tests/systems/CombatSystem.test.ts.
 */

describe('Dog Entity', () => {
  it('takes its starting health, max health and Gompertz parameters from the constructor', () => {
    const dog = new Dog(4, 5, 61, 0.003, 0.3);
    expect([dog.x, dog.y, dog.health, dog.maxHealth]).toEqual([4, 5, 61, 61]);
    expect([dog.gompertzA, dog.gompertzB]).toEqual([0.003, 0.3]);
  });

  it('spawns with the configured dog stats', () => {
    const board = new Board(1, 1);
    new SpawnSystem(createMockRenderer()).execute(
      board,
      createConfig({
        fruit: { spawnProbability: 0 },
        mushroom: { spawnProbability: 0 },
        wolf: { spawnProbability: 0 },
        dog: { spawnProbability: 1, startingHealth: 33 },
      }),
    );
    const spawned = board.getEntity(0, 0);
    expect(spawned).toBeInstanceOf(Dog);
    expect(spawned?.health).toBe(33);
  });

  it('dies once damage reaches its health, and healing is capped at its starting health', () => {
    const dog = new Dog(0, 0, 40);
    dog.takeDamage(15);
    dog.heal(100);
    expect(dog.health).toBe(40);
    dog.takeDamage(40);
    expect(dog.isDead()).toBe(true);
  });

  it('is immortal with Gompertz A = 0 and certain to die with a huge A', () => {
    const renderer = createMockRenderer();
    const board = new Board(2, 1);
    const immortal = new Dog(0, 0, 50, 0, 0.1);
    immortal.age = 1000;
    const doomed = new Dog(1, 0, 50, 1000, 0.1);
    board.setEntity(0, 0, immortal);
    board.setEntity(1, 0, doomed);

    const deaths = new DeathSystem(renderer).execute(board, createConfig());

    expect(board.getEntity(0, 0)).toBe(immortal);
    expect(board.getEntity(1, 0)).toBeNull();
    expect(deaths).toEqual([{ species: 'dog', cause: 'oldAge', age: 1 }]);
  });
});
