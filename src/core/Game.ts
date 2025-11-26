import { Board } from './Board';
import { Renderer } from './Renderer';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import { Sex } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EatingSystem } from '../systems/EatingSystem';
import { ReproductionSystem } from '../systems/ReproductionSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { BirthSystem } from '../systems/BirthSystem';
import { PlantSpawnSystem } from '../systems/PlantSpawnSystem';

export class Game {
  private board: Board;
  private renderer: Renderer;
  private movementSystem: MovementSystem;
  private combatSystem: CombatSystem;
  private eatingSystem: EatingSystem;
  private reproductionSystem: ReproductionSystem;
  private deathSystem: DeathSystem;
  private birthSystem: BirthSystem;
  private plantSpawnSystem: PlantSpawnSystem;
  private isRunning: boolean;
  private roundInterval: number | null;

  constructor(board: Board, renderer: Renderer) {
    this.board = board;
    this.renderer = renderer;
    this.movementSystem = new MovementSystem();
    this.combatSystem = new CombatSystem(renderer);
    this.eatingSystem = new EatingSystem(renderer);
    this.reproductionSystem = new ReproductionSystem(renderer);
    this.deathSystem = new DeathSystem();
    this.birthSystem = new BirthSystem(renderer);
    this.plantSpawnSystem = new PlantSpawnSystem();
    this.isRunning = false;
    this.roundInterval = null;
  }

  /**
   * Initialize board with random entities
   */
  initializeBoard(): void {
    console.log('[Game] Initializing board with entities...');

    let maleCount = 0;
    let femaleCount = 0;
    let wolfCount = 0;
    let dogCount = 0;
    let fruitCount = 0;

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        // Weighted random selection using cumulative probabilities
        const rand = Math.random();
        const cumulativeMale = DEFAULT_CONFIG.spawn.maleHumanProbability;
        const cumulativeFemale = cumulativeMale + DEFAULT_CONFIG.spawn.femaleHumanProbability;
        const cumulativeWolf = cumulativeFemale + DEFAULT_CONFIG.spawn.wolfProbability;
        const cumulativeDog = cumulativeWolf + DEFAULT_CONFIG.spawn.dogProbability;
        const cumulativeFruit = cumulativeDog + DEFAULT_CONFIG.spawn.fruitProbability;

        if (rand < cumulativeMale) {
          this.board.setEntity(x, y, new Human(x, y, Sex.MALE));
          maleCount++;
        } else if (rand < cumulativeFemale) {
          this.board.setEntity(x, y, new Human(x, y, Sex.FEMALE));
          femaleCount++;
        } else if (rand < cumulativeWolf) {
          this.board.setEntity(x, y, new Wolf(x, y));
          wolfCount++;
        } else if (rand < cumulativeDog) {
          this.board.setEntity(x, y, new Dog(x, y));
          dogCount++;
        } else if (rand < cumulativeFruit) {
          this.board.setEntity(x, y, new Fruit(x, y));
          fruitCount++;
        }
        // else: cell remains empty
      }
    }

    console.log(`[Game] Spawned: ${maleCount} males, ${femaleCount} females, ${wolfCount} wolves, ${dogCount} dogs, ${fruitCount} fruits`);

    // Mark all cells dirty for initial render
    this.renderer.markAllDirty(this.board);
    this.renderer.render(this.board);
  }

  /**
   * Execute one complete round
   */
  executeRound(): void {
    console.log(`\n=== Round ${this.board.round + 1} ===`);

    // Phase 1: Movement
    this.movementSystem.execute(this.board);

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

    // Phase 7: Plant Spawn
    this.plantSpawnSystem.execute(this.board);

    // Mark entire board dirty to clear cells that became empty (moved/dead entities)
    this.renderer.markAllDirty(this.board);

    // Increment round counter
    this.board.incrementRound();

    // Render changes
    this.renderer.render(this.board);
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
    }, DEFAULT_CONFIG.simulation.defaultSpeed);
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
  }

  /**
   * Execute single step
   */
  step(): void {
    this.executeRound();
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
}
