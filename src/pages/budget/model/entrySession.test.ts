import type { BudgetOverview, BudgetRow } from '@/entities/budget';
import type { DropResult } from '@/features/coin-drag';

import { entryInfo, pickDefaultAccount, sessionForTile, sessionFromDrop } from './entrySession';

const account = (id: string, name: string) =>
  ({ kind: 'account', id, name, icon: 'credit-card', color: 'violet' }) as const;
const salary = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' } as const;

describe('sessionFromDrop', () => {
  it('счёт → категория: расход', () => {
    const drop: DropResult = {
      source: account('main', 'Основная'),
      target: { kind: 'category', id: 'food', name: 'Продукты' },
    };
    expect(sessionFromDrop(drop)).toEqual({
      type: 'expense',
      account: { id: 'main', name: 'Основная' },
      category: { id: 'food', name: 'Продукты' },
    });
  });

  it('доход → счёт: доход', () => {
    const drop: DropResult = { source: salary, target: { kind: 'account', id: 'main', name: 'Основная' } };
    expect(sessionFromDrop(drop)).toEqual({
      type: 'income',
      category: { id: 'salary', name: 'Зарплата' },
      account: { id: 'main', name: 'Основная' },
    });
  });

  it('счёт → счёт: перевод', () => {
    const drop: DropResult = {
      source: account('main', 'Основная'),
      target: { kind: 'account', id: 'savings', name: 'Накопления' },
    };
    expect(sessionFromDrop(drop)).toEqual({
      type: 'transfer',
      from: { id: 'main', name: 'Основная' },
      to: { id: 'savings', name: 'Накопления' },
    });
  });

  it('недопустимая пара (доход → категория) — null', () => {
    const drop: DropResult = { source: salary, target: { kind: 'category', id: 'food', name: 'Продукты' } };
    expect(sessionFromDrop(drop)).toBeNull();
  });
});

describe('sessionForTile', () => {
  it('тап по плитке: расход с выбранного счёта на категорию плитки', () => {
    expect(sessionForTile({ categoryId: 'food', name: 'Продукты' }, { id: 'main', name: 'Основная' })).toEqual({
      type: 'expense',
      account: { id: 'main', name: 'Основная' },
      category: { id: 'food', name: 'Продукты' },
    });
  });
});

describe('pickDefaultAccount', () => {
  const accounts = [
    { id: 'main', name: 'Основная' },
    { id: 'savings', name: 'Накопления' },
  ];

  it('последний счёт категории, если он ещё существует', () => {
    expect(pickDefaultAccount(accounts, 'savings')?.id).toBe('savings');
  });

  it('иначе первый по порядку: нет истории или счёт архивирован', () => {
    expect(pickDefaultAccount(accounts, null)?.id).toBe('main');
    expect(pickDefaultAccount(accounts, 'удалён')?.id).toBe('main');
  });

  it('нет ни одного счёта — null', () => {
    expect(pickDefaultAccount([], null)).toBeNull();
  });
});

describe('entryInfo', () => {
  const row = (categoryId: string, remaining: number) => ({ categoryId, remaining }) as BudgetRow;
  const overview = { rows: [row('food', 676000), row('cafe', -86000)] } as BudgetOverview;
  const accounts = [
    { id: 'main', name: 'Основная', balance: 4821500 },
    { id: 'savings', name: 'Накопления', balance: 1264000 },
  ];

  it('расход: остаток категории и баланс счёта-источника', () => {
    const session = {
      type: 'expense',
      account: { id: 'main', name: 'Основная' },
      category: { id: 'cafe', name: 'Кафе' },
    } as const;
    expect(entryInfo(session, overview, accounts)).toEqual({ categoryRemaining: -86000, sourceBalance: 4821500 });
  });

  it('доход: баланс счёта-получателя', () => {
    const session = {
      type: 'income',
      category: { id: 'salary', name: 'Зарплата' },
      account: { id: 'savings', name: 'Накопления' },
    } as const;
    expect(entryInfo(session, overview, accounts)).toEqual({ targetBalance: 1264000 });
  });

  it('перевод: оба баланса', () => {
    const session = {
      type: 'transfer',
      from: { id: 'main', name: 'Основная' },
      to: { id: 'savings', name: 'Накопления' },
    } as const;
    expect(entryInfo(session, overview, accounts)).toEqual({ sourceBalance: 4821500, targetBalance: 1264000 });
  });

  it('неизвестные категория или счёт — поля пустые, строка под суммой не покажется', () => {
    const session = { type: 'expense', account: { id: 'x', name: 'X' }, category: { id: 'y', name: 'Y' } } as const;
    expect(entryInfo(session, overview, accounts)).toEqual({ categoryRemaining: undefined, sourceBalance: undefined });
  });
});
