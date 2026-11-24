import { describe, it, expect, vi } from 'vitest'
import { Board } from '../../src/core/Board'
import { Human } from '../../src/entities/Human'
import { Wolf } from '../../src/entities/Wolf'
import { Dog } from '../../src/entities/Dog'
import { Fruit } from '../../src/entities/Fruit'
import { Mushroom } from '../../src/entities/Mushroom'
import { Sex } from '../../src/types'
import {
  AlertTracker,
  countPopulation,
  emptyCounts,
  renderStatistics,
  RoundsPerSecondTracker,
} from '../../src/ui/statistics'

function populatedBoard(): Board {
  const board = new Board(10, 12)
  board.setEntity(0, 0, new Human(0, 0, Sex.MALE))
  board.setEntity(1, 0, new Human(1, 0, Sex.MALE))
  board.setEntity(2, 0, new Human(2, 0, Sex.FEMALE))
  const pregnant = new Human(3, 0, Sex.FEMALE)
  pregnant.startPregnancy()
  board.setEntity(3, 0, pregnant)
  board.setEntity(0, 1, new Wolf(0, 1))
  board.setEntity(1, 1, new Dog(1, 1))
  board.setEntity(2, 1, new Dog(2, 1))
  board.setEntity(0, 2, new Fruit(0, 2, 30, 0)) // ripe
  board.setEntity(1, 2, new Fruit(1, 2, 30, 3)) // unripe
  board.setEntity(2, 2, new Fruit(2, 2, 30, 1)) // unripe
  board.setEntity(9, 11, new Mushroom(9, 11))
  return board
}

describe('countPopulation', () => {
  it('counts every category in one pass, including ripe/unripe fruit', () => {
    const counts = countPopulation(populatedBoard())
    expect(counts).toEqual({
      males: 2,
      females: 2,
      pregnant: 1,
      wolves: 1,
      dogs: 2,
      ripeFruits: 1,
      unripeFruits: 2,
      mushrooms: 1,
      total: 7, // creatures only: 4 humans + 1 wolf + 2 dogs
      capacity: 120, // 10 × 12 fields
    })
  })

  it('reads each cell exactly once', () => {
    const board = populatedBoard()
    const spy = vi.spyOn(board, 'getEntity')
    countPopulation(board)
    expect(spy).toHaveBeenCalledTimes(board.width * board.height)
  })

  it('returns zeros for an empty board', () => {
    expect(countPopulation(new Board(10, 10))).toEqual(emptyCounts(100))
  })
})

describe('renderStatistics', () => {
  it('writes counts, ripe/unripe split and total/fields into the panel', () => {
    document.body.innerHTML = `
      <span id="maleCount"></span><span id="femaleCount"></span><span id="pregnantCount"></span>
      <span id="wolfCount"></span><span id="dogCount"></span><span id="fruitCount"></span>
      <span id="fruitRipeUnripe"></span><span id="mushroomCount"></span><div id="totalCreatures"></div>`
    const t = (key: string, ...args: (string | number)[]) => `${key}:${args.join(',')}`
    renderStatistics(countPopulation(populatedBoard()), t)
    const text = (id: string) => document.getElementById(id)!.textContent
    expect(text('maleCount')).toBe('2')
    expect(text('femaleCount')).toBe('2')
    expect(text('pregnantCount')).toBe('1')
    expect(text('fruitCount')).toBe('3')
    expect(text('fruitRipeUnripe')).toBe('stats.ripeUnripe:1,2')
    expect(text('mushroomCount')).toBe('1')
    expect(text('totalCreatures')).toBe('stats.total:7,120')
  })
})

describe('RoundsPerSecondTracker', () => {
  function tracker() {
    let time = 0
    const clock = { advance: (ms: number) => { time += ms } }
    const rps = new RoundsPerSecondTracker(() => time, 3000)
    return { rps, clock }
  }

  it('is 0 with fewer than two samples', () => {
    const { rps } = tracker()
    expect(rps.getRate()).toBe(0)
    rps.record(1)
    expect(rps.getRate()).toBe(0)
  })

  it('computes completed rounds over wall time', () => {
    const { rps, clock } = tracker()
    for (let round = 1; round <= 11; round++) {
      rps.record(round)
      clock.advance(200)
    }
    // 10 rounds between first and last sample, 2000 ms apart; queried 200 ms later
    expect(rps.getRate()).toBe(5)
  })

  it('uses a sliding window so the rate follows speed changes', () => {
    const { rps, clock } = tracker()
    let round = 0
    for (let i = 0; i < 20; i++) { rps.record(++round); clock.advance(500) } // 2 r/s
    for (let i = 0; i < 40; i++) { rps.record(++round); clock.advance(100) } // 10 r/s
    expect(rps.getRate()).toBeCloseTo(10, 0)
  })

  it('reports 0 when stale and after reset', () => {
    const { rps, clock } = tracker()
    rps.record(1); clock.advance(100); rps.record(2)
    expect(rps.getRate()).toBe(10)
    clock.advance(5000)
    expect(rps.getRate()).toBe(0)
    rps.record(3)
    rps.reset()
    expect(rps.getRate()).toBe(0)
  })
})

describe('AlertTracker', () => {
  const counts = (over: Partial<ReturnType<typeof emptyCounts>>) => ({ ...emptyCounts(100), ...over })

  it('raises male/female extinction once, only after the population existed', () => {
    const alerts = new AlertTracker()
    expect(alerts.check(counts({ males: 0, females: 0 }))).toEqual([])
    expect(alerts.check(counts({ males: 3, females: 2 }))).toEqual([])
    expect(alerts.check(counts({ males: 0, females: 2 }))).toEqual(['maleExtinction'])
    expect(alerts.check(counts({ males: 0, females: 0 }))).toEqual(['femaleExtinction'])
    expect(alerts.check(counts({ males: 0, females: 0 }))).toEqual([])
  })

  it('warns at 90% capacity and re-arms after dropping below', () => {
    const alerts = new AlertTracker()
    expect(alerts.check(counts({ total: 90 }))).toEqual(['boardNearlyFull'])
    expect(alerts.check(counts({ total: 95 }))).toEqual([])
    expect(alerts.check(counts({ total: 50 }))).toEqual([])
    expect(alerts.check(counts({ total: 91 }))).toEqual(['boardNearlyFull'])
  })

  it('reset() re-arms everything for a new game', () => {
    const alerts = new AlertTracker()
    alerts.check(counts({ males: 1 }))
    alerts.check(counts({ males: 0 }))
    alerts.reset()
    alerts.check(counts({ males: 1 }))
    expect(alerts.check(counts({ males: 0 }))).toEqual(['maleExtinction'])
  })
})
