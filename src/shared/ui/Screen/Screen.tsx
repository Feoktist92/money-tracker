import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTokens } from '@/shared/theme/useTokens';

/** Фон ground и отступ под статус-бар. Нижний отступ даёт BottomNav. */
export function Screen({ children }: { children?: ReactNode }) {
  const t = useTokens();
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: t.ground }]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
