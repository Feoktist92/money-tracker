import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  type AccountInput,
  createAccount,
  getAccount,
  listAccounts,
  setAccountArchived,
  updateAccount,
} from '@/entities/account';
import { AccountForm, type AccountDraft, EMPTY_ACCOUNT } from '@/features/edit-account';
import { db } from '@/shared/db/client';
import { formatMoney } from '@/shared/lib/money';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

interface Loaded {
  draft: AccountDraft;
  takenNames: string[];
  archived: boolean;
}

/** Экран формы счёта: без параметра id — новый счёт, с id — правка (в том числе архивного). */
export function AccountEditPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [account, active] = await Promise.all([id ? getAccount(db, id) : null, listAccounts(db)]);
      if (cancelled) return;
      const takenNames = active.filter((a) => a.id !== id).map((a) => a.name);
      setLoaded({
        takenNames,
        archived: account?.archived ?? false,
        draft: account
          ? {
              name: account.name,
              type: account.type,
              icon: account.icon,
              color: account.color,
              initialBalance:
                account.initialBalance === 0 ? '' : formatMoney(account.initialBalance, { currency: false }),
            }
          : EMPTY_ACCOUNT,
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async (value: AccountInput) => {
    try {
      if (id) await updateAccount(db, id, value);
      else await createAccount(db, value);
      router.back();
    } catch {
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.');
    }
  };

  const archive = () =>
    Alert.alert('Архивировать счёт?', 'Монета пропадёт из лотка, операции останутся. Счёт можно вернуть из архива.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Архивировать',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          setAccountArchived(db, id, true).then(
            () => router.back(),
            () => Alert.alert('Не удалось архивировать', 'Попробуйте ещё раз.'),
          );
        },
      },
    ]);

  return (
    <Screen>
      <ScreenHeader title={id ? 'Счёт' : 'Новый счёт'} onBack={() => router.back()} />
      {loaded && (
        <AccountForm
          key={id ?? 'new'}
          initial={loaded.draft}
          takenNames={loaded.takenNames}
          submitLabel={id ? 'Сохранить' : 'Создать'}
          onSubmit={save}
          onArchive={id && !loaded.archived ? archive : undefined}
        />
      )}
    </Screen>
  );
}
