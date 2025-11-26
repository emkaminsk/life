import { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Fruit } from '../entities/Fruit';
import { Renderer } from '../core/Renderer';
import { DEFAULT_CONFIG } from '../config';

export class EatingSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    const humans = entities.filter(e => e instanceof Human) as Human[];
    let eatingCount = 0;

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

          eatingCount++;
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

    if (eatingCount > 0) {
      console.log(`[Eating] Total fruits consumed: ${eatingCount}`);
    }
  }
}
