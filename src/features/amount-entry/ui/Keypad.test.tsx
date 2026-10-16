import * as Haptics from 'expo-haptics';

import type { AmountKey } from '@/shared/lib/amount-input';

import { Keypad } from './Keypad';
import { pressable, render, tap } from './testUtils';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

beforeEach(() => jest.clearAllMocks());

describe('Keypad', () => {
  it('шестнадцать клавиш: цифры, запятая, четыре действия, стереть', () => {
    const tree = render(<Keypad onPress={jest.fn()} />);
    for (const label of [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Запятая',
      'Плюс',
      'Минус',
      'Умножить',
      'Разделить',
      'Стереть',
    ]) {
      expect(() => pressable(tree, label)).not.toThrow();
    }
  });

  it('нажатие отдаёт клавишу: цифра, запятая, действие', () => {
    const onPress = jest.fn<void, [AmountKey]>();
    const tree = render(<Keypad onPress={onPress} />);
    tap(tree, '7');
    tap(tree, 'Запятая');
    tap(tree, 'Плюс');
    tap(tree, 'Стереть');
    expect(onPress.mock.calls.map(([key]) => key)).toEqual(['7', ',', '+', 'back']);
  });

  it('долгое нажатие на «Стереть» очищает ввод', () => {
    const onPress = jest.fn<void, [AmountKey]>();
    const tree = render(<Keypad onPress={onPress} />);
    pressable(tree, 'Стереть').props.onLongPress();
    expect(onPress).toHaveBeenCalledWith('clear');
  });

  it('у остальных клавиш долгого нажатия нет', () => {
    const tree = render(<Keypad onPress={jest.fn()} />);
    expect(pressable(tree, '5').props.onLongPress).toBeUndefined();
    expect(pressable(tree, '5').props.accessibilityActions).toBeUndefined();
  });

  it('«Стереть» отдаёт скринридеру действие «Очистить»', () => {
    const onPress = jest.fn<void, [AmountKey]>();
    const tree = render(<Keypad onPress={onPress} />);
    const back = pressable(tree, 'Стереть');
    expect(back.props.accessibilityActions).toEqual([{ name: 'longpress', label: 'Очистить' }]);
    back.props.onAccessibilityAction({ nativeEvent: { actionName: 'longpress' } });
    expect(onPress).toHaveBeenCalledWith('clear');
    onPress.mockClear();
    back.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('каждое нажатие даёт лёгкий хаптик, долгое «Стереть» — удар посильнее', () => {
    const tree = render(<Keypad onPress={jest.fn()} />);
    tap(tree, '7');
    tap(tree, 'Плюс');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    pressable(tree, 'Стереть').props.onLongPress();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
  });

  it('сбой вибромотора не мешает вводу', () => {
    (Haptics.selectionAsync as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('нет мотора')));
    const onPress = jest.fn();
    const tree = render(<Keypad onPress={onPress} />);
    tap(tree, '5');
    expect(onPress).toHaveBeenCalledWith('5');
  });
});
