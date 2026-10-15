import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { db, expoDb, expoDrizzle } from '@/shared/db/client';
import { seedDefaults } from '@/shared/db/seed';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import migrations from '../../drizzle/migrations';

/**
 * Применяет миграции и сид; до готовности ничего не рендерит (сплэш остаётся), при ошибке показывает её.
 * Внешние ключи включаются только после миграций: миграции идут в транзакции, где SQLite игнорирует
 * `foreign_keys = OFF`, а пересборка таблицы (DROP TABLE) при включённых ключах каскадно удаляет связанные строки.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(expoDrizzle, migrations);
  const [ready, setReady] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    const fail = (e: unknown) => setSeedError(e instanceof Error ? e : new Error(String(e)));
    try {
      expoDb.execSync('PRAGMA foreign_keys = ON;');
    } catch (e) {
      fail(e);
      return;
    }
    seedDefaults(db).then(() => setReady(true), fail);
  }, [success]);

  const failure = error ?? seedError;
  useEffect(() => {
    if (ready || failure) SplashScreen.hide();
  }, [ready, failure]);
  if (failure) {
    return (
      <Screen>
        <View style={styles.error}>
          <AppText variant="titleApp">Не удалось открыть базу</AppText>
          <AppText variant="caption">{failure.message}</AppText>
        </View>
      </Screen>
    );
  }
  if (!ready) return null;
  return children;
}

const styles = StyleSheet.create({ error: { padding: 20, gap: 8 } });
