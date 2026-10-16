import { useEntryStore } from './entryStore';
import type { EntrySession } from './session';

const session: EntrySession = {
  type: 'expense',
  account: { id: 'main', name: 'Основная' },
  category: { id: 'food', name: 'Продукты' },
};
const state = () => useEntryStore.getState();

beforeEach(() => state().close());

describe('entryStore', () => {
  it('open открывает шторку с чистым вводом', () => {
    state().open(session);
    expect(state()).toMatchObject({ session, expression: '', dayOffset: 0, note: '' });
  });

  it('повторный open сбрасывает прошлый ввод', () => {
    state().open(session);
    state().press('5');
    state().setDayOffset(-1);
    state().setNote('кофе');
    state().open(session);
    expect(state()).toMatchObject({ expression: '', dayOffset: 0, note: '' });
  });

  it('press набирает выражение через pressKey', () => {
    state().open(session);
    (['1', '0', '0', '0', '+', '2', '4', '0'] as const).forEach((key) => state().press(key));
    expect(state().expression).toBe('1000+240');
    state().press('back');
    expect(state().expression).toBe('1000+24');
    state().press('clear');
    expect(state().expression).toBe('');
  });

  it('setExpression подставляет сумму чипа', () => {
    state().open(session);
    state().setExpression('1240');
    expect(state().expression).toBe('1240');
  });

  it('пока шторка закрыта, ввод игнорируется', () => {
    state().press('5');
    state().setExpression('99');
    state().setDayOffset(-1);
    state().setNote('x');
    expect(state()).toMatchObject({ session: null, expression: '', dayOffset: 0, note: '' });
  });

  it('close закрывает и очищает ввод', () => {
    state().open(session);
    state().press('7');
    state().close();
    expect(state()).toMatchObject({ session: null, expression: '', note: '' });
  });
});
