import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from '../schema';

/** Общий тип для expo-sqlite (приложение) и better-sqlite3 (тесты): оба драйвера синхронные. */
export type Db = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export type Account = typeof schema.accounts.$inferSelect;
export type Category = typeof schema.categories.$inferSelect;
export type Transaction = typeof schema.transactions.$inferSelect;
