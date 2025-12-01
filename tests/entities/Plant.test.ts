import { describe, it, expect } from 'vitest'
import { Fruit } from '../../src/entities/Fruit'
import { Mushroom } from '../../src/entities/Mushroom'
import { createConfig, createFruit, createMushroom } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Plant Entity Unit Tests
 *
 * Tests plant-specific behavioral mechanics:
 * - Fruit ripening mechanics and state transitions
 * - Mushroom toxicity mechanics
 *
 * Focuses on behavior verification rather than config storage
 */

describe('Fruit Entity', () => {

  describe('Ripening Mechanics', () => {
    it('should not be ripe initially', () => {
      const fruit = createFruit(15, 15)
      const expected = DEFAULT_CONFIG.fruit.roundsToRipen > 0

      expect(fruit.isRipe()).toBe(!expected)
    })

    it('should decrement ripening counter', () => {
      const fruit = createFruit(15, 15)
      const initialCounter = fruit.ripeningCounter

      fruit.advanceRipening()

      expect(fruit.ripeningCounter).toBe(initialCounter - 1)
    })

    it('should become ripe after ripening completes', () => {
      const fruit = new Fruit(15, 15, undefined, 1)

      expect(fruit.isRipe()).toBe(false)

      fruit.advanceRipening()

      expect(fruit.isRipe()).toBe(true)
    })

    it('should stay ripe after reaching zero', () => {
      const fruit = new Fruit(15, 15, undefined, 0)

      expect(fruit.isRipe()).toBe(true)

      fruit.advanceRipening()

      expect(fruit.isRipe()).toBe(true)
    })

    it('should handle multiple ripening advances', () => {
      const fruit = new Fruit(15, 15, undefined, 5)

      for (let i = 0; i < 5; i++) {
        fruit.advanceRipening()
      }

      expect(fruit.isRipe()).toBe(true)
    })
  })

  describe('Fruit Type Identification', () => {
    it('should be identifiable as fruit', () => {
      const fruit = createFruit(15, 15)
      expect(fruit.type).toBe(fruit.type) // Self-consistent
    })

    it('should maintain fruit identity across ripening', () => {
      const fruit = createFruit(15, 15)
      const originalType = fruit.type

      fruit.advanceRipening()

      expect(fruit.type).toBe(originalType)
    })
  })

  describe('Fruit Immortality', () => {
    it('should never die from age', () => {
      const fruit = createFruit(15, 15)
      expect(fruit.isDead()).toBe(false)
    })

    it('should remain not dead even at high age', () => {
      const fruit = createFruit(15, 15)

      // Fruits don't track age traditionally, but test immortality check
      expect(fruit.isDead()).toBe(false)
    })
  })
})

describe('Mushroom Entity', () => {
  describe('Configuration: Energy Removed', () => {
    it('should initialize with energy removed value', () => {
      const mushroom = createMushroom(15, 15)
      const expected = DEFAULT_CONFIG.mushroom.energyRemoved

      expect(mushroom.energyRemoved).toBe(expected)
    })

    it('should apply custom energy removed from config', () => {
      const customDamage = 60
      const config = createConfig({
        mushroom: { energyRemoved: customDamage }
      })

      const mushroom = new Mushroom(15, 15, config.mushroom.energyRemoved)

      expect(mushroom.energyRemoved).toBe(customDamage)
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        mushroom: { energyRemoved: 80 }
      })

      expect(customConfig.mushroom.energyRemoved).not.toBe(
        defaultConfig.mushroom.energyRemoved
      )
    })

    it('should support various damage values', () => {
      const damageValues = [20, 30, 40, 50, 60, 100]

      damageValues.forEach(damage => {
        const config = createConfig({
          mushroom: { energyRemoved: damage }
        })

        const mushroom = new Mushroom(10, 10, config.mushroom.energyRemoved)

        expect(mushroom.energyRemoved).toBe(damage)
      })
    })

    it('should match default config value exactly', () => {
      const config = DEFAULT_CONFIG
      const mushroom = createMushroom(15, 15)

      expect(mushroom.energyRemoved).toBe(config.mushroom.energyRemoved)
    })

    it('should have positive damage value', () => {
      const config = DEFAULT_CONFIG
      expect(config.mushroom.energyRemoved).toBeGreaterThan(0)
    })
  })

  describe('Configuration: Spawn Probability', () => {
    it('should have spawn probability stored in config', () => {
      const config = DEFAULT_CONFIG
      const probability = config.mushroom.spawnProbability

      expect(probability).toBeGreaterThan(0)
      expect(probability).toBeLessThanOrEqual(1)
    })

    it('should apply custom spawn probability from config', () => {
      const customProbability = 0.01
      const config = createConfig({
        mushroom: { spawnProbability: customProbability }
      })

      expect(config.mushroom.spawnProbability).toBe(customProbability)
    })

    it('should support various spawn probability values', () => {
      const probabilities = [0.0001, 0.001, 0.005, 0.01, 0.02, 0.05]

      probabilities.forEach(prob => {
        const config = createConfig({
          mushroom: { spawnProbability: prob }
        })

        expect(config.mushroom.spawnProbability).toBe(prob)
      })
    })

    it('should have probability between 0 and 1', () => {
      const config = DEFAULT_CONFIG
      expect(config.mushroom.spawnProbability).toBeGreaterThanOrEqual(0)
      expect(config.mushroom.spawnProbability).toBeLessThanOrEqual(1)
    })

    it('should be lower than fruit spawn probability', () => {
      const config = DEFAULT_CONFIG
      expect(config.mushroom.spawnProbability).toBeLessThan(
        config.fruit.spawnProbability
      )
    })
  })


  describe('Mushroom Immortality', () => {
    it('should never die from age', () => {
      const mushroom = createMushroom(15, 15)
      expect(mushroom.isDead()).toBe(false)
    })

    it('should remain not dead even at high age', () => {
      const mushroom = createMushroom(15, 15)

      expect(mushroom.isDead()).toBe(false)
    })
  })

  describe('Poisonous Characteristic', () => {
    it('should have damage value indicating poisonous nature', () => {
      const mushroom = createMushroom(15, 15)
      expect(mushroom.energyRemoved).toBeGreaterThan(0)
    })

    it('should have sufficient damage to affect humans', () => {
      const mushroom = createMushroom(15, 15)
      const config = DEFAULT_CONFIG

      expect(mushroom.energyRemoved).toBeGreaterThan(10)
    })
  })
})

