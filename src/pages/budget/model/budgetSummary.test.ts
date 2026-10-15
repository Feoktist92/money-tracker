import type { BudgetOverview } from '@/entities/budget';

import { budgetSummary } from './budgetSummary';

const overview = (daysLeft: number, totalRemaining: number, perDay = 0) =>
  ({ daysLeft, totalRemaining, perDay }) as BudgetOverview;

describe('budgetSummary', () => {
  it('склоняет «день» по числу дней', () => {
    expect(budgetSummary(overview(17, 100_000))).toContain('17 дней до конца периода');
    expect(budgetSummary(overview(21, 100_000))).toContain('21 день до конца периода');
    expect(budgetSummary(overview(2, 100_000))).toContain('2 дня до конца периода');
    expect(budgetSummary(overview(11, 100_000))).toContain('11 дней до конца периода');
  });

  it('при остатке называет сумму в день', () => {
    expect(budgetSummary(overview(10, 1_000_000, 100_000))).toBe(`10 дней до конца периода, по 1 000 ₽ в день`);
  });

  it('при перерасходе говорит «перерасход», а не «в день»', () => {
    const text = budgetSummary(overview(5, -50_000));
    expect(text).toBe('5 дней до конца периода, перерасход');
    expect(text).not.toContain('в день');
  });
});
