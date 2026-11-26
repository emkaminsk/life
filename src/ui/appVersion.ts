/**
 * Version label in the bottom-right of the stats pane (TODO F6).
 *
 * index.html provides the `#appVersion` mount inside the right <aside>. The
 * label's styles are injected once here so the shell does not depend on the
 * page stylesheet: pushed to the bottom of the pane, right-aligned, small and
 * muted (contrast ≥ 4.5:1 on the light pane background).
 */
import { APP_VERSION } from '../version';

type Translate = (key: string, ...args: (string | number)[]) => string;

export const APP_VERSION_STYLE_ID = 'app-version-style';

const CSS = `
.app-version {
  margin-top: auto;
  align-self: flex-end;
  padding: 4px 2px 0;
  font-size: 11px;
  line-height: 1.4;
  color: #595959;
  text-align: right;
  font-variant-numeric: tabular-nums;
  user-select: all;
}
.sidebar > .app-version { justify-self: end; }
`;

function ensureStyles(doc: Document): void {
  if (doc.getElementById(APP_VERSION_STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = APP_VERSION_STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}

/**
 * Fill `el` with the localized label ("Version 1.0.abc1234"). Safe to call
 * again on language change; styles are injected only once per document.
 */
export function renderAppVersion(el: HTMLElement | null, t: Translate, version: string = APP_VERSION): void {
  if (!el) return;
  ensureStyles(el.ownerDocument);
  el.classList.add('app-version');
  el.textContent = t('app.version', version);
  el.setAttribute('data-version', version);
}
