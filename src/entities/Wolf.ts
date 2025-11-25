import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Wolf extends Entity {
  constructor(x: number, y: number) {
    super(x, y, DEFAULT_CONFIG.wolf.startingHealth, EntityType.WOLF);
  }
}
