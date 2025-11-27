import { Board } from '../core/Board';
import { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Gompertz } from '../utils/Gompertz';
import { DEFAULT_CONFIG } from '../config';
import { EntityType } from '../types';

export class DeathSystem {
  execute(board: Board): void {
    const entities = board.getAllEntities();
    const entitiesToRemove: Entity[] = [];

    let healthDeaths = 0;
    let ageDeaths = 0;

    // Count populations for overcrowding check
    const humanCount = entities.filter(
      e => e.type === EntityType.MALE || e.type === EntityType.FEMALE
    ).length;
    const animalCount = entities.filter(
      e => e.type === EntityType.WOLF || e.type === EntityType.DOG
    ).length;

    // Determine overcrowding multipliers
    const humanMultiplier = humanCount > DEFAULT_CONFIG.overcrowding.humanThreshold
      ? DEFAULT_CONFIG.overcrowding.humanMultiplier
      : 1;
    const animalMultiplier = animalCount > DEFAULT_CONFIG.overcrowding.animalThreshold
      ? DEFAULT_CONFIG.overcrowding.animalMultiplier
      : 1;

    if (humanMultiplier > 1) {
      console.log(`[Death] Human overcrowding active (${humanCount} > ${DEFAULT_CONFIG.overcrowding.humanThreshold}), multiplier: ${humanMultiplier}x`);
    }
    if (animalMultiplier > 1) {
      console.log(`[Death] Animal overcrowding active (${animalCount} > ${DEFAULT_CONFIG.overcrowding.animalThreshold}), multiplier: ${animalMultiplier}x`);
    }

    for (const entity of entities) {
      // Increment age for all entities
      entity.incrementAge();

      // Check health-based death
      if (entity.isDead()) {
        entitiesToRemove.push(entity);
        healthDeaths++;
        continue;
      }

      // Check age-based death (Gompertz) with overcrowding multiplier
      if (entity instanceof Human) {
        const died = Gompertz.shouldDie(
          entity.age,
          DEFAULT_CONFIG.human.gompertzA,
          DEFAULT_CONFIG.human.gompertzB,
          humanMultiplier
        );
        if (died) {
          entitiesToRemove.push(entity);
          ageDeaths++;
        }
      } else if (entity instanceof Wolf) {
        const died = Gompertz.shouldDie(
          entity.age,
          DEFAULT_CONFIG.wolf.gompertzA,
          DEFAULT_CONFIG.wolf.gompertzB,
          animalMultiplier
        );
        if (died) {
          entitiesToRemove.push(entity);
          ageDeaths++;
        }
      } else if (entity instanceof Dog) {
        const died = Gompertz.shouldDie(
          entity.age,
          DEFAULT_CONFIG.dog.gompertzA,
          DEFAULT_CONFIG.dog.gompertzB,
          animalMultiplier
        );
        if (died) {
          entitiesToRemove.push(entity);
          ageDeaths++;
        }
      }
    }

    // Remove all dead entities
    for (const entity of entitiesToRemove) {
      board.removeEntity(entity.x, entity.y);
    }

    if (healthDeaths + ageDeaths > 0) {
      console.log(`[Death] Total deaths: ${healthDeaths + ageDeaths} (health: ${healthDeaths}, age: ${ageDeaths})`);
    }
  }
}
