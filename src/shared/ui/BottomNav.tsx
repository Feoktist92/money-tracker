import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { ChartNoAxesColumn, Ellipsis, LayoutPanelLeft, List, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';

import { AppText } from './AppText';

/** Иконки и подписи — как в макете C-main. Ключ — имя файла маршрута в src/app/(tabs). */
export const NAV_ITEMS: Readonly<Record<string, { label: string; Icon: LucideIcon }>> = {
  index: { label: 'Бюджет', Icon: LayoutPanelLeft },
  history: { label: 'Операции', Icon: List },
  reports: { label: 'Отчёты', Icon: ChartNoAxesColumn },
  more: { label: 'Ещё', Icon: Ellipsis },
};

/** Нижняя навигация Material 3: 80 dp, активный пункт — пилюля 64×32 цвета tonal. */
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: t.nav, height: layout.nav + insets.bottom, paddingBottom: insets.bottom }]}
    >
      {state.routes.map((route, index) => {
        const item = NAV_ITEMS[route.name];
        if (!item) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.indicator, focused && { backgroundColor: t.tonal }]}>
              <item.Icon size={24} strokeWidth={1.8} color={focused ? t.accent : t.inkSecondary} />
            </View>
            <AppText variant="caption" weight={focused ? 600 : 500} color={focused ? t.ink : t.inkSecondary}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { flex: 1, minHeight: layout.touch, alignItems: 'center', paddingTop: 12, gap: 4 },
  indicator: {
    width: layout.navIndicator.width,
    height: layout.navIndicator.height,
    borderRadius: layout.navIndicator.height / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
