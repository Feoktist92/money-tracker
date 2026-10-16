import { useUndoStore } from './undoStore';

const state = () => useUndoStore.getState();

beforeEach(() => state().dismiss());

describe('undoStore', () => {
  it('show запоминает запись, dismiss убирает', () => {
    state().show({ id: 'a', label: '−1 240 ₽ в Продукты' });
    expect(state().entry).toEqual({ id: 'a', label: '−1 240 ₽ в Продукты' });
    state().dismiss();
    expect(state().entry).toBeNull();
  });

  it('каждый показ увеличивает token (таймер перезапускается даже для той же записи)', () => {
    const before = state().token;
    state().show({ id: 'a', label: 'x' });
    state().show({ id: 'a', label: 'x' });
    expect(state().token).toBe(before + 2);
  });

  it('новая запись заменяет предыдущую', () => {
    state().show({ id: 'a', label: 'x' });
    state().show({ id: 'b', label: 'y' });
    expect(state().entry?.id).toBe('b');
  });
});
