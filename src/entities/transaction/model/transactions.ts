import { eq } from 'drizzle-orm';

import { transactions } from '@/shared/db/schema';
import type { Db } from '@/shared/db/types';
import { newId } from '@/shared/lib/id';
import { type Kopecks, MAX_TRANSACTION_AMOUNT } from '@/shared/lib/money';
import { type DateKey, isDateKey } from '@/shared/lib/period';

export type NewTransaction =
  | { type: 'expense'; amount: Kopecks; fromAccountId: string; categoryId: string; date: DateKey; note?: string }
  | { type: 'income'; amount: Kopecks; toAccountId: string; categoryId: string; date: DateKey; note?: string }
  | {
      type: 'transfer';
      amount: Kopecks;
      /** Сколько зачислено на счёт-получатель, если отличается от списанного. */
      toAmount?: Kopecks;
      fromAccountId: string;
      toAccountId: string;
      date: DateKey;
      note?: string;
    };

function assertPositiveKopecks(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${field}: нужна положительная сумма в целых копейках, получено ${value}`);
  }
  if (value > MAX_TRANSACTION_AMOUNT) {
    throw new RangeError(
      `${field}: сумма больше предела ${MAX_TRANSACTION_AMOUNT} коп. (999 999 999,99 ₽), получено ${value}`,
    );
  }
}

/** Записывает операцию и возвращает её id. Бросает RangeError на некорректной сумме, дате или переводе на тот же счёт. */
export async function addTransaction(db: Db, tx: NewTransaction): Promise<string> {
  assertPositiveKopecks(tx.amount, 'amount');
  if (!isDateKey(tx.date)) throw new RangeError(`Некорректная дата операции: ${tx.date}`);
  const id = newId();
  const base = { id, type: tx.type, amount: tx.amount, date: tx.date, note: tx.note?.trim() || null };

  if (tx.type === 'expense') {
    await db.insert(transactions).values({ ...base, fromAccountId: tx.fromAccountId, categoryId: tx.categoryId });
  } else if (tx.type === 'income') {
    await db.insert(transactions).values({ ...base, toAccountId: tx.toAccountId, categoryId: tx.categoryId });
  } else {
    if (tx.fromAccountId === tx.toAccountId) throw new RangeError('Перевод на тот же счёт');
    if (tx.toAmount !== undefined) assertPositiveKopecks(tx.toAmount, 'toAmount');
    await db.insert(transactions).values({
      ...base,
      fromAccountId: tx.fromAccountId,
      toAccountId: tx.toAccountId,
      toAmount: tx.toAmount ?? null,
    });
  }
  return id;
}

/** Мягкое удаление: операция остаётся в базе, но не учитывается ни в балансах, ни в тратах. */
export async function softDeleteTransaction(db: Db, id: string): Promise<void> {
  await db.update(transactions).set({ deletedAt: Date.now() }).where(eq(transactions.id, id));
}
