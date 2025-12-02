import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import type { Renderer } from '../core/Renderer';
import { Random } from '../utils/Random';

export class EatingSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    let fruitEatingCount = 0;
    let mushroomEatingCount = 0;

    // Handle fruit eating - iterate through fruits
    const fruitsToRemove: { x: number; y: number; human: Human; fruit: Fruit }[] = [];

    for (const entity of entities) {
      if (entity instanceof Fruit && entity.isRipe()) {
        const adjacentPositions = board.getAdjacentPositions(entity.x, entity.y);
        const eligibleHumans: Human[] = [];

        // Find adjacent humans with health below maximum
        for (const pos of adjacentPositions) {
          const adjacent = board.getEntity(pos.x, pos.y);
          if (adjacent instanceof Human && adjacent.health < adjacent.genome.maxHealth) {
            eligibleHumans.push(adjacent);
          }
        }

        // One random eligible human eats the fruit
        if (eligibleHumans.length > 0) {
          const human = Random.choice(eligibleHumans)!;
          fruitsToRemove.push({ x: entity.x, y: entity.y, human, fruit: entity });
        }
      }
    }

    // Process fruit eating
    for (const { x, y, human, fruit } of fruitsToRemove) {
      const healAmount = fruit.energyHealed;
      human.heal(healAmount, human.genome.maxHealth);

      // Remove fruit from board
      board.removeEntity(x, y);

      fruitEatingCount++;

      // Add eating visual effect
      this.renderer.addVisualEffect({
        type: 'eating',
        x,
        y,
        startTime: Date.now(),
        duration: 300 // 300ms yellow flash
      });
      this.renderer.markDirty(x, y);
      this.renderer.markDirty(human.x, human.y); // Mark human dirty too (might remove red border)

      console.log(`[Eating] Human at (${human.x},${human.y}) consumed fruit at (${x},${y}), healed ${healAmount} HP`);
    }

    // Handle mushroom poisoning - separate loop to avoid conflicts
    const mushroomsToRemove: { x: number; y: number; human: Human; mushroom: Mushroom }[] = [];

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
          mushroomsToRemove.push({ x: entity.x, y: entity.y, human, mushroom: entity });
        }
      }
    }

    // Process mushroom poisoning
    for (const { x, y, human, mushroom } of mushroomsToRemove) {
      const damage = mushroom.energyRemoved;
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
