import { Tabs } from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Бюджет' }} />
      <Tabs.Screen name="history" options={{ title: 'Операции' }} />
      <Tabs.Screen name="reports" options={{ title: 'Отчёты' }} />
      <Tabs.Screen name="more" options={{ title: 'Ещё' }} />
    </Tabs>
  );
}
