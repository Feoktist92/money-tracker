import type { Category } from '@/shared/db/types';
import { formatMoney, type Kopecks } from '@/shared/lib/money';

export interface CategoryRow {
  id: string;
  name: string;
  kind: Category['kind'];
  icon: string;
  color: string;
  monthlyLimit: Kopecks | null;
}

/** Вторая строка списка: «Лимит 18 000 ₽» или «Без лимита» у расхода; «Доход» у дохода. */
export function categorySubtitle({ kind, monthlyLimit }: Pick<CategoryRow, 'kind' | 'monthlyLimit'>): string {
  if (kind === 'income') return 'Доход';
  return monthlyLimit === null ? 'Без лимита' : `Лимит ${formatMoney(monthlyLimit)}`;
}
