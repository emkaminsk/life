import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EatingSystem } from '../../src/systems/EatingSystem'
import { Board } from '../../src/core/Board'
import { Human, Fruit, Mushroom } from '../../src/entities'
import { Sex } from '../../src/types'
import { createConfig, createMockRenderer, createMale, createFemale, createFruit, createMushroom } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * EatingSystem Unit Tests
 *
 * Tests eating-related configuration parameters:
 * - fruit.energyHealed - HP gained from eating fruit
 * - mushroom.energyRemoved - HP lost from eating mushroom
 * - fruit.roundsToRipen - Ripening duration (integration)
 *
 * Verifies these config values are correctly applied in eating resolution
 */

describe('EatingSystem', () => {
  let board: Board
  let system: EatingSystem
  let renderer: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new EatingSystem(renderer)
  })

  describe('Configuration: Fruit Energy Healed', () => {
    it('should initialize with config fruit energy healed', () => {
      const config = DEFAULT_CONFIG
      expect(config.fruit.energyHealed).toBeGreaterThan(0)
      expect(config.fruit.energyHealed).toBe(30)
    })

    it('should apply custom fruit energy healed from config', () => {
      const customHealing = 50
      const config = createConfig({
        fruit: { energyHealed: customHealing }
      })

      const human = createMale(15, 15, config)
      human.health = 50 // Below max health
      const fruit = new Fruit(16, 15, config.fruit.energyHealed)
      fruit.ripeningCounter = 0 // Make ripe

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      const initialHealth = human.health
      system.execute(board)

      // Human should be healed by custom amount
      expect(human.health).toBe(initialHealth + customHealing)
      // Fruit should be removed
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should support various fruit energy healed values', () => {
      const healingValues = [10, 20, 30, 50, 75, 100]

      healingValues.forEach(healing => {
        const config = createConfig({
          fruit: { energyHealed: healing }
        })

        const human = createMale(15, 15, config)
        human.health = 50
        const fruit = new Fruit(16, 15, config.fruit.energyHealed)
        fruit.ripeningCounter = 0

        board.setEntity(15, 15, human)
        board.setEntity(16, 15, fruit)

        const initialHealth = human.health
        system.execute(board)

        // Account for health cap at max health
        const expectedHealth = Math.min(config.human.startingHealth, initialHealth + healing)
        expect(human.health).toBe(expectedHealth)
        expect(board.getEntity(16, 15)).toBeNull()

        // Reset board for next iteration
        board = new Board(30, 30)
      })
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        fruit: { energyHealed: 50 }
      })

      expect(customConfig.fruit.energyHealed).not.toBe(
        defaultConfig.fruit.energyHealed
      )
    })

    it('should cap healing at maximum health', () => {
      const config = createConfig({
        fruit: { energyHealed: 100 }
      })

      const human = createMale(15, 15, config)
      human.health = 90 // Close to max
      const fruit = new Fruit(16, 15, config.fruit.energyHealed)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Health should be capped at starting health (max)
      expect(human.health).toBe(config.human.startingHealth)
      expect(board.getEntity(16, 15)).toBeNull()
    })
  })

  describe('Fruit Eating Mechanics', () => {
    it('should heal human when eating ripe fruit', () => {
      const human = createMale(15, 15)
      human.health = 50
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0 // Ripe

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      const initialHealth = human.health
      system.execute(board)

      expect(human.health).toBe(initialHealth + DEFAULT_CONFIG.fruit.energyHealed)
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should not eat unripe fruit', () => {
      const human = createMale(15, 15)
      human.health = 50
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 2 // Unripe

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      const initialHealth = human.health
      system.execute(board)

      // Health should not change
      expect(human.health).toBe(initialHealth)
      // Fruit should still be on board
      expect(board.getEntity(16, 15)).toBe(fruit)
    })

    it('should only allow humans with health below max to eat fruit', () => {
      const healthyHuman = createMale(15, 15)
      healthyHuman.health = DEFAULT_CONFIG.human.startingHealth // Max health
      const injuredHuman = createMale(17, 15)
      injuredHuman.health = 50 // Below max
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, healthyHuman)
      board.setEntity(17, 15, injuredHuman)
      board.setEntity(16, 15, fruit)

      const healthyInitialHealth = healthyHuman.health
      const injuredInitialHealth = injuredHuman.health

      system.execute(board)

      // Healthy human should not eat (health unchanged)
      expect(healthyHuman.health).toBe(healthyInitialHealth)
      // Injured human should eat and heal
      expect(injuredHuman.health).toBe(injuredInitialHealth + DEFAULT_CONFIG.fruit.energyHealed)
      // Fruit should be removed
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should select random human when multiple eligible humans adjacent', () => {
      const human1 = createMale(15, 15)
      human1.health = 50
      const human2 = createFemale(15, 16)
      human2.health = 60
      const human3 = createMale(16, 16)
      human3.health = 40
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human1)
      board.setEntity(15, 16, human2)
      board.setEntity(16, 16, human3)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Only one human should eat the fruit
      const fruitEaten = board.getEntity(16, 15) === null
      expect(fruitEaten).toBe(true)

      // Count how many humans were healed
      let healedCount = 0
      if (human1.health > 50) healedCount++
      if (human2.health > 60) healedCount++
      if (human3.health > 40) healedCount++

      expect(healedCount).toBe(1)
    })

    it('should handle diagonal adjacency for fruit eating', () => {
      const human = createMale(15, 15)
      human.health = 50
      const fruit = new Fruit(16, 16) // Diagonal
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human)
      board.setEntity(16, 16, fruit)

      const initialHealth = human.health
      system.execute(board)

      expect(human.health).toBe(initialHealth + DEFAULT_CONFIG.fruit.energyHealed)
      expect(board.getEntity(16, 16)).toBeNull()
    })

    it('should not eat fruit when no eligible humans adjacent', () => {
      const human = createMale(15, 15)
      human.health = DEFAULT_CONFIG.human.startingHealth // Max health
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Fruit should remain (no eligible humans)
      expect(board.getEntity(16, 15)).toBe(fruit)
      expect(human.health).toBe(DEFAULT_CONFIG.human.startingHealth)
    })

    it('should process multiple fruits independently', () => {
      const human1 = createMale(15, 15)
      human1.health = 50
      const human2 = createFemale(20, 20)
      human2.health = 60
      const fruit1 = new Fruit(16, 15)
      fruit1.ripeningCounter = 0
      const fruit2 = new Fruit(21, 20)
      fruit2.ripeningCounter = 0

      board.setEntity(15, 15, human1)
      board.setEntity(20, 20, human2)
      board.setEntity(16, 15, fruit1)
      board.setEntity(21, 20, fruit2)

      system.execute(board)

      // Both fruits should be eaten
      expect(board.getEntity(16, 15)).toBeNull()
      expect(board.getEntity(21, 20)).toBeNull()
      // Both humans should be healed
      expect(human1.health).toBe(50 + DEFAULT_CONFIG.fruit.energyHealed)
      expect(human2.health).toBe(60 + DEFAULT_CONFIG.fruit.energyHealed)
    })
  })

  describe('Configuration: Mushroom Energy Removed', () => {
    it('should initialize with config mushroom energy removed', () => {
      const config = DEFAULT_CONFIG
      expect(config.mushroom.energyRemoved).toBeGreaterThan(0)
      expect(config.mushroom.energyRemoved).toBe(40)
    })

    it('should apply custom mushroom energy removed from config', () => {
      const customDamage = 60
      const config = createConfig({
        mushroom: { energyRemoved: customDamage }
      })

      const human = createMale(15, 15, config)
      human.health = 100
      const mushroom = new Mushroom(16, 15, config.mushroom.energyRemoved)

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, mushroom)

      const initialHealth = human.health
      system.execute(board)

      // Human should take custom damage
      expect(human.health).toBe(initialHealth - customDamage)
      // Mushroom should be removed
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should support various mushroom energy removed values', () => {
      const damageValues = [10, 20, 40, 60, 80, 100]

      damageValues.forEach(damage => {
        const config = createConfig({
          mushroom: { energyRemoved: damage }
        })

        const human = createMale(15, 15, config)
        human.health = 100
        const mushroom = new Mushroom(16, 15, config.mushroom.energyRemoved)

        board.setEntity(15, 15, human)
        board.setEntity(16, 15, mushroom)

        const initialHealth = human.health
        system.execute(board)

        expect(human.health).toBe(initialHealth - damage)
        expect(board.getEntity(16, 15)).toBeNull()

        // Reset board for next iteration
        board = new Board(30, 30)
      })
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        mushroom: { energyRemoved: 60 }
      })

      expect(customConfig.mushroom.energyRemoved).not.toBe(
        defaultConfig.mushroom.energyRemoved
      )
    })

    it('should not allow health to go below zero', () => {
      const config = createConfig({
        mushroom: { energyRemoved: 150 }
      })

      const human = createMale(15, 15, config)
      human.health = 50 // Less than damage amount
      const mushroom = new Mushroom(16, 15, config.mushroom.energyRemoved)

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, mushroom)

      system.execute(board)

      // Health should be capped at 0
      expect(human.health).toBe(0)
      expect(board.getEntity(16, 15)).toBeNull()
    })
  })

  describe('Mushroom Eating Mechanics', () => {
    it('should damage human when eating mushroom', () => {
      const human = createMale(15, 15)
      human.health = 100
      const mushroom = new Mushroom(16, 15)

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, mushroom)

      const initialHealth = human.health
      system.execute(board)

      expect(human.health).toBe(initialHealth - DEFAULT_CONFIG.mushroom.energyRemoved)
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should allow any adjacent human to eat mushroom (no health requirement)', () => {
      const healthyHuman = createMale(15, 15)
      healthyHuman.health = DEFAULT_CONFIG.human.startingHealth // Max health
      const mushroom = new Mushroom(16, 15)

      board.setEntity(15, 15, healthyHuman)
      board.setEntity(16, 15, mushroom)

      const initialHealth = healthyHuman.health
      system.execute(board)

      // Healthy human can still eat mushroom and take damage
      expect(healthyHuman.health).toBe(initialHealth - DEFAULT_CONFIG.mushroom.energyRemoved)
      expect(board.getEntity(16, 15)).toBeNull()
    })

    it('should select random human when multiple humans adjacent', () => {
      const human1 = createMale(15, 15)
      human1.health = 100
      const human2 = createFemale(15, 16)
      human2.health = 80
      const human3 = createMale(16, 16)
      human3.health = 90
      const mushroom = new Mushroom(16, 15)

      board.setEntity(15, 15, human1)
      board.setEntity(15, 16, human2)
      board.setEntity(16, 16, human3)
      board.setEntity(16, 15, mushroom)

      system.execute(board)

      // Only one human should eat the mushroom
      const mushroomEaten = board.getEntity(16, 15) === null
      expect(mushroomEaten).toBe(true)

      // Count how many humans took damage
      let damagedCount = 0
      if (human1.health < 100) damagedCount++
      if (human2.health < 80) damagedCount++
      if (human3.health < 90) damagedCount++

      expect(damagedCount).toBe(1)
    })

    it('should handle diagonal adjacency for mushroom eating', () => {
      const human = createMale(15, 15)
      human.health = 100
      const mushroom = new Mushroom(16, 16) // Diagonal

      board.setEntity(15, 15, human)
      board.setEntity(16, 16, mushroom)

      const initialHealth = human.health
      system.execute(board)

      expect(human.health).toBe(initialHealth - DEFAULT_CONFIG.mushroom.energyRemoved)
      expect(board.getEntity(16, 16)).toBeNull()
    })

    it('should process multiple mushrooms independently', () => {
      const human1 = createMale(15, 15)
      human1.health = 100
      const human2 = createFemale(20, 20)
      human2.health = 80
      const mushroom1 = new Mushroom(16, 15)
      const mushroom2 = new Mushroom(21, 20)

      board.setEntity(15, 15, human1)
      board.setEntity(20, 20, human2)
      board.setEntity(16, 15, mushroom1)
      board.setEntity(21, 20, mushroom2)

      const initialHealth1 = human1.health
      const initialHealth2 = human2.health

      system.execute(board)

      // Both mushrooms should be eaten
      expect(board.getEntity(16, 15)).toBeNull()
      expect(board.getEntity(21, 20)).toBeNull()
      // Both humans should take damage
      expect(human1.health).toBe(initialHealth1 - DEFAULT_CONFIG.mushroom.energyRemoved)
      expect(human2.health).toBe(initialHealth2 - DEFAULT_CONFIG.mushroom.energyRemoved)
    })
  })

  describe('Fruit Ripening Integration', () => {
    it('should not eat fruit before ripening period completes', () => {
      const config = createConfig({
        fruit: { roundsToRipen: 3 }
      })

      const human = createMale(15, 15, config)
      human.health = 50
      const fruit = new Fruit(16, 15, config.fruit.energyHealed, config.fruit.roundsToRipen)
      // Fruit is unripe (ripeningCounter = 3)

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Fruit should not be eaten
      expect(board.getEntity(16, 15)).toBe(fruit)
      expect(human.health).toBe(50)
    })

    it('should eat fruit after ripening period completes', () => {
      const config = createConfig({
        fruit: { roundsToRipen: 2 }
      })

      const human = createMale(15, 15, config)
      human.health = 50
      const fruit = new Fruit(16, 15, config.fruit.energyHealed, config.fruit.roundsToRipen)
      fruit.ripeningCounter = 0 // Ripe

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Fruit should be eaten
      expect(board.getEntity(16, 15)).toBeNull()
      expect(human.health).toBe(50 + config.fruit.energyHealed)
    })

    it('should support various ripening periods', () => {
      const ripeningPeriods = [1, 2, 3, 5, 10]

      ripeningPeriods.forEach(period => {
        const config = createConfig({
          fruit: { roundsToRipen: period }
        })

        const fruit = new Fruit(15, 15, config.fruit.energyHealed, config.fruit.roundsToRipen)
        expect(fruit.ripeningCounter).toBe(period)

        // Advance ripening
        for (let i = 0; i < period; i++) {
          fruit.advanceRipening()
        }

        expect(fruit.isRipe()).toBe(true)

        // Reset for next iteration
        board = new Board(30, 30)
      })
    })
  })

  describe('System Integration', () => {
    it('should process fruits and mushrooms in same round', () => {
      const human1 = createMale(15, 15)
      human1.health = 50
      const human2 = createFemale(20, 20)
      human2.health = 100
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0
      const mushroom = new Mushroom(21, 20)

      board.setEntity(15, 15, human1)
      board.setEntity(20, 20, human2)
      board.setEntity(16, 15, fruit)
      board.setEntity(21, 20, mushroom)

      system.execute(board)

      // Both should be processed
      expect(board.getEntity(16, 15)).toBeNull()
      expect(board.getEntity(21, 20)).toBeNull()
      expect(human1.health).toBe(50 + DEFAULT_CONFIG.fruit.energyHealed)
      expect(human2.health).toBe(100 - DEFAULT_CONFIG.mushroom.energyRemoved)
    })

    it('should add visual effects for fruit eating', () => {
      const human = createMale(15, 15)
      human.health = 50
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Should add eating visual effect
      expect(renderer.addVisualEffect).toHaveBeenCalled()
      const effectCall = renderer.addVisualEffect.mock.calls.find(
        (call: any[]) => call[0].type === 'eating'
      )
      expect(effectCall).toBeDefined()
      expect(effectCall[0].x).toBe(16)
      expect(effectCall[0].y).toBe(15)
    })

    it('should add visual effects for mushroom eating', () => {
      const human = createMale(15, 15)
      human.health = 100
      const mushroom = new Mushroom(16, 15)

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, mushroom)

      system.execute(board)

      // Should add combat visual effect (red flash for poisoning)
      expect(renderer.addVisualEffect).toHaveBeenCalled()
      const effectCall = renderer.addVisualEffect.mock.calls.find(
        (call: any[]) => call[0].type === 'combat'
      )
      expect(effectCall).toBeDefined()
      expect(effectCall[0].x).toBe(16)
      expect(effectCall[0].y).toBe(15)
    })

    it('should mark dirty cells for rendering', () => {
      const human = createMale(15, 15)
      human.health = 50
      const fruit = new Fruit(16, 15)
      fruit.ripeningCounter = 0

      board.setEntity(15, 15, human)
      board.setEntity(16, 15, fruit)

      system.execute(board)

      // Should mark fruit cell and human cell as dirty
      expect(renderer.markDirty).toHaveBeenCalledWith(16, 15) // Fruit location
      expect(renderer.markDirty).toHaveBeenCalledWith(15, 15) // Human location
    })
  })

  describe('Differential Config Behavior Tests', () => {
    it('should heal different amounts based on fruit config', () => {
      // Test that different fruit.energyHealed values produce different outcomes
      const lowHealConfig = createConfig({ fruit: { energyHealed: 10 } })
      const highHealConfig = createConfig({ fruit: { energyHealed: 50 } })

      // Low heal test
      let board1 = new Board(30, 30)
      let system1 = new EatingSystem(renderer)
      const human1 = createMale(15, 15, lowHealConfig)
      human1.health = 50
      const fruit1 = new Fruit(16, 15, lowHealConfig.fruit.energyHealed)
      board1.setEntity(15, 15, human1)
      board1.setEntity(16, 15, fruit1)
      system1.execute(board1)

      const healthAfterLowHeal = human1.health

      // High heal test
      let board2 = new Board(30, 30)
      let system2 = new EatingSystem(renderer)
      const human2 = createMale(15, 15, highHealConfig)
      human2.health = 50
      const fruit2 = new Fruit(16, 15, highHealConfig.fruit.energyHealed)
      board2.setEntity(15, 15, human2)
      board2.setEntity(16, 15, fruit2)
      system2.execute(board2)

      const healthAfterHighHeal = human2.health

      // Verify that config change produces measurable behavioral difference
      expect(healthAfterHighHeal).toBeGreaterThan(healthAfterLowHeal)
      expect(healthAfterHighHeal - 50).toBe(50) // High config: +50 healing
      expect(healthAfterLowHeal - 50).toBe(10) // Low config: +10 healing
    })

    it('should damage different amounts based on mushroom config', () => {
      // Test that different mushroom.energyRemoved values produce different outcomes
      const lowDamageConfig = createConfig({ mushroom: { energyRemoved: 10 } })
      const highDamageConfig = createConfig({ mushroom: { energyRemoved: 60 } })

      // Low damage test
      let board1 = new Board(30, 30)
      let system1 = new EatingSystem(renderer)
      const human1 = createMale(15, 15, lowDamageConfig)
      human1.health = 100
      const mushroom1 = new Mushroom(16, 15, lowDamageConfig.mushroom.energyRemoved)
      board1.setEntity(15, 15, human1)
      board1.setEntity(16, 15, mushroom1)
      system1.execute(board1)

      const healthAfterLowDamage = human1.health

      // High damage test
      let board2 = new Board(30, 30)
      let system2 = new EatingSystem(renderer)
      const human2 = createMale(15, 15, highDamageConfig)
      human2.health = 100
      const mushroom2 = new Mushroom(16, 15, highDamageConfig.mushroom.energyRemoved)
      board2.setEntity(15, 15, human2)
      board2.setEntity(16, 15, mushroom2)
      system2.execute(board2)

      const healthAfterHighDamage = human2.health

      // Verify that config change produces measurable behavioral difference
      expect(healthAfterLowDamage).toBeGreaterThan(healthAfterHighDamage)
      expect(100 - healthAfterLowDamage).toBe(10) // Low config: -10 damage
      expect(100 - healthAfterHighDamage).toBe(60) // High config: -60 damage
    })
  })
})

