import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from '../AppText';

/**
 * Строка списка: слева значок (любой узел), посередине название и вторая строка, справа действия.
 * Нажатие на текстовую часть вызывает onPress; кнопки справа нажимаются отдельно.
 * Для TalkBack строка читается целиком («название, вторая строка»), а что будет по нажатию, говорит подсказка.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  onPress,
  accessibilityHint,
  trailing,
}: {
  leading: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Что произойдёт по нажатию («Изменить счёт»); озвучивается после названия строки. */
  accessibilityHint?: string;
  trailing?: ReactNode;
}) {
  const t = useTokens();
  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={styles.main}
      >
        <View style={styles.leading}>{leading}</View>
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={t.inkSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
  },
  main: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  leading: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center' },
});
