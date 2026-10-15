import { Pressable, StyleSheet, View } from 'react-native';

import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { layout } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

export interface BudgetHeaderProps {
  /** «Октябрь» или «10 окт – 9 ноя». */
  title: string;
  remaining: Kopecks;
  /** Подпись для TalkBack: сколько дней осталось и сколько можно тратить в день. */
  summary: string;
  /** Число новых операций из уведомлений; 0 — бейдж скрыт. */
  notificationCount: number;
  onPeriodPress?: () => void;
  onNotificationsPress?: () => void;
}

/** Шапка главного экрана (C-main): период, пилюля «Осталось …», колокольчик «Из уведомлений» с бейджем. */
export function BudgetHeader({
  title,
  remaining,
  summary,
  notificationCount,
  onPeriodPress,
  onNotificationsPress,
}: BudgetHeaderProps) {
  const t = useTokens();
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Выбрать период: ${title}`}
        accessibilityState={{ disabled: !onPeriodPress }}
        onPress={onPeriodPress}
        style={styles.period}
      >
        <AppText
          variant="titleApp"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{ letterSpacing: -0.22 }}
        >
          {title}
        </AppText>
        <AppIcon name="chevron-down" size={20} color={t.inkSecondary} strokeWidth={2} />
      </Pressable>
      <View style={styles.right}>
        <View
          accessible
          accessibilityLabel={`Осталось ${formatMoney(remaining, { kopecks: 'never' })}. ${summary}`}
          style={[styles.pill, { backgroundColor: t.tonal }]}
        >
          <AppText variant="label" color={t.onTonal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            Осталось {formatMoney(remaining, { kopecks: 'never' })}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={notificationCount > 0 ? `Из уведомлений, новых: ${notificationCount}` : 'Из уведомлений'}
          accessibilityState={{ disabled: !onNotificationsPress }}
          onPress={onNotificationsPress}
          style={styles.bell}
        >
          <AppIcon name="bell" size={24} color={t.ink} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: t.accent }]}>
              <AppText variant="caption" weight={700} color={t.onAccent} style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 4,
  },
  period: { minHeight: layout.touch, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1, minWidth: 0 },
  pill: {
    minHeight: 32,
    flexShrink: 1,
    minWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  bell: { width: layout.touch, height: layout.touch, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, lineHeight: 14 },
});
