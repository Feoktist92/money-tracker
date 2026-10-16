import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { useTokens } from '@/shared/theme/useTokens';

import { previewStrip } from '../model/previewStrip';
import { Tile } from './Tile';

const HEIGHT = 120;

/**
 * Плитка категории над шторкой суммы («поднята»): показывает остаток после записи, под ней полоска 8 dp «было / прибавка»
 * (DESIGN.md). `before` — строка бюджета до записи, `after` — с вводимой суммой (entities/budget projectExpense).
 */
export function TilePreview({ before, after, carryFrom }: { before: BudgetRow; after: BudgetRow; carryFrom: string }) {
  const t = useTokens();
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const strip = previewStrip(before, after);

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.tileBox}>
        {width > 0 && (
          <Tile
            row={after}
            rect={{ x: 0, y: 0, width, height: HEIGHT }}
            carryFrom={carryFrom}
            fontScale={fontScale}
            raised
          />
        )}
      </View>
      {strip && (
        <View style={[styles.track, { backgroundColor: t.divider }]}>
          <View style={[styles.was, { width: `${strip.was}%`, backgroundColor: t.fill }]} />
          <View style={[styles.added, { width: `${strip.added}%`, backgroundColor: t.accent }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tileBox: { height: HEIGHT },
  track: { height: 8, borderRadius: 4, marginTop: 6, flexDirection: 'row', overflow: 'hidden' },
  was: { height: 8 },
  added: { height: 8 },
});
