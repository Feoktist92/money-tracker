import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { BudgetSummary, useBudgetOverview } from '@/widgets/budget-summary';

export function BudgetPage() {
  const { overview, error } = useBudgetOverview();
  return (
    <Screen>
      {error && (
        <View style={styles.message}>
          <AppText>Не удалось посчитать бюджет: {error.message}</AppText>
        </View>
      )}
      {overview && <BudgetSummary overview={overview} />}
    </Screen>
  );
}

const styles = StyleSheet.create({ message: { padding: 20 } });
