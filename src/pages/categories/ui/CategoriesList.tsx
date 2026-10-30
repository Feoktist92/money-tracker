import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Category } from '@/shared/db/types';
import { useCategoryColor, useTokens } from '@/shared/theme/useTokens';
import { ActionButton } from '@/shared/ui/ActionButton';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';
import { Chips } from '@/shared/ui/Chips';
import { ListRow } from '@/shared/ui/ListRow';

import { type CategoryRow, categorySubtitle } from '../model/categoryRows';

function Badge({ icon, color }: { icon: string; color: string }) {
  const palette = useCategoryColor(color);
  return (
    <View style={[styles.badge, { backgroundColor: palette.tile }]}>
      <AppIcon name={icon} size={20} color={palette.strong} />
    </View>
  );
}

function MoveButton({
  label,
  direction,
  disabled,
  onPress,
}: {
  label: string;
  direction: 'up' | 'down';
  disabled: boolean;
  onPress: () => void;
}) {
  const t = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.move, disabled && styles.disabled]}
    >
      <AppIcon name={direction === 'up' ? 'arrow-up' : 'arrow-down'} size={20} color={t.inkSecondary} />
    </Pressable>
  );
}

/**
 * Список категорий с переключателем «Расходы / Доходы»: порядок кнопками «выше / ниже» (порядок плиток и монет дохода),
 * нажатие на строку открывает форму, внизу сворачиваемый «Архив» с кнопкой «Вернуть». Данных экран не знает.
 */
export function CategoriesList({
  active,
  archived,
  onOpen,
  onMove,
  onRestore,
  onAdd,
}: {
  active: readonly CategoryRow[];
  archived: readonly CategoryRow[];
  onOpen: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRestore: (id: string) => void;
  /** Новая категория выбранного сейчас вида. */
  onAdd: (kind: Category['kind']) => void;
}) {
  const t = useTokens();
  const [kind, setKind] = useState<Category['kind']>('expense');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const rows = active.filter((row) => row.kind === kind);
  const archivedRows = archived.filter((row) => row.kind === kind);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Chips
        label="Вид"
        options={[
          { value: 'expense', label: 'Расходы' },
          { value: 'income', label: 'Доходы' },
        ]}
        value={kind}
        onChange={(next) => {
          setKind(next);
          setArchiveOpen(false);
        }}
      />
      {rows.length === 0 && <AppText color={t.inkSecondary}>Категорий пока нет.</AppText>}
      {rows.map((row, index) => (
        <ListRow
          key={row.id}
          leading={<Badge icon={row.icon} color={row.color} />}
          title={row.name}
          subtitle={categorySubtitle(row)}
          accessibilityLabel={`Изменить категорию ${row.name}`}
          onPress={() => onOpen(row.id)}
          trailing={
            <>
              <MoveButton
                label={`Поднять выше: ${row.name}`}
                direction="up"
                disabled={index === 0}
                onPress={() => onMove(row.id, -1)}
              />
              <MoveButton
                label={`Опустить ниже: ${row.name}`}
                direction="down"
                disabled={index === rows.length - 1}
                onPress={() => onMove(row.id, 1)}
              />
            </>
          }
        />
      ))}
      <ActionButton label="Добавить категорию" onPress={() => onAdd(kind)} />
      {archivedRows.length > 0 && (
        <View style={styles.archive}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={archiveOpen ? 'Скрыть архив' : `Показать архив, категорий: ${archivedRows.length}`}
            accessibilityState={{ expanded: archiveOpen }}
            onPress={() => setArchiveOpen((open) => !open)}
            style={styles.archiveHeader}
          >
            <AppText variant="section" color={t.inkSecondary}>
              {`Архив (${archivedRows.length})`}
            </AppText>
          </Pressable>
          {archiveOpen &&
            archivedRows.map((row) => (
              <ListRow
                key={row.id}
                leading={<Badge icon={row.icon} color={row.color} />}
                title={row.name}
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Вернуть из архива: ${row.name}`}
                    onPress={() => onRestore(row.id)}
                    style={styles.restore}
                  >
                    <AppIcon name="archive-restore" size={20} color={t.accent} />
                    <AppText variant="label" color={t.accent}>
                      Вернуть
                    </AppText>
                  </Pressable>
                }
              />
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  move: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  archive: { gap: 8, paddingTop: 16 },
  archiveHeader: { minHeight: 48, justifyContent: 'center' },
  restore: { minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
