import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { db, expoDrizzle } from '@/shared/db/client';
import { seedDefaults } from '@/shared/db/seed';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import migrations from '../../drizzle/migrations';

/** Применяет миграции и сид; до готовности ничего не рендерит, при ошибке показывает её. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(expoDrizzle, migrations);
  const [ready, setReady] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    seedDefaults(db).then(
      () => setReady(true),
      (e: unknown) => setSeedError(e instanceof Error ? e : new Error(String(e))),
    );
  }, [success]);

  const failure = error ?? seedError;
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
