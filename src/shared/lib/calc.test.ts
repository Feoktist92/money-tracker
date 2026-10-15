import { evaluateExpression, isExpression } from './calc';

describe('evaluateExpression — значения', () => {
  it.each([
    ['1 000 + 240', 124000],
    ['2+3×4', 1400],
    ['10÷4', 250],
    ['1,5×2', 300],
    ['0,1+0,2', 30],
    ['100−', 10000],
    ['−5+10', 500],
    ['10÷3×3', 1000],
    ['10 − 2 − 3', 500],
    ['100/8', 1250],
    ['7*3', 2100],
    ['1240', 124000],
    ['12,', 1200],
    ['5−10', -500],
    ['10÷3', 333],
  ])('%p → %p коп.', (expr, expected) => {
    expect(evaluateExpression(expr)).toEqual({ ok: true, value: expected });
  });
});

describe('evaluateExpression — ошибки', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['−', 'empty'],
    ['5÷0', 'divide_by_zero'],
    ['5÷0×2', 'divide_by_zero'],
    ['1,2,3', 'syntax'],
    ['×5', 'syntax'],
    ['+5', 'syntax'],
    ['1++2', 'syntax'],
    ['1,234', 'syntax'],
    ['abc', 'syntax'],
    ['100++', 'syntax'],
    ['999999999999×999999999999', 'too_large'],
  ])('%p → %p', (expr, error) => {
    expect(evaluateExpression(expr)).toEqual({ ok: false, error });
  });
});

describe('isExpression', () => {
  it.each([
    ['1 000 + 240', true],
    ['1240', false],
    ['100−', false],
    ['−5', false],
    ['−5+1', true],
    ['', false],
    ['1,2,3', false],
  ])('%p → %p', (expr, expected) => {
    expect(isExpression(expr)).toBe(expected);
  });
});
