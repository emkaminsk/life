import { EntityType } from '../types';

export abstract class Entity {
  x: number;
  y: number;
  health: number;
  age: number;
  type: EntityType;

  constructor(x: number, y: number, health: number, type: EntityType) {
    this.x = x;
    this.y = y;
    this.health = health;
    this.age = 0;
    this.type = type;
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
}
