import { useCallback, useEffect, useState } from 'react';

import { listArchivedCategories, listCategories, reorderCategories, setCategoryArchived } from '@/entities/category';
import { db } from '@/shared/db/client';
import { useDataVersion } from '@/shared/db/useDataVersion';
import type { Category } from '@/shared/db/types';
import { moveId } from '@/shared/lib/order';

import type { CategoryRow } from './categoryRows';

const toRow = (c: Category): CategoryRow => ({
  id: c.id,
  name: c.name,
  kind: c.kind,
  icon: c.icon,
  color: c.color,
  monthlyLimit: c.monthlyLimit,
});

/** Данные экрана «Категории» и его действия: порядок внутри вида, возврат из архива. */
export function useCategoriesScreen() {
  const version = useDataVersion();
  const [data, setData] = useState<{ active: CategoryRow[]; archived: CategoryRow[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [expense, income, archivedExpense, archivedIncome] = await Promise.all([
        listCategories(db, 'expense'),
        listCategories(db, 'income'),
        listArchivedCategories(db, 'expense'),
        listArchivedCategories(db, 'income'),
      ]);
      if (cancelled) return;
      setData({
        active: [...expense, ...income].map(toRow),
        archived: [...archivedExpense, ...archivedIncome].map(toRow),
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [version]);

  const move = useCallback(
    (id: string, delta: -1 | 1) => {
      if (!data) return;
      const kind = data.active.find((row) => row.id === id)?.kind;
      if (!kind) return;
      const ids = data.active.filter((row) => row.kind === kind).map((row) => row.id);
      void reorderCategories(db, moveId(ids, id, delta));
    },
    [data],
  );
  const restore = useCallback((id: string) => void setCategoryArchived(db, id, false), []);

  return { data, move, restore };
}
