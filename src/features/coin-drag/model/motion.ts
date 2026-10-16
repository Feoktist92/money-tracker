import { makeMutable } from 'react-native-reanimated';

import type { TargetRect } from './types';

/** Общие значения жеста: пишутся на потоке UI из жеста, читаются слоем призрака. Один жест в один момент. */
export const dragMotion = {
  /** Палец, координаты окна. */
  x: makeMutable(0),
  y: makeMutable(0),
  /** Центр исходной монеты в лотке — туда призрак возвращается. */
  originX: makeMutable(0),
  originY: makeMutable(0),
  /** Измеренные в начале жеста допустимые цели. */
  rects: makeMutable<TargetRect[]>([]),
  hoverKey: makeMutable<string | null>(null),
  /** 1 — палец ещё держит монету (между onStart и onEnd). */
  active: makeMutable(0),
};
