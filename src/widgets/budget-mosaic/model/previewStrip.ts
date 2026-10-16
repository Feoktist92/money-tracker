import type { BudgetRow } from '@/entities/budget';

export interface PreviewStrip {
  /** Доля уже потраченного до записи, 0–100. */
  was: number;
  /** Доля, которую добавит вводимая сумма, 0–100 (вместе с was не больше 100). */
  added: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Полоска «было / прибавка» под плиткой-превью. null — у категории нет лимита (доли считать не от чего). */
export function previewStrip(before: BudgetRow, after: BudgetRow): PreviewStrip | null {
  if (!before.hasLimit || before.available <= 0) return null;
  const was = clamp((before.spent / before.available) * 100);
  const next = clamp((after.spent / before.available) * 100);
  return { was, added: Math.max(0, next - was) };
}
