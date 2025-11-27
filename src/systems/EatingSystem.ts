import { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import { Renderer } from '../core/Renderer';
import { DEFAULT_CONFIG } from '../config';
import { Random } from '../utils/Random';

export class EatingSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    const humans = entities.filter(e => e instanceof Human) as Human[];
    let fruitEatingCount = 0;
    let mushroomEatingCount = 0;

    for (const human of humans) {
      // Find adjacent ripe fruits
      const adjacentPositions = board.getAdjacentPositions(human.x, human.y);
      let fruitConsumed = false;

      for (const pos of adjacentPositions) {
        if (fruitConsumed) break;

        const adjacent = board.getEntity(pos.x, pos.y);
        if (adjacent instanceof Fruit && adjacent.isRipe()) {
          // Consume fruit
          const healAmount = DEFAULT_CONFIG.fruit.energyHealed;
          human.heal(healAmount, DEFAULT_CONFIG.human.startingHealth);

          // Remove fruit from board
          board.removeEntity(pos.x, pos.y);

          fruitEatingCount++;
          fruitConsumed = true;

          // Add eating visual effect
          this.renderer.addVisualEffect({
            type: 'eating',
            x: pos.x,
            y: pos.y,
            startTime: Date.now(),
            duration: 300 // 300ms yellow flash
          });
          this.renderer.markDirty(pos.x, pos.y);
          this.renderer.markDirty(human.x, human.y); // Mark human dirty too (might remove red border)

          console.log(`[Eating] Human at (${human.x},${human.y}) consumed fruit at (${pos.x},${pos.y}), healed ${healAmount} HP`);
        }
      }
    }

    // Handle mushroom poisoning - separate loop to avoid conflicts
    const mushroomsToRemove: { x: number; y: number; human: Human }[] = [];

    for (const entity of entities) {
      if (entity instanceof Mushroom) {
        const adjacentPositions = board.getAdjacentPositions(entity.x, entity.y);
        const adjacentHumans: Human[] = [];

        for (const pos of adjacentPositions) {
          const adjacent = board.getEntity(pos.x, pos.y);
          if (adjacent instanceof Human) {
            adjacentHumans.push(adjacent);
          }
        }

        // One random adjacent human eats the mushroom
        if (adjacentHumans.length > 0) {
          const human = Random.choice(adjacentHumans)!;
          mushroomsToRemove.push({ x: entity.x, y: entity.y, human });
        }
      }
    }

    // Process mushroom poisoning
    for (const { x, y, human } of mushroomsToRemove) {
      const damage = DEFAULT_CONFIG.mushroom.energyRemoved;
      human.takeDamage(damage);

      // Remove mushroom from board
      board.removeEntity(x, y);

      mushroomEatingCount++;

      // Add eating visual effect (red flash for poisoning)
      this.renderer.addVisualEffect({
        type: 'combat', // Use combat color (red) for poisoning
        x,
        y,
        startTime: Date.now(),
        duration: 300
      });
      this.renderer.markDirty(x, y);
      this.renderer.markDirty(human.x, human.y);

      console.log(`[Eating] Human at (${human.x},${human.y}) ate mushroom at (${x},${y}), took ${damage} poison damage`);
    }

    if (fruitEatingCount > 0 || mushroomEatingCount > 0) {
      console.log(`[Eating] Total consumed: ${fruitEatingCount} fruits, ${mushroomEatingCount} mushrooms`);
    }
  }
}
