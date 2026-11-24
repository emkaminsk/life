import { describe, it, expect, beforeEach, vi } from 'vitest'
import indexHtml from '../../index.html?raw'

vi.mock('../../src/ui/notifications', () => ({
  showNotification: vi.fn(),
}))

import { ConfigPanel, type GameConfig } from '../../src/ui/ConfigPanel'
import {
  FIELD_RULES,
  getDefaultConfig,
  isConfigStartable,
  mergeWithDefaults,
  validateConfig,
  validateValue,
} from '../../src/ui/configValidation'
import { showNotification } from '../../src/ui/notifications'
import { DEFAULT_CONFIG } from '../../src/config'
import { i18n } from '../../src/i18n/i18n'
import { Language } from '../../src/i18n/types'
import { Game } from '../../src/core/Game'
import { Board } from '../../src/core/Board'
import { createMockRenderer } from '../setup'

/** Load the real application markup so tests exercise the actual form. */
const html = indexHtml
const bodyHtml = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '')

const input = (id: string) => document.getElementById(id) as HTMLInputElement
const startBtn = () => document.getElementById('startGameBtn') as HTMLButtonElement
const startBtnTop = () => document.getElementById('startGameBtnTop') as HTMLButtonElement

function setInput(id: string, value: string) {
  const el = input(id)
  el.value = value
  el.dispatchEvent(new Event('input'))
}

describe('ConfigPanel', () => {
  let panel: ConfigPanel

  beforeEach(() => {
    i18n.setLanguage(Language.EN)
    document.body.innerHTML = bodyHtml
    vi.mocked(showNotification).mockClear()
    panel = new ConfigPanel()
    panel.show()
  })

  describe('validation gates Start (M6)', () => {
    it('defaults are valid and Start is enabled', () => {
      expect(panel.validate().valid).toBe(true)
      expect(startBtn().disabled).toBe(false)
      expect(startBtnTop().disabled).toBe(false)
      expect(document.getElementById('configValidationSummary')!.hidden).toBe(true)
    })

    it('rejects an empty / NaN value with a per-field message and disables Start', () => {
      setInput('humanHealth', '')
      expect(input('humanHealth').classList.contains('invalid')).toBe(true)
      expect(input('humanHealth').getAttribute('aria-invalid')).toBe('true')
      expect(document.getElementById('humanHealth-error')!.textContent).toBe('Please enter a number')
      expect(startBtn().disabled).toBe(true)
      expect(startBtnTop().disabled).toBe(true)
      const summary = document.getElementById('configValidationSummary')!
      expect(summary.hidden).toBe(false)
      expect(summary.textContent).toContain('1')
    })

    it('validates every numeric field, not just spawn probabilities', () => {
      for (const rule of FIELD_RULES) {
        setInput(rule.id, '-5')
      }
      const result = panel.validate()
      expect(result.valid).toBe(false)
      // every field has a minimum ≥ 0, so -5 is invalid everywhere
      expect(result.fieldErrors.map((e) => e.rule.id).sort()).toEqual(FIELD_RULES.map((r) => r.id).sort())
    })

    it('shows the violated bound in the message', () => {
      setInput('boardWidth', '500')
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be at most 100')
      setInput('boardWidth', '5')
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be at least 10')
      setInput('boardWidth', '20.5')
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('Must be a whole number')
      setInput('boardWidth', '20')
      expect(document.getElementById('boardWidth-error')!.textContent).toBe('')
      expect(startBtn().disabled).toBe(false)
    })

    it('blocks Start when spawn probabilities exceed 100%', () => {
      setInput('spawnFruit', '0.9')
      expect(panel.validate().spawnExceeded).toBe(true)
      expect(document.getElementById('spawnValidation')!.className).toContain('validation-error')
      expect(startBtn().disabled).toBe(true)
    })

    it('warns (but allows Start) above 90% total', () => {
      setInput('spawnFruit', '0.5') // 0.15+0.15+0.05+0.03+0.5+0.01 = 0.89
      setInput('spawnMushroom', '0.05') // 0.93
      expect(document.getElementById('spawnValidation')!.className).toContain('validation-warning')
      expect(startBtn().disabled).toBe(false)
    })

    it('clicking a (forced-enabled) Start with invalid input does not start', () => {
      const onStart = vi.fn()
      panel.onStart(onStart)
      setInput('wolfHealth', 'abc')
      startBtn().disabled = false
      startBtn().click()
      expect(onStart).not.toHaveBeenCalled()
      expect(panel.isVisible()).toBe(true)
    })

    it('provides range tooltips for each parameter (PRD 3.7.12)', () => {
      expect(input('boardWidth').title).toBe('Valid range: 10 to 100 (whole numbers only)')
      expect(input('humanHealth').title).toBe('Valid range: 1 or more')
    })
  })

  describe('no artificial upper limits', () => {
    const bounded = new Set([
      'boardWidth', 'boardHeight', 'injuredThreshold',
      'humanThreshold', 'humanMultiplier', 'animalThreshold', 'animalMultiplier',
    ])

    it('only board size, PRD-specified overcrowding ranges, percentages and probabilities have a max', () => {
      for (const rule of FIELD_RULES) {
        const isProbability = rule.min === 0 && rule.max === 1
        if (!bounded.has(rule.id) && !isProbability) {
          expect(rule.max, rule.id).toBeUndefined()
          expect(input(rule.id).hasAttribute('max'), rule.id).toBe(false)
        }
      }
    })

    it('accepts extreme values for unbounded parameters', () => {
      setInput('humanHealth', '100000')
      setInput('wolfDamageToMale', '5000')
      setInput('humanPerception', '250')
      setInput('fruitRipen', '999')
      setInput('humanPregnancy', '365')
      expect(panel.validate().valid).toBe(true)
    })

    it('enforces PRD 3.7.10 overcrowding ranges', () => {
      setInput('humanMultiplier', '11')
      setInput('animalThreshold', '5')
      const ids = panel.validate().fieldErrors.map((e) => e.rule.id)
      expect(ids).toHaveLength(2)
      expect(ids).toContain('humanMultiplier')
      expect(ids).toContain('animalThreshold')
    })
  })

  describe('start emits a clone (H3)', () => {
    it('passes a config read from the form', () => {
      const onStart = vi.fn()
      panel.onStart(onStart)
      setInput('boardWidth', '42')
      setInput('humanHealth', '150')
      startBtnTop().click()
      expect(onStart).toHaveBeenCalledTimes(1)
      const config: GameConfig = onStart.mock.calls[0][0]
      expect(config.board.width).toBe(42)
      expect(config.human.startingHealth).toBe(150)
      expect(panel.isVisible()).toBe(false)
    })

    it('never hands out its internal object', () => {
      const onStart = vi.fn()
      panel.onStart(onStart)
      startBtn().click()
      const emitted: GameConfig = onStart.mock.calls[0][0]
      emitted.board.width = 99
      emitted.human.startingHealth = 1
      expect(panel.getConfig().board.width).toBe(DEFAULT_CONFIG.board.width)
      expect(panel.getConfig().human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth)
      expect(panel.getConfig()).not.toBe(panel.getConfig())
    })

    it('the emitted config is accepted by Game.updateConfig and initializeBoard', () => {
      const onStart = vi.fn()
      panel.onStart(onStart)
      setInput('boardWidth', '20')
      setInput('boardHeight', '15')
      startBtn().click()
      const config: GameConfig = onStart.mock.calls[0][0]
      const board = new Board(config.board.width, config.board.height)
      const game = new Game(board, createMockRenderer())
      game.updateConfig(config)
      game.initializeBoard()
      expect(board.width).toBe(20)
      expect(board.height).toBe(15)
      expect(game.getConfig().board.width).toBe(20)
    })
  })

  describe('loading configuration files', () => {
    it('loads a wrapped config, fills missing values with defaults and notifies', () => {
      const result = panel.applyLoadedData(
        { version: '1.0', config: { board: { width: 35, height: 40 }, human: { startingHealth: 120 } } },
        'my.json',
      )
      expect(result.valid).toBe(true)
      expect(input('boardWidth').value).toBe('35')
      expect(input('boardHeight').value).toBe('40')
      expect(input('humanHealth').value).toBe('120')
      expect(input('wolfHealth').value).toBe(String(DEFAULT_CONFIG.wolf.startingHealth))
      expect(panel.getConfig().board.width).toBe(35)
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('my.json'), 'info')
    })

    it('loads an unwrapped config', () => {
      panel.applyLoadedData({ board: { width: 44, height: 44 } }, 'plain.json')
      expect(input('boardWidth').value).toBe('44')
    })

    it('validates loaded values the same way as typed ones (no silent clamping)', () => {
      const result = panel.applyLoadedData(
        { config: { board: { width: 5, height: 200 }, spawn: { maleHumanProbability: 5 }, human: { startingHealth: 999 } } },
        'bad.json',
      )
      expect(result.valid).toBe(false)
      expect(input('boardWidth').value).toBe('5')
      expect(input('boardWidth').classList.contains('invalid')).toBe(true)
      expect(input('boardHeight').classList.contains('invalid')).toBe(true)
      expect(input('spawnMaleHuman').classList.contains('invalid')).toBe(true)
      // no artificial cap on health: 999 is fine
      expect(input('humanHealth').classList.contains('invalid')).toBe(false)
      expect(startBtn().disabled).toBe(true)
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'warning')
    })

    it('replaces non-numeric loaded values with defaults', () => {
      panel.applyLoadedData({ human: { startingHealth: 'lots', gompertzA: null } }, 'x.json')
      expect(input('humanHealth').value).toBe(String(DEFAULT_CONFIG.human.startingHealth))
      expect(input('humanGompertzA').value).toBe(String(DEFAULT_CONFIG.human.gompertzA))
    })

    it('reports invalid JSON through an error notification (via FileReader)', () => {
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null
        readAsText() { this.onload?.({ target: { result: '{ invalid json' } }) }
      }
      vi.stubGlobal('FileReader', FakeReader)
      const fileInput = input('loadConfigFile')
      Object.defineProperty(fileInput, 'files', { value: [new File(['x'], 'broken.json')], configurable: true })
      fileInput.dispatchEvent(new Event('change'))
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'error')
    })

    it('loads a file through the hidden input', () => {
      const json = JSON.stringify({ config: { board: { width: 33 } } })
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null
        readAsText() { this.onload?.({ target: { result: json } }) }
      }
      vi.stubGlobal('FileReader', FakeReader)
      const fileInput = input('loadConfigFile')
      Object.defineProperty(fileInput, 'files', { value: [new File([json], 'ok.json')], configurable: true })
      fileInput.dispatchEvent(new Event('change'))
      expect(input('boardWidth').value).toBe('33')
    })
  })

  describe('sections and reset', () => {
    it('section headers are buttons that toggle aria-expanded', () => {
      const header = document.querySelector<HTMLButtonElement>('.config-section-header')!
      expect(header.tagName).toBe('BUTTON')
      expect(header.getAttribute('aria-expanded')).toBe('true')
      header.click()
      expect(header.getAttribute('aria-expanded')).toBe('false')
      expect(header.closest('.config-section')!.classList.contains('collapsed')).toBe(true)
    })

    it('collapse all toggles every section and the button label', () => {
      const btn = document.getElementById('collapseAllBtn')!
      expect(btn.textContent).toBe('Collapse')
      btn.click()
      expect(document.querySelectorAll('.config-section:not(.collapsed)').length).toBe(0)
      expect(btn.textContent).toBe('Expand')
      btn.click()
      expect(document.querySelectorAll('.config-section.collapsed').length).toBe(0)
    })

    it('Reset to Defaults restores values and clears errors', () => {
      setInput('humanHealth', '')
      document.getElementById('resetConfigBtn')!.click()
      expect(input('humanHealth').value).toBe(String(DEFAULT_CONFIG.human.startingHealth))
      expect(startBtn().disabled).toBe(false)
    })

    it('re-translates validation messages on language change', () => {
      setInput('humanHealth', '')
      i18n.setLanguage(Language.PL)
      expect(document.getElementById('humanHealth-error')!.textContent).toBe('Wpisz liczbę')
      i18n.setLanguage(Language.EN)
    })
  })
})

describe('configValidation', () => {
  it('validateValue covers NaN, Infinity, bounds and integers', () => {
    const rule = FIELD_RULES.find((r) => r.id === 'boardWidth')!
    expect(validateValue(rule, Number.NaN)?.code).toBe('notANumber')
    expect(validateValue(rule, Number.POSITIVE_INFINITY)?.code).toBe('notANumber')
    expect(validateValue(rule, 9)?.code).toBe('tooLow')
    expect(validateValue(rule, 101)?.code).toBe('tooHigh')
    expect(validateValue(rule, 10.5)?.code).toBe('notInteger')
    expect(validateValue(rule, 50)).toBeNull()
  })

  it('default config is valid and startable', () => {
    expect(validateConfig(getDefaultConfig())).toEqual([])
    expect(isConfigStartable(getDefaultConfig())).toBe(true)
  })

  it('spawn sum over 100% is not startable', () => {
    const config = getDefaultConfig()
    config.spawn.fruitProbability = 0.9
    expect(validateConfig(config)).toEqual([])
    expect(isConfigStartable(config)).toBe(false)
  })

  it('mergeWithDefaults keeps out-of-range numbers for validation and maps legacy names', () => {
    const { config, replaced } = mergeWithDefaults({
      board: { width: 5 },
      fruit: { energyValue: 35 },
      mushroom: { damageValue: 25 },
      human: { startingHealth: 'x' },
    })
    expect(config.board.width).toBe(5)
    expect(config.fruit.energyHealed).toBe(35)
    expect(config.mushroom.energyRemoved).toBe(25)
    expect(config.human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth)
    expect(replaced).toEqual(['human.startingHealth'])
  })

  it('prefers new property names over legacy ones', () => {
    const { config } = mergeWithDefaults({ fruit: { energyHealed: 40, energyValue: 35 } })
    expect(config.fruit.energyHealed).toBe(40)
  })

  it('handles empty / non-object input with all defaults', () => {
    expect(mergeWithDefaults({}).config).toEqual(getDefaultConfig())
    expect(mergeWithDefaults(null).config).toEqual(getDefaultConfig())
    expect(mergeWithDefaults('nope').config).toEqual(getDefaultConfig())
  })
})
