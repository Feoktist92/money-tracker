import type { BudgetRow } from '@/entities/budget';

import { previewStrip } from './previewStrip';

const row = (patch: Partial<BudgetRow>): BudgetRow => ({
  categoryId: 'c',
  name: 'Продукты',
  icon: 'shopping-basket',
  hasLimit: true,
  limit: 1_800_000,
  carryIn: 0,
  available: 1_800_000,
  spent: 1_124_000,
  remaining: 676_000,
  state: 'normal',
  ...patch,
});

describe('previewStrip', () => {
  it('было 62%, прибавка 7%', () => {
    const before = row({});
    const after = row({ spent: 1_248_000 });
    const strip = previewStrip(before, after)!;
    expect(strip.was).toBeCloseTo(62.44, 1);
    expect(strip.added).toBeCloseTo(6.89, 1);
  });

  it('прибавка упирается в 100%: «было + прибавка» не больше 100', () => {
    const strip = previewStrip(row({}), row({ spent: 5_000_000 }))!;
    expect(strip.was + strip.added).toBeCloseTo(100, 5);
  });

  it('уже перерасход: было 100%, прибавки нет', () => {
    const before = row({ spent: 2_000_000, remaining: -200_000, state: 'over' });
    expect(previewStrip(before, row({ spent: 2_100_000 }))).toEqual({ was: 100, added: 0 });
  });

  it('без лимита или с нулевым доступным — полоски нет', () => {
    expect(previewStrip(row({ hasLimit: false }), row({ hasLimit: false }))).toBeNull();
    expect(previewStrip(row({ available: 0 }), row({ available: 0, spent: 5 }))).toBeNull();
  });

  it('пока ничего не введено, прибавка нулевая', () => {
    expect(previewStrip(row({}), row({}))!.added).toBe(0);
  });
});
