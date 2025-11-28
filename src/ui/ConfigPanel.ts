import { DEFAULT_CONFIG } from '../config';
import { i18n } from '../i18n/i18n';

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
    damageToHuman: number;
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
        damageToHuman: DEFAULT_CONFIG.wolf.damageToHuman,
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

    // Listen for language changes to update button text
    i18n.onLanguageChange(() => {
      this.updateButtonTexts();
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
    this.setInputValue('wolfDamage', this.config.wolf.damageToHuman);
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
    this.config.wolf.damageToHuman = this.getInputValue('wolfDamage');
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

  getConfig(): GameConfig {
    return this.config;
  }
}
