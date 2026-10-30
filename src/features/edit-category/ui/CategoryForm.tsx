import { useState } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import type { CategoryInput } from '@/entities/category';
import { CATEGORY_COLOR_KEYS, categoryColors, resolveCategoryColor } from '@/shared/theme/tokens';
import { ActionButton } from '@/shared/ui/ActionButton';
import { CATEGORY_ICON_CHOICES } from '@/shared/ui/AppIcon';
import { Chips } from '@/shared/ui/Chips';
import { Field } from '@/shared/ui/Field';
import { IconPicker } from '@/shared/ui/IconPicker';
import { SwatchPicker } from '@/shared/ui/SwatchPicker';

import { type CategoryDraft, validateCategoryDraft } from '../model/categoryForm';

type Touched = Partial<Record<'name' | 'monthlyLimit', boolean>>;

/**
 * Форма категории: название, (вид — только при создании), цвет, значок и у расхода месячный лимит. Ошибки поля
 * появляются после его правки или нажатия «Сохранить»; «Сохранить» недоступна, пока форма не проходит проверку.
 * База ей не нужна: данные и действия приходят пропсами (`takenNames` — другие активные категории того же вида).
 */
export function CategoryForm({
  initial,
  kindEditable,
  takenNamesByKind,
  submitLabel,
  onSubmit,
  onArchive,
  saving = false,
}: {
  initial: CategoryDraft;
  /** Вид можно выбрать только при создании. */
  kindEditable: boolean;
  /** Названия других активных категорий: по виду, потому что вид можно переключить прямо в форме. */
  takenNamesByKind: Readonly<Record<CategoryInput['kind'], readonly string[]>>;
  submitLabel: string;
  onSubmit: (value: CategoryInput) => void;
  /** Есть только у существующей активной категории. */
  onArchive?: () => void;
  /** Запись идёт: кнопки недоступны, повторное нажатие не создаёт дубль. */
  saving?: boolean;
}) {
  const dark = useColorScheme() === 'dark';
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState<Touched>({});
  const set = <K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'name' || key === 'monthlyLimit') setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const result = validateCategoryDraft(draft, takenNamesByKind[draft.kind]);
  const errors = result.ok ? {} : result.errors;
  const palette = dark ? categoryColors.dark : categoryColors.light;
  const swatches = CATEGORY_COLOR_KEYS.map((key) => ({
    key,
    color: palette[key].strong,
    onColor: dark ? '#12101C' : '#FFFFFF',
  }));
  const accent = palette[resolveCategoryColor(draft.color)].strong;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field
        label="Название"
        value={draft.name}
        onChangeText={(value) => set('name', value)}
        error={touched.name ? errors.name : null}
        maxLength={60}
      />
      {kindEditable && (
        <Chips
          label="Вид"
          options={[
            { value: 'expense', label: 'Расход' },
            { value: 'income', label: 'Доход' },
          ]}
          value={draft.kind}
          onChange={(kind) => set('kind', kind)}
        />
      )}
      <SwatchPicker label="Цвет" swatches={swatches} value={draft.color} onChange={(key) => set('color', key)} />
      <IconPicker
        label="Значок"
        icons={CATEGORY_ICON_CHOICES}
        value={draft.icon}
        onChange={(icon) => set('icon', icon)}
        accent={accent}
      />
      {draft.kind === 'expense' && (
        <Field
          label="Месячный лимит"
          value={draft.monthlyLimit}
          onChangeText={(value) => set('monthlyLimit', value)}
          error={touched.monthlyLimit ? errors.monthlyLimit : null}
          hint="Пусто — без лимита."
          keyboardType="numbers-and-punctuation"
        />
      )}
      <View style={styles.actions}>
        <ActionButton
          label={submitLabel}
          disabled={!result.ok || saving}
          onPress={() => {
            setTouched({ name: true, monthlyLimit: true });
            if (result.ok) onSubmit(result.value);
          }}
        />
        {onArchive && <ActionButton label="Архивировать" variant="danger" disabled={saving} onPress={onArchive} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20 },
  actions: { gap: 12, paddingTop: 4 },
});
