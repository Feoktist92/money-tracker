import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { layoutMosaic } from '@/shared/lib/mosaic';
import { layout } from '@/shared/theme/tokens';

import { tileWeight } from '../model/weights';
import { Tile } from './Tile';

/** Мозаика бюджета месяца: плитки по категориям; раскладку считает layoutMosaic, область измеряется onLayout. */
export function Mosaic({ rows, carryFrom }: { rows: BudgetRow[]; carryFrom: string }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const { fontScale } = useWindowDimensions();

  const mosaic = useMemo(
    () =>
      size
        ? layoutMosaic(
            rows.map((row) => ({ id: row.categoryId, weight: tileWeight(row) })),
            {
              width: size.width,
              height: size.height,
              gap: layout.gap,
              minTile: layout.minTile,
              sidePad: layout.sidePad,
              verticalPad: layout.gap,
              minColumnShare: layout.minColumnShare,
            },
          )
        : null,
    [rows, size],
  );

  const rowById = useMemo(() => new Map(rows.map((row) => [row.categoryId, row])), [rows]);
  const tiles = mosaic?.tiles.map((rect) => {
    const row = rowById.get(rect.id);
    return row ? <Tile key={rect.id} row={row} rect={rect} carryFrom={carryFrom} fontScale={fontScale} /> : null;
  });

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
      }}
    >
      {mosaic &&
        size &&
        (mosaic.contentHeight > size.height ? (
          <ScrollView>
            <View style={{ height: mosaic.contentHeight }}>{tiles}</View>
          </ScrollView>
        ) : (
          tiles
        ))}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
