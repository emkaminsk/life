/** Trailing-edge debounce. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let id: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (id !== null) clearTimeout(id);
    id = setTimeout(() => {
      id = null;
      fn(...args);
    }, ms);
  };
}
