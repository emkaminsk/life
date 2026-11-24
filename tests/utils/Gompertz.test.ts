import { describe, it, expect, vi } from 'vitest'
import { Gompertz } from '../../src/utils/Gompertz'

describe('Gompertz', () => {
  it('matches P = 1 - exp(-A·m·exp(B·age))', () => {
    expect(Gompertz.deathProbability(10, 0.01, 0.1)).toBeCloseTo(1 - Math.exp(-0.01 * Math.exp(1)), 12)
    expect(Gompertz.deathProbability(10, 0.01, 0.1, 3)).toBeCloseTo(1 - Math.exp(-0.03 * Math.exp(1)), 12)
  })

  it('increases with age and with the multiplier', () => {
    expect(Gompertz.deathProbability(20, 0.001, 0.1)).toBeGreaterThan(Gompertz.deathProbability(10, 0.001, 0.1))
    expect(Gompertz.deathProbability(10, 0.001, 0.1, 2)).toBeGreaterThan(Gompertz.deathProbability(10, 0.001, 0.1))
  })

  it('A = 0 means no age mortality', () => {
    expect(Gompertz.deathProbability(1000, 0, 0.1)).toBe(0)
  })

  it('shouldDie compares the random roll against the probability', () => {
    const p = Gompertz.deathProbability(5, 0.01, 0.1)
    vi.spyOn(Math, 'random').mockReturnValueOnce(p - 1e-9).mockReturnValueOnce(p + 1e-9)
    expect(Gompertz.shouldDie(5, 0.01, 0.1)).toBe(true)
    expect(Gompertz.shouldDie(5, 0.01, 0.1)).toBe(false)
  })
})
