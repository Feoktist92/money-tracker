import { Pressable, StyleSheet, View } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from '../AppText';

/** Выбор одного из нескольких вариантов чипами 48 dp (тип счёта, вид категории). */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const t = useTokens();
  return (
    <View style={styles.root}>
      <AppText variant="section" color={t.inkSecondary}>
        {label}
      </AppText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, { backgroundColor: selected ? t.tonal : t.key }]}
            >
              <AppText variant="label" color={selected ? t.onTonal : t.ink}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 48, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center' },
});
