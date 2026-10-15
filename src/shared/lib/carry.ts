import type { Kopecks } from './money';
import { comparePeriods, type PeriodKey, periodsBetween } from './period';

export type CarryMode = 'none' | 'surplus' | 'surplus_debt';

export interface CategoryCarryInput {
  monthlyLimit: Kopecks | null;
  carryMode: CarryMode;
  /** С какого периода считать перенос; null — с первого периода, где есть траты. */
  carryStart: PeriodKey | null;
  /** limit_overrides: лимит на конкретный период вместо monthlyLimit. */
  overrides: Readonly<Record<PeriodKey, Kopecks>>;
  /** Потрачено по периодам. */
  spent: Readonly<Record<PeriodKey, Kopecks>>;
}

export interface CategoryMonth {
  period: PeriodKey;
  limit: Kopecks;
  carryIn: Kopecks;
  available: Kopecks;
  spent: Kopecks;
  closing: Kopecks;
}

function chainStart(input: CategoryCarryInput, until: PeriodKey): PeriodKey {
  if (input.carryMode === 'none') return until;
  const earliestSpent = Object.keys(input.spent)
    .filter((p) => (input.spent[p] ?? 0) !== 0)
    .sort(comparePeriods)[0];
  const start = input.carryStart ?? earliestSpent ?? until;
  return comparePeriods(start, until) > 0 ? until : start;
}

/**
 * Цепочка месяцев категории от начала переноса до until (последний элемент — until). PLAN §5.2:
 * available = limit + carryIn; closing = available − spent;
 * carryIn: none → 0, surplus → max(0, closing предыдущего), surplus_debt → closing предыдущего.
 */
export function computeCategoryMonths(input: CategoryCarryInput, until: PeriodKey): CategoryMonth[] {
  const months: CategoryMonth[] = [];
  let previousClosing: Kopecks | null = null;
  for (const period of periodsBetween(chainStart(input, until), until)) {
    const limit = input.overrides[period] ?? input.monthlyLimit ?? 0;
    const spent = input.spent[period] ?? 0;
    let carryIn = 0;
    if (previousClosing !== null) {
      if (input.carryMode === 'surplus') carryIn = Math.max(0, previousClosing);
      if (input.carryMode === 'surplus_debt') carryIn = previousClosing;
    }
    const available = limit + carryIn;
    const closing = available - spent;
    months.push({ period, limit, carryIn, available, spent, closing });
    previousClosing = closing;
  }
  return months;
}
