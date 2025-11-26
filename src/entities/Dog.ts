import { Entity } from './Entity';
import { EntityType } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Dog extends Entity {
  constructor(x: number, y: number) {
    super(x, y, DEFAULT_CONFIG.dog.startingHealth, EntityType.DOG);
  }
}
