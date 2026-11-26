import { i18n } from '../i18n/i18n';
import type { FieldRule } from './configValidation';

export type Translate = (key: string, ...args: (string | number)[]) => string;

const defaultT: Translate = (key, ...args) => i18n.t(key, ...args);

/** Localized valid-range hint for a rule, e.g. "Valid range: 0 to 1 (whole numbers only)". */
export function rangeHint(rule: FieldRule, t: Translate = defaultT): string {
  let hint = rule.max !== undefined ? t('errors.rangeHint', rule.min, rule.max) : t('errors.minHint', rule.min);
  if (rule.integer) hint += ` (${t('errors.wholeNumberHint')})`;
  return hint;
}

/** Text of the field's label (looked up in its row: document-wide label queries are slow in jsdom). */
function labelText(input: HTMLInputElement): string {
  const label = input.parentElement?.querySelector('label');
  return (label?.textContent ?? input.id).trim().replace(/:$/, '');
}

/** Build the ⓘ button + role=tooltip span once; returns the wrapper. */
function createHelp(input: HTMLInputElement): HTMLElement {
  const helpId = `${input.id}-help`;
  const wrap = document.createElement('span');
  wrap.className = 'field-help-wrap';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'field-help-btn';
  button.textContent = 'ⓘ';
  button.setAttribute('aria-describedby', helpId);

  const tip = document.createElement('span');
  tip.id = helpId;
  tip.className = 'field-help';
  tip.setAttribute('role', 'tooltip');
  const text = document.createElement('span');
  text.className = 'field-help-text';
  const range = document.createElement('span');
  range.className = 'field-help-range';
  tip.append(text, range);

  // Touch: tap toggles. WCAG 1.4.13: Escape dismisses without moving focus;
  // the tooltip comes back on the next hover/focus.
  button.addEventListener('click', () => wrap.classList.toggle('open'));
  button.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || wrap.classList.contains('dismissed')) return;
    e.stopPropagation();
    wrap.classList.remove('open');
    wrap.classList.add('dismissed');
  });
  const reset = () => wrap.classList.remove('dismissed', 'open');
  button.addEventListener('blur', reset);
  wrap.addEventListener('mouseleave', reset);

  wrap.append(button, tip);
  const row = input.closest('.config-row');
  if (row && input.parentElement === row) row.insertBefore(wrap, input);
  else input.insertAdjacentElement('beforebegin', wrap);
  return wrap;
}

/**
 * Give every rule's input a localized explanation (F2): an ⓘ button with a
 * role="tooltip" text shown on hover and keyboard focus, the same text plus
 * the range hint in the input's title, and aria-describedby linking the input
 * to its error slot and help. Idempotent: call it again after a language
 * change or when a rule's bounds change to refresh the texts.
 */
export function attachFieldHelp(rules: readonly FieldRule[], t: Translate = defaultT): void {
  for (const rule of rules) {
    const input = document.getElementById(rule.id);
    if (!(input instanceof HTMLInputElement)) continue;
    const helpId = `${rule.id}-help`;
    const wrap = document.getElementById(helpId)?.parentElement ?? createHelp(input);
    const [button, tip] = Array.from(wrap.children);
    const [text, range] = Array.from(tip.children);

    const help = t(`configHelp.${rule.id}`);
    const hint = rangeHint(rule, t);
    text.textContent = help;
    range.textContent = hint;
    button.setAttribute('aria-label', t('configHelp.moreInfo', labelText(input)));

    input.title = `${help}\n${hint}`;
    input.setAttribute('aria-describedby', `${rule.id}-error ${helpId}`);
  }
}
