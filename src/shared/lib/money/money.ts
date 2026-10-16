/** Сумма в копейках. Всегда целое безопасное число. */
export type Kopecks = number;

/** Верхний предел суммы одной операции: 999 999 999,99 ₽ (PLAN.md, 5.1 — не больше 9 цифр целой части). */
export const MAX_TRANSACTION_AMOUNT: Kopecks = 99_999_999_999;

const NBSP = '\u00A0';
const MINUS = '\u2212';
const ANY_SPACE = /\s/g; // в JS \s включает U+00A0 и U+202F

const rubleFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function assertKopecks(v: number): asserts v is Kopecks {
  if (!Number.isSafeInteger(v)) {
    throw new RangeError(`Сумма должна быть целым числом копеек: ${v}`);
  }
}

/** Округление до целых копеек, половина — от нуля. Шум float гасится до 15 значащих цифр. */
export function roundToKopecks(value: number): Kopecks {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Сумма не является конечным числом: ${value}`);
  }
  const abs = Math.round(Number(Math.abs(value).toPrecision(15)));
  return value < 0 && abs !== 0 ? -abs : abs;
}

export function rublesToKopecks(rub: number): Kopecks {
  return roundToKopecks(rub * 100);
}

/** "1 240,5" → 124050. Не больше двух знаков после запятой. Пустая или кривая строка → null. */
export function parseMoney(text: string): Kopecks | null {
  const normalized = text.replace(ANY_SPACE, '').replace(MINUS, '-').replace(',', '.');
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match) return null;
  const [, minus, whole = '', fraction = ''] = match;
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(value)) return null;
  return minus && value !== 0 ? -value : value;
}

/** Деление на равные части, остаток отбрасывается (округление к нулю). */
export function divideKopecks(total: Kopecks, parts: number): Kopecks {
  assertKopecks(total);
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new RangeError(`Число частей должно быть целым и больше нуля: ${parts}`);
  }
  return Math.trunc(total / parts) || 0;
}

export interface FormatMoneyOptions {
  /** auto — минус только у отрицательных; always — ещё и плюс у положительных; never — без знака */
  sign?: 'auto' | 'always' | 'never';
  /** auto — копейки, только если они есть; always — всегда ",00"; never — округлить до рублей */
  kopecks?: 'auto' | 'always' | 'never';
  /** Добавлять " ₽" (по умолчанию да) */
  currency?: boolean;
}

export function formatMoney(v: Kopecks, opts: FormatMoneyOptions = {}): string {
  assertKopecks(v);
  const { sign = 'auto', kopecks = 'auto', currency = true } = opts;
  let abs = Math.abs(v);
  if (kopecks === 'never') abs = Math.round(abs / 100) * 100;
  const showKopecks = kopecks === 'always' || (kopecks === 'auto' && abs % 100 !== 0);

  let body = rubleFormat.format(Math.floor(abs / 100)).replace(ANY_SPACE, NBSP);
  if (showKopecks) body += ',' + String(abs % 100).padStart(2, '0');

  let prefix = '';
  if (abs !== 0 && sign !== 'never') {
    if (v < 0) prefix = MINUS;
    else if (sign === 'always') prefix = '+';
  }
  return prefix + body + (currency ? `${NBSP}₽` : '');
}

/** Целый процент part от whole. whole ≤ 0: 100, если что-то потрачено, иначе 0. */
export function formatPercent(part: Kopecks, whole: Kopecks): number {
  if (part <= 0) return 0;
  if (whole <= 0) return 100;
  return Math.round((part / whole) * 100);
}
