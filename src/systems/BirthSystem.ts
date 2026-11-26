import type { Board } from '../core/Board';
import type { DeathRecord } from '../core/simulationEvents';
import { Human } from '../entities/Human';
import { Sex, type Genome } from '../types';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { VISUAL_EFFECT_DURATION_MS } from '../config';
import { Random } from '../utils/Random';
import { GenomeUtils } from '../utils/GenomeUtils';
import { debugLog } from '../utils/debug';

/**
 * Phase 6: Birth.
 *
 * Each female whose pregnancy completed gives birth to a baby (50/50 sex) with a
 * genome crossed over from both parents, placed on a random empty adjacent cell.
 * If there is no room the mother dies (cause 'childbirth', recorded here because she
 * is removed after the death phase) and the baby takes her cell. Babies use the
 * configured Gompertz parameters and start at their genome's max health.
 */
export class BirthSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): { births: number; deaths: DeathRecord[] } {
    const entities = board.getAllEntities();
    const deaths: DeathRecord[] = [];
    let birthCount = 0;

    for (const entity of entities) {
      if (!(entity instanceof Human) || !entity.isFemale() || !entity.readyToGiveBirth) continue;
      const female = entity;

      const babyGenome: Genome = female.fatherGenome
        ? GenomeUtils.crossover(female.genome, female.fatherGenome)
        : GenomeUtils.createRandomGenome(
            config.human.startingHealth,
            1.0,
            config.human.moveTowardFruitProbability,
            config.human.avgCaution,
            config.human.avgMetabolism,
          );

      const emptyPositions = board.getEmptyAdjacentPositions(female.x, female.y);
      const birthPosition =
        emptyPositions.length === 0
          ? null
          : emptyPositions.length === 1
            ? emptyPositions[0]
            : Random.choice(emptyPositions);

      const babySex = Random.chance(0.5) ? Sex.MALE : Sex.FEMALE;
      const x = birthPosition ? birthPosition.x : female.x;
      const y = birthPosition ? birthPosition.y : female.y;
      const baby = new Human(
        x,
        y,
        babySex,
        undefined, // starts at genome max health
        config.human.gompertzA,
        config.human.gompertzB,
        babyGenome,
      );

      if (!birthPosition) {
        // No space available - baby takes the mother's place, mother dies
        female.kill('childbirth');
        deaths.push({ species: 'female', cause: 'childbirth', age: female.age });
        board.removeEntity(female.x, female.y);
        debugLog(`[Birth] Mother died giving birth at (${x},${y})`);
      }
      board.setEntity(x, y, baby);
      female.readyToGiveBirth = false;
      female.fatherGenome = undefined;
      birthCount++;

      this.renderer.addVisualEffect({
        type: 'reproduction',
        x,
        y,
        startTime: Date.now(),
        duration: VISUAL_EFFECT_DURATION_MS,
      });
      this.renderer.markDirty(x, y);
      this.renderer.markDirty(female.x, female.y);
    }

    if (birthCount > 0) {
      debugLog(`[Birth] Total births this round: ${birthCount}`);
    }
    return { births: birthCount, deaths };
  }
}
