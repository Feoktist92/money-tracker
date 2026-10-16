import type { AmountKey } from '@/shared/lib/amount-input';

import { Keypad } from './Keypad';
import { pressable, render, tap } from './testUtils';

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
});
