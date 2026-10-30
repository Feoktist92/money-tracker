import type { CategoryInput } from '@/entities/category';
import { MAX_TRANSACTION_AMOUNT, parseMoney } from '@/shared/lib/money';

export const NAME_MAX = 40;

/** Что лежит в полях формы категории; лимит — строкой, как его ввёл пользователь. */
export interface CategoryDraft {
  name: string;
  kind: CategoryInput['kind'];
  icon: string;
  color: string;
  /** Месячный лимит текстом; пусто — без лимита. У дохода игнорируется. */
  monthlyLimit: string;
}

export interface CategoryErrors {
  name?: string;
  monthlyLimit?: string;
}

export type CategoryValidation = { ok: true; value: CategoryInput } | { ok: false; errors: CategoryErrors };

export function emptyCategory(kind: CategoryInput['kind']): CategoryDraft {
  return {
    name: '',
    kind,
    icon: kind === 'expense' ? 'shopping-basket' : 'arrow-down-to-line',
    color: 'violet',
    monthlyLimit: '',
  };
}

/**
 * Проверка формы категории. `takenNames` — названия других активных категорий того же вида.
 * Лимит: пусто = без лимита; иначе больше нуля и не больше предела суммы операции. У дохода лимита нет.
 */
export function validateCategoryDraft(draft: CategoryDraft, takenNames: readonly string[]): CategoryValidation {
  const errors: CategoryErrors = {};
  const name = draft.name.trim();
  if (name === '') errors.name = 'Введите название';
  else if (name.length > NAME_MAX) errors.name = `Не длиннее ${NAME_MAX} символов`;
  else if (takenNames.some((taken) => taken.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'Категория с таким названием уже есть';
  }

  let monthlyLimit: number | null = null;
  if (draft.kind === 'expense' && draft.monthlyLimit.trim() !== '') {
    const parsed = parseMoney(draft.monthlyLimit);
    if (parsed === null) errors.monthlyLimit = 'Введите сумму, например 18 000';
    else if (parsed <= 0) errors.monthlyLimit = 'Лимит должен быть больше нуля';
    else if (parsed > MAX_TRANSACTION_AMOUNT) errors.monthlyLimit = 'Слишком большая сумма';
    else monthlyLimit = parsed;
  }

  if (errors.name || errors.monthlyLimit) return { ok: false, errors };
  return { ok: true, value: { name, kind: draft.kind, icon: draft.icon, color: draft.color, monthlyLimit } };
}
