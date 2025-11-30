import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config'
import type { GameConfig } from '../src/ui/ConfigPanel'
import { Board } from '../src/core/Board'
import { Human, Wolf, Dog, Fruit, Mushroom } from '../src/entities'
import { EntityType, Sex } from '../src/types'

/**
 * Test utilities and factory functions for consistent test setup
 */

/**
 * Create a shallow copy of config with optional parameter overrides
 * Useful for testing how parameter changes affect behavior
 */
export function createConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  const config = structuredClone(DEFAULT_CONFIG)

  // Apply overrides while preserving nested structure
  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.assign((config as any)[key], value)
    } else {
      (config as any)[key] = value
    }
  })

  return config
}

/**
 * Create a test board with specified dimensions
 */
export function createBoard(width: number = 30, height: number = 30): Board {
  return new Board(width, height)
}

/**
 * Create a test board with default dimensions
 */
export function createDefaultBoard(): Board {
  return createBoard(DEFAULT_CONFIG.board.width, DEFAULT_CONFIG.board.height)
}

/**
 * Factory for creating test humans
 */
export function createHuman(
  x: number = 15,
  y: number = 15,
  sex: Sex = Sex.MALE,
  config: GameConfig = DEFAULT_CONFIG
): Human {
  const human = new Human(x, y, sex)
  human.health = config.human.startingHealth
  return human
}

/**
 * Factory for creating test females
 */
export function createFemale(
  x: number = 15,
  y: number = 15,
  config: GameConfig = DEFAULT_CONFIG
): Human {
  return createHuman(x, y, Sex.FEMALE, config)
}

/**
 * Factory for creating test males
 */
export function createMale(
  x: number = 15,
  y: number = 15,
  config: GameConfig = DEFAULT_CONFIG
): Human {
  return createHuman(x, y, Sex.MALE, config)
}

/**
 * Factory for creating test wolves
 */
export function createWolf(
  x: number = 10,
  y: number = 10,
  config: GameConfig = DEFAULT_CONFIG
): Wolf {
  const wolf = new Wolf(x, y)
  wolf.health = config.wolf.startingHealth
  return wolf
}

/**
 * Factory for creating test dogs
 */
export function createDog(
  x: number = 12,
  y: number = 12,
  config: GameConfig = DEFAULT_CONFIG
): Dog {
  const dog = new Dog(x, y)
  dog.health = config.dog.startingHealth
  return dog
}

/**
 * Factory for creating test fruits
 */
export function createFruit(
  x: number = 20,
  y: number = 20,
  isRipe: boolean = false
): Fruit {
  const fruit = new Fruit(x, y)
  if (isRipe) {
    fruit.ripeningCounter = 0
  }
  return fruit
}

/**
 * Factory for creating test mushrooms
 */
export function createMushroom(
  x: number = 18,
  y: number = 18
): Mushroom {
  return new Mushroom(x, y)
}

/**
 * Place an entity on the board at a specific location
 */
export function placeEntity(board: Board, entity: any, x: number, y: number): void {
  entity.x = x
  entity.y = y
  board.setCell(x, y, entity)
}

/**
 * Place multiple entities on board at specified coordinates
 */
export function placeEntities(
  board: Board,
  entities: Array<{ entity: any; x: number; y: number }>
): void {
  entities.forEach(({ entity, x, y }) => {
    placeEntity(board, entity, x, y)
  })
}

/**
 * Count entities of a specific type on the board
 */
export function countEntities(board: Board, type: EntityType): number {
  let count = 0
  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y < board.height; y++) {
      const entity = board.getCell(x, y)
      if (entity && entity.type === type) {
        count++
      }
    }
  }
  return count
}

/**
 * Get all entities of a specific type from the board
 */
export function getEntitiesByType(board: Board, type: EntityType): any[] {
  const entities: any[] = []
  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y < board.height; y++) {
      const entity = board.getCell(x, y)
      if (entity && entity.type === type) {
        entities.push(entity)
      }
    }
  }
  return entities
}

/**
 * Get all entities from the board
 */
export function getAllEntities(board: Board): any[] {
  const entities: any[] = []
  for (let x = 0; x < board.width; x++) {
    for (let y = 0; y < board.height; y++) {
      const entity = board.getCell(x, y)
      if (entity) {
        entities.push(entity)
      }
    }
  }
  return entities
}

/**
 * Create a seeded random number generator for reproducible tests
 * Note: This is a simple implementation; production code should use the actual Random class
 */
export function createSeededRandom(seed: number) {
  let m_w = seed
  let m_z = 987654321
  const mask = 0xffffffff

  return {
    next(): number {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask
      let result = (((m_z << 16) + (m_w & 65535)) >>> 0) / 4294967296
      return result
    }
  }
}

/**
 * Assert that an entity is adjacent to another
 */
export function assertAdjacent(entity1: any, entity2: any): boolean {
  const dx = Math.abs(entity1.x - entity2.x)
  const dy = Math.abs(entity1.y - entity2.y)
  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)
}

/**
 * Calculate distance between two entities
 */
export function getDistance(entity1: any, entity2: any): number {
  const dx = entity1.x - entity2.x
  const dy = entity1.y - entity2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Create a mock Renderer that does nothing (avoids canvas dependency in tests)
 */
export function createMockRenderer() {
  return {
    render: vi.fn(),
    addVisualEffect: vi.fn(),
    markDirty: vi.fn(),
    getEntityEmoji: vi.fn((entity) => '🔲'),
    getEmojiBitmap: vi.fn((emoji) => null),
  }
}

/**
 * Verify parameter value propagated from config to entity
 * Generic utility for testing config → entity state mapping
 */
export function assertParameterPropagation<T extends Record<string, any>>(
  config: T,
  entity: any,
  configPath: string,
  entityProperty: string
): void {
  const configValue = configPath.split('.').reduce((obj, key) => obj?.[key], config)
  const entityValue = entity[entityProperty]
  expect(entityValue).toBe(configValue)
}

/**
 * Verify that a configuration parameter affects simulation behavior
 * Used in integration tests to confirm parameter → outcome mapping
 */
export function getConfigByPath(config: GameConfig, path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], config)
}

export { describe, it, expect, beforeEach, vi }
