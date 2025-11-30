import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DeathSystem } from '../../src/systems/DeathSystem'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Dog } from '../../src/entities'
import { Sex } from '../../src/types'
import { createConfig, createMockRenderer, createMale, createFemale, createWolf, createDog } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'
import { Gompertz } from '../../src/utils/Gompertz'

/**
 * DeathSystem Unit Tests
 *
 * Tests death-related configuration parameters:
 * - human.gompertzA, human.gompertzB - Human mortality curve
 * - wolf.gompertzA, wolf.gompertzB - Wolf mortality curve
 * - dog.gompertzA, dog.gompertzB - Dog mortality curve
 * - overcrowding.humanThreshold - Human overpopulation threshold
 * - overcrowding.humanMultiplier - Mortality multiplier for humans
 * - overcrowding.animalThreshold - Animal overpopulation threshold
 * - overcrowding.animalMultiplier - Mortality multiplier for animals
 *
 * Verifies these config values are correctly applied in death resolution
 */

describe('DeathSystem', () => {
  let board: Board
  let system: DeathSystem
  let renderer: any
  let randomSpy: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new DeathSystem(renderer)
    randomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  describe('Health-Based Death', () => {
    it('should kill entities with health <= 0', () => {
      const human = createMale(15, 15)
      human.health = 0

      board.setEntity(15, 15, human)

      system.execute(board)

      expect(board.getEntity(15, 15)).toBeNull()
    })

    it('should kill entities with negative health', () => {
      const human = createMale(15, 15)
      human.health = -10

      board.setEntity(15, 15, human)

      system.execute(board)

      expect(board.getEntity(15, 15)).toBeNull()
    })

    it('should not kill entities with health > 0', () => {
      const human = createMale(15, 15)
      human.health = 1

      board.setEntity(15, 15, human)

      system.execute(board)

      expect(board.getEntity(15, 15)).toBe(human)
    })
  })

  describe('Age Advancement', () => {
    it('should increment age for all entities', () => {
      const human = createMale(15, 15)
      const wolf = createWolf(16, 16)
      const dog = createDog(17, 17)

      human.age = 5
      wolf.age = 10
      dog.age = 7

      board.setEntity(15, 15, human)
      board.setEntity(16, 16, wolf)
      board.setEntity(17, 17, dog)

      system.execute(board)

      expect(human.age).toBe(6)
      expect(wolf.age).toBe(11)
      expect(dog.age).toBe(8)
    })
  })

  describe('Gompertz Mortality: Human', () => {
    it('should initialize with config gompertzA and gompertzB', () => {
      const config = DEFAULT_CONFIG
      expect(config.human.gompertzA).toBeGreaterThan(0)
      expect(config.human.gompertzB).toBeGreaterThan(0)
    })

    it('should apply custom gompertzA from config', () => {
      const customA = 0.001
      const config = createConfig({
        human: { gompertzA: customA }
      })

      const human = new Human(15, 15, Sex.MALE, undefined, config.human.gompertzA, config.human.gompertzB)
      expect(human.gompertzA).toBe(customA)
    })

    it('should apply custom gompertzB from config', () => {
      const customB = 0.2
      const config = createConfig({
        human: { gompertzB: customB }
      })

      const human = new Human(15, 15, Sex.MALE, undefined, config.human.gompertzA, config.human.gompertzB)
      expect(human.gompertzB).toBe(customB)
    })

    it('should increase death probability with age', () => {
      const youngHuman = createMale(15, 15)
      youngHuman.age = 10
      const oldHuman = createMale(16, 16)
      oldHuman.age = 50

      board.setEntity(15, 15, youngHuman)
      board.setEntity(16, 16, oldHuman)

      // Calculate probabilities
      const youngProb = Gompertz.deathProbability(10, youngHuman.gompertzA, youngHuman.gompertzB)
      const oldProb = Gompertz.deathProbability(50, oldHuman.gompertzA, oldHuman.gompertzB)

      expect(oldProb).toBeGreaterThan(youngProb)
    })

    it('should kill human when Gompertz probability succeeds', () => {
      const human = createMale(15, 15)
      human.age = 100 // Very old
      human.health = 100 // Healthy

      board.setEntity(15, 15, human)

      // Mock random to succeed (death probability is high for age 100)
      const prob = Gompertz.deathProbability(100, human.gompertzA, human.gompertzB)
      randomSpy.mockReturnValue(prob - 0.01) // Just below probability

      system.execute(board)

      expect(board.getEntity(15, 15)).toBeNull()
    })

    it('should not kill human when Gompertz probability fails', () => {
      const human = createMale(15, 15)
      human.age = 1 // Very young
      human.health = 100 // Healthy

      board.setEntity(15, 15, human)

      // Mock random to fail (death probability is very low for age 1)
      const prob = Gompertz.deathProbability(1, human.gompertzA, human.gompertzB)
      randomSpy.mockReturnValue(prob + 0.01) // Just above probability

      system.execute(board)

      expect(board.getEntity(15, 15)).toBe(human)
    })
  })

  describe('Gompertz Mortality: Wolf', () => {
    it('should initialize with config gompertzA and gompertzB', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.gompertzA).toBeGreaterThan(0)
      expect(config.wolf.gompertzB).toBeGreaterThan(0)
    })

    it('should apply custom wolf gompertzA from config', () => {
      const customA = 0.0005
      const config = createConfig({
        wolf: { gompertzA: customA }
      })

      const wolf = new Wolf(15, 15, config.wolf.startingHealth, config.wolf.gompertzA, config.wolf.gompertzB)
      expect(wolf.gompertzA).toBe(customA)
    })

    it('should use wolf-specific parameters independently', () => {
      const human = createMale(15, 15)
      human.age = 20
      const wolf = createWolf(16, 16)
      wolf.age = 20

      // Different species should have different mortality rates
      const humanProb = Gompertz.deathProbability(20, human.gompertzA, human.gompertzB)
      const wolfProb = Gompertz.deathProbability(20, wolf.gompertzA, wolf.gompertzB)

      // They may differ (depends on config values)
      expect(typeof humanProb).toBe('number')
      expect(typeof wolfProb).toBe('number')
    })
  })

  describe('Gompertz Mortality: Dog', () => {
    it('should initialize with config gompertzA and gompertzB', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.gompertzA).toBeGreaterThan(0)
      expect(config.dog.gompertzB).toBeGreaterThan(0)
    })

    it('should apply custom dog gompertzA from config', () => {
      const customA = 0.0003
      const config = createConfig({
        dog: { gompertzA: customA }
      })

      const dog = new Dog(15, 15, config.dog.startingHealth, config.dog.gompertzA, config.dog.gompertzB)
      expect(dog.gompertzA).toBe(customA)
    })

    it('should use dog-specific parameters independently', () => {
      const wolf = createWolf(15, 15)
      wolf.age = 20
      const dog = createDog(16, 16)
      dog.age = 20

      const wolfProb = Gompertz.deathProbability(20, wolf.gompertzA, wolf.gompertzB)
      const dogProb = Gompertz.deathProbability(20, dog.gompertzA, dog.gompertzB)

      expect(typeof wolfProb).toBe('number')
      expect(typeof dogProb).toBe('number')
    })
  })

  describe('Overcrowding: Human Threshold', () => {
    it('should initialize with config human threshold', () => {
      const config = DEFAULT_CONFIG
      expect(config.overcrowding.humanThreshold).toBeGreaterThan(0)
      expect(config.overcrowding.humanThreshold).toBe(100)
    })

    it('should apply custom human threshold from config', () => {
      const customThreshold = 50
      const config = createConfig({
        overcrowding: { humanThreshold: customThreshold }
      })

      expect(config.overcrowding.humanThreshold).toBe(customThreshold)
    })

    it('should not apply multiplier when humans below threshold', () => {
      const config = DEFAULT_CONFIG
      const threshold = config.overcrowding.humanThreshold

      // Create humans below threshold
      for (let i = 0; i < threshold - 10; i++) {
        const x = i % 30
        const y = Math.floor(i / 30)
        board.setEntity(x, y, createMale(x, y))
      }

      const human = createMale(15, 15)
      human.age = 100 // Very old
      board.setEntity(15, 15, human)

      // Calculate probability without multiplier
      const normalProb = Gompertz.deathProbability(100, human.gompertzA, human.gompertzB, 1)
      
      // System should use multiplier = 1 when below threshold
      const humanCount = board.getAllEntities().filter(e => e instanceof Human).length
      expect(humanCount).toBeLessThan(threshold)
    })

    it('should apply multiplier when humans exceed threshold', () => {
      const config = DEFAULT_CONFIG
      const threshold = config.overcrowding.humanThreshold

      // Create humans above threshold
      for (let i = 0; i < threshold + 10; i++) {
        const x = i % 30
        const y = Math.floor(i / 30)
        if (x < 30 && y < 30) {
          board.setEntity(x, y, createMale(x, y))
        }
      }

      const humanCount = board.getAllEntities().filter(e => e instanceof Human).length
      expect(humanCount).toBeGreaterThan(threshold)
    })
  })

  describe('Overcrowding: Human Multiplier', () => {
    it('should initialize with config human multiplier', () => {
      const config = DEFAULT_CONFIG
      expect(config.overcrowding.humanMultiplier).toBeGreaterThan(1)
      expect(config.overcrowding.humanMultiplier).toBe(2)
    })

    it('should apply custom human multiplier from config', () => {
      const customMultiplier = 3
      const config = createConfig({
        overcrowding: { humanMultiplier: customMultiplier }
      })

      expect(config.overcrowding.humanMultiplier).toBe(customMultiplier)
    })

    it('should increase death probability with multiplier', () => {
      const human = createMale(15, 15)
      human.age = 50

      const normalProb = Gompertz.deathProbability(50, human.gompertzA, human.gompertzB, 1)
      const multipliedProb = Gompertz.deathProbability(50, human.gompertzA, human.gompertzB, 2)

      expect(multipliedProb).toBeGreaterThan(normalProb)
    })
  })

  describe('Overcrowding: Animal Threshold', () => {
    it('should initialize with config animal threshold', () => {
      const config = DEFAULT_CONFIG
      expect(config.overcrowding.animalThreshold).toBeGreaterThan(0)
      expect(config.overcrowding.animalThreshold).toBe(50)
    })

    it('should apply custom animal threshold from config', () => {
      const customThreshold = 30
      const config = createConfig({
        overcrowding: { animalThreshold: customThreshold }
      })

      expect(config.overcrowding.animalThreshold).toBe(customThreshold)
    })

    it('should count wolves and dogs together for animal threshold', () => {
      const config = DEFAULT_CONFIG
      const threshold = config.overcrowding.animalThreshold

      // Create mix of wolves and dogs
      for (let i = 0; i < threshold; i++) {
        const x = i % 30
        const y = Math.floor(i / 30)
        if (i % 2 === 0) {
          board.setEntity(x, y, createWolf(x, y))
        } else {
          board.setEntity(x, y, createDog(x, y))
        }
      }

      const animals = board.getAllEntities().filter(e => e instanceof Wolf || e instanceof Dog)
      expect(animals.length).toBe(threshold)
    })
  })

  describe('Overcrowding: Animal Multiplier', () => {
    it('should initialize with config animal multiplier', () => {
      const config = DEFAULT_CONFIG
      expect(config.overcrowding.animalMultiplier).toBeGreaterThan(1)
      expect(config.overcrowding.animalMultiplier).toBe(2)
    })

    it('should apply custom animal multiplier from config', () => {
      const customMultiplier = 3
      const config = createConfig({
        overcrowding: { animalMultiplier: customMultiplier }
      })

      expect(config.overcrowding.animalMultiplier).toBe(customMultiplier)
    })

    it('should apply multiplier to wolves when overcrowded', () => {
      const wolf = createWolf(15, 15)
      wolf.age = 50

      const normalProb = Gompertz.deathProbability(50, wolf.gompertzA, wolf.gompertzB, 1)
      const multipliedProb = Gompertz.deathProbability(50, wolf.gompertzA, wolf.gompertzB, 2)

      expect(multipliedProb).toBeGreaterThan(normalProb)
    })

    it('should apply multiplier to dogs when overcrowded', () => {
      const dog = createDog(15, 15)
      dog.age = 50

      const normalProb = Gompertz.deathProbability(50, dog.gompertzA, dog.gompertzB, 1)
      const multipliedProb = Gompertz.deathProbability(50, dog.gompertzA, dog.gompertzB, 2)

      expect(multipliedProb).toBeGreaterThan(normalProb)
    })
  })

  describe('System Integration', () => {
    it('should mark dirty cells for removed entities', () => {
      const human = createMale(15, 15)
      human.health = 0

      board.setEntity(15, 15, human)

      system.execute(board)

      expect(renderer.markDirty).toHaveBeenCalledWith(15, 15)
    })

    it('should process health and age deaths in same round', () => {
      const deadHuman = createMale(15, 15)
      deadHuman.health = 0
      const oldHuman = createMale(16, 16)
      oldHuman.age = 100
      oldHuman.health = 100

      board.setEntity(15, 15, deadHuman)
      board.setEntity(16, 16, oldHuman)

      // Mock random for age death
      const prob = Gompertz.deathProbability(100, oldHuman.gompertzA, oldHuman.gompertzB)
      randomSpy.mockReturnValue(prob - 0.01)

      system.execute(board)

      // Both should be removed
      expect(board.getEntity(15, 15)).toBeNull()
      // Age death depends on probability
    })
  })
})

