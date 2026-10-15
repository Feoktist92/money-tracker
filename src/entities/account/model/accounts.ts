import { asc, eq } from 'drizzle-orm';

import { accounts } from '@/shared/db/schema';
import type { Account, Db } from '@/shared/db/types';

/** Активные счета в порядке, заданном пользователем. */
export async function listAccounts(db: Db): Promise<Account[]> {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.archived, false))
    .orderBy(asc(accounts.sortOrder), asc(accounts.name));
}
