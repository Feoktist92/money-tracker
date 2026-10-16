import { ScrollView, StyleSheet } from 'react-native';

import type { Kopecks } from '@/shared/lib/money';
import { layout } from '@/shared/theme/tokens';

import { Coin } from './Coin';

export interface TrayIncome {
  id: string;
  name: string;
  icon: string;
}
export interface TrayAccount extends TrayIncome {
  color: string;
  balance: Kopecks;
}

/** Лоток монет (C-main): горизонтальная лента, сначала монеты дохода, затем счета. Монеты перетаскиваются долгим нажатием. */
export function CoinTray({ income, accounts }: { income: TrayIncome[]; accounts: TrayAccount[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      {income.map((coin) => (
        <Coin key={coin.id} kind="income" id={coin.id} name={coin.name} icon={coin.icon} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 0, minHeight: layout.tray },
  content: { paddingHorizontal: layout.sidePad, paddingVertical: 8, gap: 8, alignItems: 'center' },
});
