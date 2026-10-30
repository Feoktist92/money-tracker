import type { BudgetRow } from '@/entities/budget';

import { tileWeight } from './weights';

const row = (patch: Partial<BudgetRow>): BudgetRow => ({
  categoryId: 'c',
  name: 'Категория',
  icon: 'house',
  color: 'violet',
  hasLimit: true,
  limit: 1000,
  carryIn: 0,
  available: 1000,
  spent: 0,
  remaining: 1000,
  state: 'normal',
  ...patch,
});

describe('tileWeight', () => {
  it('обычная плитка: доступно (лимит + перенос)', () => {
    expect(tileWeight(row({ limit: 600_000, carryIn: 70_000, available: 670_000, spent: 214_000 }))).toBe(670_000);
  });

  it('перерасход: вес равен тратам', () => {
    expect(tileWeight(row({ limit: 700_000, available: 700_000, spent: 786_000, remaining: -86_000 }))).toBe(786_000);
  });

  it('без лимита: вес равен тратам', () => {
    expect(tileWeight(row({ hasLimit: false, limit: 0, available: 0, spent: 99_000 }))).toBe(99_000);
  });

  it('трата внутри лимита вес не меняет', () => {
    expect(tileWeight(row({ spent: 0 }))).toBe(tileWeight(row({ spent: 900 })));
  });
});
