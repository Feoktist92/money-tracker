import { act, create } from 'react-test-renderer';

import { ICON_NAMES } from '../AppIcon';
import { IconPicker } from './IconPicker';

function render(value = 'coffee', icons: string[] = ['house', 'coffee', 'bus']) {
  let tree!: ReturnType<typeof create>;
  const onChange = jest.fn();
  act(() => {
    tree = create(<IconPicker label="Значок" icons={icons} value={value} onChange={onChange} />);
  });
  const button = (name: string) =>
    tree.root.findAll(
      (n) => n.props.accessibilityLabel === `Значок: ${name}` && typeof n.props.onPress === 'function',
    )[0]!;
  return { tree, onChange, button };
}

describe('IconPicker', () => {
  it('кнопка на каждый значок, выбранный помечен', () => {
    const { button } = render('coffee');
    expect(button('кофе').props.accessibilityState).toEqual({ selected: true });
    expect(button('дом').props.accessibilityState).toEqual({ selected: false });
    expect(button('автобус').props.accessibilityState).toEqual({ selected: false });
  });

  it('нажатие отдаёт имя значка', () => {
    const { button, onChange } = render();
    act(() => button('автобус').props.onPress());
    expect(onChange).toHaveBeenCalledWith('bus');
  });

  it('кнопки подписаны русскими названиями значков, а не английскими ключами', () => {
    const { tree } = render();
    const labels = tree.root
      .findAll(
        (n) => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Значок:'),
      )
      .map((n) => n.props.accessibilityLabel);
    expect(new Set(labels)).toEqual(
      new Set([`Значок: ${ICON_NAMES['house']}`, `Значок: ${ICON_NAMES['coffee']}`, `Значок: ${ICON_NAMES['bus']}`]),
    );
  });

  it('значок без русского названия подписан своим ключом', () => {
    const { button } = render('coffee', ['coffee', 'unknown-icon']);
    expect(button('unknown-icon')).toBeDefined();
  });

  it('значок, которого нет среди вариантов, не ломает выбор: выбранных нет', () => {
    const { button } = render('нет-такого');
    expect(button('дом').props.accessibilityState).toEqual({ selected: false });
  });
});
