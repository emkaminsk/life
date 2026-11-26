import indexHtml from '../../index.html?raw';

/** Body of the real index.html without scripts, so UI tests exercise the actual config form. */
export const bodyHtml = indexHtml
  .slice(
    indexHtml.search(/<body[^>]*>/) + (indexHtml.match(/<body[^>]*>/)?.[0].length ?? 0),
    indexHtml.indexOf('</body>'),
  )
  .replace(/<script[\s\S]*?<\/script>/g, '');

export const input = (id: string) => document.getElementById(id) as HTMLInputElement;
export const startBtn = () => document.getElementById('startGameBtn') as HTMLButtonElement;

/** Type a value into an input the way a user would (fires `input`). */
export function setInput(id: string, value: string): void {
  const el = input(id);
  el.value = value;
  el.dispatchEvent(new Event('input'));
}
