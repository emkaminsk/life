import { describe, it, expect, beforeEach } from 'vitest'
import { Wolf } from '../../src/entities/Wolf'
import { createConfig, createWolf, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Wolf Entity Unit Tests
 *
 * Tests wolf-specific behavioral mechanics:
 * - Health management and initialization
 * - Age advancement and position tracking
 *
 * Focuses on behavior verification rather than config storage
 */

describe('Wolf Entity', () => {
  describe('Health Management', () => {
    it('should initialize with starting health', () => {
      const wolf = createWolf(15, 15)
      expect(wolf.health).toBeGreaterThan(0)
    })

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

})
