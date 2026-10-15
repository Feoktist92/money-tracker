import { useEffect, useState } from 'react';

import { db } from '@/shared/db/client';
import { useDataVersion } from '@/shared/db/useDataVersion';
import { getBudgetOverview, type BudgetOverview } from '@/entities/budget';
import { getSettings } from '@/entities/settings';
import { toDateKey } from '@/shared/lib/period';

type State = { overview: BudgetOverview | null; error: Error | null };

/** Сводка текущего периода; пересчитывается после каждого изменения базы. */
export function useBudgetOverview(): State {
  const version = useDataVersion();
  const [state, setState] = useState<State>({ overview: null, error: null });
  useEffect(() => {
    let cancelled = false;
    getSettings(db)
      .then((settings) => getBudgetOverview(db, toDateKey(new Date()), settings))
      .then(
        (overview) => !cancelled && setState({ overview, error: null }),
        (e: unknown) =>
          !cancelled && setState({ overview: null, error: e instanceof Error ? e : new Error(String(e)) }),
      );
    return () => {
      cancelled = true;
    };
  }, [version]);
  return state;
}
