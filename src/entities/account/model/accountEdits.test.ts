import { accounts } from '@/shared/db/schema';
import { createTestDb, seededIds } from '@/shared/db/testing';

import {
  createAccount,
  getAccount,
  listArchivedAccounts,
  reorderAccounts,
  setAccountArchived,
  updateAccount,
} from './accountEdits';
import { listAccounts } from './accounts';

const input = { name: 'Кредитка', type: 'card', icon: 'credit-card', color: 'teal', initialBalance: -500000 } as const;

describe('createAccount', () => {
  it('создаёт счёт в конце списка, имя обрезается', async () => {
    const db = createTestDb();
    await seededIds(db);
    const id = await createAccount(db, { ...input, name: '  Кредитка ' });
    const all = await listAccounts(db);
    expect(all.map((a) => a.name)).toEqual(['Основная', 'Накопления', 'Кредитка']);
    expect(all[2]).toMatchObject({ id, color: 'teal', initialBalance: -500000, archived: false });
    expect(all[2]!.sortOrder).toBeGreaterThan(all[1]!.sortOrder);
  });

  it('в пустой базе первый счёт получает порядок 0', async () => {
    const db = createTestDb();
    const id = await createAccount(db, input);
    expect((await getAccount(db, id))!.sortOrder).toBe(0);
  });

  it('порядок нового счёта выше архивных: он не встанет «в середину» после возврата', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await setAccountArchived(db, account['Накопления']!, true);
    const id = await createAccount(db, input);
    const archived = (await getAccount(db, account['Накопления']!))!;
    expect((await getAccount(db, id))!.sortOrder).toBeGreaterThan(archived.sortOrder);
  });
});

describe('updateAccount', () => {
  it('меняет только переданные поля, имя обрезается', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await updateAccount(db, account['Основная']!, { name: ' Зарплатная ', color: 'amber' });
    const row = (await getAccount(db, account['Основная']!))!;
    expect(row).toMatchObject({ name: 'Зарплатная', color: 'amber', icon: 'credit-card', type: 'card' });
  });

  it('правка обновляет updated_at', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    const before = (await getAccount(db, account['Основная']!))!.updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 5));
    await updateAccount(db, account['Основная']!, { icon: 'wallet' });
    expect((await getAccount(db, account['Основная']!))!.updatedAt).toBeGreaterThan(before);
  });
});

describe('архив', () => {
  it('архивный счёт пропадает из активных и попадает в архив; операции не страдают', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await setAccountArchived(db, account['Накопления']!, true);
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Основная']);
    expect((await listArchivedAccounts(db)).map((a) => a.name)).toEqual(['Накопления']);
  });

  it('возврат ставит счёт в конец активных', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await setAccountArchived(db, account['Основная']!, true);
    await setAccountArchived(db, account['Основная']!, false);
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Накопления', 'Основная']);
  });
});

describe('возврат из архива при занятом названии', () => {
  const cash = { ...input, name: 'Наличные', type: 'cash', icon: 'banknote' } as const;

  it('названия нет среди активных: возвращается под прежним, результат — это название', async () => {
    const db = createTestDb();
    const id = await createAccount(db, cash);
    await setAccountArchived(db, id, true);
    expect(await setAccountArchived(db, id, false)).toEqual({ name: 'Наличные' });
    expect((await getAccount(db, id))!).toMatchObject({ name: 'Наличные', archived: false });
  });

  it('есть активный счёт с тем же названием: возврат как «Наличные (2)», затем «(3)»', async () => {
    const db = createTestDb();
    const first = await createAccount(db, cash);
    await setAccountArchived(db, first, true);
    await createAccount(db, cash);
    expect(await setAccountArchived(db, first, false)).toEqual({ name: 'Наличные (2)' });
    expect((await getAccount(db, first))!.name).toBe('Наличные (2)');

    const second = await createAccount(db, cash);
    await setAccountArchived(db, second, true);
    expect(await setAccountArchived(db, second, false)).toEqual({ name: 'Наличные (3)' });
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Наличные', 'Наличные (2)', 'Наличные (3)']);
  });

  it('сравнение без учёта регистра и пробелов по краям', async () => {
    const db = createTestDb();
    const archived = await createAccount(db, cash);
    await setAccountArchived(db, archived, true);
    await db.insert(accounts).values({ ...cash, id: 'raw', name: ' НАЛИЧНЫЕ ', sortOrder: 5 });
    expect(await setAccountArchived(db, archived, false)).toEqual({ name: 'Наличные (2)' });
  });

  it('архивные счета с тем же названием не мешают', async () => {
    const db = createTestDb();
    const a = await createAccount(db, cash);
    const b = await createAccount(db, cash);
    await setAccountArchived(db, a, true);
    await setAccountArchived(db, b, true);
    expect(await setAccountArchived(db, a, false)).toEqual({ name: 'Наличные' });
  });

  it('несуществующий счёт: null, ничего не создаётся', async () => {
    const db = createTestDb();
    expect(await setAccountArchived(db, 'нет', false)).toBeNull();
    expect(await setAccountArchived(db, 'нет', true)).toBeNull();
    expect(await listAccounts(db)).toEqual([]);
  });

  it('архивация возвращает название счёта', async () => {
    const db = createTestDb();
    const id = await createAccount(db, cash);
    expect(await setAccountArchived(db, id, true)).toEqual({ name: 'Наличные' });
  });
});

describe('reorderAccounts', () => {
  it('новый порядок применяется целиком', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    const third = await createAccount(db, input);
    await reorderAccounts(db, [third, account['Накопления']!, account['Основная']!]);
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Кредитка', 'Накопления', 'Основная']);
  });

  it('пустой список ничего не делает, чужие id игнорируются', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await reorderAccounts(db, []);
    await reorderAccounts(db, ['нет-такого', account['Накопления']!]);
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Основная', 'Накопления']);
  });

  it('getAccount: несуществующий id — null', async () => {
    expect(await getAccount(createTestDb(), 'нет')).toBeNull();
  });
});
