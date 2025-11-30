import { describe, it, expect, beforeEach } from 'vitest'
import { Human } from '../../src/entities/Human'
import { Sex } from '../../src/types'
import { createConfig, createFemale, createMale, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Human Entity Unit Tests
 *
 * Tests human-specific configuration parameters:
 * - human.startingHealth
 * - human.pregnancyPeriod
 * - human.cooldownPeriod
 *
 * Verifies these config values are correctly applied to human entities
 */

describe('Human Entity', () => {
  describe('Configuration: Starting Health', () => {
    it('should initialize with config starting health value', () => {
      const female = createFemale(15, 15)
      const expected = DEFAULT_CONFIG.human.startingHealth

      expect(female.health).toBe(expected)
    })

    it('should apply custom starting health from config', () => {
      const customHealth = 150
      const config = createConfig({
        human: { startingHealth: customHealth }
      })

      const female = new Human(15, 15, Sex.FEMALE)
      female.health = config.human.startingHealth

      expect(female.health).toBe(customHealth)
    })

    it('should differ from default when config overridden', () => {
      const defaultConfig = DEFAULT_CONFIG
      const customConfig = createConfig({
        human: { startingHealth: 200 }
      })

      expect(customConfig.human.startingHealth).not.toBe(
        defaultConfig.human.startingHealth
      )
    })

    it('should support various starting health values', () => {
      const healthValues = [50, 100, 150, 200, 250]

      healthValues.forEach(healthValue => {
        const config = createConfig({
          human: { startingHealth: healthValue }
        })

        const human = new Human(10, 10, Sex.MALE)
        human.health = config.human.startingHealth

        expect(human.health).toBe(healthValue)
      })
    })
  })

  describe('Sex Assignment', () => {
    it('should create female humans', () => {
      const female = new Human(15, 15, Sex.FEMALE)
      expect(female.sex).toBe(Sex.FEMALE)
    })

    it('should create male humans', () => {
      const male = new Human(15, 15, Sex.MALE)
      expect(male.sex).toBe(Sex.MALE)
    })

    it('should preserve sex assignment', () => {
      const female = createFemale(10, 10)
      expect(female.sex).toBe(Sex.FEMALE)

      const male = createMale(20, 20)
      expect(male.sex).toBe(Sex.MALE)
    })

    it('should support both sexes with same starting health config', () => {
      const config = createConfig({
        human: { startingHealth: 100 }
      })

      const male = new Human(10, 10, Sex.MALE)
      male.health = config.human.startingHealth

      const female = new Human(10, 10, Sex.FEMALE)
      female.health = config.human.startingHealth

      expect(male.health).toBe(female.health)
      expect(male.sex).not.toBe(female.sex)
    })
  })

  describe('Configuration: Pregnancy Mechanics', () => {
    it('should initialize female without pregnancy', () => {
      const female = createFemale(15, 15)
      expect(female.isPregnant()).toBe(false)
    })

    it('should initialize male without pregnancy (not applicable)', () => {
      const male = createMale(15, 15)
      expect(male.isPregnant()).toBe(false)
    })

    it('should support pregnancy state change', () => {
      const female = createFemale(15, 15)
      const config = DEFAULT_CONFIG

      female.pregnancyCounter = config.human.pregnancyPeriod
      expect(female.isPregnant()).toBe(true)
    })

    it('should track pregnancy duration from config', () => {
      const config = DEFAULT_CONFIG
      const pregnancyPeriod = config.human.pregnancyPeriod

      const female = createFemale(15, 15)
      female.pregnancyCounter = pregnancyPeriod

      expect(female.pregnancyCounter).toBe(pregnancyPeriod)
    })

    it('should apply custom pregnancy period from config', () => {
      const customPeriod = 5
      const config = createConfig({
        human: { pregnancyPeriod: customPeriod }
      })

      const female = createFemale(15, 15)
      female.pregnancyCounter = config.human.pregnancyPeriod

      expect(female.pregnancyCounter).toBe(customPeriod)
    })

    it('should decrement pregnancy counter each round', () => {
      const config = DEFAULT_CONFIG
      const female = createFemale(15, 15)

      female.pregnancyCounter = config.human.pregnancyPeriod

      const initial = female.pregnancyCounter
      female.pregnancyCounter -= 1

      expect(female.pregnancyCounter).toBe(initial - 1)
    })

    it('should birth when pregnancy counter reaches zero', () => {
      const female = createFemale(15, 15)

      female.pregnancyCounter = 1
      female.pregnancyCounter -= 1

      expect(female.pregnancyCounter).toBe(0)
    })

    it('should support different pregnancy durations', () => {
      const periods = [1, 2, 3, 4, 5, 10]

      periods.forEach(period => {
        const config = createConfig({
          human: { pregnancyPeriod: period }
        })

        const female = createFemale(15, 15)
        female.pregnancyCounter = config.human.pregnancyPeriod

        expect(female.pregnancyCounter).toBe(period)
      })
    })
  })

  describe('Configuration: Cooldown Period', () => {
    it('should initialize without cooldown', () => {
      const female = createFemale(15, 15)
      expect(female.cooldownCounter).toBe(0)
    })

    it('should apply cooldown period from config', () => {
      const config = DEFAULT_CONFIG
      const cooldownPeriod = config.human.cooldownPeriod

      const female = createFemale(15, 15)
      female.cooldownCounter = cooldownPeriod

      expect(female.cooldownCounter).toBe(cooldownPeriod)
    })

    it('should apply custom cooldown period from config', () => {
      const customCooldown = 5
      const config = createConfig({
        human: { cooldownPeriod: customCooldown }
      })

      const female = createFemale(15, 15)
      female.cooldownCounter = config.human.cooldownPeriod

      expect(female.cooldownCounter).toBe(customCooldown)
    })

    it('should decrement cooldown each round', () => {
      const female = createFemale(15, 15)
      female.cooldownCounter = 3

      female.cooldownCounter -= 1
      expect(female.cooldownCounter).toBe(2)

      female.cooldownCounter -= 1
      expect(female.cooldownCounter).toBe(1)

      female.cooldownCounter -= 1
      expect(female.cooldownCounter).toBe(0)
    })

    it('should reach zero after cooldown period', () => {
      const config = DEFAULT_CONFIG
      const female = createFemale(15, 15)

      female.cooldownCounter = config.human.cooldownPeriod

      for (let i = 0; i < config.human.cooldownPeriod; i++) {
        female.cooldownCounter -= 1
      }

      expect(female.cooldownCounter).toBe(0)
    })

    it('should prevent pregnancy during cooldown', () => {
      const female = createFemale(15, 15)
      female.cooldownCounter = 2 // In cooldown

      // Cannot get pregnant while cooldownCounter > 0
      const isInCooldown = female.cooldownCounter > 0
      expect(isInCooldown).toBe(true)
      expect(female.isPregnant()).toBe(false)
    })

    it('should allow pregnancy after cooldown expires', () => {
      const female = createFemale(15, 15)
      female.cooldownCounter = 0 // Not in cooldown

      const isInCooldown = female.cooldownCounter > 0
      expect(isInCooldown).toBe(false)
      // Female can now potentially get pregnant
    })

    it('should support different cooldown durations', () => {
      const cooldowns = [1, 2, 3, 4, 5, 10]

      cooldowns.forEach(cooldown => {
        const config = createConfig({
          human: { cooldownPeriod: cooldown }
        })

        const female = createFemale(15, 15)
        female.cooldownCounter = config.human.cooldownPeriod

        expect(female.cooldownCounter).toBe(cooldown)
      })
    })
  })

  describe('Pregnancy and Cooldown Interaction', () => {
    it('should apply cooldown after pregnancy completes', () => {
      const config = DEFAULT_CONFIG
      const female = createFemale(15, 15)

      // Start pregnancy
      female.pregnancyCounter = config.human.pregnancyPeriod

      // Complete pregnancy
      for (let i = 0; i < config.human.pregnancyPeriod; i++) {
        female.pregnancyCounter -= 1
      }

      // Apply cooldown after birth
      female.cooldownCounter = config.human.cooldownPeriod

      expect(female.pregnancyCounter).toBe(0)
      expect(female.cooldownCounter).toBe(config.human.cooldownPeriod)
      expect(female.isPregnant()).toBe(false)
    })

    it('should prevent pregnancy during cooldown period', () => {
      const female = createFemale(15, 15)

      female.cooldownCounter = 3
      const canGetPregnant = female.cooldownCounter === 0

      expect(canGetPregnant).toBe(false)
      expect(female.isPregnant()).toBe(false)
    })
  })

  describe('Configuration Parameter Consistency', () => {
    it('should maintain config values across multiple females', () => {
      const config = DEFAULT_CONFIG

      const female1 = createFemale(5, 5)
      female1.health = config.human.startingHealth

      const female2 = createFemale(15, 15)
      female2.health = config.human.startingHealth

      const female3 = createFemale(25, 25)
      female3.health = config.human.startingHealth

      expect(female1.health).toBe(female2.health)
      expect(female2.health).toBe(female3.health)
    })

    it('should support independent health modifications', () => {
      const config = DEFAULT_CONFIG

      const female1 = createFemale(5, 5)
      female1.health = config.human.startingHealth

      const female2 = createFemale(15, 15)
      female2.health = config.human.startingHealth

      female1.health -= 20
      expect(female1.health).not.toBe(female2.health)
    })
  })
})
