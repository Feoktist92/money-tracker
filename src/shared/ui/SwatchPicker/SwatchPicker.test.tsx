import { act, create } from 'react-test-renderer';

import { SwatchPicker } from './SwatchPicker';

const swatches = [
  { key: 'violet', color: '#5B3FD6', onColor: '#FFFFFF' },
  { key: 'teal', color: '#0F766E', onColor: '#FFFFFF' },
] as const;

function render(value = 'violet') {
  let tree!: ReturnType<typeof create>;
  const onChange = jest.fn();
  act(() => {
    tree = create(<SwatchPicker label="Цвет" swatches={swatches} value={value} onChange={onChange} />);
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0]!;
  return { tree, onChange, button };
}

describe('SwatchPicker', () => {
  it('кружки озвучиваются русскими названиями, выбранный помечен', () => {
    const { button } = render('teal');
    expect(button('Бирюзовый').props.accessibilityState).toEqual({ selected: true });
    expect(button('Фиолетовый').props.accessibilityState).toEqual({ selected: false });
  });

  it('нажатие отдаёт ключ цвета', () => {
    const { button, onChange } = render();
    act(() => button('Бирюзовый').props.onPress());
    expect(onChange).toHaveBeenCalledWith('teal');
  });
});
