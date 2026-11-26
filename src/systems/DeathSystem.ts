import type { Board } from '../core/Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { Gompertz } from '../utils/Gompertz';
import { debugLog } from '../utils/debug';

/**
 * Phase 5: Death.
 *
 * Every entity ages by one round. Creatures with health ≤ 0 are removed. Surviving
 * creatures then roll Gompertz age mortality with their (new) age; when a group's
 * population exceeds its overcrowding threshold the hazard is multiplied by the
 * configured multiplier (humans vs. animals = wolves + dogs).
 */
export class DeathSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): void {
    const entities = board.getAllEntities();
    const toRemove: Entity[] = [];

    // Single counting pass for overcrowding
    let humanCount = 0;
    let animalCount = 0;
    for (const e of entities) {
      if (e instanceof Human) humanCount++;
      else if (e instanceof Wolf || e instanceof Dog) animalCount++;
    }

    const { humanThreshold, humanMultiplier, animalThreshold, animalMultiplier } = config.overcrowding;
    const humanFactor = humanCount > humanThreshold ? humanMultiplier : 1;
    const animalFactor = animalCount > animalThreshold ? animalMultiplier : 1;
    if (humanFactor !== 1) debugLog(`[Death] Human overcrowding (${humanCount} > ${humanThreshold}) ×${humanFactor}`);
    if (animalFactor !== 1)
      debugLog(`[Death] Animal overcrowding (${animalCount} > ${animalThreshold}) ×${animalFactor}`);

    let healthDeaths = 0;
    let ageDeaths = 0;

    for (const entity of entities) {
      entity.incrementAge();

      if (entity.isDead()) {
        toRemove.push(entity);
        healthDeaths++;
        continue;
      }

      let factor: number | null = null;
      if (entity instanceof Human) factor = humanFactor;
      else if (entity instanceof Wolf || entity instanceof Dog) factor = animalFactor;
      if (factor === null) continue; // plants have no age mortality

      if (Gompertz.shouldDie(entity.age, entity.gompertzA, entity.gompertzB, factor)) {
        toRemove.push(entity);
        ageDeaths++;
      }
    }

    for (const entity of toRemove) {
      board.removeEntity(entity.x, entity.y);
      this.renderer.markDirty(entity.x, entity.y);
    }

    if (toRemove.length > 0) {
      debugLog(`[Death] Total deaths: ${toRemove.length} (health: ${healthDeaths}, age: ${ageDeaths})`);
    }
  }
}
