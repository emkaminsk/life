import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameControls, type ControlButtons } from '../../src/ui/controls'

interface FakeGame {
  isRunning: boolean
  running: () => boolean
  start: () => void
  pause: () => void
  step: () => void
  stepRounds: (n: number) => void
}

function setup() {
  const game: FakeGame = {
    isRunning: false,
    running: vi.fn(() => game.isRunning),
    start: vi.fn(() => { game.isRunning = true }),
    pause: vi.fn(() => { game.isRunning = false }),
    step: vi.fn(),
    stepRounds: vi.fn(),
  }
  const mk = () => document.createElement('button')
  const buttons: ControlButtons = { pause: mk(), step: mk(), runFive: mk(), run: mk(), reset: mk(), finish: mk() }
  const controls = new GameControls(game, buttons, (k) => k)
  return { game, buttons, controls }
}

const enabled = (b: ControlButtons) => ({
  pause: !b.pause.disabled,
  step: !b.step.disabled,
  runFive: !b.runFive.disabled,
  run: !b.run.disabled,
  reset: !b.reset.disabled,
  finish: !b.finish.disabled,
})

describe('GameControls', () => {
  let s: ReturnType<typeof setup>
  beforeEach(() => { s = setup() })

  it('starts idle with every button disabled', () => {
    expect(s.controls.getState()).toBe('idle')
    expect(Object.values(enabled(s.buttons)).some(Boolean)).toBe(false)
  })

  it('begin() auto-starts the simulation (PRD 3.13.6)', () => {
    s.controls.begin()
    expect(s.game.start).toHaveBeenCalled()
    expect(s.controls.getState()).toBe('running')
    expect(enabled(s.buttons)).toEqual({ pause: true, step: false, runFive: false, run: false, reset: true, finish: true })
    expect(s.buttons.pause.textContent).toBe('controls.pause')
  })

  it('pausing enables step / five rounds / run free and labels the button Resume', () => {
    s.controls.begin()
    s.controls.pause()
    expect(enabled(s.buttons)).toEqual({ pause: true, step: true, runFive: true, run: true, reset: true, finish: true })
    expect(s.buttons.pause.textContent).toBe('controls.resume')
  })

  it('step disables controls until onStepComplete, which re-enables them only when paused', () => {
    s.controls.begin()
    s.controls.pause()
    s.controls.step()
    expect(s.game.step).toHaveBeenCalledTimes(1)
    expect(enabled(s.buttons)).toMatchObject({ pause: false, step: false, runFive: false, run: false })

    s.controls.handleStepComplete()
    expect(s.controls.getState()).toBe('paused')
    expect(enabled(s.buttons)).toMatchObject({ step: true, runFive: true })
  })

  it('onStepComplete during a continuous run does not re-enable the step buttons', () => {
    s.controls.begin()
    s.controls.handleStepComplete()
    expect(s.controls.getState()).toBe('running')
    expect(s.buttons.step.disabled).toBe(true)
    expect(s.buttons.runFive.disabled).toBe(true)
  })

  it('stepFive runs exactly five rounds via stepRounds(5) (PRD 3.8.3)', () => {
    s.controls.begin()
    s.controls.pause()
    s.controls.stepFive()
    expect(s.game.stepRounds).toHaveBeenCalledWith(5)
  })

  it('ignores step requests while running', () => {
    s.controls.begin()
    s.controls.step()
    s.controls.stepFive()
    expect(s.game.step).not.toHaveBeenCalled()
    expect(s.game.stepRounds).not.toHaveBeenCalled()
  })

  it('setIdle pauses a running game and disables everything', () => {
    s.controls.begin()
    s.controls.setIdle()
    expect(s.game.pause).toHaveBeenCalled()
    expect(Object.values(enabled(s.buttons)).some(Boolean)).toBe(false)
  })

  it('notifies state changes and re-translates labels', () => {
    const changes: string[] = []
    s.controls.onStateChange = (st) => changes.push(st)
    s.controls.begin()
    s.controls.togglePause()
    s.controls.togglePause()
    expect(changes).toEqual(['running', 'paused', 'running'])
    s.buttons.pause.textContent = 'stale'
    s.controls.refreshLabels()
    expect(s.buttons.pause.textContent).toBe('controls.pause')
  })
})
