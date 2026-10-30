import { useLocalSearchParams } from 'expo-router';
import { Alert, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { db } from '@/shared/db/client';
import { accounts } from '@/shared/db/schema';
import { seededIds } from '@/shared/db/testing';

import { AccountEditPage } from './AccountEditPage';

// База — настоящая (better-sqlite3 в памяти с миграциями приложения); клиент приложения подменён ею
jest.mock('@/shared/db/client', () => ({ db: jest.requireActual('@/shared/db/testing').createTestDb() }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const { router } = jest.requireMock('expo-router') as { router: { back: jest.Mock } };
let ids: Awaited<ReturnType<typeof seededIds>>;

beforeAll(async () => {
  ids = await seededIds(db);
});
beforeEach(() => {
  router.back.mockClear();
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
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
        <AccountEditPage />
      </SafeAreaProvider>,
    );
  });
  const button = (label: string) =>
    tree.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  const input = (label: string) =>
    tree.root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === label)[0]!;
  const type = (label: string, value: string) => act(() => input(label).props.onChangeText(value));
  const press = async (label: string) => {
    await act(async () => {
      button(label)!.props.onPress();
    });
  };
  return { tree, button, input, type, press };
}

const byName = async (name: string) => (await db.select().from(accounts)).find((a) => a.name === name);

describe('AccountEditPage', () => {
  it('новый счёт: заполняю форму, «Создать» пишет в базу и закрывает экран', async () => {
    const { type, press, button } = await mount();
    type('Название', 'Кредитка');
    type('Начальный баланс', '-5 000');
    await act(async () => button('Бирюзовый')!.props.onPress());
    await press('Создать');
    expect(await byName('Кредитка')).toMatchObject({
      type: 'card',
      color: 'teal',
      initialBalance: -500_000,
      archived: false,
    });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('повтор названия активного счёта не пускает: ничего не записано', async () => {
    const { type, button } = await mount();
    const before = (await db.select().from(accounts)).length;
    type('Название', 'основная');
    expect(button('Создать')!.props.accessibilityState).toEqual({ disabled: true });
    expect((await db.select().from(accounts)).length).toBe(before);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('правка: форма открывается с данными, сохранение меняет счёт, а повтор собственного названия допустим', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: ids.account['Накопления'] });
    const { input, type, press } = await mount();
    expect(input('Название').props.value).toBe('Накопления');
    type('Название', 'Накопления');
    await press('Сохранить');
    type('Название', 'Копилка');
    await press('Сохранить');
    expect(await byName('Копилка')).toMatchObject({ id: ids.account['Накопления'], type: 'savings' });
    expect(router.back).toHaveBeenCalledTimes(2);
  });

  it('архив: подтверждение, затем счёт архивирован и экран закрыт', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: ids.account['Основная'] });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { press } = await mount();
    await press('Архивировать');
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0]![2]!;
    expect(buttons.map((b) => b.text)).toEqual(['Отмена', 'Архивировать']);
    expect((await byName('Основная'))!.archived).toBe(false);
    await act(async () => {
      buttons[1]!.onPress!();
    });
    expect((await byName('Основная'))!.archived).toBe(true);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('у архивного счёта кнопки «Архивировать» нет, у нового тоже', async () => {
    const { button } = await mount();
    expect(button('Архивировать')).toBeUndefined();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: ids.account['Основная'] });
    const archivedPage = await mount();
    // Основная уже в архиве после предыдущего теста
    expect(archivedPage.button('Архивировать')).toBeUndefined();
  });
});
