import { coinVisual, targetVisual, type DragSnapshot } from './visuals';
import type { DragSource, DropTargetInfo } from './types';

const main: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const salary: DragSource = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' };
const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };
const savings: DropTargetInfo = { kind: 'account', id: 'savings', name: 'Накопления' };
const mainTarget: DropTargetInfo = { kind: 'account', id: 'main', name: 'Основная' };

const idle: DragSnapshot = { phase: 'idle', source: null, hoverKey: null };
const dragging = (source: DragSource, hoverKey: string | null = null): DragSnapshot => ({
  phase: 'dragging',
  source,
  hoverKey,
});

describe('targetVisual', () => {
  it('без жеста — idle', () => {
    expect(targetVisual(idle, food)).toBe('idle');
  });

  it('счёт в руке: категория и другой счёт допустимы, под пальцем — hover', () => {
    expect(targetVisual(dragging(main), food)).toBe('valid');
    expect(targetVisual(dragging(main, 'category:food'), food)).toBe('hover');
    expect(targetVisual(dragging(main, 'category:food'), savings)).toBe('valid');
  });

  it('доход в руке: категории тускнеют, счета допустимы', () => {
    expect(targetVisual(dragging(salary), food)).toBe('dimmed');
    expect(targetVisual(dragging(salary), savings)).toBe('valid');
  });

  it('при возврате монеты подсветка снимается', () => {
    expect(targetVisual({ phase: 'returning', source: main, hoverKey: null }, food)).toBe('idle');
  });
});

describe('coinVisual', () => {
  it('исходная монета — source, пока жест и пока летит назад', () => {
    expect(coinVisual(dragging(main), main, mainTarget)).toBe('source');
    expect(coinVisual({ phase: 'returning', source: main, hoverKey: null }, main, mainTarget)).toBe('source');
    expect(coinVisual(idle, main, mainTarget)).toBe('idle');
  });

  it('монета-цель ведёт себя как плитка', () => {
    expect(coinVisual(dragging(salary), main, mainTarget)).toBe('valid');
    expect(coinVisual(dragging(salary, 'account:main'), main, mainTarget)).toBe('hover');
  });

  it('монета дохода не цель: при чужом жесте тускнеет', () => {
    expect(coinVisual(dragging(main), salary, null)).toBe('dimmed');
  });

  it('монета с тем же id, но другого вида, не считается исходной', () => {
    const sameId: DragSource = { kind: 'income', id: 'main', name: 'Доход с тем же id', icon: 'laptop' };
    expect(coinVisual(dragging(main), sameId, null)).toBe('dimmed');
  });

  it('при возврате чужие монеты не тускнеют', () => {
    expect(coinVisual({ phase: 'returning', source: main, hoverKey: null }, salary, null)).toBe('idle');
  });
});
