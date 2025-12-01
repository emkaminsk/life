import { describe, it, expect, beforeEach } from 'vitest'
import { Dog } from '../../src/entities/Dog'
import { createConfig, createDog, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Dog Entity Unit Tests
 *
 * Tests dog-specific behavioral mechanics:
 * - Health management and initialization
 * - Age advancement and position tracking
 *
 * Focuses on behavior verification rather than config storage
 */

describe('Dog Entity', () => {
  describe('Health Management', () => {
    it('should initialize with starting health', () => {
      const dog = createDog(15, 15)
      expect(dog.health).toBeGreaterThan(0)
    })

    it('should track health changes independently', () => {
      const dog1 = createDog(5, 5)
      const dog2 = createDog(10, 10)

      const initial1 = dog1.health
      const initial2 = dog2.health

      dog1.health -= 20

      expect(dog1.health).toBe(initial1 - 20)
      expect(dog2.health).toBe(initial2)
    })

    it('should allow health to reach zero', () => {
      const dog = createDog(15, 15)
      dog.health = 0

      expect(dog.health).toBe(0)
    })

    it('should support health healing', () => {
      const dog = createDog(15, 15)
      const initial = dog.health

      dog.health += 30

      expect(dog.health).toBe(initial + 30)
    })

    it('should allow health to go negative', () => {
      const dog = createDog(15, 15)
      dog.health = -40

      expect(dog.health).toBe(-40)
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

})
