import { type Href, router } from 'expo-router';

import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

import { useAccountsScreen } from '../model/useAccountsScreen';
import { AccountsList } from './AccountsList';

// Маршруты приводятся к Href: типы маршрутов Expo Router (.expo/types) генерирует только запущенный dev-сервер,
// и без него tsc и хук pre-commit не знали бы про новые экраны.
/** Экран «Счета»: список с порядком и архивом; «Добавить счёт» и строки открывают форму. */
export function AccountsPage() {
  const { data, move, restore } = useAccountsScreen();
  return (
    <Screen bottomInset>
      <ScreenHeader title="Счета" onBack={() => router.back()} />
      {data && (
        <AccountsList
          accounts={data.accounts}
          archived={data.archived}
          onOpen={(id) => router.push(`/accounts/edit?id=${encodeURIComponent(id)}` as Href)}
          onMove={move}
          onRestore={restore}
          onAdd={() => router.push('/accounts/edit' as Href)}
        />
      )}
    </Screen>
  );
}
