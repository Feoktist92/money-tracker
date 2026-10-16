import { eq } from 'drizzle-orm';

import { accounts, categories } from '../schema';
import { seedDefaults } from './seed';
import { createTestDb } from '../testing';

describe('seedDefaults', () => {
  it('на пустой базе создаёт 2 счёта и 10 категорий', async () => {
    const db = createTestDb();
    expect(await seedDefaults(db)).toBe(true);
    expect(await db.$count(accounts)).toBe(2);
    expect(await db.$count(categories)).toBe(10);
    expect(await db.$count(categories, eq(categories.kind, 'expense'))).toBe(8);
  });

  it('лимиты в копейках, перенос выключен', async () => {
    const db = createTestDb();
    await seedDefaults(db);
    const food = await db.select().from(categories).where(eq(categories.name, 'Продукты')).get();
    expect(food).toMatchObject({ monthlyLimit: 1_800_000, carryMode: 'none', carryStart: null, archived: false });
  });

  it('повторный вызов ничего не дублирует', async () => {
    const db = createTestDb();
    await seedDefaults(db);
    expect(await seedDefaults(db)).toBe(false);
    expect(await db.$count(accounts)).toBe(2);
    expect(await db.$count(categories)).toBe(10);
  });

  it('не пересоздаёт удалённое пользователем', async () => {
    const db = createTestDb();
    await seedDefaults(db);
    await db.delete(categories).where(eq(categories.name, 'Подписки'));
    expect(await seedDefaults(db)).toBe(false);
    expect(await db.$count(categories)).toBe(9);
  });
});
