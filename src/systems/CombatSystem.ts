import type { Board } from '../core/Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import type { Renderer } from '../core/Renderer';
import type { GameConfig } from '../ui/ConfigPanel';

export class CombatSystem {
  private renderer: Renderer;
  private config: GameConfig;

  constructor(renderer: Renderer, config: GameConfig) {
    this.renderer = renderer;
    this.config = config;
  }

  updateConfig(config: GameConfig): void {
    this.config = config;
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
      
      // Calculate individual damage based on strength gene
      const damage1 = this.config.human.maleVsMaleDamage * (entity1 as Human).genome.strength;
      const damage2 = this.config.human.maleVsMaleDamage * (entity2 as Human).genome.strength;

      // Store initial health before combat (for energy transfer)
      const male1InitialHealth = entity1.health;
      const male2InitialHealth = entity2.health;

      // Both males take damage simultaneously
      entity1.takeDamage(damage2); // Entity 1 takes damage from Entity 2
      entity2.takeDamage(damage1); // Entity 2 takes damage from Entity 1

      console.log(`[Combat] Male vs Male at (${entity1.x},${entity1.y}) and (${entity2.x},${entity2.y}): M1 takes ${damage2}, M2 takes ${damage1}`);

      // Handle energy transfer if one or both males have health <= 0
      const male1Dying = entity1.health <= 0;
      const male2Dying = entity2.health <= 0;

      if (male1Dying && male2Dying) {
        // Both would die - only one dies, determined by health level
        let survivor: Human;
        let dyingMale: Human;
        let dyingInitialHealth: number;

        if (entity1.health < entity2.health) {
          // entity1 has lower health, dies
          survivor = entity2;
          dyingMale = entity1;
          dyingInitialHealth = male1InitialHealth;
        } else if (entity2.health < entity1.health) {
          // entity2 has lower health, dies
          survivor = entity1;
          dyingMale = entity2;
          dyingInitialHealth = male2InitialHealth;
        } else {
          // Equal health - random selection
          if (Math.random() < 0.5) {
            survivor = entity1;
            dyingMale = entity2;
            dyingInitialHealth = male2InitialHealth;
          } else {
            survivor = entity2;
            dyingMale = entity1;
            dyingInitialHealth = male1InitialHealth;
          }
        }

        // Survivor gains dying male's initial health
        survivor.heal(dyingInitialHealth, survivor.genome.maxHealth);
        console.log(`[Combat] Both males would die: ${dyingMale === entity1 ? 'Male1' : 'Male2'} dies, survivor gains ${dyingInitialHealth} health`);

        // Set survivor's health to 1 to ensure they survive
        if (survivor.health <= 0) {
          survivor.health = 1;
        }

      } else if (male1Dying) {
        // Only entity1 dies, entity2 gains energy
        entity2.heal(male1InitialHealth, (entity2 as Human).genome.maxHealth);
        console.log(`[Combat] Male at (${entity1.x},${entity1.y}) dies, survivor at (${entity2.x},${entity2.y}) gains ${male1InitialHealth} health`);

      } else if (male2Dying) {
        // Only entity2 dies, entity1 gains energy
        entity1.heal(male2InitialHealth, (entity1 as Human).genome.maxHealth);
        console.log(`[Combat] Male at (${entity2.x},${entity2.y}) dies, survivor at (${entity1.x},${entity1.y}) gains ${male2InitialHealth} health`);
      }

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
      const dogDamage = this.config.dog.damageToWolf;
      wolf.takeDamage(dogDamage);

      // Wolf counter-attacks with configured damage (PRD US-019)
      const wolfCounterDamage = this.config.wolf.damageToDog;
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

    // Wolf attacks human with differentiated damage
    const wolfDamage = human.isMale() ? this.config.wolf.damageToMale : this.config.wolf.damageToFemale;
    human.takeDamage(wolfDamage);

    console.log(`[Combat] Wolf at (${wolf.x},${wolf.y}) attacks ${human.sex} at (${human.x},${human.y}): ${wolfDamage} damage`);

    this.addCombatEffect(human.x, human.y);

    // Male human counter-attacks using strength gene
    if (human.isMale()) {
      const counterDamage = this.config.human.maleVsWolfDamage * human.genome.strength;
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
