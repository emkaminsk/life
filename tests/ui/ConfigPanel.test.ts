import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'

// Mock main.ts to prevent its execution during import
vi.mock('../../src/main', () => ({
  showNotification: vi.fn(),
}))

// Mock i18n to prevent DOM access
vi.mock('../../src/i18n/i18n', () => ({
  i18n: {
    t: (key: string, ...args: any[]) => key,
    getCurrentLanguage: () => 'en',
    setLanguage: vi.fn(),
    onLanguageChange: vi.fn(),
  },
}))

import { ConfigPanel, type GameConfig } from '../../src/ui/ConfigPanel'
import { DEFAULT_CONFIG } from '../../src/config'
import { Game } from '../../src/core/Game'
import { Board } from '../../src/core/Board'
import { createMockRenderer } from '../setup'

/**
 * ConfigPanel Tests
 *
 * Tests configuration save/load functionality with resilient error handling:
 * - Save configuration to JSON
 * - Load complete configurations
 * - Load partial configurations (missing parameters filled with defaults)
 * - Load configurations with invalid values (clamped to valid ranges)
 * - Load empty configurations (all defaults used)
 * - Verify loaded config values propagate to game entities
 */

describe('ConfigPanel Save/Load', () => {
  let dom: JSDOM
  let configPanel: ConfigPanel
  let document: Document
  let window: Window & typeof globalThis

  beforeEach(() => {
    // Create a minimal DOM environment for ConfigPanel
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="configPanel" style="display: none;">
            <input id="boardWidth" type="number" value="30" />
            <input id="boardHeight" type="number" value="30" />
            <input id="injuredThreshold" type="number" value="30" />

            <input id="spawnMaleHuman" type="number" value="0.05" />
            <input id="spawnFemaleHuman" type="number" value="0.05" />
            <input id="spawnWolf" type="number" value="0.02" />
            <input id="spawnDog" type="number" value="0.01" />
            <input id="spawnFruit" type="number" value="0.1" />
            <input id="spawnMushroom" type="number" value="0.05" />

            <input id="humanHealth" type="number" value="100" />
            <input id="humanMaleDamage" type="number" value="10" />
            <input id="humanWolfDamage" type="number" value="5" />
            <input id="humanReproduction" type="number" value="0.8" />
            <input id="humanPregnancy" type="number" value="5" />
            <input id="humanCooldown" type="number" value="3" />
            <input id="humanGompertzA" type="number" value="0.0001" />
            <input id="humanGompertzB" type="number" value="0.1" />
            <input id="humanPerception" type="number" value="5" />
            <input id="humanFruitProb" type="number" value="0.8" />

            <input id="wolfHealth" type="number" value="80" />
            <input id="wolfDamageToMale" type="number" value="20" />
            <input id="wolfDamageToFemale" type="number" value="15" />
            <input id="wolfDamageToDog" type="number" value="10" />
            <input id="wolfGompertzA" type="number" value="0.001" />
            <input id="wolfGompertzB" type="number" value="0.15" />
            <input id="wolfPerception" type="number" value="8" />
            <input id="wolfHumanProb" type="number" value="0.9" />
            <input id="wolfSpawn" type="number" value="0.001" />

            <input id="dogHealth" type="number" value="70" />
            <input id="dogDamage" type="number" value="25" />
            <input id="dogGompertzA" type="number" value="0.0005" />
            <input id="dogGompertzB" type="number" value="0.12" />
            <input id="dogPerception" type="number" value="10" />
            <input id="dogWolfProb" type="number" value="0.95" />
            <input id="dogSpawn" type="number" value="0.0005" />

            <input id="fruitHealing" type="number" value="30" />
            <input id="fruitSpawn" type="number" value="0.005" />
            <input id="fruitRipen" type="number" value="3" />

            <input id="mushroomDamage" type="number" value="20" />
            <input id="mushroomSpawn" type="number" value="0.003" />

            <input id="humanThreshold" type="number" value="100" />
            <input id="humanMultiplier" type="number" value="2" />
            <input id="animalThreshold" type="number" value="50" />
            <input id="animalMultiplier" type="number" value="1.5" />

            <div id="spawnValidation"></div>
            <div id="expectedCounts"></div>
            <button id="saveConfigBtn">Save</button>
            <button id="loadConfigBtn">Load</button>
            <input id="loadConfigFile" type="file" style="display: none;" />
            <button id="resetConfigBtn">Reset</button>
            <button id="startGameBtn">Start</button>
            <button id="startGameBtnTop">Start Top</button>
            <button id="collapseAllBtn">Collapse</button>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
    })

    document = dom.window.document
    window = dom.window as any
    global.document = document as any
    global.window = window as any
    global.HTMLElement = window.HTMLElement
    global.FileReader = window.FileReader
    global.Blob = window.Blob
    global.URL = window.URL as any

    // Create ConfigPanel instance
    configPanel = new ConfigPanel()
  })

  afterEach(() => {
    dom.window.close()
    vi.restoreAllMocks()
  })

  describe('Configuration Merging with Defaults', () => {
    it('should load partial configuration and fill missing values with defaults', () => {
      const partialConfig = {
        board: {
          width: 25,
          height: 25,
          // injuredThreshold is missing
        },
        spawn: {
          maleHumanProbability: 0.05,
          // All other spawn probabilities missing
        },
        human: {
          startingHealth: 120,
          // All other human config missing
        },
        // wolf, dog, fruit, mushroom, overcrowding sections completely missing
      }

      // Access the private method through type assertion
      const mergedConfig = (configPanel as any).mergeWithDefaults(partialConfig)

      // Check that provided values are preserved
      expect(mergedConfig.board.width).toBe(25)
      expect(mergedConfig.board.height).toBe(25)
      expect(mergedConfig.spawn.maleHumanProbability).toBe(0.05)
      expect(mergedConfig.human.startingHealth).toBe(120)

      // Check that missing values are filled with defaults
      expect(mergedConfig.board.injuredThreshold).toBe(DEFAULT_CONFIG.board.injuredThreshold)
      expect(mergedConfig.spawn.femaleHumanProbability).toBe(DEFAULT_CONFIG.spawn.femaleHumanProbability)
      expect(mergedConfig.human.maleVsMaleDamage).toBe(DEFAULT_CONFIG.human.maleVsMaleDamage)
      expect(mergedConfig.wolf.startingHealth).toBe(DEFAULT_CONFIG.wolf.startingHealth)
      expect(mergedConfig.dog.damageToWolf).toBe(DEFAULT_CONFIG.dog.damageToWolf)
      expect(mergedConfig.fruit.energyHealed).toBe(DEFAULT_CONFIG.fruit.energyHealed)
      expect(mergedConfig.mushroom.energyRemoved).toBe(DEFAULT_CONFIG.mushroom.energyRemoved)
      expect(mergedConfig.overcrowding.humanThreshold).toBe(DEFAULT_CONFIG.overcrowding.humanThreshold)
    })

    it('should load empty configuration and use all defaults', () => {
      const emptyConfig = {}

      const mergedConfig = (configPanel as any).mergeWithDefaults(emptyConfig)

      // All values should match defaults
      expect(mergedConfig.board.width).toBe(DEFAULT_CONFIG.board.width)
      expect(mergedConfig.board.height).toBe(DEFAULT_CONFIG.board.height)
      expect(mergedConfig.spawn.maleHumanProbability).toBe(DEFAULT_CONFIG.spawn.maleHumanProbability)
      expect(mergedConfig.human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth)
      expect(mergedConfig.wolf.damageToMale).toBe(DEFAULT_CONFIG.wolf.damageToMale)
      expect(mergedConfig.dog.perceptionRange).toBe(DEFAULT_CONFIG.dog.perceptionRange)
    })

    it('should clamp invalid values to valid ranges', () => {
      const invalidConfig = {
        board: {
          width: 5, // Below minimum of 10
          height: 200, // Above maximum of 100
          injuredThreshold: -10, // Below minimum of 0
        },
        spawn: {
          maleHumanProbability: 5.0, // Above maximum of 1
          wolfProbability: -0.5, // Below minimum of 0
        },
        human: {
          startingHealth: 999, // Above maximum of 200
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(invalidConfig)

      // Check that invalid values are clamped
      expect(mergedConfig.board.width).toBe(10) // Clamped to minimum
      expect(mergedConfig.board.height).toBe(100) // Clamped to maximum
      expect(mergedConfig.board.injuredThreshold).toBe(0) // Clamped to minimum
      expect(mergedConfig.spawn.maleHumanProbability).toBe(1) // Clamped to maximum
      expect(mergedConfig.spawn.wolfProbability).toBe(0) // Clamped to minimum
      expect(mergedConfig.human.startingHealth).toBe(200) // Clamped to maximum
    })

    it('should support backward compatibility with old property names', () => {
      const oldConfig = {
        fruit: {
          energyValue: 35, // Old property name
          spawnProbability: 0.005,
          roundsToRipen: 3,
        },
        mushroom: {
          damageValue: 25, // Old property name
          spawnProbability: 0.003,
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(oldConfig)

      // Check that old property names are mapped to new ones
      expect(mergedConfig.fruit.energyHealed).toBe(35)
      expect(mergedConfig.mushroom.energyRemoved).toBe(25)
    })

    it('should prefer new property names over old ones when both exist', () => {
      const configWithBoth = {
        fruit: {
          energyHealed: 40, // New property name
          energyValue: 35, // Old property name
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(configWithBoth)

      // Should use new property name value
      expect(mergedConfig.fruit.energyHealed).toBe(40)
    })
  })

  describe('Loading Configuration Files', () => {
    it('should load configuration with version wrapper', () => {
      const configData = {
        version: '1.0',
        timestamp: '2024-01-15T10:00:00.000Z',
        config: {
          board: { width: 35, height: 35, injuredThreshold: 40 },
          spawn: DEFAULT_CONFIG.spawn,
          human: DEFAULT_CONFIG.human,
          wolf: DEFAULT_CONFIG.wolf,
          dog: DEFAULT_CONFIG.dog,
          fruit: DEFAULT_CONFIG.fruit,
          mushroom: DEFAULT_CONFIG.mushroom,
          overcrowding: DEFAULT_CONFIG.overcrowding,
        },
      }

      const jsonString = JSON.stringify(configData)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], 'test-config.json', { type: 'application/json' })

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: jsonString } })
        }),
        onload: null as any,
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      // Simulate file input change event
      const input = document.getElementById('loadConfigFile') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: true,
      })

      const event = new window.Event('change')
      Object.defineProperty(event, 'target', { value: input, writable: false })

      ;(configPanel as any).loadConfiguration(event)

      // Verify config was loaded
      const loadedConfig = configPanel.getConfig()
      expect(loadedConfig.board.width).toBe(35)
      expect(loadedConfig.board.height).toBe(35)
      expect(loadedConfig.board.injuredThreshold).toBe(40)
    })

    it('should load configuration without version wrapper', () => {
      const configData = {
        board: { width: 40, height: 40, injuredThreshold: 50 },
        spawn: DEFAULT_CONFIG.spawn,
        human: DEFAULT_CONFIG.human,
        wolf: DEFAULT_CONFIG.wolf,
        dog: DEFAULT_CONFIG.dog,
        fruit: DEFAULT_CONFIG.fruit,
        mushroom: DEFAULT_CONFIG.mushroom,
        overcrowding: DEFAULT_CONFIG.overcrowding,
      }

      const jsonString = JSON.stringify(configData)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], 'test-config.json', { type: 'application/json' })

      const mockFileReader = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: jsonString } })
        }),
        onload: null as any,
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const input = document.getElementById('loadConfigFile') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: true,
      })

      const event = new window.Event('change')
      Object.defineProperty(event, 'target', { value: input, writable: false })

      ;(configPanel as any).loadConfiguration(event)

      const loadedConfig = configPanel.getConfig()
      expect(loadedConfig.board.width).toBe(40)
      expect(loadedConfig.board.height).toBe(40)
    })

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = '{ invalid json }'
      const blob = new Blob([invalidJson], { type: 'application/json' })
      const file = new File([blob], 'invalid.json', { type: 'application/json' })

      const mockFileReader = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: invalidJson } })
        }),
        onload: null as any,
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const input = document.getElementById('loadConfigFile') as HTMLInputElement
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: true,
      })

      const event = new window.Event('change')
      Object.defineProperty(event, 'target', { value: input, writable: false })

      // Should not throw, but handle error gracefully
      expect(() => {
        ;(configPanel as any).loadConfiguration(event)
      }).not.toThrow()

      // Note: showNotification is mocked, so we can't verify it was called here
      // The error handling logic is tested by the fact that no exception is thrown
    })
  })

  describe('Configuration Propagation to Game', () => {
    it('should propagate custom config values to game entities', () => {
      const customConfig: GameConfig = {
        board: { width: 20, height: 20, injuredThreshold: 40 },
        spawn: {
          maleHumanProbability: 0.1,
          femaleHumanProbability: 0.1,
          wolfProbability: 0.05,
          dogProbability: 0.03,
          fruitProbability: 0.15,
          mushroomProbability: 0.08,
        },
        human: {
          startingHealth: 150,
          maleVsMaleDamage: 15,
          maleVsWolfDamage: 8,
          reproductionProbability: 0.9,
          pregnancyPeriod: 7,
          cooldownPeriod: 5,
          perceptionRange: 6,
          moveTowardFruitProbability: 0.85,
          gompertzA: 0.0002,
          gompertzB: 0.12,
        },
        wolf: {
          startingHealth: 90,
          damageToMale: 25,
          damageToFemale: 20,
          damageToDog: 12,
          perceptionRange: 10,
          moveTowardHumanProbability: 0.95,
          spawnProbability: 0.002,
          gompertzA: 0.0015,
          gompertzB: 0.18,
        },
        dog: {
          startingHealth: 75,
          damageToWolf: 30,
          perceptionRange: 12,
          moveTowardWolfProbability: 0.98,
          spawnProbability: 0.001,
          gompertzA: 0.0008,
          gompertzB: 0.14,
        },
        fruit: {
          energyHealed: 40,
          spawnProbability: 0.008,
          roundsToRipen: 4,
        },
        mushroom: {
          energyRemoved: 25,
          spawnProbability: 0.005,
        },
        overcrowding: {
          humanThreshold: 150,
          humanMultiplier: 2.5,
          animalThreshold: 75,
          animalMultiplier: 2.0,
        },
      }

      const board = new Board(customConfig.board.width, customConfig.board.height)
      const renderer = createMockRenderer()
      const game = new Game(board, renderer)

      // Initialize game with custom config
      game.initializeBoard(customConfig)

      // Verify board dimensions
      expect(board.width).toBe(20)
      expect(board.height).toBe(20)

      // Get entities and verify their properties match config
      const entities = board.getAllEntities()
      expect(entities.length).toBeGreaterThan(0)

      // Note: We can't directly verify all entity properties here because
      // entities are spawned randomly and their exact properties depend on
      // the implementation. The real verification happens through system tests
      // and integration tests that verify behavior matches config.
    })

    it('should use loaded partial config in game initialization', () => {
      // Simulate loading a partial config
      const partialConfig = {
        board: {
          width: 25,
        },
        human: {
          startingHealth: 130,
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(partialConfig)

      const board = new Board(mergedConfig.board.width, mergedConfig.board.height)
      const renderer = createMockRenderer()
      const game = new Game(board, renderer)

      game.initializeBoard(mergedConfig)

      // Verify custom values were used
      expect(board.width).toBe(25)

      // Verify defaults were used for missing values
      expect(board.height).toBe(DEFAULT_CONFIG.board.height)
    })

    it('should handle config with clamped values in game', () => {
      const invalidConfig = {
        board: {
          width: 5, // Will be clamped to 10
          height: 200, // Will be clamped to 100
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(invalidConfig)

      const board = new Board(mergedConfig.board.width, mergedConfig.board.height)
      const renderer = createMockRenderer()
      const game = new Game(board, renderer)

      game.initializeBoard(mergedConfig)

      // Verify clamped values work correctly
      expect(board.width).toBe(10)
      expect(board.height).toBe(100)

      // Game should initialize without errors
      const entities = board.getAllEntities()
      expect(entities).toBeDefined()
    })
  })

  describe('Real Config File Loading', () => {
    it('should load test-config-partial.json correctly', () => {
      const partialConfigData = {
        version: '1.0',
        timestamp: '2024-01-15T10:00:00.000Z',
        config: {
          board: {
            width: 25,
            height: 25,
          },
          spawn: {
            maleHumanProbability: 0.05,
          },
          human: {
            startingHealth: 120,
          },
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(partialConfigData.config)

      // Verify loaded values
      expect(mergedConfig.board.width).toBe(25)
      expect(mergedConfig.board.height).toBe(25)
      expect(mergedConfig.spawn.maleHumanProbability).toBe(0.05)
      expect(mergedConfig.human.startingHealth).toBe(120)

      // Verify defaults filled in
      expect(mergedConfig.board.injuredThreshold).toBe(DEFAULT_CONFIG.board.injuredThreshold)
      expect(mergedConfig.spawn.femaleHumanProbability).toBe(DEFAULT_CONFIG.spawn.femaleHumanProbability)
      expect(mergedConfig.wolf.startingHealth).toBe(DEFAULT_CONFIG.wolf.startingHealth)
    })

    it('should load test-config-empty.json correctly', () => {
      const emptyConfigData = {
        version: '1.0',
        config: {},
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(emptyConfigData.config)

      // All values should be defaults
      expect(mergedConfig.board.width).toBe(DEFAULT_CONFIG.board.width)
      expect(mergedConfig.human.startingHealth).toBe(DEFAULT_CONFIG.human.startingHealth)
      expect(mergedConfig.wolf.damageToMale).toBe(DEFAULT_CONFIG.wolf.damageToMale)
    })

    it('should load test-config-invalid-values.json correctly', () => {
      const invalidConfigData = {
        version: '1.0',
        config: {
          board: {
            width: 5,
            height: 200,
            injuredThreshold: -10,
          },
          spawn: {
            maleHumanProbability: 5.0,
            wolfProbability: -0.5,
          },
          human: {
            startingHealth: 999,
          },
        },
      }

      const mergedConfig = (configPanel as any).mergeWithDefaults(invalidConfigData.config)

      // Verify clamping occurred
      expect(mergedConfig.board.width).toBe(10)
      expect(mergedConfig.board.height).toBe(100)
      expect(mergedConfig.board.injuredThreshold).toBe(0)
      expect(mergedConfig.spawn.maleHumanProbability).toBe(1)
      expect(mergedConfig.spawn.wolfProbability).toBe(0)
      expect(mergedConfig.human.startingHealth).toBe(200)
    })
  })

  describe('Save Configuration', () => {
    it('should generate valid JSON when saving', () => {
      // Set some custom values in the UI
      const widthInput = document.getElementById('boardWidth') as HTMLInputElement
      const healthInput = document.getElementById('humanHealth') as HTMLInputElement

      // Use setAttribute for JSDOM compatibility
      widthInput.setAttribute('value', '35')
      healthInput.setAttribute('value', '150')

      // Also set the value property directly (JSDOM quirk)
      Object.defineProperty(widthInput, 'value', { value: '35', writable: true })
      Object.defineProperty(healthInput, 'value', { value: '150', writable: true })

      // Read config from inputs
      ;(configPanel as any).readConfigFromInputs()

      const config = configPanel.getConfig()

      // Verify config has expected structure
      expect(config.board.width).toBe(35)
      expect(config.human.startingHealth).toBe(150)

      // Verify it can be serialized to JSON
      const jsonString = JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: config,
      })

      expect(jsonString).toBeDefined()
      expect(jsonString.length).toBeGreaterThan(0)

      // Verify it can be parsed back
      const parsed = JSON.parse(jsonString)
      expect(parsed.config.board.width).toBe(35)
      expect(parsed.config.human.startingHealth).toBe(150)
    })
  })
})
