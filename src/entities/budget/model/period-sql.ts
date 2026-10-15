import { type SQL, type SQLWrapper, sql } from 'drizzle-orm';

/**
 * Период 'YYYY-MM' для даты 'YYYY-MM-DD' при начале месяца startDay (1–28) — SQL-двойник periodOf().
 * Сдвиг назад на (startDay − 1) дней: дата до начала периода попадает в предыдущий месяц.
 */
export function periodOfSql(date: SQLWrapper | string, startDay: number): SQL<string> {
  return sql<string>`strftime('%Y-%m', ${date}, ${`-${startDay - 1} days`})`;
}
