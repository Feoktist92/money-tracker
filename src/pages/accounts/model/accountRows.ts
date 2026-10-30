import type { Account } from '@/shared/db/types';
import { formatMoney, type Kopecks } from '@/shared/lib/money';

export const ACCOUNT_TYPE_LABELS: Readonly<Record<Account['type'], string>> = {
  card: 'Карта',
  savings: 'Накопления',
  cash: 'Наличные',
  debt: 'Долг',
  goal: 'Цель',
};

export interface AccountRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: Account['type'];
  balance: Kopecks;
}

export interface ArchivedAccountRow {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** Вторая строка списка: «Карта · 48 215 ₽» (копейки показываются, только если они есть). */
export function accountSubtitle({ type, balance }: Pick<AccountRow, 'type' | 'balance'>): string {
  return `${ACCOUNT_TYPE_LABELS[type]} · ${formatMoney(balance)}`;
}
