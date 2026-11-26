import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '../../src/entities/Entity';
import { EntityType } from '../../src/types';
import { Wolf, Dog, Fruit, Mushroom } from '../../src/entities';
import { DEFAULT_CONFIG } from '../../src/config';
import { createHuman, createWolf, createDog } from '../setup';

/**
 * Entity Base Class Unit Tests
 *
 * Tests foundational entity behavior: health tracking, age advancement, position management
 * These tests don't depend on specific configuration parameters
 */

describe('Entity Base Class', () => {
  describe('Initialization', () => {
    it('should initialize with correct position', () => {
      const human = createHuman(10, 20);
      expect(human.x).toBe(10);
      expect(human.y).toBe(20);
    });

    it('should initialize with default health', () => {
      const human = createHuman(15, 15);
      expect(human.health).toBeGreaterThan(0);
    });

    it('should initialize with zero age', () => {
      const human = createHuman(15, 15);
      expect(human.age).toBe(0);
    });

    it('should set correct entity type', () => {
      const human = createHuman(15, 15);
      expect(human.type).toBe(EntityType.MALE); // createHuman defaults to MALE

      const wolf = createWolf(10, 10);
      expect(wolf.type).toBe(EntityType.WOLF);

      const dog = createDog(12, 12);
      expect(dog.type).toBe(EntityType.DOG);
    });
  });

  describe('Health Management', () => {
    it('should decrease health when damaged', () => {
      const human = createHuman(15, 15);
      const initialHealth = human.health;
      const damage = 10;

      human.health -= damage;
      expect(human.health).toBe(initialHealth - damage);
    });

    it('should handle zero health', () => {
      const human = createHuman(15, 15);
      human.health = 0;
      expect(human.health).toBe(0);
    });

    it('should allow negative health', () => {
      const human = createHuman(15, 15);
      human.health = -10;
      expect(human.health).toBe(-10);
    });

    it('should track cumulative damage', () => {
      const human = createHuman(15, 15);
      const initialHealth = human.health;

      human.health -= 5;
      human.health -= 3;
      human.health -= 2;

      expect(human.health).toBe(initialHealth - 10);
    });

    it('should allow health increase (healing)', () => {
      const human = createHuman(15, 15);
      human.health = 50;
      human.health += 20;

      expect(human.health).toBe(70);
    });
  });

  describe('Age Advancement', () => {
    it('should initialize with age zero', () => {
      const human = createHuman(15, 15);
      expect(human.age).toBe(0);
    });

    it('should advance age when advanceAge called', () => {
      const human = createHuman(15, 15);
      human.incrementAge();

      expect(human.age).toBe(1);
    });

    it('should accumulate age over multiple advances', () => {
      const human = createHuman(15, 15);

      for (let i = 0; i < 10; i++) {
        human.incrementAge();
      }

      expect(human.age).toBe(10);
    });

    it('should track age independently for different entities', () => {
      const human1 = createHuman(5, 5);
      const human2 = createHuman(10, 10);

      human1.incrementAge();
      human1.incrementAge();
      human2.incrementAge();

      expect(human1.age).toBe(2);
      expect(human2.age).toBe(1);
    });
  });

  describe('Position Management', () => {
    it('should update position', () => {
      const human = createHuman(10, 10);

      human.x = 15;
      human.y = 20;

      expect(human.x).toBe(15);
      expect(human.y).toBe(20);
    });

    it('should handle boundary positions', () => {
      const human = createHuman(0, 0);
      expect(human.x).toBe(0);
      expect(human.y).toBe(0);

      human.x = 29;
      human.y = 29;
      expect(human.x).toBe(29);
      expect(human.y).toBe(29);
    });

    it('should allow negative coordinates (unchecked)', () => {
      const human = createHuman(15, 15);
      human.x = -5;
      human.y = -3;

      expect(human.x).toBe(-5);
      expect(human.y).toBe(-3);
    });

    it('should track position changes over time', () => {
      const human = createHuman(15, 15);
      const positions: Array<[number, number]> = [[15, 15]];

      for (let i = 1; i <= 5; i++) {
        human.x = 15 + i;
        human.y = 15 + i;
        positions.push([human.x, human.y]);
      }

      expect(positions.length).toBe(6);
      expect(positions[positions.length - 1]).toEqual([20, 20]);
    });
  });

  describe('Entity State Consistency', () => {
    it('should maintain consistent state after multiple operations', () => {
      const human = createHuman(10, 10);
      const initialHealth = human.health;

      // Age advancement
      human.incrementAge();
      human.incrementAge();

      // Movement
      human.x = 15;
      human.y = 15;

      // Damage
      human.health -= 20;

      // Verify final state
      expect(human.age).toBe(2);
      expect(human.x).toBe(15);
      expect(human.y).toBe(15);
      expect(human.health).toBe(initialHealth - 20);
    });

    it('should allow state inspection at any time', () => {
      const human = createHuman(5, 5);

      expect(human.x).toBe(5);
      expect(human.y).toBe(5);
      expect(human.age).toBe(0);
      expect(human.health).toBeGreaterThan(0);
      expect(human.type).toBe(EntityType.MALE); // createHuman defaults to MALE
    });

    it('should preserve entity reference across operations', () => {
      const human = createHuman(15, 15);
      const reference = human;

      human.health = 50;
      human.x = 20;
      human.incrementAge();

      expect(reference.health).toBe(50);
      expect(reference.x).toBe(20);
      expect(reference.age).toBe(1);
    });
  });

  describe('Entity Type Assignment', () => {
    it('should correctly identify human type', () => {
      const human = createHuman(15, 15);
      expect(human.type).toBe(EntityType.MALE); // createHuman defaults to MALE
    });

    it('should correctly identify wolf type', () => {
      const wolf = createWolf(10, 10);
      expect(wolf.type).toBe(EntityType.WOLF);
    });

    it('should correctly identify dog type', () => {
      const dog = createDog(12, 12);
      expect(dog.type).toBe(EntityType.DOG);
    });

    it('should maintain type consistency', () => {
      const human = createHuman(15, 15);
      const originalType = human.type;

      // Entity type should not change
      expect(human.type).toBe(originalType);
      expect(human.type).toBe(EntityType.MALE); // createHuman defaults to MALE
    });
  });
});

describe('Entity maxHealth and injured %', () => {
  it('wolves, dogs and plants take maxHealth from their starting health', () => {
    expect(new Wolf(0, 0, 80).maxHealth).toBe(80);
    expect(new Dog(0, 0, 70).maxHealth).toBe(70);
    expect(new Fruit(0, 0).maxHealth).toBe(1);
    expect(new Mushroom(0, 0).maxHealth).toBe(1);
  });

  it('isInjured compares health as a percentage of max health', () => {
    const wolf = new Wolf(0, 0, 80);
    wolf.health = 41; // 51%
    expect(wolf.isInjured(50)).toBe(false);
    wolf.health = 39; // 48.75%
    expect(wolf.isInjured(50)).toBe(true);
  });

  it('heal defaults to capping at maxHealth', () => {
    const dog = new Dog(0, 0, 70);
    dog.health = 60;
    dog.heal(50);
    expect(dog.health).toBe(70);
  });

  it('Mushroom defaults energyRemoved to the config default', () => {
    expect(new Mushroom(0, 0).energyRemoved).toBe(DEFAULT_CONFIG.mushroom.energyRemoved);
  });
});

describe('Entity death cause', () => {
  it('starts with no death cause', () => {
    expect(createWolf(0, 0).deathCause).toBeNull();
  });

  it('takeDamage without a cause keeps the old behaviour and records nothing', () => {
    const wolf = new Wolf(0, 0, 10);
    wolf.takeDamage(25);
    expect(wolf.health).toBe(0);
    expect(wolf.deathCause).toBeNull();
  });

  it('non-lethal damage with a cause does not set deathCause', () => {
    const wolf = new Wolf(0, 0, 10);
    wolf.takeDamage(4, 'dogAttack');
    expect(wolf.health).toBe(6);
    expect(wolf.deathCause).toBeNull();
  });

  it('records the cause of the blow that takes health from > 0 to ≤ 0', () => {
    const wolf = new Wolf(0, 0, 10);
    wolf.takeDamage(4, 'humanDefense');
    wolf.takeDamage(6, 'dogAttack');
    expect(wolf.health).toBe(0);
    expect(wolf.deathCause).toBe('dogAttack');
  });

  it('later damage to an already dead entity does not overwrite the cause', () => {
    const wolf = new Wolf(0, 0, 10);
    wolf.takeDamage(10, 'dogAttack');
    wolf.takeDamage(5, 'humanDefense');
    expect(wolf.deathCause).toBe('dogAttack');
  });

  it('kill sets health to 0 and records the cause', () => {
    const human = createHuman(1, 1);
    human.kill('oldAge');
    expect(human.health).toBe(0);
    expect(human.isDead()).toBe(true);
    expect(human.deathCause).toBe('oldAge');
  });
});
