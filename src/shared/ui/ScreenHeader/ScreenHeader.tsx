import { Pressable, StyleSheet, View } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';

/** Шапка вложенного экрана: кнопка «Назад» 48 dp и заголовок. Переход назад задаёт экран (onBack). */
export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useTokens();
  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={onBack} style={styles.back}>
        <View style={styles.flip}>
          <AppIcon name="chevron-right" size={24} color={t.ink} />
        </View>
      </Pressable>
      <AppText variant="titleApp" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  flip: { transform: [{ scaleX: -1 }] },
  title: { flex: 1 },
});
