import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { summarize } from '../../src/core/gameSummary';
import type { RoundRecord } from '../../src/core/simulationEvents';
import { I18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { SummaryDialog } from '../../src/ui/SummaryDialog';

function rec(round: number, over: Partial<RoundRecord> = {}, events: Partial<RoundRecord['events']> = {}): RoundRecord {
  return {
    round,
    males: 0,
    females: 0,
    pregnant: 0,
    wolves: 0,
    dogs: 0,
    fruits: 0,
    mushrooms: 0,
    ...over,
    events: { deaths: [], births: 0, newPregnancies: 0, fruitsEaten: 0, mushroomsEaten: 0, ...events },
  };
}

const history: RoundRecord[] = [
  rec(0, { males: 4, females: 4, wolves: 2, dogs: 0 }),
  rec(1, { males: 4, females: 4, pregnant: 1, wolves: 2 }, { newPregnancies: 1 }),
  rec(
    2,
    { males: 1, females: 3, wolves: 2 },
    {
      deaths: [
        { species: 'male', cause: 'wolfAttack', age: 3 },
        { species: 'male', cause: 'wolfAttack', age: 4 },
        { species: 'male', cause: 'wolfAttack', age: 5 },
        { species: 'female', cause: 'childbirth', age: 6 },
      ],
    },
  ),
  rec(3, { males: 0, females: 0, wolves: 2 }, { deaths: [{ species: 'male', cause: 'oldAge', age: 9 }] }),
];

describe('SummaryDialog', () => {
  let i18n: I18n;
  let mount: HTMLElement;
  let opener: HTMLButtonElement;
  let dialog: SummaryDialog;

  beforeEach(() => {
    localStorage.clear();
    i18n = new I18n();
    i18n.setLanguage(Language.EN);
    document.body.innerHTML =
      '<button id="opener">finish</button><div id="summaryModal" class="modal" role="dialog" aria-modal="true" aria-hidden="true"></div>';
    mount = document.getElementById('summaryModal')!;
    opener = document.getElementById('opener') as HTMLButtonElement;
    dialog = new SummaryDialog(mount, i18n);
  });

  afterEach(() => {
    dialog.destroy();
    localStorage.clear();
  });

  const texts = (selector: string) => Array.from(mount.querySelectorAll(selector)).map((e) => e.textContent ?? '');
  const buttons = () => Array.from(mount.querySelectorAll('button'));
  const button = (label: string) => buttons().find((b) => b.textContent === label)!;

  it('is closed and labelled before show()', () => {
    expect(dialog.isOpen()).toBe(false);
    expect(mount.getAttribute('aria-hidden')).toBe('true');
    const titleId = mount.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toBe('Game summary');
  });

  it('renders facts, the thresholds table, deaths by cause and conclusions in English', () => {
    opener.focus();
    dialog.show(summarize(history, 'humansExtinct'));
    expect(dialog.isOpen()).toBe(true);
    expect(mount.querySelector('.summary-outcome')?.textContent).toBe('The game is over: all humans have died out.');

    const facts = texts('.summary-facts li');
    expect(facts).toContain('Rounds played: 3');
    expect(facts).toContain('The first pregnancy started in round 1');
    expect(facts).toContain('Babies born: 0');
    expect(facts).toContain('🐺 Wolves: 2 at the start, 2 at the end');

    const [thresholds, deathsTable] = Array.from(mount.querySelectorAll('table'));
    const males = Array.from(thresholds.querySelectorAll('tbody tr')[0].children).map((c) => c.textContent);
    expect(males).toEqual(['👨 Males', 'round 2', 'round 3', 'round 3', 'not reached']);
    expect(thresholds.querySelectorAll('thead th')[0].getAttribute('scope')).toBe('col');
    expect(thresholds.querySelectorAll('tbody th')[0].getAttribute('scope')).toBe('row');

    const causeRows = Array.from(deathsTable.querySelectorAll('tbody tr')).map((r) =>
      Array.from(r.children).map((c) => c.textContent),
    );
    // DEATH_CAUSES order; columns male, female, wolf, dog, total
    expect(causeRows).toEqual([
      ['Wolf attack', '3', '0', '0', '0', '3'],
      ['Old age', '1', '0', '0', '0', '1'],
      ['Childbirth (no space for the baby)', '0', '1', '0', '0', '1'],
    ]);

    const conclusions = texts('.summary-conclusions li');
    expect(conclusions[0]).toBe('Humans died out in round 3.');
    expect(conclusions[1]).toMatch(/^Wolves were most likely the biggest danger: 60% of human deaths \(3\)/);
  });

  it('shows n/a for a group that did not exist and a message when nobody died', () => {
    dialog.show(summarize([rec(0, { females: 2 }), rec(1, { females: 2 })], 'userFinished'));
    const maleRow = Array.from(mount.querySelectorAll('table')[0].querySelectorAll('tbody tr')[0].children);
    expect(maleRow.slice(1).map((c) => c.textContent)).toEqual(['n/a', 'n/a', 'n/a', 'n/a']);
    expect(mount.querySelector('.summary-empty')?.textContent).toBe('Nobody died in this game.');
    expect(texts('.summary-facts li')).toContain('Nobody got pregnant during the whole game');
  });

  it('re-renders in Polish when the language changes', () => {
    dialog.show(summarize(history, 'humansExtinct'));
    i18n.setLanguage(Language.PL);
    expect(mount.querySelector('.summary-outcome')?.textContent).toBe('Koniec gry: wszyscy ludzie wyginęli.');
    expect(texts('.summary-facts li')).toContain('Liczba rozegranych rund: 3');
    expect(texts('.summary-conclusions li')[0]).toBe('Ludzie wyginęli w rundzie 3.');
    expect(button('Nowy eksperyment')).toBeDefined();
    expect(button('Wróć do planszy')).toBeDefined();
    expect(mount.querySelector('.close-btn')?.getAttribute('aria-label')).toBe('Zamknij podsumowanie');
  });

  it('focuses the title on open and returns focus to the opener on close', () => {
    opener.focus();
    dialog.show(summarize(history, 'userFinished'));
    expect(document.activeElement).toBe(mount.querySelector('h2'));
    dialog.close();
    expect(document.activeElement).toBe(opener);
  });

  it('"New experiment" closes and calls onNewGame only', () => {
    const onNewGame = vi.fn();
    const onClose = vi.fn();
    dialog.onNewGame = onNewGame;
    dialog.onClose = onClose;
    dialog.show(summarize(history, 'userFinished'));
    button('New experiment').click();
    expect(dialog.isOpen()).toBe(false);
    expect(onNewGame).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('"Back to board", ×, Escape and a backdrop click close and call onClose', () => {
    const onNewGame = vi.fn();
    const onClose = vi.fn();
    dialog.onNewGame = onNewGame;
    dialog.onClose = onClose;
    const summary = summarize(history, 'userFinished');

    dialog.show(summary);
    button('Back to board').click();
    dialog.show(summary);
    (mount.querySelector('.close-btn') as HTMLButtonElement).click();
    dialog.show(summary);
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    mount.querySelector('h2')!.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    dialog.show(summary);
    mount.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(onNewGame).not.toHaveBeenCalled();
  });

  it('keeps Tab inside the dialog', () => {
    // jsdom has no layout: make every element look visible to the focus trap
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    dialog.show(summarize(history, 'userFinished'));
    const newGame = button('New experiment');
    const close = mount.querySelector<HTMLButtonElement>('.close-btn')!;

    // From the focused title (not tabbable) Tab goes to the first control
    const tab = (shiftKey = false) => {
      const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
      (document.activeElement ?? mount).dispatchEvent(e);
      return e;
    };
    expect(tab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
    newGame.focus();
    tab();
    expect(document.activeElement).toBe(close);
    tab(true);
    expect(document.activeElement).toBe(newGame);
  });
});
