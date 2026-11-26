import type { ConfigPanel, ConfigPanelPlugin } from '../ui/ConfigPanel';
import type { ClassicConfig } from './types';

/** Conway's Game of Life on a 50×50 torus, 30% randomly alive. */
export const DEFAULT_CLASSIC_CONFIG: Readonly<ClassicConfig> = Object.freeze({
  width: 50,
  height: 50,
  rule: 'B3/S23',
  start: Object.freeze({ kind: 'random', density: 0.3 }),
});

const copy = (config: ClassicConfig): ClassicConfig => ({ ...config, start: { ...config.start } });

/**
 * W0 stub of the classic settings form: renders nothing and always yields the
 * default config. Registers itself with the panel under the save key 'classic'.
 * Workstream W-C replaces the internals, not the interface.
 */
export function createClassicConfigForm(
  _mount: HTMLElement,
  panel: ConfigPanel,
): ConfigPanelPlugin & { read(): ClassicConfig; destroy(): void } {
  const form = {
    read: (): ClassicConfig => copy(DEFAULT_CLASSIC_CONFIG),
    validate: (): number => 0,
    startOptions: () => ({ classic: form.read() }),
    save: (): unknown => form.read(),
    load(_data: unknown): void {},
    destroy(): void {},
  };
  panel.registerPlugin(form, 'classic');
  return form;
}
