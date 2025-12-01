import type { Board } from '../core/Board';
import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import type { Renderer } from '../core/Renderer';
import { EntityType } from '../types';
import { Random } from '../utils/Random';
import { DEFAULT_CONFIG } from '../config';
import type { MovementRecord } from '../core/AnimationSystem';

export class MovementSystem {
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  execute(board: Board): MovementRecord[] {
    const entities = board.getAllEntities();
    const movedEntities = new Set<Entity>();
    const movements: MovementRecord[] = [];

    // Process all creatures (not plants)
    const creatures = entities.filter(e => e.type !== EntityType.FRUIT && e.type !== EntityType.MUSHROOM);

    for (const creature of creatures) {
      if (movedEntities.has(creature)) continue;

      const movement = this.moveCreature(creature, board, entities);
      if (movement) {
        movedEntities.add(creature);
        movements.push(movement);
      }
    }

    console.log(`[Movement] Moved ${movedEntities.size} creatures`);
    return movements;
  }

  private moveCreature(creature: Entity, board: Board, allEntities: Entity[]): MovementRecord | null {
    // Apply metabolism cost before moving (if it's a human with genome)
    if (creature instanceof Human) {
      // Base cost could be configurable, multiplied by metabolism gene
      const energyCost = creature.genome.metabolism; // e.g., 0.1 health per move
      // Optional: Only apply if configured to do so, or just apply it
      // For now, let's say metabolism directly reduces health
      creature.takeDamage(energyCost);
      if (creature.isDead()) {
        this.renderer.markDirty(creature.x, creature.y);
        return null; // Dead creatures don't move
      }
    }

    const availablePositions = board.getEmptyAdjacentPositions(creature.x, creature.y);
    if (availablePositions.length === 0) return null;

    let targetPosition = null;

    if (creature instanceof Human) {
      targetPosition = this.getHumanTarget(creature, board, allEntities, availablePositions);
    } else if (creature instanceof Wolf) {
      targetPosition = this.getWolfTarget(creature, allEntities, availablePositions);
    } else if (creature instanceof Dog) {
      targetPosition = this.getDogTarget(creature, allEntities, availablePositions);
    }

    // If no target found, move randomly
    if (!targetPosition) {
      targetPosition = Random.choice(availablePositions);
    }

    if (targetPosition) {
      const oldX = creature.x;
      const oldY = creature.y;
      const moved = board.moveEntity(oldX, oldY, targetPosition.x, targetPosition.y);
      if (moved) {
        // Mark both old and new positions dirty
        this.renderer.markDirty(oldX, oldY);
        this.renderer.markDirty(targetPosition.x, targetPosition.y);

        // Return movement record for animation
        return {
          entity: creature,
          fromX: oldX,
          fromY: oldY,
          toX: targetPosition.x,
          toY: targetPosition.y,
        };
      }
    }

    return null;
  }

  private getHumanTarget(
    human: Human,
    _board: Board,
    allEntities: Entity[],
    availablePositions: { x: number; y: number }[]
  ): { x: number; y: number } | null {
    // 1. Check for Wolves (Predators) - Run away based on Caution gene
    const wolvesInRange = Random.getEntitiesInRange(
      allEntities.filter(e => e instanceof Wolf),
      human.x,
      human.y,
      DEFAULT_CONFIG.human.perceptionRange
    );

    if (wolvesInRange.length > 0 && Random.chance(human.genome.caution)) {
      // Find position furthest from the nearest wolf
      const nearestWolf = wolvesInRange[0];
      // Simple flee logic: Pick position that maximizes distance to wolf
      let bestPos = null;
      let maxDist = -1;

      for (const pos of availablePositions) {
        const dist = Math.abs(pos.x - nearestWolf.x) + Math.abs(pos.y - nearestWolf.y); // Manhattan distance
        if (dist > maxDist) {
          maxDist = dist;
          bestPos = pos;
        }
      }
      
      if (bestPos) return bestPos;
    }

    // 2. Check for Fruits (Food) - Seek based on Greed gene
    const fruitsInRange = Random.getEntitiesInRange(
      allEntities.filter(e => e instanceof Fruit && (e as Fruit).isRipe()),
      human.x,
      human.y,
      DEFAULT_CONFIG.human.perceptionRange
    );

    // Use genome greed instead of global config
    if (fruitsInRange.length > 0 && Random.chance(human.genome.greed)) {
      const nearestFruit = fruitsInRange[0];
      const closestPositions = Random.getClosestPositions(
        availablePositions,
        nearestFruit.x,
        nearestFruit.y
      );
      return Random.choice(closestPositions);
    }

    return null;
  }

  private getWolfTarget(
    wolf: Wolf,
    allEntities: Entity[],
    availablePositions: { x: number; y: number }[]
  ): { x: number; y: number } | null {
    // Find humans within perception range
    const humansInRange = Random.getEntitiesInRange(
      allEntities.filter(e => e instanceof Human),
      wolf.x,
      wolf.y,
      DEFAULT_CONFIG.wolf.perceptionRange
    );

    // If humans found and probability check passes, move toward nearest
    if (humansInRange.length > 0 && Random.chance(DEFAULT_CONFIG.wolf.moveTowardHumanProbability)) {
      const nearestHuman = humansInRange[0];
      const closestPositions = Random.getClosestPositions(
        availablePositions,
        nearestHuman.x,
        nearestHuman.y
      );
      return Random.choice(closestPositions);
    }

    return null;
  }

  private getDogTarget(
    dog: Dog,
    allEntities: Entity[],
    availablePositions: { x: number; y: number }[]
  ): { x: number; y: number } | null {
    // Find wolves within perception range
    const wolvesInRange = Random.getEntitiesInRange(
      allEntities.filter(e => e instanceof Wolf),
      dog.x,
      dog.y,
      DEFAULT_CONFIG.dog.perceptionRange
    );

    // If wolves found and probability check passes, move toward nearest
    if (wolvesInRange.length > 0 && Random.chance(DEFAULT_CONFIG.dog.moveTowardWolfProbability)) {
      const nearestWolf = wolvesInRange[0];
      const closestPositions = Random.getClosestPositions(
        availablePositions,
        nearestWolf.x,
        nearestWolf.y
      );
      return Random.choice(closestPositions);
    }

    return null;
  }
}
