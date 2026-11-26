import type { DeathCause } from '../core/simulationEvents';
import type { EntityType } from '../types';

export abstract class Entity {
  x: number; // Logical position (for game rules)
  y: number; // Logical position (for game rules)
  visualX: number; // Visual position (for rendering during animations)
  visualY: number; // Visual position (for rendering during animations)
  health: number;
  /** Maximum health this entity can have (used for healing caps and the injured % indicator). */
  maxHealth: number;
  age: number;
  type: EntityType;
  gompertzA: number;
  gompertzB: number;
  /** Why this entity died; null while alive (or when the killing blow gave no cause). */
  deathCause: DeathCause | null = null;

  constructor(
    x: number,
    y: number,
    health: number,
    type: EntityType,
    gompertzA: number = 0.0001,
    gompertzB: number = 0.1,
    maxHealth: number = health,
  ) {
    this.x = x;
    this.y = y;
    this.visualX = x; // Initialize visual position to logical position
    this.visualY = y;
    this.health = health;
    this.maxHealth = maxHealth;
    this.age = 0;
    this.type = type;
    this.gompertzA = gompertzA;
    this.gompertzB = gompertzB;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  /**
   * True when health is below `thresholdPercent` % of max health.
   */
  isInjured(thresholdPercent: number): boolean {
    if (this.maxHealth <= 0) return false;
    return (this.health / this.maxHealth) * 100 < thresholdPercent;
  }

  incrementAge(): void {
    this.age++;
  }

  /**
   * Reduce health (never below 0). When `cause` is given it is recorded as the
   * deathCause only on the transition from alive (health > 0) to dead (≤ 0), so
   * the first lethal blow wins and later damage does not overwrite it.
   */
  takeDamage(amount: number, cause?: DeathCause): void {
    const wasAlive = this.health > 0;
    this.health = Math.max(0, this.health - amount);
    if (cause !== undefined && wasAlive && this.health <= 0) {
      this.deathCause = cause;
    }
  }

  /** Kill outright (health 0) and record the cause (e.g. old age, overcrowding, childbirth). */
  kill(cause: DeathCause): void {
    this.health = 0;
    this.deathCause = cause;
  }

  heal(amount: number, maxHealth: number = this.maxHealth): void {
    this.health = Math.min(maxHealth, this.health + amount);
  }

  /**
   * Set visual position for animation rendering
   * This does not affect logical position used by game rules
   */
  setVisualPosition(x: number, y: number): void {
    this.visualX = x;
    this.visualY = y;
  }

  /**
   * Sync visual position to logical position
   * Called after animations complete
   */
  syncVisualPosition(): void {
    this.visualX = this.x;
    this.visualY = this.y;
  }
}
