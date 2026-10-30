import { Pressable, StyleSheet, View } from 'react-native';

import { COLOR_NAMES } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';

export interface Swatch {
  /** Ключ цвета, который хранится в базе. */
  key: keyof typeof COLOR_NAMES;
  /** Цвет кружка в текущей теме. */
  color: string;
  /** Цвет галочки на кружке. */
  onColor: string;
}

/** Выбор цвета: кружки 40 dp в нажимаемых областях 48 dp, у выбранного галочка и кольцо; озвучивается русским названием. */
export function SwatchPicker({
  label,
  swatches,
  value,
  onChange,
}: {
  label: string;
  swatches: readonly Swatch[];
  value: string;
  onChange: (key: Swatch['key']) => void;
}) {
  const t = useTokens();
  return (
    <View style={styles.root}>
      <AppText variant="section" color={t.inkSecondary}>
        {label}
      </AppText>
      <View style={styles.row}>
        {swatches.map(({ key, color, onColor }) => {
          const selected = key === value;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={COLOR_NAMES[key]}
              accessibilityState={{ selected }}
              onPress={() => onChange(key)}
              style={styles.hit}
            >
              <View
                style={[styles.dot, { backgroundColor: color }, selected && { borderWidth: 3, borderColor: t.ink }]}
              >
                {selected && <AppIcon name="check" size={20} color={onColor} strokeWidth={2.4} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  hit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
