import { useEffect, useMemo, useRef } from 'react';
import type { View } from 'react-native';

import { createCoinGesture } from './coinGesture';
import { startDrag } from './dragActions';
import { useDragStore } from './dragStore';
import { registerTarget } from './registry';
import type { DragSource, DropTargetInfo } from './types';
import { coinVisual, type CoinVisual } from './visuals';

/**
 * Монета лотка: жест перетаскивания, вид по состоянию жеста и (для счёта) регистрация как цели броска.
 * Вешать `ref` на вид монеты, `gesture` — на GestureDetector.
 */
export function useCoinDrag(source: DragSource, asTarget: DropTargetInfo | null) {
  const ref = useRef<View>(null);
  const { kind, id, name, icon, color } = source;
  const stableSource = useMemo<DragSource>(() => ({ kind, id, name, icon, color }), [kind, id, name, icon, color]);

  const targetKind = asTarget?.kind;
  const targetId = asTarget?.id;
  const targetName = asTarget?.name;
  const stableTarget = useMemo<DropTargetInfo | null>(
    () => (targetKind && targetId && targetName ? { kind: targetKind, id: targetId, name: targetName } : null),
    [targetKind, targetId, targetName],
  );
  useEffect(() => (stableTarget ? registerTarget(stableTarget, ref) : undefined), [stableTarget]);

  const visual: CoinVisual = useDragStore((state) => coinVisual(state, stableSource, stableTarget));

  const gesture = useMemo(
    // ref читается только когда жест активируется (в обработчике), а не при рендере
    // eslint-disable-next-line react-hooks/refs
    () => createCoinGesture(() => void startDrag(stableSource, ref)),
    [stableSource],
  );

  return { ref, gesture, visual };
}
