import { newId } from '@/shared/lib/id';

import { accounts, categories, transactions } from './schema';
import { seedDefaults } from './seed';
import type { Db } from './types';

/** id счетов и категорий сида по имени — для тестов запросов. */
export async function seededIds(
  db: Db,
): Promise<{ account: Record<string, string>; category: Record<string, string> }> {
  await seedDefaults(db);
  const account = Object.fromEntries((await db.select().from(accounts)).map((a) => [a.name, a.id]));
  const category = Object.fromEntries((await db.select().from(categories)).map((c) => [c.name, c.id]));
  return { account, category };
}

/** Запись операции напрямую в таблицу, минуя сущность transaction: тестам других срезов нельзя её импортировать. */
export function insertTestTransaction(db: Db, tx: Omit<typeof transactions.$inferInsert, 'id'>): string {
  const id = newId();
  db.insert(transactions)
    .values({ ...tx, id })
    .run();
  return id;
}
