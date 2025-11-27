import type { Entity } from '../entities/Entity';

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
 * Animation state for a single entity
 */
interface AnimationState {
  entity: Entity;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number; // 0.0 to 1.0
}

/**
 * Easing function type
 */
type EasingFunction = (t: number) => number;

/**
 * Manages smooth animations for entity movements
 * Interpolates entity positions between rounds for visual continuity
 */
export class AnimationSystem {
  private activeAnimations: Map<Entity, AnimationState>;
  private duration: number;
  private startTime: number;
  private easingFunction: EasingFunction;

  constructor() {
    this.activeAnimations = new Map();
    this.duration = 300; // Default 300ms
    this.startTime = 0;
    this.easingFunction = this.linearEasing;
  }

  /**
   * Linear easing function (no acceleration/deceleration)
   */
  private linearEasing(t: number): number {
    return t;
  }

  /**
   * Ease-out easing function (deceleration at end)
   * Provides more natural-feeling movement
   */
  private easeOutEasing(t: number): number {
    return 1 - (1 - t) ** 2;
  }

  /**
   * Ease-in-out easing function (acceleration and deceleration)
   */
  private easeInOutEasing(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  /**
   * Set the easing function for animations
   */
  setEasing(easing: 'linear' | 'ease-out' | 'ease-in-out'): void {
    switch (easing) {
      case 'linear':
        this.easingFunction = this.linearEasing;
        break;
      case 'ease-out':
        this.easingFunction = this.easeOutEasing;
        break;
      case 'ease-in-out':
        this.easingFunction = this.easeInOutEasing;
        break;
    }
  }

  /**
   * Start animations for a batch of movements
   * @param movements Array of movement records to animate
   * @param durationMs Duration of animations in milliseconds
   */
  startAnimations(movements: MovementRecord[], durationMs: number): void {
    this.activeAnimations.clear();
    this.duration = durationMs;
    this.startTime = Date.now();

    for (const movement of movements) {
      const animState: AnimationState = {
        entity: movement.entity,
        fromX: movement.fromX,
        fromY: movement.fromY,
        toX: movement.toX,
        toY: movement.toY,
        progress: 0.0,
      };
      this.activeAnimations.set(movement.entity, animState);
    }

    console.log(`[AnimationSystem] Started ${movements.length} animations (${durationMs}ms)`);
  }

  /**
   * Update animation progress based on elapsed time
   */
  update(): void {
    if (this.activeAnimations.size === 0) return;

    const elapsed = Date.now() - this.startTime;
    const rawProgress = Math.min(1.0, elapsed / this.duration);
    const easedProgress = this.easingFunction(rawProgress);

    // Update all animation states
    for (const [entity, state] of this.activeAnimations.entries()) {
      state.progress = easedProgress;

      // Update entity's visual position
      const visualX = state.fromX + (state.toX - state.fromX) * easedProgress;
      const visualY = state.fromY + (state.toY - state.fromY) * easedProgress;
      entity.setVisualPosition(visualX, visualY);
    }

    // Clean up completed animations
    if (rawProgress >= 1.0) {
      console.log(`[AnimationSystem] Completed ${this.activeAnimations.size} animations`);
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
   * Get the current visual position of an entity
   * @param entity Entity to get visual position for
   * @returns Visual position {x, y} or null if not animating
   */
  getVisualPosition(entity: Entity): { x: number; y: number } | null {
    const state = this.activeAnimations.get(entity);
    if (!state) return null;

    const visualX = state.fromX + (state.toX - state.fromX) * state.progress;
    const visualY = state.fromY + (state.toY - state.fromY) * state.progress;

    return { x: visualX, y: visualY };
  }

  /**
   * Get all currently animating entities
   */
  getAnimatingEntities(): Entity[] {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Get movement path for an entity (from and to positions)
   * Returns null if entity is not animating
   */
  getMovementPath(entity: Entity): { fromX: number; fromY: number; toX: number; toY: number } | null {
    const state = this.activeAnimations.get(entity);
    if (!state) return null;
    return {
      fromX: state.fromX,
      fromY: state.fromY,
      toX: state.toX,
      toY: state.toY,
    };
  }

  /**
   * Get all movement paths for currently animating entities
   * Used for batch dirty rectangle marking
   */
  getAllMovementPaths(): Map<Entity, { fromX: number; fromY: number; toX: number; toY: number }> {
    const paths = new Map<Entity, { fromX: number; fromY: number; toX: number; toY: number }>();
    for (const [entity, state] of this.activeAnimations.entries()) {
      paths.set(entity, {
        fromX: state.fromX,
        fromY: state.fromY,
        toX: state.toX,
        toY: state.toY,
      });
    }
    return paths;
  }

  /**
   * Stop all animations immediately
   */
  stopAll(): void {
    console.log(`[AnimationSystem] Stopping ${this.activeAnimations.size} animations`);
    this.activeAnimations.clear();
  }

  /**
   * Get animation progress for debugging (0.0 to 1.0)
   */
  getProgress(): number {
    if (this.activeAnimations.size === 0) return 1.0;
    const elapsed = Date.now() - this.startTime;
    return Math.min(1.0, elapsed / this.duration);
  }
}
