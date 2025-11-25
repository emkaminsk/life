import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Fruit extends Entity {
  ripeningCounter: number;

  constructor(x: number, y: number) {
    // Fruits don't have health in traditional sense, but we use it for consistency
    super(x, y, 1, EntityType.FRUIT);
    this.ripeningCounter = DEFAULT_CONFIG.fruit.roundsToRipen;
  }

  isRipe(): boolean {
    return this.ripeningCounter === 0;
  }

  advanceRipening(): void {
    if (this.ripeningCounter > 0) {
      this.ripeningCounter--;
    }
  }

  // Fruits don't die from age
  isDead(): boolean {
    return false;
  }
}
