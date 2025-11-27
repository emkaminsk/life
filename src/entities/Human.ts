import { Entity } from './Entity';
import { EntityType, Sex } from '../types';
import { DEFAULT_CONFIG } from '../config';

export class Human extends Entity {
  sex: Sex;
  pregnancyCounter: number;
  reproductionCooldown: number;
  readyToGiveBirth: boolean;

  constructor(x: number, y: number, sex: Sex, startingHealth?: number, gompertzA?: number, gompertzB?: number) {
    super(
      x,
      y,
      startingHealth ?? DEFAULT_CONFIG.human.startingHealth,
      sex === Sex.MALE ? EntityType.MALE : EntityType.FEMALE,
      gompertzA ?? DEFAULT_CONFIG.human.gompertzA,
      gompertzB ?? DEFAULT_CONFIG.human.gompertzB
    );
    this.sex = sex;
    this.pregnancyCounter = 0;
    this.reproductionCooldown = 0;
    this.readyToGiveBirth = false;
  }

  isPregnant(): boolean {
    return this.pregnancyCounter > 0;
  }

  canReproduce(): boolean {
    return this.sex === Sex.FEMALE && !this.isPregnant() && this.reproductionCooldown === 0;
  }

  startPregnancy(): void {
    if (this.sex === Sex.FEMALE && !this.isPregnant()) {
      this.pregnancyCounter = DEFAULT_CONFIG.human.pregnancyPeriod;
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
