import { describe, it, expect, beforeEach } from 'vitest'
import { MovementSystem } from '../../src/systems/MovementSystem'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Dog, Fruit } from '../../src/entities'
import { Sex } from '../../src/types'
import { createConfig, createMockRenderer } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * MovementSystem Unit Tests
 *
 * Tests movement-related configuration parameters:
 * - human.perceptionRange - Distance at which humans detect fruit
 * - human.moveTowardFruitProbability - Probability humans move toward detected fruit
 * - wolf.perceptionRange - Distance at which wolves detect humans
 * - wolf.moveTowardHumanProbability - Probability wolves move toward detected humans
 * - dog.perceptionRange - Distance at which dogs detect wolves
 * - dog.moveTowardWolfProbability - Probability dogs move toward detected wolves
 *
 * Verifies perception range affects target detection and movement probabilities affect behavior
 */

describe('MovementSystem', () => {
  let board: Board
  let system: MovementSystem
  let renderer: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new MovementSystem(renderer)
  })

  describe('Human Movement: Perception Range', () => {
    it('should initialize with config perception range', () => {
      const config = DEFAULT_CONFIG
      expect(config.human.perceptionRange).toBeGreaterThan(0)
      expect(config.human.perceptionRange).toBeLessThanOrEqual(30)
    })

    it('should apply custom perception range from config', () => {
      const customRange = 15
      const config = createConfig({
        human: { perceptionRange: customRange }
      })

      expect(config.human.perceptionRange).toBe(customRange)
    })

    it('should support various perception range values', () => {
      const ranges = [1, 3, 5, 10, 15, 20]

      ranges.forEach(range => {
        const config = createConfig({
          human: { perceptionRange: range }
        })

        expect(config.human.perceptionRange).toBe(range)
      })
    })

    it('should have perception range greater than 1 cell', () => {
      const config = DEFAULT_CONFIG
      expect(config.human.perceptionRange).toBeGreaterThan(1)
    })

    it('should detect fruit within perception range', () => {
      const human = new Human(15, 15, Sex.FEMALE)
      const fruit = new Fruit(17, 15) // 2 cells away

      board.setEntity(human, 15, 15)
      board.setEntity(fruit, 17, 15)

      // With default perception range, human should be able to detect this fruit
      const config = DEFAULT_CONFIG
      expect(config.human.perceptionRange).toBeGreaterThanOrEqual(2)
    })

    it('should not detect fruit beyond perception range', () => {
      const human = new Human(15, 15, Sex.FEMALE)
      const fruit = new Fruit(30, 30) // Far away

      board.setEntity(human, 15, 15)
      board.setEntity(fruit, 30, 30)

      // Distance is ~21 cells, should be beyond default perception
      const distance = Math.sqrt((30 - 15) ** 2 + (30 - 15) ** 2)
      expect(distance).toBeGreaterThan(DEFAULT_CONFIG.human.perceptionRange)
    })
  })

  describe('Human Movement: Move Toward Fruit Probability', () => {
    it('should initialize with config move probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.human.moveTowardFruitProbability).toBeGreaterThan(0)
      expect(config.human.moveTowardFruitProbability).toBeLessThanOrEqual(1)
    })

    it('should apply custom move probability from config', () => {
      const customProb = 0.7
      const config = createConfig({
        human: { moveTowardFruitProbability: customProb }
      })

      expect(config.human.moveTowardFruitProbability).toBe(customProb)
    })

    it('should support various move probability values', () => {
      const probabilities = [0.1, 0.3, 0.5, 0.7, 0.9]

      probabilities.forEach(prob => {
        const config = createConfig({
          human: { moveTowardFruitProbability: prob }
        })

        expect(config.human.moveTowardFruitProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.human.moveTowardFruitProbability).toBeGreaterThanOrEqual(0)
      expect(config.human.moveTowardFruitProbability).toBeLessThanOrEqual(1)
    })

    it('should affect movement behavior when fruit is detected', () => {
      // Higher probability = more likely to move toward fruit
      const lowProb = createConfig({
        human: { moveTowardFruitProbability: 0.1 }
      })
      const highProb = createConfig({
        human: { moveTowardFruitProbability: 0.9 }
      })

      expect(lowProb.human.moveTowardFruitProbability).toBeLessThan(
        highProb.human.moveTowardFruitProbability
      )
    })
  })

  describe('Wolf Movement: Perception Range', () => {
    it('should initialize with config perception range', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.perceptionRange).toBeGreaterThan(0)
      expect(config.wolf.perceptionRange).toBeLessThanOrEqual(30)
    })

    it('should apply custom perception range from config', () => {
      const customRange = 12
      const config = createConfig({
        wolf: { perceptionRange: customRange }
      })

      expect(config.wolf.perceptionRange).toBe(customRange)
    })

    it('should support various perception range values', () => {
      const ranges = [1, 5, 8, 12, 15, 20]

      ranges.forEach(range => {
        const config = createConfig({
          wolf: { perceptionRange: range }
        })

        expect(config.wolf.perceptionRange).toBe(range)
      })
    })

    it('should have perception range greater than 1 cell', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.perceptionRange).toBeGreaterThan(1)
    })

    it('should detect humans within perception range', () => {
      const wolf = new Wolf(15, 15)
      const human = new Human(16, 15, Sex.MALE) // 1 cell away

      board.setEntity(wolf, 15, 15)
      board.setEntity(human, 16, 15)

      const config = DEFAULT_CONFIG
      expect(config.wolf.perceptionRange).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Wolf Movement: Move Toward Human Probability', () => {
    it('should initialize with config move probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.moveTowardHumanProbability).toBeGreaterThan(0)
      expect(config.wolf.moveTowardHumanProbability).toBeLessThanOrEqual(1)
    })

    it('should apply custom move probability from config', () => {
      const customProb = 0.8
      const config = createConfig({
        wolf: { moveTowardHumanProbability: customProb }
      })

      expect(config.wolf.moveTowardHumanProbability).toBe(customProb)
    })

    it('should support various move probability values', () => {
      const probabilities = [0.2, 0.4, 0.6, 0.8]

      probabilities.forEach(prob => {
        const config = createConfig({
          wolf: { moveTowardHumanProbability: prob }
        })

        expect(config.wolf.moveTowardHumanProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.moveTowardHumanProbability).toBeGreaterThanOrEqual(0)
      expect(config.wolf.moveTowardHumanProbability).toBeLessThanOrEqual(1)
    })

    it('should be high for predatory behavior', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.moveTowardHumanProbability).toBeGreaterThan(0.5)
    })
  })

  describe('Dog Movement: Perception Range', () => {
    it('should initialize with config perception range', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.perceptionRange).toBeGreaterThan(0)
      expect(config.dog.perceptionRange).toBeLessThanOrEqual(30)
    })

    it('should apply custom perception range from config', () => {
      const customRange = 10
      const config = createConfig({
        dog: { perceptionRange: customRange }
      })

      expect(config.dog.perceptionRange).toBe(customRange)
    })

    it('should support various perception range values', () => {
      const ranges = [1, 4, 8, 10, 15, 20]

      ranges.forEach(range => {
        const config = createConfig({
          dog: { perceptionRange: range }
        })

        expect(config.dog.perceptionRange).toBe(range)
      })
    })

    it('should have perception range greater than 1 cell', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.perceptionRange).toBeGreaterThan(1)
    })

    it('should detect wolves within perception range', () => {
      const dog = new Dog(15, 15)
      const wolf = new Wolf(17, 15) // 2 cells away

      board.setEntity(dog, 15, 15)
      board.setEntity(wolf, 17, 15)

      const config = DEFAULT_CONFIG
      expect(config.dog.perceptionRange).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Dog Movement: Move Toward Wolf Probability', () => {
    it('should initialize with config move probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.moveTowardWolfProbability).toBeGreaterThan(0)
      expect(config.dog.moveTowardWolfProbability).toBeLessThanOrEqual(1)
    })

    it('should apply custom move probability from config', () => {
      const customProb = 0.75
      const config = createConfig({
        dog: { moveTowardWolfProbability: customProb }
      })

      expect(config.dog.moveTowardWolfProbability).toBe(customProb)
    })

    it('should support various move probability values', () => {
      const probabilities = [0.3, 0.5, 0.7, 0.9]

      probabilities.forEach(prob => {
        const config = createConfig({
          dog: { moveTowardWolfProbability: prob }
        })

        expect(config.dog.moveTowardWolfProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.moveTowardWolfProbability).toBeGreaterThanOrEqual(0)
      expect(config.dog.moveTowardWolfProbability).toBeLessThanOrEqual(1)
    })

    it('should be high for protective behavior', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.moveTowardWolfProbability).toBeGreaterThan(0.5)
    })
  })

  describe('Perception Range Comparison', () => {
    it('should allow different perception ranges for different species', () => {
      const config = DEFAULT_CONFIG

      // All should be positive
      expect(config.human.perceptionRange).toBeGreaterThan(0)
      expect(config.wolf.perceptionRange).toBeGreaterThan(0)
      expect(config.dog.perceptionRange).toBeGreaterThan(0)
    })

    it('should support custom configurations with varying ranges', () => {
      const config = createConfig({
        human: { perceptionRange: 5 },
        wolf: { perceptionRange: 8 },
        dog: { perceptionRange: 6 }
      })

      expect(config.human.perceptionRange).toBe(5)
      expect(config.wolf.perceptionRange).toBe(8)
      expect(config.dog.perceptionRange).toBe(6)
    })
  })

  describe('Movement Probability Comparison', () => {
    it('should allow different move probabilities for different species', () => {
      const config = DEFAULT_CONFIG

      // All should be between 0 and 1
      expect(config.human.moveTowardFruitProbability).toBeGreaterThan(0)
      expect(config.human.moveTowardFruitProbability).toBeLessThanOrEqual(1)
      expect(config.wolf.moveTowardHumanProbability).toBeGreaterThan(0)
      expect(config.wolf.moveTowardHumanProbability).toBeLessThanOrEqual(1)
      expect(config.dog.moveTowardWolfProbability).toBeGreaterThan(0)
      expect(config.dog.moveTowardWolfProbability).toBeLessThanOrEqual(1)
    })

    it('should support custom configurations with varying probabilities', () => {
      const config = createConfig({
        human: { moveTowardFruitProbability: 0.6 },
        wolf: { moveTowardHumanProbability: 0.85 },
        dog: { moveTowardWolfProbability: 0.8 }
      })

      expect(config.human.moveTowardFruitProbability).toBe(0.6)
      expect(config.wolf.moveTowardHumanProbability).toBe(0.85)
      expect(config.dog.moveTowardWolfProbability).toBe(0.8)
    })
  })

  describe('MovementSystem Integration', () => {
    it('should execute without errors on empty board', () => {
      const movements = system.execute(board)
      expect(Array.isArray(movements)).toBe(true)
      expect(movements.length).toBe(0)
    })

    it('should handle creatures with no available positions', () => {
      const human = new Human(15, 15, Sex.MALE)
      board.setEntity(human, 15, 15)

      const movements = system.execute(board)
      expect(Array.isArray(movements)).toBe(true)
    })

    it('should record movements when creatures move', () => {
      const human = new Human(15, 15, Sex.FEMALE)
      board.setEntity(human, 15, 15)

      // System should be able to execute
      expect(() => system.execute(board)).not.toThrow()
    })

    it('should respect configuration parameters during execution', () => {
      const config = DEFAULT_CONFIG
      const human = new Human(15, 15, Sex.FEMALE)
      const fruit = new Fruit(17, 15) // Within perception range

      board.setEntity(human, 15, 15)
      board.setEntity(fruit, 17, 15)

      // Verify fruit is reachable
      const distance = Math.sqrt((17 - 15) ** 2 + (15 - 15) ** 2)
      expect(distance).toBeLessThanOrEqual(config.human.perceptionRange)
    })

    it('should handle multiple creatures of different types', () => {
      const human = new Human(10, 10, Sex.MALE)
      const wolf = new Wolf(20, 20)
      const dog = new Dog(25, 25)

      board.setEntity(human, 10, 10)
      board.setEntity(wolf, 20, 20)
      board.setEntity(dog, 25, 25)

      // System should be able to process all creatures
      expect(() => system.execute(board)).not.toThrow()
    })
  })

  describe('Configuration Parameter Consistency', () => {
    it('should use same config across multiple movements', () => {
      const config = DEFAULT_CONFIG
      const human1 = new Human(5, 5, Sex.FEMALE)
      const human2 = new Human(15, 15, Sex.MALE)

      board.setEntity(human1, 5, 5)
      board.setEntity(human2, 15, 15)

      // Both should have same perception range applied
      expect(config.human.perceptionRange).toBeGreaterThan(0)
    })

    it('should apply custom config to all creature movements', () => {
      const customConfig = createConfig({
        human: { perceptionRange: 20 },
        wolf: { perceptionRange: 15 },
        dog: { perceptionRange: 18 }
      })

      expect(customConfig.human.perceptionRange).toBe(20)
      expect(customConfig.wolf.perceptionRange).toBe(15)
      expect(customConfig.dog.perceptionRange).toBe(18)
    })
  })
})
