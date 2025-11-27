import { Entity } from './Entity';
import { EntityType } from '../types';

export class Mushroom extends Entity {
  constructor(x: number, y: number) {
    // Mushrooms don't have health in traditional sense, but we use it for consistency
    super(x, y, 1, EntityType.MUSHROOM);
  }

  // Mushrooms don't die from age
  isDead(): boolean {
    return false;
  }
}
