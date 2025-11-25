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
    fruitProbability: 0.10,
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
    damageToHuman: 30,
    perceptionRange: 7,
    moveTowardHumanProbability: 0.8,
    gompertzA: 0.0002,
    gompertzB: 0.12,
  },

  fruit: {
    energyHealed: 30,
    spawnProbability: 0.01, // per empty cell per round
    roundsToRipen: 2,
  },

  simulation: {
    defaultSpeed: 200, // ms per round
  },
};
