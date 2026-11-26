import type { AppKeys } from './sections/app';
import type { ConfigHelpKeys } from './sections/configHelp';
import type { GenomeKeys } from './sections/genome';
import type { RulesKeys } from './sections/rules';
import type { SetupKeys } from './sections/setup';
import type { SummaryKeys } from './sections/summary';

/**
 * Language enumeration for supported languages
 */
export enum Language {
  EN = 'en',
  PL = 'pl',
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
    fps: string;
    helpTitle: string;
  };

  // Control buttons
  controls: {
    title: string;
    startGame: string;
    pause: string;
    resume: string;
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
    graphRound: string;
  };

  // Large-board initialization overlay
  init: {
    title: string;
    spawning: string;
    working: string;
  };

  // Accessibility labels
  a11y: {
    board: string;
    close: string;
    notifications: string;
    language: string;
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
    saveConfig: string;
    loadConfig: string;
    expectedCreatures: string;
    expectedCreaturesDetailed: string;

    // Validation messages
    totalSpawnProbability: string;
    spawnExceeds100: string;
    spawnWarning: string;
    spawnVeryHigh: string;
    validationSummary: string;

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
    maleExtinctionTitle: string;
    allMalesDied: string;
    femaleExtinctionTitle: string;
    allFemalesDied: string;
    boardNearlyFullTitle: string;
    boardNearlyFull: string;
    configSavedTitle: string;
    configSaved: string;
    configLoadedTitle: string;
    configLoaded: string;
    configLoadErrorTitle: string;
    configLoadError: string;
    configLoadInvalidTitle: string;
    configLoadInvalid: string;
    startErrorTitle: string;
    startError: string;
  };

  // Sections owned by individual workstreams (one file each in ./sections)
  rules: RulesKeys;
  configHelp: ConfigHelpKeys;
  setup: SetupKeys;
  summary: SummaryKeys;
  genome: GenomeKeys;
  app: AppKeys;

  // Error messages
  errors: {
    invalidRange: string;
    spawnTooHigh: string;
    spawnWarning: string;
    notANumber: string;
    tooLow: string;
    tooHigh: string;
    notInteger: string;
    rangeHint: string;
    minHint: string;
    wholeNumberHint: string;
  };

  // Tooltip messages
  tooltip: {
    maleHuman: string;
    femaleHuman: string;
    pregnantFemale: string;
    wolf: string;
    dog: string;
    ripeFruit: string;
    unripeFruit: string;
    mushroom: string;
    health: string;
    age: string;
    pregnant: string;
    roundsRemaining: string;
    ripening: string;
    genetics: string;
    geneMaxHealth: string;
    geneStrength: string;
    geneMetabolism: string;
    geneGreed: string;
    geneCaution: string;
    geneLongevity: string;
    perMove: string;
    energy: string;
    energyStates: {
      desperate: string;
      hungry: string;
      moderate: string;
      full: string;
      satiated: string;
    };
  };
}

/**
 * Translations type: mapping from Language to complete translation keys
 */
export type Translations = Record<Language, TranslationKeys>;
