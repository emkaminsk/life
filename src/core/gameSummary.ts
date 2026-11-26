import type { ChallengeProgress } from './challenges';
import type { DeathCause, EndReason, RoundRecord, Species } from './simulationEvents';

/**
 * End-of-game summary (F5): a pure function of the round history and the end
 * reason. Text is NOT produced here; conclusions are i18n keys + arguments
 * that the SummaryDialog localizes at render time, so the summary can be
 * re-rendered when the language changes.
 */

/** First round (≥ 1) at which a population crossed each threshold of its initial size. */
export interface ThresholdRounds {
  /** First round with ≤ 50% of the initial population. */
  pct50: number | null;
  /** First round with ≤ 10% of the initial population. */
  pct10: number | null;
  /** First round with no individuals left. */
  pct0: number | null;
  /** First round with ≥ 200% of the initial population. */
  pct200: number | null;
  /** false when the initial population was 0 (percentages are meaningless: "n/a"). */
  applicable: boolean;
}

export interface CreatureCounts {
  males: number;
  females: number;
  wolves: number;
  dogs: number;
}

export interface Conclusion {
  /** Key below `summary.conclusions.` in the i18n tables. */
  key: string;
  args: (string | number)[];
}

export type DeathTally = Record<Species, Partial<Record<DeathCause, number>>>;

export interface GameSummary {
  endReason: EndReason;
  roundsPlayed: number;
  firstPregnancyRound: number | null;
  babiesBorn: number;
  initial: CreatureCounts;
  final: CreatureCounts;
  peakHumans: { value: number; round: number };
  males: ThresholdRounds;
  females: ThresholdRounds;
  deaths: DeathTally;
  conclusions: Conclusion[];
  /** Final progress of the challenge played, absent in free play. */
  challenge?: ChallengeProgress;
}

/** Fixed order used for display and for breaking ties between causes. */
export const DEATH_CAUSES: readonly DeathCause[] = [
  'wolfAttack',
  'maleFight',
  'mushroom',
  'metabolism',
  'oldAge',
  'overcrowding',
  'childbirth',
  'dogAttack',
  'humanDefense',
  'unknown',
];

export const SPECIES: readonly Species[] = ['male', 'female', 'wolf', 'dog'];

/** Outcome sentence + at most this many explanatory conclusions. */
export const MAX_CONCLUSIONS = 4;

/** A cause is called "the biggest danger" only when it caused at least this share of human deaths. */
export const TOP_CAUSE_MIN_SHARE = 0.3;
/** Male-fight share of male deaths that is worth a note when males died out first. */
export const MALE_FIGHT_NOTE_SHARE = 0.4;
/** Overcrowding share of human deaths that counts as "growth limited by crowding". */
export const CROWDING_MIN_SHARE = 0.1;

/**
 * First round ≥ 1 at which `series` reached ≤ 50%, ≤ 10%, exactly 0 and ≥ 200%
 * of `initial`. `series[i]` is the population after round `rounds[i]`
 * (defaults to `i`, i.e. `series[0]` is the starting population).
 */
export function crossingRounds(
  series: readonly number[],
  initial: number,
  rounds?: readonly number[],
): ThresholdRounds {
  const result: ThresholdRounds = { pct50: null, pct10: null, pct0: null, pct200: null, applicable: initial > 0 };
  if (!result.applicable) return result;

  for (let i = 0; i < series.length; i++) {
    const round = rounds?.[i] ?? i;
    if (round < 1) continue;
    const value = series[i];
    if (result.pct50 === null && value <= initial * 0.5) result.pct50 = round;
    if (result.pct10 === null && value <= initial * 0.1) result.pct10 = round;
    if (result.pct0 === null && value === 0) result.pct0 = round;
    if (result.pct200 === null && value >= initial * 2) result.pct200 = round;
  }
  return result;
}

function counts(record: RoundRecord | undefined): CreatureCounts {
  return {
    males: record?.males ?? 0,
    females: record?.females ?? 0,
    wolves: record?.wolves ?? 0,
    dogs: record?.dogs ?? 0,
  };
}

function tallyDeaths(records: readonly RoundRecord[]): DeathTally {
  const tally: DeathTally = { male: {}, female: {}, wolf: {}, dog: {} };
  for (const record of records) {
    for (const death of record.events.deaths) {
      const bySpecies = tally[death.species];
      bySpecies[death.cause] = (bySpecies[death.cause] ?? 0) + 1;
    }
  }
  return tally;
}

function countOf(tally: DeathTally, species: Species, cause: DeathCause): number {
  return tally[species][cause] ?? 0;
}

function totalOf(tally: DeathTally, species: Species): number {
  return DEATH_CAUSES.reduce((sum, cause) => sum + countOf(tally, species, cause), 0);
}

const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

/** Summarize a finished game. `records[0]` is the starting state (round 0). */
export function summarize(
  records: readonly RoundRecord[],
  endReason: EndReason,
  challenge?: ChallengeProgress | null,
): GameSummary {
  const first = records[0];
  const last = records[records.length - 1];
  const rounds = records.map((r) => r.round);

  const initial = counts(first);
  const final = counts(last);
  const roundsPlayed = last?.round ?? 0;

  let firstPregnancyRound: number | null = null;
  let babiesBorn = 0;
  let peakHumans = { value: initial.males + initial.females, round: first?.round ?? 0 };
  for (const record of records) {
    babiesBorn += record.events.births;
    if (firstPregnancyRound === null && record.round >= 1 && record.events.newPregnancies > 0) {
      firstPregnancyRound = record.round;
    }
    const humans = record.males + record.females;
    if (humans > peakHumans.value) peakHumans = { value: humans, round: record.round };
  }

  const males = crossingRounds(
    records.map((r) => r.males),
    initial.males,
    rounds,
  );
  const females = crossingRounds(
    records.map((r) => r.females),
    initial.females,
    rounds,
  );
  const deaths = tallyDeaths(records);

  const summary: GameSummary = {
    endReason,
    roundsPlayed,
    firstPregnancyRound,
    babiesBorn,
    initial,
    final,
    peakHumans,
    males,
    females,
    deaths,
    conclusions: [],
  };
  if (challenge) summary.challenge = challenge;
  summary.conclusions = buildConclusions(summary);
  return summary;
}

function outcome(s: GameSummary): Conclusion {
  const start = s.initial.males + s.initial.females;
  const end = s.final.males + s.final.females;
  if (s.endReason === 'humansExtinct') return { key: 'outcomeExtinct', args: [s.roundsPlayed] };
  if (s.endReason === 'humansSafe') return { key: 'outcomeSafe', args: [s.roundsPlayed, end] };
  if (start === 0) return { key: 'outcomeNoHumans', args: [s.roundsPlayed] };
  if (end >= start * 2) return { key: 'outcomeGrew', args: [start, end] };
  if (end <= start * 0.5) return { key: 'outcomeShrank', args: [start, end] };
  return { key: 'outcomeStable', args: [start, end] };
}

/**
 * Candidate explanations in a fixed priority order (most decisive first).
 * Every rule is a pure threshold check, so the same history always yields the
 * same conclusions in the same order.
 */
function buildConclusions(s: GameSummary): Conclusion[] {
  const result: Conclusion[] = [outcome(s)];
  const add = (c: Conclusion | null) => {
    if (c && result.length < MAX_CONCLUSIONS) result.push(c);
  };

  const startHumans = s.initial.males + s.initial.females;
  if (startHumans === 0 || s.roundsPlayed === 0) return result;

  const d = s.deaths;
  const humanDeaths = totalOf(d, 'male') + totalOf(d, 'female');
  const humanDeathsBy = (cause: DeathCause) => countOf(d, 'male', cause) + countOf(d, 'female', cause);

  // 1. Nobody ever got pregnant: the population can only shrink.
  if (s.firstPregnancyRound === null) {
    add({ key: s.initial.males === 0 || s.initial.females === 0 ? 'noPregnancyOneSex' : 'noPregnancy', args: [] });
  }

  // 2. The biggest single danger for humans (ties broken by DEATH_CAUSES order).
  if (humanDeaths > 0) {
    let top: DeathCause = DEATH_CAUSES[0];
    for (const cause of DEATH_CAUSES) if (humanDeathsBy(cause) > humanDeathsBy(top)) top = cause;
    const n = humanDeathsBy(top);
    if (n / humanDeaths >= TOP_CAUSE_MIN_SHARE) {
      add({ key: `topCause.${top}`, args: [percent(n, humanDeaths), n] });
    }
  }

  // 3. Which sex disappeared first (no partners left → no babies).
  const m0 = s.males.pct0;
  const f0 = s.females.pct0;
  if (m0 !== null && (f0 === null || m0 < f0)) {
    const maleDeaths = totalOf(d, 'male');
    const fights = countOf(d, 'male', 'maleFight');
    if (maleDeaths > 0 && fights / maleDeaths >= MALE_FIGHT_NOTE_SHARE) {
      add({ key: 'malesFirstFights', args: [m0, percent(fights, maleDeaths)] });
    } else {
      add({ key: 'malesFirst', args: [m0] });
    }
  } else if (f0 !== null && (m0 === null || f0 < m0)) {
    add({ key: 'femalesFirst', args: [f0] });
  } else if (m0 !== null && m0 === f0) {
    add({ key: 'bothSexesSameRound', args: [m0] });
  }

  // 4. Births versus deaths.
  if (s.babiesBorn < humanDeaths) add({ key: 'fewerBirths', args: [s.babiesBorn, humanDeaths] });
  else if (s.babiesBorn > humanDeaths) add({ key: 'moreBirths', args: [s.babiesBorn, humanDeaths] });

  // 5. Expansion and what held it back.
  if (s.peakHumans.value >= startHumans * 2) {
    add({ key: 'expansionPeak', args: [s.peakHumans.value, s.peakHumans.round] });
  }
  const crowding = humanDeathsBy('overcrowding');
  if (crowding > 0 && crowding / humanDeaths >= CROWDING_MIN_SHARE) {
    add({ key: 'crowdingLimited', args: [crowding] });
  }

  // 6. Predators and protectors.
  const killedByWolves = humanDeathsBy('wolfAttack');
  const wolvesKilledByDogs = countOf(d, 'wolf', 'dogAttack');
  if (killedByWolves > 0 || wolvesKilledByDogs > 0) {
    add({ key: 'predators', args: [killedByWolves, wolvesKilledByDogs] });
  }

  return result;
}
