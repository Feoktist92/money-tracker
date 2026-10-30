import { asc, eq, inArray, max, sql } from 'drizzle-orm';

import { accounts } from '@/shared/db/schema';
import type { Account, Db } from '@/shared/db/types';
import { newId } from '@/shared/lib/id';
import type { Kopecks } from '@/shared/lib/money';

/** Поля счёта, которые задаёт пользователь в форме. */
export interface AccountInput {
  name: string;
  type: Account['type'];
  icon: string;
  /** Ключ цвета монеты (coinColors). */
  color: string;
  /** Остаток на момент заведения счёта; может быть отрицательным (овердрафт). */
  initialBalance: Kopecks;
}

async function nextSortOrder(db: Db): Promise<number> {
  const row = await db
    .select({ top: max(accounts.sortOrder) })
    .from(accounts)
    .get();
  return (row?.top ?? -1) + 1;
}

/** Создаёт счёт в конце списка и возвращает его id. */
export async function createAccount(db: Db, input: AccountInput): Promise<string> {
  const id = newId();
  await db.insert(accounts).values({ id, ...input, name: input.name.trim(), sortOrder: await nextSortOrder(db) });
  return id;
}

export async function updateAccount(db: Db, id: string, patch: Partial<AccountInput>): Promise<void> {
  const next = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
  await db.update(accounts).set(next).where(eq(accounts.id, id));
}

/** Архив: счёт пропадает из лотка и шторки, операции остаются. Возврат из архива ставит счёт в конец списка. */
export async function setAccountArchived(db: Db, id: string, archived: boolean): Promise<void> {
  if (archived) {
    await db.update(accounts).set({ archived: true }).where(eq(accounts.id, id));
    return;
  }
  await db
    .update(accounts)
    .set({ archived: false, sortOrder: await nextSortOrder(db) })
    .where(eq(accounts.id, id));
}

/**
 * Новый порядок активных счетов: sort_order = положение id в списке. Один запрос UPDATE … CASE, поэтому порядок
 * меняется целиком или не меняется совсем. Идёт по id, а не по индексам: два быстрых нажатия «выше» не путаются.
 */
export async function reorderAccounts(db: Db, orderedIds: readonly string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const cases = sql.join(
    orderedIds.map((id, index) => sql`WHEN ${id} THEN ${index}`),
    sql` `,
  );
  await db
    .update(accounts)
    .set({ sortOrder: sql`CASE ${accounts.id} ${cases} END` })
    .where(inArray(accounts.id, [...orderedIds]));
}

/** Счёт по id, в том числе архивный (для формы правки); null — такого нет. */
export async function getAccount(db: Db, id: string): Promise<Account | null> {
  return (await db.select().from(accounts).where(eq(accounts.id, id)).get()) ?? null;
}

export async function listArchivedAccounts(db: Db): Promise<Account[]> {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.archived, true))
    .orderBy(asc(accounts.sortOrder), asc(accounts.name));
}
