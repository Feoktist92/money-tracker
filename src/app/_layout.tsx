import '../../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { softDeleteTransaction } from '@/entities/transaction';
import { UndoSnackbar } from '@/features/amount-entry';
import { DragLayer } from '@/features/coin-drag';
import { db } from '@/shared/db/client';
import { DatabaseGate } from '@/shared/db/DatabaseGate';
import { fontAssets } from '@/shared/theme/fonts';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // Сплэш скрывает DatabaseGate, когда база готова (или показал ошибку).
  if (!fontsLoaded && fontError === null) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <StatusBar style="auto" />
        <DatabaseGate migrations={migrations}>
          <Stack screenOptions={{ headerShown: false }} />
          <DragLayer />
          <UndoSnackbar
            onUndo={(id) =>
              void softDeleteTransaction(db, id).catch(() =>
                Alert.alert('Не удалось отменить запись', 'Попробуйте ещё раз.'),
              )
            }
          />
        </DatabaseGate>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
