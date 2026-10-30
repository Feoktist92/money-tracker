import { type Href, router } from 'expo-router';
import { Button } from 'heroui-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { db } from '@/shared/db/client';
import { seedDemo } from '@/shared/db/seed';
import { toDateKey } from '@/shared/lib/period';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';
import { ListRow } from '@/shared/ui/ListRow';
import { Screen } from '@/shared/ui/Screen';

/** Вкладка «Ещё»: разделы «Счета» и «Категории»; в dev-сборке ещё загрузка демо-данных. */
export function MorePage() {
  const t = useTokens();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDemo = async () => {
    setBusy(true);
    setStatus('Загружаю…');
    try {
      await seedDemo(db, toDateKey(new Date()));
      setStatus(null);
      router.navigate('/');
    } catch (e) {
      setStatus(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const confirmDemo = () =>
    Alert.alert(
      'Загрузить демо-данные?',
      'Все операции будут удалены, лимиты и перенос — заменены данными из макета.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Загрузить', style: 'destructive', onPress: loadDemo },
      ],
    );

  const go = (path: string) => () => router.push(path as Href);
  const chevron = <AppIcon name="chevron-right" size={20} color={t.inkSecondary} />;

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleApp">Ещё</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <ListRow
          leading={<AppIcon name="wallet" size={22} color={t.accent} />}
          title="Счета"
          subtitle="Карты, накопления, наличные"
          accessibilityLabel="Открыть счета"
          onPress={go('/accounts')}
          trailing={chevron}
        />
        <ListRow
          leading={<AppIcon name="shopping-basket" size={22} color={t.accent} />}
          title="Категории"
          subtitle="Расходы и доходы, лимиты, цвета"
          accessibilityLabel="Открыть категории"
          onPress={go('/categories')}
          trailing={chevron}
        />
        {__DEV__ && (
          <View style={styles.dev}>
            <Button variant="secondary" isDisabled={busy} onPress={confirmDemo}>
              <Button.Label>Загрузить демо-данные</Button.Label>
            </Button>
            <AppText variant="caption" color={t.inkSecondary}>
              {status ?? 'Стирает операции и заполняет месяц данными из макета.'}
            </AppText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, justifyContent: 'center', paddingHorizontal: 20 },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  dev: { paddingTop: 24, gap: 12 },
});
