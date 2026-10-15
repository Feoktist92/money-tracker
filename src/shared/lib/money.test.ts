import {
  assertKopecks,
  divideKopecks,
  formatMoney,
  formatPercent,
  parseMoney,
  roundToKopecks,
  rublesToKopecks,
} from './money';

/** Пишем ожидания обычными пробелами, сравниваем с неразрывными. */
const nb = (s: string) => s.replace(/ /g, ' ');

describe('formatMoney', () => {
  it.each([
    [2239000, undefined, '22 390 ₽'],
    [-86000, undefined, '−860 ₽'],
    [124050, undefined, '1 240,50 ₽'],
    [124050, { kopecks: 'never' as const }, '1 241 ₽'],
    [124000, { sign: 'always' as const }, '+1 240 ₽'],
    [-124000, { sign: 'never' as const }, '1 240 ₽'],
    [124000, { kopecks: 'always' as const }, '1 240,00 ₽'],
    [124000, { currency: false }, '1 240'],
    [0, undefined, '0 ₽'],
    [0, { sign: 'always' as const }, '0 ₽'],
    [-40, { kopecks: 'never' as const }, '0 ₽'],
    [5, undefined, '0,05 ₽'],
    [123456789012, undefined, '1 234 567 890,12 ₽'],
  ])('formatMoney(%p, %p) → %p', (value, opts, expected) => {
    expect(formatMoney(value, opts)).toBe(nb(expected));
  });

  it('минус — типографский U+2212, а не дефис', () => {
    expect(formatMoney(-100).codePointAt(0)).toBe(0x2212);
  });

  it('бросает на дробных копейках', () => {
    expect(() => formatMoney(12.5)).toThrow(RangeError);
  });
});

describe('parseMoney', () => {
  it.each([
    ['1 240,5', 124050],
    ['1 240,50', 124050],
    ['1240.5', 124050],
    ['12,', 1200],
    ['0', 0],
    ['−500', -50000],
    ['-0', 0],
  ])('parseMoney(%p) → %p', (text, expected) => {
    expect(parseMoney(text)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '1,234', '1,2,3', ',5', '1-2'])('parseMoney(%p) → null', (text) => {
    expect(parseMoney(text)).toBeNull();
  });
});

describe('roundToKopecks', () => {
  it.each([
    [0.5, 1],
    [-0.5, -1],
    [1.4999, 1],
    [-0.4, 0],
    [100.49999999999999, 101], // 1.005 * 100 в float
  ])('roundToKopecks(%p) → %p', (value, expected) => {
    expect(roundToKopecks(value)).toBe(expected);
  });

  it('не возвращает −0', () => {
    expect(Object.is(roundToKopecks(-0.4), 0)).toBe(true);
  });

  it('бросает на NaN и Infinity', () => {
    expect(() => roundToKopecks(NaN)).toThrow(RangeError);
    expect(() => roundToKopecks(Infinity)).toThrow(RangeError);
  });
});

describe('rublesToKopecks', () => {
  it('гасит ошибку float', () => {
    expect(rublesToKopecks(0.1 + 0.2)).toBe(30);
    expect(rublesToKopecks(1.005)).toBe(101);
  });
});

describe('divideKopecks', () => {
  it.each([
    [2239000, 17, 131705],
    [-1000, 3, -333],
    [0, 5, 0],
  ])('divideKopecks(%p, %p) → %p', (total, parts, expected) => {
    expect(divideKopecks(total, parts)).toBe(expected);
  });

  it('бросает на нуле и дробном числе частей', () => {
    expect(() => divideKopecks(100, 0)).toThrow(RangeError);
    expect(() => divideKopecks(100, 1.5)).toThrow(RangeError);
  });
});

describe('assertKopecks', () => {
  it('пропускает целое, бросает на дробном и небезопасном', () => {
    expect(() => assertKopecks(100)).not.toThrow();
    expect(() => assertKopecks(0.5)).toThrow(RangeError);
    expect(() => assertKopecks(2 ** 53)).toThrow(RangeError);
  });
});

describe('formatPercent', () => {
  it.each([
    [1124000, 1800000, 62],
    [229000, 250000, 92],
    [0, 0, 0],
    [500, 0, 100],
    [-100, 1000, 0],
  ])('formatPercent(%p, %p) → %p', (part, whole, expected) => {
    expect(formatPercent(part, whole)).toBe(expected);
  });
});
