import { DEATH_CAUSES, type GameSummary, SPECIES, type ThresholdRounds } from '../core/gameSummary';
import { i18n as defaultI18n } from '../i18n/i18n';
import { createDialog, type DialogController } from './dialog';
import './summary.css';

/** The part of I18n the dialog needs (lets tests pass a fresh instance). */
export interface SummaryI18n {
  t(key: string, ...args: (string | number)[]): string;
  onLanguageChange(listener: () => void): void;
  offLanguageChange(listener: () => void): void;
}

const THRESHOLD_COLUMNS = ['pct50', 'pct10', 'pct0', 'pct200'] as const;
const THRESHOLD_HEADERS = ['col50', 'col10', 'col0', 'col200'] as const;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * End-of-game summary (F5) rendered into the #summaryModal mount. All text is
 * set with textContent and re-rendered from the stored GameSummary whenever
 * the language changes, so it never goes stale.
 *
 * Focus: on open the title gets focus (the content is long, so screen readers
 * start reading at the top); Tab is trapped inside; Escape, the × button,
 * "Back to board" and a backdrop click close it (onClose); "New experiment"
 * closes it and calls onNewGame instead.
 */
export class SummaryDialog {
  onNewGame?: () => void;
  onClose?: () => void;

  private summary: GameSummary | null = null;
  private newGameRequested = false;
  private readonly dialog: DialogController;

  private readonly title = el('h2', 'summary-title');
  private readonly closeBtn = el('button', 'close-btn', '×');
  private readonly body = el('div', 'modal-body summary-body');
  private readonly backBtn = el('button', 'btn-secondary');
  private readonly newGameBtn = el('button', 'btn-primary');
  private readonly languageListener = () => this.render();

  constructor(
    mount: HTMLElement,
    private readonly i18n: SummaryI18n = defaultI18n,
  ) {
    const titleId = `${mount.id || 'summary'}Title`;
    this.title.id = titleId;
    this.title.tabIndex = -1;
    this.closeBtn.type = 'button';
    this.backBtn.type = 'button';
    this.newGameBtn.type = 'button';
    this.body.tabIndex = 0; // scrollable region must be reachable by keyboard
    this.body.setAttribute('role', 'region');

    const header = el('div', 'modal-header');
    header.append(this.title, this.closeBtn);
    const actions = el('div', 'summary-actions');
    actions.append(this.backBtn, this.newGameBtn);
    const content = el('div', 'modal-content summary-content');
    content.append(header, this.body, actions);

    mount.replaceChildren(content);
    mount.classList.add('summary-modal');
    mount.setAttribute('role', 'dialog');
    mount.setAttribute('aria-modal', 'true');
    mount.setAttribute('aria-labelledby', titleId);
    if (!mount.classList.contains('active')) mount.setAttribute('aria-hidden', 'true');

    this.dialog = createDialog(mount, {
      closeButton: this.closeBtn,
      initialFocus: this.title,
      closeOnEscape: true,
      onClose: () => {
        const newGame = this.newGameRequested;
        this.newGameRequested = false;
        if (newGame) this.onNewGame?.();
        else this.onClose?.();
      },
    });
    this.backBtn.addEventListener('click', () => this.dialog.close());
    this.newGameBtn.addEventListener('click', () => {
      this.newGameRequested = true;
      this.dialog.close();
    });

    this.i18n.onLanguageChange(this.languageListener);
    this.render();
  }

  show(summary: GameSummary): void {
    this.summary = summary;
    this.render();
    this.body.scrollTop = 0;
    this.dialog.open();
  }

  close(): void {
    this.dialog.close();
  }

  isOpen(): boolean {
    return this.dialog.isOpen();
  }

  /** Stop listening for language changes (tests / teardown). */
  destroy(): void {
    this.i18n.offLanguageChange(this.languageListener);
    this.dialog.destroy();
  }

  private t(key: string, ...args: (string | number)[]): string {
    return this.i18n.t(`summary.${key}`, ...args);
  }

  private render(): void {
    this.title.textContent = this.t('title');
    this.closeBtn.setAttribute('aria-label', this.t('closeLabel'));
    this.body.setAttribute('aria-label', this.t('scrollRegion'));
    this.backBtn.textContent = this.t('backToBoard');
    this.newGameBtn.textContent = this.t('newGame');

    const s = this.summary;
    if (!s) {
      this.body.replaceChildren();
      return;
    }
    this.body.replaceChildren(
      el('p', 'summary-outcome', this.t(`endReason.${s.endReason}`)),
      this.renderFacts(s),
      this.renderThresholds(s),
      this.renderDeaths(s),
      this.renderConclusions(s),
    );
  }

  private section(name: string, titleKey: string, hintKey?: string): { section: HTMLElement; headingId: string } {
    const section = el('section', `summary-section summary-${name}`);
    const heading = el('h3', undefined, this.t(titleKey));
    heading.id = `${this.title.id}-${name}`;
    section.setAttribute('aria-labelledby', heading.id);
    section.append(heading);
    if (hintKey) section.append(el('p', 'summary-hint', this.t(hintKey)));
    return { section, headingId: heading.id };
  }

  private renderFacts(s: GameSummary): HTMLElement {
    const { section } = this.section('facts', 'factsTitle');
    const list = el('ul', 'summary-facts');
    const facts = [
      this.t('roundsPlayed', s.roundsPlayed),
      s.firstPregnancyRound === null ? this.t('noPregnancy') : this.t('firstPregnancy', s.firstPregnancyRound),
      this.t('babiesBorn', s.babiesBorn),
      this.t('peakHumans', s.peakHumans.value, s.peakHumans.round),
      this.t('startEnd', this.t('species.male'), s.initial.males, s.final.males),
      this.t('startEnd', this.t('species.female'), s.initial.females, s.final.females),
      this.t('startEnd', this.t('species.wolf'), s.initial.wolves, s.final.wolves),
      this.t('startEnd', this.t('species.dog'), s.initial.dogs, s.final.dogs),
    ];
    for (const fact of facts) list.append(el('li', undefined, fact));
    section.append(list);
    return section;
  }

  private thresholdCell(rounds: ThresholdRounds, column: (typeof THRESHOLD_COLUMNS)[number]): string {
    if (!rounds.applicable) return this.t('notApplicable');
    const round = rounds[column];
    return round === null ? this.t('notReached') : this.t('roundN', round);
  }

  private table(headingId: string, headers: string[], rows: string[][]): HTMLElement {
    const table = el('table', 'summary-table');
    table.setAttribute('aria-labelledby', headingId);
    const headRow = el('tr');
    for (const h of headers) {
      const th = el('th', undefined, h);
      th.scope = 'col';
      headRow.append(th);
    }
    const tbody = el('tbody');
    for (const [label, ...cells] of rows) {
      const tr = el('tr');
      const th = el('th', undefined, label);
      th.scope = 'row';
      tr.append(th, ...cells.map((c) => el('td', undefined, c)));
      tbody.append(tr);
    }
    const thead = el('thead');
    thead.append(headRow);
    table.append(thead, tbody);
    // Narrow screens: the table scrolls inside its wrapper, never the page.
    const wrap = el('div', 'summary-table-wrap');
    wrap.append(table);
    return wrap;
  }

  private renderThresholds(s: GameSummary): HTMLElement {
    const { section, headingId } = this.section('thresholds', 'thresholdsTitle', 'thresholdsHint');
    const headers = [this.t('colGroup'), ...THRESHOLD_HEADERS.map((h) => this.t(h))];
    const rows = [
      [this.t('rowMales'), ...THRESHOLD_COLUMNS.map((c) => this.thresholdCell(s.males, c))],
      [this.t('rowFemales'), ...THRESHOLD_COLUMNS.map((c) => this.thresholdCell(s.females, c))],
    ];
    section.append(this.table(headingId, headers, rows));
    return section;
  }

  private renderDeaths(s: GameSummary): HTMLElement {
    const { section, headingId } = this.section('deaths', 'deathsTitle');
    const rows: string[][] = [];
    for (const cause of DEATH_CAUSES) {
      const perSpecies = SPECIES.map((sp) => s.deaths[sp][cause] ?? 0);
      const total = perSpecies.reduce((a, b) => a + b, 0);
      if (total > 0) rows.push([this.t(`causes.${cause}`), ...perSpecies.map(String), String(total)]);
    }
    if (rows.length === 0) {
      section.append(el('p', 'summary-empty', this.t('noDeaths')));
    } else {
      const headers = [this.t('colCause'), ...SPECIES.map((sp) => this.t(`species.${sp}`)), this.t('colTotal')];
      section.append(this.table(headingId, headers, rows));
    }
    return section;
  }

  private renderConclusions(s: GameSummary): HTMLElement {
    const { section } = this.section('conclusions', 'conclusionsTitle', 'conclusionsHint');
    const list = el('ul', 'summary-conclusions');
    for (const c of s.conclusions) list.append(el('li', undefined, this.t(`conclusions.${c.key}`, ...c.args)));
    section.append(list);
    return section;
  }
}
