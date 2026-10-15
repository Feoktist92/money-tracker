import { useEffect, useState } from 'react';

import { getAccountBalances, listAccounts } from '@/entities/account';
import { type BudgetOverview, getBudgetOverview } from '@/entities/budget';
import { listCategories } from '@/entities/category';
import { getSettings } from '@/entities/settings';
import { db } from '@/shared/db/client';
import { useDataVersion } from '@/shared/db/useDataVersion';
import type { Kopecks } from '@/shared/lib/money';
import { type DateKey, toDateKey } from '@/shared/lib/period';

export interface BudgetPageData {
  today: DateKey;
  overview: BudgetOverview;
  income: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string; icon: string; color: string; balance: Kopecks }[];
}

type State = { data: BudgetPageData | null; error: Error | null };

async function load(): Promise<BudgetPageData> {
  const today = toDateKey(new Date());
  const settings = await getSettings(db);
  const [overview, accounts, balances, income] = await Promise.all([
    getBudgetOverview(db, today, settings),
    listAccounts(db),
    getAccountBalances(db),
    listCategories(db, 'income'),
  ]);
  return {
    today,
    overview,
    income: income.map(({ id, name, icon }) => ({ id, name, icon })),
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      color: a.color,
      balance: balances[a.id] ?? 0,
    })),
  };
}

/** Данные главного экрана; пересчитываются после каждого изменения базы и при возврате в приложение. */
export function useBudgetPage(): State {
  const version = useDataVersion();
  const [state, setState] = useState<State>({ data: null, error: null });
  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => !cancelled && setState({ data, error: null }),
      (e: unknown) => {
        if (cancelled) return;
        const error = e instanceof Error ? e : new Error(String(e));
        // Неудачная перезагрузка не стирает уже показанные данные
        setState((s) => ({ data: s.data, error }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [version]);
  return state;
}
