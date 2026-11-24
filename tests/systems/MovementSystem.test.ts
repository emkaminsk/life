import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MovementSystem } from '../../src/systems/MovementSystem'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities'
import { Sex } from '../../src/types'
import type { GameConfig } from '../../src/ui/ConfigPanel'
import { Random } from '../../src/utils/Random'
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup'

/**
 * MovementSystem behaviour tests (Phase 1).
 *
 * Random draws go through Random → Math.random, so tests pin behaviour either by
 * stubbing Math.random with a constant (0 → first candidate, 0.99 → last candidate,
 * any value < 1 passes a probability-1 check) or by seeding Random.
 */

function calmHuman(x: number, y: number, sex: Sex = Sex.MALE): Human {
  const human = new Human(x, y, sex)
  human.genome = { maxHealth: 100, strength: 1, metabolism: 0, greed: 0, caution: 0 }
  human.maxHealth = 100
  human.health = 100
  return human
}

describe('MovementSystem', () => {
  let board: Board
  let renderer: ReturnType<typeof createMockRenderer>
  let system: MovementSystem

  const config = (overrides: ConfigOverrides = {}): GameConfig => createConfig(overrides)

  beforeEach(() => {
    board = new Board(15, 15)
    renderer = createMockRenderer()
    system = new MovementSystem(renderer)
  })

  function place<T extends Human | Wolf | Dog | Fruit | Mushroom>(entity: T): T {
    board.setEntity(entity.x, entity.y, entity)
    return entity
  }

  describe('wolves chase humans', () => {
    it('moves to the adjacent cell closest to a human in range when the probability check passes', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const wolf = place(new Wolf(5, 5))
      place(calmHuman(8, 5))

      const moves = system.execute(board, config({ wolf: { moveTowardHumanProbability: 1, perceptionRange: 7 } }))

      expect(moves).toHaveLength(2) // wolf + human
      expect([wolf.x, wolf.y]).toEqual([6, 5])
      expect(board.getEntity(6, 5)).toBe(wolf)
      expect(board.getEntity(5, 5)).not.toBe(wolf)
    })

    it('targets the TRUE nearest human, not the first one in scan order', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const wolf = place(new Wolf(5, 5))
      // Earlier in row-major scan order but further away (distance 5)
      const far = place(calmHuman(5, 0))
      // Later in scan order but nearer (distance 4)
      const near = place(calmHuman(8, 6))
      // Stop the humans from wandering into the way
      far.health = 0
      near.health = 0

      system.execute(board, config({ wolf: { moveTowardHumanProbability: 1, perceptionRange: 7 } }))

      expect([wolf.x, wolf.y]).toEqual([6, 6])
    })

    it('breaks ties between equally near humans randomly (both reachable)', () => {
      const destinations = new Set<string>()
      for (const r of [0, 0.99]) {
        board = new Board(15, 15)
        vi.spyOn(Math, 'random').mockReturnValue(r)
        const wolf = place(new Wolf(5, 5))
        place(calmHuman(5, 2)).health = 0 // distance 3, dead so it stays put
        place(calmHuman(5, 8)).health = 0 // distance 3
        system.execute(board, config({ wolf: { moveTowardHumanProbability: 1, perceptionRange: 7 } }))
        destinations.add(`${wolf.x},${wolf.y}`)
      }
      expect(destinations).toEqual(new Set(['5,4', '5,6']))
    })

    it('does not chase a human outside the configured perception range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const wolf = place(new Wolf(5, 5))
      place(calmHuman(8, 5)).health = 0 // distance 3

      system.execute(board, config({ wolf: { moveTowardHumanProbability: 1, perceptionRange: 2 } }))

      // Random move: 0.99 picks the last adjacent cell (6,6), not the chase cell (6,5)
      expect([wolf.x, wolf.y]).toEqual([6, 6])
    })

    it('perception 1 means only adjacent humans are seen', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const wolf = place(new Wolf(5, 5))
      place(calmHuman(7, 5)).health = 0 // distance 2

      system.execute(board, config({ wolf: { moveTowardHumanProbability: 1, perceptionRange: 1 } }))

      expect([wolf.x, wolf.y]).toEqual([6, 6]) // random, not toward (6,5)
    })

    it('moveTowardHumanProbability 0 never chases, 1 always chases (seeded, 100 trials)', () => {
      const run = (probability: number): number => {
        let toward = 0
        Random.seed(42)
        for (let i = 0; i < 100; i++) {
          board = new Board(15, 15)
          const wolf = place(new Wolf(5, 5))
          place(calmHuman(9, 5)).health = 0
          system.execute(board, config({ wolf: { moveTowardHumanProbability: probability, perceptionRange: 7 } }))
          if (wolf.x === 6 && wolf.y === 5) toward++
        }
        return toward
      }
      expect(run(1)).toBe(100)
      // Random moves hit (6,5) about 1/8 of the time
      expect(run(0)).toBeLessThan(40)
    })
  })

  describe('dogs chase wolves', () => {
    it('moves toward the nearest wolf using dog config', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const dog = place(new Dog(5, 5))
      const wolf = place(new Wolf(5, 9))
      wolf.health = 0 // keep it still

      system.execute(board, config({ dog: { moveTowardWolfProbability: 1, perceptionRange: 6 } }))

      expect([dog.x, dog.y]).toEqual([5, 6])
    })

    it('ignores wolves outside dog perception range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const dog = place(new Dog(5, 5))
      place(new Wolf(5, 9)).health = 0

      system.execute(board, config({ dog: { moveTowardWolfProbability: 1, perceptionRange: 3 } }))

      // Random with 0 → first adjacent cell (4,4)
      expect([dog.x, dog.y]).toEqual([4, 4])
    })

    it('does not chase humans', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const dog = place(new Dog(5, 5))
      place(calmHuman(5, 8)).health = 0

      system.execute(board, config({ dog: { moveTowardWolfProbability: 1 } }))

      expect([dog.x, dog.y]).toEqual([4, 4])
    })
  })

  describe('humans', () => {
    it('seek the nearest ripe fruit when the greed gene check passes', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const human = place(calmHuman(5, 5))
      human.genome.greed = 1
      const fruit = place(new Fruit(8, 5))
      fruit.ripeningCounter = 0

      system.execute(board, config({ human: { perceptionRange: 5 } }))

      expect([human.x, human.y]).toEqual([6, 5])
    })

    it('use the configured perception range for fruit (not the default)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const human = place(calmHuman(5, 5))
      human.genome.greed = 1
      place(new Fruit(8, 5)).ripeningCounter = 0

      system.execute(board, config({ human: { perceptionRange: 2 } }))

      expect([human.x, human.y]).toEqual([6, 6]) // random move
    })

    it('ignore unripe fruit', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const human = place(calmHuman(5, 5))
      human.genome.greed = 1
      place(new Fruit(8, 5, 30, 3))

      system.execute(board, config())

      expect([human.x, human.y]).toEqual([6, 6])
    })

    it('with greed 0 never seek fruit (seeded)', () => {
      Random.seed(7)
      let toward = 0
      for (let i = 0; i < 100; i++) {
        board = new Board(15, 15)
        const human = place(calmHuman(5, 5))
        place(new Fruit(9, 5)).ripeningCounter = 0
        system.execute(board, config())
        if (human.x === 6 && human.y === 5) toward++
      }
      expect(toward).toBeLessThan(40)
    })

    it('flee from a wolf (caution gene) choosing randomly among the furthest cells', () => {
      const destinations = new Set<string>()
      for (const r of [0, 0.99]) {
        board = new Board(15, 15)
        vi.spyOn(Math, 'random').mockReturnValue(r)
        const human = place(calmHuman(5, 5))
        human.genome.caution = 1
        place(new Wolf(7, 5)).health = 0 // dead wolf stays put but is still "seen"
        system.execute(board, config({ human: { perceptionRange: 5 } }))
        destinations.add(`${human.x},${human.y}`)
      }
      // Furthest from (7,5): (4,4) and (4,6) at distance 4
      expect(destinations).toEqual(new Set(['4,4', '4,6']))
    })

    it('pay their metabolism gene in health each round and mark the cell dirty', () => {
      const human = place(calmHuman(0, 0))
      human.genome.metabolism = 0.5
      // Surround so it cannot move
      place(new Fruit(1, 0, 30, 5))
      place(new Fruit(0, 1, 30, 5))
      place(new Fruit(1, 1, 30, 5))

      const moves = system.execute(board, config())

      expect(moves).toEqual([])
      expect(human.health).toBeCloseTo(99.5)
      expect(renderer.markDirty).toHaveBeenCalledWith(0, 0)
    })

    it('that die from metabolism do not move', () => {
      const human = place(calmHuman(5, 5))
      human.genome.metabolism = 1
      human.health = 1

      const moves = system.execute(board, config())

      expect(moves).toEqual([])
      expect(human.health).toBe(0)
      expect(board.getEntity(5, 5)).toBe(human)
    })
  })

  describe('blocked movement', () => {
    it('PRD 3.2.4: when the preferred cell is occupied, picks a RANDOM free adjacent cell', () => {
      // Wolf (5,5) chasing human (7,5): the single preferred cell is (6,5).
      const free = ['5,4', '5,6', '4,4', '4,5', '4,6', '6,4', '6,6']
      const seen = new Set<string>()
      for (let trial = 0; trial < 200; trial++) {
        board = new Board(15, 15)
        Random.seed(trial)
        const wolf = place(new Wolf(5, 5))
        place(calmHuman(7, 5))
        const blocker = place(new Fruit(6, 5, 30, 5))
        system.execute(board, config({ wolf: { moveTowardHumanProbability: 1 } }))
        expect(board.getEntity(6, 5)).toBe(blocker)
        seen.add(`${wolf.x},${wolf.y}`)
      }
      // Every free neighbour is reachable, including ones that move away from the target
      expect([...seen].sort()).toEqual([...free].sort())
    })

    it('prefers a free cell among equidistant preferred cells over a random fallback', () => {
      // Wolf (5,5) chasing human (7,7): preferred cell is the diagonal (6,6)
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const wolf = place(new Wolf(5, 5))
      place(calmHuman(7, 7))
      system.execute(board, config({ wolf: { moveTowardHumanProbability: 1 } }))
      expect(`${wolf.x},${wolf.y}`).toBe('6,6')
    })

    it('does not count the target\'s own cell as blocked when adjacent', () => {
      // Wolf (5,5) adjacent to human (6,5): stays adjacent instead of wandering off
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const wolf = place(new Wolf(5, 5))
      place(calmHuman(6, 5))
      system.execute(board, config({ wolf: { moveTowardHumanProbability: 1 } }))
      expect(Math.max(Math.abs(wolf.x - 6), Math.abs(wolf.y - 5))).toBe(1)
    })

    it('does not move when all adjacent cells are occupied', () => {
      const wolf = place(new Wolf(5, 5))
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) place(new Mushroom(5 + dx, 5 + dy))
        }
      }

      const moves = system.execute(board, config())

      expect(moves).toEqual([])
      expect([wolf.x, wolf.y]).toEqual([5, 5])
      expect(board.getEntity(5, 5)).toBe(wolf)
    })

    it('never leaves the board (corner creature, seeded)', () => {
      Random.seed(3)
      for (let i = 0; i < 50; i++) {
        board = new Board(3, 3)
        const wolf = place(new Wolf(0, 0))
        system.execute(board, config())
        expect(board.isInBounds(wolf.x, wolf.y)).toBe(true)
        expect(board.getEntity(wolf.x, wolf.y)).toBe(wolf)
      }
    })
  })

  describe('general', () => {
    it('returns accurate movement records and marks both cells dirty', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const wolf = place(new Wolf(5, 5))

      const moves = system.execute(board, config())

      expect(moves).toEqual([{ entity: wolf, fromX: 5, fromY: 5, toX: 4, toY: 4 }])
      expect(renderer.markDirty).toHaveBeenCalledWith(5, 5)
      expect(renderer.markDirty).toHaveBeenCalledWith(4, 4)
    })

    it('moves each creature at most once per round', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // always moves down-right, i.e. forward in scan order
      const wolf = place(new Wolf(1, 1))

      const moves = system.execute(board, config())

      expect(moves).toHaveLength(1)
      expect([wolf.x, wolf.y]).toEqual([2, 2])
    })

    it('does not move plants or dead creatures', () => {
      place(new Fruit(2, 2))
      place(new Mushroom(4, 4))
      const deadWolf = place(new Wolf(8, 8))
      deadWolf.health = 0

      expect(system.execute(board, config())).toEqual([])
    })

    it('handles an empty board', () => {
      expect(system.execute(board, config())).toEqual([])
    })
  })

  describe('findNearest (grid scan)', () => {
    const isWolf = (e: unknown) => e instanceof Wolf

    it('uses Manhattan distance: a target at exactly the range is found, one further is not', () => {
      place(new Wolf(7, 6)) // distance 3 (diagonal-ish)
      expect(MovementSystem.findNearest(board, 5, 5, 3, isWolf)).toBeInstanceOf(Wolf)
      expect(MovementSystem.findNearest(board, 5, 5, 2, isWolf)).toBeNull()
    })

    it('excludes the centre cell and respects board edges', () => {
      place(new Wolf(0, 0))
      expect(MovementSystem.findNearest(board, 0, 0, 5, isWolf)).toBeNull()
      expect(MovementSystem.findNearest(board, 1, 0, 5, isWolf)).toBe(board.getEntity(0, 0))
    })

    it('returns the nearest of several targets', () => {
      place(new Wolf(0, 0))
      const near = place(new Wolf(6, 6))
      place(new Wolf(14, 14))
      expect(MovementSystem.findNearest(board, 5, 5, 20, isWolf)).toBe(near)
    })
  })
})
