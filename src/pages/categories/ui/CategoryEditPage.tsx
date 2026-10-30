import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { goBack } from '../model/goBack';

interface Loaded {
  draft: CategoryDraft;
  takenNamesByKind: Record<CategoryInput['kind'], string[]>;
  archived: boolean;
}

/** Экран формы категории: с параметром id — правка (вид не меняется), с kind — новая категория этого вида. */
export function CategoryEditPage() {
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Запись идёт: ref отсекает второе нажатие в том же такте (state обновится только к следующему рендеру),
  // state отключает кнопки. После успеха защёлка остаётся до закрытия экрана: второе нажатие во время его
  // ухода тоже не должно создать дубль.
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);

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

  const begin = () => {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    return true;
  };
  const release = () => {
    busy.current = false;
    setSaving(false);
  };

  const save = async (value: CategoryInput) => {
    if (!begin()) return;
    try {
      if (id) {
        const { kind: _kind, ...patch } = value;
        await updateCategory(db, id, patch);
      } else {
        await createCategory(db, value);
      }
    } catch {
      release();
      Alert.alert('Не удалось сохранить', 'Попробуйте ещё раз.');
      return;
    }
    goBack();
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
            if (!id || !begin()) return;
            setCategoryArchived(db, id, true).then(goBack, () => {
              release();
              Alert.alert('Не удалось архивировать', 'Попробуйте ещё раз.');
            });
          },
        },
      ],
    );

  return (
    <Screen bottomInset>
      <ScreenHeader title={id ? 'Категория' : 'Новая категория'} onBack={goBack} />
      {loaded && (
        <CategoryForm
          key={id ?? `new-${kind ?? 'expense'}`}
          initial={loaded.draft}
          kindEditable={!id}
          takenNamesByKind={loaded.takenNamesByKind}
          submitLabel={id ? 'Сохранить' : 'Создать'}
          saving={saving}
          onSubmit={save}
          onArchive={id && !loaded.archived ? archive : undefined}
        />
      )}
    </Screen>
  );
}
