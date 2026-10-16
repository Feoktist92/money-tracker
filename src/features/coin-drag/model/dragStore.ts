import { create } from 'zustand';

import type { DragPhase, DragSource, DropTargetInfo } from './types';
import { targetKey } from './types';

export type { DragPhase };

export interface DropResult {
  source: DragSource;
  target: DropTargetInfo;
}

interface DragState {
  phase: DragPhase;
  source: DragSource | null;
  /** Ключ цели под пальцем (targetKey) или null. */
  hoverKey: string | null;
  /** Допустимые цели текущего жеста: по ключу. Заполняется при старте жеста. */
  candidates: Record<string, DropTargetInfo>;
  /** Результат последнего броска на цель; потребитель (страница) обрабатывает его и вызывает clearDrop. */
  dropped: DropResult | null;
  begin: (source: DragSource, candidates: DropTargetInfo[]) => void;
  setHover: (key: string | null) => void;
  /** Конец жеста: бросок на цель с таким ключом или null — мимо. */
  finish: (key: string | null) => void;
  settle: () => void;
  clearDrop: () => void;
}

const idle = { phase: 'idle', source: null, hoverKey: null, candidates: {} } as const;

export const useDragStore = create<DragState>((set, get) => ({
  ...idle,
  dropped: null,
  begin: (source, candidates) => {
    // монета уже в руке: второй begin не подменяет источник; во время возврата новый жест разрешён
    if (get().phase === 'dragging') return;
    set({
      phase: 'dragging',
      source,
      hoverKey: null,
      candidates: Object.fromEntries(candidates.map((target) => [targetKey(target), target])),
      dropped: null,
    });
  },
  setHover: (key) => {
    if (get().phase === 'dragging') set({ hoverKey: key });
  },
  finish: (key) => {
    const { source, candidates, phase } = get();
    if (phase !== 'dragging' || !source) return;
    const target = key ? candidates[key] : undefined;
    if (target) set({ ...idle, dropped: { source, target } });
    else set({ phase: 'returning', hoverKey: null, candidates: {} });
  },
  settle: () => {
    if (get().phase === 'returning') set(idle);
  },
  clearDrop: () => set({ dropped: null }),
}));
