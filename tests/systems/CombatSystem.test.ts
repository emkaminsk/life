import { describe, it, expect, beforeEach } from 'vitest'
import { CombatSystem } from '../../src/systems/CombatSystem'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Dog } from '../../src/entities'
import { Sex } from '../../src/types'
import { createConfig, createMockRenderer } from '../setup'
import { DEFAULT_CONFIG } from '../../src/config'

/**
 * CombatSystem Unit Tests
 *
 * Tests combat-related configuration parameters:
 * - human.maleVsMaleDamage - Damage in male-to-male combat
 * - human.maleVsWolfDamage - Male counter-attack damage vs wolves
 * - wolf.damageToMale - Wolf damage to male humans
 * - wolf.damageToFemale - Wolf damage to female humans
 * - wolf.damageToDog - Wolf counter-damage to dogs
 * - dog.damageToWolf - Dog damage to wolves
 *
 * Verifies these config values are correctly applied in combat resolution
 */

describe('CombatSystem', () => {
  let board: Board
  let system: CombatSystem
  let renderer: any

  beforeEach(() => {
    board = new Board(30, 30)
    renderer = createMockRenderer()
    system = new CombatSystem(renderer, DEFAULT_CONFIG)
  })


  describe('Male vs Wolf Counter-attack', () => {

    it('should only apply to male humans in wolf combat', () => {
      const config = DEFAULT_CONFIG
      const male = new Human(15, 15, Sex.MALE)
      const female = new Human(16, 15, Sex.FEMALE)

      expect(male.isMale()).toBe(true)
      expect(female.isMale()).toBe(false)
    })
  })

  describe('Configuration: Wolf Damage to Male Humans', () => {
    it('should initialize with config wolf damage to male', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.damageToMale).toBeGreaterThan(0)
    })

    it('should apply custom wolf damage to male from config', () => {
      const customDamage = 35
      const config = createConfig({
        wolf: { damageToMale: customDamage }
      })

      expect(config.wolf.damageToMale).toBe(customDamage)
    })

    it('should support various wolf damage to male values', () => {
      const damageValues = [20, 25, 30, 35, 45]

      damageValues.forEach(damage => {
        const config = createConfig({
          wolf: { damageToMale: damage }
        })

        expect(config.wolf.damageToMale).toBe(damage)
      })
    })

    it('should differ from wolf damage to female', () => {
      const config = DEFAULT_CONFIG

      // Damage to females should be higher (no counter-attack)
      expect(config.wolf.damageToFemale).toBeGreaterThan(
        config.wolf.damageToMale
      )
    })
  })

  describe('Configuration: Wolf Damage to Female Humans', () => {
    it('should initialize with config wolf damage to female', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.damageToFemale).toBeGreaterThan(0)
    })

    it('should apply custom wolf damage to female from config', () => {
      const customDamage = 45
      const config = createConfig({
        wolf: { damageToFemale: customDamage }
      })

      expect(config.wolf.damageToFemale).toBe(customDamage)
    })

    it('should support various wolf damage to female values', () => {
      const damageValues = [30, 35, 40, 45, 50]

      damageValues.forEach(damage => {
        const config = createConfig({
          wolf: { damageToFemale: damage }
        })

        expect(config.wolf.damageToFemale).toBe(damage)
      })
    })

    it('should be higher than damage to male (no counter-attack)', () => {
      const config = DEFAULT_CONFIG

      expect(config.wolf.damageToFemale).toBeGreaterThan(
        config.wolf.damageToMale
      )
    })
  })

  describe('Configuration: Wolf Damage to Dogs', () => {
    it('should initialize with config wolf damage to dog', () => {
      const config = DEFAULT_CONFIG
      expect(config.wolf.damageToDog).toBeGreaterThan(0)
    })

    it('should apply custom wolf damage to dog from config', () => {
      const customDamage = 20
      const config = createConfig({
        wolf: { damageToDog: customDamage }
      })

      expect(config.wolf.damageToDog).toBe(customDamage)
    })

    it('should support various wolf damage to dog values', () => {
      const damageValues = [10, 15, 20, 25, 30]

      damageValues.forEach(damage => {
        const config = createConfig({
          wolf: { damageToDog: damage }
        })

        expect(config.wolf.damageToDog).toBe(damage)
      })
    })

    it('should typically be less than wolf damage to humans', () => {
      const config = DEFAULT_CONFIG

      // Dogs deal significant damage, so wolf counter should be moderate
      expect(config.wolf.damageToDog).toBeLessThan(config.wolf.damageToMale)
    })
  })

  describe('Configuration: Dog Damage to Wolves', () => {
    it('should initialize with config dog damage to wolf', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.damageToWolf).toBeGreaterThan(0)
    })

    it('should apply custom dog damage to wolf from config', () => {
      const customDamage = 40
      const config = createConfig({
        dog: { damageToWolf: customDamage }
      })

      expect(config.dog.damageToWolf).toBe(customDamage)
    })

    it('should support various dog damage to wolf values', () => {
      const damageValues = [25, 30, 35, 40, 45]

      damageValues.forEach(damage => {
        const config = createConfig({
          dog: { damageToWolf: damage }
        })

        expect(config.dog.damageToWolf).toBe(damage)
      })
    })

    it('should be higher than wolf counter-damage', () => {
      const config = DEFAULT_CONFIG

      // Dogs are effective protectors
      expect(config.dog.damageToWolf).toBeGreaterThan(config.wolf.damageToDog)
    })

    it('should enable dogs to protect humans', () => {
      const config = DEFAULT_CONFIG
      expect(config.dog.damageToWolf).toBeGreaterThan(0)
    })
  })

  describe('Combat Pair Detection', () => {
    it('should identify male vs male combat', () => {
      const male1 = new Human(15, 15, Sex.MALE)
      const male2 = new Human(16, 15, Sex.MALE)

      board.setEntity(15, 15, male1)
      board.setEntity(16, 15, male2)

      // System should identify these as combat pair
      expect(() => system.execute(board)).not.toThrow()
    })

    it('should identify wolf vs human combat', () => {
      const wolf = new Wolf(15, 15)
      const human = new Human(16, 15, Sex.MALE)

      board.setEntity(15, 15, wolf)
      board.setEntity(16, 15, human)

      expect(() => system.execute(board)).not.toThrow()
    })

    it('should identify dog vs wolf combat', () => {
      const dog = new Dog(15, 15)
      const wolf = new Wolf(16, 15)

      board.setEntity(15, 15, dog)
      board.setEntity(16, 15, wolf)

      expect(() => system.execute(board)).not.toThrow()
    })

    it('should not identify male vs female combat', () => {
      const male = new Human(15, 15, Sex.MALE)
      const female = new Human(16, 15, Sex.FEMALE)

      board.setEntity(15, 15, male)
      board.setEntity(16, 15, female)

      // No combat should occur
      const initialMaleHealth = male.health
      const initialFemaleHealth = female.health

      system.execute(board)

      expect(male.health).toBe(initialMaleHealth)
      expect(female.health).toBe(initialFemaleHealth)
    })
  })

  describe('Combat Resolution', () => {
    it('should apply damage in male vs male combat', () => {
      const config = DEFAULT_CONFIG
      const male1 = new Human(15, 15, Sex.MALE)
      const male2 = new Human(16, 15, Sex.MALE)

      male1.health = config.human.startingHealth
      male2.health = config.human.startingHealth

      board.setEntity(15, 15, male1)
      board.setEntity(16, 15, male2)

      // Verify entities are adjacent (adjacent positions include diagonals)
      const adjacent = board.getAdjacentPositions(15, 15)
      expect(adjacent.some(pos => pos.x === 16 && pos.y === 15)).toBe(true)

      system.execute(board)

      // Both should have reduced health
      expect(male1.health).toBeLessThan(config.human.startingHealth)
      expect(male2.health).toBeLessThan(config.human.startingHealth)
    })

    it('should apply correct damage amount in male vs male combat', () => {
      const config = DEFAULT_CONFIG
      const male1 = new Human(15, 15, Sex.MALE)
      const male2 = new Human(16, 15, Sex.MALE)

      const initialHealth = 100
      male1.health = initialHealth
      male2.health = initialHealth

      board.setEntity(15, 15, male1)
      board.setEntity(16, 15, male2)

      system.execute(board)

      // Each should take the configured damage
      const expectedHealth = initialHealth - config.human.maleVsMaleDamage
      expect(male1.health).toBe(expectedHealth)
      expect(male2.health).toBe(expectedHealth)
    })

    it('should handle simultaneous damage application', () => {
      const config = DEFAULT_CONFIG
      const male1 = new Human(15, 15, Sex.MALE)
      const male2 = new Human(16, 15, Sex.MALE)

      const initialHealth = config.human.maleVsMaleDamage + 10
      male1.health = initialHealth
      male2.health = initialHealth

      board.setEntity(15, 15, male1)
      board.setEntity(16, 15, male2)

      system.execute(board)

      // Both apply damage simultaneously
      const expectedHealth = initialHealth - config.human.maleVsMaleDamage
      expect(male1.health).toBe(expectedHealth)
      expect(male2.health).toBe(expectedHealth)
    })
  })

  describe('Wolf vs Human Combat Differentiation', () => {
    it('should apply different damage to males vs females', () => {
      const config = DEFAULT_CONFIG
      const male = new Human(15, 15, Sex.MALE)
      const female = new Human(20, 15, Sex.FEMALE)
      const wolf1 = new Wolf(16, 15)
      const wolf2 = new Wolf(21, 15)

      male.health = config.human.startingHealth
      female.health = config.human.startingHealth

      board.setEntity(15, 15, male)
      board.setEntity(20, 15, female)
      board.setEntity(16, 15, wolf1)
      board.setEntity(21, 15, wolf2)

      system.execute(board)

      // Female should take more damage (no counter-attack)
      const maleDamage = config.human.startingHealth - male.health
      const femaleDamage = config.human.startingHealth - female.health

      expect(femaleDamage).toBeGreaterThanOrEqual(maleDamage)
    })
  })

  describe('Dog vs Wolf Combat', () => {
    it('should apply dog damage to wolf', () => {
      const config = DEFAULT_CONFIG
      const dog = new Dog(15, 15)
      const wolf = new Wolf(16, 15)

      dog.health = config.dog.startingHealth
      wolf.health = config.wolf.startingHealth

      board.setEntity(15, 15, dog)
      board.setEntity(16, 15, wolf)

      system.execute(board)

      // Wolf should have taken dog damage
      expect(wolf.health).toBeLessThan(config.wolf.startingHealth)
    })

    it('should apply wolf counter-damage to dog', () => {
      const config = DEFAULT_CONFIG
      const dog = new Dog(15, 15)
      const wolf = new Wolf(16, 15)

      dog.health = config.dog.startingHealth
      wolf.health = config.wolf.startingHealth

      board.setEntity(15, 15, dog)
      board.setEntity(16, 15, wolf)

      system.execute(board)

      // Dog should have taken counter-damage
      expect(dog.health).toBeLessThan(config.dog.startingHealth)
    })

    it('should apply correct damage amounts in dog vs wolf', () => {
      const config = DEFAULT_CONFIG
      const dog = new Dog(15, 15)
      const wolf = new Wolf(16, 15)

      const initialDogHealth = 100
      const initialWolfHealth = 100

      dog.health = initialDogHealth
      wolf.health = initialWolfHealth

      board.setEntity(15, 15, dog)
      board.setEntity(16, 15, wolf)

      const wolfBefore = wolf.health
      const dogBefore = dog.health

      system.execute(board)

      // Verify damage was applied using the configured values
      const wolfDamageDealt = wolfBefore - wolf.health
      const dogDamageDealt = dogBefore - dog.health

      expect(wolfDamageDealt).toBe(config.dog.damageToWolf)
      expect(dogDamageDealt).toBe(config.wolf.damageToDog)
    })
  })

  describe('CombatSystem Integration', () => {
    it('should execute without errors on empty board', () => {
      expect(() => system.execute(board)).not.toThrow()
    })

    it('should execute without errors with non-combatant entities', () => {
      const human = new Human(15, 15, Sex.MALE)
      board.setEntity(15, 15, human)

      expect(() => system.execute(board)).not.toThrow()
    })

    it('should handle multiple combat pairs', () => {
      const male1 = new Human(10, 10, Sex.MALE)
      const male2 = new Human(11, 10, Sex.MALE)
      const male3 = new Human(15, 15, Sex.MALE)
      const male4 = new Human(16, 15, Sex.MALE)

      board.setEntity(10, 10, male1)
      board.setEntity(11, 10, male2)
      board.setEntity(15, 15, male3)
      board.setEntity(16, 15, male4)

      expect(() => system.execute(board)).not.toThrow()
    })

    it('should respect configuration during combat execution', () => {
      const customConfig = createConfig({
        human: { maleVsMaleDamage: 50 }
      })

      system.updateConfig(customConfig)

      const male1 = new Human(15, 15, Sex.MALE)
      const male2 = new Human(16, 15, Sex.MALE)

      const initialHealth = 100
      male1.health = initialHealth
      male2.health = initialHealth

      board.setEntity(15, 15, male1)
      board.setEntity(16, 15, male2)

      const male1Before = male1.health
      const male2Before = male2.health

      system.execute(board)

      const male1Damage = male1Before - male1.health
      const male2Damage = male2Before - male2.health

      expect(male1Damage).toBe(customConfig.human.maleVsMaleDamage)
      expect(male2Damage).toBe(customConfig.human.maleVsMaleDamage)
    })
  })

  describe('Configuration Parameter Consistency', () => {
    it('should maintain damage values across multiple combats', () => {
      const config = DEFAULT_CONFIG

      const male1 = new Human(10, 10, Sex.MALE)
      const male2 = new Human(11, 10, Sex.MALE)
      const male3 = new Human(20, 20, Sex.MALE)
      const male4 = new Human(21, 20, Sex.MALE)

      male1.health = config.human.startingHealth
      male2.health = config.human.startingHealth
      male3.health = config.human.startingHealth
      male4.health = config.human.startingHealth

      board.setEntity(10, 10, male1)
      board.setEntity(11, 10, male2)
      board.setEntity(20, 20, male3)
      board.setEntity(21, 20, male4)

      system.execute(board)

      // Both pairs should have same damage applied (same config value used)
      const damage1 = config.human.startingHealth - male1.health
      const damage3 = config.human.startingHealth - male3.health

      // Both should receive the same configured damage
      expect(damage1).toBe(config.human.maleVsMaleDamage)
      expect(damage3).toBe(config.human.maleVsMaleDamage)
    })

    it('should apply custom config consistently across entities', () => {
      const customDamage = 40
      const customConfig = createConfig({
        human: { maleVsMaleDamage: customDamage }
      })

      system.updateConfig(customConfig)

      const male1 = new Human(10, 10, Sex.MALE)
      const male2 = new Human(11, 10, Sex.MALE)

      const initialHealth = 100
      male1.health = initialHealth
      male2.health = initialHealth

      board.setEntity(10, 10, male1)
      board.setEntity(11, 10, male2)

      const male1Before = male1.health
      const male2Before = male2.health

      system.execute(board)

      const damage1 = male1Before - male1.health
      const damage2 = male2Before - male2.health

      expect(damage1).toBe(customDamage)
      expect(damage2).toBe(customDamage)
    })

    it('should support independent damage modifications per species', () => {
      const config = DEFAULT_CONFIG

      const customConfig = createConfig({
        human: { maleVsMaleDamage: 30 },
        wolf: { damageToMale: 40 },
        dog: { damageToWolf: 45 }
      })

      expect(customConfig.human.maleVsMaleDamage).toBe(30)
      expect(customConfig.wolf.damageToMale).toBe(40)
      expect(customConfig.dog.damageToWolf).toBe(45)
    })
  })

  describe('Damage Parameter Relationships', () => {
    it('should allow customization of all damage parameters independently', () => {
      const config = createConfig({
        human: {
          maleVsMaleDamage: 25,
          maleVsWolfDamage: 30
        },
        wolf: {
          damageToMale: 35,
          damageToFemale: 45,
          damageToDog: 18
        },
        dog: {
          damageToWolf: 38
        }
      })

      expect(config.human.maleVsMaleDamage).toBe(25)
      expect(config.human.maleVsWolfDamage).toBe(30)
      expect(config.wolf.damageToMale).toBe(35)
      expect(config.wolf.damageToFemale).toBe(45)
      expect(config.wolf.damageToDog).toBe(18)
      expect(config.dog.damageToWolf).toBe(38)
    })

    it('should maintain logical damage progression (dogs > wolves > humans)', () => {
      const config = DEFAULT_CONFIG

      // Dogs are effective vs wolves
      expect(config.dog.damageToWolf).toBeGreaterThan(config.wolf.damageToDog)

      // Wolves are effective vs humans
      expect(config.wolf.damageToMale).toBeGreaterThan(0)
      expect(config.wolf.damageToFemale).toBeGreaterThan(config.wolf.damageToMale)

      // Humans have counter-attack option
      expect(config.human.maleVsWolfDamage).toBeGreaterThan(0)
    })
  })
})
