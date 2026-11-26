import { describe, it, expect } from 'vitest';
import { EntityType, Sex } from '../../src/types';
import { Human, Wolf, Dog, Fruit, Mushroom } from '../../src/entities';
import { DEFAULT_CONFIG } from '../../src/config';
import { createHuman, createWolf } from '../setup';

/**
 * Entity base-class behaviour, exercised through concrete subclasses: damage, healing,
 * death, ageing, visual position and type identity. Only real methods are tested;
 * plain field assignment is JavaScript, not game logic.
 */

describe('Entity Base Class', () => {
  it('constructs at its position with age 0, alive, visual position synced', () => {
    const wolf = new Wolf(3, 7, 80);
    expect([wolf.x, wolf.y, wolf.visualX, wolf.visualY]).toEqual([3, 7, 3, 7]);
    expect(wolf.age).toBe(0);
    expect(wolf.isDead()).toBe(false);
  });

  it('each subclass reports its own EntityType', () => {
    expect(new Human(0, 0, Sex.MALE).type).toBe(EntityType.MALE);
    expect(new Human(0, 0, Sex.FEMALE).type).toBe(EntityType.FEMALE);
    expect(new Wolf(0, 0).type).toBe(EntityType.WOLF);
    expect(new Dog(0, 0).type).toBe(EntityType.DOG);
    expect(new Fruit(0, 0).type).toBe(EntityType.FRUIT);
    expect(new Mushroom(0, 0).type).toBe(EntityType.MUSHROOM);
  });

  describe('takeDamage', () => {
    it('subtracts damage cumulatively', () => {
      const wolf = new Wolf(0, 0, 80);
      wolf.takeDamage(5);
      wolf.takeDamage(3);
      expect(wolf.health).toBe(72);
      expect(wolf.isDead()).toBe(false);
    });

    it('never drops below 0 and makes the entity dead', () => {
      const dog = new Dog(0, 0, 10);
      dog.takeDamage(25);
      expect(dog.health).toBe(0);
      expect(dog.isDead()).toBe(true);
    });

    it('exactly lethal damage (health → 0) counts as dead', () => {
      const dog = new Dog(0, 0, 10);
      dog.takeDamage(10);
      expect(dog.isDead()).toBe(true);
    });
  });

  describe('heal', () => {
    it('adds health up to an explicit cap', () => {
      const wolf = new Wolf(0, 0, 80);
      wolf.takeDamage(50);
      wolf.heal(20, 100);
      expect(wolf.health).toBe(50);
      wolf.heal(500, 60);
      expect(wolf.health).toBe(60);
    });

    it('never exceeds maxHealth for a human with a genome cap', () => {
      const human = createHuman(1, 1);
      human.heal(10_000);
      expect(human.health).toBe(human.maxHealth);
      expect(human.maxHealth).toBe(human.genome.maxHealth);
    });
  });

  it('incrementAge adds one round each call', () => {
    const wolf = new Wolf(0, 0);
    for (let i = 0; i < 10; i++) wolf.incrementAge();
    expect(wolf.age).toBe(10);
  });

  it('visual position can lag the logical position and is re-synced on demand', () => {
    const dog = new Dog(2, 2);
    dog.x = 3;
    dog.setVisualPosition(2.5, 2);
    expect([dog.visualX, dog.visualY]).toEqual([2.5, 2]);
    dog.syncVisualPosition();
    expect([dog.visualX, dog.visualY]).toEqual([3, 2]);
  });

  it('uses the default Gompertz parameters of its species when none are given', () => {
    const wolf = new Wolf(0, 0);
    expect([wolf.health, wolf.gompertzA, wolf.gompertzB]).toEqual([
      DEFAULT_CONFIG.wolf.startingHealth,
      DEFAULT_CONFIG.wolf.gompertzA,
      DEFAULT_CONFIG.wolf.gompertzB,
    ]);
    const dog = new Dog(0, 0);
    expect([dog.health, dog.gompertzA, dog.gompertzB]).toEqual([
      DEFAULT_CONFIG.dog.startingHealth,
      DEFAULT_CONFIG.dog.gompertzA,
      DEFAULT_CONFIG.dog.gompertzB,
    ]);
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
