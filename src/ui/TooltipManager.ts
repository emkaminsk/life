import { Dog } from '../entities/Dog';
import type { Entity } from '../entities/Entity';
import { Fruit } from '../entities/Fruit';
import { Human } from '../entities/Human';
import { Wolf } from '../entities/Wolf';
import { i18n } from '../i18n/i18n';
import { EntityType, Sex } from '../types';

export interface TooltipRow {
  label: string;
  value: string;
}

export interface TooltipContent {
  header: string;
  rows: TooltipRow[];
  /** Section shown under a separator (e.g. genetics); empty when none. */
  sectionTitle?: string;
  sectionRows: TooltipRow[];
}

/**
 * Map a pointer position to a board cell. Uses the canvas's CSS box
 * (getBoundingClientRect) rather than canvas.width, which is the HiDPI
 * backing-store size.
 */
export function getCellAtPoint(
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  boardWidth: number,
  boardHeight: number,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (rect.width <= 0 || rect.height <= 0 || boardWidth <= 0 || boardHeight <= 0) return null;
  const x = Math.floor(((clientX - rect.left) / rect.width) * boardWidth);
  const y = Math.floor(((clientY - rect.top) / rect.height) * boardHeight);
  if (x < 0 || y < 0 || x >= boardWidth || y >= boardHeight) return null;
  return { x, y };
}

function maxHealthOf(entity: Entity): number | undefined {
  const value = (entity as { maxHealth?: unknown }).maxHealth;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function formatEntityInfo(entity: Entity): TooltipContent {
  const t = (key: string, ...args: (string | number)[]) => i18n.t(key, ...args);
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

  const rows: TooltipRow[] = [];
  const sectionRows: TooltipRow[] = [];
  let sectionTitle: string | undefined;

  if (entity instanceof Human || entity instanceof Wolf || entity instanceof Dog) {
    const max = maxHealthOf(entity);
    const health = Math.round(entity.health);
    rows.push({ label: t('tooltip.health'), value: max !== undefined ? `${health} / ${Math.round(max)}` : `${health}` });
    rows.push({ label: t('tooltip.age'), value: String(entity.age) });

    if (entity instanceof Human) {
      if (entity.sex === Sex.FEMALE && entity.isPregnant()) {
        rows.push({ label: t('tooltip.pregnant'), value: `${entity.pregnancyCounter} ${t('tooltip.roundsRemaining')}` });
      }
      const g = entity.genome;
      sectionTitle = t('tooltip.genetics');
      sectionRows.push(
        { label: t('tooltip.geneMaxHealth'), value: String(Math.round(g.maxHealth)) },
        { label: t('tooltip.geneStrength'), value: `${g.strength.toFixed(2)}x` },
        { label: t('tooltip.geneMetabolism'), value: g.metabolism.toFixed(2) },
        { label: t('tooltip.geneGreed'), value: `${(g.greed * 100).toFixed(0)}%` },
        { label: t('tooltip.geneCaution'), value: `${(g.caution * 100).toFixed(0)}%` },
      );
    }
  }

  if (entity instanceof Fruit && !entity.isRipe()) {
    rows.push({ label: t('tooltip.ripening'), value: `${entity.ripeningCounter} ${t('tooltip.roundsRemaining')}` });
  }

  return { header: `${emoji} ${typeName}`, rows, sectionTitle, sectionRows };
}

function renderRow(row: TooltipRow): HTMLElement {
  const div = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = row.value;
  div.append(`${row.label}: `, strong);
  return div;
}

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

    const header = tooltip.querySelector<HTMLElement>('.tooltip-header');
    const stats = tooltip.querySelector<HTMLElement>('.tooltip-stats');
    if (!header || !stats) {
      throw new Error('Tooltip structure elements not found');
    }
    this.headerElement = header;
    this.statsElement = stats;
  }

  isVisible(): boolean {
    return this.tooltipElement.style.display === 'block';
  }

  show(entity: Entity, mouseX: number, mouseY: number): void {
    const content = formatEntityInfo(entity);

    this.headerElement.textContent = content.header;
    const nodes: Node[] = content.rows.map(renderRow);
    if (content.sectionTitle) {
      const sep = document.createElement('div');
      sep.className = 'tooltip-separator';
      const title = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = content.sectionTitle;
      title.append(strong);
      nodes.push(sep, title, ...content.sectionRows.map(renderRow));
    }
    this.statsElement.replaceChildren(...nodes);

    // Position near the cursor, flipping to stay inside the viewport.
    const offset = 15;
    let left = mouseX + offset;
    let top = mouseY + offset;

    this.tooltipElement.style.display = 'block';
    const rect = this.tooltipElement.getBoundingClientRect();

    if (left + rect.width > window.innerWidth) left = mouseX - rect.width - offset;
    if (top + rect.height > window.innerHeight) top = mouseY - rect.height - offset;
    left = Math.max(5, left);
    top = Math.max(5, top);

    this.tooltipElement.style.left = `${left}px`;
    this.tooltipElement.style.top = `${top}px`;
  }

  hide(): void {
    this.tooltipElement.style.display = 'none';
  }
}
