import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Game, CONFIG_LOCKED_MESSAGE } from '../../src/core/Game'
import { Board } from '../../src/core/Board'
import { Human, Wolf, Fruit } from '../../src/entities'
import { Sex } from '../../src/types'
import type { GameConfig } from '../../src/ui/ConfigPanel'
import { createConfig, createMockRenderer, type ConfigOverrides } from '../setup'

/**
 * Game orchestration tests: phase order, config locking, round lifecycle
 * (continuous / step / stepRounds / pause mid-animation) and callbacks.
 *
 * Timers, requestAnimationFrame and performance.now are faked so animations
 * progress only when the test advances time.
 */

const PHASES = ['movement', 'combat', 'eating', 'reproduction', 'death', 'birth', 'spawn'] as const
const SYSTEM_FIELDS: Record<(typeof PHASES)[number], string> = {
  movement: 'movementSystem',
  combat: 'combatSystem',
  eating: 'eatingSystem',
  reproduction: 'reproductionSystem',
  death: 'deathSystem',
  birth: 'birthSystem',
  spawn: 'spawnSystem',
}

/** A config where nothing spawns and nothing dies of age (only explicit rules act). */
function quietConfig(overrides: ConfigOverrides = {}): GameConfig {
  const base = createConfig({
    spawn: { maleHumanProbability: 0, femaleHumanProbability: 0, wolfProbability: 0, dogProbability: 0, fruitProbability: 0, mushroomProbability: 0 },
    fruit: { spawnProbability: 0 },
    mushroom: { spawnProbability: 0 },
    wolf: { spawnProbability: 0, gompertzA: 0 },
    dog: { spawnProbability: 0, gompertzA: 0 },
    human: { gompertzA: 0 },
  })
  for (const [k, v] of Object.entries(overrides)) Object.assign((base as any)[k], v)
  return base
}

describe('Game', () => {
  let board: Board
  let renderer: ReturnType<typeof createMockRenderer>
  let game: Game

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'],
    })
    board = new Board(10, 10)
    renderer = createMockRenderer()
    game = new Game(board, renderer)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Start a game on an empty board with a quiet config, then place entities. */
  function newGame(config: GameConfig = quietConfig()): void {
    game.updateConfig(config)
    game.initializeBoard()
  }

  function wanderingWolf(x = 5, y = 5): Wolf {
    const wolf = new Wolf(x, y, 80, 0, 0)
    board.setEntity(x, y, wolf)
    return wolf
  }

  function spyPhases(): string[] {
    const calls: string[] = []
    for (const phase of PHASES) {
      const system = (game as any)[SYSTEM_FIELDS[phase]]
      const original = system.execute.bind(system)
      vi.spyOn(system, 'execute').mockImplementation((...args: unknown[]) => {
        calls.push(phase)
        return original(...args)
      })
    }
    return calls
  }

  describe('phase order', () => {
    it('runs movement, combat, eating, reproduction, death, birth, spawn in order (no animation)', () => {
      newGame()
      game.setAnimationDuration(0)
      wanderingWolf()
      const calls = spyPhases()

      game.step()

      expect(calls).toEqual([...PHASES])
      expect(board.round).toBe(1)
    })

    it('keeps the order when movement is animated, running phases 2–7 only after the animation', () => {
      newGame()
      wanderingWolf()
      const calls = spyPhases()

      game.step()
      expect(calls).toEqual(['movement'])
      expect(game.isAnimatingNow()).toBe(true)

      vi.advanceTimersByTime(game.getAnimationDuration() + 100)

      expect(calls).toEqual([...PHASES])
      expect(game.isAnimatingNow()).toBe(false)
      expect(board.round).toBe(1)
    })

    it('passes the game config to every system', () => {
      const config = quietConfig({ human: { maleVsMaleDamage: 42 } })
      newGame(config)
      game.setAnimationDuration(0)
      const spies = PHASES.map((p) => vi.spyOn((game as any)[SYSTEM_FIELDS[p]], 'execute'))

      game.step()

      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][0]).toBe(board)
        expect((spy.mock.calls[0][1] as GameConfig).human.maleVsMaleDamage).toBe(42)
      }
    })
  })

  describe('same-round consequences', () => {
    it('a creature killed in combat is removed in the death phase of the same round', () => {
      board.resize(2, 1)
      newGame()
      game.setAnimationDuration(0)
      const wolf = new Wolf(0, 0, 80, 0, 0)
      const female = new Human(1, 0, Sex.FEMALE, 10, 0, 0)
      board.setEntity(0, 0, wolf)
      board.setEntity(1, 0, female)

      game.step()

      expect(board.getEntity(1, 0)).toBeNull()
      expect(board.getEntity(0, 0)).toBe(wolf)
    })
  })

  describe('configuration', () => {
    it('stores a deep-frozen copy and notifies the renderer of the injured threshold', () => {
      const config = quietConfig({ board: { injuredThreshold: 33 } })
      game.updateConfig(config)

      const stored = game.getConfig()
      expect(stored).not.toBe(config)
      expect(stored).toEqual(config)
      expect(Object.isFrozen(stored)).toBe(true)
      expect(Object.isFrozen(stored.human)).toBe(true)
      expect(() => {
        ;(stored.human as { startingHealth: number }).startingHealth = 1
      }).toThrow()

      config.human.startingHealth = 999
      expect(game.getConfig().human.startingHealth).not.toBe(999)
      expect(renderer.setInjuredThreshold).toHaveBeenCalledWith(33)
    })

    it('is locked by initializeBoard and unlocked by reset', () => {
      expect(game.isConfigLocked()).toBe(false)
      game.initializeBoard()
      expect(game.isConfigLocked()).toBe(true)
      expect(() => game.updateConfig(quietConfig())).toThrow(CONFIG_LOCKED_MESSAGE)
      expect(CONFIG_LOCKED_MESSAGE).toBe('Configuration is locked while a game is in progress')

      game.reset()
      expect(game.isConfigLocked()).toBe(false)
      expect(() => game.updateConfig(quietConfig())).not.toThrow()
    })

    it('initializeBoard(config) populates the board with configured entities', () => {
      const config = quietConfig({
        spawn: { maleHumanProbability: 0.5, femaleHumanProbability: 0, wolfProbability: 0, dogProbability: 0, fruitProbability: 0.5, mushroomProbability: 0 },
        human: { startingHealth: 60, gompertzA: 0.002, gompertzB: 0.2 },
        fruit: { energyHealed: 9, roundsToRipen: 5, spawnProbability: 0 },
      })
      game.initializeBoard(config)

      const entities = board.getAllEntities()
      expect(entities).toHaveLength(100)
      const humans = entities.filter((e): e is Human => e instanceof Human)
      const fruits = entities.filter((e): e is Fruit => e instanceof Fruit)
      expect(humans.length + fruits.length).toBe(100)
      for (const h of humans) {
        expect(h.sex).toBe(Sex.MALE)
        expect(h.health).toBeLessThanOrEqual(60)
        expect(h.gompertzA).toBe(0.002)
        expect(h.gompertzB).toBe(0.2)
      }
      for (const f of fruits) {
        expect(f.energyHealed).toBe(9)
        expect(f.ripeningCounter).toBe(5)
      }
      expect(game.getConfig().human.startingHealth).toBe(60)
      expect(game.getPopulationHistory()).toEqual([humans.length])
    })
  })

  describe('pause during movement animation (H2)', () => {
    it('snaps positions and completes the round exactly once', () => {
      newGame()
      const wolf = wanderingWolf()
      const combat = vi.spyOn((game as any).combatSystem, 'execute')
      const onRound = vi.fn()
      game.onRoundComplete = onRound

      game.start()
      expect(game.isAnimatingNow()).toBe(true)
      const afterMove = { x: wolf.x, y: wolf.y }
      vi.advanceTimersByTime(game.getAnimationDuration() / 2)

      game.pause()

      expect(game.running()).toBe(false)
      expect(game.isAnimatingNow()).toBe(false)
      expect(board.round).toBe(1)
      expect(combat).toHaveBeenCalledTimes(1)
      expect(onRound).toHaveBeenCalledTimes(1)
      expect([wolf.visualX, wolf.visualY]).toEqual([wolf.x, wolf.y])
      expect([wolf.x, wolf.y]).toEqual([afterMove.x, afterMove.y])

      // Nothing else happens afterwards
      vi.advanceTimersByTime(5000)
      expect(board.round).toBe(1)
      expect(combat).toHaveBeenCalledTimes(1)
      expect([wolf.x, wolf.y]).toEqual([afterMove.x, afterMove.y])
    })

    it('resuming starts a fresh round', () => {
      newGame()
      wanderingWolf()
      game.start()
      game.pause()
      expect(board.round).toBe(1)

      game.start()
      vi.advanceTimersByTime(game.getAnimationDuration() + 50)
      expect(board.round).toBeGreaterThanOrEqual(2)
      game.pause()
    })
  })

  describe('stepping', () => {
    it('stepRounds(5) advances exactly 5 rounds and fires onStepComplete once (animated)', () => {
      newGame()
      wanderingWolf()
      const onStep = vi.fn()
      const onRound = vi.fn()
      game.onStepComplete = onStep
      game.onRoundComplete = onRound

      game.stepRounds(5)
      vi.advanceTimersByTime(20_000)

      expect(board.round).toBe(5)
      expect(onRound).toHaveBeenCalledTimes(5)
      expect(onStep).toHaveBeenCalledTimes(1)
      expect(game.isStepping()).toBe(false)
    })

    it('stepRounds(5) also works when nothing moves', () => {
      newGame()
      const onStep = vi.fn()
      game.onStepComplete = onStep

      game.stepRounds(5)
      vi.advanceTimersByTime(20_000)

      expect(board.round).toBe(5)
      expect(onStep).toHaveBeenCalledTimes(1)
    })

    it('step() runs one round and fires onStepComplete after it', () => {
      newGame()
      wanderingWolf()
      const onStep = vi.fn()
      game.onStepComplete = onStep

      game.step()
      expect(onStep).not.toHaveBeenCalled()
      vi.advanceTimersByTime(game.getAnimationDuration() + 50)

      expect(board.round).toBe(1)
      expect(onStep).toHaveBeenCalledTimes(1)
    })

    it('ignores step requests while a step is in progress or the game is running', () => {
      newGame()
      wanderingWolf()
      game.stepRounds(2)
      game.step()
      game.stepRounds(3)
      vi.advanceTimersByTime(20_000)
      expect(board.round).toBe(2)

      game.start()
      const roundAtStart = board.round
      game.stepRounds(50)
      game.pause()
      expect(board.round).toBeLessThanOrEqual(roundAtStart + 1)
    })

    it('start() during a step sequence takes over without firing onStepComplete', () => {
      newGame()
      const onStep = vi.fn()
      game.onStepComplete = onStep
      game.stepRounds(10)
      game.start()
      vi.advanceTimersByTime(game.getSpeed() * 3 + 10)
      game.pause()
      expect(onStep).not.toHaveBeenCalled()
      expect(game.isStepping()).toBe(false)
    })
  })

  describe('continuous run', () => {
    it('fires onRoundComplete every round and never onStepComplete', () => {
      newGame()
      const onRound = vi.fn()
      const onStep = vi.fn()
      game.onRoundComplete = onRound
      game.onStepComplete = onStep

      game.start() // nothing moves → one round per getSpeed() ms
      vi.advanceTimersByTime(game.getSpeed() * 4 + 10)
      game.pause()

      expect(board.round).toBe(5)
      expect(onRound).toHaveBeenCalledTimes(5)
      expect(onStep).not.toHaveBeenCalled()
    })

    it('setSpeed changes the delay between rounds', () => {
      newGame()
      game.start() // round 1 runs immediately
      game.setSpeed(1000)
      expect(game.getSpeed()).toBe(1000)
      vi.advanceTimersByTime(999)
      expect(board.round).toBe(1)
      vi.advanceTimersByTime(2)
      expect(board.round).toBe(2)
      game.pause()
    })

    it('records population after initialization and every round', () => {
      newGame()
      game.setAnimationDuration(0)
      board.setEntity(0, 0, new Human(0, 0, Sex.MALE, 50, 0, 0))
      game.step()
      game.step()
      expect(game.getPopulationHistory()).toEqual([0, 1, 1])
    })
  })

  describe('reset', () => {
    it('stops the game, clears board, round, history and visual effects', () => {
      newGame()
      wanderingWolf()
      game.start()
      game.reset()

      expect(game.running()).toBe(false)
      expect(game.isAnimatingNow()).toBe(false)
      expect(board.getAllEntities()).toHaveLength(0)
      expect(board.round).toBe(0)
      expect(game.getPopulationHistory()).toEqual([])
      expect(renderer.clearVisualEffects).toHaveBeenCalled()

      vi.advanceTimersByTime(5000)
      expect(board.round).toBe(0)
    })
  })
})
