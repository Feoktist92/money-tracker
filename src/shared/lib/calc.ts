import { type Kopecks, roundToKopecks } from './money';

export type CalcError = 'empty' | 'syntax' | 'divide_by_zero' | 'too_large';
export type CalcResult = { ok: true; value: Kopecks } | { ok: false; error: CalcError };

type Op = '+' | '-' | '*' | '/';
type Token = { kind: 'num'; value: Kopecks } | { kind: 'op'; op: Op };

const OPS: Readonly<Record<string, Op>> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '×': '*',
  '*': '*',
  '÷': '/',
  '/': '/',
};
const PRECEDENCE: Readonly<Record<Op, number>> = { '+': 1, '-': 1, '*': 2, '/': 2 };
const NUMBER_RE = /^(\d+)(?:[.,](\d*))?/;

const fail = (error: CalcError): CalcResult => ({ ok: false, error });

/** null — синтаксическая ошибка. Числа сразу переводятся в копейки. */
function tokenize(expr: string): Token[] | null {
  const s = expr.replace(/\s/g, '');
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const op = OPS[s[i]!];
    if (op) {
      tokens.push({ kind: 'op', op });
      i += 1;
      continue;
    }
    const match = NUMBER_RE.exec(s.slice(i));
    if (!match) return null;
    const [text, whole = '', fraction = ''] = match;
    if (fraction.length > 2) return null;
    i += text.length;
    if (s[i] === ',' || s[i] === '.') return null; // «1,2,3»
    tokens.push({ kind: 'num', value: Number(whole) * 100 + Number(fraction.padEnd(2, '0')) });
  }
  return tokens;
}

/**
 * Значения живут в копейках. Для × и ÷ правый операнд — множитель в рублях:
 * a × b = a·b/100, a ÷ b = a·100/b. Округление — один раз, в самом конце.
 */
function apply(values: number[], op: Op): CalcError | null {
  const b = values.pop()!;
  const a = values.pop()!;
  if (op === '/' && b === 0) return 'divide_by_zero';
  const result = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? (a * b) / 100 : (a * 100) / b;
  values.push(result);
  return null;
}

/** Калькулятор строки ввода суммы: + − × ÷, запятая, без eval. Висящий оператор в конце игнорируется. */
export function evaluateExpression(expr: string): CalcResult {
  const tokens = tokenize(expr);
  if (tokens === null) return fail('syntax');

  let negate = false;
  if (tokens[0]?.kind === 'op') {
    if (tokens[0].op !== '-') return fail('syntax');
    negate = true;
    tokens.shift();
  }
  if (tokens.at(-1)?.kind === 'op') tokens.pop();
  if (tokens.length === 0) return fail('empty');
  if (tokens.length % 2 === 0) return fail('syntax'); // «100++»: после висящего «+» остался ещё один

  const values: number[] = [];
  const ops: Op[] = [];
  for (const [index, token] of tokens.entries()) {
    const expectNumber = index % 2 === 0;
    if (expectNumber !== (token.kind === 'num')) return fail('syntax');
    if (token.kind === 'num') {
      values.push(index === 0 && negate ? -token.value : token.value);
      continue;
    }
    while (ops.length > 0 && PRECEDENCE[ops.at(-1)!] >= PRECEDENCE[token.op]) {
      const error = apply(values, ops.pop()!);
      if (error) return fail(error);
    }
    ops.push(token.op);
  }
  while (ops.length > 0) {
    const error = apply(values, ops.pop()!);
    if (error) return fail(error);
  }

  const raw = values[0]!;
  if (!Number.isFinite(raw) || Math.abs(raw) > Number.MAX_SAFE_INTEGER) return fail('too_large');
  return { ok: true, value: roundToKopecks(raw) };
}

/** Есть ли в строке хотя бы одна операция между двумя числами (тогда показываем строку выражения). */
export function isExpression(expr: string): boolean {
  const tokens = tokenize(expr);
  if (!tokens) return false;
  return tokens.some((t, i) => t.kind === 'op' && tokens[i - 1]?.kind === 'num' && tokens[i + 1]?.kind === 'num');
}
