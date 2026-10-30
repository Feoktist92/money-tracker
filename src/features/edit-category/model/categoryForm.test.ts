import { type CategoryDraft, emptyCategory, validateCategoryDraft } from './categoryForm';

const draft = (patch: Partial<CategoryDraft> = {}): CategoryDraft => ({
  ...emptyCategory('expense'),
  name: 'Спорт',
  ...patch,
});

describe('emptyCategory', () => {
  it('значок и цвет по умолчанию зависят от вида', () => {
    expect(emptyCategory('expense')).toMatchObject({
      kind: 'expense',
      icon: 'shopping-basket',
      color: 'violet',
      name: '',
    });
    expect(emptyCategory('income')).toMatchObject({ kind: 'income', icon: 'arrow-down-to-line' });
  });
});

describe('validateCategoryDraft', () => {
  it('расход без лимита: лимит null', () => {
    expect(validateCategoryDraft(draft({ name: ' Спорт ' }), [])).toEqual({
      ok: true,
      value: { name: 'Спорт', kind: 'expense', icon: 'shopping-basket', color: 'violet', monthlyLimit: null },
    });
  });

  it('лимит в рублях переводится в копейки', () => {
    const r = validateCategoryDraft(draft({ monthlyLimit: '3 000' }), []);
    expect(r.ok && r.value.monthlyLimit).toBe(300000);
    const kopecks = validateCategoryDraft(draft({ monthlyLimit: '99,50' }), []);
    expect(kopecks.ok && kopecks.value.monthlyLimit).toBe(9950);
  });

  it('лимит ноль, отрицательный, мусор и слишком большой — ошибки по полю лимита', () => {
    expect(validateCategoryDraft(draft({ monthlyLimit: '0' }), [])).toEqual({
      ok: false,
      errors: { monthlyLimit: 'Лимит должен быть больше нуля' },
    });
    expect(validateCategoryDraft(draft({ monthlyLimit: '-100' }), [])).toMatchObject({ ok: false });
    expect(validateCategoryDraft(draft({ monthlyLimit: 'много' }), [])).toMatchObject({
      ok: false,
      errors: { monthlyLimit: expect.any(String) },
    });
    expect(validateCategoryDraft(draft({ monthlyLimit: '1000000000' }), [])).toEqual({
      ok: false,
      errors: { monthlyLimit: 'Слишком большая сумма' },
    });
  });

  it('у дохода лимит игнорируется, даже если в поле остался мусор', () => {
    const r = validateCategoryDraft(draft({ kind: 'income', monthlyLimit: 'мусор' }), []);
    expect(r).toMatchObject({ ok: true, value: { kind: 'income', monthlyLimit: null } });
  });

  it('название: пусто, длиннее 40, повтор без учёта регистра', () => {
    expect(validateCategoryDraft(draft({ name: ' ' }), [])).toEqual({
      ok: false,
      errors: { name: 'Введите название' },
    });
    expect(validateCategoryDraft(draft({ name: 'я'.repeat(41) }), [])).toMatchObject({ ok: false });
    expect(validateCategoryDraft(draft({ name: 'кафе' }), ['Кафе'])).toEqual({
      ok: false,
      errors: { name: 'Категория с таким названием уже есть' },
    });
  });
});
