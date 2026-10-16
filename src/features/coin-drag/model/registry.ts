import type { RefObject } from 'react';
import type { View } from 'react-native';

import { canDrop } from './rules';
import type { DragSource, DropTargetInfo, TargetRect } from './types';
import { targetKey } from './types';

export interface RegisteredTarget {
  info: DropTargetInfo;
  ref: RefObject<View | null>;
  /** Вид, который обрезает цель (область прокрутки): прямоугольник цели пересекается с его окном. */
  clipRef?: RefObject<View | null>;
}

export interface WindowBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const targets = new Map<string, RegisteredTarget>();

/** Регистрирует вид как цель броска; возвращает функцию отмены регистрации (для cleanup эффекта). */
export function registerTarget(
  info: DropTargetInfo,
  ref: RefObject<View | null>,
  clipRef?: RefObject<View | null>,
): () => void {
  const key = targetKey(info);
  const entry: RegisteredTarget = { info, ref, clipRef };
  targets.set(key, entry);
  return () => {
    // не сносим регистрацию, если ключ успел занять другой вид
    if (targets.get(key) === entry) targets.delete(key);
  };
}

/** Цели, на которые эту монету можно бросить. */
export function collectCandidates(source: DragSource): RegisteredTarget[] {
  return [...targets.values()].filter((entry) => canDrop(source, entry.info));
}

/** Сколько ждать ответа measureInWindow: у отсоединённого вида колбэк может не прийти никогда. */
export const MEASURE_TIMEOUT_MS = 300;

/** Положение вида в координатах окна; null, если вид размонтирован или не ответил за MEASURE_TIMEOUT_MS. */
export function measureView(ref: RefObject<View | null>): Promise<WindowBox | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS);
    node.measureInWindow((x, y, width, height) => {
      clearTimeout(timer);
      resolve({ x, y, width, height });
    });
  });
}

/** Пересечение двух прямоугольников окна; null, если общей площади нет. */
function intersect(a: WindowBox, b: WindowBox): WindowBox | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

/**
 * Измеряет цели в момент начала жеста (а не по onLayout): после прокрутки мозаики координаты устарели бы.
 * measureInWindow отдаёт положение плитки без учёта обрезки ScrollView, поэтому цель с clipRef пересекается с окном
 * этого вида (каждый вид измеряется один раз): невидимые цели отбрасываются, у частично видимых остаётся видимая часть.
 * Размонтированные, нулевые по размеру и невидимые цели отбрасываются.
 */
export async function measureTargets(candidates: readonly RegisteredTarget[]): Promise<TargetRect[]> {
  const clipRefs = [...new Set(candidates.map((entry) => entry.clipRef).filter((ref) => ref !== undefined))];
  const [boxes, clipBoxes] = await Promise.all([
    Promise.all(candidates.map((entry) => measureView(entry.ref))),
    Promise.all(clipRefs.map((ref) => measureView(ref))),
  ]);
  const clipByRef = new Map(clipRefs.map((ref, index) => [ref, clipBoxes[index]]));
  const rects: TargetRect[] = [];
  candidates.forEach((entry, index) => {
    const box = boxes[index];
    if (!box || box.width <= 0 || box.height <= 0) return;
    let visible: WindowBox | null = box;
    if (entry.clipRef) {
      const clip = clipByRef.get(entry.clipRef);
      visible = clip ? intersect(box, clip) : null;
    }
    if (visible) rects.push({ key: targetKey(entry.info), ...visible });
  });
  return rects;
}
