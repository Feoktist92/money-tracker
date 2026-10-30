import { type AccountDraft, EMPTY_ACCOUNT, validateAccountDraft } from './accountForm';

const MINUS = '\u2212';
const draft = (patch: Partial<AccountDraft> = {}): AccountDraft => ({ ...EMPTY_ACCOUNT, name: 'Кредитка', ...patch });

describe('validateAccountDraft', () => {
  it('нормальная форма: имя обрезается, пустой баланс — ноль', () => {
    const result = validateAccountDraft(draft({ name: '  Кредитка  ' }), []);
    expect(result).toEqual({
      ok: true,
      value: { name: 'Кредитка', type: 'card', icon: 'credit-card', color: 'violet', initialBalance: 0 },
    });
  });

  it('баланс с копейками, пробелами, запятой и минусом (в том числе знаком «\u2212»)', () => {
    const value = (initialBalance: string) => {
      const r = validateAccountDraft(draft({ initialBalance }), []);
      return r.ok ? r.value.initialBalance : r.errors;
    };
    expect(value('1 240,50')).toBe(124050);
    expect(value('-5000')).toBe(-500000);
    expect(value(`${MINUS}5 000`)).toBe(-500000);
    expect(value('0')).toBe(0);
    expect(value('   ')).toBe(0);
  });

  it('пустое название и пробелы — ошибка', () => {
    expect(validateAccountDraft(draft({ name: '' }), [])).toEqual({ ok: false, errors: { name: 'Введите название' } });
    expect(validateAccountDraft(draft({ name: '   ' }), [])).toMatchObject({ ok: false });
  });

  it('название длиннее 40 символов — ошибка, ровно 40 допустимо', () => {
    expect(validateAccountDraft(draft({ name: 'я'.repeat(41) }), [])).toEqual({
      ok: false,
      errors: { name: 'Не длиннее 40 символов' },
    });
    expect(validateAccountDraft(draft({ name: 'я'.repeat(40) }), []).ok).toBe(true);
  });

  it('повтор названия без учёта регистра и пробелов запрещён', () => {
    expect(validateAccountDraft(draft({ name: ' ОСНОВНАЯ ' }), ['Основная'])).toEqual({
      ok: false,
      errors: { name: 'Счёт с таким названием уже есть' },
    });
    expect(validateAccountDraft(draft({ name: 'Другая' }), ['Основная']).ok).toBe(true);
  });

  it('мусор в балансе и слишком большая сумма — ошибки по полю баланса', () => {
    for (const bad of ['abc', '1,2,3', '12,345', '5-']) {
      expect(validateAccountDraft(draft({ initialBalance: bad }), [])).toMatchObject({
        ok: false,
        errors: { initialBalance: expect.any(String) },
      });
    }
    expect(validateAccountDraft(draft({ initialBalance: '999999999,99' }), []).ok).toBe(true);
    expect(validateAccountDraft(draft({ initialBalance: '1000000000' }), [])).toEqual({
      ok: false,
      errors: { initialBalance: 'Слишком большая сумма' },
    });
    expect(validateAccountDraft(draft({ initialBalance: '-1000000000' }), []).ok).toBe(false);
  });

  it('обе ошибки сразу', () => {
    const r = validateAccountDraft(draft({ name: '', initialBalance: 'x' }), []);
    expect(r).toEqual({ ok: false, errors: { name: 'Введите название', initialBalance: expect.any(String) } });
  });
});
