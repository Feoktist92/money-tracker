import { createTestDb, seededIds } from '@/shared/db/testing';

import { listCategories } from './categories';
import {
  createCategory,
  getCategory,
  listArchivedCategories,
  reorderCategories,
  setCategoryArchived,
  updateCategory,
} from './categoryEdits';

const expense = { name: 'Спорт', kind: 'expense', icon: 'dumbbell', color: 'blue', monthlyLimit: 300000 } as const;

describe('createCategory', () => {
  it('расход создаётся в конце расходов, лимит и цвет сохраняются', async () => {
    const db = createTestDb();
    await seededIds(db);
    const id = await createCategory(db, { ...expense, name: ' Спорт ' });
    const list = await listCategories(db, 'expense');
    expect(list.at(-1)).toMatchObject({ id, name: 'Спорт', color: 'blue', monthlyLimit: 300000, icon: 'dumbbell' });
    expect(list).toHaveLength(9);
  });

  it('доход создаётся среди доходов и без лимита, даже если лимит передали', async () => {
    const db = createTestDb();
    await seededIds(db);
    const id = await createCategory(db, { ...expense, kind: 'income', name: 'Подарки', monthlyLimit: 100 });
    expect((await getCategory(db, id))!.monthlyLimit).toBeNull();
    expect((await listCategories(db, 'income')).map((c) => c.name)).toEqual(['Зарплата', 'Подработка', 'Подарки']);
  });

  it('порядок считается отдельно для каждого вида', async () => {
    const db = createTestDb();
    await seededIds(db);
    const income = await createCategory(db, { ...expense, kind: 'income', name: 'Кэшбэк', monthlyLimit: null });
    expect((await getCategory(db, income))!.sortOrder).toBe(2);
  });
});

describe('updateCategory', () => {
  it('меняет название, значок, цвет и лимит; лимит можно убрать', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await updateCategory(db, category['Кафе']!, { name: ' Кафе и бары ', color: 'magenta', icon: 'utensils' });
    await updateCategory(db, category['Кафе']!, { monthlyLimit: null });
    expect(await getCategory(db, category['Кафе']!)).toMatchObject({
      name: 'Кафе и бары',
      color: 'magenta',
      icon: 'utensils',
      monthlyLimit: null,
      kind: 'expense',
    });
  });
});

describe('архив', () => {
  it('архивная категория пропадает из мозаики и попадает в архив своего вида', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await setCategoryArchived(db, category['Кафе']!, true);
    expect((await listCategories(db, 'expense')).map((c) => c.name)).not.toContain('Кафе');
    expect((await listArchivedCategories(db, 'expense')).map((c) => c.name)).toEqual(['Кафе']);
    expect(await listArchivedCategories(db, 'income')).toEqual([]);
  });

  it('возврат ставит категорию в конец своего вида', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    await setCategoryArchived(db, category['Продукты']!, true);
    await setCategoryArchived(db, category['Продукты']!, false);
    expect((await listCategories(db, 'expense')).at(-1)!.name).toBe('Продукты');
  });

  it('возврат несуществующей категории ничего не ломает', async () => {
    const db = createTestDb();
    await expect(setCategoryArchived(db, 'нет', false)).resolves.toBeUndefined();
  });
});

describe('reorderCategories', () => {
  it('порядок плиток меняется целиком', async () => {
    const db = createTestDb();
    const { category } = await seededIds(db);
    const list = await listCategories(db, 'expense');
    const reversed = list.map((c) => c.id).reverse();
    await reorderCategories(db, reversed);
    expect((await listCategories(db, 'expense')).map((c) => c.id)).toEqual(reversed);
    expect((await listCategories(db, 'expense'))[0]!.id).toBe(category['Подписки']);
  });

  it('getCategory: несуществующий id — null', async () => {
    expect(await getCategory(createTestDb(), 'нет')).toBeNull();
  });
});
