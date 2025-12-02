import { Entity } from './Entity';
import { EntityType, Sex, Genome } from '../types';
import { DEFAULT_CONFIG } from '../config';
import { GenomeUtils } from '../utils/GenomeUtils';

export class Human extends Entity {
  sex: Sex;
  pregnancyCounter: number;
  reproductionCooldown: number;
  readyToGiveBirth: boolean;
  genome: Genome;
  fatherGenome?: Genome; // Store father's genome during pregnancy

  constructor(
    x: number, 
    y: number, 
    sex: Sex, 
    startingHealth?: number, 
    gompertzA?: number, 
    gompertzB?: number,
    genome?: Genome
  ) {
    // Generate genome if not provided (using default config as baseline)
    const activeGenome = genome ?? GenomeUtils.createRandomGenome(
      DEFAULT_CONFIG.human.startingHealth, // Avg Max Health
      1.0,                                 // Avg Strength (multiplier)
      DEFAULT_CONFIG.human.moveTowardFruitProbability, // Avg Greed
      0.0                                  // Avg Caution (default doesn't run from wolves)
    );

    super(
      x,
      y,
      startingHealth ?? activeGenome.maxHealth, // Use genome health if not overridden
      sex === Sex.MALE ? EntityType.MALE : EntityType.FEMALE,
      gompertzA ?? DEFAULT_CONFIG.human.gompertzA,
      gompertzB ?? DEFAULT_CONFIG.human.gompertzB
    );

    this.sex = sex;
    this.pregnancyCounter = 0;
    this.reproductionCooldown = 0;
    this.readyToGiveBirth = false;
    this.genome = activeGenome;

    // Ensure health never exceeds genome's max health
    this.health = Math.min(this.health, activeGenome.maxHealth);
  }

  isPregnant(): boolean {
    return this.pregnancyCounter > 0;
  }

  canReproduce(): boolean {
    return this.sex === Sex.FEMALE && !this.isPregnant() && this.reproductionCooldown === 0;
  }

  startPregnancy(fatherGenome?: Genome): void {
    if (this.sex === Sex.FEMALE && !this.isPregnant()) {
      this.pregnancyCounter = DEFAULT_CONFIG.human.pregnancyPeriod;
      this.fatherGenome = fatherGenome; // Store father's genes for offspring
    }
  }

  advancePregnancy(): boolean {
    if (this.pregnancyCounter > 0) {
      this.pregnancyCounter--;
      if (this.pregnancyCounter === 0) {
        // Pregnancy completed - ready to give birth
        this.readyToGiveBirth = true;
        this.reproductionCooldown = DEFAULT_CONFIG.human.cooldownPeriod;
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

  isMale(): boolean {
    return this.sex === Sex.MALE;
  }

  isFemale(): boolean {
    return this.sex === Sex.FEMALE;
  }
}
