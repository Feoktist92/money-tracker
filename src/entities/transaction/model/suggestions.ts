import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';

import { transactions } from '@/shared/db/schema';
import type { Db } from '@/shared/db/types';
import type { Kopecks } from '@/shared/lib/money';
import { addDays, type DateKey } from '@/shared/lib/period';

/** Окно «недавних» сумм: последние 30 дней включая сегодня. */
const RECENT_DAYS = 30;

/**
 * Самые частые суммы по категории за последние 30 дней (чипы шторки ввода). Порядок: чаще → позже → меньше.
 * Учитываются расходы и доходы с этой категорией; удалённые операции — нет.
 */
export async function getRecentAmounts(db: Db, categoryId: string, today: DateKey, limit = 3): Promise<Kopecks[]> {
  const since = addDays(today, -(RECENT_DAYS - 1));
  const rows = await db
    .select({
      amount: transactions.amount,
      uses: sql<number>`count(*)`,
      latest: sql<string>`max(${transactions.date})`,
    })
    .from(transactions)
    .where(and(eq(transactions.categoryId, categoryId), isNull(transactions.deletedAt), gte(transactions.date, since)))
    .groupBy(transactions.amount)
    .orderBy(desc(sql`count(*)`), desc(sql`max(${transactions.date})`), transactions.amount)
    .limit(limit);
  return rows.map((row) => row.amount);
}

/**
 * Счёт, которым в последний раз пользовались для категории (расход — откуда, доход — куда); null, если операций не было.
 * Нужен, чтобы тап по плитке сразу открывал шторку с привычным счётом.
 */
export async function getLastAccountForCategory(db: Db, categoryId: string): Promise<string | null> {
  const row = await db
    .select({ from: transactions.fromAccountId, to: transactions.toAccountId, type: transactions.type })
    .from(transactions)
    .where(and(eq(transactions.categoryId, categoryId), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(1)
    .get();
  if (!row) return null;
  return row.type === 'income' ? row.to : row.from;
}
