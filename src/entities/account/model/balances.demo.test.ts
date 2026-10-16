import { seedDemo } from '@/shared/db/seed';
import { createTestDb, seededIds } from '@/shared/db/testing';

import { getAccountBalances } from './balances';

it('балансы демо-данных — как в лотке макета', async () => {
  const db = createTestDb();
  await seedDemo(db, '2026-10-15');
  const { account } = await seededIds(db);
  const balances = await getAccountBalances(db);
  expect(balances[account['Основная']!]).toBe(4_821_500);
  expect(balances[account['Накопления']!]).toBe(1_264_000);
});
