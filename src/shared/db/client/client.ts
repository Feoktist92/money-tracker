import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '../schema';
import type { Db } from '../types';

/**
 * Файл базы приложения. enableChangeListener нужен для useDataVersion.
 * Внешние ключи здесь НЕ включаются: их включает DatabaseGate после миграций (см. комментарий там).
 */
export const expoDb = openDatabaseSync('monety.db', { enableChangeListener: true });

/** Типизированный expo-клиент — нужен useMigrations. */
export const expoDrizzle = drizzle(expoDb, { schema });

/** Клиент для запросов: тот же тип Db, что у тестовой базы. */
export const db: Db = expoDrizzle;
