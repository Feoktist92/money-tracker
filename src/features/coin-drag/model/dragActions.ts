import * as Haptics from 'expo-haptics';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDragStore } from './dragStore';
import { dragMotion } from './motion';
import { collectCandidates, measureTargets, measureView } from './registry';
import type { DragSource } from './types';

/**
 * Начало жеста (JS-поток): запоминает допустимые цели, даёт хаптик и измеряет цели и исходную монету в окне.
 * Цели измеряются именно здесь, в момент активации, а не по onLayout: после прокрутки мозаики координаты устарели бы.
 */
export async function startDrag(source: DragSource, sourceRef: RefObject<View | null>): Promise<void> {
  const candidates = collectCandidates(source);
  useDragStore.getState().begin(
    source,
    candidates.map((entry) => entry.info),
  );
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const [rects, origin] = await Promise.all([measureTargets(candidates), measureView(sourceRef)]);
  // палец мог уже отпустить монету, пока шло измерение
  if (useDragStore.getState().phase !== 'dragging') return;
  dragMotion.rects.value = rects;
  if (origin) {
    dragMotion.originX.value = origin.x + origin.width / 2;
    dragMotion.originY.value = origin.y + origin.height / 2;
  }
}

/** Монета оказалась над другой целью (или ушла с цели): слабый хаптик «щелчка». */
export function hoverDrag(key: string | null): void {
  useDragStore.getState().setHover(key);
  if (key) void Haptics.selectionAsync();
}

/** Палец отпущен: key — цель под ним или null. Бросок на цель кладёт результат в хранилище. */
export function finishDrag(key: string | null): void {
  useDragStore.getState().finish(key);
}

/** Призрак вернулся в лоток. */
export function settleDrag(): void {
  useDragStore.getState().settle();
}

/** Призрак и палец: центр призрака лежит левее и выше пальца на SHIFT − GHOST / 2 (см. DragLayer). */
export const GHOST = 64;
export const SHIFT = GHOST + 8;
const SPRING = { damping: 18, stiffness: 220, mass: 0.8 } as const;

/** Бросок мимо: призрак пружиной летит в исходный слот лотка, затем жест считается законченным. */
export function returnGhost(reduceMotion: boolean): void {
  // центр призрака (x − SHIFT + GHOST / 2) должен лечь на центр исходной монеты
  const toX = dragMotion.originX.value + SHIFT - GHOST / 2;
  const toY = dragMotion.originY.value + SHIFT - GHOST / 2;
  if (reduceMotion) {
    dragMotion.x.value = toX;
    dragMotion.y.value = toY;
    settleDrag();
    return;
  }
  dragMotion.x.value = withSpring(toX, SPRING);
  dragMotion.y.value = withSpring(toY, SPRING, (finished) => {
    'worklet';
    if (finished) scheduleOnRN(settleDrag);
  });
}
