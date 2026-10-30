import type { ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { fontFamily } from '@/shared/theme/fonts';
import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from '../AppText';

export interface FieldProps extends Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'maxLength' | 'autoFocus'
> {
  label: string;
  /** Сообщение об ошибке под полем; пусто — ошибки нет. */
  error?: string | null;
  /** Подсказка под полем, пока ошибки нет. */
  hint?: string;
  /** Узел справа от поля (например, кнопка-переключатель знака). */
  accessory?: ReactNode;
}

/** Поле формы: подпись над полем, поле 48 dp (справа можно поставить accessory), ошибка или подсказка под ним (ошибка озвучивается как live region). */
export function Field({ label, error, hint, accessory, ...input }: FieldProps) {
  const t = useTokens();
  return (
    <View style={styles.root}>
      <AppText variant="section" color={t.inkSecondary}>
        {label}
      </AppText>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={t.inkSecondary}
          {...input}
          style={[
            styles.input,
            { backgroundColor: t.key, color: t.ink, fontFamily: fontFamily[400] },
            error ? { borderColor: t.over.text } : null,
          ]}
        />
        {accessory}
      </View>
      <View accessibilityLiveRegion="polite">
        {error ? (
          <AppText variant="caption" color={t.over.text}>
            {error}
          </AppText>
        ) : hint ? (
          <AppText variant="caption" color={t.inkSecondary}>
            {hint}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
