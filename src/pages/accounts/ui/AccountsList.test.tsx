import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { AccountsList } from './AccountsList';

const NB = '\u00A0';
const accounts = [
  { id: 'a', name: 'Основная', icon: 'credit-card', color: 'violet', type: 'card', balance: 4_821_500 },
  { id: 'b', name: 'Накопления', icon: 'piggy-bank', color: 'teal', type: 'savings', balance: 1_264_000 },
] as const;
const archived = [{ id: 'z', name: 'Наличные', icon: 'banknote', color: 'amber' }];

function render(props: Partial<React.ComponentProps<typeof AccountsList>> = {}) {
  let tree!: ReturnType<typeof create>;
  const handlers = { onOpen: jest.fn(), onMove: jest.fn(), onRestore: jest.fn(), onAdd: jest.fn() };
  act(() => {
    tree = create(<AccountsList accounts={accounts} archived={archived} {...handlers} {...props} />);
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  return { tree, button, texts, ...handlers };
}

describe('AccountsList', () => {
  it('строки счетов: название, тип и баланс', () => {
    const { texts } = render();
    expect(texts()).toEqual(
      expect.arrayContaining(['Основная', `Карта · 48${NB}215${NB}₽`, 'Накопления', `Накопления · 12${NB}640${NB}₽`]),
    );
  });

  it('кнопки порядка: у первого «выше» недоступна, у последнего «ниже» недоступна', () => {
    const { button } = render();
    expect(button('Поднять выше: Основная')!.props.accessibilityState).toEqual({ disabled: true });
    expect(button('Опустить ниже: Накопления')!.props.accessibilityState).toEqual({ disabled: true });
    expect(button('Опустить ниже: Основная')!.props.accessibilityState).toEqual({ disabled: false });
  });

  it('порядок, открытие, добавление', () => {
    const { button, onMove, onOpen, onAdd } = render();
    act(() => button('Опустить ниже: Основная')!.props.onPress());
    expect(onMove).toHaveBeenCalledWith('a', 1);
    act(() => button('Поднять выше: Накопления')!.props.onPress());
    expect(onMove).toHaveBeenCalledWith('b', -1);
    act(() => button('Изменить счёт Накопления')!.props.onPress());
    expect(onOpen).toHaveBeenCalledWith('b');
    act(() => button('Добавить счёт')!.props.onPress());
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('архив свёрнут; по нажатию показывает счета с кнопкой «Вернуть»', () => {
    const { button, texts, onRestore } = render();
    expect(texts()).not.toContain('Наличные');
    expect(texts()).toContain('Архив (1)');
    act(() => button('Показать архив, счетов: 1')!.props.onPress());
    expect(texts()).toContain('Наличные');
    act(() => button('Вернуть из архива: Наличные')!.props.onPress());
    expect(onRestore).toHaveBeenCalledWith('z');
    expect(button('Скрыть архив')).toBeDefined();
  });

  it('пустой архив — раздела нет; пустой список — подсказка', () => {
    const { texts } = render({ accounts: [], archived: [] });
    expect(texts().some((x) => x.startsWith('Счетов пока нет'))).toBe(true);
    expect(texts().some((x) => x.startsWith('Архив'))).toBe(false);
  });
});
