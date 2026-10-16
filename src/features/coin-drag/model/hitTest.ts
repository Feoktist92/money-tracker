import type { TargetRect } from './types';

/**
 * Ключ цели под пальцем или null. Работает на потоке UI (воркилет), поэтому без замыканий и импортов.
 * Границы включительно слева и сверху, исключительно справа и снизу: соседние плитки не перекрываются.
 * Если прямоугольники всё же пересеклись, побеждает последняя в списке (нарисованная выше).
 */
export function hitTest(x: number, y: number, rects: readonly TargetRect[]): string | null {
  'worklet';
  let hit: string | null = null;
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i]!;
    if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) hit = r.key;
  }
  return hit;
}
