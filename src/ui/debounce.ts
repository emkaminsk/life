/** A debounced function; cancel() drops a pending call (e.g. on teardown). */
export type Debounced<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

/** Trailing-edge debounce. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): Debounced<A> {
  let id: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: A) => {
    if (id !== null) clearTimeout(id);
    id = setTimeout(() => {
      id = null;
      fn(...args);
    }, ms);
  };
  return Object.assign(debounced, {
    cancel(): void {
      if (id !== null) clearTimeout(id);
      id = null;
    },
  });
}
