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
  });
});
