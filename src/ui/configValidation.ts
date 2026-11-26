import { DEFAULT_CONFIG } from '../config';
import type { GameConfig } from './ConfigPanel';

type Section = keyof GameConfig;

/**
 * Validation rule for one configurable parameter.
 *
 * Upper limits exist only where the PRD specifies them or the quantity is
 * bounded by definition (CLAUDE.md "Parameter Range Freedom"):
 *  - board width/height 10–100 (PRD 3.7.4, US-030)
 *  - overcrowding thresholds 10–1000, multipliers 1–10 (PRD 3.7.10)
 *  - probabilities 0–1 and the injured threshold percentage 0–100
 * Everything else only has a sensible minimum.
 */
export interface FieldRule {
  /** DOM id of the input */
  id: string;
  section: Section;
  key: string;
  min: number;
  max?: number;
  integer?: boolean;
  /** Legacy property name accepted when loading older config files. */
  legacyKey?: string;
}

const probability = (id: string, section: Section, key: string): FieldRule => ({
  id,
  section,
  key,
  min: 0,
  max: 1,
});

export const FIELD_RULES: readonly FieldRule[] = [
  { id: 'boardWidth', section: 'board', key: 'width', min: 10, max: 100, integer: true },
  { id: 'boardHeight', section: 'board', key: 'height', min: 10, max: 100, integer: true },
  { id: 'injuredThreshold', section: 'board', key: 'injuredThreshold', min: 0, max: 100 },

  probability('spawnMaleHuman', 'spawn', 'maleHumanProbability'),
  probability('spawnFemaleHuman', 'spawn', 'femaleHumanProbability'),
  probability('spawnWolf', 'spawn', 'wolfProbability'),
  probability('spawnDog', 'spawn', 'dogProbability'),
  probability('spawnFruit', 'spawn', 'fruitProbability'),
  probability('spawnMushroom', 'spawn', 'mushroomProbability'),

  { id: 'humanHealth', section: 'human', key: 'startingHealth', min: 1 },
  { id: 'humanMaleDamage', section: 'human', key: 'maleVsMaleDamage', min: 0 },
  { id: 'humanWolfDamage', section: 'human', key: 'maleVsWolfDamage', min: 0 },
  probability('humanReproduction', 'human', 'reproductionProbability'),
  { id: 'humanPregnancy', section: 'human', key: 'pregnancyPeriod', min: 1, integer: true },
  { id: 'humanCooldown', section: 'human', key: 'cooldownPeriod', min: 0, integer: true },
  { id: 'humanGompertzA', section: 'human', key: 'gompertzA', min: 0 },
  { id: 'humanGompertzB', section: 'human', key: 'gompertzB', min: 0 },
  { id: 'humanPerception', section: 'human', key: 'perceptionRange', min: 0, integer: true },
  probability('humanFruitProb', 'human', 'moveTowardFruitProbability'),

  { id: 'wolfHealth', section: 'wolf', key: 'startingHealth', min: 1 },
  { id: 'wolfDamageToMale', section: 'wolf', key: 'damageToMale', min: 0 },
  { id: 'wolfDamageToFemale', section: 'wolf', key: 'damageToFemale', min: 0 },
  { id: 'wolfDamageToDog', section: 'wolf', key: 'damageToDog', min: 0 },
  { id: 'wolfGompertzA', section: 'wolf', key: 'gompertzA', min: 0 },
  { id: 'wolfGompertzB', section: 'wolf', key: 'gompertzB', min: 0 },
  { id: 'wolfPerception', section: 'wolf', key: 'perceptionRange', min: 0, integer: true },
  probability('wolfHumanProb', 'wolf', 'moveTowardHumanProbability'),
  probability('wolfSpawn', 'wolf', 'spawnProbability'),

  { id: 'dogHealth', section: 'dog', key: 'startingHealth', min: 1 },
  { id: 'dogDamage', section: 'dog', key: 'damageToWolf', min: 0 },
  { id: 'dogGompertzA', section: 'dog', key: 'gompertzA', min: 0 },
  { id: 'dogGompertzB', section: 'dog', key: 'gompertzB', min: 0 },
  { id: 'dogPerception', section: 'dog', key: 'perceptionRange', min: 0, integer: true },
  probability('dogWolfProb', 'dog', 'moveTowardWolfProbability'),
  probability('dogSpawn', 'dog', 'spawnProbability'),

  { id: 'fruitHealing', section: 'fruit', key: 'energyHealed', min: 0, legacyKey: 'energyValue' },
  probability('fruitSpawn', 'fruit', 'spawnProbability'),
  { id: 'fruitRipen', section: 'fruit', key: 'roundsToRipen', min: 0, integer: true },

  {
    id: 'mushroomDamage',
    section: 'mushroom',
    key: 'energyRemoved',
    min: 0,
    legacyKey: 'damageValue',
  },
  probability('mushroomSpawn', 'mushroom', 'spawnProbability'),

  { id: 'humanThreshold', section: 'overcrowding', key: 'humanThreshold', min: 10, max: 1000 },
  { id: 'humanMultiplier', section: 'overcrowding', key: 'humanMultiplier', min: 1, max: 10 },
  { id: 'animalThreshold', section: 'overcrowding', key: 'animalThreshold', min: 10, max: 1000 },
  { id: 'animalMultiplier', section: 'overcrowding', key: 'animalMultiplier', min: 1, max: 10 },
];

export type FieldErrorCode = 'notANumber' | 'tooLow' | 'tooHigh' | 'notInteger';

export interface FieldError {
  rule: FieldRule;
  code: FieldErrorCode;
  /** Interpolation argument for the message (the violated bound). */
  arg?: number;
}

/** Validate one numeric value against its rule. Returns null when valid. */
export function validateValue(rule: FieldRule, value: number): FieldError | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { rule, code: 'notANumber' };
  if (value < rule.min) return { rule, code: 'tooLow', arg: rule.min };
  if (rule.max !== undefined && value > rule.max) return { rule, code: 'tooHigh', arg: rule.max };
  if (rule.integer && !Number.isInteger(value)) return { rule, code: 'notInteger' };
  return null;
}

export function getValue(config: GameConfig, rule: FieldRule): number {
  return (config[rule.section] as unknown as Record<string, number>)[rule.key];
}

function setValue(config: GameConfig, rule: FieldRule, value: number): void {
  (config[rule.section] as unknown as Record<string, number>)[rule.key] = value;
}

/** Sum of the six initial spawn probabilities. */
export function spawnTotal(config: GameConfig): number {
  const s = config.spawn;
  return (
    s.maleHumanProbability +
    s.femaleHumanProbability +
    s.wolfProbability +
    s.dogProbability +
    s.fruitProbability +
    s.mushroomProbability
  );
}

/** Validate every field of a config. An empty array means the config is valid. */
export function validateConfig(config: GameConfig): FieldError[] {
  const errors: FieldError[] = [];
  for (const rule of FIELD_RULES) {
    const error = validateValue(rule, getValue(config, rule));
    if (error) errors.push(error);
  }
  return errors;
}

/** True when the config can be used to start a game (fields valid, spawn sum ≤ 100%). */
export function isConfigStartable(config: GameConfig): boolean {
  return validateConfig(config).length === 0 && spawnTotal(config) <= 1 + 1e-9;
}

export function getDefaultConfig(): GameConfig {
  const d = DEFAULT_CONFIG;
  return {
    board: {
      width: d.board.width,
      height: d.board.height,
      injuredThreshold: d.board.injuredThreshold,
    },
    spawn: {
      maleHumanProbability: d.spawn.maleHumanProbability,
      femaleHumanProbability: d.spawn.femaleHumanProbability,
      wolfProbability: d.spawn.wolfProbability,
      dogProbability: d.spawn.dogProbability,
      fruitProbability: d.spawn.fruitProbability,
      mushroomProbability: d.spawn.mushroomProbability,
    },
    human: {
      startingHealth: d.human.startingHealth,
      maleVsMaleDamage: d.human.maleVsMaleDamage,
      maleVsWolfDamage: d.human.maleVsWolfDamage,
      reproductionProbability: d.human.reproductionProbability,
      pregnancyPeriod: d.human.pregnancyPeriod,
      cooldownPeriod: d.human.cooldownPeriod,
      perceptionRange: d.human.perceptionRange,
      moveTowardFruitProbability: d.human.moveTowardFruitProbability,
      gompertzA: d.human.gompertzA,
      gompertzB: d.human.gompertzB,
    },
    wolf: {
      startingHealth: d.wolf.startingHealth,
      damageToMale: d.wolf.damageToMale,
      damageToFemale: d.wolf.damageToFemale,
      damageToDog: d.wolf.damageToDog,
      perceptionRange: d.wolf.perceptionRange,
      moveTowardHumanProbability: d.wolf.moveTowardHumanProbability,
      spawnProbability: d.wolf.spawnProbability,
      gompertzA: d.wolf.gompertzA,
      gompertzB: d.wolf.gompertzB,
    },
    dog: {
      startingHealth: d.dog.startingHealth,
      damageToWolf: d.dog.damageToWolf,
      perceptionRange: d.dog.perceptionRange,
      moveTowardWolfProbability: d.dog.moveTowardWolfProbability,
      spawnProbability: d.dog.spawnProbability,
      gompertzA: d.dog.gompertzA,
      gompertzB: d.dog.gompertzB,
    },
    fruit: {
      energyHealed: d.fruit.energyHealed,
      spawnProbability: d.fruit.spawnProbability,
      roundsToRipen: d.fruit.roundsToRipen,
    },
    mushroom: {
      energyRemoved: d.mushroom.energyRemoved,
      spawnProbability: d.mushroom.spawnProbability,
    },
    overcrowding: {
      humanThreshold: d.overcrowding.humanThreshold,
      humanMultiplier: d.overcrowding.humanMultiplier,
      animalThreshold: d.overcrowding.animalThreshold,
      animalMultiplier: d.overcrowding.animalMultiplier,
    },
  };
}

export interface MergeResult {
  config: GameConfig;
  /** Paths whose loaded value was not a number and was replaced by the default. */
  replaced: string[];
}

/**
 * Merge a loaded (untrusted) config object with defaults.
 *
 * Missing values take the default. Present non-numeric values are replaced by
 * the default and reported. Numeric values are kept as-is – even out of range –
 * so the same validation that gates Start flags them in the form instead of
 * silently clamping the student's numbers.
 */
export function mergeWithDefaults(loaded: unknown): MergeResult {
  const config = getDefaultConfig();
  const replaced: string[] = [];
  const source = (loaded && typeof loaded === 'object' ? loaded : {}) as Record<string, unknown>;

  for (const rule of FIELD_RULES) {
    const section = source[rule.section];
    if (!section || typeof section !== 'object') continue;
    const values = section as Record<string, unknown>;
    const raw = values[rule.key] ?? (rule.legacyKey ? values[rule.legacyKey] : undefined);
    if (raw === undefined) continue;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      setValue(config, rule, raw);
    } else {
      replaced.push(`${rule.section}.${rule.key}`);
    }
  }

  return { config, replaced };
}
