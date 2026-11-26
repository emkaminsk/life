import { describe, it, expect } from 'vitest';
import { Wolf } from '../../src/entities/Wolf';
import { Board } from '../../src/core/Board';
import { DeathSystem } from '../../src/systems/DeathSystem';
import { SpawnSystem } from '../../src/systems/SpawnSystem';
import { createConfig, createMockRenderer } from '../setup';

/**
 * Wolf entity behaviour: construction from configured stats, damage and healing
 * limits, and the configured Gompertz parameters actually driving age mortality.
 * Combat behaviour lives in tests/systems/CombatSystem.test.ts.
 */

describe('Wolf Entity', () => {
  it('takes its starting health, max health and Gompertz parameters from the constructor', () => {
    const wolf = new Wolf(4, 5, 61, 0.003, 0.3);
    expect([wolf.x, wolf.y, wolf.health, wolf.maxHealth]).toEqual([4, 5, 61, 61]);
    expect([wolf.gompertzA, wolf.gompertzB]).toEqual([0.003, 0.3]);
  });

  it('spawns with the configured wolf stats', () => {
    const board = new Board(1, 1);
    new SpawnSystem(createMockRenderer()).execute(
      board,
      createConfig({
        fruit: { spawnProbability: 0 },
        mushroom: { spawnProbability: 0 },
        dog: { spawnProbability: 0 },
        wolf: { spawnProbability: 1, startingHealth: 33 },
      }),
    );
    const spawned = board.getEntity(0, 0);
    expect(spawned).toBeInstanceOf(Wolf);
    expect(spawned?.health).toBe(33);
  });

  it('dies once damage reaches its health, and healing is capped at its starting health', () => {
    const wolf = new Wolf(0, 0, 40);
    wolf.takeDamage(15);
    wolf.heal(100);
    expect(wolf.health).toBe(40);
    wolf.takeDamage(40);
    expect(wolf.isDead()).toBe(true);
  });

  it('is immortal with Gompertz A = 0 and certain to die with a huge A', () => {
    const renderer = createMockRenderer();
    const board = new Board(2, 1);
    const immortal = new Wolf(0, 0, 50, 0, 0.1);
    immortal.age = 1000;
    const doomed = new Wolf(1, 0, 50, 1000, 0.1);
    board.setEntity(0, 0, immortal);
    board.setEntity(1, 0, doomed);

    const deaths = new DeathSystem(renderer).execute(board, createConfig());

    expect(board.getEntity(0, 0)).toBe(immortal);
    expect(board.getEntity(1, 0)).toBeNull();
    expect(deaths).toEqual([{ species: 'wolf', cause: 'oldAge', age: 1 }]);
  });
});
