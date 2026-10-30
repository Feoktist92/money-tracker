import { Text, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';

import { EMPTY_ACCOUNT } from '../model/accountForm';
import { AccountForm } from './AccountForm';

function render(props: Partial<React.ComponentProps<typeof AccountForm>> = {}) {
  let tree!: ReturnType<typeof create>;
  const onSubmit = jest.fn();
  act(() => {
    tree = create(
      <AccountForm
        initial={EMPTY_ACCOUNT}
        takenNames={['Основная']}
        submitLabel="Создать"
        onSubmit={onSubmit}
        {...props}
      />,
    );
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const input = (label: string) =>
    tree.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === label)[0]!;
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  const type = (label: string, value: string) => act(() => input(label).props.onChangeText(value));
  return { button, input, texts, type, onSubmit };
}

describe('AccountForm', () => {
  it('пустая форма: «Создать» недоступна, ошибок ещё нет', () => {
    const { button, texts } = render();
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    expect(texts()).not.toContain('Введите название');
  });

  it('после ввода названия кнопка доступна и отдаёт значение', () => {
    const { button, type, onSubmit } = render();
    type('Название', 'Кредитка');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: false });
    act(() => button('Создать')!.props.onPress());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Кредитка',
      type: 'card',
      icon: 'credit-card',
      color: 'violet',
      initialBalance: 0,
    });
  });

  it('повтор названия: ошибка появляется под полем, сохранить нельзя', () => {
    const { button, type, texts, onSubmit } = render();
    type('Название', 'основная');
    expect(texts()).toContain('Счёт с таким названием уже есть');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('мусор в балансе: ошибка под полем баланса', () => {
    const { type, texts } = render();
    type('Название', 'Кредитка');
    type('Начальный баланс', 'abc');
    expect(texts()).toContain('Введите сумму, например 1 240,50');
  });

  it('тип, цвет и значок попадают в значение; смена типа подставляет значок типа, если свой не выбирали', () => {
    const { button, type, onSubmit } = render();
    type('Название', 'Копилка');
    act(() => button('Накопления')!.props.onPress());
    act(() => button('Бирюзовый')!.props.onPress());
    act(() => button('Создать')!.props.onPress());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'savings', icon: 'piggy-bank', color: 'teal' }),
    );
  });

  it('свой значок при смене типа не затирается', () => {
    const { button, type, onSubmit } = render();
    type('Название', 'Копилка');
    act(() => button('Значок wallet')!.props.onPress());
    act(() => button('Накопления')!.props.onPress());
    act(() => button('Создать')!.props.onPress());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'savings', icon: 'wallet' }));
  });

  it('пока идёт запись, «Создать» и «Архивировать» недоступны', () => {
    const { button, type } = render({ onArchive: jest.fn() });
    type('Название', 'Кредитка');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: false });
    const saving = render({ initial: { ...EMPTY_ACCOUNT, name: 'Кредитка' }, onArchive: jest.fn(), saving: true });
    expect(saving.button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    expect(saving.button('Архивировать')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('showErrorsInitially: занятое название видно сразу, без ввода; без флага — нет', () => {
    const initial = { ...EMPTY_ACCOUNT, name: 'Основная' };
    expect(render({ initial }).texts()).not.toContain('Счёт с таким названием уже есть');
    const { texts, button } = render({ initial, showErrorsInitially: true, submitLabel: 'Сохранить' });
    expect(texts()).toContain('Счёт с таким названием уже есть');
    expect(button('Сохранить')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('showErrorsInitially: ошибка баланса тоже видна сразу', () => {
    const { texts } = render({
      initial: { ...EMPTY_ACCOUNT, name: 'Кредитка', initialBalance: 'abc' },
      showErrorsInitially: true,
    });
    expect(texts()).toContain('Введите сумму, например 1 240,50');
  });

  it('«Архивировать» есть только у существующего счёта', () => {
    expect(render().button('Архивировать')).toBeUndefined();
    const onArchive = jest.fn();
    const { button } = render({ onArchive });
    act(() => button('Архивировать')!.props.onPress());
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it('форма правки открывается с данными счёта', () => {
    const { input } = render({
      initial: { name: 'Основная', type: 'card', icon: 'credit-card', color: 'amber', initialBalance: '1 000' },
      takenNames: [],
      submitLabel: 'Сохранить',
    });
    expect(input('Название').props.value).toBe('Основная');
    expect(input('Начальный баланс').props.value).toBe('1 000');
  });
});
