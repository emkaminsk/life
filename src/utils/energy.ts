/**
 * Energy-driven behaviour (PRD 3.16). Health is energy; a human's behaviour is
 * modulated by its health relative to its max health.
 *
 * Pure functions and data only, so systems and the UI share one source of truth.
 */

/** Energy state of a human (values double as i18n key suffixes: tooltip.energyStates.<value>). */
export enum EnergyState {
  /** health < 30 % of max */
  DESPERATE = 'desperate',
  /** 30 % ≤ health < 50 % */
  HUNGRY = 'hungry',
  /** 50 % ≤ health ≤ 80 % */
  MODERATE = 'moderate',
  /** 80 % < health < 100 % */
  FULL = 'full',
  /** health = max */
  SATIATED = 'satiated',
}

export interface EnergyModifiers {
  /** Multiplier on the greed gene for seeking ripe fruit (PRD 3.16.3). */
  foodSeeking: number;
  /** Multiplier on the caution gene for fleeing wolves (PRD 3.16.5). */
  predatorAvoidance: number;
  /** Multiplier on config reproductionProbability, applied to the male (PRD 3.16.4). */
  reproduction: number;
  /** Males in this state always flee from other perceived males (PRD 3.16.5, US-046). */
  fleesMales: boolean;
}

/**
 * Modifier table. DESPERATE predator avoidance is not specified by the PRD (it only
 * lists DESPERATE for male-on-male combat); we use the HUNGRY value (×1.5), since a
 * weaker human has at least as much reason to avoid wolves as a hungry one.
 */
export const ENERGY_MODIFIERS: Readonly<Record<EnergyState, Readonly<EnergyModifiers>>> = Object.freeze({
  [EnergyState.DESPERATE]: Object.freeze({
    foodSeeking: 1.5,
    predatorAvoidance: 1.5,
    reproduction: 0,
    fleesMales: true,
  }),
  [EnergyState.HUNGRY]: Object.freeze({ foodSeeking: 1.5, predatorAvoidance: 1.5, reproduction: 0, fleesMales: false }),
  [EnergyState.MODERATE]: Object.freeze({ foodSeeking: 1, predatorAvoidance: 1, reproduction: 1, fleesMales: false }),
  [EnergyState.FULL]: Object.freeze({ foodSeeking: 0.5, predatorAvoidance: 0.7, reproduction: 1.5, fleesMales: false }),
  [EnergyState.SATIATED]: Object.freeze({
    foodSeeking: 0.1,
    predatorAvoidance: 0.7,
    reproduction: 1.5,
    fleesMales: false,
  }),
});

/**
 * Energy state for `health` out of `maxHealth`. Comparisons are done on
 * cross-multiplied values so exact boundaries (30 %, 50 %, 80 %) are not subject
 * to floating-point division error.
 */
export function getEnergyState(health: number, maxHealth: number): EnergyState {
  if (!(maxHealth > 0)) return EnergyState.DESPERATE;
  if (health >= maxHealth) return EnergyState.SATIATED;
  const h = health * 100;
  if (h < maxHealth * 30) return EnergyState.DESPERATE;
  if (h < maxHealth * 50) return EnergyState.HUNGRY;
  if (h <= maxHealth * 80) return EnergyState.MODERATE;
  return EnergyState.FULL;
}

/** base × multiplier, clamped to a valid probability [0, 1]. */
export function modulatedProbability(base: number, multiplier: number): number {
  const p = base * multiplier;
  if (!(p > 0)) return 0;
  return Math.min(1, p);
}
