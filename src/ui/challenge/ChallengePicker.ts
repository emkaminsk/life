import type { ConfigPanel, ConfigPanelPlugin } from '../ConfigPanel';

/**
 * W0 stub of the challenge picker: renders nothing, always free play.
 * Registers itself with the panel under the save key 'challenge'.
 * Workstream W-B replaces the internals, not the interface.
 */
export function createChallengePicker(
  _mount: HTMLElement,
  panel: ConfigPanel,
): ConfigPanelPlugin & { destroy(): void } {
  const picker = {
    startOptions: () => ({ challengeId: 'free' as const }),
    destroy(): void {},
  };
  panel.registerPlugin(picker, 'challenge');
  return picker;
}
