import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';

import { categories, limitOverrides, transactions } from '@/shared/db/schema';
import type { Db } from '@/shared/db/types';
import { computeCategoryMonths } from '@/shared/lib/carry';
import { divideKopecks, type Kopecks } from '@/shared/lib/money';
import { type DateKey, daysLeftInPeriod, type PeriodKey, periodOf, periodRange } from '@/shared/lib/period';

export type TileState = 'normal' | 'near' | 'over';

/** Нужная сводке часть настроек. Структурно совместима с AppSettings из entities/settings: срезы одного слоя друг друга не импортируют. */
export interface BudgetSettings {
  monthStartDay: number;
  nearThreshold: number;
}

export interface BudgetRow {
  categoryId: string;
  name: string;
  icon: string;
  hasLimit: boolean;
  limit: Kopecks;
  carryIn: Kopecks;
  available: Kopecks;
  spent: Kopecks;
  remaining: Kopecks;
  state: TileState;
}

export interface BudgetOverview {
  period: PeriodKey;
  startDay: number;
  daysLeft: number;
  rows: BudgetRow[];
  /** Итоги — только по категориям с лимитом. */
  totalAvailable: Kopecks;
  totalCarry: Kopecks;
  totalSpent: Kopecks;
  totalRemaining: Kopecks;
  perDay: Kopecks;
}

export function tileState(available: Kopecks, spent: Kopecks, nearThreshold: number): TileState {
  if (spent > available) return 'over';
  if (available > 0 && spent / available >= nearThreshold) return 'near';
  return 'normal';
}

export async function getBudgetOverview(db: Db, today: DateKey, settings: BudgetSettings): Promise<BudgetOverview> {
  const startDay = settings.monthStartDay;
  const period = periodOf(today, startDay);
  const { endExclusive } = periodRange(period, startDay);

  const cats = await db
    .select()
    .from(categories)
    .where(and(eq(categories.kind, 'expense'), eq(categories.archived, false)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  // Тот же период, что periodOf(): сдвиг даты назад на (startDay − 1) дней даёт месяц периода.
  const periodOfDate = sql<string>`strftime('%Y-%m', ${transactions.date}, ${`-${startDay - 1} days`})`;
  const spentRows = await db
    .select({
      categoryId: transactions.categoryId,
      period: periodOfDate,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(eq(transactions.type, 'expense'), isNull(transactions.deletedAt), lt(transactions.date, endExclusive)))
    .groupBy(transactions.categoryId, periodOfDate);
  const overrideRows = await db.select().from(limitOverrides);

  const spentByCategory = new Map<string, Record<PeriodKey, Kopecks>>();
  for (const row of spentRows) {
    if (!row.categoryId) continue;
    const map = spentByCategory.get(row.categoryId) ?? {};
    map[row.period] = row.total;
    spentByCategory.set(row.categoryId, map);
  }
  const overridesByCategory = new Map<string, Record<PeriodKey, Kopecks>>();
  for (const row of overrideRows) {
    const map = overridesByCategory.get(row.categoryId) ?? {};
    map[row.period] = row.amount;
    overridesByCategory.set(row.categoryId, map);
  }

  const rows: BudgetRow[] = cats.map((c) => {
    const overrides = overridesByCategory.get(c.id) ?? {};
    const months = computeCategoryMonths(
      {
        monthlyLimit: c.monthlyLimit,
        carryMode: c.carryMode,
        carryStart: c.carryStart,
        overrides,
        spent: spentByCategory.get(c.id) ?? {},
      },
      period,
    );
    const month = months[months.length - 1]!;
    const hasLimit = c.monthlyLimit !== null || overrides[period] !== undefined;
    return {
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      hasLimit,
      limit: month.limit,
      carryIn: month.carryIn,
      available: month.available,
      spent: month.spent,
      remaining: month.closing,
      state: hasLimit ? tileState(month.available, month.spent, settings.nearThreshold) : 'normal',
    };
  });

  const limited = rows.filter((r) => r.hasLimit);
  const sum = (pick: (r: BudgetRow) => Kopecks) => limited.reduce((acc, r) => acc + pick(r), 0);
  const daysLeft = daysLeftInPeriod(today, startDay);
  const totalRemaining = sum((r) => r.remaining);
  return {
    period,
    startDay,
    daysLeft,
    rows,
    totalAvailable: sum((r) => r.available),
    totalCarry: sum((r) => r.carryIn),
    totalSpent: sum((r) => r.spent),
    totalRemaining,
    perDay: Math.max(0, divideKopecks(totalRemaining, daysLeft)),
  };
}
