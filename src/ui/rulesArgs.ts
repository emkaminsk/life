/**
 * Insert the active configuration into the rules modal (review R9): rules
 * text with placeholders reads its values from `data-i18n-args`, which
 * DOMRenderer passes to t(). Call this whenever the config changes (game
 * start), then re-render the DOM translations.
 */
import type { GameConfig } from './ConfigPanel';

type RulesConfig = Pick<GameConfig, 'human' | 'fruit' | 'overcrowding'>;

/** Map of rules i18n key → positional values for its placeholders. */
export function rulesConfigArgs(config: RulesConfig): Record<string, (string | number)[]> {
  const { human, fruit, overcrowding } = config;
  return {
    'rules.femalesDesc': [human.pregnancyPeriod, human.cooldownPeriod],
    'rules.fruitsDesc': [fruit.roundsToRipen],
    'rules.importantRuleOvercrowding': [
      overcrowding.humanThreshold,
      overcrowding.humanMultiplier,
      overcrowding.animalThreshold,
      overcrowding.animalMultiplier,
    ],
  };
}

export function applyRulesConfigArgs(root: ParentNode, config: RulesConfig): void {
  for (const [key, values] of Object.entries(rulesConfigArgs(config))) {
    for (const el of Array.from(root.querySelectorAll(`[data-i18n="${key}"]`))) {
      el.setAttribute('data-i18n-args', values.join(','));
    }
  }
}
