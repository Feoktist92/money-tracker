import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { ScreenHeader } from './ScreenHeader';

describe('ScreenHeader', () => {
  it('заголовок и кнопка «Назад» с обработчиком', () => {
    const onBack = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ScreenHeader title="Счета" onBack={onBack} />);
    });
    expect(tree.root.findAllByType(Text).map((n) => String(n.props.children))).toEqual(['Счета']);
    const back = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'Назад' && typeof n.props.onPress === 'function',
    )[0]!;
    act(() => back.props.onPress());
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
