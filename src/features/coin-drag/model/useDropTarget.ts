import { type RefObject, useEffect, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { useDragStore } from './dragStore';
import { registerTarget } from './registry';
import type { DropTargetInfo } from './types';
import { targetVisual, type TargetVisual } from './visuals';

/**
 * Плитка-цель: регистрирует вид для броска и отдаёт его вид по состоянию жеста. `ref` — на корневой View плитки;
 * `clipRef` — вид-область (viewport прокрутки), обрезающий плитку: за его пределами плитка не принимает бросок.
 * `enabled = false` — плитка-двойник (превью в шторке): не регистрируется и всегда в обычном виде.
 */
export function useDropTarget(
  info: DropTargetInfo,
  clipRef?: RefObject<View | null>,
  enabled = true,
): { ref: RefObject<View | null>; visual: TargetVisual } {
  const ref = useRef<View>(null);
  const { kind, id, name } = info;
  const stable = useMemo<DropTargetInfo>(() => ({ kind, id, name }), [kind, id, name]);
  useEffect(() => (enabled ? registerTarget(stable, ref, clipRef) : undefined), [stable, clipRef, enabled]);
  const visual = useDragStore((state) => (enabled ? targetVisual(state, stable) : 'idle'));
  return { ref, visual };
}
