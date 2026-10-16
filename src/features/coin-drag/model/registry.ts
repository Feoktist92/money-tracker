import type { RefObject } from 'react';
import type { View } from 'react-native';

import { canDrop } from './rules';
import type { DragSource, DropTargetInfo, TargetRect } from './types';
import { targetKey } from './types';

export interface RegisteredTarget {
  info: DropTargetInfo;
  ref: RefObject<View | null>;
}

export interface WindowBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const targets = new Map<string, RegisteredTarget>();

/** Регистрирует вид как цель броска; возвращает функцию отмены регистрации (для cleanup эффекта). */
export function registerTarget(info: DropTargetInfo, ref: RefObject<View | null>): () => void {
  const key = targetKey(info);
  const entry: RegisteredTarget = { info, ref };
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

/** Положение вида в координатах окна; null, если вид уже размонтирован. */
export function measureView(ref: RefObject<View | null>): Promise<WindowBox | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

/**
 * Измеряет цели в момент начала жеста (а не по onLayout): после прокрутки мозаики координаты устарели бы.
 * Размонтированные и нулевые по размеру цели отбрасываются.
 */
export async function measureTargets(candidates: readonly RegisteredTarget[]): Promise<TargetRect[]> {
  const boxes = await Promise.all(candidates.map((entry) => measureView(entry.ref)));
  const rects: TargetRect[] = [];
  candidates.forEach((entry, index) => {
    const box = boxes[index];
    if (box && box.width > 0 && box.height > 0) rects.push({ key: targetKey(entry.info), ...box });
  });
  return rects;
}
