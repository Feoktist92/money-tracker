import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/shared/theme/useTokens';

const TOP: Edge[] = ['top'];
const TOP_AND_BOTTOM: Edge[] = ['top', 'bottom'];

/**
 * Фон ground и отступ под статус-бар. Нижний отступ у вкладок даёт BottomNav; у экранов вне вкладок
 * (формы, списки счетов и категорий) нужен `bottomInset`: иначе нижние кнопки уходят под панель навигации.
 */
export function Screen({ children, bottomInset = false }: { children?: ReactNode; bottomInset?: boolean }) {
  const t = useTokens();
  return (
    <SafeAreaView edges={bottomInset ? TOP_AND_BOTTOM : TOP} style={[styles.root, { backgroundColor: t.ground }]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
