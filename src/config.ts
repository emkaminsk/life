export const DEFAULT_CONFIG = {
  board: {
    width: 30,
    height: 30,
    injuredThreshold: 50, // Health % for red border
  },

  spawn: {
    maleHumanProbability: 0.15,
    femaleHumanProbability: 0.15,
    wolfProbability: 0.05,
    dogProbability: 0.03,
    fruitProbability: 0.10,
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
    moveTowardFruitProbability: 0.7,
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
