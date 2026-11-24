import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpawnSystem } from '../../src/systems/SpawnSystem'
import { Board } from '../../src/core/Board'
import { Fruit, Mushroom, Wolf, Dog } from '../../src/entities'
import { Random } from '../../src/utils/Random'
import { createConfig, createMockRenderer } from '../setup'

/**
 * SpawnSystem behaviour tests (Phase 7). Single-cell boards make the sequence of
 * random draws (fruit → mushroom → wolf → dog) explicit.
 */

describe('SpawnSystem', () => {
  let renderer: ReturnType<typeof createMockRenderer>
  let system: SpawnSystem

  beforeEach(() => {
    renderer = createMockRenderer()
    system = new SpawnSystem(renderer)
  })

  const probs = createConfig({
    fruit: { spawnProbability: 0.5, energyHealed: 11, roundsToRipen: 4 },
    mushroom: { spawnProbability: 0.5, energyRemoved: 13 },
    wolf: { spawnProbability: 0.5, startingHealth: 61, gompertzA: 0.003, gompertzB: 0.3 },
    dog: { spawnProbability: 0.5, startingHealth: 51, gompertzA: 0.004, gompertzB: 0.4 },
  })

  function spawnWithRolls(...rolls: number[]) {
    const board = new Board(1, 1)
    const spy = vi.spyOn(Math, 'random')
    for (const r of rolls) spy.mockReturnValueOnce(r)
    spy.mockReturnValue(0.99)
    system.execute(board, probs)
    return board.getEntity(0, 0)
  }

  describe('priority fruit → mushroom → wolf → dog, configured stats', () => {
    it('fruit uses configured energyHealed and roundsToRipen', () => {
      const e = spawnWithRolls(0.1)
      expect(e).toBeInstanceOf(Fruit)
      expect((e as Fruit).energyHealed).toBe(11)
      expect((e as Fruit).ripeningCounter).toBe(4)
      expect((e as Fruit).isRipe()).toBe(false)
    })

    it('mushroom uses configured energyRemoved', () => {
      const e = spawnWithRolls(0.9, 0.1)
      expect(e).toBeInstanceOf(Mushroom)
      expect((e as Mushroom).energyRemoved).toBe(13)
    })

    it('wolf uses configured health and Gompertz', () => {
      const e = spawnWithRolls(0.9, 0.9, 0.1) as Wolf
      expect(e).toBeInstanceOf(Wolf)
      expect([e.health, e.maxHealth, e.gompertzA, e.gompertzB]).toEqual([61, 61, 0.003, 0.3])
    })

    it('dog uses configured health and Gompertz', () => {
      const e = spawnWithRolls(0.9, 0.9, 0.9, 0.1) as Dog
      expect(e).toBeInstanceOf(Dog)
      expect([e.health, e.maxHealth, e.gompertzA, e.gompertzB]).toEqual([51, 51, 0.004, 0.4])
    })

    it('nothing spawns when every roll fails', () => {
      expect(spawnWithRolls(0.9, 0.9, 0.9, 0.9)).toBeNull()
    })
  })

  it('only spawns on empty cells and never replaces an entity', () => {
    const board = new Board(3, 3)
    const wolf = new Wolf(1, 1)
    board.setEntity(1, 1, wolf)
    vi.spyOn(Math, 'random').mockReturnValue(0)

    system.execute(board, createConfig())

    expect(board.getEntity(1, 1)).toBe(wolf)
    expect(board.getAllEntities().filter((e) => e instanceof Fruit)).toHaveLength(8)
    expect(renderer.markDirty).toHaveBeenCalledTimes(8)
  })

  it('spawn rate follows the configured probability (seeded, wide bounds)', () => {
    Random.seed(123)
    const board = new Board(50, 50)
    system.execute(
      board,
      createConfig({ fruit: { spawnProbability: 0.2 }, mushroom: { spawnProbability: 0 }, wolf: { spawnProbability: 0 }, dog: { spawnProbability: 0 } })
    )
    const count = board.getAllEntities().length
    expect(count).toBeGreaterThan(2500 * 0.15)
    expect(count).toBeLessThan(2500 * 0.25)
  })

  it('probability 0 everywhere spawns nothing', () => {
    const board = new Board(10, 10)
    system.execute(
      board,
      createConfig({ fruit: { spawnProbability: 0 }, mushroom: { spawnProbability: 0 }, wolf: { spawnProbability: 0 }, dog: { spawnProbability: 0 } })
    )
    expect(board.getAllEntities()).toHaveLength(0)
  })

  describe('ripening', () => {
    it('existing fruits ripen one step per round and are marked dirty when they become ripe', () => {
      const board = new Board(1, 1)
      const fruit = new Fruit(0, 0, 30, 2)
      board.setEntity(0, 0, fruit)
      const config = createConfig()

      system.execute(board, config)
      expect(fruit.ripeningCounter).toBe(1)
      expect(renderer.markDirty).not.toHaveBeenCalled()

      system.execute(board, config)
      expect(fruit.isRipe()).toBe(true)
      expect(renderer.markDirty).toHaveBeenCalledWith(0, 0)
    })
  })
})
