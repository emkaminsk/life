import { Dog } from '../entities/Dog';
import type { Entity } from '../entities/Entity';
import { Fruit } from '../entities/Fruit';
import { Human } from '../entities/Human';
import { Mushroom } from '../entities/Mushroom';
import { Wolf } from '../entities/Wolf';
import { Sex } from '../types';
import type { GameConfig } from '../ui/ConfigPanel';
import type { PlaceableKind } from './simulationEvents';

/**
 * Create a new entity of the given kind at (x, y) using the parameters from `config`.
 * Humans get a fresh random genome drawn around the configured averages
 * (greed = moveTowardFruitProbability, avgCaution, avgMetabolism).
 */
export function createEntity(kind: PlaceableKind, x: number, y: number, config: GameConfig): Entity {
  const { human, wolf, dog, fruit, mushroom } = config;
  switch (kind) {
    case 'male':
    case 'female':
      return new Human(
        x,
        y,
        kind === 'male' ? Sex.MALE : Sex.FEMALE,
        human.startingHealth,
        human.gompertzA,
        human.gompertzB,
        undefined,
        human.moveTowardFruitProbability,
        human.avgCaution,
        human.avgMetabolism,
      );
    case 'wolf':
      return new Wolf(x, y, wolf.startingHealth, wolf.gompertzA, wolf.gompertzB);
    case 'dog':
      return new Dog(x, y, dog.startingHealth, dog.gompertzA, dog.gompertzB);
    case 'fruit':
      return new Fruit(x, y, fruit.energyHealed, fruit.roundsToRipen);
    case 'mushroom':
      return new Mushroom(x, y, mushroom.energyRemoved);
  }
}
