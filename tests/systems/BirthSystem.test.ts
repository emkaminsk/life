import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BirthSystem } from '../../src/systems/BirthSystem'
import { Board } from '../../src/core/Board'
import { Human } from '../../src/entities/Human'
import { Fruit } from '../../src/entities/Fruit'
import { Random } from '../../src/utils/Random'
import { Sex, type Genome } from '../../src/types'
import { VISUAL_EFFECT_DURATION_MS } from '../../src/config'
import { createConfig, createMockRenderer } from '../setup'

/**
 * BirthSystem behaviour tests (Phase 6).
 *
 * With Math.random stubbed to a constant r: crossover takes the mother's gene when
 * r < 0.5 (father's otherwise) and mutates only when r < 0.2; the baby is male when
 * r < 0.5.
 */

const motherGenome: Genome = { maxHealth: 90, strength: 1.2, metabolism: 0.1, greed: 0.6, caution: 0.1 }
const fatherGenome: Genome = { maxHealth: 120, strength: 0.8, metabolism: 0.2, greed: 0.4, caution: 0.3 }

function makeMother(x: number, y: number): Human {
  const f = new Human(x, y, Sex.FEMALE, undefined, undefined, undefined, { ...motherGenome })
  f.readyToGiveBirth = true
  f.fatherGenome = { ...fatherGenome }
  return f
}

describe('BirthSystem', () => {
  let board: Board
  let renderer: ReturnType<typeof createMockRenderer>
  let system: BirthSystem

  beforeEach(() => {
    board = new Board(12, 12)
    mothers.clear()
    renderer = createMockRenderer()
    system = new BirthSystem(renderer)
  })

  const mothers = new Set<Human>()
  function readyMother(x: number, y: number): Human {
    const m = makeMother(x, y)
    mothers.add(m)
    return m
  }
  function babies(): Human[] {
    return board.getAllEntities().filter((e): e is Human => e instanceof Human && !mothers.has(e))
  }

  it('a ready mother gives birth on an adjacent empty cell and is no longer ready', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const mother = readyMother(5, 5)
    board.setEntity(5, 5, mother)

    system.execute(board, createConfig())

    const born = babies()
    expect(born).toHaveLength(1)
    expect(Math.abs(born[0].x - 5)).toBeLessThanOrEqual(1)
    expect(Math.abs(born[0].y - 5)).toBeLessThanOrEqual(1)
    expect(mother.readyToGiveBirth).toBe(false)
    expect(mother.fatherGenome).toBeUndefined()
    expect(board.getEntity(5, 5)).toBe(mother)
  })

  it('does nothing for females that are not ready', () => {
    const female = readyMother(5, 5)
    female.readyToGiveBirth = false
    board.setEntity(5, 5, female)

    system.execute(board, createConfig())

    expect(board.getAllEntities()).toHaveLength(1)
  })

  it('inherits genes from the parents (r=0.3 → mother, r=0.7 → father, no mutation) and sex from the roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    board.setEntity(5, 5, readyMother(5, 5))
    system.execute(board, createConfig())
    const boy = babies()[0]
    expect(boy.sex).toBe(Sex.MALE)
    expect(boy.genome).toEqual(motherGenome)
    expect(boy.health).toBe(motherGenome.maxHealth)
    expect(boy.maxHealth).toBe(motherGenome.maxHealth)

    board = new Board(12, 12)
    vi.spyOn(Math, 'random').mockReturnValue(0.7)
    board.setEntity(5, 5, readyMother(5, 5))
    system.execute(board, createConfig())
    const girl = babies()[0]
    expect(girl.sex).toBe(Sex.FEMALE)
    expect(girl.genome).toEqual(fatherGenome)
  })

  it('babies use the configured Gompertz parameters', () => {
    board.setEntity(5, 5, readyMother(5, 5))

    system.execute(board, createConfig({ human: { gompertzA: 0.0042, gompertzB: 0.42 } }))

    const baby = babies()[0]
    expect(baby.gompertzA).toBe(0.0042)
    expect(baby.gompertzB).toBe(0.42)
  })

  it('without a recorded father the genome baseline comes from config startingHealth', () => {
    Random.seed(11)
    const mother = readyMother(5, 5)
    mother.fatherGenome = undefined
    board.setEntity(5, 5, mother)
    system.execute(board, createConfig({ human: { startingHealth: 1000 } }))
    // 20% std-dev around 1000: far above the default 100
    expect(babies()[0].genome.maxHealth).toBeGreaterThan(400)
  })

  it('when no adjacent cell is free the mother dies and the baby takes her cell', () => {
    const mother = readyMother(0, 0)
    board.setEntity(0, 0, mother)
    board.setEntity(1, 0, new Fruit(1, 0))
    board.setEntity(0, 1, new Fruit(0, 1))
    board.setEntity(1, 1, new Fruit(1, 1))

    system.execute(board, createConfig())

    const occupant = board.getEntity(0, 0)
    expect(occupant).toBeInstanceOf(Human)
    expect(occupant).not.toBe(mother)
    expect(board.getAllEntities().filter((e) => e instanceof Human)).toHaveLength(1)
  })

  it('handles several mothers in the same round', () => {
    board.setEntity(2, 2, readyMother(2, 2))
    board.setEntity(8, 8, readyMother(8, 8))

    system.execute(board, createConfig())

    expect(board.getAllEntities().filter((e) => e instanceof Human)).toHaveLength(4)
  })

  it('adds a green flash of VISUAL_EFFECT_DURATION_MS at the birth cell', () => {
    board.setEntity(5, 5, readyMother(5, 5))

    system.execute(board, createConfig())

    const baby = babies()[0]
    expect(renderer.addVisualEffect).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reproduction', x: baby.x, y: baby.y, duration: VISUAL_EFFECT_DURATION_MS })
    )
    expect(renderer.markDirty).toHaveBeenCalledWith(baby.x, baby.y)
  })
})
