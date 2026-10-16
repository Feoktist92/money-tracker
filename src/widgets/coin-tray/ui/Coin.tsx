import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { type DragSource, type DropTargetInfo, useCoinDrag } from '@/features/coin-drag';

import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { type CoinColor } from '@/shared/theme/tokens';
import { useCoinColors, useCoinIconColors, useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

export type CoinProps =
  | { kind: 'income'; id: string; name: string; icon: string }
  | { kind: 'account'; id: string; name: string; icon: string; color: string; balance: Kopecks };

const isCoinColor = (value: string, palette: Record<CoinColor, string>): value is CoinColor =>
  Object.hasOwn(palette, value);

/** Монета-пилюля лотка: доход — кольцо цвета accent без заливки, счёт — цветной круг со значком и балансом. */
export function Coin(props: CoinProps) {
  const t = useTokens();
  const fills = useCoinColors();
  const icons = useCoinIconColors();
  const income = props.kind === 'income';
  const colorKey: CoinColor = !income && isCoinColor(props.color, fills) ? props.color : 'violet';

  const source: DragSource = income
    ? { kind: 'income', id: props.id, name: props.name, icon: props.icon }
    : { kind: 'account', id: props.id, name: props.name, icon: props.icon, color: props.color };
  const asTarget: DropTargetInfo | null = income ? null : { kind: 'account', id: props.id, name: props.name };
  const { ref, gesture, visual } = useCoinDrag(source, asTarget);

  const pillStyle =
    visual === 'source'
      ? { borderWidth: 2, borderStyle: 'dashed' as const, borderColor: t.divider }
      : visual === 'hover'
        ? { borderWidth: 3, borderColor: t.dropTarget.border, backgroundColor: t.dropTarget.tile }
        : income
          ? { borderWidth: 2, borderColor: t.accent }
          : { backgroundColor: t.surface };

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={ref}
        collapsable={false}
        accessible
        accessibilityLabel={
          income ? `${props.name}, доход` : `${props.name}, баланс ${formatMoney(props.balance, { kopecks: 'never' })}`
        }
        style={[styles.pill, pillStyle, visual === 'dimmed' && styles.dimmed]}
      >
        <View
          style={[
            styles.avatar,
            visual === 'source' && styles.hidden,
            income ? { borderWidth: 2, borderColor: t.accent } : { backgroundColor: fills[colorKey] },
          ]}
        >
          {!income && <View style={styles.innerRing} />}
          <AppIcon name={props.icon} size={income ? 20 : 18} color={income ? t.accent : icons[colorKey]} />
        </View>
        <View style={[styles.text, visual === 'source' && styles.hidden]}>
          <AppText variant="label" weight={600} numberOfLines={1} style={styles.name}>
            {props.name}
          </AppText>
          <AppText variant="caption" color={t.inkSecondary}>
            {income ? 'доход' : formatMoney(props.balance, { kopecks: 'never' })}
          </AppText>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 56,
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
  text: { maxWidth: 140 },
  dimmed: { opacity: 0.35 },
  hidden: { opacity: 0 },
  name: { fontSize: 13, lineHeight: 16 },
});
