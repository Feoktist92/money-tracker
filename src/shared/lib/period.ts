/** Локальный календарный день 'YYYY-MM-DD'. */
export type DateKey = string;
/** Период 'YYYY-MM' — начинается в monthStartDay этого месяца и длится до monthStartDay следующего. */
export type PeriodKey = string;

const DAY_MS = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const pad2 = (n: number) => String(n).padStart(2, '0');

function parseDate(date: DateKey): { y: number; m: number; d: number } {
  const match = DATE_RE.exec(date);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d) {
      return { y, m, d };
    }
  }
  throw new RangeError(`Некорректная дата: ${date}`);
}

function parsePeriod(p: PeriodKey): { y: number; m: number } {
  const match = PERIOD_RE.exec(p);
  if (!match) throw new RangeError(`Некорректный период: ${p}`);
  return { y: Number(match[1]), m: Number(match[2]) };
}

function assertStartDay(startDay: number): void {
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > 28) {
    throw new RangeError(`Начало месяца должно быть от 1 до 28: ${startDay}`);
  }
}

function toUtcMs(date: DateKey): number {
  const { y, m, d } = parseDate(date);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DateKey {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function isDateKey(value: string): boolean {
  try {
    parseDate(value);
    return true;
  } catch {
    return false;
  }
}

/** Локальная (не UTC) дата устройства. */
export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(date: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

export function shiftPeriod(p: PeriodKey, delta: number): PeriodKey {
  const { y, m } = parsePeriod(p);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad2((index % 12) + 1)}`;
}

export function periodOf(date: DateKey, startDay: number): PeriodKey {
  assertStartDay(startDay);
  const { y, m, d } = parseDate(date);
  const sameMonth = `${y}-${pad2(m)}`;
  return d >= startDay ? sameMonth : shiftPeriod(sameMonth, -1);
}

export function periodRange(p: PeriodKey, startDay: number): { start: DateKey; endExclusive: DateKey } {
  assertStartDay(startDay);
  parsePeriod(p);
  return { start: `${p}-${pad2(startDay)}`, endExclusive: `${shiftPeriod(p, 1)}-${pad2(startDay)}` };
}

export function comparePeriods(a: PeriodKey, b: PeriodKey): number {
  parsePeriod(a);
  parsePeriod(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Все периоды от from до to включительно; [] если from позже to. */
export function periodsBetween(from: PeriodKey, to: PeriodKey): PeriodKey[] {
  const result: PeriodKey[] = [];
  for (let p = from; comparePeriods(p, to) <= 0; p = shiftPeriod(p, 1)) result.push(p);
  return result;
}

/** Сколько дней осталось в периоде, включая сегодняшний. */
export function daysLeftInPeriod(today: DateKey, startDay: number): number {
  const { endExclusive } = periodRange(periodOf(today, startDay), startDay);
  return Math.round((toUtcMs(endExclusive) - toUtcMs(today)) / DAY_MS);
}

export function monthNameNominative(p: PeriodKey): string {
  return MONTHS_NOMINATIVE[parsePeriod(p).m - 1]!;
}

export function monthNameGenitive(p: PeriodKey): string {
  return MONTHS_GENITIVE[parsePeriod(p).m - 1]!;
}

/** «Октябрь» при старте с 1-го (год — только если он не текущий), иначе «10 окт – 9 ноя». */
export function periodTitle(p: PeriodKey, startDay: number, today: DateKey): string {
  const { start, endExclusive } = periodRange(p, startDay);
  if (startDay === 1) {
    const { y } = parsePeriod(p);
    return y === parseDate(today).y ? monthNameNominative(p) : `${monthNameNominative(p)} ${y}`;
  }
  const first = parseDate(start);
  const last = parseDate(addDays(endExclusive, -1));
  return `${first.d} ${MONTHS_SHORT[first.m - 1]} – ${last.d} ${MONTHS_SHORT[last.m - 1]}`;
}
