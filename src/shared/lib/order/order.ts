/**
 * Сдвигает элемент списка на одну позицию вверх (delta = −1) или вниз (+1). У края списка и для неизвестного id
 * возвращает тот же порядок. Работает по id, а не по индексу: два быстрых нажатия не путаются.
 */
export function moveId(ids: readonly string[], id: string, delta: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
