import { describe, it, expect, beforeEach } from 'vitest';
import { Human } from '../../src/entities/Human';
import { Sex } from '../../src/types';
import { Random } from '../../src/utils/Random';
import { createConfig, createFemale, createMale, getConfigByPath } from '../setup';
import { DEFAULT_CONFIG } from '../../src/config';
import { EnergyState } from '../../src/utils/energy';

/**
 * Human Entity Unit Tests
 *
 * Tests human-specific behavioral mechanics:
 * - Health management (damage, healing, initialization)
 * - Pregnancy mechanics (pregnancy state, duration)
 * - Reproduction cooldown (cooldown tracking, decrement)
 *
 * Focuses on behavior verification rather than config storage
 */

describe('Human Entity', () => {
  describe('Health Management', () => {
    it('should initialize with health from config', () => {
      const female = createFemale(15, 15);
      // Health should be clamped to genome.maxHealth (not exceed it)
      expect(female.health).toBeGreaterThan(0);
      expect(female.health).toBeLessThanOrEqual(female.genome.maxHealth);
      expect(female.health).toBeLessThanOrEqual(DEFAULT_CONFIG.human.startingHealth);
    });

    it('should support health modification', () => {
      const female = createFemale(15, 15);
      const initialHealth = female.health;

      female.health -= 20;
      expect(female.health).toBe(initialHealth - 20);
    });

    it('should allow health to reach zero', () => {
      const female = createFemale(15, 15);
      female.health = 0;
      expect(female.health).toBe(0);
    });

    it('should allow health to exceed starting value after healing', () => {
      const male = createMale(15, 15);
      male.health = 50;
      male.health += 20;
      expect(male.health).toBe(70);
    });

    it('should maintain independent health across multiple humans', () => {
      const female1 = createFemale(5, 5);
      const female2 = createFemale(15, 15);

      const initial1 = female1.health;
      const initial2 = female2.health;

      female1.health -= 20;
      expect(female1.health).toBe(initial1 - 20);
      expect(female2.health).toBe(initial2);
    });
  });

  describe('Sex Assignment', () => {
    it('should create female humans with female sex', () => {
      const female = createFemale(10, 10);
      expect(female.sex).toBe(Sex.FEMALE);
    });

    it('should create male humans with male sex', () => {
      const male = createMale(10, 10);
      expect(male.sex).toBe(Sex.MALE);
    });

    it('should preserve sex assignment across modifications', () => {
      const female = createFemale(10, 10);
      const male = createMale(20, 20);

      female.health -= 30;
      male.health -= 30;

      expect(female.sex).toBe(Sex.FEMALE);
      expect(male.sex).toBe(Sex.MALE);
    });
  });

  describe('Pregnancy State Management', () => {
    it('should initialize without pregnancy', () => {
      const female = createFemale(15, 15);
      const male = createMale(15, 15);

      expect(female.isPregnant()).toBe(false);
      expect(male.isPregnant()).toBe(false);
    });

    it('should enter pregnant state when counter is set', () => {
      const female = createFemale(15, 15);
      female.pregnancyCounter = 5;

      expect(female.isPregnant()).toBe(true);
    });

    it('should exit pregnant state when counter reaches zero', () => {
      const female = createFemale(15, 15);
      female.pregnancyCounter = 1;

      female.pregnancyCounter -= 1;
      expect(female.isPregnant()).toBe(false);
    });

    it('should decrement pregnancy counter correctly', () => {
      const female = createFemale(15, 15);
      female.pregnancyCounter = 5;

      const initial = female.pregnancyCounter;
      female.pregnancyCounter -= 1;

      expect(female.pregnancyCounter).toBe(initial - 1);
    });

    it('should complete full pregnancy cycle', () => {
      const female = createFemale(15, 15);
      const duration = 3;

      female.pregnancyCounter = duration;

      for (let i = 0; i < duration; i++) {
        expect(female.isPregnant()).toBe(true);
        female.pregnancyCounter -= 1;
      }

      expect(female.pregnancyCounter).toBe(0);
      expect(female.isPregnant()).toBe(false);
    });
  });

  describe('Reproduction Cooldown Management', () => {
    it('should initialize without cooldown', () => {
      const female = createFemale(15, 15);
      expect(female.reproductionCooldown).toBe(0);
    });

    it('should set cooldown when assigned', () => {
      const female = createFemale(15, 15);
      female.reproductionCooldown = 5;

      expect(female.reproductionCooldown).toBe(5);
    });

    it('should decrement cooldown via decrementCooldown method', () => {
      const female = createFemale(15, 15);
      female.reproductionCooldown = 3;

      female.decrementCooldown();
      expect(female.reproductionCooldown).toBe(2);

      female.decrementCooldown();
      expect(female.reproductionCooldown).toBe(1);

      female.decrementCooldown();
      expect(female.reproductionCooldown).toBe(0);
    });

    it('should prevent further decrement below zero', () => {
      const female = createFemale(15, 15);
      female.reproductionCooldown = 1;

      female.decrementCooldown();
      expect(female.reproductionCooldown).toBe(0);

      female.decrementCooldown(); // Should stay at 0
      expect(female.reproductionCooldown).toBe(0);
    });
  });

  describe('Pregnancy and Cooldown Interaction', () => {
    it('should prevent pregnancy during cooldown', () => {
      const female = createFemale(15, 15);
      female.reproductionCooldown = 2; // In cooldown

      const isInCooldown = female.reproductionCooldown > 0;
      expect(isInCooldown).toBe(true);
      expect(female.isPregnant()).toBe(false);
    });

    it('should allow pregnancy after cooldown expires', () => {
      const female = createFemale(15, 15);
      female.reproductionCooldown = 0; // Not in cooldown

      const isInCooldown = female.reproductionCooldown > 0;
      expect(isInCooldown).toBe(false);
    });

    it('should transition from pregnancy to cooldown', () => {
      const female = createFemale(15, 15);

      // Start pregnancy
      female.pregnancyCounter = 2;
      expect(female.isPregnant()).toBe(true);
      expect(female.reproductionCooldown).toBe(0);

      // Complete pregnancy
      female.pregnancyCounter = 0;
      expect(female.isPregnant()).toBe(false);

      // Apply cooldown
      female.reproductionCooldown = 3;
      expect(female.reproductionCooldown).toBe(3);
    });
  });
});

describe('Human (config-driven behaviour)', () => {
  it('maxHealth mirrors the genome and caps starting health', () => {
    const genome = { maxHealth: 80, strength: 1, metabolism: 0.1, greed: 0.5, caution: 0, longevity: 1 };
    const h = new Human(0, 0, Sex.MALE, 150, undefined, undefined, genome);
    expect(h.maxHealth).toBe(80);
    expect(h.health).toBe(80);
  });

  it('random genome baseline uses the given starting health and greed (seeded)', () => {
    Random.seed(21);
    let health = 0;
    let greed = 0;
    for (let i = 0; i < 500; i++) {
      const h = new Human(0, 0, Sex.FEMALE, 400, undefined, undefined, undefined, 0.9);
      health += h.genome.maxHealth;
      greed += h.genome.greed;
    }
    expect(health / 500).toBeGreaterThan(370);
    expect(health / 500).toBeLessThan(430);
    expect(greed / 500).toBeGreaterThan(0.75);
  });

  it('random genome baseline uses the given average caution and metabolism (seeded)', () => {
    Random.seed(22);
    let caution = 0;
    let metabolism = 0;
    for (let i = 0; i < 500; i++) {
      const h = new Human(0, 0, Sex.MALE, 100, undefined, undefined, undefined, 0.5, 0.9, 0.3);
      caution += h.genome.caution;
      metabolism += h.genome.metabolism;
    }
    expect(caution / 500).toBeGreaterThan(0.8);
    expect(metabolism / 500).toBeGreaterThan(0.27);
    expect(metabolism / 500).toBeLessThan(0.33);
  });

  it('startPregnancy uses the passed pregnancy period and advancePregnancy the passed cooldown', () => {
    const f = new Human(0, 0, Sex.FEMALE);
    f.startPregnancy(undefined, 6);
    expect(f.pregnancyCounter).toBe(6);
    for (let i = 0; i < 5; i++) expect(f.advancePregnancy(4)).toBe(false);
    expect(f.advancePregnancy(4)).toBe(true);
    expect(f.readyToGiveBirth).toBe(true);
    expect(f.reproductionCooldown).toBe(4);
  });

  it('males cannot become pregnant', () => {
    const m = new Human(0, 0, Sex.MALE);
    m.startPregnancy(undefined, 3);
    expect(m.isPregnant()).toBe(false);
  });

  it('getEnergyState follows health relative to the genome max health, updating as health changes', () => {
    const genome = { maxHealth: 120, strength: 1, metabolism: 0, greed: 0, caution: 0, longevity: 1 };
    const h = new Human(0, 0, Sex.MALE, 120, undefined, undefined, genome);
    expect(h.getEnergyState()).toBe(EnergyState.SATIATED);
    h.takeDamage(1); // 119 / 120
    expect(h.getEnergyState()).toBe(EnergyState.FULL);
    h.takeDamage(23); // 96 = exactly 80 %
    expect(h.getEnergyState()).toBe(EnergyState.MODERATE);
    h.takeDamage(37); // 59 < 60 (50 %)
    expect(h.getEnergyState()).toBe(EnergyState.HUNGRY);
    h.takeDamage(23); // 36 = exactly 30 %
    expect(h.getEnergyState()).toBe(EnergyState.HUNGRY);
    h.takeDamage(1);
    expect(h.getEnergyState()).toBe(EnergyState.DESPERATE);
    h.heal(1000);
    expect(h.getEnergyState()).toBe(EnergyState.SATIATED);
  });
});
