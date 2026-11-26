import type { Board } from '../core/Board';
import { Human } from '../entities/Human';
import { Dog } from '../entities/Dog';
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
 * - Each mushroom is eaten by one adjacent living human or dog (PRD 3.19, US-050).
 *   A human loses the mushroom's energy (red flash, death cause 'mushroom'); a dog
 *   is immune and simply removes it (yellow flash). When several are adjacent the
 *   eater is a uniformly random pick among ALL of them, humans and dogs alike, so a
 *   nearby dog protects humans in proportion to how many dogs are around without
 *   an arbitrary species priority.
 * Creatures at 0 health (e.g. killed in combat this round) don't eat.
 *
 * Heal/damage amounts are carried by each plant (set from config when spawned).
 */
export class EatingSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /** Returns how many fruits and mushrooms were eaten this round. */
  execute(board: Board, _config: GameConfig): { fruits: number; mushrooms: number } {
    const entities = board.getAllEntities();
    let fruitEatingCount = 0;
    let mushroomEatingCount = 0;

    // Fruits first (each resolved in scan order so a human healed to full by one
    // fruit is no longer eligible for the next)
    for (const entity of entities) {
      if (!(entity instanceof Fruit) || !entity.isRipe()) continue;
      const eligible = this.adjacentEaters(board, entity.x, entity.y, false).filter(
        (h): h is Human => h instanceof Human && h.health < h.maxHealth,
      );
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
      const adjacent = this.adjacentEaters(board, entity.x, entity.y, true);
      if (adjacent.length === 0) continue;
      const eater = adjacent.length === 1 ? adjacent[0] : (Random.choice(adjacent) as Human | Dog);

      board.removeEntity(entity.x, entity.y);
      mushroomEatingCount++;
      if (eater instanceof Dog) {
        this.flash('eating', entity.x, entity.y); // dogs are immune: yellow flash, no damage
      } else {
        eater.takeDamage(entity.energyRemoved, 'mushroom');
        this.flash('combat', entity.x, entity.y); // red flash for poisoning
      }
      this.renderer.markDirty(eater.x, eater.y);
      debugLog(`[Eating] ${eater.type} at (${eater.x},${eater.y}) ate mushroom at (${entity.x},${entity.y})`);
    }

    if (fruitEatingCount > 0 || mushroomEatingCount > 0) {
      debugLog(`[Eating] Total consumed: ${fruitEatingCount} fruits, ${mushroomEatingCount} mushrooms`);
    }
    return { fruits: fruitEatingCount, mushrooms: mushroomEatingCount };
  }

  /** Living humans (and, when `withDogs`, living dogs) in the 8 cells around (x, y), row-major. */
  private adjacentEaters(board: Board, x: number, y: number, withDogs: boolean): (Human | Dog)[] {
    const eaters: (Human | Dog)[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const e = board.getEntity(x + dx, y + dy);
        if ((e instanceof Human || (withDogs && e instanceof Dog)) && !e.isDead()) eaters.push(e);
      }
    }
    return eaters;
  }

  private flash(type: 'eating' | 'combat', x: number, y: number): void {
    this.renderer.addVisualEffect({
      type,
      x,
      y,
      startTime: Date.now(),
      duration: VISUAL_EFFECT_DURATION_MS,
    });
    this.renderer.markDirty(x, y);
  }
}
