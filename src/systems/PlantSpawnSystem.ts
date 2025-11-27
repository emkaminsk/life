import { Board } from '../core/Board';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Random } from '../utils/Random';
import { DEFAULT_CONFIG } from '../config';

export class PlantSpawnSystem {
  execute(board: Board): void {
    let fruitSpawnCount = 0;
    let mushroomSpawnCount = 0;

    // Advance ripening for all existing fruits
    const entities = board.getAllEntities();
    const fruits = entities.filter(e => e instanceof Fruit) as Fruit[];

    for (const fruit of fruits) {
      fruit.advanceRipening();
    }

    // Spawn new fruits and mushrooms in empty cells
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (board.isEmpty(x, y)) {
          // Try to spawn fruit
          if (Random.chance(DEFAULT_CONFIG.fruit.spawnProbability)) {
            const newFruit = new Fruit(x, y);
            board.setEntity(x, y, newFruit);
            fruitSpawnCount++;
          }
          // Try to spawn mushroom (only if fruit didn't spawn)
          else if (Random.chance(DEFAULT_CONFIG.mushroom.spawnProbability)) {
            const newMushroom = new Mushroom(x, y);
            board.setEntity(x, y, newMushroom);
            mushroomSpawnCount++;
          }
        }
      }
    }

    if (fruitSpawnCount > 0 || mushroomSpawnCount > 0) {
      console.log(`[PlantSpawn] Spawned ${fruitSpawnCount} fruits, ${mushroomSpawnCount} mushrooms`);
    }
  }
}
