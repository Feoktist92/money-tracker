import { eq } from 'drizzle-orm';

import { newId } from '@/shared/lib/id';

import { accounts, categories, settings } from './schema';
import type { Db } from './types';

/** Ключ в settings: сид уже выполнялся. Не входит в AppSettings. */
export const SEED_FLAG_KEY = 'seededAt';

type NewAccount = typeof accounts.$inferInsert;
type NewCategory = typeof categories.$inferInsert;

export const DEFAULT_ACCOUNTS: Omit<NewAccount, 'id'>[] = [
  { name: 'Основная', type: 'card', icon: 'credit-card', color: 'violet', sortOrder: 0 },
  { name: 'Накопления', type: 'savings', icon: 'piggy-bank', color: 'teal', sortOrder: 1 },
  { name: 'Наличные', type: 'cash', icon: 'banknote', color: 'amber', sortOrder: 2 },
];

export const DEFAULT_CATEGORIES: Omit<NewCategory, 'id'>[] = [
  { name: 'Зарплата', kind: 'income', icon: 'arrow-down-to-line', color: 'violet', sortOrder: 0 },
  { name: 'Подработка', kind: 'income', icon: 'laptop', color: 'violet', sortOrder: 1 },
  {
    name: 'Продукты',
    kind: 'expense',
    icon: 'shopping-basket',
    color: 'violet',
    sortOrder: 0,
    monthlyLimit: 1_800_000,
  },
  { name: 'Дом и ЖКХ', kind: 'expense', icon: 'house', color: 'violet', sortOrder: 1, monthlyLimit: 950_000 },
  { name: 'Кафе', kind: 'expense', icon: 'coffee', color: 'violet', sortOrder: 2, monthlyLimit: 700_000 },
  { name: 'Одежда', kind: 'expense', icon: 'shirt', color: 'violet', sortOrder: 3, monthlyLimit: 800_000 },
  { name: 'Транспорт', kind: 'expense', icon: 'bus', color: 'violet', sortOrder: 4, monthlyLimit: 600_000 },
  { name: 'Развлечения', kind: 'expense', icon: 'tv', color: 'violet', sortOrder: 5, monthlyLimit: 600_000 },
  { name: 'Здоровье', kind: 'expense', icon: 'heart', color: 'violet', sortOrder: 6, monthlyLimit: 500_000 },
  { name: 'Подписки', kind: 'expense', icon: 'refresh-cw', color: 'violet', sortOrder: 7, monthlyLimit: 250_000 },
];

/** Счета и категории по умолчанию. Выполняется один раз за жизнь базы; true — если сидировал сейчас. */
export async function seedDefaults(db: Db): Promise<boolean> {
  return db.transaction((tx) => {
    const done = tx.select().from(settings).where(eq(settings.key, SEED_FLAG_KEY)).get();
    if (done) return false;
    tx.insert(accounts)
      .values(DEFAULT_ACCOUNTS.map((a) => ({ ...a, id: newId() })))
      .run();
    tx.insert(categories)
      .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, id: newId() })))
      .run();
    tx.insert(settings)
      .values({ key: SEED_FLAG_KEY, value: JSON.stringify(Date.now()) })
      .run();
    return true;
  });
}
