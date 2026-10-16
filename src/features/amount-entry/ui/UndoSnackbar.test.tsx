import { AccessibilityInfo, Text } from 'react-native';
import { act } from 'react-test-renderer';

import { UNDO_MS, useUndoStore } from '../model/undoStore';
import { pressable, render, tap } from './testUtils';
import { UndoSnackbar } from './UndoSnackbar';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  act(() => useUndoStore.getState().dismiss());
  jest.useRealTimers();
});

describe('UndoSnackbar', () => {
  it('без записи ничего не рисует', () => {
    const tree = render(<UndoSnackbar onUndo={jest.fn()} />);
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
  });

  it('после записи показывает «Записано» и «Отменить»', () => {
    const tree = render(<UndoSnackbar onUndo={jest.fn()} />);
    act(() => useUndoStore.getState().show({ id: 'tx1', label: '−1 240 ₽ в Продукты' }));
    const all = tree.root.findAllByType(Text).map((n) => String(n.props.children));
    expect(all).toEqual(['Записано', 'Отменить']);
    expect(tree.root.findAllByType(Text)[0]!.props.accessibilityLabel).toBe('Записано: −1 240 ₽ в Продукты');
    expect(() => pressable(tree, 'Отменить запись')).not.toThrow();
  });

  it('запись озвучивается скринридером', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    try {
      render(<UndoSnackbar onUndo={jest.fn()} />);
      act(() => useUndoStore.getState().show({ id: 'tx1', label: '−1 240 ₽ в Продукты' }));
      expect(announce).toHaveBeenCalledWith('Записано: −1 240 ₽ в Продукты');
    } finally {
      announce.mockRestore();
    }
  });

  it('панель не скрывает кнопку от VoiceOver: у предков «Записано» нет accessible', () => {
    const tree = render(<UndoSnackbar onUndo={jest.fn()} />);
    act(() => useUndoStore.getState().show({ id: 'tx1', label: 'x' }));
    const accessibleAncestors: unknown[] = [];
    for (let node = tree.root.findAllByType(Text)[0]!.parent; node; node = node.parent) {
      if (node.props.accessible) accessibleAncestors.push(node.type);
    }
    expect(accessibleAncestors).toEqual([]);
  });

  it('«Отменить» откатывает запись по id и закрывает панель', () => {
    const onUndo = jest.fn();
    const tree = render(<UndoSnackbar onUndo={onUndo} />);
    act(() => useUndoStore.getState().show({ id: 'tx1', label: 'x' }));
    tap(tree, 'Отменить запись');
    expect(onUndo).toHaveBeenCalledWith('tx1');
    expect(useUndoStore.getState().entry).toBeNull();
  });

  it('через 5 секунд панель исчезает сама, отмена уже недоступна', () => {
    render(<UndoSnackbar onUndo={jest.fn()} />);
    act(() => useUndoStore.getState().show({ id: 'tx1', label: 'x' }));
    act(() => jest.advanceTimersByTime(UNDO_MS - 1));
    expect(useUndoStore.getState().entry).not.toBeNull();
    act(() => jest.advanceTimersByTime(1));
    expect(useUndoStore.getState().entry).toBeNull();
  });

  it('новая запись перезапускает отсчёт', () => {
    render(<UndoSnackbar onUndo={jest.fn()} />);
    act(() => useUndoStore.getState().show({ id: 'a', label: 'x' }));
    act(() => jest.advanceTimersByTime(4000));
    act(() => useUndoStore.getState().show({ id: 'b', label: 'y' }));
    act(() => jest.advanceTimersByTime(4000));
    expect(useUndoStore.getState().entry?.id).toBe('b');
    act(() => jest.advanceTimersByTime(1000));
    expect(useUndoStore.getState().entry).toBeNull();
  });
});
