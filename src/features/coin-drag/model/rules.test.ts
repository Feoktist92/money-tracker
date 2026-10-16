import { canDrop } from './rules';
import type { DragSource, DropTargetInfo } from './types';

const income: DragSource = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' };
const main: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const savings: DropTargetInfo = { kind: 'account', id: 'savings', name: 'Накопления' };
const mainAsTarget: DropTargetInfo = { kind: 'account', id: 'main', name: 'Основная' };
const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };

describe('canDrop', () => {
  it('доход можно бросить только на счёт', () => {
    expect(canDrop(income, savings)).toBe(true);
    expect(canDrop(income, food)).toBe(false);
  });

  it('счёт можно бросить на категорию', () => {
    expect(canDrop(main, food)).toBe(true);
  });

  it('счёт можно бросить на другой счёт, но не на себя', () => {
    expect(canDrop(main, savings)).toBe(true);
    expect(canDrop(main, mainAsTarget)).toBe(false);
  });

  it('совпадение id монеты дохода и счёта не мешает: проверяется и вид', () => {
    const sameId: DropTargetInfo = { kind: 'account', id: 'salary', name: 'Счёт с тем же id' };
    expect(canDrop(income, sameId)).toBe(true);
  });
});
