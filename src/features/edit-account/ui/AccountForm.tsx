import { useState } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import type { AccountInput } from '@/entities/account';
import { coinColors, coinIconColors } from '@/shared/theme/tokens';
import { ACCOUNT_ICON_CHOICES } from '@/shared/ui/AppIcon';
import { ActionButton } from '@/shared/ui/ActionButton';
import { Chips } from '@/shared/ui/Chips';
import { Field } from '@/shared/ui/Field';
import { IconPicker } from '@/shared/ui/IconPicker';
import { SwatchPicker } from '@/shared/ui/SwatchPicker';

import { ACCOUNT_TYPES, type AccountDraft, validateAccountDraft } from '../model/accountForm';

type Touched = Partial<Record<'name' | 'initialBalance', boolean>>;

/** Значок по умолчанию для типа: при смене типа подставляется, если пользователь не выбирал свой значок. */
const defaultIcon = (type: AccountDraft['type']) => ACCOUNT_TYPES.find((item) => item.type === type)?.icon;

/**
 * Форма счёта: название, тип, значок, цвет монеты, начальный баланс. Ошибки поля появляются после его правки или
 * нажатия «Сохранить»; «Сохранить» недоступна, пока форма не проходит проверку. База ей не нужна: данные и действия
 * приходят пропсами (`takenNames` — названия других активных счетов).
 */
export function AccountForm({
  initial,
  takenNames,
  submitLabel,
  onSubmit,
  onArchive,
}: {
  initial: AccountDraft;
  takenNames: readonly string[];
  submitLabel: string;
  onSubmit: (value: AccountInput) => void;
  /** Есть только у существующего активного счёта. */
  onArchive?: () => void;
}) {
  const dark = useColorScheme() === 'dark';
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState<Touched>({});
  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'name' || key === 'initialBalance') setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const result = validateAccountDraft(draft, takenNames);
  const errors = result.ok ? {} : result.errors;
  const fills = dark ? coinColors.dark : coinColors.light;
  const onFill = dark ? coinIconColors.dark : coinIconColors.light;
  const swatches = (Object.keys(fills) as (keyof typeof fills)[]).map((key) => ({
    key,
    color: fills[key],
    onColor: onFill[key],
  }));

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field
        label="Название"
        value={draft.name}
        onChangeText={(value) => set('name', value)}
        error={touched.name ? errors.name : null}
        maxLength={60}
      />
      <Chips
        label="Тип"
        options={ACCOUNT_TYPES.map((item) => ({ value: item.type, label: item.label }))}
        value={draft.type}
        onChange={(type) => {
          setDraft((prev) => ({
            ...prev,
            type,
            icon: prev.icon === defaultIcon(prev.type) ? (defaultIcon(type) ?? prev.icon) : prev.icon,
          }));
        }}
      />
      <SwatchPicker label="Цвет монеты" swatches={swatches} value={draft.color} onChange={(key) => set('color', key)} />
      <IconPicker
        label="Значок"
        icons={ACCOUNT_ICON_CHOICES}
        value={draft.icon}
        onChange={(icon) => set('icon', icon)}
      />
      <Field
        label="Начальный баланс"
        value={draft.initialBalance}
        onChangeText={(value) => set('initialBalance', value)}
        error={touched.initialBalance ? errors.initialBalance : null}
        hint="Сколько на счёте сейчас. Пусто — ноль; для овердрафта можно с минусом."
        keyboardType="numbers-and-punctuation"
      />
      <View style={styles.actions}>
        <ActionButton
          label={submitLabel}
          disabled={!result.ok}
          onPress={() => {
            setTouched({ name: true, initialBalance: true });
            if (result.ok) onSubmit(result.value);
          }}
        />
        {onArchive && <ActionButton label="Архивировать" variant="danger" onPress={onArchive} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20 },
  actions: { gap: 12, paddingTop: 4 },
});
