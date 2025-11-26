import { Board } from '../core/Board';
import { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Gompertz } from '../utils/Gompertz';
import { DEFAULT_CONFIG } from '../config';

export class DeathSystem {
  execute(board: Board): void {
    const entities = board.getAllEntities();
    const entitiesToRemove: Entity[] = [];

    let healthDeaths = 0;
    let ageDeaths = 0;

    for (const entity of entities) {
      // Increment age for all entities
      entity.incrementAge();

      // Check health-based death
      if (entity.isDead()) {
        entitiesToRemove.push(entity);
        healthDeaths++;
        continue;
      }

      // Check age-based death (Gompertz) for humans and wolves only
      if (entity instanceof Human) {
        const died = Gompertz.shouldDie(
          entity.age,
          DEFAULT_CONFIG.human.gompertzA,
          DEFAULT_CONFIG.human.gompertzB
        );
        if (died) {
          entitiesToRemove.push(entity);
          ageDeaths++;
        }
      } else if (entity instanceof Wolf) {
        const died = Gompertz.shouldDie(
          entity.age,
          DEFAULT_CONFIG.wolf.gompertzA,
          DEFAULT_CONFIG.wolf.gompertzB
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
