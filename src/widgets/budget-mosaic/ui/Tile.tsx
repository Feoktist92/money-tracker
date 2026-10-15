import { StyleSheet, View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { formatMoney } from '@/shared/lib/money';
import { radii } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

import { planTileText } from '../model/tilePlan';
import { tileLabel } from '../model/tileLabel';

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const rub = (v: number) => formatMoney(v, { kopecks: 'never' });
const plain = (v: number) => formatMoney(v, { kopecks: 'never', currency: false });

/** Плитка категории (DESIGN.md, C-main): площадь задаёт раскладка, заливка снизу — доля потраченного. */
export function Tile({
  row,
  rect,
  carryFrom,
  fontScale,
}: {
  row: BudgetRow;
  rect: TileRect;
  carryFrom: string;
  /** Масштаб системного шрифта: от него зависит, сколько строк поместится в плитку. */
  fontScale: number;
}) {
  const t = useTokens();
  const plan = planTileText({ width: rect.width, height: rect.height, fontScale, hasCarry: row.carryIn !== 0 });

  const palette =
    row.state === 'over'
      ? { background: t.over.tile, fill: null, ink: t.over.text, secondary: t.over.text, carry: t.over.text }
      : row.state === 'near'
        ? { background: t.near.tile, fill: t.near.fill, ink: t.near.text, secondary: t.near.text, carry: t.near.text }
        : { background: t.tile, fill: t.fill, ink: t.ink, secondary: t.inkSecondary, carry: t.carry };

  const fillPercent =
    palette.fill && row.hasLimit && row.available > 0 ? Math.min(100, (row.spent / row.available) * 100) : 0;
  const amount = rub(row.hasLimit ? row.remaining : row.spent);
  const caption = row.hasLimit ? `${plain(row.spent)} из ${plain(row.limit)}` : 'без лимита';

  return (
    <View
      accessible
      accessibilityLabel={tileLabel(row)}
      style={[
        styles.tile,
        { left: rect.x, top: rect.y, width: rect.width, height: rect.height, backgroundColor: palette.background },
      ]}
    >
      {fillPercent > 0 && (
        <View style={[styles.fill, { height: `${fillPercent}%`, backgroundColor: palette.fill ?? undefined }]} />
      )}
      {plan.mode === 'row' ? (
        <View style={[styles.rowMode, { paddingHorizontal: plan.padHorizontal }]}>
          <View style={styles.nameRow}>
            <AppIcon name={row.icon} size={16} color={palette.ink} />
            <AppText variant="tileName" color={palette.ink} numberOfLines={1} style={styles.shrink}>
              {row.name}
            </AppText>
          </View>
          <AppText variant="tileAmount" color={palette.ink} numberOfLines={1} style={{ fontSize: 15, lineHeight: 19 }}>
            {amount}
          </AppText>
        </View>
      ) : (
        <View style={{ paddingVertical: plan.padVertical, paddingHorizontal: plan.padHorizontal, gap: 2 }}>
          <View style={styles.nameRow}>
            <AppIcon name={row.icon} size={18} color={palette.ink} />
            <AppText variant="tileName" color={palette.ink} numberOfLines={1} style={styles.shrink}>
              {row.name}
            </AppText>
          </View>
          <AppText
            variant="tileAmount"
            color={palette.ink}
            numberOfLines={1}
            style={{
              fontSize: plan.amountSize,
              lineHeight: Math.ceil(plan.amountSize * 1.25),
              letterSpacing: -0.02 * plan.amountSize,
              marginTop: plan.amountSize >= 30 ? 6 : plan.amountSize >= 24 ? 4 : 2,
            }}
          >
            {amount}
          </AppText>
          {plan.showCaption && (
            <AppText variant="caption" color={palette.secondary} numberOfLines={1}>
              {caption}
            </AppText>
          )}
          {plan.showCarry && (
            <View style={styles.carryRow}>
              <AppIcon name="arrow-down-right" size={12} color={palette.carry} strokeWidth={2} />
              <AppText variant="caption" weight={600} color={palette.carry} numberOfLines={1}>
                {formatMoney(row.carryIn, { sign: 'always', kopecks: 'never', currency: false })} с {carryFrom}
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { position: 'absolute', borderRadius: radii.tile, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shrink: { flexShrink: 1 },
  carryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMode: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
