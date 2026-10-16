import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { projectExpense } from '@/entities/budget';
import { AmountSheet } from '@/features/amount-entry';
import { BudgetHeader } from '@/widgets/budget-header';
import { Mosaic, TilePreview } from '@/widgets/budget-mosaic';
import { CoinTray } from '@/widgets/coin-tray';
import { monthNameGenitive, periodTitle, shiftPeriod } from '@/shared/lib/period';
import { NEAR_THRESHOLD } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';

import { budgetSummary } from '../model/budgetSummary';
import { useBudgetPage } from '../model/useBudgetPage';
import { useEntryFlow } from '../model/useEntryFlow';

/** Главный экран (макет C-main): шапка, мозаика категорий, лоток монет, шторка ввода суммы. Нижнюю навигацию рисует layout вкладок. */
export function BudgetPage() {
  const { data, error } = useBudgetPage();
  const flow = useEntryFlow(data);
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);
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
  const carryFrom = monthNameGenitive(shiftPeriod(overview.period, -1));
  const { previewRow } = flow;
  return (
    <Screen>
      <BudgetHeader
        title={periodTitle(overview.period, overview.startDay, today)}
        remaining={overview.totalRemaining}
        summary={summary}
        notificationCount={0}
      />
      <Mosaic rows={overview.rows} carryFrom={carryFrom} onTilePress={flow.openForTile} />
      <CoinTray income={data.income} accounts={data.accounts} />
      <AmountSheet
        info={flow.info}
        recent={flow.recent}
        onRecord={flow.record}
        preview={
          previewRow
            ? (amount) => (
                <TilePreview
                  before={previewRow}
                  after={amount === null ? previewRow : projectExpense(previewRow, amount, NEAR_THRESHOLD)}
                  carryFrom={carryFrom}
                />
              )
            : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ message: { padding: 20 } });
