import type { BudgetRow } from '@/entities/budget';
import { formatMoney, formatPercent, type Kopecks } from '@/shared/lib/money';
import { pluralRu } from '@/shared/lib/plural';

const RUBLES = ['рубль', 'рубля', 'рублей'] as const;
const PERCENT = ['процент', 'процента', 'процентов'] as const;

/** «6 760» — обычные пробелы, чтобы TalkBack читал число как одно. */
const spoken = (v: Kopecks) => formatMoney(Math.abs(v), { currency: false, kopecks: 'never' }).replace(/\u00A0/g, ' ');
const rubles = (v: Kopecks) => `${spoken(v)} ${pluralRu(Math.round(Math.abs(v) / 100), RUBLES)}`;

/** Подпись плитки для TalkBack (PLAN.md §6): «Продукты, осталось 6 760 рублей из 18 000, потрачено 62 процента». */
export function tileLabel(row: BudgetRow): string {
  if (!row.hasLimit) return `${row.name}, лимита нет, потрачено ${rubles(row.spent)}`;
  const percent = formatPercent(row.spent, row.available);
  const carry =
    row.carryIn > 0
      ? `, с переносом ${rubles(row.carryIn)}`
      : row.carryIn < 0
        ? `, долг прошлого месяца ${rubles(row.carryIn)}`
        : '';
  if (row.remaining < 0) {
    return `${row.name}, перерасход ${rubles(row.remaining)}: потрачено ${spoken(row.spent)} из ${spoken(row.available)}${carry}`;
  }
  return `${row.name}, осталось ${rubles(row.remaining)} из ${spoken(row.available)}, потрачено ${percent} ${pluralRu(percent, PERCENT)}${carry}`;
}
