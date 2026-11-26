/**
 * Duration of every visual flash (combat/poison = red, reproduction/birth =
 * green, fruit = yellow). The spec asks for roughly one second.
 */
export const VISUAL_EFFECT_DURATION_MS = 1000;

export const DEFAULT_CONFIG = {
  board: {
    width: 30,
    height: 30,
    injuredThreshold: 50, // % of max health below which the 💔 indicator shows
  },

  spawn: {
    maleHumanProbability: 0.15,
    femaleHumanProbability: 0.15,
    wolfProbability: 0.05,
    dogProbability: 0.03,
    fruitProbability: 0.1,
    mushroomProbability: 0.01, // 1% spawn rate for mushrooms
  },

  human: {
    startingHealth: 100,
    maleVsMaleDamage: 20,
    maleVsWolfDamage: 25,
    reproductionProbability: 0.3,
    pregnancyPeriod: 3, // rounds
    cooldownPeriod: 2, // rounds after birth
    perceptionRange: 5, // cells
    moveTowardFruitProbability: 0.7, // also the average greed gene of the initial population
    avgCaution: 0.5, // average caution gene (probability to flee a wolf) of the initial population
    avgMetabolism: 0.5, // average metabolism gene (health cost per move, max 1) of the initial population
    gompertzA: 0.0001,
    gompertzB: 0.1,
  },

  wolf: {
    startingHealth: 80,
    damageToMale: 30, // Damage to male humans (males counter-attack)
    damageToFemale: 40, // Damage to female humans (females don't counter-attack, so higher)
    damageToDog: 17, // Counter-damage to dogs (typically half of dog's damage)
    perceptionRange: 7,
    moveTowardHumanProbability: 0.8,
    spawnProbability: 0.002, // per empty cell per round (0.2%)
    gompertzA: 0.0002,
    gompertzB: 0.12,
  },

  dog: {
    startingHealth: 70,
    damageToWolf: 35,
    perceptionRange: 6,
    moveTowardWolfProbability: 0.75,
    spawnProbability: 0.001, // per empty cell per round (0.1%)
    gompertzA: 0.00015,
    gompertzB: 0.11,
  },

  fruit: {
    energyHealed: 30,
    spawnProbability: 0.01, // per empty cell per round
    roundsToRipen: 2,
  },

  mushroom: {
    energyRemoved: 40, // damage to human
    spawnProbability: 0.005, // per empty cell per round (0.5%)
  },

  simulation: {
    defaultSpeed: 200, // ms per round
  },

  overcrowding: {
    humanThreshold: 100, // threshold for humans overcrowding effect
    humanMultiplier: 2, // death probability multiplier when threshold exceeded
    animalThreshold: 50, // threshold for animals (wolves + dogs) overcrowding effect
    animalMultiplier: 2, // death probability multiplier when threshold exceeded
  },
};
