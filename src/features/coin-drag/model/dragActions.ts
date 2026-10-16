import * as Haptics from 'expo-haptics';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { Easing, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDragStore } from './dragStore';
import { dragMotion } from './motion';
import { collectCandidates, measureTargets, measureView } from './registry';
import type { DragSource } from './types';

/**
 * Начало жеста (JS-поток): запоминает допустимые цели, даёт хаптик и измеряет цели и исходную монету в окне.
 * Цели измеряются именно здесь, в момент активации, а не по onLayout: после прокрутки мозаики координаты устарели бы.
 */
let generation = 0;

export async function startDrag(source: DragSource, sourceRef: RefObject<View | null>): Promise<void> {
  // второй жест при монете в руке игнорируется: источник не подменяется
  if (useDragStore.getState().phase === 'dragging') return;
  const drag = ++generation;
  const candidates = collectCandidates(source);
  useDragStore.getState().begin(
    source,
    candidates.map((entry) => entry.info),
  );
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const [rects, origin] = await Promise.all([measureTargets(candidates), measureView(sourceRef)]);
  // пока шло измерение, началось следующее перетаскивание: его данные нельзя затирать запоздалыми
  if (drag !== generation) return;
  // исходный слот нужен и тогда, когда палец уже отпустил монету: призрак летит именно туда
  if (origin) {
    dragMotion.originX.value = origin.x + origin.width / 2;
    dragMotion.originY.value = origin.y + origin.height / 2;
  }
  // цели нужны только пока монета в руке
  if (useDragStore.getState().phase !== 'dragging') return;
  dragMotion.rects.value = rects;
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

/**
 * Аварийный конец: источник жеста исчез (размонтирован) до onEnd. Освобождает общие значения жеста — иначе
 * `active` остался бы 1 и блокировал все следующие перетаскивания, — и возвращает монету броском мимо.
 */
export function abortDrag(): void {
  dragMotion.active.value = 0;
  dragMotion.owner.value = -1;
  finishDrag(null);
}

/** Призрак вернулся в лоток. */
export function settleDrag(): void {
  useDragStore.getState().settle();
}

/** Призрак и палец: центр призрака лежит левее и выше пальца на SHIFT − GHOST / 2 (см. DragLayer). */
export const GHOST = 64;
export const SHIFT = GHOST + 8;
/** Возврат мимо цели: короткий прямой полёт без колебаний, чтобы слот лотка не пустовал дольше пары кадров. */
const RETURN_MS = 160;

/** Бросок мимо: призрак быстро летит в исходный слот лотка (easeOut, 160 мс), затем жест считается законченным. */
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
  const timing = { duration: RETURN_MS, easing: Easing.out(Easing.cubic) };
  dragMotion.x.value = withTiming(toX, timing);
  dragMotion.y.value = withTiming(toY, timing, (finished) => {
    'worklet';
    if (finished) scheduleOnRN(settleDrag);
  });
}
