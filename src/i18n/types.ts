/**
 * Language enumeration for supported languages
 */
export enum Language {
  EN = 'en',
  PL = 'pl'
}

/**
 * Translation keys interface organized by UI section
 */
export interface TranslationKeys {
  // Header section
  header: {
    title: string;
    round: string;
    roundsPerSec: string;
  };

  // Control buttons
  controls: {
    title: string;
    startGame: string;
    pause: string;
    runOneRound: string;
    runFiveRounds: string;
    runFree: string;
    reset: string;
    finishGame: string;
    speed: string;
    slow: string;
    medium: string;
    fast: string;
  };

  // Statistics panel
  stats: {
    statistics: string;
    males: string;
    females: string;
    pregnant: string;
    wolves: string;
    dogs: string;
    fruits: string;
    ripeUnripe: string;
    mushrooms: string;
    total: string;
    populationGraph: string;
    waitingForData: string;
  };

  // Configuration panel sections
  config: {
    // Panel header
    configPanel: string;
    configSubtitle: string;
    collapseAll: string;
    collapse: string;
    expand: string;
    resetDefaults: string;
    expectedCreatures: string;
    expectedCreaturesDetailed: string;

    // Validation messages
    totalSpawnProbability: string;
    spawnExceeds100: string;
    spawnWarning: string;
    spawnVeryHigh: string;

    // Board Setup section
    boardSetup: string;
    boardWidth: string;
    boardHeight: string;
    injuredThreshold: string;
    maleSpawn: string;
    femaleSpawn: string;
    wolfSpawn: string;
    dogSpawn: string;
    fruitSpawn: string;
    mushroomSpawn: string;

    // Human Configuration section
    humanConfig: string;
    humanHealth: string;
    maleVsMaleDamage: string;
    maleVsWolfDamage: string;
    reproductionProb: string;
    pregnancyPeriod: string;
    cooldownPeriod: string;
    humanPerception: string;
    moveTowardFruit: string;
    humanGompertzA: string;
    humanGompertzB: string;

    // Wolf Configuration section
    wolfConfig: string;
    wolfHealth: string;
    wolfDamage: string;
    wolfDamageToMale: string;
    wolfDamageToFemale: string;
    wolfDamageToDog: string;
    wolfPerception: string;
    moveTowardHuman: string;
    wolfGompertzA: string;
    wolfGompertzB: string;
    wolfSpawnProb: string;

    // Dog Configuration section
    dogConfig: string;
    dogHealth: string;
    dogDamage: string;
    dogPerception: string;
    moveTowardWolf: string;
    dogGompertzA: string;
    dogGompertzB: string;
    dogSpawnProb: string;

    // Fruit Configuration section
    fruitConfig: string;
    fruitEnergy: string;
    fruitSpawnProb: string;
    roundsToRipen: string;

    // Mushroom Configuration section
    mushroomConfig: string;
    mushroomEnergy: string;
    mushroomSpawnProb: string;

    // Population Control section
    populationControl: string;
    humanThreshold: string;
    humanMultiplier: string;
    animalThreshold: string;
    animalMultiplier: string;
  };

  // Notifications
  notifications: {
    allMalesDied: string;
    allFemalesDied: string;
    boardNearlyFull: string;
  };

  // Rules modal
  rules: {
    title: string;
    tabGameRules: string;
    tabCreatures: string;
    tabPlants: string;
    tabControls: string;

    // Game Rules tab content
    gameRulesTitle: string;
    roundPriorityTitle: string;
    roundPriorityDesc: string;
    phase1Movement: string;
    phase2Combat: string;
    phase3Eating: string;
    phase4Reproduction: string;
    phase5Death: string;
    phase6Birth: string;
    phase7Spawn: string;
    importantRulesTitle: string;
    importantRule1: string;
    importantRule2: string;
    importantRule3: string;

    // Creatures tab content
    creaturesTitle: string;
    malesTitle: string;
    malesDesc: string;
    femalesTitle: string;
    femalesDesc: string;
    wolvesTitle: string;
    wolvesDesc: string;
    dogsTitle: string;
    dogsDesc: string;

    // Plants tab content
    plantsTitle: string;
    fruitsTitle: string;
    fruitsDesc: string;
    mushroomsTitle: string;
    mushroomsDesc: string;
    mushroomsWarning: string;

    // Controls tab content
    controlsTitle: string;
    keyboardShortcutsTitle: string;
    keySpace: string;
    keyRight: string;
    keyUp: string;
    keyDown: string;
    keyLeft: string;
    mouseControlsTitle: string;
    mouseDesc: string;
  };

  // Error messages
  errors: {
    invalidRange: string;
    spawnTooHigh: string;
    spawnWarning: string;
  };
}

/**
 * Translations type: mapping from Language to complete translation keys
 */
export type Translations = Record<Language, TranslationKeys>;
