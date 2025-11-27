import type { Board } from './Board';
import type { Renderer } from './Renderer';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Sex, EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EatingSystem } from '../systems/EatingSystem';
import { ReproductionSystem } from '../systems/ReproductionSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { BirthSystem } from '../systems/BirthSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { AnimationSystem, type MovementRecord } from './AnimationSystem';

import type { GameConfig } from '../ui/ConfigPanel';

export class Game {
  private board: Board;
  private renderer: Renderer;
  private movementSystem: MovementSystem;
  private combatSystem: CombatSystem;
  private eatingSystem: EatingSystem;
  private reproductionSystem: ReproductionSystem;
  private deathSystem: DeathSystem;
  private birthSystem: BirthSystem;
  private spawnSystem: SpawnSystem;
  private animationSystem: AnimationSystem;
  private isRunning: boolean;
  private roundInterval: number | null;
  private populationHistory: number[]; // Track human population over time
  private currentSpeed: number; // Current simulation speed in ms
  private animationDuration: number; // Animation duration in ms
  private isAnimating: boolean; // Track if animations are currently running
  private isStepping: boolean; // Track if we're executing a step (allows animations during step mode)
  private animationFrameId: number | null; // Track animation frame request ID
  private currentConfig: GameConfig;
  public onStepComplete?: () => void; // Callback for when step completes (for UI updates)

  constructor(board: Board, renderer: Renderer) {
    this.board = board;
    this.renderer = renderer;
    this.movementSystem = new MovementSystem(renderer);
    this.combatSystem = new CombatSystem(renderer);
    this.eatingSystem = new EatingSystem(renderer);
    this.reproductionSystem = new ReproductionSystem(renderer);
    this.deathSystem = new DeathSystem(renderer);
    this.birthSystem = new BirthSystem(renderer);
    this.spawnSystem = new SpawnSystem(renderer);
    this.animationSystem = new AnimationSystem();
    this.isRunning = false;
    this.roundInterval = null;
    this.populationHistory = [];
    this.currentSpeed = DEFAULT_CONFIG.simulation.defaultSpeed;
    this.animationDuration = 300; // Default 300ms animation duration
    this.isAnimating = false;
    this.isStepping = false;
    this.animationFrameId = null;
    this.currentConfig = this.createDefaultConfig();
  }

  private createDefaultConfig(): GameConfig {
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

  updateConfig(config: GameConfig): void {
    this.currentConfig = config;
    // TODO: Update systems with new config
    // this.movementSystem.updateConfig(config);
    // this.combatSystem.updateConfig(config);
    // this.eatingSystem.updateConfig(config);
    // this.reproductionSystem.updateConfig(config);
    // this.deathSystem.updateConfig(config);
    // this.birthSystem.updateConfig(config);
    // this.spawnSystem.updateConfig(config);
  }

  /**
   * Initialize board with random entities using provided config
   */
  initializeBoard(config?: GameConfig): void {
    const gameConfig = config || this.currentConfig;
    console.log('[Game] Initializing board with entities...');

    let maleCount = 0;
    let femaleCount = 0;
    let wolfCount = 0;
    let dogCount = 0;
    let fruitCount = 0;
    let mushroomCount = 0;

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        // Weighted random selection using cumulative probabilities
        const rand = Math.random();
        const cumulativeMale = gameConfig.spawn.maleHumanProbability;
        const cumulativeFemale = cumulativeMale + gameConfig.spawn.femaleHumanProbability;
        const cumulativeWolf = cumulativeFemale + gameConfig.spawn.wolfProbability;
        const cumulativeDog = cumulativeWolf + gameConfig.spawn.dogProbability;
        const cumulativeFruit = cumulativeDog + gameConfig.spawn.fruitProbability;
        const cumulativeMushroom = cumulativeFruit + gameConfig.spawn.mushroomProbability;

        if (rand < cumulativeMale) {
          this.board.setEntity(x, y, new Human(x, y, Sex.MALE, gameConfig.human.startingHealth, gameConfig.human.gompertzA, gameConfig.human.gompertzB));
          maleCount++;
        } else if (rand < cumulativeFemale) {
          this.board.setEntity(x, y, new Human(x, y, Sex.FEMALE, gameConfig.human.startingHealth, gameConfig.human.gompertzA, gameConfig.human.gompertzB));
          femaleCount++;
        } else if (rand < cumulativeWolf) {
          this.board.setEntity(x, y, new Wolf(x, y, gameConfig.wolf.startingHealth, gameConfig.wolf.gompertzA, gameConfig.wolf.gompertzB));
          wolfCount++;
        } else if (rand < cumulativeDog) {
          this.board.setEntity(x, y, new Dog(x, y, gameConfig.dog.startingHealth, gameConfig.dog.gompertzA, gameConfig.dog.gompertzB));
          dogCount++;
        } else if (rand < cumulativeFruit) {
          this.board.setEntity(x, y, new Fruit(x, y, gameConfig.fruit.energyHealed, gameConfig.fruit.roundsToRipen));
          fruitCount++;
        } else if (rand < cumulativeMushroom) {
          this.board.setEntity(x, y, new Mushroom(x, y, gameConfig.mushroom.energyRemoved));
          mushroomCount++;
        }
        // else: cell remains empty
      }
    }

    console.log(`[Game] Spawned: ${maleCount} males, ${femaleCount} females, ${wolfCount} wolves, ${dogCount} dogs, ${fruitCount} fruits, ${mushroomCount} mushrooms`);

    // Record initial population
    this.recordPopulation();

    // Mark all cells dirty for initial render
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);
  }

  /**
   * Execute one complete round
   */
  executeRound(): void {
    // Prevent overlapping rounds if animations are still running
    if (this.isAnimating) {
      console.log('[Game] Skipping round - animations still in progress');
      return;
    }

    console.log(`\n=== Round ${this.board.round + 1} ===`);

    // Phase 1: Movement
    const movements = this.movementSystem.execute(this.board);

    // If there are movements, animate them before proceeding
    if (movements.length > 0) {
      this.isAnimating = true;
      this.animateMovements(movements, () => {
        // Animation complete callback - continue with remaining phases
        this.isAnimating = false;
        this.isStepping = false; // Clear step flag when animations complete
        this.continueRoundAfterAnimation();
        // Notify UI that step is complete (for re-enabling step button)
        this.onStepComplete?.();
      });
      return; // Exit early, continueRoundAfterAnimation will be called when animations complete
    }

    // No movements, proceed directly to remaining phases
    this.isStepping = false; // Clear step flag
    this.continueRoundAfterAnimation();
    // Notify UI that step is complete
    this.onStepComplete?.();
  }

  /**
   * Animate movements and wait for completion
   */
  private animateMovements(movements: MovementRecord[], onComplete: () => void): void {
    // Start animations
    this.animationSystem.startAnimations(movements, this.animationDuration);

    // Mark all animation paths as dirty once (optimization)
    this.renderer.markAnimationPaths(this.board, this.animationSystem);

    // Enter animation loop using requestAnimationFrame
    const animationLoop = () => {
      // Check if game was paused during animation (but allow animations during step mode)
      if (!this.isRunning && !this.isStepping && this.isAnimating) {
        // Game paused (not stepping) - stop animation loop and sync positions
        this.stopAnimations(movements);
        return;
      }

      // Update animation progress
      this.animationSystem.update();

      // Render animation frame
      this.renderer.renderAnimationFrame(this.board, this.animationSystem);

      // Continue animation loop if still animating
      if (this.animationSystem.isAnimating()) {
        this.animationFrameId = requestAnimationFrame(animationLoop);
      } else {
        // All animations complete - sync visual positions to logical positions
        this.completeAnimations(movements, onComplete);
      }
    };

    // Start animation loop
    this.animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Stop animations and sync visual positions to logical positions
   */
  private stopAnimations(movements?: MovementRecord[]): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Sync visual positions to logical positions for all animating entities
    const animatingEntities = this.animationSystem.getAnimatingEntities();
    if (movements) {
      // Use provided movements array if available
      movements.forEach(movement => {
        movement.entity.syncVisualPosition();
      });
    } else {
      // Otherwise sync all currently animating entities
      animatingEntities.forEach(entity => {
        entity.syncVisualPosition();
      });
    }
    
    this.animationSystem.stopAll();
    // Final render to ensure entities are at logical positions
    this.renderer.render(this.board);
    this.isAnimating = false;
    console.log('[Game] Animations stopped due to pause/reset');
  }

  /**
   * Complete animations and continue round
   */
  private completeAnimations(movements: MovementRecord[], onComplete: () => void): void {
    // Sync visual positions to logical positions
    movements.forEach(movement => {
      movement.entity.syncVisualPosition();
    });
    // Final render to ensure entities are at logical positions
    this.renderer.render(this.board);
    this.isAnimating = false;
    this.animationFrameId = null;
    // Call completion callback
    onComplete();
  }

  /**
   * Continue round execution after movement animations complete
   */
  private continueRoundAfterAnimation(): void {
    // Phase 2: Combat
    this.combatSystem.execute(this.board);

    // Phase 3: Eating
    this.eatingSystem.execute(this.board);

    // Phase 4: Reproduction
    this.reproductionSystem.execute(this.board);

    // Phase 5: Death
    this.deathSystem.execute(this.board);

    // Phase 6: Birth
    this.birthSystem.execute(this.board);

    // Phase 7: Spawn (plants and animals)
    this.spawnSystem.execute(this.board, this.currentConfig);

    // Increment round counter
    this.board.incrementRound();

    // Record population after round
    this.recordPopulation();

    // Render changes (if not already rendered by animation)
    if (!this.animationSystem.isAnimating()) {
      this.renderer.render(this.board);
    }
  }

  /**
   * Start continuous execution
   */
  start(): void {
    if (this.isRunning) return;

    console.log('[Game] Starting continuous execution...');
    this.isRunning = true;
    this.roundInterval = window.setInterval(() => {
      this.executeRound();
    }, this.currentSpeed);
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (!this.isRunning) return;

    console.log('[Game] Pausing execution...');
    this.isRunning = false;
    if (this.roundInterval !== null) {
      clearInterval(this.roundInterval);
      this.roundInterval = null;
    }
    // If animations are running, they will be stopped in the animation loop
    // The stopAnimations() method will be called automatically
  }

  /**
   * Execute single step
   */
  step(): void {
    // Prevent stepping if animations are still running
    if (this.isAnimating) {
      console.log('[Game] Cannot step - animations still in progress');
      return;
    }
    
    // Set step flag to allow animations during step mode
    this.isStepping = true;
    this.executeRound();
  }

  /**
   * Check if animations are currently running
   */
  isAnimatingNow(): boolean {
    return this.isAnimating;
  }

  /**
   * Check if game is running
   */
  running(): boolean {
    return this.isRunning;
  }

  /**
   * Get current board
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * Reset the game to initial state
   */
  reset(): void {
    console.log('[Game] Resetting game...');

    // Pause if running
    if (this.isRunning) {
      this.pause();
    }

    // Stop any running animations
    if (this.isAnimating) {
      this.stopAnimations();
    }

    // Clear the board
    this.board.reset();

    // Clear population history
    this.populationHistory = [];

    // Mark all cells dirty and render empty board
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);

    console.log('[Game] Game reset complete');
  }

  /**
   * Record current human population
   */
  private recordPopulation(): void {
    const entities = this.board.getAllEntities();
    const humanCount = entities.filter(
      e => e.type === EntityType.MALE || e.type === EntityType.FEMALE
    ).length;
    this.populationHistory.push(humanCount);
  }

  /**
   * Get population history for graphing
   */
  getPopulationHistory(): number[] {
    return this.populationHistory;
  }

  /**
   * Set simulation speed
   */
  setSpeed(speedMs: number): void {
    this.currentSpeed = speedMs;

    // If currently running, restart with new speed
    if (this.isRunning) {
      this.pause();
      this.start();
    }
  }

  /**
   * Get current speed
   */
  getSpeed(): number {
    return this.currentSpeed;
  }

  /**
   * Set animation duration
   */
  setAnimationDuration(durationMs: number): void {
    this.animationDuration = durationMs;
  }

  /**
   * Get animation duration
   */
  getAnimationDuration(): number {
    return this.animationDuration;
  }
}
