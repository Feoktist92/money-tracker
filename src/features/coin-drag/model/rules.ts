import type { DragSource, DropTargetInfo } from './types';

/** Допустимые пары (DESIGN.md, «Перетаскивание»): доход → счёт, счёт → категория, счёт → другой счёт. */
export function canDrop(source: DragSource, target: DropTargetInfo): boolean {
  if (source.kind === 'income') return target.kind === 'account';
  if (target.kind === 'category') return true;
  return target.id !== source.id;
}
