import type { Board } from '../core/Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';
import { VISUAL_EFFECT_DURATION_MS } from '../config';
import { Random } from '../utils/Random';
import { debugLog } from '../utils/debug';

/**
 * "Forward" half of the 8-neighbourhood. Checking only these offsets from every
 * cell visits each unordered adjacent pair exactly once (O(n), no dedupe lookups).
 */
const FORWARD_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/**
 * Phase 2: Combat. Damage is dealt here; removal happens in the death phase.
 * - Male vs male: both take damage (strength-scaled) simultaneously.
 * - Wolf vs human: human takes damage; males counter-attack (strength-scaled).
 * - Dog vs wolf: wolf takes dog damage, dog takes wolf counter-damage.
 * A creature knocked to 0 health by an earlier pair this round takes no part in
 * later pairs.
 */
export class CombatSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board, config: GameConfig): void {
    const pairs = CombatSystem.findCombatPairs(board);
    debugLog(`[Combat] Found ${pairs.length} combat pairs`);

    for (const [entity1, entity2] of pairs) {
      // Dead creatures don't keep fighting within the same round
      if (entity1.isDead() || entity2.isDead()) continue;
      this.resolveCombat(entity1, entity2, config);
    }
  }

  /** All adjacent pairs that fight, each unordered pair exactly once, in row-major order. */
  static findCombatPairs(board: Board): [Entity, Entity][] {
    const pairs: [Entity, Entity][] = [];
    const grid = board.grid;
    for (let y = 0; y < board.height; y++) {
      const row = grid[y];
      for (let x = 0; x < board.width; x++) {
        const entity = row[x];
        if (!entity || !CombatSystem.isCombatant(entity)) continue;
        for (const [dx, dy] of FORWARD_OFFSETS) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= board.width || ny >= board.height) continue;
          const other = grid[ny][nx];
          if (other && CombatSystem.shouldFight(entity, other)) {
            pairs.push([entity, other]);
          }
        }
      }
    }
    return pairs;
  }

  private static isCombatant(entity: Entity): boolean {
    return entity instanceof Human || entity instanceof Wolf || entity instanceof Dog;
  }

  static shouldFight(entity1: Entity, entity2: Entity): boolean {
    // Male vs Male
    if (entity1 instanceof Human && entity1.isMale() && entity2 instanceof Human && entity2.isMale()) {
      return true;
    }
    // Wolf vs Human (any sex)
    if ((entity1 instanceof Wolf && entity2 instanceof Human) || (entity1 instanceof Human && entity2 instanceof Wolf)) {
      return true;
    }
    // Dog vs Wolf
    if ((entity1 instanceof Dog && entity2 instanceof Wolf) || (entity1 instanceof Wolf && entity2 instanceof Dog)) {
      return true;
    }
    return false;
  }

  private resolveCombat(entity1: Entity, entity2: Entity, config: GameConfig): void {
    if (entity1 instanceof Human && entity2 instanceof Human) {
      this.resolveMaleVsMale(entity1, entity2, config);
      return;
    }

    if (entity1 instanceof Dog || entity2 instanceof Dog) {
      const dog = (entity1 instanceof Dog ? entity1 : entity2) as Dog;
      const wolf = (entity1 instanceof Wolf ? entity1 : entity2) as Wolf;
      wolf.takeDamage(config.dog.damageToWolf);
      // Wolf counter-attacks with configured damage (PRD US-019)
      dog.takeDamage(config.wolf.damageToDog);
      debugLog(`[Combat] Dog at (${dog.x},${dog.y}) vs Wolf at (${wolf.x},${wolf.y})`);
      this.addCombatEffect(wolf.x, wolf.y);
      this.addCombatEffect(dog.x, dog.y);
      return;
    }

    const wolf = (entity1 instanceof Wolf ? entity1 : entity2) as Wolf;
    const human = (entity1 instanceof Human ? entity1 : entity2) as Human;

    // Wolf attacks human with differentiated damage
    const wolfDamage = human.isMale() ? config.wolf.damageToMale : config.wolf.damageToFemale;
    human.takeDamage(wolfDamage);
    this.addCombatEffect(human.x, human.y);
    debugLog(`[Combat] Wolf at (${wolf.x},${wolf.y}) attacks ${human.sex} at (${human.x},${human.y}): ${wolfDamage}`);

    // Male human counter-attacks using strength gene
    if (human.isMale()) {
      wolf.takeDamage(config.human.maleVsWolfDamage * human.genome.strength);
      this.addCombatEffect(wolf.x, wolf.y);
    }
  }

  /**
   * Both males take damage simultaneously. If exactly one ends at ≤ 0 he dies and the
   * other gains the loser's health from before the fight. If both would end at ≤ 0,
   * only the one with the lower (unclamped) resulting health dies — random on a tie —
   * and the survivor gains the loser's pre-fight health (and keeps at least 1).
   */
  private resolveMaleVsMale(male1: Human, male2: Human, config: GameConfig): void {
    const damage1 = config.human.maleVsMaleDamage * male1.genome.strength; // dealt by male1
    const damage2 = config.human.maleVsMaleDamage * male2.genome.strength; // dealt by male2

    const initial1 = male1.health;
    const initial2 = male2.health;
    const final1 = initial1 - damage2; // unclamped, so "lower health" is meaningful
    const final2 = initial2 - damage1;

    male1.takeDamage(damage2);
    male2.takeDamage(damage1);

    const male1Dying = final1 <= 0;
    const male2Dying = final2 <= 0;

    if (male1Dying && male2Dying) {
      let survivor: Human;
      let loser: Human;
      if (final1 < final2) {
        survivor = male2;
        loser = male1;
      } else if (final2 < final1) {
        survivor = male1;
        loser = male2;
      } else if (Random.chance(0.5)) {
        survivor = male1;
        loser = male2;
      } else {
        survivor = male2;
        loser = male1;
      }
      const loserInitial = loser === male1 ? initial1 : initial2;
      loser.health = 0;
      survivor.heal(loserInitial, survivor.maxHealth);
      if (survivor.health <= 0) survivor.health = 1;
    } else if (male1Dying) {
      male2.heal(initial1, male2.maxHealth);
    } else if (male2Dying) {
      male1.heal(initial2, male1.maxHealth);
    }

    debugLog(`[Combat] Male vs Male at (${male1.x},${male1.y}) and (${male2.x},${male2.y})`);
    this.addCombatEffect(male1.x, male1.y);
    this.addCombatEffect(male2.x, male2.y);
  }

  private addCombatEffect(x: number, y: number): void {
    this.renderer.addVisualEffect({
      type: 'combat',
      x,
      y,
      startTime: Date.now(),
      duration: VISUAL_EFFECT_DURATION_MS,
    });
    this.renderer.markDirty(x, y);
  }
}
