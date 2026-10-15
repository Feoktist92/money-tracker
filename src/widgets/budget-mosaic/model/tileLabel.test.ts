import type { BudgetRow } from '@/entities/budget';

import { tileLabel } from './tileLabel';

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

describe('tileLabel', () => {
  it('пример из PLAN.md §6', () => {
    expect(tileLabel(row({}))).toBe('Продукты, осталось 6 760 рублей из 18 000, потрачено 62 процента');
  });

  it('перерасход', () => {
    expect(
      tileLabel(
        row({ name: 'Кафе', limit: 700_000, available: 700_000, spent: 786_000, remaining: -86_000, state: 'over' }),
      ),
    ).toBe('Кафе, перерасход 860 рублей: потрачено 7 860 из 7 000');
  });

  it('перенос добавляется в конец', () => {
    expect(
      tileLabel(
        row({
          name: 'Здоровье',
          limit: 500_000,
          carryIn: 180_000,
          available: 680_000,
          spent: 80_000,
          remaining: 600_000,
        }),
      ),
    ).toBe('Здоровье, осталось 6 000 рублей из 6 800, потрачено 12 процентов, с переносом 1 800 рублей');
  });

  it('долг прошлого месяца', () => {
    expect(tileLabel(row({ carryIn: -30_000, available: 1_770_000, remaining: 646_000 }))).toContain(
      'долг прошлого месяца 300 рублей',
    );
  });

  it('без лимита', () => {
    expect(
      tileLabel(row({ name: 'Прочее', hasLimit: false, limit: 0, available: 0, spent: 9_900, remaining: -9_900 })),
    ).toBe('Прочее, лимита нет, потрачено 99 рублей');
  });

  it.each([
    [100, '1 процент'],
    [200, '2 процента'],
    [500, '5 процентов'],
    [1100, '11 процентов'],
    [2100, '21 процент'],
  ])('склонение процентов: %p копеек из 100 000 → %p', (spent, phrase) => {
    const available = 10_000;
    const label = tileLabel(row({ available, limit: available, spent, remaining: available - spent }));
    expect(label.includes(phrase)).toBe(true);
  });

  it('склонение рублей: 1, 2, 5, 11, 21', () => {
    const labels = [100, 200, 500, 1100, 2100].map((remaining) =>
      tileLabel(row({ available: 1_000_000, limit: 1_000_000, spent: 0, remaining })),
    );
    expect(labels.map((l) => l.split('осталось ')[1]!.split(' из')[0])).toEqual([
      '1 рубль',
      '2 рубля',
      '5 рублей',
      '11 рублей',
      '21 рубль',
    ]);
  });
});
