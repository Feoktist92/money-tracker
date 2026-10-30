import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import type { CategoryRow } from '../model/categoryRows';
import { CategoriesList } from './CategoriesList';

const NB = '\u00A0';
const row = (patch: Partial<CategoryRow> & { id: string; name: string }): CategoryRow => ({
  kind: 'expense',
  icon: 'house',
  color: 'violet',
  monthlyLimit: null,
  ...patch,
});
const active = [
  row({ id: 'food', name: 'Продукты', monthlyLimit: 1_800_000 }),
  row({ id: 'cafe', name: 'Кафе' }),
  row({ id: 'salary', name: 'Зарплата', kind: 'income' }),
];
const archived = [row({ id: 'old', name: 'Старое' }), row({ id: 'gift', name: 'Подарки', kind: 'income' })];

function render(props: Partial<React.ComponentProps<typeof CategoriesList>> = {}) {
  let tree!: ReturnType<typeof create>;
  const handlers = { onOpen: jest.fn(), onMove: jest.fn(), onRestore: jest.fn(), onAdd: jest.fn() };
  act(() => {
    tree = create(<CategoriesList active={active} archived={archived} {...handlers} {...props} />);
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  return { button, texts, ...handlers };
}

describe('CategoriesList', () => {
  it('по умолчанию расходы: названия и лимиты; доходов нет', () => {
    const { texts } = render();
    expect(texts()).toEqual(expect.arrayContaining(['Продукты', `Лимит 18${NB}000${NB}₽`, 'Кафе', 'Без лимита']));
    expect(texts()).not.toContain('Зарплата');
  });

  it('переключатель показывает доходы', () => {
    const { button, texts } = render();
    act(() => button('Доходы')!.props.onPress());
    expect(texts()).toContain('Зарплата');
    expect(texts()).toContain('Доход');
    expect(texts()).not.toContain('Продукты');
  });

  it('порядок считается внутри вида: у первого расхода «выше» недоступна', () => {
    const { button, onMove } = render();
    expect(button('Поднять выше: Продукты')!.props.accessibilityState).toEqual({ disabled: true });
    expect(button('Опустить ниже: Кафе')!.props.accessibilityState).toEqual({ disabled: true });
    act(() => button('Опустить ниже: Продукты')!.props.onPress());
    expect(onMove).toHaveBeenCalledWith('food', 1);
  });

  it('«Добавить категорию» создаёт категорию выбранного вида', () => {
    const { button, onAdd } = render();
    act(() => button('Добавить категорию')!.props.onPress());
    expect(onAdd).toHaveBeenLastCalledWith('expense');
    act(() => button('Доходы')!.props.onPress());
    act(() => button('Добавить категорию')!.props.onPress());
    expect(onAdd).toHaveBeenLastCalledWith('income');
  });

  it('архив относится к выбранному виду и сворачивается при переключении', () => {
    const { button, texts, onRestore } = render();
    expect(texts()).toContain('Архив (1)');
    act(() => button('Показать архив, категорий: 1')!.props.onPress());
    expect(texts()).toContain('Старое');
    act(() => button('Вернуть из архива: Старое')!.props.onPress());
    expect(onRestore).toHaveBeenCalledWith('old');
    act(() => button('Доходы')!.props.onPress());
    expect(texts()).not.toContain('Старое');
    expect(texts()).toContain('Архив (1)');
  });

  it('строка читается TalkBack целиком, а подсказка говорит, что будет по нажатию', () => {
    const { button } = render();
    const food = button(`Продукты, Лимит 18${NB}000${NB}₽`)!;
    expect(food.props.accessibilityHint).toBe('Изменить категорию');
    expect(food.props.accessibilityRole).toBe('button');
  });

  it('нажатие на строку открывает форму', () => {
    const { button, onOpen } = render();
    act(() => button('Кафе, Без лимита')!.props.onPress());
    expect(onOpen).toHaveBeenCalledWith('cafe');
  });
});
