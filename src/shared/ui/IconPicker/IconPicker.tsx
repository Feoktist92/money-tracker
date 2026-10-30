import { Pressable, StyleSheet, View } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';

/** Сетка значков для выбора: кнопки 48 dp, выбранный обведён цветом `accent`. Значки — из реестра AppIcon. */
export function IconPicker({
  label,
  icons,
  value,
  onChange,
  accent,
}: {
  label: string;
  icons: readonly string[];
  value: string;
  onChange: (icon: string) => void;
  /** Цвет рамки и значка выбранного варианта (например, выбранный цвет категории). */
  accent?: string;
}) {
  const t = useTokens();
  const tone = accent ?? t.accent;
  return (
    <View style={styles.root}>
      <AppText variant="section" color={t.inkSecondary}>
        {label}
      </AppText>
      <View style={styles.grid}>
        {icons.map((name) => {
          const selected = name === value;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Значок ${name}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(name)}
              style={[styles.cell, { backgroundColor: t.key }, selected && { borderColor: tone, borderWidth: 2 }]}
            >
              <AppIcon name={name} size={22} color={selected ? tone : t.ink} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
