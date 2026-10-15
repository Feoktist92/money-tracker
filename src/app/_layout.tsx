import '../../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseGate } from '@/application';
import { fontAssets } from '@/shared/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // Сплэш скрывает DatabaseGate, когда база готова (или показал ошибку).
  if (!fontsLoaded && fontError === null) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <StatusBar style="auto" />
        <DatabaseGate>
          <Stack screenOptions={{ headerShown: false }} />
        </DatabaseGate>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
