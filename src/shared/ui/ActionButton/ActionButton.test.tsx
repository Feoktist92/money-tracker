import { act, create } from 'react-test-renderer';

import { ActionButton } from './ActionButton';

function render(props: Partial<React.ComponentProps<typeof ActionButton>> = {}) {
  let tree!: ReturnType<typeof create>;
  const onPress = jest.fn();
  act(() => {
    tree = create(<ActionButton label="Сохранить" onPress={onPress} {...props} />);
  });
  const node = tree.root.findAll(
    (n) => n.props.accessibilityLabel === 'Сохранить' && typeof n.props.onPress === 'function',
  )[0]!;
  return { node, onPress };
}

describe('ActionButton', () => {
  it('нажатие вызывает обработчик', () => {
    const { node, onPress } = render();
    act(() => node.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('недоступная кнопка помечена для TalkBack и отключена', () => {
    const { node } = render({ disabled: true });
    expect(node.props.accessibilityState).toEqual({ disabled: true });
    expect(node.props.disabled).toBe(true);
  });

  it('все варианты рисуются', () => {
    for (const variant of ['primary', 'secondary', 'danger'] as const) expect(() => render({ variant })).not.toThrow();
  });
});
