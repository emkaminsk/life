import { Board } from '../core/Board';
import { Fruit } from '../entities/Fruit';
import { Random } from '../utils/Random';
import { DEFAULT_CONFIG } from '../config';

export class PlantSpawnSystem {
  execute(board: Board): void {
    let spawnCount = 0;

    // Advance ripening for all existing fruits
    const entities = board.getAllEntities();
    const fruits = entities.filter(e => e instanceof Fruit) as Fruit[];

    for (const fruit of fruits) {
      fruit.advanceRipening();
    }

    // Spawn new fruits in empty cells
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (board.isEmpty(x, y)) {
          if (Random.chance(DEFAULT_CONFIG.fruit.spawnProbability)) {
            const newFruit = new Fruit(x, y);
            board.setEntity(x, y, newFruit);
            spawnCount++;
          }
        }
      }
    }

    if (spawnCount > 0) {
      console.log(`[PlantSpawn] Spawned ${spawnCount} new fruits`);
    }
  }
}
