import { create } from 'zustand';

import { type AmountKey, pressKey } from '@/shared/lib/amount-input';

import type { DayOffset, EntrySession } from './session';

interface EntryState {
  /** Открытая шторка: что записываем. null — шторка закрыта. */
  session: EntrySession | null;
  /** Набранное выражение («1000+240»). */
  expression: string;
  dayOffset: DayOffset;
  note: string;
  open: (session: EntrySession) => void;
  close: () => void;
  press: (key: AmountKey) => void;
  setExpression: (expression: string) => void;
  setDayOffset: (dayOffset: DayOffset) => void;
  setNote: (note: string) => void;
}

const closed = { session: null, expression: '', dayOffset: 0, note: '' } as const;

export const useEntryStore = create<EntryState>((set) => ({
  ...closed,
  open: (session) => set({ session, expression: '', dayOffset: 0, note: '' }),
  close: () => set(closed),
  press: (key) => set((state) => (state.session ? { expression: pressKey(state.expression, key) } : state)),
  setExpression: (expression) => set((state) => (state.session ? { expression } : state)),
  setDayOffset: (dayOffset) => set((state) => (state.session ? { dayOffset } : state)),
  setNote: (note) => set((state) => (state.session ? { note } : state)),
}));
