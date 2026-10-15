import { Tabs } from 'expo-router/js-tabs';

import { useTokens } from '@/shared/theme/useTokens';
import { BottomNav } from '@/widgets/bottom-nav';

export default function TabsLayout() {
  const t = useTokens();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.ground } }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Бюджет' }} />
      <Tabs.Screen name="history" options={{ title: 'Операции' }} />
      <Tabs.Screen name="reports" options={{ title: 'Отчёты' }} />
      <Tabs.Screen name="more" options={{ title: 'Ещё' }} />
    </Tabs>
  );
}
