import type { BudgetOverview, BudgetRow } from '@/entities/budget';
import type { EntryInfo, EntrySession, Party } from '@/features/amount-entry';
import type { DropResult } from '@/features/coin-drag';
import type { Kopecks } from '@/shared/lib/money';

/** Счёт с текущим балансом — для строки «Останется на счёте». */
export interface EntryAccount extends Party {
  balance: Kopecks;
}

/** Бросок монеты на цель → что записывать. null — пара не допускается правилами (сюда в норме не попадаем). */
export function sessionFromDrop({ source, target }: DropResult): EntrySession | null {
  const from: Party = { id: source.id, name: source.name };
  const to: Party = { id: target.id, name: target.name };
  if (source.kind === 'account' && target.kind === 'category') return { type: 'expense', account: from, category: to };
  if (source.kind === 'income' && target.kind === 'account') return { type: 'income', category: from, account: to };
  if (source.kind === 'account' && target.kind === 'account') return { type: 'transfer', from, to };
  return null;
}

/** Тап по плитке категории: расход с выбранного счёта. */
export function sessionForTile(row: Pick<BudgetRow, 'categoryId' | 'name'>, account: Party): EntrySession {
  return { type: 'expense', account, category: { id: row.categoryId, name: row.name } };
}

/** Счёт по умолчанию для тапа по плитке: последний, которым пользовались для категории; иначе первый по порядку. */
export function pickDefaultAccount(accounts: readonly Party[], lastAccountId: string | null): Party | null {
  return accounts.find((account) => account.id === lastAccountId) ?? accounts[0] ?? null;
}

/** Цифры для строки под суммой: остаток категории и балансы счетов до записи. */
export function entryInfo(
  session: EntrySession,
  overview: BudgetOverview,
  accounts: readonly EntryAccount[],
): EntryInfo {
  const balance = (id: string) => accounts.find((account) => account.id === id)?.balance;
  switch (session.type) {
    case 'expense':
      return {
        categoryRemaining: overview.rows.find((row) => row.categoryId === session.category.id)?.remaining,
        sourceBalance: balance(session.account.id),
      };
    case 'income':
      return { targetBalance: balance(session.account.id) };
    case 'transfer':
      return { sourceBalance: balance(session.from.id), targetBalance: balance(session.to.id) };
  }
}
