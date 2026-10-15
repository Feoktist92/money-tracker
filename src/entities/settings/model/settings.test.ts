import { settings } from '@/shared/db/schema';
import { createTestDb } from '@/shared/db/test-db';

import { DEFAULT_SETTINGS, getSettings, setSetting } from './settings';

describe('settings', () => {
  it('пустая база → значения по умолчанию', async () => {
    expect(await getSettings(createTestDb())).toEqual(DEFAULT_SETTINGS);
  });

  it('setSetting сохраняет и перезаписывает', async () => {
    const db = createTestDb();
    await setSetting(db, 'monthStartDay', 10);
    await setSetting(db, 'monthStartDay', 25);
    expect((await getSettings(db)).monthStartDay).toBe(25);
    expect(await db.$count(settings)).toBe(1);
  });

  it('setSetting бросает на недопустимом значении', async () => {
    const db = createTestDb();
    await expect(setSetting(db, 'monthStartDay', 29)).rejects.toThrow(RangeError);
    await expect(setSetting(db, 'nearThreshold', 0)).rejects.toThrow(RangeError);
  });

  it('битый JSON и чужие ключи не ломают чтение', async () => {
    const db = createTestDb();
    await db.insert(settings).values([
      { key: 'monthStartDay', value: '{oops' },
      { key: 'nearThreshold', value: '5' },
      { key: 'toString', value: '"x"' },
    ]);
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
  });
});
