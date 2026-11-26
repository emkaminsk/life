import type { DeathCause, EndReason, Species } from '../../core/simulationEvents';

/**
 * End-of-game summary dialog, statistics extras and the alerts added by
 * workstream D. Written for 11–15 year olds; conclusions are hedged because
 * they are heuristics, not proofs.
 */
export interface SummaryKeys {
  title: string;
  closeLabel: string;
  newGame: string;
  backToBoard: string;
  scrollRegion: string;
  endReason: Record<EndReason, string>;

  factsTitle: string;
  roundsPlayed: string;
  firstPregnancy: string;
  noPregnancy: string;
  babiesBorn: string;
  peakHumans: string;
  startEnd: string;

  thresholdsTitle: string;
  thresholdsHint: string;
  colGroup: string;
  col50: string;
  col10: string;
  col0: string;
  col200: string;
  rowMales: string;
  rowFemales: string;
  roundN: string;
  notReached: string;
  notApplicable: string;

  deathsTitle: string;
  colCause: string;
  colTotal: string;
  noDeaths: string;
  species: Record<Species, string>;
  causes: Record<DeathCause, string>;

  conclusionsTitle: string;
  conclusionsHint: string;
  conclusions: {
    outcomeExtinct: string;
    outcomeSafe: string;
    outcomeNoHumans: string;
    outcomeGrew: string;
    outcomeShrank: string;
    outcomeStable: string;
    noPregnancy: string;
    noPregnancyOneSex: string;
    topCause: Record<DeathCause, string>;
    malesFirst: string;
    malesFirstFights: string;
    femalesFirst: string;
    bothSexesSameRound: string;
    fewerBirths: string;
    moreBirths: string;
    expansionPeak: string;
    crowdingLimited: string;
    predators: string;
  };

  alerts: {
    allMalesDiedUnlessBoy: string;
    wolvesExtinctTitle: string;
    wolvesExtinct: string;
    dogsExtinctTitle: string;
    dogsExtinct: string;
  };

  overcrowding: {
    title: string;
    humans: string;
    animals: string;
    active: string;
    ok: string;
  };
}

export const en: SummaryKeys = {
  title: 'Game summary',
  closeLabel: 'Close summary',
  newGame: 'New experiment',
  backToBoard: 'Back to board',
  scrollRegion: 'Summary details',
  endReason: {
    humansExtinct: 'The game is over: all humans have died out.',
    humansSafe: 'The game is over: humans are safe – no wolves and no mushrooms are left.',
    userFinished: 'You finished the game.',
  },

  factsTitle: 'What happened',
  roundsPlayed: 'Rounds played: {0}',
  firstPregnancy: 'The first pregnancy started in round {0}',
  noPregnancy: 'Nobody got pregnant during the whole game',
  babiesBorn: 'Babies born: {0}',
  peakHumans: 'Most humans at the same time: {0} (round {1})',
  startEnd: '{0}: {1} at the start, {2} at the end',

  thresholdsTitle: 'When did the population change?',
  thresholdsHint: 'The first round in which each group reached this share of its starting size.',
  colGroup: 'Group',
  col50: 'Half (50%)',
  col10: '10%',
  col0: 'None left (0%)',
  col200: 'Doubled (200%)',
  rowMales: '👨 Males',
  rowFemales: '👩 Females',
  roundN: 'round {0}',
  notReached: 'not reached',
  notApplicable: 'n/a',

  deathsTitle: 'Causes of death',
  colCause: 'Cause',
  colTotal: 'Total',
  noDeaths: 'Nobody died in this game.',
  species: {
    male: '👨 Males',
    female: '👩 Females',
    wolf: '🐺 Wolves',
    dog: '🐕 Dogs',
  },
  causes: {
    wolfAttack: 'Wolf attack',
    maleFight: 'Fight between males',
    dogAttack: 'Bitten by a dog',
    humanDefense: 'Killed by a defending human',
    mushroom: 'Poisonous mushroom',
    metabolism: 'Ran out of energy',
    oldAge: 'Old age',
    overcrowding: 'Overcrowding',
    childbirth: 'Childbirth (no space for the baby)',
    unknown: 'Unknown',
  },

  conclusionsTitle: 'What can we learn?',
  conclusionsHint: 'These are guesses based on the numbers. Change one setting and play again to check them!',
  conclusions: {
    outcomeExtinct: 'Humans died out in round {0}.',
    outcomeSafe: 'In round {0} humans were safe, with {1} people still alive.',
    outcomeNoHumans: 'There were no humans at the start, so only animals and plants took part ({0} rounds).',
    outcomeGrew: 'The human population grew a lot: from {0} to {1}.',
    outcomeShrank: 'The human population shrank: from {0} to {1}.',
    outcomeStable: 'The human population stayed fairly steady: from {0} to {1}.',
    noPregnancy:
      'Nobody got pregnant, which is most likely why the population could not grow. Males and females may have been too far apart – try a smaller board or more humans.',
    noPregnancyOneSex:
      'Nobody got pregnant because the game started with only one sex. Babies need both a male and a female.',
    topCause: {
      wolfAttack:
        'Wolves were most likely the biggest danger: {0}% of human deaths ({1}) were wolf attacks. Try more dogs or fewer wolves.',
      maleFight:
        'Fights between males were most likely the biggest problem: {0}% of human deaths ({1}). Try lowering the male-vs-male damage.',
      dogAttack: 'Dogs probably caused most human deaths: {0}% ({1}).',
      humanDefense: 'Most human deaths ({0}%, {1}) seem to come from fighting back.',
      mushroom:
        'Poisonous mushrooms were most likely the biggest danger: {0}% of human deaths ({1}). Try fewer mushrooms or more fruit.',
      metabolism:
        'Hunger was most likely the biggest problem: {0}% of human deaths ({1}) happened when people ran out of energy. Try more fruit.',
      oldAge:
        'Most humans died of old age ({0}%, {1}) – that usually means life was fairly safe. Faster reproduction could help the population grow.',
      overcrowding:
        'Overcrowding was most likely the biggest problem: {0}% of human deaths ({1}). The board got too full – try a higher overcrowding threshold or a bigger board.',
      childbirth:
        'Many mothers ({1}, {0}% of human deaths) probably died because there was no free space for the baby. A less crowded board could help.',
      unknown: 'Most human deaths ({0}%, {1}) had an unknown cause.',
    },
    malesFirst: 'The last male died in round {0}. After that, no new babies could be started.',
    malesFirstFights:
      'The last male died in round {0}. Fights between males probably played a big part: they caused {1}% of male deaths.',
    femalesFirst: 'The last female died in round {0}. Without females, no babies can be born.',
    bothSexesSameRound: 'The last males and females died in the same round ({0}).',
    fewerBirths: 'Only {0} babies were born, but {1} humans died. When deaths beat births, a population shrinks.',
    moreBirths: '{0} babies were born and {1} humans died. More births than deaths is what made the population grow.',
    expansionPeak: 'At its peak there were {0} humans (round {1}) – at least twice as many as at the start.',
    crowdingLimited: '{0} humans died of overcrowding, so the lack of space probably slowed down the growth.',
    predators: 'Wolves killed {0} humans, and dogs killed {1} wolves.',
  },

  alerts: {
    allMalesDiedUnlessBoy:
      'All males have died - reproduction is no longer possible unless a pregnant female gives birth to a boy',
    wolvesExtinctTitle: 'ℹ️ Wolves Extinct',
    wolvesExtinct: 'There are no wolves left on the board',
    dogsExtinctTitle: 'ℹ️ Dogs Extinct',
    dogsExtinct: 'There are no dogs left on the board',
  },

  overcrowding: {
    title: 'Overcrowding',
    humans: 'Humans {0}/{1}',
    animals: 'Animals {0}/{1}',
    active: '⚠ overcrowded ×{0}',
    ok: 'OK',
  },
};

export const pl: SummaryKeys = {
  title: 'Podsumowanie gry',
  closeLabel: 'Zamknij podsumowanie',
  newGame: 'Nowy eksperyment',
  backToBoard: 'Wróć do planszy',
  scrollRegion: 'Szczegóły podsumowania',
  endReason: {
    humansExtinct: 'Koniec gry: wszyscy ludzie wyginęli.',
    humansSafe: 'Koniec gry: ludzie są bezpieczni – nie ma już wilków ani grzybów.',
    userFinished: 'Gra została zakończona.',
  },

  factsTitle: 'Co się wydarzyło',
  roundsPlayed: 'Liczba rozegranych rund: {0}',
  firstPregnancy: 'Pierwsza ciąża zaczęła się w rundzie {0}',
  noPregnancy: 'Przez całą grę nikt nie zaszedł w ciążę',
  babiesBorn: 'Liczba urodzonych dzieci: {0}',
  peakHumans: 'Najwięcej ludzi naraz: {0} (runda {1})',
  startEnd: '{0}: {1} na początku, {2} na końcu',

  thresholdsTitle: 'Kiedy zmieniła się liczebność?',
  thresholdsHint: 'Pierwsza runda, w której grupa osiągnęła taki procent swojej liczebności z początku gry.',
  colGroup: 'Grupa',
  col50: 'Połowa (50%)',
  col10: '10%',
  col0: 'Nikt nie został (0%)',
  col200: 'Podwojenie (200%)',
  rowMales: '👨 Mężczyźni',
  rowFemales: '👩 Kobiety',
  roundN: 'runda {0}',
  notReached: 'nie osiągnięto',
  notApplicable: 'nie dotyczy',

  deathsTitle: 'Przyczyny śmierci',
  colCause: 'Przyczyna',
  colTotal: 'Razem',
  noDeaths: 'W tej grze nikt nie zginął.',
  species: {
    male: '👨 Mężczyźni',
    female: '👩 Kobiety',
    wolf: '🐺 Wilki',
    dog: '🐕 Psy',
  },
  causes: {
    wolfAttack: 'Atak wilka',
    maleFight: 'Walka między mężczyznami',
    dogAttack: 'Ugryzienie psa',
    humanDefense: 'Zabity przez broniącego się człowieka',
    mushroom: 'Trujący grzyb',
    metabolism: 'Brak energii',
    oldAge: 'Starość',
    overcrowding: 'Przeludnienie',
    childbirth: 'Poród (brak miejsca dla dziecka)',
    unknown: 'Nieznana',
  },

  conclusionsTitle: 'Czego się dowiedzieliśmy?',
  conclusionsHint:
    'To przypuszczenia na podstawie liczb. Zmień jedno ustawienie i zagraj jeszcze raz, żeby je sprawdzić!',
  conclusions: {
    outcomeExtinct: 'Ludzie wyginęli w rundzie {0}.',
    outcomeSafe: 'W rundzie {0} ludzie byli bezpieczni. Żyło ich jeszcze {1}.',
    outcomeNoHumans: 'Na początku nie było ludzi, więc grały tylko zwierzęta i rośliny (rundy: {0}).',
    outcomeGrew: 'Liczba ludzi bardzo wzrosła: z {0} do {1}.',
    outcomeShrank: 'Liczba ludzi spadła: z {0} do {1}.',
    outcomeStable: 'Liczba ludzi była dość stała: z {0} do {1}.',
    noPregnancy:
      'Nikt nie zaszedł w ciążę i to najpewniej dlatego populacja nie mogła rosnąć. Mężczyźni i kobiety mogli być za daleko od siebie – spróbuj mniejszej planszy albo większej liczby ludzi.',
    noPregnancyOneSex:
      'Nikt nie zaszedł w ciążę, bo na początku była tylko jedna płeć. Do narodzin dziecka potrzebni są mężczyzna i kobieta.',
    topCause: {
      wolfAttack:
        'Największym zagrożeniem były najpewniej wilki: {0}% śmierci ludzi ({1}) to ataki wilków. Spróbuj dodać więcej psów albo mniej wilków.',
      maleFight:
        'Największym problemem były najpewniej walki między mężczyznami: {0}% śmierci ludzi ({1}). Spróbuj zmniejszyć obrażenia w walce mężczyzn.',
      dogAttack: 'Psy prawdopodobnie spowodowały najwięcej śmierci ludzi: {0}% ({1}).',
      humanDefense: 'Najwięcej śmierci ludzi ({0}%, {1}) wydaje się wynikać z obrony.',
      mushroom:
        'Największym zagrożeniem były najpewniej trujące grzyby: {0}% śmierci ludzi ({1}). Spróbuj mniej grzybów albo więcej owoców.',
      metabolism:
        'Największym problemem był najpewniej głód: {0}% śmierci ludzi ({1}) nastąpiło z braku energii. Spróbuj dodać więcej owoców.',
      oldAge:
        'Najwięcej ludzi zmarło ze starości ({0}%, {1}) – to zwykle znaczy, że życie było dość bezpieczne. Szybsze rozmnażanie mogłoby pomóc populacji rosnąć.',
      overcrowding:
        'Największym problemem było najpewniej przeludnienie: {0}% śmierci ludzi ({1}). Plansza była za pełna – spróbuj wyższego progu przeludnienia albo większej planszy.',
      childbirth:
        'Wiele matek ({1}, czyli {0}% śmierci ludzi) prawdopodobnie zmarło, bo zabrakło wolnego miejsca dla dziecka. Mniej zatłoczona plansza mogłaby pomóc.',
      unknown: 'Najwięcej śmierci ludzi ({0}%, {1}) miało nieznaną przyczynę.',
    },
    malesFirst: 'Ostatni mężczyzna zginął w rundzie {0}. Potem nie mogły już zaczynać się nowe ciąże.',
    malesFirstFights:
      'Ostatni mężczyzna zginął w rundzie {0}. Walki między mężczyznami prawdopodobnie miały duże znaczenie: spowodowały {1}% śmierci mężczyzn.',
    femalesFirst: 'Ostatnia kobieta zginęła w rundzie {0}. Bez kobiet nie mogą rodzić się dzieci.',
    bothSexesSameRound: 'Ostatni mężczyźni i ostatnie kobiety zginęli w tej samej rundzie ({0}).',
    fewerBirths:
      'Urodzone dzieci: {0}, zmarli ludzie: {1}. Gdy śmierci jest więcej niż narodzin, populacja się zmniejsza.',
    moreBirths: 'Urodzone dzieci: {0}, zmarli ludzie: {1}. Więcej narodzin niż śmierci sprawiło, że populacja rosła.',
    expansionPeak: 'W szczytowym momencie było {0} ludzi (runda {1}) – co najmniej dwa razy więcej niż na początku.',
    crowdingLimited:
      'Z powodu przeludnienia zmarło ludzi: {0}, więc brak miejsca prawdopodobnie spowolnił wzrost populacji.',
    predators: 'Ludzie zabici przez wilki: {0}. Wilki zabite przez psy: {1}.',
  },

  alerts: {
    allMalesDiedUnlessBoy:
      'Wszyscy mężczyźni zginęli - rozmnażanie nie będzie możliwe, chyba że ciężarna kobieta urodzi chłopca',
    wolvesExtinctTitle: 'ℹ️ Wilki wyginęły',
    wolvesExtinct: 'Na planszy nie ma już wilków',
    dogsExtinctTitle: 'ℹ️ Psy wyginęły',
    dogsExtinct: 'Na planszy nie ma już psów',
  },

  overcrowding: {
    title: 'Przeludnienie',
    humans: 'Ludzie {0}/{1}',
    animals: 'Zwierzęta {0}/{1}',
    active: '⚠ przeludnienie ×{0}',
    ok: 'OK',
  },
};
