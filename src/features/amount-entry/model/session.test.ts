import { actionLabel, afterLine, buildTransaction, contextLabel, type EntryDraft, type EntrySession } from './session';

const NB = '\u00A0';
const MINUS = '−';

const expense: EntrySession = {
  type: 'expense',
  account: { id: 'main', name: 'Основная' },
  category: { id: 'food', name: 'Продукты' },
};
const income: EntrySession = {
  type: 'income',
  category: { id: 'salary', name: 'Зарплата' },
  account: { id: 'main', name: 'Основная' },
};
const transfer: EntrySession = {
  type: 'transfer',
  from: { id: 'main', name: 'Основная' },
  to: { id: 'savings', name: 'Накопления' },
};

describe('contextLabel', () => {
  it('откуда → куда для всех трёх видов', () => {
    expect(contextLabel(expense)).toBe('Основная → Продукты');
    expect(contextLabel(income)).toBe('Зарплата → Основная');
    expect(contextLabel(transfer)).toBe('Основная → Накопления');
  });
});

describe('actionLabel', () => {
  it('расход со знаком «−», доход с «+», перевод без знака', () => {
    expect(actionLabel(expense, 124000)).toBe(`Записать ${MINUS}1${NB}240${NB}₽`);
    expect(actionLabel(income, 5000000)).toBe(`Записать +50${NB}000${NB}₽`);
    expect(actionLabel(transfer, 124050)).toBe(`Перевести 1${NB}240,50${NB}₽`);
  });

  it('без суммы — просто глагол', () => {
    expect(actionLabel(expense, null)).toBe('Записать');
    expect(actionLabel(transfer, null)).toBe('Перевести');
  });
});

describe('afterLine', () => {
  it('расход: остаток категории минус сумма; ниже нуля — перерасход', () => {
    expect(afterLine(expense, { categoryRemaining: 676000 }, 124000)).toBe(`Останется: 5${NB}520${NB}₽`);
    expect(afterLine(expense, { categoryRemaining: 676000 }, null)).toBe(`Останется: 6${NB}760${NB}₽`);
    expect(afterLine(expense, { categoryRemaining: 100000 }, 186000)).toBe(`Перерасход: 860${NB}₽`);
    expect(afterLine(expense, { categoryRemaining: 100000 }, 100000)).toBe(`Останется: 0${NB}₽`);
  });

  it('уже ушедшая в минус категория: остаток отрицательный — перерасход растёт', () => {
    expect(afterLine(expense, { categoryRemaining: -86000 }, 14000)).toBe(`Перерасход: 1${NB}000${NB}₽`);
  });

  it('доход: баланс счёта после зачисления; перевод: остаток на счёте-источнике', () => {
    expect(afterLine(income, { targetBalance: 4821500 }, 5000000)).toBe(`На счёте будет: 98${NB}215${NB}₽`);
    expect(afterLine(transfer, { sourceBalance: 4821500 }, 1000000)).toBe(`Останется на счёте: 38${NB}215${NB}₽`);
  });

  it('нет данных — строки нет', () => {
    expect(afterLine(expense, {}, 1000)).toBeNull();
    expect(afterLine(income, {}, 1000)).toBeNull();
    expect(afterLine(transfer, {}, 1000)).toBeNull();
  });
});

describe('buildTransaction', () => {
  const draft = (session: EntrySession, patch: Partial<EntryDraft> = {}): EntryDraft => ({
    session,
    amount: 124000,
    dayOffset: 0,
    note: '',
    ...patch,
  });

  it('расход: списание со счёта на категорию', () => {
    expect(buildTransaction(draft(expense), '2026-10-15')).toEqual({
      type: 'expense',
      amount: 124000,
      date: '2026-10-15',
      note: undefined,
      fromAccountId: 'main',
      categoryId: 'food',
    });
  });

  it('доход: зачисление на счёт с категорией дохода', () => {
    expect(buildTransaction(draft(income), '2026-10-15')).toMatchObject({
      type: 'income',
      toAccountId: 'main',
      categoryId: 'salary',
    });
  });

  it('перевод: между счетами, без категории', () => {
    const tx = buildTransaction(draft(transfer), '2026-10-15');
    expect(tx).toMatchObject({ type: 'transfer', fromAccountId: 'main', toAccountId: 'savings' });
    expect(tx).not.toHaveProperty('categoryId');
  });

  it('«Вчера» сдвигает дату, в том числе через границу месяца', () => {
    expect(buildTransaction(draft(expense, { dayOffset: -1 }), '2026-10-15').date).toBe('2026-10-14');
    expect(buildTransaction(draft(expense, { dayOffset: -1 }), '2026-11-01').date).toBe('2026-10-31');
  });

  it('комментарий обрезается по краям, пустой становится undefined', () => {
    expect(buildTransaction(draft(expense, { note: '  Пятёрочка ' }), '2026-10-15').note).toBe('Пятёрочка');
    expect(buildTransaction(draft(expense, { note: '   ' }), '2026-10-15').note).toBeUndefined();
  });
});
