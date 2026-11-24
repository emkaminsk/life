import type { Board } from '../core/Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import type { Renderer } from '../core/Renderer';
import type { Position } from '../types';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';
import type { MovementRecord } from '../core/AnimationSystem';
import type { GameConfig } from '../ui/ConfigPanel';

type EntityPredicate = (entity: Entity) => boolean;

const isWolf: EntityPredicate = (e) => e instanceof Wolf;
const isHuman: EntityPredicate = (e) => e instanceof Human;
const isRipeFruit: EntityPredicate = (e) => e instanceof Fruit && e.isRipe();

/** Pick one element; only consumes a random number when there is a real choice. */
function pick<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return Random.choice(items);
}

/**
 * Phase 1: Movement.
 *
 * Each creature moves at most one cell per round (8-neighbourhood):
 * - Target within perception range (Manhattan distance) → with the configured
 *   probability move to the free adjacent cell closest to the nearest target
 *   (random among equally close cells); otherwise a random free adjacent cell.
 * - No target → random free adjacent cell.
 * - No free adjacent cell → no move.
 *
 * Humans flee from the nearest wolf (probability = caution gene) and seek ripe
 * fruit (probability = greed gene). Each human pays its metabolism gene in health
 * per round before moving.
 */
export class MovementSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): MovementRecord[] {
    const entities = board.getAllEntities();
    const movements: MovementRecord[] = [];

    for (const entity of entities) {
      if (!(entity instanceof Human || entity instanceof Wolf || entity instanceof Dog)) continue;
      const movement = this.moveCreature(entity, board, config);
      if (movement) movements.push(movement);
    }

    debugLog(`[Movement] Moved ${movements.length} creatures`);
    return movements;
  }

  private moveCreature(creature: Human | Wolf | Dog, board: Board, config: GameConfig): MovementRecord | null {
    if (creature.isDead()) return null;

    // Metabolism: humans pay their metabolism gene in health each round
    if (creature instanceof Human && creature.genome.metabolism > 0) {
      creature.takeDamage(creature.genome.metabolism);
      this.renderer.markDirty(creature.x, creature.y);
      if (creature.isDead()) return null; // Dead creatures don't move
    }

    const availablePositions = board.getEmptyAdjacentPositions(creature.x, creature.y);
    if (availablePositions.length === 0) return null;

    let targetPosition: Position | null = null;
    if (creature instanceof Human) {
      targetPosition = this.getHumanTarget(creature, board, config, availablePositions);
    } else if (creature instanceof Wolf) {
      targetPosition = this.getChaseTarget(
        creature, board, isHuman, config.wolf.perceptionRange, config.wolf.moveTowardHumanProbability
      );
    } else {
      targetPosition = this.getChaseTarget(
        creature, board, isWolf, config.dog.perceptionRange, config.dog.moveTowardWolfProbability
      );
    }

    // No target (or probability check failed) → random free adjacent cell
    if (!targetPosition) {
      targetPosition = pick(availablePositions);
    }
    if (!targetPosition) return null;

    const fromX = creature.x;
    const fromY = creature.y;
    if (!board.moveEntity(fromX, fromY, targetPosition.x, targetPosition.y)) return null;

    this.renderer.markDirty(fromX, fromY);
    this.renderer.markDirty(targetPosition.x, targetPosition.y);
    return { entity: creature, fromX, fromY, toX: targetPosition.x, toY: targetPosition.y };
  }

  private getHumanTarget(
    human: Human,
    board: Board,
    config: GameConfig,
    availablePositions: Position[]
  ): Position | null {
    const range = config.human.perceptionRange;

    // 1. Flee from the nearest wolf (caution gene)
    if (human.genome.caution > 0 && Random.chance(human.genome.caution)) {
      const wolf = MovementSystem.findNearest(board, human.x, human.y, range, isWolf);
      if (wolf) {
        const furthest = MovementSystem.getFurthestPositions(availablePositions, wolf.x, wolf.y);
        const flee = pick(furthest);
        if (flee) return flee;
      }
    }

    // 2. Seek the nearest ripe fruit (greed gene)
    if (human.genome.greed > 0 && Random.chance(human.genome.greed)) {
      const fruit = MovementSystem.findNearest(board, human.x, human.y, range, isRipeFruit);
      if (fruit) {
        return MovementSystem.stepToward(board, human.x, human.y, fruit.x, fruit.y);
      }
    }

    return null;
  }

  private getChaseTarget(
    creature: Entity,
    board: Board,
    isTarget: EntityPredicate,
    range: number,
    probability: number
  ): Position | null {
    // Probability checked first so the (more expensive) scan is skipped when it fails;
    // the resulting behaviour is identical to "detect, then roll".
    if (probability <= 0 || !Random.chance(probability)) return null;
    const target = MovementSystem.findNearest(board, creature.x, creature.y, range, isTarget);
    if (!target) return null;
    return MovementSystem.stepToward(board, creature.x, creature.y, target.x, target.y);
  }

  /**
   * PRD 3.2.2-3.2.4 / US-036: the preferred cells are the adjacent cells (any
   * occupancy, excluding the target's own cell) closest to the target. A free
   * preferred cell is chosen at random (equidistant tie-break). If every
   * preferred cell is occupied, returns null so the caller falls back to a
   * random available adjacent cell.
   */
  static stepToward(board: Board, fromX: number, fromY: number, tx: number, ty: number): Position | null {
    const candidates = board
      .getAdjacentPositions(fromX, fromY)
      .filter((p) => !(p.x === tx && p.y === ty));
    const preferred = Random.getClosestPositions(candidates, tx, ty);
    const free = preferred.filter((p) => board.isEmpty(p.x, p.y));
    return pick(free);
  }

  /**
   * Find the nearest entity matching `isTarget` within Manhattan distance `range`
   * of (cx, cy), excluding the centre cell. Scans rings of increasing distance over
   * the grid (O(range²), no allocations for empty rings). Ties between equally
   * near targets are broken randomly.
   */
  static findNearest(
    board: Board,
    cx: number,
    cy: number,
    range: number,
    isTarget: EntityPredicate
  ): Entity | null {
    const maxRange = Math.min(Math.floor(range), board.width + board.height);
    const grid = board.grid;
    const width = board.width;
    const height = board.height;
    let found: Entity[] | null = null;

    for (let d = 1; d <= maxRange; d++) {
      for (let dx = -d; dx <= d; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= width) continue;
        const rest = d - Math.abs(dx);
        // dy = +rest and -rest (once when rest === 0)
        for (let k = 0; k < (rest === 0 ? 1 : 2); k++) {
          const y = k === 0 ? cy + rest : cy - rest;
          if (y < 0 || y >= height) continue;
          const entity = grid[y][x];
          if (entity && isTarget(entity)) {
            if (!found) found = [];
            found.push(entity);
          }
        }
      }
      if (found) return pick(found);
    }
    return null;
  }

  /** Positions that maximise Manhattan distance to (tx, ty). */
  static getFurthestPositions(positions: Position[], tx: number, ty: number): Position[] {
    let maxDistance = -1;
    const furthest: Position[] = [];
    for (const pos of positions) {
      const dist = Random.distance(pos.x, pos.y, tx, ty);
      if (dist > maxDistance) {
        maxDistance = dist;
        furthest.length = 0;
        furthest.push(pos);
      } else if (dist === maxDistance) {
        furthest.push(pos);
      }
    }
    return furthest;
  }
}
