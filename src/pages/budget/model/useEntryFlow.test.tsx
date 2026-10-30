import { eq } from 'drizzle-orm';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { act, create } from 'react-test-renderer';

import type { BudgetOverview, BudgetRow } from '@/entities/budget';
import { useEntryStore, useUndoStore } from '@/features/amount-entry';
import type { EntryDraft, EntrySession } from '@/features/amount-entry';
import { useDragStore } from '@/features/coin-drag';
import { db } from '@/shared/db/client';
import { transactions } from '@/shared/db/schema';
import { insertTestTransaction, seededIds } from '@/shared/db/testing';

import { type EntryFlow, useEntryFlow } from './useEntryFlow';
import type { BudgetPageData } from './useBudgetPage';

// База — настоящая (better-sqlite3 в памяти с миграциями приложения); клиент приложения подменён ею
jest.mock('@/shared/db/client', () => ({ db: jest.requireActual('@/shared/db/testing').createTestDb() }));

let ids: Awaited<ReturnType<typeof seededIds>>;
let data: BudgetPageData;

const food = (): { id: string; name: string } => ({ id: ids.category['Продукты']!, name: 'Продукты' });
const main = (): { id: string; name: string } => ({ id: ids.account['Основная']!, name: 'Основная' });
const savings = (): { id: string; name: string } => ({ id: ids.account['Накопления']!, name: 'Накопления' });

beforeAll(async () => {
  ids = await seededIds(db);
  const row = {
    categoryId: food().id,
    name: 'Продукты',
    icon: 'shopping-basket',
    color: 'violet',
    hasLimit: true,
    limit: 1_800_000,
    carryIn: 0,
    available: 1_800_000,
    spent: 0,
    remaining: 1_800_000,
    state: 'normal',
  } satisfies BudgetRow;
  data = {
    today: '2026-10-15',
    overview: { rows: [row] } as unknown as BudgetOverview,
    income: [],
    accounts: [
      { ...main(), icon: 'credit-card', color: 'violet', balance: 500_000 },
      { ...savings(), icon: 'piggy-bank', color: 'teal', balance: 1_000_000 },
    ],
  };
});

beforeEach(async () => {
  await db.delete(transactions);
});

afterEach(() => {
  act(() => {
    useEntryStore.getState().close();
    useUndoStore.getState().dismiss();
    useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
  });
  jest.restoreAllMocks();
});

/** Хост хука: кладёт последний результат useEntryFlow в flow.current. */
async function mountFlow(): Promise<{ flow: { current: EntryFlow | null }; unmount: () => void }> {
  const flow: { current: EntryFlow | null } = { current: null };
  function Host() {
    const result = useEntryFlow(data);
    useEffect(() => {
      flow.current = result;
    });
    return null;
  }
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Host />);
  });
  return { flow, unmount: () => act(() => tree.unmount()) };
}

const expenseSession = (): EntrySession => ({ type: 'expense', account: main(), category: food() });
const draftOf = (session: EntrySession, amount = 124_000): EntryDraft => ({ session, amount, dayOffset: 0, note: '' });
const rows = () => db.select().from(transactions);

describe('useEntryFlow', () => {
  it('бросок монеты счёта на плитку открывает шторку расхода и очищает результат броска', async () => {
    const { unmount } = await mountFlow();
    await act(async () => {
      useDragStore.setState({
        dropped: {
          source: { kind: 'account', ...main(), icon: 'credit-card', color: 'violet' },
          target: { kind: 'category', ...food() },
        },
      });
    });
    expect(useEntryStore.getState().session).toEqual(expenseSession());
    expect(useDragStore.getState().dropped).toBeNull();
    unmount();
  });

  it('нажатие на плитку без истории открывает расход с первым счётом', async () => {
    const { flow, unmount } = await mountFlow();
    await act(async () => flow.current!.openForTile(data.overview.rows[0]!));
    expect(useEntryStore.getState().session).toMatchObject(expenseSession());
    unmount();
  });

  it('нажатие на плитку после расхода берёт счёт последней операции', async () => {
    insertTestTransaction(db, {
      type: 'expense',
      amount: 50_000,
      date: '2026-10-14',
      fromAccountId: savings().id,
      categoryId: food().id,
    });
    const { flow, unmount } = await mountFlow();
    await act(async () => flow.current!.openForTile(data.overview.rows[0]!));
    expect(useEntryStore.getState().session).toMatchObject({ type: 'expense', account: savings(), category: food() });
    unmount();
  });

  it('нажатие на плитку при уже открытой шторке её не подменяет', async () => {
    const other: EntrySession = { type: 'transfer', from: main(), to: savings() };
    const { flow, unmount } = await mountFlow();
    act(() => useEntryStore.getState().open(other));
    await act(async () => flow.current!.openForTile(data.overview.rows[0]!));
    expect(useEntryStore.getState().session).toBe(other);
    unmount();
  });

  it('«Записать» пишет одну операцию, показывает отмену с её id и закрывает шторку', async () => {
    const session = expenseSession();
    const { flow, unmount } = await mountFlow();
    act(() => useEntryStore.getState().open(session));
    await act(async () => flow.current!.record(draftOf(session)));
    const written = await rows();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ type: 'expense', amount: 124_000, categoryId: food().id });
    expect(useUndoStore.getState().entry?.id).toBe(written[0]!.id);
    expect(useEntryStore.getState().session).toBeNull();
    unmount();
  });

  it('два одновременных «Записать» дают одну операцию', async () => {
    const session = expenseSession();
    const { flow, unmount } = await mountFlow();
    act(() => useEntryStore.getState().open(session));
    await act(async () => {
      await Promise.all([flow.current!.record(draftOf(session)), flow.current!.record(draftOf(session))]);
    });
    expect(await rows()).toHaveLength(1);
    unmount();
  });

  it('«Записать» по устаревшему черновику (шторка уже закрыта) ничего не пишет', async () => {
    const session = expenseSession();
    const { flow, unmount } = await mountFlow();
    act(() => useEntryStore.getState().open(session));
    act(() => useEntryStore.getState().close());
    await act(async () => flow.current!.record(draftOf(session)));
    expect(await rows()).toHaveLength(0);
    expect(useUndoStore.getState().entry).toBeNull();
    unmount();
  });

  it('ошибка записи: шторка остаётся открытой, показан Alert, отмены нет', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const broken: EntrySession = { type: 'expense', account: main(), category: { id: 'нет-такой', name: 'Нет' } };
    const { flow, unmount } = await mountFlow();
    act(() => useEntryStore.getState().open(broken));
    await act(async () => flow.current!.record(draftOf(broken)));
    expect(alert).toHaveBeenCalledWith('Не удалось записать', 'Попробуйте ещё раз.');
    expect(useEntryStore.getState().session).toBe(broken);
    expect(useUndoStore.getState().entry).toBeNull();
    expect(await db.select().from(transactions).where(eq(transactions.categoryId, 'нет-такой'))).toHaveLength(0);
    // после ошибки запись снова доступна (флаг «идёт запись» снят)
    const session = expenseSession();
    act(() => useEntryStore.getState().open(session));
    await act(async () => flow.current!.record(draftOf(session)));
    expect(await rows()).toHaveLength(1);
    unmount();
  });
});
