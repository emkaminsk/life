import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Wolf extends Entity {
  constructor(x: number, y: number, startingHealth?: number, gompertzA?: number, gompertzB?: number) {
    super(x, y, startingHealth ?? DEFAULT_CONFIG.wolf.startingHealth, EntityType.WOLF, gompertzA ?? DEFAULT_CONFIG.wolf.gompertzA, gompertzB ?? DEFAULT_CONFIG.wolf.gompertzB);
  }
}
