// Схема SQLite (PLAN §3) для фаз 1–4. recurring, rules и pending_ops добавятся миграциями в фазах 6–8.
// Файл читает drizzle-kit в Node: никаких алиасов '@/…' и импортов из приложения.
import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at')
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
};

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'card', 'savings', 'debt', 'goal'] }).notNull(),
  currency: text('currency').notNull().default('RUB'),
  initialBalance: integer('initial_balance').notNull().default(0),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  includeInTotal: integer('include_in_total', { mode: 'boolean' }).notNull().default(true),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  cardLast4: text('card_last4'),
  goalTarget: integer('goal_target'),
  goalDeadline: text('goal_deadline'),
  ...timestamps,
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  monthlyLimit: integer('monthly_limit'),
  carryMode: text('carry_mode', { enum: ['none', 'surplus', 'surplus_debt'] })
    .notNull()
    .default('none'),
  carryStart: text('carry_start'),
  ...timestamps,
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
    amount: integer('amount').notNull(),
    toAmount: integer('to_amount'),
    fromAccountId: text('from_account_id').references(() => accounts.id),
    toAccountId: text('to_account_id').references(() => accounts.id),
    categoryId: text('category_id').references(() => categories.id),
    date: text('date').notNull(),
    note: text('note'),
    recurringId: text('recurring_id'),
    importHash: text('import_hash'),
    pendingId: text('pending_id'),
    deletedAt: integer('deleted_at'),
    ...timestamps,
  },
  (t) => [
    index('transactions_date_idx').on(t.date),
    index('transactions_category_date_idx').on(t.categoryId, t.date),
    index('transactions_import_hash_idx').on(t.importHash),
    check('transactions_amount_positive', sql`${t.amount} > 0`),
    check('transactions_to_amount_positive', sql`${t.toAmount} IS NULL OR ${t.toAmount} > 0`),
  ],
);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  ...timestamps,
});

export const transactionTags = sqliteTable(
  'transaction_tags',
  {
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.transactionId, t.tagId] })],
);

export const limitOverrides = sqliteTable(
  'limit_overrides',
  {
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    amount: integer('amount').notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.period] })],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  /** JSON.stringify значения */
  value: text('value').notNull(),
  ...timestamps,
});
