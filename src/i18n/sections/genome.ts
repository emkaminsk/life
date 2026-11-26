/** Genome trait panel / chart (owned by workstream E). Trait names are reusable: t('genome.trait.<gene>'). */
type TraitText = {
  maxHealth: string;
  strength: string;
  metabolism: string;
  greed: string;
  caution: string;
  longevity: string;
};

export interface GenomeKeys {
  title: string;
  /** Short, student-friendly gene names. */
  trait: TraitText;
  /** One-sentence explanation of what each gene does. */
  traitHelp: TraitText;
  showTraits: string;
  male: string;
  female: string;
  maleShort: string;
  femaleShort: string;
  /** Screen-reader / tooltip line for one legend row: {0}=trait, {1}=male value, {2}=female value, {3}=range. */
  legendValue: string;
  /** Shown instead of a value when no individual of that sex is alive. */
  extinct: string;
  /** Range hint: {0}=min, {1}=max. */
  range: string;
  /** Y axis caption: lines are drawn as a share of each trait's range. */
  axisPercent: string;
  chartLabel: string;
  noTraitsSelected: string;
  waitingForData: string;
}

export const en: GenomeKeys = {
  title: 'Genetic traits',
  trait: {
    maxHealth: 'Max health',
    strength: 'Strength',
    metabolism: 'Metabolism',
    greed: 'Greed',
    caution: 'Caution',
    longevity: 'Longevity',
  },
  traitHelp: {
    maxHealth: 'How much health a human can have at most.',
    strength: 'Multiplies the damage a human deals in a fight.',
    metabolism: 'How much energy each step costs. Lower is thriftier.',
    greed: 'Chance to walk toward food that is in sight.',
    caution: 'Chance to run away from a wolf that is in sight.',
    longevity: 'Multiplies how fast a human ages. Above 1 means ageing faster.',
  },
  showTraits: 'Show traits',
  male: 'Males',
  female: 'Females',
  maleShort: '♂',
  femaleShort: '♀',
  legendValue: '{0}: males {1}, females {2} (range {3})',
  extinct: 'none alive',
  range: '{0}–{1}',
  axisPercent: '% of range',
  chartLabel: 'Average genetic traits of males and females over time',
  noTraitsSelected: 'Tick a trait to show it',
  waitingForData: 'Waiting for data...',
};

export const pl: GenomeKeys = {
  title: 'Cechy genetyczne',
  trait: {
    maxHealth: 'Maks. zdrowie',
    strength: 'Siła',
    metabolism: 'Metabolizm',
    greed: 'Łakomstwo',
    caution: 'Ostrożność',
    longevity: 'Długowieczność',
  },
  traitHelp: {
    maxHealth: 'Ile zdrowia człowiek może mieć najwyżej.',
    strength: 'Mnoży obrażenia, które człowiek zadaje w walce.',
    metabolism: 'Ile energii kosztuje każdy krok. Mniej znaczy oszczędniej.',
    greed: 'Szansa, że człowiek pójdzie w stronę widocznego jedzenia.',
    caution: 'Szansa, że człowiek ucieknie przed widocznym wilkiem.',
    longevity: 'Mnoży tempo starzenia się. Powyżej 1 oznacza szybsze starzenie.',
  },
  showTraits: 'Pokaż cechy',
  male: 'Mężczyźni',
  female: 'Kobiety',
  maleShort: '♂',
  femaleShort: '♀',
  legendValue: '{0}: mężczyźni {1}, kobiety {2} (zakres {3})',
  extinct: 'brak żywych',
  range: '{0}–{1}',
  axisPercent: '% zakresu',
  chartLabel: 'Średnie cechy genetyczne mężczyzn i kobiet w czasie',
  noTraitsSelected: 'Zaznacz cechę, aby ją pokazać',
  waitingForData: 'Czekam na dane...',
};
