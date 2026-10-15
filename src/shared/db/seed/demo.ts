import { eq } from 'drizzle-orm';

import { newId } from '@/shared/lib/id';
import { addDays, type DateKey, periodOf, periodRange, shiftPeriod } from '@/shared/lib/period';

import { accounts, categories, limitOverrides, settings, transactions, transactionTags } from '../schema';
import { DEFAULT_CATEGORIES, seedDefaults } from './seed';
import type { Db } from '../types';

type NewTransactionRow = typeof transactions.$inferInsert;

/**
 * Данные главного экрана макета C («Монеты — варианты дизайна», C-main): осталось 22 390 ₽,
 * перенос 700 (Развлечения) и 1 800 (Здоровье), счета 48 215 / 12 640 / 3 500 ₽.
 * Стирает операции и переопределения лимитов, ставит начало месяца на 1-е. Только для разработки.
 */
export async function seedDemo(db: Db, today: DateKey): Promise<void> {
  await seedDefaults(db);
  const current = periodOf(today, 1);
  const startOf = (monthsAgo: number) => periodRange(shiftPeriod(current, -monthsAgo), 1).start;
  /** День текущего периода, но не позже сегодня. */
  const now = (offset: number) => {
    const day = addDays(startOf(0), offset);
    return day > today ? today : day;
  };
  const ago = (monthsAgo: number, offset: number) => addDays(startOf(monthsAgo), offset);

  db.transaction((tx) => {
    const accountId = Object.fromEntries(
      tx
        .select()
        .from(accounts)
        .all()
        .map((a) => [a.name, a.id]),
    );
    const categoryId = Object.fromEntries(
      tx
        .select()
        .from(categories)
        .all()
        .map((c) => [c.name, c.id]),
    );
    const acc = (name: string) => {
      const id = accountId[name];
      if (!id) throw new Error(`Демо-данные: нет счёта «${name}»`);
      return id;
    };
    const cat = (name: string) => {
      const id = categoryId[name];
      if (!id) throw new Error(`Демо-данные: нет категории «${name}»`);
      return id;
    };

    tx.delete(transactionTags).run();
    tx.delete(transactions).run();
    tx.delete(limitOverrides).run();

    for (const c of DEFAULT_CATEGORIES) {
      tx.update(categories)
        .set({ monthlyLimit: c.monthlyLimit ?? null, carryMode: 'none', carryStart: null })
        .where(eq(categories.id, cat(c.name)))
        .run();
    }
    tx.update(categories)
      .set({ carryMode: 'surplus', carryStart: shiftPeriod(current, -1) })
      .where(eq(categories.id, cat('Развлечения')))
      .run();
    tx.update(categories)
      .set({ carryMode: 'surplus', carryStart: shiftPeriod(current, -2) })
      .where(eq(categories.id, cat('Здоровье')))
      .run();

    tx.update(accounts)
      .set({ initialBalance: 1_232_500 })
      .where(eq(accounts.id, acc('Основная')))
      .run();
    tx.update(accounts)
      .set({ initialBalance: 264_000 })
      .where(eq(accounts.id, acc('Накопления')))
      .run();
    tx.update(accounts)
      .set({ initialBalance: 0 })
      .where(eq(accounts.id, acc('Наличные')))
      .run();

    tx.insert(settings)
      .values({ key: 'monthStartDay', value: '1' })
      .onConflictDoUpdate({ target: settings.key, set: { value: '1', updatedAt: Date.now() } })
      .run();

    const main = acc('Основная');
    const expense = (category: string, rub: number, date: DateKey, from = main): NewTransactionRow => ({
      id: newId(),
      type: 'expense',
      amount: rub * 100,
      fromAccountId: from,
      categoryId: cat(category),
      date,
    });
    const income = (category: string, rub: number, date: DateKey): NewTransactionRow => ({
      id: newId(),
      type: 'income',
      amount: rub * 100,
      toAccountId: main,
      categoryId: cat(category),
      date,
    });
    const transfer = (to: string, rub: number, date: DateKey): NewTransactionRow => ({
      id: newId(),
      type: 'transfer',
      amount: rub * 100,
      fromAccountId: main,
      toAccountId: acc(to),
      date,
    });

    tx.insert(transactions)
      .values([
        // два месяца назад: «Здоровье» 4 400 из 5 000 → +600
        expense('Здоровье', 4400, ago(2, 9)),
        // прошлый месяц: «Развлечения» 5 300 из 6 000 → +700; «Здоровье» 3 800 из 5 600 → +1 800
        income('Зарплата', 45000, ago(1, 0)),
        expense('Развлечения', 5300, ago(1, 12)),
        expense('Здоровье', 3800, ago(1, 20)),
        // текущий месяц
        income('Зарплата', 45000, now(0)),
        income('Подработка', 15000, now(9)),
        transfer('Накопления', 10000, now(1)),
        transfer('Наличные', 5000, now(2)),
        expense('Продукты', 3640, now(1)),
        expense('Продукты', 4200, now(6)),
        expense('Продукты', 3400, now(13)),
        expense('Дом и ЖКХ', 9120, now(4)),
        expense('Кафе', 1500, now(5), acc('Наличные')),
        expense('Кафе', 6360, now(11)),
        expense('Одежда', 5200, now(8)),
        expense('Транспорт', 3410, now(3)),
        expense('Развлечения', 2140, now(7)),
        expense('Здоровье', 800, now(10)),
        expense('Подписки', 2340, now(2)),
      ])
      .run();
  });
}
