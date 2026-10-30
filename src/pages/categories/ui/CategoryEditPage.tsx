import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  type CategoryInput,
  createCategory,
  getCategory,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from '@/entities/category';
import { type CategoryDraft, CategoryForm, emptyCategory } from '@/features/edit-category';
import { db } from '@/shared/db/client';
import { formatMoney } from '@/shared/lib/money';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

interface Loaded {
  draft: CategoryDraft;
  takenNamesByKind: Record<CategoryInput['kind'], string[]>;
  archived: boolean;
}

/** Экран формы категории: с параметром id — правка (вид не меняется), с kind — новая категория этого вида. */
export function CategoryEditPage() {
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [category, expense, income] = await Promise.all([
        id ? getCategory(db, id) : null,
        listCategories(db, 'expense'),
        listCategories(db, 'income'),
      ]);
      if (cancelled) return;
      const others = (rows: { id: string; name: string }[]) => rows.filter((r) => r.id !== id).map((r) => r.name);
      setLoaded({
        takenNamesByKind: { expense: others(expense), income: others(income) },
        archived: category?.archived ?? false,
        draft: category
          ? {
              name: category.name,
              kind: category.kind,
              icon: category.icon,
              color: category.color,
              monthlyLimit:
                category.monthlyLimit === null ? '' : formatMoney(category.monthlyLimit, { currency: false }),
            }
          : emptyCategory(kind === 'income' ? 'income' : 'expense'),
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id, kind]);

  const save = async (value: CategoryInput) => {
    try {
      if (id) {
        const { kind: _kind, ...patch } = value;
        await updateCategory(db, id, patch);
      } else {
        await createCategory(db, value);
      }
      router.back();
    } catch {
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.');
    }
  };

  const archive = () =>
    Alert.alert(
      'Архивировать категорию?',
      'Плитка пропадёт с главного экрана, операции останутся. Категорию можно вернуть из архива.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Архивировать',
          style: 'destructive',
          onPress: () => {
            if (!id) return;
            setCategoryArchived(db, id, true).then(
              () => router.back(),
              () => Alert.alert('Не удалось архивировать', 'Попробуйте ещё раз.'),
            );
          },
        },
      ],
    );

  return (
    <Screen>
      <ScreenHeader title={id ? 'Категория' : 'Новая категория'} onBack={() => router.back()} />
      {loaded && (
        <CategoryForm
          key={id ?? `new-${kind ?? 'expense'}`}
          initial={loaded.draft}
          kindEditable={!id}
          takenNamesByKind={loaded.takenNamesByKind}
          submitLabel={id ? 'Сохранить' : 'Создать'}
          onSubmit={save}
          onArchive={id && !loaded.archived ? archive : undefined}
        />
      )}
    </Screen>
  );
}
