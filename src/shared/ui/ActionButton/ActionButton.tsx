import { Pressable, StyleSheet } from 'react-native';

import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from '../AppText';

/** Кнопка действия 56 dp, радиус 28 (DESIGN.md): primary — главная, secondary — второстепенная, danger — необратимое. */
export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const t = useTokens();
  const palette = disabled
    ? { background: t.divider, text: t.inkSecondary }
    : variant === 'primary'
      ? { background: t.accent, text: t.onAccent }
      : variant === 'danger'
        ? { background: t.over.tile, text: t.over.text }
        : { background: t.tonal, text: t.onTonal };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: palette.background }, pressed && styles.pressed]}
    >
      <AppText variant="label" color={palette.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  pressed: { opacity: 0.7 },
});
