import type { DropResult } from '@/features/coin-drag';

/** Текст временного уведомления о броске монеты; в фазе 2c его заменит шторка ввода суммы. */
export function describeDrop({ source, target }: DropResult): { title: string; body: string } {
  const what = target.kind === 'category' ? 'Расход' : source.kind === 'income' ? 'Доход' : 'Перевод';
  return {
    title: `${what}: ${source.name} → ${target.name}`,
    body: 'Ввод суммы появится в следующем обновлении.',
  };
}
