import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Fruit extends Entity {
  ripeningCounter: number;
  energyHealed: number;

  constructor(x: number, y: number, energyHealed?: number, roundsToRipen?: number) {
    // Fruits don't have health in traditional sense, but we use it for consistency
    super(x, y, 1, EntityType.FRUIT);
    this.ripeningCounter = roundsToRipen ?? DEFAULT_CONFIG.fruit.roundsToRipen;
    this.energyHealed = energyHealed ?? DEFAULT_CONFIG.fruit.energyHealed;
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
