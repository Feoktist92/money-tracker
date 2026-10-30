import { act, create } from 'react-test-renderer';

import { IconPicker } from './IconPicker';

function render(value = 'coffee') {
  let tree!: ReturnType<typeof create>;
  const onChange = jest.fn();
  act(() => {
    tree = create(<IconPicker label="Значок" icons={['house', 'coffee', 'bus']} value={value} onChange={onChange} />);
  });
  const button = (name: string) =>
    tree.root.findAll(
      (n) => n.props.accessibilityLabel === `Значок ${name}` && typeof n.props.onPress === 'function',
    )[0]!;
  return { tree, onChange, button };
}

describe('IconPicker', () => {
  it('кнопка на каждый значок, выбранный помечен', () => {
    const { button } = render('coffee');
    expect(button('coffee').props.accessibilityState).toEqual({ selected: true });
    expect(button('house').props.accessibilityState).toEqual({ selected: false });
    expect(button('bus').props.accessibilityState).toEqual({ selected: false });
  });

  it('нажатие отдаёт имя значка', () => {
    const { button, onChange } = render();
    act(() => button('bus').props.onPress());
    expect(onChange).toHaveBeenCalledWith('bus');
  });

  it('значок, которого нет среди вариантов, не ломает выбор: выбранных нет', () => {
    const { button } = render('нет-такого');
    expect(button('house').props.accessibilityState).toEqual({ selected: false });
  });
});
