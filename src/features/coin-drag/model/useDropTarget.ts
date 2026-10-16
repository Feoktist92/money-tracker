import { type RefObject, useEffect, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { useDragStore } from './dragStore';
import { registerTarget } from './registry';
import type { DropTargetInfo } from './types';
import { targetVisual, type TargetVisual } from './visuals';

/** Плитка-цель: регистрирует вид для броска и отдаёт его вид по состоянию жеста. `ref` — на корневой View плитки. */
export function useDropTarget(info: DropTargetInfo): { ref: RefObject<View | null>; visual: TargetVisual } {
  const ref = useRef<View>(null);
  const { kind, id, name } = info;
  const stable = useMemo<DropTargetInfo>(() => ({ kind, id, name }), [kind, id, name]);
  useEffect(() => registerTarget(stable, ref), [stable]);
  const visual = useDragStore((state) => targetVisual(state, stable));
  return { ref, visual };
}
