import type { ChallengeFailReason, ChallengeId, ChallengeStatus } from '../../core/challenges';

/** Challenge picker, HUD and challenge texts (written for 11–15 year olds). */
export interface ChallengeTexts {
  name: string;
  goal: string;
  hint: string;
}

export type ChallengesKeys = {
  label: string;
  free: string;
  freeGoal: string;
  freeHint: string;
  goalLabel: string;
  hintLabel: string;
  progressLabel: string;
  /** "{value} / {target}" */
  progress: string;
  status: Record<ChallengeStatus, string>;
  /** "Failed ✗ – {reason}" */
  failedWithReason: string;
  failReason: Record<ChallengeFailReason, string>;
  lockedHint: string;
} & Record<Exclude<ChallengeId, 'free'>, ChallengeTexts>;

export const en: ChallengesKeys = {
  label: '🏆 Challenge',
  free: 'Free play',
  freeGoal: 'No goal – experiment however you like.',
  freeHint: 'Pick a challenge to get a goal and a progress bar.',
  goalLabel: 'Goal:',
  hintLabel: '💡 Tip:',
  progressLabel: 'Challenge progress',
  progress: '{0} / {1}',
  status: {
    inProgress: 'In progress',
    complete: 'Complete ✓',
    failed: 'Failed ✗',
  },
  failedWithReason: 'Failed ✗ – {0}',
  failReason: {
    humansExtinct: 'all humans died out',
    overcrowdingDeath: 'someone died of overcrowding',
  },
  lockedHint: '🔒 This challenge fixes some settings for you.',

  survive: {
    name: 'Survivors',
    goal: 'Keep humans alive until round 300.',
    hint: 'Fruit keeps people healthy and dogs keep wolves away.',
  },
  clearDangers: {
    name: 'Clean sweep',
    goal: 'Get rid of every wolf and every mushroom at the same time.',
    hint: 'Dogs hunt wolves. A mushroom disappears when someone eats it – ouch! Fewer new mushrooms make it easier.',
  },
  babyBoom: {
    name: 'Baby boom',
    goal: 'Get 100 babies born.',
    hint: 'A baby needs a mother and a father close together. Shorter pregnancies help too.',
  },
  noDogs: {
    name: 'No dogs allowed',
    goal: 'Survive 200 rounds without any dogs.',
    hint: 'Without dogs, wolves are the big danger. Try fewer wolves or more humans.',
  },
  noFruits: {
    name: 'Hungry times',
    goal: 'Survive 100 rounds without any fruit.',
    hint: 'With no fruit, nobody can heal. Many humans and few dangers give you a chance.',
  },
  doublePopulation: {
    name: 'Twice as many',
    goal: 'Double the number of humans (at least 10).',
    hint: 'A population grows when more babies are born than people die. Keep them fed and safe.',
  },
  balance: {
    name: 'Steady balance',
    goal: 'Keep the number of humans within 25% of the start for 100 rounds in a row.',
    hint: 'Too many people get crowded, too few die out. Leave the range and the count starts again!',
  },
  noCrowding: {
    name: 'Room to breathe',
    goal: 'Survive 150 rounds without a single death from overcrowding.',
    hint: 'This counts humans and animals. Use a big board or raise the overcrowding threshold.',
  },
  wiseElders: {
    name: 'Wise elders',
    goal: 'Let 25 humans live so long that they die of old age.',
    hint: 'In a safe world people grow old: few wolves, few mushrooms, plenty of fruit.',
  },
};

export const pl: ChallengesKeys = {
  label: '🏆 Wyzwanie',
  free: 'Swobodna gra',
  freeGoal: 'Bez celu – eksperymentuj, jak chcesz.',
  freeHint: 'Wybierz wyzwanie, żeby dostać cel i pasek postępu.',
  goalLabel: 'Cel:',
  hintLabel: '💡 Wskazówka:',
  progressLabel: 'Postęp wyzwania',
  progress: '{0} / {1}',
  status: {
    inProgress: 'W toku',
    complete: 'Ukończone ✓',
    failed: 'Nieudane ✗',
  },
  failedWithReason: 'Nieudane ✗ – {0}',
  failReason: {
    humansExtinct: 'wszyscy ludzie wyginęli',
    overcrowdingDeath: 'ktoś zginął z powodu przeludnienia',
  },
  lockedHint: '🔒 To wyzwanie samo ustawia niektóre opcje.',

  survive: {
    name: 'Przetrwanie',
    goal: 'Utrzymaj ludzi przy życiu do rundy 300.',
    hint: 'Owoce pomagają ludziom zachować zdrowie, a psy odganiają wilki.',
  },
  clearDangers: {
    name: 'Wielkie sprzątanie',
    goal: 'Pozbądź się wszystkich wilków i wszystkich grzybów naraz.',
    hint: 'Psy polują na wilki. Grzyb znika, gdy ktoś go zje – ale to boli! Mniej nowych grzybów ułatwia zadanie.',
  },
  babyBoom: {
    name: 'Wyż demograficzny',
    goal: 'Niech urodzi się 100 dzieci.',
    hint: 'Do narodzin dziecka potrzebni są mama i tata blisko siebie. Krótsza ciąża też pomaga.',
  },
  noDogs: {
    name: 'Zakaz psów',
    goal: 'Przetrwaj 200 rund bez psów.',
    hint: 'Bez psów wilki są wielkim zagrożeniem. Spróbuj mniej wilków albo więcej ludzi.',
  },
  noFruits: {
    name: 'Głodne czasy',
    goal: 'Przetrwaj 100 rund bez owoców.',
    hint: 'Bez owoców nikt się nie wyleczy. Wielu ludzi i mało zagrożeń daje szansę.',
  },
  doublePopulation: {
    name: 'Dwa razy więcej',
    goal: 'Podwój liczbę ludzi (do co najmniej 10).',
    hint: 'Populacja rośnie, gdy rodzi się więcej dzieci, niż umiera ludzi. Zadbaj o jedzenie i bezpieczeństwo.',
  },
  balance: {
    name: 'Równowaga',
    goal: 'Przez 100 rund z rzędu utrzymaj liczbę ludzi w granicach ±25% stanu z początku.',
    hint: 'Za dużo ludzi – robi się tłok, za mało – wymierają. Gdy wyjdziesz poza zakres, liczenie zacznie się od nowa!',
  },
  noCrowding: {
    name: 'Bez tłoku',
    goal: 'Przetrwaj 150 rund tak, żeby nikt nie zginął z powodu przeludnienia.',
    hint: 'Liczą się ludzie i zwierzęta. Użyj dużej planszy albo podnieś próg przeludnienia.',
  },
  wiseElders: {
    name: 'Mądrzy seniorzy',
    goal: 'Niech 25 osób dożyje sędziwego wieku i umrze ze starości.',
    hint: 'W bezpiecznym świecie ludzie dożywają starości: mało wilków, mało grzybów, dużo owoców.',
  },
};
