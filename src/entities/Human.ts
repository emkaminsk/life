import { Entity } from './Entity';
import { EntityType, Sex, type Genome } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { GenomeUtils } from '../utils/GenomeUtils';
import { type EnergyState, getEnergyState } from '../utils/energy';

export class Human extends Entity {
  sex: Sex;
  pregnancyCounter: number;
  reproductionCooldown: number;
  readyToGiveBirth: boolean;
  genome: Genome;
  fatherGenome?: Genome; // Store father's genome during pregnancy

  /**
   * @param startingHealth initial health; also the baseline (average) for a randomly
   *   generated genome's maxHealth. Health never exceeds genome.maxHealth.
   * @param genome explicit genome (e.g. inherited); when omitted a random one is generated
   * @param avgGreed baseline greed for a randomly generated genome (configured
   *   moveTowardFruitProbability)
   * @param avgCaution baseline caution for a randomly generated genome (config human.avgCaution)
   * @param avgMetabolism baseline metabolism for a randomly generated genome (config human.avgMetabolism)
   */
  constructor(
    x: number,
    y: number,
    sex: Sex,
    startingHealth?: number,
    gompertzA?: number,
    gompertzB?: number,
    genome?: Genome,
    avgGreed?: number,
    avgCaution?: number,
    avgMetabolism?: number,
  ) {
    const activeGenome =
      genome ??
      GenomeUtils.createRandomGenome(
        startingHealth ?? DEFAULT_CONFIG.human.startingHealth, // Avg Max Health
        1.0, // Avg Strength (multiplier)
        avgGreed ?? DEFAULT_CONFIG.human.moveTowardFruitProbability, // Avg Greed
        avgCaution ?? DEFAULT_CONFIG.human.avgCaution,
        avgMetabolism ?? DEFAULT_CONFIG.human.avgMetabolism,
      );

    super(
      x,
      y,
      Math.min(startingHealth ?? activeGenome.maxHealth, activeGenome.maxHealth),
      sex === Sex.MALE ? EntityType.MALE : EntityType.FEMALE,
      gompertzA ?? DEFAULT_CONFIG.human.gompertzA,
      gompertzB ?? DEFAULT_CONFIG.human.gompertzB,
      activeGenome.maxHealth,
    );

    this.sex = sex;
    this.pregnancyCounter = 0;
    this.reproductionCooldown = 0;
    this.readyToGiveBirth = false;
    this.genome = activeGenome;
  }

  isPregnant(): boolean {
    return this.pregnancyCounter > 0;
  }

  canReproduce(): boolean {
    return this.sex === Sex.FEMALE && !this.isPregnant() && this.reproductionCooldown === 0;
  }

  /**
   * Start a pregnancy lasting `pregnancyPeriod` rounds (birth happens exactly that
   * many rounds after conception).
   */
  startPregnancy(fatherGenome?: Genome, pregnancyPeriod: number = DEFAULT_CONFIG.human.pregnancyPeriod): void {
    if (this.sex === Sex.FEMALE && !this.isPregnant()) {
      this.pregnancyCounter = Math.max(1, Math.round(pregnancyPeriod));
      this.fatherGenome = fatherGenome; // Store father's genes for offspring
    }
  }

  /**
   * Advance pregnancy by one round. When it completes the female becomes ready to
   * give birth and enters a `cooldownPeriod`-round reproduction cooldown.
   * @returns true when the pregnancy completed this call
   */
  advancePregnancy(cooldownPeriod: number = DEFAULT_CONFIG.human.cooldownPeriod): boolean {
    if (this.pregnancyCounter > 0) {
      this.pregnancyCounter--;
      if (this.pregnancyCounter === 0) {
        this.readyToGiveBirth = true;
        this.reproductionCooldown = Math.max(0, Math.round(cooldownPeriod));
        return true;
      }
    }
    return false;
  }

  decrementCooldown(): void {
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown--;
    }
  }

  /** Current energy state (PRD 3.16.2): health relative to max health. */
  getEnergyState(): EnergyState {
    return getEnergyState(this.health, this.maxHealth);
  }

  isMale(): boolean {
    return this.sex === Sex.MALE;
  }

  isFemale(): boolean {
    return this.sex === Sex.FEMALE;
  }
}
