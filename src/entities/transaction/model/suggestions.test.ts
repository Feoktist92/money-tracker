import { createTestDb, insertTestTransaction, seededIds } from '@/shared/db/testing';

import { getLastAccountForCategory, getRecentAmounts } from './suggestions';

async function setup() {
  const db = createTestDb();
  const { account, category } = await seededIds(db);
  const expense = (amount: number, date: string, patch: Record<string, unknown> = {}) =>
    insertTestTransaction(db, {
      type: 'expense',
      amount,
      date,
      fromAccountId: account['Основная']!,
      categoryId: category['Продукты']!,
      ...patch,
    });
  return { db, account, category, expense };
}

const TODAY = '2026-10-15';

describe('getRecentAmounts', () => {
  it('самые частые суммы: чаще → позже → меньше, не больше трёх', async () => {
    const { db, category, expense } = await setup();
    expense(50000, '2026-10-01');
    expense(50000, '2026-10-02');
    expense(50000, '2026-10-03');
    expense(124000, '2026-10-05');
    expense(124000, '2026-10-06');
    expense(30000, '2026-10-14'); // раз, но позже всех
    expense(20000, '2026-10-10'); // раз, раньше
    expense(10000, '2026-10-10'); // раз, раньше, меньше
    expect(await getRecentAmounts(db, category['Продукты']!, TODAY)).toEqual([50000, 124000, 30000]);
    expect(await getRecentAmounts(db, category['Продукты']!, TODAY, 5)).toEqual([50000, 124000, 30000, 10000, 20000]);
  });

  it('окно — 30 дней включая сегодня: 17 сентября уже вне, 16-е ещё внутри', async () => {
    const { db, category, expense } = await setup();
    expense(111, '2026-09-15');
    expense(222, '2026-09-16');
    expect(await getRecentAmounts(db, category['Продукты']!, TODAY)).toEqual([222]);
    expense(333, '2026-09-17');
    expect(await getRecentAmounts(db, category['Продукты']!, '2026-10-16')).toEqual([333]);
  });

  it('удалённые операции и чужие категории не учитываются', async () => {
    const { db, category, expense } = await setup();
    expense(70000, '2026-10-10', { deletedAt: Date.now() });
    expense(80000, '2026-10-10', { categoryId: category['Кафе']! });
    expect(await getRecentAmounts(db, category['Продукты']!, TODAY)).toEqual([]);
  });

  it('без операций — пусто', async () => {
    const { db, category } = await setup();
    expect(await getRecentAmounts(db, category['Кафе']!, TODAY)).toEqual([]);
  });
});

describe('getLastAccountForCategory', () => {
  it('счёт самой поздней операции категории', async () => {
    const { db, account, category, expense } = await setup();
    expense(1000, '2026-10-01', { fromAccountId: account['Основная']! });
    expense(1000, '2026-10-09', { fromAccountId: account['Накопления']! });
    expect(await getLastAccountForCategory(db, category['Продукты']!)).toBe(account['Накопления']);
  });

  it('при одной дате побеждает позже созданная запись', async () => {
    const { db, account, category, expense } = await setup();
    expense(1000, '2026-10-09', { fromAccountId: account['Основная']!, createdAt: 1000 });
    expense(1000, '2026-10-09', { fromAccountId: account['Накопления']!, createdAt: 2000 });
    expect(await getLastAccountForCategory(db, category['Продукты']!)).toBe(account['Накопления']);
  });

  it('доход: счёт зачисления; удалённые пропускаются; нет операций — null', async () => {
    const { db, account, category, expense } = await setup();
    expect(await getLastAccountForCategory(db, category['Продукты']!)).toBeNull();
    insertTestTransaction(db, {
      type: 'income',
      amount: 5000000,
      date: '2026-10-01',
      toAccountId: account['Накопления']!,
      categoryId: category['Зарплата']!,
    });
    expect(await getLastAccountForCategory(db, category['Зарплата']!)).toBe(account['Накопления']);
    expense(1000, '2026-10-12', { fromAccountId: account['Накопления']!, deletedAt: Date.now() });
    expense(1000, '2026-10-02', { fromAccountId: account['Основная']! });
    expect(await getLastAccountForCategory(db, category['Продукты']!)).toBe(account['Основная']);
  });
});
