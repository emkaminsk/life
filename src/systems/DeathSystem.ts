import type { Board } from '../core/Board';
import type { DeathCause, DeathRecord, Species } from '../core/simulationEvents';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { Gompertz } from '../utils/Gompertz';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';

/** History species of a creature, or null for plants (which are counted, not tracked). */
export function speciesOf(entity: Entity): Species | null {
  if (entity instanceof Human) return entity.isMale() ? 'male' : 'female';
  if (entity instanceof Wolf) return 'wolf';
  if (entity instanceof Dog) return 'dog';
  return null;
}

/** DeathRecord for a creature that just died, or null for plants. */
export function deathRecordOf(entity: Entity, cause: DeathCause): DeathRecord | null {
  const species = speciesOf(entity);
  return species ? { species, cause, age: entity.age } : null;
}

/**
 * Gompertz B actually used for an entity's age mortality: humans scale it by their
 * heritable longevity gene (PRD 3.17: below 1 ages slower, above 1 faster).
 */
export function effectiveGompertzB(entity: Entity): number {
  return entity instanceof Human ? entity.gompertzB * entity.genome.longevity : entity.gompertzB;
}

/**
 * Phase 5: Death.
 *
 * Every entity ages by one round. Creatures with health ≤ 0 are removed and recorded
 * with the cause set by whoever dealt the lethal damage (`entity.deathCause`, else
 * 'unknown'). Surviving creatures then roll Gompertz age mortality with their (new)
 * age; when a group's population exceeds its overcrowding threshold the hazard is
 * multiplied by the configured multiplier (humans vs. animals = wolves + dogs).
 *
 * An age death is attributed with the same single random draw `r` that decides it:
 * 'overcrowding' when the multiplier is active and `r` would have survived the plain
 * hazard (the crowding tipped the balance), otherwise 'oldAge'.
 *
 * This is the only system that records health deaths (combat, mushrooms, metabolism),
 * so they are never counted twice. BirthSystem records its own childbirth deaths
 * because the mother is removed in phase 6, after this phase.
 */
export class DeathSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): DeathRecord[] {
    const entities = board.getAllEntities();
    const toRemove: Entity[] = [];
    const deaths: DeathRecord[] = [];

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

    for (const entity of entities) {
      entity.incrementAge();

      if (entity.isDead()) {
        toRemove.push(entity);
        const record = deathRecordOf(entity, entity.deathCause ?? 'unknown');
        if (record) deaths.push(record);
        continue;
      }

      let factor: number | null = null;
      if (entity instanceof Human) factor = humanFactor;
      else if (entity instanceof Wolf || entity instanceof Dog) factor = animalFactor;
      if (factor === null) continue; // plants have no age mortality

      const A = entity.gompertzA;
      const B = effectiveGompertzB(entity);
      const r = Random.next(); // the one draw that both decides and attributes the death
      if (r < Gompertz.deathProbability(entity.age, A, B, factor)) {
        const cause: DeathCause =
          factor > 1 && r >= Gompertz.deathProbability(entity.age, A, B, 1) ? 'overcrowding' : 'oldAge';
        entity.kill(cause);
        toRemove.push(entity);
        const record = deathRecordOf(entity, cause);
        if (record) deaths.push(record);
      }
    }

    for (const entity of toRemove) {
      board.removeEntity(entity.x, entity.y);
      this.renderer.markDirty(entity.x, entity.y);
    }

    if (deaths.length > 0) {
      debugLog(`[Death] Total deaths: ${deaths.length} (${deaths.map((d) => `${d.species}:${d.cause}`).join(', ')})`);
    }
    return deaths;
  }
}
