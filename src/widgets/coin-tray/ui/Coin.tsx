import { StyleSheet, View } from 'react-native';

import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { type CoinColor } from '@/shared/theme/tokens';
import { useCoinColors, useCoinIconColors, useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

export type CoinProps =
  | { kind: 'income'; name: string; icon: string }
  | { kind: 'account'; name: string; icon: string; color: string; balance: Kopecks };

const isCoinColor = (value: string, palette: Record<CoinColor, string>): value is CoinColor => value in palette;

/** Монета-пилюля лотка: доход — кольцо цвета accent без заливки, счёт — цветной круг со значком и балансом. */
export function Coin(props: CoinProps) {
  const t = useTokens();
  const fills = useCoinColors();
  const icons = useCoinIconColors();
  const income = props.kind === 'income';
  const colorKey: CoinColor = !income && isCoinColor(props.color, fills) ? props.color : 'violet';

  return (
    <View
      accessible
      accessibilityLabel={
        income ? `${props.name}, доход` : `${props.name}, баланс ${formatMoney(props.balance, { kopecks: 'never' })}`
      }
      style={[styles.pill, income ? { borderWidth: 2, borderColor: t.accent } : { backgroundColor: t.surface }]}
    >
      <View
        style={[
          styles.avatar,
          income ? { borderWidth: 2, borderColor: t.accent } : { backgroundColor: fills[colorKey] },
        ]}
      >
        {!income && <View style={styles.innerRing} />}
        <AppIcon name={props.icon} size={income ? 20 : 18} color={income ? t.accent : icons[colorKey]} />
      </View>
      <View>
        <AppText variant="label" weight={600} style={styles.name}>
          {props.name}
        </AppText>
        <AppText variant="caption" color={t.inkSecondary}>
          {income ? 'доход' : formatMoney(props.balance, { kopecks: 'never' })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 28,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  innerRing: {
    position: 'absolute',
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  name: { fontSize: 13, lineHeight: 16 },
});
