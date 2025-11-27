import { Entity } from './Entity';
import { EntityType } from '../types';

export class Mushroom extends Entity {
  energyRemoved: number;

  constructor(x: number, y: number, energyRemoved?: number) {
    // Mushrooms don't have health in traditional sense, but we use it for consistency
    super(x, y, 1, EntityType.MUSHROOM);
    this.energyRemoved = energyRemoved ?? 40; // Default from config
  }

  // Mushrooms don't die from age
  isDead(): boolean {
    return false;
  }
}
