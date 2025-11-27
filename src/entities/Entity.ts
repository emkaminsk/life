import { EntityType } from '../types';

export abstract class Entity {
  x: number; // Logical position (for game rules)
  y: number; // Logical position (for game rules)
  visualX: number; // Visual position (for rendering during animations)
  visualY: number; // Visual position (for rendering during animations)
  health: number;
  age: number;
  type: EntityType;
  gompertzA: number;
  gompertzB: number;

  constructor(x: number, y: number, health: number, type: EntityType, gompertzA: number = 0.0001, gompertzB: number = 0.1) {
    this.x = x;
    this.y = y;
    this.visualX = x; // Initialize visual position to logical position
    this.visualY = y;
    this.health = health;
    this.age = 0;
    this.type = type;
    this.gompertzA = gompertzA;
    this.gompertzB = gompertzB;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  isInjured(threshold: number): boolean {
    return this.health < threshold;
  }

  incrementAge(): void {
    this.age++;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number, maxHealth: number): void {
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
