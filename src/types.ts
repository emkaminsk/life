export enum EntityType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  WOLF = 'WOLF',
  DOG = 'DOG',
  FRUIT = 'FRUIT',
  MUSHROOM = 'MUSHROOM'
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

export interface Genome {
  maxHealth: number;    // Physical: Determines starting and max health
  strength: number;     // Physical: Damage multiplier in combat
  metabolism: number;   // Physical: Energy cost per move (0-1)
  greed: number;        // Behavioral: Probability to move toward food (0-1)
  caution: number;      // Behavioral: Probability to run from predators (0-1)
}

export interface GenomeSnapshot {
  round: number;
  maleAverage: Genome;
  femaleAverage: Genome;
}