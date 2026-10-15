import type { BudgetRow } from '@/entities/budget';

/**
 * Вес плитки в раскладке: сколько доступно за период (лимит + перенос), а при перерасходе — сколько потрачено.
 * У категории без лимита вес равен тратам. Раскладка зависит от лимитов и переноса и меняется только когда расход
 * выходит за доступное, поэтому плитки не прыгают при каждой трате.
 */
export function tileWeight(row: BudgetRow): number {
  return row.hasLimit ? Math.max(row.available, row.spent) : row.spent;
}
