import { type Href, router } from 'expo-router';

import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

import { goBack } from '../model/goBack';
import { useCategoriesScreen } from '../model/useCategoriesScreen';
import { CategoriesList } from './CategoriesList';

/** Экран «Категории»: расходы и доходы, порядок и архив; «Добавить категорию» и строки открывают форму. */
export function CategoriesPage() {
  const { data, move, restore } = useCategoriesScreen();
  return (
    <Screen bottomInset>
      <ScreenHeader title="Категории" onBack={goBack} />
      {data && (
        <CategoriesList
          active={data.active}
          archived={data.archived}
          onOpen={(id) => router.push(`/categories/edit?id=${encodeURIComponent(id)}` as Href)}
          onMove={move}
          onRestore={restore}
          onAdd={(kind) => router.push(`/categories/edit?kind=${kind}` as Href)}
        />
      )}
    </Screen>
  );
}
