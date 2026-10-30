import { categorySubtitle } from './categoryRows';

const NB = '\u00A0';

describe('categorySubtitle', () => {
  it('расход с лимитом и без', () => {
    expect(categorySubtitle({ kind: 'expense', monthlyLimit: 1_800_000 })).toBe(`Лимит 18${NB}000${NB}₽`);
    expect(categorySubtitle({ kind: 'expense', monthlyLimit: null })).toBe('Без лимита');
    expect(categorySubtitle({ kind: 'expense', monthlyLimit: 9_950 })).toBe(`Лимит 99,50${NB}₽`);
  });

  it('доход — просто «Доход»', () => {
    expect(categorySubtitle({ kind: 'income', monthlyLimit: null })).toBe('Доход');
  });
});
