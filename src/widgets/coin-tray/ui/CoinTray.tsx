import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Kopecks } from '@/shared/lib/money';
import { layout } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

import { Coin } from './Coin';

export interface TrayIncome {
  id: string;
  name: string;
  icon: string;
  /** Ключ цвета категории дохода. */
  color: string;
}
export interface TrayAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  balance: Kopecks;
}

/**
 * Лоток монет (C-main): горизонтальная лента, сначала монеты дохода, затем счета, в конце монета-плюс «Счёт».
 * Монеты перетаскиваются долгим нажатием. Если счетов нет, вместо них подсказка.
 */
export function CoinTray({
  income,
  accounts,
  onAddAccount,
}: {
  income: TrayIncome[];
  accounts: TrayAccount[];
  /** Нажатие на монету-плюс: открыть форму нового счёта. */
  onAddAccount?: () => void;
}) {
  const t = useTokens();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      {income.map((coin) => (
        <Coin key={coin.id} kind="income" id={coin.id} name={coin.name} icon={coin.icon} color={coin.color} />
      ))}
      {accounts.map((coin) => (
        <Coin
          key={coin.id}
          kind="account"
          id={coin.id}
          name={coin.name}
          icon={coin.icon}
          color={coin.color}
          balance={coin.balance}
        />
      ))}
      {accounts.length === 0 && (
        <View style={styles.hint}>
          <AppText color={t.inkSecondary}>Добавьте счёт, чтобы записывать траты</AppText>
        </View>
      )}
      {onAddAccount && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить счёт"
          onPress={onAddAccount}
          style={[styles.add, { borderColor: t.divider }]}
        >
          <AppIcon name="plus" size={20} color={t.inkSecondary} />
          <AppText variant="label" color={t.inkSecondary}>
            Счёт
          </AppText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 0, minHeight: layout.tray },
  content: { paddingHorizontal: layout.sidePad, paddingVertical: 8, gap: 8, alignItems: 'center' },
  hint: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 8 },
  add: {
    minHeight: 56,
    minWidth: 72,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
