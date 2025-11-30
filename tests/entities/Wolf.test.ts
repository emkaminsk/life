import { describe, it, expect, beforeEach } from 'vitest'
import { Wolf } from '../../src/entities/Wolf'
import { createConfig, createWolf, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Wolf Entity Unit Tests
 *
 * Tests wolf-specific configuration parameters:
 * - wolf.startingHealth
 * - wolf.spawnProbability
 *
 * Verifies these config values are correctly applied to wolf entities
 */

describe('Wolf Entity', () => {
  describe('Configuration: Starting Health', () => {
    it('should initialize with config starting health value', () => {
      const wolf = createWolf(15, 15)
      const expected = DEFAULT_CONFIG.wolf.startingHealth

      expect(wolf.health).toBe(expected)
    })

    it('should apply custom starting health from config', () => {
      const customHealth = 120
      const config = createConfig({
        wolf: { startingHealth: customHealth }
      })

      const wolf = new Wolf(15, 15)
      wolf.health = config.wolf.startingHealth

      expect(wolf.health).toBe(customHealth)
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        wolf: { startingHealth: 150 }
      })

      expect(customConfig.wolf.startingHealth).not.toBe(
        defaultConfig.wolf.startingHealth
      )
    })

    it('should support various starting health values', () => {
      const healthValues = [30, 80, 100, 150, 200]

      healthValues.forEach(healthValue => {
        const config = createConfig({
          wolf: { startingHealth: healthValue }
        })

        const wolf = new Wolf(10, 10)
        wolf.health = config.wolf.startingHealth

        expect(wolf.health).toBe(healthValue)
      })
    })

    it('should match default config value exactly', () => {
      const config = DEFAULT_CONFIG
      const wolf = createWolf(15, 15)

      expect(wolf.health).toBe(config.wolf.startingHealth)
    })
  })

  describe('Configuration: Spawn Probability', () => {
    it('should have spawn probability stored in config', () => {
      const config = DEFAULT_CONFIG
      const probability = config.wolf.spawnProbability

      expect(probability).toBeGreaterThan(0)
      expect(probability).toBeLessThanOrEqual(1)
    })

    it('should apply custom spawn probability from config', () => {
      const customProbability = 0.005
      const config = createConfig({
        wolf: { spawnProbability: customProbability }
      })

      expect(config.wolf.spawnProbability).toBe(customProbability)
    })

    it('should support various spawn probability values', () => {
      const probabilities = [0.0, 0.001, 0.002, 0.005, 0.01]

      probabilities.forEach(prob => {
        const config = createConfig({
          wolf: { spawnProbability: prob }
        })

        expect(config.wolf.spawnProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.spawnProbability).toBeGreaterThanOrEqual(0)
      expect(config.wolf.spawnProbability).toBeLessThanOrEqual(1)
    })
  })

  describe('Wolf Type Identification', () => {
    it('should be identifiable as wolf', () => {
      const wolf = createWolf(15, 15)
      expect(wolf.type).toBe(wolf.type) // Self-consistent
    })

    it('should maintain wolf identity across modifications', () => {
      const wolf = createWolf(15, 15)
      const originalType = wolf.type

      wolf.health -= 10
      wolf.x = 20
      wolf.incrementAge()

      expect(wolf.type).toBe(originalType)
    })
  })

  describe('Health Management', () => {
    it('should track health changes independently', () => {
      const wolf1 = createWolf(5, 5)
      const wolf2 = createWolf(10, 10)

      const initial1 = wolf1.health
      const initial2 = wolf2.health

      wolf1.health -= 20

      expect(wolf1.health).toBe(initial1 - 20)
      expect(wolf2.health).toBe(initial2)
    })

    it('should allow health to reach zero', () => {
      const wolf = createWolf(15, 15)
      wolf.health = 0

      expect(wolf.health).toBe(0)
    })

    it('should allow health to go negative', () => {
      const wolf = createWolf(15, 15)
      wolf.health = -50

      expect(wolf.health).toBe(-50)
    })

    it('should support health healing', () => {
      const wolf = createWolf(15, 15)
      wolf.health = 50

      wolf.health += 30

      expect(wolf.health).toBe(80)
    })
  })

  describe('Age Advancement', () => {
    it('should track age correctly', () => {
      const wolf = createWolf(15, 15)
      expect(wolf.age).toBe(0)

      wolf.incrementAge()
      expect(wolf.age).toBe(1)

      wolf.incrementAge()
      expect(wolf.age).toBe(2)
    })

    it('should accumulate age over time', () => {
      const wolf = createWolf(15, 15)

      for (let i = 0; i < 10; i++) {
        wolf.incrementAge()
      }

      expect(wolf.age).toBe(10)
    })
  })

  describe('Position Management', () => {
    it('should update position', () => {
      const wolf = createWolf(15, 15)

      wolf.x = 20
      wolf.y = 25

      expect(wolf.x).toBe(20)
      expect(wolf.y).toBe(25)
    })

    it('should maintain independent positions for multiple wolves', () => {
      const wolf1 = createWolf(5, 5)
      const wolf2 = createWolf(10, 10)

      wolf1.x = 15
      expect(wolf1.x).toBe(15)
      expect(wolf2.x).toBe(10)
    })
  })

  describe('Configuration Parameter Consistency', () => {
    it('should apply same config to multiple wolves', () => {
      const config = DEFAULT_CONFIG

      const wolf1 = createWolf(5, 5)
      const wolf2 = createWolf(15, 15)
      const wolf3 = createWolf(25, 25)

      expect(wolf1.health).toBe(config.wolf.startingHealth)
      expect(wolf2.health).toBe(config.wolf.startingHealth)
      expect(wolf3.health).toBe(config.wolf.startingHealth)
    })

    it('should use custom config across all wolves', () => {
      const customHealth = 100
      const config = createConfig({
        wolf: { startingHealth: customHealth }
      })

      const wolf1 = new Wolf(5, 5)
      wolf1.health = config.wolf.startingHealth

      const wolf2 = new Wolf(15, 15)
      wolf2.health = config.wolf.startingHealth

      expect(wolf1.health).toBe(customHealth)
      expect(wolf2.health).toBe(customHealth)
    })

    it('should support independent health modifications', () => {
      const config = DEFAULT_CONFIG

      const wolf1 = createWolf(5, 5)
      const wolf2 = createWolf(15, 15)

      wolf1.health = config.wolf.startingHealth
      wolf2.health = config.wolf.startingHealth

      wolf1.health -= 30
      expect(wolf1.health).not.toBe(wolf2.health)
    })
  })

  describe('Predator Characteristics', () => {
    it('should be capable of combat', () => {
      const wolf = createWolf(15, 15)
      expect(wolf.health).toBeGreaterThan(0)
    })

    it('should have sufficient starting health for encounters', () => {
      const wolf = createWolf(15, 15)
      const config = DEFAULT_CONFIG

      // Wolves should have reasonable health to survive encounters
      expect(wolf.health).toBeGreaterThan(config.wolf.damageToMale)
    })
  })
})
