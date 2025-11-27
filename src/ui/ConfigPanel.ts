import { DEFAULT_CONFIG } from '../config';

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
    gompertzA: number;
    gompertzB: number;
  };
  dog: {
    startingHealth: number;
    damageToWolf: number;
    perceptionRange: number;
    moveTowardWolfProbability: number;
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
        gompertzA: DEFAULT_CONFIG.wolf.gompertzA,
        gompertzB: DEFAULT_CONFIG.wolf.gompertzB,
      },
      dog: {
        startingHealth: DEFAULT_CONFIG.dog.startingHealth,
        damageToWolf: DEFAULT_CONFIG.dog.damageToWolf,
        perceptionRange: DEFAULT_CONFIG.dog.perceptionRange,
        moveTowardWolfProbability: DEFAULT_CONFIG.dog.moveTowardWolfProbability,
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

    // Start game button
    const startBtn = document.getElementById('startGameBtn');
    startBtn?.addEventListener('click', () => this.handleStartGame());

    // Collapsible sections
    const sectionHeaders = document.querySelectorAll('.config-section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => this.toggleSection(header as HTMLElement));
    });
  }

  private toggleSection(header: HTMLElement): void {
    const section = header.parentElement;
    section?.classList.toggle('collapsed');
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

    if (total > 1.0) {
      if (validationMsg) {
        validationMsg.textContent = `❌ Total spawn probability ${(total * 100).toFixed(1)}% exceeds 100%`;
        validationMsg.className = 'validation-error';
      }
      if (startBtn) startBtn.disabled = true;
      return false;
    } else if (total > 0.9) {
      if (validationMsg) {
        validationMsg.textContent = `⚠️ Warning: Total spawn probability ${(total * 100).toFixed(1)}% is very high`;
        validationMsg.className = 'validation-warning';
      }
      if (startBtn) startBtn.disabled = false;
      return true;
    } else {
      if (validationMsg) {
        validationMsg.textContent = `✓ Total spawn probability: ${(total * 100).toFixed(1)}%`;
        validationMsg.className = 'validation-success';
      }
      if (startBtn) startBtn.disabled = false;
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
      expectedText.textContent = `Expected creatures: ~${expectedMales}♂ ${expectedFemales}♀ ${expectedWolves}🐺 ${expectedDogs}🐕 ${expectedFruits}🍎 ${expectedMushrooms}🍄`;
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
  }

  hide(): void {
    this.panel.style.display = 'none';
  }

  onStart(callback: (config: GameConfig) => void): void {
    this.onStartCallback = callback;
  }

  getConfig(): GameConfig {
    return this.config;
  }
}
