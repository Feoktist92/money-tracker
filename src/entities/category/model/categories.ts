import { and, asc, eq } from 'drizzle-orm';

import { categories } from '@/shared/db/schema';
import type { Category, Db } from '@/shared/db/types';

/** Активные категории одного вида (доходы или расходы) в порядке, заданном пользователем. */
export async function listCategories(db: Db, kind: Category['kind']): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.kind, kind), eq(categories.archived, false)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}
