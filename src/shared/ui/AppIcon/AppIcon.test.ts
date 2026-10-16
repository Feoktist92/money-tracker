import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '@/shared/db/seed';

import { ICONS, resolveIcon } from './AppIcon';

describe('AppIcon', () => {
  it('у каждого значка счетов и категорий из сида есть компонент', () => {
    const names = [...DEFAULT_ACCOUNTS, ...DEFAULT_CATEGORIES].map((item) => item.icon);
    const missing = names.filter((name) => !(name in ICONS));
    expect(missing).toEqual([]);
  });

  it('значки интерфейса зарегистрированы', () => {
    for (const name of ['chevron-down', 'arrow-down-right', 'bell', 'delete', 'message-square'])
      expect(name in ICONS).toBe(true);
  });

  it('неизвестное имя даёт запасной значок, а не undefined', () => {
    const fallback = resolveIcon('нет-такого-значка');
    expect(fallback).toBeDefined();
    expect(fallback).not.toBe(ICONS['house']);
  });

  it('имена из прототипа объекта («constructor») тоже дают запасной значок', () => {
    expect(resolveIcon('constructor')).toBe(resolveIcon('нет-такого-значка'));
    expect(resolveIcon('toString')).toBe(resolveIcon('нет-такого-значка'));
  });
});
