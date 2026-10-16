import { eq } from 'drizzle-orm';

import { accounts } from '@/shared/db/schema';
import { createTestDb, seededIds } from '@/shared/db/testing';

import { listAccounts } from './accounts';

describe('listAccounts', () => {
  it('счета сида в порядке сортировки', async () => {
    const db = createTestDb();
    await seededIds(db);
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Основная', 'Накопления']);
  });

  it('архивные счета не показываются', async () => {
    const db = createTestDb();
    const { account } = await seededIds(db);
    await db.update(accounts).set({ archived: true }).where(eq(accounts.id, account['Накопления']!));
    expect((await listAccounts(db)).map((a) => a.name)).toEqual(['Основная']);
  });
});
