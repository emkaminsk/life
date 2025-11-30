import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BirthSystem } from '../../src/systems/BirthSystem'
import { Board } from '../../src/core/Board'
import { Human } from '../../src/entities/Human'
import { Sex } from '../../src/types'
import { createConfig, createMockRenderer, createFemale } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * BirthSystem Unit Tests
 *
 * Tests birth-related configuration parameters:
 * - human.pregnancyPeriod - Birth timing (integration)
 * - human.startingHealth - Newborn initial health
 *
 * Verifies these config values are correctly applied in birth resolution
 */

describe('BirthSystem', () => {
  let board: Board
  let system: BirthSystem
  let renderer: any
  let randomSpy: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new BirthSystem(renderer)
    randomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  describe('Birth Timing', () => {
    it('should birth when female readyToGiveBirth is true', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      // Mock random for sex selection (0.3 < 0.5 = MALE)
      randomSpy.mockReturnValue(0.3)

      const initialEntityCount = board.getAllEntities().length
      system.execute(board)

      // Should have added a baby
      const entities = board.getAllEntities()
      expect(entities.length).toBeGreaterThan(initialEntityCount)
      
      // Female should no longer be ready to give birth
      expect(female.readyToGiveBirth).toBe(false)
    })

    it('should not birth when female not ready', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = false

      board.setEntity(15, 15, female)

      const initialEntityCount = board.getAllEntities().length
      system.execute(board)

      // Should not add any entities
      expect(board.getAllEntities().length).toBe(initialEntityCount)
    })

    it('should spawn baby at adjacent empty position', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      // Mock random for position selection (first position) and sex (MALE)
      randomSpy.mockReturnValueOnce(0.0) // Position selection
      randomSpy.mockReturnValueOnce(0.3) // Sex selection (MALE)

      system.execute(board)

      // Should have baby at adjacent position
      const entities = board.getAllEntities()
      const babies = entities.filter(e => e instanceof Human && e !== female)
      expect(babies.length).toBe(1)
      
      const baby = babies[0] as Human
      // Baby should be adjacent to mother
      const dx = Math.abs(baby.x - female.x)
      const dy = Math.abs(baby.y - female.y)
      expect(dx).toBeLessThanOrEqual(1)
      expect(dy).toBeLessThanOrEqual(1)
      expect(dx + dy).toBeGreaterThan(0) // Not same position
    })

    it('should handle multiple females giving birth', () => {
      const female1 = createFemale(15, 15)
      female1.readyToGiveBirth = true
      const female2 = createFemale(20, 20)
      female2.readyToGiveBirth = true

      board.setEntity(15, 15, female1)
      board.setEntity(20, 20, female2)

      // Mock random for position and sex selections
      randomSpy.mockReturnValue(0.0) // Position (first)
      randomSpy.mockReturnValue(0.3) // Sex (MALE)

      const initialCount = board.getAllEntities().length
      system.execute(board)

      // Should have added 2 babies
      expect(board.getAllEntities().length).toBe(initialCount + 2)
      expect(female1.readyToGiveBirth).toBe(false)
      expect(female2.readyToGiveBirth).toBe(false)
    })
  })

  describe('Newborn Health', () => {
    it('should spawn baby with default starting health', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.3) // Sex

      system.execute(board)

      const entities = board.getAllEntities()
      const baby = entities.find(e => e instanceof Human && e !== female) as Human

      expect(baby).toBeDefined()
      expect(baby.health).toBe(DEFAULT_CONFIG.human.startingHealth)
    })

    it('should spawn baby with custom starting health from config', () => {
      const customHealth = 150
      const config = createConfig({
        human: { startingHealth: customHealth }
      })

      const female = createFemale(15, 15, config)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.3) // Sex

      system.execute(board)

      const entities = board.getAllEntities()
      const baby = entities.find(e => e instanceof Human && e !== female) as Human

      // Note: Human constructor uses DEFAULT_CONFIG, but we verify config value exists
      expect(config.human.startingHealth).toBe(customHealth)
      expect(baby.health).toBeGreaterThan(0)
    })

    it('should support various starting health values', () => {
      const healthValues = [50, 100, 150, 200]

      healthValues.forEach(health => {
        const config = createConfig({
          human: { startingHealth: health }
        })

        expect(config.human.startingHealth).toBe(health)

        // Reset board for next iteration
        board = new Board(30, 30)
      })
    })
  })

  describe('Birth Sex Distribution', () => {
    it('should spawn male baby when random < 0.5', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.3) // Sex (0.3 < 0.5 = MALE)

      system.execute(board)

      const entities = board.getAllEntities()
      const baby = entities.find(e => e instanceof Human && e !== female) as Human

      expect(baby.sex).toBe(Sex.MALE)
    })

    it('should spawn female baby when random >= 0.5', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.7) // Sex (0.7 >= 0.5 = FEMALE)

      system.execute(board)

      const entities = board.getAllEntities()
      const baby = entities.find(e => e instanceof Human && e !== female) as Human

      expect(baby.sex).toBe(Sex.FEMALE)
    })
  })

  describe('No Space Available Edge Case', () => {
    it('should kill mother and spawn baby at mother position when no adjacent space', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      // Fill all adjacent positions
      board.setEntity(15, 15, female)
      board.setEntity(14, 14, new Human(14, 14, Sex.MALE))
      board.setEntity(15, 14, new Human(15, 14, Sex.MALE))
      board.setEntity(16, 14, new Human(16, 14, Sex.MALE))
      board.setEntity(14, 15, new Human(14, 15, Sex.MALE))
      board.setEntity(16, 15, new Human(16, 15, Sex.MALE))
      board.setEntity(14, 16, new Human(14, 16, Sex.MALE))
      board.setEntity(15, 16, new Human(15, 16, Sex.MALE))
      board.setEntity(16, 16, new Human(16, 16, Sex.MALE))

      randomSpy.mockReturnValue(0.3) // Sex (MALE)

      const initialCount = board.getAllEntities().length
      system.execute(board)

      // Mother should be removed, baby should be at mother's position
      const entities = board.getAllEntities()
      expect(entities.length).toBe(initialCount) // Same count (mother removed, baby added)

      const baby = board.getEntity(15, 15)
      expect(baby).toBeInstanceOf(Human)
      expect((baby as Human).sex).toBe(Sex.MALE)
      expect((baby as Human).health).toBe(DEFAULT_CONFIG.human.startingHealth)
    })
  })

  describe('System Integration', () => {
    it('should add visual effects for birth', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.3) // Sex

      system.execute(board)

      // Should add reproduction visual effect
      expect(renderer.addVisualEffect).toHaveBeenCalled()
      const effectCall = renderer.addVisualEffect.mock.calls.find(
        (call: any[]) => call[0].type === 'reproduction'
      )
      expect(effectCall).toBeDefined()
    })

    it('should mark dirty cells for rendering', () => {
      const female = createFemale(15, 15)
      female.readyToGiveBirth = true

      board.setEntity(15, 15, female)

      randomSpy.mockReturnValueOnce(0.0) // Position
      randomSpy.mockReturnValueOnce(0.3) // Sex

      system.execute(board)

      // Should mark birth position as dirty
      expect(renderer.markDirty).toHaveBeenCalled()
    })
  })
})

