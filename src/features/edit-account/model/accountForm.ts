import type { AccountInput } from '@/entities/account';
import { MAX_TRANSACTION_AMOUNT, parseMoney } from '@/shared/lib/money';

export const NAME_MAX = 40;

/** Что лежит в полях формы счёта: числа — строками, как их ввёл пользователь. */
export interface AccountDraft {
  name: string;
  type: AccountInput['type'];
  icon: string;
  color: string;
  /** Начальный баланс текстом: «», «1 240,50», «−5000». */
  initialBalance: string;
}

export interface AccountErrors {
  name?: string;
  initialBalance?: string;
}

export type AccountValidation = { ok: true; value: AccountInput } | { ok: false; errors: AccountErrors };

/** Типы счетов, доступные в форме (долги и копилки — фаза 9). */
export const ACCOUNT_TYPES: readonly { type: AccountInput['type']; label: string; icon: string }[] = [
  { type: 'card', label: 'Карта', icon: 'credit-card' },
  { type: 'savings', label: 'Накопления', icon: 'piggy-bank' },
  { type: 'cash', label: 'Наличные', icon: 'banknote' },
];

export const EMPTY_ACCOUNT: AccountDraft = {
  name: '',
  type: 'card',
  icon: 'credit-card',
  color: 'violet',
  initialBalance: '',
};

/**
 * Проверка формы счёта. `takenNames` — названия других активных счетов (без учёта регистра повтор запрещён).
 * Начальный баланс: пусто = 0, копейки и минус допустимы, по модулю не больше предела суммы операции.
 */
export function validateAccountDraft(draft: AccountDraft, takenNames: readonly string[]): AccountValidation {
  const errors: AccountErrors = {};
  const name = draft.name.trim();
  if (name === '') errors.name = 'Введите название';
  else if (name.length > NAME_MAX) errors.name = `Не длиннее ${NAME_MAX} символов`;
  else if (takenNames.some((taken) => taken.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'Счёт с таким названием уже есть';
  }

  let initialBalance = 0;
  if (draft.initialBalance.trim() !== '') {
    const parsed = parseMoney(draft.initialBalance);
    if (parsed === null) errors.initialBalance = 'Введите сумму, например 1 240,50';
    else if (Math.abs(parsed) > MAX_TRANSACTION_AMOUNT) errors.initialBalance = 'Слишком большая сумма';
    else initialBalance = parsed;
  }

  if (errors.name || errors.initialBalance) return { ok: false, errors };
  return { ok: true, value: { name, type: draft.type, icon: draft.icon, color: draft.color, initialBalance } };
}
