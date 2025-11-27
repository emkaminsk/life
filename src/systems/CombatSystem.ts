import { Board } from '../core/Board';
import { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Renderer } from '../core/Renderer';
import { DEFAULT_CONFIG } from '../config';

export class CombatSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): void {
    const entities = board.getAllEntities();
    const combatPairs: [Entity, Entity][] = [];

    // Find all adjacent combat pairs
    for (const entity of entities) {
      const adjacentPositions = board.getAdjacentPositions(entity.x, entity.y);

      for (const pos of adjacentPositions) {
        const adjacent = board.getEntity(pos.x, pos.y);
        if (!adjacent) continue;

        // Avoid processing same pair twice
        if (entities.indexOf(entity) > entities.indexOf(adjacent)) continue;

        // Check for combat conditions
        if (this.shouldFight(entity, adjacent)) {
          combatPairs.push([entity, adjacent]);
        }
      }
    }

    console.log(`[Combat] Found ${combatPairs.length} combat pairs`);

    // Execute combat for each pair
    for (const [entity1, entity2] of combatPairs) {
      this.resolveCombat(entity1, entity2);
    }
  }

  private shouldFight(entity1: Entity, entity2: Entity): boolean {
    // Male vs Male
    if (entity1 instanceof Human && entity1.isMale() &&
        entity2 instanceof Human && entity2.isMale()) {
      return true;
    }

    // Wolf vs Human (any sex)
    if ((entity1 instanceof Wolf && entity2 instanceof Human) ||
        (entity1 instanceof Human && entity2 instanceof Wolf)) {
      return true;
    }

    // Dog vs Wolf
    if ((entity1 instanceof Dog && entity2 instanceof Wolf) ||
        (entity1 instanceof Wolf && entity2 instanceof Dog)) {
      return true;
    }

    return false;
  }

  private resolveCombat(entity1: Entity, entity2: Entity): void {
    // Male vs Male combat
    if (entity1 instanceof Human && entity1.isMale() &&
        entity2 instanceof Human && entity2.isMale()) {
      const damage = DEFAULT_CONFIG.human.maleVsMaleDamage;
      entity1.takeDamage(damage);
      entity2.takeDamage(damage);

      console.log(`[Combat] Male vs Male at (${entity1.x},${entity1.y}) and (${entity2.x},${entity2.y}): both take ${damage} damage`);

      this.addCombatEffect(entity1.x, entity1.y);
      this.addCombatEffect(entity2.x, entity2.y);
      return;
    }

    // Dog vs Wolf combat
    if ((entity1 instanceof Dog && entity2 instanceof Wolf) ||
        (entity1 instanceof Wolf && entity2 instanceof Dog)) {
      const dog = entity1 instanceof Dog ? entity1 : entity2;
      const wolf = entity1 instanceof Wolf ? entity1 : entity2;

      // Dog deals damage to wolf
      const dogDamage = DEFAULT_CONFIG.dog.damageToWolf;
      wolf.takeDamage(dogDamage);

      // Wolf counter-attacks with half damage (PRD US-019)
      const wolfCounterDamage = Math.floor(dogDamage / 2);
      dog.takeDamage(wolfCounterDamage);

      console.log(`[Combat] Dog at (${dog.x},${dog.y}) vs Wolf at (${wolf.x},${wolf.y}): Dog deals ${dogDamage}, Wolf deals ${wolfCounterDamage}`);

      this.addCombatEffect(wolf.x, wolf.y);
      this.addCombatEffect(dog.x, dog.y);

      return;
    }

    // Wolf vs Human combat
    let wolf: Wolf;
    let human: Human;

    if (entity1 instanceof Wolf && entity2 instanceof Human) {
      wolf = entity1;
      human = entity2;
    } else if (entity1 instanceof Human && entity2 instanceof Wolf) {
      human = entity1;
      wolf = entity2;
    } else {
      return;
    }

    // Wolf attacks human
    const wolfDamage = DEFAULT_CONFIG.wolf.damageToHuman;
    human.takeDamage(wolfDamage);

    console.log(`[Combat] Wolf at (${wolf.x},${wolf.y}) attacks ${human.sex} at (${human.x},${human.y}): ${wolfDamage} damage`);

    this.addCombatEffect(human.x, human.y);

    // Male human counter-attacks
    if (human.isMale()) {
      const counterDamage = DEFAULT_CONFIG.human.maleVsWolfDamage;
      wolf.takeDamage(counterDamage);

      console.log(`[Combat] Male counter-attacks wolf: ${counterDamage} damage`);

      this.addCombatEffect(wolf.x, wolf.y);
    }
  }

  private addCombatEffect(x: number, y: number): void {
    this.renderer.addVisualEffect({
      type: 'combat',
      x,
      y,
      startTime: Date.now(),
      duration: 300 // 300ms flash
    });
    this.renderer.markDirty(x, y);
  }
}
