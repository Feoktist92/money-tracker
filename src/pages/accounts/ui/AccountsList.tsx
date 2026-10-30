import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { coinColors, coinIconColors } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { ActionButton } from '@/shared/ui/ActionButton';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';
import { ListRow } from '@/shared/ui/ListRow';

import { type AccountRow, accountSubtitle, type ArchivedAccountRow } from '../model/accountRows';

function Badge({ icon, color }: { icon: string; color: string }) {
  const dark = useColorScheme() === 'dark';
  const fills = dark ? coinColors.dark : coinColors.light;
  const onFill = dark ? coinIconColors.dark : coinIconColors.light;
  const key = Object.hasOwn(fills, color) ? (color as keyof typeof fills) : 'violet';
  return (
    <View style={[styles.badge, { backgroundColor: fills[key] }]}>
      <AppIcon name={icon} size={20} color={onFill[key]} />
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
 * Список счетов: порядок кнопками «выше / ниже» (он же порядок монет в лотке), нажатие на строку открывает форму,
 * внизу сворачиваемый «Архив» с кнопкой «Вернуть». Экран данных не знает: всё приходит пропсами.
 */
export function AccountsList({
  accounts,
  archived,
  onOpen,
  onMove,
  onRestore,
  onAdd,
}: {
  accounts: readonly AccountRow[];
  archived: readonly ArchivedAccountRow[];
  onOpen: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRestore: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useTokens();
  const [archiveOpen, setArchiveOpen] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {accounts.length === 0 && (
        <AppText color={t.inkSecondary}>Счетов пока нет. Добавьте первый, чтобы записывать траты.</AppText>
      )}
      {accounts.map((account, index) => (
        <ListRow
          key={account.id}
          leading={<Badge icon={account.icon} color={account.color} />}
          title={account.name}
          subtitle={accountSubtitle(account)}
          accessibilityHint="Изменить счёт"
          onPress={() => onOpen(account.id)}
          trailing={
            <>
              <MoveButton
                label={`Поднять выше: ${account.name}`}
                direction="up"
                disabled={index === 0}
                onPress={() => onMove(account.id, -1)}
              />
              <MoveButton
                label={`Опустить ниже: ${account.name}`}
                direction="down"
                disabled={index === accounts.length - 1}
                onPress={() => onMove(account.id, 1)}
              />
            </>
          }
        />
      ))}
      <ActionButton label="Добавить счёт" onPress={onAdd} />
      {archived.length > 0 && (
        <View style={styles.archive}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={archiveOpen ? 'Скрыть архив' : `Показать архив, счетов: ${archived.length}`}
            accessibilityState={{ expanded: archiveOpen }}
            onPress={() => setArchiveOpen((open) => !open)}
            style={styles.archiveHeader}
          >
            <AppText variant="section" color={t.inkSecondary}>
              {`Архив (${archived.length})`}
            </AppText>
          </Pressable>
          {archiveOpen &&
            archived.map((account) => (
              <ListRow
                key={account.id}
                leading={<Badge icon={account.icon} color={account.color} />}
                title={account.name}
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Вернуть из архива: ${account.name}`}
                    onPress={() => onRestore(account.id)}
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
