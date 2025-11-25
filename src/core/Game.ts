import { Board } from './Board';
import { Renderer } from './Renderer';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Fruit } from '../entities/Fruit';
import { Sex } from '../types';
import { Random } from '../utils/Random';
import { DEFAULT_CONFIG } from '../config';
import { MovementSystem } from '../systems/MovementSystem';

export class Game {
  private board: Board;
  private renderer: Renderer;
  private movementSystem: MovementSystem;
  private isRunning: boolean;
  private roundInterval: number | null;

  constructor(board: Board, renderer: Renderer) {
    this.board = board;
    this.renderer = renderer;
    this.movementSystem = new MovementSystem();
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
    let fruitCount = 0;

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        // Try spawning entities based on probabilities
        if (Random.chance(DEFAULT_CONFIG.spawn.maleHumanProbability)) {
          this.board.setEntity(x, y, new Human(x, y, Sex.MALE));
          maleCount++;
        } else if (Random.chance(DEFAULT_CONFIG.spawn.femaleHumanProbability)) {
          this.board.setEntity(x, y, new Human(x, y, Sex.FEMALE));
          femaleCount++;
        } else if (Random.chance(DEFAULT_CONFIG.spawn.wolfProbability)) {
          this.board.setEntity(x, y, new Wolf(x, y));
          wolfCount++;
        } else if (Random.chance(DEFAULT_CONFIG.spawn.fruitProbability)) {
          this.board.setEntity(x, y, new Fruit(x, y));
          fruitCount++;
        }
      }
    }

    console.log(`[Game] Spawned: ${maleCount} males, ${femaleCount} females, ${wolfCount} wolves, ${fruitCount} fruits`);

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

    // Mark all entities as dirty after movement
    const entities = this.board.getAllEntities();
    entities.forEach(entity => {
      this.renderer.markDirty(entity.x, entity.y);
    });

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
