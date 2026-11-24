import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Fruit } from '../entities/Fruit';
import { Mushroom } from '../entities/Mushroom';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { VISUAL_EFFECT_DURATION_MS } from '../config';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';

/**
 * Phase 3: Eating.
 * - Each ripe fruit is eaten by one random adjacent living human whose health is
 *   below maximum (heals the fruit's energy, capped at max health; yellow flash).
 * - Each mushroom is eaten by one random adjacent living human (loses the
 *   mushroom's energy; red flash).
 * Humans at 0 health (e.g. killed in combat this round) don't eat.
 *
 * Heal/damage amounts are carried by each plant (set from config when spawned).
 */
export class EatingSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, _config: GameConfig): void {
    const entities = board.getAllEntities();
    let fruitEatingCount = 0;
    let mushroomEatingCount = 0;

    // Fruits first (each resolved in scan order so a human healed to full by one
    // fruit is no longer eligible for the next)
    for (const entity of entities) {
      if (!(entity instanceof Fruit) || !entity.isRipe()) continue;
      const eligible = this.adjacentHumans(board, entity.x, entity.y).filter((h) => h.health < h.maxHealth);
      if (eligible.length === 0) continue;
      const human = eligible.length === 1 ? eligible[0] : (Random.choice(eligible) as Human);

      human.heal(entity.energyHealed, human.maxHealth);
      board.removeEntity(entity.x, entity.y);
      fruitEatingCount++;
      this.flash('eating', entity.x, entity.y);
      this.renderer.markDirty(human.x, human.y);
      debugLog(`[Eating] Human at (${human.x},${human.y}) ate fruit at (${entity.x},${entity.y})`);
    }

    // Mushrooms
    for (const entity of entities) {
      if (!(entity instanceof Mushroom)) continue;
      const adjacent = this.adjacentHumans(board, entity.x, entity.y);
      if (adjacent.length === 0) continue;
      const human = adjacent.length === 1 ? adjacent[0] : (Random.choice(adjacent) as Human);

      human.takeDamage(entity.energyRemoved);
      board.removeEntity(entity.x, entity.y);
      mushroomEatingCount++;
      this.flash('combat', entity.x, entity.y); // red flash for poisoning
      this.renderer.markDirty(human.x, human.y);
      debugLog(`[Eating] Human at (${human.x},${human.y}) ate mushroom at (${entity.x},${entity.y})`);
    }

    if (fruitEatingCount > 0 || mushroomEatingCount > 0) {
      debugLog(`[Eating] Total consumed: ${fruitEatingCount} fruits, ${mushroomEatingCount} mushrooms`);
    }
  }

  /** Living humans in the 8 cells around (x, y). */
  private adjacentHumans(board: Board, x: number, y: number): Human[] {
    const humans: Human[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const e = board.getEntity(x + dx, y + dy);
        if (e instanceof Human && !e.isDead()) humans.push(e);
      }
    }
    return humans;
  }

  private flash(type: 'eating' | 'combat', x: number, y: number): void {
    this.renderer.addVisualEffect({ type, x, y, startTime: Date.now(), duration: VISUAL_EFFECT_DURATION_MS });
    this.renderer.markDirty(x, y);
  }
}
