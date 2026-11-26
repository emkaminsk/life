import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { VISUAL_EFFECT_DURATION_MS } from '../config';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';
import { ENERGY_MODIFIERS, modulatedProbability } from '../utils/energy';

/**
 * Phase 4: Reproduction.
 *
 * Every living female that can reproduce (not pregnant, no cooldown) tries each
 * adjacent (incl. diagonals) living male independently, in random order (PRD 3.3.3,
 * US-032); the first success makes that male the father. Each try succeeds with
 * `config.human.reproductionProbability` × the male's energy modifier (PRD 3.16.4:
 * 0 when DESPERATE/HUNGRY, ×1.5 when FULL/SATIATED), capped at 1. With k eligible
 * males of probability p she therefore conceives with 1 − (1 − p)^k.
 *
 * Pregnancies already under way advance by one round; a pregnancy started this
 * round does not advance until next round, so a pregnancy period of N means birth
 * exactly N rounds after conception.
 */
export class ReproductionSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /** @returns the number of new pregnancies this round */
  execute(board: Board, config: GameConfig): number {
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

      const father = this.chooseFather(board, female, config.human.reproductionProbability);
      if (father) {
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

    return conceivedThisRound.size;
  }

  /**
   * Roll once per adjacent living male, in shuffled order; the first success is the
   * father. Males whose energy modifier gives probability 0 consume no random draw.
   */
  private chooseFather(board: Board, female: Human, baseProbability: number): Human | null {
    const males: Human[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const e = board.getEntity(female.x + dx, female.y + dy);
        if (e instanceof Human && e.isMale() && !e.isDead()) males.push(e);
      }
    }
    shuffle(males);
    for (const male of males) {
      const p = modulatedProbability(baseProbability, ENERGY_MODIFIERS[male.getEnergyState()].reproduction);
      if (p > 0 && Random.chance(p)) return male;
    }
    return null;
  }
}

/** In-place Fisher–Yates shuffle using the central Random source. */
function shuffle<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Random.next() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
