import { Keyboard, Text, TextInput } from 'react-native';
import { act } from 'react-test-renderer';

import { useEntryStore } from '../model/entryStore';
import type { EntrySession } from '../model/session';
import { AmountSheet } from './AmountSheet';
import { pressable, render, tap, texts } from './testUtils';

const NB = '\u00A0';
const MINUS = '−';

const expense: EntrySession = {
  type: 'expense',
  account: { id: 'main', name: 'Основная' },
  category: { id: 'food', name: 'Продукты' },
};
const income: EntrySession = {
  type: 'income',
  category: { id: 'salary', name: 'Зарплата' },
  account: { id: 'main', name: 'Основная' },
};

const open = (session: EntrySession) => act(() => useEntryStore.getState().open(session));
const type = (...keys: string[]) => keys.forEach((key) => act(() => useEntryStore.getState().press(key as never)));

afterEach(() => {
  act(() => useEntryStore.getState().close());
});

describe('AmountSheet', () => {
  it('закрытая шторка ничего не рисует', () => {
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={jest.fn()} />);
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
  });

  it('открытая: контекст, дни, пустая сумма, кнопка «Записать» недоступна', () => {
    open(expense);
    const tree = render(<AmountSheet info={{ categoryRemaining: 676000 }} recent={[]} onRecord={jest.fn()} />);
    const all = texts(tree);
    expect(all).toContain('Основная → Продукты');
    expect(all).toContain('Сегодня');
    expect(all).toContain('Вчера');
    expect(all).toContain(`0${NB}₽`);
    expect(all).toContain(`Останется: 6${NB}760${NB}₽`);
    const button = pressable(tree, 'Записать');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('набор на клавиатуре: сумма, «Останется» и кнопка обновляются на каждое нажатие', () => {
    open(expense);
    const tree = render(<AmountSheet info={{ categoryRemaining: 676000 }} recent={[]} onRecord={jest.fn()} />);
    tap(tree, '1');
    tap(tree, '2');
    tap(tree, '4');
    tap(tree, '0');
    const all = texts(tree);
    expect(all).toContain(`1${NB}240${NB}₽`);
    expect(all).toContain(`Останется: 5${NB}520${NB}₽`);
    expect(all).toContain(`Записать ${MINUS}1${NB}240${NB}₽`);
  });

  it('выражение: строка «1 000 + 240» над итогом', () => {
    open(expense);
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={jest.fn()} />);
    ['1', '0', '0', '0', 'Плюс', '2', '4', '0'].forEach((label) => tap(tree, label));
    const all = texts(tree);
    expect(all).toContain(`1${NB}000 + 240`);
    expect(all).toContain(`1${NB}240${NB}₽`);
  });

  it('«Записать» отдаёт черновик: вид, сумму, день и комментарий', () => {
    open(expense);
    const onRecord = jest.fn();
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={onRecord} />);
    ['1', '2', '4', '0'].forEach((label) => tap(tree, label));
    tap(tree, 'Вчера');
    act(() => useEntryStore.getState().setNote('Пятёрочка'));
    tap(tree, `Записать ${MINUS}1${NB}240${NB}₽`);
    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(onRecord).toHaveBeenCalledWith({ session: expense, amount: 124000, dayOffset: -1, note: 'Пятёрочка' });
  });

  it('деление на ноль: записать нельзя', () => {
    open(expense);
    const onRecord = jest.fn();
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={onRecord} />);
    ['5', 'Разделить', '0'].forEach((label) => tap(tree, label));
    expect(pressable(tree, 'Записать').props.accessibilityState).toEqual({ disabled: true });
    expect(onRecord).not.toHaveBeenCalled();
  });

  it('чип недавней суммы подставляет её в ввод', () => {
    open(expense);
    const tree = render(<AmountSheet info={{}} recent={[50000, 124000]} onRecord={jest.fn()} />);
    tap(tree, `Подставить 1${NB}240${NB}₽`);
    expect(useEntryStore.getState().expression).toBe('1240');
    expect(texts(tree)).toContain(`1${NB}240${NB}₽`);
  });

  it('доход: кнопка со знаком «+» и баланс счёта после зачисления', () => {
    open(income);
    const tree = render(<AmountSheet info={{ targetBalance: 4821500 }} recent={[]} onRecord={jest.fn()} />);
    type('5', '0', '0', '0', '0');
    const all = texts(tree);
    expect(all).toContain(`Записать +50${NB}000${NB}₽`);
    expect(all).toContain(`На счёте будет: 98${NB}215${NB}₽`);
  });

  it('плитка-превью получает введённую сумму (null, пока ничего не набрано)', () => {
    open(expense);
    const preview = jest.fn(() => null);
    const tree = render(<AmountSheet info={{}} recent={[]} preview={preview} onRecord={jest.fn()} />);
    expect(preview).toHaveBeenLastCalledWith(null);
    tap(tree, '7');
    expect(preview).toHaveBeenLastCalledWith(700);
  });

  it('нажатие на фон закрывает шторку без записи', () => {
    open(expense);
    const onRecord = jest.fn();
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={onRecord} />);
    tap(tree, 'Закрыть без записи');
    expect(useEntryStore.getState().session).toBeNull();
    expect(tree.root.findAllByType(Text)).toHaveLength(0);
    expect(onRecord).not.toHaveBeenCalled();
  });

  it('комментарий: по нажатию появляется поле ввода, текст попадает в хранилище', () => {
    open(expense);
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={jest.fn()} />);
    expect(tree.root.findAllByType(TextInput)).toHaveLength(0);
    tap(tree, 'Добавить комментарий');
    const input = tree.root.findByType(TextInput);
    act(() => input.props.onChangeText('кофе'));
    expect(useEntryStore.getState().note).toBe('кофе');
  });

  it('комментарий: поле получает фокус сразу', () => {
    open(expense);
    const tree = render(<AmountSheet info={{}} recent={[]} onRecord={jest.fn()} />);
    tap(tree, 'Добавить комментарий');
    expect(tree.root.findByType(TextInput).props.autoFocus).toBe(true);
  });

  it('пока поле комментария в фокусе, клавиатура, чипы и превью скрыты, после blur возвращаются', () => {
    open(expense);
    const preview = jest.fn((amount: number | null) => <Text>{`превью ${amount}`}</Text>);
    const tree = render(<AmountSheet info={{}} recent={[50000]} preview={preview} onRecord={jest.fn()} />);
    tap(tree, 'Добавить комментарий');
    const input = tree.root.findByType(TextInput);
    act(() => input.props.onFocus());
    expect(() => pressable(tree, '7')).toThrow();
    expect(() => pressable(tree, `Подставить 500${NB}₽`)).toThrow();
    expect(texts(tree)).not.toContain('превью null');
    act(() => input.props.onBlur());
    expect(() => pressable(tree, '7')).not.toThrow();
    expect(() => pressable(tree, `Подставить 500${NB}₽`)).not.toThrow();
    expect(texts(tree)).toContain('превью null');
  });

  it('скрытие системной клавиатуры снимает фокус с поля, подписка снимается при размонтировании', () => {
    const remove = jest.fn();
    const hideListeners: ((event: never) => void)[] = [];
    const spy = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
      if (event === 'keyboardDidHide') hideListeners.push(handler as (event: never) => void);
      return { remove } as never;
    });
    try {
      open(expense);
      const tree = render(<AmountSheet info={{}} recent={[]} onRecord={jest.fn()} />);
      tap(tree, 'Добавить комментарий');
      act(() => tree.root.findByType(TextInput).props.onFocus());
      expect(() => pressable(tree, '7')).toThrow();
      act(() => {
        for (const listener of hideListeners) listener({} as never);
      });
      expect(() => pressable(tree, '7')).not.toThrow();
      act(() => tree.unmount());
      expect(remove).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
