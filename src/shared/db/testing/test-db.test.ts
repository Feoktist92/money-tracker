import { accounts, transactions } from '../schema';
import { createTestDb } from './test-db';

describe('createTestDb: гарантии схемы', () => {
  it('внешние ключи включены: операция с неизвестным счётом отклоняется', () => {
    const db = createTestDb();
    expect(() =>
      db
        .insert(transactions)
        .values({ id: 't1', type: 'expense', amount: 100, fromAccountId: 'нет-такого', date: '2026-10-15' })
        .run(),
    ).toThrow();
  });

  it('CHECK: сумма операции должна быть положительной', () => {
    const db = createTestDb();
    db.insert(accounts)
      .values({ id: 'a1', name: 'Основная', type: 'card', icon: 'credit-card', color: 'violet' })
      .run();
    expect(() =>
      db
        .insert(transactions)
        .values({ id: 't1', type: 'expense', amount: 0, fromAccountId: 'a1', date: '2026-10-15' })
        .run(),
    ).toThrow();
  });
});
