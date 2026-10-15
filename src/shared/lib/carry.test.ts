import { type CategoryCarryInput, computeCategoryMonths } from './carry';

const base: CategoryCarryInput = {
  monthlyLimit: 500000,
  carryMode: 'surplus',
  carryStart: null,
  overrides: {},
  spent: {},
};

/** Сокращение для сравнения: [period, limit, carryIn, available, spent, closing]. */
const rows = (input: CategoryCarryInput, until: string) =>
  computeCategoryMonths(input, until).map((m) => [m.period, m.limit, m.carryIn, m.available, m.spent, m.closing]);

describe('computeCategoryMonths', () => {
  it('пример «Здоровье» из макета', () => {
    const input = {
      ...base,
      carryStart: '2026-08',
      spent: { '2026-08': 440000, '2026-09': 380000, '2026-10': 80000 },
    };
    expect(rows(input, '2026-10')).toEqual([
      ['2026-08', 500000, 0, 500000, 440000, 60000],
      ['2026-09', 500000, 60000, 560000, 380000, 180000],
      ['2026-10', 500000, 180000, 680000, 80000, 600000],
    ]);
  });

  it('surplus: перерасход не переносится', () => {
    const input = {
      ...base,
      monthlyLimit: 100000,
      carryStart: '2026-08',
      spent: { '2026-08': 130000, '2026-09': 50000 },
    };
    expect(rows(input, '2026-09')).toEqual([
      ['2026-08', 100000, 0, 100000, 130000, -30000],
      ['2026-09', 100000, 0, 100000, 50000, 50000],
    ]);
  });

  it('surplus_debt: перерасход уменьшает следующий месяц', () => {
    const input = {
      ...base,
      monthlyLimit: 100000,
      carryMode: 'surplus_debt' as const,
      carryStart: '2026-08',
      spent: { '2026-08': 130000, '2026-09': 50000 },
    };
    expect(rows(input, '2026-09')).toEqual([
      ['2026-08', 100000, 0, 100000, 130000, -30000],
      ['2026-09', 100000, -30000, 70000, 50000, 20000],
    ]);
  });

  it('смена лимита в середине через overrides', () => {
    const input = {
      ...base,
      monthlyLimit: 100000,
      carryStart: '2026-08',
      overrides: { '2026-09': 150000 },
      spent: { '2026-08': 80000, '2026-09': 100000, '2026-10': 90000 },
    };
    expect(rows(input, '2026-10')).toEqual([
      ['2026-08', 100000, 0, 100000, 80000, 20000],
      ['2026-09', 150000, 20000, 170000, 100000, 70000],
      ['2026-10', 100000, 70000, 170000, 90000, 80000],
    ]);
  });

  it('carryStart посреди истории: траты до него не влияют', () => {
    const input = { ...base, carryStart: '2026-09', spent: { '2026-07': 900000, '2026-08': 10000, '2026-09': 400000 } };
    expect(rows(input, '2026-10')).toEqual([
      ['2026-09', 500000, 0, 500000, 400000, 100000],
      ['2026-10', 500000, 100000, 600000, 0, 600000],
    ]);
  });

  it('без carryStart цепочка начинается с первого периода с тратами', () => {
    const input = { ...base, spent: { '2026-09': 450000, '2026-07': 0 } };
    expect(rows(input, '2026-10').map((r) => r[0])).toEqual(['2026-09', '2026-10']);
  });

  it('carryStart позже until — один месяц без переноса', () => {
    const input = { ...base, carryStart: '2026-12', spent: { '2026-10': 100000 } };
    expect(rows(input, '2026-10')).toEqual([['2026-10', 500000, 0, 500000, 100000, 400000]]);
  });

  it('none — один элемент, carryIn 0, прошлые траты игнорируются', () => {
    const input = {
      ...base,
      carryMode: 'none' as const,
      carryStart: '2026-01',
      spent: { '2026-09': 100000, '2026-10': 200000 },
    };
    expect(rows(input, '2026-10')).toEqual([['2026-10', 500000, 0, 500000, 200000, 300000]]);
  });

  it('цепочка через новый год', () => {
    const input = {
      ...base,
      monthlyLimit: 100000,
      carryStart: '2026-11',
      spent: { '2026-11': 60000, '2026-12': 120000, '2027-01': 10000, '2027-02': 0 },
    };
    expect(rows(input, '2027-02')).toEqual([
      ['2026-11', 100000, 0, 100000, 60000, 40000],
      ['2026-12', 100000, 40000, 140000, 120000, 20000],
      ['2027-01', 100000, 20000, 120000, 10000, 110000],
      ['2027-02', 100000, 110000, 210000, 0, 210000],
    ]);
  });

  it('monthlyLimit null → лимит 0', () => {
    const input = { ...base, monthlyLimit: null, carryMode: 'none' as const, spent: { '2026-10': 5000 } };
    expect(rows(input, '2026-10')).toEqual([['2026-10', 0, 0, 0, 5000, -5000]]);
  });

  it('траты после until не учитываются', () => {
    const input = { ...base, carryStart: '2026-10', spent: { '2026-10': 100000, '2026-11': 999999 } };
    expect(rows(input, '2026-10')).toEqual([['2026-10', 500000, 0, 500000, 100000, 400000]]);
  });
});
