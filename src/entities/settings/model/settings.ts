import { settings } from '@/shared/db/schema';
import type { Db } from '@/shared/db/types';
import { NEAR_THRESHOLD } from '@/shared/theme/tokens';

export interface AppSettings {
  baseCurrency: 'RUB';
  /** День начала периода, 1–28. */
  monthStartDay: number;
  /** Доля потраченного, с которой категория «почти» исчерпана, (0; 1]. */
  nearThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseCurrency: 'RUB',
  monthStartDay: 1,
  nearThreshold: NEAR_THRESHOLD,
};

const isValid: { [K in keyof AppSettings]: (v: unknown) => v is AppSettings[K] } = {
  baseCurrency: (v): v is 'RUB' => v === 'RUB',
  monthStartDay: (v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 28,
  nearThreshold: (v): v is number => typeof v === 'number' && v > 0 && v <= 1,
};

function isSettingKey(key: string): key is keyof AppSettings {
  return Object.hasOwn(isValid, key);
}

/** Настройки из таблицы settings; битое или неизвестное значение заменяется значением по умолчанию. */
export async function getSettings(db: Db): Promise<AppSettings> {
  const rows = await db.select().from(settings);
  const result: AppSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (!isSettingKey(row.key)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      continue;
    }
    if (isValid[row.key](parsed)) Object.assign(result, { [row.key]: parsed });
  }
  return result;
}

export async function setSetting<K extends keyof AppSettings>(db: Db, key: K, value: AppSettings[K]): Promise<void> {
  if (!isValid[key](value)) {
    throw new RangeError(`Недопустимое значение настройки ${key}: ${String(value)}`);
  }
  const json = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: settings.key, set: { value: json, updatedAt: Date.now() } });
}
