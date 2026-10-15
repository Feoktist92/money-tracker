import { router } from 'expo-router';
import { Button } from 'heroui-native';
import { useState } from 'react';
import { Alert } from 'react-native';

import { db } from '@/shared/db/client';
import { seedDemo } from '@/shared/db/seed';
import { toDateKey } from '@/shared/lib/period';
import { useTokens } from '@/shared/theme/useTokens';
import { AppText } from '@/shared/ui/AppText';
import { PlaceholderScreen } from '@/shared/ui/PlaceholderScreen';

export function MorePage() {
  const t = useTokens();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDemo = async () => {
    setBusy(true);
    setStatus('Загружаю…');
    try {
      await seedDemo(db, toDateKey(new Date()));
      setStatus(null);
      router.navigate('/');
    } catch (e) {
      setStatus(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const confirmDemo = () =>
    Alert.alert(
      'Загрузить демо-данные?',
      'Все операции будут удалены, лимиты и перенос — заменены данными из макета.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Загрузить', style: 'destructive', onPress: loadDemo },
      ],
    );

  return (
    <PlaceholderScreen title="Ещё" hint="Счета, категории и настройки появятся в следующих фазах.">
      {__DEV__ && (
        <>
          <Button variant="secondary" isDisabled={busy} onPress={confirmDemo}>
            <Button.Label>Загрузить демо-данные</Button.Label>
          </Button>
          <AppText variant="caption" color={t.inkSecondary}>
            {status ?? 'Стирает операции и заполняет месяц данными из макета.'}
          </AppText>
        </>
      )}
    </PlaceholderScreen>
  );
}
