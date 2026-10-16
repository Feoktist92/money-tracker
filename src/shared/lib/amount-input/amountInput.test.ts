import {
  type AmountKey,
  describeAmount,
  expressionFromKopecks,
  formatExpression,
  isRecordable,
  MAX_INTEGER_DIGITS,
  pressKey,
} from './amountInput';

const MINUS = '−';
const NB = '\u00A0';

/** Набрать строку клавиш подряд. */
const type = (...keys: AmountKey[]) => keys.reduce((expr, key) => pressKey(expr, key), '');

describe('pressKey', () => {
  it('цифры дописываются, ведущий ноль заменяется', () => {
    expect(type('1', '2', '4', '0')).toBe('1240');
    expect(type('0', '5')).toBe('5');
    expect(type('0', '0', '0')).toBe('0');
  });

  it('целая часть — не больше девяти цифр', () => {
    const nine = type(...(Array(MAX_INTEGER_DIGITS).fill('9') as AmountKey[]));
    expect(nine).toBe('999999999');
    expect(pressKey(nine, '1')).toBe(nine);
    // в новом числе после оператора счёт цифр начинается заново
    expect(pressKey(pressKey(nine, '+'), '1')).toBe('999999999+1');
  });

  it('запятая: одна на число, пустое число начинается с «0,», не больше двух знаков', () => {
    expect(type(',')).toBe('0,');
    expect(type('5', ',', ',')).toBe('5,');
    expect(type('5', ',', '2', '5', '7')).toBe('5,25');
    expect(type('5', '+', ',')).toBe('5+0,');
    expect(type('5', ',', '5', '+', '2', ',', '5')).toBe('5,5+2,5');
  });

  it('оператор: не в начале, повторный заменяет предыдущий, после запятой убирает её', () => {
    expect(type('+')).toBe('');
    expect(type(MINUS as AmountKey)).toBe('');
    expect(type('5', '+')).toBe('5+');
    expect(type('5', '+', '×')).toBe('5×');
    expect(type('5', ',', '+')).toBe('5+');
    expect(type('1', '0', '÷', '4')).toBe('10÷4');
  });

  it('ввод ограничен по длине строки', () => {
    let expr = '1';
    for (let i = 0; i < 100; i += 1) expr = pressKey(pressKey(expr, '+'), '1');
    expect(expr.length).toBeLessThanOrEqual(40);
  });

  it('стереть: последний символ; очистить: всё', () => {
    expect(pressKey('12+3', 'back')).toBe('12+');
    expect(pressKey('', 'back')).toBe('');
    expect(pressKey('12+3', 'clear')).toBe('');
  });
});

describe('formatExpression', () => {
  it('группы по три цифры через неразрывный пробел, пробелы вокруг операторов', () => {
    expect(formatExpression('1000+240')).toBe(`1${NB}000 + 240`);
    expect(formatExpression('1234567,5×2')).toBe(`1${NB}234${NB}567,5 × 2`);
    expect(formatExpression('5')).toBe('5');
    expect(formatExpression('')).toBe('');
    expect(formatExpression('5,')).toBe('5,');
    expect(formatExpression(`10${MINUS}3`)).toBe(`10 ${MINUS} 3`);
  });
});

describe('describeAmount', () => {
  it('пусто — «0», итога нет, записать нельзя', () => {
    const view = describeAmount('');
    expect(view).toEqual({ expression: null, display: '0', value: null });
    expect(isRecordable(view)).toBe(false);
  });

  it('просто число: показывается как набрано (с запятой на конце), итог в копейках', () => {
    expect(describeAmount('1240')).toEqual({ expression: null, display: `1${NB}240`, value: 124000 });
    expect(describeAmount('5,').display).toBe('5,');
    expect(describeAmount('5,5').value).toBe(550);
  });

  it('выражение: строка выражения над суммой и результат вместо набранного', () => {
    const view = describeAmount('1000+240');
    expect(view.expression).toBe(`1${NB}000 + 240`);
    expect(view.display).toBe(`1${NB}240`);
    expect(view.value).toBe(124000);
    expect(isRecordable(view)).toBe(true);
  });

  it('висящий оператор не мешает записи, но выражением не считается', () => {
    const view = describeAmount('1000+');
    expect(view.expression).toBeNull();
    expect(view.value).toBe(100000);
  });

  it('деление на ноль и отрицательный итог записать нельзя', () => {
    expect(isRecordable(describeAmount('5÷0'))).toBe(false);
    expect(describeAmount('5÷0').value).toBeNull();
    expect(isRecordable(describeAmount(`5${MINUS}10`))).toBe(false);
    expect(isRecordable(describeAmount('0'))).toBe(false);
  });

  it('копейки в итоге показываются, когда они есть', () => {
    expect(describeAmount('10÷4').display).toBe('2,50');
    expect(describeAmount('0,01+0,02').value).toBe(3);
  });
});

describe('expressionFromKopecks', () => {
  it.each([
    [124000, '1240'],
    [12050, '120,5'],
    [12005, '120,05'],
    [50, '0,5'],
    [1, '0,01'],
    [100, '1'],
  ])('%p коп. → «%s»', (kopecks, expected) => {
    expect(expressionFromKopecks(kopecks)).toBe(expected);
  });

  it('результат читается калькулятором обратно в ту же сумму', () => {
    for (const kopecks of [1, 50, 99, 100, 12050, 12005, 124000, 99999999]) {
      expect(describeAmount(expressionFromKopecks(kopecks)).value).toBe(kopecks);
    }
  });
});
