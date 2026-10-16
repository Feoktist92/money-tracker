import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { AppText } from '@/shared/ui/AppText';

import { UNDO_MS, useUndoStore } from '../model/undoStore';

/**
 * Snackbar «Записано · Отменить» на 5 секунд (DESIGN.md). Лежит над нижней навигацией; onUndo получает id записи
 * и откатывает её (мягкое удаление), саму панель закрывает компонент.
 */
export function UndoSnackbar({ onUndo }: { onUndo: (id: string) => void }) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const entry = useUndoStore((state) => state.entry);
  const token = useUndoStore((state) => state.token);

  useEffect(() => {
    if (!entry) return;
    const timer = setTimeout(() => useUndoStore.getState().dismiss(), UNDO_MS);
    return () => clearTimeout(timer);
  }, [entry, token]);

  if (!entry) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: layout.nav + insets.bottom + 12 }]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.bar, { backgroundColor: t.ink }]}>
        <AppText variant="label" color={t.ground} style={styles.text} accessibilityLabel={`Записано: ${entry.label}`}>
          Записано
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Отменить запись"
          onPress={() => {
            void Haptics.selectionAsync().catch(() => undefined);
            useUndoStore.getState().dismiss();
            onUndo(entry.id);
          }}
          style={styles.action}
        >
          <AppText variant="label" color={t.fill}>
            Отменить
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  text: { flex: 1 },
  action: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center' },
});
