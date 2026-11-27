import { CHALLENGES, type ChallengeId, type ConfigLocks, getChallenge } from '../../core/challenges';
import { i18n } from '../../i18n/i18n';
import type { ConfigPanel, ConfigPanelPlugin } from '../ConfigPanel';
import './challenge.css';

export interface ChallengePicker extends ConfigPanelPlugin {
  /** The chosen challenge ('free' for free play). */
  getSelected(): ChallengeId;
  /** Choose a challenge (unknown ids fall back to free play) and re-apply the panel's locks. */
  select(id: ChallengeId): void;
  destroy(): void;
}

const isChallengeId = (value: unknown): value is ChallengeId =>
  value === 'free' || CHALLENGES.some((c) => c.id === value);

/**
 * Challenge picker inside the config panel (#challengeMount): a select with
 * "Free play" + every challenge, and under it the goal, a tip and (for
 * challenges that fix settings) a 🔒 note. Registered as the panel plugin
 * 'challenge': its locks come from the chosen definition, Start gets the
 * challengeId, and the choice is saved/loaded with the config file.
 */
export function createChallengePicker(mount: HTMLElement, panel: ConfigPanel): ChallengePicker {
  const listeners = new AbortController();
  const root = document.createElement('div');
  root.className = 'challenge-picker';

  const label = document.createElement('label');
  label.htmlFor = 'challengeSelect';
  label.className = 'challenge-picker-label';
  const select = document.createElement('select');
  select.id = 'challengeSelect';
  select.className = 'challenge-select';
  const goal = document.createElement('p');
  goal.className = 'challenge-picker-goal';
  goal.id = 'challengeGoal';
  const hint = document.createElement('p');
  hint.className = 'challenge-picker-hint';
  const locked = document.createElement('p');
  locked.className = 'challenge-picker-locked';
  select.setAttribute('aria-describedby', goal.id);

  const free = document.createElement('option');
  free.value = 'free';
  select.append(free);
  for (const c of CHALLENGES) {
    const option = document.createElement('option');
    option.value = c.id;
    select.append(option);
  }
  root.append(label, select, goal, hint, locked);
  mount.replaceChildren(root);

  const selected = (): ChallengeId => (isChallengeId(select.value) ? select.value : 'free');

  function render(): void {
    label.textContent = i18n.t('challenges.label');
    free.textContent = i18n.t('challenges.free');
    for (const option of Array.from(select.options).slice(1)) {
      const def = getChallenge(option.value as ChallengeId);
      if (def) option.textContent = `${def.emoji} ${i18n.t(`challenges.${def.id}.name`)}`;
    }
    const def = getChallenge(selected());
    const prefix = (key: string, text: string) => `${i18n.t(`challenges.${key}`)} ${text}`;
    goal.textContent = def ? prefix('goalLabel', i18n.t(`challenges.${def.id}.goal`)) : i18n.t('challenges.freeGoal');
    hint.textContent = def ? prefix('hintLabel', i18n.t(`challenges.${def.id}.hint`)) : i18n.t('challenges.freeHint');
    const hasLocks = !!def && Object.keys(def.locks).length > 0;
    locked.hidden = !hasLocks;
    locked.textContent = hasLocks ? i18n.t('challenges.lockedHint') : '';
  }

  const picker: ChallengePicker = {
    getSelected: selected,
    select(id) {
      select.value = isChallengeId(id) ? id : 'free';
      render();
      panel.refresh();
    },
    lockedFields: (): ConfigLocks => getChallenge(selected())?.locks ?? {},
    startOptions: () => ({ challengeId: selected() }),
    save: () => selected(),
    load(data) {
      picker.select(isChallengeId(data) ? data : 'free');
    },
    destroy() {
      listeners.abort();
      i18n.offLanguageChange(render);
      root.remove();
    },
  };

  select.addEventListener(
    'change',
    () => {
      render();
      panel.refresh();
    },
    { signal: listeners.signal },
  );
  i18n.onLanguageChange(render);
  render();
  panel.registerPlugin(picker, 'challenge');
  return picker;
}
