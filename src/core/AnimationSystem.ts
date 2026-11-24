import type { Entity } from '../entities/Entity';
import { debugLog } from '../utils/debug';

/**
 * Record of entity movement for animation purposes
 */
export interface MovementRecord {
  entity: Entity;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/**
 * Start and end cell of one animated movement.
 */
export interface MovementPath {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
}

/**
 * Animation state for a single entity
 */
interface AnimationState {
  entity: Entity;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number; // eased progress, 0.0 to 1.0
}

/**
 * Easing function type
 */
type EasingFunction = (t: number) => number;

const linearEasing: EasingFunction = (t) => t;
/** Deceleration at the end; feels more natural. */
const easeOutEasing: EasingFunction = (t) => 1 - (1 - t) ** 2;
/** Acceleration then deceleration. */
const easeInOutEasing: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Manages smooth animations for entity movements.
 * Interpolates entity visual positions (entity.visualX / visualY) between rounds.
 *
 * Hot-path methods (update, isAnimatingEntity, getAllMovementPaths) do not
 * allocate per frame.
 */
export class AnimationSystem {
  private activeAnimations: Map<Entity, AnimationState>;
  private duration: number;
  private startTime: number;
  private easingFunction: EasingFunction;
  private generation: number;

  constructor() {
    this.activeAnimations = new Map();
    this.duration = 300; // Default 300ms
    this.startTime = 0;
    this.easingFunction = linearEasing;
    this.generation = 0;
  }

  /**
   * Set the easing function for animations
   */
  setEasing(easing: 'linear' | 'ease-out' | 'ease-in-out'): void {
    switch (easing) {
      case 'linear':
        this.easingFunction = linearEasing;
        break;
      case 'ease-out':
        this.easingFunction = easeOutEasing;
        break;
      case 'ease-in-out':
        this.easingFunction = easeInOutEasing;
        break;
    }
  }

  /**
   * Start animations for a batch of movements (replaces any running batch).
   * Each entity's visual position is reset to its starting cell.
   * @param movements Array of movement records to animate
   * @param durationMs Duration of animations in milliseconds
   */
  startAnimations(movements: MovementRecord[], durationMs: number): void {
    this.activeAnimations.clear();
    this.duration = durationMs;
    this.startTime = now();
    this.generation++;

    for (const movement of movements) {
      this.activeAnimations.set(movement.entity, {
        entity: movement.entity,
        fromX: movement.fromX,
        fromY: movement.fromY,
        toX: movement.toX,
        toY: movement.toY,
        progress: 0,
      });
      movement.entity.setVisualPosition(movement.fromX, movement.fromY);
    }

    debugLog(`[AnimationSystem] Started ${movements.length} animations (${durationMs}ms)`);
  }

  /**
   * Update animation progress based on elapsed time and write the
   * interpolated position into each entity's visualX / visualY.
   * When the batch completes, entities are left exactly at their target cell
   * and the batch is cleared.
   */
  update(): void {
    if (this.activeAnimations.size === 0) return;

    const elapsed = now() - this.startTime;
    const rawProgress = this.duration > 0 ? Math.min(1, Math.max(0, elapsed / this.duration)) : 1;
    const eased = rawProgress >= 1 ? 1 : this.easingFunction(rawProgress);

    for (const state of this.activeAnimations.values()) {
      state.progress = eased;
      state.entity.setVisualPosition(
        state.fromX + (state.toX - state.fromX) * eased,
        state.fromY + (state.toY - state.fromY) * eased
      );
    }

    if (rawProgress >= 1) {
      debugLog(`[AnimationSystem] Completed ${this.activeAnimations.size} animations`);
      this.activeAnimations.clear();
    }
  }

  /**
   * Check if any animations are currently running
   */
  isAnimating(): boolean {
    return this.activeAnimations.size > 0;
  }

  /**
   * O(1) check whether a specific entity is currently animating.
   */
  isAnimatingEntity(entity: Entity): boolean {
    return this.activeAnimations.has(entity);
  }

  /**
   * Incremented by every startAnimations() call; lets the renderer detect a new batch.
   */
  getGeneration(): number {
    return this.generation;
  }

  /**
   * Get the current visual position of an entity
   * @returns Visual position {x, y} or null if not animating
   */
  getVisualPosition(entity: Entity): { x: number; y: number } | null {
    if (!this.activeAnimations.has(entity)) return null;
    return { x: entity.visualX, y: entity.visualY };
  }

  /**
   * Get all currently animating entities (allocates; not for per-frame use)
   */
  getAnimatingEntities(): Entity[] {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Get movement path for an entity (from and to positions)
   * Returns null if entity is not animating
   */
  getMovementPath(entity: Entity): MovementPath | null {
    return this.activeAnimations.get(entity) ?? null;
  }

  /**
   * Read-only view of all movement paths of the current batch (no copy).
   * Do not hold on to it across startAnimations() calls.
   */
  getAllMovementPaths(): ReadonlyMap<Entity, MovementPath> {
    return this.activeAnimations;
  }

  /**
   * Stop all animations immediately (visual positions are left as they are;
   * callers sync them with entity.syncVisualPosition()).
   */
  stopAll(): void {
    debugLog(`[AnimationSystem] Stopping ${this.activeAnimations.size} animations`);
    this.activeAnimations.clear();
  }

  /**
   * Get raw (un-eased) animation progress for debugging (0.0 to 1.0)
   */
  getProgress(): number {
    if (this.activeAnimations.size === 0) return 1.0;
    if (this.duration <= 0) return 1.0;
    return Math.min(1.0, (now() - this.startTime) / this.duration);
  }
}
