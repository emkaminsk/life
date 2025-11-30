import { describe, it, expect, beforeEach } from 'vitest'
import { Entity } from '../../src/entities/Entity'
import { EntityType } from '../../src/types'
import { createHuman, createWolf, createDog } from '../setup'

/**
 * Entity Base Class Unit Tests
 *
 * Tests foundational entity behavior: health tracking, age advancement, position management
 * These tests don't depend on specific configuration parameters
 */

describe('Entity Base Class', () => {
  describe('Initialization', () => {
    it('should initialize with correct position', () => {
      const human = createHuman(10, 20)
      expect(human.x).toBe(10)
      expect(human.y).toBe(20)
    })

    it('should initialize with default health', () => {
      const human = createHuman(15, 15)
      expect(human.health).toBeGreaterThan(0)
    })

    it('should initialize with zero age', () => {
      const human = createHuman(15, 15)
      expect(human.age).toBe(0)
    })

    it('should set correct entity type', () => {
      const human = createHuman(15, 15)
      expect(human.type).toBe(EntityType.HUMAN)

      const wolf = createWolf(10, 10)
      expect(wolf.type).toBe(EntityType.WOLF)

      const dog = createDog(12, 12)
      expect(dog.type).toBe(EntityType.DOG)
    })
  })

  describe('Health Management', () => {
    it('should decrease health when damaged', () => {
      const human = createHuman(15, 15)
      const initialHealth = human.health
      const damage = 10

      human.health -= damage
      expect(human.health).toBe(initialHealth - damage)
    })

    it('should handle zero health', () => {
      const human = createHuman(15, 15)
      human.health = 0
      expect(human.health).toBe(0)
    })

    it('should allow negative health', () => {
      const human = createHuman(15, 15)
      human.health = -10
      expect(human.health).toBe(-10)
    })

    it('should track cumulative damage', () => {
      const human = createHuman(15, 15)
      const initialHealth = human.health

      human.health -= 5
      human.health -= 3
      human.health -= 2

      expect(human.health).toBe(initialHealth - 10)
    })

    it('should allow health increase (healing)', () => {
      const human = createHuman(15, 15)
      human.health = 50
      human.health += 20

      expect(human.health).toBe(70)
    })
  })

  describe('Age Advancement', () => {
    it('should initialize with age zero', () => {
      const human = createHuman(15, 15)
      expect(human.age).toBe(0)
    })

    it('should advance age when advanceAge called', () => {
      const human = createHuman(15, 15)
      human.advanceAge()

      expect(human.age).toBe(1)
    })

    it('should accumulate age over multiple advances', () => {
      const human = createHuman(15, 15)

      for (let i = 0; i < 10; i++) {
        human.advanceAge()
      }

      expect(human.age).toBe(10)
    })

    it('should track age independently for different entities', () => {
      const human1 = createHuman(5, 5)
      const human2 = createHuman(10, 10)

      human1.advanceAge()
      human1.advanceAge()
      human2.advanceAge()

      expect(human1.age).toBe(2)
      expect(human2.age).toBe(1)
    })
  })

  describe('Position Management', () => {
    it('should update position', () => {
      const human = createHuman(10, 10)

      human.x = 15
      human.y = 20

      expect(human.x).toBe(15)
      expect(human.y).toBe(20)
    })

    it('should handle boundary positions', () => {
      const human = createHuman(0, 0)
      expect(human.x).toBe(0)
      expect(human.y).toBe(0)

      human.x = 29
      human.y = 29
      expect(human.x).toBe(29)
      expect(human.y).toBe(29)
    })

    it('should allow negative coordinates (unchecked)', () => {
      const human = createHuman(15, 15)
      human.x = -5
      human.y = -3

      expect(human.x).toBe(-5)
      expect(human.y).toBe(-3)
    })

    it('should track position changes over time', () => {
      const human = createHuman(15, 15)
      const positions: Array<[number, number]> = [[15, 15]]

      for (let i = 0; i < 5; i++) {
        human.x = 15 + i
        human.y = 15 + i
        positions.push([human.x, human.y])
      }

      expect(positions.length).toBe(6)
      expect(positions[positions.length - 1]).toEqual([20, 20])
    })
  })

  describe('Entity State Consistency', () => {
    it('should maintain consistent state after multiple operations', () => {
      const human = createHuman(10, 10)
      const initialHealth = human.health

      // Age advancement
      human.advanceAge()
      human.advanceAge()

      // Movement
      human.x = 15
      human.y = 15

      // Damage
      human.health -= 20

      // Verify final state
      expect(human.age).toBe(2)
      expect(human.x).toBe(15)
      expect(human.y).toBe(15)
      expect(human.health).toBe(initialHealth - 20)
    })

    it('should allow state inspection at any time', () => {
      const human = createHuman(5, 5)

      expect(human.x).toBe(5)
      expect(human.y).toBe(5)
      expect(human.age).toBe(0)
      expect(human.health).toBeGreaterThan(0)
      expect(human.type).toBe(EntityType.HUMAN)
    })

    it('should preserve entity reference across operations', () => {
      const human = createHuman(15, 15)
      const reference = human

      human.health = 50
      human.x = 20
      human.advanceAge()

      expect(reference.health).toBe(50)
      expect(reference.x).toBe(20)
      expect(reference.age).toBe(1)
    })
  })

  describe('Entity Type Assignment', () => {
    it('should correctly identify human type', () => {
      const human = createHuman(15, 15)
      expect(human.type).toBe(EntityType.HUMAN)
    })

    it('should correctly identify wolf type', () => {
      const wolf = createWolf(10, 10)
      expect(wolf.type).toBe(EntityType.WOLF)
    })

    it('should correctly identify dog type', () => {
      const dog = createDog(12, 12)
      expect(dog.type).toBe(EntityType.DOG)
    })

    it('should maintain type consistency', () => {
      const human = createHuman(15, 15)
      const originalType = human.type

      // Entity type should not change
      expect(human.type).toBe(originalType)
      expect(human.type).toBe(EntityType.HUMAN)
    })
  })
})
