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
