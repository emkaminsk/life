export enum EntityType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  WOLF = 'WOLF',
  DOG = 'DOG',
  FRUIT = 'FRUIT'
}

export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export interface Position {
  x: number;
  y: number;
}

export interface VisualEffect {
  type: 'combat' | 'reproduction' | 'eating';
  x: number;
  y: number;
  startTime: number;
  duration: number;
}
