import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeathSystem } from '../../src/systems/DeathSystem'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities'
import type { Entity } from '../../src/entities/Entity'
import { Sex } from '../../src/types'
import { Gompertz } from '../../src/utils/Gompertz'
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup'

/**
 * DeathSystem behaviour tests (Phase 5): health deaths, Gompertz age mortality
 * (rolled with the incremented age) and overcrowding multipliers.
 */

const A = 0.01
const B = 0.1
const EPS = 1e-9

describe('DeathSystem', () => {
  let board: Board
  let renderer: ReturnType<typeof createMockRenderer>
  let system: DeathSystem

  beforeEach(() => {
    board = new Board(12, 12)
    renderer = createMockRenderer()
    system = new DeathSystem(renderer)
  })

  function place<T extends Entity>(e: T): T {
    board.setEntity(e.x, e.y, e)
    return e
  }

  const immortal = { gompertzA: 0, gompertzB: 0 }
  const human = (x: number, y: number, a = 0, b = 0) => new Human(x, y, Sex.MALE, 100, a, b)

  describe('health-based death', () => {
    it('removes creatures with health ≤ 0 and keeps the rest', () => {
      const dead = place(human(1, 1))
      dead.health = 0
      const alive = place(human(2, 2))
      alive.health = 0.5
      const deadWolf = place(new Wolf(3, 3, 80, 0, 0))
      deadWolf.health = 0

      system.execute(board, createConfig())

      expect(board.getEntity(1, 1)).toBeNull()
      expect(board.getEntity(3, 3)).toBeNull()
      expect(board.getEntity(2, 2)).toBe(alive)
      expect(renderer.markDirty).toHaveBeenCalledWith(1, 1)
      expect(renderer.markDirty).toHaveBeenCalledWith(3, 3)
    })

    it('ages every entity (incl. plants) by one round', () => {
      const entities = [place(human(1, 1)), place(new Wolf(2, 2, 80, 0, 0)), place(new Dog(3, 3, 70, 0, 0)), place(new Fruit(4, 4)), place(new Mushroom(5, 5))]
      entities[0].age = 7

      system.execute(board, createConfig())

      expect(entities.map((e) => e.age)).toEqual([8, 1, 1, 1, 1])
    })
  })

  describe('Gompertz age mortality uses the incremented age', () => {
    const cases: Array<[string, () => Entity]> = [
      ['human', () => human(5, 5, A, B)],
      ['wolf', () => new Wolf(5, 5, 80, A, B)],
      ['dog', () => new Dog(5, 5, 70, A, B)],
    ]

    it.each(cases)('%s dies when the roll is just under p(age + 1)', (_name, make) => {
      const entity = place(make())
      entity.age = 10
      const p = Gompertz.deathProbability(11, A, B)
      vi.spyOn(Math, 'random').mockReturnValue(p - EPS)

      system.execute(board, createConfig())

      expect(board.getEntity(5, 5)).toBeNull()
    })

    it.each(cases)('%s survives when the roll is just over p(age + 1)', (_name, make) => {
      const entity = place(make())
      entity.age = 10
      const p = Gompertz.deathProbability(11, A, B)
      vi.spyOn(Math, 'random').mockReturnValue(p + EPS)

      system.execute(board, createConfig())

      expect(board.getEntity(5, 5)).toBe(entity)
    })

    it('plants never die of age', () => {
      const fruit = place(new Fruit(1, 1))
      const mushroom = place(new Mushroom(2, 2))
      fruit.age = mushroom.age = 10_000
      vi.spyOn(Math, 'random').mockReturnValue(0)

      system.execute(board, createConfig())

      expect(board.getEntity(1, 1)).toBe(fruit)
      expect(board.getEntity(2, 2)).toBe(mushroom)
    })
  })

  describe('overcrowding', () => {
    // Roll between p(age 1, ×1) and p(age 1, ×3): dies only when the multiplier applies
    const pBase = Gompertz.deathProbability(1, A, B, 1)
    const pCrowded = Gompertz.deathProbability(1, A, B, 3)
    const roll = (pBase + pCrowded) / 2

    function survivors(setup: () => void, overcrowding: ConfigOverrides['overcrowding']): number {
      board = new Board(12, 12)
      setup()
      vi.spyOn(Math, 'random').mockReturnValue(roll)
      system.execute(board, createConfig({ overcrowding }))
      return board.getAllEntities().length
    }

    const threeHumans = () => {
      for (let i = 0; i < 3; i++) place(human(i, 0, A, B))
    }

    it('human multiplier applies only when the human count exceeds the threshold', () => {
      expect(survivors(threeHumans, { humanThreshold: 2, humanMultiplier: 3 })).toBe(0)
      expect(survivors(threeHumans, { humanThreshold: 3, humanMultiplier: 3 })).toBe(3) // 3 is not > 3
      expect(survivors(threeHumans, { humanThreshold: 2, humanMultiplier: 1 })).toBe(3)
    })

    it('wolves and dogs are counted together for the animal threshold', () => {
      const pack = () => {
        place(new Wolf(0, 0, 80, A, B))
        place(new Wolf(1, 0, 80, A, B))
        place(new Dog(2, 0, 70, A, B))
      }
      expect(survivors(pack, { animalThreshold: 2, animalMultiplier: 3 })).toBe(0)
      expect(survivors(pack, { animalThreshold: 3, animalMultiplier: 3 })).toBe(3)
    })

    it('animal overcrowding does not affect humans and vice versa', () => {
      const mixed = () => {
        threeHumans()
        place(new Wolf(5, 5, 80, A, B))
      }
      // Humans crowded, animals not
      expect(survivors(mixed, { humanThreshold: 2, humanMultiplier: 3, animalThreshold: 5, animalMultiplier: 3 })).toBe(1)
      // Animals crowded (1 > 0), humans not
      expect(survivors(mixed, { humanThreshold: 5, humanMultiplier: 3, animalThreshold: 0, animalMultiplier: 3 })).toBe(3)
    })
  })

  it('immortal parameters (A = 0) never cause age deaths', () => {
    const h = place(new Human(1, 1, Sex.FEMALE, 100, immortal.gompertzA, immortal.gompertzB))
    h.age = 500
    vi.spyOn(Math, 'random').mockReturnValue(0)

    system.execute(board, createConfig())

    expect(board.getEntity(1, 1)).toBe(h)
  })
})
