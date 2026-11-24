import { describe, it, expect, beforeEach } from 'vitest'
import { Board } from '../../src/core/Board'
import { Wolf } from '../../src/entities'
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
          expect(board.getEntity(x, y)).toBeNull()
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

      expect(board.getEntity(5, 10)).toBe(human)
    })

    it('should retrieve entity from board', () => {
      const wolf = createWolf(15, 15)
      placeEntity(board, wolf, 15, 15)

      const retrieved = board.getEntity(15, 15)
      expect(retrieved).toBe(wolf)
      expect(retrieved?.type).toBe(wolf.type)
    })

    it('should overwrite entity at same coordinate', () => {
      const human1 = createHuman(5, 5)
      const human2 = createHuman(5, 5)

      placeEntity(board, human1, 5, 5)
      expect(board.getEntity(5, 5)).toBe(human1)

      placeEntity(board, human2, 5, 5)
      expect(board.getEntity(5, 5)).toBe(human2)
    })

    it('should handle multiple entities at different locations', () => {
      const human = createHuman(5, 5)
      const wolf = createWolf(10, 10)
      const human2 = createHuman(15, 15)

      placeEntity(board, human, 5, 5)
      placeEntity(board, wolf, 10, 10)
      placeEntity(board, human2, 15, 15)

      expect(board.getEntity(5, 5)).toBe(human)
      expect(board.getEntity(10, 10)).toBe(wolf)
      expect(board.getEntity(15, 15)).toBe(human2)
    })
  })

  describe('Entity Removal', () => {
    it('should remove entity from board', () => {
      const human = createHuman(7, 7)
      placeEntity(board, human, 7, 7)

      expect(board.getEntity(7, 7)).not.toBeNull()
      board.setEntity(7, 7, null)
      expect(board.getEntity(7, 7)).toBeNull()
    })

    it('should remove specific entity and leave others', () => {
      const human = createHuman(5, 5)
      const wolf = createWolf(10, 10)

      placeEntity(board, human, 5, 5)
      placeEntity(board, wolf, 10, 10)

      board.setEntity(5, 5, null)

      expect(board.getEntity(5, 5)).toBeNull()
      expect(board.getEntity(10, 10)).toBe(wolf)
    })
  })

  describe('Adjacent Cell Detection', () => {
    it('should identify cells within distance 1', () => {
      const center = { x: 15, y: 15 }
      const adjacent = board.getAdjacentPositions(center.x, center.y)

      // Should have 8 neighbors (for interior cell)
      expect(adjacent.length).toBe(8)

      // All should be exactly distance 1 away
      adjacent.forEach((pos) => {
        const dx = Math.abs(pos.x - center.x)
        const dy = Math.abs(pos.y - center.y)
        expect(dx <= 1 && dy <= 1).toBe(true)
        expect(dx === 0 && dy === 0).toBe(false)
      })
    })

    it('should handle boundary cells correctly', () => {
      // Corner cell should have 3 neighbors
      const cornerAdjacent = board.getAdjacentPositions(0, 0)
      expect(cornerAdjacent.length).toBe(3)

      // Edge cell should have 5 neighbors
      const edgeAdjacent = board.getAdjacentPositions(0, 15)
      expect(edgeAdjacent.length).toBe(5)
    })

    it('should not include center cell in adjacent list', () => {
      const center = { x: 15, y: 15 }
      const adjacent = board.getAdjacentPositions(center.x, center.y)

      expect(adjacent.every((pos) => !(pos.x === center.x && pos.y === center.y))).toBe(true)
    })
  })

  describe('Out of Bounds Handling', () => {
    it('should return null for out of bounds coordinates', () => {
      expect(board.getEntity(-1, 15)).toBeNull()
      expect(board.getEntity(30, 15)).toBeNull()
      expect(board.getEntity(15, -1)).toBeNull()
      expect(board.getEntity(15, 30)).toBeNull()
    })

    it('should handle boundary coordinates', () => {
      const human = createHuman(0, 0)
      placeEntity(board, human, 0, 0)

      expect(board.getEntity(0, 0)).toBe(human)
    })

    it('should handle max boundary coordinates', () => {
      const human = createHuman(29, 29)
      placeEntity(board, human, 29, 29)

      expect(board.getEntity(29, 29)).toBe(human)
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
          const cell = board.getEntity(x, y)
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
          if (board.getEntity(x, y) === null) {
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
      expect(board.getEntity(29, 29)).toBe(human)
      expect(board.getEntity(0, 0)).toBeNull()
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
      board.setEntity(5, 5, null)
      placeEntity(board, human1, 7, 7)

      // Verify final state
      expect(board.getEntity(5, 5)).toBeNull()
      expect(board.getEntity(7, 7)).toBe(human1)
      expect(board.getEntity(10, 10)).toBe(human2)
      expect(board.getEntity(15, 15)).toBe(wolf)
    })

    it('should handle rapid placement and removal', () => {
      const human = createHuman(10, 10)

      // Rapid operations
      for (let i = 0; i < 10; i++) {
        placeEntity(board, human, 10 + i, 10)
        expect(board.getEntity(10 + i, 10)).toBe(human)
        board.setEntity(10 + i, 10, null)
        expect(board.getEntity(10 + i, 10)).toBeNull()
      }
    })
  })
})

describe('Board (guards and geometry)', () => {
  it('resize changes dimensions, clears entities and resets the round', () => {
    const board = new Board(5, 5)
    board.setEntity(1, 1, new Wolf(1, 1))
    board.incrementRound()
    board.resize(8, 3)
    expect([board.width, board.height, board.round]).toEqual([8, 3, 0])
    expect(board.getAllEntities()).toHaveLength(0)
    expect(board.isInBounds(7, 2)).toBe(true)
    expect(board.isInBounds(7, 3)).toBe(false)
    board.setEntity(7, 2, new Wolf(7, 2))
    expect(board.getEntity(7, 2)).toBeInstanceOf(Wolf)
  })

  it('moveEntity refuses out-of-bounds, empty-source and occupied-target moves', () => {
    const board = new Board(3, 3)
    const a = new Wolf(0, 0)
    const b = new Wolf(1, 0)
    board.setEntity(0, 0, a)
    board.setEntity(1, 0, b)
    expect(board.moveEntity(0, 0, -1, 0)).toBe(false)
    expect(board.moveEntity(0, 0, 1, 0)).toBe(false)
    expect(board.moveEntity(2, 2, 2, 1)).toBe(false)
    expect(board.getEntity(0, 0)).toBe(a)
    expect(board.moveEntity(0, 0, 0, 1)).toBe(true)
    expect(board.getEntity(0, 0)).toBeNull()
    expect(board.getEntity(0, 1)).toBe(a)
    expect([a.x, a.y]).toEqual([0, 1])
  })

  it('setEntity outside the board is ignored and syncs entity coordinates inside', () => {
    const board = new Board(3, 3)
    const w = new Wolf(9, 9)
    board.setEntity(5, 5, w)
    expect(board.getAllEntities()).toHaveLength(0)
    board.setEntity(2, 1, w)
    expect([w.x, w.y]).toEqual([2, 1])
  })

  it('adjacency has 3 neighbours in corners, 5 on edges, 8 inside', () => {
    const board = new Board(4, 4)
    expect(board.getAdjacentPositions(0, 0)).toHaveLength(3)
    expect(board.getAdjacentPositions(3, 3)).toHaveLength(3)
    expect(board.getAdjacentPositions(0, 2)).toHaveLength(5)
    expect(board.getAdjacentPositions(2, 0)).toHaveLength(5)
    expect(board.getAdjacentPositions(1, 1)).toHaveLength(8)
  })

  it('getEmptyAdjacentPositions excludes occupied cells', () => {
    const board = new Board(3, 3)
    board.setEntity(1, 0, new Wolf(1, 0))
    const empty = board.getEmptyAdjacentPositions(0, 0)
    expect(empty).toEqual([{ x: 0, y: 1 }, { x: 1, y: 1 }])
  })
})
