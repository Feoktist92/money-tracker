import { eq } from 'drizzle-orm';

import { categories } from '@/shared/db/schema';
import { createTestDb, seededIds } from '@/shared/db/testing';

import { listCategories } from './categories';

describe('listCategories', () => {
  it('доходы и расходы сида в порядке сортировки', async () => {
    const db = createTestDb();
    await seededIds(db);
    expect((await listCategories(db, 'income')).map((c) => c.name)).toEqual(['Зарплата', 'Подработка']);
    expect((await listCategories(db, 'expense')).map((c) => c.name)).toEqual([
      'Продукты',
      'Дом и ЖКХ',
      'Кафе',
      'Одежда',
      'Транспорт',
      'Развлечения',
      'Здоровье',
      'Подписки',
    ]);
  });

  it('архивные категории не показываются', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await db.update(categories).set({ archived: true }).where(eq(categories.id, category['Подработка']!));
    expect((await listCategories(db, 'income')).map((c) => c.name)).toEqual(['Зарплата']);
  });
});
