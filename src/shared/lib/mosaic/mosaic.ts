/**
 * Раскладка мозаики плиток (DESIGN.md, «Раскладка мозаики»). Чистая функция без UI.
 *
 * Плитки идут в порядке списка и делятся на две колонки подряд: граница ставится там, где
 * сумма весов левой колонки ближе всего к половине. Так порядок категорий пользователя сохраняется,
 * а раскладка зависит только от весов (лимитов и переноса), а не от каждой траты.
 * Ширина колонки пропорциональна сумме её весов (но не уже minColumnShare области), высота плитки —
 * весу внутри колонки. Плитка не ниже minTile: нехватку забирают у самых больших плиток колонки.
 * Если плитки не помещаются, высота контента больше области — её нужно прокручивать.
 */
export interface MosaicItem {
  id: string;
  /** Вес плитки: обычно max(доступно, потрачено). Не отрицательный. */
  weight: number;
}

export interface MosaicOptions {
  width: number;
  height: number;
  gap: number;
  minTile: number;
  /** Отступ слева и справа. */
  sidePad: number;
  /** Отступ сверху и снизу. */
  verticalPad: number;
  /** Минимальная доля области на колонку, 0–0.5. */
  minColumnShare: number;
}

export interface MosaicTile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  column: 0 | 1;
}

export interface MosaicLayout {
  tiles: MosaicTile[];
  /** Высота содержимого; больше options.height, если нужна прокрутка. */
  contentHeight: number;
}

/** Вес не меньше 1% от суммы весов; если все веса нулевые — поровну. */
function effectiveWeights(items: readonly MosaicItem[]): number[] {
  const raw = items.map((item) => (Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 0));
  const sum = raw.reduce((a, b) => a + b, 0);
  if (sum === 0) return raw.map(() => 1);
  const floor = sum * 0.01;
  return raw.map((w) => Math.max(w, floor));
}

/** Сколько плиток слева: сумма весов слева ближе всего к половине (при равенстве — меньше плиток слева). */
function splitIndex(weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let best = 1;
  let bestDiff = Infinity;
  let left = 0;
  for (let i = 1; i < weights.length; i += 1) {
    left += weights[i - 1]!;
    const diff = Math.abs(2 * left - total);
    if (diff < bestDiff - 1e-9) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

/** Делит total между долями пропорционально весам; целые числа, сумма ровно total (метод наибольших остатков). */
function apportion(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (total * w) / sum);
  const floors = exact.map(Math.floor);
  let rest = total - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const { index } of order) {
    if (rest <= 0) break;
    floors[index]! += 1;
    rest -= 1;
  }
  return floors;
}

/** Высоты плиток колонки: не ниже minTile, нехватка берётся у больших плиток пропорционально их высоте. */
function columnHeights(
  weights: readonly number[],
  available: number,
  minTile: number,
): { heights: number[]; scrolls: boolean } {
  const count = weights.length;
  if (count * minTile > available) {
    return { heights: weights.map(() => minTile), scrolls: true };
  }
  const heights = apportion(available, weights);
  for (let guard = 0; guard < count; guard += 1) {
    const small = heights.map((h) => h < minTile);
    if (!small.some(Boolean)) break;
    let deficit = 0;
    heights.forEach((h, i) => {
      if (small[i]) {
        deficit += minTile - h;
        heights[i] = minTile;
      }
    });
    const bigIndexes = heights.map((_, i) => i).filter((i) => !small[i]);
    const bigTotal = bigIndexes.reduce((acc, i) => acc + (heights[i]! - minTile), 0);
    if (bigTotal <= 0) break;
    const takes = apportion(
      deficit,
      bigIndexes.map((i) => heights[i]! - minTile),
    );
    bigIndexes.forEach((i, k) => {
      heights[i]! -= takes[k]!;
    });
  }
  return { heights, scrolls: false };
}

export function layoutMosaic(items: readonly MosaicItem[], options: MosaicOptions): MosaicLayout {
  const { width, height, gap, minTile, sidePad, verticalPad, minColumnShare } = options;
  if (items.length === 0) return { tiles: [], contentHeight: height };

  const weights = effectiveWeights(items);
  const innerWidth = width - 2 * sidePad;
  const tiles: MosaicTile[] = [];
  let contentHeight = height;

  const columns: { from: number; to: number }[] =
    items.length === 1
      ? [{ from: 0, to: 1 }]
      : [
          { from: 0, to: splitIndex(weights) },
          { from: splitIndex(weights), to: items.length },
        ];

  let widths: number[];
  if (columns.length === 1) {
    widths = [innerWidth];
  } else {
    const usable = innerWidth - gap;
    const total = weights.reduce((a, b) => a + b, 0);
    const leftSum = weights.slice(columns[0]!.from, columns[0]!.to).reduce((a, b) => a + b, 0);
    const minWidth = Math.round(usable * minColumnShare);
    const left = Math.min(Math.max(Math.round((usable * leftSum) / total), minWidth), usable - minWidth);
    widths = [left, usable - left];
  }

  let x = sidePad;
  columns.forEach((range, columnIndex) => {
    const columnItems = items.slice(range.from, range.to);
    const columnWeights = weights.slice(range.from, range.to);
    const available = height - 2 * verticalPad - gap * (columnItems.length - 1);
    const { heights, scrolls } = columnHeights(columnWeights, available, minTile);
    let y = verticalPad;
    columnItems.forEach((item, i) => {
      tiles.push({ id: item.id, x, y, width: widths[columnIndex]!, height: heights[i]!, column: columnIndex as 0 | 1 });
      y += heights[i]! + gap;
    });
    if (scrolls) contentHeight = Math.max(contentHeight, y - gap + verticalPad);
    x += widths[columnIndex]! + gap;
  });

  const order = new Map(items.map((item, index) => [item.id, index]));
  tiles.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return { tiles, contentHeight };
}
