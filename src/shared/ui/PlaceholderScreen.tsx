import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from './AppText';
import { Screen } from './Screen';

/** Экран-заглушка вкладки: заголовок, пояснение и необязательное содержимое. */
export function PlaceholderScreen({ title, hint, children }: { title: string; hint: string; children?: ReactNode }) {
  const t = useTokens();
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="titleApp">{title}</AppText>
      </View>
      <View style={styles.body}>
        <AppText color={t.inkSecondary}>{hint}</AppText>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, justifyContent: 'center', paddingHorizontal: 20 },
  body: { paddingHorizontal: 20, gap: 16 },
});
