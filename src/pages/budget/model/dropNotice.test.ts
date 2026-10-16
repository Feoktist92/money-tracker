import type { DropResult } from '@/features/coin-drag';

import { describeDrop } from './dropNotice';

const account = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' } as const;
const income = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' } as const;

const drop = (source: DropResult['source'], target: DropResult['target']): DropResult => ({ source, target });

describe('describeDrop', () => {
  it('счёт → категория — расход', () => {
    expect(describeDrop(drop(account, { kind: 'category', id: 'food', name: 'Продукты' })).title).toBe(
      'Расход: Основная → Продукты',
    );
  });

  it('доход → счёт — доход', () => {
    expect(describeDrop(drop(income, { kind: 'account', id: 'main', name: 'Основная' })).title).toBe(
      'Доход: Зарплата → Основная',
    );
  });

  it('счёт → счёт — перевод', () => {
    expect(describeDrop(drop(account, { kind: 'account', id: 'savings', name: 'Накопления' })).title).toBe(
      'Перевод: Основная → Накопления',
    );
  });
});
