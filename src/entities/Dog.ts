import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Dog extends Entity {
  constructor(x: number, y: number, startingHealth?: number, gompertzA?: number, gompertzB?: number) {
    super(x, y, startingHealth ?? DEFAULT_CONFIG.dog.startingHealth, EntityType.DOG, gompertzA ?? DEFAULT_CONFIG.dog.gompertzA, gompertzB ?? DEFAULT_CONFIG.dog.gompertzB);
  }
}
