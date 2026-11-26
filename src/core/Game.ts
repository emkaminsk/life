import type { Board } from './Board';
import type { Renderer } from './Renderer';
import { Human } from '../entities/Human';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EatingSystem } from '../systems/EatingSystem';
import { ReproductionSystem } from '../systems/ReproductionSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { BirthSystem } from '../systems/BirthSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { AnimationSystem, type MovementRecord } from './AnimationSystem';
import { createEntity } from './entityFactory';
import type { BoardLayout, DeathRecord, EndReason, PlaceableKind, RoundEvents, RoundRecord } from './simulationEvents';
import { GameHistory, emptyRoundEvents } from './GameHistory';
import { EndConditionTracker } from './endConditions';
import { type ChallengeDef, type ChallengeProgress, evaluateChallenge } from './challenges';
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

/** Options for Game.initializeBoardAsync(). */
export interface InitializeAsyncOptions {
  /** Called with the fraction of rows populated (0 at the start, 1 when done). */
  onProgress?: (fraction: number) => void;
  /** Number of row chunks; the event loop is yielded to between chunks (default 10). */
  chunks?: number;
  /** How to yield between chunks (default: a 0 ms timeout). */
  yieldToEventLoop?: () => Promise<void>;
}

const yieldWithTimeout = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// --- Adapters for system return values -------------------------------------
// Systems report round events (see simulationEvents.ts). They are read defensively
// so Game tolerates systems (or test spies) that return nothing.

function asDeaths(value: unknown): DeathRecord[] {
  return Array.isArray(value) ? (value as DeathRecord[]) : [];
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function field(value: unknown, key: string): unknown {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
}

/** Movement returns MovementRecord[] (optionally carrying `deaths`) or { movements, deaths }. */
function readMovementResult(result: unknown): { movements: MovementRecord[]; deaths: DeathRecord[] } {
  if (Array.isArray(result)) {
    return { movements: result as MovementRecord[], deaths: asDeaths(field(result, 'deaths')) };
  }
  const movements = field(result, 'movements');
  return {
    movements: Array.isArray(movements) ? (movements as MovementRecord[]) : [],
    deaths: asDeaths(field(result, 'deaths')),
  };
}

/**
 * Orchestrates the seven-phase round:
 * 1 Movement → 2 Combat → 3 Eating → 4 Reproduction → 5 Death → 6 Birth → 7 Spawn.
 * Movement is animated; the remaining phases run once the animation has finished
 * (or immediately when paused mid-animation, so a round is never half-done).
 * After every round a RoundRecord is added to the history and the end conditions
 * are checked; when one holds the game stops and onGameOver fires.
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
  private history: GameHistory; // One RoundRecord for round 0 and after each round
  private endConditions: EndConditionTracker;
  private endReason: EndReason | null;
  private roundEvents: RoundEvents; // Events collected during the round in progress
  private initToken: number; // Bumped by every init and reset(); stale async inits abort
  private initializing: boolean; // initializeBoardAsync() in progress
  private currentSpeed: number; // ms per round
  private animationDuration: number; // ms per movement animation
  private isAnimating: boolean; // Movement animation of the current round in progress
  private animationFrameId: number | null;
  private currentMovements: MovementRecord[] | null; // Movements of the round being animated
  private pendingSteps: number; // Rounds left in the current step()/stepRounds() sequence
  private config: Readonly<GameConfig>;
  private configLocked: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: each challenge has its own state type
  private challenge: ChallengeDef<any> | null = null;

  /** Fired after every completed round (continuous or stepped), also the final one. */
  public onRoundComplete?: () => void;
  /** Fired when a step()/stepRounds() sequence has fully finished (not during continuous run, not on game over). */
  public onStepComplete?: () => void;
  /** Fired once when the game ends: automatically after a round, or via finish(). */
  public onGameOver?: (reason: EndReason) => void;

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
    this.history = new GameHistory();
    this.endConditions = new EndConditionTracker();
    this.endReason = null;
    this.roundEvents = emptyRoundEvents();
    this.initToken = 0;
    this.initializing = false;
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
   * @throws Error when a game is in progress (between initialization and reset())
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

  /**
   * Choose the challenge of the next game (null = free play). Kept across reset().
   * @throws Error while the configuration is locked (a game is in progress)
   */
  // biome-ignore lint/suspicious/noExplicitAny: see ChallengeDef
  setChallenge(def: ChallengeDef<any> | null): void {
    if (this.configLocked) throw new Error(CONFIG_LOCKED_MESSAGE);
    this.challenge = def;
  }

  /** Progress of the active challenge after the last recorded round; null in free play or before init. */
  getChallengeProgress(): ChallengeProgress | null {
    const records = this.history.getRecords();
    if (!this.challenge || records.length === 0) return null;
    return evaluateChallenge(this.challenge, records);
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
    this.beginInitialization(config);
    this.populateRows(0, this.board.height);
    this.completeInitialization();
  }

  /**
   * Same as initializeBoard() but populates the board in row chunks, yielding to the
   * event loop between chunks so a progress indicator can update. The draw order is
   * identical, so the same seed gives the same board.
   * @returns true when finished; false when aborted by reset() or another initialization
   *   (the board then belongs to whoever aborted it)
   */
  async initializeBoardAsync(config?: GameConfig, options: InitializeAsyncOptions = {}): Promise<boolean> {
    const { onProgress, yieldToEventLoop = yieldWithTimeout } = options;
    const chunks = Math.max(1, Math.floor(options.chunks ?? 10) || 1);
    const token = this.beginInitialization(config);
    this.initializing = true;
    const height = this.board.height;
    const rowsPerChunk = Math.max(1, Math.ceil(height / chunks));

    onProgress?.(0);
    for (let row = 0; row < height; row += rowsPerChunk) {
      const endRow = Math.min(height, row + rowsPerChunk);
      this.populateRows(row, endRow);
      onProgress?.(endRow / height);
      if (endRow < height) {
        await yieldToEventLoop();
        if (token !== this.initToken) return false;
      }
    }
    this.initializing = false;
    this.completeInitialization();
    return true;
  }

  /**
   * Start a new game from a hand-made layout: one entity per non-null cell, created
   * with the given (or current) configuration, which is locked until reset().
   * @throws Error when the layout size differs from the board size (nothing is changed)
   */
  initializeFromLayout(layout: BoardLayout, config?: GameConfig): void {
    const { width, height } = this.board;
    if (layout.width !== width || layout.height !== height || layout.cells.length !== width * height) {
      throw new Error(`Layout size ${layout.width}x${layout.height} does not match board size ${width}x${height}`);
    }
    this.beginInitialization(config);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const kind = layout.cells[y * width + x];
        if (kind) this.board.setEntity(x, y, createEntity(kind, x, y, this.config));
      }
    }
    this.completeInitialization();
  }

  /** First step of every initialization: halt, apply + lock config, clear board/history/effects. */
  private beginInitialization(config?: GameConfig): number {
    this.halt();
    this.initializing = false;
    if (config) this.applyConfig(config);
    this.configLocked = true;
    this.board.reset();
    this.history.clear();
    this.endReason = null;
    this.renderer.clearVisualEffects();
    debugLog('[Game] Initializing board with entities...');
    return ++this.initToken;
  }

  /** Randomly populate rows [fromRow, toRow) in row-major order (one draw per cell). */
  private populateRows(fromRow: number, toRow: number): void {
    const gameConfig = this.config;
    const { spawn } = gameConfig;
    const cumulativeMale = spawn.maleHumanProbability;
    const cumulativeFemale = cumulativeMale + spawn.femaleHumanProbability;
    const cumulativeWolf = cumulativeFemale + spawn.wolfProbability;
    const cumulativeDog = cumulativeWolf + spawn.dogProbability;
    const cumulativeFruit = cumulativeDog + spawn.fruitProbability;
    const cumulativeMushroom = cumulativeFruit + spawn.mushroomProbability;

    for (let y = fromRow; y < toRow; y++) {
      for (let x = 0; x < this.board.width; x++) {
        // Weighted random selection using cumulative probabilities (one draw per cell)
        const rand = Random.next();
        let kind: PlaceableKind | null = null;
        if (rand < cumulativeMale) kind = 'male';
        else if (rand < cumulativeFemale) kind = 'female';
        else if (rand < cumulativeWolf) kind = 'wolf';
        else if (rand < cumulativeDog) kind = 'dog';
        else if (rand < cumulativeFruit) kind = 'fruit';
        else if (rand < cumulativeMushroom) kind = 'mushroom';
        if (kind) this.board.setEntity(x, y, createEntity(kind, x, y, gameConfig));
        // else: cell remains empty
      }
    }
  }

  /** Last step of every initialization: record round 0 and render everything. */
  private completeInitialization(): void {
    const initial = this.snapshot(emptyRoundEvents());
    this.history.start(initial);
    this.endConditions.start(initial);
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
    this.roundEvents = emptyRoundEvents();

    // Phase 1: Movement
    const movementResult: unknown = this.movementSystem.execute(this.board, this.config);
    const { movements, deaths } = readMovementResult(movementResult);
    this.roundEvents.deaths.push(...deaths);

    if (movements.length > 0 && this.animationDuration > 0) {
      this.animateMovements(movements);
      return;
    }

    this.finishRound(false);
  }

  /**
   * Phases 2–7 in strict PRD order, then the round counter and the history record.
   * @returns the record of the completed round
   */
  private runRemainingPhases(): RoundRecord {
    const config = this.config;
    const events = this.roundEvents;
    this.combatSystem.execute(this.board, config); // Phase 2
    const eaten: unknown = this.eatingSystem.execute(this.board, config); // Phase 3
    events.fruitsEaten += asCount(field(eaten, 'fruits'));
    events.mushroomsEaten += asCount(field(eaten, 'mushrooms'));
    const pregnancies: unknown = this.reproductionSystem.execute(this.board, config); // Phase 4
    events.newPregnancies += asCount(pregnancies);
    const deaths: unknown = this.deathSystem.execute(this.board, config); // Phase 5
    events.deaths.push(...asDeaths(deaths));
    const birth: unknown = this.birthSystem.execute(this.board, config); // Phase 6
    events.births += asCount(field(birth, 'births'));
    events.deaths.push(...asDeaths(field(birth, 'deaths')));
    this.spawnSystem.execute(this.board, config); // Phase 7

    this.board.incrementRound();
    const record = this.snapshot(events);
    this.history.record(record);
    this.roundEvents = emptyRoundEvents();
    return record;
  }

  /** Count the board in one pass into a RoundRecord for the current round. */
  private snapshot(events: RoundEvents): RoundRecord {
    const record: RoundRecord = {
      round: this.board.round,
      males: 0,
      females: 0,
      pregnant: 0,
      wolves: 0,
      dogs: 0,
      fruits: 0,
      mushrooms: 0,
      events,
    };
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        const entity = this.board.getEntity(x, y);
        if (!entity) continue;
        switch (entity.type) {
          case EntityType.MALE:
            record.males++;
            break;
          case EntityType.FEMALE:
            record.females++;
            if (entity instanceof Human && entity.isPregnant()) record.pregnant++;
            break;
          case EntityType.WOLF:
            record.wolves++;
            break;
          case EntityType.DOG:
            record.dogs++;
            break;
          case EntityType.FRUIT:
            record.fruits++;
            break;
          case EntityType.MUSHROOM:
            record.mushrooms++;
            break;
        }
      }
    }
    return record;
  }

  /** Complete the current round (phases 2–7), check end conditions, notify, schedule what comes next. */
  private finishRound(wasAnimated: boolean): void {
    const record = this.runRemainingPhases();

    const reason = this.endConditions.check(record);
    if (reason) {
      this.halt();
      this.endReason = reason;
      debugLog(`[Game] Game over after round ${record.round}: ${reason}`);
      this.renderer.render(this.board);
      this.onRoundComplete?.();
      this.onGameOver?.(reason);
      return;
    }

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
      if (!this.isAnimating) return; // completed synchronously (pause) or halted (stop/reset)
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
   * @param interrupted true when cut short (pause/stop/reset): sprites may be mid-cell,
   *   so the whole board is redrawn.
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

  /** Stop everything without finishing the current round. */
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
   * Ignored when the game is over or the board is still being initialized.
   */
  start(): void {
    if (this.isRunning || this.isBlocked()) return;
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

  /**
   * Halt immediately WITHOUT finishing an in-flight round, so pressing Finish/Reset
   * mid-animation never runs an extra round: moved sprites snap to their cells and
   * phases 2–7 of that round are skipped (the round counter and history are unchanged).
   * The configuration stays locked.
   */
  stop(): void {
    debugLog('[Game] Stopping execution...');
    this.halt();
    this.renderer.render(this.board);
  }

  /**
   * End the game on the user's request: stop() and record 'userFinished', firing
   * onGameOver once. When the game had already ended, the earlier reason is kept
   * (and onGameOver is not fired again).
   * @returns the game's end reason
   */
  finish(): EndReason {
    this.stop();
    if (this.endReason) return this.endReason;
    this.endReason = 'userFinished';
    this.onGameOver?.(this.endReason);
    return this.endReason;
  }

  /** Why the game ended, or null while it is still going (or not started). */
  getEndReason(): EndReason | null {
    return this.endReason;
  }

  /** True once the game has ended (automatically or via finish()) until the next initialization/reset. */
  isOver(): boolean {
    return this.endReason !== null;
  }

  /** True while initializeBoardAsync() is populating the board. */
  isInitializing(): boolean {
    return this.initializing;
  }

  /** No rounds may run when the game is over or the board is still being populated. */
  private isBlocked(): boolean {
    return this.endReason !== null || this.initializing;
  }

  /** Execute a single round (ignored while running, stepping, over or initializing). */
  step(): void {
    this.stepRounds(1);
  }

  /**
   * Execute `n` rounds one after another (each fully animated), then fire
   * onStepComplete once. Ignored while running, stepping, over or initializing.
   * The sequence ends early (without onStepComplete) when the game ends.
   */
  stepRounds(n: number): void {
    const rounds = Math.floor(n);
    if (!(rounds >= 1) || this.isBlocked()) return;
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
   * Reset to an empty board and unlock the configuration. Aborts an
   * initializeBoardAsync() in progress.
   */
  reset(): void {
    debugLog('[Game] Resetting game...');
    this.halt();
    this.initToken++;
    this.initializing = false;
    this.board.reset();
    this.history.clear();
    this.endReason = null;
    this.configLocked = false;
    this.renderer.clearVisualEffects();
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);
  }

  /** Human population after initialization and after each round (derived from getHistory()). */
  getPopulationHistory(): number[] {
    return this.history.getHumanPopulation();
  }

  /** Per-round records: round 0 (initial board) and one after every completed round. */
  getHistory(): GameHistory {
    return this.history;
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
