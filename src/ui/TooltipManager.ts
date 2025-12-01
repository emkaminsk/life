import type { Entity } from '../entities/Entity';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { Dog } from '../entities/Dog';
import { Fruit } from '../entities/Fruit';
import { EntityType, Sex } from '../types';
import { i18n } from '../i18n/i18n';

export class TooltipManager {
  private tooltipElement: HTMLElement;
  private headerElement: HTMLElement;
  private statsElement: HTMLElement;

  constructor() {
    const tooltip = document.getElementById('entityTooltip');
    if (!tooltip) {
      throw new Error('Tooltip element not found');
    }
    this.tooltipElement = tooltip;

    const header = tooltip.querySelector('.tooltip-header') as HTMLElement;
    const stats = tooltip.querySelector('.tooltip-stats') as HTMLElement;
    if (!header || !stats) {
      throw new Error('Tooltip structure elements not found');
    }
    this.headerElement = header;
    this.statsElement = stats;
  }

  show(entity: Entity, mouseX: number, mouseY: number): void {
    // Format entity information
    const { header, stats } = this.formatEntityInfo(entity);

    // Update tooltip content
    this.headerElement.textContent = header;
    this.statsElement.innerHTML = stats;

    // Position tooltip near mouse cursor
    // Offset to avoid cursor overlap, and ensure it stays within viewport
    const offsetX = 15;
    const offsetY = 15;
    let left = mouseX + offsetX;
    let top = mouseY + offsetY;

    // Get tooltip dimensions (show it first to measure)
    this.tooltipElement.style.display = 'block';
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    // Check if tooltip would overflow viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + tooltipRect.width > viewportWidth) {
      left = mouseX - tooltipRect.width - offsetX;
    }
    if (top + tooltipRect.height > viewportHeight) {
      top = mouseY - tooltipRect.height - offsetY;
    }

    // Ensure tooltip doesn't go off left or top edge
    left = Math.max(5, left);
    top = Math.max(5, top);

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
  }

  hide(): void {
    this.tooltipElement.style.display = 'none';
  }

  private formatEntityInfo(entity: Entity): { header: string; stats: string } {
    const t = i18n.t.bind(i18n);

    // Determine entity type and emoji
    let emoji = '';
    let typeName = '';

    if (entity instanceof Human) {
      if (entity.sex === Sex.MALE) {
        emoji = '👨';
        typeName = t('tooltip.maleHuman');
      } else {
        emoji = entity.isPregnant() ? '🤰' : '👩';
        typeName = entity.isPregnant() ? t('tooltip.pregnantFemale') : t('tooltip.femaleHuman');
      }
    } else if (entity instanceof Wolf) {
      emoji = '🐺';
      typeName = t('tooltip.wolf');
    } else if (entity instanceof Dog) {
      emoji = '🐕';
      typeName = t('tooltip.dog');
    } else if (entity instanceof Fruit) {
      emoji = entity.isRipe() ? '🍎' : '🍏';
      typeName = entity.isRipe() ? t('tooltip.ripeFruit') : t('tooltip.unripeFruit');
    } else if (entity.type === EntityType.MUSHROOM) {
      emoji = '🍄';
      typeName = t('tooltip.mushroom');
    }

    const header = `${emoji} ${typeName}`;

    // Build stats HTML based on entity type
    let stats = '';

    // All living creatures (not plants) show health and age
    if (entity instanceof Human || entity instanceof Wolf || entity instanceof Dog) {
      const healthLabel = t('tooltip.health');
      const ageLabel = t('tooltip.age');

      stats += `<div>${healthLabel}: <strong>${Math.round(entity.health)}</strong></div>`;
      stats += `<div>${ageLabel}: <strong>${entity.age}</strong></div>`;

      // Additional info for humans
      if (entity instanceof Human) {
        if (entity.sex === Sex.FEMALE && entity.isPregnant()) {
          const pregnantLabel = t('tooltip.pregnant');
          stats += `<div>${pregnantLabel}: <strong>${entity.pregnancyCounter} ${t('tooltip.roundsRemaining')}</strong></div>`;
        }
      }
    }

    // Plants just show type (already in header)
    if (entity instanceof Fruit) {
      if (!entity.isRipe()) {
        stats += `<div>${t('tooltip.ripening')}: <strong>${entity.age}</strong></div>`;
      }
    }

    return { header, stats };
  }
}
