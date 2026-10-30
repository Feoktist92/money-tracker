import { Text, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';

import { Field } from './Field';

function render(props: Partial<React.ComponentProps<typeof Field>> = {}) {
  let tree!: ReturnType<typeof create>;
  const onChangeText = jest.fn();
  act(() => {
    tree = create(<Field label="Название" value="Спорт" onChangeText={onChangeText} {...props} />);
  });
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  return { tree, onChangeText, texts };
}

describe('Field', () => {
  it('подпись над полем, значение в поле, поле подписано для TalkBack', () => {
    const { tree, texts } = render();
    expect(texts()).toEqual(['Название']);
    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toBe('Спорт');
    expect(input.props.accessibilityLabel).toBe('Название');
  });

  it('ввод передаётся наружу', () => {
    const { tree, onChangeText } = render();
    act(() => tree.root.findByType(TextInput).props.onChangeText('Спорт и фитнес'));
    expect(onChangeText).toHaveBeenCalledWith('Спорт и фитнес');
  });

  it('ошибка показывается вместо подсказки', () => {
    const { texts } = render({ error: 'Введите название', hint: 'До 40 символов' });
    expect(texts()).toEqual(['Название', 'Введите название']);
  });

  it('без ошибки показывается подсказка; без обоих — только подпись', () => {
    expect(render({ hint: 'До 40 символов' }).texts()).toEqual(['Название', 'До 40 символов']);
    expect(render({ error: null }).texts()).toEqual(['Название']);
  });
});
