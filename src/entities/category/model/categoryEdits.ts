import { and, asc, eq, inArray, max, ne, sql } from 'drizzle-orm';

import { categories } from '@/shared/db/schema';
import type { Category, Db } from '@/shared/db/types';
import { newId } from '@/shared/lib/id';
import type { Kopecks } from '@/shared/lib/money';
import { freeName } from '@/shared/lib/unique-name';

/** Поля категории, которые задаёт пользователь в форме. Вид (расход или доход) задаётся при создании и дальше не меняется. */
export interface CategoryInput {
  name: string;
  kind: Category['kind'];
  icon: string;
  /** Ключ цвета (categoryColors). */
  color: string;
  /** Месячный лимит; null — без лимита. У дохода всегда null. */
  monthlyLimit: Kopecks | null;
}

async function nextSortOrder(db: Db, kind: Category['kind']): Promise<number> {
  const row = await db
    .select({ top: max(categories.sortOrder) })
    .from(categories)
    .where(eq(categories.kind, kind))
    .get();
  return (row?.top ?? -1) + 1;
}

/** Создаёт категорию в конце списка своего вида и возвращает её id. */
export async function createCategory(db: Db, input: CategoryInput): Promise<string> {
  const id = newId();
  await db.insert(categories).values({
    id,
    ...input,
    name: input.name.trim(),
    monthlyLimit: input.kind === 'income' ? null : input.monthlyLimit,
    sortOrder: await nextSortOrder(db, input.kind),
  });
  return id;
}

/** Правка категории; вид не меняется. */
export async function updateCategory(db: Db, id: string, patch: Partial<Omit<CategoryInput, 'kind'>>): Promise<void> {
  const next = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
  await db.update(categories).set(next).where(eq(categories.id, id));
}

/**
 * Архив: категория пропадает из мозаики и лотка, операции остаются. Возврат ставит её в конец списка своего вида; если
 * среди активных категорий того же вида уже есть такое название, возвращённая получает «(2)», «(3)»… — возврат
 * никогда не отказывает и не создаёт двух одинаковых активных названий. Результат — итоговое название; null —
 * такой категории нет.
 */
export async function setCategoryArchived(db: Db, id: string, archived: boolean): Promise<{ name: string } | null> {
  const row = await getCategory(db, id);
  if (!row) return null;
  if (archived) {
    await db.update(categories).set({ archived: true }).where(eq(categories.id, id));
    return { name: row.name };
  }
  const active = await db
    .select({ name: categories.name })
    .from(categories)
    .where(and(eq(categories.archived, false), eq(categories.kind, row.kind), ne(categories.id, id)));
  const name = freeName(
    row.name,
    active.map((c) => c.name),
  );
  await db
    .update(categories)
    .set({ archived: false, sortOrder: await nextSortOrder(db, row.kind), name })
    .where(eq(categories.id, id));
  return { name };
}

/** Новый порядок категорий одного вида (см. reorderAccounts). */
export async function reorderCategories(db: Db, orderedIds: readonly string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const cases = sql.join(
    orderedIds.map((id, index) => sql`WHEN ${id} THEN ${index}`),
    sql` `,
  );
  await db
    .update(categories)
    .set({ sortOrder: sql`CASE ${categories.id} ${cases} END` })
    .where(inArray(categories.id, [...orderedIds]));
}

/** Категория по id, в том числе архивная (для формы правки); null — такой нет. */
export async function getCategory(db: Db, id: string): Promise<Category | null> {
  return (await db.select().from(categories).where(eq(categories.id, id)).get()) ?? null;
}

export async function listArchivedCategories(db: Db, kind: Category['kind']): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.kind, kind), eq(categories.archived, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}
