import type { Board } from '../core/Board';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';
import type { GameConfig } from '../ui/ConfigPanel';

/**
 * Phase 7: Spawning.
 *
 * Existing fruits ripen by one round, then every empty cell may spawn (at most one
 * of, in priority order) a fruit, mushroom, wolf or dog with the configured
 * per-cell probabilities. Spawned entities use the configured stats.
 */
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
    for (const entity of board.getAllEntities()) {
      if (!(entity instanceof Fruit)) continue;
      const wasUnripe = !entity.isRipe();
      entity.advanceRipening();
      // Mark dirty if fruit just ripened (visual changed from 🍏 to 🍎)
      if (wasUnripe && entity.isRipe()) {
        this.renderer.markDirty(entity.x, entity.y);
      }
    }

    // Priority order: fruit → mushroom → wolf → dog (only one spawns per cell)
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.isEmpty(x, y)) continue;
        if (Random.chance(config.fruit.spawnProbability)) {
          board.setEntity(x, y, new Fruit(x, y, config.fruit.energyHealed, config.fruit.roundsToRipen));
          fruitSpawnCount++;
        } else if (Random.chance(config.mushroom.spawnProbability)) {
          board.setEntity(x, y, new Mushroom(x, y, config.mushroom.energyRemoved));
          mushroomSpawnCount++;
        } else if (Random.chance(config.wolf.spawnProbability)) {
          board.setEntity(
            x,
            y,
            new Wolf(x, y, config.wolf.startingHealth, config.wolf.gompertzA, config.wolf.gompertzB),
          );
          wolfSpawnCount++;
        } else if (Random.chance(config.dog.spawnProbability)) {
          board.setEntity(x, y, new Dog(x, y, config.dog.startingHealth, config.dog.gompertzA, config.dog.gompertzB));
          dogSpawnCount++;
        } else {
          continue;
        }
        this.renderer.markDirty(x, y);
      }
    }

    if (fruitSpawnCount + mushroomSpawnCount + wolfSpawnCount + dogSpawnCount > 0) {
      debugLog(
        `[Spawn] Spawned ${fruitSpawnCount} fruits, ${mushroomSpawnCount} mushrooms, ${wolfSpawnCount} wolves, ${dogSpawnCount} dogs`,
      );
    }
  }
}
