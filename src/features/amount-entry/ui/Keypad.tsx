import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AmountKey } from '@/shared/lib/amount-input';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

const MINUS = '−';

const ROWS: readonly (readonly AmountKey[])[] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', MINUS],
  [',', '0', 'back', '+'],
];

const OPERATORS: readonly AmountKey[] = ['÷', '×', MINUS, '+'];

const SPOKEN: Readonly<Partial<Record<AmountKey, string>>> = {
  '÷': 'Разделить',
  '×': 'Умножить',
  [MINUS]: 'Минус',
  '+': 'Плюс',
  ',': 'Запятая',
  back: 'Стереть',
};

/** Своя клавиатура шторки суммы (каждое нажатие даёт лёгкий хаптик): цифры, запятая, действия, стереть (долгое нажатие — очистить). Ключи 54 dp, радиус 16. */
export function Keypad({ onPress }: { onPress: (key: AmountKey) => void }) {
  const t = useTokens();
  const press = (key: AmountKey) => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress(key);
  };
  const clear = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onPress('clear');
  };
  return (
    <View style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const operator = OPERATORS.includes(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={SPOKEN[key] ?? key}
                onPress={() => press(key)}
                onLongPress={key === 'back' ? clear : undefined}
                // Долгое нажатие недоступно скринридеру жестом: выносим «Очистить» в список действий элемента
                accessibilityActions={key === 'back' ? [{ name: 'longpress', label: 'Очистить' }] : undefined}
                onAccessibilityAction={
                  key === 'back'
                    ? (event) => {
                        if (event.nativeEvent.actionName === 'longpress') onPress('clear');
                      }
                    : undefined
                }
                delayLongPress={350}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: operator ? t.tonal : t.key },
                  pressed && styles.pressed,
                ]}
              >
                {key === 'back' ? (
                  <AppIcon name="delete" size={24} color={t.ink} />
                ) : (
                  <AppText variant="titleApp" color={operator ? t.onTonal : t.ink}>
                    {key}
                  </AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
