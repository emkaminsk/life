import { EntityType } from '../types';

export abstract class Entity {
  x: number;
  y: number;
  health: number;
  age: number;
  type: EntityType;
  gompertzA: number;
  gompertzB: number;

  constructor(x: number, y: number, health: number, type: EntityType, gompertzA: number = 0.0001, gompertzB: number = 0.1) {
    this.x = x;
    this.y = y;
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
}
