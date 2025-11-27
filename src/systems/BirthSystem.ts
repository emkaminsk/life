import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Sex } from '../types';
import type { Renderer } from '../core/Renderer';
import { Random } from '../utils/Random';

export class BirthSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    const females = entities.filter(e => e instanceof Human && e.isFemale()) as Human[];
    let birthCount = 0;

    for (const female of females) {
      // Check if ready to give birth
      if (female.readyToGiveBirth) {
        // Find empty adjacent cell for baby
        const emptyPositions = board.getEmptyAdjacentPositions(female.x, female.y);

        if (emptyPositions.length > 0) {
          // Choose random empty position
          const birthPosition = Random.choice(emptyPositions);

          if (birthPosition) {
            // 50% chance male, 50% chance female
            const babySex = Random.chance(0.5) ? Sex.MALE : Sex.FEMALE;
            const baby = new Human(birthPosition.x, birthPosition.y, babySex);

            board.setEntity(birthPosition.x, birthPosition.y, baby);
            birthCount++;

            // Add birth visual effect
            this.renderer.addVisualEffect({
              type: 'reproduction',
              x: birthPosition.x,
              y: birthPosition.y,
              startTime: Date.now(),
              duration: 500 // 500ms green flash
            });
            this.renderer.markDirty(birthPosition.x, birthPosition.y);

            console.log(`[Birth] ${babySex} baby born at (${birthPosition.x},${birthPosition.y})`);
          }

          // Clear birth flag
          female.readyToGiveBirth = false;
        } else {
          // No space available - baby spawns at mother's position, mother dies
          const babySex = Random.chance(0.5) ? Sex.MALE : Sex.FEMALE;
          const baby = new Human(female.x, female.y, babySex);

          // Remove mother and place baby
          board.removeEntity(female.x, female.y);
          board.setEntity(female.x, female.y, baby);
          birthCount++;

          // Add birth visual effect
          this.renderer.addVisualEffect({
            type: 'reproduction',
            x: female.x,
            y: female.y,
            startTime: Date.now(),
            duration: 500 // 500ms green flash
          });
          this.renderer.markDirty(female.x, female.y);

          console.log(`[Birth] Mother died giving birth, ${babySex} baby occupies her position at (${female.x},${female.y})`);

          // Clear birth flag (female no longer exists, but for consistency)
          // Note: Mother is removed, so this won't persist, but shows intent
        }
      }
    }

    if (birthCount > 0) {
      console.log(`[Birth] Total births this round: ${birthCount}`);
    }
  }
}
