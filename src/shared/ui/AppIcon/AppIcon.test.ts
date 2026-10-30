import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '@/shared/db/seed';

import { ACCOUNT_ICON_CHOICES, CATEGORY_ICON_CHOICES, ICONS, resolveIcon } from './AppIcon';

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

  it('все значки для выбора зарегистрированы и не повторяются', () => {
    for (const choices of [ACCOUNT_ICON_CHOICES, CATEGORY_ICON_CHOICES]) {
      expect(choices.filter((name) => !(name in ICONS))).toEqual([]);
      expect(new Set(choices).size).toBe(choices.length);
    }
  });

  it('значки сида есть среди вариантов выбора: открытая форма покажет текущий значок', () => {
    expect(DEFAULT_ACCOUNTS.filter((a) => !ACCOUNT_ICON_CHOICES.includes(a.icon))).toEqual([]);
    expect(DEFAULT_CATEGORIES.filter((c) => !CATEGORY_ICON_CHOICES.includes(c.icon))).toEqual([]);
  });

  it('значки интерфейса для списков и форм зарегистрированы', () => {
    for (const name of [
      'plus',
      'check',
      'arrow-up',
      'arrow-down',
      'archive',
      'archive-restore',
      'pencil',
      'chevron-right',
    ]) {
      expect(name in ICONS).toBe(true);
    }
  });
});
