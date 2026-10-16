import type { NewTransaction } from '@/entities/transaction';
import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { addDays, type DateKey } from '@/shared/lib/period';

/** Счёт или категория в контексте шторки. */
export interface Party {
  id: string;
  name: string;
}

/** Что записывает шторка: расход (счёт → категория), доход (категория дохода → счёт) или перевод (счёт → счёт). */
export type EntrySession =
  | { type: 'expense'; account: Party; category: Party }
  | { type: 'income'; category: Party; account: Party }
  | { type: 'transfer'; from: Party; to: Party };

/** День операции: сегодня или вчера (быстрый выбор в шторке). */
export type DayOffset = 0 | -1;

/** Введённое в шторке, готовое к записи. */
export interface EntryDraft {
  session: EntrySession;
  amount: Kopecks;
  dayOffset: DayOffset;
  note: string;
}

/** Цифры для строки «Останется»: берутся со страницы из обзора бюджета и балансов счетов. */
export interface EntryInfo {
  /** Остаток категории расхода до записи. */
  categoryRemaining?: Kopecks;
  /** Баланс счёта-источника (расход, перевод). */
  sourceBalance?: Kopecks;
  /** Баланс счёта-получателя (доход). */
  targetBalance?: Kopecks;
}

const rub = (value: Kopecks) => formatMoney(value, { kopecks: 'never' });

/** «Основная → Продукты» — строка контекста над суммой. */
export function contextLabel(session: EntrySession): string {
  switch (session.type) {
    case 'expense':
      return `${session.account.name} → ${session.category.name}`;
    case 'income':
      return `${session.category.name} → ${session.account.name}`;
    case 'transfer':
      return `${session.from.name} → ${session.to.name}`;
  }
}

/** Подпись главной кнопки: «Записать −1 240 ₽», у дохода «+», у перевода «Перевести». */
export function actionLabel(session: EntrySession, amount: Kopecks | null): string {
  if (amount === null) return session.type === 'transfer' ? 'Перевести' : 'Записать';
  switch (session.type) {
    case 'expense':
      return `Записать ${formatMoney(-amount)}`;
    case 'income':
      return `Записать ${formatMoney(amount, { sign: 'always' })}`;
    case 'transfer':
      return `Перевести ${formatMoney(amount)}`;
  }
}

/**
 * Строка под суммой, обновляется на каждое нажатие. Названия категорий не склоняем («Останется в “Продуктах”» из макета
 * без склонения не получить), поэтому формулировки нейтральные; категория уже названа в строке контекста.
 */
export function afterLine(session: EntrySession, info: EntryInfo, amount: Kopecks | null): string | null {
  const entered = amount ?? 0;
  if (session.type === 'expense') {
    if (info.categoryRemaining === undefined) return null;
    const after = info.categoryRemaining - entered;
    return after >= 0 ? `Останется: ${rub(after)}` : `Перерасход: ${rub(-after)}`;
  }
  if (session.type === 'income') {
    return info.targetBalance === undefined ? null : `На счёте будет: ${rub(info.targetBalance + entered)}`;
  }
  return info.sourceBalance === undefined ? null : `Останется на счёте: ${rub(info.sourceBalance - entered)}`;
}

/** Операция для записи в базу. today — сегодняшний день по часам устройства в момент записи. */
export function buildTransaction(draft: EntryDraft, today: DateKey): NewTransaction {
  const date = addDays(today, draft.dayOffset);
  const note = draft.note.trim() || undefined;
  const { session, amount } = draft;
  switch (session.type) {
    case 'expense':
      return {
        type: 'expense',
        amount,
        date,
        note,
        fromAccountId: session.account.id,
        categoryId: session.category.id,
      };
    case 'income':
      return { type: 'income', amount, date, note, toAccountId: session.account.id, categoryId: session.category.id };
    case 'transfer':
      return { type: 'transfer', amount, date, note, fromAccountId: session.from.id, toAccountId: session.to.id };
  }
}
