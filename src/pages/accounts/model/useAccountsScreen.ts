import { useCallback, useEffect, useState } from 'react';

import {
  getAccountBalances,
  listAccounts,
  listArchivedAccounts,
  reorderAccounts,
  setAccountArchived,
} from '@/entities/account';
import { db } from '@/shared/db/client';
import { useDataVersion } from '@/shared/db/useDataVersion';
import { moveId } from '@/shared/lib/order';

import type { AccountRow, ArchivedAccountRow } from './accountRows';

interface AccountsScreenData {
  accounts: AccountRow[];
  archived: ArchivedAccountRow[];
}

/** Данные экрана «Счета» и его действия: порядок, возврат из архива. Перечитывается после каждого изменения базы. */
export function useAccountsScreen() {
  const version = useDataVersion();
  const [data, setData] = useState<AccountsScreenData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [active, archived, balances] = await Promise.all([
        listAccounts(db),
        listArchivedAccounts(db),
        getAccountBalances(db),
      ]);
      if (cancelled) return;
      setData({
        accounts: active.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          color: a.color,
          type: a.type,
          balance: balances[a.id] ?? 0,
        })),
        archived: archived.map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color })),
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [version]);

  const move = useCallback(
    (id: string, delta: -1 | 1) => {
      if (!data) return;
      void reorderAccounts(
        db,
        moveId(
          data.accounts.map((a) => a.id),
          id,
          delta,
        ),
      );
    },
    [data],
  );
  const restore = useCallback((id: string) => void setAccountArchived(db, id, false), []);

  return { data, move, restore };
}
