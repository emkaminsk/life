import { DEFAULT_CONFIG } from '../config';
import { i18n } from '../i18n/i18n';
import { showNotification } from '../main';

export interface GameConfig {
  board: {
    width: number;
    height: number;
    injuredThreshold: number;
  };
  spawn: {
    maleHumanProbability: number;
    femaleHumanProbability: number;
    wolfProbability: number;
    dogProbability: number;
    fruitProbability: number;
    mushroomProbability: number;
  };
  human: {
    startingHealth: number;
    maleVsMaleDamage: number;
    maleVsWolfDamage: number;
    reproductionProbability: number;
    pregnancyPeriod: number;
    cooldownPeriod: number;
    perceptionRange: number;
    moveTowardFruitProbability: number;
    gompertzA: number;
    gompertzB: number;
  };
  wolf: {
    startingHealth: number;
    damageToMale: number;
    damageToFemale: number;
    damageToDog: number;
    perceptionRange: number;
    moveTowardHumanProbability: number;
    spawnProbability: number;
    gompertzA: number;
    gompertzB: number;
  };
  dog: {
    startingHealth: number;
    damageToWolf: number;
    perceptionRange: number;
    moveTowardWolfProbability: number;
    spawnProbability: number;
    gompertzA: number;
    gompertzB: number;
  };
  fruit: {
    energyHealed: number;
    spawnProbability: number;
    roundsToRipen: number;
  };
  mushroom: {
    energyRemoved: number;
    spawnProbability: number;
  };
  overcrowding: {
    humanThreshold: number;
    humanMultiplier: number;
    animalThreshold: number;
    animalMultiplier: number;
  };
}

export class ConfigPanel {
  private panel: HTMLElement;
  private config: GameConfig;
  private onStartCallback: ((config: GameConfig) => void) | null = null;

  constructor() {
    this.panel = document.getElementById('configPanel')!;
    this.config = this.getDefaultConfig();
    this.setupEventListeners();
  }

  private getDefaultConfig(): GameConfig {
    return {
      board: {
        width: DEFAULT_CONFIG.board.width,
        height: DEFAULT_CONFIG.board.height,
        injuredThreshold: DEFAULT_CONFIG.board.injuredThreshold,
      },
      spawn: {
        maleHumanProbability: DEFAULT_CONFIG.spawn.maleHumanProbability,
        femaleHumanProbability: DEFAULT_CONFIG.spawn.femaleHumanProbability,
        wolfProbability: DEFAULT_CONFIG.spawn.wolfProbability,
        dogProbability: DEFAULT_CONFIG.spawn.dogProbability,
        fruitProbability: DEFAULT_CONFIG.spawn.fruitProbability,
        mushroomProbability: DEFAULT_CONFIG.spawn.mushroomProbability,
      },
      human: {
        startingHealth: DEFAULT_CONFIG.human.startingHealth,
        maleVsMaleDamage: DEFAULT_CONFIG.human.maleVsMaleDamage,
        maleVsWolfDamage: DEFAULT_CONFIG.human.maleVsWolfDamage,
        reproductionProbability: DEFAULT_CONFIG.human.reproductionProbability,
        pregnancyPeriod: DEFAULT_CONFIG.human.pregnancyPeriod,
        cooldownPeriod: DEFAULT_CONFIG.human.cooldownPeriod,
        perceptionRange: DEFAULT_CONFIG.human.perceptionRange,
        moveTowardFruitProbability: DEFAULT_CONFIG.human.moveTowardFruitProbability,
        gompertzA: DEFAULT_CONFIG.human.gompertzA,
        gompertzB: DEFAULT_CONFIG.human.gompertzB,
      },
      wolf: {
        startingHealth: DEFAULT_CONFIG.wolf.startingHealth,
        damageToMale: DEFAULT_CONFIG.wolf.damageToMale,
        damageToFemale: DEFAULT_CONFIG.wolf.damageToFemale,
        damageToDog: DEFAULT_CONFIG.wolf.damageToDog,
        perceptionRange: DEFAULT_CONFIG.wolf.perceptionRange,
        moveTowardHumanProbability: DEFAULT_CONFIG.wolf.moveTowardHumanProbability,
        spawnProbability: DEFAULT_CONFIG.wolf.spawnProbability,
        gompertzA: DEFAULT_CONFIG.wolf.gompertzA,
        gompertzB: DEFAULT_CONFIG.wolf.gompertzB,
      },
      dog: {
        startingHealth: DEFAULT_CONFIG.dog.startingHealth,
        damageToWolf: DEFAULT_CONFIG.dog.damageToWolf,
        perceptionRange: DEFAULT_CONFIG.dog.perceptionRange,
        moveTowardWolfProbability: DEFAULT_CONFIG.dog.moveTowardWolfProbability,
        spawnProbability: DEFAULT_CONFIG.dog.spawnProbability,
        gompertzA: DEFAULT_CONFIG.dog.gompertzA,
        gompertzB: DEFAULT_CONFIG.dog.gompertzB,
      },
      fruit: {
        energyHealed: DEFAULT_CONFIG.fruit.energyHealed,
        spawnProbability: DEFAULT_CONFIG.fruit.spawnProbability,
        roundsToRipen: DEFAULT_CONFIG.fruit.roundsToRipen,
      },
      mushroom: {
        energyRemoved: DEFAULT_CONFIG.mushroom.energyRemoved,
        spawnProbability: DEFAULT_CONFIG.mushroom.spawnProbability,
      },
      overcrowding: {
        humanThreshold: DEFAULT_CONFIG.overcrowding.humanThreshold,
        humanMultiplier: DEFAULT_CONFIG.overcrowding.humanMultiplier,
        animalThreshold: DEFAULT_CONFIG.overcrowding.animalThreshold,
        animalMultiplier: DEFAULT_CONFIG.overcrowding.animalMultiplier,
      },
    };
  }

  private setupEventListeners(): void {
    // Save configuration button
    const saveBtn = document.getElementById('saveConfigBtn');
    saveBtn?.addEventListener('click', () => this.saveConfiguration());

    // Load configuration button
    const loadBtn = document.getElementById('loadConfigBtn');
    loadBtn?.addEventListener('click', () => this.triggerLoadConfiguration());

    // Hidden file input for load
    const loadFileInput = document.getElementById('loadConfigFile') as HTMLInputElement;
    loadFileInput?.addEventListener('change', (e) => this.loadConfiguration(e));

    // Reset to defaults button
    const resetBtn = document.getElementById('resetConfigBtn');
    resetBtn?.addEventListener('click', () => this.resetToDefaults());

    // Start game button (bottom)
    const startBtn = document.getElementById('startGameBtn');
    startBtn?.addEventListener('click', () => this.handleStartGame());

    // Start game button (top)
    const startBtnTop = document.getElementById('startGameBtnTop');
    startBtnTop?.addEventListener('click', () => this.handleStartGame());

    // Collapse all button
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    collapseAllBtn?.addEventListener('click', () => this.toggleCollapseAll());

    // Collapsible sections
    const sectionHeaders = document.querySelectorAll('.config-section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => this.toggleSection(header as HTMLElement));
    });

    // Input change listeners for real-time validation
    const spawnInputs = [
      'spawnMaleHuman',
      'spawnFemaleHuman',
      'spawnWolf',
      'spawnDog',
      'spawnFruit',
      'spawnMushroom',
      'boardWidth',
      'boardHeight'
    ];

    spawnInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => {
          this.updateExpectedCounts();
          this.validateSpawnProbabilities();
        });
        input.addEventListener('change', () => {
          this.updateExpectedCounts();
          this.validateSpawnProbabilities();
        });
      }
    });

    // Add validation styling for all number inputs
    const allInputs = document.querySelectorAll('.config-row input[type="number"]');
    allInputs.forEach(input => {
      input.addEventListener('input', () => this.validateInput(input as HTMLInputElement));
      input.addEventListener('change', () => this.validateInput(input as HTMLInputElement));
    });

    // Listen for language changes to update UI text
    i18n.onLanguageChange(() => {
      this.updateButtonTexts();
      this.updateLabels();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+S or Cmd+S: Save configuration
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveConfiguration();
      }
      // Ctrl+O or Cmd+O: Load configuration
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        this.triggerLoadConfiguration();
      }
    });
  }

  private validateInput(input: HTMLInputElement): void {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (isNaN(value) || value < min || value > max) {
      input.style.borderColor = '#ef5350';
      input.style.backgroundColor = '#ffebee';
    } else {
      input.style.borderColor = '#ddd';
      input.style.backgroundColor = 'white';
    }
  }

  private toggleSection(header: HTMLElement): void {
    const section = header.parentElement;
    section?.classList.toggle('collapsed');
  }

  private toggleCollapseAll(): void {
    const sections = document.querySelectorAll('.config-section');
    const collapseBtn = document.getElementById('collapseAllBtn') as HTMLButtonElement;

    if (!collapseBtn) return;

    // Check if all sections are collapsed
    const allCollapsed = Array.from(sections).every(section =>
      section.classList.contains('collapsed')
    );

    // Toggle all sections
    sections.forEach(section => {
      if (allCollapsed) {
        section.classList.remove('collapsed');
      } else {
        section.classList.add('collapsed');
      }
    });

    // Update button text
    this.updateButtonTexts();
  }

  private resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.populateInputs();
    console.log('[ConfigPanel] Reset to default values');
  }

  private populateInputs(): void {
    // Board configuration
    this.setInputValue('boardWidth', this.config.board.width);
    this.setInputValue('boardHeight', this.config.board.height);
    this.setInputValue('injuredThreshold', this.config.board.injuredThreshold);

    // Spawn probabilities
    this.setInputValue('spawnMaleHuman', this.config.spawn.maleHumanProbability);
    this.setInputValue('spawnFemaleHuman', this.config.spawn.femaleHumanProbability);
    this.setInputValue('spawnWolf', this.config.spawn.wolfProbability);
    this.setInputValue('spawnDog', this.config.spawn.dogProbability);
    this.setInputValue('spawnFruit', this.config.spawn.fruitProbability);
    this.setInputValue('spawnMushroom', this.config.spawn.mushroomProbability);

    // Human configuration
    this.setInputValue('humanHealth', this.config.human.startingHealth);
    this.setInputValue('humanMaleDamage', this.config.human.maleVsMaleDamage);
    this.setInputValue('humanWolfDamage', this.config.human.maleVsWolfDamage);
    this.setInputValue('humanReproduction', this.config.human.reproductionProbability);
    this.setInputValue('humanPregnancy', this.config.human.pregnancyPeriod);
    this.setInputValue('humanCooldown', this.config.human.cooldownPeriod);
    this.setInputValue('humanGompertzA', this.config.human.gompertzA);
    this.setInputValue('humanGompertzB', this.config.human.gompertzB);
    this.setInputValue('humanPerception', this.config.human.perceptionRange);
    this.setInputValue('humanFruitProb', this.config.human.moveTowardFruitProbability);

    // Wolf configuration
    this.setInputValue('wolfHealth', this.config.wolf.startingHealth);
    this.setInputValue('wolfDamageToMale', this.config.wolf.damageToMale);
    this.setInputValue('wolfDamageToFemale', this.config.wolf.damageToFemale);
    this.setInputValue('wolfDamageToDog', this.config.wolf.damageToDog);
    this.setInputValue('wolfGompertzA', this.config.wolf.gompertzA);
    this.setInputValue('wolfGompertzB', this.config.wolf.gompertzB);
    this.setInputValue('wolfPerception', this.config.wolf.perceptionRange);
    this.setInputValue('wolfHumanProb', this.config.wolf.moveTowardHumanProbability);
    this.setInputValue('wolfSpawn', this.config.wolf.spawnProbability);

    // Dog configuration
    this.setInputValue('dogHealth', this.config.dog.startingHealth);
    this.setInputValue('dogDamage', this.config.dog.damageToWolf);
    this.setInputValue('dogGompertzA', this.config.dog.gompertzA);
    this.setInputValue('dogGompertzB', this.config.dog.gompertzB);
    this.setInputValue('dogPerception', this.config.dog.perceptionRange);
    this.setInputValue('dogWolfProb', this.config.dog.moveTowardWolfProbability);
    this.setInputValue('dogSpawn', this.config.dog.spawnProbability);

    // Fruit configuration
    this.setInputValue('fruitHealing', this.config.fruit.energyHealed);
    this.setInputValue('fruitSpawn', this.config.fruit.spawnProbability);
    this.setInputValue('fruitRipen', this.config.fruit.roundsToRipen);

    // Mushroom configuration
    this.setInputValue('mushroomDamage', this.config.mushroom.energyRemoved);
    this.setInputValue('mushroomSpawn', this.config.mushroom.spawnProbability);

    // Overcrowding configuration
    this.setInputValue('humanThreshold', this.config.overcrowding.humanThreshold);
    this.setInputValue('humanMultiplier', this.config.overcrowding.humanMultiplier);
    this.setInputValue('animalThreshold', this.config.overcrowding.animalThreshold);
    this.setInputValue('animalMultiplier', this.config.overcrowding.animalMultiplier);

    this.updateExpectedCounts();
    this.validateSpawnProbabilities();
  }

  private setInputValue(id: string, value: number): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.value = value.toString();
    }
  }

  private getInputValue(id: string): number {
    const input = document.getElementById(id) as HTMLInputElement;
    return input ? parseFloat(input.value) : 0;
  }

  private validateSpawnProbabilities(): boolean {
    const total =
      this.getInputValue('spawnMaleHuman') +
      this.getInputValue('spawnFemaleHuman') +
      this.getInputValue('spawnWolf') +
      this.getInputValue('spawnDog') +
      this.getInputValue('spawnFruit') +
      this.getInputValue('spawnMushroom');

    const validationMsg = document.getElementById('spawnValidation');
    const startBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
    const startBtnTop = document.getElementById('startGameBtnTop') as HTMLButtonElement;

    if (total > 1.0) {
      if (validationMsg) {
        validationMsg.textContent = `❌ ${i18n.t('config.totalSpawnProbability')} ${(total * 100).toFixed(1)}% ${i18n.t('config.spawnExceeds100')}`;
        validationMsg.className = 'validation-error';
      }
      if (startBtn) startBtn.disabled = true;
      if (startBtnTop) startBtnTop.disabled = true;
      return false;
    } else if (total > 0.9) {
      if (validationMsg) {
        validationMsg.textContent = `⚠️ ${i18n.t('config.spawnWarning')} ${i18n.t('config.totalSpawnProbability')} ${(total * 100).toFixed(1)}% ${i18n.t('config.spawnVeryHigh')}`;
        validationMsg.className = 'validation-warning';
      }
      if (startBtn) startBtn.disabled = false;
      if (startBtnTop) startBtnTop.disabled = false;
      return true;
    } else {
      if (validationMsg) {
        validationMsg.textContent = `✓ ${i18n.t('config.totalSpawnProbability')}: ${(total * 100).toFixed(1)}%`;
        validationMsg.className = 'validation-success';
      }
      if (startBtn) startBtn.disabled = false;
      if (startBtnTop) startBtnTop.disabled = false;
      return true;
    }
  }

  private updateExpectedCounts(): void {
    const width = this.getInputValue('boardWidth');
    const height = this.getInputValue('boardHeight');
    const totalCells = width * height;

    const expectedMales = Math.round(totalCells * this.getInputValue('spawnMaleHuman'));
    const expectedFemales = Math.round(totalCells * this.getInputValue('spawnFemaleHuman'));
    const expectedWolves = Math.round(totalCells * this.getInputValue('spawnWolf'));
    const expectedDogs = Math.round(totalCells * this.getInputValue('spawnDog'));
    const expectedFruits = Math.round(totalCells * this.getInputValue('spawnFruit'));
    const expectedMushrooms = Math.round(totalCells * this.getInputValue('spawnMushroom'));

    const expectedText = document.getElementById('expectedCounts');
    if (expectedText) {
      expectedText.textContent = i18n.t('config.expectedCreaturesDetailed', expectedMales, expectedFemales, expectedWolves, expectedDogs, expectedFruits, expectedMushrooms);
    }
  }

  private readConfigFromInputs(): void {
    // Board
    this.config.board.width = this.getInputValue('boardWidth');
    this.config.board.height = this.getInputValue('boardHeight');
    this.config.board.injuredThreshold = this.getInputValue('injuredThreshold');

    // Spawn probabilities
    this.config.spawn.maleHumanProbability = this.getInputValue('spawnMaleHuman');
    this.config.spawn.femaleHumanProbability = this.getInputValue('spawnFemaleHuman');
    this.config.spawn.wolfProbability = this.getInputValue('spawnWolf');
    this.config.spawn.dogProbability = this.getInputValue('spawnDog');
    this.config.spawn.fruitProbability = this.getInputValue('spawnFruit');
    this.config.spawn.mushroomProbability = this.getInputValue('spawnMushroom');

    // Human configuration
    this.config.human.startingHealth = this.getInputValue('humanHealth');
    this.config.human.maleVsMaleDamage = this.getInputValue('humanMaleDamage');
    this.config.human.maleVsWolfDamage = this.getInputValue('humanWolfDamage');
    this.config.human.reproductionProbability = this.getInputValue('humanReproduction');
    this.config.human.pregnancyPeriod = this.getInputValue('humanPregnancy');
    this.config.human.cooldownPeriod = this.getInputValue('humanCooldown');
    this.config.human.gompertzA = this.getInputValue('humanGompertzA');
    this.config.human.gompertzB = this.getInputValue('humanGompertzB');
    this.config.human.perceptionRange = this.getInputValue('humanPerception');
    this.config.human.moveTowardFruitProbability = this.getInputValue('humanFruitProb');

    // Wolf configuration
    this.config.wolf.startingHealth = this.getInputValue('wolfHealth');
    this.config.wolf.damageToMale = this.getInputValue('wolfDamageToMale');
    this.config.wolf.damageToFemale = this.getInputValue('wolfDamageToFemale');
    this.config.wolf.damageToDog = this.getInputValue('wolfDamageToDog');
    this.config.wolf.gompertzA = this.getInputValue('wolfGompertzA');
    this.config.wolf.gompertzB = this.getInputValue('wolfGompertzB');
    this.config.wolf.perceptionRange = this.getInputValue('wolfPerception');
    this.config.wolf.moveTowardHumanProbability = this.getInputValue('wolfHumanProb');
    this.config.wolf.spawnProbability = this.getInputValue('wolfSpawn');

    // Dog configuration
    this.config.dog.startingHealth = this.getInputValue('dogHealth');
    this.config.dog.damageToWolf = this.getInputValue('dogDamage');
    this.config.dog.gompertzA = this.getInputValue('dogGompertzA');
    this.config.dog.gompertzB = this.getInputValue('dogGompertzB');
    this.config.dog.perceptionRange = this.getInputValue('dogPerception');
    this.config.dog.moveTowardWolfProbability = this.getInputValue('dogWolfProb');
    this.config.dog.spawnProbability = this.getInputValue('dogSpawn');

    // Fruit configuration
    this.config.fruit.energyHealed = this.getInputValue('fruitHealing');
    this.config.fruit.spawnProbability = this.getInputValue('fruitSpawn');
    this.config.fruit.roundsToRipen = this.getInputValue('fruitRipen');

    // Mushroom configuration
    this.config.mushroom.energyRemoved = this.getInputValue('mushroomDamage');
    this.config.mushroom.spawnProbability = this.getInputValue('mushroomSpawn');

    // Overcrowding configuration
    this.config.overcrowding.humanThreshold = this.getInputValue('humanThreshold');
    this.config.overcrowding.humanMultiplier = this.getInputValue('humanMultiplier');
    this.config.overcrowding.animalThreshold = this.getInputValue('animalThreshold');
    this.config.overcrowding.animalMultiplier = this.getInputValue('animalMultiplier');
  }

  private handleStartGame(): void {
    if (!this.validateSpawnProbabilities()) {
      return;
    }

    this.readConfigFromInputs();
    this.hide();

    if (this.onStartCallback) {
      this.onStartCallback(this.config);
    }
  }

  show(): void {
    this.panel.style.display = 'flex';
    this.populateInputs();
    this.updateButtonTexts();
    this.updateLabels();
    // Disable the old start button in sidebar when config panel is shown
    const oldStartBtn = document.getElementById('startBtn') as HTMLButtonElement;
    if (oldStartBtn) {
      oldStartBtn.disabled = true;
    }
  }

  hide(): void {
    this.panel.style.display = 'none';
  }

  onStart(callback: (config: GameConfig) => void): void {
    this.onStartCallback = callback;
  }

  private updateButtonTexts(): void {
    const collapseBtn = document.getElementById('collapseAllBtn') as HTMLButtonElement;
    if (collapseBtn) {
      // Check current state to determine which text to show
      const sections = document.querySelectorAll('.config-section');
      const allCollapsed = Array.from(sections).every(section =>
        section.classList.contains('collapsed')
      );
      collapseBtn.textContent = allCollapsed ? i18n.t('config.expand') : i18n.t('config.collapse');
    }
  }

  private updateLabels(): void {
    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = i18n.t(key);
      }
    });
  }

  /**
   * Save current configuration to JSON file
   */
  private saveConfiguration(): void {
    // Read current configuration from inputs
    this.readConfigFromInputs();

    // Create JSON structure with version and timestamp
    const configData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      config: this.config
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(configData, null, 2);

    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    a.download = `game-of-life-config-${timestamp}.json`;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[ConfigPanel] Configuration saved:', a.download);

    // Show success notification
    showNotification(
      i18n.t('notifications.configSavedTitle'),
      i18n.t('notifications.configSaved', a.download),
      'info'
    );
  }

  /**
   * Trigger the hidden file input for loading configuration
   */
  private triggerLoadConfiguration(): void {
    const fileInput = document.getElementById('loadConfigFile') as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * Deep merge configuration with defaults, filling in missing values
   */
  private mergeWithDefaults(loaded: any): GameConfig {
    const defaults = this.getDefaultConfig();
    const warnings: string[] = [];

    // Helper to safely get a number value with validation
    const getNumber = (obj: any, path: string, defaultValue: number, min?: number, max?: number): number => {
      const value = obj;
      if (typeof value === 'number' && !isNaN(value)) {
        if (min !== undefined && value < min) {
          warnings.push(`${path} (${value}) below minimum (${min}), using ${min}`);
          return min;
        }
        if (max !== undefined && value > max) {
          warnings.push(`${path} (${value}) above maximum (${max}), using ${max}`);
          return max;
        }
        return value;
      }
      if (value !== undefined) {
        warnings.push(`${path} has invalid value, using default (${defaultValue})`);
      }
      return defaultValue;
    };

    // Merge board configuration
    const board = loaded.board || {};
    const mergedConfig: GameConfig = {
      board: {
        width: getNumber(board.width, 'board.width', defaults.board.width, 10, 100),
        height: getNumber(board.height, 'board.height', defaults.board.height, 10, 100),
        injuredThreshold: getNumber(board.injuredThreshold, 'board.injuredThreshold', defaults.board.injuredThreshold, 0, 100),
      },
      spawn: {
        maleHumanProbability: getNumber(loaded.spawn?.maleHumanProbability, 'spawn.maleHumanProbability', defaults.spawn.maleHumanProbability, 0, 1),
        femaleHumanProbability: getNumber(loaded.spawn?.femaleHumanProbability, 'spawn.femaleHumanProbability', defaults.spawn.femaleHumanProbability, 0, 1),
        wolfProbability: getNumber(loaded.spawn?.wolfProbability, 'spawn.wolfProbability', defaults.spawn.wolfProbability, 0, 1),
        dogProbability: getNumber(loaded.spawn?.dogProbability, 'spawn.dogProbability', defaults.spawn.dogProbability, 0, 1),
        fruitProbability: getNumber(loaded.spawn?.fruitProbability, 'spawn.fruitProbability', defaults.spawn.fruitProbability, 0, 1),
        mushroomProbability: getNumber(loaded.spawn?.mushroomProbability, 'spawn.mushroomProbability', defaults.spawn.mushroomProbability, 0, 1),
      },
      human: {
        startingHealth: getNumber(loaded.human?.startingHealth, 'human.startingHealth', defaults.human.startingHealth, 1, 200),
        maleVsMaleDamage: getNumber(loaded.human?.maleVsMaleDamage, 'human.maleVsMaleDamage', defaults.human.maleVsMaleDamage, 0, 100),
        maleVsWolfDamage: getNumber(loaded.human?.maleVsWolfDamage, 'human.maleVsWolfDamage', defaults.human.maleVsWolfDamage, 0, 100),
        reproductionProbability: getNumber(loaded.human?.reproductionProbability, 'human.reproductionProbability', defaults.human.reproductionProbability, 0, 1),
        pregnancyPeriod: getNumber(loaded.human?.pregnancyPeriod, 'human.pregnancyPeriod', defaults.human.pregnancyPeriod, 1, 100),
        cooldownPeriod: getNumber(loaded.human?.cooldownPeriod, 'human.cooldownPeriod', defaults.human.cooldownPeriod, 0, 100),
        perceptionRange: getNumber(loaded.human?.perceptionRange, 'human.perceptionRange', defaults.human.perceptionRange, 0, 20),
        moveTowardFruitProbability: getNumber(loaded.human?.moveTowardFruitProbability, 'human.moveTowardFruitProbability', defaults.human.moveTowardFruitProbability, 0, 1),
        gompertzA: getNumber(loaded.human?.gompertzA, 'human.gompertzA', defaults.human.gompertzA, 0),
        gompertzB: getNumber(loaded.human?.gompertzB, 'human.gompertzB', defaults.human.gompertzB, 0),
      },
      wolf: {
        startingHealth: getNumber(loaded.wolf?.startingHealth, 'wolf.startingHealth', defaults.wolf.startingHealth, 1, 200),
        damageToMale: getNumber(loaded.wolf?.damageToMale, 'wolf.damageToMale', defaults.wolf.damageToMale, 0, 100),
        damageToFemale: getNumber(loaded.wolf?.damageToFemale, 'wolf.damageToFemale', defaults.wolf.damageToFemale, 0, 100),
        damageToDog: getNumber(loaded.wolf?.damageToDog, 'wolf.damageToDog', defaults.wolf.damageToDog, 0, 100),
        perceptionRange: getNumber(loaded.wolf?.perceptionRange, 'wolf.perceptionRange', defaults.wolf.perceptionRange, 0, 20),
        moveTowardHumanProbability: getNumber(loaded.wolf?.moveTowardHumanProbability, 'wolf.moveTowardHumanProbability', defaults.wolf.moveTowardHumanProbability, 0, 1),
        spawnProbability: getNumber(loaded.wolf?.spawnProbability, 'wolf.spawnProbability', defaults.wolf.spawnProbability, 0, 1),
        gompertzA: getNumber(loaded.wolf?.gompertzA, 'wolf.gompertzA', defaults.wolf.gompertzA, 0),
        gompertzB: getNumber(loaded.wolf?.gompertzB, 'wolf.gompertzB', defaults.wolf.gompertzB, 0),
      },
      dog: {
        startingHealth: getNumber(loaded.dog?.startingHealth, 'dog.startingHealth', defaults.dog.startingHealth, 1, 200),
        damageToWolf: getNumber(loaded.dog?.damageToWolf, 'dog.damageToWolf', defaults.dog.damageToWolf, 0, 100),
        perceptionRange: getNumber(loaded.dog?.perceptionRange, 'dog.perceptionRange', defaults.dog.perceptionRange, 0, 20),
        moveTowardWolfProbability: getNumber(loaded.dog?.moveTowardWolfProbability, 'dog.moveTowardWolfProbability', defaults.dog.moveTowardWolfProbability, 0, 1),
        spawnProbability: getNumber(loaded.dog?.spawnProbability, 'dog.spawnProbability', defaults.dog.spawnProbability, 0, 1),
        gompertzA: getNumber(loaded.dog?.gompertzA, 'dog.gompertzA', defaults.dog.gompertzA, 0),
        gompertzB: getNumber(loaded.dog?.gompertzB, 'dog.gompertzB', defaults.dog.gompertzB, 0),
      },
      fruit: {
        // Support both old (energyValue) and new (energyHealed) property names
        energyHealed: getNumber(loaded.fruit?.energyHealed ?? loaded.fruit?.energyValue, 'fruit.energyHealed', defaults.fruit.energyHealed, 0, 200),
        spawnProbability: getNumber(loaded.fruit?.spawnProbability, 'fruit.spawnProbability', defaults.fruit.spawnProbability, 0, 1),
        roundsToRipen: getNumber(loaded.fruit?.roundsToRipen, 'fruit.roundsToRipen', defaults.fruit.roundsToRipen, 0, 100),
      },
      mushroom: {
        // Support both old (damageValue) and new (energyRemoved) property names
        energyRemoved: getNumber(loaded.mushroom?.energyRemoved ?? loaded.mushroom?.damageValue, 'mushroom.energyRemoved', defaults.mushroom.energyRemoved, 0, 200),
        spawnProbability: getNumber(loaded.mushroom?.spawnProbability, 'mushroom.spawnProbability', defaults.mushroom.spawnProbability, 0, 1),
      },
      overcrowding: {
        humanThreshold: getNumber(loaded.overcrowding?.humanThreshold, 'overcrowding.humanThreshold', defaults.overcrowding.humanThreshold, 10, 1000),
        humanMultiplier: getNumber(loaded.overcrowding?.humanMultiplier, 'overcrowding.humanMultiplier', defaults.overcrowding.humanMultiplier, 1, 10),
        animalThreshold: getNumber(loaded.overcrowding?.animalThreshold, 'overcrowding.animalThreshold', defaults.overcrowding.animalThreshold, 10, 1000),
        animalMultiplier: getNumber(loaded.overcrowding?.animalMultiplier, 'overcrowding.animalMultiplier', defaults.overcrowding.animalMultiplier, 1, 10),
      },
    };

    // Log warnings if any
    if (warnings.length > 0) {
      console.warn('[ConfigPanel] Configuration warnings:', warnings);
    }

    return mergedConfig;
  }

  /**
   * Load configuration from uploaded JSON file (resilient mode)
   */
  private loadConfiguration(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Support both wrapped (with version/timestamp) and direct config objects
        const loadedConfig = data.config || data;

        // Log version info if present
        if (data.version) {
          console.log('[ConfigPanel] Loading config version:', data.version);
        }

        // Resilient merge with defaults - fills in missing values, clamps invalid ones
        this.config = this.mergeWithDefaults(loadedConfig);

        // Update UI
        this.populateInputs();
        this.updateExpectedCounts();
        this.validateSpawnProbabilities();

        console.log('[ConfigPanel] Configuration loaded successfully from:', file.name);

        // Show success notification
        showNotification(
          i18n.t('notifications.configLoadedTitle'),
          i18n.t('notifications.configLoaded', file.name),
          'info'
        );
      } catch (error) {
        console.error('[ConfigPanel] Error loading configuration:', error);

        // Show error notification
        const errorMessage = error instanceof Error ? error.message : 'Invalid JSON file';
        showNotification(
          i18n.t('notifications.configLoadErrorTitle'),
          i18n.t('notifications.configLoadError', errorMessage),
          'error'
        );
      }
    };

    reader.readAsText(file);

    // Reset file input so the same file can be loaded again if needed
    input.value = '';
  }

  getConfig(): GameConfig {
    return this.config;
  }
}
