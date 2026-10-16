import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useDragStore } from '@/features/coin-drag';

import { BudgetHeader } from '@/widgets/budget-header';
import { Mosaic } from '@/widgets/budget-mosaic';
import { CoinTray } from '@/widgets/coin-tray';
import { monthNameGenitive, periodTitle, shiftPeriod } from '@/shared/lib/period';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import { budgetSummary } from '../model/budgetSummary';
import { describeDrop } from '../model/dropNotice';
import { useBudgetPage } from '../model/useBudgetPage';

/** Главный экран (макет C-main): шапка, мозаика категорий, лоток монет. Нижнюю навигацию рисует layout вкладок. */
export function BudgetPage() {
  const { data, error } = useBudgetPage();
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);
  // Монета брошена на цель. Шторка суммы (фаза 2c) заменит это временное уведомление.
  const dropped = useDragStore((state) => state.dropped);
  useEffect(() => {
    if (!dropped) return;
    const { title, body } = describeDrop(dropped);
    useDragStore.getState().clearDrop();
    Alert.alert(title, body);
  }, [dropped]);
  if (!data) {
    if (!error) return <Screen />;
    return (
      <Screen>
        <View style={styles.message}>
          <AppText>Не удалось посчитать бюджет. Закройте приложение и откройте снова.</AppText>
        </View>
      </Screen>
    );
  }

  const { overview, today } = data;
  const summary = budgetSummary(overview);
  return (
    <Screen>
      <BudgetHeader
        title={periodTitle(overview.period, overview.startDay, today)}
        remaining={overview.totalRemaining}
        summary={summary}
        notificationCount={0}
      />
      <Mosaic rows={overview.rows} carryFrom={monthNameGenitive(shiftPeriod(overview.period, -1))} />
      <CoinTray income={data.income} accounts={data.accounts} />
    </Screen>
  );
}

const styles = StyleSheet.create({ message: { padding: 20 } });
