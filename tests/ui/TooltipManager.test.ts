import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dog } from '../../src/entities/Dog';
import { Fruit } from '../../src/entities/Fruit';
import { Human } from '../../src/entities/Human';
import { Mushroom } from '../../src/entities/Mushroom';
import { Wolf } from '../../src/entities/Wolf';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { Sex } from '../../src/types';
import { formatEntityInfo, getCellAtPoint, TooltipManager } from '../../src/ui/TooltipManager';

describe('TooltipManager', () => {
  let tooltip: TooltipManager;
  const el = () => document.getElementById('entityTooltip')!;

  beforeEach(() => {
    i18n.setLanguage(Language.EN);
    document.body.innerHTML = `
      <div id="entityTooltip" class="entity-tooltip" style="display:none">
        <div class="tooltip-header"></div><div class="tooltip-stats"></div>
      </div>`;
    tooltip = new TooltipManager();
  });

  it('destroy() hides the tooltip and drops its content', () => {
    tooltip.show(new Wolf(0, 0), 10, 10);
    expect(tooltip.isVisible()).toBe(true);
    tooltip.destroy();
    expect(tooltip.isVisible()).toBe(false);
    expect(el().textContent?.trim()).toBe('');
    expect(el().style.left).toBe('');
  });

  it('throws when the markup is missing', () => {
    document.body.innerHTML = '';
    expect(() => new TooltipManager()).toThrow();
    document.body.innerHTML = '<div id="entityTooltip"></div>';
    expect(() => new TooltipManager()).toThrow();
  });

  it('shows a wolf with health, max health and age near the cursor', () => {
    const wolf = new Wolf(0, 0, 80);
    wolf.age = 4;
    tooltip.show(wolf, 100, 120);
    expect(tooltip.isVisible()).toBe(true);
    expect(el().querySelector('.tooltip-header')!.textContent).toBe('🐺 Wolf');
    const stats = el().querySelector('.tooltip-stats')!.textContent!;
    expect(stats).toContain('Health: 80');
    expect(stats).toContain('Age: 4');
    expect(el().style.left).toBe('115px');
    expect(el().style.top).toBe('135px');
  });

  it('flips to the other side of the cursor near the viewport edge', () => {
    vi.spyOn(el(), 'getBoundingClientRect').mockReturnValue({ width: 200, height: 100 } as DOMRect);
    tooltip.show(new Dog(0, 0), window.innerWidth - 10, window.innerHeight - 10);
    expect(parseFloat(el().style.left)).toBe(window.innerWidth - 10 - 200 - 15);
    expect(parseFloat(el().style.top)).toBe(window.innerHeight - 10 - 100 - 15);
  });

  it('shows pregnancy and genetics for humans, as text (no HTML injection)', () => {
    const female = new Human(0, 0, Sex.FEMALE, 100);
    female.startPregnancy();
    tooltip.show(female, 10, 10);
    expect(el().querySelector('.tooltip-header')!.textContent).toBe('🤰 Pregnant Female');
    const stats = el().querySelector('.tooltip-stats')!;
    expect(stats.textContent).toContain('Pregnant:');
    expect(stats.textContent).toContain('Genetic Traits');
    expect(stats.querySelector('.tooltip-separator')).not.toBeNull();
    expect(stats.querySelector('script')).toBeNull();
  });

  it('describes plants', () => {
    expect(formatEntityInfo(new Fruit(0, 0, 30, 2)).header).toBe('🍏 Unripe Fruit');
    expect(formatEntityInfo(new Fruit(0, 0, 30, 2)).rows[0].value).toBe('2 rounds remaining');
    expect(formatEntityInfo(new Fruit(0, 0, 30, 0)).header).toBe('🍎 Ripe Fruit');
    expect(formatEntityInfo(new Fruit(0, 0, 30, 0)).rows).toEqual([]);
    expect(formatEntityInfo(new Mushroom(0, 0)).header).toBe('🍄 Mushroom');
    expect(formatEntityInfo(new Human(0, 0, Sex.MALE)).header).toBe('👨 Male Human');
  });

  it('hide() hides the tooltip', () => {
    tooltip.show(new Wolf(0, 0), 1, 1);
    tooltip.hide();
    expect(tooltip.isVisible()).toBe(false);
    expect(el().style.display).toBe('none');
  });

  describe('energy and longevity rows', () => {
    // Labels are compared through i18n.t so the test holds whatever the translation text is
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    const human = (health: number): Human => {
      const genome = { maxHealth: 100, strength: 1, metabolism: 0.35, greed: 0.5, caution: 0.5, longevity: 1.25 };
      const h = new Human(0, 0, Sex.MALE, 100, undefined, undefined, genome);
      h.health = health;
      return h;
    };
    const energyOf = (health: number) =>
      formatEntityInfo(human(health)).rows.find((r) => r.label === i18n.t('tooltip.energy'));

    it('shows the current energy state, which follows health', () => {
      expect(energyOf(100)?.value).toBe(i18n.t('tooltip.energyStates.satiated'));
      expect(energyOf(90)?.value).toBe(i18n.t('tooltip.energyStates.full'));
      expect(energyOf(65)?.value).toBe(i18n.t('tooltip.energyStates.moderate'));
      expect(energyOf(40)?.value).toBe(i18n.t('tooltip.energyStates.hungry'));
      expect(energyOf(10)?.value).toBe(i18n.t('tooltip.energyStates.desperate'));
      expect(new Set([100, 90, 65, 40, 10].map((h) => energyOf(h)?.value)).size).toBe(5);
    });

    it('shows the longevity gene and the metabolism cost per move in the genetics section', () => {
      const { sectionRows } = formatEntityInfo(human(50));
      expect(sectionRows.find((r) => r.label === i18n.t('tooltip.geneLongevity'))?.value).toBe('1.25x');
      expect(sectionRows.find((r) => r.label === i18n.t('tooltip.geneMetabolism'))?.value).toBe(
        `0.35 ${i18n.t('tooltip.perMove')}`,
      );
    });

    it('is not shown for animals', () => {
      expect(formatEntityInfo(new Wolf(0, 0)).rows.map((r) => r.label)).not.toContain(i18n.t('tooltip.energy'));
    });
  });

  it('uses the current language', () => {
    i18n.setLanguage(Language.PL);
    tooltip.show(new Wolf(0, 0), 1, 1);
    expect(el().querySelector('.tooltip-header')!.textContent).toBe('🐺 Wilk');
    i18n.setLanguage(Language.EN);
  });
});

describe('getCellAtPoint', () => {
  // 30×20 board drawn at 15 CSS px per cell (backing store size is irrelevant)
  const rect = { left: 100, top: 50, width: 450, height: 300 };

  it('maps CSS coordinates to cells using the CSS box size', () => {
    expect(getCellAtPoint(rect, 30, 20, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(getCellAtPoint(rect, 30, 20, 114.9, 64.9)).toEqual({ x: 0, y: 0 });
    expect(getCellAtPoint(rect, 30, 20, 115, 65)).toEqual({ x: 1, y: 1 });
    expect(getCellAtPoint(rect, 30, 20, 549, 349)).toEqual({ x: 29, y: 19 });
  });

  it('returns null outside the board or for a degenerate rect', () => {
    expect(getCellAtPoint(rect, 30, 20, 99, 60)).toBeNull();
    expect(getCellAtPoint(rect, 30, 20, 550, 60)).toBeNull();
    expect(getCellAtPoint(rect, 30, 20, 200, 350)).toBeNull();
    expect(getCellAtPoint({ ...rect, width: 0 }, 30, 20, 200, 60)).toBeNull();
  });
});
