import { ACCOUNT_TYPE_LABELS, accountSubtitle } from './accountRows';

const NB = '\u00A0';
const MINUS = '\u2212';

describe('accountSubtitle', () => {
  it('тип и баланс', () => {
    expect(accountSubtitle({ type: 'card', balance: 4_821_500 })).toBe(`Карта · 48${NB}215${NB}₽`);
    expect(accountSubtitle({ type: 'savings', balance: 1_264_050 })).toBe(`Накопления · 12${NB}640,50${NB}₽`);
  });

  it('отрицательный баланс (овердрафт) со знаком «минус»', () => {
    expect(accountSubtitle({ type: 'card', balance: -500_000 })).toBe(`Карта · ${MINUS}5${NB}000${NB}₽`);
  });

  it('у каждого типа счёта из схемы есть русская подпись', () => {
    expect(Object.keys(ACCOUNT_TYPE_LABELS).sort()).toEqual(['card', 'cash', 'debt', 'goal', 'savings']);
  });
});
