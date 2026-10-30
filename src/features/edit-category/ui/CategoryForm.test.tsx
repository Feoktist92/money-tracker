import { Text, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';

import { emptyCategory } from '../model/categoryForm';
import { CategoryForm } from './CategoryForm';

function render(props: Partial<React.ComponentProps<typeof CategoryForm>> = {}) {
  let tree!: ReturnType<typeof create>;
  const onSubmit = jest.fn();
  act(() => {
    tree = create(
      <CategoryForm
        initial={emptyCategory('expense')}
        kindEditable
        takenNamesByKind={{ expense: ['Кафе'], income: ['Зарплата'] }}
        submitLabel="Создать"
        onSubmit={onSubmit}
        {...props}
      />,
    );
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const input = (label: string) =>
    tree.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === label)[0];
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  const type = (label: string, value: string) => act(() => input(label)!.props.onChangeText(value));
  return { button, input, texts, type, onSubmit };
}

describe('CategoryForm', () => {
  it('пустая форма: «Создать» недоступна', () => {
    const { button } = render();
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('расход с цветом, значком и лимитом отдаётся значением', () => {
    const { button, type, onSubmit } = render();
    type('Название', 'Спорт');
    type('Месячный лимит', '3 000');
    act(() => button('Синий')!.props.onPress());
    act(() => button('Значок: гантель')!.props.onPress());
    act(() => button('Создать')!.props.onPress());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Спорт',
      kind: 'expense',
      icon: 'dumbbell',
      color: 'blue',
      monthlyLimit: 300000,
    });
  });

  it('выбор цвета: шесть цветов категории, янтарного и красного нет', () => {
    const { button } = render();
    for (const name of ['Фиолетовый', 'Синий', 'Бирюзовый', 'Зелёный', 'Малиновый', 'Серо-стальной']) {
      expect(button(name)).toBeDefined();
    }
    expect(button('Янтарный')).toBeUndefined();
  });

  it('вид: у доходов поля лимита нет; повтор названия проверяется среди категорий выбранного вида', () => {
    const { button, input, type, texts } = render();
    type('Название', 'Зарплата');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: false });
    act(() => button('Доход')!.props.onPress());
    expect(input('Месячный лимит')).toBeUndefined();
    expect(texts()).toContain('Категория с таким названием уже есть');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('у существующей категории вид не меняется: чипов «Расход / Доход» нет', () => {
    const { button } = render({ kindEditable: false });
    expect(button('Расход')).toBeUndefined();
    expect(button('Доход')).toBeUndefined();
  });

  it('лимит вводится цифровой клавиатурой: минус ему не нужен', () => {
    const { input } = render();
    expect(input('Месячный лимит')!.props.keyboardType).toBe('decimal-pad');
  });

  it('лимит ноль — ошибка под полем', () => {
    const { type, texts } = render();
    type('Название', 'Спорт');
    type('Месячный лимит', '0');
    expect(texts()).toContain('Лимит должен быть больше нуля');
  });

  it('пока идёт запись, «Создать» и «Архивировать» недоступны', () => {
    const { button, type } = render({ onArchive: jest.fn() });
    type('Название', 'Спорт');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: false });
    const saving = render({
      initial: { ...emptyCategory('expense'), name: 'Спорт' },
      onArchive: jest.fn(),
      saving: true,
    });
    expect(saving.button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    expect(saving.button('Архивировать')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('showErrorsInitially: занятое название видно сразу, без ввода; без флага — нет', () => {
    const initial = { ...emptyCategory('expense'), name: 'Кафе' };
    expect(render({ initial }).texts()).not.toContain('Категория с таким названием уже есть');
    const { texts, button } = render({ initial, showErrorsInitially: true, submitLabel: 'Сохранить' });
    expect(texts()).toContain('Категория с таким названием уже есть');
    expect(button('Сохранить')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('showErrorsInitially: ошибка лимита тоже видна сразу', () => {
    const { texts } = render({
      initial: { ...emptyCategory('expense'), name: 'Спорт', monthlyLimit: '0' },
      showErrorsInitially: true,
    });
    expect(texts()).toContain('Лимит должен быть больше нуля');
  });

  it('«Архивировать» есть только у существующей категории', () => {
    expect(render().button('Архивировать')).toBeUndefined();
    const onArchive = jest.fn();
    const { button } = render({ onArchive });
    act(() => button('Архивировать')!.props.onPress());
    expect(onArchive).toHaveBeenCalledTimes(1);
  });
});
