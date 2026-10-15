import { ScrollView, StyleSheet, View } from 'react-native';

import type { BudgetOverview, BudgetRow } from '@/entities/budget';
import { formatMoney } from '@/shared/lib/money';
import { monthNameGenitive, periodTitle, shiftPeriod, toDateKey } from '@/shared/lib/period';
import { radii } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { AppText } from '@/shared/ui/AppText';

const rub = (v: number) => formatMoney(v, { kopecks: 'never' });
const num = (v: number) => formatMoney(v, { kopecks: 'never', currency: false });

/** Временная сводка фазы 1: шапка и список категорий. В фазе 2 её заменит мозаика. */
export function BudgetSummary({ overview }: { overview: BudgetOverview }) {
  const t = useTokens();
  const carryFrom = monthNameGenitive(shiftPeriod(overview.period, -1));
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText variant="titleApp">{periodTitle(overview.period, overview.startDay, toDateKey(new Date()))}</AppText>
        <View style={[styles.pill, { backgroundColor: t.tonal }]}>
          <AppText variant="label" color={t.onTonal}>
            Осталось {rub(overview.totalRemaining)}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" color={t.inkSecondary} style={styles.subtitle}>
        {overview.daysLeft} дн. · по {rub(overview.perDay)} в день
      </AppText>
      <ScrollView contentContainerStyle={styles.list}>
        {overview.rows.map((row) => (
          <SummaryRow key={row.categoryId} row={row} carryFrom={carryFrom} />
        ))}
      </ScrollView>
    </View>
  );
}

function SummaryRow({ row, carryFrom }: { row: BudgetRow; carryFrom: string }) {
  const t = useTokens();
  const background = row.state === 'over' ? t.over.tile : row.state === 'near' ? t.near.tile : t.tile;
  const ink = row.state === 'over' ? t.over.text : row.state === 'near' ? t.near.text : t.ink;
  const secondary = row.state === 'normal' ? t.inkSecondary : ink;
  return (
    <View accessible style={[styles.row, { backgroundColor: background }]}>
      <View style={styles.rowTop}>
        <AppText variant="tileName" color={ink}>
          {row.name}
        </AppText>
        <AppText variant="tileAmount" color={ink}>
          {row.hasLimit ? rub(row.remaining) : rub(row.spent)}
        </AppText>
      </View>
      <AppText variant="caption" color={secondary}>
        {row.hasLimit ? `${num(row.spent)} из ${num(row.limit)}` : 'без лимита · потрачено'}
      </AppText>
      {row.carryIn !== 0 && (
        <AppText variant="caption" weight={600} color={row.state === 'normal' ? t.carry : ink}>
          {formatMoney(row.carryIn, { sign: 'always', kopecks: 'never', currency: false })} с {carryFrom}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  pill: { height: 32, borderRadius: 16, paddingHorizontal: 14, justifyContent: 'center' },
  subtitle: { paddingHorizontal: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
  row: { borderRadius: radii.tile, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
