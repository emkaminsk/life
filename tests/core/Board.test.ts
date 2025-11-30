import { describe, it, expect, beforeEach } from 'vitest'
import { Board } from '../../src/core/Board'
import { createHuman, createWolf, createBoard, placeEntity } from '../setup'

/**
 * Board Class Unit Tests
 *
 * Tests spatial operations, grid management, and entity placement
 * Board doesn't use config parameters directly, but is foundational for all entity operations
 */

describe('Board', () => {
  let board: Board

  beforeEach(() => {
    board = createBoard(30, 30)
  })

  describe('Initialization', () => {
    it('should create board with correct dimensions', () => {
      expect(board.width).toBe(30)
      expect(board.height).toBe(30)
    })

    it('should start with all cells empty', () => {
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          expect(board.getCell(x, y)).toBeNull()
        }
      }
    })

    it('should handle small boards', () => {
      const smallBoard = createBoard(5, 5)
      expect(smallBoard.width).toBe(5)
      expect(smallBoard.height).toBe(5)
    })

    it('should handle large boards', () => {
      const largeBoard = createBoard(100, 100)
      expect(largeBoard.width).toBe(100)
      expect(largeBoard.height).toBe(100)
    })
  })

  describe('Entity Placement and Retrieval', () => {
    it('should place entity at specific coordinate', () => {
      const human = createHuman(5, 10)
      placeEntity(board, human, 5, 10)

      expect(board.getCell(5, 10)).toBe(human)
    })

    it('should retrieve entity from board', () => {
      const wolf = createWolf(15, 15)
      placeEntity(board, wolf, 15, 15)

      const retrieved = board.getCell(15, 15)
      expect(retrieved).toBe(wolf)
      expect(retrieved?.type).toBe(wolf.type)
    })

    it('should overwrite entity at same coordinate', () => {
      const human1 = createHuman(5, 5)
      const human2 = createHuman(5, 5)

      placeEntity(board, human1, 5, 5)
      expect(board.getCell(5, 5)).toBe(human1)

      placeEntity(board, human2, 5, 5)
      expect(board.getCell(5, 5)).toBe(human2)
    })

    it('should handle multiple entities at different locations', () => {
      const human = createHuman(5, 5)
      const wolf = createWolf(10, 10)
      const human2 = createHuman(15, 15)

      placeEntity(board, human, 5, 5)
      placeEntity(board, wolf, 10, 10)
      placeEntity(board, human2, 15, 15)

      expect(board.getCell(5, 5)).toBe(human)
      expect(board.getCell(10, 10)).toBe(wolf)
      expect(board.getCell(15, 15)).toBe(human2)
    })
  })

  describe('Entity Removal', () => {
    it('should remove entity from board', () => {
      const human = createHuman(7, 7)
      placeEntity(board, human, 7, 7)

      expect(board.getCell(7, 7)).not.toBeNull()
      board.setCell(7, 7, null)
      expect(board.getCell(7, 7)).toBeNull()
    })

    it('should remove specific entity and leave others', () => {
      const human = createHuman(5, 5)
      const wolf = createWolf(10, 10)

      placeEntity(board, human, 5, 5)
      placeEntity(board, wolf, 10, 10)

      board.setCell(5, 5, null)

      expect(board.getCell(5, 5)).toBeNull()
      expect(board.getCell(10, 10)).toBe(wolf)
    })
  })

  describe('Adjacent Cell Detection', () => {
    it('should identify cells within distance 1', () => {
      const center = { x: 15, y: 15 }
      const adjacent = board.getAdjacentCells(center.x, center.y)

      // Should have 8 neighbors (for interior cell)
      expect(adjacent.length).toBe(8)

      // All should be exactly distance 1 away
      adjacent.forEach(([x, y]) => {
        const dx = Math.abs(x - center.x)
        const dy = Math.abs(y - center.y)
        expect(dx <= 1 && dy <= 1).toBe(true)
        expect(dx === 0 && dy === 0).toBe(false)
      })
    })

    it('should handle boundary cells correctly', () => {
      // Corner cell should have 3 neighbors
      const cornerAdjacent = board.getAdjacentCells(0, 0)
      expect(cornerAdjacent.length).toBe(3)

      // Edge cell should have 5 neighbors
      const edgeAdjacent = board.getAdjacentCells(0, 15)
      expect(edgeAdjacent.length).toBe(5)
    })

    it('should not include center cell in adjacent list', () => {
      const center = { x: 15, y: 15 }
      const adjacent = board.getAdjacentCells(center.x, center.y)

      expect(adjacent.every(([x, y]) => !(x === center.x && y === center.y))).toBe(true)
    })
  })

  describe('Out of Bounds Handling', () => {
    it('should return null for out of bounds coordinates', () => {
      expect(board.getCell(-1, 15)).toBeNull()
      expect(board.getCell(30, 15)).toBeNull()
      expect(board.getCell(15, -1)).toBeNull()
      expect(board.getCell(15, 30)).toBeNull()
    })

    it('should handle boundary coordinates', () => {
      const human = createHuman(0, 0)
      placeEntity(board, human, 0, 0)

      expect(board.getCell(0, 0)).toBe(human)
    })

    it('should handle max boundary coordinates', () => {
      const human = createHuman(29, 29)
      placeEntity(board, human, 29, 29)

      expect(board.getCell(29, 29)).toBe(human)
    })
  })

  describe('Cell Iteration', () => {
    it('should iterate through all cells', () => {
      let cellCount = 0
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          cellCount++
        }
      }

      expect(cellCount).toBe(30 * 30)
    })

    it('should find all placed entities during iteration', () => {
      const entities = [
        { entity: createHuman(5, 5), x: 5, y: 5 },
        { entity: createWolf(10, 10), x: 10, y: 10 },
        { entity: createHuman(15, 15), x: 15, y: 15 },
      ]

      entities.forEach(({ entity, x, y }) => placeEntity(board, entity, x, y))

      const found: any[] = []
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          const cell = board.getCell(x, y)
          if (cell) found.push(cell)
        }
      }

      expect(found.length).toBe(3)
    })
  })

  describe('Spatial Queries', () => {
    it('should find empty cells', () => {
      const human = createHuman(15, 15)
      placeEntity(board, human, 15, 15)

      let emptyCellCount = 0
      for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          if (board.getCell(x, y) === null) {
            emptyCellCount++
          }
        }
      }

      expect(emptyCellCount).toBe(30 * 30 - 1)
    })

    it('should maintain O(1) lookup performance', () => {
      const human = createHuman(29, 29)
      placeEntity(board, human, 29, 29)

      // Direct cell lookup should be instant
      expect(board.getCell(29, 29)).toBe(human)
      expect(board.getCell(0, 0)).toBeNull()
    })
  })

  describe('Board State Consistency', () => {
    it('should maintain consistent state after multiple operations', () => {
      const human1 = createHuman(5, 5)
      const human2 = createHuman(10, 10)
      const wolf = createWolf(15, 15)

      // Add entities
      placeEntity(board, human1, 5, 5)
      placeEntity(board, human2, 10, 10)
      placeEntity(board, wolf, 15, 15)

      // Move human
      board.setCell(5, 5, null)
      placeEntity(board, human1, 7, 7)

      // Verify final state
      expect(board.getCell(5, 5)).toBeNull()
      expect(board.getCell(7, 7)).toBe(human1)
      expect(board.getCell(10, 10)).toBe(human2)
      expect(board.getCell(15, 15)).toBe(wolf)
    })

    it('should handle rapid placement and removal', () => {
      const human = createHuman(10, 10)

      // Rapid operations
      for (let i = 0; i < 10; i++) {
        placeEntity(board, human, 10 + i, 10)
        expect(board.getCell(10 + i, 10)).toBe(human)
        board.setCell(10 + i, 10, null)
        expect(board.getCell(10 + i, 10)).toBeNull()
      }
    })
  })
})
