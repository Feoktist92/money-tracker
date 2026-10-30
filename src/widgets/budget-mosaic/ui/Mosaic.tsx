import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { layoutMosaic } from '@/shared/lib/mosaic';
import { layout } from '@/shared/theme/tokens';
import { useTokens } from '@/shared/theme/useTokens';
import { ActionButton } from '@/shared/ui/ActionButton';
import { AppText } from '@/shared/ui/AppText';

import { tileWeight } from '../model/weights';
import { Tile } from './Tile';

/** Мозаика бюджета месяца: плитки по категориям; раскладку считает layoutMosaic, область измеряется onLayout. */
export function Mosaic({
  rows,
  carryFrom,
  onTilePress,
  onTileQuickEntry,
  onAddCategory,
}: {
  rows: BudgetRow[];
  carryFrom: string;
  /** Нажатие на плитку категории. */
  onTilePress?: (row: BudgetRow) => void;
  /** Действие TalkBack «Записать расход» на плитке. */
  onTileQuickEntry?: (row: BudgetRow) => void;
  /** Кнопка пустого состояния, когда категорий расхода нет. */
  onAddCategory?: () => void;
}) {
  const t = useTokens();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const { fontScale } = useWindowDimensions();
  // видимая область мозаики: плитки, прокрученные за её край, не принимают бросок монеты
  const viewportRef = useRef<View>(null);

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
    return row ? (
      <Tile
        key={rect.id}
        row={row}
        rect={rect}
        carryFrom={carryFrom}
        fontScale={fontScale}
        clipRef={viewportRef}
        onPress={onTilePress}
        onQuickEntry={onTileQuickEntry}
      />
    ) : null;
  });

  return (
    <View
      ref={viewportRef}
      collapsable={false}
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width <= 0 || height <= 0) return;
        setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
      }}
    >
      {rows.length === 0 && onAddCategory && (
        <View style={styles.empty}>
          <AppText color={t.inkSecondary} style={styles.emptyText}>
            Категорий расходов пока нет
          </AppText>
          <ActionButton label="Добавить категорию" onPress={onAddCategory} />
        </View>
      )}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyText: { textAlign: 'center' },
});
