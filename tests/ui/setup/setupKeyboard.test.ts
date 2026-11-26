import { describe, expect, it } from 'vitest';
import {
  RANDOM_FILL_DENSITY,
  reduceSetupKey,
  type SetupKey,
  type SetupKeyState,
  selectionRect,
} from '../../../src/ui/setup/setupKeyboard';

const base = (over: Partial<SetupKeyState> = {}): SetupKeyState => ({
  cursor: { x: 2, y: 2 },
  anchor: null,
  tool: 'male',
  width: 5,
  height: 4,
  ...over,
});
const key = (code: string, mods: Partial<SetupKey> = {}): SetupKey => ({ code, shift: false, ctrl: false, ...mods });

describe('reduceSetupKey', () => {
  it('arrows move the cursor, clamp at edges and clear the selection', () => {
    let s = base({ anchor: { x: 0, y: 0 } });
    s = reduceSetupKey(s, key('ArrowRight')).state;
    expect(s.cursor).toEqual({ x: 3, y: 2 });
    expect(s.anchor).toBeNull();
    for (let i = 0; i < 5; i++) s = reduceSetupKey(s, key('ArrowRight')).state;
    expect(s.cursor.x).toBe(4);
    for (let i = 0; i < 5; i++) s = reduceSetupKey(s, key('ArrowUp')).state;
    expect(s.cursor.y).toBe(0);
    s = reduceSetupKey(base(), key('ArrowLeft', { ctrl: true })).state;
    expect(s.cursor.x).toBe(0);
  });

  it('Shift+arrows extend the selection from a fixed anchor', () => {
    let s = reduceSetupKey(base(), key('ArrowRight', { shift: true })).state;
    s = reduceSetupKey(s, key('ArrowDown', { shift: true })).state;
    s = reduceSetupKey(s, key('ArrowLeft', { shift: true })).state;
    s = reduceSetupKey(s, key('ArrowLeft', { shift: true })).state;
    expect(s.anchor).toEqual({ x: 2, y: 2 });
    expect(s.cursor).toEqual({ x: 1, y: 3 });
    expect(selectionRect(s)).toEqual({ x0: 1, y0: 2, x1: 2, y1: 3 });
  });

  it('digits pick the tool and fill the selection; Shift+digit sprinkles', () => {
    const s = base({ anchor: { x: 0, y: 0 } });
    const r = reduceSetupKey(s, key('Digit4'));
    expect(r.state.tool).toBe('wolf');
    expect(r.action).toEqual({ type: 'fill', rect: { x0: 0, y0: 0, x1: 2, y1: 2 }, kind: 'wolf' });

    const sprinkle = reduceSetupKey(s, key('Numpad5', { shift: true }));
    expect(sprinkle.state.tool).toBe('fruit');
    expect(sprinkle.action).toEqual({
      type: 'randomFill',
      rect: { x0: 0, y0: 0, x1: 2, y1: 2 },
      kind: 'fruit',
      density: RANDOM_FILL_DENSITY,
    });

    const eraser = reduceSetupKey(s, key('Digit0'));
    expect(eraser.state.tool).toBeNull();
    expect(eraser.action).toMatchObject({ type: 'fill', kind: null });

    expect(reduceSetupKey(s, key('Digit9')).handled).toBe(false);
  });

  it('Enter/Space fill the cursor cell with the current tool', () => {
    const r = reduceSetupKey(base({ tool: 'dog' }), key('Space'));
    expect(r.action).toEqual({ type: 'fill', rect: { x0: 2, y0: 2, x1: 2, y1: 2 }, kind: 'dog' });
    expect(reduceSetupKey(base({ tool: 'dog' }), key('Enter', { shift: true })).action).toMatchObject({
      type: 'randomFill',
      kind: 'dog',
    });
  });

  it('Delete and Backspace erase the selection without changing the tool', () => {
    for (const code of ['Delete', 'Backspace']) {
      const r = reduceSetupKey(base({ anchor: { x: 4, y: 0 } }), key(code));
      expect(r.state.tool).toBe('male');
      expect(r.action).toEqual({ type: 'fill', rect: { x0: 2, y0: 0, x1: 4, y1: 2 }, kind: null });
    }
  });

  it('Escape first clears the selection, then cancels', () => {
    const first = reduceSetupKey(base({ anchor: { x: 0, y: 0 } }), key('Escape'));
    expect(first.state.anchor).toBeNull();
    expect(first.action).toBeUndefined();
    expect(reduceSetupKey(first.state, key('Escape')).action).toEqual({ type: 'cancel' });
  });

  it('Ctrl+Enter confirms', () => {
    expect(reduceSetupKey(base(), key('Enter', { ctrl: true })).action).toEqual({ type: 'confirm' });
  });

  it('Ctrl+A selects the whole board; plain A is ignored', () => {
    const r = reduceSetupKey(base(), key('KeyA', { ctrl: true }));
    expect(selectionRect(r.state)).toEqual({ x0: 0, y0: 0, x1: 4, y1: 3 });
    expect(reduceSetupKey(base(), key('KeyA')).handled).toBe(false);
    expect(reduceSetupKey(base(), key('KeyQ')).handled).toBe(false);
  });
});
