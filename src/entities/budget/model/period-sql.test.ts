import { sql } from 'drizzle-orm';

import { createTestDb } from '@/shared/db/testing';
import { addDays, periodOf } from '@/shared/lib/period';

import { periodOfSql } from './period-sql';

describe('periodOfSql совпадает с periodOf', () => {
  it('для каждого дня 2027–2028 (включая високосный февраль) и каждого начала месяца 1–28', () => {
    const db = createTestDb();
    const mismatches: string[] = [];
    for (let startDay = 1; startDay <= 28; startDay += 1) {
      for (let date = '2027-01-01'; date <= '2028-12-31'; date = addDays(date, 1)) {
        const row = db.get<{ p: string }>(sql`select ${periodOfSql(date, startDay)} as p`);
        if (row.p !== periodOf(date, startDay))
          mismatches.push(`${date} / ${startDay}: ${row.p} ≠ ${periodOf(date, startDay)}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
