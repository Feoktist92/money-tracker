import { seedDemo } from '@/shared/db/demo';
import { createTestDb } from '@/shared/db/test-db';
import { seededIds } from '@/shared/db/test-fixtures';

import { getAccountBalances } from './balances';

it('балансы демо-данных — как в лотке макета', async () => {
  const db = createTestDb();
  await seedDemo(db, '2026-10-15');
  const { account } = await seededIds(db);
  const balances = await getAccountBalances(db);
  expect(balances[account['Основная']!]).toBe(4_821_500);
  expect(balances[account['Накопления']!]).toBe(1_264_000);
  expect(balances[account['Наличные']!]).toBe(350_000);
});
