import {
  addDays,
  comparePeriods,
  daysLeftInPeriod,
  isDateKey,
  monthNameGenitive,
  monthNameNominative,
  periodOf,
  periodRange,
  periodsBetween,
  periodTitle,
  shiftPeriod,
  toDateKey,
} from './period';

describe('periodOf', () => {
  it.each([
    ['2026-10-15', 1, '2026-10'],
    ['2026-10-01', 1, '2026-10'],
    ['2026-10-05', 10, '2026-09'],
    ['2026-10-10', 10, '2026-10'],
    ['2026-01-05', 10, '2025-12'],
    ['2026-03-01', 28, '2026-02'],
    ['2026-02-27', 28, '2026-01'],
  ])('periodOf(%p, %p) → %p', (date, startDay, expected) => {
    expect(periodOf(date, startDay)).toBe(expected);
  });

  it.each([0, 29, 1.5])('startDay %p → RangeError', (startDay) => {
    expect(() => periodOf('2026-10-15', startDay)).toThrow(RangeError);
  });

  it.each(['2026-13-01', '2026-02-30', '2026-1-5', ''])('дата %p → RangeError', (date) => {
    expect(() => periodOf(date, 1)).toThrow(RangeError);
  });
});

describe('periodRange', () => {
  it('декабрь переходит в январь следующего года', () => {
    expect(periodRange('2026-12', 1)).toEqual({ start: '2026-12-01', endExclusive: '2027-01-01' });
  });
  it('старт 28-го', () => {
    expect(periodRange('2026-01', 28)).toEqual({ start: '2026-01-28', endExclusive: '2026-02-28' });
  });
});

describe('shiftPeriod', () => {
  it.each([
    ['2026-01', -1, '2025-12'],
    ['2026-11', 14, '2028-01'],
    ['2026-12', 1, '2027-01'],
    ['2026-10', 0, '2026-10'],
    ['2026-03', -27, '2023-12'],
  ])('shiftPeriod(%p, %p) → %p', (p, delta, expected) => {
    expect(shiftPeriod(p, delta)).toBe(expected);
  });

  it('бросает на кривом периоде', () => {
    expect(() => shiftPeriod('2026-13', 1)).toThrow(RangeError);
  });
});

describe('comparePeriods и periodsBetween', () => {
  it('сравнивает по порядку', () => {
    expect(comparePeriods('2026-09', '2026-10')).toBe(-1);
    expect(comparePeriods('2027-01', '2026-12')).toBe(1);
    expect(comparePeriods('2026-10', '2026-10')).toBe(0);
  });
  it('перечисляет через новый год включительно', () => {
    expect(periodsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });
  it('пустой список, если from позже to', () => {
    expect(periodsBetween('2026-10', '2026-09')).toEqual([]);
  });
});

describe('daysLeftInPeriod', () => {
  it.each([
    ['2026-10-15', 1, 17],
    ['2026-10-31', 1, 1],
    ['2026-10-01', 1, 31],
    ['2026-10-05', 10, 5],
    ['2026-12-31', 1, 1],
  ])('daysLeftInPeriod(%p, %p) → %p', (today, startDay, expected) => {
    expect(daysLeftInPeriod(today, startDay)).toBe(expected);
  });
});

describe('addDays, isDateKey, toDateKey', () => {
  it('addDays через границы месяца и года', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('isDateKey', () => {
    expect(isDateKey('2026-10-15')).toBe(true);
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('15.10.2026')).toBe(false);
  });
  it('toDateKey берёт локальную дату', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('названия', () => {
  it('месяцы', () => {
    expect(monthNameNominative('2026-10')).toBe('Октябрь');
    expect(monthNameGenitive('2026-09')).toBe('сентября');
  });
  it.each([
    ['2026-10', 1, '2026-10-15', 'Октябрь'],
    ['2025-12', 1, '2026-01-10', 'Декабрь 2025'],
    ['2026-10', 10, '2026-10-15', '10 окт – 9 ноя'],
    ['2026-12', 25, '2026-12-30', '25 дек – 24 янв'],
  ])('periodTitle(%p, %p, %p) → %p', (p, startDay, today, expected) => {
    expect(periodTitle(p, startDay, today)).toBe(expected);
  });
});
