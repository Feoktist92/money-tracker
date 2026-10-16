import { create } from 'zustand';

/** Сколько секунд после записи доступна отмена (DESIGN.md: snackbar «Записано · Отменить», 5 секунд). */
export const UNDO_MS = 5000;

export interface UndoEntry {
  /** id записанной операции. */
  id: string;
  /** Для озвучивания: «−1 240 ₽ в Продукты». */
  label: string;
}

interface UndoState {
  entry: UndoEntry | null;
  /** Растёт при каждом показе: новая запись перезапускает таймер, даже если текст тот же. */
  token: number;
  show: (entry: UndoEntry) => void;
  dismiss: () => void;
}

export const useUndoStore = create<UndoState>((set) => ({
  entry: null,
  token: 0,
  show: (entry) => set((state) => ({ entry, token: state.token + 1 })),
  dismiss: () => set({ entry: null }),
}));
