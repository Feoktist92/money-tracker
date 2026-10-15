import { and, isNotNull, isNull, sql } from 'drizzle-orm';

import { accounts, transactions } from '@/shared/db/schema';
import type { Db } from '@/shared/db/types';
import type { Kopecks } from '@/shared/lib/money';

/** Баланс каждого счёта: initialBalance + входящие − исходящие, без удалённых операций. */
export async function getAccountBalances(db: Db): Promise<Record<string, Kopecks>> {
  const rows = await db.select({ id: accounts.id, initial: accounts.initialBalance }).from(accounts);
  const incoming = await db
    .select({
      accountId: transactions.toAccountId,
      total: sql<number>`sum(coalesce(${transactions.toAmount}, ${transactions.amount}))`,
    })
    .from(transactions)
    .where(and(isNull(transactions.deletedAt), isNotNull(transactions.toAccountId)))
    .groupBy(transactions.toAccountId);
  const outgoing = await db
    .select({ accountId: transactions.fromAccountId, total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .where(and(isNull(transactions.deletedAt), isNotNull(transactions.fromAccountId)))
    .groupBy(transactions.fromAccountId);

  const balances: Record<string, Kopecks> = {};
  for (const row of rows) balances[row.id] = row.initial;
  for (const row of incoming) if (row.accountId) balances[row.accountId] = (balances[row.accountId] ?? 0) + row.total;
  for (const row of outgoing) if (row.accountId) balances[row.accountId] = (balances[row.accountId] ?? 0) - row.total;
  return balances;
}
