import type { BudgetOverview } from '@/entities/budget';
import { formatMoney } from '@/shared/lib/money';
import { pluralRu } from '@/shared/lib/plural';

const DAYS = ['день', 'дня', 'дней'] as const;

/** Подпись для TalkBack: сколько дней осталось и сколько можно тратить в день (или перерасход). */
export function budgetSummary(overview: BudgetOverview): string {
  const days = `${overview.daysLeft} ${pluralRu(overview.daysLeft, DAYS)} до конца периода`;
  if (overview.totalRemaining < 0) return `${days}, перерасход`;
  return `${days}, по ${formatMoney(overview.perDay, { kopecks: 'never' })} в день`;
}
