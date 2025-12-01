import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import type { Renderer } from '../core/Renderer';
import { Random } from '../utils/Random';
import { DEFAULT_CONFIG } from '../config';

export class ReproductionSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    const females = entities.filter(e => e instanceof Human && e.isFemale()) as Human[];
    let pregnancyCount = 0;

    for (const female of females) {
      // Skip if already pregnant or in cooldown
      if (!female.canReproduce()) {
        // Decrement cooldown if applicable
        female.decrementCooldown();
        continue;
      }

      // Find adjacent males
      const adjacentPositions = board.getAdjacentPositions(female.x, female.y);
      let foundMale: Human | null = null;

      for (const pos of adjacentPositions) {
        const adjacent = board.getEntity(pos.x, pos.y);
        if (adjacent instanceof Human && adjacent.isMale()) {
          foundMale = adjacent;
          break;
        }
      }

      // If adjacent to male, chance of pregnancy
      if (foundMale && Random.chance(DEFAULT_CONFIG.human.reproductionProbability)) {
        // Start pregnancy passing father's genome
        female.startPregnancy(foundMale.genome);
        pregnancyCount++;

        // Add reproduction visual effect
        this.renderer.addVisualEffect({
          type: 'reproduction',
          x: female.x,
          y: female.y,
          startTime: Date.now(),
          duration: 400 // 400ms green flash
        });
        this.renderer.markDirty(female.x, female.y);

        console.log(`[Reproduction] Pregnancy initiated at (${female.x},${female.y})`);
      }
    }

    if (pregnancyCount > 0) {
      console.log(`[Reproduction] ${pregnancyCount} new pregnancies`);
    }

    // Advance all existing pregnancies
    for (const female of females) {
      if (female.isPregnant()) {
        female.advancePregnancy();
      }
    }
  }
}
