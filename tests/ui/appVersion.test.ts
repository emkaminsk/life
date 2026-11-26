import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '../../src/i18n/i18n';
import { Language } from '../../src/i18n/types';
import { APP_VERSION_STYLE_ID, renderAppVersion } from '../../src/ui/appVersion';

const t = (key: string, ...args: (string | number)[]) => i18n.t(key, ...args);

describe('renderAppVersion', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<aside class="sidebar"><section></section><div id="appVersion"></div></aside>';
    i18n.setLanguage(Language.EN);
  });

  const mount = () => document.getElementById('appVersion') as HTMLElement;

  it('renders the localized label with the version', () => {
    renderAppVersion(mount(), t, '1.0.abc1234');
    expect(mount().textContent).toBe('Version 1.0.abc1234');
    expect(mount().dataset.version).toBe('1.0.abc1234');
    expect(mount().classList.contains('app-version')).toBe(true);
  });

  it('defaults to APP_VERSION (1.0.dev under tests)', () => {
    renderAppVersion(mount(), t);
    expect(mount().textContent).toBe('Version 1.0.dev');
  });

  it('re-renders in Polish and injects its styles only once', () => {
    renderAppVersion(mount(), t, '1.0.abc1234');
    i18n.setLanguage(Language.PL);
    renderAppVersion(mount(), t, '1.0.abc1234');
    expect(mount().textContent).toBe('Wersja 1.0.abc1234');
    const styles = document.querySelectorAll(`#${APP_VERSION_STYLE_ID}`);
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain('.app-version');
  });

  it('does nothing when the mount is missing', () => {
    expect(() => renderAppVersion(null, t)).not.toThrow();
    expect(document.getElementById(APP_VERSION_STYLE_ID)).toBeNull();
  });
});
