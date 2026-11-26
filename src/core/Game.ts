import type { Board } from './Board';
import type { Renderer } from './Renderer';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Sex } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EatingSystem } from '../systems/EatingSystem';
import { ReproductionSystem } from '../systems/ReproductionSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { BirthSystem } from '../systems/BirthSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { AnimationSystem, type MovementRecord } from './AnimationSystem';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';

import type { GameConfig } from '../ui/ConfigPanel';

/** Recursively freeze an object graph (plain data only). */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/** Default GameConfig derived from DEFAULT_CONFIG (without UI-only sections). */
function createDefaultConfig(): GameConfig {
  const { simulation: _simulation, ...config } = structuredClone(DEFAULT_CONFIG);
  return config;
}

export const CONFIG_LOCKED_MESSAGE = 'Configuration is locked while a game is in progress';

/**
 * Orchestrates the seven-phase round:
 * 1 Movement → 2 Combat → 3 Eating → 4 Reproduction → 5 Death → 6 Birth → 7 Spawn.
 * Movement is animated; the remaining phases run once the animation has finished
 * (or immediately when paused mid-animation, so a round is never half-done).
 */
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
  private nextRoundTimeoutId: number | null; // Next scheduled round (continuous or stepped)
  private populationHistory: number[]; // Human population after each round
  private currentSpeed: number; // ms per round
  private animationDuration: number; // ms per movement animation
  private isAnimating: boolean; // Movement animation of the current round in progress
  private animationFrameId: number | null;
  private currentMovements: MovementRecord[] | null; // Movements of the round being animated
  private pendingSteps: number; // Rounds left in the current step()/stepRounds() sequence
  private config: Readonly<GameConfig>;
  private configLocked: boolean;

  /** Fired after every completed round (continuous or stepped). */
  public onRoundComplete?: () => void;
  /** Fired when a step()/stepRounds() sequence has fully finished (never during continuous run). */
  public onStepComplete?: () => void;

  constructor(board: Board, renderer: Renderer) {
    this.board = board;
    this.renderer = renderer;
    this.config = deepFreeze(createDefaultConfig());
    this.configLocked = false;
    this.movementSystem = new MovementSystem(renderer);
    this.combatSystem = new CombatSystem(renderer);
    this.eatingSystem = new EatingSystem(renderer);
    this.reproductionSystem = new ReproductionSystem(renderer);
    this.deathSystem = new DeathSystem(renderer);
    this.birthSystem = new BirthSystem(renderer);
    this.spawnSystem = new SpawnSystem(renderer);
    this.animationSystem = new AnimationSystem();
    this.isRunning = false;
    this.nextRoundTimeoutId = null;
    this.populationHistory = [];
    this.currentSpeed = DEFAULT_CONFIG.simulation.defaultSpeed;
    this.animationDuration = this.currentSpeed; // Sync initial duration with speed for fluidity
    this.isAnimating = false;
    this.animationFrameId = null;
    this.currentMovements = null;
    this.pendingSteps = 0;
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Replace the configuration. Stores a deep-frozen copy.
   * @throws Error when a game is in progress (between initializeBoard() and reset())
   */
  updateConfig(config: GameConfig): void {
    if (this.configLocked) {
      throw new Error(CONFIG_LOCKED_MESSAGE);
    }
    this.applyConfig(config);
    debugLog('[Game] Configuration updated:', this.config);
  }

  getConfig(): Readonly<GameConfig> {
    return this.config;
  }

  isConfigLocked(): boolean {
    return this.configLocked;
  }

  private applyConfig(config: GameConfig): void {
    if (config !== this.config) {
      this.config = deepFreeze(structuredClone(config));
    }
    this.renderer.setInjuredThreshold(this.config.board.injuredThreshold);
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  /**
   * Start a new game: clear the board, populate it randomly using the given (or
   * current) configuration and lock the configuration until reset().
   */
  initializeBoard(config?: GameConfig): void {
    this.halt();
    if (config) this.applyConfig(config);
    this.configLocked = true;
    const gameConfig = this.config;

    this.board.reset();
    this.populationHistory = [];
    this.renderer.clearVisualEffects();
    debugLog('[Game] Initializing board with entities...');

    const { spawn, human, wolf, dog, fruit, mushroom } = gameConfig;
    const cumulativeMale = spawn.maleHumanProbability;
    const cumulativeFemale = cumulativeMale + spawn.femaleHumanProbability;
    const cumulativeWolf = cumulativeFemale + spawn.wolfProbability;
    const cumulativeDog = cumulativeWolf + spawn.dogProbability;
    const cumulativeFruit = cumulativeDog + spawn.fruitProbability;
    const cumulativeMushroom = cumulativeFruit + spawn.mushroomProbability;

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        // Weighted random selection using cumulative probabilities
        const rand = Random.next();
        if (rand < cumulativeFemale) {
          const sex = rand < cumulativeMale ? Sex.MALE : Sex.FEMALE;
          this.board.setEntity(
            x,
            y,
            new Human(
              x,
              y,
              sex,
              human.startingHealth,
              human.gompertzA,
              human.gompertzB,
              undefined,
              human.moveTowardFruitProbability,
            ),
          );
        } else if (rand < cumulativeWolf) {
          this.board.setEntity(x, y, new Wolf(x, y, wolf.startingHealth, wolf.gompertzA, wolf.gompertzB));
        } else if (rand < cumulativeDog) {
          this.board.setEntity(x, y, new Dog(x, y, dog.startingHealth, dog.gompertzA, dog.gompertzB));
        } else if (rand < cumulativeFruit) {
          this.board.setEntity(x, y, new Fruit(x, y, fruit.energyHealed, fruit.roundsToRipen));
        } else if (rand < cumulativeMushroom) {
          this.board.setEntity(x, y, new Mushroom(x, y, mushroom.energyRemoved));
        }
        // else: cell remains empty
      }
    }

    // Record initial population
    this.recordPopulation();

    // Mark all cells dirty for initial render
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);
  }

  // ---------------------------------------------------------------------------
  // Round execution
  // ---------------------------------------------------------------------------

  /**
   * Execute one complete round. Movement happens immediately; if anything moved and
   * animations are enabled, the remaining phases run when the animation finishes.
   */
  executeRound(): void {
    if (this.isAnimating) return; // never start a round while one is mid-animation

    debugLog(`[Game] === Round ${this.board.round + 1} ===`);

    // Phase 1: Movement
    const movements = this.movementSystem.execute(this.board, this.config);

    if (movements.length > 0 && this.animationDuration > 0) {
      this.animateMovements(movements);
      return;
    }

    this.finishRound(false);
  }

  /**
   * Phases 2–7 in strict PRD order, then the round counter and population history.
   */
  private runRemainingPhases(): void {
    const config = this.config;
    this.combatSystem.execute(this.board, config); // Phase 2
    this.eatingSystem.execute(this.board, config); // Phase 3
    this.reproductionSystem.execute(this.board, config); // Phase 4
    this.deathSystem.execute(this.board, config); // Phase 5
    this.birthSystem.execute(this.board, config); // Phase 6
    this.spawnSystem.execute(this.board, config); // Phase 7

    this.board.incrementRound();
    this.recordPopulation();
  }

  /** Complete the current round (phases 2–7), notify, and schedule what comes next. */
  private finishRound(wasAnimated: boolean): void {
    this.runRemainingPhases();
    this.renderer.render(this.board);
    this.onRoundComplete?.();

    if (this.isRunning) {
      this.scheduleNextRound(wasAnimated);
      return;
    }

    if (this.pendingSteps > 0) {
      this.pendingSteps--;
      if (this.pendingSteps > 0) {
        this.scheduleNextRound(wasAnimated);
      } else {
        this.onStepComplete?.();
      }
    }
  }

  /**
   * Animate movements, then finish the round.
   */
  private animateMovements(movements: MovementRecord[]): void {
    this.isAnimating = true;
    this.currentMovements = movements;
    this.animationSystem.startAnimations(movements, this.animationDuration);

    // Mark all animation paths as dirty once (optimization)
    this.renderer.markAnimationPaths(this.board, this.animationSystem);

    const animationLoop = () => {
      if (!this.isAnimating) return; // completed synchronously (pause) or halted (reset)
      this.animationSystem.update();
      this.renderer.renderAnimationFrame(this.board, this.animationSystem);

      if (this.animationSystem.isAnimating()) {
        this.animationFrameId = requestAnimationFrame(animationLoop);
      } else {
        this.animationFrameId = null;
        this.endAnimation(false);
        this.finishRound(true);
      }
    };

    this.animationFrameId = requestAnimationFrame(animationLoop);
  }

  /**
   * Stop the animation loop and snap every moved entity to its logical position.
   * @param interrupted true when cut short (pause/reset): sprites may be mid-cell, so
   *   the whole board is redrawn.
   */
  private endAnimation(interrupted: boolean): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.currentMovements) {
      for (const movement of this.currentMovements) {
        movement.entity.syncVisualPosition();
      }
    }
    for (const entity of this.animationSystem.getAnimatingEntities()) {
      entity.syncVisualPosition();
    }
    this.animationSystem.stopAll();
    this.currentMovements = null;
    this.isAnimating = false;
    if (interrupted) this.renderer.markAllDirty(this.board);
  }

  /**
   * Schedule the next round. After an animated round the animation already used the
   * round's time budget, so the next round starts immediately.
   */
  private scheduleNextRound(wasAnimated: boolean): void {
    this.clearScheduledRound();
    const delay = wasAnimated ? 0 : this.currentSpeed;
    this.nextRoundTimeoutId = window.setTimeout(() => {
      this.nextRoundTimeoutId = null;
      this.executeRound();
    }, delay);
  }

  private clearScheduledRound(): void {
    if (this.nextRoundTimeoutId !== null) {
      clearTimeout(this.nextRoundTimeoutId);
      this.nextRoundTimeoutId = null;
    }
  }

  /** Stop everything without finishing the current round (used by reset/initialize). */
  private halt(): void {
    this.isRunning = false;
    this.pendingSteps = 0;
    this.clearScheduledRound();
    if (this.isAnimating) {
      this.endAnimation(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  /**
   * Start continuous execution. Takes over an in-progress step sequence.
   */
  start(): void {
    if (this.isRunning) return;
    debugLog('[Game] Starting continuous execution...');
    this.isRunning = true;
    this.pendingSteps = 0;

    // A round mid-animation will schedule the next one when it finishes
    if (this.isAnimating) return;

    this.clearScheduledRound();
    this.executeRound();
  }

  /**
   * Pause execution. If paused mid movement-animation, positions snap to their
   * destinations and the rest of the round (combat…spawn) completes immediately.
   */
  pause(): void {
    if (!this.isRunning) return;
    debugLog('[Game] Pausing execution...');
    this.isRunning = false;
    this.clearScheduledRound();

    if (this.isAnimating) {
      this.endAnimation(true);
      this.finishRound(true);
    }
  }

  /** Execute a single round (ignored while running or while a step is in progress). */
  step(): void {
    this.stepRounds(1);
  }

  /**
   * Execute `n` rounds one after another (each fully animated), then fire
   * onStepComplete once. Ignored while running or while a step is in progress.
   */
  stepRounds(n: number): void {
    const rounds = Math.floor(n);
    if (!(rounds >= 1)) return;
    if (this.isRunning || this.isAnimating || this.pendingSteps > 0) {
      debugLog('[Game] Cannot step - simulation busy');
      return;
    }
    this.pendingSteps = rounds;
    this.executeRound();
  }

  /** True while a movement animation is in progress. */
  isAnimatingNow(): boolean {
    return this.isAnimating;
  }

  /** True while a step()/stepRounds() sequence is in progress. */
  isStepping(): boolean {
    return this.pendingSteps > 0;
  }

  running(): boolean {
    return this.isRunning;
  }

  getBoard(): Board {
    return this.board;
  }

  /**
   * Reset to an empty board and unlock the configuration.
   */
  reset(): void {
    debugLog('[Game] Resetting game...');
    this.halt();
    this.board.reset();
    this.populationHistory = [];
    this.configLocked = false;
    this.renderer.clearVisualEffects();
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);
  }

  private recordPopulation(): void {
    let humanCount = 0;
    for (const entity of this.board.getAllEntities()) {
      if (entity instanceof Human) humanCount++;
    }
    this.populationHistory.push(humanCount);
  }

  /** Human population after initialization and after each round. */
  getPopulationHistory(): number[] {
    return this.populationHistory;
  }

  /**
   * Set simulation speed (ms per round). Movement animations use the same duration.
   */
  setSpeed(speedMs: number): void {
    this.currentSpeed = speedMs;
    this.animationDuration = speedMs;

    // Waiting for the next round: reschedule with the new delay
    if (this.nextRoundTimeoutId !== null && !this.isAnimating) {
      this.scheduleNextRound(false);
    }
  }

  getSpeed(): number {
    return this.currentSpeed;
  }

  /** Movement animation duration in ms (0 disables animation). */
  setAnimationDuration(durationMs: number): void {
    this.animationDuration = durationMs;
  }

  getAnimationDuration(): number {
    return this.animationDuration;
  }
}
