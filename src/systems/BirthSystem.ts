import { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Sex } from '../types';
import { Renderer } from '../core/Renderer';
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
      if (female.isPregnant() && female.pregnancyCounter === 0) {
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
        } else {
          console.log(`[Birth] No space available for birth at (${female.x},${female.y})`);
        }

        // Pregnancy completed (advance was already called in ReproductionSystem)
        // The advancePregnancy() method already set cooldown
      }
    }

    if (birthCount > 0) {
      console.log(`[Birth] Total births this round: ${birthCount}`);
    }
  }
}
