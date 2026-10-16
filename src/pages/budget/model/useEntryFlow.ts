import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { addTransaction, getLastAccountForCategory, getRecentAmounts } from '@/entities/transaction';
import {
  buildTransaction,
  contextLabel,
  type EntryDraft,
  type EntryInfo,
  useEntryStore,
  useUndoStore,
} from '@/features/amount-entry';
import { useDragStore } from '@/features/coin-drag';
import { db } from '@/shared/db/client';
import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { toDateKey } from '@/shared/lib/period';

import { entryInfo, pickDefaultAccount, sessionForTile, sessionFromDrop } from './entrySession';
import type { BudgetPageData } from './useBudgetPage';

const NO_AMOUNTS: Kopecks[] = [];

export interface EntryFlow {
  /** Нажатие на плитку: открыть шторку расхода со счётом по умолчанию. */
  openForTile: (row: BudgetRow) => void;
  info: EntryInfo;
  /** Самые частые суммы по категории за 30 дней. */
  recent: Kopecks[];
  /** Строка бюджета категории открытого расхода (для плитки-превью); undefined — доход, перевод или шторка закрыта. */
  previewRow: BudgetRow | undefined;
  record: (draft: EntryDraft) => Promise<void>;
}

/**
 * Весь поток ввода суммы на главном экране: бросок монеты или тап по плитке открывает шторку, шторка берёт цифры и
 * недавние суммы, «Записать» пишет операцию, snackbar предлагает отмену.
 */
export function useEntryFlow(data: BudgetPageData | null): EntryFlow {
  const session = useEntryStore((state) => state.session);
  const dropped = useDragStore((state) => state.dropped);
  const recording = useRef(false);
  const accounts = data?.accounts;
  const overview = data?.overview;

  // Бросок монеты на цель
  useEffect(() => {
    if (!dropped) return;
    useDragStore.getState().clearDrop();
    const next = sessionFromDrop(dropped);
    if (next) useEntryStore.getState().open(next);
  }, [dropped]);

  // Недавние суммы подгружаются при открытии шторки (расход и доход; у перевода категории нет). Результат помнит,
  // для какой категории он загружен: пока грузится другая, чипы не показываются.
  const categoryId = session?.type === 'expense' || session?.type === 'income' ? session.category.id : null;
  const [loaded, setLoaded] = useState<{ categoryId: string; amounts: Kopecks[] } | null>(null);
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    getRecentAmounts(db, categoryId, toDateKey(new Date())).then(
      (amounts) => !cancelled && setLoaded({ categoryId, amounts }),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [categoryId]);
  const recent = loaded && loaded.categoryId === categoryId ? loaded.amounts : NO_AMOUNTS;

  const openForTile = useCallback(
    (row: BudgetRow) => {
      // Шторка уже открыта (идёт бросок монеты или предыдущее нажатие): второе открытие её не подменяет
      if (!accounts || useEntryStore.getState().session) return;
      void getLastAccountForCategory(db, row.categoryId)
        .catch(() => null)
        .then((lastAccountId) => {
          if (useEntryStore.getState().session) return;
          const account = pickDefaultAccount(accounts, lastAccountId);
          if (!account) return;
          useEntryStore.getState().open(sessionForTile(row, account));
        });
    },
    [accounts],
  );

  const record = useCallback(async (draft: EntryDraft) => {
    // Шторка уже закрыта или заменена другой: этот черновик устарел
    if (useEntryStore.getState().session !== draft.session) return;
    if (recording.current) return;
    recording.current = true;
    try {
      const id = await addTransaction(db, buildTransaction(draft, toDateKey(new Date())));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      useUndoStore.getState().show({ id, label: `${formatMoney(draft.amount)}, ${contextLabel(draft.session)}` });
      // Пока писали, шторку могли закрыть и открыть заново: чужую не закрываем
      if (useEntryStore.getState().session === draft.session) useEntryStore.getState().close();
    } catch {
      Alert.alert('Не удалось записать', 'Попробуйте ещё раз.');
    } finally {
      recording.current = false;
    }
  }, []);

  const info = session && overview && accounts ? entryInfo(session, overview, accounts) : {};
  const previewRow =
    session?.type === 'expense' ? overview?.rows.find((row) => row.categoryId === session.category.id) : undefined;

  return { openForTile, info, recent, previewRow, record };
}
