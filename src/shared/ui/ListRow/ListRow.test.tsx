import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { ListRow } from './ListRow';

function render(props: Partial<React.ComponentProps<typeof ListRow>> = {}) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ListRow leading={null} title="Основная" subtitle="Карта · 100 ₽" {...props} />);
  });
  return tree;
}

describe('ListRow', () => {
  it('название и вторая строка', () => {
    const texts = render()
      .root.findAllByType(Text)
      .map((n) => String(n.props.children));
    expect(texts).toEqual(['Основная', 'Карта · 100 ₽']);
  });

  it('без второй строки её нет', () => {
    expect(render({ subtitle: undefined }).root.findAllByType(Text)).toHaveLength(1);
  });

  it('нажатие на текстовую часть вызывает onPress, trailing нажимается отдельно', () => {
    const onPress = jest.fn();
    const onTrailing = jest.fn();
    const tree = render({
      accessibilityLabel: 'Изменить счёт Основная',
      onPress,
      trailing: <Text accessibilityLabel="кнопка" onPress={onTrailing} />,
    });
    const main = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'Изменить счёт Основная' && typeof n.props.onPress === 'function',
    )[0]!;
    act(() => main.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onTrailing).not.toHaveBeenCalled();
  });
});
