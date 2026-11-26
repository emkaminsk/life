import { describe, it, expect } from 'vitest';
import { ENERGY_MODIFIERS, EnergyState, getEnergyState, modulatedProbability } from '../../src/utils/energy';

const ALL = [EnergyState.DESPERATE, EnergyState.HUNGRY, EnergyState.MODERATE, EnergyState.FULL, EnergyState.SATIATED];

describe('getEnergyState (PRD 3.16.2)', () => {
  it.each([
    [0, EnergyState.DESPERATE],
    [29.99, EnergyState.DESPERATE],
    [30, EnergyState.HUNGRY],
    [49.99, EnergyState.HUNGRY],
    [50, EnergyState.MODERATE],
    [80, EnergyState.MODERATE],
    [80.01, EnergyState.FULL],
    [99.99, EnergyState.FULL],
    [100, EnergyState.SATIATED],
  ])('health %f of 100 → %s', (health, state) => {
    expect(getEnergyState(health, 100)).toBe(state);
  });

  it('uses the ratio to max health, exact at boundaries for non-round maxima', () => {
    // 30 % of 70 = 21, 50 % = 35, 80 % = 56
    expect(getEnergyState(20.99, 70)).toBe(EnergyState.DESPERATE);
    expect(getEnergyState(21, 70)).toBe(EnergyState.HUNGRY);
    expect(getEnergyState(35, 70)).toBe(EnergyState.MODERATE);
    expect(getEnergyState(56, 70)).toBe(EnergyState.MODERATE);
    expect(getEnergyState(56.01, 70)).toBe(EnergyState.FULL);
    expect(getEnergyState(45, 150)).toBe(EnergyState.HUNGRY);
  });

  it('treats health at or above max as SATIATED and a non-positive max as DESPERATE', () => {
    expect(getEnergyState(120, 100)).toBe(EnergyState.SATIATED);
    expect(getEnergyState(0, 0)).toBe(EnergyState.DESPERATE);
  });
});

describe('ENERGY_MODIFIERS', () => {
  it('food seeking: ×1.5 desperate/hungry, ×1 moderate, ×0.5 full, ×0.1 satiated (US-051)', () => {
    expect(ALL.map((s) => ENERGY_MODIFIERS[s].foodSeeking)).toEqual([1.5, 1.5, 1, 0.5, 0.1]);
  });

  it('predator avoidance: ×1.5 desperate/hungry, ×1 moderate, ×0.7 full/satiated (US-046)', () => {
    expect(ALL.map((s) => ENERGY_MODIFIERS[s].predatorAvoidance)).toEqual([1.5, 1.5, 1, 0.7, 0.7]);
  });

  it('reproduction: 0 desperate/hungry, ×1 moderate, ×1.5 full/satiated; only desperate flees males', () => {
    expect(ALL.map((s) => ENERGY_MODIFIERS[s].reproduction)).toEqual([0, 0, 1, 1.5, 1.5]);
    expect(ALL.filter((s) => ENERGY_MODIFIERS[s].fleesMales)).toEqual([EnergyState.DESPERATE]);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ENERGY_MODIFIERS)).toBe(true);
    expect(Object.isFrozen(ENERGY_MODIFIERS[EnergyState.FULL])).toBe(true);
  });
});

describe('modulatedProbability', () => {
  it('multiplies and caps at 1', () => {
    expect(modulatedProbability(0.4, 1.5)).toBeCloseTo(0.6);
    expect(modulatedProbability(0.8, 1.5)).toBe(1);
    expect(modulatedProbability(1, 1.5)).toBe(1);
  });

  it('never returns a negative or NaN probability', () => {
    expect(modulatedProbability(0.5, 0)).toBe(0);
    expect(modulatedProbability(-0.2, 1)).toBe(0);
    expect(modulatedProbability(Number.NaN, 1)).toBe(0);
  });
});
