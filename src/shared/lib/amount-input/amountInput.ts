import { evaluateExpression, isExpression } from '../calc';
import { formatMoney, type Kopecks, MAX_TRANSACTION_AMOUNT } from '../money';

/** Клавиши своей клавиатуры шторки суммы. */
export type AmountKey =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '+' | '−' | '×' | '÷' | 'back' | 'clear';

/** Целая часть числа — не больше 9 цифр (PLAN.md, 5.1). */
export const MAX_INTEGER_DIGITS = 9;
const MAX_DECIMALS = 2;
const MAX_LENGTH = 40;
const OPERATORS = '+−×÷';

const isOperator = (char: string | undefined): boolean => char !== undefined && OPERATORS.includes(char);

/** Число, которое сейчас набирается: всё после последнего оператора. */
function currentOperand(expr: string): string {
  let i = expr.length;
  while (i > 0 && !isOperator(expr[i - 1])) i -= 1;
  return expr.slice(i);
}

/**
 * Одно нажатие клавиши: новая строка выражения. Лишние нажатия (четвёртый знак после запятой, десятая цифра,
 * вторая запятая, оператор в начале) игнорируются. Оператор после оператора заменяет его; оператор сразу
 * после запятой убирает её. «0» перед цифрой заменяется этой цифрой.
 */
export function pressKey(expr: string, key: AmountKey): string {
  if (key === 'clear') return '';
  if (key === 'back') return expr.slice(0, -1);

  const operand = currentOperand(expr);

  if (isOperator(key)) {
    if (expr === '') return expr;
    const last = expr[expr.length - 1];
    if (isOperator(last)) return expr.slice(0, -1) + key;
    if (last === ',') return expr.slice(0, -1) + key;
    return expr.length >= MAX_LENGTH ? expr : expr + key;
  }

  if (expr.length >= MAX_LENGTH) return expr;

  if (key === ',') {
    if (operand.includes(',')) return expr;
    return operand === '' ? `${expr}0,` : `${expr},`;
  }

  // цифра
  if (operand.includes(',')) {
    const decimals = operand.length - operand.indexOf(',') - 1;
    return decimals >= MAX_DECIMALS ? expr : expr + key;
  }
  if (operand === '0') return expr.slice(0, -1) + key;
  if (operand.length >= MAX_INTEGER_DIGITS) return expr;
  return expr + key;
}

/** Выражение для показа: группы по три цифры через неразрывный пробел, вокруг операторов обычные пробелы. */
export function formatExpression(expr: string): string {
  return expr
    .replace(/\d+(?:,\d*)?/g, (number) => {
      const [integer = '', fraction] = number.split(',');
      const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
      return fraction === undefined ? grouped : `${grouped},${fraction}`;
    })
    .replace(/([+−×÷])/g, ' $1 ')
    .trim();
}

export interface AmountView {
  /** Строка выражения над суммой («1 000 + 240»); null, если набрано просто число. */
  expression: string | null;
  /** Крупная сумма: набранное число или результат выражения. */
  display: string;
  /** Итог в копейках; null — выражение пустое, с ошибкой (деление на ноль) или больше верхнего предела суммы. */
  value: Kopecks | null;
}

/** Всё, что нужно шторке для показа текущего ввода. */
export function describeAmount(expr: string): AmountView {
  const result = evaluateExpression(expr);
  const value = result.ok && result.value <= MAX_TRANSACTION_AMOUNT ? result.value : null;
  const expression = isExpression(expr) ? formatExpression(expr) : null;
  let display: string;
  if (expression === null) display = formatExpression(expr) || '0';
  else display = value !== null ? formatMoney(value, { currency: false, kopecks: 'auto' }) : '0';
  return { expression, display, value };
}

/** Можно ли записывать: итог есть и он положительный. */
export function isRecordable(view: AmountView): view is AmountView & { value: Kopecks } {
  return view.value !== null && view.value > 0;
}

/** Ввод из готовой суммы (чип недавних сумм): 124000 → «1240», 12050 → «120,5». */
export function expressionFromKopecks(amount: Kopecks): string {
  const rubles = Math.trunc(amount / 100);
  const rest = amount % 100;
  if (rest === 0) return String(rubles);
  return `${rubles},${String(rest).padStart(2, '0').replace(/0$/, '')}`;
}
