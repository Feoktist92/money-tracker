import { eq } from 'drizzle-orm';

import { accounts } from '@/shared/db/schema';
import { createTestDb, insertTestTransaction, seededIds } from '@/shared/db/testing';

import { getAccountBalances } from './balances';

describe('getAccountBalances', () => {
  it('без операций — начальные остатки (по умолчанию 0)', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await db.update(accounts).set({ initialBalance: 50000 }).where(eq(accounts.id, account['Наличные']!));
    expect(await getAccountBalances(db)).toEqual({
      [account['Основная']!]: 0,
      [account['Накопления']!]: 0,
      [account['Наличные']!]: 50000,
    });
  });

  it('доход, расход, перевод с toAmount, удалённая операция', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    const main = account['Основная']!;
    const savings = account['Накопления']!;
    const date = '2026-10-15';
    insertTestTransaction(db, {
      type: 'income',
      amount: 10_000_000,
      toAccountId: main,
      categoryId: category['Зарплата']!,
      date,
    });
    insertTestTransaction(db, {
      type: 'expense',
      amount: 124000,
      fromAccountId: main,
      categoryId: category['Продукты']!,
      date,
    });
    insertTestTransaction(db, {
      type: 'transfer',
      amount: 1_000_000,
      toAmount: 990_000,
      fromAccountId: main,
      toAccountId: savings,
      date,
    });
    insertTestTransaction(db, {
      type: 'expense',
      amount: 500000,
      fromAccountId: main,
      categoryId: category['Кафе']!,
      date,
      deletedAt: Date.now(),
    });

    const balances = await getAccountBalances(db);
    expect(balances[main]).toBe(10_000_000 - 124000 - 1_000_000);
    expect(balances[savings]).toBe(990_000);
  });
});
