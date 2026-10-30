import { useLocalSearchParams } from 'expo-router';
import { Alert, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { db } from '@/shared/db/client';
import { categories } from '@/shared/db/schema';
import { seededIds } from '@/shared/db/testing';

import { CategoryEditPage } from './CategoryEditPage';

// База — настоящая (better-sqlite3 в памяти с миграциями приложения); клиент приложения подменён ею
jest.mock('@/shared/db/client', () => ({ db: jest.requireActual('@/shared/db/testing').createTestDb() }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { back: jest.Mock; replace: jest.Mock; canGoBack: jest.Mock };
};
let ids: Awaited<ReturnType<typeof seededIds>>;

beforeAll(async () => {
  ids = await seededIds(db);
});
beforeEach(() => {
  router.back.mockClear();
  router.replace.mockClear();
  router.canGoBack.mockReturnValue(true);
  (useLocalSearchParams as jest.Mock).mockReturnValue({ kind: 'expense' });
});
afterEach(() => jest.restoreAllMocks());

async function mount() {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 28, left: 0, right: 0, bottom: 0 },
        }}
      >
        <CategoryEditPage />
      </SafeAreaProvider>,
    );
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const input = (label: string) =>
    tree.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === label)[0];
  const type = (label: string, value: string) => act(() => input(label)!.props.onChangeText(value));
  const texts = () => tree.root.findAllByType(Text).map((n) => String(n.props.children));
  const press = async (label: string) => {
    await act(async () => {
      button(label)!.props.onPress();
    });
  };
  return { button, input, type, press, texts };
}

const byName = async (name: string) => (await db.select().from(categories)).find((c) => c.name === name);

describe('CategoryEditPage', () => {
  it('новый расход: название, цвет, значок и лимит попадают в базу', async () => {
    const { type, press, button } = await mount();
    type('Название', 'Спорт');
    type('Месячный лимит', '3 000');
    await act(async () => button('Синий')!.props.onPress());
    await act(async () => button('Значок: гантель')!.props.onPress());
    await press('Создать');
    expect(await byName('Спорт')).toMatchObject({
      kind: 'expense',
      color: 'blue',
      icon: 'dumbbell',
      monthlyLimit: 300_000,
      archived: false,
    });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('новый доход: kind из параметра, лимита нет', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ kind: 'income' });
    const { type, press, input } = await mount();
    expect(input('Месячный лимит')).toBeUndefined();
    type('Название', 'Кэшбэк');
    await press('Создать');
    expect(await byName('Кэшбэк')).toMatchObject({ kind: 'income', monthlyLimit: null });
  });

  it('повтор названия категории того же вида не пускает', async () => {
    const { type, button } = await mount();
    type('Название', 'кафе');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('правка: вид не меняется, цвет и лимит сохраняются, лимит можно убрать', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: ids.category['Кафе'] });
    const { input, type, press, button } = await mount();
    expect(input('Название')!.props.value).toBe('Кафе');
    expect(input('Месячный лимит')!.props.value).toBe('7\u00A0000');
    expect(button('Доход')).toBeUndefined();
    await act(async () => button('Малиновый')!.props.onPress());
    type('Месячный лимит', '');
    await press('Сохранить');
    expect(await byName('Кафе')).toMatchObject({ kind: 'expense', color: 'magenta', monthlyLimit: null });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('правка категории с уже занятым названием: ошибка видна сразу, «Сохранить» недоступна', async () => {
    const twin = { name: 'Близнец', kind: 'expense', icon: 'coffee', color: 'blue' } as const;
    await db.insert(categories).values([
      { ...twin, id: 'twin-a', sortOrder: 50 },
      { ...twin, id: 'twin-b', sortOrder: 51 },
    ]);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'twin-b' });
    const { texts, button } = await mount();
    expect(texts()).toContain('Категория с таким названием уже есть');
    expect(button('Сохранить')!.props.accessibilityState).toEqual({ disabled: true });
  });

  it('новая категория: ошибок до ввода нет', async () => {
    const { texts } = await mount();
    expect(texts()).not.toContain('Введите название');
  });

  it('двойное нажатие записывает один раз и закрывает экран один раз', async () => {
    const { type, button } = await mount();
    const before = (await db.select().from(categories)).length;
    type('Название', 'Двойное нажатие');
    const submit = button('Создать')!;
    await act(async () => {
      submit.props.onPress();
      submit.props.onPress();
    });
    const after = await db.select().from(categories);
    expect(after.length).toBe(before + 1);
    expect(after.filter((c) => c.name === 'Двойное нажатие')).toHaveLength(1);
    expect(router.back).toHaveBeenCalledTimes(1);
    // после успеха экран закрывается: кнопка остаётся недоступной, и поздний повтор тоже ничего не пишет
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    await act(async () => submit.props.onPress());
    expect((await db.select().from(categories)).length).toBe(before + 1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('сбой записи: сообщение, кнопка снова доступна, повтор записывает один раз', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(db, 'insert').mockImplementationOnce(() => {
      throw new Error('диск полон');
    });
    const { type, press, button } = await mount();
    const before = (await db.select().from(categories)).length;
    type('Название', 'После сбоя');
    await press('Создать');
    expect(alert).toHaveBeenCalledWith('Не удалось сохранить', 'Попробуйте ещё раз.');
    expect(router.back).not.toHaveBeenCalled();
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: false });
    await press('Создать');
    expect((await db.select().from(categories)).length).toBe(before + 1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('без истории переходов «Назад» и сохранение ведут на главный экран', async () => {
    router.canGoBack.mockReturnValue(false);
    const { type, press } = await mount();
    await press('Назад');
    expect(router.replace).toHaveBeenLastCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
    type('Название', 'Без истории');
    await press('Создать');
    expect(router.replace).toHaveBeenCalledTimes(2);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('с историей «Назад» возвращает на предыдущий экран', async () => {
    const { press } = await mount();
    await press('Назад');
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('архив: после подтверждения категория архивирована', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: ids.category['Транспорт'] });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { press } = await mount();
    await press('Архивировать');
    const buttons = alert.mock.calls[0]![2]!;
    await act(async () => {
      buttons[1]!.onPress!();
    });
    expect((await byName('Транспорт'))!.archived).toBe(true);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
