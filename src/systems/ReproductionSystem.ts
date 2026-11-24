import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { VISUAL_EFFECT_DURATION_MS } from '../config';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';

/**
 * Phase 4: Reproduction.
 *
 * Every living female that can reproduce (not pregnant, no cooldown) and is adjacent
 * (incl. diagonals) to a living male becomes pregnant with
 * `config.human.reproductionProbability`. Pregnancies already under way advance by
 * one round; a pregnancy started this round does not advance until next round, so a
 * pregnancy period of N means birth exactly N rounds after conception.
 */
export class ReproductionSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): void {
    const entities = board.getAllEntities();
    const females: Human[] = [];
    for (const e of entities) {
      if (e instanceof Human && e.isFemale()) females.push(e);
    }
    const conceivedThisRound = new Set<Human>();

    for (const female of females) {
      if (female.isDead()) continue;

      // Skip if already pregnant or in cooldown
      if (!female.canReproduce()) {
        female.decrementCooldown();
        continue;
      }

      const father = this.findAdjacentMale(board, female);
      if (father && Random.chance(config.human.reproductionProbability)) {
        female.startPregnancy(father.genome, config.human.pregnancyPeriod);
        conceivedThisRound.add(female);

        this.renderer.addVisualEffect({
          type: 'reproduction',
          x: female.x,
          y: female.y,
          startTime: Date.now(),
          duration: VISUAL_EFFECT_DURATION_MS,
        });
        this.renderer.markDirty(female.x, female.y);
        debugLog(`[Reproduction] Pregnancy initiated at (${female.x},${female.y})`);
      }
    }

    if (conceivedThisRound.size > 0) {
      debugLog(`[Reproduction] ${conceivedThisRound.size} new pregnancies`);
    }

    // Advance pregnancies that started in earlier rounds
    for (const female of females) {
      if (female.isPregnant() && !conceivedThisRound.has(female)) {
        if (female.advancePregnancy(config.human.cooldownPeriod)) {
          this.renderer.markDirty(female.x, female.y); // 🤰 → 👩 after birth
        }
      }
    }
  }

  private findAdjacentMale(board: Board, female: Human): Human | null {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const e = board.getEntity(female.x + dx, female.y + dy);
        if (e instanceof Human && e.isMale() && !e.isDead()) return e;
      }
    }
    return null;
  }
}
