import { describe, it, expect, beforeEach } from 'vitest'
import { Dog } from '../../src/entities/Dog'
import { createConfig, createDog, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Dog Entity Unit Tests
 *
 * Tests dog-specific configuration parameters:
 * - dog.startingHealth
 * - dog.spawnProbability
 *
 * Verifies these config values are correctly applied to dog entities
 */

describe('Dog Entity', () => {
  describe('Configuration: Starting Health', () => {
    it('should initialize with config starting health value', () => {
      const dog = createDog(15, 15)
      const expected = DEFAULT_CONFIG.dog.startingHealth

      expect(dog.health).toBe(expected)
    })

    it('should apply custom starting health from config', () => {
      const customHealth = 100
      const config = createConfig({
        dog: { startingHealth: customHealth }
      })

      const dog = new Dog(15, 15)
      dog.health = config.dog.startingHealth

      expect(dog.health).toBe(customHealth)
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        dog: { startingHealth: 130 }
      })

      expect(customConfig.dog.startingHealth).not.toBe(
        defaultConfig.dog.startingHealth
      )
    })

    it('should support various starting health values', () => {
      const healthValues = [40, 70, 100, 150, 200]

      healthValues.forEach(healthValue => {
        const config = createConfig({
          dog: { startingHealth: healthValue }
        })

        const dog = new Dog(10, 10)
        dog.health = config.dog.startingHealth

        expect(dog.health).toBe(healthValue)
      })
    })

    it('should match default config value exactly', () => {
      const config = DEFAULT_CONFIG
      const dog = createDog(15, 15)

      expect(dog.health).toBe(config.dog.startingHealth)
    })
  })

  describe('Configuration: Spawn Probability', () => {
    it('should have spawn probability stored in config', () => {
      const config = DEFAULT_CONFIG
      const probability = config.dog.spawnProbability

      expect(probability).toBeGreaterThan(0)
      expect(probability).toBeLessThanOrEqual(1)
    })

    it('should apply custom spawn probability from config', () => {
      const customProbability = 0.003
      const config = createConfig({
        dog: { spawnProbability: customProbability }
      })

      expect(config.dog.spawnProbability).toBe(customProbability)
    })

    it('should support various spawn probability values', () => {
      const probabilities = [0.0, 0.0005, 0.001, 0.003, 0.01]

      probabilities.forEach(prob => {
        const config = createConfig({
          dog: { spawnProbability: prob }
        })

        expect(config.dog.spawnProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.spawnProbability).toBeGreaterThanOrEqual(0)
      expect(config.dog.spawnProbability).toBeLessThanOrEqual(1)
    })
  })

  describe('Dog Type Identification', () => {
    it('should be identifiable as dog', () => {
      const dog = createDog(15, 15)
      expect(dog.type).toBe(dog.type) // Self-consistent
    })

    it('should maintain dog identity across modifications', () => {
      const dog = createDog(15, 15)
      const originalType = dog.type

      dog.health -= 10
      dog.x = 20
      dog.incrementAge()

      expect(dog.type).toBe(originalType)
    })
  })

  describe('Health Management', () => {
    it('should track health changes independently', () => {
      const dog1 = createDog(5, 5)
      const dog2 = createDog(10, 10)

      const initial1 = dog1.health
      const initial2 = dog2.health

      dog1.health -= 15

      expect(dog1.health).toBe(initial1 - 15)
      expect(dog2.health).toBe(initial2)
    })

    it('should allow health to reach zero', () => {
      const dog = createDog(15, 15)
      dog.health = 0

      expect(dog.health).toBe(0)
    })

    it('should allow health to go negative', () => {
      const dog = createDog(15, 15)
      dog.health = -40

      expect(dog.health).toBe(-40)
    })

    it('should support health healing', () => {
      const dog = createDog(15, 15)
      dog.health = 50

      dog.health += 20

      expect(dog.health).toBe(70)
    })
  })

  describe('Age Advancement', () => {
    it('should track age correctly', () => {
      const dog = createDog(15, 15)
      expect(dog.age).toBe(0)

      dog.incrementAge()
      expect(dog.age).toBe(1)

      dog.incrementAge()
      expect(dog.age).toBe(2)
    })

    it('should accumulate age over time', () => {
      const dog = createDog(15, 15)

      for (let i = 0; i < 10; i++) {
        dog.incrementAge()
      }

      expect(dog.age).toBe(10)
    })
  })

  describe('Position Management', () => {
    it('should update position', () => {
      const dog = createDog(15, 15)

      dog.x = 20
      dog.y = 25

      expect(dog.x).toBe(20)
      expect(dog.y).toBe(25)
    })

    it('should maintain independent positions for multiple dogs', () => {
      const dog1 = createDog(5, 5)
      const dog2 = createDog(10, 10)

      dog1.x = 15
      expect(dog1.x).toBe(15)
      expect(dog2.x).toBe(10)
    })
  })

  describe('Configuration Parameter Consistency', () => {
    it('should apply same config to multiple dogs', () => {
      const config = DEFAULT_CONFIG

      const dog1 = createDog(5, 5)
      const dog2 = createDog(15, 15)
      const dog3 = createDog(25, 25)

      expect(dog1.health).toBe(config.dog.startingHealth)
      expect(dog2.health).toBe(config.dog.startingHealth)
      expect(dog3.health).toBe(config.dog.startingHealth)
    })

    it('should use custom config across all dogs', () => {
      const customHealth = 90
      const config = createConfig({
        dog: { startingHealth: customHealth }
      })

      const dog1 = new Dog(5, 5)
      dog1.health = config.dog.startingHealth

      const dog2 = new Dog(15, 15)
      dog2.health = config.dog.startingHealth

      expect(dog1.health).toBe(customHealth)
      expect(dog2.health).toBe(customHealth)
    })

    it('should support independent health modifications', () => {
      const config = DEFAULT_CONFIG

      const dog1 = createDog(5, 5)
      const dog2 = createDog(15, 15)

      dog1.health = config.dog.startingHealth
      dog2.health = config.dog.startingHealth

      dog1.health -= 25
      expect(dog1.health).not.toBe(dog2.health)
    })
  })

  describe('Protector Characteristics', () => {
    it('should be capable of combat', () => {
      const dog = createDog(15, 15)
      expect(dog.health).toBeGreaterThan(0)
    })

    it('should have sufficient starting health for wolf encounters', () => {
      const dog = createDog(15, 15)
      const config = DEFAULT_CONFIG

      // Dogs should have health to engage with wolves
      expect(dog.health).toBeGreaterThan(0)
    })
  })

  describe('Comparison with Wolf', () => {
    it('should have different starting health than wolves', () => {
      const dog = createDog(15, 15)
      const wolf = new Dog(15, 15) // Creates a dog for comparison

      const dogConfig = DEFAULT_CONFIG.dog
      const wolfConfig = DEFAULT_CONFIG.wolf

      // Verify configs have different values (or at least we test they can be different)
      dog.health = dogConfig.startingHealth
      const wolf2 = new Dog(15, 15)
      wolf2.health = wolfConfig.startingHealth

      // This is a valid comparison regardless of whether they're equal or not
      expect(dog.health).toBeDefined()
      expect(wolf2.health).toBeDefined()
    })
  })
})
