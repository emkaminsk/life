import type { Board } from '../core/Board';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import { Random } from '../utils/Random';
import type { GameConfig } from '../ui/ConfigPanel';

export class SpawnSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): void {
    let fruitSpawnCount = 0;
    let mushroomSpawnCount = 0;
    let wolfSpawnCount = 0;
    let dogSpawnCount = 0;

    // Advance ripening for all existing fruits
    const entities = board.getAllEntities();
    const fruits = entities.filter(e => e instanceof Fruit) as Fruit[];

    for (const fruit of fruits) {
      const wasUnripe = !fruit.isRipe();
      fruit.advanceRipening();
      // Mark dirty if fruit just ripened (visual changed from green to red)
      if (wasUnripe && fruit.isRipe()) {
        this.renderer.markDirty(fruit.x, fruit.y);
      }
    }

    // Spawn new fruits, mushrooms, wolves, and dogs in empty cells
    // Priority order: fruit → mushroom → wolf → dog (only one spawns per cell)
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (board.isEmpty(x, y)) {
          // Try to spawn fruit
          if (Random.chance(config.fruit.spawnProbability)) {
            const newFruit = new Fruit(x, y);
            board.setEntity(x, y, newFruit);
            this.renderer.markDirty(x, y);
            fruitSpawnCount++;
          }
          // Try to spawn mushroom (only if fruit didn't spawn)
          else if (Random.chance(config.mushroom.spawnProbability)) {
            const newMushroom = new Mushroom(x, y);
            board.setEntity(x, y, newMushroom);
            this.renderer.markDirty(x, y);
            mushroomSpawnCount++;
          }
          // Try to spawn wolf (only if fruit and mushroom didn't spawn)
          else if (Random.chance(config.wolf.spawnProbability)) {
            const newWolf = new Wolf(x, y, config.wolf.startingHealth, config.wolf.gompertzA, config.wolf.gompertzB);
            board.setEntity(x, y, newWolf);
            this.renderer.markDirty(x, y);
            wolfSpawnCount++;
          }
          // Try to spawn dog (only if fruit, mushroom, and wolf didn't spawn)
          else if (Random.chance(config.dog.spawnProbability)) {
            const newDog = new Dog(x, y, config.dog.startingHealth, config.dog.gompertzA, config.dog.gompertzB);
            board.setEntity(x, y, newDog);
            this.renderer.markDirty(x, y);
            dogSpawnCount++;
          }
        }
      }
    }

    if (fruitSpawnCount > 0 || mushroomSpawnCount > 0 || wolfSpawnCount > 0 || dogSpawnCount > 0) {
      console.log(`[Spawn] Spawned ${fruitSpawnCount} fruits, ${mushroomSpawnCount} mushrooms, ${wolfSpawnCount} wolves, ${dogSpawnCount} dogs`);
    }
  }
}
