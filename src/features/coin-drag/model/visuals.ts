import { canDrop } from './rules';
import type { DragPhase, DragSource, DropTargetInfo } from './types';
import { targetKey } from './types';

/** Нужная для вида часть состояния жеста. */
export interface DragSnapshot {
  phase: DragPhase;
  source: DragSource | null;
  hoverKey: string | null;
}

/** idle — жеста нет; valid — сюда можно бросить; hover — монета над целью; dimmed — сюда нельзя. */
export type TargetVisual = 'idle' | 'valid' | 'hover' | 'dimmed';
/** Монета в лотке: source — исходный слот (пунктирный круг), остальное как у цели. */
export type CoinVisual = TargetVisual | 'source';

/** Вид плитки или монеты-цели во время жеста. */
export function targetVisual(snapshot: DragSnapshot, target: DropTargetInfo): TargetVisual {
  if (snapshot.phase !== 'dragging' || !snapshot.source) return 'idle';
  if (!canDrop(snapshot.source, target)) return 'dimmed';
  return snapshot.hoverKey === targetKey(target) ? 'hover' : 'valid';
}

/** Вид монеты лотка: её саму тянут (source), она цель (как у плитки) или не цель вовсе (income) и тускнеет. */
export function coinVisual(snapshot: DragSnapshot, self: DragSource, asTarget: DropTargetInfo | null): CoinVisual {
  const active = snapshot.source;
  if (snapshot.phase === 'idle' || !active) return 'idle';
  if (active.kind === self.kind && active.id === self.id) return 'source';
  if (snapshot.phase !== 'dragging') return 'idle';
  return asTarget ? targetVisual(snapshot, asTarget) : 'dimmed';
}
