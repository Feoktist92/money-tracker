import { act, create } from 'react-test-renderer';

import { Chips } from './Chips';

function render(value: 'a' | 'b' = 'a') {
  let tree!: ReturnType<typeof create>;
  const onChange = jest.fn();
  act(() => {
    tree = create(
      <Chips
        label="Тип"
        options={[
          { value: 'a', label: 'Карта' },
          { value: 'b', label: 'Наличные' },
        ]}
        value={value}
        onChange={onChange}
      />,
    );
  });
  const chip = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0]!;
  return { chip, onChange };
}

describe('Chips', () => {
  it('выбранный вариант помечен', () => {
    const { chip } = render('b');
    expect(chip('Наличные').props.accessibilityState).toEqual({ selected: true });
    expect(chip('Карта').props.accessibilityState).toEqual({ selected: false });
  });

  it('нажатие отдаёт значение варианта', () => {
    const { chip, onChange } = render();
    act(() => chip('Наличные').props.onPress());
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
