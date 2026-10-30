import { eq } from 'drizzle-orm';

import { seedDemo } from '@/shared/db/seed';
import { categories, limitOverrides, transactions } from '@/shared/db/schema';
import { createTestDb, insertTestTransaction, seededIds } from '@/shared/db/testing';

import { type BudgetRow, type BudgetSettings, getBudgetOverview, projectExpense, tileState } from './overview';

const TODAY = '2026-10-15';
const SETTINGS: BudgetSettings = { monthStartDay: 1, nearThreshold: 0.9 };

async function demoOverview() {
  const db = createTestDb();
  await seedDemo(db, TODAY);
  const overview = await getBudgetOverview(db, TODAY, SETTINGS);
  const row = (name: string) => overview.rows.find((r) => r.name === name)!;
  return { db, overview, row };
}

describe('getBudgetOverview на демо-данных макета C', () => {
  it('шапка: осталось 22 390 ₽, перенос 2 500 ₽, 17 дней, по 1 317 ₽', async () => {
    const { overview } = await demoOverview();
    expect(overview).toMatchObject({
      period: '2026-10',
      daysLeft: 17,
      totalAvailable: 6_450_000,
      totalCarry: 250_000,
      totalSpent: 4_211_000,
      totalRemaining: 2_239_000,
      perDay: 131_705,
    });
  });

  it('плитки в порядке сида с остатками и состояниями из макета', async () => {
    const { overview } = await demoOverview();
    expect(overview.rows.map((r) => [r.name, r.remaining, r.state])).toEqual([
      ['Продукты', 676_000, 'normal'],
      ['Дом и ЖКХ', 38_000, 'near'],
      ['Кафе', -86_000, 'over'],
      ['Одежда', 280_000, 'normal'],
      ['Транспорт', 259_000, 'normal'],
      ['Развлечения', 456_000, 'normal'],
      ['Здоровье', 600_000, 'normal'],
      ['Подписки', 16_000, 'near'],
    ]);
  });

  it('перенос: Развлечения +700, Здоровье +1 800 (доступно 6 800)', async () => {
    const { row } = await demoOverview();
    expect(row('Развлечения')).toMatchObject({ limit: 600_000, carryIn: 70_000, available: 670_000, spent: 214_000 });
    expect(row('Здоровье')).toMatchObject({ limit: 500_000, carryIn: 180_000, available: 680_000, spent: 80_000 });
  });

  it('повторная загрузка демо даёт ту же картину', async () => {
    const { db, overview } = await demoOverview();
    await seedDemo(db, TODAY);
    expect(await getBudgetOverview(db, TODAY, SETTINGS)).toEqual(overview);
  });

  it('удалённая трата не входит в spent', async () => {
    const { db } = await demoOverview();
    const { account, category } = await seededIds(db);
    insertTestTransaction(db, {
      type: 'expense',
      amount: 50_000,
      fromAccountId: account['Основная']!,
      categoryId: category['Продукты']!,
      date: TODAY,
      deletedAt: Date.now(),
    });
    const overview = await getBudgetOverview(db, TODAY, SETTINGS);
    expect(overview.rows.find((r) => r.name === 'Продукты')!.spent).toBe(1_124_000);
  });
});

describe('getBudgetOverview — периоды и лимиты', () => {
  it('начало месяца 10-го: трата 5-го относится к прошлому периоду', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    const base = { type: 'expense' as const, fromAccountId: account['Основная']!, categoryId: category['Кафе']! };
    insertTestTransaction(db, { ...base, amount: 100_000, date: '2026-10-05' });
    insertTestTransaction(db, { ...base, amount: 30_000, date: '2026-10-12' });
    const overview = await getBudgetOverview(db, TODAY, { ...SETTINGS, monthStartDay: 10 });
    expect(overview.period).toBe('2026-10');
    expect(overview.daysLeft).toBe(26);
    expect(overview.rows.find((r) => r.name === 'Кафе')!.spent).toBe(30_000);
  });

  it('перенос при начале месяца 10-го считает траты по периодам, а не по календарю', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    await db
      .update(categories)
      .set({ carryMode: 'surplus', carryStart: '2026-09' })
      .where(eq(categories.id, category['Кафе']!));
    // 2026-10-05 — ещё сентябрьский период (10 сен – 9 окт): лимит 7 000, потрачено 1 000 → +6 000
    insertTestTransaction(db, {
      type: 'expense',
      amount: 100_000,
      fromAccountId: account['Основная']!,
      categoryId: category['Кафе']!,
      date: '2026-10-05',
    });
    const overview = await getBudgetOverview(db, TODAY, { ...SETTINGS, monthStartDay: 10 });
    expect(overview.rows.find((r) => r.name === 'Кафе')).toMatchObject({
      carryIn: 600_000,
      available: 1_300_000,
      spent: 0,
    });
  });

  it('переопределение лимита на текущий период', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await db.insert(limitOverrides).values({ categoryId: category['Одежда']!, period: '2026-10', amount: 1_500_000 });
    const overview = await getBudgetOverview(db, TODAY, SETTINGS);
    expect(overview.rows.find((r) => r.name === 'Одежда')).toMatchObject({ limit: 1_500_000, available: 1_500_000 });
  });

  it('категория без лимита и архивная не входят в итоги', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    await db.update(categories).set({ monthlyLimit: null }).where(eq(categories.id, category['Подписки']!));
    await db.update(categories).set({ archived: true }).where(eq(categories.id, category['Одежда']!));
    insertTestTransaction(db, {
      type: 'expense',
      amount: 99_000,
      fromAccountId: account['Основная']!,
      categoryId: category['Подписки']!,
      date: TODAY,
    });
    const overview = await getBudgetOverview(db, TODAY, SETTINGS);
    expect(overview.rows.map((r) => r.name)).not.toContain('Одежда');
    expect(overview.rows.find((r) => r.name === 'Подписки')).toMatchObject({
      hasLimit: false,
      spent: 99_000,
      state: 'normal',
    });
    expect(overview.totalSpent).toBe(0);
    expect(overview.totalAvailable).toBe(6_200_000 - 800_000 - 250_000);
  });

  it('перерасход по всем категориям: perDay не уходит в минус', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    insertTestTransaction(db, {
      type: 'expense',
      amount: 9_000_000,
      fromAccountId: account['Основная']!,
      categoryId: category['Кафе']!,
      date: TODAY,
    });
    const overview = await getBudgetOverview(db, TODAY, SETTINGS);
    expect(overview.totalRemaining).toBeLessThan(0);
    expect(overview.perDay).toBe(0);
  });

  it('доходы и переводы не считаются тратами', async () => {
    const db = createTestDb();
    const { account, category } = await seededIds(db);
    insertTestTransaction(db, {
      type: 'income',
      amount: 500_000,
      toAccountId: account['Основная']!,
      categoryId: category['Зарплата']!,
      date: TODAY,
    });
    insertTestTransaction(db, {
      type: 'transfer',
      amount: 500_000,
      fromAccountId: account['Основная']!,
      toAccountId: account['Накопления']!,
      date: TODAY,
    });
    expect((await getBudgetOverview(db, TODAY, SETTINGS)).totalSpent).toBe(0);
    expect(await db.$count(transactions)).toBe(2);
  });
});

describe('tileState', () => {
  it.each([
    [100_000, 0, 'normal'],
    [100_000, 89_999, 'normal'],
    [100_000, 90_000, 'near'],
    [100_000, 100_000, 'near'],
    [100_000, 100_001, 'over'],
    [0, 0, 'normal'],
    [0, 1, 'over'],
    [-5_000, 0, 'over'],
  ])('available %p, spent %p → %p', (available, spent, expected) => {
    expect(tileState(available, spent, 0.9)).toBe(expected);
  });
});

describe('цвет категории в строке бюджета', () => {
  it('строка несёт ключ цвета категории из базы', async () => {
    const { db, overview } = await demoOverview();
    expect(overview.rows.every((r) => r.color === 'violet')).toBe(true);
    const { category } = await seededIds(db);
    await db.update(categories).set({ color: 'teal' }).where(eq(categories.id, category['Кафе']!));
    const next = await getBudgetOverview(db, TODAY, SETTINGS);
    expect(next.rows.find((r) => r.name === 'Кафе')!.color).toBe('teal');
    expect(next.rows.find((r) => r.name === 'Продукты')!.color).toBe('violet');
  });
});

describe('projectExpense', () => {
  const base: BudgetRow = {
    categoryId: 'c',
    name: 'Продукты',
    icon: 'shopping-basket',
    color: 'violet',
    hasLimit: true,
    limit: 1_800_000,
    carryIn: 0,
    available: 1_800_000,
    spent: 1_124_000,
    remaining: 676_000,
    state: 'normal',
  };

  it('прибавляет трату и уменьшает остаток, исходная строка не меняется', () => {
    const next = projectExpense(base, 124_000, 0.9);
    expect(next).toMatchObject({ spent: 1_248_000, remaining: 552_000, state: 'normal' });
    expect(base.spent).toBe(1_124_000);
  });

  it('состояние пересчитывается: «почти» с 90%, «перерасход» выше доступного', () => {
    expect(projectExpense(base, 500_000, 0.9).state).toBe('near');
    const over = projectExpense(base, 800_000, 0.9);
    expect(over).toMatchObject({ remaining: -124_000, state: 'over' });
  });

  it('категория без лимита остаётся «обычной», тратится только spent', () => {
    const free: BudgetRow = { ...base, hasLimit: false, limit: 0, available: 0, spent: 5_000, remaining: 0 };
    const next = projectExpense(free, 10_000, 0.9);
    expect(next.state).toBe('normal');
    expect(next.spent).toBe(15_000);
  });
});
