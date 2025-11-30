import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SpawnSystem } from '../../src/systems/SpawnSystem'
import { Board } from '../../src/core/Board'
import { Fruit, Mushroom, Wolf, Dog } from '../../src/entities'
import { EntityType } from '../../src/types'
import { createConfig, createMockRenderer } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * SpawnSystem Unit Tests
 *
 * Tests spawn-related configuration parameters:
 * - fruit.spawnProbability - Fruit spawn rate per empty cell
 * - mushroom.spawnProbability - Mushroom spawn rate per empty cell
 * - wolf.spawnProbability - Wolf spawn rate per empty cell
 * - dog.spawnProbability - Dog spawn rate per empty cell
 *
 * Verifies these config values are correctly applied in spawn resolution
 */

describe('SpawnSystem', () => {
  let board: Board
  let system: SpawnSystem
  let renderer: any
  let randomSpy: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new SpawnSystem(renderer)
    randomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  describe('Configuration: Fruit Spawn Probability', () => {
    it('should initialize with config fruit spawn probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.fruit.spawnProbability).toBeGreaterThan(0)
      expect(config.fruit.spawnProbability).toBeLessThanOrEqual(1)
      expect(config.fruit.spawnProbability).toBe(0.01)
    })

    it('should apply custom fruit spawn probability from config', () => {
      const customProbability = 0.05
      const config = createConfig({
        fruit: { spawnProbability: customProbability }
      })

      expect(config.fruit.spawnProbability).toBe(customProbability)
    })

    it('should support various fruit spawn probability values', () => {
      const probabilities = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]

      probabilities.forEach(prob => {
        const config = createConfig({
          fruit: { spawnProbability: prob }
        })

        expect(config.fruit.spawnProbability).toBe(prob)
      })
    })

    it('should spawn fruit when probability check succeeds', () => {
      const config = DEFAULT_CONFIG
      // Empty board
      
      // Mock random to succeed for fruit spawn
      randomSpy.mockReturnValue(0.005) // 0.005 < 0.01 (fruit probability)

      system.execute(board, config)

      const fruits = board.getAllEntities().filter(e => e instanceof Fruit)
      expect(fruits.length).toBeGreaterThan(0)
    })

    it('should not spawn fruit when probability check fails', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random to fail for fruit spawn
      randomSpy.mockReturnValue(0.02) // 0.02 >= 0.01 (fruit probability)

      system.execute(board, config)

      const fruits = board.getAllEntities().filter(e => e instanceof Fruit)
      expect(fruits.length).toBe(0)
    })
  })

  describe('Configuration: Mushroom Spawn Probability', () => {
    it('should initialize with config mushroom spawn probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.mushroom.spawnProbability).toBeGreaterThan(0)
      expect(config.mushroom.spawnProbability).toBeLessThanOrEqual(1)
      expect(config.mushroom.spawnProbability).toBe(0.005)
    })

    it('should apply custom mushroom spawn probability from config', () => {
      const customProbability = 0.02
      const config = createConfig({
        mushroom: { spawnProbability: customProbability }
      })

      expect(config.mushroom.spawnProbability).toBe(customProbability)
    })

    it('should spawn mushroom when fruit fails and mushroom succeeds', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random: fruit fails (0.02 >= 0.01), mushroom succeeds (0.003 < 0.005)
      randomSpy.mockReturnValueOnce(0.02) // Fruit check fails
      randomSpy.mockReturnValueOnce(0.003) // Mushroom check succeeds

      system.execute(board, config)

      const mushrooms = board.getAllEntities().filter(e => e instanceof Mushroom)
      expect(mushrooms.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration: Wolf Spawn Probability', () => {
    it('should initialize with config wolf spawn probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.spawnProbability).toBeGreaterThan(0)
      expect(config.wolf.spawnProbability).toBeLessThanOrEqual(1)
      expect(config.wolf.spawnProbability).toBe(0.002)
    })

    it('should apply custom wolf spawn probability from config', () => {
      const customProbability = 0.01
      const config = createConfig({
        wolf: { spawnProbability: customProbability }
      })

      expect(config.wolf.spawnProbability).toBe(customProbability)
    })

    it('should spawn wolf when fruit and mushroom fail and wolf succeeds', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random: fruit fails, mushroom fails, wolf succeeds
      randomSpy.mockReturnValueOnce(0.02) // Fruit fails
      randomSpy.mockReturnValueOnce(0.01) // Mushroom fails
      randomSpy.mockReturnValueOnce(0.001) // Wolf succeeds (0.001 < 0.002)

      system.execute(board, config)

      const wolves = board.getAllEntities().filter(e => e instanceof Wolf)
      expect(wolves.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration: Dog Spawn Probability', () => {
    it('should initialize with config dog spawn probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.spawnProbability).toBeGreaterThan(0)
      expect(config.dog.spawnProbability).toBeLessThanOrEqual(1)
      expect(config.dog.spawnProbability).toBe(0.001)
    })

    it('should apply custom dog spawn probability from config', () => {
      const customProbability = 0.005
      const config = createConfig({
        dog: { spawnProbability: customProbability }
      })

      expect(config.dog.spawnProbability).toBe(customProbability)
    })

    it('should spawn dog when fruit, mushroom, and wolf fail and dog succeeds', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random: all previous fail, dog succeeds
      randomSpy.mockReturnValueOnce(0.02) // Fruit fails
      randomSpy.mockReturnValueOnce(0.01) // Mushroom fails
      randomSpy.mockReturnValueOnce(0.01) // Wolf fails
      randomSpy.mockReturnValueOnce(0.0005) // Dog succeeds (0.0005 < 0.001)

      system.execute(board, config)

      const dogs = board.getAllEntities().filter(e => e instanceof Dog)
      expect(dogs.length).toBeGreaterThan(0)
    })
  })

  describe('Spawn Priority Order', () => {
    it('should prioritize fruit over other spawns', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random to succeed for fruit
      randomSpy.mockReturnValue(0.005) // Fruit succeeds

      system.execute(board, config)

      const fruits = board.getAllEntities().filter(e => e instanceof Fruit)
      const mushrooms = board.getAllEntities().filter(e => e instanceof Mushroom)
      const wolves = board.getAllEntities().filter(e => e instanceof Wolf)
      const dogs = board.getAllEntities().filter(e => e instanceof Dog)

      expect(fruits.length).toBeGreaterThan(0)
      // When fruit spawns, others should not spawn in same cell
      expect(mushrooms.length).toBe(0)
      expect(wolves.length).toBe(0)
      expect(dogs.length).toBe(0)
    })

    it('should only spawn one entity per cell', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random to succeed for fruit (first check)
      randomSpy.mockReturnValue(0.005) // Fruit succeeds

      system.execute(board, config)

      // Check that each cell has at most one entity
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          const entity = board.getEntity(x, y)
          if (entity) {
            // Should be only one entity type
            const isFruit = entity instanceof Fruit
            const isMushroom = entity instanceof Mushroom
            const isWolf = entity instanceof Wolf
            const isDog = entity instanceof Dog
            const entityTypes = [isFruit, isMushroom, isWolf, isDog].filter(Boolean).length
            expect(entityTypes).toBeLessThanOrEqual(1)
          }
        }
      }
    })
  })

  describe('Fruit Ripening Advancement', () => {
    it('should advance ripening for existing fruits', () => {
      const config = DEFAULT_CONFIG
      const fruit = new Fruit(15, 15)
      fruit.ripeningCounter = 2

      board.setEntity(15, 15, fruit)

      randomSpy.mockReturnValue(1.0) // No new spawns

      system.execute(board, config)

      expect(fruit.ripeningCounter).toBe(1)
    })

    it('should mark dirty when fruit ripens', () => {
      const config = DEFAULT_CONFIG
      const fruit = new Fruit(15, 15)
      fruit.ripeningCounter = 1 // Will ripen this round

      board.setEntity(15, 15, fruit)

      randomSpy.mockReturnValue(1.0) // No new spawns

      system.execute(board, config)

      expect(fruit.isRipe()).toBe(true)
      expect(renderer.markDirty).toHaveBeenCalledWith(15, 15)
    })
  })

  describe('Empty Cell Requirement', () => {
    it('should only spawn in empty cells', () => {
      const config = DEFAULT_CONFIG
      
      // Fill board with entities
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          board.setEntity(x, y, new Fruit(x, y))
        }
      }

      const initialCount = board.getAllEntities().length

      randomSpy.mockReturnValue(0.005) // Would spawn if empty

      system.execute(board, config)

      // Should not spawn anything (no empty cells)
      expect(board.getAllEntities().length).toBe(initialCount)
    })
  })

  describe('System Integration', () => {
    it('should mark dirty cells for rendering', () => {
      const config = DEFAULT_CONFIG
      
      randomSpy.mockReturnValue(0.005) // Fruit spawns

      system.execute(board, config)

      // Should mark spawned cells as dirty
      expect(renderer.markDirty).toHaveBeenCalled()
    })

    it('should process multiple empty cells independently', () => {
      const config = DEFAULT_CONFIG
      
      // Mock random to spawn fruit in some cells
      let callCount = 0
      randomSpy.mockImplementation(() => {
        callCount++
        // Spawn fruit in first 5 cells, then nothing
        return callCount <= 5 ? 0.005 : 1.0
      })

      system.execute(board, config)

      const fruits = board.getAllEntities().filter(e => e instanceof Fruit)
      expect(fruits.length).toBeGreaterThan(0)
    })
  })
})

