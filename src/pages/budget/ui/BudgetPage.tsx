import { StyleSheet, View } from 'react-native';

import { BudgetHeader } from '@/widgets/budget-header';
import { Mosaic } from '@/widgets/budget-mosaic';
import { CoinTray } from '@/widgets/coin-tray';
import { formatMoney } from '@/shared/lib/money';
import { monthNameGenitive, periodTitle, shiftPeriod } from '@/shared/lib/period';
import { pluralRu } from '@/shared/lib/plural';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import { useBudgetPage } from '../model/useBudgetPage';

const DAYS = ['день', 'дня', 'дней'] as const;

/** Главный экран (макет C-main): шапка, мозаика категорий, лоток монет. Нижнюю навигацию рисует layout вкладок. */
export function BudgetPage() {
  const { data, error } = useBudgetPage();
  if (error) {
    return (
      <Screen>
        <View style={styles.message}>
          <AppText>Не удалось посчитать бюджет: {error.message}</AppText>
        </View>
      </Screen>
    );
  }
  if (!data) return <Screen />;

  const { overview, today } = data;
  const summary = `${overview.daysLeft} ${pluralRu(overview.daysLeft, DAYS)} до конца периода, по ${formatMoney(overview.perDay, { kopecks: 'never' })} в день`;
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
