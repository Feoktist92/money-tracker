import { eq } from 'drizzle-orm';

import { transactions } from '@/shared/db/schema';
import { createTestDb, seededIds } from '@/shared/db/testing';

import { addTransaction, softDeleteTransaction } from './transactions';

describe('addTransaction', () => {
  it('записывает расход и возвращает id', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    const id = await addTransaction(db, {
      type: 'expense',
      amount: 124000,
      fromAccountId: account['Основная']!,
      categoryId: category['Продукты']!,
      date: '2026-10-15',
      note: '  Пятёрочка ',
    });
    const row = await db.select().from(transactions).where(eq(transactions.id, id)).get();
    expect(row).toMatchObject({
      type: 'expense',
      amount: 124000,
      toAccountId: null,
      note: 'Пятёрочка',
      deletedAt: null,
    });
  });

  it.each([0, -100, 12.5, Number.NaN])('бросает на сумме %p', async (amount) => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    await expect(
      addTransaction(db, {
        type: 'expense',
        amount,
        fromAccountId: account['Основная']!,
        categoryId: category['Кафе']!,
        date: '2026-10-15',
      }),
    ).rejects.toThrow(RangeError);
  });

  it('бросает на переводе на тот же счёт и на кривой дате', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    const main = account['Основная']!;
    await expect(
      addTransaction(db, { type: 'transfer', amount: 100, fromAccountId: main, toAccountId: main, date: '2026-10-15' }),
    ).rejects.toThrow(RangeError);
    await expect(
      addTransaction(db, {
        type: 'income',
        amount: 100,
        toAccountId: main,
        categoryId: category['Зарплата']!,
        date: '2026-02-30',
      }),
    ).rejects.toThrow(RangeError);
  });

  it('несуществующий счёт отклоняет внешний ключ', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await expect(
      addTransaction(db, {
        type: 'expense',
        amount: 100,
        fromAccountId: 'нет-такого',
        categoryId: category['Кафе']!,
        date: '2026-10-15',
      }),
    ).rejects.toThrow();
  });

  it('softDeleteTransaction ставит deletedAt', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    const id = await addTransaction(db, {
      type: 'expense',
      amount: 100,
      fromAccountId: account['Накопления']!,
      categoryId: category['Кафе']!,
      date: '2026-10-15',
    });
    await softDeleteTransaction(db, id);
    const row = await db.select().from(transactions).where(eq(transactions.id, id)).get();
    expect(row?.deletedAt).toEqual(expect.any(Number));
  });
});
