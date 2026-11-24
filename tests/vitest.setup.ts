import { afterEach, beforeEach, vi } from 'vitest'
import { Random } from '../src/utils/Random'

// Keep test output readable: the simulation logs a lot per round.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

// Every test starts with the default (Math.random-backed) source so that
// vi.spyOn(Math, 'random') works; tests that need determinism call Random.seed().
afterEach(() => {
  Random.useMathRandom()
})
