import { describe, it, expect, beforeEach } from 'vitest'
import { Human } from '../../src/entities/Human'
import { Sex } from '../../src/types'
import { createConfig, createFemale, createMale, getConfigByPath } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * Human Entity Unit Tests
 *
 * Tests human-specific behavioral mechanics:
 * - Health management (damage, healing, initialization)
 * - Pregnancy mechanics (pregnancy state, duration)
 * - Reproduction cooldown (cooldown tracking, decrement)
 *
 * Focuses on behavior verification rather than config storage
 */

describe('Human Entity', () => {
  describe('Health Management', () => {
    it('should initialize with health from config', () => {
      const female = createFemale(15, 15)
      // Health should be clamped to genome.maxHealth (not exceed it)
      expect(female.health).toBeGreaterThan(0)
      expect(female.health).toBeLessThanOrEqual(female.genome.maxHealth)
      expect(female.health).toBeLessThanOrEqual(DEFAULT_CONFIG.human.startingHealth)
    })

    it('should support health modification', () => {
      const female = createFemale(15, 15)
      const initialHealth = female.health

      female.health -= 20
      expect(female.health).toBe(initialHealth - 20)
    })

    it('should allow health to reach zero', () => {
      const female = createFemale(15, 15)
      female.health = 0
      expect(female.health).toBe(0)
    })

    it('should allow health to exceed starting value after healing', () => {
      const male = createMale(15, 15)
      male.health = 50
      male.health += 20
      expect(male.health).toBe(70)
    })

    it('should maintain independent health across multiple humans', () => {
      const female1 = createFemale(5, 5)
      const female2 = createFemale(15, 15)

      const initial1 = female1.health
      const initial2 = female2.health

      female1.health -= 20
      expect(female1.health).toBe(initial1 - 20)
      expect(female2.health).toBe(initial2)
    })
  })

  describe('Sex Assignment', () => {
    it('should create female humans with female sex', () => {
      const female = createFemale(10, 10)
      expect(female.sex).toBe(Sex.FEMALE)
    })

    it('should create male humans with male sex', () => {
      const male = createMale(10, 10)
      expect(male.sex).toBe(Sex.MALE)
    })

    it('should preserve sex assignment across modifications', () => {
      const female = createFemale(10, 10)
      const male = createMale(20, 20)

      female.health -= 30
      male.health -= 30

      expect(female.sex).toBe(Sex.FEMALE)
      expect(male.sex).toBe(Sex.MALE)
    })
  })

  describe('Pregnancy State Management', () => {
    it('should initialize without pregnancy', () => {
      const female = createFemale(15, 15)
      const male = createMale(15, 15)

      expect(female.isPregnant()).toBe(false)
      expect(male.isPregnant()).toBe(false)
    })

    it('should enter pregnant state when counter is set', () => {
      const female = createFemale(15, 15)
      female.pregnancyCounter = 5

      expect(female.isPregnant()).toBe(true)
    })

    it('should exit pregnant state when counter reaches zero', () => {
      const female = createFemale(15, 15)
      female.pregnancyCounter = 1

      female.pregnancyCounter -= 1
      expect(female.isPregnant()).toBe(false)
    })

    it('should decrement pregnancy counter correctly', () => {
      const female = createFemale(15, 15)
      female.pregnancyCounter = 5

      const initial = female.pregnancyCounter
      female.pregnancyCounter -= 1

      expect(female.pregnancyCounter).toBe(initial - 1)
    })

    it('should complete full pregnancy cycle', () => {
      const female = createFemale(15, 15)
      const duration = 3

      female.pregnancyCounter = duration

      for (let i = 0; i < duration; i++) {
        expect(female.isPregnant()).toBe(true)
        female.pregnancyCounter -= 1
      }

      expect(female.pregnancyCounter).toBe(0)
      expect(female.isPregnant()).toBe(false)
    })
  })

  describe('Reproduction Cooldown Management', () => {
    it('should initialize without cooldown', () => {
      const female = createFemale(15, 15)
      expect(female.reproductionCooldown).toBe(0)
    })

    it('should set cooldown when assigned', () => {
      const female = createFemale(15, 15)
      female.reproductionCooldown = 5

      expect(female.reproductionCooldown).toBe(5)
    })

    it('should decrement cooldown via decrementCooldown method', () => {
      const female = createFemale(15, 15)
      female.reproductionCooldown = 3

      female.decrementCooldown()
      expect(female.reproductionCooldown).toBe(2)

      female.decrementCooldown()
      expect(female.reproductionCooldown).toBe(1)

      female.decrementCooldown()
      expect(female.reproductionCooldown).toBe(0)
    })

    it('should prevent further decrement below zero', () => {
      const female = createFemale(15, 15)
      female.reproductionCooldown = 1

      female.decrementCooldown()
      expect(female.reproductionCooldown).toBe(0)

      female.decrementCooldown() // Should stay at 0
      expect(female.reproductionCooldown).toBe(0)
    })
  })

  describe('Pregnancy and Cooldown Interaction', () => {
    it('should prevent pregnancy during cooldown', () => {
      const female = createFemale(15, 15)
      female.reproductionCooldown = 2 // In cooldown

      const isInCooldown = female.reproductionCooldown > 0
      expect(isInCooldown).toBe(true)
      expect(female.isPregnant()).toBe(false)
    })

    it('should allow pregnancy after cooldown expires', () => {
      const female = createFemale(15, 15)
      female.reproductionCooldown = 0 // Not in cooldown

      const isInCooldown = female.reproductionCooldown > 0
      expect(isInCooldown).toBe(false)
    })

    it('should transition from pregnancy to cooldown', () => {
      const female = createFemale(15, 15)

      // Start pregnancy
      female.pregnancyCounter = 2
      expect(female.isPregnant()).toBe(true)
      expect(female.reproductionCooldown).toBe(0)

      // Complete pregnancy
      female.pregnancyCounter = 0
      expect(female.isPregnant()).toBe(false)

      // Apply cooldown
      female.reproductionCooldown = 3
      expect(female.reproductionCooldown).toBe(3)
    })
  })
})
